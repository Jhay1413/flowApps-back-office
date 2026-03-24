import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { CreditCard } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { getSubscriptions } from '@/api/admin.api'

const TIERS = ['', 'FREE', 'STARTER', 'GROWTH', 'PRO']
const STATUSES = ['', 'TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED']

function tierVariant(tier: string) {
  if (tier === 'PRO') return 'warning'
  if (tier === 'GROWTH') return 'info'
  if (tier === 'STARTER') return 'success'
  return 'secondary'
}

function statusVariant(status: string) {
  if (status === 'ACTIVE') return 'success'
  if (status === 'TRIALING') return 'info'
  if (status === 'PAST_DUE') return 'warning'
  if (status === 'CANCELLED') return 'secondary'
  return 'secondary'
}

export function SubscriptionsPage() {
  const [page, setPage] = useState(1)
  const [tier, setTier] = useState('')
  const [status, setStatus] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'subscriptions', page, tier, status],
    queryFn: async () => { const res = await getSubscriptions(page, 20, tier, status); return res.data },
  })

  const subs = data?.data ?? []
  const totalPages = data?.totalPages ?? 1

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Subscriptions</h1>
          <p className="text-sm text-muted-foreground">{data?.total ?? 0} total</p>
        </div>
        {/* Filters */}
        <div className="flex items-center gap-2">
          <select
            value={tier}
            onChange={(e) => { setTier(e.target.value); setPage(1) }}
            className="h-9 rounded-md border border-border bg-input px-3 text-sm text-foreground"
          >
            {TIERS.map(t => <option key={t} value={t}>{t || 'All Tiers'}</option>)}
          </select>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1) }}
            className="h-9 rounded-md border border-border bg-input px-3 text-sm text-foreground"
          >
            {STATUSES.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
          </select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Period End</TableHead>
                <TableHead>Cancel at End</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Stripe Sub</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : subs.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm font-medium">{sub.organizationName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={tierVariant(sub.tier) as 'warning'}>{sub.tier}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(sub.status) as 'success'}>{sub.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-xs">
                        {sub.cancelAtPeriodEnd
                          ? <span className="text-amber-400">Yes</span>
                          : <span className="text-muted-foreground">No</span>}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {sub.paymentMethodBrand && sub.paymentMethodLast4
                          ? `${sub.paymentMethodBrand.toUpperCase()} ••••${sub.paymentMethodLast4}`
                          : '—'}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {sub.stripeSubscriptionId
                          ? sub.stripeSubscriptionId.slice(0, 14) + '...'
                          : '—'}
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
