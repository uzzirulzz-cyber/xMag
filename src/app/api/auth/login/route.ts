import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// POST /api/auth/login — verify reseller credentials, return a session token
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const username = String(body.username || '').trim()
  const password = String(body.password || '')

  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password are required.' }, { status: 400 })
  }

  const hash = crypto.createHash('sha256').update(password).digest('hex')
  const reseller = await db.reseller.findFirst({
    where: {
      OR: [{ username }, { email: username }],
      passwordHash: hash,
    },
  })

  if (!reseller) {
    return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 })
  }

  // Simple session token (not JWT, but sufficient for this panel)
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
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
  return res
}
