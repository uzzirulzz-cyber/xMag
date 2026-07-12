import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentReseller } from '@/lib/funds'

export const dynamic = 'force-dynamic'

// GET /api/funds/transactions?type=credit|debit&status=&category=&page=&limit=&q=
export async function GET(request: Request) {
  const reseller = await getCurrentReseller()
  const { searchParams } = new URL(request.url)

  const type = searchParams.get('type') || undefined // credit | debit
  const status = searchParams.get('status') || undefined
  const category = searchParams.get('category') || undefined
  const q = searchParams.get('q') || undefined
  const page = Math.max(1, Number(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '10')))
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const where: Record<string, unknown> = { resellerId: reseller.id }
  if (type) where.type = type
  if (status) where.status = status
  if (category) where.category = category
  if (q) {
    where.OR = [
      { description: { contains: q } },
      { reference: { contains: q } },
    ]
  }
  if (from || to) {
    where.createdAt = {}
    if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from)
    if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to)
  }

  const [items, total] = await Promise.all([
    db.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.transaction.count({ where }),
  ])

  return NextResponse.json({
    items,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  })
}
