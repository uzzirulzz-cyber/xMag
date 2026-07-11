import { db } from '@/lib/db'

// Subscription plans available to resellers (PKR credit cost per line).
// Mirrors typical Xtream-UI / XUI.ONE reseller pricing.
export interface SubscriptionPlan {
  months: number
  label: string
  price: number
  popular?: boolean
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  { months: 1, label: '1 Month', price: 700 },
  { months: 3, label: '3 Months', price: 1400 },
  { months: 6, label: '6 Months', price: 2100 },
  { months: 12, label: '12 Months', price: 3500, popular: true },
]

export function getPlan(months: number): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find((p) => p.months === months)
}

// Generate a random line username / password in the Xtream-UI style.
export function generateLineCredentials() {
  const rand = (n: number) =>
    Array.from({ length: n }, () => Math.floor(Math.random() * 36).toString(36)).join('')
  return {
    username: `${rand(3)}_${rand(5)}`.toLowerCase(),
    password: rand(10),
  }
}

/**
 * Seed the content-category catalogue if empty. Series categories are taken
 * verbatim from the Star IPTV "Custom Subscription" screen; live + VOD
 * categories are representative.
 */
export async function ensureContentCategories() {
  const count = await db.contentCategory.count()
  if (count > 0) return
  await db.contentCategory.createMany({ data: SEED_CATEGORIES })
}

const SEED_CATEGORIES: Array<{
  type: string
  code: string
  name: string
  itemCount: number
  sortOrder: number
}> = [
  // ── Series (verbatim from Star IPTV Custom Subscription screen) ──
  { type: 'series', code: 'EN', name: 'ALL English Series', itemCount: 1952, sortOrder: 1 },
  { type: 'series', code: 'EN', name: 'Anime Series', itemCount: 48, sortOrder: 2 },
  { type: 'series', code: 'EN', name: 'Hotstar & Disney Series', itemCount: 120, sortOrder: 3 },
  { type: 'series', code: 'EN', name: 'Netflix Series', itemCount: 762, sortOrder: 4 },
  { type: 'series', code: 'EN', name: 'Netflix Series (Multi Sub)', itemCount: 355, sortOrder: 5 },
  { type: 'series', code: 'EN', name: 'Netflix/HBO/Hulu Series', itemCount: 1470, sortOrder: 6 },
  { type: 'series', code: 'IN', name: 'Hindi Dubbed Series', itemCount: 128, sortOrder: 7 },
  { type: 'series', code: 'IN', name: 'Hindi Series', itemCount: 1250, sortOrder: 8 },
  { type: 'series', code: 'IN', name: 'Netflix Series', itemCount: 367, sortOrder: 9 },
  { type: 'series', code: 'IN', name: 'Regional Series', itemCount: 62, sortOrder: 10 },
  { type: 'series', code: 'IN', name: 'ULLU Series', itemCount: 115, sortOrder: 11 },
  { type: 'series', code: 'PK', name: 'ALL Pakistani Series', itemCount: 475, sortOrder: 12 },
  { type: 'series', code: 'AR', name: 'ALL Arabic Series', itemCount: 1485, sortOrder: 13 },
  { type: 'series', code: 'AR', name: 'Animation/Anime Series', itemCount: 285, sortOrder: 14 },
  { type: 'series', code: 'AR', name: 'Subtitled Series [Multi-Sub]', itemCount: 399, sortOrder: 15 },
  { type: 'series', code: 'DE', name: 'ALL German Series', itemCount: 710, sortOrder: 16 },
  { type: 'series', code: 'ES', name: 'ALL Spanish Series', itemCount: 248, sortOrder: 17 },
  { type: 'series', code: 'PT', name: 'ALL Portuguese Series', itemCount: 596, sortOrder: 18 },
  { type: 'series', code: 'PT', name: 'Netflix Series', itemCount: 823, sortOrder: 19 },
  { type: 'series', code: 'PL', name: 'ALL Polish Series', itemCount: 1, sortOrder: 20 },
  { type: 'series', code: 'PL', name: 'Netflix Series', itemCount: 1, sortOrder: 21 },
  { type: 'series', code: 'FR', name: 'ALL French Series', itemCount: 996, sortOrder: 22 },
  { type: 'series', code: 'FR', name: 'Netflix/Amazon/Disney Series', itemCount: 448, sortOrder: 23 },
  { type: 'series', code: 'IT', name: 'ALL Italian Series', itemCount: 862, sortOrder: 24 },
  { type: 'series', code: 'NL', name: 'ALL Dutch Series', itemCount: 634, sortOrder: 25 },
  { type: 'series', code: 'KU', name: 'ALL Kurdish Series', itemCount: 34, sortOrder: 26 },
  { type: 'series', code: 'TR', name: 'ALL Turkish Series', itemCount: 461, sortOrder: 27 },

  // ── Live Channels (representative) ──
  { type: 'live', code: 'EN', name: 'UK Channels', itemCount: 320, sortOrder: 101 },
  { type: 'live', code: 'EN', name: 'USA Channels', itemCount: 410, sortOrder: 102 },
  { type: 'live', code: 'PK', name: 'Pakistani Channels', itemCount: 145, sortOrder: 103 },
  { type: 'live', code: 'IN', name: 'Indian Channels', itemCount: 380, sortOrder: 104 },
  { type: 'live', code: 'AR', name: 'Arabic Channels', itemCount: 520, sortOrder: 105 },
  { type: 'live', code: 'SPORT', name: 'Sports Channels', itemCount: 95, sortOrder: 106 },
  { type: 'live', code: 'NEWS', name: 'News Channels', itemCount: 88, sortOrder: 107 },
  { type: 'live', code: 'KIDS', name: 'Kids Channels', itemCount: 64, sortOrder: 108 },

  // ── Movies / VOD (representative) ──
  { type: 'vod', code: 'EN', name: 'English Movies', itemCount: 8200, sortOrder: 201 },
  { type: 'vod', code: 'IN', name: 'Hindi Movies', itemCount: 4100, sortOrder: 202 },
  { type: 'vod', code: 'PK', name: 'Pakistani Movies', itemCount: 540, sortOrder: 203 },
  { type: 'vod', code: 'AR', name: 'Arabic Movies', itemCount: 2300, sortOrder: 204 },
  { type: 'vod', code: 'EN', name: 'Netflix Movies', itemCount: 1850, sortOrder: 205 },
  { type: 'vod', code: 'EN', name: '4K / UHD Movies', itemCount: 620, sortOrder: 206 },
  { type: 'vod', code: 'KIDS', name: 'Kids Movies', itemCount: 980, sortOrder: 207 },
]
