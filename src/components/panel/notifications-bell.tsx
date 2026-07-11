'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Bell,
  CheckCheck,
  Info,
  CheckCircle2,
  AlertTriangle,
  Wallet,
  Tv,
  Server,
  Loader2,
  Inbox,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { AppNotification, NotificationType } from './types'

const TYPE_ICON: Record<NotificationType, React.ElementType> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  fund: Wallet,
  subscription: Tv,
  system: Server,
}

const TYPE_STYLE: Record<NotificationType, { bg: string; color: string }> = {
  info: { bg: 'bg-sky-500/10', color: 'text-sky-600 dark:text-sky-400' },
  success: { bg: 'bg-emerald-500/10', color: 'text-emerald-600 dark:text-emerald-400' },
  warning: { bg: 'bg-amber-500/10', color: 'text-amber-600 dark:text-amber-400' },
  fund: { bg: 'bg-primary/10', color: 'text-primary' },
  subscription: { bg: 'bg-orange-500/10', color: 'text-orange-600 dark:text-orange-400' },
  system: { bg: 'bg-slate-500/10', color: 'text-slate-600 dark:text-slate-300' },
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'all' | 'unread'>('all')

  const qc = useQueryClient()

  // Lightweight unread count — polled every 30s for the badge (even when closed)
  const { data: countData } = useQuery<{ unreadCount: number }>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const res = await fetch('/api/notifications/unread-count')
      if (!res.ok) throw new Error('Failed to load unread count')
      return res.json()
    },
    refetchInterval: 30_000,
  })
  const unreadCount = countData?.unreadCount ?? 0

  // Full list — only fetched when the dropdown opens
  const { data, isLoading, isFetching } = useQuery<{ items: AppNotification[]; total: number; unreadCount: number }>({
    queryKey: ['notifications', 'list', tab],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '30' })
      if (tab === 'unread') params.set('unread', 'true')
      const res = await fetch('/api/notifications?' + params.toString())
      if (!res.ok) throw new Error('Failed to load notifications')
      return res.json()
    },
    enabled: open,
  })

  const items = data?.items ?? []

  // Mark single as read (mirrors load_notification_url click)
  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notifications/${id}`, { method: 'PATCH' })
      if (!res.ok) throw new Error('Failed to mark as read')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  // Mark all as read
  const markAllRead = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/notifications/read-all', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to mark all as read')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  // Click handler — mark read then optionally navigate to the in-app anchor
  const handleClick = (n: AppNotification) => {
    if (!n.read) markRead.mutate(n.id)
    if (n.link) {
      setOpen(false)
      // Defer so the popover closes before scrolling
      setTimeout(() => {
        const el = document.querySelector(n.link as string)
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 80)
    }
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[9px] justify-center bg-destructive text-destructive-foreground border-0 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {open && (
        <>
          {/* Click-away backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />

          {/* Dropdown — mirrors legacy #notifications-scroll panel */}
          <div className="absolute right-0 top-12 z-50 w-[min(92vw,380px)] overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-[10px] h-5">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs"
                disabled={unreadCount === 0 || markAllRead.isPending}
                onClick={() => markAllRead.mutate()}
              >
                {markAllRead.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CheckCheck className="h-3.5 w-3.5" />
                )}
                Mark all read
              </Button>
            </div>

            {/* Tabs — All / Unread (mirrors load_notifications vs _unread) */}
            <div className="flex border-b border-border">
              {(['all', 'unread'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={cn(
                    'flex-1 py-2 text-xs font-medium capitalize transition-colors relative',
                    tab === t ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t === 'all' ? 'All' : 'Unread'}
                  {t === 'unread' && unreadCount > 0 && (
                    <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] text-destructive-foreground">
                      {unreadCount}
                    </span>
                  )}
                  {tab === t && (
                    <span className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto scrollbar-thin">
              {isLoading ? (
                <div className="p-3 space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Inbox className="h-6 w-6 text-muted-foreground" />
                  </span>
                  <p className="text-sm font-medium">
                    {tab === 'unread' ? 'All caught up' : 'No notifications'}
                  </p>
                  <p className="text-xs text-muted-foreground max-w-[240px]">
                    {tab === 'unread'
                      ? 'You have no unread notifications.'
                      : 'You will see fund, subscription and system alerts here.'}
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {items.map((n) => {
                    const Icon = TYPE_ICON[n.type] || Info
                    const style = TYPE_STYLE[n.type] || TYPE_STYLE.info
                    return (
                      <li key={n.id}>
                        <button
                          type="button"
                          onClick={() => handleClick(n)}
                          className={cn(
                            'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50',
                            !n.read && 'bg-primary/5',
                          )}
                        >
                          <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', style.bg, style.color)}>
                            <Icon className="h-[18px] w-[18px]" />
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="flex items-center gap-2">
                              <span className="text-sm font-semibold leading-tight truncate">{n.title}</span>
                              {!n.read && (
                                <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
                              )}
                            </span>
                            <span className="mt-0.5 block text-xs text-muted-foreground leading-relaxed line-clamp-2">
                              {n.message}
                            </span>
                            <span className="mt-1 block text-[10px] text-muted-foreground/70">
                              {timeAgo(n.createdAt)}
                            </span>
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border px-4 py-2.5 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                {isFetching && !isLoading ? 'Updating…' : `${data?.total ?? 0} total`}
              </span>
              <span className="text-[10px] text-muted-foreground/70">Auto-refreshes every 30s</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })
}
