'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Inbox,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'
import type { Transaction, TransactionsResponse } from './types'

const PAGE_SIZE = 8

export function TransactionHistory({ currency }: { currency?: string }) {
  const [page, setPage] = useState(1)
  const [type, setType] = useState<string>('all')
  const [status, setStatus] = useState<string>('all')
  const [q, setQ] = useState('')
  const [qDebounced, setQDebounced] = useState('')

  // debounce search input
  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q), 350)
    return () => clearTimeout(t)
  }, [q])

  const { data, isLoading, isFetching } = useQuery<TransactionsResponse>({
    queryKey: ['transactions', page, type, status, qDebounced],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
      if (type !== 'all') params.set('type', type)
      if (status !== 'all') params.set('status', status)
      if (qDebounced) params.set('q', qDebounced)
      const res = await fetch('/api/funds/transactions?' + params.toString())
      if (!res.ok) throw new Error('Failed to load transactions')
      return res.json()
    },
    placeholderData: (prev) => prev,
  })

  const items = data?.items ?? []
  const totalPages = data?.totalPages ?? 1

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-border px-5 py-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-base font-semibold">Transaction History</h2>
            <p className="text-xs text-muted-foreground">Every credit and debit on your reseller account.</p>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Filter className="h-3 w-3" />
            {data?.total ?? 0} records
          </Badge>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search description or reference…"
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setPage(1)
              }}
              className="pl-9"
            />
          </div>
          <Select value={type} onValueChange={(v) => { setType(v); setPage(1) }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="credit">Credit</SelectItem>
              <SelectItem value="debit">Debit</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table — desktop */}
      <div className="hidden md:block overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left">
              <th className="px-5 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wide">Type</th>
              <th className="px-5 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wide">Description</th>
              <th className="px-5 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wide">Reference</th>
              <th className="px-5 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wide">Date</th>
              <th className="px-5 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wide">Status</th>
              <th className="px-5 py-3 text-right font-medium text-xs text-muted-foreground uppercase tracking-wide">Amount</th>
              <th className="px-5 py-3 text-right font-medium text-xs text-muted-foreground uppercase tracking-wide">Balance</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-5 py-4"><Skeleton className="h-8 w-8 rounded-full" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-4 w-48" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-4 w-28" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-4 w-20 ml-auto" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-4 w-20 ml-auto" /></td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-16">
                  <EmptyState />
                </td>
              </tr>
            ) : (
              items.map((t) => <DesktopRow key={t.id} t={t} currency={currency} />)
            )}
          </tbody>
        </table>
      </div>

      {/* Cards — mobile */}
      <div className="md:hidden divide-y divide-border">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-6 w-24" />
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="p-8"><EmptyState /></div>
        ) : (
          items.map((t) => <MobileRow key={t.id} t={t} currency={currency} />)
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3 flex-wrap">
        <p className="text-xs text-muted-foreground">
          {isFetching && !isLoading ? 'Updating…' : `Page ${page} of ${totalPages}`}
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || isFetching}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || isFetching}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="gap-1"
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

function DesktopRow({ t, currency }: { t: Transaction; currency?: string }) {
  const isCredit = t.type === 'credit'
  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
      <td className="px-5 py-4">
        <span
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full',
            isCredit ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
          )}
        >
          {isCredit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
        </span>
      </td>
      <td className="px-5 py-4">
        <p className="font-medium leading-tight">{t.description}</p>
        <p className="text-[11px] text-muted-foreground capitalize">{t.category}</p>
      </td>
      <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{t.reference || '—'}</td>
      <td className="px-5 py-4 text-muted-foreground whitespace-nowrap">{formatDate(t.createdAt)}</td>
      <td className="px-5 py-4"><StatusBadge status={t.status} /></td>
      <td className={cn('px-5 py-4 text-right font-semibold tabular-nums', isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
        {isCredit ? '+' : '−'}
        {formatCurrency(t.amount, currency)}
      </td>
      <td className="px-5 py-4 text-right tabular-nums text-muted-foreground">{formatCurrency(t.balanceAfter, currency)}</td>
    </tr>
  )
}

function MobileRow({ t, currency }: { t: Transaction; currency?: string }) {
  const isCredit = t.type === 'credit'
  return (
    <div className="p-4">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
            isCredit ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
          )}
        >
          {isCredit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-sm leading-tight">{t.description}</p>
            <p className={cn('font-semibold tabular-nums text-sm whitespace-nowrap', isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
              {isCredit ? '+' : '−'}
              {formatCurrency(t.amount, currency)}
            </p>
          </div>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-muted-foreground">{formatDate(t.createdAt)}</span>
            {t.reference && <span className="font-mono text-[11px] text-muted-foreground">{t.reference}</span>}
            <StatusBadge status={t.status} />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    completed: { label: 'Completed', className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20' },
    pending: { label: 'Pending', className: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20' },
    failed: { label: 'Failed', className: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20' },
  }
  const cfg = map[status] || { label: status, className: 'bg-muted text-muted-foreground' }
  return (
    <Badge variant="outline" className={cn('text-[10px] px-2 py-0 h-5 font-medium', cfg.className)}>
      {cfg.label}
    </Badge>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 text-center py-6">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Inbox className="h-6 w-6 text-muted-foreground" />
      </span>
      <p className="text-sm font-medium">No transactions found</p>
      <p className="text-xs text-muted-foreground max-w-xs">Try adjusting your filters or add funds to get started.</p>
    </div>
  )
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}
