import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentReseller } from '@/lib/funds'

export const dynamic = 'force-dynamic'

interface ParsedChannel {
  name: string
  logo: string | null
  group: string
  url: string
}

function parseM3U(text: string): ParsedChannel[] {
  const lines = text.split('\n')
  const channels: ParsedChannel[] = []
  let cur: Partial<ParsedChannel> = {}
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (trimmed.startsWith('#EXTINF')) {
      const nameM = trimmed.match(/,(.+)$/)
      const logoM = trimmed.match(/tvg-logo="([^"]*)"/)
      const groupM = trimmed.match(/group-title="([^"]*)"/)
      cur.name = nameM ? nameM[1].trim() : 'Unknown'
      cur.logo = logoM ? logoM[1] : null
      cur.group = groupM ? groupM[1] : 'Imported'
    } else if (!trimmed.startsWith('#')) {
      cur.url = trimmed
      if (cur.name && cur.url) channels.push(cur as ParsedChannel)
      cur = {}
    }
  }
  return channels
}

// POST /api/funds/import-batch
// body: { playlists: [{ name: string, url: string }] }
// Imports multiple M3U playlists in sequence, returns per-playlist results
export async function POST(request: Request) {
  const reseller = await getCurrentReseller()
  const body = await request.json().catch(() => ({}))
  const playlists: Array<{ name: string; url: string }> = Array.isArray(body.playlists) ? body.playlists : []

  if (playlists.length === 0) {
    return NextResponse.json({ error: 'No playlists provided.' }, { status: 400 })
  }

  const results: Array<{ name: string; url: string; status: 'success' | 'failed'; imported: number; error?: string }> = []
  let totalImported = 0

  for (const pl of playlists) {
    try {
      const res = await fetch(pl.url, {
        signal: AbortSignal.timeout(20_000),
        headers: { 'User-Agent': 'Mozilla/5.0 (VLC/3.0)' },
      })
      if (!res.ok) {
        results.push({ name: pl.name, url: pl.url, status: 'failed', imported: 0, error: `HTTP ${res.status}` })
        continue
      }

      const text = await res.text()
      const parsed = parseM3U(text)
      if (parsed.length === 0) {
        results.push({ name: pl.name, url: pl.url, status: 'failed', imported: 0, error: 'No channels found' })
        continue
      }

      const channels = parsed.slice(0, 200)
      const pkg = await db.package.create({
        data: {
          name: pl.name,
          type: 'live',
          description: `Batch imported — ${channels.length} channels`,
          color: '#6366f1',
          icon: 'ListVideo',
          channelCount: channels.length,
          advertisedCount: channels.length,
          sortOrder: 50,
        },
      })

      // Bulk insert all channels at once (much faster than individual inserts)
      await db.channel.createMany({
        data: channels.map((c, i) => ({
          packageId: pkg.id,
          name: c.name,
          type: 'live' as const,
          category: c.group.split(';')[0] || 'Imported',
          country: 'Imported',
          logoText: c.name.slice(0, 3).toUpperCase(),
          color: '#6366f1',
          epgNow: c.group,
          epgNext: null,
          streamUrl: c.url,
          currentViewers: 0,
          hd: true,
          sortOrder: i + 1,
        })),
      })

      totalImported += channels.length
      results.push({ name: pl.name, url: pl.url, status: 'success', imported: channels.length })
    } catch (e) {
      results.push({ name: pl.name, url: pl.url, status: 'failed', imported: 0, error: (e as Error).message })
    }
  }

  return NextResponse.json({ results, totalImported, totalPlaylists: playlists.length })
}
