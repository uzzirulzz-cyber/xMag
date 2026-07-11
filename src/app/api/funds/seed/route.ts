import { NextResponse } from 'next/server'
import { ensureSeed } from '@/lib/funds'

export const dynamic = 'force-dynamic'

// POST /api/funds/seed — guarantee demo data exists (idempotent)
export async function POST() {
  const reseller = await ensureSeed()
  return NextResponse.json({ ok: true, reseller: { id: reseller.id, username: reseller.username } })
}
