import { createFileRoute } from '@tanstack/react-router'
import { AccessRequestsPage } from '@/pages/access-requests/AccessRequestsPage'

export const Route = createFileRoute('/_admin/access-requests')({
  component: AccessRequestsPage,
})
