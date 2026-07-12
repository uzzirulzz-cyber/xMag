import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/stream?url=<m3u8-url> — proxies HLS streams with CORS headers
// so hls.js can load them in-browser regardless of the origin server's CORS policy.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const targetUrl = searchParams.get('url')

  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  try {
    const res = await fetch(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (VLC/3.0)' },
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) {
      return NextResponse.json({ error: `Stream returned ${res.status}` }, { status: res.status })
    }

    const contentType = res.headers.get('content-type') || 'application/vnd.apple.mpegurl'

    // If this is a playlist (.m3u8), rewrite child URLs to go through the proxy.
    // If it's a binary segment (.ts), pass through directly.
    const isPlaylist = contentType.includes('mpegurl') || targetUrl.includes('.m3u8')

    if (isPlaylist) {
      const body = await res.text()
      const origin = new URL(targetUrl).origin
      const dir = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1)
      const rewritten = body
        .split('\n')
        .map((line) => {
          const trimmed = line.trim()
          if (!trimmed || trimmed.startsWith('#')) return line
          let absolute: string
          if (trimmed.startsWith('http')) {
            absolute = trimmed
          } else if (trimmed.startsWith('/')) {
            absolute = origin + trimmed
          } else {
            absolute = dir + trimmed
          }
          return `/api/stream?url=${encodeURIComponent(absolute)}`
        })
        .join('\n')

      return new NextResponse(rewritten, {
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache',
        },
      })
    } else {
      // Binary segment — pass through directly
      const body = await res.arrayBuffer()
      return new NextResponse(body, {
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache',
        },
      })
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 })
  }
}
