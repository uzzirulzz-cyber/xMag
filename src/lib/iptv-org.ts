// iptv-org public playlist integration.
// Source: https://github.com/iptv-org/iptv — public-domain catalogue of
// 13,000+ free-to-air IPTV channels worldwide.

const PLAYLIST_URLS = {
  all: 'https://iptv-org.github.io/iptv/index.m3u',
  pk: 'https://iptv-org.github.io/iptv/countries/pk.m3u',
  in: 'https://iptv-org.github.io/iptv/countries/in.m3u',
  uk: 'https://iptv-org.github.io/iptv/countries/uk.m3u',
  us: 'https://iptv-org.github.io/iptv/countries/us.m3u',
  sports: 'https://iptv-org.github.io/iptv/categories/sports.m3u',
  news: 'https://iptv-org.github.io/iptv/categories/news.m3u',
  movies: 'https://iptv-org.github.io/iptv/categories/movies.m3u',
} as const

export type PlaylistKey = keyof typeof PLAYLIST_URLS

export interface PublicChannel {
  name: string
  logo: string | null
  group: string
  url: string
  tvgId: string | null
}

// In-memory cache (5 min TTL) so we don't re-fetch the 27k-line playlist on
// every request. The playlist updates daily upstream — 5 min is plenty.
let cache: { key: PlaylistKey; channels: PublicChannel[]; at: number } | null = null
const CACHE_TTL = 5 * 60 * 1000

/**
 * Fetch + parse an iptv-org M3U playlist into structured channel objects.
 */
export async function fetchPlaylist(key: PlaylistKey = 'all'): Promise<PublicChannel[]> {
  if (cache && cache.key === key && Date.now() - cache.at < CACHE_TTL) {
    return cache.channels
  }

  const url = PLAYLIST_URLS[key] ?? PLAYLIST_URLS.all
  const res = await fetch(url, {
    signal: AbortSignal.timeout(20_000),
    headers: { 'User-Agent': 'StarIPTV-Panel/2.4.1' },
  })
  if (!res.ok) throw new Error(`Failed to fetch playlist: ${res.status}`)
  const text = await res.text()

  const channels: PublicChannel[] = []
  const lines = text.split('\n')
  let current: Partial<PublicChannel> = {}

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    if (trimmed.startsWith('#EXTINF')) {
      // Parse: #EXTINF:-1 tvg-id="X" tvg-logo="Y" group-title="Z",Channel Name
      current = {}
      const tvgIdMatch = trimmed.match(/tvg-id="([^"]*)"/)
      const logoMatch = trimmed.match(/tvg-logo="([^"]*)"/)
      const groupMatch = trimmed.match(/group-title="([^"]*)"/)
      const nameMatch = trimmed.match(/,(.+)$/)
      current.tvgId = tvgIdMatch?.[1] || null
      current.logo = logoMatch?.[1] || null
      current.group = groupMatch?.[1] || 'Uncategorized'
      current.name = nameMatch?.[1]?.trim() || 'Unknown'
    } else if (!trimmed.startsWith('#') && current.name) {
      current.url = trimmed
      channels.push(current as PublicChannel)
      current = {}
    }
  }

  cache = { key, channels, at: Date.now() }
  return channels
}

/** Get the list of distinct groups from a playlist (for the sidebar filter). */
export async function fetchGroups(key: PlaylistKey = 'all'): Promise<{ group: string; count: number }[]> {
  const channels = await fetchPlaylist(key)
  const counts = new Map<string, number>()
  for (const c of channels) {
    counts.set(c.group, (counts.get(c.group) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([group, count]) => ({ group, count }))
    .sort((a, b) => b.count - a.count)
}

export const PLAYLIST_LABELS: Record<PlaylistKey, string> = {
  all: 'All Countries',
  pk: 'Pakistan',
  in: 'India',
  uk: 'United Kingdom',
  us: 'United States',
  sports: 'Sports (Worldwide)',
  news: 'News (Worldwide)',
  movies: 'Movies (Worldwide)',
}
