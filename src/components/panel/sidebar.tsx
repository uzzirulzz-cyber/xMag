'use client'

import {
  LayoutDashboard,
  Wallet,
  Tv,
  Film,
  Clapperboard,
  Users,
  ShoppingBag,
  Server,
  Settings,
  LifeBuoy,
  Store,
  Lock,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  view: string
  icon: React.ElementType
  badge?: string
}

const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Main',
    items: [
      { label: 'Dashboard', view: 'dashboard', icon: LayoutDashboard },
      { label: 'Funds', view: 'funds', icon: Wallet, badge: '3' },
      { label: 'Orders', view: 'orders', icon: ShoppingBag },
    ],
  },
  {
    title: 'Content',
    items: [
      { label: 'Live Streams', view: 'live', icon: Tv },
      { label: 'Movies', view: 'movies', icon: Film },
      { label: 'Series', view: 'series', icon: Clapperboard },
      { label: 'Lines', view: 'lines', icon: Users },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Servers', view: 'servers', icon: Server },
      { label: 'VPN', view: 'vpn', icon: Shield },
      { label: 'Settings', view: 'settings', icon: Settings },
      { label: 'Support', view: 'support', icon: LifeBuoy },
    ],
  },
  {
    title: 'Portal',
    items: [
      { label: 'Store Front', view: 'storefront', icon: Store },
      { label: 'Admin', view: 'admin', icon: Lock },
    ],
  },
]

export function Sidebar({
  activeView = 'funds',
  onNavigate,
  className,
}: {
  activeView?: string
  onNavigate?: (view: string) => void
  className?: string
}) {
  return (
    <div className={cn('flex h-full flex-col bg-sidebar text-sidebar-foreground', className)}>
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-sidebar-border shrink-0">
        <img src="/magx-icon.png" alt="MaGx" className="h-9 w-9 rounded-lg object-cover ring-1 ring-sidebar-primary/40" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-tight truncate tracking-tight">
            MaGx <span className="text-[#ff3b3b]">World</span>
          </p>
          <p className="text-[10px] text-sidebar-foreground/60 leading-tight truncate uppercase tracking-wider">Super IPTV Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-5">
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive = activeView === item.view
                return (
                  <li key={item.label}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        onNavigate?.(item.view)
                      }}
                      className={cn(
                        'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                        isActive
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm'
                          : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      )}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className={cn(
                            'rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none',
                            isActive
                              ? 'bg-sidebar-primary-foreground/20 text-sidebar-primary-foreground'
                              : 'bg-sidebar-accent text-sidebar-accent-foreground',
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer status */}
      <div className="shrink-0 border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/60 px-3 py-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-sidebar-accent-foreground truncate">All servers online</p>
            <p className="text-[10px] text-sidebar-foreground/50 truncate">99.98% uptime</p>
          </div>
        </div>
      </div>
    </div>
  )
}
