'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Tv,
  Film,
  Clapperboard,
  Search,
  Loader2,
  ShieldCheck,
  AlertCircle,
  Info,
  Check,
  X,
  Sparkles,
  Wifi,
  Lock,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'
import { useToast } from '@/hooks/use-toast'
import type { ContentCategory, SubscriptionPlan, Subscription } from './types'

interface ExclusionToggle {
  key: 'live' | 'vod' | 'series'
  label: string
  icon: React.ElementType
  color: string
  bg: string
}

const EXCLUSIONS: ExclusionToggle[] = [
  { key: 'live', label: 'Live Channels', icon: Tv, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
  { key: 'vod', label: 'Movies - VODs', icon: Film, color: 'text-slate-600 dark:text-slate-300', bg: 'bg-slate-500/10' },
  { key: 'series', label: 'Series - Episodes', icon: Clapperboard, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10' },
]

export function CustomSubscriptionDialog({
  open,
  onOpenChange,
  balance,
  onCreated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  balance: number
  onCreated?: (sub: Subscription) => void
}) {
  const [excluded, setExcluded] = useState<Record<'live' | 'vod' | 'series', boolean>>({
    live: false,
    vod: false,
    series: false,
  })
  const [selectedSeries, setSelectedSeries] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [planMonths, setPlanMonths] = useState<number>(12)

  const { toast } = useToast()
  const qc = useQueryClient()

  // Load series categories + plans
  const { data: catsData, isLoading: catsLoading } = useQuery<{ categories: ContentCategory[] }>({
    queryKey: ['categories', 'series'],
    queryFn: async () => {
      const res = await fetch('/api/funds/categories?type=series')
      if (!res.ok) throw new Error('Failed to load categories')
      return res.json()
    },
    enabled: open,
  })
  const { data: plansData } = useQuery<{ plans: SubscriptionPlan[] }>({
    queryKey: ['plans'],
    queryFn: async () => {
      const res = await fetch('/api/funds/plans')
      if (!res.ok) throw new Error('Failed to load plans')
      return res.json()
    },
    enabled: open,
  })

  const seriesCats = catsData?.categories ?? []
  const plans = plansData?.plans ?? []
  const selectedPlan = plans.find((p) => p.months === planMonths)

  const filteredCats = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return seriesCats
    return seriesCats.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
    )
  }, [seriesCats, search])

  const excludedCount = Object.values(excluded).filter(Boolean).length
  const allExcluded = excludedCount === 3
  const seriesDisabled = excluded.series
  const selectedCount = seriesDisabled ? 0 : selectedSeries.size

  const toggleSeries = (id: string) => {
    if (seriesDisabled) return
    setSelectedSeries((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const reset = () => {
    setExcluded({ live: false, vod: false, series: false })
    setSelectedSeries(new Set())
    setSearch('')
    setPlanMonths(12)
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/funds/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planMonths,
          excludedLive: excluded.live,
          excludedVod: excluded.vod,
          excludedSeries: excluded.series,
          seriesCategoryIds: Array.from(selectedSeries),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to create subscription')
      return data as { subscription: Subscription }
    },
    onSuccess: (data) => {
      toast({
        title: 'Subscription created',
        description: `Line ${data.subscription.username} is active. ${formatCurrency(data.subscription.creditsCost)} debited.`,
      })
      qc.invalidateQueries({ queryKey: ['overview'] })
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['subscriptions'] })
      onCreated?.(data.subscription)
      reset()
      onOpenChange(false)
    },
    onError: (err: Error) => {
      toast({ title: 'Could not create line', description: err.message, variant: 'destructive' })
    },
  })

  const insufficient = selectedPlan ? balance < selectedPlan.price : false

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset() }}>
      <DialogContent className="max-w-3xl w-[95vw] max-h-[92vh] overflow-hidden p-0 gap-0">
        {/* Orange header — matches Star IPTV modal */}
        <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 backdrop-blur">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <DialogTitle className="text-base font-semibold leading-tight">Custom Subscription</DialogTitle>
              <DialogDescription className="text-white/80 text-xs leading-tight">
                Tailor content categories for low-capacity devices
              </DialogDescription>
            </div>
          </div>
        </div>

        <ScrollArea className="max-h-[calc(92vh-64px)]">
          <div className="p-5 space-y-5">
            {/* Info banner */}
            <div className="flex gap-2.5 rounded-lg border border-border bg-muted/40 p-3.5 text-xs text-muted-foreground leading-relaxed">
              <Info className="h-4 w-4 shrink-0 mt-0.5 text-orange-500" />
              <p>
                Low capacity device or hang-up by add iptv subscription? Select your required
                categories to improve your device performance or speed by excluding unused categories.
                Want subscription for all the mentioned categories? Simply leave uncheck all these boxes.
              </p>
            </div>

            {/* Top-level exclusion toggles */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Content Types — check to <span className="text-orange-600 dark:text-orange-400">exclude</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {EXCLUSIONS.map((ex) => {
                  const isExcluded = excluded[ex.key]
                  const Icon = ex.icon
                  return (
                    <button
                      key={ex.key}
                      type="button"
                      onClick={() => setExcluded((p) => ({ ...p, [ex.key]: !p[ex.key] }))}
                      className={cn(
                        'group relative flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all',
                        isExcluded
                          ? 'border-orange-400 bg-orange-500/5 ring-1 ring-orange-400/40'
                          : 'border-border hover:border-orange-400/50 hover:bg-muted/40',
                        isExcluded && ex.key === 'live' && 'border-emerald-400 ring-emerald-400/40 bg-emerald-500/5',
                      )}
                    >
                      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', ex.bg, ex.color)}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-semibold leading-tight">{ex.label}</span>
                        <span className={cn('block text-[11px] mt-0.5', isExcluded ? 'text-orange-600 dark:text-orange-400 font-medium' : 'text-muted-foreground')}>
                          {isExcluded ? 'Excluded' : 'Included'}
                        </span>
                      </span>
                      <span
                        className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors',
                          isExcluded ? 'border-orange-500 bg-orange-500 text-white' : 'border-border',
                        )}
                      >
                        {isExcluded && <Check className="h-3 w-3" />}
                      </span>
                    </button>
                  )
                })}
              </div>
              {allExcluded && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle className="h-3.5 w-3.5" />
                  You cannot exclude all content types. Leave at least one included.
                </p>
              )}
            </div>

            {/* Series Categories */}
            <div className={cn('rounded-xl border border-border transition-opacity', seriesDisabled && 'opacity-40 pointer-events-none')}>
              <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 flex-wrap">
                <div>
                  <h3 className="text-sm font-semibold">Series Categories</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Select specific categories which do you want in your subscription, Leave Uncheck For All.
                  </p>
                </div>
                <div className="relative w-full sm:w-56">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search in series categories.."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 h-9 text-sm"
                    disabled={seriesDisabled}
                  />
                </div>
              </div>

              {/* Selection summary bar */}
              <div className="flex items-center justify-between gap-2 px-4 py-2 bg-muted/30 border-b border-border">
                <span className="text-[11px] text-muted-foreground">
                  {selectedCount === 0 ? (
                    <>Leave uncheck all boxes to include <span className="font-medium text-foreground">All</span></>
                  ) : (
                    <><span className="font-medium text-foreground">{selectedCount}</span> categor{selectedCount === 1 ? 'y' : 'ies'} selected · {seriesCats.length - selectedCount} excluded</>
                  )}
                </span>
                {selectedCount > 0 && (
                  <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-[11px]" onClick={() => setSelectedSeries(new Set())}>
                    Clear
                  </Button>
                )}
              </div>

              {/* Category grid — 3 columns like the source */}
              <div className="p-3">
                {catsLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <Skeleton key={i} className="h-9 w-full" />
                    ))}
                  </div>
                ) : filteredCats.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">No categories match &ldquo;{search}&rdquo;</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 max-h-64 overflow-y-auto scrollbar-thin pr-1">
                    {filteredCats.map((c) => {
                      const checked = selectedSeries.has(c.id)
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggleSeries(c.id)}
                          className={cn(
                            'flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors',
                            checked
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/40 hover:bg-muted/40',
                          )}
                        >
                          <span
                            className={cn(
                              'flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors',
                              checked ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40',
                            )}
                          >
                            {checked && <Check className="h-2.5 w-2.5" />}
                          </span>
                          <span className="flex items-center gap-1.5 min-w-0 flex-1">
                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 font-mono shrink-0">
                              {c.code}
                            </Badge>
                            <span className="text-xs truncate">{c.name}</span>
                          </span>
                          <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                            ({c.itemCount.toLocaleString()})
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Plan selector */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Select Plan
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {plans.map((p) => {
                  const active = planMonths === p.months
                  return (
                    <button
                      key={p.months}
                      type="button"
                      onClick={() => setPlanMonths(p.months)}
                      className={cn(
                        'relative flex flex-col items-center gap-0.5 rounded-xl border p-3 transition-all',
                        active
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                          : 'border-border hover:border-primary/40 hover:bg-muted/40',
                      )}
                    >
                      {p.popular && (
                        <span className="absolute -top-2 right-2 rounded-full bg-primary px-1.5 py-0.5 text-[8px] font-bold text-primary-foreground">
                          POPULAR
                        </span>
                      )}
                      <span className="text-sm font-bold">{p.label}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">{formatCurrency(p.price)}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Cost + balance summary */}
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-medium">{selectedPlan?.label ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Content scope</span>
                <span className="font-medium">
                  {['Live', 'VOD', 'Series'].filter((_, i) => !Object.values(excluded)[i]).join(' + ') || 'None'}
                  {!excluded.series && selectedCount > 0 ? ` · ${selectedCount} series cats` : ''}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Cost</span>
                <span className="font-semibold tabular-nums">{selectedPlan ? formatCurrency(selectedPlan.price) : '—'}</span>
              </div>
              <div className="border-t border-border my-1" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Current balance</span>
                <span className="font-medium tabular-nums">{formatCurrency(balance)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Balance after</span>
                <span className={cn('font-semibold tabular-nums', insufficient ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400')}>
                  {selectedPlan ? formatCurrency(balance - selectedPlan.price) : '—'}
                </span>
              </div>
              {insufficient && (
                <p className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Insufficient balance. Add funds to create this line.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2.5">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-[2] bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                disabled={mutation.isPending || allExcluded || insufficient || !selectedPlan}
                onClick={() => mutation.mutate()}
              >
                {mutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Creating line…</>
                ) : (
                  <><ShieldCheck className="h-4 w-4" /> Create Subscription · {selectedPlan ? formatCurrency(selectedPlan.price) : ''}</>
                )}
              </Button>
            </div>

            {/* What you get */}
            <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><Wifi className="h-3 w-3" /> Auto-generated credentials</span>
              <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Instant activation</span>
              <span className="flex items-center gap-1"><X className="h-3 w-3" /> Cancel anytime</span>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
