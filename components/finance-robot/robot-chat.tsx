'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Bot, Send, Plus, Loader2, MessageSquare, Trash2, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

interface ChatMessage {
  id?: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface ChatThread {
  id: string
  title: string
  updated_at: string
}

interface RobotChatProps {
  tenantId: string
  language: 'en' | 'tr'
  financialContext?: Record<string, unknown>
}

export function RobotChat({ tenantId, language, financialContext }: RobotChatProps) {
  const [threads, setThreads] = useState<ChatThread[]>([])
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loadingThreads, setLoadingThreads] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const tr = language === 'tr'

  const loadThreads = useCallback(async () => {
    const { data } = await supabase
      .from('finance_robot_threads')
      .select('id, title, updated_at')
      .eq('tenant_id', tenantId)
      .order('updated_at', { ascending: false })
      .limit(20)
    setThreads(data || [])
    setLoadingThreads(false)
  }, [tenantId])

  const loadMessages = useCallback(async (threadId: string) => {
    const { data } = await supabase
      .from('finance_robot_messages')
      .select('id, role, content, created_at')
      .eq('thread_id', threadId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true })

    if (data) {
      setMessages(
        data.map(m => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          timestamp: m.created_at,
        }))
      )
    }
  }, [tenantId])

  useEffect(() => {
    if (tenantId) loadThreads()
  }, [tenantId, loadThreads])

  useEffect(() => {
    if (currentThreadId) loadMessages(currentThreadId)
  }, [currentThreadId, loadMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const selectThread = (threadId: string) => {
    setCurrentThreadId(threadId)
    setMessages([])
  }

  const startNewChat = () => {
    setCurrentThreadId(null)
    setMessages([])
    setInput('')
    textareaRef.current?.focus()
  }

  const deleteThread = async (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await supabase.from('finance_robot_threads').delete().eq('id', threadId).eq('tenant_id', tenantId)
    if (currentThreadId === threadId) {
      setCurrentThreadId(null)
      setMessages([])
    }
    loadThreads()
  }

  const sendMessage = async () => {
    if (!input.trim() || sending) return

    const userMessage = input.trim()
    setInput('')
    setSending(true)

    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    }])

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        const { data: refreshData } = await supabase.auth.refreshSession()
        if (!refreshData.session) throw new Error('Not authenticated')
      }

      const token = (await supabase.auth.getSession()).data.session?.access_token

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const response = await fetch(`${supabaseUrl}/functions/v1/finance-robot-ai`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        },
        body: JSON.stringify({
          action: 'chat',
          message: userMessage,
          thread_id: currentThreadId,
          financial_context: financialContext,
          language,
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const result = await response.json()

      if (!currentThreadId && result.thread_id) {
        setCurrentThreadId(result.thread_id)
        loadThreads()
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: result.message,
        timestamp: new Date().toISOString(),
      }])
    } catch (err) {
      console.error('Chat error:', err)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: tr
          ? 'Bir hata olustu. Lutfen tekrar deneyin.'
          : 'An error occurred. Please try again.',
        timestamp: new Date().toISOString(),
      }])
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const quickPrompts = tr ? [
    'Nakit akisimi nasil iyilestirebilirim?',
    'Vadesi gecmis faturalar icin ne yapmaliyim?',
    'Giderlerimi nasil azaltabilirim?',
    'Likidite durumum hakkinda ne dusunuyorsun?',
  ] : [
    'How can I improve my cash flow?',
    'What should I do about overdue invoices?',
    'How can I reduce expenses?',
    'What do you think about my liquidity?',
  ]

  return (
    <Card className="flex h-[600px] overflow-hidden">
      {sidebarOpen && (
        <div className="w-64 border-r bg-gray-50/80 flex flex-col shrink-0">
          <div className="p-3 border-b flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">
              {tr ? 'Konusmalar' : 'Conversations'}
            </span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={startNewChat}>
                <Plus size={14} />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSidebarOpen(false)}>
                <ChevronLeft size={14} />
              </Button>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {loadingThreads ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={16} className="animate-spin text-gray-400" />
                </div>
              ) : threads.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">
                  {tr ? 'Henuz konusma yok' : 'No conversations yet'}
                </p>
              ) : (
                threads.map((thread) => (
                  <div
                    key={thread.id}
                    onClick={() => selectThread(thread.id)}
                    className={cn(
                      'group flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-colors text-sm',
                      currentThreadId === thread.id
                        ? 'bg-[#0A2540] text-white'
                        : 'hover:bg-gray-100 text-gray-700'
                    )}
                  >
                    <MessageSquare size={14} className="shrink-0 opacity-50" />
                    <span className="truncate flex-1 text-xs">{thread.title}</span>
                    <button
                      onClick={(e) => deleteThread(thread.id, e)}
                      className={cn(
                        'opacity-0 group-hover:opacity-100 shrink-0 transition-opacity p-0.5 rounded hover:bg-white/20',
                        currentThreadId === thread.id ? 'hover:bg-white/20' : 'hover:bg-gray-200'
                      )}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <CardHeader className="py-3 px-4 border-b flex-row items-center gap-3 space-y-0">
          {!sidebarOpen && (
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setSidebarOpen(true)}>
              <ChevronRight size={14} />
            </Button>
          )}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="p-1.5 rounded-lg bg-[#0A2540]">
              <Bot size={16} className="text-[#B8E6FF]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {tr ? 'Finans Robotu Chat' : 'Finance Robot Chat'}
              </h3>
              <p className="text-[11px] text-gray-500">
                {tr ? 'AI destekli finansal danismanlik' : 'AI-powered financial advisory'}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="shrink-0 text-xs h-7" onClick={startNewChat}>
            <Plus size={12} className="mr-1" />
            {tr ? 'Yeni' : 'New'}
          </Button>
        </CardHeader>

        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-8">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0A2540] to-[#1e3a5f]">
                <Bot size={32} className="text-[#B8E6FF]" />
              </div>
              <div className="text-center max-w-sm">
                <p className="text-sm font-semibold text-gray-900">
                  {tr ? 'Finans Robotu ile konusun' : 'Talk to Finance Robot'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {tr
                    ? 'Nakit akisi, faturalar, giderler, envanter ve daha fazlasi hakkinda soru sorun'
                    : 'Ask about cash flow, invoices, expenses, inventory, and more'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 max-w-md w-full">
                {quickPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(prompt); textareaRef.current?.focus() }}
                    className="text-left text-xs p-2.5 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-gray-600 leading-relaxed"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex gap-3',
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {msg.role === 'assistant' && (
                    <div className="shrink-0 w-7 h-7 rounded-lg bg-[#0A2540] flex items-center justify-center mt-0.5">
                      <Bot size={14} className="text-[#B8E6FF]" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed',
                      msg.role === 'user'
                        ? 'bg-[#0A2540] text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                    )}
                  >
                    <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                    <div className={cn(
                      'text-[10px] mt-1.5 opacity-50',
                      msg.role === 'user' ? 'text-right' : 'text-left'
                    )}>
                      {new Date(msg.timestamp).toLocaleTimeString(tr ? 'tr-TR' : 'en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex gap-3 justify-start">
                  <div className="shrink-0 w-7 h-7 rounded-lg bg-[#0A2540] flex items-center justify-center">
                    <Bot size={14} className="text-[#B8E6FF]" />
                  </div>
                  <div className="bg-gray-100 rounded-xl rounded-bl-sm px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        <CardContent className="p-3 border-t bg-white">
          <div className="flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={tr ? 'Sorunuzu yazin...' : 'Type your question...'}
              rows={1}
              className="resize-none min-h-[40px] max-h-[120px] text-sm"
              disabled={sending}
            />
            <Button
              size="icon"
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className="shrink-0 h-10 w-10 bg-[#0A2540] hover:bg-[#1e3a5f]"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  )
}
