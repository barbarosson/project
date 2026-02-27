'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useTenant } from './tenant-context'
import { checkOverdueInvoices, checkLowStock, checkOutOfStock } from '@/lib/notifications'

export interface Notification {
  id: string
  tenant_id: string
  user_id: string | null
  type: string
  title: string
  message: string
  link: string | null
  is_read: boolean
  metadata: any
  created_at: string
  read_at: string | null
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  deleteAllNotifications: () => Promise<void>
  refreshNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

const NOTIFICATIONS_CLEARED_KEY = 'notifications_cleared_at'
const SKIP_CHECKS_AFTER_CLEAR_MS = 24 * 60 * 60 * 1000 // 24 saat – tümünü sil sonrası aynı bildirimlerin yeniden oluşmasını engelle

function getClearedAt(tenantId: string): number | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(`${NOTIFICATIONS_CLEARED_KEY}_${tenantId}`)
    return raw ? parseInt(raw, 10) : null
  } catch {
    return null
  }
}

function setClearedAt(tenantId: string, value: number) {
  try {
    localStorage.setItem(`${NOTIFICATIONS_CLEARED_KEY}_${tenantId}`, value.toString())
  } catch {}
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { tenantId, loading: tenantLoading } = useTenant()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantLoading && tenantId) {
      fetchNotifications()
      const clearedAt = getClearedAt(tenantId)
      const skipChecks = clearedAt != null && Date.now() - clearedAt < SKIP_CHECKS_AFTER_CLEAR_MS
      if (!skipChecks) {
        runNotificationChecks(tenantId)
      }
      const cleanup = setupRealtimeSubscription()
      return cleanup
    } else if (!tenantLoading && !tenantId) {
      setLoading(false)
    }
  }, [tenantId, tenantLoading])

  async function runNotificationChecks(tenantId: string) {
    try {
      await Promise.all([
        checkOverdueInvoices(tenantId),
        checkLowStock(tenantId),
        checkOutOfStock(tenantId)
      ])
      await fetchNotifications()
    } catch (e) {
      console.error('Notification checks failed:', e)
    }
  }

  async function fetchNotifications() {
    if (!tenantId) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      setNotifications(data || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  function setupRealtimeSubscription() {
    if (!tenantId) return

    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `tenant_id=eq.${tenantId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotifications((prev) => [payload.new as Notification, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setNotifications((prev) =>
              prev.map((n) => (n.id === payload.new.id ? (payload.new as Notification) : n))
            )
          } else if (payload.eventType === 'DELETE') {
            setNotifications((prev) => prev.filter((n) => n.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }

  async function markAsRead(notificationId: string) {
    if (!tenantId) return

    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('tenant_id', tenantId)

      if (error) throw error

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  async function markAllAsRead() {
    if (!tenantId) return

    try {
      const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)

      if (unreadIds.length === 0) return

      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .in('id', unreadIds)
        .eq('tenant_id', tenantId)

      if (error) throw error

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      )
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  async function deleteNotification(notificationId: string) {
    if (!tenantId) return

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('tenant_id', tenantId)

      if (error) throw error

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  async function deleteAllNotifications() {
    if (!tenantId) return

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('tenant_id', tenantId)

      if (error) throw error

      setNotifications([])
      setClearedAt(tenantId, Date.now())
    } catch (error) {
      console.error('Error deleting all notifications:', error)
    }
  }

  async function refreshNotifications() {
    await fetchNotifications()
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllNotifications,
        refreshNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
