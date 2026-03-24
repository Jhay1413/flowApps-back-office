import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Clock, CheckCircle, XCircle, Smartphone, CreditCard, Receipt } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { getManualPayments, type AdminManualPaymentStatus, type AdminManualPaymentMethod } from '@/api/admin.api'

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<AdminManualPaymentStatus, { label: string; icon: React.ElementType; cls: string }> = {
  PENDING:  { label: 'Pending',  icon: Clock,        cls: 'bg-amber-500/15 text-amber-400' },
  APPROVED: { label: 'Approved', icon: CheckCircle,  cls: 'bg-emerald-500/15 text-emerald-400' },
  REJECTED: { label: 'Rejected', icon: XCircle,      cls: 'bg-red-500/15 text-red-400' },
}

const METHOD_ICON: Record<AdminManualPaymentMethod, React.ElementType> = {
  GCASH:  Smartphone,
  GOTYME: CreditCard,
}

const STATUSES: (AdminManualPaymentStatus | '')[] = ['', 'PENDING', 'APPROVED', 'REJECTED']

function formatPHP(cents: number) {
  return '₱' + (cents / 100).toLocaleString('en-PH', { minimumFractionDigits: 0 })
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PaymentsPage() {
  const navigate = useNavigate()
  const [page, setPage]       = useState(1)
  const [status, setStatus]   = useState<AdminManualPaymentStatus | ''>('')
  const [method, setMethod]   = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'manual-payments', page, status, method],
    queryFn: async () => { const res = await getManualPayments(page, 25, status, method); return res.data },
  })

  const payments    = data?.data?.data ?? []
  const totalPages  = data?.data?.totalPages ?? 1
  const pendingCount = data?.data?.pendingCount ?? 0
  const total       = data?.data?.total ?? 0

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">Manual Payments</h1>
          <p className="text-sm text-muted-foreground">{total} total · {pendingCount} pending review</p>
        </div>
      </div>

      {/* Status pills */}
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => {
          const cfg = s ? STATUS_CONFIG[s] : null
          return (
            <button
              key={s ?? 'all'}
              onClick={() => { setStatus(s); setPage(1) }}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                status === s
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-foreground/30'
              }`}
            >
              {cfg && <cfg.icon className="h-3 w-3" />}
              {s || 'All'}
            </button>
          )
        })}

        {/* Method filter */}
        <select
          value={method}
          onChange={(e) => { setMethod(e.target.value); setPage(1) }}
          className="ml-auto h-7 rounded-full border border-border bg-input px-3 text-xs text-foreground"
        >
          <option value="">All Methods</option>
          <option value="GCASH">GCash</option>
          <option value="GOTYME">GoTyme Bank</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : payments.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center">
                        <Receipt className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">No payments found</p>
                      </TableCell>
                    </TableRow>
                  )
                  : payments.map((p) => {
                      const cfg = STATUS_CONFIG[p.status]
                      const StatusIcon = cfg.icon
                      const MethodIcon = METHOD_ICON[p.paymentMethod]
                      return (
                        <TableRow
                          key={p.id}
                          className="cursor-pointer hover:bg-muted/40"
                          onClick={() => navigate({ to: '/payments/$paymentId', params: { paymentId: p.id } })}
                        >
                          <TableCell>
                            <p className="text-sm font-medium">{p.organization.name}</p>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <MethodIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-sm">{p.paymentMethod === 'GCASH' ? 'GCash' : 'GoTyme'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">{p.tier}</Badge>
                          </TableCell>
                          <TableCell className="text-sm font-medium">{formatPHP(p.amount)}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {p.referenceNumber ?? '—'}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.cls}`}>
                              <StatusIcon className="h-3 w-3" />
                              {cfg.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(p.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      )
                    })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Page {page} of {totalPages}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </div>
    </div>
  )
}
