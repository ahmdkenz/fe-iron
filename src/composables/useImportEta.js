import { computed, onBeforeUnmount, ref, watch } from 'vue'

function resolve(source) {
  return typeof source === 'function' ? source() : source?.value
}

function formatDuration(totalSeconds) {
  if (totalSeconds === null || totalSeconds === undefined || Number.isNaN(totalSeconds)) return null

  const s = Math.max(0, Math.round(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60

  if (h > 0) return `${h}j ${String(m).padStart(2, '0')}m`
  if (m > 0) return `${m}m ${String(sec).padStart(2, '0')}d`

  return `${sec}d`
}

/**
 * Elapsed time + estimasi waktu selesai (ETA) untuk dialog progress import
 * async (Import Master Data, Master Invoice, Opening Balance, Rekonsiliasi
 * Bank). Backend (ImportEtaCalculator di be-iron) menghitung ulang
 * elapsed_seconds/estimated_remaining_seconds setiap di-poll, tapi polling
 * cuma tiap 1.5-2.5 detik — supaya elapsed time terlihat berjalan mulus,
 * composable ini menaikkan elapsed secara lokal tiap detik dan resync ke
 * angka server setiap kali progress baru datang.
 *
 * estimated_remaining_seconds sengaja bisa null dari backend (data belum
 * cukup, atau fase saat ini tidak punya progress per-baris seperti
 * saving/auto_matching di Rekonsiliasi Bank) — dalam kondisi itu etaLabel
 * ikut null, biar caller memilih sendiri mau ditampilkan sebagai
 * "Menghitung estimasi..." atau disembunyikan, tidak dipaksakan tebakan.
 *
 * @param {import('vue').Ref<object>|(() => object)} progressSource - ref/getter progress hasil
 *   polling, minimal punya field elapsed_seconds & estimated_remaining_seconds.
 * @param {import('vue').Ref<boolean>|(() => boolean)} activeSource - ref/getter yang menandakan
 *   timer boleh berjalan (mis. dialog terbuka & proses belum status terminal).
 */
export function useImportEta(progressSource, activeSource) {
  const elapsedSeconds = ref(null)
  let tickTimer = null

  function syncFromServer() {
    const serverElapsed = resolve(progressSource)?.elapsed_seconds

    elapsedSeconds.value = typeof serverElapsed === 'number' ? serverElapsed : null
  }

  function stopTicking() {
    clearInterval(tickTimer)
    tickTimer = null
  }

  function startTicking() {
    stopTicking()
    tickTimer = setInterval(() => {
      if (elapsedSeconds.value !== null) elapsedSeconds.value++
    }, 1000)
  }

  watch(() => resolve(progressSource)?.elapsed_seconds, syncFromServer, { immediate: true })
  watch(() => resolve(activeSource), active => (active ? startTicking() : stopTicking()), { immediate: true })
  onBeforeUnmount(stopTicking)

  const elapsedLabel = computed(() => {
    const label = formatDuration(elapsedSeconds.value)

    return label ? `Berjalan ${label}` : null
  })

  const etaLabel = computed(() => {
    const remaining = resolve(progressSource)?.estimated_remaining_seconds
    if (remaining === null || remaining === undefined) return null
    if (remaining <= 0) return 'Hampir selesai...'

    const label = formatDuration(remaining)

    return label ? `Estimasi selesai ~${label} lagi` : null
  })

  return { elapsedLabel, etaLabel }
}
