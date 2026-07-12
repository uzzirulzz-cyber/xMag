import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentReseller } from '@/lib/funds'
import { getPlan, generateLineCredentials } from '@/lib/subscriptions'

export const dynamic = 'force-dynamic'

// GET /api/funds/subscriptions — reseller's IPTV lines
export async function GET() {
  const reseller = await getCurrentReseller()
  const subscriptions = await db.subscription.findMany({
    where: { resellerId: reseller.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return NextResponse.json({ subscriptions })
}

// POST /api/funds/subscriptions — create a new IPTV line, debiting balance
export async function POST(request: Request) {
  const reseller = await getCurrentReseller()
  const body = await request.json().catch(() => ({}))

  const planMonths = Number(body.planMonths)
  const plan = getPlan(planMonths)
  if (!plan) {
    return NextResponse.json({ error: 'Please select a valid plan.' }, { status: 400 })
  }

  const excludedLive = Boolean(body.excludedLive)
  const excludedVod = Boolean(body.excludedVod)
  const excludedSeries = Boolean(body.excludedSeries)

  // Series category selection: array of ids, or empty = include all
  const rawSeriesIds: string[] = Array.isArray(body.seriesCategoryIds) ? body.seriesCategoryIds : []
  const seriesCategoryIds = rawSeriesIds.filter(Boolean)
  const seriesCategoryCount = seriesCategoryIds.length

  // Cannot exclude all three content types
  if (excludedLive && excludedVod && excludedSeries) {
    return NextResponse.json(
      { error: 'You cannot exclude all content types. Leave at least one included.' },
      { status: 400 },
    )
  }

  // If series is NOT excluded but specific categories are chosen, validate they exist
  if (!excludedSeries && seriesCategoryCount > 0) {
    const valid = await db.contentCategory.count({
      where: { id: { in: seriesCategoryIds }, type: 'series', active: true },
    })
    if (valid !== seriesCategoryCount) {
      return NextResponse.json({ error: 'One or more selected series categories are invalid.' }, { status: 400 })
    }
  }

  // Balance check
  if (reseller.balance < plan.price) {
    return NextResponse.json(
      { error: `Insufficient balance. This line costs ${plan.price} PKR but you have ${reseller.balance} PKR. Please add funds first.` },
      { status: 400 },
    )
  }

  // Atomic: deduct balance + create line + write ledger debit
  // Created lines use the real upstream Xtream server credentials so the
  // M3U/xAPI URLs actually authenticate and play.
  const xtream = await db.xtreamServer.findFirst({ where: { active: true } })
  const lineUsername = xtream?.username || creds.username
  const linePassword = xtream?.password || creds.password
  const lineDns = xtream ? xtream.host.replace(/\/$/, '') : 'http://magxworld.tv:8080'
  const expiresAt = new Date(Date.now() + plan.months * 30 * 24 * 60 * 60 * 1000)

  const result = await db.$transaction(async (tx) => {
    const fresh = await tx.reseller.findUnique({ where: { id: reseller.id } })
    if (!fresh || fresh.balance < plan.price) {
      throw new Error('Insufficient balance.')
    }

    const newBalance = fresh.balance - plan.price

    const [updatedReseller, subscription] = await Promise.all([
      tx.reseller.update({
        where: { id: fresh.id },
        data: { balance: newBalance },
      }),
      tx.subscription.create({
        data: {
          resellerId: fresh.id,
          username: lineUsername,
          password: linePassword,
          planMonths: plan.months,
          creditsCost: plan.price,
          excludedLive,
          excludedVod,
          excludedSeries,
          seriesCategoryIds: !excludedSeries ? seriesCategoryIds.join(',') : '',
          seriesCategoryCount: !excludedSeries ? seriesCategoryCount : 0,
          dns: lineDns,
          expiresAt,
          status: 'active',
        },
      }),
    ])

    // Compose a readable description of the line's content scope
    const scopeParts: string[] = []
    if (!excludedLive) scopeParts.push('Live')
    if (!excludedVod) scopeParts.push('VOD')
    if (!excludedSeries) {
      scopeParts.push(seriesCategoryCount > 0 ? `Series (${seriesCategoryCount} cats)` : 'Series')
    }
    const scope = scopeParts.join(' + ') || 'No content'

    const txn = await tx.transaction.create({
      data: {
        resellerId: fresh.id,
        type: 'debit',
        category: 'subscription',
        amount: plan.price,
        balanceAfter: newBalance,
        description: `${plan.label} Subscription — Line ${lineUsername} [${scope}]`,
        reference: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
        status: 'completed',
        subscriptionId: subscription.id,
      },
    })

    return { subscription, txn, newBalance }
  })

  return NextResponse.json(
    {
      subscription: result.subscription,
      transaction: result.transaction,
      newBalance: result.newBalance,
    },
    { status: 201 },
  )
}
