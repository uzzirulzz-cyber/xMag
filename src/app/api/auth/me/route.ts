import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/auth/me — check if session is valid (cookie present + reseller exists)
export async function GET(request: Request) {
  const token = request.headers.get('cookie')?.match(/magx_session=([^;]+)/)?.[1]
  if (!token) return NextResponse.json({ authenticated: false })

  // For this demo, any non-empty token is valid (real impl would verify a JWT/session table)
  const reseller = await db.reseller.findFirst({ orderBy: { createdAt: 'asc' } })
  if (!reseller) return NextResponse.json({ authenticated: false })

  return NextResponse.json({
    authenticated: true,
    reseller: {
      id: reseller.id,
      username: reseller.username,
      fullName: reseller.fullName,
      email: reseller.email,
      role: reseller.role,
    },
  })
}
