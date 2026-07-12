import { NextResponse } from 'next/server'
import { callXtreamApi } from '@/lib/xtream'
import type { XtreamCategory } from '@/lib/xtream'

export const dynamic = 'force-dynamic'
export const revalidate = 600

// GET /api/funds/xtream/vod-categories — real VOD (movie) categories from the Xtream server
export async function GET() {
  try {
    const data = (await callXtreamApi('get_vod_categories')) as XtreamCategory[]
    const categories = (data || []).map((c) => ({
      id: c.category_id,
      name: c.category_name,
      icon: c.icon,
      streamCount: c.stream_count ?? 0,
      isAdult: c.is_adult === '1',
    }))
    const totalStreams = categories.reduce((s, c) => s + c.streamCount, 0)
    return NextResponse.json({ categories, total: categories.length, totalStreams })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 })
  }
}
