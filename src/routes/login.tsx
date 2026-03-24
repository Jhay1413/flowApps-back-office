import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { useState } from 'react'
import { Shield, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { FlowOpsLogo } from '@/components/FlowOpsLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authClient } from '@/lib/auth-client'

export const Route = createFileRoute('/login')({
  validateSearch: (s: Record<string, unknown>) => ({
    error: typeof s['error'] === 'string' ? s['error'] : undefined,
  }),
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const { error: queryError } = useSearch({ from: '/login' })

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string>(
    queryError === 'forbidden' ? 'Your account does not have admin access.' : '',
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await authClient.signIn.email({ email, password })

      if (result.error) {
        setError(result.error.message ?? 'Invalid email or password.')
        return
      }

      if (result.data?.user?.role !== 'admin') {
        await authClient.signOut()
        setError('Your account does not have admin access.')
        return
      }

      navigate({ to: '/dashboard' })
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <FlowOpsLogo size="xl" />
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Shield className="h-3 w-3 text-primary" />
              <span className="text-xs text-primary font-semibold tracking-widest uppercase">Admin Console</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 shadow-lg space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-foreground">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-foreground">Password</label>
            <div className="relative">
              <Input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading || !email || !password}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Restricted access. Authorized personnel only.
        </p>
      </div>
    </div>
  )
}
