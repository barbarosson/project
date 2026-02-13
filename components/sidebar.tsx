'use client'
// DEPLOYMENT_V2: 1739082650-FORCE-CACHE-CLEAR

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ModulusLogo } from '@/components/modulus-logo'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  Megaphone,
  Sparkles,
  Settings,
  Receipt,
  HelpCircle,
  X,
  Wallet,
  ArrowRightLeft,
  CreditCard,
  ChevronDown,
  ChevronRight,
  Shield,
  Activity,
  LifeBuoy,
  MessageCircle,
  Lock,
  UserPlus,
  Globe,
  Image as ImageIcon,
  Bot,
  FileCheck2,
  FileCheck,
  BriefcaseBusiness,
  Store,
  TrendingUp,
  ShoppingCart,
  FolderKanban,
  Factory,
  Warehouse,
  Building2,
  Scale,
  Truck,
  FileSpreadsheet,
  Brain
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/language-context'
import { useTenant } from '@/contexts/tenant-context'
import { useAuth } from '@/contexts/auth-context'
import { useSubscription, FeatureCode, PlanName } from '@/contexts/subscription-context'
import { useSiteConfig } from '@/contexts/site-config-context'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { UpgradePlanDialog } from '@/components/upgrade-plan-dialog'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { language, t } = useLanguage()
  const { tenantId } = useTenant()
  const { isAdmin: userIsAdmin } = useAuth()
  const { hasFeature } = useSubscription()
  const { menus: allMenus } = useSiteConfig()
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['finance'])
  const [unreadChatCount, setUnreadChatCount] = useState(0)
  const [upgradeDialog, setUpgradeDialog] = useState<{ open: boolean; featureName: string; requiredPlan: PlanName } | null>(null)

  const visibleMenus = allMenus.filter(m => m.is_visible)

  // Map icon names to actual icon components
  const iconMap: Record<string, any> = {
    LayoutDashboard,
    Users,
    Package,
    FileText,
    Megaphone,
    Sparkles,
    Settings,
    Receipt,
    HelpCircle,
    Wallet,
    ArrowRightLeft,
    CreditCard,
    Shield,
    Activity,
    LifeBuoy,
    MessageCircle,
    Lock,
    UserPlus,
    Globe,
    ImageIcon,
    Bot,
    FileCheck2,
    FileCheck,
    BriefcaseBusiness,
    Store,
    TrendingUp,
    ShoppingCart,
    FolderKanban,
    Factory,
    Warehouse,
    Building2,
    Scale,
    Truck,
    FileSpreadsheet,
    Brain
  }

  const toggleMenu = (menuKey: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuKey)
        ? prev.filter(key => key !== menuKey)
        : [...prev, menuKey]
    )
  }

  // Load unread chat messages count
  useEffect(() => {
    if (!tenantId) return

    loadUnreadChatCount()

    // Subscribe to changes in support_chat_sessions
    const channel = supabase
      .channel('sidebar-chat-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_chat_sessions',
          filter: `tenant_id=eq.${tenantId}`
        },
        () => {
          loadUnreadChatCount()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `tenant_id=eq.${tenantId}`
        },
        (payload) => {
          const newMessage = payload.new as any
          if (!newMessage.is_admin_reply) {
            loadUnreadChatCount()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenantId])

  async function loadUnreadChatCount() {
    if (!tenantId) return

    try {
      // Count sessions with unread messages from users
      const { count } = await supabase
        .from('support_chat_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('is_read_by_admin', false)
        .in('status', ['active', 'waiting'])

      setUnreadChatCount(count || 0)
    } catch (error) {
      console.error('Error loading unread chat count:', error)
    }
  }

  // Build hierarchical menu structure from database
  const buildMenuHierarchy = () => {
    // Get parent menus (no parent_id)
    const parentMenus = visibleMenus.filter(m => !m.parent_id)

    // Build menu items with children
    return parentMenus.map(parent => {
      const children = visibleMenus.filter(m => m.parent_id === parent.id)
      const Icon = iconMap[parent.icon || 'Package'] || Package

      const menuItem: any = {
        id: parent.id,
        title: parent.label,
        icon: Icon,
        order: parent.order_index
      }

      if (parent.slug && !parent.slug.startsWith('#')) {
        menuItem.href = parent.slug
      }

      // If has children, add them as subItems
      if (children.length > 0) {
        menuItem.key = parent.id
        menuItem.subItems = children.map(child => ({
          id: child.id,
          title: child.label,
          href: child.slug,
          icon: iconMap[child.icon || 'Package'] || Package,
          order: child.order_index
        })).sort((a: any, b: any) => a.order - b.order)
      }

      return menuItem
    }).sort((a, b) => a.order - b.order)
  }

  const finalMenuItems = buildMenuHierarchy()

  // Debug: Log menu state
  console.log('🔵 Sidebar render:', {
    totalMenus: allMenus.length,
    visibleCount: visibleMenus.length,
    parentMenus: finalMenuItems.filter((m: any) => !m.href && m.subItems).length,
    totalItems: finalMenuItems.length
  });

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-64 z-50 transition-transform duration-300 flex flex-col',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #0A2540 50%, #0A2540 100%)' }}
      >
        <div className="flex flex-col items-center border-b py-5 px-3" style={{ borderColor: 'rgba(125,211,252,0.15)' }}>
          <Link href="/landing" className="flex items-center justify-center w-full py-2">
            <ModulusLogo size={42} variant="light" showText={true} />
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden absolute top-4 right-4 p-2 hover:bg-white/10 rounded"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {finalMenuItems.map((item, index) => {
              const Icon = item.icon
              const isActive = item.href && pathname === item.href
              const hasSubItems = 'subItems' in item && item.subItems
              const itemKey = 'key' in item ? item.key : undefined
              const isExpanded = itemKey && expandedMenus.includes(itemKey)
              const isSubItemActive = hasSubItems && item.subItems?.some(sub => pathname === sub.href)

              if (hasSubItems && item.subItems) {
                return (
                  <li key={itemKey || index}>
                    <button
                      onClick={() => itemKey && toggleMenu(itemKey)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                        'hover:bg-white/10',
                        isSubItemActive && 'bg-white/5'
                      )}
                    >
                      <Icon size={20} />
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium">{item.title}</div>
                      </div>
                      {isExpanded ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </button>
                    {isExpanded && (
                      <ul className="mt-1 ml-4 space-y-1">
                        {item.subItems.map((subItem: any) => {
                          const SubIcon = subItem.icon
                          const isSubActive = pathname === subItem.href

                          return (
                            <li key={subItem.href}>
                              <Link
                                href={subItem.href}
                                onClick={onClose}
                                className={cn(
                                  'flex items-center gap-3 px-4 py-2 rounded-lg transition-all',
                                  'hover:bg-white/10',
                                  isSubActive && 'bg-[#00D4AA]/20 text-[#7DD3FC] hover:bg-[#00D4AA]/30'
                                )}
                              >
                                <SubIcon size={18} />
                                <div className="flex-1">
                                  <div className="text-sm">{subItem.title}</div>
                                </div>
                                {subItem.badge && (
                                  <Badge className="bg-red-500 text-white text-xs px-1.5 py-0 min-w-[20px] h-5 flex items-center justify-center">
                                    {subItem.badge}
                                  </Badge>
                                )}
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </li>
                )
              }

              const itemFeature = 'feature' in item ? item.feature : undefined
              const itemRequiredPlan = 'requiredPlan' in item ? item.requiredPlan : undefined
              const isLocked = itemFeature && !hasFeature(itemFeature)

              return (
                <li key={item.href || index}>
                  {isLocked ? (
                    <button
                      onClick={() => {
                        setUpgradeDialog({
                          open: true,
                          featureName: item.title,
                          requiredPlan: itemRequiredPlan!
                        })
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                        'hover:bg-white/10 text-left'
                      )}
                    >
                      <Icon size={20} className="opacity-60" />
                      <div className="flex-1">
                        <div className="text-sm font-medium opacity-60">{item.title}</div>
                      </div>
                      <Lock size={16} className="text-amber-500" />
                    </button>
                  ) : (
                    <Link
                      href={item.href!}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                        'hover:bg-white/10',
                        isActive && 'bg-[#00D4AA]/20 text-[#7DD3FC] hover:bg-[#00D4AA]/30'
                      )}
                    >
                      <Icon size={20} />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{item.title}</div>
                      </div>
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="p-4 border-t" style={{ borderColor: 'rgba(125,211,252,0.15)' }}>
          <div className="text-xs text-center" style={{ color: 'rgba(125,211,252,0.7)' }}>
            © 2026 MODULUS ERP
          </div>
        </div>
      </aside>

      {upgradeDialog && (
        <UpgradePlanDialog
          open={upgradeDialog.open}
          onOpenChange={(open) => {
            if (!open) setUpgradeDialog(null)
          }}
          featureName={upgradeDialog.featureName}
          requiredPlan={upgradeDialog.requiredPlan}
        />
      )}
    </>
  )
}
