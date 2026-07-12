import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/funds/channels/stats — aggregate viewership metrics for the stats bar
export async function GET() {
  const [totalChannels, totalViewers, activeChannels, packages, advertisedTotal, topChannels, byCategory, byCountry, byType] = await Promise.all([
    db.channel.count({ where: { active: true } }),
    db.channel.aggregate({ where: { active: true }, _sum: { currentViewers: true } }),
    db.channel.count({ where: { active: true, currentViewers: { gt: 0 } } }),
    db.package.count({ where: { active: true } }),
    db.package.aggregate({ where: { active: true }, _sum: { advertisedCount: true } }),
    db.channel.findMany({
      where: { active: true },
      orderBy: { currentViewers: 'desc' },
      take: 5,
      include: { package: { select: { name: true } } },
    }),
    db.channel.groupBy({
      by: ['category'],
      where: { active: true },
      _sum: { currentViewers: true },
      _count: true,
      orderBy: { _sum: { currentViewers: 'desc' } },
    }),
    db.channel.groupBy({
      by: ['country'],
      where: { active: true },
      _sum: { currentViewers: true },
      _count: true,
      orderBy: { _sum: { currentViewers: 'desc' } },
    }),
    db.channel.groupBy({
      by: ['type'],
      where: { active: true },
      _sum: { currentViewers: true },
      _count: true,
    }),
  ])

  return NextResponse.json({
    totalChannels: totalChannels,
    advertisedTotal: advertisedTotal._sum.advertisedCount ?? 0,
    totalViewers: totalViewers._sum.currentViewers ?? 0,
    activeChannels,
    packages,
    topChannels: topChannels.map((c) => ({
      id: c.id,
      name: c.name,
      currentViewers: c.currentViewers,
      category: c.category,
      country: c.country,
      logoText: c.logoText,
      color: c.color,
      packageName: c.package.name,
    })),
    byCategory: byCategory.map((c) => ({
      category: c.category,
      viewers: c._sum.currentViewers ?? 0,
      channels: c._count,
    })),
    byCountry: byCountry.map((c) => ({
      country: c.country,
      viewers: c._sum.currentViewers ?? 0,
      channels: c._count,
    })),
    byType: byType.map((t) => ({
      type: t.type,
      viewers: t._sum.currentViewers ?? 0,
      channels: t._count,
    })),
  })
}
