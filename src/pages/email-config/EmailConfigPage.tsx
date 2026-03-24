import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Mail, Server, Lock, User, AtSign, Tag,
  CheckCircle2, AlertCircle, Send, Eye, EyeOff, Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getEmailConfig, updateEmailConfig, testSmtpConnection, testImapConnection,
  type EmailConfigData, type EmailConfigUpdate,
} from '@/api/admin.api'

// ─── Field row ────────────────────────────────────────────────────────────────

function Field({
  label, icon: Icon, children,
}: {
  label: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </label>
      {children}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function EmailConfigPage() {
  const qc = useQueryClient()

  const { data: queryData, isLoading } = useQuery({
    queryKey: ['admin', 'email-config'],
    queryFn: async () => {
      const res = await getEmailConfig()
      return res.data
    },
  })

  const cfg: EmailConfigData | undefined = queryData?.data

  const [form, setForm] = useState<EmailConfigUpdate & { smtpPassInput: string }>({
    smtpPassInput: '',
  })
  const [showPass, setShowPass] = useState(false)
  const [testTo, setTestTo] = useState('')
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const set = (k: keyof EmailConfigUpdate) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((p) => ({ ...p, [k]: e.target.value }))
    setSaveSuccess(false)
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: EmailConfigUpdate = {}
      if (form.smtpHost    !== undefined) payload.smtpHost    = form.smtpHost
      if (form.smtpPort    !== undefined) payload.smtpPort    = Number(form.smtpPort)
      if (form.smtpSecure  !== undefined) payload.smtpSecure  = form.smtpSecure
      if (form.smtpUser    !== undefined) payload.smtpUser    = form.smtpUser
      if (form.smtpPassInput) payload.smtpPass = form.smtpPassInput
      if (form.fromEmail   !== undefined) payload.fromEmail   = form.fromEmail
      if (form.fromName    !== undefined) payload.fromName    = form.fromName
      if (form.imapHost    !== undefined) payload.imapHost    = form.imapHost
      if (form.imapPort    !== undefined) payload.imapPort    = Number(form.imapPort)
      if (form.imapSecure  !== undefined) payload.imapSecure  = form.imapSecure
      return updateEmailConfig(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'email-config'] })
      setForm({ smtpPassInput: '' })
      setSaveSuccess(true)
    },
  })

  const [imapResult, setImapResult] = useState<{ ok: boolean; message: string } | null>(null)

  const testMutation = useMutation({
    mutationFn: () => testSmtpConnection(testTo),
    onSuccess: (res) => setTestResult({ ok: true, message: res.data.data.message }),
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to send test email'
      setTestResult({ ok: false, message: msg })
    },
  })

  const imapTestMutation = useMutation({
    mutationFn: () => testImapConnection(),
    onSuccess: (res) => setImapResult({ ok: true, message: res.data.data.message }),
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'IMAP connection failed'
      setImapResult({ ok: false, message: msg })
    },
  })

  const val = (field: keyof EmailConfigData) =>
    (form[field as keyof typeof form] as string | number | boolean | undefined) ?? cfg?.[field] ?? ''

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Email Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your Namecheap Private Email SMTP for sending all FlowOps emails.
        </p>
      </div>

      {/* Namecheap quick-ref banner */}
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
        <p className="text-sm font-semibold text-blue-400 mb-2">Namecheap Private Email — SMTP Reference</p>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs text-muted-foreground font-mono">
          <span><span className="text-foreground font-semibold">Host:</span> mail.privateemail.com</span>
          <span><span className="text-foreground font-semibold">Port (STARTTLS):</span> 587</span>
          <span><span className="text-foreground font-semibold">Port (SSL):</span> 465</span>
          <span><span className="text-foreground font-semibold">Username:</span> your full email address</span>
        </div>
      </div>

      {/* SMTP Settings */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Server className="h-4 w-4 text-primary" />
            SMTP Configuration
          </CardTitle>
          <CardDescription>
            Saved settings override the server environment variables immediately.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="SMTP Host" icon={Server}>
              <Input
                placeholder="mail.privateemail.com"
                value={String(val('smtpHost'))}
                onChange={set('smtpHost')}
              />
            </Field>
            <Field label="SMTP Port" icon={Server}>
              <Input
                type="number"
                placeholder="587"
                value={String(val('smtpPort'))}
                onChange={set('smtpPort')}
              />
            </Field>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-border p-3">
            <input
              id="smtpSecure"
              type="checkbox"
              className="h-4 w-4 rounded border-border accent-primary"
              checked={Boolean(val('smtpSecure'))}
              onChange={(e) => {
                setForm((p) => ({ ...p, smtpSecure: e.target.checked }))
                setSaveSuccess(false)
              }}
            />
            <div>
              <label htmlFor="smtpSecure" className="text-sm font-medium text-foreground cursor-pointer">
                Use SSL/TLS (port 465)
              </label>
              <p className="text-xs text-muted-foreground">Leave unchecked for STARTTLS on port 587</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Username" icon={User}>
              <Input
                type="email"
                placeholder="admin@flowops.cc"
                value={String(val('smtpUser'))}
                onChange={set('smtpUser')}
              />
            </Field>
            <Field label="Password" icon={Lock}>
              <div className="relative">
                <Input
                  type={showPass ? 'text' : 'password'}
                  placeholder={cfg?.smtpPassSet ? '••••••••  (saved)' : 'Enter password'}
                  value={form.smtpPassInput}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, smtpPassInput: e.target.value }))
                    setSaveSuccess(false)
                  }}
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {cfg?.smtpPassSet && !form.smtpPassInput && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  Password saved — leave blank to keep it
                </p>
              )}
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Sender Identity */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <AtSign className="h-4 w-4 text-primary" />
            Sender Identity
          </CardTitle>
          <CardDescription>The "From" address and display name recipients will see.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Field label="From Email" icon={AtSign}>
            <Input
              type="email"
              placeholder="noreply@flowops.cc"
              value={String(val('fromEmail'))}
              onChange={set('fromEmail')}
            />
          </Field>
          <Field label="From Name" icon={Tag}>
            <Input
              placeholder="FlowOps"
              value={String(val('fromName'))}
              onChange={set('fromName')}
            />
          </Field>
        </CardContent>
      </Card>

      {/* IMAP Settings */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            IMAP Settings (Inbox)
          </CardTitle>
          <CardDescription>
            Used to read your inbox. Defaults to the same host as SMTP on port 993 (SSL).
            If port 993 is blocked by your server, try port 143 with SSL disabled.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="IMAP Host" icon={Server}>
              <Input
                placeholder={cfg?.smtpHost || 'mail.privateemail.com'}
                value={String(val('imapHost'))}
                onChange={set('imapHost')}
              />
            </Field>
            <Field label="IMAP Port" icon={Server}>
              <Input
                type="number"
                placeholder="993"
                value={String(val('imapPort'))}
                onChange={set('imapPort')}
              />
            </Field>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-border p-3">
            <input
              id="imapSecure"
              type="checkbox"
              className="h-4 w-4 rounded border-border accent-primary"
              checked={Boolean(val('imapSecure') !== '' ? val('imapSecure') : (cfg?.imapSecure ?? true))}
              onChange={(e) => {
                setForm((p) => ({ ...p, imapSecure: e.target.checked }))
                setSaveSuccess(false)
              }}
            />
            <div>
              <label htmlFor="imapSecure" className="text-sm font-medium text-foreground cursor-pointer">
                Use SSL (port 993)
              </label>
              <p className="text-xs text-muted-foreground">Uncheck to use STARTTLS on port 143</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setImapResult(null); imapTestMutation.mutate() }}
              disabled={imapTestMutation.isPending}
              className="gap-2"
            >
              {imapTestMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Server className="h-4 w-4" />}
              Test IMAP Connection
            </Button>
            {imapResult && (
              <span className={`flex items-center gap-1.5 text-sm ${imapResult.ok ? 'text-emerald-500' : 'text-destructive'}`}>
                {imapResult.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                {imapResult.message}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex items-center gap-3">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="gap-2">
          {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
        {saveSuccess && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-500">
            <CheckCircle2 className="h-4 w-4" /> Settings saved
          </span>
        )}
        {saveMutation.isError && (
          <span className="flex items-center gap-1.5 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" /> Failed to save
          </span>
        )}
      </div>

      {/* Test Email */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" />
            Send Test Email
          </CardTitle>
          <CardDescription>
            Verify your SMTP settings are working by sending a test message.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <Input
              type="email"
              placeholder="recipient@example.com"
              value={testTo}
              onChange={(e) => { setTestTo(e.target.value); setTestResult(null) }}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => testMutation.mutate()}
              disabled={testMutation.isPending || !testTo}
              className="gap-2 shrink-0"
            >
              {testMutation.isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Mail className="h-4 w-4" />
              }
              Send Test
            </Button>
          </div>

          {testResult && (
            <div className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
              testResult.ok
                ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'
                : 'border-destructive/20 bg-destructive/5 text-destructive'
            }`}>
              {testResult.ok
                ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              }
              {testResult.message}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current status snapshot */}
      {cfg && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Current Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                {([
                  ['Host',       cfg.smtpHost   || '—'],
                  ['Port',       cfg.smtpPort],
                  ['Encryption', cfg.smtpSecure ? 'SSL/TLS (465)' : 'STARTTLS (587)'],
                  ['Username',   cfg.smtpUser   || '—'],
                  ['Password',   cfg.smtpPassSet ? '✓ Saved' : '—'],
                  ['From Email', cfg.fromEmail  || '—'],
                  ['From Name',  cfg.fromName   || '—'],
                ] as [string, string | number][]).map(([label, value]) => (
                  <tr key={label}>
                    <td className="py-2 pr-4 font-medium text-muted-foreground w-32">{label}</td>
                    <td className="py-2 text-foreground font-mono text-xs">
                      {label === 'Password' && cfg.smtpPassSet ? (
                        <span className="text-emerald-500 flex items-center gap-1 font-sans text-sm">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Saved
                        </span>
                      ) : label === 'Encryption' ? (
                        <Badge variant={cfg.smtpSecure ? 'default' : 'secondary'} className="text-xs">
                          {value}
                        </Badge>
                      ) : String(value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
