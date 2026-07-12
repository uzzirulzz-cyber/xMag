'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Lock, User, Eye, EyeOff, Loader2, ShieldCheck, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

export function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const { toast } = useToast()
  const qc = useQueryClient()

  const mut = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.error || 'Login failed')
      return d
    },
    onSuccess: () => {
      toast({ title: 'Welcome back!', description: 'Logged in successfully.' })
      qc.invalidateQueries({ queryKey: ['overview'] })
      onSuccess()
    },
    onError: (e: Error) => toast({ title: 'Login failed', description: e.message, variant: 'destructive' }),
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    mut.mutate()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute top-1/4 left-1/3 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/3 h-96 w-96 rounded-full bg-red-600/20 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/magx-icon.png" alt="MaGx" className="h-16 w-16 mx-auto rounded-2xl ring-2 ring-primary/40 shadow-lg" />
          <h1 className="mt-4 text-3xl font-black tracking-tight">
            MaGx <span className="text-primary">World</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-1 uppercase tracking-widest">Super IPTV Panel</p>
        </div>

        <Card className="overflow-hidden">
          <div className="flex items-center gap-2.5 bg-gradient-to-r from-primary/10 to-transparent px-5 py-3 border-b border-border">
            <Lock className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Reseller Login</h2>
          </div>

          <form onSubmit={submit} className="p-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs">Username or Email</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="starreseller"
                  className="pl-9"
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Toggle password visibility"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full gap-2" disabled={mut.isPending}>
              {mut.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</>
              ) : (
                <>Sign In <ArrowRight className="h-4 w-4" /></>
              )}
            </Button>

            <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground flex gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Demo credentials</p>
                <p className="mt-0.5">Username: <code className="font-mono bg-muted px-1 rounded">starreseller</code></p>
                <p>Password: <code className="font-mono bg-muted px-1 rounded">magx2026</code></p>
              </div>
            </div>
          </form>
        </Card>

        <p className="text-center text-xs text-zinc-600 mt-6">
          © 2026 MaGx World Super IPTV · Enterprise Panel v2.4.1
        </p>
      </div>
    </div>
  )
}
