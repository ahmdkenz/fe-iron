import { ref } from 'vue'

export function useLazyFetchAll(fetchAll) {
  const isLoaded = ref(false)
  let pendingRequest = null

  async function ensureLoaded(options) {
    if (isLoaded.value && !options?.force)
      return true

    if (pendingRequest)
      return pendingRequest

    pendingRequest = Promise.resolve(fetchAll(options))
      .then(() => {
        isLoaded.value = true

        return true
      })
      .finally(() => {
        pendingRequest = null
      })

    return pendingRequest
  }

  return {
    isLoaded,
    ensureLoaded,
  }
}
