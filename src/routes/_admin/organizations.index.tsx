import { createFileRoute } from '@tanstack/react-router'
import { OrganizationsPage } from '@/pages/organizations/OrganizationsPage'

export const Route = createFileRoute('/_admin/organizations/')({
  component: OrganizationsPage,
})
