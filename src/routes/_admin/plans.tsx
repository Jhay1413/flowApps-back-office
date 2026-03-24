import { createFileRoute } from '@tanstack/react-router'
import { PlansPage } from '@/pages/plans/PlansPage'

export const Route = createFileRoute('/_admin/plans')({
  component: PlansPage,
})
