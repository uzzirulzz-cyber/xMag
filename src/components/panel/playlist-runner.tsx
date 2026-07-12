'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ListVideo,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  Play,
  Upload,
  Link2,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface PlaylistEntry {
  name: string
  url: string
}

interface ImportResult {
  name: string
  url: string
  status: 'success' | 'failed'
  imported: number
  error?: string
}

export function PlaylistRunner({ variant = 'user' }: { variant?: 'admin' | 'user' }) {
  const [playlists, setPlaylists] = useState<PlaylistEntry[]>([
    { name: '', url: '' },
  ])
  const [results, setResults] = useState<ImportResult[]>([])
  const [running, setRunning] = useState(false)
  const { toast } = useToast()
  const qc = useQueryClient()

  const addRow = () => setPlaylists([...playlists, { name: '', url: '' }])
  const removeRow = (i: number) => setPlaylists(playlists.filter((_, idx) => idx !== i))
  const updateRow = (i: number, field: 'name' | 'url', value: string) => {
    setPlaylists(playlists.map((p, idx) => idx === i ? { ...p, [field]: value } : p))
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result || '')
      // Parse .m3u file to extract playlist name + URLs (if it's a master playlist)
      // Or just set it as a single entry
      const lines = text.split('\n').filter(l => l.trim() && !l.startsWith('#'))
      if (lines.length > 1) {
        // Multiple URLs in file — add each
        const entries = lines.map((url, i) => ({
          name: file.name.replace('.m3u', '') + ` (${i + 1})`,
          url: url.trim(),
        }))
        setPlaylists([...playlists.filter(p => p.name || p.url), ...entries])
        toast({ title: `Loaded ${entries.length} playlists from file` })
      } else {
        setPlaylists([...playlists.filter(p => p.name || p.url), { name: file.name.replace('.m3u', ''), url: lines[0] || '' }])
        toast({ title: 'Playlist loaded from file' })
      }
    }
    reader.readAsText(file)
  }

  const runMut = useMutation({
    mutationFn: async () => {
      const valid = playlists.filter(p => p.url.trim())
      if (valid.length === 0) throw new Error('Add at least one playlist URL')
      const res = await fetch('/api/funds/import-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playlists: valid.map(p => ({
            name: p.name.trim() || 'Imported Playlist',
            url: p.url.trim(),
          })),
        }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.error || 'Import failed')
      return d
    },
    onSuccess: (d) => {
      setResults(d.results)
      setRunning(false)
      const success = d.results.filter((r: ImportResult) => r.status === 'success').length
      const failed = d.results.filter((r: ImportResult) => r.status === 'failed').length
      toast({
        title: `Import complete`,
        description: `${success} playlist(s) imported · ${d.totalImported} channels · ${failed} failed`,
      })
      qc.invalidateQueries({ queryKey: ['packages'] })
      qc.invalidateQueries({ queryKey: ['channels'] })
      qc.invalidateQueries({ queryKey: ['channel-stats'] })
    },
    onError: (e: Error) => {
      setRunning(false)
      toast({ title: 'Import failed', description: e.message, variant: 'destructive' })
    },
  })

  const run = () => {
    setRunning(true)
    setResults([])
    runMut.mutate()
  }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <ListVideo className="h-4 w-4 text-violet-600" />
        <h3 className="text-sm font-semibold">Playlist Runner</h3>
        <Badge variant="secondary" className="text-[10px] ml-auto">
          {variant === 'admin' ? 'Admin' : 'Reseller'}
        </Badge>
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        Import multiple M3U playlists at once. Paste URLs, upload a file, or add rows manually. Each playlist becomes a new package with playable channels.
      </p>

      {/* Playlist URL rows */}
      <div className="space-y-2 mb-3">
        {playlists.map((pl, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input
              placeholder="Playlist name (optional)"
              value={pl.name}
              onChange={(e) => updateRow(i, 'name', e.target.value)}
              className="h-8 text-xs w-36 shrink-0"
            />
            <div className="relative flex-1">
              <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder="https://example.com/playlist.m3u"
                value={pl.url}
                onChange={(e) => updateRow(i, 'url', e.target.value)}
                className="h-8 text-xs pl-7"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => playlists.length > 1 ? removeRow(i) : null}
              disabled={playlists.length === 1}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>

      {/* Add row + file upload */}
      <div className="flex gap-2 mb-4">
        <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={addRow}>
          <Plus className="h-3.5 w-3.5" /> Add Row
        </Button>
        <label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-3 h-8 text-xs font-medium hover:bg-muted/40 transition-colors">
          <Upload className="h-3.5 w-3.5" /> Load .m3u File
          <input type="file" accept=".m3u,.m3u8,text/plain" className="hidden" onChange={handleFile} />
        </label>
      </div>

      {/* Run button */}
      <Button className="w-full gap-2" disabled={running} onClick={run}>
        {running ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Importing playlists…</>
        ) : (
          <><Play className="h-4 w-4" /> Run Import ({playlists.filter(p => p.url.trim()).length} playlists)</>
        )}
      </Button>

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-4 space-y-1.5">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Import Results</p>
          {results.map((r, i) => (
            <div
              key={i}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs',
                r.status === 'success' ? 'bg-emerald-500/5 border border-emerald-500/20' : 'bg-rose-500/5 border border-rose-500/20',
              )}
            >
              {r.status === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{r.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {r.status === 'success' ? `${r.imported} channels imported` : r.error || 'Failed'}
                </p>
              </div>
              {r.status === 'success' && (
                <Badge className="bg-emerald-500/10 text-emerald-600 text-[9px]">{r.imported} ch</Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
