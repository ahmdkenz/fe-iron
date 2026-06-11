<template>
  <div>
    <PageHeader
      title="Rekening Koran"
      subtitle="Jurnal umum transaksi bank dari seluruh PIC AR"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Laporan', to: { name: 'finance-laporan' } },
        { title: 'Rekening Koran', disabled: true },
      ]"
    >
      <VBtn variant="text" prepend-icon="ri-arrow-left-line" :to="{ name: 'finance-laporan' }">Kembali</VBtn>
    </PageHeader>

    <!-- Filter -->
    <VCard class="mb-4">
      <VCardText class="pa-4">
        <div class="d-flex flex-wrap gap-3 align-center mb-3">
          <VAutocomplete
            v-model="filters.pic_ar_id"
            placeholder="Semua PIC AR"
            clearable
            hide-details
            density="compact"
            style="max-width: 230px"
            :items="picArList"
            item-title="name"
            item-value="id"
            :loading="picArLoading"
            @focus="ensurePicArLoaded()"
            @update:model-value="doFetch"
          />
          <VSelect
            v-model="filters.bank_type"
            placeholder="Semua Bank"
            clearable
            hide-details
            density="compact"
            style="max-width: 160px"
            :items="bankTypeOptions"
            @update:model-value="doFetch"
          />
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
        </div>
        <div class="d-flex flex-wrap gap-5 align-center">
          <div class="d-flex align-center gap-2">
            <span class="text-caption text-medium-emphasis font-weight-medium">D/K</span>
            <VBtnToggle
              v-model="filters.dk"
              rounded="lg"
              color="primary"
              @update:model-value="doFetch"
            >
              <VBtn value="" size="small" min-width="72">Semua</VBtn>
              <VBtn value="K" size="small" min-width="72">Kredit</VBtn>
              <VBtn value="D" size="small" min-width="72">Debit</VBtn>
            </VBtnToggle>
          </div>
          <div class="d-flex align-center gap-2">
            <span class="text-caption text-medium-emphasis font-weight-medium">Status</span>
            <VBtnToggle
              v-model="filters.status_posting_2"
              rounded="lg"
              color="success"
              @update:model-value="doFetch"
            >
              <VBtn value="" size="small" min-width="72">Semua</VBtn>
              <VBtn value="POSTED" size="small" min-width="80">Posted</VBtn>
              <VBtn value="PENDING" size="small" min-width="80">Pending</VBtn>
            </VBtnToggle>
          </div>
        </div>
      </VCardText>
    </VCard>

    <!-- Summary Cards -->
    <VRow class="mb-4">
      <VCol cols="12" sm="6" md="3">
        <VCard class="stat-card">
          <VCardText class="pa-4">
            <div class="d-flex align-center justify-space-between mb-3">
              <span class="text-overline text-medium-emphasis font-weight-bold">Total Matched</span>
              <VAvatar color="secondary" size="40" rounded="lg">
                <VIcon icon="ri-check-double-line" size="20" class="text-white" />
              </VAvatar>
            </div>
            <div class="text-h5 font-weight-bold mb-1">
              {{ summary.total_matched.toLocaleString('id-ID') }}
            </div>
            <div class="stat-bar" style="background: rgb(var(--v-theme-secondary));" />
          </VCardText>
        </VCard>
      </VCol>

      <VCol cols="12" sm="6" md="3">
        <VCard class="stat-card">
          <VCardText class="pa-4">
            <div class="d-flex align-center justify-space-between mb-3">
              <span class="text-overline text-medium-emphasis font-weight-bold">Total Posted</span>
              <VAvatar color="success" size="40" rounded="lg">
                <VIcon icon="ri-checkbox-circle-line" size="20" class="text-white" />
              </VAvatar>
            </div>
            <div class="text-h5 font-weight-bold text-success mb-1">
              {{ summary.total_posted.toLocaleString('id-ID') }}
            </div>
            <div class="stat-bar" style="background: rgb(var(--v-theme-success));" />
          </VCardText>
        </VCard>
      </VCol>

      <VCol cols="12" sm="6" md="3">
        <VCard class="stat-card">
          <VCardText class="pa-4">
            <div class="d-flex align-center justify-space-between mb-3">
              <span class="text-overline text-medium-emphasis font-weight-bold">Total Pending</span>
              <VAvatar color="warning" size="40" rounded="lg">
                <VIcon icon="ri-time-line" size="20" class="text-white" />
              </VAvatar>
            </div>
            <div class="text-h5 font-weight-bold text-warning mb-1">
              {{ summary.total_pending.toLocaleString('id-ID') }}
            </div>
            <div class="stat-bar" style="background: rgb(var(--v-theme-warning));" />
          </VCardText>
        </VCard>
      </VCol>

      <VCol cols="12" sm="6" md="3">
        <VCard class="stat-card">
          <VCardText class="pa-4">
            <div class="d-flex align-center justify-space-between mb-3">
              <span class="text-overline text-medium-emphasis font-weight-bold">Total Mutasi Masuk</span>
              <VAvatar color="primary" size="40" rounded="lg">
                <VIcon icon="ri-money-cny-circle-line" size="20" class="text-white" />
              </VAvatar>
            </div>
            <div class="text-h5 font-weight-bold text-primary mb-1">
              {{ formatCurrency(summary.total_mutasi_masuk) }}
            </div>
            <div class="stat-bar" style="background: rgb(var(--v-theme-primary));" />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Tabel -->
    <VCard>
      <VCardText class="pb-0">
        <div class="text-caption text-medium-emphasis">
          {{ summary.total_matched }} transaksi matched
          <span v-if="filters.bank_type"> &middot; {{ filters.bank_type }}</span>
          <span v-if="filters.periode_awal || filters.periode_akhir">
            &middot; Periode:
            <strong>{{ filters.periode_awal || '-' }}</strong>
            s/d
            <strong>{{ filters.periode_akhir || '-' }}</strong>
          </span>
        </div>
      </VCardText>
      <VDivider class="mt-2" />
      <VProgressLinear v-if="loading" indeterminate color="primary" />
      <BaseTable
        :headers="headers"
        :items="rows"
        :total="meta.total"
        :loading="loading"
        :per-page="meta.per_page"
        :page="meta.current_page"
        @update:options="onTableOptions"
      >
        <template #item.no="{ index }">
          {{ (meta.current_page - 1) * meta.per_page + index + 1 }}
        </template>
        <template #item.bank_type="{ item }">
          <VChip
            :color="bankColor(item.bank_type)"
            size="x-small"
            variant="tonal"
            label
          >
            {{ item.bank_type ?? '-' }}
          </VChip>
        </template>
        <template #item.dk="{ item }">
          <VChip
            :color="item.dk === 'K' ? 'success' : 'warning'"
            size="x-small"
            variant="tonal"
            label
          >
            {{ item.dk }}
          </VChip>
        </template>
        <template #item.mutasi="{ item }">
          <span
            class="font-weight-medium"
            :class="item.dk === 'K' ? 'text-success' : 'text-warning'"
          >
            {{ formatCurrency(item.mutasi) }}
          </span>
        </template>
        <template #item.saldo="{ item }">
          <span class="font-weight-bold">{{ formatCurrency(item.saldo) }}</span>
        </template>
        <template #item.status_posting_1="{ item }">
          <span :class="statusRekonClass(item.status_posting_1)" class="text-caption font-weight-bold">
            {{ item.status_posting_1 ?? '-' }}
          </span>
        </template>
        <template #item.selisih="{ item }">
          <span v-if="item.selisih > 0" class="text-info font-weight-medium">
            +{{ formatCurrency(item.selisih) }}
          </span>
          <span v-else-if="item.selisih < 0" class="text-error font-weight-medium">
            -{{ formatCurrency(Math.abs(item.selisih)) }}
          </span>
          <span v-else class="text-disabled">-</span>
        </template>
        <template #item.waktu_transaksi="{ item }">
          <span class="text-mono text-caption">{{ item.waktu_transaksi ?? '-' }}</span>
        </template>
        <template #item.keterangan="{ item }">
          <span v-if="item.keterangan" class="text-caption">{{ item.keterangan }}</span>
          <span v-else class="text-disabled">-</span>
        </template>
        <template #item.status_posting_2="{ item }">
          <VChip
            v-if="item.status_posting_2 === 'POSTED'"
            color="success"
            size="x-small"
            variant="tonal"
            label
          >
            {{ item.posted_by ?? item.pic_ar ?? '-' }} Sudah Posting
          </VChip>
          <VChip
            v-else
            color="secondary"
            size="x-small"
            variant="tonal"
            label
          >
            {{ item.pic_ar ?? '-' }} Belum Posting
          </VChip>
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

const { formatCurrency } = useFormatter()

// PIC AR list
const picArList    = ref([])
const picArLoading = ref(false)
async function fetchPicAr() {
  picArLoading.value = true
  try {
    const { data } = await api.get('/finance/rekening-koran/pic-ar-list')
    picArList.value = data.data
  } finally {
    picArLoading.value = false
  }
}
const { ensureLoaded: ensurePicArLoaded } = useLazyFetchAll(fetchPicAr)

const loading = ref(false)
const rows    = ref([])
const summary = reactive({
  total_matched:      0,
  total_posted:       0,
  total_pending:      0,
  total_mutasi_masuk: 0,
})
const meta = reactive({
  current_page: 1,
  last_page:    1,
  per_page:     25,
  total:        0,
})

const now      = new Date()
const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
const lastDay  = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

const filters = reactive({
  pic_ar_id:        null,
  bank_type:        null,
  periode_awal:     firstDay,
  periode_akhir:    lastDay,
  dk:               '',
  status_posting_1: '',
  status_posting_2: '',
})

const bankTypeOptions = ['BCA', 'MANDIRI', 'CIMB', 'BSI']

const headers = [
  { title: 'No',               key: 'no',               sortable: false, width: '50px' },
  { title: 'TRXID',            key: 'no_referensi',     sortable: false },
  { title: 'TGL',              key: 'tanggal',          sortable: false, width: '130px' },
  { title: 'TRX TIME',         key: 'waktu_transaksi',  sortable: false, width: '100px' },
  { title: 'D/K',              key: 'dk',               sortable: false, width: '60px' },
  { title: 'MUTASI',           key: 'mutasi',           sortable: false, align: 'end' },
  { title: 'SALDO',            key: 'saldo',            sortable: false, align: 'end' },
  { title: 'DESKRIPSI',        key: 'keterangan',       sortable: false, minWidth: '220px' },
  { title: 'KETERANGAN BANK',  key: 'bank_type',        sortable: false, width:    '110px' },
  { title: 'STATUS POSTING 1', key: 'status_posting_1', sortable: false, width: '140px' },
  { title: 'DB',               key: 'no_dokumen_ar',    sortable: false },
  { title: 'SELISIH',          key: 'selisih',          sortable: false, align: 'end' },
  { title: 'STATUS POSTING 2', key: 'status_posting_2', sortable: false, width: '140px' },
]

function buildParams(page = meta.current_page, perPage = meta.per_page) {
  const params = { page, per_page: perPage }
  if (filters.pic_ar_id)        params.pic_ar_id        = filters.pic_ar_id
  if (filters.bank_type)        params.bank_type        = filters.bank_type
  if (filters.periode_awal)     params.periode_awal     = filters.periode_awal
  if (filters.periode_akhir)    params.periode_akhir    = filters.periode_akhir
  if (filters.dk)               params.dk               = filters.dk
  if (filters.status_posting_1) params.status_posting_1 = filters.status_posting_1
  if (filters.status_posting_2) params.status_posting_2 = filters.status_posting_2
  return params
}

async function doFetch(resetPage = true) {
  if (resetPage) meta.current_page = 1
  loading.value = true
  try {
    const { data } = await api.get('/finance/rekening-koran', { params: buildParams() })
    const result = data.data
    rows.value = result.rows
    Object.assign(summary, {
      total_matched:      result.total_matched,
      total_posted:       result.total_posted,
      total_pending:      result.total_pending,
      total_mutasi_masuk: result.total_mutasi_masuk,
    })
    Object.assign(meta, result.meta)
  } finally {
    loading.value = false
  }
}

function onTableOptions({ page, itemsPerPage }) {
  meta.current_page = page
  meta.per_page     = itemsPerPage
  doFetch(false)
}

function bankColor(type) {
  const map = { BCA: 'info', MANDIRI: 'warning', CIMB: 'error', BSI: 'success' }
  return map[type] ?? 'default'
}

function statusRekonColor(status) {
  if (status === 'MATCHED')   return 'success'
  if (status === 'UNMATCHED') return 'warning'
  if (status === 'DIABAIKAN') return 'default'
  return 'default'
}

function statusRekonClass(status) {
  if (status === 'MATCHED')   return 'text-success'
  if (status === 'UNMATCHED') return 'text-error'
  if (status === 'DIABAIKAN') return 'text-medium-emphasis'
  return 'text-disabled'
}

onMounted(doFetch)
</script>

<style scoped>
.stat-card {
  transition: box-shadow 0.2s;
}
.stat-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12) !important;
}
.stat-bar {
  height: 3px;
  border-radius: 2px;
  opacity: 0.6;
}
</style>
