import { ref, watch } from 'vue'
import { useGeolocation } from '@vueuse/core'

/**
 * Kota+negara user saat ini via GPS browser. Kalau izin ditolak atau
 * reverse-geocoding gagal, locationLabel tetap null selamanya — caller
 * memilih untuk menyembunyikan elemen lokasi, bukan menampilkan fallback.
 */
export function useUserLocation() {
  const locationLabel = ref(null)
  const { coords, error, pause } = useGeolocation({ enableHighAccuracy: false })

  watch(coords, async val => {
    if (!val || val.latitude === Infinity) return

    pause()

    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${val.latitude}&longitude=${val.longitude}&localityLanguage=id`,
      )
      const data = await response.json()
      const city = data.city || data.locality

      if (city) locationLabel.value = data.countryName ? `${city}, ${data.countryName}` : city
    } catch {
      // Biarkan locationLabel null — elemen lokasi disembunyikan oleh caller.
    }
  }, { immediate: true })

  watch(error, err => {
    if (err) locationLabel.value = null
  })

  return { locationLabel }
}
