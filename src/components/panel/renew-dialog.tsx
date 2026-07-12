'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { RefreshCw, Loader2, ShieldCheck, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'
import { useToast } from '@/hooks/use-toast'
import type { Subscription, SubscriptionPlan } from './types'

export function RenewDialog({
  subscription,
  onOpenChange,
  balance,
  onDone,
}: {
  subscription: Subscription | null
  onOpenChange: (v: boolean) => void
  balance: number
  onDone: () => void
}) {
  const [planMonths, setPlanMonths] = useState<number>(12)
  const { toast } = useToast()

  const { data: plansData } = useQuery<{ plans: SubscriptionPlan[] }>({
    queryKey: ['plans'],
    queryFn: async () => {
      const res = await fetch('/api/funds/plans')
      if (!res.ok) throw new Error('Failed to load plans')
      return res.json()
    },
    enabled: !!subscription,
  })
  const plans = plansData?.plans ?? []
  const selectedPlan = plans.find((p) => p.months === planMonths)

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/funds/subscriptions/${subscription!.id}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planMonths }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.error || 'Renewal failed')
      return d
    },
    onSuccess: (d) => {
      toast({
        title: 'Line renewed',
        description: `${subscription?.username} extended by ${planMonths} month(s). ${formatCurrency(d.transaction.amount)} debited.`,
      })
      onDone()
      onOpenChange(false)
    },
    onError: (e: Error) => toast({ title: 'Renewal failed', description: e.message, variant: 'destructive' }),
  })

  if (!subscription) return null

  const daysLeft = Math.max(0, Math.ceil((new Date(subscription.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
  const insufficient = selectedPlan ? balance < selectedPlan.price : false

  return (
    <Dialog open={!!subscription} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[95vw] p-0 gap-0">
        <div className="flex items-center gap-2.5 bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-4 text-white rounded-t-lg">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 backdrop-blur">
            <RefreshCw className="h-5 w-5" />
          </span>
          <div>
            <DialogTitle className="text-base font-semibold leading-tight">Renew / Extend Line</DialogTitle>
            <DialogDescription className="text-white/80 text-xs leading-tight">
              {subscription.username} · currently {subscription.status === 'disabled' ? 'disabled' : daysLeft > 0 ? `${daysLeft}d left` : 'expired'}
            </DialogDescription>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Current expiry */}
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current expiry</span>
              <span className="font-medium">{new Date(subscription.expiresAt).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium capitalize">{subscription.status}</span>
            </div>
          </div>

          {/* Plan picker */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Extend by</p>
            <div className="grid grid-cols-2 gap-2.5">
              {plans.length === 0
                ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)
                : plans.map((p) => {
                    const active = planMonths === p.months
                    return (
                      <button
                        key={p.months}
                        type="button"
                        onClick={() => setPlanMonths(p.months)}
                        className={cn(
                          'relative flex flex-col items-center gap-0.5 rounded-xl border p-3 transition-all',
                          active ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'border-border hover:border-primary/40 hover:bg-muted/40',
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

          {/* Summary */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Cost</span>
              <span className="font-semibold tabular-nums">{selectedPlan ? formatCurrency(selectedPlan.price) : '—'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Current balance</span>
              <span className="font-medium tabular-nums">{formatCurrency(balance)}</span>
            </div>
            <div className="border-t border-border my-1" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Balance after</span>
              <span className={cn('font-semibold tabular-nums', insufficient ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400')}>
                {selectedPlan ? formatCurrency(balance - selectedPlan.price) : '—'}
              </span>
            </div>
            {insufficient && (
              <p className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5" />
                Insufficient balance. Add funds to renew this line.
              </p>
            )}
          </div>

          <Button
            type="button"
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
            disabled={mutation.isPending || insufficient || !selectedPlan}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Renewing…</>
            ) : (
              <><ShieldCheck className="h-4 w-4" /> Renew · {selectedPlan ? formatCurrency(selectedPlan.price) : ''}</>
            )}
          </Button>
          {subscription.status === 'disabled' && (
            <p className="text-center text-[11px] text-muted-foreground">
              Renewing will also re-enable this line.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
