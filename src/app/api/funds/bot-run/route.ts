import { NextResponse } from 'next/server'
import { runAutoCreditBot } from '@/lib/bot'

export const dynamic = 'force-dynamic'

// POST /api/funds/bot-run — trigger the auto-credit bot manually
// body: { runType?: 'scheduled' | 'manual' | 'auto-repair' }
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const runType = (body.runType as 'scheduled' | 'manual' | 'auto-repair') || 'manual'
    const result = await runAutoCreditBot(runType)
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message, ran: false }, { status: 500 })
  }
}
