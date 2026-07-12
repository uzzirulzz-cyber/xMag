import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/funds/channels?packageId=&type=&category=&country=&q=&page=&limit=&sort=
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const packageId = searchParams.get('packageId') || undefined
  const type = searchParams.get('type') || undefined
  const category = searchParams.get('category') || undefined
  const country = searchParams.get('country') || undefined
  const q = searchParams.get('q') || undefined
  const sort = searchParams.get('sort') || 'viewers' // viewers | name | package
  const page = Math.max(1, Number(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '24')))

  const where: Record<string, unknown> = { active: true }
  if (packageId) where.packageId = packageId
  if (type) where.type = type
  if (category) where.category = category
  if (country) where.country = country
  if (q) where.name = { contains: q }

  const orderBy: Record<string, 'asc' | 'desc'> =
    sort === 'name' ? { name: 'asc' } : sort === 'package' ? { packageId: 'asc' } : { currentViewers: 'desc' }

  const [items, total] = await Promise.all([
    db.channel.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: { package: { select: { name: true, color: true } } },
    }),
    db.channel.count({ where }),
  ])

  return NextResponse.json({
    items,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  })
}
