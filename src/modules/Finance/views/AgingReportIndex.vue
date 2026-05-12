<template>
  <div>
    <PageHeader
      title="Laporan Aging"
      subtitle="Laporan umur piutang belum terbayar"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Laporan Aging', disabled: true },
      ]"
    />

    <!-- Filter -->
    <VCard class="mb-4">
      <VCardText class="d-flex flex-wrap gap-3">
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
        <VTextField
          v-model="filters.as_of_date"
          label="Per Tanggal"
          type="date"
          density="compact"
          hide-details
          style="max-width: 180px"
          @update:model-value="doFetch"
        />
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
      </VCardText>
    </VCard>

    <!-- Summary Cards -->
    <VRow class="mb-4">
      <VCol
        v-for="bucket in buckets"
        :key="bucket.key"
        cols="12"
        sm="6"
        md="2"
      >
        <VCard :color="bucket.color" variant="tonal">
          <VCardText class="pa-3">
            <div class="text-caption font-weight-medium mb-1">{{ bucket.label }}</div>
            <div class="text-subtitle-1 font-weight-bold">
              {{ formatCurrency(report.summary?.[bucket.key] ?? 0) }}
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Tabel -->
    <VCard>
      <VCardText class="pb-0">
        <div class="text-caption text-medium-emphasis">
          Per tanggal: <strong>{{ report.as_of_date ?? '-' }}</strong>
          &nbsp;·&nbsp; {{ report.rows?.length ?? 0 }} klien
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
        <template #item.current="{ item }">
          {{ item.current > 0 ? formatCurrency(item.current) : '-' }}
        </template>
        <template #item.hari_1_30="{ item }">
          <span :class="item.hari_1_30 > 0 ? 'text-info' : ''">
            {{ item.hari_1_30 > 0 ? formatCurrency(item.hari_1_30) : '-' }}
          </span>
        </template>
        <template #item.hari_31_60="{ item }">
          <span :class="item.hari_31_60 > 0 ? 'text-warning' : ''">
            {{ item.hari_31_60 > 0 ? formatCurrency(item.hari_31_60) : '-' }}
          </span>
        </template>
        <template #item.hari_61_90="{ item }">
          <span :class="item.hari_61_90 > 0 ? 'text-deep-orange' : ''">
            {{ item.hari_61_90 > 0 ? formatCurrency(item.hari_61_90) : '-' }}
          </span>
        </template>
        <template #item.hari_91_plus="{ item }">
          <span :class="item.hari_91_plus > 0 ? 'text-error' : ''">
            {{ item.hari_91_plus > 0 ? formatCurrency(item.hari_91_plus) : '-' }}
          </span>
        </template>
        <template #item.total="{ item }">
          <span class="font-weight-bold">{{ formatCurrency(item.total) }}</span>
        </template>
      </BaseTable>
    </VCard>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useCrud } from '@/composables/useCrud'
import { useLazyFetchAll } from '@/composables/useLazyFetchAll'
import { useFormatter } from '@/composables/useFormatter'
import api from '@/utils/axios'

const { formatCurrency } = useFormatter()
const { items: klienList, loading: klienLoading, fetchAll: fetchKlien } = useCrud('/finance/klien-ar')
const { ensureLoaded: ensureKlienLoaded } = useLazyFetchAll(fetchKlien)

const loading = ref(false)
const report  = reactive({ as_of_date: null, summary: null, rows: [] })
const segment = ref('ALL')

const filters = reactive({
  as_of_date:  new Date().toISOString().slice(0, 10),
  klien_ar_id: null,
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

const buckets = [
  { key: 'current',      label: 'Belum Jatuh Tempo', color: 'success' },
  { key: 'hari_1_30',    label: '1–30 Hari',          color: 'info'    },
  { key: 'hari_31_60',   label: '31–60 Hari',          color: 'warning' },
  { key: 'hari_61_90',   label: '61–90 Hari',          color: 'deep-orange' },
  { key: 'hari_91_plus', label: '>90 Hari',             color: 'error'   },
]

const headers = [
  { title: 'No',               key: 'no',           sortable: false, width: '50px' },
  { title: 'Klien',            key: 'nama_klien',   sortable: false },
  { title: 'Perusahaan',       key: 'perusahaan',   sortable: false },
  { title: 'Belum Jatuh Tempo',key: 'current',      sortable: false, align: 'end' },
  { title: '1–30 Hari',        key: 'hari_1_30',    sortable: false, align: 'end' },
  { title: '31–60 Hari',       key: 'hari_31_60',   sortable: false, align: 'end' },
  { title: '61–90 Hari',       key: 'hari_61_90',   sortable: false, align: 'end' },
  { title: '>90 Hari',         key: 'hari_91_plus', sortable: false, align: 'end' },
  { title: 'Total',            key: 'total',        sortable: false, align: 'end' },
]

async function doFetch() {
  page.value    = 1
  loading.value = true
  try {
    const params = {}
    if (filters.as_of_date)      params.as_of_date  = filters.as_of_date
    if (filters.klien_ar_id)     params.klien_ar_id = filters.klien_ar_id
    if (segment.value !== 'ALL') params.segment     = segment.value

    const { data } = await api.get('/finance/aging-report', { params })
    Object.assign(report, data.data)
  } finally {
    loading.value = false
  }
}

onMounted(doFetch)
</script>
