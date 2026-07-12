import { NextResponse } from 'next/server'
import { fetchGroups, type PlaylistKey } from '@/lib/iptv-org'

export const dynamic = 'force-dynamic'
export const revalidate = 300

// GET /api/funds/iptv-org/groups?playlist=all — distinct groups for the sidebar
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const playlist = (searchParams.get('playlist') || 'all') as PlaylistKey
    const groups = await fetchGroups(playlist)
    return NextResponse.json({ groups, total: groups.length })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 })
  }
}
