import { NextResponse } from 'next/server'
import { getAllXtreamServers } from '@/lib/xtream'

export const dynamic = 'force-dynamic'

// GET /api/funds/xtream/servers — list all active Xtream servers
export async function GET() {
  try {
    const servers = await getAllXtreamServers()
    return NextResponse.json({ servers })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
