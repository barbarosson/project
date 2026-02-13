'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageCircle, Send, X } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { useTenant } from '@/contexts/tenant-context'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Message {
  id: string
  message: string
  is_admin_reply: boolean
  sender_name: string
  created_at: string
}

interface LiveChatWidgetProps {
  onClose?: () => void
  embedded?: boolean
}

export function LiveChatWidget({ onClose, embedded = false }: LiveChatWidgetProps) {
  const { t, language } = useLanguage()
  const { tenantId } = useTenant()
  const [isOpen, setIsOpen] = useState(embedded)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [isOnline, setIsOnline] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [chatStarted, setChatStarted] = useState(false)
  const [whatsappNumber, setWhatsappNumber] = useState('+905551234567')
  const [whatsappEnabled, setWhatsappEnabled] = useState(true)

  useEffect(() => {
    checkBusinessHours()
    loadWhatsAppConfig()
    const interval = setInterval(checkBusinessHours, 60000)
    return () => clearInterval(interval)
  }, [])

  async function loadWhatsAppConfig() {
    try {
      const { data } = await supabase
        .from('site_config')
        .select('whatsapp_number, whatsapp_enabled')
        .maybeSingle()

      if (data) {
        if (data.whatsapp_number) setWhatsappNumber(data.whatsapp_number)
        if (typeof data.whatsapp_enabled === 'boolean') setWhatsappEnabled(data.whatsapp_enabled)
      }
    } catch (error) {
      console.error('Error loading WhatsApp config:', error)
    }
  }

  useEffect(() => {
    if (chatStarted && tenantId) {
      loadOrCreateSession()
    }
  }, [chatStarted, tenantId])

  useEffect(() => {
    const savedSessionId = localStorage.getItem(`chat_session_${tenantId}`)
    if (savedSessionId && tenantId) {
      setSessionId(savedSessionId)
      loadMessages(savedSessionId)
    }
  }, [tenantId])

  useEffect(() => {
    if (!sessionId) return

    const channel = supabase
      .channel(`chat:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          const newMessage = payload.new as Message
          setMessages(prev => [...prev, newMessage])
          scrollToBottom()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  function checkBusinessHours() {
    const now = new Date()
    const day = now.getDay()
    const hour = now.getHours()
    const online = day >= 1 && day <= 5 && hour >= 9 && hour < 17
    setIsOnline(online)
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  async function loadOrCreateSession() {
    if (!tenantId) return

    try {
      setLoading(true)

      const { data: existingSessions } = await supabase
        .from('support_chat_sessions')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)

      if (existingSessions && existingSessions.length > 0) {
        const session = existingSessions[0]
        setSessionId(session.id)
        localStorage.setItem(`chat_session_${tenantId}`, session.id)
        await loadMessages(session.id)
      } else {
        const { data: session, error } = await supabase
          .from('support_chat_sessions')
          .insert({
            tenant_id: tenantId,
            status: 'waiting',
            user_name: userName || 'Guest',
            user_email: userEmail || '',
            is_read_by_admin: false
          })
          .select()
          .single()

        if (error) throw error
        setSessionId(session.id)
        localStorage.setItem(`chat_session_${tenantId}`, session.id)
        await sendSystemMessage(session.id, t.support.youAreConnected)
      }
    } catch (error: any) {
      console.error('Error loading/creating session:', error)
      toast.error(error.message || 'Failed to start chat')
    } finally {
      setLoading(false)
    }
  }

  async function loadMessages(sessionId: string) {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error: any) {
      console.error('Error loading messages:', error)
    }
  }

  async function sendSystemMessage(sessionId: string, message: string) {
    await supabase.from('support_messages').insert({
      session_id: sessionId,
      tenant_id: tenantId,
      message,
      sender_name: 'System',
      is_admin_reply: true,
      is_read: true
    })
  }

  async function sendMessage() {
    if (!inputMessage.trim() || !sessionId || !tenantId) return

    try {
      const { error } = await supabase.from('support_messages').insert({
        session_id: sessionId,
        tenant_id: tenantId,
        message: inputMessage,
        sender_name: userName || 'Guest',
        is_admin_reply: false,
        is_read: false
      }).select()

      if (error) throw error
      setInputMessage('')
    } catch (error: any) {
      console.error('Error sending message:', error)
      toast.error(error.message || 'Failed to send message')
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function handleStartChat() {
    if (!userName.trim()) {
      toast.error(t.support.enterYourName)
      return
    }
    setChatStarted(true)
  }

  function renderOnlineIndicator() {
    return (
      <div className="flex items-center gap-1.5">
        <span className={`relative flex h-2.5 w-2.5`}>
          {isOnline && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7DD3FC] opacity-75" />
          )}
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isOnline ? 'bg-[#7DD3FC]' : 'bg-gray-400'}`} />
        </span>
        <span className="text-xs font-medium text-[#7DD3FC]">
          {isOnline ? t.support.online : t.support.offline}
        </span>
      </div>
    )
  }

  function renderChatForm() {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-sm space-y-5">
          <div className="text-center mb-2">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }}>
              <MessageCircle className="h-7 w-7 text-[#7DD3FC]" stroke="#7DD3FC" />
            </div>
            <p className="text-sm" style={{ color: '#425466' }}>
              {t.support.startChat}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block" style={{ color: '#0A2540' }}>{t.support.enterYourName}</label>
            <Input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="John Doe"
              className="bg-white"
              style={{ borderColor: '#E6EBF1' }}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block" style={{ color: '#0A2540' }}>{t.support.enterYourEmail}</label>
            <Input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="john@example.com"
              className="bg-white"
              style={{ borderColor: '#E6EBF1' }}
            />
          </div>
          <Button
            onClick={handleStartChat}
            className="w-full rounded-full font-semibold transition-all hover:scale-[1.02] flex-none"
            style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', color: '#7DD3FC' }}
          >
            <MessageCircle className="h-4 w-4 mr-2" stroke="#7DD3FC" />
            {t.support.startChat}
          </Button>
        </div>
      </div>
    )
  }

  function renderMessages() {
    return (
      <>
        <ScrollArea className="flex-1 p-4 bg-white">
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.is_admin_reply ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-3.5 py-2.5 ${
                    msg.is_admin_reply
                      ? 'bg-[#F6F9FC] text-[#0A2540] border border-[#E6EBF1]'
                      : 'bg-[#0A2540] text-white'
                  }`}
                >
                  <div className={`text-xs font-medium mb-1 ${msg.is_admin_reply ? 'text-[#425466]' : 'text-[#00D4AA]'}`}>
                    {msg.is_admin_reply ? t.support.supportTeam : msg.sender_name}
                  </div>
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</div>
                  <div className={`text-[10px] mt-1 ${msg.is_admin_reply ? 'text-[#425466]/60' : 'text-white/50'}`}>
                    {format(new Date(msg.created_at), 'HH:mm')}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        <div className="border-t p-3 bg-white" style={{ borderColor: '#E6EBF1' }}>
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t.support.typeYourMessage}
              disabled={loading}
              className="rounded-full bg-white"
              style={{ borderColor: '#E6EBF1' }}
            />
            <Button
              onClick={sendMessage}
              disabled={loading || !inputMessage.trim()}
              size="icon"
              className="shrink-0 rounded-full transition-all hover:scale-105 flex-none"
              style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', color: '#7DD3FC' }}
            >
              <Send className="h-4 w-4" stroke="#7DD3FC" />
            </Button>
          </div>
        </div>
      </>
    )
  }

  function renderOfflineState() {
    const whatsappMessage = encodeURIComponent(
      language === 'tr'
        ? 'Merhaba, destek almak istiyorum.'
        : 'Hello, I would like to get support.'
    )

    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center bg-white">
        <div className="w-full max-w-sm space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0A2540]/10 flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="h-7 w-7 text-[#0A2540]" />
          </div>
          <p className="text-sm" style={{ color: '#425466' }}>{t.support.currentlyOffline}</p>
          {whatsappEnabled && whatsappNumber && (
            <>
              <p className="text-xs" style={{ color: '#425466' }}>
                {language === 'tr'
                  ? 'Ancak WhatsApp üzerinden bize ulaşabilirsiniz'
                  : 'However, you can reach us via WhatsApp'}
              </p>
              <a
                href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-full text-sm font-medium transition-all hover:scale-105 shadow-md flex-none"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="currentColor"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                {language === 'tr' ? 'WhatsApp ile İletişime Geç' : 'Contact via WhatsApp'}
              </a>
            </>
          )}
        </div>
      </div>
    )
  }

  if (embedded) {
    return (
      <Card className="h-full flex flex-col bg-white flex-none" style={{ borderColor: '#E6EBF1' }}>
        <CardHeader className="border-b py-4 flex-none" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', borderColor: '#E6EBF1' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#7DD3FC]/10 flex items-center justify-center border border-[#7DD3FC]/20">
                <MessageCircle className="h-5 w-5 text-[#7DD3FC]" stroke="#7DD3FC" />
              </div>
              <CardTitle className="text-base text-[#7DD3FC]">{t.support.liveSupport}</CardTitle>
            </div>
            {renderOnlineIndicator()}
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0 bg-white overflow-hidden">
          {!isOnline ? renderOfflineState() : !chatStarted ? renderChatForm() : renderMessages()}
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-16 w-16 rounded-full z-50 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 shadow-[0_4px_24px_rgba(125,211,252,0.4)] hover:shadow-[0_6px_32px_rgba(125,211,252,0.5)]"
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
            color: '#7DD3FC',
          }}
        >
          <span className="inline-flex" style={{ color: '#7DD3FC' }}>
            <MessageCircle className="h-7 w-7" stroke="#7DD3FC" />
          </span>
          {isOnline && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7DD3FC] opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-[#7DD3FC] border-2 border-white" />
            </span>
          )}
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[380px] h-[560px] shadow-2xl rounded-2xl overflow-hidden z-50 bg-white flex-none">
          <Card className="h-full flex flex-col rounded-2xl bg-white flex-none" style={{ borderColor: '#E6EBF1' }}>
            <div className="px-4 py-4 flex-none" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#7DD3FC]/15 flex items-center justify-center border border-[#7DD3FC]/30">
                    <MessageCircle className="h-5 w-5 text-[#7DD3FC]" stroke="#7DD3FC" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#7DD3FC]">{t.support.liveSupport}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-[#7DD3FC]' : 'bg-gray-400'}`} />
                      <span className="text-[11px] text-[#7DD3FC]/80">
                        {isOnline ? t.support.online : t.support.offline}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  className="w-8 h-8 rounded-full hover:bg-[#7DD3FC]/15 flex items-center justify-center transition-colors flex-none"
                  onClick={() => {
                    setIsOpen(false)
                    onClose?.()
                  }}
                >
                  <X className="h-5 w-5 text-[#7DD3FC]" stroke="#7DD3FC" />
                </button>
              </div>
            </div>
            <CardContent className="flex-1 flex flex-col p-0 bg-white overflow-hidden">
              {!isOnline ? renderOfflineState() : !chatStarted ? renderChatForm() : renderMessages()}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
