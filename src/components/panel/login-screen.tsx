'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Lock, User, Eye, EyeOff, Loader2, ArrowRight, Mail, Phone, UserPlus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

export function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const { toast } = useToast()
  const qc = useQueryClient()

  const loginMut = useMutation({
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

  const signupMut = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, fullName, phone, password }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.error || 'Signup failed')
      return d
    },
    onSuccess: () => {
      toast({ title: 'Account created!', description: 'Welcome to MaGx World Super IPTV.' })
      qc.invalidateQueries({ queryKey: ['overview'] })
      onSuccess()
    },
    onError: (e: Error) => toast({ title: 'Sign up failed', description: e.message, variant: 'destructive' }),
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'login') loginMut.mutate()
    else signupMut.mutate()
  }

  const loading = loginMut.isPending || signupMut.isPending

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 relative overflow-hidden">
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
          {/* Mode tabs */}
          <div className="flex border-b border-border">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-3 text-sm font-medium transition-colors relative ${mode === 'login' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Sign In
              {mode === 'login' && <span className="absolute bottom-0 left-1/2 h-0.5 w-12 -translate-x-1/2 rounded-full bg-primary" />}
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 py-3 text-sm font-medium transition-colors relative ${mode === 'signup' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Create Account
              {mode === 'signup' && <span className="absolute bottom-0 left-1/2 h-0.5 w-12 -translate-x-1/2 rounded-full bg-primary" />}
            </button>
          </div>

          <form onSubmit={submit} className="p-5 space-y-4">
            {mode === 'signup' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-xs">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" className="pl-9" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="pl-9" required />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs">{mode === 'signup' ? 'Username' : 'Username or Email'}</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="starreseller" className="pl-9" autoFocus required />
              </div>
            </div>

            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs">Phone <span className="text-muted-foreground">(optional)</span></Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92 300 1234567" className="pl-9" />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-9 pr-10" required />
                <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Toggle password visibility">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {mode === 'signup' && <p className="text-[10px] text-muted-foreground">Minimum 6 characters</p>}
            </div>

            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {mode === 'signup' ? 'Creating account…' : 'Signing in…'}</>
              ) : mode === 'signup' ? (
                <><UserPlus className="h-4 w-4" /> Create Account <ArrowRight className="h-4 w-4" /></>
              ) : (
                <>Sign In <ArrowRight className="h-4 w-4" /></>
              )}
            </Button>

            {/* Social login */}
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">or continue with</span></div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <SocialBtn label="Google" onClick={() => toast({ title: 'Google OAuth', description: 'Configure GOOGLE_CLIENT_ID in .env to enable' })} />
              <SocialBtn label="Facebook" onClick={() => toast({ title: 'Facebook OAuth', description: 'Configure FACEBOOK_CLIENT_ID in .env to enable' })} />
              <SocialBtn label="X" onClick={() => toast({ title: 'X (Twitter) OAuth', description: 'Configure X_CLIENT_ID in .env to enable' })} />
              <SocialBtn label="TikTok" onClick={() => toast({ title: 'TikTok OAuth', description: 'Configure TIKTOK_CLIENT_ID in .env to enable' })} />
            </div>

            <div className="text-center text-xs">
              <button type="button" className="text-primary hover:underline" onClick={() => toast({ title: 'PayPal signup', description: 'Configure PAYPAL_CLIENT_ID in .env to enable' })}>
                Sign up with PayPal
              </button>
            </div>

            {mode === 'signup' && (
              <p className="text-center text-[11px] text-muted-foreground">
                Already have an account?{' '}
                <button type="button" className="text-primary hover:underline" onClick={() => setMode('login')}>
                  Sign in
                </button>
              </p>
            )}
          </form>
        </Card>

        <p className="text-center text-xs text-zinc-600 mt-6">
          © 2026 MaGx World Super IPTV · Enterprise Panel v2.4.1
        </p>
      </div>
    </div>
  )
}

function SocialBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex h-10 items-center justify-center rounded-lg border border-border bg-muted/30 text-xs font-medium hover:bg-muted transition-colors">
      {label}
    </button>
  )
}
