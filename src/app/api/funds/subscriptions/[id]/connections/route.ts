import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentReseller } from '@/lib/funds'

export const dynamic = 'force-dynamic'

// GET /api/funds/subscriptions/[id]/connections — full connection log
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const reseller = await getCurrentReseller()
  const { id } = await params

  const sub = await db.subscription.findUnique({ where: { id } })
  if (!sub || sub.resellerId !== reseller.id) {
    return NextResponse.json({ error: 'Line not found.' }, { status: 404 })
  }

  const connections = await db.connection.findMany({
    where: { subscriptionId: id },
    orderBy: { connectedAt: 'desc' },
    take: 100,
  })

  return NextResponse.json({ connections, total: connections.length })
}
