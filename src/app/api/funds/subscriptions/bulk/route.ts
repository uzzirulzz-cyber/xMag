import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentReseller } from '@/lib/funds'

export const dynamic = 'force-dynamic'

// POST /api/funds/subscriptions/bulk — apply an action to many lines at once
// body: { ids: string[], action: 'disable' | 'enable' | 'delete' }
export async function POST(request: Request) {
  const reseller = await getCurrentReseller()
  const body = await request.json().catch(() => ({}))
  const ids: string[] = Array.isArray(body.ids) ? body.ids.filter(Boolean) : []
  const action = String(body.action || '')

  if (ids.length === 0) {
    return NextResponse.json({ error: 'No lines selected.' }, { status: 400 })
  }
  if (!['disable', 'enable', 'delete'].includes(action)) {
    return NextResponse.json({ error: 'Unknown bulk action.' }, { status: 400 })
  }

  // Verify ownership of all selected lines
  const owned = await db.subscription.findMany({
    where: { id: { in: ids }, resellerId: reseller.id },
    select: { id: true },
  })
  const ownedIds = owned.map((s) => s.id)
  if (ownedIds.length === 0) {
    return NextResponse.json({ error: 'No accessible lines selected.' }, { status: 404 })
  }

  if (action === 'disable') {
    const r = await db.subscription.updateMany({
      where: { id: { in: ownedIds } },
      data: { status: 'disabled', disabledAt: new Date(), currentConnections: 0 },
    })
    return NextResponse.json({ updated: r.count })
  }
  if (action === 'enable') {
    const r = await db.subscription.updateMany({
      where: { id: { in: ownedIds } },
      data: { status: 'active', disabledAt: null },
    })
    return NextResponse.json({ updated: r.count })
  }
  // delete
  await db.transaction.updateMany({
    where: { subscriptionId: { in: ownedIds } },
    data: { subscriptionId: null },
  })
  const r = await db.subscription.deleteMany({ where: { id: { in: ownedIds } } })
  return NextResponse.json({ deleted: r.count })
}
