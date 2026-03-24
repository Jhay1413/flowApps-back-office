import { useParams, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, UserCircle, Building2, Monitor, Key, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getUserDetail } from '@/api/admin.api'
import { UserActionsCard } from './UserActionsCard'

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

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/50 py-2 last:border-0">
      <span className="w-32 shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="text-right text-xs text-foreground break-all">{children}</span>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

export function UserDetailPage() {
  const { userId } = useParams({ from: '/_admin/users/$userId' })
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', userId],
    queryFn: async () => { const res = await getUserDetail(userId); return res.data },
  })

  const user = data?.data

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-5 w-28" />
        <div className="flex gap-6">
          <div className="flex w-72 shrink-0 flex-col gap-4">
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="flex flex-1 flex-col gap-4">
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
            </div>
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-20 text-muted-foreground">
        <UserCircle className="h-10 w-10 opacity-30" />
        <p className="text-sm">User not found</p>
        <Button variant="outline" size="sm" onClick={() => navigate({ to: '/users' })}>Back to Users</Button>
      </div>
    )
  }

  const activeSessions = user.sessions.filter(s => new Date(s.expiresAt) > new Date()).length

  return (
    <div className="flex flex-col gap-5 p-6">
      {/* Back */}
      <button
        onClick={() => navigate({ to: '/users' })}
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Users
      </button>

      {/* Two-column layout */}
      <div className="flex gap-6 items-start">

        {/* LEFT SIDEBAR */}
        <div className="flex w-72 shrink-0 flex-col gap-4">

          {/* Profile card */}
          <Card>
            <CardContent className="pt-5 flex flex-col items-center text-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted ring-2 ring-border">
                {user.image
                  ? <img src={user.image} className="h-16 w-16 rounded-full object-cover" alt="" />
                  : <UserCircle className="h-9 w-9 text-muted-foreground" />}
              </div>
              <div>
                <h1 className="text-base font-bold leading-tight">{user.name}</h1>
                <p className="mt-0.5 text-xs text-muted-foreground break-all">{user.email}</p>
              </div>
              <div className="flex flex-wrap justify-center gap-1.5">
                {user.role === 'admin' && (
                  <Badge className="bg-primary/15 text-primary border-primary/20 text-xs">Admin</Badge>
                )}
                {user.banned && <Badge variant="destructive" className="text-xs">Banned</Badge>}
                <Badge variant="secondary" className="text-xs">
                  {user.emailVerified
                    ? <><CheckCircle className="mr-1 h-3 w-3 text-emerald-400 inline" />Verified</>
                    : <><XCircle className="mr-1 h-3 w-3 text-destructive inline" />Unverified</>}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Section title="Account Info">
            <InfoRow label="User ID"><span className="font-mono text-[10px]">{user.id}</span></InfoRow>
            <InfoRow label="Role">{user.role ?? <span className="text-muted-foreground/50">—</span>}</InfoRow>
            <InfoRow label="Joined">{new Date(user.createdAt).toLocaleDateString()}</InfoRow>
            <InfoRow label="Updated">{new Date(user.updatedAt).toLocaleDateString()}</InfoRow>
            {user.banned && <>
              <InfoRow label="Ban Reason">{user.banReason ?? '—'}</InfoRow>
              <InfoRow label="Ban Expires">{user.banExpires ? new Date(user.banExpires).toLocaleDateString() : 'Permanent'}</InfoRow>
            </>}
          </Section>

          {/* Auth Providers */}
          <Section title="Auth Providers">
            {user.accounts.length === 0
              ? <p className="text-xs text-muted-foreground">No linked providers</p>
              : user.accounts.map((acc) => (
                  <div key={acc.id} className="flex items-center justify-between border-b border-border/50 py-2 last:border-0">
                    <div className="flex items-center gap-2">
                      <Key className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs capitalize font-medium">{acc.provider}</span>
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground">{acc.accountId.slice(0, 14)}…</span>
                  </div>
                ))}
          </Section>

          {/* Admin Actions */}
          <UserActionsCard
            userId={user.id}
            currentName={user.name}
            currentEmail={user.email}
            currentRole={user.role}
            isBanned={user.banned ?? false}
            banReason={user.banReason}
          />
        </div>

        {/* RIGHT MAIN CONTENT */}
        <div className="flex flex-1 min-w-0 flex-col gap-4">

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Organizations" value={user.organizations.length} />
            <StatCard label="Active Sessions" value={activeSessions} />
            <StatCard label="Assigned Leads" value={user.assignedLeads.length} />
          </div>

          {/* Organizations */}
          <Section title={`Organizations (${user.organizations.length})`}>
            {user.organizations.length === 0
              ? <p className="text-sm text-muted-foreground">Not a member of any organization</p>
              : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {user.organizations.map((org) => (
                    <div
                      key={org.id}
                      className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2.5 hover:bg-muted/40 transition-colors"
                      onClick={() => navigate({ to: '/organizations/$orgId', params: { orgId: org.id } })}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{org.name}</p>
                          <p className="text-xs text-muted-foreground">/{org.slug}</p>
                        </div>
                      </div>
                      <div className="ml-2 shrink-0 text-right">
                        <Badge variant="secondary" className="text-xs capitalize">{org.role}</Badge>
                        <p className="mt-0.5 text-xs text-muted-foreground">{new Date(org.joinedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </Section>

          {/* Sessions */}
          <Section title={`Sessions (${user.sessions.length})`}>
            {user.sessions.length === 0
              ? <p className="text-sm text-muted-foreground">No sessions</p>
              : (
                <div className="space-y-2">
                  {user.sessions.map((s) => {
                    const active = new Date(s.expiresAt) > new Date()
                    return (
                      <div key={s.id} className="rounded-lg border border-border bg-muted/20 px-4 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Monitor className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span className="truncate text-xs text-muted-foreground">{s.userAgent ?? 'Unknown browser'}</span>
                          </div>
                          <span className={`shrink-0 text-xs font-medium ${active ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                            {active ? 'Active' : 'Expired'}
                          </span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-x-6 gap-y-0.5 text-xs text-muted-foreground">
                          <span>IP: {s.ipAddress ?? '—'}</span>
                          <span>Created: {new Date(s.createdAt).toLocaleString()}</span>
                          <span>Expires: {new Date(s.expiresAt).toLocaleString()}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
          </Section>

          {/* Assigned Leads */}
          {user.assignedLeads.length > 0 && (
            <Section title={`Assigned Leads (${user.assignedLeads.length})`}>
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      {['Lead', 'Organization', 'Status', 'Assigned'].map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {user.assignedLeads.map((l) => (
                      <tr key={l.leadId} className="border-b border-border/50 last:border-0">
                        <td className="px-3 py-2">
                          <p className="font-medium">{l.leadName}</p>
                          <p className="text-muted-foreground">{l.leadEmail}</p>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{l.organization}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${LEAD_STATUS_STYLE[l.status] ?? ''}`}>
                            {l.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{new Date(l.assignedAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  )
}
