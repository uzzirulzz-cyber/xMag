'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Globe,
  Tv,
  Film,
  Clapperboard,
  Trophy,
  ShieldCheck,
  Zap,
  Play,
  Check,
  Star,
  Users,
  Eye,
  Smartphone,
  Landmark,
  Bitcoin,
  CreditCard,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/lib/format'
import type { ChannelStats, PaymentMethod, ChannelPackage } from './types'

const PLAN_ICON: Record<string, React.ElementType> = {
  live: Tv,
  vod: Film,
  series: Clapperboard,
}

const PM_ICON: Record<string, React.ElementType> = {
  mobile_wallet: Smartphone,
  bank_transfer: Landmark,
  crypto: Bitcoin,
  card: CreditCard,
}

export function StoreFrontView({ onNavigate }: { onNavigate: (v: string) => void }) {
  const { data: stats } = useQuery<ChannelStats>({
    queryKey: ['channel-stats'],
    queryFn: async () => (await fetch('/api/funds/channels/stats')).json(),
    refetchInterval: 30_000,
  })
  const { data: pkgData } = useQuery<{ packages: ChannelPackage[] }>({
    queryKey: ['packages'],
    queryFn: async () => (await fetch('/api/funds/packages')).json(),
  })
  const { data: pmData } = useQuery<{ methods: PaymentMethod[] }>({
    queryKey: ['payment-methods'],
    queryFn: async () => (await fetch('/api/funds/payment-methods')).json(),
  })

  const packages = (pkgData?.packages ?? []).filter((p) => !p.isAdult)
  const methods = pmData?.methods ?? []

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-black via-zinc-950 to-black">
        {/* glow */}
        <div className="pointer-events-none absolute -top-20 left-1/4 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-1/4 h-72 w-72 rounded-full bg-red-600/20 blur-3xl" />
        <div className="relative z-10 px-6 py-16 sm:px-12 sm:py-20 text-center">
          <Badge className="mb-4 bg-primary/20 text-primary border-primary/30 backdrop-blur">
            <Sparkles className="h-3 w-3 mr-1" /> World Super IPTV
          </Badge>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight">
            MaGx <span className="text-primary">World</span> <span className="text-red-500">Super</span> IPTV
          </h1>
          <p className="mt-4 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto">
            {stats ? formatNumber(stats.advertisedTotal) : '18,000'}+ live channels, movies, sports and series.
            Worldwide access. Instant activation. Auto-credit payments.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" onClick={() => onNavigate('funds')} className="gap-2 bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => onNavigate('live')} className="gap-2 border-zinc-700 text-zinc-200 hover:bg-zinc-900">
              <Play className="h-4 w-4" /> Browse Channels
            </Button>
          </div>
          {/* trust badges */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Secure payments</span>
            <span className="flex items-center gap-1.5"><Zap className="h-4 w-4 text-amber-500" /> Instant activation</span>
            <span className="flex items-center gap-1.5"><Globe className="h-4 w-4 text-primary" /> Worldwide access</span>
            <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-violet-500" /> 24/7 support</span>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile icon={Tv} value={stats ? `${formatNumber(stats.advertisedTotal)}+` : '—'} label="Live Channels" />
        <StatTile icon={Eye} value={stats ? formatNumber(stats.totalViewers) : '—'} label="Viewing Now" accent />
        <StatTile icon={Trophy} value="980+" label="Sports Streams" />
        <StatTile icon={Film} value="4,200+" label="Movies & VOD" />
      </section>

      {/* Packages showcase */}
      <section>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">Channel Packages</h2>
          <p className="text-sm text-muted-foreground mt-1">Choose from {packages.length} curated bouquets — worldwide coverage.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.length === 0
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)
            : packages.map((p) => {
                const Icon = PLAN_ICON[p.type] || Tv
                return (
                  <Card key={p.id} className="group relative overflow-hidden p-5 border-zinc-800 bg-zinc-950/50 hover:border-primary/40 transition-all">
                    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl opacity-30" style={{ backgroundColor: p.color }} />
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-lg" style={{ backgroundColor: p.color }}>
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <h3 className="text-base font-bold">{p.name}</h3>
                          <p className="text-[11px] text-muted-foreground">{formatNumber(p.advertisedCount)} channels</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{p.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                          <Eye className="h-3 w-3" /> {formatNumber(p.totalViewers)} watching
                        </span>
                        <Button size="sm" variant="ghost" className="text-xs h-7 gap-1" onClick={() => onNavigate('live')}>
                          Explore <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              })}
        </div>
      </section>

      {/* Pricing */}
      <section>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">Simple Pricing</h2>
          <p className="text-sm text-muted-foreground mt-1">Pay with JazzCash, Easypaisa, Bank Alfalah, USDT or card. Auto-credited.</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { months: 1, price: 700, label: '1 Month', popular: false },
            { months: 3, price: 1400, label: '3 Months', popular: false },
            { months: 6, price: 2100, label: '6 Months', popular: false },
            { months: 12, price: 3500, label: '12 Months', popular: true },
          ].map((plan) => (
            <Card key={plan.months} className={cn('relative p-6 text-center border-zinc-800 bg-zinc-950/50', plan.popular && 'border-primary ring-1 ring-primary/30')}>
              {plan.popular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold text-primary-foreground">
                  MOST POPULAR
                </span>
              )}
              <p className="text-sm font-semibold text-muted-foreground">{plan.label}</p>
              <p className="mt-2 text-3xl font-black">
                <span className="text-lg align-top">Rs</span>{plan.price}
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground text-left">
                <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-500" /> 18,000+ channels</li>
                <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-500" /> HD & 4K quality</li>
                <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-500" /> All devices supported</li>
                <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-500" /> 24/7 support</li>
              </ul>
              <Button className="w-full mt-5 gap-1.5" variant={plan.popular ? 'default' : 'outline'} onClick={() => onNavigate('funds')}>
                Subscribe <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* Payment methods */}
      <section>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">Payment Methods</h2>
          <p className="text-sm text-muted-foreground mt-1">All payments route directly to admin. Auto-credited by our payment bot.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {methods.map((m) => {
            const Icon = PM_ICON[m.type] || CreditCard
            return (
              <Card key={m.id} className="p-4 text-center border-zinc-800 bg-zinc-950/50">
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg text-white text-xs font-bold mb-2" style={{ backgroundColor: m.color }}>
                  {m.logoText}
                </span>
                <p className="text-xs font-semibold">{m.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center justify-center gap-1"><Icon className="h-2.5 w-2.5" /> Auto-credit</p>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden rounded-3xl border border-red-600/30 bg-gradient-to-br from-red-950/40 via-black to-black p-8 sm:p-12 text-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.15),transparent_60%)]" />
        <div className="relative z-10">
          <Star className="h-8 w-8 text-amber-400 mx-auto mb-3 fill-current" />
          <h2 className="text-2xl sm:text-3xl font-bold">Ready to start streaming?</h2>
          <p className="mt-2 text-sm text-zinc-400 max-w-md mx-auto">
            Join thousands of happy viewers. Add funds, create your line, and start watching in minutes.
          </p>
          <Button size="lg" className="mt-6 gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800" onClick={() => onNavigate('funds')}>
            Get Started Now <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  )
}

function StatTile({ icon: Icon, value, label, accent }: { icon: React.ElementType; value: string; label: string; accent?: boolean }) {
  return (
    <Card className="p-5 border-zinc-800 bg-zinc-950/50">
      <Icon className={cn('h-5 w-5 mb-2', accent ? 'text-emerald-500' : 'text-primary')} />
      <p className="text-2xl font-black tabular-nums">{value}</p>
      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
    </Card>
  )
}
