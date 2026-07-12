'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Globe,
  Search,
  Copy,
  Play,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Tv,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/lib/format'
import { useToast } from '@/hooks/use-toast'
import { StreamPlayer } from './stream-player'

export type PlaylistKey = 'all' | 'pk' | 'in' | 'uk' | 'us' | 'sports' | 'news' | 'movies'
export interface PublicChannel {
  name: string
  logo: string | null
  group: string
  url: string
  tvgId: string | null
}

const PLAYLISTS: { key: PlaylistKey; label: string }[] = [
  { key: 'all', label: 'All Countries' },
  { key: 'pk', label: 'Pakistan' },
  { key: 'in', label: 'India' },
  { key: 'uk', label: 'United Kingdom' },
  { key: 'us', label: 'United States' },
  { key: 'sports', label: 'Sports' },
  { key: 'news', label: 'News' },
  { key: 'movies', label: 'Movies' },
]

export function FreePublicChannelsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [playlist, setPlaylist] = useState<PlaylistKey>('all')
  const [group, setGroup] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [playerChannel, setPlayerChannel] = useState<{ name: string; url: string } | null>(null)
  const { toast } = useToast()

  // Groups for current playlist
  const { data: groupsData, isLoading: groupsLoading } = useQuery<{ groups: { group: string; count: number }[] }>({
    queryKey: ['iptv-org-groups', playlist],
    queryFn: async () => (await fetch(`/api/funds/iptv-org/groups?playlist=${playlist}`)).json(),
    enabled: open,
  })

  // Channels
  const { data, isLoading } = useQuery<{ items: PublicChannel[]; total: number; totalPages: number }>({
    queryKey: ['iptv-org-channels', playlist, group, search, page],
    queryFn: async () => {
      const params = new URLSearchParams({ playlist, page: String(page), limit: '48' })
      if (group !== 'all') params.set('group', group)
      if (search) params.set('q', search)
      const res = await fetch('/api/funds/iptv-org/channels?' + params.toString())
      if (!res.ok) throw new Error('Failed to load')
      return res.json()
    },
    enabled: open,
  })

  const channels = data?.items ?? []
  const totalPages = data?.totalPages ?? 1

  const copy = async (url: string, name: string) => {
    try {
      await navigator.clipboard.writeText(url)
      toast({ title: 'Stream URL copied', description: name })
    } catch {
      toast({ title: 'Copy failed', variant: 'destructive' })
    }
  }

  const switchPlaylist = (key: PlaylistKey) => {
    setPlaylist(key)
    setGroup('all')
    setSearch('')
    setPage(1)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setGroup('all'); setSearch(''); setPage(1) } }}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[92vh] overflow-hidden p-0 gap-0">
        {/* Header — cyan gradient */}
        <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
              <Globe className="h-5 w-5" />
            </span>
            <div>
              <DialogTitle className="text-base font-semibold leading-tight">Free Public Channels</DialogTitle>
              <DialogDescription className="text-white/80 text-xs leading-tight">
                {data ? `${formatNumber(data.total)} channels from iptv-org` : 'Loading…'} · public-domain, legal streams
              </DialogDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 gap-1.5"
            onClick={() => window.open('https://github.com/iptv-org/iptv', '_blank')}
          >
            <Globe className="h-3.5 w-3.5" /> Source
          </Button>
        </div>

        <div className="flex h-[calc(92vh-72px)]">
          {/* Sidebar — playlist selector + groups */}
          <div className="w-56 shrink-0 border-r border-border flex flex-col overflow-hidden">
            {/* Playlist selector */}
            <div className="p-3 border-b border-border">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Playlist</p>
              <div className="flex flex-wrap gap-1">
                {PLAYLISTS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => switchPlaylist(p.key)}
                    className={cn(
                      'rounded-md px-2 py-1 text-[11px] font-medium transition-colors',
                      playlist === p.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70',
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Groups list */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Groups</p>
              {groupsLoading ? (
                <div className="space-y-1.5">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-7 w-full" />)}</div>
              ) : (
                <ul className="space-y-0.5">
                  <li>
                    <button
                      type="button"
                      onClick={() => { setGroup('all'); setPage(1) }}
                      className={cn(
                        'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors',
                        group === 'all' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-muted-foreground',
                      )}
                    >
                      <span>All groups</span>
                    </button>
                  </li>
                  {(groupsData?.groups ?? []).slice(0, 40).map((g) => (
                    <li key={g.group}>
                      <button
                        type="button"
                        onClick={() => { setGroup(g.group); setPage(1) }}
                        className={cn(
                          'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors',
                          group === g.group ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-muted-foreground',
                        )}
                      >
                        <span className="truncate text-left">{g.group}</span>
                        <span className="text-[9px] text-muted-foreground tabular-nums shrink-0 ml-1">{g.count}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Main — search + channel grid */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-2 border-b border-border px-4 py-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search channels…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                  className="pl-9"
                />
              </div>
              {group !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {group}
                  <button type="button" onClick={() => { setGroup('all'); setPage(1) }} className="ml-1 hover:text-foreground">×</button>
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {data ? `${formatNumber(data.total)} channels` : '…'}
              </span>
            </div>

            {/* Channel grid */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
              {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
                </div>
              ) : channels.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted"><Tv className="h-6 w-6 text-muted-foreground" /></span>
                  <p className="text-sm font-medium">No channels found</p>
                  <p className="text-xs text-muted-foreground">Try a different group or search term.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {channels.map((c, i) => (
                    <div key={`${c.name}-${i}`} className="group rounded-xl border border-border bg-card p-3 transition-all hover:border-primary/40 hover:shadow-md">
                      <div className="flex items-start gap-2.5">
                        <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted overflow-hidden">
                          {c.logo ? (
                            <img src={c.logo} alt="" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0' }} />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          )}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold leading-tight line-clamp-2">{c.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate mt-0.5">{c.group}</p>
                        </div>
                      </div>
                      <div className="mt-2.5 flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 flex-1 gap-1 text-[11px]"
                          onClick={() => setPlayerChannel({ name: c.name, url: c.url })}
                        >
                          <Play className="h-3 w-3" /> Play
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => copy(c.url, c.name)}
                          aria-label="Copy URL"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2.5">
                <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="gap-1 h-7">
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="gap-1 h-7">
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
      <StreamPlayer
        open={!!playerChannel}
        onOpenChange={(v) => !v && setPlayerChannel(null)}
        name={playerChannel?.name ?? ''}
        url={playerChannel?.url ?? ''}
      />
    </Dialog>
  )
}
