<template>
  <div>
    <PageHeader
      title="Laporan Aging"
      subtitle="Laporan umur piutang belum terbayar (basis tanggal jatuh tempo)"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Laporan', to: { name: 'finance-laporan' } },
        { title: 'Laporan Aging', disabled: true },
      ]"
    >
      <VBtn
        color="primary"
        variant="flat"
        prepend-icon="ri-download-2-line"
        :loading="exporting"
        class="me-2"
        @click="doExport"
      >
        Export
      </VBtn>
      <VBtn
        variant="text"
        prepend-icon="ri-arrow-left-line"
        :to="{ name: 'finance-laporan' }"
      >
        Kembali
      </VBtn>
    </PageHeader>

    <!-- Filter -->
    <VCard class="mb-4">
      <VCardText class="d-flex flex-wrap gap-3 align-center">
        <VBtnToggle
          v-model="segment"
          variant="outlined"
          mandatory
          divided
          density="compact"
          @update:model-value="doFetch"
        >
          <VBtn
            value="ALL"
            size="small"
            style="min-width: 80px"
          >
            Semua
          </VBtn>
          <VBtn
            value="B2C"
            size="small"
            style="min-width: 70px"
          >
            B2C
          </VBtn>
          <VBtn
            value="B2B"
            size="small"
            style="min-width: 70px"
          >
            B2B
          </VBtn>
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
          item-title="display_label"
          item-value="id"
          :loading="klienLoading"
          @focus="ensureKlienLoaded"
          @update:model-value="doFetch"
        />
        <VSpacer />
        <VBtn
          :color="bucketFilter === 'hari_91_plus' ? 'error' : undefined"
          :variant="bucketFilter === 'hari_91_plus' ? 'flat' : 'outlined'"
          size="small"
          prepend-icon="ri-alarm-warning-line"
          @click="toggleBucket('hari_91_plus')"
        >
          Hanya &gt;90 hari
        </VBtn>
      </VCardText>
    </VCard>

    <!-- Summary Cards (klik untuk filter bucket) -->
    <VRow class="mb-2">
      <VCol
        v-for="bucket in buckets"
        :key="bucket.key"
        cols="12"
        sm="6"
        md="2"
      >
        <VCard
          :color="bucket.color"
          :variant="bucketFilter === bucket.key ? 'flat' : 'tonal'"
          class="bucket-card"
          :class="{ 'bucket-card--active': bucketFilter === bucket.key }"
          @click="toggleBucket(bucket.key)"
        >
          <VCardText class="pa-3">
            <div class="text-caption font-weight-medium mb-1 d-flex align-center justify-space-between">
              <span>{{ bucket.label }}</span>
              <VIcon
                v-if="bucketFilter === bucket.key"
                icon="ri-filter-fill"
                size="14"
              />
            </div>
            <div class="text-subtitle-1 font-weight-bold">
              {{ formatCurrency(summary?.[bucket.key] ?? 0) }}
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Info filter aktif -->
    <div
      v-if="bucketFilter"
      class="d-flex align-center gap-2 mb-4"
    >
      <VChip
        color="primary"
        size="small"
        variant="tonal"
        prepend-icon="ri-filter-line"
      >
        Bucket: {{ bucketMeta(bucketFilter).label }}
      </VChip>
      <VBtn
        size="small"
        variant="text"
        prepend-icon="ri-close-line"
        @click="resetBucket"
      >
        Tampilkan semua
      </VBtn>
    </div>

    <!-- Tabel -->
    <VCard>
      <VCardText class="pb-0">
        <div class="text-caption text-medium-emphasis">
          Per tanggal: <strong>{{ formatDate(asOfDate) ?? '-' }}</strong>
          &nbsp;·&nbsp; {{ total }} klien
          <span class="text-disabled">&nbsp;·&nbsp; klik baris untuk lihat detail invoice</span>
        </div>
      </VCardText>
      <VDivider class="mt-2" />
      <BaseTable
        v-model:expanded="expanded"
        :headers="headers"
        :items="rows"
        :total="total"
        :loading="loading"
        pagination-mode="load-more"
        :has-more="hasMore"
        :loading-more="loadingMore"
        :loaded-count="rows.length"
        show-expand
        item-value="klien_id"
        hover
        @load-more="loadMore"
        @click:row="onRowClick"
      >
        <template #item.no="{ index }">
          {{ index + 1 }}
        </template>
        <template #item.nama_klien="{ item }">
          <div class="font-weight-medium">
            {{ item.nama_klien }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ item.kode_klien }}<template v-if="item.nama_resto">
              · {{ item.nama_resto }}
            </template>
          </div>
        </template>
        <template #item.pic_ar="{ item }">
          {{ item.pic_ar ?? '-' }}
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

        <!-- Detail invoice per klien -->
        <template #expanded-row="{ item, columns }">
          <tr class="aging-detail-row">
            <td
              :colspan="columns.length"
              class="pa-0"
            >
              <div class="pa-4">
                <div class="text-caption font-weight-medium mb-2">
                  Detail Invoice — {{ item.nama_klien }}<template v-if="item.nama_resto">
                    ({{ item.nama_resto }})
                  </template>
                  <span class="text-medium-emphasis">({{ displayDetails(item).length }} invoice)</span>
                </div>
                <div class="aging-detail-scroll">
                  <VTable
                    density="compact"
                    class="aging-detail-table"
                  >
                    <thead>
                      <tr>
                        <th>No Invoice</th>
                        <th>Tgl Invoice</th>
                        <th>Jatuh Tempo</th>
                        <th class="text-end">
                          Umur
                        </th>
                        <th class="text-end">
                          Terlambat
                        </th>
                        <th>Bucket</th>
                        <th class="text-end">
                          Total Tagihan
                        </th>
                        <th class="text-end">
                          Total Bayar
                        </th>
                        <th class="text-end">
                          Sisa Tagihan
                        </th>
                        <th>Status</th>
                        <th>PIC AR</th>
                        <th>Entitas</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(d, i) in displayDetails(item)"
                        :key="i"
                      >
                        <td class="font-weight-medium">
                          {{ d.no_invoice ?? '-' }}
                        </td>
                        <td>{{ formatDate(d.tanggal_invoice) ?? '-' }}</td>
                        <td>{{ formatDate(d.tanggal_jatuh_tempo) ?? '-' }}</td>
                        <td class="text-end">
                          {{ d.umur_invoice ?? '-' }}
                        </td>
                        <td
                          class="text-end"
                          :class="d.hari_terlambat > 0 ? 'text-error font-weight-medium' : ''"
                        >
                          {{ d.hari_terlambat }}
                        </td>
                        <td>
                          <VChip
                            :color="bucketMeta(d.bucket).color"
                            size="x-small"
                            variant="tonal"
                          >
                            {{ bucketMeta(d.bucket).label }}
                          </VChip>
                        </td>
                        <td class="text-end">
                          {{ formatCurrency(d.total_tagihan) }}
                        </td>
                        <td class="text-end">
                          {{ formatCurrency(d.total_pembayaran) }}
                        </td>
                        <td class="text-end font-weight-medium">
                          {{ formatCurrency(d.sisa_tagihan) }}
                        </td>
                        <td>{{ d.status }}</td>
                        <td>{{ d.pic_ar ?? '-' }}</td>
                        <td>{{ d.perusahaan ?? '-' }}</td>
                      </tr>
                      <tr v-if="!displayDetails(item).length">
                        <td
                          colspan="12"
                          class="text-center text-medium-emphasis py-4"
                        >
                          Tidak ada invoice pada filter bucket ini.
                        </td>
                      </tr>
                    </tbody>
                  </VTable>
                </div>
              </div>
            </td>
          </tr>
        </template>
      </BaseTable>
    </VCard>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useCrud } from '@/composables/useCrud'
import { useLazyFetchAll } from '@/composables/useLazyFetchAll'
import { useFormatter } from '@/composables/useFormatter'
import api from '@/utils/axios'

const { formatCurrency, formatDate } = useFormatter()
const { items: klienList, loading: klienLoading, fetchAll: fetchKlien } = useCrud('/finance/klien-ar')
const { ensureLoaded: ensureKlienLoaded } = useLazyFetchAll(fetchKlien)

const loading     = ref(false)
const loadingMore = ref(false)
const exporting   = ref(false)
const rows        = ref([])
const summary     = ref(null)
const asOfDate    = ref(null)
const segment     = ref('ALL')
const expanded    = ref([])

const bucketFilter = ref(null)

const filters = reactive({
  as_of_date: new Date().toISOString().slice(0, 10),
  klien_ar_id: null,
})

// ─── Pagination "load more" (manual, bukan useLoadMore) ───────────────────
// PENTING: endpoint ini TIDAK mengembalikan {data, meta} rata di top-level
// seperti kontrak useLoadMore — payload aslinya { as_of_date, summary, rows,
// meta } (meta ikut ter-nest di dalam data.data bersama summary/as_of_date).
// Composable useLoadMore generik akan error runtime kalau dipasang langsung
// di sini (data.data bukan array). State load-more ditulis manual, meniru
// API useLoadMore (reset via doFetch/loadMore/abort + dedupe-by-key) sambil
// meng-unwrap payload bentuk ini.
const PER_PAGE = 15
const page     = ref(1)
const lastPage = ref(1)
const total    = ref(0)
const hasMore  = computed(() => page.value < lastPage.value)

let controller = null

const buckets = [
  { key: 'current',      label: 'Belum Jatuh Tempo', color: 'success' },
  { key: 'hari_1_30',    label: '1–30 Hari',          color: 'info' },
  { key: 'hari_31_60',   label: '31–60 Hari',          color: 'warning' },
  { key: 'hari_61_90',   label: '61–90 Hari',          color: 'deep-orange' },
  { key: 'hari_91_plus', label: '>90 Hari',             color: 'error' },
]

const bucketByKey = Object.fromEntries(buckets.map(b => [b.key, b]))

function bucketMeta(key) {
  return bucketByKey[key] ?? { label: key, color: 'default' }
}

const headers = [
  { title: 'No',                key: 'no',           sortable: false, width: '50px' },
  { title: 'Klien',             key: 'nama_klien',   sortable: false },
  { title: 'PIC AR',            key: 'pic_ar',       sortable: false },
  { title: 'Belum Jatuh Tempo', key: 'current',      sortable: false, align: 'end' },
  { title: '1–30 Hari',         key: 'hari_1_30',    sortable: false, align: 'end' },
  { title: '31–60 Hari',        key: 'hari_31_60',   sortable: false, align: 'end' },
  { title: '61–90 Hari',        key: 'hari_61_90',   sortable: false, align: 'end' },
  { title: '>90 Hari',          key: 'hari_91_plus', sortable: false, align: 'end' },
  { title: 'Total',             key: 'total',        sortable: false, align: 'end' },
]

function displayDetails(item) {
  const list = item.details ?? []
  if (!bucketFilter.value) return list

  return list.filter(d => d.bucket === bucketFilter.value)
}

function toggleBucket(key) {
  bucketFilter.value = bucketFilter.value === key ? null : key
  doFetch()
}

function resetBucket() {
  bucketFilter.value = null
  doFetch()
}

// Klik baris untuk toggle expand detail invoice (ikon panah tetap berfungsi sebagai fallback).
function onRowClick(_event, { item } = {}) {
  const key = item?.klien_id
  if (key == null) return

  expanded.value = expanded.value.includes(key)
    ? expanded.value.filter(k => k !== key)
    : [...expanded.value, key]
}

function buildParams() {
  const params = {}
  if (filters.as_of_date)      params.as_of_date  = filters.as_of_date
  if (filters.klien_ar_id)     params.klien_ar_id = filters.klien_ar_id
  if (segment.value !== 'ALL') params.segment     = segment.value

  return params
}

async function fetchAging({ append = false } = {}) {
  controller?.abort()

  const ctrl = new AbortController()

  controller = ctrl

  const nextPage = append ? page.value + 1 : 1

  if (append) loadingMore.value = true
  else loading.value = true

  try {
    const params = buildParams()
    if (bucketFilter.value) params.bucket_filter = bucketFilter.value
    params.page     = nextPage
    params.per_page = PER_PAGE

    const { data } = await api.get('/finance/aging-report', { params, signal: ctrl.signal })
    const payload  = data.data ?? {}
    const newRows  = payload.rows ?? []

    if (append) {
      const existingKeys = new Set(rows.value.map(r => r.klien_id))

      rows.value = [...rows.value, ...newRows.filter(r => !existingKeys.has(r.klien_id))]
    } else {
      rows.value     = newRows
      expanded.value = []
    }

    summary.value  = payload.summary ?? summary.value
    asOfDate.value = payload.as_of_date ?? asOfDate.value
    page.value     = payload.meta?.current_page ?? nextPage
    lastPage.value = payload.meta?.last_page ?? 1
    total.value    = payload.meta?.total ?? newRows.length
  } catch (err) {
    if (err.code === 'ERR_CANCELED') return

    if (!append) rows.value = []
  } finally {
    if (controller === ctrl) controller = null
    if (append) loadingMore.value = false
    else loading.value = false
  }
}

function doFetch() {
  return fetchAging({ append: false })
}

function loadMore() {
  if (!hasMore.value || loading.value || loadingMore.value) return

  return fetchAging({ append: true })
}

function abort() {
  controller?.abort()
  controller = null
}

async function doExport() {
  exporting.value = true
  try {
    const response = await api.get('/finance/aging-report/export-excel', {
      params: buildParams(),
      responseType: 'blob',
    })

    const url  = URL.createObjectURL(new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }))

    const link    = document.createElement('a')

    link.href     = url
    link.download = `aging-report-${asOfDate.value ?? filters.as_of_date}.xlsx`
    link.click()
    URL.revokeObjectURL(url)
  } finally {
    exporting.value = false
  }
}

onMounted(doFetch)

onBeforeUnmount(() => {
  abort()
})
</script>

<style scoped>
.bucket-card {
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}

.bucket-card:hover {
  transform: translateY(-2px);
}

.bucket-card--active {
  box-shadow: 0 0 0 2px rgba(var(--v-theme-on-surface), 0.35);
}

.aging-detail-row > td {
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.aging-detail-scroll {
  overflow-x: auto;
}

.aging-detail-table :deep(th),
.aging-detail-table :deep(td) {
  white-space: nowrap;
}
</style>
