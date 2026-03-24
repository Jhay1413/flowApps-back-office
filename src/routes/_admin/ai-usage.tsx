import { createFileRoute } from '@tanstack/react-router'
import { AiUsagePage } from '@/pages/ai-usage/AiUsagePage'

export const Route = createFileRoute('/_admin/ai-usage')({
  component: AiUsagePage,
})
