import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { getRevenue, getStats } from '@/api/admin.api'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'

const TIER_COLORS: Record<string, string> = {
  FREE: '#64748b', STARTER: '#3b82f6', GROWTH: '#8b5cf6', PRO: '#f59e0b',
}

export function RevenuePage() {
  const { data: revenueRes, isLoading } = useQuery({
    queryKey: ['admin', 'revenue'],
    queryFn: async () => { const res = await getRevenue(); return res.data },
  })
  const { data: statsRes } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => { const res = await getStats(); return res.data },
  })

  const revenue = revenueRes?.data
  const stats = statsRes?.data

  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-bold">Revenue</h1>
        <p className="text-sm text-muted-foreground">Monthly recurring revenue and subscription breakdown</p>
      </div>

      {/* MRR / ARR summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'MRR', value: stats ? fmtCurrency(stats.mrr) : '—' },
          { label: 'ARR', value: stats ? fmtCurrency(stats.arr) : '—' },
          { label: 'Active Subs', value: stats?.activeSubscriptions ?? '—' },
          { label: 'Trialing', value: stats?.trialingSubscriptions ?? '—' },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{item.label}</p>
              <p className="mt-1 text-2xl font-bold">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* MRR area chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Monthly Recurring Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-52 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenue?.monthly ?? []}>
                <defs>
                  <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `₱${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }}
                  formatter={(v: number) => [fmtCurrency(v), 'MRR']}
                />
                <Area type="monotone" dataKey="mrr" stroke="hsl(var(--primary))" fill="url(#mrrGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Tier breakdown + new/churned */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <div className="space-y-3">
                {revenue?.tierBreakdown.map((item) => (
                  <div key={item.tier} className="flex items-center gap-3">
                    <div
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ background: TIER_COLORS[item.tier] ?? '#64748b' }}
                    />
                    <div className="flex flex-1 items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{item.tier}</span>
                        <Badge variant="secondary" className="text-xs">{item.count}</Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">{item.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-24 overflow-hidden rounded-full bg-muted h-1.5">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${item.percentage}%`, background: TIER_COLORS[item.tier] ?? '#64748b' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">New vs Churned Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={revenue?.monthly ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }} />
                  <Bar dataKey="newSubs" name="New" fill="hsl(var(--primary))" radius={[3,3,0,0]} />
                  <Bar dataKey="churned" name="Churned" fill="hsl(var(--destructive))" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
