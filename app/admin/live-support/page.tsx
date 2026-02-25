'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MessageCircle, Send, Circle, X, User, Mail, Clock, Plus, Loader2 } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { useTenant } from '@/contexts/tenant-context'
import { useRouteGuard } from '@/hooks/use-route-guard'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface ChatSession {
  id: string
  user_name: string
  user_email: string
  status: string
  is_read_by_admin: boolean
  created_at: string
  updated_at: string
  unread_count?: number
}

interface Message {
  id: string
  message: string
  is_admin_reply: boolean
  sender_name: string
  created_at: string
  is_read: boolean
}

interface Customer {
  id: string
  name: string
  company_title?: string
  email: string
}

export default function LiveSupportManagementPage() {
  const { loading: authLoading } = useRouteGuard('admin')
  const { t, language } = useLanguage()
  const { tenantId, loading: tenantLoading } = useTenant()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // New chat dialog states
  const [newChatDialogOpen, setNewChatDialogOpen] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<string>('')
  const [newChatName, setNewChatName] = useState('')
  const [newChatEmail, setNewChatEmail] = useState('')
  const [newChatMessage, setNewChatMessage] = useState('')
  const [useExistingCustomer, setUseExistingCustomer] = useState(true)

  useEffect(() => {
    if (!tenantLoading && tenantId) {
      loadChatSessions()
      loadCustomers()
    }
  }, [tenantId, tenantLoading])

  // Subscribe to new sessions
  useEffect(() => {
    if (!tenantId) return

    const channel = supabase
      .channel('support-sessions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_chat_sessions',
          filter: `tenant_id=eq.${tenantId}`
        },
        () => {
          loadChatSessions()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenantId])

  // Subscribe to new messages for selected session
  useEffect(() => {
    if (!selectedSession) return

    const channel = supabase
      .channel(`messages:${selectedSession.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `session_id=eq.${selectedSession.id}`
        },
        (payload: any) => {
          const newMessage = payload.new as Message
          setMessages(prev => [...prev, newMessage])
          scrollToBottom()

          // Mark as read if it's from user
          if (!newMessage.is_admin_reply) {
            markMessageAsRead(newMessage.id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedSession])

  // Load messages when session is selected
  useEffect(() => {
    if (selectedSession) {
      loadMessages(selectedSession.id)
      markSessionAsRead(selectedSession.id)
    }
  }, [selectedSession])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  async function loadChatSessions() {
    if (!tenantId) return

    try {
      setLoading(true)

      // Load sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('support_chat_sessions')
        .select('*')
        .eq('tenant_id', tenantId)
        .in('status', ['active', 'waiting'])
        .order('updated_at', { ascending: false })

      if (sessionsError) throw sessionsError

      // Load unread count for each session
      const sessionsWithUnread = await Promise.all(
        (sessionsData || []).map(async (session: any) => {
          const { count } = await supabase
            .from('support_messages')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', session.id)
            .eq('is_admin_reply', false)
            .eq('is_read', false)

          return {
            ...session,
            unread_count: count || 0
          }
        })
      )

      setSessions(sessionsWithUnread)
    } catch (error: any) {
      console.error('Error loading chat sessions:', error)
      toast.error(error.message || 'Failed to load chat sessions')
    } finally {
      setLoading(false)
    }
  }

  async function loadCustomers() {
    if (!tenantId) return

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, company_title, email')
        .eq('tenant_id', tenantId)
        .order('name', { ascending: true })
        .limit(100)

      if (error) throw error
      setCustomers(data || [])
    } catch (error: any) {
      console.error('Error loading customers:', error)
    }
  }

  async function startNewChat() {
    if (!tenantId) return

    let userName = ''
    let userEmail = ''

    if (useExistingCustomer) {
      if (!selectedCustomer) {
        toast.error(language === 'tr' ? 'Lütfen bir müşteri seçin' : 'Please select a customer')
        return
      }
      const customer = customers.find(c => c.id === selectedCustomer)
      if (!customer) return
      userName = customer.company_title || customer.name
      userEmail = customer.email || ''
    } else {
      if (!newChatName.trim()) {
        toast.error(language === 'tr' ? 'Lütfen isim girin' : 'Please enter a name')
        return
      }
      userName = newChatName.trim()
      userEmail = newChatEmail.trim()
    }

    if (!newChatMessage.trim()) {
      toast.error(language === 'tr' ? 'Lütfen başlangıç mesajı girin' : 'Please enter an initial message')
      return
    }

    try {
      // Create new session
      const { data: session, error: sessionError } = await supabase
        .from('support_chat_sessions')
        .insert({
          tenant_id: tenantId,
          user_name: userName,
          user_email: userEmail,
          status: 'active',
          is_read_by_admin: true
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      // Send initial message from admin
      const { error: messageError } = await supabase
        .from('support_messages')
        .insert({
          session_id: session.id,
          tenant_id: tenantId,
          message: newChatMessage.trim(),
          sender_name: t.support.supportTeam,
          is_admin_reply: true,
          is_read: true
        })

      if (messageError) throw messageError

      toast.success(language === 'tr' ? 'Sohbet başarıyla başlatıldı' : 'Chat started successfully')

      // Reset form
      setNewChatDialogOpen(false)
      setSelectedCustomer('')
      setNewChatName('')
      setNewChatEmail('')
      setNewChatMessage('')

      // Reload sessions and select the new one
      await loadChatSessions()
      setSelectedSession(session)
    } catch (error: any) {
      console.error('Error starting new chat:', error)
      toast.error(error.message || (language === 'tr' ? 'Sohbet başlatılamadı' : 'Failed to start chat'))
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

      // Mark unread messages as read
      const unreadMessages = data?.filter((m: any) => !m.is_admin_reply && !m.is_read) || []
      for (const msg of unreadMessages) {
        await markMessageAsRead(msg.id)
      }
    } catch (error: any) {
      console.error('Error loading messages:', error)
      toast.error(error.message || 'Failed to load messages')
    }
  }

  async function markSessionAsRead(sessionId: string) {
    try {
      await supabase
        .from('support_chat_sessions')
        .update({ is_read_by_admin: true })
        .eq('id', sessionId)
    } catch (error: any) {
      console.error('Error marking session as read:', error)
    }
  }

  async function markMessageAsRead(messageId: string) {
    try {
      await supabase
        .from('support_messages')
        .update({ is_read: true })
        .eq('id', messageId)
    } catch (error: any) {
      console.error('Error marking message as read:', error)
    }
  }

  async function sendMessage() {
    if (!inputMessage.trim() || !selectedSession || !tenantId) return

    try {
      const { error } = await supabase.from('support_messages').insert({
        session_id: selectedSession.id,
        tenant_id: tenantId,
        message: inputMessage,
        sender_name: t.support.supportTeam,
        is_admin_reply: true,
        is_read: true
      })

      if (error) throw error

      // Update session status to active
      await supabase
        .from('support_chat_sessions')
        .update({ status: 'active' })
        .eq('id', selectedSession.id)

      setInputMessage('')
    } catch (error: any) {
      console.error('Error sending message:', error)
      toast.error(error.message || 'Failed to send message')
    }
  }

  async function closeChat() {
    if (!selectedSession) return

    try {
      await supabase
        .from('support_chat_sessions')
        .update({ status: 'closed', closed_at: new Date().toISOString() })
        .eq('id', selectedSession.id)

      toast.success(t.support.chatClosed)
      setSelectedSession(null)
      setMessages([])
      loadChatSessions()
    } catch (error: any) {
      console.error('Error closing chat:', error)
      toast.error(error.message || 'Failed to close chat')
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function getAvatarColor(name: string) {
    const colors = [
      { bg: 'bg-blue-100', text: 'text-blue-600' },
      { bg: 'bg-purple-100', text: 'text-purple-600' },
      { bg: 'bg-pink-100', text: 'text-pink-600' },
      { bg: 'bg-orange-100', text: 'text-orange-600' },
      { bg: 'bg-teal-100', text: 'text-teal-600' },
      { bg: 'bg-cyan-100', text: 'text-cyan-600' },
      { bg: 'bg-amber-100', text: 'text-amber-600' },
      { bg: 'bg-emerald-100', text: 'text-emerald-600' }
    ]

    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  if (loading || tenantLoading || authLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-[#00D4AA]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t.support.liveSupportManagement}</h1>
          <p className="text-gray-500 mt-1">
            {language === 'tr'
              ? 'Müşterilerinizle gerçek zamanlı sohbet edin'
              : 'Chat with your customers in real-time'}
          </p>
        </div>
          <div className="flex items-center gap-3">
            <Badge variant="default" className="bg-green-500">
              <Circle className="h-2 w-2 mr-1 fill-white" />
              {sessions.length} {t.support.activeChatSessions}
            </Badge>
            <Dialog open={newChatDialogOpen} onOpenChange={setNewChatDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#00D4AA] hover:bg-[#00B894]">
                  <Plus className="h-4 w-4 mr-2" />
                  {language === 'tr' ? 'Yeni Sohbet Başlat' : 'Start New Chat'}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{language === 'tr' ? 'Yeni Sohbet Başlat' : 'Start New Chat'}</DialogTitle>
                  <DialogDescription>
                    {language === 'tr'
                      ? 'Bir müşteri ile yeni sohbet başlatın'
                      : 'Start a new chat with a customer'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      variant={useExistingCustomer ? 'default' : 'outline'}
                      onClick={() => setUseExistingCustomer(true)}
                      className="flex-1"
                    >
                      {language === 'tr' ? 'Mevcut Müşteri' : 'Existing Customer'}
                    </Button>
                    <Button
                      variant={!useExistingCustomer ? 'default' : 'outline'}
                      onClick={() => setUseExistingCustomer(false)}
                      className="flex-1"
                    >
                      {language === 'tr' ? 'Yeni Kişi' : 'New Contact'}
                    </Button>
                  </div>

                  {useExistingCustomer ? (
                    <div>
                      <Label>{language === 'tr' ? 'Müşteri Seç' : 'Select Customer'}</Label>
                      <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                        <SelectTrigger>
                          <SelectValue placeholder={language === 'tr' ? 'Müşteri seçin...' : 'Select customer...'} />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.company_title || customer.name} {customer.email ? `(${customer.email})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <>
                      <div>
                        <Label>{language === 'tr' ? 'İsim' : 'Name'}</Label>
                        <Input
                          value={newChatName}
                          onChange={(e) => setNewChatName(e.target.value)}
                          placeholder={language === 'tr' ? 'Müşteri ismi' : 'Customer name'}
                        />
                      </div>
                      <div>
                        <Label>{language === 'tr' ? 'E-posta (Opsiyonel)' : 'Email (Optional)'}</Label>
                        <Input
                          type="email"
                          value={newChatEmail}
                          onChange={(e) => setNewChatEmail(e.target.value)}
                          placeholder="customer@example.com"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <Label>{language === 'tr' ? 'Başlangıç Mesajı' : 'Initial Message'}</Label>
                    <Textarea
                      value={newChatMessage}
                      onChange={(e) => setNewChatMessage(e.target.value)}
                      placeholder={language === 'tr'
                        ? 'Merhaba, size nasıl yardımcı olabilirim?'
                        : 'Hello, how can I help you?'}
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setNewChatDialogOpen(false)}
                      className="flex-1"
                    >
                      {t.common.cancel}
                    </Button>
                    <Button
                      onClick={startNewChat}
                      className="flex-1 bg-[#00D4AA] hover:bg-[#00B894]"
                    >
                      {language === 'tr' ? 'Sohbeti Başlat' : 'Start Chat'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
          {/* Chat Sessions List */}
          <Card className="lg:col-span-1">
            <CardHeader className="border-b">
              <CardTitle className="text-lg">{t.support.activeChatSessions}</CardTitle>
            </CardHeader>
            <ScrollArea className="h-[calc(700px-80px)]">
              <CardContent className="p-0">
                {sessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <MessageCircle className="h-12 w-12 text-gray-400 mb-3" />
                    <p className="text-gray-600">{t.support.noChatSessions}</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {sessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => setSelectedSession(session)}
                        className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                          selectedSession?.id === session.id ? 'bg-[#00D4AA]/10 border-l-4 border-[#00D4AA]' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-full ${getAvatarColor(session.user_name).bg}`}>
                              <User className={`h-4 w-4 ${getAvatarColor(session.user_name).text}`} />
                            </div>
                            <div>
                              <div className="font-medium text-sm">{session.user_name}</div>
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {session.user_email || 'No email'}
                              </div>
                            </div>
                          </div>
                          {session.unread_count! > 0 && (
                            <Badge className="bg-red-500 text-white">
                              {session.unread_count}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          {format(new Date(session.updated_at), 'MMM dd, HH:mm')}
                          <Badge variant="outline" className="ml-auto">
                            {session.status === 'waiting' ? t.support.waitingForResponse : t.common.active}
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </ScrollArea>
          </Card>

          {/* Chat Messages */}
          <Card className="lg:col-span-2">
            {selectedSession ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${getAvatarColor(selectedSession.user_name).bg}`}>
                        <User className={`h-5 w-5 ${getAvatarColor(selectedSession.user_name).text}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{selectedSession.user_name}</CardTitle>
                        <p className="text-sm text-gray-500">{selectedSession.user_email}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={closeChat}
                      className="!text-red-600 hover:!text-red-700"
                    >
                      <X className="h-4 w-4 mr-1" />
                      {t.support.closeChat}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex flex-col h-[calc(700px-140px)]">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.is_admin_reply ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[70%] ${msg.is_admin_reply ? 'bg-[#00D4AA] text-white' : 'bg-gray-100'} rounded-lg p-3`}>
                            <div className="text-xs font-medium mb-1 opacity-70">
                              {msg.is_admin_reply ? t.support.you : msg.sender_name}
                            </div>
                            <div className="text-sm whitespace-pre-wrap">{msg.message}</div>
                            <div className="text-xs mt-1 opacity-60">
                              {format(new Date(msg.created_at), 'HH:mm')}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                  <div className="border-t p-4">
                    <div className="flex gap-2">
                      <Input
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={t.support.typeYourMessage}
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={!inputMessage.trim()}
                        className="bg-[#00D4AA] hover:bg-[#00B894]"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex flex-col items-center justify-center h-full p-8 text-center">
                <MessageCircle className="h-16 w-16 text-gray-400 mb-4" />
                <p className="text-gray-600 text-lg">{t.support.selectChatToView}</p>
              </CardContent>
            )}
          </Card>
        </div>
    </div>
  )
}
