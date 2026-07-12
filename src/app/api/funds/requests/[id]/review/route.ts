import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentReseller } from '@/lib/funds'

export const dynamic = 'force-dynamic'

// POST /api/funds/requests/[id]/review — admin approves or rejects a fund request.
// body: { decision: 'approve' | 'reject', note?: string }
// Approving credits the reseller balance atomically.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const reseller = await getCurrentReseller()
  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const decision = body.decision === 'approve' ? 'approved' : body.decision === 'reject' ? 'rejected' : null

  if (!decision) {
    return NextResponse.json({ error: 'Decision must be "approve" or "reject".' }, { status: 400 })
  }

  const fundRequest = await db.fundRequest.findUnique({
    where: { id },
    include: { paymentMethod: true },
  })
  if (!fundRequest || fundRequest.resellerId !== reseller.id) {
    return NextResponse.json({ error: 'Fund request not found.' }, { status: 404 })
  }
  if (fundRequest.status !== 'pending') {
    return NextResponse.json({ error: `Request is already ${fundRequest.status}.` }, { status: 400 })
  }

  if (decision === 'rejected') {
    const updated = await db.fundRequest.update({
      where: { id },
      data: { status: 'rejected', reviewerNote: body.note || 'Rejected by admin', reviewedAt: new Date() },
    })
    return NextResponse.json({ fundRequest: updated })
  }

  // Approve: credit balance atomically
  const result = await db.$transaction(async (tx) => {
    const fresh = await tx.reseller.findUnique({ where: { id: reseller.id } })
    if (!fresh) throw new Error('Reseller missing')
    const newBalance = fresh.balance + fundRequest.total

    const [updatedReq, , txn] = await Promise.all([
      tx.fundRequest.update({
        where: { id },
        data: { status: 'approved', reviewerNote: body.note || 'Approved by admin', reviewedAt: new Date() },
      }),
      tx.reseller.update({ where: { id: fresh.id }, data: { balance: newBalance } }),
      tx.transaction.create({
        data: {
          resellerId: fresh.id,
          type: 'credit',
          category: 'fund',
          amount: fundRequest.total,
          balanceAfter: newBalance,
          description: `Funds added via ${fundRequest.paymentMethod?.name ?? 'payment'} (approved by admin)`,
          reference: fundRequest.reference || `ADM-${id.slice(-6)}`,
          status: 'completed',
          fundRequestId: id,
        },
      }),
    ])
    return { fundRequest: updatedReq, transaction: txn, newBalance }
  })

  return NextResponse.json(result)
}
