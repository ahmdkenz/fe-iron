<template>
  <div class="premium-baca-layout pb-12">
    <!-- Latar Belakang Halus -->
    <div class="islamic-pattern-bg"></div>

    <div class="content-wrapper relative-z">
      <PageHeroHeader
        tone="emerald"
        icon="ri-book-open-line"
        :title="surah ? `${surah.namaLatin} (${surah.nama})` : 'Al-Qur\'an'"
        :subtitle="surah?.arti ?? ''"
        :breadcrumbs="[
          { title: 'Dashboard', to: { name: 'dashboard' } },
          { title: 'Al-Qur\'an', to: { name: 'quran-index' } },
          { title: surah?.namaLatin ?? '...', disabled: true }
        ]"
        :stats="surah ? [
          { key: 'nomor', icon: 'ri-hashtag', value: `Surah ${surah.nomor}`, label: 'Urutan' },
          { key: 'ayat', icon: 'ri-list-check', value: `${surah.jumlahAyat} Ayat`, label: 'Jumlah Ayat' },
          { key: 'turun', icon: 'ri-map-pin-line', value: surah.tempatTurun, label: 'Tempat Turun' },
        ] : []"
        compact-actions
        class="mb-6"
      >
        <template #actions>
          <VBtn
            :disabled="!prevNomor"
            variant="tonal"
            icon="ri-arrow-left-s-line"
            class="rounded-lg mr-2"
            :to="prevNomor ? { name: 'quran-baca', params: { nomor: prevNomor } } : undefined"
          />
          <VBtn
            :disabled="!nextNomor"
            variant="tonal"
            icon="ri-arrow-right-s-line"
            class="rounded-lg"
            :to="nextNomor ? { name: 'quran-baca', params: { nomor: nextNomor } } : undefined"
          />
        </template>
      </PageHeroHeader>

      <VAlert
        v-if="error"
        type="error"
        variant="tonal"
        class="mb-6 rounded-xl"
      >
        {{ error }}
      </VAlert>

      <VSkeletonLoader
        v-if="loading"
        type="article, list-item-three-line@6"
        class="bg-transparent"
      />

      <div
        v-else-if="surah"
        class="quran-baca-container"
      >
        <!-- Panel Kontrol Audio (Lebih Rapi & Responsif) -->
        <VCard class="mb-8 rounded-xl border" variant="flat" color="surface">
          <VCardText class="pa-4 pa-md-6">
            <div class="d-flex flex-column flex-md-row align-md-center gap-4">
              <!-- Qari Selector -->
              <div class="flex-grow-1 flex-md-grow-0" style="min-width: 250px;">
                <QariSelector v-model="qariKode" />
              </div>

              <!-- Radio Button untuk Mode Playback (Solusi UI Berantakan) -->
              <VRadioGroup
                v-model="playbackMode"
                inline
                hide-details
                color="primary"
                class="flex-shrink-0 playback-radio-group"
              >
                <VRadio label="Ikuti Bacaan" value="ikuti" class="mr-4"></VRadio>
                <VRadio label="Dengar Santai" value="santai"></VRadio>
              </VRadioGroup>

              <VSpacer class="d-none d-md-block" />

              <!-- Tombol Putar (Hanya muncul di mode Ikuti Bacaan) -->
              <div v-if="playbackMode === 'ikuti'" class="d-flex align-center mt-2 mt-md-0">
                <VBtn
                  :color="sequentialPlaying ? 'primary' : 'primary'"
                  :variant="sequentialPlaying ? 'flat' : 'tonal'"
                  rounded="pill"
                  size="large"
                  class="font-weight-bold px-6 text-none"
                  :prepend-icon="sequentialPlaying ? 'ri-pause-fill' : 'ri-play-fill'"
                  @click="toggleSequential"
                >
                  {{ playButtonLabel }}
                </VBtn>
              </div>
            </div>

            <VDivider class="my-4" />

            <!-- Info / Full Player -->
            <div v-if="playbackMode === 'ikuti'" class="text-caption text-medium-emphasis d-flex align-center">
              <VIcon icon="ri-information-line" size="18" class="mr-2" />
              Audio diputar berurutan. Halaman akan otomatis mengikuti ayat yang disorot.
            </div>
            <div v-else>
              <QuranAudioPlayer
                ref="fullPlayerRef"
                :src="fullAudioSrc"
                label="Audio Utuh — tanpa sorotan ayat"
              />
            </div>
          </VCardText>
        </VCard>

        <!-- Daftar Ayat (Bentuk Card Asli Vuetify agar terlihat jelas di Dark/Light Mode) -->
        <div class="d-flex flex-column gap-4">
          <VCard
            v-for="ayat in surah.ayat"
            :key="ayat.nomorAyat"
            :ref="el => setAyatRef(ayat.nomorAyat, el)"
            :data-ayat="ayat.nomorAyat"
            class="ayat-card rounded-xl border transition-swing"
            :class="{
              'ayat-bookmarked': isBookmarked(surah.nomor, ayat.nomorAyat),
              'ayat-playing elevation-10 border-primary': currentPlayingAyat === ayat.nomorAyat
            }"
            variant="flat"
            color="surface"
          >
            <VCardText class="pa-4 pa-md-6">
              <!-- Header Ayat -->
              <div class="d-flex justify-space-between align-center mb-6">
                <div class="ayat-number-chip" :class="{'bg-primary text-white': currentPlayingAyat === ayat.nomorAyat}">
                  {{ ayat.nomorAyat }}
                </div>
                
                <div class="d-flex gap-2">
                  <VBtn
                    icon
                    size="small"
                    variant="text"
                    :color="currentPlayingAyat === ayat.nomorAyat && sequentialPlaying ? 'primary' : 'default'"
                    @click="playFromAyat(ayat)"
                  >
                    <VIcon :icon="currentPlayingAyat === ayat.nomorAyat && sequentialPlaying ? 'ri-pause-circle-fill' : 'ri-play-circle-line'" size="26" />
                    <VTooltip activator="parent">Putar dari ayat ini</VTooltip>
                  </VBtn>
                  <VBtn
                    icon
                    size="small"
                    variant="text"
                    :color="isBookmarked(surah.nomor, ayat.nomorAyat) ? 'warning' : 'default'"
                    @click="openBookmarkDialog(ayat)"
                  >
                    <VIcon :icon="isBookmarked(surah.nomor, ayat.nomorAyat) ? 'ri-bookmark-fill' : 'ri-bookmark-line'" size="22" />
                    <VTooltip activator="parent">Tandai</VTooltip>
                  </VBtn>
                </div>
              </div>

              <!-- Teks Ayat dengan Grid Responsif -->
              <VRow class="mt-0">
                <!-- Teks Arab (Di kanan pada layar besar, di atas pada layar kecil) -->
                <VCol cols="12" md="7" order-md="2" class="text-right">
                  <p class="quran-arabic-text">
                    <span
                      v-for="(word, idx) in wordsByAyat[ayat.nomorAyat]"
                      :key="idx"
                      class="quran-word"
                      :class="{ 'quran-word-active': currentPlayingAyat === ayat.nomorAyat && idx === currentWordIndex }"
                    >{{ word }}</span>
                  </p>
                </VCol>
                
                <!-- Teks Terjemahan (Di kiri pada layar besar, di bawah pada layar kecil) -->
                <VCol cols="12" md="5" order-md="1" class="border-e-md pr-md-6 pt-md-2">
                  <p class="text-primary font-italic font-weight-medium mb-3 transliteration">
                    {{ ayat.teksLatin }}
                  </p>
                  <p class="text-body-1 text-medium-emphasis mb-0 translation">
                    {{ ayat.teksIndonesia }}
                  </p>
                </VCol>
              </VRow>
            </VCardText>
          </VCard>
        </div>

        <audio
          ref="ayatAudioEl"
          @ended="onAyatAudioEnded"
          @timeupdate="onAyatTimeUpdate"
        />
      </div>
    </div>

    <!-- Dialog Bookmark -->
    <VDialog
      v-model="showBookmarkDialog"
      max-width="420"
    >
      <VCard class="rounded-xl border" variant="flat">
        <VCardTitle class="pt-6 px-6 font-weight-bold d-flex align-center">
          <VIcon icon="ri-bookmark-line" color="primary" class="mr-2" />
          Tandai Ayat {{ bookmarkTargetAyat?.nomorAyat }}
        </VCardTitle>
        <VCardText class="px-6 pb-2">
          <VTextarea
            v-model="bookmarkNote"
            label="Catatan (opsional)"
            rows="3"
            auto-grow
            variant="outlined"
            class="mt-2"
          />
        </VCardText>
        <VCardActions class="px-6 pb-6 pt-0">
          <VSpacer />
          <VBtn
            variant="text"
            color="medium-emphasis"
            class="text-none font-weight-medium px-4"
            @click="showBookmarkDialog = false"
          >
            Batal
          </VBtn>
          <VBtn
            color="primary"
            variant="flat"
            class="text-none font-weight-bold px-6 rounded-lg"
            @click="confirmBookmark"
          >
            Simpan
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<script setup>
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/utils/axios'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { DEFAULT_QARI_KODE } from '@/constants/qari'
import { useQuranLocalStore } from '../../../composables/useQuranLocalStore'
import QariSelector from '../../../components/QariSelector.vue'
import QuranAudioPlayer from '../../../components/QuranAudioPlayer.vue'

const route = useRoute()
const { showSuccess } = useSweetAlert()
const { getProgress, upsertProgress, addBookmark, isBookmarked } = useQuranLocalStore()

const surah = ref(null)
const loading = ref(false)
const error = ref('')

const qariKode = ref(localStorage.getItem('quran:qari') || DEFAULT_QARI_KODE)
const fullAudioSrc = computed(() => surah.value?.audioFull?.[qariKode.value] ?? '')
const fullPlayerRef = ref(null)

const prevNomor = computed(() => (surah.value && surah.value.nomor > 1) ? surah.value.nomor - 1 : null)
const nextNomor = computed(() => (surah.value && surah.value.nomor < 114) ? surah.value.nomor + 1 : null)

const playbackMode = ref('ikuti')

const ayatAudioEl = ref(null)
const sequentialPlaying = ref(false)
const currentPlayingAyat = ref(null)
const currentWordIndex = ref(-1)

const wordsByAyat = computed(() => {
  const map = {}
  surah.value?.ayat.forEach(ayat => {
    map[ayat.nomorAyat] = ayat.teksArab.split(/\s+/).filter(Boolean)
  })

  return map
})

// Kata Arab panjangnya bervariasi jauh (harakat/madd bikin durasi ucap beda-beda),
// jadi progress kata dibobot per jumlah huruf, bukan dibagi rata per jumlah kata —
// perkiraannya jauh lebih dekat ke tempo bacaan asli meski tetap bukan timestamp asli.
const wordThresholdsByAyat = computed(() => {
  const map = {}
  Object.entries(wordsByAyat.value).forEach(([nomorAyat, words]) => {
    const weights = words.map(w => w.length || 1)
    const total = weights.reduce((sum, w) => sum + w, 0) || 1

    let cumulative = 0
    map[nomorAyat] = weights.map(w => {
      cumulative += w

      return cumulative / total
    })
  })

  return map
})

const playButtonLabel = computed(() => {
  if (sequentialPlaying.value) return 'Jeda Putar'
  if (currentPlayingAyat.value) return `Lanjut Ayat ${currentPlayingAyat.value}`

  const progress = surah.value ? getProgress(surah.value.nomor) : null
  if (progress?.ayatNumber) return `Lanjut Ayat ${progress.ayatNumber}`

  return 'Putar dari Awal'
})

function startSequential(nomorAyat) {
  const ayat = surah.value?.ayat.find(a => a.nomorAyat === nomorAyat)
  const src = ayat?.audio?.[qariKode.value]
  if (!ayat || !src || !ayatAudioEl.value) return

  currentPlayingAyat.value = nomorAyat
  currentWordIndex.value = 0
  ayatAudioEl.value.src = src
  ayatAudioEl.value.play()
  sequentialPlaying.value = true
}

function onAyatTimeUpdate() {
  const el = ayatAudioEl.value
  if (!el || !el.duration || !currentPlayingAyat.value) return

  const words = wordsByAyat.value[currentPlayingAyat.value]
  const thresholds = wordThresholdsByAyat.value[currentPlayingAyat.value]
  if (!words?.length || !thresholds?.length) return

  const progress = el.currentTime / el.duration
  const idx = thresholds.findIndex(t => progress <= t)

  currentWordIndex.value = idx === -1 ? words.length - 1 : idx
}

function pauseSequential() {
  ayatAudioEl.value?.pause()
  sequentialPlaying.value = false
}

function toggleSequential() {
  if (!surah.value) return

  if (sequentialPlaying.value) {
    pauseSequential()
    return
  }

  if (currentPlayingAyat.value && ayatAudioEl.value?.src) {
    ayatAudioEl.value.play()
    sequentialPlaying.value = true
    return
  }

  const startAyat = getProgress(surah.value.nomor)?.ayatNumber || surah.value.ayat[0]?.nomorAyat || 1
  startSequential(startAyat)
}

function playFromAyat(ayat) {
  if (playbackMode.value !== 'ikuti') playbackMode.value = 'ikuti'

  if (currentPlayingAyat.value === ayat.nomorAyat && sequentialPlaying.value) {
    pauseSequential()
    return
  }

  startSequential(ayat.nomorAyat)
}

function onAyatAudioEnded() {
  const idx = surah.value?.ayat.findIndex(a => a.nomorAyat === currentPlayingAyat.value) ?? -1
  const next = idx >= 0 ? surah.value.ayat[idx + 1] : null

  if (next) {
    startSequential(next.nomorAyat)
    return
  }

  sequentialPlaying.value = false
  currentPlayingAyat.value = null
  currentWordIndex.value = -1
  showSuccess('Selesai membaca surah ini.')
}

watch(qariKode, () => {
  if (currentPlayingAyat.value != null) startSequential(currentPlayingAyat.value)
})

watch(playbackMode, mode => {
  if (mode === 'santai') pauseSequential()
  else fullPlayerRef.value?.pause()
})

watch(currentPlayingAyat, nomorAyat => {
  if (!nomorAyat) return
  ayatElRefs[nomorAyat]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
})

const showBookmarkDialog = ref(false)
const bookmarkTargetAyat = ref(null)
const bookmarkNote = ref('')

function openBookmarkDialog(ayat) {
  bookmarkTargetAyat.value = ayat
  bookmarkNote.value = ''
  showBookmarkDialog.value = true
}

function confirmBookmark() {
  if (!bookmarkTargetAyat.value || !surah.value) return

  addBookmark({
    nomorSurah: surah.value.nomor,
    namaSurah: surah.value.namaLatin,
    ayatNumber: bookmarkTargetAyat.value.nomorAyat,
    catatan: bookmarkNote.value,
  })
  showBookmarkDialog.value = false
  showSuccess('Ayat berhasil ditandai.')
}

let ayatElRefs = {}
const visibleAyat = new Set()
let progressTimer = null

function saveProgressDebounced(nomorAyat) {
  clearTimeout(progressTimer)
  progressTimer = setTimeout(() => {
    if (surah.value) upsertProgress(surah.value.nomor, nomorAyat, surah.value.namaLatin)
  }, 800)
}

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    const nomorAyat = Number(entry.target.dataset.ayat)
    if (entry.isIntersecting) visibleAyat.add(nomorAyat)
    else visibleAyat.delete(nomorAyat)
  })

  if (visibleAyat.size > 0) saveProgressDebounced(Math.max(...visibleAyat))
}, { rootMargin: '-40% 0px -40% 0px', threshold: 0 })

function setAyatRef(nomorAyat, el) {
  const domEl = el?.$el ?? el
  if (!domEl) return

  ayatElRefs[nomorAyat] = domEl
  observer.observe(domEl)
}

onUnmounted(() => observer.disconnect())

async function scrollToTarget() {
  await nextTick()

  const targetNomor = Number(route.query.ayat) || getProgress(surah.value?.nomor)?.ayatNumber
  const el = targetNomor ? ayatElRefs[targetNomor] : null

  el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

async function fetchSurah() {
  loading.value = true
  error.value = ''
  surah.value = null
  ayatElRefs = {}
  visibleAyat.clear()
  observer.disconnect()
  pauseSequential()
  currentPlayingAyat.value = null

  try {
    const { data } = await api.get(`/quran/surah/${route.params.nomor}`)
    surah.value = data.data
    await scrollToTarget()
  } catch (err) {
    error.value = err.response?.data?.message ?? 'Gagal memuat surah, coba lagi sebentar lagi'
  } finally {
    loading.value = false
  }
}

watch(() => route.params.nomor, fetchSurah)
fetchSurah()
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

.premium-baca-layout {
  position: relative;
  font-family: 'Plus Jakarta Sans', sans-serif;
  min-height: 100vh;
}

.relative-z { 
  z-index: 2; 
  position: relative; 
}

/* Background halus pembantu estetika */
.islamic-pattern-bg {
  position: fixed;
  top: 0; left: 0; right: 0; height: 100vh;
  background-image: radial-gradient(circle at 80% 20%, rgba(var(--v-theme-primary), 0.03) 0%, transparent 40%),
                    radial-gradient(circle at 20% 80%, rgba(var(--v-theme-primary), 0.03) 0%, transparent 40%);
  z-index: 0;
  pointer-events: none;
}

.quran-baca-container {
  max-width: 1200px;
  width: 100%;
  margin-inline: auto;
}

/* Customizing Radio Button Group */
.playback-radio-group :deep(.v-selection-control-group) {
  flex-direction: row !important;
  flex-wrap: wrap;
}
.playback-radio-group :deep(.v-selection-control) {
  margin-inline-end: 8px;
}

/* Styling Card Ayat */
.ayat-card {
  transition: all 0.3s ease;
}

/* Badge Nomor Ayat */
.ayat-number-chip {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1rem;
  background: rgba(var(--v-theme-on-surface), 0.06);
  color: rgba(var(--v-theme-on-surface), 0.7);
  transition: all 0.3s;
}

/* Kondisi khusus (Bookmarked / Playing) */
.ayat-bookmarked {
  border-left: 5px solid rgb(var(--v-theme-warning)) !important;
  background: rgba(var(--v-theme-warning), 0.02) !important;
}

.ayat-playing {
  transform: scale(1.01);
  background: rgba(var(--v-theme-primary), 0.02) !important;
}

/* Tipografi Arab & Terjemahan */
.quran-arabic-text {
  font-family: 'Amiri', 'Scheherazade New', 'Traditional Arabic', serif;
  direction: rtl;
  font-size: clamp(2rem, 4vw, 2.6rem);
  line-height: 2.4;
  margin: 0;
  color: rgb(var(--v-theme-on-surface));
  transition: color 0.3s;
}

.quran-word {
  display: inline-block;
  margin-inline-start: 0.28em;
  transition: color 0.2s ease;
}
.quran-word:first-child { margin-inline-start: 0; }
.quran-word-active {
  color: rgb(var(--v-theme-primary));
  font-weight: 700;
}

.transliteration {
  font-size: 1rem;
  letter-spacing: 0.3px;
  line-height: 1.5;
}

.translation {
  font-size: 1.05rem;
  line-height: 1.6;
}

/* Utility tambahan untuk border MD+ layar lebar */
@media (min-width: 960px) {
  .border-e-md {
    border-right: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  }
}
</style>