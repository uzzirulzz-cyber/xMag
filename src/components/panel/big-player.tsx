'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, AlertCircle, Play, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

declare global {
  interface Window { Hls?: unknown }
}

export function BigPlayer({ url, name }: { url: string; name: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'playing' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!url || !videoRef.current) return

    const video = videoRef.current
    let hls: { destroy: () => void; loadSource: (s: string) => void; attachMedia: (e: HTMLVideoElement) => void; on: (e: string, cb: (...a: unknown[]) => void) => void } | null = null
    const proxyUrl = `/api/stream?url=${encodeURIComponent(url)}`
    const isM3u8 = url.includes('.m3u8') || url.includes('playlist.m3u')

    const load = async () => {
      if (isM3u8) {
        const Hls = await loadHls()
        if (!Hls) {
          if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = proxyUrl
            video.addEventListener('loadedmetadata', () => video.play().then(() => setStatus('playing')).catch(() => setStatus('playing')))
          } else {
            setStatus('error')
            setErrorMsg('HLS not supported')
          }
          return
        }
        if (Hls.isSupported()) {
          hls = new Hls({ enableWorker: true, lowLatencyMode: true, maxBufferLength: 30 })
          hls.loadSource(proxyUrl)
          hls.attachMedia(video)
          hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().then(() => setStatus('playing')).catch(() => setStatus('playing')))
          hls.on(Hls.Events.ERROR, (_e: unknown, data: { fatal: boolean; details: string }) => {
            if (data.fatal) { setStatus('error'); setErrorMsg(data.details || 'Stream failed') }
          })
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = proxyUrl
          video.addEventListener('loadedmetadata', () => video.play().then(() => setStatus('playing')).catch(() => setStatus('playing')))
        }
      } else {
        video.src = proxyUrl
        video.play().then(() => setStatus('playing')).catch(() => { setStatus('error'); setErrorMsg('Format not supported in-browser') })
      }
    }

    const timer = setTimeout(load, 200)

    return () => {
      clearTimeout(timer)
      if (hls) hls.destroy()
      video.removeAttribute('src')
      video.load()
    }
  }, [url])

  const fullscreen = () => {
    containerRef.current?.requestFullscreen?.()
  }

  if (!url) {
    return (
      <div className="relative aspect-video bg-black rounded-2xl overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <Play className="h-12 w-12 text-zinc-700 mx-auto mb-2" />
          <p className="text-sm text-zinc-500">Select a channel to start playing</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative aspect-video bg-black rounded-2xl overflow-hidden group">
      <video ref={videoRef} className="w-full h-full" controls autoPlay playsInline />

      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-zinc-400">Loading {name}…</p>
        </div>
      )}

      {status === 'playing' && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/70 backdrop-blur rounded-full px-3 py-1">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] font-bold text-white uppercase">LIVE</span>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/90 p-6 text-center">
          <AlertCircle className="h-10 w-10 text-rose-500" />
          <div>
            <p className="text-sm font-medium text-zinc-200">Stream unavailable</p>
            <p className="text-xs text-zinc-500 mt-1">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Fullscreen button */}
      {status === 'playing' && (
        <button
          onClick={fullscreen}
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-black/70 backdrop-blur text-white opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Fullscreen"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      )}

      {/* Channel name overlay */}
      {status === 'playing' && (
        <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur rounded-lg px-3 py-1.5">
          <p className="text-xs font-medium text-white truncate max-w-[300px]">{name}</p>
        </div>
      )}
    </div>
  )
}

function loadHls(): Promise<unknown> {
  return new Promise((resolve) => {
    const w = window as Record<string, unknown>
    if (w.Hls) return resolve(w.Hls)
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.4.12/dist/hls.min.js'
    script.async = true
    script.onload = () => resolve(w.Hls)
    script.onerror = () => resolve(null)
    document.head.appendChild(script)
  })
}
