import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentReseller } from '@/lib/funds'

export const dynamic = 'force-dynamic'

// GET /api/notifications/unread-count — lightweight poll for the bell badge
export async function GET() {
  const reseller = await getCurrentReseller()
  const unreadCount = await db.notification.count({
    where: { resellerId: reseller.id, read: false },
  })
  return NextResponse.json({ unreadCount })
}
