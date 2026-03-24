import { createFileRoute } from '@tanstack/react-router'
import { InboxPage } from '@/pages/inbox/InboxPage'

export const Route = createFileRoute('/_admin/inbox')({
  component: InboxPage,
})
