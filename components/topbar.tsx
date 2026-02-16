'use client'

import { useState, useEffect } from 'react'
import { Search, Bell, Menu, User, LogOut, Settings, Globe, FileText, Users as UsersIcon, Package, Check, X, Clock, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useLanguage } from '@/contexts/language-context'
import { useNotifications } from '@/contexts/notification-context'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/contexts/tenant-context'
import { formatDistanceToNow } from 'date-fns'

interface TopbarProps {
  onMenuClick: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { language, setLanguage, t } = useLanguage()
  const { tenantId } = useTenant()
  const { signOut, isAdmin } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{
    customers: any[]
    invoices: any[]
    products: any[]
  }>({
    customers: [],
    invoices: [],
    products: []
  })

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  useEffect(() => {
    if (searchQuery && tenantId) {
      performSearch()
    } else {
      setSearchResults({ customers: [], invoices: [], products: [] })
    }
  }, [searchQuery, tenantId])

  async function performSearch() {
    if (!tenantId || !searchQuery) return

    const query = searchQuery.toLowerCase()

    const [customersRes, invoicesRes, productsRes] = await Promise.all([
      supabase
        .from('customers')
        .select('id, name, email, phone')
        .eq('tenant_id', tenantId)
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(5),
      supabase
        .from('invoices')
        .select('id, invoice_number, amount, status')
        .eq('tenant_id', tenantId)
        .ilike('invoice_number', `%${query}%`)
        .limit(5),
      supabase
        .from('products')
        .select('id, name, sku, sale_price')
        .eq('tenant_id', tenantId)
        .or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
        .limit(5)
    ])

    setSearchResults({
      customers: customersRes.data || [],
      invoices: invoicesRes.data || [],
      products: productsRes.data || []
    })
  }

  function handleSelect(type: string, id: string) {
    setOpen(false)
    setSearchQuery('')

    if (type === 'customer') {
      router.push('/customers')
    } else if (type === 'invoice') {
      router.push(`/invoices/${id}`)
    } else if (type === 'product') {
      router.push('/inventory')
    }
  }

  function handleNotificationClick(notification: any) {
    markAsRead(notification.id)

    if (notification.link) {
      router.push(notification.link)
    }
  }

  function getNotificationIcon(type: string) {
    switch (type) {
      case 'invoice_overdue':
        return <Clock className="h-4 w-4 text-orange-500" />
      case 'low_stock':
        return <Package className="h-4 w-4 text-red-500" />
      case 'payment_received':
        return <Check className="h-4 w-4 text-green-500" />
      default:
        return <Bell className="h-4 w-4 text-blue-500" />
    }
  }

  return (
    <>
      <header
        className="h-16 bg-white border-b border-gray-200 px-4 lg:px-6 w-full"
        style={{ color: '#1e293b' }}
      >
        <div className="h-full grid grid-cols-1 min-[900px]:grid-cols-[1fr_auto] gap-3 items-center max-w-full">
          {/* Sol: menü (mobil) + arama */}
          <div className="min-w-0 flex items-center gap-2 order-1 flex-1">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9 shrink-0 text-gray-600 hover:bg-gray-100"
              onClick={onMenuClick}
            >
              <Menu size={20} strokeWidth={1.5} />
            </Button>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="relative h-9 w-full min-w-0 flex items-center gap-2 pl-8 pr-2 rounded-md border border-gray-300 bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]"
            >
              <Search className="absolute left-2.5 h-4 w-4 text-gray-500 shrink-0 pointer-events-none" size={16} strokeWidth={2} />
              <span className="truncate">
                {language === 'tr' ? 'Arama' : 'Search'}
              </span>
              <kbd className="hidden sm:inline ml-auto h-5 px-1.5 rounded border border-gray-400 bg-white text-[10px] text-gray-600 font-mono shrink-0">⌘K</kbd>
            </button>
          </div>

          {/* Sağ: Dil, Admin, Bildirimler, Kullanıcı – hepsi görünür, sıralı */}
          <div className="min-w-0 flex items-center justify-end gap-2 flex-shrink-0 order-2 flex-wrap sm:flex-nowrap">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 shrink-0 gap-1.5 rounded-md px-2 sm:px-3 text-amber-700 hover:bg-amber-50 text-xs font-medium" title={language === 'tr' ? 'Dil tercihi' : 'Language'}>
                  <Globe size={18} strokeWidth={1.5} />
                  <span className="whitespace-nowrap">{language === 'tr' ? 'Dil' : 'Lang'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLanguage('en')}>
                  🇬🇧 English {language === 'en' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('tr')}>
                  🇹🇷 Türkçe {language === 'tr' && '✓'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 shrink-0 gap-1.5 rounded-md px-2 sm:px-3 text-amber-700 hover:bg-amber-50 text-xs font-medium"
                onClick={() => router.push('/admin/site-commander')}
              >
                <Shield size={16} />
                <span className="whitespace-nowrap">{t.sidebar.admin}</span>
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative h-9 shrink-0 gap-1.5 rounded-md px-2 sm:px-3 text-amber-700 hover:bg-amber-50 text-xs font-medium" title={language === 'tr' ? 'Bildirimler' : 'Notifications'}>
                  <Bell size={18} strokeWidth={1.5} />
                  <span className="whitespace-nowrap hidden sm:inline">{language === 'tr' ? 'Bildirimler' : 'Notifications'}</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center rounded-full bg-[#00D4AA] text-white text-[10px] font-medium">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[min(24rem,calc(100vw-2rem))] max-w-96 p-0">
                <div className="flex items-center justify-between p-4 border-b">
                  <DropdownMenuLabel className="p-0 font-semibold text-gray-900">
                    {language === 'tr' ? 'Bildirimler' : 'Notifications'}
                  </DropdownMenuLabel>
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-7 text-xs text-[#00D4AA]">
                      {language === 'tr' ? 'Tümünü okundu işaretle' : 'Mark all read'}
                    </Button>
                  )}
                </div>
                <ScrollArea className="h-[400px]">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Bell className="h-12 w-12 text-gray-300 mb-3" />
                      <p className="text-sm text-gray-500">{language === 'tr' ? 'Bildirim yok' : 'No notifications'}</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 hover:bg-gray-50 cursor-pointer ${!notification.is_read ? 'bg-blue-50/50' : ''}`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex gap-3">
                            <div className="shrink-0 mt-0.5">{getNotificationIcon(notification.type)}</div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-gray-400">
                                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                                  onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id) }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 shrink-0 gap-1.5 rounded-md px-2 sm:px-3 text-amber-700 hover:bg-amber-50 text-xs font-medium">
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarFallback className="bg-[#0A2540] text-white text-xs">AD</AvatarFallback>
                  </Avatar>
                  <span className="max-w-[90px] truncate whitespace-nowrap">Admin User</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="font-medium text-gray-900">Admin User</p>
                  <p className="text-xs text-gray-500 font-normal">admin@modulus.com</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                  <User className="mr-2 h-4 w-4" />
                  {language === 'tr' ? 'Profil' : 'Profile'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  {language === 'tr' ? 'Ayarlar' : 'Settings'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {language === 'tr' ? 'Çıkış Yap' : 'Log out'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder={language === 'tr' ? 'Arama' : 'Search'}
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>{language === 'tr' ? 'Sonuç bulunamadı.' : 'No results found.'}</CommandEmpty>
          {searchResults.customers.length > 0 && (
            <CommandGroup heading={language === 'tr' ? 'Müşteriler' : 'Customers'}>
              {searchResults.customers.map((customer) => (
                <CommandItem key={customer.id} onSelect={() => handleSelect('customer', customer.id)} className="cursor-pointer">
                  <UsersIcon className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{customer.name}</span>
                    <span className="text-xs text-gray-500">{customer.email}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {searchResults.invoices.length > 0 && (
            <CommandGroup heading={language === 'tr' ? 'Faturalar' : 'Invoices'}>
              {searchResults.invoices.map((invoice) => (
                <CommandItem key={invoice.id} onSelect={() => handleSelect('invoice', invoice.id)} className="cursor-pointer">
                  <FileText className="mr-2 h-4 w-4" />
                  <div className="flex items-center justify-between flex-1">
                    <span>{invoice.invoice_number}</span>
                    <span className="text-sm text-gray-600">${invoice.amount?.toLocaleString()}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {searchResults.products.length > 0 && (
            <CommandGroup heading={language === 'tr' ? 'Ürünler' : 'Products'}>
              {searchResults.products.map((product) => (
                <CommandItem key={product.id} onSelect={() => handleSelect('product', product.id)} className="cursor-pointer">
                  <Package className="mr-2 h-4 w-4" />
                  <div className="flex items-center justify-between flex-1">
                    <span>{product.name}</span>
                    <span className="text-sm text-gray-600">${product.sale_price?.toLocaleString()}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
