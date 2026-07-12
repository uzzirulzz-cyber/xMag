'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Wallet,
  Tv,
  Film,
  Users,
  TrendingUp,
  TrendingDown,
  Eye,
  Server,
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Crown,
  ShieldCheck,
  Globe,
  Radio,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatCurrency, formatNumber } from '@/lib/format'
import type { Overview, ChannelStats, Transaction, Subscription } from './types'

export function DashboardView({ onNavigate }: { onNavigate: (v: string) => void }) {
  const { data: overview, isLoading } = useQuery<Overview>({
    queryKey: ['overview'],
    queryFn: async () => (await fetch('/api/funds/overview')).json(),
  })
  const { data: stats } = useQuery<ChannelStats>({
    queryKey: ['channel-stats'],
    queryFn: async () => (await fetch('/api/funds/channels/stats')).json(),
    refetchInterval: 30_000,
  })
  const { data: txData } = useQuery<{ items: Transaction[] }>({
    queryKey: ['transactions', 'dashboard'],
    queryFn: async () => (await fetch('/api/funds/transactions?limit=5')).json(),
  })
  const { data: subData } = useQuery<{ subscriptions: Subscription[] }>({
    queryKey: ['subscriptions', 'dashboard'],
    queryFn: async () => (await fetch('/api/funds/subscriptions')).json(),
  })
  const { data: admin } = useQuery<{ accountTitle: string; bankName: string; routing: string }>({
    queryKey: ['admin-info'],
    queryFn: async () => (await fetch('/api/funds/admin-info')).json(),
  })

  const activeLines = subData?.subscriptions.filter((s) => s.status === 'active').length ?? 0

  const kpis = [
    { label: 'Balance', value: overview ? formatCurrency(overview.balance) : '—', icon: Wallet, color: 'text-primary', bg: 'bg-primary/10', onClick: () => onNavigate('funds') },
    { label: 'Active Lines', value: activeLines, icon: Users, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', onClick: () => onNavigate('lines') },
    { label: 'Channels', value: stats ? `${formatNumber(stats.advertisedTotal)}+` : '—', icon: Tv, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500/10', onClick: () => onNavigate('live') },
    { label: 'Viewing Now', value: stats ? formatNumber(stats.totalViewers) : '—', icon: Eye, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', onClick: () => onNavigate('live') },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <Card className="relative overflow-hidden p-6 bg-gradient-to-br from-primary/10 via-card to-card border-primary/20">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {overview?.reseller.fullName ?? 'Reseller'} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Your reseller panel is running in enterprise mode on MongoDB Atlas. Manage funds, create IPTV lines, and browse {stats ? formatNumber(stats.advertisedTotal) : '15,000'}+ channels.
          </p>
          <div className="mt-4 flex gap-2 flex-wrap">
            <Button size="sm" onClick={() => onNavigate('funds')} className="gap-1.5">
              <Wallet className="h-4 w-4" /> Add Funds
            </Button>
            <Button size="sm" variant="outline" onClick={() => onNavigate('lines')} className="gap-1.5">
              <Tv className="h-4 w-4" /> New Line
            </Button>
            <Button size="sm" variant="outline" onClick={() => onNavigate('live')} className="gap-1.5">
              <Radio className="h-4 w-4" /> Browse Channels
            </Button>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
      </Card>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="p-5 cursor-pointer hover:border-primary/40 transition-colors" onClick={k.onClick}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{k.label}</p>
                {isLoading ? <Skeleton className="mt-2 h-7 w-24" /> : <p className="mt-1 text-xl font-bold tabular-nums">{k.value}</p>}
              </div>
              <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', k.bg, k.color)}>
                <k.icon className="h-5 w-5" />
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Admin funds routing + recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funds route to admin */}
        <Card className="lg:col-span-1 p-5 bg-gradient-to-br from-violet-500/5 to-card border-violet-400/30">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-semibold">Funds Routing</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            All deposits route to the admin account for approval before credit is issued.
          </p>
          <div className="space-y-3">
            <RouteRow label="Total processed" value={overview ? formatCurrency(overview.totalAdded) : '—'} icon={TrendingUp} color="text-emerald-600" />
            <RouteRow label="Pending approval" value={overview ? formatCurrency(overview.pendingAmount) : '—'} icon={Activity} color="text-amber-600" />
            <RouteRow label="Routed to admin" value={overview ? formatCurrency(overview.totalAdded) : '—'} icon={Crown} color="text-violet-600" />
          </div>
          <div className="mt-4 rounded-lg bg-violet-500/5 p-3 text-[11px] text-muted-foreground">
            <span className="font-medium text-violet-600 dark:text-violet-400">Admin:</span> {admin?.accountTitle ?? 'MUHAMMAD UZAIR'} ·
            {admin?.bankName ?? 'Bank Alfalah'} · receives 100% of deposits worldwide · approves credit to resellers.
          </div>
        </Card>

        {/* Recent activity */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Recent Activity</h3>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('orders')} className="text-xs">View all →</Button>
          </div>
          {!txData ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <ul className="space-y-1">
              {txData.items.slice(0, 5).map((t) => {
                const isCredit = t.type === 'credit'
                return (
                  <li key={t.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                    <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', isCredit ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600')}>
                      {isCredit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.description}</p>
                      <p className="text-[11px] text-muted-foreground">{new Date(t.createdAt).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })} · {t.reference}</p>
                    </div>
                    <span className={cn('text-sm font-semibold tabular-nums', isCredit ? 'text-emerald-600' : 'text-rose-600')}>
                      {isCredit ? '+' : '−'}{formatCurrency(t.amount)}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStat icon={TrendingUp} label="Total Added" value={overview ? formatCurrency(overview.totalAdded) : '—'} />
        <MiniStat icon={TrendingDown} label="Total Spent" value={overview ? formatCurrency(overview.totalSpent) : '—'} />
        <MiniStat icon={Server} label="Servers Online" value="3 / 3" />
        <MiniStat icon={Globe} label="World Package" value="Active" />
      </div>
    </div>
  )
}

function RouteRow({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ElementType; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className={cn('h-3.5 w-3.5', color)} /> {label}
      </span>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
    </div>
  )
}

function MiniStat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <Card className="p-4 flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground shrink-0">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </Card>
  )
}
