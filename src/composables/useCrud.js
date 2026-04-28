import { ref, reactive } from 'vue'
import { useSweetAlert } from '@/composables/useSweetAlert'
import api from '@/utils/axios.js'

const fetchAllCache = new Map()
const fetchAllRequests = new Map()

function invalidateFetchAllCache(endpoint) {
  fetchAllCache.delete(endpoint)
  fetchAllRequests.delete(endpoint)
}

/**
 * Generic CRUD composable
 * @param {string} endpoint - API endpoint e.g. '/iam/users'
 */
export function useCrud(endpoint) {
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
      const { data } = await api.get(endpoint, {
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
    const { force = false, ...axiosConfig } = requestConfig
    const canReuseCache = !force && !axiosConfig.signal

    if (canReuseCache && fetchAllCache.has(endpoint)) {
      items.value = fetchAllCache.get(endpoint)

      return items.value
    }

    if (canReuseCache && fetchAllRequests.has(endpoint)) {
      loading.value = true

      try {
        const cachedItems = await fetchAllRequests.get(endpoint)

        items.value = cachedItems

        return cachedItems
      } finally {
        loading.value = false
      }
    }

    loading.value = true
    error.value = null
    const requestPromise = (async () => {
      const { data } = await api.get(endpoint, {
        params: { all: true },
        ...axiosConfig,
      })

      return data.data
    })()

    if (canReuseCache)
      fetchAllRequests.set(endpoint, requestPromise)

    try {
      const result = await requestPromise

      items.value = result
      if (canReuseCache)
        fetchAllCache.set(endpoint, result)

      return result
    } catch (err) {
      if (err.code === 'ERR_CANCELED')
        return items.value

      error.value = err.response?.data?.message ?? 'Gagal memuat data'
    } finally {
      if (canReuseCache)
        fetchAllRequests.delete(endpoint)

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

  return { items, item, loading, saving, error, meta, params, fetchList, fetchAll, fetchOne, create, update, remove }
}
