'use client'

import { Menu, Search, Wallet, ChevronDown, Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrency } from '@/lib/format'
import { NotificationsBell } from './notifications-bell'
import type { Overview } from './types'

export function Topbar({
  overview,
  onMenuClick,
  onToggleTheme,
  isDark,
  onLogout,
}: {
  overview: Overview | undefined
  onMenuClick: () => void
  onToggleTheme: () => void
  isDark: boolean
  onLogout?: () => void
}) {
  const initials = overview?.reseller.fullName
    ?.split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'SR'

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Search */}
      <div className="relative hidden md:block flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search transactions, lines, orders…"
          className="pl-9 bg-muted/50 border-transparent focus-visible:border-border"
        />
      </div>

      <div className="flex-1 md:hidden" />

      {/* Balance pill */}
      <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 shadow-sm">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Wallet className="h-3.5 w-3.5" />
        </span>
        <div className="leading-tight">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Balance</p>
          <p className="text-sm font-semibold tabular-nums">
            {formatCurrency(overview?.balance ?? 0, overview?.currency)}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="ml-1 h-7 px-2 text-xs font-medium text-primary hover:text-primary"
          asChild
        >
          <a href="#add-funds">+ Add</a>
        </Button>
      </div>

      <Button variant="ghost" size="icon" onClick={onToggleTheme} aria-label="Toggle theme" className="hidden sm:inline-flex">
        {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>

      <NotificationsBell />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 px-2 h-10 rounded-full hover:bg-muted">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:flex flex-col items-start leading-tight">
              <span className="text-xs font-semibold">{overview?.reseller.fullName ?? 'Reseller'}</span>
              <span className="text-[10px] text-muted-foreground capitalize">{overview?.reseller.role ?? 'reseller'}</span>
            </span>
            <ChevronDown className="hidden sm:block h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span>{overview?.reseller.fullName ?? 'Reseller'}</span>
            <span className="text-xs font-normal text-muted-foreground">{overview?.reseller.email}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Account Settings</DropdownMenuItem>
          <DropdownMenuItem>API Keys</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onLogout}>Sign Out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
