import { createFileRoute } from '@tanstack/react-router'
import { UserDetailPage } from '@/pages/users/UserDetailPage'

export const Route = createFileRoute('/_admin/users/$userId')({
  component: UserDetailPage,
})
