import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { fetchPlaylist, type PlaylistKey } from '@/lib/iptv-org'

export const dynamic = 'force-dynamic'

// POST /api/funds/iptv-org/import?playlist=all&limit=200
// Fetches a curated sample from iptv-org and stores it as a "Free Public
// Channels" package in MongoDB so it appears in the Channels browser.
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const playlist = (searchParams.get('playlist') || 'all') as PlaylistKey
    const limit = Math.min(500, Math.max(20, Number(searchParams.get('limit') || '200')))

    const channels = await fetchPlaylist(playlist)

    // Curate: take a spread across groups (first N per group) for variety
    const byGroup = new Map<string, typeof channels>()
    for (const c of channels) {
      const arr = byGroup.get(c.group) ?? []
      if (arr.length < Math.ceil(limit / 8)) arr.push(c)
      byGroup.set(c.group, arr)
    }
    const sample = Array.from(byGroup.values()).flat().slice(0, limit)

    // Upsert the Free Public Channels package
    let pkg = await db.package.findFirst({ where: { name: 'Free Public Channels' } })
    if (!pkg) {
      pkg = await db.package.create({
        data: {
          name: 'Free Public Channels',
          type: 'live',
          description: '13,400+ free-to-air public IPTV channels from iptv-org — legal, publicly available streams worldwide.',
          color: '#0891b2',
          icon: 'Globe',
          advertisedCount: 13402,
          sortOrder: 99,
        },
      })
    }

    // Clear old channels for this package, then insert the sample
    await db.channel.deleteMany({ where: { packageId: pkg.id } })
    await db.channel.createMany({
      data: sample.map((c, i) => ({
        packageId: pkg.id,
        name: c.name,
        type: 'live',
        category: c.group.split(';')[0] || 'General',
        country: 'Public',
        logoText: c.name.slice(0, 3).toUpperCase(),
        color: '#0891b2',
        epgNow: c.group,
        epgNext: null,
        streamUrl: c.url,
        currentViewers: Math.floor(Math.random() * 50),
        hd: true,
        sortOrder: i + 1,
      })),
    })

    // Update the package channel count
    await db.package.update({
      where: { id: pkg.id },
      data: { channelCount: sample.length },
    })

    return NextResponse.json({
      ok: true,
      packageId: pkg.id,
      imported: sample.length,
      totalAvailable: channels.length,
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 })
  }
}
