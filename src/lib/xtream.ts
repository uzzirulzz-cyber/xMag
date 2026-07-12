import { db } from '@/lib/db'
import { getCurrentReseller } from '@/lib/funds'

export interface XtreamAccountInfo {
  user_info: {
    username: string
    password: string
    status: string
    exp_date: string | null
    is_trial: string
    active_cons: string
    max_connections: string
    created_at: string
    allowed_output_formats: string[]
  }
  server_info: {
    panel: string
    version: string
    url: string
    port: string
    https_port: string
    server_protocol: string
    timezone: string
    time_now: string
    process: boolean
  }
}

export interface XtreamCategory {
  category_id: string
  category_name: string
  icon: string | null
  parent_id: number
  is_adult: string
  stream_count?: number
}

export interface XtreamLiveStream {
  num: number
  name: string
  stream_type: string
  stream_id: number
  stream_icon: string
  epg_channel_id: string | null
  added: string
  is_adult: string
  category_id: string
  custom_sid: string
  tv_archive: number
  direct_source: string
  tv_archive_duration: number
}

export interface XtreamVodStream {
  num: number
  name: string
  stream_type: string
  stream_id: number
  stream_icon: string
  rating: string
  rating_5based: number
  added: string
  is_adult: string
  category_id: string
  container_extension: string
  custom_sid: string
  direct_source: string
}

/**
 * Returns the reseller's active Xtream server config, seeding the demo
 * "World Package (Family)" server if none exists.
 */
export async function getXtreamServer(serverId?: string) {
  const reseller = await getCurrentReseller()
  let server = serverId
    ? await db.xtreamServer.findFirst({ where: { id: serverId, resellerId: reseller.id } })
    : await db.xtreamServer.findFirst({
        where: { resellerId: reseller.id, active: true },
        orderBy: { createdAt: 'asc' },
      })
  if (!server) {
    server = await db.xtreamServer.create({
      data: {
        resellerId: reseller.id,
        label: 'World Package (Family)',
        host: 'http://geotv.space:8880',
        username: '3ea77da2',
        password: '5bb13ec3',
        active: true,
      },
    })
  }
  return server
}

/**
 * Call the Xtream Codes player_api.php endpoint server-side.
 * This proxies requests so credentials never reach the browser.
 */
export async function callXtreamApi(
  action?: string,
  params?: Record<string, string>,
  serverId?: string,
): Promise<unknown> {
  const server = await getXtreamServer(serverId)
  const url = new URL(`${server.host.replace(/\/$/, '')}/player_api.php`)
  url.searchParams.set('username', server.username)
  url.searchParams.set('password', server.password)
  if (action) url.searchParams.set('action', action)
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  }

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'User-Agent': 'StarIPTV-Panel/2.4.1' },
    signal: AbortSignal.timeout(20_000),
  })
  if (!res.ok) {
    throw new Error(`Xtream API returned ${res.status}`)
  }
  return res.json()
}

/** Build a playable live stream URL for an Xtream stream id. */
export function liveStreamUrl(streamId: number, ext: 'ts' | 'm3u8' = 'ts') {
  return `${'host'}/live/${'user'}/${'pass'}/${streamId}.${ext}`
}

/** Build a playable VOD stream URL for an Xtream stream id. */
export function vodStreamUrl(streamId: number, ext: string) {
  return `${'host'}/movie/${'user'}/${'pass'}/${streamId}.${ext}`
}

/** Get all active Xtream servers for the server selector. */
export async function getAllXtreamServers() {
  const reseller = await getCurrentReseller()
  const servers = await db.xtreamServer.findMany({
    where: { resellerId: reseller.id, active: true },
    orderBy: { createdAt: 'asc' },
  })
  return servers.map((s) => ({
    id: s.id,
    label: s.label,
    host: s.host,
    username: s.username,
  }))
}
