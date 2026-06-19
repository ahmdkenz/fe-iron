<template>
  <div>
    <PageHeader
      title="Riwayat Pembayaran"
      subtitle="Daftar semua pembayaran AR"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Laporan', to: { name: 'finance-laporan' } },
        { title: 'Riwayat Pembayaran', disabled: true },
      ]"
    >
      <VBtn variant="text" prepend-icon="ri-arrow-left-line" :to="{ name: 'finance-laporan' }">Kembali</VBtn>
    </PageHeader>

    <!-- Summary Card -->
    <VCard class="mb-4">
      <VCardText class="d-flex flex-wrap gap-3 align-center">
        <!-- Filter -->
        <VBtnToggle
          v-model="segment"
          variant="outlined"
          mandatory
          divided
          density="compact"
          @update:model-value="onSegmentChange"
        >
          <VBtn value="ALL" size="small" style="min-width: 80px">Semua</VBtn>
          <VBtn value="B2C" size="small" style="min-width: 70px">B2C</VBtn>
          <VBtn value="B2B" size="small" style="min-width: 70px">B2B</VBtn>
        </VBtnToggle>
        <VAutocomplete
          v-model="params.klien_ar_id"
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

        <div class="text-body-2 text-medium-emphasis">
          Total:
          <strong class="text-success text-body-1 ms-1">{{ formatCurrency(meta.total_jumlah ?? 0) }}</strong>
        </div>
      </VCardText>
    </VCard>

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
        <template #item.no_invoice="{ item }">
          <RouterLink
            :to="{ name: 'finance-invoice-show', params: { id: item.invoice_id } }"
            class="text-primary text-decoration-none"
          >
            {{ item.no_invoice }}
          </RouterLink>
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
        <template #item.jenis="{ item }">
          <VChip v-if="item.jenis === 'ALO'" size="x-small" color="info" label>ALO</VChip>
          <VChip v-else-if="item.jenis === 'PDM'" size="x-small" color="secondary" label>PDM</VChip>
          <span v-else class="text-caption text-medium-emphasis">—</span>
        </template>
      </BaseTable>
    </VCard>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useCrud } from '@/composables/useCrud'
import { useLazyFetchAll } from '@/composables/useLazyFetchAll'
import { useFormatter } from '@/composables/useFormatter'

const authStore = useAuthStore()
const { formatCurrency, formatDate } = useFormatter()
const { items, loading, meta, params, fetchList } = useCrud('/finance/pembayaran')
const { items: klienList, loading: klienLoading, fetchAll: fetchKlien } = useCrud('/finance/klien-ar')
const { ensureLoaded: ensureKlienLoaded } = useLazyFetchAll(fetchKlien)

const segment = ref('ALL')

params.klien_ar_id       = null
params.metode_pembayaran = null
params.tanggal_dari      = null
params.tanggal_sampai    = null
params.karyawan_id       = null
params.segment           = null

const headers = [
  { title: 'No',          key: 'no',                sortable: false, width: '50px' },
  { title: 'Tanggal',     key: 'tanggal_pembayaran', sortable: false },
  { title: 'No Invoice',  key: 'no_invoice',         sortable: false },
  { title: 'Klien',       key: 'klien',              sortable: false },
  { title: 'Jumlah',      key: 'jumlah_pembayaran',  sortable: false },
  { title: 'Metode',      key: 'metode_pembayaran',  sortable: false },
  { title: 'No Referensi',key: 'no_referensi',       sortable: false },
  { title: 'Jenis',       key: 'jenis',              sortable: false },
  { title: 'Dicatat oleh',key: 'created_by_name',   sortable: false },
]

const metodeOptions = [
  { label: 'Transfer', value: 'TRANSFER' },
  { label: 'Cash',     value: 'CASH' },
  { label: 'Giro',     value: 'GIRO' },
]

function metodeColor(metode) {
  return { TRANSFER: 'info', CASH: 'success', GIRO: 'warning' }[metode] ?? 'default'
}

function onSegmentChange(val) {
  params.segment = val !== 'ALL' ? val : null
  doFetch()
}

let controller = null

function doFetch() {
  params.page = 1
  controller?.abort()
  controller = new AbortController()
  fetchList({}, { signal: controller.signal }).finally(() => { controller = null })
}

function onTableOptions({ page, itemsPerPage }) {
  params.page     = page
  params.per_page = itemsPerPage
  fetchList()
}

onMounted(() => {
  const isPrivileged = authStore.isAdmin || authStore.isManager || authStore.isSupervisor
  if (!isPrivileged && authStore.user?.karyawan_id) {
    params.karyawan_id = authStore.user.karyawan_id
  }
  doFetch()
})
onBeforeUnmount(() => controller?.abort())
</script>
