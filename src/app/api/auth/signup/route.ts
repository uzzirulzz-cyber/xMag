import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// POST /api/auth/signup — create a new reseller account
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const username = String(body.username || '').trim().toLowerCase()
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')
  const fullName = String(body.fullName || '').trim()
  const phone = body.phone ? String(body.phone).trim() : null

  // Validation
  if (!username || !email || !password || !fullName) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
  }
  if (username.length < 3) {
    return NextResponse.json({ error: 'Username must be at least 3 characters.' }, { status: 400 })
  }
  if (!/^[a-z0-9_]+$/.test(username)) {
    return NextResponse.json({ error: 'Username can only contain lowercase letters, numbers, and underscores.' }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })
  }

  // Check uniqueness
  const existing = await db.reseller.findFirst({
    where: { OR: [{ username }, { email }] },
  })
  if (existing) {
    if (existing.username === username) {
      return NextResponse.json({ error: 'Username already taken.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Email already registered.' }, { status: 409 })
  }

  // Create reseller (new accounts start with Rs0 balance)
  const hash = crypto.createHash('sha256').update(password).digest('hex')
  const reseller = await db.reseller.create({
    data: {
      username,
      email,
      fullName,
      passwordHash: hash,
      phone,
      balance: 0,
      currency: 'PKR',
      status: 'active',
      role: 'reseller',
    },
  })

  // Auto-login: set session cookie
  const token = crypto.randomBytes(32).toString('hex')
  const res = NextResponse.json({
    ok: true,
    token,
    reseller: {
      id: reseller.id,
      username: reseller.username,
      fullName: reseller.fullName,
      email: reseller.email,
      role: reseller.role,
    },
  })
  res.cookies.set('magx_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return res
}
