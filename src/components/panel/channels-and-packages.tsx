'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Tv,
  Film,
  Clapperboard,
  Users,
  Radio,
  Package,
  Search,
  Eye,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Globe,
  Crown,
  Hd,
  Play,
  Inbox,
  Lock,
  ShieldAlert,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/lib/format'
import { useToast } from '@/hooks/use-toast'
import type { Channel, ChannelPackage, ChannelStats } from './types'
import { WorldPackageDialog } from './world-package-dialog'
import { FreePublicChannelsDialog } from './free-public-channels-dialog'
import { StreamPlayer } from './stream-player'

const TYPE_ICON: Record<string, React.ElementType> = {
  live: Radio,
  vod: Film,
  series: Clapperboard,
}

const CATEGORY_COLORS: Record<string, string> = {
  Sports: '#16a34a',
  News: '#dc2626',
  Entertainment: '#7c3aed',
  Movies: '#0891b2',
  Kids: '#ea580c',
  Documentary: '#0d9488',
  Music: '#db2777',
  Religious: '#65a30d',
}

export function ChannelsAndPackages({ forceType }: { forceType?: string }) {
  const [selectedPackage, setSelectedPackage] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>(forceType ?? 'all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [countryFilter, setCountryFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [adultUnlocked, setAdultUnlocked] = useState(true) // all content open by default (no PIN lock)
  const [pinDialogOpen, setPinDialogOpen] = useState(false)
  const [worldOpen, setWorldOpen] = useState(false)
  const [freePublicOpen, setFreePublicOpen] = useState(false)
  const [playerChannel, setPlayerChannel] = useState<{ name: string; url: string; category?: string; viewers?: number } | null>(null)
  const { toast } = useToast()

  // Stats
  const { data: stats, isLoading: statsLoading } = useQuery<ChannelStats>({
    queryKey: ['channel-stats'],
    queryFn: async () => {
      const res = await fetch('/api/funds/channels/stats')
      if (!res.ok) throw new Error('Failed to load stats')
      return res.json()
    },
    refetchInterval: 30_000, // refresh viewership every 30s
  })

  // Packages
  const { data: pkgData } = useQuery<{ packages: ChannelPackage[] }>({
    queryKey: ['packages'],
    queryFn: async () => {
      const res = await fetch('/api/funds/packages')
      if (!res.ok) throw new Error('Failed to load packages')
      return res.json()
    },
  })
  const packages = pkgData?.packages ?? []

  // Channels list
  const { data: chanData, isLoading: chanLoading } = useQuery<{ items: Channel[]; total: number; totalPages: number }>({
    queryKey: ['channels', selectedPackage, typeFilter, categoryFilter, countryFilter, search, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '24' })
      if (selectedPackage !== 'all') params.set('packageId', selectedPackage)
      if (typeFilter !== 'all') params.set('type', typeFilter)
      if (categoryFilter !== 'all') params.set('category', categoryFilter)
      if (countryFilter !== 'all') params.set('country', countryFilter)
      if (search) params.set('q', search)
      const res = await fetch('/api/funds/channels?' + params.toString())
      if (!res.ok) throw new Error('Failed to load channels')
      return res.json()
    },
  })
  const channels = chanData?.items ?? []
  const totalPages = chanData?.totalPages ?? 1

  const countries = useMemo(() => stats?.byCountry.map((c) => c.country) ?? [], [stats])
  const categories = useMemo(() => stats?.byCategory.map((c) => c.category) ?? [], [stats])

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Tv}
          label="Total Channels"
          value={stats ? `${formatNumber(stats.advertisedTotal)}+` : '—'}
          sub={stats ? `${formatNumber(stats.totalChannels)} browsable · ${stats.packages} packages` : 'Loading…'}
          color="text-primary"
          bg="bg-primary/10"
          loading={statsLoading}
        />
        <StatCard
          icon={Eye}
          label="Viewing Now"
          value={stats ? formatNumber(stats.totalViewers) : '—'}
          sub={stats ? `${stats.activeChannels} channels active` : 'Loading…'}
          color="text-emerald-600 dark:text-emerald-400"
          bg="bg-emerald-500/10"
          loading={statsLoading}
          pulse
        />
        <StatCard
          icon={Crown}
          label="Top Channel"
          value={stats?.topChannels[0]?.name ?? '—'}
          sub={stats?.topChannels[0] ? `${formatNumber(stats.topChannels[0].currentViewers)} viewers` : 'Loading…'}
          color="text-amber-600 dark:text-amber-400"
          bg="bg-amber-500/10"
          loading={statsLoading}
        />
        <StatCard
          icon={TrendingUp}
          label="Top Category"
          value={stats?.byCategory[0]?.category ?? '—'}
          sub={stats?.byCategory[0] ? `${formatNumber(stats.byCategory[0].viewers)} viewers` : 'Loading…'}
          color="text-violet-600 dark:text-violet-400"
          bg="bg-violet-500/10"
          loading={statsLoading}
        />
      </div>

      {/* Package cards */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Package className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Packages &amp; Bouquets</h3>
          <span className="text-xs text-muted-foreground">— click a package to filter channels</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          <PackageCard
            name="All Channels"
            icon={Globe}
            color="#64748b"
            channelCount={stats?.totalChannels ?? 0}
            totalViewers={stats?.totalViewers ?? 0}
            active={selectedPackage === 'all'}
            onClick={() => { setSelectedPackage('all'); setPage(1) }}
          />
          {/* World Package (Family) — real Xtream server */}
          <button
            type="button"
            onClick={() => setWorldOpen(true)}
            className="group relative flex flex-col items-start gap-2 rounded-xl border border-violet-400/60 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 p-3 text-left transition-all hover:border-violet-500 hover:shadow-md"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-sm">
              <Globe className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0 w-full">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold leading-tight truncate">World Package</p>
                <Badge className="shrink-0 h-4 px-1 text-[8px] font-bold bg-violet-600 text-white">LIVE</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Family · 242K+ streams</p>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-violet-600 dark:text-violet-400 font-medium">
              <Globe className="h-2.5 w-2.5" /> Real server
            </div>
          </button>
          {/* Free Public Channels — iptv-org */}
          <button
            type="button"
            onClick={() => setFreePublicOpen(true)}
            className="group relative flex flex-col items-start gap-2 rounded-xl border border-cyan-400/60 bg-gradient-to-br from-cyan-500/10 to-sky-500/10 p-3 text-left transition-all hover:border-cyan-500 hover:shadow-md"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-600 to-sky-600 text-white shadow-sm">
              <Globe className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0 w-full">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold leading-tight truncate">Free Public</p>
                <Badge className="shrink-0 h-4 px-1 text-[8px] font-bold bg-cyan-600 text-white">FREE</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">13,402 channels · iptv-org</p>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-cyan-600 dark:text-cyan-400 font-medium">
              <Globe className="h-2.5 w-2.5" /> Legal &amp; public
            </div>
          </button>
          {packages.map((p) => {
            const Icon = TYPE_ICON[p.type] || Tv
            const locked = p.pinProtected && !adultUnlocked
            return (
              <PackageCard
                key={p.id}
                name={p.name}
                icon={Icon}
                color={p.color}
                channelCount={p.advertisedCount || p.channelCount}
                totalViewers={p.totalViewers}
                active={selectedPackage === p.id}
                isAdult={p.isAdult}
                pinProtected={p.pinProtected}
                locked={locked}
                onClick={() => {
                  if (locked) {
                    setPinDialogOpen(true)
                    return
                  }
                  setSelectedPackage(p.id)
                  setPage(1)
                }}
              />
            )
          })}
        </div>
      </div>

      {/* Channel browser */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 flex-wrap">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Tv className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold">Channel Browser</h2>
              <p className="text-xs text-muted-foreground">
                {chanData ? `${formatNumber(chanData.total)} channels` : 'Loading…'} · live viewership updates every 30s
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {formatNumber(stats?.totalViewers ?? 0)} watching
          </Badge>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search channels…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1) }}>
            <SelectTrigger className="w-[120px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="vod">VOD</SelectItem>
              <SelectItem value="series">Series</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1) }}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={countryFilter} onValueChange={(v) => { setCountryFilter(v); setPage(1) }}>
            <SelectTrigger className="w-[110px]"><SelectValue placeholder="Country" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Channel grid */}
        <div className="p-4">
          {chanLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
            </div>
          ) : channels.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Inbox className="h-6 w-6 text-muted-foreground" />
              </span>
              <p className="text-sm font-medium">No channels found</p>
              <p className="text-xs text-muted-foreground">Try adjusting your filters or search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {channels.map((c) => (
                <ChannelCard
                  key={c.id}
                  c={c}
                  locked={c.category === 'Adult' && !adultUnlocked}
                  onStream={(channel) => setPlayerChannel({ name: channel.name, url: channel.streamUrl, category: channel.category, viewers: channel.currentViewers })}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3 flex-wrap">
            <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="gap-1">
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="gap-1">
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Top channels + category breakdown */}
      {stats && stats.topChannels.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Crown className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-semibold">Top 5 Channels</h3>
            </div>
            <ul className="space-y-3">
              {stats.topChannels.map((c, i) => (
                <li key={c.id} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                    {i + 1}
                  </span>
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white text-xs font-bold"
                    style={{ backgroundColor: c.color }}
                  >
                    {c.logoText}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{c.category} · {c.country} · {c.packageName}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{formatNumber(c.currentViewers)}</p>
                    <p className="text-[10px] text-muted-foreground">viewers</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Viewers by Category</h3>
            </div>
            <ul className="space-y-3">
              {stats.byCategory.slice(0, 8).map((cat) => {
                const pct = stats.totalViewers > 0 ? (cat.viewers / stats.totalViewers) * 100 : 0
                const color = CATEGORY_COLORS[cat.category] || '#64748b'
                return (
                  <li key={cat.category}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium">{cat.category}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {formatNumber(cat.viewers)} <span className="text-[10px]">({cat.channels} ch)</span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          </Card>
        </div>
      )}

      {/* Adult content PIN dialog */}
      <PinDialog
        open={pinDialogOpen}
        onOpenChange={setPinDialogOpen}
        onUnlock={() => {
          setAdultUnlocked(true)
          setPinDialogOpen(false)
          toast({ title: 'Adult content unlocked', description: 'PIN accepted. Adult channels are now visible.' })
        }}
      />

      {/* World Package (Family) — real Xtream server browser */}
      <WorldPackageDialog open={worldOpen} onOpenChange={setWorldOpen} />

      {/* Free Public Channels — iptv-org browser */}
      <FreePublicChannelsDialog open={freePublicOpen} onOpenChange={setFreePublicOpen} />

      {/* In-browser HLS stream player */}
      <StreamPlayer
        open={!!playerChannel}
        onOpenChange={(v) => !v && setPlayerChannel(null)}
        name={playerChannel?.name ?? ''}
        url={playerChannel?.url ?? ''}
        category={playerChannel?.category}
        viewers={playerChannel?.viewers}
      />
    </div>
  )
}

function PinDialog({
  open,
  onOpenChange,
  onUnlock,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onUnlock: () => void
}) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const DEMO_PIN = '1234'

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pin === DEMO_PIN) {
      setError(false)
      setPin('')
      onUnlock()
    } else {
      setError(true)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setPin(''); setError(false) } }}>
      <DialogContent className="max-w-sm w-[95vw] p-0 gap-0">
        <div className="flex items-center gap-2.5 bg-gradient-to-r from-violet-600 to-purple-700 px-5 py-4 text-white rounded-t-lg">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 backdrop-blur">
            <Lock className="h-5 w-5" />
          </span>
          <div>
            <DialogTitle className="text-base font-semibold leading-tight">Adult Content — PIN Required</DialogTitle>
            <DialogDescription className="text-white/80 text-xs leading-tight">
              18+ content is locked. Enter your reseller PIN to continue.
            </DialogDescription>
          </div>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="rounded-lg border border-violet-300/40 bg-violet-500/5 p-3 flex gap-2 text-xs text-muted-foreground">
            <ShieldAlert className="h-4 w-4 shrink-0 text-violet-600 mt-0.5" />
            <p>
              This package contains adult content restricted to viewers aged 18+.
              Access is gated behind a PIN to prevent unauthorised viewing.
              <span className="block mt-1 font-medium text-foreground">Demo PIN: 1234</span>
            </p>
          </div>
          <div className="space-y-2">
            <label htmlFor="adult-pin" className="text-xs font-medium">Enter PIN</label>
            <Input
              id="adult-pin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setError(false) }}
              placeholder="••••"
              className="text-center text-2xl tracking-[0.5em] font-bold h-14"
              autoFocus
            />
            {error && <p className="text-xs text-destructive">Incorrect PIN. Please try again.</p>}
          </div>
          <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 text-white" disabled={pin.length < 4}>
            <Lock className="h-4 w-4" /> Unlock Adult Content
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function StatCard({
  icon: Icon, label, value, sub, color, bg, loading, pulse,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub: string
  color: string
  bg: string
  loading?: boolean
  pulse?: boolean
}) {
  return (
    <Card className="relative overflow-hidden p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
          {loading ? (
            <Skeleton className="mt-1.5 h-6 w-20" />
          ) : (
            <p className={cn('mt-1 text-lg font-bold tabular-nums tracking-tight truncate', pulse && 'text-emerald-600 dark:text-emerald-400')}>
              {value}
            </p>
          )}
          <p className="text-[10px] text-muted-foreground truncate mt-0.5">{sub}</p>
        </div>
        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', bg, color)}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
    </Card>
  )
}

function PackageCard({
  name, icon: Icon, color, channelCount, totalViewers, active, isAdult, pinProtected, locked, onClick,
}: {
  name: string
  icon: React.ElementType
  color: string
  channelCount: number
  totalViewers: number
  active: boolean
  isAdult?: boolean
  pinProtected?: boolean
  locked?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all overflow-hidden',
        active ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'border-border hover:border-primary/40 hover:bg-muted/40',
        locked && 'select-none',
      )}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg text-white shadow-sm" style={{ backgroundColor: color }}>
        {locked ? <Lock className="h-[18px] w-[18px]" /> : <Icon className="h-[18px] w-[18px]" />}
      </span>
      <div className="min-w-0 w-full">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-semibold leading-tight truncate">{name}</p>
          {isAdult && (
            <Badge className="shrink-0 h-4 px-1 text-[8px] font-bold bg-violet-600 text-white">18+</Badge>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">{formatNumber(channelCount)} channels</p>
      </div>
      {locked ? (
        <div className="flex items-center gap-1 text-[10px] text-violet-600 dark:text-violet-400 font-medium">
          <ShieldAlert className="h-2.5 w-2.5" /> PIN required
        </div>
      ) : (
        <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
          <Users className="h-2.5 w-2.5" />
          {formatNumber(totalViewers)}
        </div>
      )}
    </button>
  )
}

function ChannelCard({ c, locked, onStream }: { c: Channel; locked?: boolean; onStream?: (c: Channel) => void }) {
  const [hovered, setHovered] = useState(false)
  const isLive = c.type === 'live' && c.currentViewers > 0
  const TypeIcon = TYPE_ICON[c.type] || Tv
  const catColor = CATEGORY_COLORS[c.category] || '#64748b'

  return (
    <div
      className={cn(
        'group relative rounded-xl border border-border bg-card p-3 transition-all hover:border-primary/40 hover:shadow-md',
        locked && 'blur-[6px] pointer-events-none select-none',
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {locked && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 rounded-xl bg-violet-950/40 backdrop-blur-sm pointer-events-auto">
          <Lock className="h-5 w-5 text-white" />
          <span className="text-[10px] font-semibold text-white">PIN locked</span>
        </div>
      )}
      {/* Header: logo + name + viewers */}
      <div className="flex items-start gap-2.5">
        <span
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white text-xs font-bold shadow-sm"
          style={{ backgroundColor: c.color }}
        >
          {c.logoText}
          {c.hd && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[7px] font-bold text-amber-950">
              HD
            </span>
          )}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold leading-tight truncate">{c.name}</p>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
            <Badge
              variant="outline"
              className="text-[9px] px-1.5 py-0 h-4 font-medium border-0"
              style={{ backgroundColor: catColor + '20', color: catColor }}
            >
              {c.category}
            </Badge>
            <span className="text-[10px] text-muted-foreground font-mono">{c.country}</span>
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <TypeIcon className="h-2.5 w-2.5" /> {c.type}
            </span>
          </div>
        </div>
      </div>

      {/* EPG now/next */}
      {c.epgNow && (
        <div className="mt-2.5 rounded-lg bg-muted/50 p-2">
          <div className="flex items-center gap-1.5">
            {isLive ? (
              <span className="flex items-center gap-1 text-[9px] font-bold text-rose-600 dark:text-rose-400 shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                LIVE
              </span>
            ) : (
              <Play className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
            )}
            <p className="text-[11px] font-medium truncate">{c.epgNow}</p>
          </div>
          {c.epgNext && (
            <p className="mt-0.5 text-[10px] text-muted-foreground truncate">
              <span className="font-medium">Next:</span> {c.epgNext}
            </p>
          )}
        </div>
      )}

      {/* Viewers footer */}
      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={cn(
            'flex items-center gap-1 text-xs font-semibold tabular-nums',
            c.currentViewers > 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
          )}>
            <Eye className="h-3 w-3" />
            {formatNumber(c.currentViewers)}
          </span>
          <span className="text-[10px] text-muted-foreground">watching</span>
        </div>
        {hovered && (
          <span className="text-[10px] text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Preview →
          </span>
        )}
      </div>

      {/* Viewer bar */}
      <div className="mt-1.5 h-0.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full', c.currentViewers > 100 ? 'bg-emerald-500' : 'bg-muted-foreground/40')}
          style={{ width: `${Math.min(100, (c.currentViewers / 600) * 100)}%` }}
        />
      </div>

      {/* Stream Now button */}
      <Button
        size="sm"
        className="mt-2.5 w-full h-8 gap-1.5 text-[11px] bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary"
        onClick={() => onStream(c)}
      >
        <Play className="h-3 w-3 fill-current" /> Stream Now
      </Button>
    </div>
  )
}
