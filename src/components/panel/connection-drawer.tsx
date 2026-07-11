'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetHeader,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Activity, Globe, Wifi, Monitor, Smartphone, Tv, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Subscription, ConnectionLog } from './types'

const DEVICE_ICON: Record<string, React.ElementType> = {
  'Smart TV': Tv,
  Android: Smartphone,
  Firestick: Tv,
  Web: Monitor,
}

export function ConnectionDrawer({
  subscription,
  onOpenChange,
}: {
  subscription: Subscription | null
  onOpenChange: (v: boolean) => void
}) {
  const { data, isLoading } = useQuery<{ connections: ConnectionLog[]; total: number }>({
    queryKey: ['connections', subscription?.id],
    queryFn: async () => {
      const res = await fetch(`/api/funds/subscriptions/${subscription!.id}/connections`)
      if (!res.ok) throw new Error('Failed to load connections')
      return res.json()
    },
    enabled: !!subscription,
  })

  const conns = data?.connections ?? []

  return (
    <Sheet open={!!subscription} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Activity className="h-5 w-5 text-primary" />
            Connection Log
          </SheetTitle>
          <SheetDescription className="font-mono text-xs">
            {subscription?.username} · {subscription?.currentConnections ?? 0}/{subscription?.maxConnections ?? 1} active
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : conns.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center px-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Wifi className="h-6 w-6 text-muted-foreground" />
              </span>
              <p className="text-sm font-medium">No connections recorded</p>
              <p className="text-xs text-muted-foreground max-w-[240px]">
                This line has not been connected to a streaming server yet.
              </p>
            </div>
          ) : (
            <ol className="relative px-5 py-4">
              {/* timeline line */}
              <span className="absolute left-[26px] top-6 bottom-6 w-px bg-border" aria-hidden />
              {conns.map((c, i) => {
                const active = !c.disconnectedAt
                const Icon = (c.device && DEVICE_ICON[c.device]) || Globe
                return (
                  <li key={c.id} className="relative flex gap-3 pb-4 last:pb-0">
                    <span
                      className={cn(
                        'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 bg-card',
                        active ? 'border-emerald-500' : 'border-border',
                      )}
                    >
                      {active ? (
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      ) : (
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      )}
                    </span>
                    <div className="flex-1 min-w-0 rounded-lg border border-border bg-card p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-medium truncate">{c.ip}</span>
                        {active ? (
                          <Badge variant="outline" className="text-[9px] border-emerald-400 text-emerald-600 dark:text-emerald-300 bg-emerald-500/10 shrink-0">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
                            Live
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] text-muted-foreground shrink-0">
                            Ended
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        {c.country && (
                          <span className="inline-flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {c.countryCode ? `${c.countryCode} · ` : ''}{c.country}
                          </span>
                        )}
                        {c.isp && <span className="truncate">{c.isp}</span>}
                        {c.device && (
                          <span className="inline-flex items-center gap-1">
                            <Icon className="h-3 w-3" />
                            {c.device}
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(c.connectedAt).toLocaleString('en-PK', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {c.durationSec != null && (
                          <span>{Math.floor(c.durationSec / 60)}m watched</span>
                        )}
                      </div>
                      {c.userAgent && (
                        <p className="mt-1.5 text-[10px] text-muted-foreground/70 font-mono truncate" title={c.userAgent}>
                          {c.userAgent}
                        </p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
