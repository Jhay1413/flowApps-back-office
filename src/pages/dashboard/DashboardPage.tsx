import { useQuery } from '@tanstack/react-query'
import { Building2, Users, CreditCard, TrendingUp, DollarSign, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getStats, getRevenue } from '@/api/admin.api'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'

const TIER_COLORS = {
  FREE: '#64748b',
  STARTER: '#3b82f6',
  GROWTH: '#8b5cf6',
  PRO: '#f59e0b',
}

function StatCard({
  title, value, sub, icon: Icon, loading,
}: {
  title: string; value: string | number; sub?: string; icon: React.ElementType; loading?: boolean
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
            {loading ? (
              <Skeleton className="mt-2 h-7 w-24" />
            ) : (
              <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
            )}
            {sub && !loading && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-4.5 w-4.5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const { data: statsRes, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => { const res = await getStats(); return res.data },
  })
  const { data: revenueRes, isLoading: revenueLoading } = useQuery({
    queryKey: ['admin', 'revenue'],
    queryFn: async () => { const res = await getRevenue(); return res.data },
  })

  const stats = statsRes?.data
  const revenue = revenueRes?.data

  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Platform overview and key metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Organizations" value={stats?.totalOrganizations ?? 0} icon={Building2} loading={statsLoading} sub={`+${stats?.newOrgsThisMonth ?? 0} this month`} />
        <StatCard title="Users" value={stats?.totalUsers ?? 0} icon={Users} loading={statsLoading} sub={`+${stats?.newUsersThisMonth ?? 0} this month`} />
        <StatCard title="Active Subs" value={stats?.activeSubscriptions ?? 0} icon={CreditCard} loading={statsLoading} />
        <StatCard title="Trialing" value={stats?.trialingSubscriptions ?? 0} icon={Activity} loading={statsLoading} />
        <StatCard title="MRR" value={stats ? fmtCurrency(stats.mrr) : '—'} icon={DollarSign} loading={statsLoading} />
        <StatCard title="ARR" value={stats ? fmtCurrency(stats.arr) : '—'} icon={TrendingUp} loading={statsLoading} />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* MRR trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">MRR Trend (12 months)</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={revenue?.monthly ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `₱${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }}
                    formatter={(v: number) => [fmtCurrency(v), 'MRR']}
                  />
                  <Line type="monotone" dataKey="mrr" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Tier breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={revenue?.tierBreakdown ?? []}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={75}
                    dataKey="count"
                    nameKey="tier"
                    paddingAngle={3}
                  >
                    {revenue?.tierBreakdown.map((entry) => (
                      <Cell key={entry.tier} fill={TIER_COLORS[entry.tier as keyof typeof TIER_COLORS] ?? '#64748b'} />
                    ))}
                  </Pie>
                  <Legend formatter={(v) => <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>{v}</span>} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* New subs / churn bar chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">New Subscriptions vs Churned (12 months)</CardTitle>
        </CardHeader>
        <CardContent>
          {revenueLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={revenue?.monthly ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }} />
                <Bar dataKey="newSubs" name="New" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                <Bar dataKey="churned" name="Churned" fill="hsl(var(--destructive))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
