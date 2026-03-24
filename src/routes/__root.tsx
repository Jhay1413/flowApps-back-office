import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import type { authClient } from '@/lib/auth-client'

export type RouterContext = {
  session: typeof authClient.$Infer.Session | null
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />,
})
