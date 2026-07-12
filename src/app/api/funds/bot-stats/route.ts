import { NextResponse } from 'next/server'
import { getBotStats } from '@/lib/bot'

export const dynamic = 'force-dynamic'

// GET /api/funds/bot-stats — aggregate bot run stats for the admin panel
export async function GET() {
  try {
    const stats = await getBotStats()
    return NextResponse.json(stats)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
