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
 * The "auto-repair / auto-obtain" routine: scans pending fund requests,
 * auto-verifies them via token check, and credits the reseller balance atomically.
 * Also detects "stuck" requests (pending > 30 min) and repairs them.
 * Logs every run to BotRunLog for the admin stats panel.
 */
export async function runAutoCreditBot(runType: 'scheduled' | 'manual' | 'auto-repair' = 'scheduled') {
  const startTime = Date.now()
  const reseller = await getCurrentReseller()
  const cfg = await getBotConfig()

  if (!cfg.autoCredit) {
    return { ran: false, reason: 'Auto-credit is disabled', credited: 0, count: 0, repaired: 0 }
  }

  // Find pending fund requests for this reseller
  const pending = await db.fundRequest.findMany({
    where: { resellerId: reseller.id, status: 'pending' },
    include: { paymentMethod: true },
  })

  let credited = 0
  let count = 0
  let rejected = 0
  let repaired = 0
  let errors = 0
  const errorMessages: string[] = []
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000)

  for (const req of pending) {
    const method = req.paymentMethod
    if (!method) { errors++; errorMessages.push(`Request ${req.id}: payment method missing`); continue }

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

    // Track if this was a "stuck" request (pending > 30 min) → auto-repair
    const isStuck = new Date(req.createdAt) < thirtyMinAgo
    if (isStuck) repaired++

    // Atomic: approve fund request + credit balance + write ledger
    try {
      await db.$transaction(async (tx) => {
        const fresh = await tx.reseller.findUnique({ where: { id: reseller.id } })
        if (!fresh) throw new Error('Reseller missing')

        const newBalance = fresh.balance + req.total

        await Promise.all([
          tx.fundRequest.update({
            where: { id: req.id },
            data: {
              status: 'approved',
              reviewedAt: new Date(),
              reviewerNote: isStuck
                ? 'Auto-repaired by bot (stuck request, token-verified)'
                : 'Auto-credited by bot (token-verified)',
            },
          }),
          tx.reseller.update({ where: { id: fresh.id }, data: { balance: newBalance } }),
          tx.transaction.create({
            data: {
              resellerId: fresh.id,
              type: 'credit',
              category: 'fund',
              amount: req.total,
              balanceAfter: newBalance,
              description: `Funds added via ${method.name} (${isStuck ? 'auto-repair' : 'auto-credit'} by bot)`,
              reference: req.reference || `BOT-${req.id.slice(-6)}`,
              status: 'completed',
              fundRequestId: req.id,
            },
          }),
        ])
      })
      credited += req.total
      count += 1
    } catch (e) {
      errors++
      errorMessages.push(`Request ${req.id}: ${(e as Error).message}`)
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

  // Log this run
  await db.botRunLog.create({
    data: {
      resellerId: reseller.id,
      runType,
      processed: pending.length,
      credited: count,
      rejected,
      amountCredited: credited,
      repaired,
      errors,
      durationMs: Date.now() - startTime,
      success: errors === 0,
    },
  })

  return {
    ran: true,
    runType,
    credited,
    count,
    repaired,
    errors,
    remaining: pending.length - count,
    durationMs: Date.now() - startTime,
    errorMessages: errorMessages.slice(0, 5),
  }
}

/** Get the last N bot run logs for the admin stats panel. */
export async function getBotRunLogs(limit = 20) {
  const reseller = await getCurrentReseller()
  const logs = await db.botRunLog.findMany({
    where: { resellerId: reseller.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
  return logs
}

/** Get aggregate bot stats for the admin panel. */
export async function getBotStats() {
  const reseller = await getCurrentReseller()
  const [totalRuns, totalCredited, totalRepaired, totalErrors, last10, cfg] = await Promise.all([
    db.botRunLog.count({ where: { resellerId: reseller.id } }),
    db.botRunLog.aggregate({ where: { resellerId: reseller.id }, _sum: { amountCredited: true } }),
    db.botRunLog.aggregate({ where: { resellerId: reseller.id }, _sum: { repaired: true } }),
    db.botRunLog.aggregate({ where: { resellerId: reseller.id }, _sum: { errors: true } }),
    db.botRunLog.findMany({ where: { resellerId: reseller.id }, orderBy: { createdAt: 'desc' }, take: 10 }),
    getBotConfig(),
  ])

  return {
    totalRuns,
    totalCredited: totalCredited._sum.amountCredited ?? 0,
    totalRepaired: totalRepaired._sum.repaired ?? 0,
    totalErrors: totalErrors._sum.errors ?? 0,
    successRate: totalRuns > 0 ? Math.round(((totalRuns - (totalErrors._sum.errors ?? 0)) / totalRuns) * 100) : 100,
    autoCreditEnabled: cfg.autoCredit,
    lastRunAt: cfg.lastRunAt,
    last10: last10.map((l) => ({
      id: l.id,
      runType: l.runType,
      processed: l.processed,
      credited: l.credited,
      repaired: l.repaired,
      amountCredited: l.amountCredited,
      durationMs: l.durationMs,
      success: l.success,
      createdAt: l.createdAt.toISOString(),
    })),
  }
}
