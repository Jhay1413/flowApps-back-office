import { authClient } from '@/lib/auth-client'

export function useAuth() {
  const { data: session, isPending: isLoading } = authClient.useSession()

  const signOut = async () => {
    await authClient.signOut()
    window.location.href = '/login'
  }

  return {
    user: session?.user ?? null,
    session: session?.session ?? null,
    isLoading,
    signOut,
  }
}
