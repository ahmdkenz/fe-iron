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

    <Transition name="quran-player-slide">
      <div
        v-if="store.hasTrack"
        class="global-quran-player"
        :class="{ 'above-mobile-nav': configStore.isLessThanOverlayNavBreakpoint }"
      >
        <VProgressLinear
          :model-value="progressPct"
          height="3"
          color="primary"
        />

        <div class="d-flex align-center gap-3 px-4 py-2">
          <VBtn
            icon
            size="small"
            variant="tonal"
            color="primary"
            @click="store.togglePlayPause()"
          >
            <VIcon :icon="store.playing ? 'ri-pause-fill' : 'ri-play-fill'" />
          </VBtn>

          <RouterLink
            :to="targetRoute"
            class="flex-grow-1 min-width-0 text-decoration-none text-high-emphasis"
          >
            <div class="text-body-2 font-weight-medium text-truncate">
              {{ store.title }}
            </div>
            <div class="text-caption text-medium-emphasis text-truncate">
              {{ store.qariName }} · {{ formatTime(store.currentTime) }} / {{ formatTime(store.duration) }}
            </div>
          </RouterLink>

          <VSlider
            v-if="mdAndUp"
            :model-value="store.currentTime"
            :max="store.duration || 0"
            density="compact"
            hide-details
            color="primary"
            style="max-width: 240px;"
            @update:model-value="store.seek"
          />

          <VBtn
            icon
            size="small"
            variant="text"
            @click="store.stop()"
          >
            <VIcon icon="ri-close-line" />
          </VBtn>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { useConfigStore } from '@core/stores/config'
import { useAuthStore } from '@/stores/auth.store'
import { useQuranPlayerStore } from '@/stores/quran-player.store'
import { useSweetAlert } from '@/composables/useSweetAlert'

const store = useQuranPlayerStore()
const configStore = useConfigStore()
const authStore = useAuthStore()
const { showSuccess } = useSweetAlert()
const { mdAndUp } = useDisplay()

const audioEl = ref(null)

onMounted(() => {
  store.registerAudioEl(audioEl.value)
})

const progressPct = computed(() => (store.duration ? (store.currentTime / store.duration) * 100 : 0))

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
  inset-inline: 0;
  inset-block-end: 0;
  z-index: 2500;
  background: rgb(var(--v-theme-surface));
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.08);
}

/* Geser ke atas MobileBottomNav (block-size: 64px) supaya tidak tumpang tindih. */
.global-quran-player.above-mobile-nav {
  inset-block-end: calc(64px + env(safe-area-inset-bottom, 0px));
}

.min-width-0 {
  min-width: 0;
}

.quran-player-slide-enter-active,
.quran-player-slide-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.quran-player-slide-enter-from,
.quran-player-slide-leave-to {
  transform: translateY(16px);
  opacity: 0;
}
</style>
