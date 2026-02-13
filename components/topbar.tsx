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
import { Badge } from '@/components/ui/badge'
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
    <header
        className="h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:px-6 gap-4 [&_button]:!text-gray-800 [&_button_svg]:!stroke-gray-800"
        style={{ color: '#1e293b' }}
      >
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden text-gray-800 hover:text-gray-900 hover:bg-gray-100"
        onClick={onMenuClick}
      >
        <Menu size={20} className="stroke-[1.5]" />
      </Button>

      <div className="flex-1 max-w-xl">
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-2 pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:border-[#00D4AA] focus:outline-none focus:ring-2 focus:ring-[#00D4AA] focus:border-transparent transition-all text-left"
        >
          <Search className="absolute left-3 text-gray-400" size={18} />
          <span className="text-gray-500 text-sm">
            {language === 'tr' ? 'Müşteri, fatura, ürün ara...' : 'Search customers, invoices, products...'}
          </span>
          <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-white px-1.5 font-mono text-[10px] font-medium text-gray-600">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder={language === 'tr' ? 'Müşteri, fatura, ürün ara...' : 'Search customers, invoices, products...'}
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>{language === 'tr' ? 'Sonuç bulunamadı.' : 'No results found.'}</CommandEmpty>

          {searchResults.customers.length > 0 && (
            <CommandGroup heading={language === 'tr' ? 'Müşteriler' : 'Customers'}>
              {searchResults.customers.map((customer) => (
                <CommandItem
                  key={customer.id}
                  onSelect={() => handleSelect('customer', customer.id)}
                  className="cursor-pointer"
                >
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
                <CommandItem
                  key={invoice.id}
                  onSelect={() => handleSelect('invoice', invoice.id)}
                  className="cursor-pointer"
                >
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
                <CommandItem
                  key={product.id}
                  onSelect={() => handleSelect('product', product.id)}
                  className="cursor-pointer"
                >
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

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-gray-700 hover:text-gray-900 hover:bg-gray-100">
              <Globe size={20} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setLanguage('en')}>
              <span className="flex items-center gap-2">
                🇬🇧 English {language === 'en' && '✓'}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLanguage('tr')}>
              <span className="flex items-center gap-2">
                🇹🇷 Türkçe {language === 'tr' && '✓'}
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {isAdmin && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
            onClick={() => router.push('/admin/site-commander')}
          >
            <Shield size={18} />
            <span className="hidden md:inline text-sm font-medium">
              {language === 'tr' ? 'Admin Paneli' : 'Admin Panel'}
            </span>
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-gray-700 hover:text-gray-900 hover:bg-gray-100">
              <Bell size={20} />
              {unreadCount > 0 && (
                <Badge
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-[#00D4AA] text-white text-xs"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-96 p-0">
            <div className="flex items-center justify-between p-4 border-b">
              <DropdownMenuLabel className="p-0">
                {language === 'tr' ? 'Bildirimler' : 'Notifications'}
              </DropdownMenuLabel>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="h-7 text-xs text-[#00D4AA] hover:text-[#00B894]"
                >
                  {language === 'tr' ? 'Tümünü Okundu İşaretle' : 'Mark all as read'}
                </Button>
              )}
            </div>
            <ScrollArea className="h-[400px]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500">
                    {language === 'tr' ? 'Bildirim bulunmuyor' : 'No notifications'}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notification.is_read ? 'bg-blue-50/50' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-gray-900 leading-tight">
                              {notification.title}
                            </p>
                            {!notification.is_read && (
                              <div className="h-2 w-2 bg-[#00D4AA] rounded-full flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-400">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteNotification(notification.id)
                              }}
                              className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
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
            <Button variant="ghost" className="gap-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-[#0A2540] text-white text-sm">
                  AD
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:inline text-sm font-medium">Admin User</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div>
                <p className="font-medium">Admin User</p>
                <p className="text-xs text-gray-500 font-normal">admin@modulus.com</p>
              </div>
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
    </header>
  )
}
