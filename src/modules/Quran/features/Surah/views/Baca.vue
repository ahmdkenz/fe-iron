<template>
  <div>
    <PageHeader
      :title="surah ? `${surah.namaLatin} (${surah.nama})` : 'Al-Qur\'an'"
      :subtitle="surah ? `${surah.arti} · ${surah.jumlahAyat} ayat · ${surah.tempatTurun}` : ''"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Al-Qur\'an', to: { name: 'quran-index' } },
        { title: surah?.namaLatin ?? '...', disabled: true }
      ]"
    >
      <VBtn
        :disabled="!prevNomor"
        variant="tonal"
        icon="ri-arrow-left-s-line"
        :to="prevNomor ? { name: 'quran-baca', params: { nomor: prevNomor } } : undefined"
      />
      <VBtn
        :disabled="!nextNomor"
        variant="tonal"
        icon="ri-arrow-right-s-line"
        :to="nextNomor ? { name: 'quran-baca', params: { nomor: nextNomor } } : undefined"
      />
    </PageHeader>

    <VAlert
      v-if="error"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      {{ error }}
    </VAlert>

    <VSkeletonLoader
      v-if="loading"
      type="article, list-item-three-line@6"
    />

    <div
      v-else-if="surah"
      class="quran-baca-container"
    >
      <VCard class="mb-4">
        <VCardText>
          <div class="d-flex flex-wrap align-center gap-3 mb-3">
            <QariSelector v-model="qariKode" />
            <VBtnToggle
              v-model="playbackMode"
              color="primary"
              variant="outlined"
              density="comfortable"
              mandatory
              divided
            >
              <VBtn
                value="ikuti"
                prepend-icon="ri-mic-line"
              >
                Ikuti Bacaan
              </VBtn>
              <VBtn
                value="santai"
                prepend-icon="ri-headphone-line"
              >
                Dengar Santai
              </VBtn>
            </VBtnToggle>
            <VSpacer />
          </div>

          <div
            v-if="playbackMode === 'ikuti'"
            class="d-flex flex-wrap align-center gap-3"
          >
            <VBtn
              :color="sequentialPlaying ? 'primary' : undefined"
              :variant="sequentialPlaying ? 'flat' : 'tonal'"
              size="large"
              rounded="lg"
              :prepend-icon="sequentialPlaying ? 'ri-pause-fill' : 'ri-play-fill'"
              @click="toggleSequential"
            >
              {{ playButtonLabel }}
            </VBtn>
            <span class="text-caption text-medium-emphasis">
              Audio diputar per-ayat berurutan — ayat yang sedang dibaca akan tersorot &amp; halaman mengikuti otomatis.
            </span>
          </div>

          <QuranAudioPlayer
            v-else
            ref="fullPlayerRef"
            :src="fullAudioSrc"
            label="Audio Utuh — tanpa sorotan ayat"
          />
        </VCardText>
      </VCard>

      <div class="quran-ayat-list">
        <VCard
          v-for="ayat in surah.ayat"
          :key="ayat.nomorAyat"
          :ref="el => setAyatRef(ayat.nomorAyat, el)"
          :data-ayat="ayat.nomorAyat"
          class="mb-3 quran-ayat-card"
          :class="{
            'quran-ayat-bookmarked': isBookmarked(surah.nomor, ayat.nomorAyat),
            'quran-ayat-playing': currentPlayingAyat === ayat.nomorAyat,
          }"
          variant="outlined"
        >
          <VCardText>
            <div class="d-flex align-center justify-space-between mb-2">
              <VChip
                color="primary"
                variant="tonal"
                size="small"
                label
              >
                Ayat {{ ayat.nomorAyat }}
              </VChip>
              <div class="d-flex gap-1">
                <VBtn
                  icon
                  size="small"
                  variant="text"
                  :color="currentPlayingAyat === ayat.nomorAyat && sequentialPlaying ? 'primary' : undefined"
                  @click="playFromAyat(ayat)"
                >
                  <VIcon :icon="currentPlayingAyat === ayat.nomorAyat && sequentialPlaying ? 'ri-pause-fill' : 'ri-play-fill'" />
                  <VTooltip activator="parent">
                    Putar dari ayat ini
                  </VTooltip>
                </VBtn>
                <VBtn
                  icon
                  size="small"
                  variant="text"
                  :color="isBookmarked(surah.nomor, ayat.nomorAyat) ? 'warning' : undefined"
                  @click="openBookmarkDialog(ayat)"
                >
                  <VIcon :icon="isBookmarked(surah.nomor, ayat.nomorAyat) ? 'ri-bookmark-fill' : 'ri-bookmark-line'" />
                  <VTooltip activator="parent">
                    Tandai
                  </VTooltip>
                </VBtn>
              </div>
            </div>

            <p class="quran-arabic-text mb-3">
              {{ ayat.teksArab }}
            </p>
            <p class="text-body-2 font-italic text-medium-emphasis mb-2">
              {{ ayat.teksLatin }}
            </p>
            <p class="text-body-1 mb-0">
              {{ ayat.teksIndonesia }}
            </p>
          </VCardText>
        </VCard>
      </div>

      <audio
        ref="ayatAudioEl"
        @ended="onAyatAudioEnded"
      />
    </div>

    <VDialog
      v-model="showBookmarkDialog"
      max-width="420"
    >
      <VCard>
        <VCardTitle>Tandai Ayat {{ bookmarkTargetAyat?.nomorAyat }}</VCardTitle>
        <VCardText>
          <VTextarea
            v-model="bookmarkNote"
            label="Catatan (opsional)"
            rows="3"
            auto-grow
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            variant="text"
            @click="showBookmarkDialog = false"
          >
            Batal
          </VBtn>
          <VBtn
            color="primary"
            variant="flat"
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

// ─── Mode player: "ikuti" (per-ayat berurutan + sorotan bergerak) vs
// "santai" (1 file audioFull utuh, tanpa sorotan — tak ada data timestamp
// per-ayat di dalamnya sehingga sinkronisasi memang tidak mungkin) ─────────
const playbackMode = ref('ikuti')

// ─── Mesin playback sekuensial per-ayat (mode "Ikuti Bacaan") ──────────────
const ayatAudioEl = ref(null)
const sequentialPlaying = ref(false)
const currentPlayingAyat = ref(null)

const playButtonLabel = computed(() => {
  if (sequentialPlaying.value) return 'Jeda'
  if (currentPlayingAyat.value) return `Lanjutkan dari Ayat ${currentPlayingAyat.value}`

  const progress = surah.value ? getProgress(surah.value.nomor) : null
  if (progress?.ayatNumber) return `Lanjutkan dari Ayat ${progress.ayatNumber}`

  return 'Putar dari Ayat 1'
})

function startSequential(nomorAyat) {
  const ayat = surah.value?.ayat.find(a => a.nomorAyat === nomorAyat)
  const src = ayat?.audio?.[qariKode.value]
  if (!ayat || !src || !ayatAudioEl.value) return

  currentPlayingAyat.value = nomorAyat
  ayatAudioEl.value.src = src
  ayatAudioEl.value.play()
  sequentialPlaying.value = true
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

  // Sudah pernah diputar & baru dijeda di tengah ayat — lanjutkan dari posisi
  // terakhir (bukan mengulang dari awal ayat).
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
  showSuccess('Selesai membaca surah ini.')
}

// Ganti qari saat sedang di tengah ayat tertentu → putar ulang ayat yang sama
// dengan suara qari baru (paling masuk akal drpd diam di posisi lama).
watch(qariKode, () => {
  if (currentPlayingAyat.value != null) startSequential(currentPlayingAyat.value)
})

// Pindah mode → hentikan audio milik mode yang ditinggalkan supaya tidak
// dobel suara dengan mode yang baru dipilih.
watch(playbackMode, mode => {
  if (mode === 'santai') pauseSequential()
  else fullPlayerRef.value?.pause()
})

// "Penanda yang bergerak": ayat yang sedang diputar otomatis masuk ke
// tengah viewport, mengikuti audio.
watch(currentPlayingAyat, nomorAyat => {
  if (!nomorAyat) return

  ayatElRefs[nomorAyat]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
})

// ─── Bookmark ────────────────────────────────────────────────────────────
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

// ─── Auto-track posisi baca (IntersectionObserver) ─────────────────────────
// Dibuat sekali di scope setup (bukan di onMounted) supaya sudah siap saat
// ref callback tiap kartu ayat terpanggil — ref callback anak berjalan
// sebelum onMounted milik komponen ini.
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
.quran-baca-container {
  max-width: 900px;
  margin-inline: auto;
}

.quran-arabic-text {
  font-family: 'Scheherazade New', 'Traditional Arabic', serif;
  direction: rtl;
  text-align: right;
  font-size: clamp(1.7rem, 4vw, 2.25rem);
  line-height: 2.6;
  margin: 0;
}

.quran-ayat-card {
  transition: background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}

.quran-ayat-bookmarked {
  border-color: rgb(var(--v-theme-warning));
}

.quran-ayat-playing {
  border-color: rgb(var(--v-theme-primary));
  border-width: 2px;
  background: rgba(var(--v-theme-primary), 0.06);
  box-shadow: 0 0 0 1px rgba(var(--v-theme-primary), 0.15);
}
</style>
