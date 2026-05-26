<template>
  <div>
    <!-- Filter -->
    <VCard class="mb-4">
      <VCardText class="d-flex flex-wrap gap-3 align-center">
        <VTextField
          v-model="params.no_referensi"
          placeholder="Cari No. Referensi..."
          prepend-inner-icon="ri-search-line"
          clearable
          hide-details
          density="compact"
          style="max-width: 240px"
          @update:model-value="doFetch"
        />
        <VAutocomplete
          v-model="params.karyawan_id"
          placeholder="Semua PIC"
          hide-details
          density="compact"
          style="max-width: 220px"
          :items="picItems"
          item-title="nama_karyawan"
          item-value="id"
          :loading="karyawanLoading"
          :clearable="canSeeAll"
          :disabled="!canSeeAll"
          @focus="canSeeAll && ensureKaryawanLoaded()"
          @update:model-value="doFetch"
        />
        <VSelect
          v-model="params.metode_pembayaran"
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
        <VSelect
          v-model="params.status_rekonsiliasi"
          placeholder="Status Rekonsiliasi"
          clearable
          hide-details
          density="compact"
          style="max-width: 200px"
          :items="statusRekonOptions"
          item-title="label"
          item-value="value"
          @update:model-value="doFetch"
        />
        <VTextField
          v-model="params.tanggal_dari"
          label="Dari"
          type="date"
          density="compact"
          hide-details
          style="max-width: 160px"
          @update:model-value="doFetch"
        />
        <VTextField
          v-model="params.tanggal_sampai"
          label="Sampai"
          type="date"
          density="compact"
          hide-details
          style="max-width: 160px"
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
        <VCard color="primary" variant="tonal">
          <VCardText class="pa-3">
            <div class="text-caption font-weight-medium mb-1">Total Transaksi</div>
            <div class="text-subtitle-1 font-weight-bold">{{ summary.total_transaksi }} transaksi</div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard color="success" variant="tonal">
          <VCardText class="pa-3">
            <div class="text-caption font-weight-medium mb-1">Total Nominal</div>
            <div class="text-subtitle-1 font-weight-bold">{{ formatCurrency(summary.total_nominal) }}</div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard color="info" variant="tonal">
          <VCardText class="pa-3">
            <div class="text-caption font-weight-medium mb-1">Sudah Matched</div>
            <div class="text-subtitle-1 font-weight-bold">{{ summary.total_matched }} transaksi</div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard :color="summary.total_belum_cocok > 0 ? 'warning' : 'success'" variant="tonal">
          <VCardText class="pa-3">
            <div class="text-caption font-weight-medium mb-1">Belum Direkonsiliasi</div>
            <div class="text-subtitle-1 font-weight-bold">{{ summary.total_belum_cocok }} transaksi</div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Tabel -->
    <VCard>
      <BaseTable
        :headers="headers"
        :items="items"
        :total="meta.total"
        :loading="loading"
        :per-page="meta.per_page"
        :page="meta.current_page"
        @update:options="onTableOptions"
      >
        <template #item.no="{ index }">
          {{ (meta.current_page - 1) * meta.per_page + index + 1 }}
        </template>
        <template #item.no_referensi="{ item }">
          <span v-if="item.no_referensi" class="font-weight-medium text-mono">
            {{ item.no_referensi }}
          </span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>
        <template #item.pic_nama="{ item }">
          <div class="font-weight-medium">{{ item.pic_nama ?? '—' }}</div>
        </template>
        <template #item.no_invoice="{ item }">
          <RouterLink
            :to="{ name: 'finance-invoice-show', params: { id: item.invoice_id } }"
            class="text-primary text-decoration-none font-weight-medium"
          >
            {{ item.no_invoice }}
          </RouterLink>
          <div class="text-caption text-medium-emphasis">{{ item.klien }}</div>
        </template>
        <template #item.tanggal_pembayaran="{ item }">
          {{ formatDate(item.tanggal_pembayaran) }}
        </template>
        <template #item.jumlah_pembayaran="{ item }">
          <span class="text-success font-weight-medium">
            {{ formatCurrency(item.jumlah_pembayaran) }}
          </span>
        </template>
        <template #item.metode_pembayaran="{ item }">
          <VChip :color="metodeColor(item.metode_pembayaran)" size="small" variant="tonal" label>
            {{ item.metode_pembayaran }}
          </VChip>
        </template>
        <template #item.status_rekonsiliasi="{ item }">
          <VChip
            v-if="item.status_rekonsiliasi"
            :color="statusRekonColor(item.status_rekonsiliasi)"
            size="small"
            variant="tonal"
            label
          >
            {{ item.status_rekonsiliasi }}
          </VChip>
          <VChip v-else size="small" variant="tonal" color="default" label>
            Belum Diproses
          </VChip>
        </template>
      </BaseTable>
    </VCard>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useCrud } from '@/composables/useCrud'
import { useLazyFetchAll } from '@/composables/useLazyFetchAll'
import { useFormatter } from '@/composables/useFormatter'
import api from '@/utils/axios'

const authStore = useAuthStore()
const route     = useRoute()
const { formatCurrency, formatDate } = useFormatter()

const canSeeAll = computed(() =>
  authStore.isAdmin || authStore.isDirector || authStore.isManager || authStore.isSupervisor
)

const { items: karyawanList, loading: karyawanLoading, fetchAll: fetchKaryawan } = useCrud('/master/karyawan')
const { ensureLoaded: ensureKaryawanLoaded } = useLazyFetchAll(fetchKaryawan)

const picItems = computed(() => {
  if (!canSeeAll.value && authStore.user?.karyawan) {
    return [authStore.user.karyawan]
  }
  return karyawanList.value
})

const items    = ref([])
const loading  = ref(false)
const exporting = ref(false)
const meta     = reactive({ current_page: 1, last_page: 1, per_page: 20, total: 0 })
const summary  = reactive({ total_transaksi: 0, total_nominal: 0, total_matched: 0, total_belum_cocok: 0 })

const params = reactive({
  page:                 1,
  per_page:             20,
  no_referensi:         null,
  karyawan_id:          null,
  metode_pembayaran:    null,
  tanggal_dari:         null,
  tanggal_sampai:       null,
  status_rekonsiliasi:  null,
})

function buildParams(includePagination = true) {
  const p = {}
  if (includePagination) {
    p.page     = params.page
    p.per_page = params.per_page
  }
  if (params.no_referensi)        p.no_referensi        = params.no_referensi
  if (params.karyawan_id)         p.karyawan_id         = params.karyawan_id
  if (params.metode_pembayaran)   p.metode_pembayaran   = params.metode_pembayaran
  if (params.tanggal_dari)        p.tanggal_dari        = params.tanggal_dari
  if (params.tanggal_sampai)      p.tanggal_sampai      = params.tanggal_sampai
  if (params.status_rekonsiliasi) p.status_rekonsiliasi = params.status_rekonsiliasi
  return p
}

const headers = [
  { title: 'No',                  key: 'no',                  sortable: false, width: '50px' },
  { title: 'No. Referensi',       key: 'no_referensi',        sortable: false },
  { title: 'PIC / Diinput oleh',  key: 'pic_nama',            sortable: false },
  { title: 'No Invoice / Klien',  key: 'no_invoice',          sortable: false },
  { title: 'Tgl Bayar',           key: 'tanggal_pembayaran',  sortable: false },
  { title: 'Jumlah',              key: 'jumlah_pembayaran',   sortable: false },
  { title: 'Metode',              key: 'metode_pembayaran',   sortable: false },
  { title: 'Status Rekonsiliasi', key: 'status_rekonsiliasi', sortable: false },
]

const metodeOptions = [
  { label: 'Transfer', value: 'TRANSFER' },
  { label: 'Cash',     value: 'CASH' },
  { label: 'Giro',     value: 'GIRO' },
]

const statusRekonOptions = [
  { label: 'Matched',   value: 'MATCHED' },
  { label: 'Possible',  value: 'POSSIBLE' },
  { label: 'Unmatched', value: 'UNMATCHED' },
  { label: 'Diabaikan', value: 'DIABAIKAN' },
]

function metodeColor(metode) {
  return { TRANSFER: 'info', CASH: 'success', GIRO: 'warning' }[metode] ?? 'default'
}

function statusRekonColor(status) {
  return { MATCHED: 'success', POSSIBLE: 'warning', UNMATCHED: 'error', DIABAIKAN: 'secondary' }[status] ?? 'default'
}

let controller = null

async function fetchData(resetPage = false) {
  if (resetPage) params.page = 1
  controller?.abort()
  controller    = new AbortController()
  loading.value = true
  try {
    const { data } = await api.get('/finance/jurnal-pic', {
      params: buildParams(true),
      signal: controller.signal,
    })
    items.value = data.data
    if (data.meta)    Object.assign(meta, data.meta)
    if (data.summary) Object.assign(summary, data.summary)
  } catch (err) {
    if (err.code !== 'ERR_CANCELED') console.error(err)
  } finally {
    loading.value = false
    controller    = null
  }
}

function doFetch() { fetchData(true) }

function onTableOptions({ page, itemsPerPage }) {
  params.page     = page
  params.per_page = itemsPerPage
  fetchData(false)
}

async function doExport() {
  exporting.value = true
  try {
    const response = await api.get('/finance/jurnal-pic/export-excel', {
      params:       buildParams(false),
      responseType: 'blob',
    })
    const url  = URL.createObjectURL(new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }))
    const link      = document.createElement('a')
    link.href       = url
    link.download   = `jurnal-pic-ar-${new Date().toISOString().slice(0, 10)}.xlsx`
    link.click()
    URL.revokeObjectURL(url)
  } finally {
    exporting.value = false
  }
}

onMounted(() => {
  if (!canSeeAll.value && authStore.user?.karyawan_id) {
    params.karyawan_id = authStore.user.karyawan_id
  }
  // Support drill-down from KinerjaAr: pre-fill karyawan filter from query param
  if (canSeeAll.value && route.query.karyawan_id) {
    params.karyawan_id = Number(route.query.karyawan_id)
  }
  doFetch()
})
onBeforeUnmount(() => controller?.abort())
</script>
