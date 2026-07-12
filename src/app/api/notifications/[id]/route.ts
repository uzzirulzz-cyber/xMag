import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentReseller } from '@/lib/funds'

export const dynamic = 'force-dynamic'

// PATCH /api/notifications/[id] — mark a single notification as read
// (mirrors load_notification_url(id) click-to-open behaviour)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const reseller = await getCurrentReseller()
  const { id } = await params

  const existing = await db.notification.findUnique({ where: { id } })
  if (!existing || existing.resellerId !== reseller.id) {
    return NextResponse.json({ error: 'Notification not found.' }, { status: 404 })
  }

  const updated = await db.notification.update({
    where: { id },
    data: { read: true },
  })

  return NextResponse.json({ notification: updated })
}
