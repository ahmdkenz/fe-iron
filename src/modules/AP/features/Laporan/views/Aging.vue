<template>
  <div>
    <PageHeader
      title="Aging Hutang"
      subtitle="Umur hutang belum terbayar per vendor"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'ap-dashboard' } },
        { title: 'Laporan', to: { name: 'ap-laporan' } },
        { title: 'Aging Hutang', disabled: true },
      ]"
    >
      <VBtn
        color="primary"
        variant="flat"
        prepend-icon="ri-download-2-line"
        class="me-2"
        :loading="exporting"
        @click="doExport"
      >
        Export
      </VBtn>
      <VBtn
        variant="text"
        prepend-icon="ri-arrow-left-line"
        :to="{ name: 'ap-laporan' }"
      >
        Kembali
      </VBtn>
    </PageHeader>

    <VCard
      elevation="0"
      border
      rounded="lg"
      class="mb-6"
    >
      <VCardTitle class="px-5 pt-5 pb-0 text-subtitle-2 text-uppercase text-medium-emphasis font-weight-bold">
        Filter Laporan
      </VCardTitle>
      <VCardText class="pa-5">
        <VRow
          align="center"
          dense
        >
          <VCol
            cols="6"
            sm="auto"
          >
            <VTextField
              v-model="draft.as_of_date"
              label="Per Tanggal"
              type="date"
              density="compact"
              variant="outlined"
              hide-details
              style="min-width: 170px"
            />
          </VCol>
          <VCol
            cols="12"
            sm="auto"
          >
            <VAutocomplete
              v-model="draft.vendor_ap_id"
              label="Vendor"
              placeholder="Semua Vendor"
              variant="outlined"
              clearable
              hide-details
              density="compact"
              prepend-inner-icon="ri-search-line"
              style="min-width: 220px"
              :items="vendorList"
              item-title="display_label"
              item-value="id"
              :loading="vendorLoading"
              @focus="ensureVendorLoaded"
            />
          </VCol>
          <VCol
            cols="12"
            sm="auto"
          >
            <VBtn
              color="primary"
              prepend-icon="ri-filter-3-line"
              :loading="loading"
              @click="doFetch"
            >
              Filter
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

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

    <VCard
      elevation="0"
      border
      rounded="lg"
    >
      <div class="d-flex flex-wrap align-center justify-space-between px-5 py-4 bg-var-theme-background">
        <div>
          <h3 class="text-subtitle-1 font-weight-bold mb-1">
            Aging per Vendor
          </h3>
          <div class="text-caption text-medium-emphasis">
            Per Tanggal: <strong>{{ asOfDate ?? '-' }}</strong>
          </div>
        </div>
        <VChip
          size="small"
          color="primary"
          variant="tonal"
          class="font-weight-medium"
        >
          Total: {{ total }} Vendor
        </VChip>
      </div>

      <VDivider />

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
        item-value="vendor_id"
        hover
        wrap-text
        @load-more="loadMore"
        @click:row="onRowClick"
      >
        <template #item.no="{ index }">
          <span class="text-medium-emphasis">{{ index + 1 }}</span>
        </template>

        <template #item.nama_vendor="{ item }">
          <div class="font-weight-medium text-high-emphasis">
            {{ item.nama_vendor }}
          </div>
          <div class="text-caption text-medium-emphasis mt-1">
            {{ item.kode_vendor }}
          </div>
        </template>

        <template #item.pic_ap="{ item }">
          {{ item.pic_ap ?? '-' }}
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

        <template #expanded-row="{ item, columns }">
          <tr class="aging-detail-row">
            <td
              :colspan="columns.length"
              class="pa-0"
            >
              <div class="pa-4">
                <div class="text-caption font-weight-medium mb-2">
                  Detail Tagihan — {{ item.nama_vendor }}
                  <span class="text-medium-emphasis">({{ displayDetails(item).length }} tagihan)</span>
                </div>
                <div class="aging-detail-scroll">
                  <VTable
                    density="compact"
                    class="aging-detail-table"
                  >
                    <thead>
                      <tr>
                        <th>No Tagihan</th>
                        <th>Tgl Tagihan</th>
                        <th>Jatuh Tempo</th>
                        <th class="text-end">
                          Terlambat
                        </th>
                        <th>Bucket</th>
                        <th class="text-end">
                          Sisa Tagihan
                        </th>
                        <th>Status</th>
                        <th>Entitas</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="d in displayDetails(item)"
                        :key="d.tagihan_id"
                      >
                        <td class="font-weight-medium">
                          {{ d.no_tagihan }}
                        </td>
                        <td>{{ formatDate(d.tanggal_tagihan) ?? '-' }}</td>
                        <td>{{ formatDate(d.tanggal_jatuh_tempo) ?? '-' }}</td>
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
                        <td class="text-end font-weight-medium">
                          {{ formatCurrency(d.sisa_tagihan) }}
                        </td>
                        <td>{{ d.status }}</td>
                        <td>{{ d.perusahaan ?? '-' }}</td>
                      </tr>
                      <tr v-if="!displayDetails(item).length">
                        <td
                          colspan="8"
                          class="text-center text-medium-emphasis py-4"
                        >
                          Tidak ada tagihan pada filter bucket ini.
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
const { items: vendorList, loading: vendorLoading, fetchAll: fetchVendor } = useCrud('/ap/vendors')
const { ensureLoaded: ensureVendorLoaded } = useLazyFetchAll(fetchVendor)

const loading     = ref(false)
const loadingMore = ref(false)
const exporting   = ref(false)
const rows        = ref([])
const summary     = ref(null)
const asOfDate    = ref(null)
const expanded    = ref([])
const bucketFilter = ref(null)

const draft = reactive({
  as_of_date: new Date().toISOString().slice(0, 10),
  vendor_ap_id: null,
})

// ─── Pagination "load more" (manual, bukan useLoadMore) ───────────────────
// PENTING: sama seperti AgingReport.vue (AR) — endpoint ini mengembalikan
// payload { as_of_date, summary, rows, meta } (bukan {data, meta} rata di
// top-level), jadi useLoadMore generik tidak kompatibel langsung. State
// load-more ditulis manual meniru API useLoadMore.
const PER_PAGE = 15
const page     = ref(1)
const lastPage = ref(1)
const total    = ref(0)
const hasMore  = computed(() => page.value < lastPage.value)

let controller = null

const buckets = [
  { key: 'current',      label: 'Belum Jatuh Tempo', color: 'success' },
  { key: 'hari_1_30',    label: '1–30 Hari',         color: 'info' },
  { key: 'hari_31_60',   label: '31–60 Hari',        color: 'warning' },
  { key: 'hari_61_90',   label: '61–90 Hari',        color: 'deep-orange' },
  { key: 'hari_91_plus', label: '>90 Hari',          color: 'error' },
]

const bucketByKey = Object.fromEntries(buckets.map(b => [b.key, b]))

function bucketMeta(key) {
  return bucketByKey[key] ?? { label: key, color: 'default' }
}

const headers = [
  { title: 'No',                key: 'no',            sortable: false, width: '50px' },
  { title: 'Vendor',            key: 'nama_vendor',   sortable: false },
  { title: 'PIC AP',            key: 'pic_ap',        sortable: false },
  { title: 'Belum Jatuh Tempo', key: 'current',       sortable: false, align: 'end' },
  { title: '1–30 Hari',         key: 'hari_1_30',     sortable: false, align: 'end' },
  { title: '31–60 Hari',        key: 'hari_31_60',    sortable: false, align: 'end' },
  { title: '61–90 Hari',        key: 'hari_61_90',    sortable: false, align: 'end' },
  { title: '>90 Hari',          key: 'hari_91_plus',  sortable: false, align: 'end' },
  { title: 'Total',             key: 'total',         sortable: false, align: 'end' },
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

function buildParams() {
  const params = {}
  if (draft.as_of_date)   params.as_of_date   = draft.as_of_date
  if (draft.vendor_ap_id) params.vendor_ap_id = draft.vendor_ap_id

  return params
}

function onRowClick(_event, { item } = {}) {
  const key = item?.vendor_id
  if (key == null) return

  expanded.value = expanded.value.includes(key)
    ? expanded.value.filter(v => v !== key)
    : [...expanded.value, key]
}

async function fetchReport({ append = false } = {}) {
  controller?.abort()

  const ctrl = new AbortController()

  controller = ctrl

  const nextPage = append ? page.value + 1 : 1

  if (append) loadingMore.value = true
  else loading.value = true

  try {
    const params   = { ...buildParams(), page: nextPage, per_page: PER_PAGE }
    const { data } = await api.get('/ap/laporan/aging', { params, signal: ctrl.signal })
    const payload  = data.data ?? {}
    const newRows  = payload.rows ?? []

    if (append) {
      const existingKeys = new Set(rows.value.map(r => r.vendor_id))

      rows.value = [...rows.value, ...newRows.filter(r => !existingKeys.has(r.vendor_id))]
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
  return fetchReport({ append: false })
}

function loadMore() {
  if (!hasMore.value || loading.value || loadingMore.value) return

  return fetchReport({ append: true })
}

function abort() {
  controller?.abort()
  controller = null
}

async function doExport() {
  exporting.value = true
  try {
    const response = await api.get('/ap/laporan/aging/export-excel', {
      params: buildParams(),
      responseType: 'blob',
    })

    const url  = URL.createObjectURL(new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }))

    const link = document.createElement('a')

    link.href     = url
    link.download = `aging-hutang-${asOfDate.value ?? draft.as_of_date}.xlsx`
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
