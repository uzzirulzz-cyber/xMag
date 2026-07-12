import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// POST /api/auth/logout — clear session cookie
export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete('magx_session')
  return res
}
