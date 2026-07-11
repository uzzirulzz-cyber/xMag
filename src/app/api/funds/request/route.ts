import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentReseller } from '@/lib/funds'

export const dynamic = 'force-dynamic'

// POST /api/funds/request — reseller submits a new fund request
export async function POST(request: Request) {
  const reseller = await getCurrentReseller()
  const body = await request.json().catch(() => ({}))

  const paymentMethodId = String(body.paymentMethodId || '')
  const amountRaw = Number(body.amount)
  const reference = body.reference ? String(body.reference).trim() : null
  const senderNumber = body.senderNumber ? String(body.senderNumber).trim() : null
  const note = body.note ? String(body.note).trim() : null
  const screenshotUrl = body.screenshotUrl ? String(body.screenshotUrl).trim() : null

  if (!paymentMethodId) {
    return NextResponse.json({ error: 'Please select a payment method.' }, { status: 400 })
  }
  if (!Number.isFinite(amountRaw) || amountRaw <= 0) {
    return NextResponse.json({ error: 'Please enter a valid amount.' }, { status: 400 })
  }

  const method = await db.paymentMethod.findUnique({ where: { id: paymentMethodId } })
  if (!method || !method.active) {
    return NextResponse.json({ error: 'Selected payment method is unavailable.' }, { status: 400 })
  }
  if (amountRaw < method.minAmount) {
    return NextResponse.json({ error: `Minimum amount for ${method.name} is ${method.minAmount} PKR.` }, { status: 400 })
  }
  if (amountRaw > method.maxAmount) {
    return NextResponse.json({ error: `Maximum amount for ${method.name} is ${method.maxAmount} PKR.` }, { status: 400 })
  }
  if (!reference) {
    return NextResponse.json({ error: 'Please enter the payment transaction reference (TID).' }, { status: 400 })
  }

  const fee = Math.round(amountRaw * (method.feePercent / 100))
  const total = amountRaw + fee

  const fundRequest = await db.fundRequest.create({
    data: {
      resellerId: reseller.id,
      paymentMethodId: method.id,
      amount: amountRaw,
      fee,
      total,
      reference,
      senderNumber,
      note,
      screenshotUrl,
      status: 'pending',
    },
    include: { paymentMethod: true },
  })

  return NextResponse.json({ fundRequest }, { status: 201 })
}
