<template>
  <div>
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
          <VBtn value="ALL" size="small" style="min-width: 80px">Semua</VBtn>
          <VBtn value="B2C" size="small" style="min-width: 70px">B2C</VBtn>
          <VBtn value="B2B" size="small" style="min-width: 70px">B2B</VBtn>
        </VBtnToggle>
        <VTextField
          v-model="filters.tanggal_dari"
          label="Dari Tanggal"
          type="date"
          density="compact"
          hide-details
          style="max-width: 180px"
          @update:model-value="doFetch"
        />
        <VTextField
          v-model="filters.tanggal_sampai"
          label="Sampai Tanggal"
          type="date"
          density="compact"
          hide-details
          style="max-width: 180px"
          @update:model-value="doFetch"
        />
        <VSelect
          v-model="filters.metode_pembayaran"
          placeholder="Semua Metode"
          clearable
          hide-details
          density="compact"
          style="max-width: 160px"
          :items="metodeOptions"
          item-title="label"
          item-value="value"
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
        <VSpacer />
        <VBtn
          color="success"
          prepend-icon="ri-file-excel-2-line"
          size="small"
          :loading="exporting"
          @click="doExport"
        >
          Excel
        </VBtn>
      </VCardText>
    </VCard>

    <!-- Summary Cards -->
    <VRow class="mb-4">
      <VCol cols="12" sm="6" md="3">
        <VCard>
          <VCardText>
            <div class="d-flex align-center gap-3">
              <VAvatar color="success" variant="tonal" size="44">
                <VIcon icon="ri-money-cny-circle-line" />
              </VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">Total Pembayaran</div>
                <div class="text-h6 font-weight-bold">{{ formatCurrency(report.summary?.total ?? 0) }}</div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard color="info" variant="tonal">
          <VCardText class="pa-3">
            <div class="text-caption font-weight-medium mb-1">Transfer</div>
            <div class="text-subtitle-1 font-weight-bold">{{ formatCurrency(report.summary?.transfer ?? 0) }}</div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard color="success" variant="tonal">
          <VCardText class="pa-3">
            <div class="text-caption font-weight-medium mb-1">Cash</div>
            <div class="text-subtitle-1 font-weight-bold">{{ formatCurrency(report.summary?.cash ?? 0) }}</div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard color="warning" variant="tonal">
          <VCardText class="pa-3">
            <div class="text-caption font-weight-medium mb-1">Giro</div>
            <div class="text-subtitle-1 font-weight-bold">{{ formatCurrency(report.summary?.giro ?? 0) }}</div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Tabel per Tanggal -->
    <VCard>
      <VCardText class="pb-0">
        <div class="text-caption text-medium-emphasis">
          Periode: <strong>{{ report.tanggal_dari ?? '-' }}</strong>
          s/d <strong>{{ report.tanggal_sampai ?? '-' }}</strong>
          &nbsp;·&nbsp; {{ report.summary?.jumlah_transaksi ?? 0 }} transaksi
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
        <template #item.tanggal="{ item }">
          <span class="font-weight-medium">{{ formatDate(item.tanggal) }}</span>
        </template>
        <template #item.invoice="{ item }">
          <span class="text-caption font-weight-medium">{{ item.invoice ?? '-' }}</span>
        </template>
        <template #item.ref_payment="{ item }">
          <span class="text-caption">{{ item.ref_payment ?? '-' }}</span>
        </template>
        <template #item.metode="{ item }">
          <VChip size="x-small" :color="metodeColor(item.metode)" variant="tonal">
            {{ item.metode }}
          </VChip>
        </template>
        <template #item.nominal="{ item }">
          <span class="font-weight-bold">{{ formatCurrency(item.nominal) }}</span>
        </template>
        <template #item.pic_ar="{ item }">
          <span class="text-caption">{{ item.pic_ar || '-' }}</span>
        </template>
        <template #item.is_rekon="{ item }">
          <VIcon v-if="item.is_rekon" icon="ri-checkbox-circle-line" color="success" size="20" />
          <span v-else class="text-medium-emphasis text-caption">-</span>
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

const { formatCurrency, formatDate } = useFormatter()
const { items: klienList, loading: klienLoading, fetchAll: fetchKlien } = useCrud('/finance/klien-ar')
const { ensureLoaded: ensureKlienLoaded } = useLazyFetchAll(fetchKlien)

const loading  = ref(false)
const exporting = ref(false)
const report   = reactive({ tanggal_dari: null, tanggal_sampai: null, summary: null, rows: [] })
const segment  = ref('ALL')

const now      = new Date()
const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
const lastDay  = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

const filters = reactive({
  tanggal_dari:      firstDay,
  tanggal_sampai:    lastDay,
  metode_pembayaran: null,
  klien_ar_id:       null,
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

const headers = [
  { title: 'No',          key: 'no',          sortable: false, width: '50px' },
  { title: 'Tanggal',     key: 'tanggal',     sortable: false },
  { title: 'Client',      key: 'client',      sortable: false },
  { title: 'Invoice',     key: 'invoice',     sortable: false },
  { title: 'Ref Payment', key: 'ref_payment', sortable: false },
  { title: 'Metode',      key: 'metode',      sortable: false },
  { title: 'Nominal',     key: 'nominal',     sortable: false, align: 'end' },
  { title: 'PIC AR',      key: 'pic_ar',      sortable: false },
  { title: 'Rekon',       key: 'is_rekon',    sortable: false, align: 'center' },
]

const metodeOptions = [
  { label: 'Transfer', value: 'TRANSFER' },
  { label: 'Cash',     value: 'CASH'     },
  { label: 'Giro',     value: 'GIRO'     },
]

function metodeColor(metode) {
  return { TRANSFER: 'info', CASH: 'success', GIRO: 'warning' }[metode] ?? 'default'
}

function buildParams() {
  const p = {}
  if (filters.tanggal_dari)      p.tanggal_dari      = filters.tanggal_dari
  if (filters.tanggal_sampai)    p.tanggal_sampai    = filters.tanggal_sampai
  if (filters.metode_pembayaran) p.metode_pembayaran = filters.metode_pembayaran
  if (filters.klien_ar_id)       p.klien_ar_id       = filters.klien_ar_id
  if (segment.value !== 'ALL')   p.segment           = segment.value
  return p
}

async function doFetch() {
  page.value    = 1
  loading.value = true
  try {
    const { data } = await api.get('/finance/rekap-pembayaran', { params: buildParams() })
    Object.assign(report, data.data)
  } finally {
    loading.value = false
  }
}

async function doExport() {
  exporting.value = true
  try {
    const response = await api.get('/finance/rekap-pembayaran/export-excel', {
      params:       buildParams(),
      responseType: 'blob',
    })
    const url  = URL.createObjectURL(new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }))
    const link    = document.createElement('a')
    link.href     = url
    link.download = `rekap-pembayaran-${new Date().toISOString().slice(0, 10)}.xlsx`
    link.click()
    URL.revokeObjectURL(url)
  } finally {
    exporting.value = false
  }
}

onMounted(doFetch)
</script>
