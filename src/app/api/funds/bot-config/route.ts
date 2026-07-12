import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentReseller } from '@/lib/funds'
import { getBotConfig } from '@/lib/bot'

export const dynamic = 'force-dynamic'

// GET /api/funds/bot-config — current bot config + token status (masked)
export async function GET() {
  const cfg = await getBotConfig()
  const reseller = await getCurrentReseller()

  // Token presence (never return the actual token values)
  const token1Present = !!process.env.JAZZCASH_TOKEN_1
  const token2Present = !!process.env.JAZZCASH_TOKEN_2

  // Admin recipient info (from env)
  const admin = {
    accountTitle: process.env.ADMIN_ACCOUNT_TITLE || 'MUHAMMAD UZAIR',
    bankName: process.env.ADMIN_BANK_NAME || 'Bank Alfalah',
    accountNumber: process.env.ADMIN_ACCOUNT_NUMBER || '03361010537701',
    iban: process.env.ADMIN_IBAN || 'PK52ALFH0336001010537701',
    swift: process.env.ADMIN_SWIFT || 'ALFHPKKAXXX',
    branch: process.env.ADMIN_BRANCH || 'E-11 MARKAZ BRANCH ISLAMABAD',
    branchCode: process.env.ADMIN_BRANCH_CODE || '0336',
    easypaisa: process.env.ADMIN_EASYPAISA || '03390005715',
  }

  // Pending fund requests count
  const pendingCount = await db.fundRequest.count({
    where: { resellerId: reseller.id, status: 'pending' },
  })

  return NextResponse.json({
    config: cfg,
    tokens: {
      jazzcashToken1: token1Present ? 'configured ••••' + process.env.JAZZCASH_TOKEN_1!.slice(-4) : 'not set',
      jazzcashToken2: token2Present ? 'configured ••••' + process.env.JAZZCASH_TOKEN_2!.slice(-4) : 'not set',
      configured: token1Present && token2Present,
    },
    admin,
    pendingRequests: pendingCount,
  })
}

// PATCH /api/funds/bot-config — update toggles + thresholds
export async function PATCH(request: Request) {
  const reseller = await getCurrentReseller()
  const body = await request.json().catch(() => ({}))

  const data: Record<string, unknown> = {}
  const boolFields = ['autoCredit', 'jazzcashEnabled', 'easypaisaEnabled', 'bankEnabled', 'usdtEnabled']
  for (const f of boolFields) {
    if (typeof body[f] === 'boolean') data[f] = body[f]
  }
  if (typeof body.minAutoCredit === 'number') data.minAutoCredit = body.minAutoCredit
  if (typeof body.maxAutoCredit === 'number') data.maxAutoCredit = body.maxAutoCredit
  if (typeof body.pollIntervalSec === 'number') data.pollIntervalSec = Math.min(3600, Math.max(10, body.pollIntervalSec))

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 })
  }

  // Upsert in case it doesn't exist yet
  const updated = await db.botConfig.upsert({
    where: { resellerId: reseller.id },
    update: data,
    create: { resellerId: reseller.id, ...data },
  })

  return NextResponse.json({ config: updated })
}
