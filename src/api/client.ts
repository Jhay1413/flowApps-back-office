import axios from 'axios'

export const apiClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? ''}/api/admin`,
  withCredentials: true, // sends better-auth session cookie
})

// Redirect to login on 401/403
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status
    if (status === 401) {
      window.location.href = '/login'
    }
    if (status === 403) {
      window.location.href = '/login?error=forbidden'
    }
    return Promise.reject(err)
  },
)
