import { db } from '@/lib/db'

// Re-export pure helpers (formatCurrency, formatNumber, USD_TO_PKR) so server
// code can import everything from one place. Client components should import
// directly from @/lib/format to avoid pulling in the database client.
export { formatCurrency, formatNumber, USD_TO_PKR } from '@/lib/format'

/**
 * Returns the "current" reseller for this demo panel.
 * In a real deployment this would resolve the authenticated session.
 * For the demo we guarantee a single seeded reseller exists.
 */
export async function getCurrentReseller() {
  let reseller = await db.reseller.findFirst({
    orderBy: { createdAt: 'asc' },
  })
  if (!reseller) {
    reseller = await ensureSeed()
  }
  return reseller
}

/**
 * Idempotent seed: demo reseller, payment methods and a representative
 * transaction history so the funds page renders fully on first load.
 */
export async function ensureSeed() {
  const existingPm = await db.paymentMethod.count()
  if (existingPm === 0) {
    await seedPaymentMethods()
  }

  let reseller = await db.reseller.findFirst({
    where: { username: 'starreseller' },
  })
  if (!reseller) {
    reseller = await db.reseller.create({
      data: {
        username: 'starreseller',
        email: 'reseller@stariptv.pk',
        fullName: 'Star Reseller',
        passwordHash: 'demo-hash',
        phone: '+92 300 1234567',
        balance: 42500,
        currency: 'PKR',
        status: 'active',
        role: 'reseller',
      },
    })
  }

  const txnCount = await db.transaction.count({ where: { resellerId: reseller.id } })
  if (txnCount === 0) {
    await seedTransactions(reseller.id)
  }

  return reseller
}

async function seedPaymentMethods() {
  const methods = [
    {
      name: 'JazzCash',
      type: 'mobile_wallet',
      accountTitle: 'Star IPTV Store',
      accountNumber: '03001234567',
      network: 'Jazz',
      instructions:
        'Open JazzCash app → Send Money → Enter our number → Enter exact amount → Use TID as reference. Submit the fund request with the TID.',
      minAmount: 500,
      maxAmount: 100000,
      feePercent: 0,
      logoText: 'JC',
      color: '#ED1C24',
      sortOrder: 1,
    },
    {
      name: 'Easypaisa',
      type: 'mobile_wallet',
      accountTitle: 'Star IPTV Store',
      accountNumber: '03451234567',
      network: 'Telenor',
      instructions:
        'Open Easypaisa app → Send Money → Enter our number → Enter exact amount → Use TID as reference. Submit the fund request with the TID.',
      minAmount: 500,
      maxAmount: 100000,
      feePercent: 0,
      logoText: 'EP',
      color: '#0CB04A',
      sortOrder: 2,
    },
    {
      name: 'Bank Al Habib',
      type: 'bank_transfer',
      accountTitle: 'Star IPTV Store (Pvt) Ltd',
      accountNumber: '0500-1234567-001',
      bankName: 'Bank Al Habib',
      network: 'BAHL',
      instructions:
        'Transfer the exact amount via IBFT/RAAST from any bank app. Use the transaction reference number (FT/IBFT) when submitting the fund request.',
      minAmount: 1000,
      maxAmount: 500000,
      feePercent: 0,
      logoText: 'BAH',
      color: '#1B75BC',
      sortOrder: 3,
    },
    {
      name: 'USDT (TRC20)',
      type: 'crypto',
      accountTitle: 'Star IPTV Store',
      accountNumber: 'TJbZ9rQ7...xK4mN8pQ (TRC20)',
      network: 'TRC20',
      instructions:
        'Send USDT on the TRC20 network only to the wallet address above. Use rate 1 USD = PKR 280. Submit the fund request with the TXID and amount in USD.',
      minAmount: 1000,
      maxAmount: 1000000,
      feePercent: 0,
      logoText: '₮',
      color: '#26A17B',
      sortOrder: 4,
    },
    {
      name: 'Credit / Debit Card',
      type: 'card',
      accountTitle: 'Star IPTV Store',
      accountNumber: 'Secure hosted checkout',
      network: 'Visa / Mastercard',
      instructions:
        'Click "Pay Now" to be redirected to our secure card gateway. Card payments are auto-credited within 5 minutes of confirmation.',
      minAmount: 500,
      maxAmount: 100000,
      feePercent: 3,
      logoText: 'CC',
      color: '#6D28D9',
      sortOrder: 5,
    },
  ]
  for (const m of methods) {
    await db.paymentMethod.create({ data: m })
  }
}

async function seedTransactions(resellerId: string) {
  // Build a realistic ledger. Each credit (fund) and debit (subscription).
  const now = new Date()
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000)

  type Entry = {
    type: 'credit' | 'debit'
    category: string
    amount: number
    balanceAfter: number
    description: string
    reference?: string
    status: string
    createdAt: Date
  }

  const entries: Entry[] = [
    { type: 'credit', category: 'fund', amount: 5000, balanceAfter: 5000, description: 'Funds added via JazzCash', reference: 'JC-8841230', status: 'completed', createdAt: daysAgo(28) },
    { type: 'debit', category: 'subscription', amount: 1400, balanceAfter: 3600, description: '12 Months Subscription — Line #L-2041', reference: 'ORD-7781', status: 'completed', createdAt: daysAgo(27) },
    { type: 'debit', category: 'subscription', amount: 2100, balanceAfter: 1500, description: '12 Months + VOD — Line #L-2042', reference: 'ORD-7782', status: 'completed', createdAt: daysAgo(26) },
    { type: 'credit', category: 'fund', amount: 10000, balanceAfter: 11500, description: 'Funds added via Easypaisa', reference: 'EP-5520194', status: 'completed', createdAt: daysAgo(24) },
    { type: 'debit', category: 'subscription', amount: 1400, balanceAfter: 10100, description: '12 Months Subscription — Line #L-2043', reference: 'ORD-7790', status: 'completed', createdAt: daysAgo(22) },
    { type: 'debit', category: 'subscription', amount: 700, balanceAfter: 9400, description: '6 Months Subscription — Line #L-2044', reference: 'ORD-7795', status: 'completed', createdAt: daysAgo(20) },
    { type: 'credit', category: 'fund', amount: 20000, balanceAfter: 29400, description: 'Funds added via Bank Al Habib', reference: 'FT-0009912', status: 'completed', createdAt: daysAgo(15) },
    { type: 'debit', category: 'subscription', amount: 1400, balanceAfter: 28000, description: '12 Months Subscription — Line #L-2050', reference: 'ORD-7810', status: 'completed', createdAt: daysAgo(12) },
    { type: 'debit', category: 'subscription', amount: 2100, balanceAfter: 25900, description: '12 Months + VOD — Line #L-2051', reference: 'ORD-7811', status: 'completed', createdAt: daysAgo(10) },
    { type: 'credit', category: 'fund', amount: 28000, balanceAfter: 53900, description: 'Funds added via USDT (TRC20) — 100 USD', reference: 'TX-9a7f2c', status: 'completed', createdAt: daysAgo(6) },
    { type: 'debit', category: 'subscription', amount: 8400, balanceAfter: 45500, description: 'Bulk: 6 × 12 Months — Order #ORD-7820', reference: 'ORD-7820', status: 'completed', createdAt: daysAgo(4) },
    { type: 'debit', category: 'subscription', amount: 1400, balanceAfter: 44100, description: '12 Months Subscription — Line #L-2060', reference: 'ORD-7830', status: 'completed', createdAt: daysAgo(2) },
    { type: 'credit', category: 'fund', amount: 5000, balanceAfter: 49100, description: 'Funds added via JazzCash', reference: 'JC-9012445', status: 'completed', createdAt: daysAgo(1) },
    { type: 'debit', category: 'subscription', amount: 6600, balanceAfter: 42500, description: 'Bulk: 3 × 12 Months + VOD — Order #ORD-7841', reference: 'ORD-7841', status: 'completed', createdAt: daysAgo(0) },
  ]

  for (const e of entries) {
    await db.transaction.create({
      data: {
        resellerId,
        type: e.type,
        category: e.category,
        amount: e.amount,
        balanceAfter: e.balanceAfter,
        description: e.description,
        reference: e.reference,
        status: e.status,
        createdAt: e.createdAt,
      },
    })
  }

  // One pending fund request (not yet credited)
  const jazzcash = await db.paymentMethod.findFirst({ where: { name: 'JazzCash' } })
  if (jazzcash) {
    await db.fundRequest.create({
      data: {
        resellerId,
        paymentMethodId: jazzcash.id,
        amount: 3000,
        fee: 0,
        total: 3000,
        reference: 'JC-9120088',
        senderNumber: '0301-9876543',
        note: 'Payment sent, please credit.',
        status: 'pending',
      },
    })
  }
}
