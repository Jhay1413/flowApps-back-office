import { createFileRoute } from '@tanstack/react-router'
import { EmailConfigPage } from '@/pages/email-config/EmailConfigPage'

export const Route = createFileRoute('/_admin/email-config')({
  component: EmailConfigPage,
})
