import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Shield, Lock, UserCog, Ban, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { authClient } from '@/lib/auth-client'

interface Props {
  userId: string
  currentName: string
  currentEmail: string
  currentRole: string | null
  isBanned: boolean
  banReason?: string | null
}

type ActionSection = 'info' | 'role' | 'password' | 'ban' | null

export function UserActionsCard({ userId, currentName, currentEmail, currentRole, isBanned, banReason }: Props) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState<ActionSection>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Edit info state
  const [name, setName] = useState(currentName)
  const [email, setEmail] = useState(currentEmail)

  // Password state
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Ban state
  const [reason, setReason] = useState(banReason ?? '')
  const [durationHours, setDurationHours] = useState('')

  function toggle(section: ActionSection) {
    setOpen(prev => prev === section ? null : section)
    setError(null)
    setSuccess(null)
  }

  async function wrap(fn: () => Promise<unknown>, successMsg: string) {
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fn() as any
      if (res?.error) throw new Error(res.error.message ?? 'Unknown error')
      setSuccess(successMsg)
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', userId] })
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateInfo() {
    await wrap(
      () => authClient.admin.updateUser({ userId, data: { name, email } }),
      'User info updated.'
    )
  }

  async function handleSetRole(role: 'user' | 'admin') {
    await wrap(
      () => authClient.admin.setRole({ userId, role }),
      `Role changed to ${role}.`
    )
  }

  async function handleSetPassword() {
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    await wrap(
      () => authClient.admin.setUserPassword({ userId, newPassword: password }),
      'Password updated.'
    )
    setPassword('')
    setConfirmPassword('')
  }

  async function handleBan() {
    const banExpiresIn = durationHours ? Number(durationHours) * 60 * 60 * 1000 : undefined
    await wrap(
      () => authClient.admin.banUser({ userId, banReason: reason || undefined, banExpiresIn }),
      'User banned.'
    )
  }

  async function handleUnban() {
    await wrap(
      () => authClient.admin.unbanUser({ userId }),
      'User unbanned.'
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Admin Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Feedback */}
        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs text-emerald-400">
            <CheckCircle className="h-3 w-3 shrink-0" /> {success}
          </div>
        )}

        {/* Edit Info */}
        <div className="rounded-lg border border-border">
          <button
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-left hover:bg-muted/40 transition-colors"
            onClick={() => toggle('info')}
          >
            <UserCog className="h-4 w-4 text-muted-foreground shrink-0" />
            Edit Info
          </button>
          {open === 'info' && (
            <div className="border-t border-border px-3 pb-3 pt-2.5 space-y-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Name</label>
                <Input value={name} onChange={e => setName(e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Email</label>
                <Input value={email} onChange={e => setEmail(e.target.value)} type="email" className="h-8 text-sm" />
              </div>
              <Button size="sm" className="w-full" onClick={handleUpdateInfo} disabled={loading}>
                {loading ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>

        {/* Change Role */}
        <div className="rounded-lg border border-border">
          <button
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-left hover:bg-muted/40 transition-colors"
            onClick={() => toggle('role')}
          >
            <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="flex-1">Change Role</span>
            <Badge variant="secondary" className="text-xs capitalize">{currentRole ?? 'user'}</Badge>
          </button>
          {open === 'role' && (
            <div className="border-t border-border px-3 pb-3 pt-2.5 space-y-2">
              <p className="text-xs text-muted-foreground">Select a new role for this user</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={currentRole === 'user' || !currentRole ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => handleSetRole('user')}
                  disabled={loading || currentRole === 'user' || !currentRole}
                >
                  User
                </Button>
                <Button
                  size="sm"
                  variant={currentRole === 'admin' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => handleSetRole('admin')}
                  disabled={loading || currentRole === 'admin'}
                >
                  Admin
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Set Password */}
        <div className="rounded-lg border border-border">
          <button
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-left hover:bg-muted/40 transition-colors"
            onClick={() => toggle('password')}
          >
            <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
            Set Password
          </button>
          {open === 'password' && (
            <div className="border-t border-border px-3 pb-3 pt-2.5 space-y-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">New Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Confirm Password</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <Button size="sm" className="w-full" onClick={handleSetPassword} disabled={loading}>
                {loading ? 'Updating…' : 'Set Password'}
              </Button>
            </div>
          )}
        </div>

        {/* Ban / Unban */}
        <div className="rounded-lg border border-border">
          <button
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-left hover:bg-muted/40 transition-colors"
            onClick={() => toggle('ban')}
          >
            <Ban className={`h-4 w-4 shrink-0 ${isBanned ? 'text-destructive' : 'text-muted-foreground'}`} />
            <span className="flex-1">{isBanned ? 'Unban User' : 'Ban User'}</span>
            {isBanned && <Badge variant="destructive" className="text-xs">Banned</Badge>}
          </button>
          {open === 'ban' && (
            <div className="border-t border-border px-3 pb-3 pt-2.5 space-y-2">
              {isBanned ? (
                <>
                  <p className="text-xs text-muted-foreground">Remove the ban from this user account.</p>
                  <Button size="sm" variant="outline" className="w-full" onClick={handleUnban} disabled={loading}>
                    {loading ? 'Processing…' : 'Confirm Unban'}
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Ban Reason (optional)</label>
                    <Input
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      placeholder="Reason for ban…"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Duration in hours (leave blank = permanent)</label>
                    <Input
                      type="number"
                      min="1"
                      value={durationHours}
                      onChange={e => setDurationHours(e.target.value)}
                      placeholder="e.g. 24"
                      className="h-8 text-sm"
                    />
                  </div>
                  <Button size="sm" variant="destructive" className="w-full" onClick={handleBan} disabled={loading}>
                    {loading ? 'Banning…' : 'Ban User'}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
