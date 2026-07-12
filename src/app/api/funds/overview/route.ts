import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentReseller, USD_TO_PKR } from '@/lib/funds'

export const dynamic = 'force-dynamic'

// GET /api/funds/overview — reseller balance + summary stats
export async function GET() {
  const reseller = await getCurrentReseller()

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [totalAdded, totalSpent, monthAdded, monthSpent, pendingCount, pendingAmount] = await Promise.all([
    db.transaction.aggregate({ where: { resellerId: reseller.id, type: 'credit', status: 'completed' }, _sum: { amount: true } }),
    db.transaction.aggregate({ where: { resellerId: reseller.id, type: 'debit', status: 'completed' }, _sum: { amount: true } }),
    db.transaction.aggregate({ where: { resellerId: reseller.id, type: 'credit', status: 'completed', createdAt: { gte: monthStart } }, _sum: { amount: true } }),
    db.transaction.aggregate({ where: { resellerId: reseller.id, type: 'debit', status: 'completed', createdAt: { gte: monthStart } }, _sum: { amount: true } }),
    db.fundRequest.count({ where: { resellerId: reseller.id, status: 'pending' } }),
    db.fundRequest.aggregate({ where: { resellerId: reseller.id, status: 'pending' }, _sum: { total: true } }),
  ])

  return NextResponse.json({
    reseller: {
      id: reseller.id,
      username: reseller.username,
      fullName: reseller.fullName,
      email: reseller.email,
      phone: reseller.phone,
      currency: reseller.currency,
      status: reseller.status,
      role: reseller.role,
    },
    balance: reseller.balance,
    currency: reseller.currency,
    totalAdded: totalAdded._sum.amount ?? 0,
    totalSpent: totalSpent._sum.amount ?? 0,
    monthAdded: monthAdded._sum.amount ?? 0,
    monthSpent: monthSpent._sum.amount ?? 0,
    pendingCount,
    pendingAmount: pendingAmount._sum.total ?? 0,
    exchangeRate: { usdToPkr: USD_TO_PKR, pkrToUsdCredit: 1 / USD_TO_PKR },
  })
}
