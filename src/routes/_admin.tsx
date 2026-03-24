import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import AdminLayout from '@/components/layout/AdminLayout'
import { authClient } from '@/lib/auth-client'

export const Route = createFileRoute('/_admin')({
  beforeLoad: async () => {
    const { data } = await authClient.getSession()
    if (!data?.session) throw redirect({ to: '/login' })
  },
  component: AdminRoot,
})

function AdminRoot() {
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  )
}
