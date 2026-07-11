import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentReseller } from '@/lib/funds'

export const dynamic = 'force-dynamic'

// GET /api/funds/subscriptions/[id] — single line detail with recent connections
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const reseller = await getCurrentReseller()
  const { id } = await params

  const sub = await db.subscription.findUnique({
    where: { id },
    include: {
      connections: {
        orderBy: { connectedAt: 'desc' },
        take: 50,
      },
    },
  })

  if (!sub || sub.resellerId !== reseller.id) {
    return NextResponse.json({ error: 'Line not found.' }, { status: 404 })
  }

  return NextResponse.json({ subscription: sub })
}

// PATCH /api/funds/subscriptions/[id] — reset password | disable | enable | set maxConnections
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const reseller = await getCurrentReseller()
  const { id } = await params
  const body = await request.json().catch(() => ({}))

  const existing = await db.subscription.findUnique({ where: { id } })
  if (!existing || existing.resellerId !== reseller.id) {
    return NextResponse.json({ error: 'Line not found.' }, { status: 404 })
  }

  const data: Record<string, unknown> = {}

  if (body.action === 'reset-password') {
    data.password = Math.random().toString(36).slice(2, 12)
  } else if (body.action === 'disable') {
    data.status = 'disabled'
    data.disabledAt = new Date()
    data.currentConnections = 0
  } else if (body.action === 'enable') {
    data.status = 'active'
    data.disabledAt = null
    // If already expired, extending handled by /renew; here just un-disable
    if (existing.expiresAt < new Date()) {
      data.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30d grace
    }
  } else if (body.action === 'set-connections' && typeof body.maxConnections === 'number') {
    const mc = Math.min(5, Math.max(1, Math.floor(body.maxConnections)))
    data.maxConnections = mc
  } else {
    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
  }

  const updated = await db.subscription.update({ where: { id }, data })
  return NextResponse.json({ subscription: updated })
}

// DELETE /api/funds/subscriptions/[id] — permanently remove a line (no refund)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const reseller = await getCurrentReseller()
  const { id } = await params

  const existing = await db.subscription.findUnique({ where: { id } })
  if (!existing || existing.resellerId !== reseller.id) {
    return NextResponse.json({ error: 'Line not found.' }, { status: 404 })
  }

  // Null out the transaction's FK so we can keep the ledger, then delete the line
  await db.transaction.updateMany({
    where: { subscriptionId: id },
    data: { subscriptionId: null },
  })
  await db.subscription.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
