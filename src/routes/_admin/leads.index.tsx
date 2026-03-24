import { createFileRoute } from '@tanstack/react-router'
import { LeadsPage } from '@/pages/leads/LeadsPage'

export const Route = createFileRoute('/_admin/leads/')({
  component: LeadsPage,
})
