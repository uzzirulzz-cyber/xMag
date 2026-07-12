'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Wallet, Tv } from 'lucide-react'
import { Sidebar } from '@/components/panel/sidebar'
import { Topbar } from '@/components/panel/topbar'
import { BalanceCards } from '@/components/panel/balance-cards'
import { AddFunds } from '@/components/panel/add-funds'
import { TransactionHistory } from '@/components/panel/transaction-history'
import { MySubscriptions } from '@/components/panel/my-subscriptions'
import { CustomSubscriptionDialog } from '@/components/panel/custom-subscription-dialog'
import { ChannelsAndPackages } from '@/components/panel/channels-and-packages'
import { DashboardView } from '@/components/panel/dashboard-view'
import { OrdersView, ServersView, SettingsView, SupportView } from '@/components/panel/system-views'
import { LiveStreamsView, MoviesView, SeriesView } from '@/components/panel/content-views'
import { PaymentAutomationPanel } from '@/components/panel/payment-automation-panel'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import type { Overview, PaymentMethod } from '@/components/panel/types'

type View =
  | 'dashboard' | 'funds' | 'orders'
  | 'live' | 'movies' | 'series' | 'lines'
  | 'servers' | 'settings' | 'support'

export default function Home() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [subDialogOpen, setSubDialogOpen] = useState(false)
  const [view, setView] = useState<View>('funds')

  useEffect(() => {
    const root = document.documentElement
    if (isDark) root.classList.add('dark')
    else root.classList.remove('dark')
  }, [isDark])

  useEffect(() => {
    fetch('/api/funds/seed', { method: 'POST' }).catch(() => {})
  }, [])

  const { data: overview, isLoading: overviewLoading } = useQuery<Overview>({
    queryKey: ['overview'],
    queryFn: async () => (await fetch('/api/funds/overview')).json(),
  })

  const { data: methodsData, isLoading: methodsLoading } = useQuery<{ methods: PaymentMethod[] }>({
    queryKey: ['payment-methods'],
    queryFn: async () => (await fetch('/api/funds/payment-methods')).json(),
  })

  const navigate = (v: string) => {
    setView(v as View)
    setMobileNavOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden lg:flex w-64 shrink-0 sticky top-0 h-screen">
        <Sidebar activeView={view} onNavigate={navigate} />
      </aside>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-72 p-0 border-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">Panel navigation menu</SheetDescription>
          <Sidebar activeView={view} onNavigate={navigate} />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Topbar
          overview={overview}
          onMenuClick={() => setMobileNavOpen(true)}
          onToggleTheme={() => setIsDark((v) => !v)}
          isDark={isDark}
        />

        <main className="flex-1 px-4 sm:px-6 py-6 space-y-6">
          {view === 'dashboard' && <DashboardView onNavigate={navigate} />}

          {view === 'funds' && (
            <>
              <div className="space-y-1.5">
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Wallet className="h-5 w-5" />
                  </span>
                  Funds Management
                </h1>
                <p className="text-sm text-muted-foreground">
                  Welcome back, {overview?.reseller.fullName ?? 'Reseller'}. Manage your credit balance and funding requests.
                </p>
              </div>
              <BalanceCards overview={overview} loading={overviewLoading} />
              <MySubscriptions onNew={() => setSubDialogOpen(true)} balance={overview?.balance ?? 0} />
              <PaymentAutomationPanel />
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                  <AddFunds methods={methodsData?.methods ?? []} loading={methodsLoading} />
                </div>
                <QuickTips />
              </div>
              <TransactionHistory currency={overview?.currency} />
            </>
          )}

          {view === 'orders' && <OrdersView />}

          {view === 'live' && <LiveStreamsView />}
          {view === 'movies' && <MoviesView />}
          {view === 'series' && <SeriesView />}

          {view === 'lines' && (
            <>
              <div className="flex items-end justify-between gap-3 flex-wrap">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Tv className="h-5 w-5" />
                    </span>
                    Lines
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">Create and manage IPTV lines for your clients.</p>
                </div>
                <Button onClick={() => setSubDialogOpen(true)} className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white gap-1.5">
                  <Tv className="h-4 w-4" /> New Subscription
                </Button>
              </div>
              <MySubscriptions onNew={() => setSubDialogOpen(true)} balance={overview?.balance ?? 0} />
            </>
          )}

          {view === 'servers' && <ServersView />}
          {view === 'settings' && <SettingsView />}
          {view === 'support' && <SupportView />}
        </main>

        <Footer />
      </div>

      <CustomSubscriptionDialog
        open={subDialogOpen}
        onOpenChange={setSubDialogOpen}
        balance={overview?.balance ?? 0}
      />
    </div>
  )
}

function QuickTips() {
  const tips = [
    { title: 'How funding works', body: 'Send the exact amount to the selected account, then submit the transaction reference. Credit is added after manual verification.' },
    { title: 'Processing time', body: 'JazzCash & Easypaisa: 10–30 min. Bank transfer: up to 2 hours. USDT: within 10 min of 1 confirmation.' },
    { title: 'Need help?', body: 'Contact support on WhatsApp +92 300 1234567 or email support@magxworld.tv with your transaction reference for faster resolution.' },
  ]
  return (
    <aside className="space-y-3">
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold mb-1">Quick Tips</h3>
        <p className="text-xs text-muted-foreground mb-4">Everything you need to fund your account smoothly.</p>
        <ul className="space-y-4">
          {tips.map((t) => (
            <li key={t.title} className="space-y-1">
              <p className="text-xs font-semibold text-foreground">{t.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{t.body}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
        <p className="text-xs font-semibold text-primary mb-1">Bulk / Reseller rates</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Deposits above PKR 50,000 qualify for a 2% bonus credit on top. Contact your account manager to enable volume pricing.
        </p>
      </div>
    </aside>
  )
}

function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-card/50 px-4 sm:px-6 py-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} MaGx World Super IPTV. Enterprise Panel v2.4.1 · MongoDB Atlas</p>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
          <a href="#" className="hover:text-foreground transition-colors">Support</a>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            All systems operational
          </span>
        </div>
      </div>
    </footer>
  )
}
