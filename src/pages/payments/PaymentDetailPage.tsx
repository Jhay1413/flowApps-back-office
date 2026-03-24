import { useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Clock, CheckCircle, XCircle, Smartphone, CreditCard,
  Building2, FileImage, AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getManualPaymentDetail, approveManualPayment, rejectManualPayment,
  type AdminManualPaymentStatus,
} from '@/api/admin.api'

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<AdminManualPaymentStatus, { label: string; icon: React.ElementType; cls: string }> = {
  PENDING:  { label: 'Pending Review', icon: Clock,       cls: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  APPROVED: { label: 'Approved',       icon: CheckCircle, cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  REJECTED: { label: 'Rejected',       icon: XCircle,     cls: 'bg-red-500/15 text-red-400 border-red-500/20' },
}

const TIER_PRICES: Record<string, string> = {
  STARTER: '₱999',
  GROWTH:  '₱2,499',
  PRO:     '₱4,999',
}

function formatPHP(cents: number) {
  return '₱' + (cents / 100).toLocaleString('en-PH', { minimumFractionDigits: 0 })
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/50 py-2 last:border-0">
      <span className="w-36 shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="text-right text-xs text-foreground break-all">{children}</span>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PaymentDetailPage() {
  const { paymentId } = useParams({ from: '/_admin/payments/$paymentId' })
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [note, setNote] = useState('')
  const [action, setAction] = useState<'approve' | 'reject' | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'manual-payments', paymentId],
    queryFn: async () => { const res = await getManualPaymentDetail(paymentId); return res.data },
  })

  const payment = data?.data

  const approveMutation = useMutation({
    mutationFn: () => approveManualPayment(paymentId, note || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'manual-payments'] })
      setAction(null)
    },
  })

  const rejectMutation = useMutation({
    mutationFn: () => rejectManualPayment(paymentId, note || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'manual-payments'] })
      setAction(null)
    },
  })

  const isPending = approveMutation.isPending || rejectMutation.isPending

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-5 w-28" />
        <div className="flex gap-6">
          <Skeleton className="h-64 w-72 shrink-0" />
          <div className="flex flex-1 flex-col gap-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-20 text-muted-foreground">
        <AlertCircle className="h-10 w-10 opacity-30" />
        <p className="text-sm">Payment not found</p>
        <Button variant="outline" size="sm" onClick={() => navigate({ to: '/payments' })}>Back</Button>
      </div>
    )
  }

  const cfg = STATUS_CONFIG[payment.status]
  const StatusIcon = cfg.icon
  const MethodIcon = payment.paymentMethod === 'GCASH' ? Smartphone : CreditCard
  const isPdf = payment.receiptKey.endsWith('.pdf')

  return (
    <div className="flex flex-col gap-5 p-6">
      {/* Back */}
      <button
        onClick={() => navigate({ to: '/payments' })}
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Payments
      </button>

      <div className="flex gap-6 items-start">
        {/* LEFT — receipt */}
        <div className="flex w-80 shrink-0 flex-col gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileImage className="h-4 w-4 text-muted-foreground" />
                Receipt
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isPdf ? (
                <a
                  href={payment.receiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col items-center gap-2 rounded-lg border border-border bg-muted/20 px-4 py-8 hover:bg-muted/40 transition-colors text-sm text-muted-foreground"
                >
                  <FileImage className="h-10 w-10 opacity-40" />
                  View PDF Receipt
                </a>
              ) : (
                <a href={payment.receiptUrl} target="_blank" rel="noreferrer">
                  <img
                    src={payment.receiptUrl}
                    alt="Payment receipt"
                    className="w-full rounded-lg border border-border object-contain max-h-96 hover:opacity-90 transition-opacity"
                  />
                </a>
              )}
              <p className="mt-2 text-center text-xs text-muted-foreground">Click to open full size · Link expires in 15 min</p>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT — details + actions */}
        <div className="flex flex-1 min-w-0 flex-col gap-4">

          {/* Status badge */}
          <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 ${cfg.cls}`}>
            <StatusIcon className="h-4 w-4 shrink-0" />
            <div>
              <p className="text-sm font-semibold">{cfg.label}</p>
              {payment.reviewedAt && (
                <p className="text-xs opacity-70">Reviewed {new Date(payment.reviewedAt).toLocaleString()}</p>
              )}
              {payment.adminNote && (
                <p className="text-xs opacity-80 mt-0.5">Note: {payment.adminNote}</p>
              )}
            </div>
          </div>

          {/* Payment details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Payment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow label="Organization">
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {payment.organization.name}
                </span>
              </InfoRow>
              <InfoRow label="Method">
                <span className="flex items-center gap-1">
                  <MethodIcon className="h-3 w-3" />
                  {payment.paymentMethod === 'GCASH' ? 'GCash' : 'GoTyme Bank'}
                </span>
              </InfoRow>
              <InfoRow label="Plan">
                <Badge variant="secondary" className="text-xs">{payment.tier}</Badge>
              </InfoRow>
              <InfoRow label="Amount">
                <span className="font-semibold">{formatPHP(payment.amount)}</span>
                <span className="text-muted-foreground ml-1 text-[10px]">({TIER_PRICES[payment.tier] ?? ''}/mo)</span>
              </InfoRow>
              <InfoRow label="Reference No.">
                {payment.referenceNumber
                  ? <span className="font-mono">{payment.referenceNumber}</span>
                  : <span className="text-muted-foreground/40">—</span>}
              </InfoRow>
              <InfoRow label="Payment ID">
                <span className="font-mono text-[10px]">{payment.id}</span>
              </InfoRow>
              <InfoRow label="Submitted">{new Date(payment.createdAt).toLocaleString()}</InfoRow>
            </CardContent>
          </Card>

          {/* Action card — only for PENDING */}
          {payment.status === 'PENDING' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Review Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Note (optional)</label>
                  <Input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Reason for approval or rejection…"
                    className="h-8 text-sm"
                  />
                </div>

                {/* Confirm prompts */}
                {action === 'approve' && (
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5 space-y-2">
                    <p className="text-xs text-emerald-400">
                      Approving will activate the <strong>{payment.tier}</strong> plan for <strong>{payment.organization.name}</strong> for 30 days and record the payment.
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => approveMutation.mutate()} disabled={isPending}>
                        {approveMutation.isPending ? 'Approving…' : 'Confirm Approve'}
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => setAction(null)} disabled={isPending}>Cancel</Button>
                    </div>
                  </div>
                )}

                {action === 'reject' && (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 space-y-2">
                    <p className="text-xs text-destructive">
                      Rejecting will notify the user that their payment was not approved.
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="destructive" className="flex-1" onClick={() => rejectMutation.mutate()} disabled={isPending}>
                        {rejectMutation.isPending ? 'Rejecting…' : 'Confirm Reject'}
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => setAction(null)} disabled={isPending}>Cancel</Button>
                    </div>
                  </div>
                )}

                {action === null && (
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setAction('approve')}>
                      <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" className="flex-1" onClick={() => setAction('reject')}>
                      <XCircle className="mr-1.5 h-3.5 w-3.5" /> Reject
                    </Button>
                  </div>
                )}

                {(approveMutation.isError || rejectMutation.isError) && (
                  <p className="text-xs text-destructive">Something went wrong. Please try again.</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
