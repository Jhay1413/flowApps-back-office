import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Mail, MailOpen, RefreshCw, Trash2, Paperclip,
  ChevronLeft, ChevronRight, Loader2, AlertCircle, Inbox,
  FolderOpen, X,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getInboxFolders, getInboxEmails, getInboxEmail, deleteInboxEmail,
  type EmailSummary, type EmailDetail,
} from '@/api/admin.api'

function formatDate(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

// ─── Email list row ───────────────────────────────────────────────────────────

function EmailRow({
  email, selected, onClick,
}: { email: EmailSummary; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-border transition-colors flex items-start gap-3
        ${selected ? 'bg-primary/10' : email.seen ? 'hover:bg-muted/50' : 'bg-muted/20 hover:bg-muted/40'}`}
    >
      <div className="mt-0.5 shrink-0">
        {email.seen
          ? <MailOpen className="h-4 w-4 text-muted-foreground" />
          : <Mail className="h-4 w-4 text-primary" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm truncate ${email.seen ? 'text-muted-foreground' : 'text-foreground font-semibold'}`}>
            {email.from || email.fromEmail || '(unknown)'}
          </span>
          <span className="text-[11px] text-muted-foreground shrink-0">{formatDate(email.date)}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`text-xs truncate flex-1 ${email.seen ? 'text-muted-foreground' : 'text-foreground'}`}>
            {email.subject || '(no subject)'}
          </span>
          {email.hasAttachments && <Paperclip className="h-3 w-3 text-muted-foreground shrink-0" />}
        </div>
      </div>
    </button>
  )
}

// ─── Email detail pane ────────────────────────────────────────────────────────

function EmailDetailPane({
  uid, folder, onClose, onDelete,
}: { uid: number; folder: string; onClose: () => void; onDelete: () => void }) {
  const qc = useQueryClient()

  const { data: res, isLoading } = useQuery({
    queryKey: ['admin', 'inbox', 'email', uid, folder],
    queryFn: async () => {
      const r = await getInboxEmail(uid, folder)
      return r.data
    },
    staleTime: 60_000,
  })

  const email: EmailDetail | undefined = res?.data

  const deleteMutation = useMutation({
    mutationFn: () => deleteInboxEmail(uid, folder),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'inbox', 'list'] })
      onDelete()
    },
  })

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-6 flex-1">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!email) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        <AlertCircle className="h-5 w-5 mr-2" /> Failed to load email
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-base font-semibold text-foreground leading-tight">
            {email.subject || '(no subject)'}
          </h2>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
          <div><span className="font-medium text-foreground/70">From:</span> {email.from || email.fromEmail}</div>
          <div><span className="font-medium text-foreground/70">To:</span> {email.to}</div>
          {email.cc && <div><span className="font-medium text-foreground/70">CC:</span> {email.cc}</div>}
          <div><span className="font-medium text-foreground/70">Date:</span> {email.date ? new Date(email.date).toLocaleString() : '—'}</div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto p-6">
        {email.html ? (
          <iframe
            srcDoc={email.html}
            sandbox="allow-same-origin"
            className="w-full min-h-[400px] border-0 bg-white rounded-lg"
            style={{ height: '100%' }}
          />
        ) : (
          <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
            {email.text || '(empty message)'}
          </pre>
        )}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function InboxPage() {
  const qc = useQueryClient()
  const [folder, setFolder]       = useState('INBOX')
  const [page, setPage]           = useState(1)
  const [selectedUid, setSelected] = useState<number | null>(null)
  const limit = 25

  const { data: foldersRes } = useQuery({
    queryKey: ['admin', 'inbox', 'folders'],
    queryFn: async () => { const r = await getInboxFolders(); return r.data },
    staleTime: 300_000,
  })
  const folders: string[] = foldersRes?.data ?? []

  const { data: listRes, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'inbox', 'list', folder, page],
    queryFn: async () => { const r = await getInboxEmails(folder, page, limit); return r.data },
    staleTime: 30_000,
  })

  const emails: EmailSummary[] = listRes?.data?.emails ?? []
  const total: number          = listRes?.data?.total ?? 0
  const totalPages             = Math.ceil(total / limit)

  function changeFolder(f: string) {
    setFolder(f)
    setPage(1)
    setSelected(null)
  }

  function folderLabel(f: string) {
    const labels: Record<string, string> = {
      INBOX: 'Inbox', Sent: 'Sent', Drafts: 'Drafts', Trash: 'Trash', Spam: 'Spam', Junk: 'Junk',
    }
    return labels[f] ?? f
  }

  return (
    <div className="flex flex-1 overflow-hidden h-full">
      {/* Folder sidebar */}
      <aside className="w-44 border-r border-border flex-col flex shrink-0 bg-card">
        <div className="p-3 border-b border-border">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">Folders</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          {folders.length === 0
            ? ['INBOX', 'Sent', 'Drafts', 'Trash'].map((f) => (
                <FolderButton key={f} label={folderLabel(f)} active={folder === f} onClick={() => changeFolder(f)} />
              ))
            : folders.map((f) => (
                <FolderButton key={f} label={folderLabel(f)} active={folder === f} onClick={() => changeFolder(f)} />
              ))
          }
        </nav>
      </aside>

      {/* Email list */}
      <div className={`flex flex-col border-r border-border ${selectedUid ? 'w-72 shrink-0' : 'flex-1'}`}>
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <div className="flex items-center gap-2">
            <Inbox className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{folderLabel(folder)}</span>
            {total > 0 && <Badge variant="secondary" className="text-xs">{total}</Badge>}
          </div>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { qc.invalidateQueries({ queryKey: ['admin', 'inbox', 'list'] }); refetch() }}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="p-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          )}
          {isError && (
            <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
              <AlertCircle className="h-8 w-8 text-destructive/50" />
              <p className="text-sm text-muted-foreground">Failed to load emails.</p>
              <p className="text-xs text-muted-foreground">Make sure your SMTP credentials are saved in Email Settings.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
            </div>
          )}
          {!isLoading && !isError && emails.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
              <MailOpen className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No emails in {folderLabel(folder)}</p>
            </div>
          )}
          {emails.map((email) => (
            <EmailRow
              key={email.uid}
              email={email}
              selected={selectedUid === email.uid}
              onClick={() => setSelected(email.uid === selectedUid ? null : email.uid)}
            />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-2">
            <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail pane */}
      {selectedUid && (
        <EmailDetailPane
          uid={selectedUid}
          folder={folder}
          onClose={() => setSelected(null)}
          onDelete={() => setSelected(null)}
        />
      )}
    </div>
  )
}

function FolderButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors text-left
        ${active ? 'bg-primary/15 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
    >
      <FolderOpen className="h-3.5 w-3.5 shrink-0" />
      {label}
    </button>
  )
}
