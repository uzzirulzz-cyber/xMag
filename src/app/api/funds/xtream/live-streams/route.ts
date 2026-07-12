import { NextResponse } from 'next/server'
import { callXtreamApi, getXtreamServer } from '@/lib/xtream'
import type { XtreamLiveStream } from '@/lib/xtream'

export const dynamic = 'force-dynamic'
export const revalidate = 300

// GET /api/funds/xtream/live-streams?categoryId=99&limit=60
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const serverId = searchParams.get('serverId') || undefined
    const categoryId = searchParams.get('categoryId')
    const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit') || '60')))

    const server = await getXtreamServer(serverId)
    const host = server.host.replace(/\/$/, '')
    const data = (await callXtreamApi('get_live_streams', categoryId ? { category_id: categoryId } : undefined, serverId)) as XtreamLiveStream[]

    const streams = (data || [])
      .slice(0, limit)
      .map((s) => ({
        id: s.stream_id,
        name: s.name,
        icon: s.stream_icon,
        categoryId: s.category_id,
        isAdult: s.is_adult === '1',
        epgChannelId: s.epg_channel_id,
        playUrlTs: `${host}/live/${server.username}/${server.password}/${s.stream_id}.ts`,
        playUrlM3u8: `${host}/live/${server.username}/${server.password}/${s.stream_id}.m3u8`,
      }))

    return NextResponse.json({ streams, total: data?.length ?? 0, shown: streams.length })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 })
  }
}
