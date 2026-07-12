'use client'

import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Copy, X, Loader2, AlertCircle, ExternalLink, Eye } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function StreamPlayer({
  open,
  onOpenChange,
  name,
  url,
  category,
  viewers,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  name: string
  url: string
  category?: string
  viewers?: number
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [status, setStatus] = useState<'loading' | 'playing' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    if (!open || !url || !videoRef.current) return

    const video = videoRef.current

    // Clean up previous instance
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    const isM3u8 = url.includes('.m3u8') || url.includes('playlist.m3u')

    if (isM3u8 && Hls.isSupported()) {
      // Use hls.js for browsers that don't support HLS natively (Chrome, Firefox, Edge)
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true })
      hlsRef.current = hls
      hls.loadSource(url)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().then(() => setStatus('playing')).catch(() => setStatus('playing'))
      })
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) {
          setStatus('error')
          setErrorMsg(data.details || 'Stream failed to load')
        }
      })
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari supports HLS natively
      video.src = url
      video.addEventListener('loadedmetadata', () => {
        video.play().then(() => setStatus('playing')).catch(() => setStatus('playing'))
      })
      video.addEventListener('error', () => {
        setStatus('error')
        setErrorMsg('Stream failed to load')
      })
    } else {
      // Non-HLS URL or unsupported — try direct playback
      video.src = url
      video.play().then(() => setStatus('playing')).catch(() => {
        setStatus('error')
        setErrorMsg('This stream format may not be playable in-browser. Try opening in VLC.')
      })
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
      video.removeAttribute('src')
      video.load()
    }
  }, [open, url])

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast({ title: 'Stream URL copied' })
    } catch { /* ignore */ }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[95vw] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-primary/10 to-transparent px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2.5 min-w-0">
            {status === 'playing' && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 shrink-0">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" /> LIVE
              </span>
            )}
            <DialogTitle className="text-sm font-semibold truncate">{name}</DialogTitle>
            {category && <Badge variant="secondary" className="text-[9px] shrink-0">{category}</Badge>}
            {viewers != null && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
                <Eye className="h-3 w-3" /> {viewers}
              </span>
            )}
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Video player */}
        <div className="relative bg-black aspect-video">
          <video
            ref={videoRef}
            className="w-full h-full"
            controls
            autoPlay
            playsInline
          />
          {status === 'loading' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-zinc-400">Loading stream…</p>
            </div>
          )}
          {status === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black p-6 text-center">
              <AlertCircle className="h-10 w-10 text-rose-500" />
              <div>
                <p className="text-sm font-medium text-zinc-200">Stream could not be played</p>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm">{errorMsg}</p>
              </div>
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => window.open(url, '_blank')}>
                  <ExternalLink className="h-3.5 w-3.5" /> Open in new tab
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={copyUrl}>
                  <Copy className="h-3.5 w-3.5" /> Copy URL for VLC
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer — URL bar */}
        <div className="px-5 py-3 border-t border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide shrink-0">Stream URL</span>
            <code className="flex-1 text-[11px] font-mono text-muted-foreground truncate">{url}</code>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 shrink-0" onClick={copyUrl} aria-label="Copy URL">
              <Copy className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" className="h-6 px-2 shrink-0 gap-1 text-[11px]" onClick={() => window.open(url, '_blank')}>
              <ExternalLink className="h-3 w-3" /> Open
            </Button>
          </div>
          <DialogDescription className="text-[10px] mt-1.5">
            If the stream doesn&apos;t play in-browser, copy the URL into VLC Media Player or IPTV Smarters.
          </DialogDescription>
        </div>
      </DialogContent>
    </Dialog>
  )
}
