import { NextResponse } from 'next/server'
import { SUBSCRIPTION_PLANS } from '@/lib/subscriptions'

export const dynamic = 'force-dynamic'

// GET /api/funds/plans — pricing tiers for IPTV lines
export async function GET() {
  return NextResponse.json({ plans: SUBSCRIPTION_PLANS })
}
