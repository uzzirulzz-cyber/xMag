'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Smartphone,
  Landmark,
  Bitcoin,
  CreditCard,
  Copy,
  Check,
  Loader2,
  Upload,
  AlertCircle,
  Info,
  ShieldCheck,
  PlusCircle,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'
import { useToast } from '@/hooks/use-toast'
import type { PaymentMethod, PaymentMethodType } from './types'

const TYPE_ICON: Record<PaymentMethodType, React.ElementType> = {
  mobile_wallet: Smartphone,
  bank_transfer: Landmark,
  crypto: Bitcoin,
  card: CreditCard,
}

const PRESETS = [1000, 2000, 5000, 10000, 25000, 50000]

export function AddFunds({
  methods,
  loading,
  onSubmitted,
}: {
  methods: PaymentMethod[]
  loading: boolean
  onSubmitted?: () => void
}) {
  const [selectedId, setSelectedId] = useState<string>('')
  const [amount, setAmount] = useState<string>('')
  const [reference, setReference] = useState('')
  const [senderNumber, setSenderNumber] = useState('')
  const [note, setNote] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const selected = methods.find((m) => m.id === selectedId) || null
  const amountNum = Number(amount) || 0
  const fee = selected ? Math.round(amountNum * (selected.feePercent / 100)) : 0
  const total = amountNum + fee
  const validAmount =
    selected && amountNum >= selected.minAmount && amountNum <= selected.maxAmount

  const { toast } = useToast()
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch('/api/funds/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to submit fund request')
      return data
    },
    onSuccess: () => {
      toast({
        title: 'Fund request submitted',
        description: 'Your request is pending review. Credit will reflect once approved.',
      })
      setAmount('')
      setReference('')
      setSenderNumber('')
      setNote('')
      qc.invalidateQueries({ queryKey: ['overview'] })
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['requests'] })
      qc.invalidateQueries({ queryKey: ['notifications'] })
      onSubmitted?.()
    },
    onError: (err: Error) => {
      toast({ title: 'Could not submit', description: err.message, variant: 'destructive' })
    },
  })

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      /* ignore */
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) {
      toast({ title: 'Select a payment method', variant: 'destructive' })
      return
    }
    if (!validAmount) {
      toast({
        title: 'Invalid amount',
        description: `Enter between ${formatCurrency(selected.minAmount)} and ${formatCurrency(selected.maxAmount)}.`,
        variant: 'destructive',
      })
      return
    }
    if (!reference.trim()) {
      toast({ title: 'Reference required', description: 'Enter the payment TID/reference.', variant: 'destructive' })
      return
    }
    mutation.mutate({
      paymentMethodId: selected.id,
      amount: amountNum,
      reference: reference.trim(),
      senderNumber: senderNumber.trim() || null,
      note: note.trim() || null,
    })
  }

  return (
    <Card id="add-funds" className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <PlusCircle className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-base font-semibold">Add Funds</h2>
          <p className="text-xs text-muted-foreground">Choose a payment method, send the exact amount, then submit the reference for credit.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
        {/* Left: method picker */}
        <div className="lg:col-span-2 border-b lg:border-b-0 lg:border-r border-border p-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Payment Method</p>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {methods.map((m) => {
                const Icon = TYPE_ICON[m.type] || CreditCard
                const active = selectedId === m.id
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(m.id)
                      setAmount('')
                    }}
                    className={cn(
                      'group flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all',
                      active
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                        : 'border-border hover:border-primary/40 hover:bg-muted/50',
                    )}
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white font-bold text-sm shadow-sm"
                      style={{ backgroundColor: m.color }}
                    >
                      {m.logoText}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate">{m.name}</span>
                        {m.feePercent > 0 && (
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                            +{m.feePercent}% fee
                          </Badge>
                        )}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Icon className="h-3 w-3" />
                        <span className="truncate">{m.accountTitle}</span>
                      </span>
                    </span>
                    <span
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                        active ? 'border-primary bg-primary' : 'border-border',
                      )}
                    >
                      {active && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Right: form */}
        <form onSubmit={submit} className="lg:col-span-3 p-5">
          {!selected ? (
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center gap-2 text-muted-foreground">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Info className="h-6 w-6" />
              </span>
              <p className="text-sm font-medium">Select a payment method to begin</p>
              <p className="text-xs max-w-xs">You&apos;ll see account details and the amount to send here.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Account details */}
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                  Send payment to
                </p>
                <DetailRow
                  label="Account Title"
                  value={selected.accountTitle}
                  onCopy={() => copy(selected.accountTitle, 'title')}
                  copied={copied === 'title'}
                />
                <DetailRow
                  label={selected.type === 'crypto' ? 'Wallet Address' : 'Account Number'}
                  value={selected.accountNumber}
                  onCopy={() => copy(selected.accountNumber, 'acc')}
                  copied={copied === 'acc'}
                  mono
                />
                {selected.bankName && (
                  <DetailRow
                    label="Bank / Network"
                    value={selected.bankName + (selected.network ? ` (${selected.network})` : '')}
                    onCopy={() => copy(`${selected.bankName} ${selected.network ?? ''}`, 'bank')}
                    copied={copied === 'bank'}
                  />
                )}
                <div className="mt-3 flex gap-2 rounded-lg bg-primary/5 p-2.5 text-[11px] text-primary">
                  <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{selected.instructions}</p>
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-xs font-medium">
                  Amount (PKR)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">₨</span>
                  <Input
                    id="amount"
                    type="number"
                    inputMode="numeric"
                    min={selected.minAmount}
                    max={selected.maxAmount}
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-8 text-lg font-semibold h-12 tabular-nums"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.filter((p) => p <= selected.maxAmount).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setAmount(String(p))}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                        amount === String(p)
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border hover:border-primary/50 hover:bg-muted',
                      )}
                    >
                      {formatCurrency(p)}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Min {formatCurrency(selected.minAmount)} · Max {formatCurrency(selected.maxAmount)}
                </p>
              </div>

              {/* Reference + sender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reference" className="text-xs font-medium">
                    Transaction Reference (TID) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="reference"
                    placeholder="e.g. JC-8841230"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sender" className="text-xs font-medium">
                    Sender Number {selected.type === 'mobile_wallet' ? <span className="text-destructive">*</span> : <span className="text-muted-foreground">(optional)</span>}
                  </Label>
                  <Input
                    id="sender"
                    placeholder="e.g. 0301-1234567"
                    value={senderNumber}
                    onChange={(e) => setSenderNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note" className="text-xs font-medium">
                  Note <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="note"
                  rows={2}
                  placeholder="Anything we should know about this payment…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              {/* Upload proof (visual only) */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Payment Screenshot <span className="text-muted-foreground">(optional)</span></Label>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground hover:border-primary/50 hover:bg-muted/50 transition-colors">
                  <Upload className="h-4 w-4" />
                  <span>Click to upload receipt (PNG/JPG)</span>
                  <input type="file" accept="image/*" className="hidden" />
                </label>
              </div>

              {/* Summary + submit */}
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
                <SummaryRow label="Amount" value={formatCurrency(amountNum)} />
                {fee > 0 && <SummaryRow label={`Fee (${selected.feePercent}%)`} value={`+ ${formatCurrency(fee)}`} />}
                <div className="border-t border-border my-1" />
                <SummaryRow label="Total to pay" value={formatCurrency(total)} bold />
                <SummaryRow
                  label="You'll receive"
                  value={formatCurrency(amountNum) + ' credit'}
                  bold
                  accent
                />
              </div>

              {validAmount === false && amount !== '' && (
                <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Amount must be between {formatCurrency(selected.minAmount)} and {formatCurrency(selected.maxAmount)}.
                </p>
              )}

              <Button
                type="submit"
                className="w-full h-11 text-sm font-semibold"
                disabled={mutation.isPending || !validAmount || !reference.trim()}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" /> Submit Fund Request
                  </>
                )}
              </Button>
              <p className="text-center text-[11px] text-muted-foreground">
                Funds are credited after manual verification, usually within 10–30 minutes.
              </p>
            </div>
          )}
        </form>
      </div>
    </Card>
  )
}

function DetailRow({
  label,
  value,
  onCopy,
  copied,
  mono,
}: {
  label: string
  value: string
  onCopy: () => void
  copied: boolean
  mono?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide w-28 shrink-0">{label}</span>
      <span className={cn('flex-1 truncate text-sm font-medium', mono && 'font-mono text-xs')}>{value}</span>
      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onCopy} aria-label={`Copy ${label}`}>
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
    </div>
  )
}

function SummaryRow({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={cn('text-muted-foreground', bold && 'font-medium text-foreground')}>{label}</span>
      <span className={cn('tabular-nums', bold && 'font-semibold', accent && 'text-primary')}>{value}</span>
    </div>
  )
}
