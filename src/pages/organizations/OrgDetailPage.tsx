import { useParams, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Building2, Users, Zap, BookOpen, CreditCard, Cpu, Mail, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getOrganizationDetail } from '@/api/admin.api'

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
const LEAD_STATUS_STYLE: Record<string, string> = {
  NEW: 'bg-blue-500/15 text-blue-400',
  CONTACTED: 'bg-purple-500/15 text-purple-400',
  REVIEW: 'bg-amber-500/15 text-amber-400',
  CONVERTED: 'bg-emerald-500/15 text-emerald-400',
  LOST: 'bg-zinc-500/15 text-zinc-400',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function StatTile({ label, value, icon: Icon }: { label: string; value: number | string; icon: React.ElementType }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />{label}
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

function fmtTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

export function OrgDetailPage() {
  const { orgId } = useParams({ from: '/_admin/organizations/$orgId' })
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'organizations', orgId],
    queryFn: async () => { const res = await getOrganizationDetail(orgId); return res.data },
  })

  const org = data?.data

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      </div>
    )
  }

  if (!org) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-20 text-muted-foreground">
        <Building2 className="h-10 w-10 opacity-30" />
        <p className="text-sm">Organization not found</p>
        <Button variant="outline" size="sm" onClick={() => navigate({ to: '/organizations' })}>Back to Organizations</Button>
      </div>
    )
  }

  const sub = org.subscription

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Back + header */}
      <div>
        <button
          onClick={() => navigate({ to: '/organizations' })}
          className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Organizations
        </button>

        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muted">
            {org.logo
              ? <img src={org.logo} className="h-14 w-14 rounded-xl object-cover" alt="" />
              : <Building2 className="h-7 w-7 text-muted-foreground" />}
          </div>
          <div>
            <h1 className="text-xl font-bold">{org.name}</h1>
            <p className="text-sm text-muted-foreground">/{org.slug}</p>
            <p className="text-xs text-muted-foreground">Created {new Date(org.createdAt).toLocaleDateString()}</p>
          </div>
          {sub && (
            <div className="ml-auto flex items-center gap-2">
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${TIER_STYLE[sub.tier] ?? ''}`}>{sub.tier}</span>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLE[sub.status] ?? ''}`}>{sub.status}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <StatTile label="Leads" value={org.stats.totalLeads} icon={Users} />
        <StatTile label="Members" value={org.stats.totalMembers} icon={Users} />
        <StatTile label="Automations" value={org.stats.totalAutomations} icon={Zap} />
        <StatTile label="KB Entries" value={org.stats.totalKbEntries} icon={BookOpen} />
        <StatTile label="AI Requests" value={org.stats.totalAiRequests.toLocaleString()} icon={Cpu} />
        <StatTile label="Tokens" value={fmtTokens(org.stats.totalTokensUsed)} icon={Cpu} />
      </div>

      {/* Lead status breakdown */}
      {Object.keys(org.stats.leadsByStatus).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(org.stats.leadsByStatus).map(([status, count]) => (
            <span key={status} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${LEAD_STATUS_STYLE[status] ?? 'bg-muted text-muted-foreground'}`}>
              {status} <span className="font-mono font-bold">{count}</span>
            </span>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Subscription */}
        <Section title="Subscription">
          {sub ? (
            <div className="space-y-0 divide-y divide-border/50">
              {[
                ['Plan', <span key="t" className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${TIER_STYLE[sub.tier] ?? ''}`}>{sub.tier}</span>],
                ['Status', <span key="s" className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[sub.status] ?? ''}`}>{sub.status}</span>],
                ['Period Start', new Date(sub.currentPeriodStart).toLocaleDateString()],
                ['Period End', new Date(sub.currentPeriodEnd).toLocaleDateString()],
                ['Cancel at End', sub.cancelAtPeriodEnd ? 'Yes' : 'No'],
                ['Payment', sub.paymentMethodBrand && sub.paymentMethodLast4 ? `${sub.paymentMethodBrand.toUpperCase()} ••••${sub.paymentMethodLast4}` : '—'],
                ['Stripe Customer', sub.stripeCustomerId ?? '—'],
                ['Stripe Sub', sub.stripeSubscriptionId ? sub.stripeSubscriptionId.slice(0, 22) + '…' : '—'],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex items-center justify-between py-2">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-xs">{value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No subscription</p>
          )}
        </Section>

        {/* Form Config */}
        <Section title="Lead Capture Form">
          {org.formConfig ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg border border-border" style={{ background: org.formConfig.accentColor }} />
                <div>
                  <p className="text-sm font-medium">{org.formConfig.title}</p>
                  <p className="text-xs text-muted-foreground">{org.formConfig.fieldCount} custom fields · accent {org.formConfig.accentColor}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No form configured</p>
          )}
        </Section>
      </div>

      {/* Members */}
      <Section title={`Members (${org.members.length})`}>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {org.members.map((m) => (
            <div
              key={m.id}
              className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2.5 hover:bg-muted/40 transition-colors"
              onClick={() => navigate({ to: '/users/$userId', params: { userId: m.user.id } })}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  {m.user.name[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="truncate text-sm font-medium">{m.user.name}</p>
                    {m.user.emailVerified
                      ? <CheckCircle className="h-3 w-3 shrink-0 text-emerald-400" />
                      : <XCircle className="h-3 w-3 shrink-0 text-muted-foreground/40" />}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{m.user.email}</p>
                </div>
              </div>
              <div className="ml-2 shrink-0 text-right">
                <Badge variant="secondary" className="text-xs capitalize">{m.role}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Recent Leads */}
      <Section title={`Recent Leads (showing ${org.recentLeads.length} of ${org.stats.totalLeads})`}>
        {org.recentLeads.length === 0 ? (
          <p className="text-sm text-muted-foreground">No leads yet</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {['Name', 'Source', 'Status', 'AI Score', 'Created'].map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {org.recentLeads.map((l) => (
                  <tr key={l.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                    <td className="px-3 py-2">
                      <p className="font-medium">{l.name}</p>
                      <p className="text-muted-foreground">{l.email}</p>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{l.source}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${LEAD_STATUS_STYLE[l.status] ?? ''}`}>{l.status}</span>
                    </td>
                    <td className="px-3 py-2 font-mono text-muted-foreground">{l.aiScore ?? '—'}</td>
                    <td className="px-3 py-2 text-muted-foreground">{new Date(l.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Automations */}
      {org.automations.length > 0 && (
        <Section title={`Automations (${org.automations.length})`}>
          <div className="space-y-2">
            {org.automations.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-2.5">
                <div className="flex items-center gap-2.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${a.isActive ? 'bg-emerald-400' : 'bg-muted-foreground/40'}`} />
                  <p className="text-sm font-medium">{a.name}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="rounded bg-muted px-2 py-0.5 font-medium">{a.triggerType}</span>
                  <span>{a.logCount} runs</span>
                  <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Knowledge Base */}
      {org.knowledgeBases.length > 0 && (
        <Section title={`Knowledge Base (${org.stats.totalKbEntries} entries)`}>
          <div className="grid gap-2 sm:grid-cols-2">
            {org.knowledgeBases.map((k) => (
              <div key={k.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2">
                <p className="text-sm">{k.title}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded bg-muted px-1.5 py-0.5">{k.type}</span>
                  <span>{new Date(k.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Pending Invitations */}
      {org.pendingInvitations.length > 0 && (
        <Section title={`Pending Invitations (${org.pendingInvitations.length})`}>
          <div className="space-y-2">
            {org.pendingInvitations.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-sm">{inv.email}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{inv.role ?? 'member'}</span>
                  <span>expires {new Date(inv.expiresAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}
