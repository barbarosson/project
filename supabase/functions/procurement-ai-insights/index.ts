import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AIInsight {
  type: 'price_risk' | 'lead_time_warning' | 'stock_out' | 'supplier_performance';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  action?: string;
  related_id?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const tenant_id = user.app_metadata?.tenant_id;
    if (!tenant_id) {
      throw new Error("No tenant_id found");
    }

    const insights: AIInsight[] = [];

    const priceAlerts = await checkPriceWatchdog(supabase, tenant_id);
    insights.push(...priceAlerts);

    const leadTimeAlerts = await checkLeadTimeWarnings(supabase, tenant_id);
    insights.push(...leadTimeAlerts);

    const stockOutAlerts = await checkStockOutPrevention(supabase, tenant_id);
    insights.push(...stockOutAlerts);

    const performanceAlerts = await checkSupplierPerformance(supabase, tenant_id);
    insights.push(...performanceAlerts);

    return new Response(
      JSON.stringify({ insights }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

async function checkPriceWatchdog(supabase: any, tenant_id: string): Promise<AIInsight[]> {
  const insights: AIInsight[] = [];

  const { data: recentPrices } = await supabase
    .from("supplier_price_history")
    .select(`
      *,
      supplier:suppliers(name),
      product:products(name)
    `)
    .eq("tenant_id", tenant_id)
    .order("order_date", { ascending: false })
    .limit(100);

  if (!recentPrices) return insights;

  const pricesByProduct = new Map<string, any[]>();
  recentPrices.forEach((price: any) => {
    if (!pricesByProduct.has(price.product_id)) {
      pricesByProduct.set(price.product_id, []);
    }
    pricesByProduct.get(price.product_id)!.push(price);
  });

  pricesByProduct.forEach((prices, productId) => {
    if (prices.length < 2) return;

    prices.sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime());

    const latest = prices[0];
    const previous = prices[1];

    const priceIncrease = ((latest.unit_price - previous.unit_price) / previous.unit_price) * 100;

    if (priceIncrease > 10) {
      insights.push({
        type: 'price_risk',
        severity: priceIncrease > 25 ? 'critical' : 'warning',
        title: `Price Spike Detected: ${latest.product?.name || 'Product'}`,
        description: `${latest.supplier?.name || 'Supplier'} increased price by ${priceIncrease.toFixed(1)}% (${previous.unit_price.toFixed(2)} → ${latest.unit_price.toFixed(2)} ${latest.currency})`,
        action: 'Review supplier alternatives',
        related_id: productId,
      });
    }
  });

  return insights;
}

async function checkLeadTimeWarnings(supabase: any, tenant_id: string): Promise<AIInsight[]> {
  const insights: AIInsight[] = [];

  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("*")
    .eq("tenant_id", tenant_id)
    .eq("status", "active")
    .not("average_delivery_days", "is", null);

  if (!suppliers) return insights;

  suppliers.forEach((supplier: any) => {
    if (supplier.average_delivery_days > 14) {
      insights.push({
        type: 'lead_time_warning',
        severity: supplier.average_delivery_days > 30 ? 'critical' : 'warning',
        title: `Long Lead Time: ${supplier.name}`,
        description: `Average delivery takes ${supplier.average_delivery_days} days. Consider planning orders earlier or finding faster suppliers.`,
        action: 'Review delivery schedule',
        related_id: supplier.id,
      });
    }
  });

  return insights;
}

async function checkStockOutPrevention(supabase: any, tenant_id: string): Promise<AIInsight[]> {
  const insights: AIInsight[] = [];

  const { data: lowStockProducts } = await supabase
    .from("products")
    .select("id, name, sku, stock_quantity, min_stock_level")
    .eq("tenant_id", tenant_id)
    .not("min_stock_level", "is", null);

  if (!lowStockProducts) return insights;

  const criticalProducts = lowStockProducts.filter((p: any) =>
    p.stock_quantity <= (p.min_stock_level || 0)
  );

  if (criticalProducts.length > 0) {
    const productNames = criticalProducts.slice(0, 3).map((p: any) => p.name).join(', ');
    const remaining = criticalProducts.length > 3 ? ` and ${criticalProducts.length - 3} more` : '';

    insights.push({
      type: 'stock_out',
      severity: 'critical',
      title: 'Stock-Out Risk Detected',
      description: `${criticalProducts.length} product(s) below minimum stock level: ${productNames}${remaining}`,
      action: 'Generate purchase requisitions',
    });

    for (const product of criticalProducts) {
      const { data: existingReq } = await supabase
        .from("purchase_requisitions")
        .select("id")
        .eq("product_id", product.id)
        .eq("status", "pending")
        .maybeSingle();

      if (!existingReq) {
        const suggestedQty = Math.max(
          (product.min_stock_level || 0) * 2 - product.stock_quantity,
          10
        );

        await supabase.from("purchase_requisitions").insert({
          tenant_id,
          product_id: product.id,
          current_stock: product.stock_quantity,
          min_stock_level: product.min_stock_level,
          suggested_quantity: suggestedQty,
          priority: product.stock_quantity <= 0 ? 'critical' : 'high',
          reason: `Automatic: Stock below minimum level (${product.stock_quantity} / ${product.min_stock_level})`,
          status: 'pending',
          created_by_system: true,
        });
      }
    }
  }

  return insights;
}

async function checkSupplierPerformance(supabase: any, tenant_id: string): Promise<AIInsight[]> {
  const insights: AIInsight[] = [];

  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("*")
    .eq("tenant_id", tenant_id)
    .eq("status", "active")
    .lte("reliability_rating", 2);

  if (!suppliers || suppliers.length === 0) return insights;

  suppliers.forEach((supplier: any) => {
    insights.push({
      type: 'supplier_performance',
      severity: supplier.reliability_rating === 1 ? 'critical' : 'warning',
      title: `Low Supplier Rating: ${supplier.name}`,
      description: `Reliability rating: ${supplier.reliability_rating}/5. Consider reviewing recent orders and finding alternatives.`,
      action: 'Review supplier performance',
      related_id: supplier.id,
    });
  });

  return insights;
}
