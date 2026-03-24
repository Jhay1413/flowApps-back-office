import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Search, Building2, Users, UserRound, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { getOrganizations } from '@/api/admin.api'
import type { AdminOrg } from '@/api/admin.api'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TIER_STYLE: Record<string, string> = {
  PRO:     'bg-amber-500/15 text-amber-400 border-amber-500/20',
  GROWTH:  'bg-blue-500/15 text-blue-400 border-blue-500/20',
  STARTER: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  FREE:    'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
}

const STATUS_STYLE: Record<string, string> = {
  ACTIVE:    'bg-emerald-500/15 text-emerald-400',
  TRIALING:  'bg-blue-500/15 text-blue-400',
  PAST_DUE:  'bg-amber-500/15 text-amber-400',
  CANCELLED: 'bg-zinc-500/15 text-zinc-400',
}

function Pill({ label, style }: { label: string; style: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${style}`}>
      {label}
    </span>
  )
}

// ─── Row ─────────────────────────────────────────────────────────────────────

function OrgRow({ org, onClick }: { org: AdminOrg; onClick: () => void }) {
  const sub = org.subscription

  return (
    <TableRow className="cursor-pointer hover:bg-muted/40" onClick={onClick}>
      <TableCell>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{org.name}</p>
            <p className="truncate text-xs text-muted-foreground">/{org.slug}</p>
          </div>
        </div>
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-1 text-sm text-foreground">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          {org.memberCount}
        </div>
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-1 text-sm text-foreground">
          <UserRound className="h-3.5 w-3.5 text-muted-foreground" />
          {org.leadCount}
        </div>
      </TableCell>

      <TableCell>
        {sub
          ? <Pill label={sub.tier} style={TIER_STYLE[sub.tier] ?? TIER_STYLE.FREE} />
          : <span className="text-xs text-muted-foreground/40">—</span>}
      </TableCell>

      <TableCell>
        {sub
          ? <Pill label={sub.status} style={STATUS_STYLE[sub.status] ?? ''} />
          : <span className="text-xs text-muted-foreground/40">—</span>}
      </TableCell>

      <TableCell className="text-xs text-muted-foreground">
        {sub ? new Date(sub.currentPeriodEnd).toLocaleDateString() : '—'}
      </TableCell>

      <TableCell className="text-xs text-muted-foreground">
        {new Date(org.createdAt).toLocaleDateString()}
      </TableCell>
    </TableRow>
  )
}

// ─── Skeleton rows ────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </TableCell>
          {Array.from({ length: 6 }).map((_, j) => (
            <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function OrganizationsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [inputValue, setInputValue] = useState('')

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'organizations', page, search],
    queryFn: async () => {
      const res = await getOrganizations(page, 20, search)
      return res.data          // unwrap Axios → { success, data, total, page, totalPages }
    },
    placeholderData: (prev) => prev,
  })

  const orgs       = data?.data       ?? []
  const total      = data?.total      ?? 0
  const totalPages = data?.totalPages ?? 1

  // Debounced search
  function handleSearch(val: string) {
    setInputValue(val)
    clearTimeout((window as typeof window & { _ot?: ReturnType<typeof setTimeout> })._ot)
    ;(window as typeof window & { _ot?: ReturnType<typeof setTimeout> })._ot = setTimeout(() => {
      setSearch(val)
      setPage(1)
    }, 350)
  }

  return (
    <div className="flex flex-col gap-4 p-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Organizations</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? 'Loading…' : `${total} organization${total !== 1 ? 's' : ''} on the platform`}
          </p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or slug…"
            value={inputValue}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Error banner */}
      {isError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Failed to load organizations — {(error as Error)?.message ?? 'unknown error'}
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-64">Organization</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Leads</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Period End</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <SkeletonRows />
              ) : orgs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-16 text-center">
                    <Building2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/20" />
                    <p className="text-sm font-medium text-muted-foreground">
                      {search ? `No organizations matching "${search}"` : 'No organizations yet'}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                orgs.map((org) => <OrgRow key={org.id} org={org} onClick={() => navigate({ to: '/organizations/$orgId', params: { orgId: org.id } })} />)
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page} of {totalPages} · {total} total
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

    </div>
  )
}
