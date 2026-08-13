<template>
  <Teleport to="body">
    <!-- Elemen audio HARUS selalu ter-mount (tidak boleh digerbang oleh
         store.hasTrack) karena registerAudioEl() perlu jalan duluan sebelum
         actions play* di store bisa mengisi track apa pun — kalau digerbang,
         hasTrack tidak pernah jadi true karena audio-nya sendiri tidak pernah
         ada untuk diputar (deadlock). -->
    <audio
      ref="audioEl"
      @loadedmetadata="store._handleLoadedMetadata"
      @timeupdate="store._handleTimeUpdate"
      @play="store._handlePlay"
      @pause="store._handlePause"
      @ended="store._handleEnded"
      @error="store._handleError"
    />

    <Transition name="quran-player-pop">
      <div
        v-if="store.hasTrack"
        ref="cardEl"
        class="global-quran-player"
        :class="{ 'is-dragging': isDragging }"
        :style="style"
      >
        <div class="d-flex align-center gap-2">
          <VIcon
            icon="ri-draggable"
            size="18"
            class="text-medium-emphasis flex-shrink-0"
          />

          <RouterLink
            :to="targetRoute"
            class="no-drag flex-grow-1 min-width-0 text-decoration-none text-high-emphasis"
          >
            <div class="text-body-2 font-weight-medium text-truncate">
              {{ store.title }}
            </div>
          </RouterLink>

          <VBtn
            icon
            size="x-small"
            variant="text"
            class="no-drag flex-shrink-0"
            @click="store.stop()"
          >
            <VIcon icon="ri-close-line" size="16" />
          </VBtn>
        </div>

        <div class="text-caption text-medium-emphasis text-truncate mt-1">
          {{ store.qariName }} · {{ formatTime(store.currentTime) }} / {{ formatTime(store.duration) }}
        </div>

        <div class="d-flex align-center gap-2 mt-2">
          <VBtn
            icon
            size="small"
            variant="tonal"
            color="primary"
            class="no-drag flex-shrink-0"
            @click="store.togglePlayPause()"
          >
            <VIcon :icon="store.playing ? 'ri-pause-fill' : 'ri-play-fill'" size="18" />
          </VBtn>

          <VSlider
            :model-value="store.currentTime"
            :max="store.duration || 0"
            density="compact"
            hide-details
            color="primary"
            class="no-drag flex-grow-1"
            @update:model-value="store.seek"
          />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useDraggable, useWindowSize } from '@vueuse/core'
import { useConfigStore } from '@core/stores/config'
import { useAuthStore } from '@/stores/auth.store'
import { useQuranPlayerStore } from '@/stores/quran-player.store'
import { useSweetAlert } from '@/composables/useSweetAlert'

const store = useQuranPlayerStore()
const configStore = useConfigStore()
const authStore = useAuthStore()
const { showSuccess } = useSweetAlert()

const audioEl = ref(null)

onMounted(() => {
  store.registerAudioEl(audioEl.value)
})

const targetRoute = computed(() => ({
  name: 'quran-baca',
  params: { nomor: store.surah?.nomor },
  query: store.currentAyatNumber ? { ayat: store.currentAyatNumber } : undefined,
}))

function formatTime(sec) {
  if (!sec || Number.isNaN(sec)) return '0:00'

  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60).toString().padStart(2, '0')

  return `${m}:${s}`
}

// --- Sticky note draggable: posisi bebas, di-clamp manual ke viewport (BUKAN
// pakai opsi containerElement bawaan vueuse — itu clamp berdasar scrollHeight
// dokumen, salah untuk elemen position:fixed di halaman yang kontennya panjang). ---
const cardEl = ref(null)
const { width: winWidth, height: winHeight } = useWindowSize()

function bottomReserve() {
  // Ruang ekstra di mobile supaya tidak ketiban MobileBottomNav (block-size: 64px).
  return configStore.isLessThanOverlayNavBreakpoint ? 64 + 24 : 16
}

// getBoundingClientRect() dipakai (BUKAN cardWidth/cardHeight dari
// useElementSize) karena useElementSize me-reset width/height ke 0 tepat saat
// elemen baru muncul di DOM, baru terisi ukuran asli lewat ResizeObserver yang
// jalan async — tidak dijamin selesai di dalam nextTick() yang sama, jadi
// posisi default sempat dihitung seolah kartu berukuran 0px (kartu jadi
// menjorok jauh keluar viewport, nyaris tidak kelihatan). getBoundingClientRect()
// sinkron dan selalu akurat saat dipanggil — pola yang sama dipakai useDraggable
// sendiri secara internal untuk clamp drag-nya.
function getCardSize() {
  const rect = cardEl.value?.getBoundingClientRect()

  return { w: rect?.width || 300, h: rect?.height || 120 }
}

function clamp(pos) {
  const { w, h } = getCardSize()
  const maxX = Math.max(16, winWidth.value - w - 16)
  const maxY = Math.max(16, winHeight.value - h - bottomReserve())

  return {
    x: Math.min(Math.max(16, pos.x), maxX),
    y: Math.min(Math.max(16, pos.y), maxY),
  }
}

function defaultPosition() {
  const { w, h } = getCardSize()

  return {
    x: winWidth.value - w - 16,
    y: winHeight.value - h - bottomReserve(),
  }
}

function loadSavedPosition() {
  try {
    const raw = localStorage.getItem('quran:playerPosition')

    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const savedPosition = loadSavedPosition()

const { isDragging, style, position } = useDraggable(cardEl, {
  initialValue: savedPosition ?? { x: 0, y: 0 },
  onStart: (pos, event) => {
    // Batalkan drag kalau pointerdown berasal dari kontrol interaktif
    // (judul, tombol, slider) — biarkan klik/interaksi normalnya jalan.
    if (event.target.closest('.no-drag')) return false
  },
  onMove: pos => {
    position.value = clamp(pos)
  },
  onEnd: () => {
    try {
      localStorage.setItem('quran:playerPosition', JSON.stringify(position.value))
    } catch (e) {
      console.error('Gagal menyimpan posisi player Al-Qur\'an', e)
    }
  },
})

// Belum pernah di-drag sebelumnya (tidak ada saved position) → taruh default
// di pojok kanan-bawah, dihitung setelah kartu benar-benar ter-render.
watch(() => store.hasTrack, hasTrack => {
  if (!hasTrack || savedPosition) return

  nextTick(() => {
    position.value = clamp(defaultPosition())
  })
}, { immediate: true })

// Re-clamp kalau viewport berubah (resize/rotate) supaya kartu tidak nyangkut di luar layar.
watch([winWidth, winHeight], () => {
  if (store.hasTrack) position.value = clamp(position.value)
})

// Mencegah state/metadata Quran nyangkut lintas akun di device yang sama —
// kekhawatiran yang sama dengan yang sudah diantisipasi useQuranLocalStore.js
// untuk localStorage riwayat baca/bookmark.
watch(() => authStore.isLoggedIn, loggedIn => {
  if (!loggedIn) store.stop()
})

// Toast "selesai baca" pindah ke sini (bukan di store) karena useSweetAlert()
// butuh context komponen (pakai useTheme() di dalamnya).
watch(() => store.finishedToken, (value, oldValue) => {
  if (value > oldValue) showSuccess('Selesai membaca surah ini.')
})

// --- Media Session: metadata & lock-screen/notification controls (mobile) ---
function updateMediaSessionMetadata() {
  if (!('mediaSession' in navigator)) return

  if (!store.hasTrack) {
    navigator.mediaSession.metadata = null
    navigator.mediaSession.playbackState = 'none'

    return
  }

  navigator.mediaSession.metadata = new MediaMetadata({
    title: store.title,
    artist: store.qariName,
    album: 'Al-Qur\'an — IRON',
    artwork: [
      { src: '/images/iron/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/images/iron/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  })
}

watch(() => [store.surah?.nomor, store.mode, store.currentAyatNumber, store.qariKode], updateMediaSessionMetadata, { immediate: true })

watch(() => store.playing, playing => {
  if ('mediaSession' in navigator)
    navigator.mediaSession.playbackState = playing ? 'playing' : (store.hasTrack ? 'paused' : 'none')
})

watch(() => [store.currentTime, store.duration], ([time, duration]) => {
  if (!('mediaSession' in navigator) || !navigator.mediaSession.setPositionState || !duration) return

  try {
    navigator.mediaSession.setPositionState({ duration, playbackRate: 1, position: Math.min(time, duration) })
  } catch {
    // Posisi tidak valid (mis. race saat ganti track) — abaikan, bukan fatal.
  }
})

onMounted(() => {
  if (!('mediaSession' in navigator)) return

  navigator.mediaSession.setActionHandler('play', () => store.togglePlayPause())
  navigator.mediaSession.setActionHandler('pause', () => store.togglePlayPause())
  navigator.mediaSession.setActionHandler('seekto', details => {
    if (details.seekTime != null) store.seek(details.seekTime)
  })
  navigator.mediaSession.setActionHandler('stop', () => store.stop())
})

// previoustrack/nexttrack di-set null (bukan cuma no-op) saat tidak relevan
// (mode santai, atau sudah di ayat pertama/terakhir) supaya tombolnya hilang
// total dari lock-screen, bukan cuma tampil disabled.
watch(() => [store.mode, store.hasNextAyat, store.hasPrevAyat], () => {
  if (!('mediaSession' in navigator)) return

  navigator.mediaSession.setActionHandler('previoustrack', (store.mode === 'ikuti' && store.hasPrevAyat) ? () => store.prevAyat() : null)
  navigator.mediaSession.setActionHandler('nexttrack', (store.mode === 'ikuti' && store.hasNextAyat) ? () => store.nextAyat() : null)
}, { immediate: true })
</script>

<style scoped>
.global-quran-player {
  position: fixed;
  z-index: 2500;
  width: min(300px, calc(100vw - 32px));
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  padding: 12px 12px 8px;
  cursor: grab;
  touch-action: none;
  transition: box-shadow 0.15s ease, transform 0.15s ease;
}

.global-quran-player.is-dragging {
  cursor: grabbing;
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.25);
  transform: scale(1.02);
}

.no-drag {
  cursor: default;
  touch-action: auto;
}

.min-width-0 {
  min-width: 0;
}

.quran-player-pop-enter-active,
.quran-player-pop-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.quran-player-pop-enter-from,
.quran-player-pop-leave-to {
  transform: scale(0.9);
  opacity: 0;
}
</style>
