'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Tv, Search, Eye, ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/lib/format'
import { BigPlayer } from './big-player'
import type { Channel, ChannelPackage, ChannelStats } from './types'

const TYPE_ICON: Record<string, React.ElementType> = {
  live: Tv,
}

export function LiveStreamsView() {
  return <ContentShell icon={Tv} title="Live Streams" subtitle="Browse all live TV channels across every package." type="live" />
}

export function MoviesView() {
  return <ContentShell icon={Tv} title="Movies & VOD" subtitle="On-demand movies — Hollywood, Bollywood, 4K and more." type="vod" />
}

export function SeriesView() {
  return <ContentShell icon={Tv} title="Series & Shows" subtitle="TV series — English, Hindi, Turkish, Arabic and more." type="series" />
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
  const [nowPlaying, setNowPlaying] = useState<{ url: string; name: string } | null>(null)

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
      const params = new URLSearchParams({ page: String(page), limit: '48' })
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      {/* Big embedded player + channel list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Player — left 2/3 */}
        <div className="lg:col-span-2 space-y-3">
          <BigPlayer url={nowPlaying?.url ?? ''} name={nowPlaying?.name ?? ''} />
          {nowPlaying ? (
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Now playing: {nowPlaying.name}</p>
              <Badge variant="secondary" className="gap-1 text-[10px]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE
              </Badge>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Pick a channel from the list →</p>
          )}
        </div>

        {/* Channel list — right 1/3 */}
        <Card className="overflow-hidden max-h-[500px] flex flex-col">
          <div className="border-b border-border px-4 py-2 flex items-center gap-2">
            <span className="text-xs font-semibold">Channels</span>
            <Badge variant="secondary" className="text-[9px]">{chanData?.total ?? 0}</Badge>
          </div>
          <div className="relative px-4 py-2 border-b border-border">
            <Search className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="h-7 text-xs pl-7" />
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {isLoading ? (
              <div className="p-2 space-y-1">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : channels.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">No channels</p>
            ) : (
              channels.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setNowPlaying({ url: c.streamUrl, name: c.name })}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted/40 transition-colors border-b border-border/50',
                    nowPlaying?.url === c.streamUrl && 'bg-primary/5',
                  )}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-white text-[9px] font-bold" style={{ backgroundColor: c.color }}>
                    {c.logoText}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-xs font-medium truncate">{c.name}</span>
                    <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
                      <Eye className="h-2 w-2" /> {formatNumber(c.currentViewers)}
                    </span>
                  </span>
                  {nowPlaying?.url === c.streamUrl && (
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
          {totalPages > 1 && (
            <div className="border-t border-border px-3 py-1.5 flex items-center justify-between">
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}><ChevronLeft className="h-3.5 w-3.5" /></Button>
              <span className="text-[10px] text-muted-foreground">{page}/{totalPages}</span>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}><ChevronRight className="h-3.5 w-3.5" /></Button>
            </div>
          )}
        </Card>
      </div>

      {/* Package filter pills */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => { setSelectedPackage('all'); setPage(1) }} className={cn('rounded-full px-3 py-1 text-xs font-medium transition-colors', selectedPackage === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70')}>
          All Channels
        </button>
        {packages.map((p) => (
          <button key={p.id} onClick={() => { setSelectedPackage(p.id); setPage(1) }} className={cn('rounded-full px-3 py-1 text-xs font-medium transition-colors', selectedPackage === p.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70')}>
            {p.name}
          </button>
        ))}
      </div>
    </div>
  )
}
