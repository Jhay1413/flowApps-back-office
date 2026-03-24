import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Search, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { getLeads, getOrganizations } from '@/api/admin.api'

const STATUS_STYLES: Record<string, string> = {
  NEW:       'bg-blue-500/15 text-blue-400',
  CONTACTED: 'bg-purple-500/15 text-purple-400',
  REVIEW:    'bg-amber-500/15 text-amber-400',
  CONVERTED: 'bg-emerald-500/15 text-emerald-400',
  LOST:      'bg-zinc-500/15 text-zinc-400',
}

const STATUSES = ['', 'NEW', 'CONTACTED', 'REVIEW', 'CONVERTED', 'LOST']

export function LeadsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [orgId, setOrgId] = useState('')
  const [status, setStatus] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'leads', page, debouncedSearch, orgId, status],
    queryFn: async () => { const res = await getLeads(page, 25, debouncedSearch, orgId, status); return res.data },
  })

  const { data: orgsData } = useQuery({
    queryKey: ['admin', 'organizations', 1, ''],
    queryFn: async () => { const res = await getOrganizations(1, 100); return res.data },
  })

  const leads = data?.data ?? []
  const totalPages = data?.totalPages ?? 1
  const statusCounts = data?.statusCounts ?? {}
  const orgs = orgsData?.data ?? []

  function handleSearch(val: string) {
    setSearch(val)
    clearTimeout((window as typeof window & { _st?: ReturnType<typeof setTimeout> })._st)
    ;(window as typeof window & { _st?: ReturnType<typeof setTimeout> })._st = setTimeout(() => {
      setDebouncedSearch(val)
      setPage(1)
    }, 300)
  }

  const totalLeads = Object.values(statusCounts).reduce((s, n) => s + n, 0)

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">Leads</h1>
          <p className="text-sm text-muted-foreground">{data?.data?.total ?? 0} total across all organizations</p>
        </div>
      </div>

      {/* Status summary pills */}
      <div className="flex flex-wrap gap-2">
        {STATUSES.filter(Boolean).map((s) => (
          <button
            key={s}
            onClick={() => { setStatus(status === s ? '' : s); setPage(1) }}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              status === s ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-foreground/30'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${STATUS_STYLES[s]?.split(' ')[0].replace('/15', '')}`} />
            {s}
            <span className="ml-0.5 font-mono">{statusCounts[s] ?? 0}</span>
          </button>
        ))}
        <button
          onClick={() => { setStatus(''); setPage(1) }}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            !status ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-foreground/30'
          }`}
        >
          All · {totalLeads}
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
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
                <TableHead>Lead</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>AI Score</TableHead>
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
                : leads.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center">
                        <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">No leads found</p>
                      </TableCell>
                    </TableRow>
                  )
                  : leads.map((lead) => (
                    <TableRow
                      key={lead.id}
                      className="cursor-pointer hover:bg-muted/40"
                      onClick={() => navigate({ to: '/leads/$leadId', params: { leadId: lead.id } })}
                    >
                      <TableCell>
                        <p className="text-sm font-medium">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">{lead.email}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{lead.organization.name}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{lead.source}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[lead.status] ?? ''}`}>
                          {lead.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {lead.aiScore ? (
                          <span className="text-xs font-mono text-muted-foreground">{lead.aiScore}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(lead.createdAt).toLocaleDateString()}
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
