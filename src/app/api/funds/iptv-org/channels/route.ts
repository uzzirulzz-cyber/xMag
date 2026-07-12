import { NextResponse } from 'next/server'
import { fetchPlaylist, type PlaylistKey } from '@/lib/iptv-org'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // cache 5 min

// GET /api/funds/iptv-org/channels?playlist=all&group=Movies&q=&page=&limit=
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const playlist = (searchParams.get('playlist') || 'all') as PlaylistKey
    const group = searchParams.get('group') || undefined
    const q = searchParams.get('q') || undefined
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit') || '48')))

    let channels = await fetchPlaylist(playlist)

    if (group && group !== 'all') {
      channels = channels.filter((c) => c.group === group)
    }
    if (q) {
      const ql = q.toLowerCase()
      channels = channels.filter((c) => c.name.toLowerCase().includes(ql))
    }

    const total = channels.length
    const start = (page - 1) * limit
    const items = channels.slice(start, start + limit)

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 })
  }
}
