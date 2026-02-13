'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Toaster } from '@/components/ui/sonner'
import {
  Scale, Send, Bot, Loader2, Plus, MessageSquare,
  Sparkles, BookOpen, ShieldCheck, Clock
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/contexts/tenant-context'
import { useLanguage } from '@/contexts/language-context'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { AccountingChatMessage } from '@/components/accounting-ai/chat-message'
import { FeedbackDialog } from '@/components/accounting-ai/feedback-dialog'
import { SampleQuestions } from '@/components/accounting-ai/sample-questions'

interface ChatMessage {
  id?: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Thread {
  id: string
  title: string
  updated_at: string
}

export default function AccountingAIPage() {
  const { tenantId, loading: tenantLoading } = useTenant()
  const { language } = useLanguage()
  const isTR = language === 'tr'

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [threads, setThreads] = useState<Thread[]>([])
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackMessageId, setFeedbackMessageId] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (!tenantLoading && tenantId) loadThreads()
  }, [tenantId, tenantLoading])

  useEffect(() => {
    if (currentThreadId && tenantId) loadThreadHistory(currentThreadId)
  }, [currentThreadId, tenantId])

  async function loadThreads() {
    if (!tenantId) return
    const { data } = await supabase
      .from('accounting_ai_threads')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('updated_at', { ascending: false })
      .limit(15)
    setThreads(data || [])
  }

  async function loadThreadHistory(threadId: string) {
    if (!tenantId) return
    setLoadingHistory(true)
    try {
      const { data } = await supabase
        .from('accounting_ai_messages')
        .select('id, role, content, created_at')
        .eq('thread_id', threadId)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: true })

      const msgs: ChatMessage[] = (data || [])
        .filter((m: any) => m.role !== 'system')
        .map((m: any) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          timestamp: new Date(m.created_at),
        }))
      setMessages(msgs)
    } finally {
      setLoadingHistory(false)
    }
  }

  function startNewChat() {
    setCurrentThreadId(null)
    setMessages([])
  }

  async function sendMessage(text?: string) {
    const msg = (text || input).trim()
    if (!msg || !tenantId) return

    const userMsg: ChatMessage = { role: 'user', content: msg, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
      if (refreshError || !refreshData.session) throw new Error('Not authenticated')

      const accessToken = refreshData.session.access_token
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000)

      const response = await fetch(`${supabaseUrl}/functions/v1/accounting-ai-agent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'apikey': anonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'chat',
          message: msg,
          thread_id: currentThreadId,
          tenant_id: tenantId,
          language,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        let errorData: any
        try { errorData = JSON.parse(errorText) } catch { errorData = { error: errorText } }
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const result = await response.json()

      if (!currentThreadId && result.thread_id) {
        setCurrentThreadId(result.thread_id)
        loadThreads()
      }

      const assistantMsg: ChatMessage = {
        id: result.message_id,
        role: 'assistant',
        content: result.message,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch (error: any) {
      let errorMsg: string
      if (error.name === 'AbortError') {
        errorMsg = isTR ? 'Istek zaman asimina ugradi. Lutfen daha kisa bir soru deneyin.' : 'Request timed out. Please try a shorter question.'
      } else {
        errorMsg = isTR ? `Hata: ${error.message}` : `Error: ${error.message}`
      }
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg, timestamp: new Date() }])
    } finally {
      setLoading(false)
    }
  }

  function handleFeedbackClick(messageId: string, type: 'positive' | 'negative') {
    if (type === 'negative') {
      setFeedbackMessageId(messageId)
      setShowFeedback(true)
    } else {
      submitFeedback(messageId, { solved_problem: 'yes', is_accurate: 'yes', is_clear: 'very_clear', comment: '' })
    }
  }

  async function submitFeedback(messageId: string, feedback: any) {
    try {
      const { data: refreshData } = await supabase.auth.refreshSession()
      if (!refreshData.session) return

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

      await fetch(`${supabaseUrl}/functions/v1/accounting-ai-agent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${refreshData.session.access_token}`,
          'apikey': anonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'feedback',
          message_id: messageId,
          tenant_id: tenantId,
          ...feedback,
        }),
      })
      toast.success(isTR ? 'Geri bildiriminiz kaydedildi' : 'Feedback recorded')
    } catch {
      toast.error(isTR ? 'Geri bildirim gonderilemedi' : 'Failed to send feedback')
    }
  }

  const stats = [
    { icon: BookOpen, label: isTR ? 'Mevzuat Kapsami' : 'Legislation Coverage', value: 'VUK, TTK, TMS/TFRS, BOBİ FRS' },
    { icon: ShieldCheck, label: isTR ? 'Kalite Standardi' : 'Quality Standard', value: isTR ? '%99+ Dogruluk' : '99%+ Accuracy' },
    { icon: Clock, label: isTR ? 'Guncellik' : 'Currency', value: isTR ? 'Canli Mevzuat Takibi' : 'Live Legislation Tracking' },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600">
              <Scale className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {isTR ? 'Muhasebe AI Danismani' : 'Accounting AI Advisor'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isTR
                  ? 'Turk muhasebe mevzuati, standartlari ve uygulamalari hakkinda uzman gorusleri'
                  : 'Expert opinions on Turkish accounting legislation, standards and practices'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
              <Sparkles className="h-3 w-3 mr-1" />
              {isTR ? 'Mevzuat Tabanli' : 'Legislation-Based'}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {stats.map((s, i) => (
            <Card key={i} className="bg-gradient-to-br from-gray-50 to-white">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-50">
                  <s.icon className="h-4 w-4 text-teal-600" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{s.label}</p>
                  <p className="text-sm font-bold text-[#0A2540]">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-12">
          <div className="md:col-span-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{isTR ? 'Gorusmeler' : 'Conversations'}</CardTitle>
                <Button size="sm" onClick={startNewChat} className="w-full mt-2 bg-teal-600 hover:bg-teal-700">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  {isTR ? 'Yeni Sohbet' : 'New Chat'}
                </Button>
              </CardHeader>
              <CardContent className="p-2">
                <div className="space-y-1 max-h-[500px] overflow-y-auto">
                  {threads.map((thread) => (
                    <button
                      key={thread.id}
                      onClick={() => setCurrentThreadId(thread.id)}
                      className={`w-full text-left p-2.5 rounded-lg text-sm transition-colors ${
                        currentThreadId === thread.id
                          ? 'bg-teal-50 text-teal-800 border border-teal-200'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                        <span className="font-medium truncate">{thread.title}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground ml-5.5 mt-0.5">
                        {format(new Date(thread.updated_at), 'dd.MM.yyyy HH:mm')}
                      </p>
                    </button>
                  ))}
                  {threads.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      {isTR ? 'Henuz gorusme yok' : 'No conversations yet'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-9">
            <Card className="border-teal-100">
              <CardHeader className="pb-3 border-b bg-gradient-to-r from-teal-50/50 to-emerald-50/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-teal-400 to-emerald-600">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-[#0A2540]">
                        {isTR ? 'Muhasebe Mevzuati Gorus Bildirme AI' : 'Accounting Legislation AI Advisor'}
                      </CardTitle>
                      <p className="text-[10px] text-muted-foreground">
                        {isTR ? 'VUK, TMS/TFRS, BOBİ FRS, MSUGT | Kaynaklandi rilmis Gorusler' : 'VUK, TMS/TFRS, BOBİ FRS, MSUGT | Cited Opinions'}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700 text-[10px]">
                    {isTR ? 'Canli' : 'Live'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loadingHistory ? (
                  <div className="flex items-center justify-center h-[500px]">
                    <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
                  </div>
                ) : (
                  <>
                    <div className="p-4 h-[500px] overflow-y-auto space-y-4 bg-gray-50/30">
                      {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full">
                          <div className="p-4 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 mb-4">
                            <Scale className="h-10 w-10 text-teal-600" />
                          </div>
                          <h3 className="font-bold text-lg mb-1 text-[#0A2540]">
                            {isTR ? 'Muhasebe Mevzuati Danismani' : 'Accounting Legislation Advisor'}
                          </h3>
                          <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
                            {isTR
                              ? 'Turk muhasebe mevzuati, standartlari ve uygulamalari hakkinda sorularinizi sorun. Her gorus kaynaklari ile birlikte sunulur.'
                              : 'Ask questions about Turkish accounting legislation, standards and practices. Every opinion is provided with citations.'}
                          </p>
                          <SampleQuestions onSelect={q => sendMessage(q)} isTR={isTR} />
                        </div>
                      )}

                      {messages.map((msg, idx) => (
                        <AccountingChatMessage
                          key={idx}
                          role={msg.role}
                          content={msg.content}
                          timestamp={msg.timestamp}
                          messageId={msg.id}
                          onFeedback={handleFeedbackClick}
                          isTR={isTR}
                        />
                      ))}

                      {loading && (
                        <div className="flex gap-3 justify-start">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center">
                            <Bot className="h-4 w-4 text-white animate-pulse" />
                          </div>
                          <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 border shadow-sm">
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1">
                                <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-delay:100ms]" />
                                <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-delay:200ms]" />
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {isTR ? 'Mevzuat inceleniyor...' : 'Reviewing legislation...'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    <div className="p-4 border-t bg-white">
                      <div className="flex gap-2">
                        <Textarea
                          placeholder={isTR
                            ? 'Muhasebe mevzuati hakkinda sorunuzu yazin...'
                            : 'Ask about Turkish accounting legislation...'}
                          value={input}
                          onChange={e => setInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              sendMessage()
                            }
                          }}
                          disabled={loading}
                          className="min-h-[50px] max-h-[120px] resize-none"
                        />
                        <Button
                          onClick={() => sendMessage()}
                          disabled={loading || !input.trim()}
                          className="bg-teal-600 hover:bg-teal-700 self-end h-[50px] px-4"
                        >
                          {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Send className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-2">
                        {isTR
                          ? 'Bu sistem muhasebe mevzuati hakkinda bilgilendirme amaclidir. Kesin hukuki danismanlik yerine gecmez.'
                          : 'This system is for informational purposes about accounting legislation. It does not replace definitive legal advice.'}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {feedbackMessageId && (
        <FeedbackDialog
          open={showFeedback}
          onOpenChange={open => {
            setShowFeedback(open)
            if (!open) setFeedbackMessageId(null)
          }}
          onSubmit={async (feedback) => {
            if (feedbackMessageId) await submitFeedback(feedbackMessageId, feedback)
          }}
          isTR={isTR}
        />
      )}

      <Toaster />
    </DashboardLayout>
  )
}
