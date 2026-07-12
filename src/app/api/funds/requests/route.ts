import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentReseller } from '@/lib/funds'

export const dynamic = 'force-dynamic'

// GET /api/funds/requests?status=pending — reseller's fund requests
export async function GET(request: Request) {
  const reseller = await getCurrentReseller()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || undefined

  const where: Record<string, unknown> = { resellerId: reseller.id }
  if (status) where.status = status

  const requests = await db.fundRequest.findMany({
    where,
    include: { paymentMethod: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({ requests })
}
