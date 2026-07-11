import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentReseller } from '@/lib/funds'

export const dynamic = 'force-dynamic'

// GET /api/notifications?unread=true  — list notifications (all or unread only)
// Mirrors legacy load_notifications() / load_notifications_unread()
export async function GET(request: Request) {
  const reseller = await getCurrentReseller()
  const { searchParams } = new URL(request.url)
  const unreadOnly = searchParams.get('unread') === 'true'
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || '30')))

  const where: Record<string, unknown> = { resellerId: reseller.id }
  if (unreadOnly) where.read = false

  const [items, total, unreadCount] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    db.notification.count({ where: { resellerId: reseller.id } }),
    db.notification.count({ where: { resellerId: reseller.id, read: false } }),
  ])

  return NextResponse.json({ items, total, unreadCount })
}
