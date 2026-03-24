import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: ({ context }) => {
    if (!context.session?.session) throw redirect({ to: '/login', search: { error: undefined } })
    throw redirect({ to: '/dashboard' })
  },
  component: () => null,
})
