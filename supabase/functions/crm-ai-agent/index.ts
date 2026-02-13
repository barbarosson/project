import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AnalyzeCustomerRequest {
  action: 'analyze_customer';
  customer_id: string;
  force_refresh?: boolean;
}

interface GetDashboardMetricsRequest {
  action: 'get_dashboard_metrics';
}

interface GetAtRiskCustomersRequest {
  action: 'get_at_risk_customers';
  risk_level?: string;
  limit?: number;
}

interface CreateInteractionRequest {
  action: 'create_interaction';
  customer_id: string;
  type: string;
  subject: string;
  notes: string;
}

type RequestBody = AnalyzeCustomerRequest | GetDashboardMetricsRequest | GetAtRiskCustomersRequest | CreateInteractionRequest;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const body: RequestBody = await req.json();
    const { action } = body;

    let result: any;

    switch (action) {
      case 'analyze_customer':
        result = await analyzeCustomer(supabaseClient, body);
        break;
      case 'get_dashboard_metrics':
        result = await getDashboardMetrics(supabaseClient);
        break;
      case 'get_at_risk_customers':
        result = await getAtRiskCustomers(supabaseClient, body);
        break;
      case 'create_interaction':
        result = await createInteraction(supabaseClient, body);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});

async function analyzeCustomer(supabase: any, req: AnalyzeCustomerRequest) {
  const { customer_id, force_refresh = false } = req;

  // Check for existing insight
  if (!force_refresh) {
    const { data: existing } = await supabase
      .from('crm_ai_insights')
      .select('*')
      .eq('customer_id', customer_id)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (existing) {
      return { insight: existing, cached: true };
    }
  }

  // Get customer data
  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customer_id)
    .single();

  if (!customer) {
    throw new Error('Customer not found');
  }

  // Get invoice data
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('customer_id', customer_id);

  // Calculate churn probability
  const churnResult = calculateChurnProbability(customer, invoices || []);

  // Calculate CLV
  const clvResult = calculateCLV(customer, invoices || []);

  // Calculate engagement score
  const engagementResult = calculateEngagementScore(customer);

  // Generate recommendations
  const recommendations = generateRecommendations(customer, churnResult, engagementResult);

  // Save insight
  const insight = {
    customer_id,
    churn_probability: churnResult.probability,
    churn_risk_level: churnResult.risk_level,
    churn_factors: churnResult.factors,
    predicted_clv_12m: clvResult.clv_12m,
    predicted_clv_24m: clvResult.clv_24m,
    clv_confidence_score: clvResult.confidence,
    engagement_score: engagementResult.score,
    engagement_trend: engagementResult.trend,
    recommended_actions: recommendations,
    model_version: '1.0',
    calculated_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };

  const { data: savedInsight } = await supabase
    .from('crm_ai_insights')
    .upsert(insight)
    .select()
    .single();

  // Update customer metrics
  await supabase
    .from('customers')
    .update({
      clv: clvResult.clv_12m,
      churn_probability: churnResult.probability,
      churn_risk_level: churnResult.risk_level,
      health_score: calculateHealthScore(customer, churnResult, engagementResult),
      updated_at: new Date().toISOString(),
    })
    .eq('id', customer_id);

  return { insight: savedInsight, cached: false };
}

function calculateChurnProbability(customer: any, invoices: any[]) {
  let risk_score = 0;
  const factors = [];

  // Days since last order
  const days_since_last_order = customer.days_since_last_order || 999;
  if (days_since_last_order > 180) {
    risk_score += 0.35;
    factors.push({ factor: 'inactivity', impact: 0.35, description: `${days_since_last_order} gündür sipariş yok` });
  } else if (days_since_last_order > 90) {
    risk_score += 0.20;
    factors.push({ factor: 'low_activity', impact: 0.20, description: `${days_since_last_order} gündür sipariş yok` });
  }

  // Payment behavior
  const payment_score = customer.payment_score || 0.7;
  if (payment_score < 0.5) {
    risk_score += 0.25;
    factors.push({ factor: 'poor_payment', impact: 0.25, description: `Düşük ödeme skoru: ${payment_score.toFixed(2)}` });
  } else if (payment_score < 0.7) {
    risk_score += 0.15;
    factors.push({ factor: 'moderate_payment', impact: 0.15, description: `Orta ödeme skoru: ${payment_score.toFixed(2)}` });
  }

  // Overdue invoices
  const overdueCount = invoices.filter((inv: any) => inv.status === 'overdue').length;
  if (overdueCount > 2) {
    risk_score += 0.20;
    factors.push({ factor: 'overdue_invoices', impact: 0.20, description: `${overdueCount} vadesi geçmiş fatura` });
  }

  const probability = Math.min(1.0, risk_score);
  let risk_level = 'low';
  if (probability >= 0.60) risk_level = 'critical';
  else if (probability >= 0.40) risk_level = 'high';
  else if (probability >= 0.20) risk_level = 'medium';

  return { probability, risk_level, factors };
}

function calculateCLV(customer: any, invoices: any[]) {
  const avg_order_value = customer.average_order_value || 0;
  const total_orders = customer.total_orders || 0;

  // Estimate orders per year
  const orders_per_year = total_orders > 0 ? Math.max(12, total_orders) : 12;

  // Profit margin assumption
  const profit_margin = 0.30;
  const annual_value = avg_order_value * orders_per_year;
  const annual_profit = annual_value * profit_margin;

  const clv_12m = annual_profit;
  const clv_24m = annual_profit * 1.8; // Discounted

  const confidence = total_orders >= 10 ? 0.90 : total_orders >= 5 ? 0.75 : 0.60;

  return { clv_12m, clv_24m, confidence };
}

function calculateEngagementScore(customer: any) {
  const days_since_last_order = customer.days_since_last_order || 999;

  let recency_score = 0.2;
  if (days_since_last_order <= 30) recency_score = 1.0;
  else if (days_since_last_order <= 60) recency_score = 0.8;
  else if (days_since_last_order <= 90) recency_score = 0.6;
  else if (days_since_last_order <= 180) recency_score = 0.4;

  const total_orders = customer.total_orders || 0;
  let frequency_score = 0.2;
  if (total_orders >= 20) frequency_score = 1.0;
  else if (total_orders >= 10) frequency_score = 0.8;
  else if (total_orders >= 5) frequency_score = 0.6;
  else if (total_orders >= 2) frequency_score = 0.4;

  const score = (recency_score * 0.6 + frequency_score * 0.4);

  const trend = recency_score > 0.7 ? 'increasing' : recency_score < 0.4 ? 'decreasing' : 'stable';

  return { score, trend };
}

function calculateHealthScore(customer: any, churnResult: any, engagementResult: any) {
  const payment_score = customer.payment_score || 0.7;
  const payment_component = payment_score * 0.40;
  const activity_component = engagementResult.score * 0.30;
  const retention_component = (1 - churnResult.probability) * 0.20;
  const interaction_component = 0.7 * 0.10;

  return payment_component + activity_component + retention_component + interaction_component;
}

function generateRecommendations(customer: any, churnResult: any, engagementResult: any) {
  const actions = [];

  // High churn risk
  if (churnResult.probability >= 0.60) {
    actions.push({
      action: 'urgent_outreach',
      priority: 'urgent',
      reason: `Terk riski kritik seviyede (%${(churnResult.probability * 100).toFixed(0)})`,
      expected_impact: 'high',
      description: 'Acil olarak müşteriyi arayın ve sorunları dinleyin',
    });
  }

  // Low engagement
  if (engagementResult.score < 0.5) {
    actions.push({
      action: 'engagement_campaign',
      priority: 'high',
      reason: `Düşük etkileşim skoru (${engagementResult.score.toFixed(2)})`,
      expected_impact: 'medium',
      description: 'Özel bir kampanya veya indirim teklifi gönderin',
    });
  }

  // Inactive customer
  if ((customer.days_since_last_order || 0) > 90) {
    actions.push({
      action: 'reactivation',
      priority: 'medium',
      reason: `${customer.days_since_last_order} gündür sipariş yok`,
      expected_impact: 'medium',
      description: 'Yeniden aktivasyon kampanyası başlatın',
    });
  }

  return actions;
}

async function getDashboardMetrics(supabase: any) {
  const { data: customers } = await supabase
    .from('customers')
    .select('segment, clv, health_score, payment_score, churn_risk_level');

  if (!customers) {
    return { summary: {}, segment_distribution: [] };
  }

  const total_customers = customers.length;
  const vip_count = customers.filter((c: any) => c.segment === 'VIP').length;
  const risky_count = customers.filter((c: any) => c.segment === 'Risky').length;
  const critical_churn_count = customers.filter((c: any) => c.churn_risk_level === 'critical').length;

  const avg_clv = customers.reduce((sum: number, c: any) => sum + (c.clv || 0), 0) / total_customers;
  const avg_health_score = customers.reduce((sum: number, c: any) => sum + (c.health_score || 0), 0) / total_customers;
  const avg_payment_score = customers.reduce((sum: number, c: any) => sum + (c.payment_score || 0), 0) / total_customers;

  const segmentCounts: any = {};
  customers.forEach((c: any) => {
    segmentCounts[c.segment] = (segmentCounts[c.segment] || 0) + 1;
  });

  const segment_distribution = Object.keys(segmentCounts).map(segment => ({
    segment,
    count: segmentCounts[segment],
  }));

  return {
    summary: {
      total_customers,
      vip_count,
      risky_count,
      critical_churn_count,
      avg_clv,
      avg_health_score,
      avg_payment_score,
    },
    segment_distribution,
  };
}

async function getAtRiskCustomers(supabase: any, req: GetAtRiskCustomersRequest) {
  const { risk_level = 'high', limit = 20 } = req;

  const { data: customers } = await supabase
    .from('v_customer_360')
    .select('*')
    .eq('churn_risk_level', risk_level)
    .order('churn_probability', { ascending: false })
    .limit(limit);

  return { customers: customers || [], count: customers?.length || 0 };
}

async function createInteraction(supabase: any, req: CreateInteractionRequest) {
  const { customer_id, type, subject, notes } = req;

  // Simple sentiment analysis
  const sentiment_result = analyzeSentiment(notes);

  const { data: interaction, error } = await supabase
    .from('customer_interactions')
    .insert({
      customer_id,
      type,
      subject,
      notes,
      sentiment_score: sentiment_result.score,
      sentiment_label: sentiment_result.label,
      keywords: sentiment_result.keywords,
      topics: sentiment_result.topics,
    })
    .select()
    .single();

  if (error) throw error;

  return { interaction, sentiment: sentiment_result };
}

function analyzeSentiment(text: string) {
  const positiveWords = ['memnun', 'teşekkür', 'harika', 'mükemmel', 'iyi', 'güzel', 'başarılı'];
  const negativeWords = ['kötü', 'berbat', 'sorun', 'problem', 'şikayet', 'geç', 'yavaş'];

  const lowerText = text.toLowerCase();
  let score = 0;
  const keywords = [];

  positiveWords.forEach(word => {
    if (lowerText.includes(word)) {
      score += 0.2;
      keywords.push(word);
    }
  });

  negativeWords.forEach(word => {
    if (lowerText.includes(word)) {
      score -= 0.2;
      keywords.push(word);
    }
  });

  score = Math.max(-1, Math.min(1, score));

  let label = 'neutral';
  if (score >= 0.4) label = 'positive';
  else if (score >= 0.6) label = 'very_positive';
  else if (score <= -0.4) label = 'negative';
  else if (score <= -0.6) label = 'very_negative';

  const topics = [];
  if (lowerText.includes('fiyat') || lowerText.includes('ücret')) topics.push('pricing');
  if (lowerText.includes('kalite') || lowerText.includes('ürün')) topics.push('quality');
  if (lowerText.includes('teslimat') || lowerText.includes('kargo')) topics.push('delivery');
  if (lowerText.includes('destek') || lowerText.includes('yardım')) topics.push('support');

  return { score, label, keywords, topics };
}
