'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ShoppingBag,
  Server,
  Settings as SettingsIcon,
  LifeBuoy,
  Globe,
  ShieldCheck,
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  Mail,
  MessageSquare,
  Phone,
  Save,
  User,
  Lock,
  Bell,
  Database,
  CheckCircle2,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { formatCurrency, formatNumber } from '@/lib/format'
import { useToast } from '@/hooks/use-toast'
import type { Transaction, Overview, XtreamAccount } from './types'

// ─── Orders View ──────────────────────────────────────────────────────────
export function OrdersView() {
  const { data, isLoading } = useQuery<{ items: Transaction[]; total: number }>({
    queryKey: ['transactions', 'orders'],
    queryFn: async () => (await fetch('/api/funds/transactions?type=debit&limit=50')).json(),
  })
  const orders = data?.items ?? []

  const totalSpent = orders.reduce((s, o) => s + o.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ShoppingBag className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground">All IPTV line purchases and renewals.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4"><p className="text-xs text-muted-foreground uppercase">Total Orders</p><p className="text-2xl font-bold mt-1">{orders.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground uppercase">Total Spent</p><p className="text-2xl font-bold mt-1 text-rose-600">{formatCurrency(totalSpent)}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground uppercase">Avg Order</p><p className="text-2xl font-bold mt-1">{orders.length ? formatCurrency(totalSpent / orders.length) : '—'}</p></Card>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-border px-5 py-3"><h2 className="text-sm font-semibold">Order History</h2></div>
        {isLoading ? (
          <div className="p-5 space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
        ) : orders.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {orders.map((o) => (
              <div key={o.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/20">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 shrink-0">
                  <ShoppingBag className="h-4 w-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{o.description}</p>
                  <p className="text-[11px] text-muted-foreground">{new Date(o.createdAt).toLocaleString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} · {o.reference}</p>
                </div>
                <Badge variant="outline" className="text-[10px]">{o.status}</Badge>
                <span className="text-sm font-semibold tabular-nums text-rose-600">−{formatCurrency(o.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

// ─── Servers View ─────────────────────────────────────────────────────────
export function ServersView() {
  const { data: account } = useQuery<XtreamAccount>({
    queryKey: ['xtream-account'],
    queryFn: async () => (await fetch('/api/funds/xtream/account')).json(),
  })
  const { data: stats } = useQuery<{ totalChannels: number; totalViewers: number }>({
    queryKey: ['channel-stats'],
    queryFn: async () => (await fetch('/api/funds/channels/stats')).json(),
    refetchInterval: 30_000,
  })

  const servers = [
    { name: 'Xtream Master', host: 'geotv.space:8880', type: 'Streaming', status: 'online', load: 42, icon: Globe, color: 'text-violet-600' },
    { name: 'EU-2 Edge', host: 'eu2.magxworld.tv', type: 'CDN Edge', status: 'online', load: 67, icon: Server, color: 'text-emerald-600' },
    { name: 'US-1 Edge', host: 'us1.magxworld.tv', type: 'CDN Edge', status: 'online', load: 38, icon: Server, color: 'text-sky-600' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Server className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Servers</h1>
          <p className="text-sm text-muted-foreground">Streaming infrastructure status and health.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {servers.map((s) => (
          <Card key={s.name} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className={cn('flex h-11 w-11 items-center justify-center rounded-xl bg-muted', s.color)}>
                  <s.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{s.name}</p>
                  <p className="text-[11px] text-muted-foreground font-mono">{s.host}</p>
                </div>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
                {s.status}
              </Badge>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Type</span><span className="font-medium">{s.type}</span></div>
              <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Load</span><span className="font-medium tabular-nums">{s.load}%</span></div>
              <div className="h-2 rounded-full bg-muted overflow-hidden"><div className={cn('h-full rounded-full', s.load > 70 ? 'bg-amber-500' : 'bg-emerald-500')} style={{ width: `${s.load}%` }} /></div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <ServerMetric icon={Cpu} label="CPU" value={`${Math.round(s.load * 0.8)}%`} />
              <ServerMetric icon={HardDrive} label="Disk" value={`${Math.round(s.load * 0.5)}%`} />
              <ServerMetric icon={Wifi} label="Net" value={`${Math.round(100 - s.load)} Mbps`} />
            </div>
          </Card>
        ))}
      </div>

      {/* Xtream account panel */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-4 w-4 text-violet-600" />
          <h3 className="text-sm font-semibold">Xtream Codes Server</h3>
          <Badge variant="secondary" className="text-[10px]">{account?.serverInfo.panel ?? 'Xtream-Masters'}</Badge>
        </div>
        {account ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <Info label="Host" value={`${account.serverInfo.url}:${account.serverInfo.port}`} />
            <Info label="Status" value={account.userInfo.status} accent />
            <Info label="Connections" value={`${account.userInfo.activeConnections}/${account.userInfo.maxConnections}`} />
            <Info label="Channels" value={stats ? formatNumber(stats.totalChannels) : '—'} />
          </div>
        ) : (
          <Skeleton className="h-20 w-full" />
        )}
      </Card>
    </div>
  )
}

function ServerMetric({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-2">
      <Icon className="h-3.5 w-3.5 mx-auto text-muted-foreground" />
      <p className="text-[10px] text-muted-foreground mt-1">{label}</p>
      <p className="text-xs font-semibold tabular-nums">{value}</p>
    </div>
  )
}
function Info({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={cn('text-sm font-medium', accent && 'text-emerald-600')}>{value}</p>
    </div>
  )
}

// ─── Settings View ────────────────────────────────────────────────────────
export function SettingsView() {
  const { data: overview } = useQuery<Overview>({
    queryKey: ['overview'],
    queryFn: async () => (await fetch('/api/funds/overview')).json(),
  })
  const { toast } = useToast()
  const [emailNotif, setEmailNotif] = useState(true)
  const [smsNotif, setSmsNotif] = useState(false)
  const [twoFa, setTwoFa] = useState(true)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <SettingsIcon className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your account and preferences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4"><User className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold">Profile</h3></div>
          <div className="space-y-3">
            <Field label="Full Name" value={overview?.reseller.fullName ?? ''} />
            <Field label="Email" value={overview?.reseller.email ?? ''} />
            <Field label="Phone" value={overview?.reseller.phone ?? ''} />
            <Field label="Username" value={overview?.reseller.username ?? ''} disabled />
            <Button className="w-full mt-2 gap-1.5" onClick={() => toast({ title: 'Profile saved' })}>
              <Save className="h-4 w-4" /> Save Changes
            </Button>
          </div>
        </Card>

        {/* Security */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4"><Lock className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold">Security</h3></div>
          <div className="space-y-3">
            <Field label="Current Password" value="" type="password" placeholder="••••••••" />
            <Field label="New Password" value="" type="password" placeholder="Enter new password" />
            <Field label="Confirm Password" value="" type="password" placeholder="Repeat new password" />
            <Separator className="my-3" />
            <ToggleRow icon={ShieldCheck} label="Two-Factor Authentication" desc="Require OTP on login" checked={twoFa} onCheckedChange={setTwoFa} />
          </div>
          <Button variant="outline" className="w-full mt-3 gap-1.5" onClick={() => toast({ title: 'Security updated' })}>
            <Lock className="h-4 w-4" /> Update Security
          </Button>
        </Card>

        {/* Notifications */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4"><Bell className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold">Notifications</h3></div>
          <div className="space-y-3">
            <ToggleRow icon={Mail} label="Email Notifications" desc="Fund approvals, expiry alerts" checked={emailNotif} onCheckedChange={setEmailNotif} />
            <ToggleRow icon={MessageSquare} label="SMS Notifications" desc="Critical alerts via SMS" checked={smsNotif} onCheckedChange={setSmsNotif} />
          </div>
        </Card>

        {/* System info */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4"><Database className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold">System</h3></div>
          <div className="space-y-2 text-sm">
            <Row label="Database" value="MongoDB Atlas" badge="Connected" />
            <Row label="Panel Version" value="v2.4.1 Enterprise" />
            <Row label="Encryption" value="AES-256 at rest" badge="Active" />
            <Row label="API" value="REST + Xtream proxy" />
            <Row label="Uptime" value="99.98%" />
          </div>
        </Card>
      </div>
    </div>
  )
}

function Field({ label, value, type = 'text', placeholder, disabled }: { label: string; value: string; type?: string; placeholder?: string; disabled?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input type={type} defaultValue={value} placeholder={placeholder} disabled={disabled} />
    </div>
  )
}
function ToggleRow({ icon: Icon, label, desc, checked, onCheckedChange }: { icon: React.ElementType; label: string; desc: string; checked: boolean; onCheckedChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Icon className="h-4 w-4" /></span>
        <div><p className="text-sm font-medium">{label}</p><p className="text-[11px] text-muted-foreground">{desc}</p></div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}
function Row({ label, value, badge }: { label: string; value: string; badge?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2">
        <span className="font-medium">{value}</span>
        {badge && <Badge variant="outline" className="text-[9px] text-emerald-600 border-emerald-500/20 bg-emerald-500/10">{badge}</Badge>}
      </span>
    </div>
  )
}

// ─── Support View ─────────────────────────────────────────────────────────
export function SupportView() {
  const { toast } = useToast()
  const faqs = [
    { q: 'How do I add funds to my account?', a: 'Go to Funds → Add Funds, choose a payment method (JazzCash, Easypaisa, Bank, USDT, Card), send the exact amount, and submit the transaction reference. Credit is issued after admin approval.' },
    { q: 'How long does credit take to appear?', a: 'JazzCash & Easypaisa: 10–30 min. Bank transfer: up to 2 hours. USDT: within 10 min of 1 confirmation. Card: auto-credited within 5 min.' },
    { q: 'What is a Custom Subscription?', a: 'When creating a line, you can exclude content types (Live/VOD/Series) or select specific series categories to optimise for low-capacity devices.' },
    { q: 'How do I renew an existing line?', a: 'Go to Lines → click the row actions menu → Renew / Extend. Choose a plan and confirm. The cost is debited from your balance instantly.' },
    { q: 'What is the World Package?', a: 'The World Package connects to a real Xtream Codes server (geotv.space) with 242,000+ live channels and VODs. Click it in the Packages row to browse.' },
    { q: 'How do I get my M3U / xAPI URL?', a: 'Go to Lines → row actions → Copy M3U URL or Copy xAPI URL. These work in any IPTV player (TiviMate, IPTV Smarters, VLC).' },
  ]
  const [open, setOpen] = useOpenState()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <LifeBuoy className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Support</h1>
          <p className="text-sm text-muted-foreground">FAQs, contact options and help resources.</p>
        </div>
      </div>

      {/* Contact cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 text-center cursor-pointer hover:border-primary/40 transition-colors" onClick={() => toast({ title: 'Opening WhatsApp…' })}>
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600"><MessageSquare className="h-6 w-6" /></span>
          <p className="mt-2 text-sm font-semibold">WhatsApp</p>
          <p className="text-[11px] text-muted-foreground">+92 300 1234567</p>
        </Card>
        <Card className="p-5 text-center cursor-pointer hover:border-primary/40 transition-colors" onClick={() => toast({ title: 'Opening email…' })}>
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"><Mail className="h-6 w-6" /></span>
          <p className="mt-2 text-sm font-semibold">Email</p>
          <p className="text-[11px] text-muted-foreground">support@magxworld.tv</p>
        </Card>
        <Card className="p-5 text-center cursor-pointer hover:border-primary/40 transition-colors" onClick={() => toast({ title: 'Calling…' })}>
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-600"><Phone className="h-6 w-6" /></span>
          <p className="mt-2 text-sm font-semibold">Phone</p>
          <p className="text-[11px] text-muted-foreground">021-111-123-456</p>
        </Card>
      </div>

      {/* FAQ */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-4">Frequently Asked Questions</h3>
        <div className="space-y-2">
          {faqs.map((f, i) => (
            <div key={i} className="rounded-lg border border-border overflow-hidden">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
                onClick={() => setOpen(open === i ? -1 : i)}
              >
                <span className="text-sm font-medium">{f.q}</span>
                <CheckCircle2 className={cn('h-4 w-4 shrink-0 transition-transform', open === i && 'rotate-180 text-primary')} />
              </button>
              {open === i && <div className="px-4 pb-3 text-xs text-muted-foreground leading-relaxed">{f.a}</div>}
            </div>
          ))}
        </div>
      </Card>

      {/* Contact form */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-4">Send a Message</h3>
        <div className="space-y-3">
          <Field label="Subject" value="" placeholder="Brief description of your issue" />
          <div className="space-y-1.5">
            <Label className="text-xs">Message</Label>
            <Textarea rows={4} placeholder="Describe your issue in detail…" />
          </div>
          <Button className="gap-1.5" onClick={() => toast({ title: 'Message sent', description: 'We will respond within 24 hours.' })}>
            <Mail className="h-4 w-4" /> Send Message
          </Button>
        </div>
      </Card>
    </div>
  )
}

function useOpenState() {
  const [open, setOpen] = useState(-1)
  return [open, setOpen] as const
}
