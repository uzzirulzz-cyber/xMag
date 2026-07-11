export type PaymentMethodType = 'mobile_wallet' | 'bank_transfer' | 'crypto' | 'card'

export interface PaymentMethod {
  id: string
  name: string
  type: PaymentMethodType
  accountTitle: string
  accountNumber: string
  bankName: string | null
  network: string | null
  instructions: string
  minAmount: number
  maxAmount: number
  feePercent: number
  logoText: string
  color: string
  active: boolean
  sortOrder: number
}

export interface Overview {
  reseller: {
    id: string
    username: string
    fullName: string
    email: string
    phone: string | null
    currency: string
    status: string
    role: string
  }
  balance: number
  currency: string
  totalAdded: number
  totalSpent: number
  monthAdded: number
  monthSpent: number
  pendingCount: number
  pendingAmount: number
  exchangeRate: { usdToPkr: number; pkrToUsdCredit: number }
}

export interface Transaction {
  id: string
  resellerId: string
  type: 'credit' | 'debit'
  category: string
  amount: number
  balanceAfter: number
  description: string
  reference: string | null
  status: string
  fundRequestId: string | null
  createdAt: string
}

export interface TransactionsResponse {
  items: Transaction[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface FundRequest {
  id: string
  resellerId: string
  paymentMethodId: string
  amount: number
  fee: number
  total: number
  reference: string | null
  senderNumber: string | null
  note: string | null
  screenshotUrl: string | null
  status: string
  reviewerNote: string | null
  reviewedAt: string | null
  createdAt: string
  paymentMethod?: PaymentMethod
}

export interface ContentCategory {
  id: string
  type: 'live' | 'vod' | 'series'
  code: string
  name: string
  itemCount: number
  sortOrder: number
}

export interface SubscriptionPlan {
  months: number
  label: string
  price: number
  popular?: boolean
}

export interface Subscription {
  id: string
  resellerId: string
  username: string
  password: string
  planMonths: number
  creditsCost: number
  excludedLive: boolean
  excludedVod: boolean
  excludedSeries: boolean
  seriesCategoryIds: string
  seriesCategoryCount: number
  dns: string
  status: string
  maxConnections: number
  currentConnections: number
  lastConnectedAt: string | null
  disabledAt: string | null
  expiresAt: string
  createdAt: string
  updatedAt: string
}

export interface ConnectionLog {
  id: string
  subscriptionId: string
  ip: string
  country: string | null
  countryCode: string | null
  isp: string | null
  device: string | null
  userAgent: string | null
  connectedAt: string
  disconnectedAt: string | null
  durationSec: number | null
}

export interface ChannelPackage {
  id: string
  name: string
  type: 'live' | 'vod' | 'series'
  description: string | null
  color: string
  icon: string
  channelCount: number
  totalViewers: number
  sortOrder: number
}

export interface Channel {
  id: string
  packageId: string
  name: string
  type: 'live' | 'vod' | 'series'
  category: string
  country: string
  logoText: string
  color: string
  epgNow: string | null
  epgNext: string | null
  streamUrl: string
  currentViewers: number
  hd: boolean
  active: boolean
  sortOrder: number
  package?: { name: string; color: string }
}

export interface ChannelStats {
  totalChannels: number
  totalViewers: number
  activeChannels: number
  packages: number
  topChannels: Array<{
    id: string
    name: string
    currentViewers: number
    category: string
    country: string
    logoText: string
    color: string
    packageName: string
  }>
  byCategory: Array<{ category: string; viewers: number; channels: number }>
  byCountry: Array<{ country: string; viewers: number; channels: number }>
  byType: Array<{ type: string; viewers: number; channels: number }>
}

export type NotificationType = 'info' | 'success' | 'warning' | 'fund' | 'subscription' | 'system'

export interface AppNotification {
  id: string
  resellerId: string
  type: NotificationType
  title: string
  message: string
  link: string | null
  read: boolean
  createdAt: string
}
