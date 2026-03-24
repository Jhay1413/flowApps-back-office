import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Pencil, Check, X, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { getPlans, updatePlan, type AdminPlan } from '@/api/admin.api'

const TIER_ORDER = ['FREE', 'STARTER', 'GROWTH', 'PRO']
const TIER_COLOR: Record<string, string> = {
  FREE: 'secondary', STARTER: 'info', GROWTH: 'default', PRO: 'warning',
}

type EditableFields = Pick<
  AdminPlan,
  'priceAmount' | 'priceLabel' | 'usdApprox' | 'leadsPerMonth' |
  'maxAutomations' | 'knowledgeBaseEntries' | 'transcriptsPerLead' |
  'aiScoring' | 'followUpAutomation' | 'emailEventTracking'
>

function PlanCard({ plan }: { plan: AdminPlan }) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<EditableFields>({
    priceAmount: plan.priceAmount,
    priceLabel: plan.priceLabel,
    usdApprox: plan.usdApprox,
    leadsPerMonth: plan.leadsPerMonth,
    maxAutomations: plan.maxAutomations,
    knowledgeBaseEntries: plan.knowledgeBaseEntries,
    transcriptsPerLead: plan.transcriptsPerLead,
    aiScoring: plan.aiScoring,
    followUpAutomation: plan.followUpAutomation,
    emailEventTracking: plan.emailEventTracking,
  })

  const mutation = useMutation({
    mutationFn: () => updatePlan(plan.tier, draft),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] })
      setEditing(false)
    },
  })

  function cancel() {
    setDraft({
      priceAmount: plan.priceAmount,
      priceLabel: plan.priceLabel,
      usdApprox: plan.usdApprox,
      leadsPerMonth: plan.leadsPerMonth,
      maxAutomations: plan.maxAutomations,
      knowledgeBaseEntries: plan.knowledgeBaseEntries,
      transcriptsPerLead: plan.transcriptsPerLead,
      aiScoring: plan.aiScoring,
      followUpAutomation: plan.followUpAutomation,
      emailEventTracking: plan.emailEventTracking,
    })
    setEditing(false)
  }

  const numField = (key: keyof EditableFields, label: string, hint?: string) => (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <div>
        <span className="text-sm text-foreground">{label}</span>
        {hint && <span className="ml-1 text-xs text-muted-foreground">({hint})</span>}
      </div>
      {editing ? (
        <Input
          type="number"
          value={draft[key] as number}
          onChange={(e) => setDraft((d) => ({ ...d, [key]: Number(e.target.value) }))}
          className="h-7 w-28 text-right text-sm"
        />
      ) : (
        <span className="text-sm font-medium">
          {(draft[key] as number) === -1 ? <span className="text-muted-foreground">Unlimited</span> : String(draft[key])}
        </span>
      )}
    </div>
  )

  const boolField = (key: keyof EditableFields, label: string) => (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-foreground">{label}</span>
      {editing ? (
        <button
          onClick={() => setDraft((d) => ({ ...d, [key]: !d[key] }))}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${draft[key] ? 'bg-primary' : 'bg-muted'}`}
        >
          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${draft[key] ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
        </button>
      ) : (
        draft[key]
          ? <Check className="h-4 w-4 text-emerald-400" />
          : <X className="h-4 w-4 text-muted-foreground" />
      )}
    </div>
  )

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={TIER_COLOR[plan.tier] as 'default'}>{plan.tier}</Badge>
            <CardTitle className="text-base">{plan.name}</CardTitle>
          </div>
          {!editing ? (
            <Button variant="ghost" size="icon" onClick={() => setEditing(true)} className="h-7 w-7">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <div className="flex gap-1">
              <Button size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : 'Save'}
              </Button>
              <Button variant="ghost" size="sm" onClick={cancel}>Cancel</Button>
            </div>
          )}
        </div>
        {/* Price display / edit */}
        <div className="mt-2">
          {editing ? (
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">Price (centavos/cents)</label>
                <Input
                  type="number"
                  value={draft.priceAmount}
                  onChange={(e) => setDraft((d) => ({ ...d, priceAmount: Number(e.target.value) }))}
                  className="mt-1 h-8 text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">Label (e.g. ₱999/mo)</label>
                <Input
                  value={draft.priceLabel}
                  onChange={(e) => setDraft((d) => ({ ...d, priceLabel: e.target.value }))}
                  className="mt-1 h-8 text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">USD Approx</label>
                <Input
                  value={draft.usdApprox}
                  onChange={(e) => setDraft((d) => ({ ...d, usdApprox: e.target.value }))}
                  className="mt-1 h-8 text-sm"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{plan.priceLabel}</span>
              <span className="text-xs text-muted-foreground">{plan.usdApprox}</span>
            </div>
          )}
        </div>
        {mutation.isError && (
          <div className="flex items-center gap-1.5 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5" />
            Failed to save changes
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="divide-y-0">
          {numField('leadsPerMonth',        'Leads / month',       '-1 = unlimited')}
          {numField('maxAutomations',       'Max automations',     '-1 = unlimited')}
          {numField('knowledgeBaseEntries', 'KB entries',          '-1 = unlimited')}
          {numField('transcriptsPerLead',   'Transcripts / lead',  '-1 = unlimited')}
          {boolField('aiScoring',           'AI Scoring')}
          {boolField('followUpAutomation',  'Follow-up Automation')}
          {boolField('emailEventTracking',  'Email Event Tracking')}
        </div>

        {/* Features list */}
        {plan.features.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Included Features</p>
            <ul className="space-y-1">
              {plan.features.map((f) => (
                <li key={f.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Check className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                  {f.label}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function PlansPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'plans'],
    queryFn: async () => { const res = await getPlans(); return res.data },
  })

  const plans = (data?.data ?? []).sort(
    (a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier),
  )

  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <h1 className="text-xl font-bold">Subscription Plans</h1>
        <p className="text-sm text-muted-foreground">Edit pricing and feature limits for each tier</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-80 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <PlanCard key={plan.tier} plan={plan} />
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Note: Price amounts are in the smallest currency unit (centavos for PHP). Changes here update the database only — update your Stripe dashboard separately to match.
      </p>
    </div>
  )
}
