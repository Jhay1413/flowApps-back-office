import { createFileRoute } from '@tanstack/react-router'
import { AutomationsPage } from '@/pages/automations/AutomationsPage'

export const Route = createFileRoute('/_admin/automations')({
  component: AutomationsPage,
})
