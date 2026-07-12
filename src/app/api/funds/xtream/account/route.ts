import { NextResponse } from 'next/server'
import { callXtreamApi, getXtreamServer } from '@/lib/xtream'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // cache account info for 5 min

// GET /api/funds/xtream/account — Xtream account + server info
export async function GET() {
  try {
    const server = await getXtreamServer()
    const data = (await callXtreamApi()) as { user_info: Record<string, unknown>; server_info: Record<string, unknown> }

    const exp = data.user_info?.exp_date ? new Date(Number(data.user_info.exp_date) * 1000) : null
    return NextResponse.json({
      server: {
        label: server.label,
        host: server.host,
        appUrl: `${server.host.replace(/\/$/, '')}/app.php`,
      },
      userInfo: {
        username: data.user_info?.username,
        status: data.user_info?.status,
        expDate: exp?.toISOString() ?? null,
        isTrial: data.user_info?.is_trial === '1',
        activeConnections: Number(data.user_info?.active_cons ?? 0),
        maxConnections: Number(data.user_info?.max_connections ?? 1),
        createdAt: data.user_info?.created_at ? new Date(Number(data.user_info.created_at) * 1000).toISOString() : null,
      },
      serverInfo: {
        panel: data.server_info?.panel,
        version: data.server_info?.version,
        url: data.server_info?.url,
        port: data.server_info?.port,
        timezone: data.server_info?.timezone,
        timeNow: data.server_info?.time_now,
      },
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 })
  }
}
