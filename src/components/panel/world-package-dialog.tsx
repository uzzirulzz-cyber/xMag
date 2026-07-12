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
  Tv,
  Film,
  Search,
  Copy,
  ChevronLeft,
  Play,
  Server,
  Clock,
  Wifi,
  Star,
  Radio,
  ExternalLink,
  ImageIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/lib/format'
import { useToast } from '@/hooks/use-toast'
import { StreamPlayer } from './stream-player'
import type {
  XtreamAccount,
  XtreamCategory,
  XtreamLiveStream,
  XtreamVodStream,
} from './types'

export function WorldPackageDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [tab, setTab] = useState<'live' | 'vod'>('live')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [playerChannel, setPlayerChannel] = useState<{ name: string; url: string } | null>(null)
  const { toast } = useToast()

  // Account info
  const { data: account, isLoading: accountLoading } = useQuery<XtreamAccount>({
    queryKey: ['xtream-account'],
    queryFn: async () => {
      const res = await fetch('/api/funds/xtream/account')
      if (!res.ok) throw new Error('Failed to load account')
      return res.json()
    },
    enabled: open,
  })

  // Live categories
  const { data: liveCatsData, isLoading: liveCatsLoading } = useQuery<{ categories: XtreamCategory[]; totalStreams: number }>({
    queryKey: ['xtream-live-categories'],
    queryFn: async () => {
      const res = await fetch('/api/funds/xtream/live-categories')
      if (!res.ok) throw new Error('Failed to load live categories')
      return res.json()
    },
    enabled: open && tab === 'live' && !selectedCategory,
  })

  // VOD categories
  const { data: vodCatsData, isLoading: vodCatsLoading } = useQuery<{ categories: XtreamCategory[]; totalStreams: number }>({
    queryKey: ['xtream-vod-categories'],
    queryFn: async () => {
      const res = await fetch('/api/funds/xtream/vod-categories')
      if (!res.ok) throw new Error('Failed to load VOD categories')
      return res.json()
    },
    enabled: open && tab === 'vod' && !selectedCategory,
  })

  const catsData = tab === 'live' ? liveCatsData : vodCatsData
  const catsLoading = tab === 'live' ? liveCatsLoading : vodCatsLoading
  const categories = catsData?.categories ?? []
  const filteredCats = categories.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()),
  )

  // Streams for selected category
  const { data: streamsData, isLoading: streamsLoading } = useQuery<{ streams: XtreamLiveStream[] | XtreamVodStream[]; total: number; shown: number }>({
    queryKey: ['xtream-streams', tab, selectedCategory],
    queryFn: async () => {
      const endpoint = tab === 'live' ? 'live-streams' : 'vod-streams'
      const res = await fetch(`/api/funds/xtream/${endpoint}?categoryId=${selectedCategory}&limit=60`)
      if (!res.ok) throw new Error('Failed to load streams')
      return res.json()
    },
    enabled: open && !!selectedCategory,
  })

  const streams = streamsData?.streams ?? []
  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({ title: `${label} copied`, description: text })
    } catch {
      toast({ title: 'Copy failed', variant: 'destructive' })
    }
  }

  const expDate = account?.userInfo.expDate ? new Date(account.userInfo.expDate) : null
  const daysLeft = expDate ? Math.max(0, Math.ceil((expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setSelectedCategory(null); setSearch('') } }}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[92vh] overflow-hidden p-0 gap-0">
        {/* Header — purple gradient */}
        <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
              <Globe className="h-5 w-5" />
            </span>
            <div>
              <DialogTitle className="text-base font-semibold leading-tight">
                {account?.server.label ?? 'World Package (Family)'}
              </DialogTitle>
              <DialogDescription className="text-white/80 text-xs leading-tight">
                Live Xtream Codes server — real channels &amp; VODs
              </DialogDescription>
            </div>
          </div>
          {account && (
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 gap-1.5"
              onClick={() => window.open(account.server.appUrl, '_blank')}
            >
              <ExternalLink className="h-3.5 w-3.5" /> Open App
            </Button>
          )}
        </div>

        <div className="flex flex-col h-[calc(92vh-72px)]">
          {/* Account info bar */}
          <div className="border-b border-border px-5 py-3 bg-muted/30">
            {accountLoading ? (
              <div className="flex gap-6">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-8 w-32" />
              </div>
            ) : account ? (
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                <InfoChip icon={Server} label="Server" value={`${account.serverInfo.url}:${account.serverInfo.port}`} />
                <InfoChip icon={Radio} label="Panel" value={account.serverInfo.panel} />
                <InfoChip
                  icon={Clock}
                  label="Expires"
                  value={daysLeft !== null ? `${daysLeft}d left` : '—'}
                  accent={daysLeft !== null && daysLeft > 0}
                />
                <InfoChip
                  icon={Wifi}
                  label="Connections"
                  value={`${account.userInfo.activeConnections}/${account.userInfo.maxConnections}`}
                />
                <InfoChip icon={Tv} label="Status" value={account.userInfo.status} accent={account.userInfo.status === 'Active'} />
                {account.userInfo.isTrial && (
                  <Badge className="bg-amber-500 text-white text-[10px]">Trial</Badge>
                )}
              </div>
            ) : (
              <p className="text-xs text-destructive">Could not load account info.</p>
            )}
          </div>

          {/* Breadcrumb / back */}
          {selectedCategory ? (
            <div className="flex items-center gap-2 border-b border-border px-5 py-2.5">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 h-7"
                onClick={() => setSelectedCategory(null)}
              >
                <ChevronLeft className="h-4 w-4" /> Back to categories
              </Button>
              <span className="text-xs text-muted-foreground">/</span>
              <span className="text-xs font-medium capitalize">{tab}</span>
              <span className="text-xs text-muted-foreground">/</span>
              <span className="text-xs font-medium truncate">
                {categories.find((c) => c.id === selectedCategory)?.name ?? selectedCategory}
              </span>
              {streamsData && (
                <Badge variant="secondary" className="text-[10px] ml-auto">
                  {formatNumber(streamsData.total)} total · showing {streamsData.shown}
                </Badge>
              )}
            </div>
          ) : (
            /* Tabs */
            <div className="flex border-b border-border">
              {(['live', 'vod'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setTab(t); setSelectedCategory(null); setSearch('') }}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative',
                    tab === t ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t === 'live' ? <Tv className="h-4 w-4" /> : <Film className="h-4 w-4" />}
                  {t === 'live' ? 'Live Channels' : 'Movies & VOD'}
                  {tab === t && <span className="absolute bottom-0 left-1/2 h-0.5 w-12 -translate-x-1/2 rounded-full bg-primary" />}
                </button>
              ))}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {!selectedCategory ? (
              /* Category list */
              <div className="p-4">
                <div className="relative mb-3 max-w-sm">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={`Search ${tab} categories…`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {catsLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                  </div>
                ) : filteredCats.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">No categories match &ldquo;{search}&rdquo;</p>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground mb-2">
                      {formatNumber(catsData?.total ?? 0)} categories · {formatNumber(catsData?.totalStreams ?? 0)} streams
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {filteredCats.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSelectedCategory(c.id)}
                          className="group flex items-center gap-3 rounded-lg border border-border p-3 text-left transition-all hover:border-primary/40 hover:bg-muted/40"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary overflow-hidden">
                            {c.icon ? (
                              <img src={c.icon} alt="" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                            ) : (
                              <ImageIcon className="h-4 w-4" />
                            )}
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-xs font-medium truncate">{c.name}</span>
                            <span className="block text-[10px] text-muted-foreground">{formatNumber(c.streamCount)} streams</span>
                          </span>
                          {c.isAdult && (
                            <Badge className="shrink-0 h-4 px-1 text-[8px] font-bold bg-violet-600 text-white">18+</Badge>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : streamsLoading ? (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
              </div>
            ) : streams.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No streams in this category.</p>
            ) : (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {streams.map((s) => {
                  const isLive = tab === 'live'
                  const name = s.name
                  const icon = s.icon
                  const playUrl = isLive ? (s as XtreamLiveStream).playUrlM3u8 : (s as XtreamVodStream).playUrl
                  const rating = !isLive ? (s as XtreamVodStream).rating : 0
                  return (
                    <div
                      key={s.id}
                      className="group relative rounded-xl border border-border bg-card p-3 transition-all hover:border-primary/40 hover:shadow-md"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted overflow-hidden">
                          {icon ? (
                            <img src={icon} alt="" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0' }} />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          )}
                          {isLive && (
                            <span className="absolute -top-1 -right-1 flex items-center gap-0.5 rounded-full bg-rose-600 px-1 text-[7px] font-bold text-white">
                              <span className="h-1 w-1 rounded-full bg-white animate-pulse" />LIVE
                            </span>
                          )}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold leading-tight line-clamp-2">{name}</p>
                          {!isLive && rating > 0 && (
                            <div className="mt-0.5 flex items-center gap-0.5 text-[10px] text-amber-500">
                              <Star className="h-2.5 w-2.5 fill-current" />
                              {rating.toFixed(1)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-2.5 flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 flex-1 gap-1 text-[11px]"
                          onClick={() => setPlayerChannel({ name, url: playUrl })}
                        >
                          <Play className="h-3 w-3" /> Play
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 gap-1 text-[11px] text-primary"
                          onClick={() => window.open(playUrl, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" /> VLC
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => copy(playUrl, isLive ? 'Stream URL' : 'Movie URL')}
                          aria-label="Copy URL"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
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

function InfoChip({
  icon: Icon, label, value, accent,
}: {
  icon: React.ElementType
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-muted-foreground">{label}:</span>
      <span className={cn('font-medium', accent && 'text-emerald-600 dark:text-emerald-400')}>{value}</span>
    </div>
  )
}
