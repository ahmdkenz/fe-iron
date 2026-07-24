import axios from 'axios'

// VITE_API_BASE_URL sudah termasuk '/api/v1'; endpoint csrf-cookie ada di root.
const API_ORIGIN = import.meta.env.VITE_API_BASE_URL.replace(/\/api\/v1\/?$/, '')

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
  withCredentials: true,
  withXSRFToken: true, // wajib: origin FE dan BE beda host, axios hanya auto-kirim
  // X-XSRF-TOKEN utk same-origin URL kecuali flag ini true
  timeout: 15000,
})

// Memicu Laravel Sanctum men-set cookie XSRF-TOKEN. Dipanggil sekali saat
// bootstrap (main.js) dan otomatis lagi oleh response interceptor saat 419.
// Selalu request baru (bukan singleton/cache) — murah (204, tanpa body) dan
// harus tetap valid meski sesi Laravel (120 menit) sudah lewat sementara
// refresh_token (30 hari) masih hidup.
export function ensureCsrfCookie() {
  return axios.get(`${API_ORIGIN}/sanctum/csrf-cookie`, { withCredentials: true })
}

api.interceptors.request.use(config => {
  // Untuk FormData (file upload), hapus Content-Type agar browser/axios
  // otomatis mengisi 'multipart/form-data; boundary=...' yang benar.
  // Jika Content-Type tetap 'application/json', server tidak bisa membaca file.
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }

  return config
})

// Flag untuk mencegah loop tak terbatas jika refresh juga gagal
let _isRefreshing = false
let _refreshQueue = []

function processQueue(error) {
  _refreshQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve()))
  _refreshQueue = []
}

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config
    const status = error.response?.status

    // /auth/me tetap boleh mencoba refresh (mis. access token kedaluwarsa setelah deploy),
    // tapi tidak boleh memicu redirect paksa — itu bagian dari bootstrap check awal.
    // /auth/refresh dikecualikan total agar tidak memicu refresh atas dirinya sendiri (hindari loop).
    // /auth/login: 401 di sini berarti salah username/password, bukan token kedaluwarsa —
    // jangan dianggap sinyal "perlu refresh".
    const isAuthMe      = originalRequest?.url?.endsWith('/auth/me')
    const isAuthRefresh = originalRequest?.url?.endsWith('/auth/refresh')
    const isAuthLogin   = originalRequest?.url?.endsWith('/auth/login')

    // 419 = CSRF token basi/hilang (sesi Laravel expired, XSRF-TOKEN belum
    // pernah di-set, dll). Self-heal: ambil cookie XSRF baru, retry sekali.
    // Berlaku untuk SEMUA request termasuk /auth/login & /auth/refresh.
    if (status === 419 && !originalRequest._csrfRetry) {
      originalRequest._csrfRetry = true
      try {
        await ensureCsrfCookie()
        
        return api(originalRequest)
      } catch {
        return Promise.reject(error)
      }
    }

    // 401 = access token cookie expired/hilang. Coba silent refresh via
    // cookie refresh_token (dikirim otomatis browser, tanpa body).
    if (status === 401 && !isAuthRefresh && !isAuthLogin && !originalRequest._retry) {
      if (_isRefreshing) {
        // Antrekan request yang datang saat refresh sedang berlangsung
        return new Promise((resolve, reject) => {
          _refreshQueue.push({ resolve, reject })
        }).then(() => api(originalRequest))
      }

      originalRequest._retry = true
      _isRefreshing = true

      try {
        await api.post('/auth/refresh')
        processQueue(null)
        
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError)

        // Untuk /auth/me, biarkan store yang menangani state "belum login" —
        // redirect paksa di sini bisa memicu loop saat bootstrap awal.
        if (!isAuthMe) {
          window.location.href = '/login'
        }
        
        return Promise.reject(refreshError)
      } finally {
        _isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export default api
