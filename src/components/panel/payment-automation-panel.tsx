'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Bot,
  Zap,
  ShieldCheck,
  Copy,
  Check,
  Loader2,
  Play,
  KeyRound,
  Banknote,
  Wifi,
  Clock,
  TrendingUp,
  Globe,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'
import { useToast } from '@/hooks/use-toast'

interface BotConfigData {
  id: string
  autoCredit: boolean
  jazzcashEnabled: boolean
  easypaisaEnabled: boolean
  bankEnabled: boolean
  usdtEnabled: boolean
  minAutoCredit: number
  maxAutoCredit: number
  pollIntervalSec: number
  lastRunAt: string | null
  totalAutoCredited: number
}
interface BotConfigResponse {
  config: BotConfigData
  tokens: { jazzcashToken1: string; jazzcashToken2: string; configured: boolean }
  admin: {
    accountTitle: string
    bankName: string
    accountNumber: string
    iban: string
    swift: string
    branch: string
    branchCode: string
    easypaisa: string
  }
  pendingRequests: number
}

export function PaymentAutomationPanel() {
  const qc = useQueryClient()
  const { toast } = useToast()
  const [copied, setCopied] = useState<string | null>(null)

  const { data, isLoading } = useQuery<BotConfigResponse>({
    queryKey: ['bot-config'],
    queryFn: async () => (await fetch('/api/funds/bot-config')).json(),
    refetchInterval: 30_000,
  })

  const patchMut = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch('/api/funds/bot-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to update')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bot-config'] })
      toast({ title: 'Bot configuration updated' })
    },
    onError: () => toast({ title: 'Update failed', variant: 'destructive' }),
  })

  const runMut = useMutation({
    mutationFn: async () => (await fetch('/api/funds/bot-run', { method: 'POST' })).json(),
    onSuccess: (d) => {
      if (d.ran) {
        toast({
          title: 'Bot run complete',
          description: d.count > 0 ? `Auto-credited ${formatCurrency(d.credited)} across ${d.count} request(s).` : 'No eligible pending requests.',
        })
      } else {
        toast({ title: 'Bot did not run', description: d.reason, variant: 'destructive' })
      }
      qc.invalidateQueries({ queryKey: ['bot-config'] })
      qc.invalidateQueries({ queryKey: ['overview'] })
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (e: Error) => toast({ title: 'Bot run failed', description: e.message, variant: 'destructive' }),
  })

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    } catch { /* ignore */ }
  }

  if (isLoading || !data) {
    return (
      <Card className="p-5">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      </Card>
    )
  }

  const { config: cfg, tokens, admin, pendingRequests } = data

  return (
    <div className="space-y-6">
      {/* Bot status hero */}
      <Card className="relative overflow-hidden p-6 bg-gradient-to-br from-violet-600/10 via-card to-card border-violet-400/30">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className={cn('relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg', cfg.autoCredit && 'ring-4 ring-violet-500/20')}>
              <Bot className="h-6 w-6" />
              {cfg.autoCredit && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" /></span>}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Payment Automation Bot</h2>
                <Badge className={cn('text-[10px]', cfg.autoCredit ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground')}>
                  {cfg.autoCredit ? 'ACTIVE' : 'PAUSED'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Auto-verifies fund requests and credits reseller balances worldwide.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" disabled={runMut.isPending} onClick={() => runMut.mutate()}>
              {runMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Run Now
            </Button>
          </div>
        </div>

        {/* Bot metrics */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <BotMetric icon={TrendingUp} label="Auto-credited" value={formatCurrency(cfg.totalAutoCredited)} color="text-emerald-600" />
          <BotMetric icon={Clock} label="Last run" value={cfg.lastRunAt ? new Date(cfg.lastRunAt).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }) : 'Never'} color="text-muted-foreground" />
          <BotMetric icon={Zap} label="Poll interval" value={`${cfg.pollIntervalSec}s`} color="text-primary" />
          <BotMetric icon={ShieldCheck} label="Pending" value={String(pendingRequests)} color="text-amber-600" />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bot configuration */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="h-4 w-4 text-violet-600" />
            <h3 className="text-sm font-semibold">Bot Configuration</h3>
          </div>

          <ToggleRow
            icon={Zap}
            label="Auto-credit (master)"
            desc="Enable the bot to auto-verify and credit fund requests"
            checked={cfg.autoCredit}
            onCheckedChange={(v) => patchMut.mutate({ autoCredit: v })}
          />

          <div className="my-3 border-t border-border" />

          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Channels</p>
          <ToggleRow icon={Wifi} label="JazzCash auto-verify" desc="Verify via JazzCash API tokens" checked={cfg.jazzcashEnabled} onCheckedChange={(v) => patchMut.mutate({ jazzcashEnabled: v })} disabled={!cfg.autoCredit} />
          <ToggleRow icon={Wifi} label="Easypaisa auto-verify" desc="Verify via Easypaisa API" checked={cfg.easypaisaEnabled} onCheckedChange={(v) => patchMut.mutate({ easypaisaEnabled: v })} disabled={!cfg.autoCredit} />
          <ToggleRow icon={Banknote} label="Bank transfer auto-verify" desc="Off by default — requires manual review" checked={cfg.bankEnabled} onCheckedChange={(v) => patchMut.mutate({ bankEnabled: v })} disabled={!cfg.autoCredit} />
          <ToggleRow icon={Globe} label="USDT auto-confirm" desc="Auto-credit after 1 blockchain confirmation" checked={cfg.usdtEnabled} onCheckedChange={(v) => patchMut.mutate({ usdtEnabled: v })} disabled={!cfg.autoCredit} />

          <div className="my-3 border-t border-border" />

          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Thresholds</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Min auto-credit (PKR)</Label>
              <Input type="number" defaultValue={cfg.minAutoCredit} onBlur={(e) => patchMut.mutate({ minAutoCredit: Number(e.target.value) })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Max auto-credit (PKR)</Label>
              <Input type="number" defaultValue={cfg.maxAutoCredit} onBlur={(e) => patchMut.mutate({ maxAutoCredit: Number(e.target.value) })} />
            </div>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">Requests outside this range require manual admin approval.</p>
        </Card>

        {/* Admin routing + tokens */}
        <div className="space-y-6">
          {/* Admin recipient */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="h-4 w-4 text-violet-600" />
              <h3 className="text-sm font-semibold">Admin Recipient — All Funds Route Here</h3>
            </div>
            <div className="rounded-xl border border-violet-300/40 bg-violet-500/5 p-4 space-y-2.5">
              <div className="flex items-center gap-2 pb-2 border-b border-violet-300/30">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-white font-bold text-sm">
                  {admin.accountTitle.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </span>
                <div>
                  <p className="text-sm font-semibold">{admin.accountTitle}</p>
                  <p className="text-[11px] text-muted-foreground">Worldwide recipient · Admin</p>
                </div>
              </div>
              <DetailRow label="Bank" value={admin.bankName} onCopy={() => copy(admin.bankName, 'bank')} copied={copied === 'bank'} />
              <DetailRow label="Account #" value={admin.accountNumber} onCopy={() => copy(admin.accountNumber, 'acc')} copied={copied === 'acc'} mono />
              <DetailRow label="IBAN" value={admin.iban} onCopy={() => copy(admin.iban, 'iban')} copied={copied === 'iban'} mono />
              <DetailRow label="Swift" value={admin.swift} onCopy={() => copy(admin.swift, 'swift')} copied={copied === 'swift'} mono />
              <DetailRow label="Branch" value={`${admin.branch} (${admin.branchCode})`} onCopy={() => copy(admin.branch, 'branch')} copied={copied === 'branch'} />
              <DetailRow label="Easypaisa" value={admin.easypaisa} onCopy={() => copy(admin.easypaisa, 'ep')} copied={copied === 'ep'} mono />
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              <Globe className="inline h-3 w-3 mr-1" />
              All subscription payments and fund deposits route directly to this admin account worldwide.
            </p>
          </Card>

          {/* Token status */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <KeyRound className="h-4 w-4 text-violet-600" />
              <h3 className="text-sm font-semibold">API Tokens</h3>
              <Badge variant="outline" className={cn('text-[10px] ml-auto', tokens.configured ? 'text-emerald-600 border-emerald-500/30 bg-emerald-500/10' : 'text-amber-600 border-amber-500/30 bg-amber-500/10')}>
                {tokens.configured ? 'Configured' : 'Missing'}
              </Badge>
            </div>
            <div className="space-y-2">
              <TokenRow label="JazzCash Token 1" value={tokens.jazzcashToken1} />
              <TokenRow label="JazzCash Token 2" value={tokens.jazzcashToken2} />
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Tokens are stored in <code className="text-[10px] bg-muted px-1 py-0.5 rounded">.env</code> and never exposed in source code. The bot uses them to verify incoming JazzCash transactions.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}

function BotMetric({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg bg-card border border-border p-3">
      <Icon className={cn('h-4 w-4 mb-1.5', color)} />
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm font-bold tabular-nums">{value}</p>
    </div>
  )
}

function ToggleRow({ icon: Icon, label, desc, checked, onCheckedChange, disabled }: { icon: React.ElementType; label: string; desc: string; checked: boolean; onCheckedChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className={cn('flex items-center justify-between gap-3 py-2', disabled && 'opacity-50')}>
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground shrink-0"><Icon className="h-4 w-4" /></span>
        <div><p className="text-sm font-medium">{label}</p><p className="text-[11px] text-muted-foreground">{desc}</p></div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  )
}

function DetailRow({ label, value, onCopy, copied, mono }: { label: string; value: string; onCopy: () => void; copied: boolean; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide w-20 shrink-0">{label}</span>
      <span className={cn('flex-1 truncate text-sm font-medium', mono && 'font-mono text-xs')}>{value}</span>
      <button type="button" onClick={onCopy} className="text-muted-foreground hover:text-foreground shrink-0" aria-label={`Copy ${label}`}>
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}

function TokenRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2">
      <span className="text-xs font-medium">{label}</span>
      <span className="font-mono text-[11px] text-muted-foreground">{value}</span>
    </div>
  )
}
