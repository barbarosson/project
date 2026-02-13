import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-customer-header, x-supabase-auth",
};

const DATABASE_SCHEMA = `
# Modulus ERP Database Schema

## Core Tables

### customers
- id (uuid), tenant_id (uuid), name, email, phone, address, city, country, tax_number
- customer_type (enum: 'individual', 'corporate')
- balance (numeric) - Current account balance (+ means customer owes us, - means we owe them)
- status (enum: 'active', 'inactive')

### products
- id (uuid), tenant_id (uuid), name, description, sku, barcode
- category (enum: 'electronics', 'clothing', 'food', 'services', 'other')
- sale_price (numeric), purchase_price (numeric), cost (numeric)
- stock_quantity (integer), min_stock_level (integer)
- unit (enum: 'piece', 'kg', 'liter', 'meter', 'box')

### invoices
- id (uuid), tenant_id (uuid), invoice_number, customer_id (uuid)
- issue_date, due_date, status (enum: 'draft', 'sent', 'paid', 'overdue', 'cancelled')
- subtotal (numeric), tax_amount (numeric), discount_amount (numeric), total_amount (numeric)
- payment_method (enum: 'cash', 'credit_card', 'bank_transfer', 'check')

**Invoice Status Workflow:**
- 'draft': Invoice is being prepared (Pro Forma)
- 'sent': Invoice sent to customer, awaiting payment
- 'paid': SYSTEM-MANAGED - Automatically set when fully paid
- 'overdue': SYSTEM-MANAGED - Automatically set when due_date passed and still unpaid
- 'cancelled': Invoice cancelled, excluded from all financial calculations

**Revenue Classification:**
- Draft Revenue: Invoices with status='draft' (Pro Forma/Estimates)
- Confirmed Revenue: Invoices with status IN ('sent', 'paid', 'overdue')
- Excluded: Invoices with status='cancelled'

### invoice_line_items
- id (uuid), tenant_id (uuid), invoice_id (uuid), product_id (uuid)
- quantity (numeric), unit_price (numeric), tax_rate (numeric), discount_rate (numeric)
- line_total (numeric)

### expenses
- id (uuid), tenant_id (uuid), category, description, amount (numeric)
- expense_date, payment_method, vendor_name, status (enum: 'pending', 'approved', 'paid')

### transactions
- id (uuid), tenant_id (uuid), customer_id (uuid), transaction_type (enum: 'payment', 'invoice', 'refund', 'adjustment')
- amount (numeric), description, transaction_date, payment_method

### stock_movements
- id (uuid), tenant_id (uuid), product_id (uuid), movement_type (enum: 'in', 'out', 'adjustment')
- quantity (numeric), reference_type, reference_id, notes

### campaigns
- id (uuid), tenant_id (uuid), name, description, campaign_type, status
- start_date, end_date, budget (numeric), actual_spend (numeric)

### proposals
- id (uuid), tenant_id (uuid), proposal_number, customer_id (uuid)
- issue_date, valid_until, status (enum: 'draft', 'sent', 'accepted', 'rejected')
- subtotal, tax_amount, discount_amount, total_amount
`;

const TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "query_financial_summary",
      description: "Get financial summary including total revenue, expenses, and profit for a date range",
      parameters: {
        type: "object",
        properties: {
          start_date: { type: "string", description: "Start date in YYYY-MM-DD format" },
          end_date: { type: "string", description: "End date in YYYY-MM-DD format" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_invoices",
      description: "Query invoices with filters like invoice number, status, customer name/id, date range, or amount. Use this when user asks about a specific invoice by number or customer name.",
      parameters: {
        type: "object",
        properties: {
          invoice_number: { type: "string", description: "Search by specific invoice number (e.g., INV-54530105)" },
          customer_name: { type: "string", description: "Search by customer name (partial match supported)" },
          status: { type: "string", enum: ["draft", "sent", "paid", "overdue", "cancelled"] },
          customer_id: { type: "string", description: "Filter by customer UUID" },
          start_date: { type: "string", description: "Filter invoices from this date" },
          end_date: { type: "string", description: "Filter invoices until this date" },
          min_amount: { type: "number", description: "Minimum invoice amount" },
          max_amount: { type: "number", description: "Maximum invoice amount" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_customers",
      description: "Query customers with filters like name, city, status, or balance. Use this when user asks about a specific customer by name.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Search by customer name (partial match supported, case-insensitive)" },
          city: { type: "string", description: "Filter by city" },
          status: { type: "string", enum: ["active", "inactive"] },
          has_unpaid_invoices: { type: "boolean", description: "Filter customers with unpaid invoices" },
          min_balance: { type: "number", description: "Minimum account balance" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_products",
      description: "Query products with filters like category, low stock, or price range",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string" },
          low_stock: { type: "boolean", description: "Products below minimum stock level" },
          min_price: { type: "number" },
          max_price: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_expenses",
      description: "Query expenses with filters like category, date range, or amount",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string" },
          start_date: { type: "string" },
          end_date: { type: "string" },
          status: { type: "string", enum: ["pending", "approved", "paid"] },
          min_amount: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "calculate_profit_margin",
      description: "Calculate profit margin for a date range",
      parameters: {
        type: "object",
        properties: {
          start_date: { type: "string" },
          end_date: { type: "string" },
        },
      },
    },
  },
];

async function executeFunctionCall(
  functionName: string,
  args: any,
  tenantId: string,
  supabase: any
): Promise<string> {
  try {
    switch (functionName) {
      case "query_financial_summary": {
        const { start_date, end_date } = args;

        console.log('[query_financial_summary] Called with:', { tenantId, start_date, end_date });

        const { data: invoices, error: invoicesError } = await supabase
          .from("invoices")
          .select("total, status")
          .eq("tenant_id", tenantId)
          .gte("issue_date", start_date)
          .lte("issue_date", end_date);

        if (invoicesError) {
          console.error('[query_financial_summary] Invoices error:', invoicesError);
          return JSON.stringify({ error: `Database error: ${invoicesError.message}` });
        }

        const { data: expenses, error: expensesError } = await supabase
          .from("expenses")
          .select("amount")
          .eq("tenant_id", tenantId)
          .gte("expense_date", start_date)
          .lte("expense_date", end_date);

        if (expensesError) {
          console.error('[query_financial_summary] Expenses error:', expensesError);
          return JSON.stringify({ error: `Database error: ${expensesError.message}` });
        }

        console.log('[query_financial_summary] Results:', {
          invoicesCount: invoices?.length || 0,
          expensesCount: expenses?.length || 0
        });

        if (!invoices || invoices.length === 0) {
          console.log('[query_financial_summary] No invoices found for period');
          return JSON.stringify({
            period: `${start_date} to ${end_date}`,
            total_revenue: "0.00",
            confirmed_revenue: "0.00",
            draft_revenue: "0.00",
            expenses: "0.00",
            profit: "0.00",
            profit_margin: "0.00%",
            note: "Analiz edilecek fatura bulunamadı. / No invoices found for analysis."
          });
        }

        const draftRevenue = invoices.filter(i => i.status === 'draft').reduce((sum, i) => sum + parseFloat(i.total || 0), 0) || 0;
        const confirmedRevenue = invoices.filter(i => ['sent', 'paid', 'overdue'].includes(i.status)).reduce((sum, i) => sum + parseFloat(i.total || 0), 0) || 0;
        const totalRevenue = draftRevenue + confirmedRevenue;
        const totalExpenses = expenses?.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0) || 0;
        const profit = confirmedRevenue - totalExpenses;
        const margin = confirmedRevenue > 0 ? ((profit / confirmedRevenue) * 100).toFixed(2) : "0.00";

        return JSON.stringify({
          period: `${start_date} to ${end_date}`,
          total_revenue: totalRevenue.toFixed(2),
          confirmed_revenue: confirmedRevenue.toFixed(2),
          draft_revenue: draftRevenue.toFixed(2),
          expenses: totalExpenses.toFixed(2),
          profit: profit.toFixed(2),
          profit_margin: `${margin}%`,
          note: "Profit is calculated using confirmed revenue only (excludes drafts)"
        });
      }

      case "query_invoices": {
        console.log('[query_invoices] Called with:', { tenantId, args });

        if (args.customer_name) {
          const { data: customers, error: customerError } = await supabase
            .from("customers")
            .select("id")
            .eq("tenant_id", tenantId)
            .ilike("name", `%${args.customer_name}%`);

          if (customerError) {
            console.error('[query_invoices] Customer lookup error:', customerError);
            return JSON.stringify({ error: customerError.message });
          }

          if (!customers || customers.length === 0) {
            return JSON.stringify({
              message: `"${args.customer_name}" adında müşteri bulunamadı. / No customer found with name "${args.customer_name}".`,
              invoices: []
            });
          }

          const customerIds = customers.map(c => c.id);

          let query = supabase
            .from("invoices")
            .select("invoice_number, issue_date, due_date, total, status, customers(name)")
            .eq("tenant_id", tenantId)
            .in("customer_id", customerIds);

          if (args.invoice_number) query = query.ilike("invoice_number", `%${args.invoice_number}%`);
          if (args.status) query = query.eq("status", args.status);
          if (args.start_date) query = query.gte("issue_date", args.start_date);
          if (args.end_date) query = query.lte("issue_date", args.end_date);
          if (args.min_amount) query = query.gte("total", args.min_amount);
          if (args.max_amount) query = query.lte("total", args.max_amount);

          const { data, error } = await query.limit(20);

          if (error) {
            console.error('[query_invoices] Error:', error);
            return JSON.stringify({ error: error.message });
          }

          console.log('[query_invoices] Results for customer name:', data?.length || 0, 'invoices');

          if (!data || data.length === 0) {
            return JSON.stringify({
              message: `"${args.customer_name}" müşterisine ait fatura bulunamadı. / No invoices found for customer "${args.customer_name}".`,
              invoices: []
            });
          }

          return JSON.stringify(data);
        }

        let query = supabase
          .from("invoices")
          .select("invoice_number, issue_date, due_date, total, status, customers(name)")
          .eq("tenant_id", tenantId);

        if (args.invoice_number) query = query.ilike("invoice_number", `%${args.invoice_number}%`);
        if (args.status) query = query.eq("status", args.status);
        if (args.customer_id) query = query.eq("customer_id", args.customer_id);
        if (args.start_date) query = query.gte("issue_date", args.start_date);
        if (args.end_date) query = query.lte("issue_date", args.end_date);
        if (args.min_amount) query = query.gte("total", args.min_amount);
        if (args.max_amount) query = query.lte("total", args.max_amount);

        const { data, error } = await query.limit(20);

        if (error) {
          console.error('[query_invoices] Error:', error);
          return JSON.stringify({ error: error.message });
        }

        console.log('[query_invoices] Results:', data?.length || 0, 'invoices');

        if (!data || data.length === 0) {
          return JSON.stringify({ message: "Bu kriterlere uygun fatura bulunamadı. / No invoices found matching these criteria.", invoices: [] });
        }

        return JSON.stringify(data);
      }

      case "query_customers": {
        console.log('[query_customers] Called with:', { tenantId, args });

        let query = supabase
          .from("customers")
          .select("id, name, email, phone, city, balance, status")
          .eq("tenant_id", tenantId);

        if (args.name) query = query.ilike("name", `%${args.name}%`);
        if (args.city) query = query.ilike("city", `%${args.city}%`);
        if (args.status) query = query.eq("status", args.status);
        if (args.min_balance !== undefined) query = query.gte("balance", args.min_balance);

        const { data: customers, error: customersError } = await query.limit(20);

        if (customersError) {
          console.error('[query_customers] Error:', customersError);
          return JSON.stringify({ error: customersError.message });
        }

        console.log('[query_customers] Results:', customers?.length || 0, 'customers');

        if (args.has_unpaid_invoices) {
          const { data: unpaidInvoices, error: invoicesError } = await supabase
            .from("invoices")
            .select("customer_id")
            .eq("tenant_id", tenantId)
            .in("status", ["sent", "overdue"]);

          if (invoicesError) {
            console.error('[query_customers] Unpaid invoices error:', invoicesError);
            return JSON.stringify({ error: invoicesError.message });
          }

          const customerIds = new Set(unpaidInvoices?.map(i => i.customer_id) || []);
          const filtered = customers?.filter(c => customerIds.has(c.id)) || [];
          return JSON.stringify(filtered);
        }

        return JSON.stringify(customers || []);
      }

      case "query_products": {
        console.log('[query_products] Called with:', { tenantId, args });

        let query = supabase
          .from("products")
          .select("name, sku, category, sale_price, stock_quantity, min_stock_level")
          .eq("tenant_id", tenantId);

        if (args.category) query = query.eq("category", args.category);
        if (args.min_price) query = query.gte("sale_price", args.min_price);
        if (args.max_price) query = query.lte("sale_price", args.max_price);

        const { data, error } = await query.limit(20);

        if (error) {
          console.error('[query_products] Error:', error);
          return JSON.stringify({ error: error.message });
        }

        console.log('[query_products] Results:', data?.length || 0, 'products');

        if (args.low_stock) {
          const filtered = data?.filter(p => p.stock_quantity <= p.min_stock_level) || [];
          return JSON.stringify(filtered);
        }

        return JSON.stringify(data || []);
      }

      case "query_expenses": {
        console.log('[query_expenses] Called with:', { tenantId, args });

        let query = supabase
          .from("expenses")
          .select("category, description, amount, expense_date, vendor_name, status")
          .eq("tenant_id", tenantId);

        if (args.category) query = query.eq("category", args.category);
        if (args.status) query = query.eq("status", args.status);
        if (args.start_date) query = query.gte("expense_date", args.start_date);
        if (args.end_date) query = query.lte("expense_date", args.end_date);
        if (args.min_amount) query = query.gte("amount", args.min_amount);

        const { data, error } = await query.limit(20);

        if (error) {
          console.error('[query_expenses] Error:', error);
          return JSON.stringify({ error: error.message });
        }

        console.log('[query_expenses] Results:', data?.length || 0, 'records');
        return JSON.stringify(data || []);
      }

      case "calculate_profit_margin": {
        const { start_date, end_date } = args;

        console.log('[calculate_profit_margin] Called with:', { tenantId, start_date, end_date });

        const { data: invoices, error: invoicesError } = await supabase
          .from("invoices")
          .select("total, status")
          .eq("tenant_id", tenantId)
          .eq("status", "paid")
          .gte("issue_date", start_date)
          .lte("issue_date", end_date);

        if (invoicesError) {
          console.error('[calculate_profit_margin] Invoices error:', invoicesError);
          return JSON.stringify({ error: invoicesError.message });
        }

        const { data: expenses, error: expensesError } = await supabase
          .from("expenses")
          .select("amount")
          .eq("tenant_id", tenantId)
          .gte("expense_date", start_date)
          .lte("expense_date", end_date);

        if (expensesError) {
          console.error('[calculate_profit_margin] Expenses error:', expensesError);
          return JSON.stringify({ error: expensesError.message });
        }

        console.log('[calculate_profit_margin] Results:', {
          invoicesCount: invoices?.length || 0,
          expensesCount: expenses?.length || 0
        });

        const revenue = invoices?.reduce((sum, i) => sum + parseFloat(i.total || 0), 0) || 0;
        const totalExpenses = expenses?.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0) || 0;
        const profit = revenue - totalExpenses;
        const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

        return JSON.stringify({
          revenue: revenue.toFixed(2),
          expenses: totalExpenses.toFixed(2),
          profit: profit.toFixed(2),
          profit_margin: `${margin.toFixed(2)}%`,
          margin_ratio: (margin / 100).toFixed(4),
        });
      }

      default:
        return JSON.stringify({ error: "Unknown function" });
    }
  } catch (error) {
    return JSON.stringify({ error: error.message });
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    console.log("[AI-CFO] Handling OPTIONS preflight request");
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    console.log("[AI-CFO] 🟢 Incoming request:", req.method);
    console.log("[AI-CFO] 🟢 Function deployed with MANUAL AUTH (Gateway JWT disabled)");

    const authHeader = req.headers.get("Authorization");
    const apikeyHeader = req.headers.get("apikey");

    console.log("[AI-CFO] Headers received:");
    console.log("[AI-CFO]   Authorization:", authHeader ? "✓ Present" : "❌ Missing");
    console.log("[AI-CFO]   apikey:", apikeyHeader ? "✓ Present" : "❌ Missing");
    console.log("[AI-CFO]   All headers:", Array.from(req.headers.keys()).join(", "));

    if (!authHeader) {
      console.error("[AI-CFO] ❌ Missing Authorization header");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Unauthorized: Missing Authorization header"
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log("[AI-CFO] ✓ Auth header present");
    console.log("[AI-CFO] Token preview:", authHeader.substring(0, 17) + "...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const openaiKey = Deno.env.get("OPENAI_API_KEY") ?? "";

    console.log("[AI-CFO] Environment check:");
    console.log("[AI-CFO]   SUPABASE_URL:", supabaseUrl ? `✓ Set (${supabaseUrl})` : "❌ Missing");
    console.log("[AI-CFO]   SUPABASE_ANON_KEY:", supabaseAnonKey ? "✓ Set (length: " + supabaseAnonKey.length + ")" : "❌ Missing");
    console.log("[AI-CFO]   SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "✓ Set" : "❌ Missing");
    console.log("[AI-CFO]   OPENAI_API_KEY:", openaiKey ? "✓ Set" : "❌ Missing");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.error("[AI-CFO] ❌ Missing Supabase environment variables");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Server configuration error: Missing Supabase credentials"
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!openaiKey) {
      console.error("[AI-CFO] ❌ Missing OPENAI_API_KEY");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Server configuration error: AI service not configured"
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log("[AI-CFO] 🔍 Verifying JWT manually...");
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    let authError: any;
    let user: any;

    try {
      const result = await authClient.auth.getUser();
      user = result.data?.user;
      authError = result.error;

      console.log("[AI-CFO] JWT Verification Result:", {
        hasUser: !!user,
        hasError: !!authError,
        errorName: authError?.name,
        errorMessage: authError?.message,
        errorStatus: authError?.status,
      });
    } catch (err: any) {
      console.error("[AI-CFO] ❌ JWT Verification Exception:", err);
      authError = err;
    }

    if (authError || !user) {
      const errorDetails = {
        message: authError?.message || "Invalid or expired token",
        name: authError?.name || "AuthError",
        status: authError?.status || "unknown",
      };

      console.error("[AI-CFO] ❌ Auth verification failed:", errorDetails);

      let userFriendlyError = "Unauthorized: ";
      if (authError?.message?.includes("expired")) {
        userFriendlyError += "JWT Expired - Token has expired, please refresh";
      } else if (authError?.message?.includes("signature")) {
        userFriendlyError += "JWT Signature Mismatch - Invalid token signature";
      } else if (authError?.message?.includes("invalid")) {
        userFriendlyError += "Invalid JWT - Token format is invalid";
      } else {
        userFriendlyError += authError?.message || "Invalid or expired token";
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: userFriendlyError,
          details: errorDetails,
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log("[AI-CFO] ✓ Authenticated user:", user.id);

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      console.error("[AI-CFO] OpenAI API key not configured");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Server configuration error: AI service not configured. Please contact administrator."
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const body = await req.json();
    const { message, thread_id, tenant_id } = body;

    if (!tenant_id) {
      throw new Error("Missing tenant_id in request body");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const tenantId = tenant_id;

    console.log("[AI-CFO] Using tenant_id:", tenantId);

    let threadId = thread_id;
    if (!threadId) {
      console.log("[AI-CFO] Creating new thread...");
      const { data: newThread, error: threadError } = await supabase
        .from("ai_chat_threads")
        .insert({ tenant_id: tenantId, title: message.substring(0, 50) })
        .select()
        .maybeSingle();

      if (threadError) {
        console.error("[AI-CFO] ❌ Error creating thread:", threadError);
        throw new Error(`Failed to create chat thread: ${threadError.message}`);
      }

      if (!newThread) {
        console.error("[AI-CFO] ❌ Thread creation returned no data");
        throw new Error("Failed to create chat thread: No data returned");
      }

      threadId = newThread.id;
      console.log("[AI-CFO] ✓ Created new thread:", threadId);
    }

    await supabase
      .from("ai_chat_history")
      .insert({
        thread_id: threadId,
        tenant_id: tenantId,
        role: "user",
        content: message,
      });

    console.log("[AI-CFO] Fetching chat history for thread:", threadId);
    const { data: history, error: historyError } = await supabase
      .from("ai_chat_history")
      .select("role, content, function_call, function_response")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true })
      .limit(10);

    if (historyError) {
      console.error("[AI-CFO] ❌ Error fetching history:", historyError);
    }

    console.log("[AI-CFO] Chat history loaded:", history?.length || 0, "messages");

    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentYear = now.getFullYear();
    const currentMonth = now.toLocaleString('en-US', { month: 'long' });

    const messages = [
      {
        role: "system",
        content: `**CRITICAL CONTEXT:**
Current Date: ${currentDate} (${currentMonth} ${currentYear})
System Type: REAL-TIME CFO AI with LIVE DATABASE ACCESS

You are the CFO AI of Modulus ERP. You have direct, real-time read access to the company's financial and operational database through function calling.

**ANTI-HALLUCINATION RULES:**
🚫 NEVER say you don't have access to data after October 2023
🚫 NEVER claim you have a knowledge cutoff date
🚫 NEVER say you cannot see ${currentYear} data
✅ ALWAYS query the database using the provided functions for ANY data question
✅ Your knowledge comes EXCLUSIVELY from the LIVE Supabase database tables
✅ If a query returns 0 results, say "There are no records for this period yet" NOT "I don't have access to this data"
✅ You can access data from ANY date range - past, present, and future dates in the database

${DATABASE_SCHEMA}

**Date Column Reference:**
- invoices: use 'issue_date' column for filtering
- expenses: use 'expense_date' column for filtering
- campaigns: use 'start_date' and 'end_date' columns
- proposals: use 'issue_date' column
- transactions: use 'transaction_date' column

**Your Capabilities:**
- Query invoices, customers, products, expenses, and stock data from ANY time period
- Calculate financial metrics (profit margin, revenue, costs) for ANY date range
- Filter and analyze data based on user criteria including ${currentYear} data
- Provide financial insights and recommendations based on LIVE database queries

**MANDATORY QUERY BEHAVIOR - NO EXCEPTIONS:**
🚨 YOU MUST USE FUNCTIONS FOR EVERY DATA QUESTION - NO EXCEPTIONS! 🚨
- NEVER EVER answer a data question without calling a function first
- For ANY question about finances, customers, products, invoices, or data: CALL A FUNCTION IMMEDIATELY
- When user asks about "this month" or "bu ay" → Query with start_date='${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}-01', end_date='${currentDate}'
- When user asks about "this year" or "bu yıl" → Query with start_date='${currentYear}-01-01', end_date='${currentDate}'
- When user asks about specific invoice number → Use query_invoices with invoice_number parameter
- When user asks about specific customer name → Use query_invoices with customer_name parameter
- ALWAYS execute function calls to get real data before answering
- If you answer a data question without calling a function, you FAILED your job

**Language Support:**
- Detect the user's language (Turkish or English) and respond in the same language
- Use professional yet friendly tone

**Revenue Reporting Rules:**
- ALWAYS distinguish between Draft (Pro Forma) and Confirmed revenue
- When reporting total revenue, break it down as: "Total Revenue: $X (Confirmed: $Y + Draft: $Z)"
- Example: "Your total revenue is $50,000, including $45,000 from confirmed invoices (sent/paid/overdue) and $5,000 from draft invoices."
- NEVER include cancelled invoices in any revenue calculations
- For profit calculations, use ONLY confirmed revenue (exclude drafts)

**Output Format:**
- Use Markdown formatting for clarity
- Use **bold** for important numbers and metrics
- Use tables for multi-row data
- Use bullet points for lists
- Always include units (₺, $, %, etc.)

**Smart Filtering Examples:**
- "Istanbul'daki müşteriler" → query_customers with city filter
- "Ödenmemiş faturalar" → query_invoices with status IN ('sent', 'overdue')
- "Düşük stoklu ürünler" → query_products with low_stock=true
- "Bu ayki kar marjı" → calculate_profit_margin for ${currentMonth} ${currentYear}
- "${currentYear} sales" → query_invoices with start_date='${currentYear}-01-01'
- "INV-54530105 nolu fatura" → query_invoices with invoice_number='INV-54530105'
- "Ahmet'e kesilen faturalar" → query_invoices with customer_name='Ahmet'
- "Bu ayki faturalar" → query_invoices with start_date='${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}-01'
- "Ocak ayı faturaları" → query_invoices with start_date='${currentYear}-01-01', end_date='${currentYear}-01-31'

**CRITICAL Examples - Study These:**

Example 1 (Turkish):
User: "INV-54530105 nolu fatura kime kesilmiş?"
You: [IMMEDIATELY call query_invoices with invoice_number='INV-54530105']
You: "INV-54530105 numaralı fatura [Müşteri Adı]'na kesilmiştir..."

Example 2 (Turkish):
User: "Bu ayki tüm faturaların toplamı nedir?"
You: [IMMEDIATELY call query_financial_summary with start_date='${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}-01', end_date='${currentDate}']
You: "Bu ay toplam fatura tutarı: ₺X,XXX.XX..."

Example 3 (English):
User: "What is my revenue for January 2026?"
You: [IMMEDIATELY call query_financial_summary with start_date='2026-01-01', end_date='2026-01-31']
You: "Based on the live database query, your revenue for January 2026 is $X,XXX.XX..."

Remember: You are NOT a pre-trained model answering from memory. You are a LIVE database interface. ALWAYS query first, NEVER claim data unavailability based on training cutoffs.`,
      },
      ...(history || []).map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: "user",
        content: message,
      },
    ];

    if (!OPENAI_API_KEY) {
      console.error("CRITICAL: OPENAI_API_KEY is not configured in environment variables");
      throw new Error("OpenAI API key not configured. Please set OPENAI_API_KEY in Supabase Edge Function secrets.");
    }

    console.log("[AI-CFO] Making OpenAI API request with", messages.length, "messages...");

    let aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        tools: TOOL_DEFINITIONS,
        tool_choice: "auto",
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("[AI-CFO] ❌ OpenAI API error:", aiResponse.status, errorText);
      throw new Error(`OpenAI API error: ${aiResponse.status} - ${errorText}`);
    }

    let responseData = await aiResponse.json();
    console.log("[AI-CFO] OpenAI response received, structure check:", {
      hasChoices: !!responseData?.choices,
      choicesLength: responseData?.choices?.length,
      hasFirstChoice: !!responseData?.choices?.[0],
      hasMessage: !!responseData?.choices?.[0]?.message
    });

    if (!responseData?.choices || responseData.choices.length === 0) {
      console.error("[AI-CFO] ❌ OpenAI response missing choices array:", responseData);
      throw new Error("Invalid OpenAI API response: No choices array");
    }

    if (!responseData.choices[0]?.message) {
      console.error("[AI-CFO] ❌ OpenAI response missing message in first choice:", responseData.choices[0]);
      throw new Error("Invalid OpenAI API response: No message in first choice");
    }

    let assistantMessage = responseData.choices[0].message;
    console.log("[AI-CFO] ✓ Assistant message received, has tool_calls:", !!assistantMessage.tool_calls);

    while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      messages.push(assistantMessage);

      for (const toolCall of assistantMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        console.log("[AI-CFO] 🔧 Executing tool:", functionName, "with args:", functionArgs);

        const functionResult = await executeFunctionCall(
          functionName,
          functionArgs,
          tenantId,
          supabase
        );

        console.log("[AI-CFO] ✓ Tool result:", functionResult.substring(0, 200));

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: functionResult,
        });
      }

      console.log("[AI-CFO] Sending tool results back to OpenAI...");

      aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages,
          tools: TOOL_DEFINITIONS,
          tool_choice: "auto",
          temperature: 0.7,
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error("[AI-CFO] ❌ OpenAI API error in tool loop:", aiResponse.status, errorText);
        throw new Error(`OpenAI API error: ${aiResponse.status} - ${errorText}`);
      }

      responseData = await aiResponse.json();

      if (!responseData?.choices || responseData.choices.length === 0) {
        console.error("[AI-CFO] ❌ OpenAI response missing choices in tool loop:", responseData);
        throw new Error("Invalid OpenAI API response in tool loop: No choices array");
      }

      if (!responseData.choices[0]?.message) {
        console.error("[AI-CFO] ❌ OpenAI response missing message in tool loop:", responseData.choices[0]);
        throw new Error("Invalid OpenAI API response in tool loop: No message");
      }

      assistantMessage = responseData.choices[0].message;
      console.log("[AI-CFO] ✓ Next iteration, has tool_calls:", !!assistantMessage.tool_calls);
    }

    await supabase
      .from("ai_chat_history")
      .insert({
        thread_id: threadId,
        tenant_id: tenantId,
        role: "assistant",
        content: assistantMessage.content,
      });

    return new Response(
      JSON.stringify({
        message: assistantMessage.content,
        thread_id: threadId,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("AI CFO Chat Error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "An unexpected error occurred",
        details: error.stack
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
