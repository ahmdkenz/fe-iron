<template>
  <div>
    <PageHeader
      title="Rekap Piutang per Klien"
      subtitle="Ringkasan outstanding per Client"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Laporan', to: { name: 'finance-laporan' } },
        { title: 'Rekap per Klien', disabled: true },
      ]"
    >
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
      <VCardText class="d-flex flex-wrap gap-3">
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
        <VSelect
          v-model="filters.periode_bulan"
          placeholder="Semua Bulan"
          clearable
          hide-details
          density="compact"
          style="max-width: 160px"
          :items="bulanOptions"
          item-title="label"
          item-value="value"
          @update:model-value="doFetch"
        />
        <VTextField
          v-model="filters.periode_tahun"
          placeholder="Tahun"
          clearable
          hide-details
          density="compact"
          style="max-width: 100px"
          type="number"
          @update:model-value="debouncedFetch"
        />
      </VCardText>
    </VCard>

    <!-- Summary Cards -->
    <VRow class="mb-4">
      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <VCard>
          <VCardText>
            <div class="d-flex align-center gap-3">
              <VAvatar
                color="primary"
                variant="tonal"
                size="44"
              >
                <VIcon icon="ri-building-4-line" />
              </VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">
                  Total Klien
                </div>
                <div class="text-h6 font-weight-bold">
                  {{ report.meta?.total ?? report.summary?.total_klien ?? 0 }}
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <VCard>
          <VCardText>
            <div class="d-flex align-center gap-3">
              <VAvatar
                color="warning"
                variant="tonal"
                size="44"
              >
                <VIcon icon="ri-bill-line" />
              </VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">
                  Total Tagihan
                </div>
                <div class="text-h6 font-weight-bold">
                  {{ formatCurrency(report.summary?.total_tagihan ?? 0) }}
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <VCard>
          <VCardText>
            <div class="d-flex align-center gap-3">
              <VAvatar
                color="success"
                variant="tonal"
                size="44"
              >
                <VIcon icon="ri-money-cny-circle-line" />
              </VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">
                  Total Terbayar
                </div>
                <div class="text-h6 font-weight-bold">
                  {{ formatCurrency(report.summary?.total_pembayaran ?? 0) }}
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <VCard>
          <VCardText>
            <div class="d-flex align-center gap-3">
              <VAvatar
                color="error"
                variant="tonal"
                size="44"
              >
                <VIcon icon="ri-error-warning-line" />
              </VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">
                  Sisa Piutang
                </div>
                <div class="text-h6 font-weight-bold">
                  {{ formatCurrency(report.summary?.total_sisa ?? 0) }}
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Tabel -->
    <VCard>
      <BaseTable
        v-model:expanded="expanded"
        :headers="headers"
        :items="report.rows"
        :total="report.meta?.total ?? 0"
        :loading="loading"
        :per-page="perPage"
        :page="page"
        show-expand
        item-value="klien_id"
        hover
        wrap-text
        @update:options="onTableOptions"
        @click:row="onRowClick"
      >
        <template #item.no="{ index }">
          {{ (page - 1) * perPage + index + 1 }}
        </template>
        <template #item.nama_klien="{ item }">
          <div>
            <div class="font-weight-medium">
              {{ item.nama_klien }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ item.kode_klien }}<template v-if="item.nama_resto">
                · {{ item.nama_resto }}
              </template>
            </div>
          </div>
        </template>
        <template #item.pic_ar="{ item }">
          <div>
            <div>{{ item.pic_ar ?? '-' }}</div>
            <div class="text-caption text-medium-emphasis">
              {{ item.perusahaan ?? '-' }}
            </div>
          </div>
        </template>
        <template #item.total_tagihan="{ item }">
          {{ formatCurrency(item.total_tagihan) }}
        </template>
        <template #item.total_pembayaran="{ item }">
          {{ formatCurrency(item.total_pembayaran) }}
        </template>
        <template #item.sisa_tagihan="{ item }">
          <span :class="item.sisa_tagihan > 0 ? 'text-error font-weight-bold' : 'text-success'">
            {{ formatCurrency(item.sisa_tagihan) }}
          </span>
        </template>
        <template #item.overdue_amount="{ item }">
          <div class="text-end">
            <div :class="item.overdue_amount > 0 ? 'text-error font-weight-medium' : 'text-medium-emphasis'">
              {{ item.overdue_amount > 0 ? formatCurrency(item.overdue_amount) : '-' }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ item.overdue_invoice ?? 0 }} invoice
            </div>
          </div>
        </template>
        <template #item.collection_rate="{ item }">
          <VChip
            :color="collectionColor(item.collection_rate)"
            size="small"
            variant="tonal"
            label
          >
            {{ formatPercent(item.collection_rate) }}
          </VChip>
        </template>
        <template #item.pembayaran_terakhir_tanggal="{ item }">
          <div>
            <div>{{ formatDate(item.pembayaran_terakhir_tanggal) }}</div>
            <div class="text-caption text-medium-emphasis">
              {{ item.pembayaran_terakhir_nominal ? formatCurrency(item.pembayaran_terakhir_nominal) : '-' }}
            </div>
          </div>
        </template>
        <template #item.status_breakdown="{ item }">
          <div class="d-flex gap-1 flex-wrap">
            <VChip
              v-if="item.draft"
              color="default"
              size="x-small"
              label
            >
              D: {{ item.draft }}
            </VChip>
            <VChip
              v-if="item.terkirim"
              color="info"
              size="x-small"
              label
            >
              T: {{ item.terkirim }}
            </VChip>
            <VChip
              v-if="item.sebagian"
              color="warning"
              size="x-small"
              label
            >
              S: {{ item.sebagian }}
            </VChip>
            <VChip
              v-if="item.lunas"
              color="success"
              size="x-small"
              label
            >
              L: {{ item.lunas }}
            </VChip>
          </div>
        </template>
        <template #item.actions="{ item }">
          <VBtn
            icon
            size="small"
            variant="text"
            color="info"
            :to="{ name: 'finance-invoice-index', query: { klien_ar_id: item.klien_id } }"
          >
            <VIcon
              icon="ri-eye-line"
              size="18"
            />
            <VTooltip activator="parent">
              Lihat Invoice
            </VTooltip>
          </VBtn>
        </template>
        <template #expanded-row="{ item, columns }">
          <tr class="rekap-detail-row">
            <td
              :colspan="columns.length"
              class="pa-0"
            >
              <div class="pa-4">
                <VTable
                  density="compact"
                  class="rekap-detail-table"
                >
                  <tbody>
                    <tr>
                      <th>Outstanding</th>
                      <td>{{ item.outstanding_invoice ?? 0 }} invoice</td>
                      <th>Invoice tertua</th>
                      <td>{{ formatDate(item.invoice_tertua_tanggal) }}</td>
                      <th>Jatuh tempo terdekat</th>
                      <td>{{ formatDate(item.jatuh_tempo_terdekat) }}</td>
                    </tr>
                    <tr>
                      <th>Overdue</th>
                      <td>{{ formatCurrency(item.overdue_amount ?? 0) }}</td>
                      <th>Pembayaran terakhir</th>
                      <td>
                        {{ formatDate(item.pembayaran_terakhir_tanggal) }}
                        <span class="text-medium-emphasis">
                          / {{ item.pembayaran_terakhir_nominal ? formatCurrency(item.pembayaran_terakhir_nominal) : '-' }}
                        </span>
                      </td>
                      <th>Referensi bayar</th>
                      <td>{{ item.pembayaran_terakhir_ref ?? '-' }}</td>
                    </tr>
                    <tr>
                      <th>Segment</th>
                      <td>{{ segmentLabel(item.tipe_klien) }}</td>
                      <th>PIC AR</th>
                      <td>{{ item.pic_ar ?? '-' }}</td>
                      <th>Collection rate</th>
                      <td>{{ formatPercent(item.collection_rate) }}</td>
                    </tr>
                  </tbody>
                </VTable>
              </div>
            </td>
          </tr>
        </template>
      </BaseTable>
    </VCard>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useFormatter } from '@/composables/useFormatter'
import api from '@/utils/axios'

const { formatCurrency, formatDate } = useFormatter()

const loading = ref(false)
const report  = reactive({ summary: null, rows: [], meta: null })
const segment = ref('ALL')
const expanded = ref([])

const filters = reactive({ periode_bulan: null, periode_tahun: null })

const page    = ref(1)
const perPage = ref(15)

const headers = [
  { title: 'No',         key: 'no',               sortable: false, width: '50px' },
  { title: 'Klien',      key: 'nama_klien',        sortable: false },
  { title: 'PIC/Entitas', key: 'pic_ar',            sortable: false },
  { title: 'Jml Invoice', key: 'total_invoice',     sortable: false, align: 'center' },
  { title: 'Total Tagihan',   key: 'total_tagihan',   sortable: false },
  { title: 'Total Terbayar',  key: 'total_pembayaran', sortable: false },
  { title: 'Sisa Piutang',    key: 'sisa_tagihan',    sortable: false },
  { title: 'Overdue',         key: 'overdue_amount',  sortable: false, align: 'end' },
  { title: 'Collection',      key: 'collection_rate', sortable: false, align: 'center' },
  { title: 'Bayar Terakhir',  key: 'pembayaran_terakhir_tanggal', sortable: false },
  { title: 'Status',     key: 'status_breakdown',  sortable: false },
  { title: 'Aksi',       key: 'actions',           sortable: false, align: 'center', width: '70px' },
]

const bulanOptions = [
  { label: 'Januari', value: 1 },
  { label: 'Februari', value: 2 },
  { label: 'Maret', value: 3 },
  { label: 'April', value: 4 },
  { label: 'Mei', value: 5 },
  { label: 'Juni', value: 6 },
  { label: 'Juli', value: 7 },
  { label: 'Agustus', value: 8 },
  { label: 'September', value: 9 },
  { label: 'Oktober', value: 10 },
  { label: 'November', value: 11 },
  { label: 'Desember', value: 12 },
]

function onTableOptions({ page: p, itemsPerPage }) {
  page.value    = p
  perPage.value = itemsPerPage
  doFetch({ resetPage: false })
}

let debounceTimer = null

function debouncedFetch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(doFetch, 400)
}

function formatPercent(value) {
  return `${Number(value ?? 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })}%`
}

function collectionColor(value) {
  const n = Number(value ?? 0)
  if (n >= 100) return 'success'
  if (n >= 50) return 'warning'
  
  return 'error'
}

function segmentLabel(value) {
  return value === 'RESTO' ? 'B2C' : value === 'PT' ? 'B2B' : value ?? '-'
}

function onRowClick(_event, { item } = {}) {
  const key = item?.klien_id
  if (key == null) return

  expanded.value = expanded.value.includes(key)
    ? expanded.value.filter(v => v !== key)
    : [...expanded.value, key]
}

async function doFetch({ resetPage = true } = {}) {
  if (resetPage) page.value = 1
  loading.value = true
  try {
    const params = { page: page.value, per_page: perPage.value }
    if (filters.periode_bulan)   params.periode_bulan = filters.periode_bulan
    if (filters.periode_tahun)   params.periode_tahun = filters.periode_tahun
    if (segment.value !== 'ALL') params.segment       = segment.value

    const { data } = await api.get('/finance/invoices/rekap-klien', { params })

    Object.assign(report, data.data)
    expanded.value = []
  } finally {
    loading.value = false
  }
}

onMounted(doFetch)
</script>

<style scoped>
.rekap-detail-row > td {
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.rekap-detail-table :deep(th),
.rekap-detail-table :deep(td) {
  white-space: nowrap;
}
</style>
