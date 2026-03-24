import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Rocket, CalendarCheck, Clock, X, Eye, EyeOff } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import {
  getAccessRequests,
  updateAccessRequestStatus,
  provisionAccessRequestUser,
  type AccessRequestStatus,
  type AdminAccessRequest,
} from '@/api/admin.api'

const TYPES    = ['', 'EARLY_ACCESS', 'DEMO']
const STATUSES = ['', 'PENDING', 'CONTACTED', 'REJECTED']

function typeLabel(type: string) {
  return type === 'EARLY_ACCESS' ? 'Early Access' : 'Demo'
}

function typeVariant(type: string) {
  return type === 'EARLY_ACCESS' ? 'default' : 'info'
}

function statusVariant(status: string) {
  if (status === 'CONTACTED') return 'success'
  if (status === 'REJECTED')  return 'secondary'
  return 'warning'
}

// ─── Demo Modal ───────────────────────────────────────────────────────────────

function DemoModal({ row, onClose }: { row: AdminAccessRequest; onClose: () => void }) {
  const qc = useQueryClient()
  const [status, setStatus]   = useState<AccessRequestStatus>(row.status)
  const [note, setNote]       = useState(row.adminNote ?? '')
  const [error, setError]     = useState('')

  const mutation = useMutation({
    mutationFn: () => updateAccessRequestStatus(row.id, status, note || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'access-requests'] })
      onClose()
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to update status'
      setError(msg)
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-lg rounded-xl bg-card border border-border shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Badge variant="info">Demo Request</Badge>
            <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Details */}
        <div className="px-6 py-4 space-y-3">
          <div className="grid grid-cols-[100px_1fr] gap-y-2.5 text-sm">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{row.name}</span>
            <span className="text-muted-foreground">Email</span>
            <span>{row.email}</span>
            {row.company && (
              <>
                <span className="text-muted-foreground">Company</span>
                <span>{row.company}</span>
              </>
            )}
            {row.message && (
              <>
                <span className="text-muted-foreground">Message</span>
                <span className="text-muted-foreground">{row.message}</span>
              </>
            )}
            <span className="text-muted-foreground">Submitted</span>
            <span className="text-muted-foreground">{new Date(row.createdAt).toLocaleString()}</span>
          </div>

          <hr className="border-border" />

          {/* Status update */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Update Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AccessRequestStatus)}
              className="w-full h-9 rounded-md border border-border bg-input px-3 text-sm text-foreground"
            >
              {(['PENDING', 'CONTACTED', 'REJECTED'] as AccessRequestStatus[]).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Admin note (optional)"
              rows={2}
              className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none"
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Early Access Modal ────────────────────────────────────────────────────────

function EarlyAccessModal({ row, onClose }: { row: AdminAccessRequest; onClose: () => void }) {
  const qc = useQueryClient()
  const [name, setName]         = useState(row.name)
  const [email, setEmail]       = useState(row.email)
  const [password, setPassword] = useState('')
  const [orgName, setOrgName]   = useState(row.company ?? '')
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState('')
  const [done, setDone]         = useState(false)
  const [result, setResult]     = useState<{ userId: string; organizationId: string } | null>(null)

  const provision = useMutation({
    mutationFn: () => provisionAccessRequestUser(row.id, {
      name:             name.trim(),
      email:            email.trim().toLowerCase(),
      password:         password.trim(),
      organizationName: orgName.trim(),
    }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['admin', 'access-requests'] })
      setResult(res.data.data)
      setDone(true)
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Provisioning failed'
      setError(msg)
    },
  })

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-md rounded-xl bg-card border border-border shadow-xl">
          <div className="p-8 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500/15">
              <Rocket className="h-6 w-6 text-green-400" />
            </div>
            <h2 className="text-lg font-bold">Account Created!</h2>
            <p className="text-sm text-muted-foreground">
              The account has been provisioned and welcome email with credentials has been sent to <strong>{email}</strong>.
            </p>
            {result && (
              <div className="rounded-lg bg-muted/50 p-3 text-xs text-left space-y-1">
                <p><span className="text-muted-foreground">User ID:</span> <code>{result.userId}</code></p>
                <p><span className="text-muted-foreground">Org ID:</span> <code>{result.organizationId}</code></p>
              </div>
            )}
            <Button onClick={onClose} className="w-full">Done</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-lg rounded-xl bg-card border border-border shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Badge variant="default">Early Access</Badge>
            <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Request details */}
        <div className="px-6 pt-4 pb-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Request Info</p>
          <div className="grid grid-cols-[100px_1fr] gap-y-2 text-sm">
            <span className="text-muted-foreground">Email</span>
            <span>{row.email}</span>
            {row.company && (
              <>
                <span className="text-muted-foreground">Company</span>
                <span>{row.company}</span>
              </>
            )}
            {row.message && (
              <>
                <span className="text-muted-foreground">Message</span>
                <span className="text-muted-foreground text-xs">{row.message}</span>
              </>
            )}
            <span className="text-muted-foreground">Submitted</span>
            <span className="text-muted-foreground">{new Date(row.createdAt).toLocaleString()}</span>
          </div>
        </div>

        <hr className="border-border mx-6 my-3" />

        {/* Provision form */}
        <div className="px-6 pb-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Provision Account</p>

          <div className="space-y-2">
            <label className="text-sm font-medium">Full Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-9 rounded-md border border-border bg-input px-3 text-sm text-foreground"
              placeholder="Full name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="w-full h-9 rounded-md border border-border bg-input px-3 text-sm text-foreground"
              placeholder="email@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Temporary Password</label>
            <div className="relative">
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPass ? 'text' : 'password'}
                className="w-full h-9 rounded-md border border-border bg-input px-3 pr-9 text-sm text-foreground"
                placeholder="Set a temporary password"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Organization Name</label>
            <input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full h-9 rounded-md border border-border bg-input px-3 text-sm text-foreground"
              placeholder="Company / organization name"
            />
          </div>

          <p className="text-[11px] text-muted-foreground">
            This will create the user account, organization, and a 14-day Growth trial, then send the credentials to their email.
          </p>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            onClick={() => { setError(''); provision.mutate() }}
            disabled={provision.isPending || !name.trim() || !email.trim() || !password.trim() || !orgName.trim()}
          >
            {provision.isPending ? 'Creating…' : 'Create Account & Send Credentials'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export function AccessRequestsPage() {
  const [page, setPage]     = useState(1)
  const [type, setType]     = useState('')
  const [status, setStatus] = useState('')
  const [selected, setSelected] = useState<AdminAccessRequest | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'access-requests', page, type, status],
    queryFn: async () => {
      const res = await getAccessRequests(page, 25, type, status)
      return res.data
    },
  })

  const rows       = data?.data ?? []
  const total      = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  const earlyAccessCount = rows.filter((r) => r.type === 'EARLY_ACCESS').length
  const demoCount        = rows.filter((r) => r.type === 'DEMO').length
  const pendingCount     = rows.filter((r) => r.status === 'PENDING').length

  return (
    <>
      {/* Modals */}
      {selected?.type === 'DEMO' && (
        <DemoModal row={selected} onClose={() => setSelected(null)} />
      )}
      {selected?.type === 'EARLY_ACCESS' && (
        <EarlyAccessModal row={selected} onClose={() => setSelected(null)} />
      )}

      <div className="flex flex-col gap-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Access Requests</h1>
            <p className="text-sm text-muted-foreground">{total} total requests</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={type}
              onChange={(e) => { setType(e.target.value); setPage(1) }}
              className="h-9 rounded-md border border-border bg-input px-3 text-sm text-foreground"
            >
              {TYPES.map((t) => <option key={t} value={t}>{t ? typeLabel(t) : 'All Types'}</option>)}
            </select>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1) }}
              className="h-9 rounded-md border border-border bg-input px-3 text-sm text-foreground"
            >
              {STATUSES.map((s) => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
            </select>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/15">
                <Rocket className="h-4 w-4 text-violet-400" />
              </div>
              <div>
                <p className="text-xl font-bold">{isLoading ? '—' : earlyAccessCount}</p>
                <p className="text-xs text-muted-foreground">Early Access</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/15">
                <CalendarCheck className="h-4 w-4 text-sky-400" />
              </div>
              <div>
                <p className="text-xl font-bold">{isLoading ? '—' : demoCount}</p>
                <p className="text-xs text-muted-foreground">Demo Requests</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15">
                <Clock className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <p className="text-xl font-bold">{isLoading ? '—' : pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  : rows.length === 0
                    ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-12 text-center text-muted-foreground text-sm">
                          No requests found.
                        </TableCell>
                      </TableRow>
                    )
                    : rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setSelected(row)}
                      >
                        <TableCell>
                          <Badge variant={typeVariant(row.type)}>{typeLabel(row.type)}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell className="text-muted-foreground">{row.email}</TableCell>
                        <TableCell className="text-muted-foreground">{row.company ?? '—'}</TableCell>
                        <TableCell className="max-w-50">
                          {row.message
                            ? <span className="text-xs text-muted-foreground line-clamp-2">{row.message}</span>
                            : <span className="text-muted-foreground/40 text-xs">—</span>}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
                          {row.adminNote && (
                            <p className="mt-1 text-[11px] text-muted-foreground italic">{row.adminNote}</p>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(row.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm">
            <p className="text-muted-foreground">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={(e) => { e.stopPropagation(); setPage((p) => p - 1) }}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={(e) => { e.stopPropagation(); setPage((p) => p + 1) }}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
