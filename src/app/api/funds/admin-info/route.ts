import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/funds/admin-info — admin recipient details (all funds route here)
export async function GET() {
  return NextResponse.json({
    accountTitle: process.env.ADMIN_ACCOUNT_TITLE || 'MUHAMMAD UZAIR',
    bankName: process.env.ADMIN_BANK_NAME || 'Bank Alfalah',
    accountNumber: process.env.ADMIN_ACCOUNT_NUMBER || '03361010537701',
    iban: process.env.ADMIN_IBAN || 'PK52ALFH0336001010537701',
    swift: process.env.ADMIN_SWIFT || 'ALFHPKKAXXX',
    branch: process.env.ADMIN_BRANCH || 'E-11 MARKAZ BRANCH ISLAMABAD',
    branchCode: process.env.ADMIN_BRANCH_CODE || '0336',
    easypaisa: process.env.ADMIN_EASYPAISA || '03390005715',
    routing: 'All subscription payments and fund deposits route directly to this admin account worldwide.',
  })
}
