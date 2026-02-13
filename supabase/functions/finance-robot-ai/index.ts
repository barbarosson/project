import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message }, status)
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return errorResponse('Missing authorization', 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const openaiKey = Deno.env.get('OPENAI_API_KEY')

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await authClient.auth.getUser()
    if (authError || !user) return errorResponse('Unauthorized', 401)

    const serviceClient = createClient(supabaseUrl, serviceRoleKey)
    const tenantId = user.id

    const body = await req.json()
    const { action } = body

    if (action === 'chat') {
      if (!openaiKey) return errorResponse('OpenAI API key not configured', 500)
      return await handleChat(body, tenantId, serviceClient, openaiKey)
    } else if (action === 'analyze_scenario') {
      if (!openaiKey) return errorResponse('OpenAI API key not configured', 500)
      return await analyzeScenario(body, openaiKey)
    } else if (action === 'generate_recommendations') {
      if (!openaiKey) return errorResponse('OpenAI API key not configured', 500)
      return await generateRecommendations(body, openaiKey)
    } else {
      return errorResponse('Invalid action. Use "chat", "analyze_scenario", or "generate_recommendations"')
    }
  } catch (error) {
    console.error('Error:', error)
    return errorResponse(error.message || 'Internal error', 500)
  }
})

async function handleChat(
  body: { message: string; thread_id?: string; financial_context?: Record<string, unknown>; language?: string },
  tenantId: string,
  db: ReturnType<typeof createClient>,
  openaiKey: string
) {
  const { message, financial_context, language = 'en' } = body
  let { thread_id } = body

  if (!message?.trim()) return errorResponse('Message is required')

  if (!thread_id) {
    const title = message.substring(0, 60) + (message.length > 60 ? '...' : '')
    const { data: thread, error } = await db
      .from('finance_robot_threads')
      .insert({ tenant_id: tenantId, title, context_snapshot: financial_context || null })
      .select('id')
      .single()

    if (error || !thread) {
      console.error('Thread creation error:', error)
      return errorResponse('Failed to create thread', 500)
    }
    thread_id = thread.id
  }

  await db.from('finance_robot_messages').insert({
    thread_id,
    tenant_id: tenantId,
    role: 'user',
    content: message,
  })

  const { data: history } = await db
    .from('finance_robot_messages')
    .select('role, content')
    .eq('thread_id', thread_id)
    .order('created_at', { ascending: true })
    .limit(20)

  const previousMessages = (history || []).map((m: { role: string; content: string }) => ({
    role: m.role as 'user' | 'assistant' | 'system',
    content: m.content,
  }))

  const now = new Date()
  let systemPrompt = language === 'tr'
    ? `Sen "Finans Robotu" adlı yapay zeka destekli bir finansal danışman ve nakit akışı uzmanısın. Tarih: ${now.toISOString().split('T')[0]}.

Görevin:
- İşletmenin finansal durumunu analiz etmek
- Nakit akışı, karlılık, likidite konularında stratejik öneriler sunmak
- Soruları doğrudan, somut ve uygulanabilir şekilde yanıtlamak
- Riskleri tespit edip çözüm yolları önermek

Kurallar:
- Her zaman Türkçe yanıt ver (kullanıcı İngilizce sorarsa İngilizce)
- Somut rakamlar ve yüzdeler kullan
- Adım adım eylem planları sun
- Kısa, net ve profesyonel ol
- Gereksiz jargondan kaçın, anlaşılır ifadeler kullan`
    : `You are "Finance Robot", an AI-powered financial advisor and cash flow expert. Date: ${now.toISOString().split('T')[0]}.

Your role:
- Analyze business financial health
- Provide strategic recommendations on cash flow, profitability, liquidity
- Answer questions directly with concrete, actionable advice
- Identify risks and suggest mitigation strategies

Rules:
- Use specific numbers and percentages
- Provide step-by-step action plans
- Be concise, clear, and professional
- Avoid unnecessary jargon`

  if (financial_context) {
    const ctx = financial_context as Record<string, unknown>
    systemPrompt += `\n\nCurrent Financial Context:`
    if (ctx.overallScore) systemPrompt += `\n- Overall Health Score: ${ctx.overallScore}/100`
    if (ctx.netProfit !== undefined) systemPrompt += `\n- Net Profit: ${ctx.netProfit}`
    if (ctx.profitMargin !== undefined) systemPrompt += `\n- Profit Margin: ${ctx.profitMargin}%`
    if (ctx.cashOnHand !== undefined) systemPrompt += `\n- Cash on Hand: ${ctx.cashOnHand}`
    if (ctx.netCashFlow !== undefined) systemPrompt += `\n- Net Cash Flow (30d): ${ctx.netCashFlow}`
    if (ctx.totalRevenue !== undefined) systemPrompt += `\n- Total Revenue: ${ctx.totalRevenue}`
    if (ctx.totalExpenses !== undefined) systemPrompt += `\n- Total Expenses: ${ctx.totalExpenses}`
    if (ctx.overdueInvoices !== undefined) systemPrompt += `\n- Overdue Invoices: ${ctx.overdueInvoices}`
    if (ctx.lowStockProducts !== undefined) systemPrompt += `\n- Low Stock Products: ${ctx.lowStockProducts}`
    if (ctx.activeCustomers !== undefined) systemPrompt += `\n- Active Customers: ${ctx.activeCustomers}`
    if (ctx.atRiskCustomers !== undefined) systemPrompt += `\n- At-Risk Customers: ${ctx.atRiskCustomers}`
    if (ctx.liquidityRatio !== undefined) systemPrompt += `\n- Liquidity Ratio: ${ctx.liquidityRatio}`
    if (ctx.recommendations) systemPrompt += `\n- Current Recommendations: ${JSON.stringify(ctx.recommendations)}`
  }

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...previousMessages,
  ]

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 1500,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('OpenAI error:', errText)
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const assistantMessage = data.choices[0].message.content

    await db.from('finance_robot_messages').insert({
      thread_id,
      tenant_id: tenantId,
      role: 'assistant',
      content: assistantMessage,
    })

    return jsonResponse({
      message: assistantMessage,
      thread_id,
    })
  } catch (error) {
    console.error('Chat error:', error)
    return errorResponse('Failed to generate response', 500)
  }
}

async function analyzeScenario(
  body: { scenario: string; context?: Record<string, unknown> },
  openaiKey: string
) {
  const { scenario, context } = body

  const systemPrompt = 'You are an expert financial advisor specializing in cash flow management, business finance, and strategic planning.'

  let userPrompt = `Analyze the following business scenario and provide detailed insights:\n\nScenario: ${scenario}`

  if (context) {
    userPrompt += '\n\nBusiness Context:'
    for (const [key, val] of Object.entries(context)) {
      if (val !== undefined && val !== null) userPrompt += `\n- ${key}: ${val}`
    }
  }

  userPrompt += `\n\nProvide:\n1. Key Issues\n2. Short-term Recommendations (0-3 months)\n3. Long-term Strategy (3-12 months)\n4. Risk Assessment\n5. Expected Outcomes\n\nBe specific, actionable, and focus on cash flow impact.`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`)

    const data = await response.json()
    return jsonResponse({
      scenario,
      analysis: data.choices[0].message.content,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Scenario error:', error)
    return errorResponse('Failed to analyze scenario', 500)
  }
}

async function generateRecommendations(
  body: { metrics: Record<string, number>; risks: Array<Record<string, string>>; language?: string },
  openaiKey: string
) {
  const { metrics, risks, language = 'en' } = body
  const tr = language === 'tr'

  const systemPrompt = tr
    ? 'Siz bir finansal danışman ve nakit akışı uzmanısınız.'
    : 'You are a financial advisor and cash flow expert.'

  const userPrompt = tr
    ? `Aşağıdaki metriklere dayanarak 3-5 finansal öneri oluşturun:\n\nMetrikler: ${JSON.stringify(metrics)}\nRiskler: ${JSON.stringify(risks)}\n\nSadece JSON array döndürün.`
    : `Based on these metrics, generate 3-5 financial recommendations:\n\nMetrics: ${JSON.stringify(metrics)}\nRisks: ${JSON.stringify(risks)}\n\nReturn only a JSON array.`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`)

    const data = await response.json()
    const content = data.choices[0].message.content
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON found in response')

    const recommendations = JSON.parse(jsonMatch[0])
    return jsonResponse({ recommendations, count: recommendations.length, timestamp: new Date().toISOString() })
  } catch (error) {
    console.error('Recommendations error:', error)
    return errorResponse('Failed to generate recommendations', 500)
  }
}
