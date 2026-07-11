import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/funds/packages — bouquet list with channel counts + live viewer totals
export async function GET() {
  const packages = await db.package.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: { select: { channels: true } },
    },
  })

  // Aggregate viewers per package
  const withStats = await Promise.all(
    packages.map(async (p) => {
      const agg = await db.channel.aggregate({
        where: { packageId: p.id, active: true },
        _sum: { currentViewers: true },
      })
      return {
        id: p.id,
        name: p.name,
        type: p.type,
        description: p.description,
        color: p.color,
        icon: p.icon,
        channelCount: p._count.channels,
        advertisedCount: p.advertisedCount,
        isAdult: p.isAdult,
        pinProtected: p.pinProtected,
        totalViewers: agg._sum.currentViewers ?? 0,
        sortOrder: p.sortOrder,
      }
    }),
  )

  return NextResponse.json({ packages: withStats })
}
