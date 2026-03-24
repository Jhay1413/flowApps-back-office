import { useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, Mail, Phone, Globe, Calendar, Bot, MessageSquare,
  Activity, StickyNote, FileText, Sparkles, Eye, MousePointerClick,
  CheckCircle2, XCircle, AlertCircle, Inbox, Clock, UserRound,
  Building2, Zap,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getLeadDetail } from '@/api/admin.api'
import type { AdminLeadDetail } from '@/api/admin.api'

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  NEW:       'bg-blue-500/15 text-blue-400',
  CONTACTED: 'bg-purple-500/15 text-purple-400',
  REVIEW:    'bg-amber-500/15 text-amber-400',
  CONVERTED: 'bg-emerald-500/15 text-emerald-400',
  LOST:      'bg-zinc-500/15 text-zinc-400',
}

const EVENT_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  delivered:     { label: 'Delivered',    icon: CheckCircle2,      color: 'text-emerald-400' },
  open:          { label: 'Opened',       icon: Eye,               color: 'text-blue-400' },
  click:         { label: 'Clicked',      icon: MousePointerClick, color: 'text-violet-400' },
  bounce:        { label: 'Bounced',      icon: XCircle,           color: 'text-red-400' },
  dropped:       { label: 'Dropped',      icon: XCircle,           color: 'text-red-400' },
  spam_report:   { label: 'Spam',         icon: AlertCircle,       color: 'text-orange-400' },
  unsubscribe:   { label: 'Unsubscribed', icon: XCircle,           color: 'text-amber-400' },
  inbound_reply: { label: 'Replied',      icon: Inbox,             color: 'text-emerald-400' },
  deferred:      { label: 'Deferred',     icon: Clock,             color: 'text-amber-400' },
  processed:     { label: 'Processed',    icon: CheckCircle2,      color: 'text-muted-foreground' },
}

const DRAFT_STATUS_STYLE: Record<string, string> = {
  DRAFT: 'bg-amber-500/15 text-amber-400',
  SENT:  'bg-emerald-500/15 text-emerald-400',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function InfoTile({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        <Icon className="h-3.5 w-3.5" />{label}
      </div>
      <p className="text-sm font-medium break-all">{value}</p>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-lg border border-border p-3 ${color} bg-opacity-10`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  )
}

function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
      <Icon className="h-8 w-8 opacity-20" />
      <p className="text-sm">{text}</p>
    </div>
  )
}

// ─── Tab types ────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'conversation' | 'events' | 'notes' | 'transcripts' | 'followup'

// ─── Main component ───────────────────────────────────────────────────────────

export function LeadDetailPage() {
  const { leadId } = useParams({ from: '/_admin/leads/$leadId' })
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('overview')
  const [viewingTranscript, setViewingTranscript] = useState<{ title: string; content: string } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'leads', leadId],
    queryFn: async () => { const res = await getLeadDetail(leadId); return res.data },
  })

  const lead: AdminLeadDetail | undefined = data?.data

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-20 text-muted-foreground">
        <Mail className="h-10 w-10 opacity-30" />
        <p className="text-sm">Lead not found</p>
        <Button variant="outline" size="sm" onClick={() => navigate({ to: '/leads' })}>Back to Leads</Button>
      </div>
    )
  }

  const tabs: { value: Tab; icon: React.ElementType; label: string; count?: number }[] = [
    { value: 'overview',      icon: Activity,       label: 'Overview' },
    { value: 'conversation',  icon: MessageSquare,  label: 'Email Thread',  count: lead.conversations.length },
    { value: 'events',        icon: Mail,           label: 'Events',        count: lead.emailEvents.length },
    { value: 'notes',         icon: StickyNote,     label: 'Notes',         count: lead.notes.length },
    { value: 'transcripts',   icon: FileText,       label: 'Transcripts',   count: lead.transcripts.length },
    { value: 'followup',      icon: Sparkles,       label: 'Follow-up',     count: lead.followUpDrafts.length },
  ]

  return (
    <div className="flex flex-col gap-0 h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-background px-6 py-4 shrink-0">
        <button
          onClick={() => navigate({ to: '/leads' })}
          className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Leads
        </button>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-lg">
              {lead.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold">{lead.name}</h1>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[lead.status] ?? ''}`}>
                  {lead.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{lead.email}</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            <Building2 className="mr-1 h-3 w-3" />
            {lead.organization.name}
          </Badge>
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b border-border px-6 shrink-0 bg-background">
        <div className="flex gap-0">
          {tabs.map(({ value, icon: Icon, label, count }) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={`flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm transition-colors ${
                tab === value
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              {count != null && count > 0 && (
                <span className="ml-0.5 rounded-full bg-muted px-1.5 py-0.5 text-xs font-mono">{count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-6">

        {/* ── Overview ───────────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <div className="flex gap-6 items-start max-w-5xl">
            {/* Left */}
            <div className="flex flex-1 min-w-0 flex-col gap-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <InfoTile icon={Mail}     label="Email"   value={lead.email} />
                <InfoTile icon={Phone}    label="Phone"   value={lead.phone ?? '—'} />
                <InfoTile icon={Globe}    label="Source"  value={lead.source} />
                <InfoTile icon={Calendar} label="Created" value={new Date(lead.createdAt).toLocaleDateString()} />
              </div>

              {/* Assigned To */}
              <Section title="Assigned To">
                {lead.assignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Unassigned</p>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                      {lead.assignments[0].user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{lead.assignments[0].user.name}</p>
                      <p className="text-xs text-muted-foreground">{lead.assignments[0].user.email}</p>
                    </div>
                  </div>
                )}
              </Section>

              {/* AI Score */}
              {lead.aiScore && (
                <Section title="AI Lead Score">
                  <div className="flex items-center gap-2 mb-1">
                    <Bot className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">{lead.aiScore}</span>
                  </div>
                </Section>
              )}

              {/* Custom Fields */}
              {lead.customFields && Object.keys(lead.customFields).length > 0 && (
                <Section title="Form Fields">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(lead.customFields).map(([key, val]) => (
                      <div key={key}>
                        <p className="text-xs text-muted-foreground mb-0.5">{key}</p>
                        <p className="text-sm">{String(val) || '—'}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Original message */}
              <Section title="Original Message">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{lead.message}</p>
              </Section>
            </div>

            {/* Right sidebar */}
            <div className="flex w-56 shrink-0 flex-col gap-4">
              <div className="grid grid-cols-2 gap-2">
                <StatCard label="Emails"      value={lead.conversations.length} color="text-blue-400" />
                <StatCard label="Events"      value={lead.emailEvents.length}   color="text-violet-400" />
                <StatCard label="Notes"       value={lead.notes.length}         color="text-amber-400" />
                <StatCard label="Transcripts" value={lead.transcripts.length}   color="text-emerald-400" />
              </div>

              {/* AI usage */}
              {lead.aiLogs.length > 0 && (
                <Section title="AI Usage">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Zap className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs text-muted-foreground">
                      {lead.aiLogs.reduce((s, l) => s + l.tokensUsed, 0).toLocaleString()} tokens
                    </span>
                  </div>
                  <div className="space-y-1">
                    {lead.aiLogs.slice(0, 5).map((l) => (
                      <div key={l.id} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-mono">{l.model}</span>
                        <span>{l.tokensUsed.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Dates */}
              <Section title="Timeline">
                {[
                  { label: 'Created',     val: lead.createdAt },
                  { label: 'Replied',     val: lead.repliedAt },
                  { label: 'Contacted',   val: lead.contactedAt },
                  { label: 'Follow-up',   val: lead.followUpSentAt },
                ].map(({ label, val }) => (
                  <div key={label} className="flex items-start justify-between gap-2 border-b border-border/50 py-1.5 last:border-0">
                    <span className="text-xs text-muted-foreground shrink-0">{label}</span>
                    <span className="text-xs text-right">{val ? new Date(val).toLocaleDateString() : <span className="text-muted-foreground/40">—</span>}</span>
                  </div>
                ))}
              </Section>
            </div>
          </div>
        )}

        {/* ── Email Thread ─────────────────────────────────────────────────── */}
        {tab === 'conversation' && (
          <div className="max-w-3xl space-y-3">
            {lead.conversations.length === 0 ? (
              <EmptyState icon={MessageSquare} text="No emails in this thread yet." />
            ) : (
              lead.conversations.map((msg) => {
                const isOutbound = msg.sender === 'system' || msg.sender === 'assistant'
                return (
                  <div
                    key={msg.id}
                    className={`rounded-lg border border-border p-4 ${isOutbound ? 'bg-primary/5 border-primary/20' : 'bg-muted/20'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-medium ${isOutbound ? 'text-primary' : 'text-muted-foreground'}`}>
                        {isOutbound ? 'Outbound' : 'Inbound'} · {msg.channel}
                      </span>
                      <span className="text-xs text-muted-foreground">{new Date(msg.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ── Events ───────────────────────────────────────────────────────── */}
        {tab === 'events' && (
          <div className="max-w-3xl space-y-2">
            {lead.emailEvents.length === 0 ? (
              <EmptyState icon={Mail} text="No email events recorded." />
            ) : (
              lead.emailEvents.map((e) => {
                const cfg = EVENT_CONFIG[e.event] ?? { label: e.event, icon: Activity, color: 'text-muted-foreground' }
                const Icon = cfg.icon
                return (
                  <div key={e.id} className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3">
                    <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${cfg.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{cfg.label}</span>
                        <span className="text-xs text-muted-foreground shrink-0">{new Date(e.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                        <span>{e.email}</span>
                        {e.url && <span className="truncate max-w-xs">{e.url}</span>}
                        {e.reason && <span className="text-destructive">{e.reason}</span>}
                        {e.isMachineOpen && <span className="text-amber-400/80">machine open</span>}
                        <span className="capitalize">{e.provider}</span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ── Notes ────────────────────────────────────────────────────────── */}
        {tab === 'notes' && (
          <div className="max-w-3xl space-y-3">
            {lead.notes.length === 0 ? (
              <EmptyState icon={StickyNote} text="No notes on this lead." />
            ) : (
              lead.notes.map((n) => (
                <div key={n.id} className="rounded-lg border border-border bg-muted/20 px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <UserRound className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Note</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{n.content}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Transcripts ──────────────────────────────────────────────────── */}
        {tab === 'transcripts' && (
          <div className="max-w-3xl">
            {viewingTranscript ? (
              <div className="space-y-3">
                <button
                  onClick={() => setViewingTranscript(null)}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to transcripts
                </button>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{viewingTranscript.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed font-sans">
                      {viewingTranscript.content}
                    </pre>
                  </CardContent>
                </Card>
              </div>
            ) : lead.transcripts.length === 0 ? (
              <EmptyState icon={FileText} text="No transcripts uploaded." />
            ) : (
              <div className="space-y-2">
                {lead.transcripts.map((t) => (
                  <div
                    key={t.id}
                    className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3 hover:bg-muted/40 transition-colors"
                    onClick={() => setViewingTranscript({ title: t.title, content: t.content })}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{t.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Follow-up Drafts ─────────────────────────────────────────────── */}
        {tab === 'followup' && (
          <div className="max-w-3xl space-y-3">
            {lead.followUpDrafts.length === 0 ? (
              <EmptyState icon={Sparkles} text="No follow-up drafts generated." />
            ) : (
              lead.followUpDrafts.map((d) => (
                <Card key={d.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{d.subject}</p>
                      <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${DRAFT_STATUS_STYLE[d.status] ?? 'bg-muted text-muted-foreground'}`}>
                        {d.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{new Date(d.createdAt).toLocaleString()}</p>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="prose prose-sm prose-invert max-w-none text-muted-foreground text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: d.body }}
                    />
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
