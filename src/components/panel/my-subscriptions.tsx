'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Tv,
  Film,
  Clapperboard,
  Plus,
  Copy,
  Check,
  Clock,
  Calendar,
  Server,
  Inbox,
} from 'lucide-react'
import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'
import type { Subscription } from './types'

export function MySubscriptions({ onNew }: { onNew: () => void }) {
  const { data, isLoading } = useQuery<{ subscriptions: Subscription[] }>({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const res = await fetch('/api/funds/subscriptions')
      if (!res.ok) throw new Error('Failed to load subscriptions')
      return res.json()
    },
  })

  const subs = data?.subscriptions ?? []

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 flex-wrap">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Server className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold">My Subscriptions</h2>
            <p className="text-xs text-muted-foreground">Active IPTV lines created from your credit balance.</p>
          </div>
        </div>
        <Button onClick={onNew} className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white gap-1.5">
          <Plus className="h-4 w-4" /> New Subscription
        </Button>
      </div>

      {isLoading ? (
        <div className="p-5 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : subs.length === 0 ? (
        <div className="p-8">
          <div className="flex flex-col items-center justify-center gap-3 text-center py-6">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Inbox className="h-7 w-7 text-muted-foreground" />
            </span>
            <div>
              <p className="text-sm font-medium">No active subscriptions yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Create your first IPTV line using your credit balance. Customize content categories for any device.
              </p>
            </div>
            <Button onClick={onNew} variant="outline" className="mt-1 gap-1.5">
              <Plus className="h-4 w-4" /> Create First Line
            </Button>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {subs.map((s) => (
            <SubscriptionRow key={s.id} s={s} />
          ))}
        </div>
      )}
    </Card>
  )
}

function SubscriptionRow({ s }: { s: Subscription }) {
  const [copied, setCopied] = useState<string | null>(null)
  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      /* ignore */
    }
  }

  const expires = new Date(s.expiresAt)
  const now = new Date()
  const daysLeft = Math.max(0, Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
  const isExpired = daysLeft <= 0

  const scopeChips: { label: string; icon: React.ElementType; excluded: boolean; color: string }[] = [
    { label: 'Live', icon: Tv, excluded: s.excludedLive, color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'VOD', icon: Film, excluded: s.excludedVod, color: 'text-slate-600 dark:text-slate-300' },
    { label: 'Series', icon: Clapperboard, excluded: s.excludedSeries, color: 'text-orange-600 dark:text-orange-400' },
  ]

  return (
    <div className="p-4 sm:p-5 hover:bg-muted/20 transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Credentials */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-semibold">{s.username}</span>
            <Badge variant="outline" className="gap-1 text-[10px]">
              <span className={cn('h-1.5 w-1.5 rounded-full', isExpired ? 'bg-rose-500' : 'bg-emerald-500')} />
              {isExpired ? 'Expired' : 'Active'}
            </Badge>
            <Badge variant="secondary" className="text-[10px]">{s.planMonths} Month{s.planMonths > 1 ? 's' : ''}</Badge>
          </div>
          <div className="flex items-center gap-3 flex-wrap text-xs">
            <CredField label="User" value={s.username} onCopy={() => copy(s.username, 'u')} copied={copied === 'u'} />
            <CredField label="Pass" value={s.password} onCopy={() => copy(s.password, 'p')} copied={copied === 'p'} mono />
            <CredField label="DNS" value={s.dns} onCopy={() => copy(s.dns, 'd')} copied={copied === 'd'} mono />
          </div>
          {/* Content scope */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            {scopeChips.map((c) => {
              const Icon = c.icon
              return (
                <span
                  key={c.label}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium',
                    c.excluded
                      ? 'border-border bg-muted/50 text-muted-foreground line-through'
                      : cn('border-transparent bg-muted', c.color),
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {c.label}
                </span>
              )
            })}
            {!s.excludedSeries && s.seriesCategoryCount > 0 && (
              <span className="inline-flex items-center rounded-md border border-transparent bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-medium text-orange-600 dark:text-orange-400">
                {s.seriesCategoryCount} series cats
              </span>
            )}
            {!s.excludedSeries && s.seriesCategoryCount === 0 && !s.excludedLive && !s.excludedVod && (
              <span className="inline-flex items-center rounded-md border border-transparent bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                All categories
              </span>
            )}
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 lg:gap-6 lg:border-l lg:border-border lg:pl-6 flex-wrap">
          <Metric
            icon={Calendar}
            label="Created"
            value={new Date(s.createdAt).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
          />
          <Metric
            icon={Clock}
            label={isExpired ? 'Expired' : 'Expires in'}
            value={isExpired ? '—' : `${daysLeft} day${daysLeft === 1 ? '' : 's'}`}
            accent={!isExpired}
          />
          <Metric icon={Server} label="Cost" value={formatCurrency(s.creditsCost)} />
        </div>
      </div>
    </div>
  )
}

function CredField({
  label,
  value,
  onCopy,
  copied,
  mono,
}: {
  label: string
  value: string
  onCopy: () => void
  copied: boolean
  mono?: boolean
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-muted-foreground">{label}:</span>
      <span className={cn('font-medium', mono && 'font-mono')}>{value}</span>
      <button
        type="button"
        onClick={onCopy}
        className="text-muted-foreground hover:text-foreground transition-colors"
        aria-label={`Copy ${label}`}
      >
        {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
      </button>
    </div>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground shrink-0">
        <Icon className="h-4 w-4" />
      </span>
      <div className="leading-tight">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className={cn('text-sm font-semibold tabular-nums', accent && 'text-emerald-600 dark:text-emerald-400')}>{value}</p>
      </div>
    </div>
  )
}
