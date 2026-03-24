import { createFileRoute } from '@tanstack/react-router'
import { RevenuePage } from '@/pages/revenue/RevenuePage'

export const Route = createFileRoute('/_admin/revenue')({
  component: RevenuePage,
})
