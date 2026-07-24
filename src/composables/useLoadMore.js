import { computed, reactive, ref } from 'vue'
import api from '@/utils/axios.js'

const MAX_SAFE_PER_PAGE = 100

/**
 * Composable pagination "load more" (append per halaman, bukan replace).
 * Menggeneralisasi pola fetchCandidates(type, {append}) di MatchDialog.vue.
 * @param {string} endpoint
 * @param {object} [options]
 * @param {object} [options.params] - filter awal, digabung ke query string
 * @param {number} [options.perPage]
 * @param {string} [options.itemKey] - dipakai untuk dedupe saat append
 */
export function useLoadMore(endpoint, options = {}) {
  const perPage = Math.min(options.perPage ?? 25, MAX_SAFE_PER_PAGE)
  const itemKey = options.itemKey ?? 'id'

  const items = ref([])
  const loading = ref(false)
  const loadingMore = ref(false)
  const error = ref(null)
  const page = ref(1)
  const lastPage = ref(1)
  const total = ref(0)
  const params = reactive({ ...(options.params ?? {}) })

  const hasMore = computed(() => page.value < lastPage.value)

  let controller = null

  async function fetch({ append = false } = {}) {
    controller?.abort()

    const ctrl = new AbortController()

    controller = ctrl

    const nextPage = append ? page.value + 1 : 1

    if (append) loadingMore.value = true
    else loading.value = true
    error.value = null

    try {
      const { data } = await api.get(endpoint, {
        params: { ...params, page: nextPage, per_page: perPage },
        signal: ctrl.signal,
      })

      const newItems = data.data ?? []

      if (append) {
        const existingKeys = new Set(items.value.map(i => i[itemKey]))

        items.value = [...items.value, ...newItems.filter(i => !existingKeys.has(i[itemKey]))]
      } else {
        items.value = newItems
      }

      page.value = data.meta?.current_page ?? nextPage
      lastPage.value = data.meta?.last_page ?? 1
      total.value = data.meta?.total ?? newItems.length

      return items.value
    } catch (err) {
      if (err.code === 'ERR_CANCELED') return items.value

      if (!append) items.value = []
      error.value = err.response?.data?.message ?? 'Gagal memuat data'

      return items.value
    } finally {
      if (controller === ctrl) controller = null
      if (append) loadingMore.value = false
      else loading.value = false
    }
  }

  function reset(overrideParams = {}) {
    Object.assign(params, overrideParams)

    return fetch({ append: false })
  }

  function loadMore() {
    if (!hasMore.value || loading.value || loadingMore.value) return

    return fetch({ append: true })
  }

  function abort() {
    controller?.abort()
    controller = null
  }

  return { items, loading, loadingMore, error, page, lastPage, total, hasMore, params, reset, loadMore, abort }
}
