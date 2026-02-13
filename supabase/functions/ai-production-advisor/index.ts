import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ProductionSuggestion {
  product_id: string;
  product_name: string;
  suggested_quantity: number;
  priority_score: number;
  urgency_level: string;
  reasoning: string;
  confidence_score: number;
  estimated_revenue: number;
  estimated_cost: number;
  estimated_profit: number;
  profit_margin_percentage: number;
  roi_percentage: number;
  cash_impact_status: string;
  cash_required: number;
  current_stock_level: number;
  pending_orders_quantity: number;
  forecasted_demand: number;
  recommended_start_date: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { tenant_id, branch_id, action } = await req.json();

    if (!tenant_id) {
      return new Response(
        JSON.stringify({ error: 'tenant_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    switch (action) {
      case 'generate_suggestions':
        return await generateSuggestions(supabase, tenant_id, branch_id);

      case 'get_suggestions':
        return await getSuggestions(supabase, tenant_id, branch_id);

      case 'approve_suggestion':
        const { suggestion_id, user_id, notes } = await req.json();
        return await approveSuggestion(supabase, suggestion_id, user_id, notes);

      case 'reject_suggestion':
        const { suggestion_id: reject_id, user_id: reject_user, reason } = await req.json();
        return await rejectSuggestion(supabase, reject_id, reject_user, reason);

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function generateSuggestions(supabase: any, tenant_id: string, branch_id?: string) {
  const suggestions: ProductionSuggestion[] = [];

  const { data: products, error: productsError } = await supabase
    .from('products')
    .select(`
      id,
      name,
      sku,
      quantity,
      minimum_stock_level,
      sale_price,
      purchase_price
    `)
    .eq('tenant_id', tenant_id)
    .eq(branch_id ? 'branch_id' : 'tenant_id', branch_id || tenant_id)
    .lt('quantity', 'minimum_stock_level');

  if (productsError) {
    throw new Error(`Failed to fetch products: ${productsError.message}`);
  }

  for (const product of products) {
    const stockDeficit = (product.minimum_stock_level || 0) - (product.quantity || 0);

    if (stockDeficit > 0) {
      const suggestedQuantity = Math.ceil(stockDeficit * 1.5);
      const estimatedCost = suggestedQuantity * (product.purchase_price || 0);
      const estimatedRevenue = suggestedQuantity * (product.sale_price || 0);
      const estimatedProfit = estimatedRevenue - estimatedCost;
      const profitMargin = estimatedCost > 0 ? (estimatedProfit / estimatedRevenue) * 100 : 0;
      const roi = estimatedCost > 0 ? (estimatedProfit / estimatedCost) * 100 : 0;

      const stockoutRisk = stockDeficit / (product.minimum_stock_level || 1);
      const urgencyLevel = stockoutRisk > 0.8 ? 'critical' :
                          stockoutRisk > 0.5 ? 'high' :
                          stockoutRisk > 0.3 ? 'medium' : 'low';

      const priorityScore = Math.min(1.0, (stockoutRisk * 0.4) + (profitMargin / 100 * 0.3) + (roi / 100 * 0.3));

      const reasoning = `⚠️ Stok minimum seviyenin altında (${product.quantity}/${product.minimum_stock_level}) • ` +
                       `📈 Tahmini kâr: ₺${estimatedProfit.toFixed(2)} • ` +
                       `💰 Kâr marjı: %${profitMargin.toFixed(1)} • ` +
                       `🎯 ROI: %${roi.toFixed(1)}`;

      const suggestion: ProductionSuggestion = {
        product_id: product.id,
        product_name: product.name,
        suggested_quantity: suggestedQuantity,
        priority_score: Math.round(priorityScore * 100) / 100,
        urgency_level: urgencyLevel,
        reasoning,
        confidence_score: 0.75,
        estimated_revenue: estimatedRevenue,
        estimated_cost: estimatedCost,
        estimated_profit: estimatedProfit,
        profit_margin_percentage: Math.round(profitMargin * 10) / 10,
        roi_percentage: Math.round(roi * 10) / 10,
        cash_impact_status: estimatedCost < 10000 ? 'safe' : estimatedCost < 50000 ? 'moderate' : 'risky',
        cash_required: estimatedCost,
        current_stock_level: product.quantity || 0,
        pending_orders_quantity: 0,
        forecasted_demand: suggestedQuantity,
        recommended_start_date: new Date().toISOString().split('T')[0],
      };

      suggestions.push(suggestion);

      const { error: insertError } = await supabase
        .from('ai_production_suggestions')
        .upsert({
          tenant_id,
          branch_id,
          product_id: product.id,
          suggested_quantity: suggestedQuantity,
          priority_score: suggestion.priority_score,
          urgency_level: urgencyLevel,
          reasoning,
          confidence_score: 0.75,
          estimated_revenue: estimatedRevenue,
          estimated_cost: estimatedCost,
          estimated_profit: estimatedProfit,
          profit_margin_percentage: profitMargin,
          roi_percentage: roi,
          cash_impact_status: suggestion.cash_impact_status,
          cash_required: estimatedCost,
          current_stock_level: product.quantity || 0,
          pending_orders_quantity: 0,
          forecasted_demand: suggestedQuantity,
          stockout_risk_score: Math.round(stockoutRisk * 100) / 100,
          recommended_start_date: suggestion.recommended_start_date,
          status: 'pending',
        });

      if (insertError) {
        console.error('Failed to insert suggestion:', insertError);
      }
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      suggestions: suggestions.sort((a, b) => b.priority_score - a.priority_score),
      count: suggestions.length
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getSuggestions(supabase: any, tenant_id: string, branch_id?: string) {
  let query = supabase
    .from('ai_production_suggestions')
    .select(`
      *,
      products (
        name,
        sku,
        image_url
      )
    `)
    .eq('tenant_id', tenant_id)
    .eq('status', 'pending')
    .order('priority_score', { ascending: false })
    .limit(10);

  if (branch_id) {
    query = query.eq('branch_id', branch_id);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch suggestions: ${error.message}`);
  }

  return new Response(
    JSON.stringify({ suggestions: data, count: data.length }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function approveSuggestion(supabase: any, suggestion_id: string, user_id: string, notes?: string) {
  const { data: suggestion, error: fetchError } = await supabase
    .from('ai_production_suggestions')
    .select('*')
    .eq('id', suggestion_id)
    .single();

  if (fetchError || !suggestion) {
    throw new Error('Suggestion not found');
  }

  if (suggestion.status !== 'pending') {
    throw new Error(`Suggestion already ${suggestion.status}`);
  }

  const { error: updateError } = await supabase
    .from('ai_production_suggestions')
    .update({
      status: 'approved',
      reviewed_by: user_id,
      reviewed_at: new Date().toISOString(),
      review_notes: notes
    })
    .eq('id', suggestion_id);

  if (updateError) {
    throw new Error(`Failed to approve suggestion: ${updateError.message}`);
  }

  const orderNo = `PRD-${Date.now().toString().slice(-8)}`;

  const { data: productionOrder, error: orderError } = await supabase
    .from('production_orders')
    .insert({
      order_no: orderNo,
      tenant_id: suggestion.tenant_id,
      branch_id: suggestion.branch_id,
      product_id: suggestion.product_id,
      planned_quantity: suggestion.suggested_quantity,
      order_date: new Date().toISOString().split('T')[0],
      planned_start_date: suggestion.recommended_start_date,
      status: 'draft',
      estimated_cost: suggestion.estimated_cost,
    })
    .select()
    .single();

  if (orderError) {
    console.error('Failed to create production order:', orderError);
  } else {
    await supabase
      .from('ai_production_suggestions')
      .update({ production_order_id: productionOrder.id })
      .eq('id', suggestion_id);
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Üretim önerisi onaylandı',
      production_order_no: orderNo
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function rejectSuggestion(supabase: any, suggestion_id: string, user_id: string, reason: string) {
  const { error } = await supabase
    .from('ai_production_suggestions')
    .update({
      status: 'rejected',
      reviewed_by: user_id,
      reviewed_at: new Date().toISOString(),
      review_notes: reason
    })
    .eq('id', suggestion_id)
    .eq('status', 'pending');

  if (error) {
    throw new Error(`Failed to reject suggestion: ${error.message}`);
  }

  return new Response(
    JSON.stringify({ success: true, message: 'Üretim önerisi reddedildi' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
