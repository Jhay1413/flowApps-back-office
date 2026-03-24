import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_admin/leads')({
  component: () => <Outlet />,
})
