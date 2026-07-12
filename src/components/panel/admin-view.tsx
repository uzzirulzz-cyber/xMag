'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Lock,
  ShieldCheck,
  Check,
  X,
  Loader2,
  Crown,
  TrendingUp,
  Clock,
  Wallet,
  Eye,
  EyeOff,
  LogOut,
  User,
  Bot,
  Globe,
  Upload,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'
import { useToast } from '@/hooks/use-toast'
import type { Overview, FundRequest } from './types'

const ADMIN_PASSWORD = '1122playbeat'

export function AdminView() {
  const [unlocked, setUnlocked] = useState(false)
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState(false)
  const { toast } = useToast()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setUnlocked(true)
      setError(false)
      setPassword('')
      toast({ title: 'Admin access granted', description: 'Welcome to the admin console.' })
    } else {
      setError(true)
    }
  }

  if (!unlocked) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-sm p-0 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 bg-gradient-to-r from-violet-700 via-purple-700 to-fuchsia-700 px-5 py-4 text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
              <Lock className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold leading-tight">Admin Access</h2>
              <p className="text-white/80 text-xs leading-tight">Restricted area — password required</p>
            </div>
          </div>

          <form onSubmit={submit} className="p-5 space-y-4">
            <div className="rounded-lg border border-violet-400/30 bg-violet-500/5 p-3 flex gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 shrink-0 text-violet-600 mt-0.5" />
              <p>
                This area is restricted to authorised administrators. Enter the admin password to manage fund requests, approve credits, and oversee all reseller activity.
              </p>
            </div>
            <div className="space-y-2">
              <label htmlFor="admin-pw" className="text-xs font-medium">Admin Password</label>
              <div className="relative">
                <Input
                  id="admin-pw"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(false) }}
                  placeholder="Enter admin password"
                  className="pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Toggle password visibility"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {error && <p className="text-xs text-destructive flex items-center gap-1"><X className="h-3 w-3" /> Incorrect password. Access denied.</p>}
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 gap-1.5">
              <Lock className="h-4 w-4" /> Unlock Admin Console
            </Button>
            <p className="text-center text-[10px] text-muted-foreground">
              Demo password: <code className="bg-muted px-1 py-0.5 rounded font-mono">1122playbeat</code>
            </p>
          </form>
        </Card>
      </div>
    )
  }

  return <AdminConsole onLock={() => setUnlocked(false)} />
}

function AdminConsole({ onLock }: { onLock: () => void }) {
  const qc = useQueryClient()
  const { toast } = useToast()
  const [autoRun, setAutoRun] = useState(true)

  const { data: overview } = useQuery<Overview>({
    queryKey: ['overview'],
    queryFn: async () => (await fetch('/api/funds/overview')).json(),
  })
  const { data: reqData, isLoading } = useQuery<{ requests: FundRequest[] }>({
    queryKey: ['requests', 'admin'],
    queryFn: async () => (await fetch('/api/funds/requests')).json(),
  })
  const { data: botStats } = useQuery({
    queryKey: ['bot-stats'],
    queryFn: async () => (await fetch('/api/funds/bot-stats')).json(),
    refetchInterval: 15_000,
  })

  // Auto-run scheduler: every 60s, trigger the bot automatically
  useEffect(() => {
    if (!autoRun) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/funds/bot-run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ runType: 'scheduled' }),
        })
        const d = await res.json()
        if (d.ran && d.count > 0) {
          toast({ title: '🤖 Auto-run credited', description: `${d.count} request(s) · ${formatCurrency(d.credited)}` })
          qc.invalidateQueries({ queryKey: ['overview'] })
          qc.invalidateQueries({ queryKey: ['requests'] })
          qc.invalidateQueries({ queryKey: ['bot-stats'] })
          qc.invalidateQueries({ queryKey: ['transactions'] })
        }
      } catch { /* ignore poll errors */ }
    }, 60_000)
    return () => clearInterval(interval)
  }, [autoRun, qc, toast])

  const reviewMut = useMutation({
    mutationFn: async ({ id, decision }: { id: string; decision: 'approve' | 'reject' }) => {
      const res = await fetch(`/api/funds/requests/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.error || 'Review failed')
      return d
    },
    onSuccess: (_d, vars) => {
      toast({
        title: vars.decision === 'approve' ? 'Request approved' : 'Request rejected',
        description: vars.decision === 'approve' ? 'Credit issued to reseller.' : 'Request marked as rejected.',
      })
      qc.invalidateQueries({ queryKey: ['requests'] })
      qc.invalidateQueries({ queryKey: ['overview'] })
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (e: Error) => toast({ title: 'Action failed', description: e.message, variant: 'destructive' }),
  })

  const requests = (reqData?.requests ?? []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const pending = requests.filter((r) => r.status === 'pending')

  return (
    <div className="space-y-6">
      {/* Admin header */}
      <Card className="relative overflow-hidden p-5 bg-gradient-to-br from-violet-600/10 via-card to-card border-violet-400/30">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg">
              <Crown className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" /></span>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Admin Console</h2>
                <Badge className="bg-violet-600 text-white text-[10px]">UNLOCKED</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Review and approve fund requests. All funds route to admin (MUHAMMAD UZAIR).</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onLock}>
            <LogOut className="h-4 w-4" /> Lock
          </Button>
        </div>
      </Card>

      {/* Admin KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKpi icon={Wallet} label="Reseller Balance" value={overview ? formatCurrency(overview.balance) : '—'} color="text-primary" />
        <AdminKpi icon={TrendingUp} label="Total Processed" value={overview ? formatCurrency(overview.totalAdded) : '—'} color="text-emerald-600" />
        <AdminKpi icon={Clock} label="Pending Requests" value={String(pending.length)} color="text-amber-600" />
        <AdminKpi icon={Wallet} label="Pending Amount" value={overview ? formatCurrency(overview.pendingAmount) : '—'} color="text-amber-600" />
      </div>

      {/* Automation stats — auto-repair / auto-obtain bot */}
      <Card className="relative overflow-hidden p-5 bg-gradient-to-br from-emerald-600/5 via-card to-card border-emerald-400/20">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2.5">
            <span className={cn('relative flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600', autoRun && 'ring-2 ring-emerald-500/20')}>
              <Bot className="h-5 w-5" />
              {autoRun && <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" /></span>}
            </span>
            <div>
              <h3 className="text-sm font-semibold">Automation Engine</h3>
              <p className="text-xs text-muted-foreground">Auto-repair · auto-obtain · auto-credit · runs every 60s</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn('text-[10px]', autoRun ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground')}>
              {autoRun ? 'ACTIVE' : 'PAUSED'}
            </Badge>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setAutoRun((v) => !v)}>
              {autoRun ? 'Pause' : 'Resume'}
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <BotStat label="Total Runs" value={botStats ? String(botStats.totalRuns) : '—'} />
          <BotStat label="Auto-Credited" value={botStats ? formatCurrency(botStats.totalCredited) : '—'} accent />
          <BotStat label="Auto-Repaired" value={botStats ? String(botStats.totalRepaired) : '—'} />
          <BotStat label="Errors" value={botStats ? String(botStats.totalErrors) : '—'} />
          <BotStat label="Success Rate" value={botStats ? `${botStats.successRate}%` : '—'} accent />
        </div>
        {/* Last 10 runs */}
        {botStats?.last10 && botStats.last10.length > 0 && (
          <div className="mt-4">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Last 10 Bot Runs</p>
            <div className="space-y-1 max-h-40 overflow-y-auto scrollbar-thin">
              {botStats.last10.map((run: BotRun) => (
                <div key={run.id} className="flex items-center gap-3 rounded-md bg-muted/30 px-3 py-1.5 text-xs">
                  <span className={cn('flex h-5 w-5 items-center justify-center rounded-full shrink-0', run.success ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600')}>
                    {run.success ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  </span>
                  <span className="text-muted-foreground capitalize shrink-0">{run.runType}</span>
                  <span className="text-muted-foreground shrink-0">{new Date(run.createdAt).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="flex-1 truncate">
                    {run.credited > 0 ? <span className="text-emerald-600 font-medium">+{formatCurrency(run.amountCredited)} ({run.credited})</span> : <span className="text-muted-foreground">No credits</span>}
                    {run.repaired > 0 && <span className="text-amber-600 ml-2">🔧 {run.repaired} repaired</span>}
                  </span>
                  <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">{run.durationMs}ms</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Pending fund requests */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
              <Clock className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-sm font-semibold">Fund Requests Awaiting Approval</h3>
              <p className="text-xs text-muted-foreground">{pending.length} pending · {requests.length - pending.length} reviewed</p>
            </div>
          </div>
          <Badge variant="secondary" className="gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            {pending.length} pending
          </Badge>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : requests.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm font-medium">No fund requests</p>
            <p className="text-xs text-muted-foreground mt-1">Fund requests from resellers will appear here for approval.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {requests.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-5 py-4 hover:bg-muted/20 flex-wrap">
                <span className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                  r.status === 'pending' ? 'bg-amber-500/10 text-amber-600' : r.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600',
                )}>
                  <User className="h-5 w-5" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold">{r.paymentMethod?.name ?? 'Unknown'} · {formatCurrency(r.total)}</p>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Ref: <span className="font-mono">{r.reference || '—'}</span>
                    {r.senderNumber && <> · From: <span className="font-mono">{r.senderNumber}</span></>}
                    · {new Date(r.createdAt).toLocaleString('en-PK', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {r.note && <p className="text-[11px] text-muted-foreground italic mt-0.5">"{r.note}"</p>}
                  {r.reviewerNote && r.status !== 'pending' && <p className="text-[11px] text-muted-foreground mt-0.5">Admin: {r.reviewerNote}</p>}
                </div>
                {r.status === 'pending' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 h-8 text-destructive hover:text-destructive border-destructive/30"
                      disabled={reviewMut.isPending}
                      onClick={() => reviewMut.mutate({ id: r.id, decision: 'reject' })}
                    >
                      <X className="h-3.5 w-3.5" /> Reject
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1 h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                      disabled={reviewMut.isPending}
                      onClick={() => reviewMut.mutate({ id: r.id, decision: 'approve' })}
                    >
                      {reviewMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      Approve &amp; Credit
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Admin content sources — add your own legal streams */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-4 w-4 text-violet-600" />
          <h3 className="text-sm font-semibold">Content Sources</h3>
          <Badge variant="secondary" className="text-[10px] ml-auto">Admin only</Badge>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            Connect your own legal content sources. Only add streams you own or have rights to distribute.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SourceCard
              name="iptv-org (Free Public)"
              status="Connected"
              channels="13,402"
              color="bg-cyan-500"
            />
            <SourceCard
              name="Xtream Server (geotv.space)"
              status="Connected"
              channels="242,617"
              color="bg-violet-500"
            />
            <SourceCard
              name="Best Global (Curated)"
              status="Active"
              channels="60"
              color="bg-amber-500"
            />
            <SourceCard
              name="Custom M3U URL"
              status="Add source"
              channels="—"
              color="bg-zinc-500"
              onClick={() => toast({ title: 'Add custom M3U', description: 'Coming soon — paste your own .m3u playlist URL' })}
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            ⚠️ Only add content you have legal rights to. Pirated or scraped content violates payment processor + AdSense policies and will get your accounts frozen.
          </p>
        </div>
      </Card>

      {/* Playlist uploader — admin only */}
      <PlaylistUploader />
    </div>
  )
}

function PlaylistUploader() {
  const [mode, setMode] = useState<'url' | 'text' | 'file'>('url')
  const [pkgName, setPkgName] = useState('')
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState('')
  const { toast } = useToast()
  const qc = useQueryClient()

  const mut = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = { name: pkgName || 'Imported Playlist', source: mode }
      if (mode === 'url') payload.url = url
      if (mode === 'text') payload.text = text
      if (mode === 'file') payload.text = text
      const res = await fetch('/api/funds/import-m3u', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.error || 'Import failed')
      return d
    },
    onSuccess: (d) => {
      toast({ title: 'Playlist imported!', description: `${d.imported} channels added to "${d.packageName}"` })
      setPkgName(''); setUrl(''); setText(''); setFileName('')
      qc.invalidateQueries({ queryKey: ['packages'] })
      qc.invalidateQueries({ queryKey: ['channels'] })
      qc.invalidateQueries({ queryKey: ['channel-stats'] })
    },
    onError: (e: Error) => toast({ title: 'Import failed', description: e.message, variant: 'destructive' }),
  })

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => setText(String(reader.result || ''))
    reader.readAsText(file)
  }

  const submit = () => {
    if (mode === 'url' && !url.trim()) { toast({ title: 'Enter a playlist URL', variant: 'destructive' }); return }
    if ((mode === 'text' || mode === 'file') && !text.trim()) { toast({ title: 'No playlist content', variant: 'destructive' }); return }
    mut.mutate()
  }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Upload className="h-4 w-4 text-violet-600" />
        <h3 className="text-sm font-semibold">Upload Playlist</h3>
        <Badge variant="secondary" className="text-[10px] ml-auto">Admin only</Badge>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 mb-4">
        {(['url', 'text', 'file'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              mode === m ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70',
            )}
          >
            {m === 'url' ? '🔗 URL' : m === 'text' ? '📋 Paste' : '📁 File'}
          </button>
        ))}
      </div>

      {/* Package name */}
      <div className="space-y-1.5 mb-3">
        <label className="text-xs font-medium">Package Name <span className="text-muted-foreground">(optional)</span></label>
        <Input value={pkgName} onChange={(e) => setPkgName(e.target.value)} placeholder="My Playlist" className="h-9" />
      </div>

      {/* Input area */}
      {mode === 'url' && (
        <div className="space-y-1.5 mb-3">
          <label className="text-xs font-medium">M3U Playlist URL</label>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/playlist.m3u" className="h-9" />
        </div>
      )}

      {mode === 'text' && (
        <div className="space-y-1.5 mb-3">
          <label className="text-xs font-medium">Paste M3U Content</label>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} placeholder="#EXTM3U&#10;#EXTINF:-1,Channel Name&#10;https://..." className="font-mono text-xs" />
        </div>
      )}

      {mode === 'file' && (
        <div className="space-y-1.5 mb-3">
          <label className="text-xs font-medium">Upload .m3u File</label>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground hover:border-primary/50 hover:bg-muted/40 transition-colors">
            <Upload className="h-4 w-4" />
            {fileName || 'Click to select .m3u file'}
            <input type="file" accept=".m3u,.m3u8,text/plain" className="hidden" onChange={handleFile} />
          </label>
        </div>
      )}

      <Button className="w-full gap-1.5" disabled={mut.isPending} onClick={submit}>
        {mut.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Importing…</> : <><Upload className="h-4 w-4" /> Import Playlist</>}
      </Button>

      <p className="text-[11px] text-muted-foreground mt-3">
        Imports all channels from the playlist. They appear in the Channels browser with Stream Now buttons. Only add content you have legal rights to.
      </p>
    </Card>
  )
}

function SourceCard({ name, status, channels, color, onClick }: { name: string; status: string; channels: string; color: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg border border-border p-3 text-left hover:bg-muted/40 transition-colors w-full"
    >
      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white', color)}>
        <Globe className="h-4 w-4" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{name}</p>
        <p className="text-[11px] text-muted-foreground">{channels} channels · {status}</p>
      </div>
    </button>
  )
}

function AdminKpi({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <Card className="p-4">
      <Icon className={cn('h-4 w-4 mb-1.5', color)} />
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-lg font-bold tabular-nums">{value}</p>
    </Card>
  )
}

interface BotRun {
  id: string
  runType: string
  processed: number
  credited: number
  repaired: number
  amountCredited: number
  durationMs: number
  success: boolean
  createdAt: string
}

function BotStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg bg-muted/30 p-3">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={cn('text-sm font-bold tabular-nums mt-0.5', accent && 'text-emerald-600')}>{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
    approved: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    rejected: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
  }
  return <Badge variant="outline" className={cn('text-[10px] capitalize', map[status] || '')}>{status}</Badge>
}
