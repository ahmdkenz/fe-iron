<template>
  <div class="laporan-page">
    <PageHeader
      title="Laporan"
      subtitle="Semua laporan keuangan dan piutang dalam satu tempat"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Laporan', disabled: true },
      ]"
    />

    <!-- Toolbar: search + category filter -->
    <VCard
      flat
      class="mb-5 toolbar-card"
    >
      <VCardText class="d-flex flex-column flex-sm-row gap-3 align-start align-sm-center">
        <VTextField
          v-model="searchQuery"
          placeholder="Cari laporan berdasarkan judul, deskripsi, atau tag..."
          prepend-inner-icon="ri-search-line"
          density="comfortable"
          variant="outlined"
          hide-details
          clearable
          class="search-field"
        />
        <div class="d-flex flex-wrap gap-2">
          <VChip
            v-for="cat in categories"
            :key="cat.key"
            :color="activeGroup === cat.key ? 'primary' : undefined"
            :variant="activeGroup === cat.key ? 'flat' : 'outlined'"
            size="small"
            label
            class="cursor-pointer"
            @click="activeGroup = cat.key"
          >
            {{ cat.label }}
          </VChip>
        </div>
      </VCardText>
    </VCard>

    <!-- Empty state -->
    <VCard
      v-if="!filteredReports.length"
      flat
      class="empty-state-card text-center py-10"
    >
      <VIcon
        icon="ri-file-search-line"
        size="40"
        class="text-medium-emphasis mb-3"
      />
      <div class="text-body-1 font-weight-medium mb-1">
        Tidak ada laporan yang cocok
      </div>
      <div class="text-body-2 text-medium-emphasis mb-4">
        Coba ubah kata kunci pencarian atau kategori filter.
      </div>
      <div>
        <VBtn
          variant="tonal"
          color="primary"
          size="small"
          @click="resetFilters"
        >
          Reset filter
        </VBtn>
      </div>
    </VCard>

    <template v-else>
      <!-- Laporan Utama -->
      <section
        v-if="activeGroup === 'all' && featuredReports.length"
        class="mb-6"
      >
        <div class="section-heading d-flex align-center gap-2 mb-3">
          <VIcon
            icon="ri-pie-chart-2-line"
            size="18"
            class="text-primary"
          />
          <span class="text-subtitle-1 font-weight-bold">Laporan Utama</span>
        </div>
        <VRow>
          <VCol
            v-for="report in featuredReports"
            :key="report.route"
            cols="12"
            md="6"
          >
            <VCard
              flat
              class="report-card report-card--featured"
              :style="accentStyle(report.color)"
            >
              <VCardText class="d-flex align-start gap-3">
                <VAvatar
                  :color="report.color"
                  variant="tonal"
                  size="52"
                  class="flex-shrink-0 rounded-lg"
                >
                  <VIcon
                    :icon="report.icon"
                    size="26"
                  />
                </VAvatar>
                <div class="min-width-0 flex-grow-1">
                  <div class="d-flex align-center gap-2 mb-1">
                    <span class="text-h6 font-weight-bold">{{ report.title }}</span>
                    <VChip
                      color="primary"
                      variant="tonal"
                      size="x-small"
                      label
                    >
                      Utama
                    </VChip>
                  </div>
                  <div class="text-body-2 text-medium-emphasis mb-3">
                    {{ report.description }}
                  </div>
                  <VBtn
                    variant="tonal"
                    :color="report.color"
                    size="small"
                    append-icon="ri-arrow-right-line"
                    :to="{ name: report.route }"
                  >
                    Lihat laporan
                  </VBtn>
                </div>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </section>

      <!-- Grouped sections -->
      <section
        v-for="group in groupedReports"
        :key="group.key"
        class="mb-6"
      >
        <div class="section-heading d-flex align-center gap-2 mb-3">
          <VAvatar
            :color="group.color"
            variant="tonal"
            size="28"
            class="rounded-lg"
          >
            <VIcon
              :icon="group.icon"
              size="16"
            />
          </VAvatar>
          <span class="text-subtitle-1 font-weight-bold">{{ group.label }}</span>
          <VChip
            size="x-small"
            variant="outlined"
            label
          >
            {{ group.reports.length }}
          </VChip>
        </div>
        <VRow>
          <VCol
            v-for="report in group.reports"
            :key="report.route"
            cols="12"
            sm="6"
            md="4"
          >
            <VCard
              flat
              height="100%"
              class="report-card"
              :style="accentStyle(report.color)"
            >
              <VCardText class="d-flex flex-column h-100">
                <div class="d-flex align-start justify-space-between gap-2 mb-2">
                  <VAvatar
                    :color="report.color"
                    variant="tonal"
                    size="40"
                    class="rounded-lg"
                  >
                    <VIcon
                      :icon="report.icon"
                      size="20"
                    />
                  </VAvatar>
                  <VBtn
                    icon
                    variant="text"
                    size="small"
                    :color="report.color"
                    :to="{ name: report.route }"
                  >
                    <VIcon
                      icon="ri-arrow-right-up-line"
                      size="18"
                    />
                  </VBtn>
                </div>
                <div class="text-subtitle-2 font-weight-bold mb-1">
                  {{ report.title }}
                </div>
                <div class="text-body-2 text-medium-emphasis mb-3 flex-grow-1">
                  {{ report.description }}
                </div>
                <div class="d-flex flex-wrap gap-1">
                  <VChip
                    v-for="tag in report.tags"
                    :key="tag"
                    size="x-small"
                    variant="outlined"
                    label
                  >
                    {{ tag }}
                  </VChip>
                </div>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const reports = [
  {
    title: 'Jurnal Aktivitas per PIC',
    description: 'Penelusuran pembayaran berdasarkan PIC dan nomor referensi',
    route: 'finance-laporan-jurnal-pic',
    icon: 'ri-history-line',
    color: 'secondary',
    group: 'pic',
    tags: ['pic', 'aktivitas', 'referensi'],
  },
  {
    title: 'Rekening Koran',
    description: 'Riwayat transaksi per klien dengan saldo berjalan',
    route: 'finance-laporan-rekening-koran',
    icon: 'ri-bank-line',
    color: 'info',
    group: 'kas',
    tags: ['kas', 'saldo', 'mutasi'],
  },
  {
    title: 'Laporan Aging',
    description: 'Laporan umur piutang belum terbayar',
    route: 'finance-laporan-aging',
    icon: 'ri-time-line',
    color: 'warning',
    group: 'piutang',
    tags: ['piutang', 'jatuh tempo', 'umur'],
    featured: true,
  },
  {
    title: 'Rekap Piutang per Klien',
    description: 'Ringkasan outstanding per Client',
    route: 'finance-laporan-rekap-klien',
    icon: 'ri-pie-chart-2-line',
    color: 'warning',
    group: 'piutang',
    tags: ['piutang', 'outstanding', 'klien'],
    featured: true,
  },
  {
    title: 'Riwayat Pembayaran',
    description: 'Daftar semua pembayaran AR',
    route: 'finance-laporan-riwayat-bayar',
    icon: 'ri-exchange-funds-line',
    color: 'success',
    group: 'pembayaran',
    tags: ['pembayaran', 'histori', 'ar'],
  },
  {
    title: 'Mutasi Piutang',
    description: 'Pergerakan piutang per klien dalam satu periode',
    route: 'finance-laporan-mutasi-piutang',
    icon: 'ri-exchange-line',
    color: 'warning',
    group: 'piutang',
    tags: ['piutang', 'pergerakan', 'periode'],
  },
  {
    title: 'Rekap Pembayaran',
    description: 'Rekap pembayaran AR per transaksi',
    route: 'finance-laporan-rekap-pembayaran',
    icon: 'ri-file-chart-line',
    color: 'success',
    group: 'pembayaran',
    tags: ['pembayaran', 'transaksi', 'rekap'],
  },
  {
    title: 'Kinerja AR per PIC',
    description: 'Performa penagihan per PIC',
    route: 'finance-laporan-kinerja-ar',
    icon: 'ri-user-star-line',
    color: 'secondary',
    group: 'pic',
    tags: ['pic', 'performa', 'penagihan'],
  },
  {
    title: 'Pendapatan di Muka',
    description: 'Daftar pembayaran yang diterima sebelum jasa diberikan',
    route: 'finance-laporan-pdm',
    icon: 'ri-wallet-3-line',
    color: 'info',
    group: 'kas',
    tags: ['kas', 'pdm', 'diterima'],
  },
]

const groupDefinitions = [
  { key: 'piutang', label: 'Piutang & Aging', icon: 'ri-scales-2-line', color: 'warning' },
  { key: 'pembayaran', label: 'Pembayaran', icon: 'ri-bank-card-line', color: 'success' },
  { key: 'kas', label: 'Kas & Rekening', icon: 'ri-bank-line', color: 'info' },
  { key: 'pic', label: 'Aktivitas PIC', icon: 'ri-user-star-line', color: 'secondary' },
]

const categories = [
  { key: 'all', label: 'Semua' },
  { key: 'piutang', label: 'Piutang' },
  { key: 'pembayaran', label: 'Pembayaran' },
  { key: 'kas', label: 'Kas' },
  { key: 'pic', label: 'PIC' },
]

const searchQuery = ref('')
const activeGroup = ref('all')

function matchesSearch(report) {
  const keyword = searchQuery.value.trim().toLowerCase()
  if (!keyword) return true

  const haystack = [report.title, report.description, ...(report.tags ?? [])]
    .join(' ')
    .toLowerCase()

  return haystack.includes(keyword)
}

const filteredReports = computed(() => reports.filter(report => {
  const groupMatch = activeGroup.value === 'all' || report.group === activeGroup.value
  
  return groupMatch && matchesSearch(report)
}))

const featuredReports = computed(() => filteredReports.value.filter(report => report.featured))

function visibleGroupReports(groupKey) {
  return filteredReports.value.filter(report => report.group === groupKey)
}

const groupedReports = computed(() => groupDefinitions
  .map(group => ({ ...group, reports: visibleGroupReports(group.key) }))
  .filter(group => group.reports.length))

function resetFilters() {
  searchQuery.value = ''
  activeGroup.value = 'all'
}

function accentStyle(color) {
  return { borderInlineStartColor: `rgb(var(--v-theme-${color}))` }
}
</script>

<style scoped>
.laporan-page :deep(.breadcrumb-active) {
  background: rgb(var(--v-theme-primary));
  box-shadow: none;
  text-shadow: none;
}

.toolbar-card,
.empty-state-card {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 8px;
}

.search-field {
  max-width: 420px;
}

.section-heading {
  min-height: 28px;
}

.report-card {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-inline-start: 3px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 8px;
  transition: border-color 0.15s ease, transform 0.15s ease;
}

.report-card:hover {
  border-color: rgba(var(--v-theme-on-surface), 0.18);
  transform: translateY(-2px);
}

.report-card--featured {
  height: 100%;
}

@media (max-width: 599px) {
  .search-field {
    max-width: 100%;
  }
}
</style>
