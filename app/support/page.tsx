'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CreateTicketDialog } from '@/components/create-ticket-dialog'
import { EmptyState } from '@/components/empty-state'
import {
  HelpCircle,
  MessageSquare,
  Plus,
  BookOpen,
  Video,
  FileText,
  Search,
  Ticket,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Lock,
  Phone
} from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { useTenant } from '@/contexts/tenant-context'
import { useSubscription } from '@/contexts/subscription-context'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface SupportTicket {
  id: string
  ticket_number: string
  subject: string
  category: string
  priority: string
  status: string
  message: string
  created_at: string
  updated_at: string
}

export default function SupportPage() {
  const { t, language } = useLanguage()
  const { tenantId, loading: tenantLoading } = useTenant()
  const { hasFeature, currentPlan } = useSubscription()
  const router = useRouter()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [liveChatWidget, setLiveChatWidget] = useState('')

  const hasLiveChat = hasFeature('support_live')
  const has24_7Support = hasFeature('support_24_7')

  useEffect(() => {
    if (!tenantLoading && tenantId) {
      fetchTickets()
    }
  }, [tenantId, tenantLoading])

  useEffect(() => {
    if (liveChatWidget && typeof window !== 'undefined') {
      try {
        const script = document.createElement('script')
        script.innerHTML = liveChatWidget
        document.body.appendChild(script)

        return () => {
          try {
            document.body.removeChild(script)
          } catch (e) {
          }
        }
      } catch (error) {
        console.error('Error loading live chat widget:', error)
      }
    }
  }, [liveChatWidget])

  async function fetchTickets() {
    if (!tenantId) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTickets(data || [])
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch tickets')
    } finally {
      setLoading(false)
    }
  }

  function getStatusBadge(status: string) {
    const statusConfig = {
      Open: { color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
      'In Progress': { color: 'bg-yellow-100 text-yellow-700', icon: Clock },
      Resolved: { color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
      Closed: { color: 'bg-gray-100 text-gray-700', icon: CheckCircle2 }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Open
    const Icon = config.icon

    return (
      <Badge className={`${config.color} border-0`}>
        <Icon className="mr-1 h-3 w-3" />
        {t.support.statuses[status.toLowerCase().replace(' ', '') as keyof typeof t.support.statuses] || status}
      </Badge>
    )
  }

  function getPriorityBadge(priority: string) {
    const colors = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-blue-100 text-blue-700',
      high: 'bg-red-100 text-red-700'
    }

    return (
      <Badge className={`${colors[priority.toLowerCase() as keyof typeof colors]} border-0`}>
        {t.support.priorities[priority.toLowerCase() as keyof typeof t.support.priorities]}
      </Badge>
    )
  }

  const knowledgeBaseCategories = [
    {
      title: t.support.knowledgeBase.gettingStarted,
      icon: BookOpen,
      color: 'bg-blue-500',
      articles: [
        t.support.articles.quickStart,
        t.support.articles.addCustomer
      ]
    },
    {
      title: t.support.knowledgeBase.invoiceManagement,
      icon: FileText,
      color: 'bg-emerald-500',
      articles: [
        t.support.articles.createInvoice,
        t.support.articles.eInvoicing
      ]
    },
    {
      title: t.support.knowledgeBase.advancedAnalytics,
      icon: Video,
      color: 'bg-purple-500',
      articles: [
        t.support.articles.aiInsights
      ]
    },
    {
      title: t.support.knowledgeBase.inventoryTips,
      icon: BookOpen,
      color: 'bg-orange-500',
      articles: [
        t.support.articles.inventoryBasics
      ]
    }
  ]

  if (loading || tenantLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-lg text-gray-500">{t.common.loading}</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t.support.title}</h1>
            <p className="text-gray-500 mt-1">
              {language === 'tr' ? 'Yardım alın ve MODULUS\'u etkili kullanmayı öğrenin' : 'Get help and learn how to use MODULUS effectively'}
            </p>
          </div>
        </div>

        <Tabs defaultValue="support" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="support" className="data-[state=inactive]:text-[#0A192F]">
              <MessageSquare className="mr-2 h-4 w-4" />
              {t.support.supportCenter}
            </TabsTrigger>
            <TabsTrigger value="academy" className="data-[state=inactive]:text-[#0A192F]">
              <BookOpen className="mr-2 h-4 w-4" />
              {t.support.academy}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="support" className="space-y-6">
            <Card className="bg-gradient-to-r from-[#00D4AA]/10 to-blue-50 border-[#00D4AA]/20">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.support.needHelp}</h2>
                  <p className="text-gray-600">{t.support.chooseOption}</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
                  <Card className={`cursor-pointer hover:shadow-xl transition-all border-2 ${hasLiveChat ? 'border-[#00D4AA] hover:border-[#00B894]' : 'border-gray-200 opacity-75'}`}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className={`p-4 rounded-lg ${hasLiveChat ? 'bg-[#00D4AA]' : 'bg-gray-300'}`}>
                          <MessageSquare className="h-8 w-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-xl">{t.support.liveSupport}</CardTitle>
                            {!hasLiveChat && <Lock className="h-4 w-4 text-amber-500" />}
                          </div>
                          <CardDescription className="text-sm">
                            {hasLiveChat ? t.support.businessHoursOnly : (language === 'tr' ? 'ADVANCED planı gerektirir' : 'Requires ADVANCED plan')}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">
                        {t.support.liveChatDescription}
                      </p>
                      {hasLiveChat ? (
                        <>
                          <p className="text-xs text-gray-500 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            {language === 'tr'
                              ? 'Canlı sohbet widget\'i sağ alt köşede açılmıştır. Çevrimiçi olup olmadığımızı kontrol edin ve sohbeti başlatın.'
                              : 'A live chat widget has appeared in the bottom right corner. Check if we\'re online and start chatting.'}
                          </p>
                          <Button className="w-full bg-[#00D4AA] hover:bg-[#00B894]">
                            <MessageSquare className="mr-2 h-4 w-4" />
                            {language === 'tr' ? 'Canlı Sohbeti Aç' : 'Open Live Chat'}
                          </Button>
                        </>
                      ) : (
                        <Button className="w-full" variant="outline" onClick={() => router.push('/settings/subscription')}>
                          <Lock className="mr-2 h-4 w-4" />
                          {language === 'tr' ? 'Yükselt' : 'Upgrade to Access'}
                        </Button>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-xl transition-all border-2 hover:border-blue-500">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-4 rounded-lg bg-blue-500">
                          <Ticket className="h-8 w-8 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{t.support.createTicket}</CardTitle>
                          <CardDescription className="text-sm">
                            {language === 'tr' ? 'Her zaman destek talebi oluşturabilirsiniz' : 'Create a support ticket anytime'}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">
                        {t.support.ticketDescription}
                      </p>
                      <Button
                        onClick={() => setCreateDialogOpen(true)}
                        className="w-full bg-blue-500 hover:bg-blue-600"
                        size="lg"
                      >
                        <Plus className="mr-2 h-5 w-5" />
                        {t.support.createTicket}
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {has24_7Support && (
                  <Card className="mt-6 border-2 border-amber-400 bg-gradient-to-r from-amber-50 to-orange-50">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-4 rounded-lg bg-amber-500">
                          <Phone className="h-8 w-8 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl flex items-center gap-2">
                            {language === 'tr' ? '24/7 Telefon Desteği' : '24/7 Phone Support'}
                            <Badge className="bg-amber-500">{language === 'tr' ? 'ENTERPRISE' : 'ENTERPRISE'}</Badge>
                          </CardTitle>
                          <CardDescription className="text-sm">
                            {language === 'tr' ? 'Günün her saati telefon desteği' : 'Round-the-clock phone support'}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 mb-4">
                        {language === 'tr'
                          ? 'ENTERPRISE müşterilerimize özel 7/24 telefon destek hattımız. Acil durumlarınızda bize ulaşın.'
                          : 'Dedicated 24/7 phone support line for our ENTERPRISE customers. Reach us for urgent matters.'}
                      </p>
                      <div className="flex gap-3">
                        <Button className="flex-1 bg-amber-500 hover:bg-amber-600">
                          <Phone className="mr-2 h-4 w-4" />
                          {language === 'tr' ? '+90 XXX XXX XX XX' : 'Call Support'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-3">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-purple-200" onClick={() => router.push('/ai-insights')}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-purple-100">
                      <MessageSquare className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{language === 'tr' ? 'AI CFO Asistanı' : 'AI CFO Assistant'}</CardTitle>
                      <CardDescription className="text-xs">
                        {language === 'tr' ? 'Yapay zeka ile sohbet edin' : 'Chat with AI assistant'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">
                    {language === 'tr' ? 'Sorularınıza anında yanıt alın' : 'Get instant answers to your questions'}
                  </p>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    {language === 'tr' ? 'Sohbeti Başlat' : 'Start Chat'}
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-orange-50">
                      <BookOpen className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {language === 'tr' ? 'Bilgi Bankası' : 'Knowledge Base'}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {language === 'tr' ? 'Yardım makalelerine göz at' : 'Browse help articles'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">
                    {language === 'tr' ? 'Dokümantasyonda yanıtlar bulun' : 'Find answers in our documentation'}
                  </p>
                  <Button
                    className="w-full"
                    variant="outline"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    {language === 'tr' ? 'Makalelere Göz At' : 'Browse Articles'}
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-emerald-50">
                      <Video className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {language === 'tr' ? 'Video Eğitimler' : 'Video Tutorials'}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {language === 'tr' ? 'Adım adım videolar' : 'Step-by-step videos'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">
                    {language === 'tr' ? 'Görsel öğrenme materyalleri' : 'Visual learning materials'}
                  </p>
                  <Button
                    className="w-full"
                    variant="outline"
                  >
                    <Video className="mr-2 h-4 w-4" />
                    {language === 'tr' ? 'Videoları İzle' : 'Watch Videos'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t.support.myTickets}</CardTitle>
                <CardDescription>
                  {language === 'tr' ? 'Destek taleplerinizi takip edin ve yönetin' : 'Track and manage your support requests'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tickets.length === 0 ? (
                  <EmptyState
                    icon={Ticket}
                    title={language === 'tr' ? 'Henüz destek talebi yok' : 'No support tickets yet'}
                    description={language === 'tr'
                      ? 'Ekibimizden yardım almak için ilk destek talebinizi oluşturun'
                      : 'Create your first support ticket to get help from our team'}
                    action={{
                      label: t.support.createTicket,
                      onClick: () => setCreateDialogOpen(true)
                    }}
                  />
                ) : (
                  <div className="space-y-4">
                    {tickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-sm text-gray-500">
                                {ticket.ticket_number}
                              </span>
                              {getStatusBadge(ticket.status)}
                              {getPriorityBadge(ticket.priority)}
                            </div>
                            <h3 className="font-semibold text-gray-900">{ticket.subject}</h3>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {ticket.message}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(ticket.created_at), 'MMM dd, yyyy HH:mm')}
                          </span>
                          <span className="capitalize">
                            {t.support.categories[ticket.category as keyof typeof t.support.categories]}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="academy" className="space-y-6">
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder={t.support.searchHelp}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {knowledgeBaseCategories.map((category, index) => {
                const Icon = category.icon
                return (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${category.color}`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <CardTitle className="text-lg">{category.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {category.articles.map((article, articleIndex) => (
                          <a
                            key={articleIndex}
                            href="#"
                            onClick={(e) => {
                              e.preventDefault()
                              toast.info(language === 'tr'
                                ? 'Yardım makalesi yakında eklenecek'
                                : 'Help article coming soon')
                            }}
                            className="block p-3 rounded-lg border hover:border-[#00D4AA] hover:bg-gray-50 cursor-pointer transition-all"
                          >
                            <div className="flex items-start gap-3">
                              <FileText className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <h4 className="font-medium text-sm text-gray-900 mb-1">
                                  {article.title}
                                </h4>
                                <p className="text-xs text-gray-600">
                                  {article.description}
                                </p>
                              </div>
                              <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            </div>
                          </a>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <Card className="bg-gradient-to-r from-[#00D4AA] to-[#00B894] text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-2">
                      {language === 'tr' ? 'Daha fazla yardıma mı ihtiyacınız var?' : 'Need more help?'}
                    </h3>
                    <p className="text-white/90 text-sm">
                      {language === 'tr'
                        ? 'Destek ekibimiz MODULUS\'ta başarılı olmanız için burada'
                        : 'Our support team is here to help you succeed with MODULUS'}
                    </p>
                  </div>
                  <Button
                    onClick={() => setCreateDialogOpen(true)}
                    className="bg-white text-[#00D4AA] hover:bg-gray-100"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {language === 'tr' ? 'Destek ile İletişim' : 'Contact Support'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <CreateTicketDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchTickets}
      />
    </DashboardLayout>
  )
}
