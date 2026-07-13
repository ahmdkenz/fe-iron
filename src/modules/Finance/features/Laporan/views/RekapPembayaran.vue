<template>
  <div>
    <PageHeader
      title="Rekap Pembayaran"
      subtitle="Rekap pembayaran AR per transaksi"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Laporan', to: { name: 'finance-laporan' } },
        { title: 'Rekap Pembayaran', disabled: true },
      ]"
    >
      <VBtn variant="text" prepend-icon="ri-arrow-left-line" :to="{ name: 'finance-laporan' }">Kembali</VBtn>
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
          @update:model-value="debouncedFetch"
        />
        <VTextField
          v-model="filters.tanggal_sampai"
          label="Sampai Tanggal"
          type="date"
          density="compact"
          hide-details
          style="max-width: 180px"
          @update:model-value="debouncedFetch"
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
          item-title="display_label"
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
          Periode: <strong>{{ formatDate(report.tanggal_dari) ?? '-' }}</strong>
          s/d <strong>{{ formatDate(report.tanggal_sampai) ?? '-' }}</strong>
          &nbsp;·&nbsp; {{ report.summary?.jumlah_transaksi ?? 0 }} transaksi
        </div>
      </VCardText>
      <VDivider class="mt-2" />
      <VProgressLinear v-if="loading" indeterminate color="primary" />
      <BaseTable
        :headers="headers"
        :items="report.rows"
        :total="report.meta?.total ?? 0"
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
import { onMounted, reactive, ref } from 'vue'
import { useCrud } from '@/composables/useCrud'
import { useLazyFetchAll } from '@/composables/useLazyFetchAll'
import { useFormatter } from '@/composables/useFormatter'
import api from '@/utils/axios'

const { formatCurrency, formatDate } = useFormatter()
const { items: klienList, loading: klienLoading, fetchAll: fetchKlien } = useCrud('/finance/klien-ar')
const { ensureLoaded: ensureKlienLoaded } = useLazyFetchAll(fetchKlien)

const loading = ref(false)
const report  = reactive({ tanggal_dari: null, tanggal_sampai: null, summary: null, rows: [], meta: null })
const segment = ref('ALL')

const filters = reactive({
  tanggal_dari:      null,
  tanggal_sampai:    null,
  metode_pembayaran: null,
  klien_ar_id:       null,
})

const page    = ref(1)
const perPage = ref(15)

function onTableOptions({ page: p, itemsPerPage }) {
  page.value    = p
  perPage.value = itemsPerPage
  doFetch({ resetPage: false })
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

async function doFetch({ resetPage = true } = {}) {
  if (resetPage) page.value = 1
  loading.value = true
  try {
    const params = { page: page.value, per_page: perPage.value }
    if (filters.tanggal_dari)      params.tanggal_dari      = filters.tanggal_dari
    if (filters.tanggal_sampai)    params.tanggal_sampai    = filters.tanggal_sampai
    if (filters.metode_pembayaran) params.metode_pembayaran = filters.metode_pembayaran
    if (filters.klien_ar_id)       params.klien_ar_id       = filters.klien_ar_id
    if (segment.value !== 'ALL')   params.segment           = segment.value

    const { data } = await api.get('/finance/rekap-pembayaran', { params })
    Object.assign(report, data.data)
  } finally {
    loading.value = false
  }
}

let debounceTimer = null
function debouncedFetch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(doFetch, 400)
}

onMounted(doFetch)
</script>
