<template>
  <div>
    <PageHeader
      title="Jurnal Aktivitas per PIC"
      subtitle="Penelusuran pembayaran berdasarkan PIC dan nomor referensi"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Jurnal per PIC', disabled: true },
      ]"
    />

    <!-- Filter -->
    <VCard class="mb-4">
      <VCardText class="d-flex flex-wrap gap-3 align-center">
        <!-- Cari nomor referensi -->
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

        <!-- Filter PIC -->
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

        <!-- Filter Metode -->
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

        <!-- Filter Status Rekonsiliasi -->
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

        <!-- Periode -->
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

        <template #item.no_referensi="{ item }">
          <span v-if="item.no_referensi" class="font-weight-medium text-mono">
            {{ item.no_referensi }}
          </span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template #item.pic_nama="{ item }">
          <div class="font-weight-medium">{{ item.pic_nama ?? '—' }}</div>
          <div class="text-caption text-medium-emphasis">{{ item.input_oleh }}</div>
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
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useCrud } from '@/composables/useCrud'
import { useLazyFetchAll } from '@/composables/useLazyFetchAll'
import { useFormatter } from '@/composables/useFormatter'

const authStore = useAuthStore()
const { formatCurrency, formatDate } = useFormatter()

const canSeeAll = computed(() =>
  authStore.isAdmin || authStore.isDirector || authStore.isManager || authStore.isSupervisor
)

const { items, loading, meta, params, fetchList } = useCrud('/finance/jurnal-pic')
const { items: karyawanList, loading: karyawanLoading, fetchAll: fetchKaryawan } = useCrud('/master/karyawan')
const { ensureLoaded: ensureKaryawanLoaded } = useLazyFetchAll(fetchKaryawan)

// Jika user terkunci ke PIC sendiri, tampilkan hanya dirinya (dari authStore)
// tanpa perlu load seluruh daftar karyawan
const picItems = computed(() => {
  if (!canSeeAll.value && authStore.user?.karyawan) {
    return [authStore.user.karyawan]
  }
  return karyawanList.value
})

params.no_referensi        = null
params.karyawan_id         = null
params.metode_pembayaran   = null
params.tanggal_dari        = null
params.tanggal_sampai      = null
params.status_rekonsiliasi = null

const headers = [
  { title: 'No',                 key: 'no',                  sortable: false, width: '50px' },
  { title: 'No. Referensi',      key: 'no_referensi',        sortable: false },
  { title: 'PIC / Diinput oleh', key: 'pic_nama',            sortable: false },
  { title: 'No Invoice / Klien', key: 'no_invoice',          sortable: false },
  { title: 'Entitas',            key: 'perusahaan',          sortable: false },
  { title: 'Tgl Bayar',          key: 'tanggal_pembayaran',  sortable: false },
  { title: 'Jumlah',             key: 'jumlah_pembayaran',   sortable: false },
  { title: 'Metode',             key: 'metode_pembayaran',   sortable: false },
  { title: 'Status Rekonsiliasi',key: 'status_rekonsiliasi', sortable: false },
]

const metodeOptions = [
  { label: 'Transfer', value: 'TRANSFER' },
  { label: 'Cash',     value: 'CASH' },
  { label: 'Giro',     value: 'GIRO' },
]

const statusRekonOptions = [
  { label: 'Matched',    value: 'MATCHED' },
  { label: 'Possible',   value: 'POSSIBLE' },
  { label: 'Unmatched',  value: 'UNMATCHED' },
  { label: 'Diabaikan',  value: 'DIABAIKAN' },
]

function metodeColor(metode) {
  return { TRANSFER: 'info', CASH: 'success', GIRO: 'warning' }[metode] ?? 'default'
}

function statusRekonColor(status) {
  return {
    MATCHED:   'success',
    POSSIBLE:  'warning',
    UNMATCHED: 'error',
    DIABAIKAN: 'secondary',
  }[status] ?? 'default'
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
  if (!canSeeAll.value && authStore.user?.karyawan_id) {
    params.karyawan_id = authStore.user.karyawan_id
  }
  doFetch()
})
onBeforeUnmount(() => controller?.abort())
</script>
