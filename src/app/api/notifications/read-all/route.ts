import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentReseller } from '@/lib/funds'

export const dynamic = 'force-dynamic'

// POST /api/notifications/read-all — mark every notification as read
export async function POST() {
  const reseller = await getCurrentReseller()
  const result = await db.notification.updateMany({
    where: { resellerId: reseller.id, read: false },
    data: { read: true },
  })
  return NextResponse.json({ updated: result.count })
}
