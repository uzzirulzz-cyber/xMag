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

  // Seed content-category catalogue for the Custom Subscription builder
  const { ensureContentCategories } = await import('@/lib/subscriptions')
  await ensureContentCategories()

  // Seed packages + channels with live viewership for the Channels browser
  const { ensurePackagesAndChannels } = await import('@/lib/channels')
  await ensurePackagesAndChannels()

  let reseller = await db.reseller.findFirst({
    where: { username: 'starreseller' },
  })
  if (!reseller) {
    reseller = await db.reseller.create({
      data: {
        username: 'starreseller',
        email: 'reseller@magxworld.tv',
        fullName: 'MaGx Reseller',
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

  const subCount = await db.subscription.count({ where: { resellerId: reseller.id } })
  if (subCount === 0) {
    await seedSubscriptions(reseller.id)
  }

  // Seed the notification feed (mirrors legacy global.js notification dropdown)
  const { ensureNotifications } = await import('@/lib/notifications')
  await ensureNotifications()

  // Seed the Xtream server config for the World Package (Family)
  const { getXtreamServer } = await import('@/lib/xtream')
  await getXtreamServer()

  // Seed the payment-automation bot config
  const { getBotConfig } = await import('@/lib/bot')
  await getBotConfig()

  return reseller
}

async function seedPaymentMethods() {
  // All payment methods route funds directly to the admin (MUHAMMAD UZAIR).
  // Account details are read from env so they never appear in source code.
  const adminTitle = process.env.ADMIN_ACCOUNT_TITLE || 'MUHAMMAD UZAIR'
  const adminEasypaisa = process.env.ADMIN_EASYPAISA || '03390005715'
  const adminBank = process.env.ADMIN_BANK_NAME || 'Bank Alfalah'
  const adminIban = process.env.ADMIN_IBAN || 'PK52ALFH0336001010537701'
  const adminAccount = process.env.ADMIN_ACCOUNT_NUMBER || '03361010537701'
  const adminSwift = process.env.ADMIN_SWIFT || 'ALFHPKKAXXX'
  const adminBranch = process.env.ADMIN_BRANCH || 'E-11 MARKAZ BRANCH ISLAMABAD'
  const adminBranchCode = process.env.ADMIN_BRANCH_CODE || '0336'

  const methods = [
    {
      name: 'JazzCash',
      type: 'mobile_wallet',
      accountTitle: adminTitle,
      accountNumber: adminEasypaisa,
      network: 'Jazz',
      instructions:
        `Open JazzCash app → Send Money → Enter ${adminEasypaisa} (${adminTitle}) → Enter exact amount → Use TID as reference. The auto-credit bot verifies and credits within 10 minutes.`,
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
      accountTitle: adminTitle,
      accountNumber: adminEasypaisa,
      network: 'Telenor',
      instructions:
        `Open Easypaisa app → Send Money → Enter ${adminEasypaisa} (${adminTitle}) → Enter exact amount → Use TID as reference. Auto-credited within 10 minutes.`,
      minAmount: 500,
      maxAmount: 100000,
      feePercent: 0,
      logoText: 'EP',
      color: '#0CB04A',
      sortOrder: 2,
    },
    {
      name: 'Bank Alfalah',
      type: 'bank_transfer',
      accountTitle: adminTitle,
      accountNumber: adminAccount,
      bankName: adminBank,
      network: 'ALFH',
      instructions:
        `Transfer via IBFT/RAAST to ${adminTitle}, ${adminBank}, A/C ${adminAccount}, IBAN ${adminIban}, Branch ${adminBranch} (${adminBranchCode}), Swift ${adminSwift}. Use FT/IBFT ref when submitting. Funds route directly to admin.`,
      minAmount: 1000,
      maxAmount: 5000000,
      feePercent: 0,
      logoText: 'BA',
      color: '#E4002B',
      sortOrder: 3,
    },
    {
      name: 'USDT (TRC20)',
      type: 'crypto',
      accountTitle: adminTitle,
      accountNumber: 'TJbZ9rQ7...xK4mN8pQ (TRC20)',
      network: 'TRC20',
      instructions:
        'Send USDT on the TRC20 network only. Use rate 1 USD = PKR 280. Submit the fund request with the TXID and amount in USD. Auto-credited within 10 min of 1 confirmation.',
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
      accountTitle: adminTitle,
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

// Seed a few active IPTV lines so the "My Subscriptions" list renders on first load.
async function seedSubscriptions(resellerId: string) {
  const now = new Date()
  const addDays = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000)
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000)
  const minsAgo = (m: number) => new Date(now.getTime() - m * 60 * 1000)

  const seriesCats = await db.contentCategory.findMany({
    where: { type: 'series' },
    orderBy: { sortOrder: 'asc' },
  })

  const lines = [
    {
      username: 'axc_8f2k9p',
      password: 'q7Hm2Lp9Zx',
      planMonths: 12,
      creditsCost: 3500,
      excludedLive: false,
      excludedVod: false,
      excludedSeries: false,
      seriesCategoryIds: '',
      seriesCategoryCount: 0,
      maxConnections: 2,
      currentConnections: 1,
      lastConnectedAt: minsAgo(14),
      createdAt: daysAgo(12),
      expiresAt: addDays(353),
    },
    {
      username: 'axc_3m1r7t',
      password: 'K4nW8vRe2a',
      planMonths: 12,
      creditsCost: 2100,
      excludedLive: false,
      excludedVod: true, // VOD excluded (low-capacity device)
      excludedSeries: false,
      seriesCategoryIds: seriesCats.slice(0, 3).map((c) => c.id).join(','),
      seriesCategoryCount: 3,
      maxConnections: 1,
      currentConnections: 0,
      lastConnectedAt: minsAgo(60 * 5),
      createdAt: daysAgo(10),
      expiresAt: addDays(355),
    },
    {
      username: 'axc_9b4x2q',
      password: 'Pw3Zt6Yn8c',
      planMonths: 6,
      creditsCost: 700,
      excludedLive: true, // Live excluded (movies-only line)
      excludedVod: false,
      excludedSeries: false,
      seriesCategoryIds: '',
      seriesCategoryCount: 0,
      maxConnections: 1,
      currentConnections: 1,
      lastConnectedAt: minsAgo(3),
      createdAt: daysAgo(2),
      expiresAt: addDays(178),
    },
    {
      username: 'axc_7v2n8c',
      password: 'Bm9Xk2Rp4t',
      planMonths: 3,
      creditsCost: 1400,
      excludedLive: false,
      excludedVod: false,
      excludedSeries: false,
      seriesCategoryIds: '',
      seriesCategoryCount: 0,
      maxConnections: 1,
      currentConnections: 0,
      status: 'disabled',
      disabledAt: daysAgo(1),
      createdAt: daysAgo(40),
      expiresAt: daysAgo(-50), // 50 days ago → expired too (status disabled takes priority)
    },
  ]

  for (const l of lines) {
    await db.subscription.create({ data: { resellerId, ...l } })
  }

  // Seed connection logs for the active lines (mirrors Xtream UI connection tracker)
  const activeLines = await db.subscription.findMany({
    where: { resellerId, status: 'active' },
  })

  const connSeed: Array<{
    subscriptionId: string
    ip: string
    country: string
    countryCode: string
    isp: string
    device: string
    userAgent: string
    connectedAt: Date
    disconnectedAt: Date | null
    durationSec: number | null
  }> = [
    { subscriptionId: '', ip: '182.185.42.11', country: 'Pakistan', countryCode: 'PK', isp: 'PTCL', device: 'Smart TV', userAgent: 'TiviMate/4.7 (Android)', connectedAt: minsAgo(14), disconnectedAt: null, durationSec: null },
    { subscriptionId: '', ip: '182.185.42.11', country: 'Pakistan', countryCode: 'PK', isp: 'PTCL', device: 'Smart TV', userAgent: 'TiviMate/4.7 (Android)', connectedAt: minsAgo(60 * 26), disconnectedAt: minsAgo(60 * 24), durationSec: 7200 },
    { subscriptionId: '', ip: '39.41.88.220', country: 'Pakistan', countryCode: 'PK', isp: 'Jazz', device: 'Android', userAgent: 'IPTV Smarters/5.1', connectedAt: minsAgo(60 * 48), disconnectedAt: minsAgo(60 * 47), durationSec: 3600 },
    { subscriptionId: '', ip: '203.135.12.9', country: 'Pakistan', countryCode: 'PK', isp: 'WorldCall', device: 'Firestick', userAgent: 'TiviMate/4.6 (Fire OS)', connectedAt: minsAgo(60 * 72), disconnectedAt: minsAgo(60 * 70), durationSec: 7200 },
    { subscriptionId: '', ip: '94.23.122.18', country: 'France', countryCode: 'FR', isp: 'OVH', device: 'Web', userAgent: 'Mozilla/5.0 (VLC)', connectedAt: minsAgo(60 * 96), disconnectedAt: minsAgo(60 * 95), durationSec: 1800 },
  ]

  for (const line of activeLines) {
    // 2-3 connection entries per line, cycling through the seed pool
    const count = line.username === 'axc_8f2k9p' ? 3 : line.username === 'axc_9b4x2q' ? 2 : 2
    for (let i = 0; i < count; i++) {
      const c = connSeed[i % connSeed.length]
      await db.connection.create({
        data: { ...c, subscriptionId: line.id },
      })
    }
  }
}
