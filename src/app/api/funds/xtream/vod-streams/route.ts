import { NextResponse } from 'next/server'
import { callXtreamApi, getXtreamServer } from '@/lib/xtream'
import type { XtreamVodStream } from '@/lib/xtream'

export const dynamic = 'force-dynamic'
export const revalidate = 300

// GET /api/funds/xtream/vod-streams?categoryId=1051&limit=60
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const serverId = searchParams.get('serverId') || undefined
    const categoryId = searchParams.get('categoryId')
    const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit') || '60')))

    const server = await getXtreamServer(serverId)
    const host = server.host.replace(/\/$/, '')
    const data = (await callXtreamApi('get_vod_streams', categoryId ? { category_id: categoryId } : undefined, serverId)) as XtreamVodStream[]

    const streams = (data || [])
      .slice(0, limit)
      .map((s) => ({
        id: s.stream_id,
        name: s.name,
        icon: s.stream_icon,
        categoryId: s.category_id,
        rating: s.rating_5based ?? 0,
        containerExtension: s.container_extension,
        isAdult: s.is_adult === '1',
        playUrl: `${host}/movie/${server.username}/${server.password}/${s.stream_id}.${s.container_extension}`,
      }))

    return NextResponse.json({ streams, total: data?.length ?? 0, shown: streams.length })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 })
  }
}
