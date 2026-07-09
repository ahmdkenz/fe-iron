import { ref } from 'vue'
import api from '@/utils/axios'

/**
 * Search-as-you-type terhadap endpoint list yang sudah mendukung
 * `search` + `per_page` (server-side), menggantikan pola lama "muat semua
 * data sekali lalu filter di client". Request lama dibatalkan otomatis
 * setiap kali request baru dikirim.
 */
export function useRemoteSearch(endpoint, { perPage = 20, debounceMs = 300, params } = {}) {
  const items   = ref([])
  const loading = ref(false)

  let controller = null
  let debounceTimer = null

  async function runSearch(term) {
    controller?.abort()
    const localController = new AbortController()
    controller = localController
    loading.value = true
    try {
      const { data } = await api.get(endpoint, {
        params: {
          search: term || undefined,
          per_page: perPage,
          ...(params ? params() : {}),
        },
        signal: localController.signal,
      })
      items.value = data.data ?? []
    } catch (err) {
      if (err?.code === 'ERR_CANCELED') return
      items.value = []
    } finally {
      if (controller === localController) loading.value = false
    }
  }

  function search(term) {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => runSearch(term), debounceMs)
  }

  function searchNow(term = '') {
    clearTimeout(debounceTimer)
    return runSearch(term)
  }

  /** Sisipkan objek yang sudah diketahui (mis. klien yang sedang dipilih saat edit) agar tampil di dropdown tanpa perlu dicari ulang. */
  function ensureItem(item, valueKey = 'id') {
    if (!item || item[valueKey] == null) return
    if (items.value.some(i => i[valueKey] === item[valueKey])) return
    items.value = [item, ...items.value]
  }

  return { items, loading, search, searchNow, ensureItem }
}
