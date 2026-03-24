import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { routeTree } from './routeTree.gen'
import { authClient } from '@/lib/auth-client'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
})

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  context: { session: null },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export default function App() {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) return null

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} context={{ session }} />
    </QueryClientProvider>
  )
}
