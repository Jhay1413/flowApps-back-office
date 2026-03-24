import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Search, Zap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { getAutomations, getOrganizations } from '@/api/admin.api'

const TRIGGER_COLORS: Record<string, string> = {
  WEBHOOK:  'bg-blue-500/15 text-blue-400',
  SCHEDULE: 'bg-amber-500/15 text-amber-400',
  EVENT:    'bg-purple-500/15 text-purple-400',
}

export function AutomationsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [orgId, setOrgId] = useState('')
  const [active, setActive] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'automations', page, debouncedSearch, orgId, active],
    queryFn: () => getAutomations(page, 25, debouncedSearch, orgId, active),
  })

  const { data: orgsData } = useQuery({
    queryKey: ['admin', 'organizations', 1, ''],
    queryFn: () => getOrganizations(1, 100),
  })

  const automations = data?.data?.data ?? []
  const totalPages  = data?.data?.totalPages ?? 1
  const activeCount = data?.data?.activeCount ?? 0
  const total       = data?.data?.total ?? 0
  const orgs        = orgsData?.data?.data ?? []

  function handleSearch(val: string) {
    setSearch(val)
    clearTimeout((window as typeof window & { _st?: ReturnType<typeof setTimeout> })._st)
    ;(window as typeof window & { _st?: ReturnType<typeof setTimeout> })._st = setTimeout(() => {
      setDebouncedSearch(val)
      setPage(1)
    }, 300)
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">Automations</h1>
          <p className="text-sm text-muted-foreground">
            {total} total · <span className="text-emerald-400 font-medium">{activeCount} active</span> across all organizations
          </p>
        </div>
        {/* Quick filter pills */}
        <div className="flex items-center gap-1.5">
          {[{ label: 'All', val: '' }, { label: 'Active', val: 'true' }, { label: 'Inactive', val: 'false' }].map((opt) => (
            <button
              key={opt.val}
              onClick={() => { setActive(opt.val); setPage(1) }}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                active === opt.val ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-foreground/30'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <select
          value={orgId}
          onChange={(e) => { setOrgId(e.target.value); setPage(1) }}
          className="h-9 rounded-md border border-border bg-input px-3 text-sm text-foreground"
        >
          <option value="">All Organizations</option>
          {orgs.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Automation</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Runs</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : automations.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center">
                        <Zap className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">No automations found</p>
                      </TableCell>
                    </TableRow>
                  )
                  : automations.map((auto) => (
                    <TableRow key={auto.id}>
                      <TableCell>
                        <p className="text-sm font-medium">{auto.name}</p>
                        {auto.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{auto.description}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{auto.organization.name}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TRIGGER_COLORS[auto.triggerType] ?? 'bg-muted text-muted-foreground'}`}>
                          {auto.triggerType}
                        </span>
                      </TableCell>
                      <TableCell>
                        {auto.isActive ? (
                          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                            Inactive
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{auto.logCount}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(auto.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Page {page} of {totalPages}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      </div>
    </div>
  )
}
