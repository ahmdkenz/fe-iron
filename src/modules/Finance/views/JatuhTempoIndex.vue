<template>
  <div>
    <PageHeader
      title="Tagihan Jatuh Tempo"
      subtitle="Daftar invoice yang akan dan sudah jatuh tempo"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Tagihan Jatuh Tempo', disabled: true },
      ]"
    />

    <!-- Filter -->
    <VCard class="mb-4">
      <VCardText>
        <div class="d-flex flex-wrap gap-3 align-center">
          <VBtnToggle
            v-model="segment"
            variant="outlined"
            mandatory
            divided
            density="compact"
            @update:model-value="doFetch"
          >
            <VBtn value="ALL" size="small" style="min-width: 80px">Semua</VBtn>
            <VBtn value="B2C" size="small" style="min-width: 70px">B2C</VBtn>
            <VBtn value="B2B" size="small" style="min-width: 70px">B2B</VBtn>
          </VBtnToggle>

          <VBtnToggle
            v-model="filters.filter_type"
            variant="outlined"
            mandatory
            divided
            @update:model-value="doFetch"
          >
            <VBtn value="upcoming" size="small" style="min-width: 130px">Akan Jatuh Tempo</VBtn>
            <VBtn value="overdue"  size="small" style="min-width: 110px">Sudah Lewat</VBtn>
            <VBtn value="all"      size="small" style="min-width: 80px">Semua</VBtn>
          </VBtnToggle>

          <Transition name="fade">
            <VSelect
              v-if="filters.filter_type === 'upcoming'"
              v-model="filters.days"
              label="Dalam"
              density="compact"
              hide-details
              style="max-width: 140px"
              :items="daysOptions"
              item-title="label"
              item-value="value"
              @update:model-value="doFetch"
            />
          </Transition>

          <VAutocomplete
            v-model="filters.klien_ar_id"
            placeholder="Semua Klien"
            clearable
            hide-details
            density="compact"
            style="max-width: 240px"
            :items="klienList"
            item-title="nama_klien"
            item-value="id"
            :loading="klienLoading"
            @focus="ensureKlienLoaded()"
            @update:model-value="doFetch"
          />
        </div>
      </VCardText>
    </VCard>

    <!-- Summary Cards -->
    <VRow class="mb-4">
      <VCol cols="12" sm="6" md="3">
        <VCard :color="report.summary?.sudah_lewat > 0 ? 'error' : undefined" variant="tonal">
          <VCardText class="pa-3">
            <div class="text-caption font-weight-medium mb-1">Sudah Lewat Jatuh Tempo</div>
            <div class="text-subtitle-1 font-weight-bold">{{ report.summary?.sudah_lewat ?? 0 }} invoice</div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard color="warning" variant="tonal">
          <VCardText class="pa-3">
            <div class="text-caption font-weight-medium mb-1">Jatuh Tempo Hari Ini</div>
            <div class="text-subtitle-1 font-weight-bold">{{ report.summary?.jatuh_tempo_hari_ini ?? 0 }} invoice</div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard color="info" variant="tonal">
          <VCardText class="pa-3">
            <div class="text-caption font-weight-medium mb-1">Total Invoice</div>
            <div class="text-subtitle-1 font-weight-bold">{{ report.summary?.total_invoice ?? 0 }} invoice</div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard color="error" variant="tonal">
          <VCardText class="pa-3">
            <div class="text-caption font-weight-medium mb-1">Total Sisa Tagihan</div>
            <div class="text-subtitle-1 font-weight-bold">{{ formatCurrency(report.summary?.total_sisa ?? 0) }}</div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Tabel -->
    <VCard>
      <VCardText class="pb-0">
        <div class="text-caption text-medium-emphasis">
          Per tanggal: <strong>{{ report.as_of_date ?? '-' }}</strong>
        </div>
      </VCardText>
      <VDivider class="mt-2" />
      <VProgressLinear v-if="loading" indeterminate color="primary" />
      <BaseTable
        :headers="headers"
        :items="paginatedRows"
        :total="report.rows.length"
        :loading="loading"
        :per-page="perPage"
        :page="page"
        @update:options="onTableOptions"
      >
        <template #item.no="{ index }">
          {{ (page - 1) * perPage + index + 1 }}
        </template>
        <template #item.no_invoice="{ item }">
          <RouterLink
            :to="{ name: 'finance-invoice-show', params: { id: item.invoice_id } }"
            class="text-primary text-decoration-none font-weight-medium"
          >
            {{ item.no_invoice }}
          </RouterLink>
        </template>
        <template #item.nama_klien="{ item }">
          <div class="font-weight-medium">{{ item.nama_klien }}</div>
          <div class="text-caption text-medium-emphasis">{{ item.kode_klien }}</div>
        </template>
        <template #item.perusahaan="{ item }">
          <VChip v-if="item.perusahaan" color="secondary" size="small" variant="tonal" label>
            {{ item.perusahaan }}
          </VChip>
          <span v-else>-</span>
        </template>
        <template #item.tanggal_jatuh_tempo="{ item }">
          {{ item.tanggal_jatuh_tempo ? formatDate(item.tanggal_jatuh_tempo) : '-' }}
        </template>
        <template #item.selisih_hari="{ item }">
          <VChip :color="selisihColor(item.selisih_hari)" size="small" label>
            {{ selisihLabel(item.selisih_hari) }}
          </VChip>
        </template>
        <template #item.status="{ item }">
          <VChip :color="statusColor(item.status)" size="small" label variant="tonal">
            {{ item.status }}
          </VChip>
        </template>
        <template #item.sisa_tagihan="{ item }">
          <span class="font-weight-bold text-error">{{ formatCurrency(item.sisa_tagihan) }}</span>
        </template>
        <template #item.actions="{ item }">
          <VBtn
            icon size="small" variant="text" color="info"
            :to="{ name: 'finance-invoice-show', params: { id: item.invoice_id } }"
          >
            <VIcon icon="ri-eye-line" size="18" />
            <VTooltip activator="parent">Lihat Invoice</VTooltip>
          </VBtn>
        </template>
      </BaseTable>
    </VCard>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useCrud } from '@/composables/useCrud'
import { useLazyFetchAll } from '@/composables/useLazyFetchAll'
import { useFormatter } from '@/composables/useFormatter'
import api from '@/utils/axios'

const authStore = useAuthStore()
const { formatCurrency, formatDate } = useFormatter()
const { items: klienList, loading: klienLoading, fetchAll: fetchKlien } = useCrud('/finance/klien-ar')
const { ensureLoaded: ensureKlienLoaded } = useLazyFetchAll(fetchKlien)

const loading = ref(false)
const report  = reactive({ as_of_date: null, summary: null, rows: [] })
const segment = ref('ALL')

const filters = reactive({
  filter_type:    'upcoming',
  days:           30,
  klien_ar_id:    null,
  karyawan_ar_id: null,
})

const page    = ref(1)
const perPage = ref(15)

const paginatedRows = computed(() =>
  report.rows.slice((page.value - 1) * perPage.value, page.value * perPage.value)
)

function onTableOptions({ page: p, itemsPerPage }) {
  page.value    = p
  perPage.value = itemsPerPage
}

const daysOptions = [
  { label: '7 Hari',  value: 7  },
  { label: '14 Hari', value: 14 },
  { label: '30 Hari', value: 30 },
  { label: '60 Hari', value: 60 },
  { label: '90 Hari', value: 90 },
]

const headers = [
  { title: 'No',          key: 'no',                   sortable: false, width: '50px' },
  { title: 'No Invoice',  key: 'no_invoice',            sortable: false },
  { title: 'Klien',       key: 'nama_klien',            sortable: false },
  { title: 'Entitas',     key: 'perusahaan',            sortable: false },
  { title: 'PIC AR',      key: 'pic_ar',                sortable: false },
  { title: 'Jatuh Tempo', key: 'tanggal_jatuh_tempo',   sortable: false, align: 'center' },
  { title: 'Status Hari', key: 'selisih_hari',          sortable: false, align: 'center' },
  { title: 'Status',      key: 'status',                sortable: false, align: 'center' },
  { title: 'Sisa Tagihan',key: 'sisa_tagihan',          sortable: false, align: 'end' },
  { title: 'Aksi',        key: 'actions',               sortable: false, align: 'center', width: '70px' },
]

function selisihColor(hari) {
  if (hari === null) return 'default'
  if (hari < 0) return 'error'
  if (hari === 0) return 'warning'
  if (hari <= 7) return 'deep-orange'
  if (hari <= 14) return 'warning'
  return 'info'
}

function selisihLabel(hari) {
  if (hari === null) return 'Tdk Ada JT'
  if (hari < 0) return `${Math.abs(hari)} hari lewat`
  if (hari === 0) return 'Hari ini'
  return `${hari} hari lagi`
}

function statusColor(status) {
  return { TERKIRIM: 'info', SEBAGIAN: 'warning' }[status] ?? 'default'
}

async function doFetch() {
  page.value    = 1
  loading.value = true
  try {
    const params = { filter_type: filters.filter_type }
    if (filters.filter_type === 'upcoming') params.days = filters.days
    if (filters.klien_ar_id)     params.klien_ar_id     = filters.klien_ar_id
    if (filters.karyawan_ar_id)  params.karyawan_ar_id  = filters.karyawan_ar_id
    if (segment.value !== 'ALL') params.segment         = segment.value

    const { data } = await api.get('/finance/jatuh-tempo', { params })
    Object.assign(report, data.data)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const isPrivileged = authStore.isAdmin || authStore.isManager || authStore.isSupervisor || authStore.isDirector
  if (!isPrivileged && authStore.user?.karyawan_id) {
    filters.karyawan_ar_id = authStore.user.karyawan_id
  }
  doFetch()
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
