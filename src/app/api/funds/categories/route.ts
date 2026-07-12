import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/funds/categories?type=series|live|vod
// Returns the content-category catalogue used by the Custom Subscription builder.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || undefined

  const where: Record<string, unknown> = { active: true }
  if (type) where.type = type

  const categories = await db.contentCategory.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
  })

  return NextResponse.json({ categories })
}
