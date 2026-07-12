'use client'

import { useState } from 'react'
import {
  Shield,
  ShieldCheck,
  Globe,
  Lock,
  Zap,
  Activity,
  Wifi,
  Server,
  CheckCircle2,
  Loader2,
  Signal,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface VpnServer {
  id: string
  country: string
  flag: string
  city: string
  ping: number
  load: number
  premium: boolean
}

const VPN_SERVERS: VpnServer[] = [
  { id: 'pk', country: 'Pakistan', flag: '🇵🇰', city: 'Islamabad', ping: 12, load: 34, premium: false },
  { id: 'in', country: 'India', flag: '🇮🇳', city: 'Mumbai', ping: 28, load: 52, premium: false },
  { id: 'uk', country: 'United Kingdom', flag: '🇬🇧', city: 'London', ping: 45, load: 41, premium: true },
  { id: 'us', country: 'United States', flag: '🇺🇸', city: 'New York', ping: 89, load: 67, premium: true },
  { id: 'us2', country: 'United States', flag: '🇺🇸', city: 'Los Angeles', ping: 112, load: 38, premium: true },
  { id: 'de', country: 'Germany', flag: '🇩🇪', city: 'Frankfurt', ping: 67, load: 29, premium: true },
  { id: 'fr', country: 'France', flag: '🇫🇷', city: 'Paris', ping: 72, load: 44, premium: true },
  { id: 'nl', country: 'Netherlands', flag: '🇳🇱', city: 'Amsterdam', ping: 61, load: 22, premium: true },
  { id: 'sg', country: 'Singapore', flag: '🇸🇬', city: 'Singapore', ping: 95, load: 56, premium: true },
  { id: 'ae', country: 'UAE', flag: '🇦🇪', city: 'Dubai', ping: 38, load: 48, premium: true },
  { id: 'tr', country: 'Turkey', flag: '🇹🇷', city: 'Istanbul', ping: 54, load: 31, premium: true },
  { id: 'jp', country: 'Japan', flag: '🇯🇵', city: 'Tokyo', ping: 134, load: 35, premium: true },
]

export function VpnView() {
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [selectedServer, setSelectedServer] = useState<VpnServer | null>(null)
  const [connectedServer, setConnectedServer] = useState<VpnServer | null>(null)
  const { toast } = useToast()

  const connect = (server: VpnServer) => {
    setConnecting(true)
    setSelectedServer(server)
    setTimeout(() => {
      setConnecting(false)
      setConnected(true)
      setConnectedServer(server)
      toast({
        title: `Connected to ${server.country}`,
        description: `Your traffic is now encrypted via ${server.city}. IP changed.`,
      })
    }, 2000)
  }

  const disconnect = () => {
    setConnected(false)
    setConnectedServer(null)
    toast({ title: 'VPN disconnected', description: 'Your connection is no longer encrypted.' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className={cn(
          'flex h-11 w-11 items-center justify-center rounded-xl',
          connected ? 'bg-emerald-500/10 text-emerald-600' : 'bg-primary/10 text-primary',
        )}>
          <Shield className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">VPN</h1>
          <p className="text-sm text-muted-foreground">Encrypt your connection and access geo-restricted content.</p>
        </div>
      </div>

      {/* Status hero */}
      <Card className={cn(
        'relative overflow-hidden p-6 border-2',
        connected ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-600/10 via-card to-card' : 'border-amber-500/30 bg-gradient-to-br from-amber-600/5 via-card to-card',
      )}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <span className={cn(
              'relative flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg',
              connected ? 'bg-emerald-500 text-white' : connecting ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground',
            )}>
              {connecting ? <Loader2 className="h-7 w-7 animate-spin" /> : connected ? <ShieldCheck className="h-7 w-7" /> : <Lock className="h-7 w-7" />}
              {connected && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" /></span>}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">{connected ? 'Protected' : connecting ? 'Connecting…' : 'Not Protected'}</h2>
                <Badge className={cn('text-[10px]', connected ? 'bg-emerald-500 text-white' : connecting ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground')}>
                  {connected ? 'CONNECTED' : connecting ? 'CONNECTING' : 'DISCONNECTED'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {connected && connectedServer ? `${connectedServer.flag} ${connectedServer.country} · ${connectedServer.city} · ${connectedServer.ping}ms` : 'Select a server below to connect'}
              </p>
            </div>
          </div>
          {connected ? (
            <Button variant="destructive" className="gap-1.5" onClick={disconnect}>
              <Shield className="h-4 w-4" /> Disconnect
            </Button>
          ) : (
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <Stat icon={Wifi} label="IP Hidden" value={connected ? 'Yes' : 'No'} />
              <Stat icon={Lock} label="Encryption" value={connected ? 'AES-256' : 'Off'} />
              <Stat icon={Zap} label="Protocol" value="WireGuard" />
            </div>
          )}
        </div>
      </Card>

      {/* Quick stats when connected */}
      {connected && connectedServer && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Activity} label="Download" value="24.5 Mbps" color="text-emerald-600" />
          <StatCard icon={Activity} label="Upload" value="8.2 Mbps" color="text-primary" />
          <StatCard icon={Signal} label="Ping" value={`${connectedServer.ping}ms`} color="text-amber-600" />
          <StatCard icon={Server} label="Server Load" value={`${connectedServer.load}%`} color="text-violet-600" />
        </div>
      )}

      {/* Server list */}
      <Card className="overflow-hidden">
        <div className="border-b border-border px-5 py-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Server Locations</h3>
          <Badge variant="secondary" className="text-[10px]">{VPN_SERVERS.length} servers</Badge>
        </div>
        <div className="divide-y divide-border">
          {VPN_SERVERS.map((server) => {
            const isActive = connected && connectedServer?.id === server.id
            const isConnectingThis = connecting && selectedServer?.id === server.id
            return (
              <div
                key={server.id}
                className={cn(
                  'flex items-center gap-3 px-5 py-3 hover:bg-muted/20 transition-colors',
                  isActive && 'bg-emerald-500/5',
                )}
              >
                <span className="text-2xl shrink-0">{server.flag}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{server.country}</p>
                    {server.premium && <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 text-amber-600 border-amber-500/30">PRO</Badge>}
                    {isActive && <Badge className="text-[8px] px-1 py-0 h-3.5 bg-emerald-500 text-white">CONNECTED</Badge>}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{server.city}</p>
                </div>
                {/* Ping + load */}
                <div className="hidden sm:flex items-center gap-4 text-xs shrink-0">
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase">Ping</p>
                    <p className={cn('font-medium tabular-nums', server.ping < 50 ? 'text-emerald-600' : server.ping < 100 ? 'text-amber-600' : 'text-rose-600')}>{server.ping}ms</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase">Load</p>
                    <p className="font-medium tabular-nums">{server.load}%</p>
                  </div>
                </div>
                {/* Connect button */}
                {isActive ? (
                  <Button variant="outline" size="sm" className="gap-1 h-8 text-xs" onClick={disconnect}>
                    <Shield className="h-3.5 w-3.5" /> Disconnect
                  </Button>
                ) : isConnectingThis ? (
                  <Button variant="outline" size="sm" className="gap-1 h-8 text-xs" disabled>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Connecting…
                  </Button>
                ) : (
                  <Button
                    variant={connected ? 'ghost' : 'default'}
                    size="sm"
                    className="gap-1 h-8 text-xs"
                    onClick={() => connect(server)}
                    disabled={connecting}
                  >
                    <Globe className="h-3.5 w-3.5" /> Connect
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Info */}
      <Card className="p-5 bg-muted/30">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground space-y-1.5">
            <p className="font-medium text-foreground">Why use VPN with IPTV?</p>
            <p>• Bypass geo-restrictions — access channels blocked in your region</p>
            <p>• Encrypt your traffic — ISP can't see what you're streaming</p>
            <p>• Prevent throttling — ISPs won't slow down your streaming</p>
            <p>• Protect against DDoS — hide your real IP address</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

function Stat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <Card className="p-4">
      <Icon className={cn('h-4 w-4 mb-1.5', color)} />
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-lg font-bold tabular-nums">{value}</p>
    </Card>
  )
}
