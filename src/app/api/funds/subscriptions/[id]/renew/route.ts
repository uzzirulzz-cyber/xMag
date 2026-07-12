import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentReseller } from '@/lib/funds'
import { getPlan } from '@/lib/subscriptions'

export const dynamic = 'force-dynamic'

// POST /api/funds/subscriptions/[id]/renew — extend a line, debiting balance
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const reseller = await getCurrentReseller()
  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const planMonths = Number(body.planMonths)
  const plan = getPlan(planMonths)
  if (!plan) {
    return NextResponse.json({ error: 'Please select a valid plan.' }, { status: 400 })
  }

  const existing = await db.subscription.findUnique({ where: { id } })
  if (!existing || existing.resellerId !== reseller.id) {
    return NextResponse.json({ error: 'Line not found.' }, { status: 404 })
  }

  // Balance check
  if (reseller.balance < plan.price) {
    return NextResponse.json(
      { error: `Insufficient balance. Renewal costs ${plan.price} PKR but you have ${reseller.balance} PKR.` },
      { status: 400 },
    )
  }

  // Atomic: debit balance + extend expiry + re-enable + write ledger debit
  const result = await db.$transaction(async (tx) => {
    const fresh = await tx.reseller.findUnique({ where: { id: reseller.id } })
    if (!fresh || fresh.balance < plan.price) {
      throw new Error('Insufficient balance.')
    }

    const newBalance = fresh.balance - plan.price

    // Extend from now, or from current expiry if still active
    const base = existing.expiresAt > new Date() && existing.status !== 'disabled'
      ? existing.expiresAt
      : new Date()
    const newExpiry = new Date(base.getTime() + plan.months * 30 * 24 * 60 * 60 * 1000)

    const [updatedSub] = await Promise.all([
      tx.subscription.update({
        where: { id },
        data: {
          planMonths: plan.months,
          creditsCost: existing.creditsCost + plan.price,
          status: 'active',
          disabledAt: null,
          expiresAt: newExpiry,
        },
      }),
      tx.reseller.update({
        where: { id: fresh.id },
        data: { balance: newBalance },
      }),
    ])

    const txn = await tx.transaction.create({
      data: {
        resellerId: fresh.id,
        type: 'debit',
        category: 'subscription',
        amount: plan.price,
        balanceAfter: newBalance,
        description: `${plan.label} Renewal — Line ${existing.username}`,
        reference: `REN-${Math.floor(100000 + Math.random() * 900000)}`,
        status: 'completed',
        subscriptionId: id,
      },
    })

    return { subscription: updatedSub, transaction: txn, newBalance }
  })

  return NextResponse.json(result)
}
