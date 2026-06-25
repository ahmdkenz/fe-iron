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

  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// Flag untuk mencegah loop tak terbatas jika refresh juga gagal
let _isRefreshing = false
let _refreshQueue = []

function processQueue(error, token = null) {
  _refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token)
  })
  _refreshQueue = []
}

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config

    // Skip redirect untuk /auth/me (bootstrap check) dan /auth/refresh (hindari loop)
    const isAuthMe      = originalRequest?.url?.endsWith('/auth/me')
    const isAuthRefresh = originalRequest?.url?.endsWith('/auth/refresh')

    if (error.response?.status === 401 && !isAuthMe && !isAuthRefresh && !originalRequest._retry) {
      // Coba refresh token terlebih dahulu
      const refreshToken = localStorage.getItem('refresh_token')

      if (refreshToken) {
        if (_isRefreshing) {
          // Antrekan request yang datang saat refresh sedang berlangsung
          return new Promise((resolve, reject) => {
            _refreshQueue.push({ resolve, reject })
          }).then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
        }

        originalRequest._retry = true
        _isRefreshing = true

        try {
          const { data } = await api.post('/auth/refresh', { refresh_token: refreshToken })
          const newToken        = data.data.token
          const newRefreshToken = data.data.refresh_token

          localStorage.setItem('auth_token', newToken)
          if (newRefreshToken) {
            localStorage.setItem('refresh_token', newRefreshToken)
          }

          processQueue(null, newToken)
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return api(originalRequest)
        } catch (refreshError) {
          processQueue(refreshError, null)
          localStorage.removeItem('auth_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
          return Promise.reject(refreshError)
        } finally {
          _isRefreshing = false
        }
      }

      // Tidak ada refresh token — langsung ke login
      window.location.href = '/login'
    }

    return Promise.reject(error)
  },
)

export default api
