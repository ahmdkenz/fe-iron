import { ref, reactive } from 'vue'
import { useSweetAlert } from '@/composables/useSweetAlert'
import api from '@/utils/axios.js'

const fetchAllCache = new Map()
const fetchAllRequests = new Map()

function invalidateFetchAllCache(endpoint) {
  for (const key of fetchAllCache.keys()) {
    if (key === endpoint || key.startsWith(`${endpoint}?`)) fetchAllCache.delete(key)
  }
  for (const key of fetchAllRequests.keys()) {
    if (key === endpoint || key.startsWith(`${endpoint}?`)) fetchAllRequests.delete(key)
  }
}

/**
 * Bersihkan seluruh cache fetchAll lintas endpoint. fetchAllCache adalah
 * singleton module-level (dipakai bersama semua instance useCrud), jadi
 * kalau tidak dibersihkan saat ganti user, data user sebelumnya (mis. daftar
 * Client PIC AR lain) bisa kebawa ke sesi user berikutnya di browser yang sama.
 */
export function clearFetchAllCache() {
  fetchAllCache.clear()
  fetchAllRequests.clear()
}

/**
 * Generic CRUD composable
 * @param {string} endpoint - API endpoint e.g. '/iam/users'
 * @param {object} [options]
 * @param {string} [options.listEndpoint] - endpoint used by fetchList/fetchAll, defaults to `endpoint`.
 */
export function useCrud(endpoint, options = {}) {
  const listEndpoint = options.listEndpoint ?? endpoint
  const { showLoading, closeAlert } = useSweetAlert()
  const items = ref([])
  const item = ref(null)
  const loading = ref(false)
  const saving = ref(false)
  const error = ref(null)
  const meta = reactive({ current_page: 1, last_page: 1, per_page: 10, total: 0 })

  const params = reactive({ page: 1, per_page: 10, search: '' })

  async function fetchList(overrideParams = {}, requestConfig = {}) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get(listEndpoint, {
        params: { ...params, ...overrideParams },
        ...requestConfig,
      })

      items.value = data.data
      if (data.meta) Object.assign(meta, data.meta)
    } catch (err) {
      if (err.code === 'ERR_CANCELED')
        return items.value

      error.value = err.response?.data?.message ?? 'Gagal memuat data'
    } finally {
      loading.value = false
    }
  }

  async function fetchAll(requestConfig = {}) {
    const { force = false, params: extraParams, ...axiosConfig } = requestConfig
    const cacheKey = extraParams ? `${listEndpoint}?${new URLSearchParams(extraParams).toString()}` : listEndpoint
    const canReuseCache = !force && !axiosConfig.signal

    if (canReuseCache && fetchAllCache.has(cacheKey)) {
      items.value = fetchAllCache.get(cacheKey)

      return items.value
    }

    if (canReuseCache && fetchAllRequests.has(cacheKey)) {
      loading.value = true

      try {
        const cachedItems = await fetchAllRequests.get(cacheKey)

        items.value = cachedItems

        return cachedItems
      } catch (err) {
        if (err.code !== 'ERR_CANCELED')
          error.value = err.response?.data?.message ?? 'Gagal memuat data'
      } finally {
        loading.value = false
      }
    }

    loading.value = true
    error.value = null
    const requestPromise = (async () => {
      const { data } = await api.get(listEndpoint, {
        params: { all: true, ...extraParams },
        ...axiosConfig,
      })

      return data.data
    })()

    if (canReuseCache)
      fetchAllRequests.set(cacheKey, requestPromise)

    try {
      const result = await requestPromise

      items.value = result
      if (canReuseCache)
        fetchAllCache.set(cacheKey, result)

      return result
    } catch (err) {
      if (err.code === 'ERR_CANCELED')
        return items.value

      error.value = err.response?.data?.message ?? 'Gagal memuat data'
    } finally {
      if (canReuseCache)
        fetchAllRequests.delete(cacheKey)

      loading.value = false
    }
  }

  async function fetchOne(id, requestConfig = {}) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get(`${endpoint}/${id}`, requestConfig)

      item.value = data.data
      
      return data.data
    } catch (err) {
      if (err.code === 'ERR_CANCELED')
        return item.value

      error.value = err.response?.data?.message ?? 'Data tidak ditemukan'
      
      return null
    } finally {
      loading.value = false
    }
  }

  async function create(payload) {
    saving.value = true
    error.value = null
    showLoading({
      title: 'Menyimpan Data',
      text: 'Perubahan sedang diproses...',
    })
    try {
      const { data } = await api.post(endpoint, payload)

      invalidateFetchAllCache(endpoint)
      
      return { success: true, data: data.data, message: data.message ?? '' }
    } catch (err) {
      const message = err.response?.data?.message ?? 'Gagal menyimpan data'

      error.value = message
      
      return { success: false, message, errors: err.response?.data?.errors ?? {} }
    } finally {
      closeAlert({ onlyLoading: true })
      saving.value = false
    }
  }

  async function update(id, payload) {
    saving.value = true
    error.value = null
    showLoading({
      title: 'Menyimpan Perubahan',
      text: 'Perubahan sedang diproses...',
    })
    try {
      const { data } = await api.put(`${endpoint}/${id}`, payload)

      invalidateFetchAllCache(endpoint)
      
      return { success: true, data: data.data, message: data.message ?? '' }
    } catch (err) {
      const message = err.response?.data?.message ?? 'Gagal mengubah data'

      error.value = message
      
      return { success: false, message, errors: err.response?.data?.errors ?? {} }
    } finally {
      closeAlert({ onlyLoading: true })
      saving.value = false
    }
  }

  async function remove(id) {
    loading.value = true
    error.value = null
    showLoading({
      title: 'Menghapus Data',
      text: 'Data sedang dihapus...',
    })
    try {
      await api.delete(`${endpoint}/${id}`)

      invalidateFetchAllCache(endpoint)
      
      return { success: true }
    } catch (err) {
      const message = err.response?.data?.message ?? 'Gagal menghapus data'

      error.value = message
      
      return { success: false, message }
    } finally {
      closeAlert({ onlyLoading: true })
      loading.value = false
    }
  }

  /** Sisipkan objek yang sudah diketahui (mis. klien yang sedang dipilih saat edit) agar tampil di dropdown tanpa perlu ada di hasil fetchAll. */
  function ensureItem(item, valueKey = 'id') {
    if (!item || item[valueKey] == null) return
    if (items.value.some(i => i[valueKey] === item[valueKey])) return
    items.value = [item, ...items.value]
  }

  return { items, item, loading, saving, error, meta, params, fetchList, fetchAll, fetchOne, create, update, remove, ensureItem }
}
