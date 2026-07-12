'use client'

import { useState } from 'react'
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
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'
import { useToast } from '@/hooks/use-toast'
import type { Overview, FundRequest } from './types'

const ADMIN_PASSWORD = 'IPTV2026'

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
              Demo password: <code className="bg-muted px-1 py-0.5 rounded font-mono">IPTV2026</code>
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

  const { data: overview } = useQuery<Overview>({
    queryKey: ['overview'],
    queryFn: async () => (await fetch('/api/funds/overview')).json(),
  })
  const { data: reqData, isLoading } = useQuery<{ requests: FundRequest[] }>({
    queryKey: ['requests', 'admin'],
    queryFn: async () => (await fetch('/api/funds/requests')).json(),
  })

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
    </div>
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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
    approved: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    rejected: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
  }
  return <Badge variant="outline" className={cn('text-[10px] capitalize', map[status] || '')}>{status}</Badge>
}
