// Run with: bun run scripts/seed.ts
import { ensureSeed } from '../src/lib/funds'
import { db } from '../src/lib/db'

async function main() {
  const reseller = await ensureSeed()
  console.log('Seed complete. Demo reseller:', reseller.username, 'balance:', reseller.balance)
  const pmCount = await db.paymentMethod.count()
  const txCount = await db.transaction.count()
  const frCount = await db.fundRequest.count()
  console.log(`Payment methods: ${pmCount} | Transactions: ${txCount} | Fund requests: ${frCount}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .then(() => process.exit(0))
