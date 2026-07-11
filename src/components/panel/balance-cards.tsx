'use client'

import { Wallet, TrendingUp, TrendingDown, Clock, ArrowDownLeft, ArrowUpRight, DollarSign } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'
import type { Overview } from './types'

interface CardDef {
  key: string
  label: string
  value: number
  icon: React.ElementType
  tint: string
  iconBg: string
  sub: string
  trend?: string
  trendUp?: boolean
}

export function BalanceCards({ overview, loading }: { overview: Overview | undefined; loading: boolean }) {
  const cards: CardDef[] = [
    {
      key: 'balance',
      label: 'Current Balance',
      value: overview?.balance ?? 0,
      icon: Wallet,
      tint: 'text-primary',
      iconBg: 'bg-primary/10',
      sub: 'Available credit for orders',
    },
    {
      key: 'added',
      label: 'Total Added',
      value: overview?.totalAdded ?? 0,
      icon: TrendingUp,
      tint: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-500/10',
      sub: 'Lifetime deposits',
      trend: `+${formatCurrency(overview?.monthAdded ?? 0, overview?.currency)} this month`,
      trendUp: true,
    },
    {
      key: 'spent',
      label: 'Total Spent',
      value: overview?.totalSpent ?? 0,
      icon: TrendingDown,
      tint: 'text-rose-600 dark:text-rose-400',
      iconBg: 'bg-rose-500/10',
      sub: 'On subscriptions',
      trend: `${formatCurrency(overview?.monthSpent ?? 0, overview?.currency)} this month`,
      trendUp: false,
    },
    {
      key: 'pending',
      label: 'Pending Requests',
      value: overview?.pendingAmount ?? 0,
      icon: Clock,
      tint: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-500/10',
      sub: `${overview?.pendingCount ?? 0} awaiting review`,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.key} className="relative overflow-hidden p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{c.label}</p>
              {loading ? (
                <Skeleton className="mt-2 h-8 w-32" />
              ) : (
                <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight">
                  {c.key === 'pending' ? formatCurrency(c.value, overview?.currency) : formatCurrency(c.value, overview?.currency)}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground truncate">{c.sub}</p>
            </div>
            <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', c.iconBg, c.tint)}>
              <c.icon className="h-5 w-5" />
            </span>
          </div>

          {c.trend && (
            <div className="mt-3 flex items-center gap-1.5 text-xs">
              {c.trendUp ? (
                <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <ArrowUpRight className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
              )}
              <span className={cn('font-medium', c.trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
                {c.trend}
              </span>
            </div>
          )}

          {/* decorative corner */}
          <div className="pointer-events-none absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-gradient-to-br from-primary/5 to-transparent" />
        </Card>
      ))}

      {/* Exchange rate card spanning full width on small, narrow on xl */}
      <Card className="p-5 sm:col-span-2 xl:col-span-4 bg-gradient-to-br from-primary/5 via-card to-card border-primary/20">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <DollarSign className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Exchange Rate</p>
              <p className="text-sm font-semibold">
                1 USD credit = {formatCurrency(overview?.exchangeRate.usdToPkr ?? 280, 'PKR')}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <RateChip label="USD → PKR" value={formatCurrency(overview?.exchangeRate.usdToPkr ?? 280, 'PKR')} />
            <RateChip label="PKR → USD" value={`$${(overview?.exchangeRate.pkrToUsdCredit ?? 0).toFixed(4)}`} />
            <RateChip label="Card fee" value="3%" />
          </div>
          <p className="text-xs text-muted-foreground max-w-md">
            Credit is purchased in PKR. USDT deposits are converted at the live panel rate and credited within 10 minutes of confirmation.
          </p>
        </div>
      </Card>
    </div>
  )
}

function RateChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  )
}
