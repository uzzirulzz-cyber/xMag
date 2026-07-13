'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Tv,
  Film,
  Clapperboard,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  Play,
  Shuffle,
  Radio,
  Star,
  Grid3x3,
  List,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/lib/format'
import { BigPlayer } from './big-player'
import type { Channel, ChannelPackage, ChannelStats } from './types'

export function LiveStreamsView() {
  return <ContentShell icon={Radio} title="Live Streams" subtitle="Browse all live TV channels across every package." type="live" />
}
export function MoviesView() {
  return <ContentShell icon={Film} title="Movies & VOD" subtitle="On-demand movies — Hollywood, Bollywood, 4K and more." type="vod" />
}
export function SeriesView() {
  return <ContentShell icon={Clapperboard} title="Series & Shows" subtitle="TV series — English, Hindi, Turkish, Arabic and more." type="series" />
}

function ContentShell({
  icon: Icon,
  title,
  subtitle,
  type,
}: {
  icon: React.ElementType
  title: string
  subtitle: string
  type: string
}) {
  const [selectedPackage, setSelectedPackage] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [layout, setLayout] = useState<'grid' | 'list'>('grid')
  const [nowPlaying, setNowPlaying] = useState<{ url: string; name: string; category?: string } | null>(null)

  const { data: stats } = useQuery<ChannelStats>({
    queryKey: ['channel-stats'],
    queryFn: async () => (await fetch('/api/funds/channels/stats')).json(),
    refetchInterval: 30_000,
  })

  const { data: pkgData } = useQuery<{ packages: ChannelPackage[] }>({
    queryKey: ['packages'],
    queryFn: async () => (await fetch('/api/funds/packages')).json(),
  })
  const packages = (pkgData?.packages ?? []).filter((p) => !p.isAdult)

  const { data: chanData, isLoading } = useQuery<{ items: Channel[]; total: number; totalPages: number }>({
    queryKey: ['channels', selectedPackage, type, search, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '24' })
      if (selectedPackage !== 'all') params.set('packageId', selectedPackage)
      if (type) params.set('type', type)
      if (search) params.set('q', search)
      const res = await fetch('/api/funds/channels?' + params.toString())
      if (!res.ok) throw new Error('Failed to load')
      return res.json()
    },
  })
  const channels = chanData?.items ?? []
  const totalPages = chanData?.totalPages ?? 1

  const shufflePlay = () => {
    if (channels.length === 0) return
    const random = channels[Math.floor(Math.random() * channels.length)]
    setNowPlaying({ url: random.streamUrl, name: random.name, category: random.category })
  }

  return (
    <div className="space-y-6">
      {/* Modern header with stats */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-blue-600 text-white shadow-lg">
            <Icon className="h-6 w-6" />
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 border-2 border-background">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            </span>
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {/* Live stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-600">{stats ? formatNumber(stats.totalViewers) : '—'} watching</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5">
            <Tv className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">{stats ? formatNumber(stats.totalChannels) : '—'} channels</span>
          </div>
        </div>
      </div>

      {/* Big player + now playing bar */}
      <div className="space-y-3">
        <BigPlayer url={nowPlaying?.url ?? ''} name={nowPlaying?.name ?? ''} />
        {nowPlaying ? (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" /> LIVE
              </span>
              <p className="text-sm font-medium">{nowPlaying.name}</p>
              {nowPlaying.category && <Badge variant="secondary" className="text-[9px]">{nowPlaying.category}</Badge>}
            </div>
            <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={shufflePlay}>
              <Shuffle className="h-3.5 w-3.5" /> Shuffle
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">↓ Pick a channel below to start playing</p>
            <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={shufflePlay}>
              <Shuffle className="h-3.5 w-3.5" /> Shuffle Play
            </Button>
          </div>
        )}
      </div>

      {/* Modern filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search channels…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9 h-9" />
        </div>
        {/* Layout toggle */}
        <div className="flex items-center rounded-lg border border-border overflow-hidden">
          <button onClick={() => setLayout('grid')} className={cn('flex h-9 w-9 items-center justify-center transition-colors', layout === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}>
            <Grid3x3 className="h-4 w-4" />
          </button>
          <button onClick={() => setLayout('list')} className={cn('flex h-9 w-9 items-center justify-center transition-colors', layout === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}>
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Package pills — modern */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => { setSelectedPackage('all'); setPage(1) }} className={cn(
          'rounded-full px-4 py-1.5 text-xs font-medium transition-all',
          selectedPackage === 'all' ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground',
        )}>
          All Channels
        </button>
        {packages.map((p) => (
          <button key={p.id} onClick={() => { setSelectedPackage(p.id); setPage(1) }} className={cn(
            'rounded-full px-4 py-1.5 text-xs font-medium transition-all flex items-center gap-1.5',
            selectedPackage === p.id ? 'text-white shadow-md' : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground',
          )} style={selectedPackage === p.id ? { backgroundColor: p.color } : {}}>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: selectedPackage === p.id ? 'rgba(255,255,255,0.5)' : p.color }} />
            {p.name}
          </button>
        ))}
      </div>

      {/* Channel cards — grid or list layout */}
      {isLoading ? (
        <div className={cn('grid gap-3', layout === 'grid' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6' : 'grid-cols-1')}>
          {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className={cn('rounded-xl', layout === 'grid' ? 'h-32' : 'h-16')} />)}
        </div>
      ) : channels.length === 0 ? (
        <Card className="p-12 text-center">
          <Tv className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">No channels found</p>
          <p className="text-xs text-muted-foreground mt-1">Try a different search or package filter.</p>
        </Card>
      ) : layout === 'grid' ? (
        /* GRID LAYOUT — modern channel cards */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {channels.map((c) => {
            const isPlaying = nowPlaying?.url === c.streamUrl
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setNowPlaying({ url: c.streamUrl, name: c.name, category: c.category })}
                className={cn(
                  'group relative overflow-hidden rounded-xl border bg-card text-left transition-all hover:shadow-lg hover:scale-[1.02]',
                  isPlaying ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/40',
                )}
              >
                {/* Top: logo + live badge */}
                <div className="relative h-20 flex items-center justify-center overflow-hidden" style={{ background: `linear-gradient(135deg, ${c.color}22, ${c.color}05)` }}>
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl text-white text-sm font-bold shadow-md transition-transform group-hover:scale-110" style={{ backgroundColor: c.color }}>
                    {c.logoText}
                  </span>
                  {/* Play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg">
                      <Play className="h-4 w-4 fill-current text-black" />
                    </span>
                  </div>
                  {/* LIVE badge */}
                  {isPlaying && (
                    <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-rose-600 px-1.5 py-0.5 text-[8px] font-bold text-white">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> LIVE
                    </span>
                  )}
                  {/* HD badge */}
                  {c.hd && (
                    <span className="absolute top-2 right-2 rounded bg-amber-400 px-1 py-0.5 text-[7px] font-bold text-amber-950">HD</span>
                  )}
                </div>
                {/* Bottom: name + viewers */}
                <div className="p-2.5">
                  <p className="text-xs font-semibold leading-tight line-clamp-2 mb-1">{c.name}</p>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Eye className="h-2.5 w-2.5" /> {formatNumber(c.currentViewers)}
                    </span>
                    {c.currentViewers > 100 && (
                      <Star className="h-2.5 w-2.5 text-amber-500 fill-current" />
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        /* LIST LAYOUT — compact rows */
        <div className="space-y-1.5">
          {channels.map((c) => {
            const isPlaying = nowPlaying?.url === c.streamUrl
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setNowPlaying({ url: c.streamUrl, name: c.name, category: c.category })}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all hover:shadow-md',
                  isPlaying ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'border-border hover:border-primary/40 hover:bg-muted/30',
                )}
              >
                <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white text-xs font-bold shadow-sm" style={{ backgroundColor: c.color }}>
                  {c.logoText}
                  {c.hd && <span className="absolute -top-1 -right-1 rounded bg-amber-400 px-0.5 text-[7px] font-bold text-amber-950">HD</span>}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    {isPlaying && <span className="flex items-center gap-1 text-[9px] font-bold text-rose-600 shrink-0"><span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" /> LIVE</span>}
                  </div>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                    <span className="flex items-center gap-1"><Eye className="h-2.5 w-2.5" /> {formatNumber(c.currentViewers)}</span>
                    <span>·</span>
                    <span>{c.category}</span>
                  </p>
                </div>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                  <Play className="h-3.5 w-3.5" />
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="gap-1">
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
          <span className="text-sm text-muted-foreground tabular-nums">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="gap-1">
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
