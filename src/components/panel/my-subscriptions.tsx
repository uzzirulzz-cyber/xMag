'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Tv,
  Film,
  Clapperboard,
  Plus,
  Copy,
  MoreHorizontal,
  RefreshCw,
  KeyRound,
  Ban,
  Power,
  Trash2,
  Link2,
  Activity,
  Search,
  Download,
  Loader2,
  Tv2,
  Inbox,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'
import { useToast } from '@/hooks/use-toast'
import type { Subscription, SubscriptionPlan } from './types'
import { RenewDialog } from './renew-dialog'
import { ConnectionDrawer } from './connection-drawer'

export function MySubscriptions({ onNew, balance }: { onNew: () => void; balance: number }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [renewTarget, setRenewTarget] = useState<Subscription | null>(null)
  const [connectionsTarget, setConnectionsTarget] = useState<Subscription | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Subscription | null>(null)

  const { toast } = useToast()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery<{ subscriptions: Subscription[] }>({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const res = await fetch('/api/funds/subscriptions')
      if (!res.ok) throw new Error('Failed to load subscriptions')
      return res.json()
    },
  })

  const subs = data?.subscriptions ?? []

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return subs.filter((s) => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false
      if (q && !s.username.toLowerCase().includes(q) && !s.password.toLowerCase().includes(q)) return false
      return true
    })
  }, [subs, search, statusFilter])

  const allSelected = filtered.length > 0 && filtered.every((s) => selected.has(s.id))
  const someSelected = filtered.some((s) => selected.has(s.id))

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map((s) => s.id)))
    }
  }
  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['subscriptions'] })
    qc.invalidateQueries({ queryKey: ['overview'] })
    qc.invalidateQueries({ queryKey: ['transactions'] })
    qc.invalidateQueries({ queryKey: ['notifications'] })
  }

  // Single-line actions
  const patchAction = useMutation({
    mutationFn: async ({ id, action, extra }: { id: string; action: string; extra?: Record<string, unknown> }) => {
      const res = await fetch(`/api/funds/subscriptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.error || 'Action failed')
      return d
    },
    onSuccess: (d, vars) => {
      const labels: Record<string, string> = {
        'reset-password': 'Password reset',
        disable: 'Line disabled',
        enable: 'Line enabled',
      }
      toast({ title: labels[vars.action] || 'Updated', description: vars.action === 'reset-password' ? `New password: ${d.subscription.password}` : undefined })
      invalidateAll()
    },
    onError: (e: Error) => toast({ title: 'Action failed', description: e.message, variant: 'destructive' }),
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/funds/subscriptions/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      return res.json()
    },
    onSuccess: () => {
      toast({ title: 'Line deleted', description: 'The IPTV line was permanently removed.' })
      setDeleteTarget(null)
      invalidateAll()
    },
    onError: (e: Error) => toast({ title: 'Delete failed', description: e.message, variant: 'destructive' }),
  })

  // Bulk actions
  const bulkMut = useMutation({
    mutationFn: async ({ action }: { action: 'disable' | 'enable' | 'delete' }) => {
      const res = await fetch('/api/funds/subscriptions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected), action }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.error || 'Bulk action failed')
      return d
    },
    onSuccess: (d, vars) => {
      toast({ title: `Bulk ${vars.action} complete`, description: `${d.updated ?? d.deleted} line(s) affected.` })
      setSelected(new Set())
      invalidateAll()
    },
    onError: (e: Error) => toast({ title: 'Bulk action failed', description: e.message, variant: 'destructive' }),
  })

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({ title: `${label} copied`, description: text })
    } catch {
      toast({ title: 'Copy failed', variant: 'destructive' })
    }
  }

  const exportCsv = () => {
    const rows = [
      ['username', 'password', 'dns', 'plan_months', 'status', 'expires_at', 'm3u_url'],
      ...filtered.map((s) => [
        s.username,
        s.password,
        s.dns,
        String(s.planMonths),
        s.status,
        new Date(s.expiresAt).toISOString(),
        m3uUrl(s),
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `magx-lines-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: 'CSV exported', description: `${filtered.length} lines` })
  }

  return (
    <>
      <Card className="overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 flex-wrap">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Tv2 className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold">Manage IPTV</h2>
              <p className="text-xs text-muted-foreground">
                {subs.length} line{subs.length !== 1 ? 's' : ''} · {subs.filter((s) => s.status === 'active').length} active
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv} className="gap-1.5">
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button onClick={onNew} className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white gap-1.5">
              <Plus className="h-4 w-4" /> New Line
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search username or password…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div className="flex items-center justify-between gap-3 border-b border-primary/30 bg-primary/5 px-5 py-2.5 flex-wrap">
            <span className="text-xs font-medium text-primary">{selected.size} selected</span>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" className="gap-1.5 h-7" disabled={bulkMut.isPending} onClick={() => bulkMut.mutate({ action: 'enable' })}>
                <Power className="h-3.5 w-3.5" /> Enable
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 h-7" disabled={bulkMut.isPending} onClick={() => bulkMut.mutate({ action: 'disable' })}>
                <Ban className="h-3.5 w-3.5" /> Disable
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 h-7 text-destructive hover:text-destructive" disabled={bulkMut.isPending} onClick={() => bulkMut.mutate({ action: 'delete' })}>
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
              <Button variant="ghost" size="sm" className="h-7" onClick={() => setSelected(new Set())}>Clear</Button>
            </div>
          </div>
        )}

        {/* Table — desktop */}
        <div className="hidden md:block overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                <th className="px-4 py-2.5 w-10">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all" />
                </th>
                <th className="px-4 py-2.5 font-medium text-xs text-muted-foreground uppercase tracking-wide">Line</th>
                <th className="px-4 py-2.5 font-medium text-xs text-muted-foreground uppercase tracking-wide">Plan</th>
                <th className="px-4 py-2.5 font-medium text-xs text-muted-foreground uppercase tracking-wide">Content</th>
                <th className="px-4 py-2.5 font-medium text-xs text-muted-foreground uppercase tracking-wide">Conn.</th>
                <th className="px-4 py-2.5 font-medium text-xs text-muted-foreground uppercase tracking-wide">Expires</th>
                <th className="px-4 py-2.5 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-4 py-4"><Skeleton className="h-4 w-4" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-16" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-28" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-12" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-8 w-8" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16">
                    <EmptyState onNew={onNew} hasLines={subs.length > 0} />
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <SubscriptionRow
                    key={s.id}
                    s={s}
                    checked={selected.has(s.id)}
                    onToggle={() => toggleOne(s.id)}
                    onRenew={() => setRenewTarget(s)}
                    onConnections={() => setConnectionsTarget(s)}
                    onDelete={() => setDeleteTarget(s)}
                    onPatch={(action) => patchAction.mutate({ id: s.id, action })}
                    onCopy={copyText}
                    busy={patchAction.isPending}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Cards — mobile */}
        <div className="md:hidden divide-y divide-border">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="p-6"><EmptyState onNew={onNew} hasLines={subs.length > 0} /></div>
          ) : (
            filtered.map((s) => (
              <SubscriptionCard
                key={s.id}
                s={s}
                checked={selected.has(s.id)}
                onToggle={() => toggleOne(s.id)}
                onRenew={() => setRenewTarget(s)}
                onConnections={() => setConnectionsTarget(s)}
                onDelete={() => setDeleteTarget(s)}
                onPatch={(action) => patchAction.mutate({ id: s.id, action })}
                onCopy={copyText}
                busy={patchAction.isPending}
              />
            ))
          )}
        </div>
      </Card>

      {/* Renew dialog */}
      <RenewDialog
        subscription={renewTarget}
        onOpenChange={(v) => !v && setRenewTarget(null)}
        balance={balance}
        onDone={() => invalidateAll()}
      />

      {/* Connection log drawer */}
      <ConnectionDrawer
        subscription={connectionsTarget}
        onOpenChange={(v) => !v && setConnectionsTarget(null)}
      />

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete line {deleteTarget?.username}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the IPTV line. The client will lose access immediately. This action cannot be undone and no credit is refunded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMut.isPending}
              onClick={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
            >
              {deleteMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete line
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function m3uUrl(s: Subscription) {
  const dns = s.dns.replace(/\/$/, '')
  return `${dns}/get.php?username=${s.username}&password=${s.password}&type=m3u_plus&output=ts`
}
function xapiUrl(s: Subscription) {
  const dns = s.dns.replace(/\/$/, '')
  return `${dns}/player_api.php?username=${s.username}&password=${s.password}`
}

function statusBadge(status: string, daysLeft: number) {
  if (status === 'disabled') return <Badge variant="outline" className="text-[10px] border-slate-400 text-slate-600 dark:text-slate-300 bg-slate-500/10">Disabled</Badge>
  if (daysLeft <= 0) return <Badge variant="outline" className="text-[10px] border-rose-400 text-rose-600 dark:text-rose-300 bg-rose-500/10">Expired</Badge>
  if (daysLeft <= 7) return <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-600 dark:text-amber-300 bg-amber-500/10">Expires soon</Badge>
  return <Badge variant="outline" className="text-[10px] border-emerald-400 text-emerald-600 dark:text-emerald-300 bg-emerald-500/10">Active</Badge>
}

function scopeChips(s: Subscription) {
  const chips: { label: string; icon: React.ElementType; excluded: boolean; color: string }[] = [
    { label: 'Live', icon: Tv, excluded: s.excludedLive, color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'VOD', icon: Film, excluded: s.excludedVod, color: 'text-slate-600 dark:text-slate-300' },
    { label: 'Series', icon: Clapperboard, excluded: s.excludedSeries, color: 'text-orange-600 dark:text-orange-400' },
  ]
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {chips.map((c) => {
        const Icon = c.icon
        return (
          <span
            key={c.label}
            className={cn(
              'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium',
              c.excluded ? 'border-border bg-muted/50 text-muted-foreground line-through' : cn('border-transparent bg-muted', c.color),
            )}
          >
            <Icon className="h-3 w-3" />
            {c.label}
          </span>
        )
      })}
      {!s.excludedSeries && s.seriesCategoryCount > 0 && (
        <span className="inline-flex items-center rounded-md border border-transparent bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-medium text-orange-600 dark:text-orange-400">
          {s.seriesCategoryCount} cats
        </span>
      )}
    </div>
  )
}

function daysLeftOf(s: Subscription) {
  return Math.max(0, Math.ceil((new Date(s.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
}

function SubscriptionRow({
  s, checked, onToggle, onRenew, onConnections, onDelete, onPatch, onCopy, busy,
}: {
  s: Subscription
  checked: boolean
  onToggle: () => void
  onRenew: () => void
  onConnections: () => void
  onDelete: () => void
  onPatch: (action: string) => void
  onCopy: (text: string, label: string) => void
  busy: boolean
}) {
  const daysLeft = daysLeftOf(s)
  return (
    <tr className={cn('border-b border-border last:border-0 hover:bg-muted/20 transition-colors', checked && 'bg-primary/5')}>
      <td className="px-4 py-3 align-middle">
        <Checkbox checked={checked} onCheckedChange={onToggle} aria-label={`Select ${s.username}`} />
      </td>
      <td className="px-4 py-3 align-middle">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onCopy(s.username, 'Username')}
            className="font-mono text-sm font-semibold hover:text-primary transition-colors inline-flex items-center gap-1"
            title="Click to copy"
          >
            {s.username}
            <Copy className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5">
          {statusBadge(s.status, daysLeft)}
          {s.currentConnections > 0 && s.status === 'active' && (
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {s.currentConnections} online
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 align-middle">
        <span className="text-sm font-medium">{s.planMonths}M</span>
        <span className="block text-[10px] text-muted-foreground">{formatCurrency(s.creditsCost)}</span>
      </td>
      <td className="px-4 py-3 align-middle">{scopeChips(s)}</td>
      <td className="px-4 py-3 align-middle">
        <span className={cn('text-sm tabular-nums', s.currentConnections > 0 ? 'font-semibold text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')}>
          {s.currentConnections}/{s.maxConnections}
        </span>
      </td>
      <td className="px-4 py-3 align-middle">
        <span className="text-sm tabular-nums">{daysLeft > 0 ? `${daysLeft}d` : '—'}</span>
        <span className="block text-[10px] text-muted-foreground">{new Date(s.expiresAt).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })}</span>
      </td>
      <td className="px-4 py-3 align-middle">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={busy} aria-label="Line actions">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="text-xs">Line actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onRenew} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Renew / Extend
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPatch('reset-password')} className="gap-2">
              <KeyRound className="h-4 w-4" /> Reset password
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onConnections} className="gap-2">
              <Activity className="h-4 w-4" /> Connection log
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onCopy(m3uUrl(s), 'M3U URL')} className="gap-2">
              <Link2 className="h-4 w-4" /> Copy M3U URL
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCopy(xapiUrl(s), 'xAPI URL')} className="gap-2">
              <Link2 className="h-4 w-4" /> Copy xAPI URL
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {s.status === 'disabled' ? (
              <DropdownMenuItem onClick={() => onPatch('enable')} className="gap-2 text-emerald-600 focus:text-emerald-600">
                <Power className="h-4 w-4" /> Enable line
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => onPatch('disable')} className="gap-2">
                <Ban className="h-4 w-4" /> Disable line
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onDelete} className="gap-2 text-destructive focus:text-destructive">
              <Trash2 className="h-4 w-4" /> Delete line
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  )
}

function SubscriptionCard({
  s, checked, onToggle, onRenew, onConnections, onDelete, onPatch, onCopy, busy,
}: {
  s: Subscription
  checked: boolean
  onToggle: () => void
  onRenew: () => void
  onConnections: () => void
  onDelete: () => void
  onPatch: (action: string) => void
  onCopy: (text: string, label: string) => void
  busy: boolean
}) {
  const daysLeft = daysLeftOf(s)
  return (
    <div className={cn('p-4', checked && 'bg-primary/5')}>
      <div className="flex items-start gap-3">
        <Checkbox checked={checked} onCheckedChange={onToggle} aria-label={`Select ${s.username}`} className="mt-1" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <button type="button" onClick={() => onCopy(s.username, 'Username')} className="font-mono text-sm font-semibold hover:text-primary">
              {s.username}
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={onRenew} className="gap-2"><RefreshCw className="h-4 w-4" /> Renew</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPatch('reset-password')} className="gap-2"><KeyRound className="h-4 w-4" /> Reset password</DropdownMenuItem>
                <DropdownMenuItem onClick={onConnections} className="gap-2"><Activity className="h-4 w-4" /> Connection log</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCopy(m3uUrl(s), 'M3U URL')} className="gap-2"><Link2 className="h-4 w-4" /> Copy M3U</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCopy(xapiUrl(s), 'xAPI URL')} className="gap-2"><Link2 className="h-4 w-4" /> Copy xAPI</DropdownMenuItem>
                <DropdownMenuSeparator />
                {s.status === 'disabled' ? (
                  <DropdownMenuItem onClick={() => onPatch('enable')} className="gap-2 text-emerald-600"><Power className="h-4 w-4" /> Enable</DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => onPatch('disable')} className="gap-2"><Ban className="h-4 w-4" /> Disable</DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={onDelete} className="gap-2 text-destructive"><Trash2 className="h-4 w-4" /> Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            {statusBadge(s.status, daysLeft)}
            <span className="text-xs text-muted-foreground">{s.planMonths}M · {formatCurrency(s.creditsCost)}</span>
          </div>
          <div className="mt-2">{scopeChips(s)}</div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Conn: {s.currentConnections}/{s.maxConnections}</span>
            <span>{daysLeft > 0 ? `${daysLeft}d left` : 'expired'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ onNew, hasLines }: { onNew: () => void; hasLines: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 text-center py-6">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <Inbox className="h-7 w-7 text-muted-foreground" />
      </span>
      <div>
        <p className="text-sm font-medium">{hasLines ? 'No lines match your filters' : 'No active subscriptions yet'}</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          {hasLines ? 'Try adjusting your search or status filter.' : 'Create your first IPTV line using your credit balance.'}
        </p>
      </div>
      {!hasLines && (
        <Button onClick={onNew} variant="outline" className="mt-1 gap-1.5">
          <Plus className="h-4 w-4" /> Create First Line
        </Button>
      )}
    </div>
  )
}
