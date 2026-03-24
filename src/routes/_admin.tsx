import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import AdminLayout from '@/components/layout/AdminLayout'

export const Route = createFileRoute('/_admin')({
  beforeLoad: ({ context }) => {
    if (!context.session?.session) throw redirect({ to: '/login', search: { error: undefined } })
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
