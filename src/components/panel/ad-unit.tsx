'use client'

import { useEffect, useRef } from 'react'

/**
 * Real Google AdSense ad unit.
 * Requires ADSENSE_CLIENT and ADSENSE_SLOT env vars + the AdSense script
 * loaded in the layout. Revenue is real — paid by Google per impression/click.
 *
 * To enable:
 * 1. Get approved at https://www.google.com/adsense
 * 2. Set ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX in .env
 * 3. Set ADSENSE_SLOT=XXXXXXXXXX in .env
 * 4. Google verifies your site, then ads serve automatically
 */

declare global {
  interface Window {
    adsbygoogle?: unknown[]
  }
}

export function AdUnit({
  client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || '',
  slot = process.env.NEXT_PUBLIC_ADSENSE_SLOT || '',
  format = 'auto',
  className = '',
}: {
  client?: string
  slot?: string
  format?: string
  className?: string
}) {
  const insRef = useRef<HTMLModElement>(null)

  useEffect(() => {
    if (!client || !slot) return
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      /* ad blocker or not loaded yet */
    }
  }, [client, slot])

  if (!client || !slot) {
    // No AdSense configured — don't render a fake placeholder
    return null
  }

  return (
    <ins
      ref={insRef}
      className={`adsbygoogle ${className}`}
      style={{ display: 'block' }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  )
}

/** AdSense script loader — add to <head> in layout.tsx */
export function AdSenseScript() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
  if (!client) return null
  return (
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
      crossOrigin="anonymous"
    />
  )
}
