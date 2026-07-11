import { db } from '@/lib/db'
import { getCurrentReseller } from '@/lib/funds'

export interface NotificationSeed {
  type: 'info' | 'success' | 'warning' | 'fund' | 'subscription' | 'system'
  title: string
  message: string
  link?: string
  read: boolean
  minutesAgo: number
}

/**
 * Seed a realistic notification feed for the demo reseller — mirrors the kinds
 * of alerts the legacy global.js notification dropdown would render
 * (fund approvals, subscription events, low-balance warnings, system notices).
 */
export async function ensureNotifications() {
  const reseller = await getCurrentReseller()
  const count = await db.notification.count({ where: { resellerId: reseller.id } })
  if (count > 0) return

  const now = new Date()
  const minsAgo = (m: number) => new Date(now.getTime() - m * 60 * 1000)

  const seeds: NotificationSeed[] = [
    {
      type: 'fund',
      title: 'Funds credited',
      message: 'Your JazzCash request (Rs5,000) was approved. New balance: Rs49,100.',
      link: '#transactions',
      read: true,
      minutesAgo: 60 * 24,
    },
    {
      type: 'subscription',
      title: 'New line activated',
      message: 'Line axc_9b4x2q (6 Months) is now active. Expires in 178 days.',
      link: '#my-subscriptions',
      read: false,
      minutesAgo: 60 * 48,
    },
    {
      type: 'warning',
      title: 'Low balance alert',
      message: 'Your balance dropped below Rs5,000. Add funds to keep your lines active.',
      link: '#add-funds',
      read: false,
      minutesAgo: 60 * 50,
    },
    {
      type: 'system',
      title: 'Server maintenance',
      message: 'Scheduled maintenance on Server EU-2 tonight 02:00–02:30 PKT. Brief interruptions possible.',
      read: false,
      minutesAgo: 60 * 6,
    },
    {
      type: 'success',
      title: 'Bulk order completed',
      message: 'Order #ORD-7820 (6 × 12 Months) delivered. Lines ready for your clients.',
      link: '#transactions',
      read: true,
      minutesAgo: 60 * 96,
    },
    {
      type: 'fund',
      title: 'Fund request submitted',
      message: 'Your JazzCash request (Rs3,000, ref JC-9120088) is pending review.',
      link: '#add-funds',
      read: false,
      minutesAgo: 90,
    },
    {
      type: 'info',
      title: 'New series added',
      message: '342 new episodes added to EN - Netflix Series this week.',
      read: true,
      minutesAgo: 60 * 12,
    },
    {
      type: 'system',
      title: 'Welcome to Star IPTV Panel v2.4.1',
      message: 'Explore the new Custom Subscription builder to tailor content per device. Need help? Open a support ticket.',
      read: false,
      minutesAgo: 60 * 24 * 7,
    },
  ]

  await db.notification.createMany({
    data: seeds.map((s) => ({
      resellerId: reseller.id,
      type: s.type,
      title: s.title,
      message: s.message,
      link: s.link ?? null,
      read: s.read,
      createdAt: minsAgo(s.minutesAgo),
    })),
  })
}
