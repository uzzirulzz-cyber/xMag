import { NextResponse } from 'next/server'
import { runAutoCreditBot } from '@/lib/bot'

export const dynamic = 'force-dynamic'

// POST /api/funds/bot-run — trigger the auto-credit bot manually
export async function POST() {
  try {
    const result = await runAutoCreditBot()
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message, ran: false }, { status: 500 })
  }
}
