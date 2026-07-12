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
      if (cur.name && cur.url) {
        channels.push(cur as ParsedChannel)
      }
      cur = {}
    }
  }
  return channels
}

// POST /api/funds/import-m3u
// body: { name: string, source: 'url' | 'text', url?: string, text?: string }
export async function POST(request: Request) {
  const reseller = await getCurrentReseller()
  const body = await request.json().catch(() => ({}))
  const pkgName = String(body.name || 'Imported Playlist').trim()
  const source = String(body.source || 'url')

  let m3uText = ''

  if (source === 'url') {
    const url = String(body.url || '').trim()
    if (!url) {
      return NextResponse.json({ error: 'Playlist URL is required.' }, { status: 400 })
    }
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(20_000),
        headers: { 'User-Agent': 'Mozilla/5.0 (VLC/3.0)' },
      })
      if (!res.ok) {
        return NextResponse.json({ error: `Failed to fetch playlist: HTTP ${res.status}` }, { status: 502 })
      }
      m3uText = await res.text()
    } catch (e) {
      return NextResponse.json({ error: `Fetch failed: ${(e as Error).message}` }, { status: 502 })
    }
  } else if (source === 'text') {
    m3uText = String(body.text || '')
    if (!m3uText.trim()) {
      return NextResponse.json({ error: 'Playlist content is empty.' }, { status: 400 })
    }
  } else {
    return NextResponse.json({ error: 'Source must be "url" or "text".' }, { status: 400 })
  }

  // Parse
  const parsed = parseM3U(m3uText)
  if (parsed.length === 0) {
    return NextResponse.json({ error: 'No channels found in the playlist. Make sure it is a valid M3U file.' }, { status: 400 })
  }

  // Limit to 500 channels per import
  const channels = parsed.slice(0, 500)

  // Create the package
  const pkg = await db.package.create({
    data: {
      name: pkgName,
      type: 'live',
      description: `Imported by admin — ${channels.length} channels from ${source === 'url' ? body.url : 'pasted text'}`,
      color: '#6366f1',
      icon: 'Upload',
      channelCount: channels.length,
      advertisedCount: channels.length,
      sortOrder: 50,
    },
  })

  // Insert channels
  for (let i = 0; i < channels.length; i++) {
    const c = channels[i]
    await db.channel.create({
      data: {
        packageId: pkg.id,
        name: c.name,
        type: 'live',
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
      },
    })
  }

  return NextResponse.json({
    ok: true,
    packageId: pkg.id,
    packageName: pkgName,
    imported: channels.length,
    totalFound: parsed.length,
  })
}
