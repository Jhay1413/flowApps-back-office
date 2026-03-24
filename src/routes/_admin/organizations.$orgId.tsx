import { createFileRoute } from '@tanstack/react-router'
import { OrgDetailPage } from '@/pages/organizations/OrgDetailPage'

export const Route = createFileRoute('/_admin/organizations/$orgId')({
  component: OrgDetailPage,
})
