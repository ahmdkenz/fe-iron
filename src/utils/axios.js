import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
  timeout: 15000,
  withCredentials: true,
})

// Handle 401 globally.
// Skip redirect for /auth/me — that endpoint is called during bootstrap to check
// if a session exists; a 401 there just means the user is not logged in yet.
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 && !error.config?.url?.endsWith('/auth/me')) {
      window.location.href = '/login'
    }

    return Promise.reject(error)
  },
)

export default api
