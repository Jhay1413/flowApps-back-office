import { createFileRoute } from '@tanstack/react-router'
import { LeadDetailPage } from '@/pages/leads/LeadDetailPage'

export const Route = createFileRoute('/_admin/leads/$leadId')({
  component: LeadDetailPage,
})
