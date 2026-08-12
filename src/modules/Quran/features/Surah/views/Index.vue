<template>
  <div class="premium-quran-layout">
    <!-- Ornamen Latar Belakang Eksklusif -->
    <div class="islamic-pattern-bg"></div>

    <div class="content-wrapper">
      <!-- Header Standar (Tidak diubah logikanya) -->
      <PageHeroHeader
        tone="emerald"
        icon="ri-book-open-line"
        title="Al-Qur'an"
        subtitle="Baca &amp; dengarkan murotal Al-Qur'an lengkap 114 surah"
        :breadcrumbs="[
          { title: 'Dashboard', to: { name: 'dashboard' } },
          { title: 'Al-Qur\'an', disabled: true }
        ]"
        class="mb-8 relative-z"
      />

      <!-- "Dynamic Island" Style Continue Reading -->
      <div v-if="lastRead" class="floating-player-widget mb-12 relative-z">
        <div class="widget-blur-backdrop"></div>
        <div class="widget-content">
          <div class="d-flex align-center gap-4">
            <VBtn
              icon
              variant="flat"
              class="play-btn-pulse"
              :disabled="!widgetAudioSrc"
              @click="toggleWidgetPlay"
            >
              <VIcon :icon="isWidgetPlaying ? 'ri-pause-fill' : 'ri-play-fill'" size="24" color="white" />
            </VBtn>
            <div class="widget-text">
              <span class="label">Terakhir Dibaca</span>
              <h3 class="surah-name">
                {{ lastRead.namaSurah }} <span class="ayat-badge">Ayat {{ lastRead.ayatNumber }}</span>
              </h3>
            </div>
          </div>

          <!-- Mini Equalizer -->
          <div class="mini-eq d-none d-sm-flex" :class="{ 'is-playing': isWidgetPlaying }">
            <div v-for="i in 12" :key="i" class="eq-line"></div>
          </div>

          <VBtn
            icon
            variant="tonal"
            size="48"
            class="premium-continue-btn-icon"
            :to="{ name: 'quran-baca', params: { nomor: lastRead.nomorSurah } }"
          >
            <VIcon icon="ri-arrow-right-line" size="22" />
            <VTooltip activator="parent" location="top">
              Lanjutkan
            </VTooltip>
          </VBtn>

          <audio
            ref="widgetAudioEl"
            :src="widgetAudioSrc"
            preload="none"
            @play="isWidgetPlaying = true"
            @pause="isWidgetPlaying = false"
            @ended="isWidgetPlaying = false"
          />
        </div>
      </div>

      <!-- Tab: Daftar Surah / Riwayat Baca / Bookmark -->
      <VTabs v-model="activeTab" class="mb-8 relative-z">
        <VTab value="daftar">
          Daftar Surah
        </VTab>
        <VTab value="riwayat">
          Riwayat Baca
        </VTab>
        <VTab value="bookmark">
          Bookmark
        </VTab>
      </VTabs>

      <template v-if="activeTab === 'daftar'">
        <!-- Minimalist Search Input (Typography Focus) -->
        <div class="minimalist-search-container mb-12 relative-z">
          <VIcon icon="ri-search-line" class="search-icon-left" size="28" />
          <input
            v-model="search"
            type="text"
            class="minimalist-input"
            placeholder="Cari surah berdasarkan nama atau terjemahan..."
          />
          <div class="input-focus-line"></div>
        </div>

        <VAlert v-if="error" type="error" variant="tonal" class="mb-6 relative-z">{{ error }}</VAlert>

        <!-- Skeleton Loading (Custom) -->
        <VRow v-if="loading" class="relative-z">
          <VCol v-for="n in 9" :key="n" cols="12" md="6" xl="4">
            <div class="skeleton-tile rounded-xl"></div>
          </VCol>
        </VRow>

        <!-- Surah Grid -->
        <VRow v-else class="relative-z">
          <VCol
            v-for="surah in filteredSurah"
            :key="surah.nomor"
            cols="12"
            md="6"
            xl="4"
          >
            <VCard
              class="surah-card rounded-xl border h-100"
              variant="flat"
              color="surface"
              @click="$router.push({ name: 'quran-baca', params: { nomor: surah.nomor } })"
            >
              <VCardText class="pa-6 d-flex flex-column h-100">
                <div class="d-flex justify-space-between align-start">
                  <div class="surah-number-chip">
                    <span>{{ surah.nomor }}</span>
                  </div>
                  <div class="arabic-text-main">{{ surah.nama }}</div>
                </div>

                <div class="mt-4">
                  <h4 class="surah-latin">{{ surah.namaLatin }}</h4>
                  <p class="surah-translation">{{ surah.arti }}</p>
                </div>

                <VSpacer />

                <div class="d-flex align-center gap-3 mt-4 pt-4 tile-footer-divider">
                  <span class="meta-info">
                    <VIcon icon="ri-map-pin-line" size="14" class="mr-1"/> {{ surah.tempatTurun }}
                  </span>
                  <span class="meta-dot"></span>
                  <span class="meta-info">
                    <VIcon icon="ri-list-check" size="14" class="mr-1"/> {{ surah.jumlahAyat }} Ayat
                  </span>
                  <VBtn
                    icon
                    size="x-small"
                    variant="text"
                    class="ml-auto surah-detail-btn"
                    @click.stop="$router.push({ name: 'quran-baca', params: { nomor: surah.nomor } })"
                  >
                    <VIcon icon="ri-eye-line" size="16" />
                    <VTooltip activator="parent" location="top">
                      Detail
                    </VTooltip>
                  </VBtn>
                </div>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>

        <div v-if="!loading && !error && filteredSurah.length === 0" class="empty-state relative-z">
          <VIcon icon="ri-file-search-line" size="48" class="mb-3 opacity-50" />
          <p>Surah tidak ditemukan.</p>
        </div>
      </template>

      <VCard v-else-if="activeTab === 'riwayat'" class="rounded-xl border relative-z" variant="flat" color="surface">
        <VList v-if="progressList.length">
          <VListItem
            v-for="row in progressList"
            :key="row.nomorSurah"
            :to="{ name: 'quran-baca', params: { nomor: row.nomorSurah } }"
          >
            <template #prepend>
              <VAvatar color="primary" variant="tonal">
                <VIcon icon="ri-book-open-line" />
              </VAvatar>
            </template>
            <VListItemTitle>{{ row.namaSurah }}</VListItemTitle>
            <VListItemSubtitle>
              Sampai ayat {{ row.ayatNumber }} &middot; {{ formatDate(row.updatedAt) }}
            </VListItemSubtitle>
          </VListItem>
        </VList>
        <VCardText v-else>
          <VAlert type="info" variant="tonal">
            Belum ada riwayat baca. Mulai baca dari tab
            <a href="#" @click.prevent="activeTab = 'daftar'">Daftar Surah</a> di atas.
          </VAlert>
        </VCardText>
      </VCard>

      <VCard v-else class="rounded-xl border relative-z" variant="flat" color="surface">
        <VList v-if="bookmarkList.length">
          <VListItem
            v-for="row in bookmarkList"
            :key="row.id"
          >
            <template #prepend>
              <VAvatar color="warning" variant="tonal">
                <VIcon icon="ri-bookmark-fill" />
              </VAvatar>
            </template>
            <VListItemTitle>{{ row.namaSurah }} &middot; Ayat {{ row.ayatNumber }}</VListItemTitle>
            <VListItemSubtitle>
              {{ row.catatan || 'Tanpa catatan' }} &middot; {{ formatDate(row.createdAt) }}
            </VListItemSubtitle>
            <template #append>
              <div class="d-flex gap-1">
                <VBtn
                  icon
                  size="small"
                  variant="text"
                  :to="{ name: 'quran-baca', params: { nomor: row.nomorSurah }, query: { ayat: row.ayatNumber } }"
                >
                  <VIcon icon="ri-arrow-right-line" />
                  <VTooltip activator="parent">
                    Buka
                  </VTooltip>
                </VBtn>
                <VBtn
                  icon
                  size="small"
                  variant="text"
                  color="error"
                  @click="onRemoveBookmark(row.id)"
                >
                  <VIcon icon="ri-delete-bin-line" />
                  <VTooltip activator="parent">
                    Hapus
                  </VTooltip>
                </VBtn>
              </div>
            </template>
          </VListItem>
        </VList>
        <VCardText v-else>
          <VAlert type="info" variant="tonal">
            Belum ada ayat yang ditandai.
          </VAlert>
        </VCardText>
      </VCard>
    </div>
  </div>
</template>

<script setup>
import { computed, onUnmounted, ref } from 'vue'
import api from '@/utils/axios'
import PageHeroHeader from '@/components/shared/PageHeroHeader.vue'
import { DEFAULT_QARI_KODE } from '@/constants/qari'
import { useQuranLocalStore } from '../../../composables/useQuranLocalStore'

const { listProgress, listBookmarks, removeBookmark } = useQuranLocalStore()

const surahList = ref([])
const loading = ref(false)
const error = ref('')
const search = ref('')

const activeTab = ref('daftar')
const progressList = ref(listProgress())
const bookmarkList = ref(listBookmarks())

const lastRead = computed(() => progressList.value[0] ?? null)

function onRemoveBookmark(id) {
  removeBookmark(id)
  bookmarkList.value = listBookmarks()
}

function formatDate(iso) {
  if (!iso) return '-'

  return new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}

const widgetAudioEl = ref(null)
const isWidgetPlaying = ref(false)

const lastReadSurah = computed(() =>
  surahList.value.find(s => s.nomor === lastRead.value?.nomorSurah) ?? null,
)

const widgetAudioSrc = computed(() => {
  const audioFull = lastReadSurah.value?.audioFull
  if (!audioFull) return ''

  return audioFull[DEFAULT_QARI_KODE] ?? Object.values(audioFull)[0] ?? ''
})

function toggleWidgetPlay() {
  const el = widgetAudioEl.value
  if (!el || !widgetAudioSrc.value) return

  if (isWidgetPlaying.value) el.pause()
  else el.play()
}

onUnmounted(() => widgetAudioEl.value?.pause())

const filteredSurah = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  if (!keyword) return surahList.value

  return surahList.value.filter(s =>
    s.namaLatin?.toLowerCase().includes(keyword) || s.arti?.toLowerCase().includes(keyword),
  )
})

async function fetchSurahList() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get('/quran/surah')

    surahList.value = data.data ?? []
  } catch (err) {
    error.value = err.response?.data?.message ?? 'Gagal memuat daftar surah, coba lagi sebentar lagi'
  } finally {
    loading.value = false
  }
}

fetchSurahList()
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

/* --- Layout & Utilities --- */
.premium-quran-layout {
  position: relative;
  font-family: 'Plus Jakarta Sans', sans-serif;
  min-height: 100vh;
}
.relative-z { z-index: 2; position: relative; }

/* --- Subtitle Ornamen Pola Islamic (Abstract Glass) --- */
.islamic-pattern-bg {
  position: fixed;
  top: 0; left: 0; right: 0; height: 100vh;
  background-image: radial-gradient(circle at 10% 20%, rgba(16, 185, 129, 0.03) 0%, transparent 40%),
                    radial-gradient(circle at 90% 80%, rgba(99, 102, 241, 0.04) 0%, transparent 40%);
  z-index: 0;
  pointer-events: none;
}
.islamic-pattern-bg::after {
  content: '';
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  opacity: 0.4;
  /* Pola geometris SVG sangat tipis */
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}

/* --- Floating "Dynamic Island" Player Widget --- */
.floating-player-widget {
  position: relative;
  border-radius: 100px;
  padding: 8px 8px 8px 24px;
  background: rgba(var(--v-theme-surface), 0.6);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.05);
  box-shadow: 0 10px 40px -10px rgba(0,0,0,0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  display: inline-flex;
  width: 100%;
  transition: all 0.4s ease;
}
.floating-player-widget:hover {
  transform: translateY(-3px) scale(1.01);
  box-shadow: 0 20px 40px -10px rgba(16, 185, 129, 0.15);
  border-color: rgba(16, 185, 129, 0.3);
}

.widget-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  position: relative;
  z-index: 2;
}

.play-btn-pulse {
  width: 48px; height: 48px;
  min-width: unset !important;
  padding: 0 !important;
  background: linear-gradient(135deg, #10b981, #059669);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  animation: pulse-ring 2s infinite cubic-bezier(0.66, 0, 0, 1);
}

.widget-text { display: flex; flex-direction: column; }
.widget-text .label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 2px; color: rgba(var(--v-theme-on-surface), 0.5); font-weight: 600; margin-bottom: 2px;}
.surah-name { font-size: 1.1rem; font-weight: 700; margin: 0; color: rgb(var(--v-theme-on-surface)); display: flex; align-items: center; gap: 12px;}
.ayat-badge { font-size: 0.75rem; padding: 2px 10px; background: rgba(16, 185, 129, 0.1); color: #10b981; border-radius: 20px; font-weight: 600; }

.premium-continue-btn-icon {
  background: rgba(16, 185, 129, 0.1) !important;
  color: #10b981 !important;
  transition: all 0.3s;
}
.premium-continue-btn-icon:hover { background: rgba(16, 185, 129, 0.18) !important; transform: scale(1.05); }

/* Mini Equalizer inside widget — idle state tampil sebagai flatline waveform
   bertingkat (bukan smear rata), beranimasi & terang penuh saat isWidgetPlaying true */
.mini-eq { gap: 3px; height: 24px; align-items: center; margin: 0 24px; }
.eq-line {
  width: 3px;
  height: 100%;
  background: #10b981;
  border-radius: 3px;
  opacity: 0.55;
  transform-origin: center;
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.eq-line:nth-child(1) { transform: scaleY(0.35); }
.eq-line:nth-child(2) { transform: scaleY(0.55); }
.eq-line:nth-child(3) { transform: scaleY(0.75); }
.eq-line:nth-child(4) { transform: scaleY(0.45); }
.eq-line:nth-child(5) { transform: scaleY(0.65); }
.eq-line:nth-child(6) { transform: scaleY(0.3); }
.eq-line:nth-child(7) { transform: scaleY(0.6); }
.eq-line:nth-child(8) { transform: scaleY(0.4); }
.eq-line:nth-child(9) { transform: scaleY(0.7); }
.eq-line:nth-child(10) { transform: scaleY(0.5); }
.eq-line:nth-child(11) { transform: scaleY(0.38); }
.eq-line:nth-child(12) { transform: scaleY(0.58); }

.mini-eq.is-playing .eq-line {
  opacity: 1;
  animation: eq-anim 1s infinite alternate ease-in-out;
}
.mini-eq.is-playing .eq-line:nth-child(even) { animation-duration: 0.7s; }
.mini-eq.is-playing .eq-line:nth-child(3n) { animation-duration: 1.2s; }

/* --- Minimalist Search --- */
.minimalist-search-container {
  position: relative;
  display: flex;
  align-items: center;
}
.search-icon-left {
  position: absolute;
  left: 0;
  color: rgba(var(--v-theme-on-surface), 0.3);
  transition: color 0.3s ease;
}
.minimalist-input {
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 2px solid rgba(var(--v-theme-on-surface), 0.1);
  padding: 20px 20px 20px 48px;
  font-size: 1.5rem;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
  outline: none;
  font-family: inherit;
  transition: all 0.3s ease;
}
.minimalist-input::placeholder { color: rgba(var(--v-theme-on-surface), 0.2); font-weight: 400; font-size: 1.2rem;}
.input-focus-line {
  position: absolute; bottom: 0; left: 0; height: 2px; width: 0;
  background: #10b981; transition: width 0.4s cubic-bezier(0.25, 1, 0.5, 1);
}
.minimalist-input:focus { border-bottom-color: transparent; }
.minimalist-input:focus + .input-focus-line { width: 100%; }
.minimalist-input:focus ~ .search-icon-left { color: #10b981; }

/* --- Surah Card (VCard solid, kontras terjamin di light & dark) --- */
.surah-card {
  cursor: pointer;
  transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}
.surah-card:hover {
  transform: translateY(-6px);
  border-color: rgb(var(--v-theme-primary)) !important;
  box-shadow: 0 20px 40px -18px rgba(var(--v-theme-primary), 0.35);
}

.surah-number-chip {
  width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 12px;
  font-weight: 700; font-size: 0.9rem;
  background: rgba(var(--v-theme-on-surface), 0.06);
  color: rgba(var(--v-theme-on-surface), 0.7);
  transition: all 0.3s;
}
.surah-card:hover .surah-number-chip {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  transform: rotate(5deg) scale(1.1);
}

.arabic-text-main {
  font-family: 'Amiri', serif;
  font-size: 2rem;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  transition: color 0.3s;
}
.surah-card:hover .arabic-text-main { color: rgb(var(--v-theme-primary)); }

.surah-latin { font-size: 1.3rem; font-weight: 700; margin: 0 0 4px 0; color: rgb(var(--v-theme-on-surface)); }
.surah-translation { font-size: 0.9rem; color: rgba(var(--v-theme-on-surface), 0.6); margin: 0; }

.tile-footer-divider { border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08); }
.meta-info {
  display: flex; align-items: center;
  font-size: 0.8rem; font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.5);
  text-transform: uppercase; letter-spacing: 1px;
}
.meta-dot { width: 4px; height: 4px; border-radius: 50%; background: rgba(var(--v-theme-on-surface), 0.2); }
.surah-detail-btn { color: rgba(var(--v-theme-on-surface), 0.5); }
.surah-detail-btn:hover { color: rgb(var(--v-theme-primary)); }

/* --- Skeleton & Empty State --- */
.skeleton-tile {
  height: 200px;
  background: linear-gradient(90deg, rgba(var(--v-theme-on-surface), 0.02) 25%, rgba(var(--v-theme-on-surface), 0.05) 50%, rgba(var(--v-theme-on-surface), 0.02) 75%);
  background-size: 200% 100%;
  animation: skeleton-load 1.5s infinite;
}
.empty-state { text-align: center; padding: 60px 20px; color: rgba(var(--v-theme-on-surface), 0.6); }

/* --- Animations --- */
@keyframes pulse-ring {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 15px rgba(16, 185, 129, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}
@keyframes eq-anim {
  0% { transform: scaleY(0.3); }
  100% { transform: scaleY(1); }
}
@keyframes skeleton-load {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (max-width: 768px) {
  .floating-player-widget { padding: 8px 16px; border-radius: 24px; flex-direction: column; align-items: flex-start;}
  .widget-content { flex-direction: column; align-items: flex-start; gap: 16px;}
  .minimalist-input { font-size: 1.1rem; padding: 16px 16px 16px 40px; }
  .search-icon-left { font-size: 22px !important; }
}
</style>