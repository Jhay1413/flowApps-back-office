import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Cpu, Zap, DollarSign, ActivitySquare } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getAiUsage } from '@/api/admin.api'

function fmtTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

function fmtUsd(n: number) {
  return `$${n.toFixed(4)}`
}

export function AiUsagePage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'ai-usage', page],
    queryFn: () => getAiUsage(page),
  })

  const d = data?.data?.data
  const byOrg = d?.byOrg ?? []
  const recentLogs = d?.recentLogs ?? []
  const totalPages = d?.totalPages ?? 1

  // Top 10 orgs for bar chart
  const chartData = byOrg.slice(0, 10).map((o) => ({
    name: o.organizationName.length > 14 ? o.organizationName.slice(0, 14) + '…' : o.organizationName,
    tokens: o.tokensUsed,
  }))

  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <h1 className="text-xl font-bold">AI Usage</h1>
        <p className="text-sm text-muted-foreground">Token consumption and cost estimates across all organizations (last 30 days for per-org data)</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total AI Requests', value: isLoading ? null : (d?.totalLogs ?? 0).toLocaleString(), icon: ActivitySquare },
          { label: 'Tokens All-Time',   value: isLoading ? null : fmtTokens(d?.totalTokensAllTime ?? 0),  icon: Zap },
          { label: 'Tokens (30 days)',  value: isLoading ? null : fmtTokens(byOrg.reduce((s, o) => s + o.tokensUsed, 0)), icon: Cpu },
          { label: 'Est. Cost (30d)',   value: isLoading ? null : fmtUsd(byOrg.reduce((s, o) => s + o.estimatedCostUsd, 0)), icon: DollarSign },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
                  {value === null ? (
                    <Skeleton className="mt-2 h-7 w-20" />
                  ) : (
                    <p className="mt-1 text-2xl font-bold">{value}</p>
                  )}
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bar chart: top orgs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Top Organizations by Token Usage (30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : chartData.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No AI usage data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => fmtTokens(v)} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={110} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }}
                  formatter={(v: number) => [fmtTokens(v), 'Tokens']}
                />
                <Bar dataKey="tokens" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Per-org table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Per-Organization Breakdown (30 days)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead className="text-right">Requests</TableHead>
                <TableHead className="text-right">Tokens Used</TableHead>
                <TableHead className="text-right">Est. Cost (USD)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 4 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : byOrg.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                        No AI requests in the last 30 days
                      </TableCell>
                    </TableRow>
                  )
                  : byOrg.map((org) => (
                    <TableRow key={org.organizationId}>
                      <TableCell className="text-sm font-medium">{org.organizationName}</TableCell>
                      <TableCell className="text-right text-sm">{org.requestCount.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{fmtTokens(org.tokensUsed)}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground">{fmtUsd(org.estimatedCostUsd)}</TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent log entries */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Recent AI Requests</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Lead</TableHead>
                <TableHead>Model</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : recentLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">{log.organization.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.lead?.name ?? <span className="text-muted-foreground/40">—</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-xs">{log.model}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{log.tokensUsed.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Page {page} of {totalPages} (recent requests)</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      </div>
    </div>
  )
}
