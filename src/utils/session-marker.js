// Marker non-secret (bukan token) di localStorage: penanda "pernah login di
// browser ini". Dipakai router guard untuk memutuskan apakah halaman guest
// (mis. /login) perlu cek /auth/me, dan oleh axios.js untuk membersihkan
// marker saat silent refresh gagal (refresh_token invalid/habis).
export const SESSION_MARKER_KEY = 'iron_auth_session'

export function hasSessionMarker() {
  return localStorage.getItem(SESSION_MARKER_KEY) === '1'
}

export function setSessionMarker() {
  localStorage.setItem(SESSION_MARKER_KEY, '1')
}

export function clearSessionMarker() {
  localStorage.removeItem(SESSION_MARKER_KEY)
}
