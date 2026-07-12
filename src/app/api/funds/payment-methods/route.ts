import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/funds/payment-methods — list active funding channels
export async function GET() {
  const methods = await db.paymentMethod.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
  })
  return NextResponse.json({ methods })
}
