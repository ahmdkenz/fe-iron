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
          v-model="filters.periode_awal"
          label="Dari Tanggal"
          type="date"
          density="compact"
          hide-details
          style="max-width: 180px"
          @update:model-value="doFetch"
        />
        <VTextField
          v-model="filters.periode_akhir"
          label="Sampai Tanggal"
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
        <VSpacer />
        <VBtn
          color="primary"
          prepend-icon="ri-download-2-line"
          size="small"
          :loading="exporting"
          @click="doExport"
        >
          Export
        </VBtn>
      </VCardText>
    </VCard>

    <!-- Summary Cards -->
    <VRow class="mb-4">
      <VCol cols="12" sm="6" md="3">
        <VCard>
          <VCardText>
            <div class="d-flex align-center gap-3">
              <VAvatar color="secondary" variant="tonal" size="44">
                <VIcon icon="ri-wallet-3-line" />
              </VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">Saldo Awal</div>
                <div class="text-h6 font-weight-bold">{{ formatCurrency(report.summary?.saldo_awal ?? 0) }}</div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard>
          <VCardText>
            <div class="d-flex align-center gap-3">
              <VAvatar color="warning" variant="tonal" size="44">
                <VIcon icon="ri-bill-line" />
              </VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">Invoice Masuk</div>
                <div class="text-h6 font-weight-bold">{{ formatCurrency(report.summary?.invoice_masuk ?? 0) }}</div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard>
          <VCardText>
            <div class="d-flex align-center gap-3">
              <VAvatar color="success" variant="tonal" size="44">
                <VIcon icon="ri-money-cny-circle-line" />
              </VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">Pembayaran</div>
                <div class="text-h6 font-weight-bold">{{ formatCurrency(report.summary?.pembayaran ?? 0) }}</div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard>
          <VCardText>
            <div class="d-flex align-center gap-3">
              <VAvatar color="error" variant="tonal" size="44">
                <VIcon icon="ri-error-warning-line" />
              </VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">Saldo Akhir</div>
                <div class="text-h6 font-weight-bold">{{ formatCurrency(report.summary?.saldo_akhir ?? 0) }}</div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Tabel -->
    <VCard>
      <VCardText class="pb-0">
        <div class="text-caption text-medium-emphasis">
          Periode: <strong>{{ report.periode_awal ?? '-' }}</strong>
          s/d <strong>{{ report.periode_akhir ?? '-' }}</strong>
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
        <template #item.saldo_awal="{ item }">
          {{ formatCurrency(item.saldo_awal) }}
        </template>
        <template #item.invoice_masuk="{ item }">
          <span class="text-warning font-weight-medium">
            {{ item.invoice_masuk > 0 ? formatCurrency(item.invoice_masuk) : '-' }}
          </span>
        </template>
        <template #item.pembayaran="{ item }">
          <span class="text-success font-weight-medium">
            {{ item.pembayaran > 0 ? formatCurrency(item.pembayaran) : '-' }}
          </span>
        </template>
        <template #item.saldo_akhir="{ item }">
          <span class="font-weight-bold" :class="item.saldo_akhir > 0 ? 'text-error' : 'text-success'">
            {{ formatCurrency(item.saldo_akhir) }}
          </span>
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
import { useAuthStore } from '@/stores/auth.store'
import api from '@/utils/axios'

const { formatCurrency } = useFormatter()
const authStore = useAuthStore()
const { items: klienList, loading: klienLoading, fetchAll: fetchKlien } = useCrud('/finance/klien-ar')
const { ensureLoaded: ensureKlienLoaded } = useLazyFetchAll(fetchKlien)

const loading  = ref(false)
const exporting = ref(false)
const report   = reactive({ periode_awal: null, periode_akhir: null, summary: null, rows: [] })
const segment  = ref('ALL')

const now      = new Date()
const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
const lastDay  = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

const filters = reactive({
  periode_awal:  firstDay,
  periode_akhir: lastDay,
  klien_ar_id:   null,
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
  { title: 'No',           key: 'no',            sortable: false, width: '50px' },
  { title: 'Klien',        key: 'nama_klien',    sortable: false },
  { title: 'Saldo Awal',   key: 'saldo_awal',    sortable: false, align: 'end' },
  { title: 'Invoice Masuk',key: 'invoice_masuk', sortable: false, align: 'end' },
  { title: 'Pembayaran',   key: 'pembayaran',    sortable: false, align: 'end' },
  { title: 'Saldo Akhir',  key: 'saldo_akhir',   sortable: false, align: 'end' },
]

function buildParams() {
  const p = {}
  if (filters.periode_awal)    p.periode_awal  = filters.periode_awal
  if (filters.periode_akhir)   p.periode_akhir = filters.periode_akhir
  if (filters.klien_ar_id)     p.klien_ar_id   = filters.klien_ar_id
  if (segment.value !== 'ALL') p.segment       = segment.value
  return p
}

async function doFetch() {
  page.value    = 1
  loading.value = true
  try {
    const { data } = await api.get('/finance/mutasi-piutang', { params: buildParams() })
    Object.assign(report, data.data)
  } finally {
    loading.value = false
  }
}

async function doExport() {
  exporting.value = true
  try {
    const response = await api.get('/finance/mutasi-piutang/export-excel', {
      params:       buildParams(),
      responseType: 'blob',
    })
    const url  = URL.createObjectURL(new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }))
    const link    = document.createElement('a')
    link.href     = url
    link.download = `MUTASI PIUTANG - ${authStore.user?.karyawan?.nama_karyawan ?? 'SEMUA'} - ${buildTimestamp()}.xlsx`
    link.click()
    URL.revokeObjectURL(url)
  } finally {
    exporting.value = false
  }
}

function buildTimestamp() {
  const n = new Date()
  return (
    String(n.getDate()).padStart(2, '0') +
    String(n.getMonth() + 1).padStart(2, '0') +
    String(n.getFullYear()) +
    String(n.getHours()).padStart(2, '0') +
    String(n.getMinutes()).padStart(2, '0') +
    String(n.getSeconds()).padStart(2, '0')
  )
}

onMounted(doFetch)
</script>
