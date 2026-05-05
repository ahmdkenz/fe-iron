<template>
  <div>
    <PageHeader
      title="Rekap Pembayaran"
      subtitle="Ringkasan pembayaran per metode dan per tanggal"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Rekap Pembayaran', disabled: true },
      ]"
    />

    <!-- Filter -->
    <VCard class="mb-4">
      <VCardText class="d-flex flex-wrap gap-3">
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
        <template #item.transfer="{ item }">
          <span v-if="item.transfer > 0" class="text-info">{{ formatCurrency(item.transfer) }}</span>
          <span v-else class="text-medium-emphasis">-</span>
        </template>
        <template #item.cash="{ item }">
          <span v-if="item.cash > 0" class="text-success">{{ formatCurrency(item.cash) }}</span>
          <span v-else class="text-medium-emphasis">-</span>
        </template>
        <template #item.giro="{ item }">
          <span v-if="item.giro > 0" class="text-warning">{{ formatCurrency(item.giro) }}</span>
          <span v-else class="text-medium-emphasis">-</span>
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

const { formatCurrency, formatDate } = useFormatter()
const { items: klienList, loading: klienLoading, fetchAll: fetchKlien } = useCrud('/finance/klien-ar')
const { ensureLoaded: ensureKlienLoaded } = useLazyFetchAll(fetchKlien)

const loading = ref(false)
const report  = reactive({ tanggal_dari: null, tanggal_sampai: null, summary: null, rows: [] })

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
  { title: 'No',       key: 'no',       sortable: false, width: '50px' },
  { title: 'Tanggal',  key: 'tanggal',  sortable: false },
  { title: 'Transfer', key: 'transfer', sortable: false, align: 'end' },
  { title: 'Cash',     key: 'cash',     sortable: false, align: 'end' },
  { title: 'Giro',     key: 'giro',     sortable: false, align: 'end' },
  { title: 'Total',    key: 'total',    sortable: false, align: 'end' },
]

const metodeOptions = [
  { label: 'Transfer', value: 'TRANSFER' },
  { label: 'Cash',     value: 'CASH'     },
  { label: 'Giro',     value: 'GIRO'     },
]

async function doFetch() {
  page.value    = 1
  loading.value = true
  try {
    const params = {}
    if (filters.tanggal_dari)      params.tanggal_dari      = filters.tanggal_dari
    if (filters.tanggal_sampai)    params.tanggal_sampai    = filters.tanggal_sampai
    if (filters.metode_pembayaran) params.metode_pembayaran = filters.metode_pembayaran
    if (filters.klien_ar_id)       params.klien_ar_id       = filters.klien_ar_id

    const { data } = await api.get('/finance/rekap-pembayaran', { params })
    Object.assign(report, data.data)
  } finally {
    loading.value = false
  }
}

onMounted(doFetch)
</script>
