import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
  withCredentials: true,
  timeout: 15000,
})

api.interceptors.request.use(config => {
  // Untuk FormData (file upload), hapus Content-Type agar browser/axios
  // otomatis mengisi 'multipart/form-data; boundary=...' yang benar.
  // Jika Content-Type tetap 'application/json', server tidak bisa membaca file.
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }

  return config
})

// Handle 401 globally.
// Skip redirect for /auth/me — that endpoint is called during bootstrap to check
// if a token exists; a 401 there just means the user is not logged in yet.
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
