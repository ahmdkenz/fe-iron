<template>
  <div>
    <PageHeroHeader
      tone="emerald"
      icon="ri-book-open-line"
      title="Al-Qur'an"
      subtitle="Baca &amp; dengarkan murotal Al-Qur'an lengkap 114 surah"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Al-Qur\'an', disabled: true }
      ]"
    />

    <div
      v-if="lastRead"
      class="quran-continue-banner mb-4"
    >
      <div class="d-flex flex-wrap align-center justify-space-between gap-3">
        <div class="d-flex align-center gap-3">
          <div class="quran-continue-icon">
            <VIcon
              icon="ri-book-open-line"
              size="22"
            />
          </div>
          <div>
            <div class="text-caption quran-continue-label">
              Lanjutkan Membaca
            </div>
            <div class="text-h6 font-weight-semibold">
              {{ lastRead.namaSurah }} &middot; Ayat {{ lastRead.ayatNumber }}
            </div>
          </div>
        </div>
        <VBtn
          class="quran-continue-btn"
          variant="flat"
          append-icon="ri-arrow-right-line"
          :to="{ name: 'quran-baca', params: { nomor: lastRead.nomorSurah } }"
        >
          Lanjutkan
        </VBtn>
      </div>
    </div>

    <VTextField
      v-model="search"
      placeholder="Cari nama surah..."
      clearable
      hide-details
      variant="solo"
      density="comfortable"
      rounded="lg"
      class="quran-search-field mb-4"
      prepend-inner-icon="ri-search-line"
    />

    <VAlert
      v-if="error"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      {{ error }}
    </VAlert>

    <VRow v-if="loading">
      <VCol
        v-for="n in 8"
        :key="n"
        cols="12"
        sm="6"
        lg="4"
      >
        <VSkeletonLoader type="list-item-avatar-two-line" />
      </VCol>
    </VRow>

    <VRow v-else>
      <VCol
        v-for="surah in filteredSurah"
        :key="surah.nomor"
        cols="12"
        sm="6"
        lg="4"
      >
        <VCard
          variant="outlined"
          class="quran-surah-row"
          :to="{ name: 'quran-baca', params: { nomor: surah.nomor } }"
        >
          <VCardText class="d-flex align-center justify-space-between gap-3">
            <div class="d-flex align-center gap-3 min-width-0">
              <VAvatar
                color="primary"
                variant="tonal"
                size="42"
              >
                <span class="text-body-2 font-weight-bold">{{ surah.nomor }}</span>
              </VAvatar>
              <div class="min-width-0">
                <div class="text-body-1 font-weight-semibold text-truncate">
                  {{ surah.namaLatin }}
                </div>
                <div class="text-caption text-medium-emphasis text-truncate">
                  {{ surah.arti }} &middot; {{ surah.jumlahAyat }} ayat &middot; {{ surah.tempatTurun }}
                </div>
              </div>
            </div>
            <span class="quran-arabic-text text-h5 flex-shrink-0">{{ surah.nama }}</span>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VAlert
      v-if="!loading && !error && filteredSurah.length === 0"
      type="info"
      variant="tonal"
    >
      Surah tidak ditemukan.
    </VAlert>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import api from '@/utils/axios'
import PageHeroHeader from '@/components/shared/PageHeroHeader.vue'
import { useQuranLocalStore } from '../../../composables/useQuranLocalStore'

const { listProgress } = useQuranLocalStore()

const surahList = ref([])
const loading = ref(false)
const error = ref('')
const search = ref('')

const lastRead = computed(() => listProgress()[0] ?? null)

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
.quran-arabic-text {
  font-family: 'Scheherazade New', 'Traditional Arabic', serif;
  direction: rtl;
}

/* ─── Banner "Lanjutkan Membaca" — gradient solid, var lokal (bukan hex),
   dipakai berdiri sendiri karena bukan descendant PageHeroHeader ─────────── */
.quran-continue-banner {
  --qcb-c1: 5, 150, 105;
  --qcb-c2: 16, 185, 129;
  position: relative;
  overflow: hidden;
  border-radius: 20px;
  padding: 20px 24px;
  color: #fff;
  background: linear-gradient(135deg, rgb(var(--qcb-c1)), rgb(var(--qcb-c2)));
  box-shadow: 0 12px 30px -14px rgba(var(--qcb-c1), 0.55);
}

.quran-continue-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.18);
}

.quran-continue-label {
  color: rgba(255, 255, 255, 0.8);
}

.quran-continue-btn {
  background: rgba(255, 255, 255, 0.16) !important;
  color: #fff !important;
  backdrop-filter: blur(8px);
}

.quran-continue-btn:hover {
  background: rgba(255, 255, 255, 0.26) !important;
}

/* ─── Search bar ──────────────────────────────────────────────────────── */
.quran-search-field :deep(.v-field) {
  border-radius: 14px;
}

/* ─── Baris surah ─────────────────────────────────────────────────────── */
.quran-surah-row {
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}

.quran-surah-row::before {
  content: '';
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  width: 4px;
  height: 0;
  background: rgb(var(--v-theme-primary));
  transition: height 0.25s ease;
}

.quran-surah-row:hover {
  transform: translateY(-2px);
  border-color: rgba(var(--v-theme-primary), 0.4);
  box-shadow: 0 8px 20px -10px rgba(var(--v-theme-primary), 0.35);
}

.quran-surah-row:hover::before {
  height: 100%;
}
</style>
