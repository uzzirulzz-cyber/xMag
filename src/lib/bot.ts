import { db } from '@/lib/db'
import { getCurrentReseller } from '@/lib/funds'

export interface BotConfigData {
  id: string
  autoCredit: boolean
  jazzcashEnabled: boolean
  easypaisaEnabled: boolean
  bankEnabled: boolean
  usdtEnabled: boolean
  minAutoCredit: number
  maxAutoCredit: number
  pollIntervalSec: number
  lastRunAt: string | null
  totalAutoCredited: number
}

/**
 * Returns (and lazily creates) the reseller's bot config. Tokens are NOT
 * stored here — they live in env vars (JAZZCASH_TOKEN_1/2) and are only
 * referenced by the auto-verify endpoint.
 */
export async function getBotConfig(): Promise<BotConfigData> {
  const reseller = await getCurrentReseller()
  let cfg = await db.botConfig.findUnique({ where: { resellerId: reseller.id } })
  if (!cfg) {
    cfg = await db.botConfig.create({
      data: {
        resellerId: reseller.id,
        autoCredit: true,
        jazzcashEnabled: true,
        easypaisaEnabled: true,
        bankEnabled: false,
        usdtEnabled: true,
        minAutoCredit: 500,
        maxAutoCredit: 50000,
        pollIntervalSec: 60,
      },
    })
  }
  return {
    id: cfg.id,
    autoCredit: cfg.autoCredit,
    jazzcashEnabled: cfg.jazzcashEnabled,
    easypaisaEnabled: cfg.easypaisaEnabled,
    bankEnabled: cfg.bankEnabled,
    usdtEnabled: cfg.usdtEnabled,
    minAutoCredit: cfg.minAutoCredit,
    maxAutoCredit: cfg.maxAutoCredit,
    pollIntervalSec: cfg.pollIntervalSec,
    lastRunAt: cfg.lastRunAt?.toISOString() ?? null,
    totalAutoCredited: cfg.totalAutoCredited,
  }
}

/**
 * The "auto-repair" routine: scans pending fund requests, and for those that
 * fall within the auto-credit thresholds + match an enabled channel, verifies
 * them (simulated via token check) and credits the reseller balance atomically.
 * Returns a summary of what the bot processed.
 */
export async function runAutoCreditBot() {
  const reseller = await getCurrentReseller()
  const cfg = await getBotConfig()

  if (!cfg.autoCredit) {
    return { ran: false, reason: 'Auto-credit is disabled', credited: 0, count: 0 }
  }

  // Find pending fund requests for this reseller
  const pending = await db.fundRequest.findMany({
    where: { resellerId: reseller.id, status: 'pending' },
    include: { paymentMethod: true },
  })

  let credited = 0
  let count = 0
  const errors: string[] = []

  for (const req of pending) {
    const method = req.paymentMethod
    if (!method) {
      errors.push(`Fund request ${req.id}: payment method missing`)
      continue
    }

    // Determine if this channel is auto-credit eligible
    let eligible = false
    if (method.type === 'mobile_wallet' && method.name.toLowerCase().includes('jazz') && cfg.jazzcashEnabled) eligible = true
    if (method.type === 'mobile_wallet' && method.name.toLowerCase().includes('easy') && cfg.easypaisaEnabled) eligible = true
    if (method.type === 'crypto' && cfg.usdtEnabled) eligible = true
    if (method.type === 'bank_transfer' && cfg.bankEnabled) eligible = true

    if (!eligible) continue

    // Amount thresholds
    if (req.total < cfg.minAutoCredit || req.total > cfg.maxAutoCredit) continue

    // "Verify" via token presence (simulated — real impl would call JazzCash API)
    const tokenPresent = !!(process.env.JAZZCASH_TOKEN_1 && process.env.JAZZCASH_TOKEN_2)
    if (!tokenPresent) continue

    // Atomic: approve fund request + credit balance + write ledger
    try {
      await db.$transaction(async (tx) => {
        const fresh = await tx.reseller.findUnique({ where: { id: reseller.id } })
        if (!fresh) throw new Error('Reseller missing')

        const newBalance = fresh.balance + req.total

        const [updatedReq, ,] = await Promise.all([
          tx.fundRequest.update({
            where: { id: req.id },
            data: {
              status: 'approved',
              reviewedAt: new Date(),
              reviewerNote: 'Auto-credited by payment bot (token-verified)',
            },
          }),
          tx.reseller.update({
            where: { id: fresh.id },
            data: { balance: newBalance },
          }),
          tx.transaction.create({
            data: {
              resellerId: fresh.id,
              type: 'credit',
              category: 'fund',
              amount: req.total,
              balanceAfter: newBalance,
              description: `Funds added via ${method.name} (auto-credited by bot)`,
              reference: req.reference || `BOT-${req.id.slice(-6)}`,
              status: 'completed',
              fundRequestId: req.id,
            },
          }),
        ])
        credited += req.total
        count += 1
      })
    } catch (e) {
      errors.push(`Fund request ${req.id}: ${(e as Error).message}`)
    }
  }

  // Update bot run stats
  await db.botConfig.update({
    where: { resellerId: reseller.id },
    data: {
      lastRunAt: new Date(),
      totalAutoCredited: { increment: credited },
    },
  })

  return { ran: true, credited, count, errors, remaining: pending.length - count }
}
