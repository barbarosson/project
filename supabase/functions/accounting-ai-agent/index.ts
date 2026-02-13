import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.58.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

function jsonRes(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function errRes(msg: string, status = 400) {
  return jsonRes({ error: msg }, status)
}

const SYSTEM_PROMPT = `SİZİN ROLÜNÜZ: Türkiye'de muhasebe mevzuatı konusunda uzman bir Görüş Bildirme Danışmanısınız.
Muhasebe profesyonelleri, mali müşavir ve işletme yöneticilerine doğru, güncel ve kaynaklandırılmış
muhasebe mevzuatı görüşleri sunarsınız.

KAPSAM VE SINIRLAMALAR:
- Sadece Türkiye'deki muhasebe mevzuatı, standartları ve uygulamalarında görüş verin
- Vergi denetimi, vergi cezaları ve vergi mahkemesi kararları kapsamında görüş verin
- Finansal muhasebe, vergi muhasebesi, operasyonel muhasebe konularında görüş verin
- Muhasebe defterleri, belgeler, finansal raporlama ve raporlamadan sonra alınan kararlar hakkında görüş verin

KAPSAM DIŞI KONULAR:
- Hukuki danışmanlık ve yasal tavsiyeleme (bunu yapamayacağınızı açıkça belirtin)
- Vergi planlaması ve minimize etme stratejileri
- Spesifik şirket veya birey için taşıyıcı muhasebe kayıtları önerileri
- Muhasebe sistemi seçimi sonrası uygulamaya dair teknik yardım (yazılım kullanımı)

HÖKÜMLEYİCİ İLKELER:

1. KAYNAKLANMIŞLIK:
   - Her görüş sonunda kullandığınız mevzuat kaynaklarını tam olarak belirtin
   - Kaynağın adı, kanun/tebliğ numarası, madde/sıra numarası ve son güncellenme tarihi yer almalı
   - Örnek: "Vergi Usul Kanunu Madde 257 (Son Değişiklik: 2023-12-15, RG: 32455)"

2. GÜNCELLİK:
   - Belirtilen mevzuatın halen yürürlükte olup olmadığını kontrol edin
   - Eğer mevzuat yürürlükten kaldırılmışsa "Bu hüküm X tarihinde yürürlükten kaldırılmıştır" belirtin
   - Yeni bir mevzuat ilgili alanı düzenlemişse her iki kuralı karşılaştırarak açıklayın

3. STANDART SEVİYE BİLİNCİ:
   - Sorulan konunun hangi muhasebe standardı seviyesinde geçerli olduğunu açıklayın
   - MSUGT, BOBİ FRS, TMS/TFRS arasındaki farkları belirtin
   - Örnek: "Bu kural MSUGT Tebliğinde yer alır ve Vergi Usul Kanunu uyarınca uygulanır"

4. ÇELİŞKİ YÖNETİMİ:
   - Farklı standartlar arasında çelişki varsa vurgulanması zorunludur
   - Vergi kanunu ile muhasebe standardı arasında fark varsa her ikisini de açıklayın
   - Örnek: "TMS/TFRS Standardı X şekilde muhasebeleştirilmesini gerektirirken, VUK bunu Y şekilde ister"

5. SENARYO TEMELLİ YANITLAMA:
   - Sorulan konunun pratik muhasebe uygulamasında nasıl refleks ettiğini açıklayın
   - Muhasebe kayıtlarının nasıl yapılacağını örnekle gösterin
   - Sınırlamalar ve istisnalar hakkında bilgi verin

6. DİL VE TERMİNOLOJİ:
   - Muhasebe terminolojisini resmi terimleriyle kullanın
   - Türkçe muhasebe terimlerini tercih edin (İngilizce karşılığını parantez içinde belirtebilir)
   - Belirsiz ifadeler yerine teknik, kesin ifadeler kullanın

YANIT YAPISI (Bu yapıyı HER ZAMAN kullanın):

## KISA CEVAP
(1-2 cümle ile sorunun doğrudan cevabı)

## YASAL DAYANAK
(İlgili mevzuat maddeleri detaylı olarak)

## STANDART SEVİYE ANALİZİ
**MSUGT:** (Uygulanma şekli)
**BOBİ FRS:** (Uygulanma şekli)
**TMS/TFRS:** (Uygulanma şekli)

## PRATİK UYGULAMA
(Muhasebe kayıtları örneği, sınırlamalar ve istisnalar)

## KAYNAKLAR
(Kullanılan tüm mevzuat kaynakları tam referans ile)

## GÜNCELLİK NOTU
"Bu görüş [BUGÜNÜN TARİHİ] tarihi itibarıyla yürürlükte olan mevzuata dayanmaktadır."

ÖNEMLİ KURALLAR:
- Kullanıcı Türkçe soruyorsa Türkçe, İngilizce soruyorsa İngilizce yanıt verin
- İngilizce soru için de aynı yapıyı kullanın ancak başlıkları İngilizce yapın (SHORT ANSWER, LEGAL BASIS, STANDARD LEVEL ANALYSIS, PRACTICAL APPLICATION, SOURCES, CURRENCY NOTE)
- Her zaman profesyonel ve teknik olun
- Emin olmadığınız konularda "Bu konuda kesin bir görüş bildirmek için ilgili mevzuatın detaylı incelenmesi gerekmektedir" deyin
- Markdown formatlaması kullanın (tablolar, kalın metin, listeler)
- Muhasebe kayıt örneklerinde Borç/Alacak formatını kullanın`

const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'search_knowledge_base',
      description: 'Search the accounting legislation knowledge base for relevant documents, laws, and standards. Use this for any question about Turkish accounting regulations.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query in Turkish or English' },
          source_law: { type: 'string', description: 'Filter by source law code (e.g., "213" for VUK, "6102" for TTK)' },
          standard: { type: 'string', description: 'Filter by standard (MSUGT, BOBİ FRS, TMS/TFRS)' },
          status: { type: 'string', enum: ['active', 'obsolete', 'superseded'], description: 'Filter by document status' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_document_details',
      description: 'Get full details of a specific accounting legislation document by its ID',
      parameters: {
        type: 'object',
        properties: {
          document_id: { type: 'string', description: 'The document ID (e.g., "VUK_M257_2024")' },
        },
        required: ['document_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_categories',
      description: 'List all knowledge base categories for accounting legislation',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_related_documents',
      description: 'Get documents related to a specific article or topic',
      parameters: {
        type: 'object',
        properties: {
          article_id: { type: 'string', description: 'The article/document ID to find related documents for' },
        },
        required: ['article_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_change_history',
      description: 'Get the amendment/change history of a specific legislation document. Use this to show how a law or regulation has changed over time.',
      parameters: {
        type: 'object',
        properties: {
          document_id: { type: 'string', description: 'The document ID to get change history for' },
        },
        required: ['document_id'],
      },
    },
  },
]

async function executeTool(
  name: string,
  args: Record<string, unknown>,
  db: ReturnType<typeof createClient>
): Promise<string> {
  try {
    switch (name) {
      case 'search_knowledge_base': {
        let query = db
          .from('accounting_kb_documents')
          .select('id, title, source_law, article_number, article_title, summary, status, applicable_standards, last_amended_date')
          .eq('status', (args.status as string) || 'active')

        if (args.source_law) query = query.eq('source_law_code', args.source_law as string)
        if (args.standard) query = query.contains('applicable_standards', [args.standard as string])

        const searchTerm = args.query as string
        query = query.or(`title.ilike.%${searchTerm}%,article_title.ilike.%${searchTerm}%,full_text.ilike.%${searchTerm}%,summary.ilike.%${searchTerm}%`)

        const { data, error } = await query.limit(10)
        if (error) return JSON.stringify({ error: error.message })

        if (!data || data.length === 0) {
          return JSON.stringify({
            message: 'Bilgi tabaninda bu konuda kayitli belge bulunamadi. Genel muhasebe bilginizi kullanarak yanitlayin.',
            results: [],
          })
        }
        return JSON.stringify(data)
      }

      case 'get_document_details': {
        const { data, error } = await db
          .from('accounting_kb_documents')
          .select('*')
          .eq('id', args.document_id as string)
          .maybeSingle()

        if (error) return JSON.stringify({ error: error.message })
        if (!data) return JSON.stringify({ message: 'Belge bulunamadi' })
        return JSON.stringify(data)
      }

      case 'list_categories': {
        const { data, error } = await db
          .from('accounting_kb_categories')
          .select('id, name, code, description, parent_id')
          .order('id')

        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify(data || [])
      }

      case 'get_related_documents': {
        const { data: doc } = await db
          .from('accounting_kb_documents')
          .select('related_article_ids')
          .eq('id', args.article_id as string)
          .maybeSingle()

        if (!doc || !doc.related_article_ids || doc.related_article_ids.length === 0) {
          return JSON.stringify({ message: 'Iliskili belge bulunamadi', results: [] })
        }

        const { data, error } = await db
          .from('accounting_kb_documents')
          .select('id, title, source_law, article_number, summary, status')
          .in('id', doc.related_article_ids)

        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify(data || [])
      }

      case 'get_change_history': {
        const { data, error } = await db
          .from('accounting_kb_change_history')
          .select('id, amendment_date, amendment_text, gazette_number, gazette_date')
          .eq('document_id', args.document_id as string)
          .order('amendment_date', { ascending: false })

        if (error) return JSON.stringify({ error: error.message })
        if (!data || data.length === 0) {
          return JSON.stringify({ message: 'Bu belge icin degisiklik gecmisi bulunamadi', results: [] })
        }
        return JSON.stringify(data)
      }

      default:
        return JSON.stringify({ error: 'Unknown function' })
    }
  } catch (error: any) {
    return JSON.stringify({ error: error.message })
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return errRes('Missing authorization', 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const openaiKey = Deno.env.get('OPENAI_API_KEY')

    if (!supabaseUrl || !anonKey || !serviceKey) {
      return errRes('Server configuration error', 500)
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await authClient.auth.getUser()
    if (authError || !user) return errRes('Unauthorized', 401)

    const body = await req.json()
    const { action } = body

    const db = createClient(supabaseUrl, serviceKey)

    if (action === 'chat') {
      if (!openaiKey) return errRes('AI service not configured (OPENAI_API_KEY missing)', 500)
      return await handleChat(body, db, openaiKey)
    } else if (action === 'feedback') {
      return await handleFeedback(body, db)
    } else if (action === 'search_kb') {
      return await handleSearchKB(body, db)
    } else {
      return errRes('Invalid action. Use "chat", "feedback", or "search_kb"')
    }
  } catch (error: any) {
    console.error('Accounting AI Error:', error)
    return errRes(error.message || 'Internal error', 500)
  }
})

async function handleChat(
  body: { message: string; thread_id?: string; tenant_id: string; language?: string },
  db: ReturnType<typeof createClient>,
  openaiKey: string,
) {
  const { message, tenant_id, language } = body
  let { thread_id } = body

  if (!message?.trim()) return errRes('Message is required')
  if (!tenant_id) return errRes('Missing tenant_id')

  const startTime = Date.now()

  if (!thread_id) {
    const title = message.substring(0, 60) + (message.length > 60 ? '...' : '')
    const { data: thread, error } = await db
      .from('accounting_ai_threads')
      .insert({ tenant_id, title })
      .select('id')
      .single()

    if (error || !thread) return errRes('Failed to create thread', 500)
    thread_id = thread.id
  }

  await db.from('accounting_ai_messages').insert({
    thread_id,
    tenant_id,
    role: 'user',
    content: message,
  })

  const { data: history } = await db
    .from('accounting_ai_messages')
    .select('role, content')
    .eq('thread_id', thread_id)
    .order('created_at', { ascending: true })
    .limit(20)

  const prevMessages = (history || []).map((m: { role: string; content: string }) => ({
    role: m.role as 'user' | 'assistant' | 'system',
    content: m.content,
  }))

  const now = new Date()
  const currentDate = now.toISOString().split('T')[0]

  const systemContent = SYSTEM_PROMPT.replace('[BUGÜNÜN TARİHİ]', currentDate) +
    `\n\nBugünün Tarihi: ${currentDate}` +
    `\nDil Tercihi: ${language === 'en' ? 'İngilizce' : 'Türkçe (varsayılan)'}`

  const messages: any[] = [
    { role: 'system', content: systemContent },
    ...prevMessages,
  ]

  let aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      tools: TOOL_DEFINITIONS,
      tool_choice: 'auto',
      temperature: 0.3,
      max_tokens: 3000,
    }),
  })

  if (!aiResponse.ok) {
    const errText = await aiResponse.text()
    console.error('OpenAI error:', errText)
    throw new Error(`OpenAI API error: ${aiResponse.status}`)
  }

  let responseData = await aiResponse.json()
  let assistantMsg = responseData.choices?.[0]?.message

  if (!assistantMsg) throw new Error('Invalid OpenAI response')

  let toolIterations = 0
  while (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0 && toolIterations < 5) {
    toolIterations++
    messages.push(assistantMsg)

    for (const toolCall of assistantMsg.tool_calls) {
      const fnName = toolCall.function.name
      const fnArgs = JSON.parse(toolCall.function.arguments)
      const result = await executeTool(fnName, fnArgs, db)

      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: result,
      })
    }

    aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        tools: TOOL_DEFINITIONS,
        tool_choice: 'auto',
        temperature: 0.3,
        max_tokens: 3000,
      }),
    })

    if (!aiResponse.ok) throw new Error(`OpenAI API error: ${aiResponse.status}`)
    responseData = await aiResponse.json()
    assistantMsg = responseData.choices?.[0]?.message
    if (!assistantMsg) throw new Error('Invalid OpenAI response in tool loop')
  }

  const responseTimeMs = Date.now() - startTime

  await db.from('accounting_ai_messages').insert({
    thread_id,
    tenant_id,
    role: 'assistant',
    content: assistantMsg.content,
    response_quality: { response_time_ms: responseTimeMs, tool_calls_count: toolIterations },
  })

  await db
    .from('accounting_ai_threads')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', thread_id)

  return jsonRes({
    message: assistantMsg.content,
    thread_id,
    response_time_ms: responseTimeMs,
  })
}

async function handleFeedback(
  body: { message_id: string; tenant_id: string; solved_problem?: string; is_accurate?: string; is_clear?: string; comment?: string },
  db: ReturnType<typeof createClient>,
) {
  const { message_id, tenant_id, solved_problem, is_accurate, is_clear, comment } = body

  if (!message_id || !tenant_id) return errRes('Missing message_id or tenant_id')

  const { error } = await db.from('accounting_ai_feedback').insert({
    message_id,
    tenant_id,
    solved_problem: solved_problem || 'yes',
    is_accurate: is_accurate || 'yes',
    is_clear: is_clear || 'very_clear',
    comment: comment || '',
  })

  if (error) return errRes(error.message, 500)
  return jsonRes({ success: true })
}

async function handleSearchKB(
  body: { query: string; source_law?: string; standard?: string },
  db: ReturnType<typeof createClient>,
) {
  const { query, source_law, standard } = body
  if (!query?.trim()) return errRes('Query is required')

  let q = db
    .from('accounting_kb_documents')
    .select('id, title, source_law, article_number, article_title, summary, status, applicable_standards, last_amended_date')
    .eq('status', 'active')

  if (source_law) q = q.eq('source_law_code', source_law)
  if (standard) q = q.contains('applicable_standards', [standard])

  q = q.or(`title.ilike.%${query}%,article_title.ilike.%${query}%,summary.ilike.%${query}%`)

  const { data, error } = await q.limit(20)
  if (error) return errRes(error.message, 500)

  return jsonRes({ results: data || [], count: data?.length || 0 })
}
