import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'

/**
 * Riwayat baca & bookmark Al-Qur'an disimpan di localStorage (per-device,
 * bukan di server) — keputusan sadar agar fitur ini tidak butuh tabel
 * database baru sama sekali. Kuncinya WAJIB dinamespace per user.id (bukan
 * kunci global) supaya data tidak "bocor" antar akun Iron yang bergantian
 * login di browser/PC yang sama — sama seperti kekhawatiran cross-user cache
 * di useCrud.js, diselesaikan di sini lewat namespacing alih-alih clear-on-switch.
 */
export function useQuranLocalStore() {
  const authStore = useAuthStore()
  const userId = computed(() => authStore.user?.id ?? 'guest')

  function progressKey() {
    return `quran:progress:${userId.value}`
  }

  function bookmarksKey() {
    return `quran:bookmarks:${userId.value}`
  }

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key)

      return raw ? JSON.parse(raw) : fallback
    } catch {
      return fallback
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      console.error('Gagal menyimpan data Al-Qur\'an ke localStorage', e)
    }
  }

  function listProgress() {
    const map = readJson(progressKey(), {})

    return Object.entries(map)
      .map(([nomorSurah, entry]) => ({ nomorSurah: Number(nomorSurah), ...entry }))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  }

  function getProgress(nomorSurah) {
    const map = readJson(progressKey(), {})

    return map[nomorSurah] ?? null
  }

  function upsertProgress(nomorSurah, ayatNumber, namaSurah) {
    const map = readJson(progressKey(), {})

    map[nomorSurah] = { ayatNumber, namaSurah, updatedAt: new Date().toISOString() }
    writeJson(progressKey(), map)
  }

  function listBookmarks() {
    return readJson(bookmarksKey(), [])
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }

  function addBookmark({ nomorSurah, namaSurah, ayatNumber, catatan }) {
    const list = readJson(bookmarksKey(), [])
    const bookmark = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      nomorSurah,
      namaSurah,
      ayatNumber,
      catatan: catatan || '',
      createdAt: new Date().toISOString(),
    }

    list.push(bookmark)
    writeJson(bookmarksKey(), list)

    return bookmark
  }

  function removeBookmark(id) {
    writeJson(bookmarksKey(), readJson(bookmarksKey(), []).filter(b => b.id !== id))
  }

  function isBookmarked(nomorSurah, ayatNumber) {
    return readJson(bookmarksKey(), []).some(b => b.nomorSurah === nomorSurah && b.ayatNumber === ayatNumber)
  }

  return {
    listProgress,
    getProgress,
    upsertProgress,
    listBookmarks,
    addBookmark,
    removeBookmark,
    isBookmarked,
  }
}
