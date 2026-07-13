<template>
  <div>
    <PageHeader
      title="Jurnal Aktivitas per PIC"
      subtitle="Penelusuran pembayaran berdasarkan PIC dan nomor referensi"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Laporan', to: { name: 'finance-laporan' } },
        { title: 'Jurnal per PIC', disabled: true },
      ]"
    >
      <VBtn variant="text" prepend-icon="ri-arrow-left-line" :to="{ name: 'finance-laporan' }">Kembali</VBtn>
    </PageHeader>

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

        <VAutocomplete
          v-model="params.klien_ar_id"
          placeholder="Semua Klien"
          hide-details
          clearable
          density="compact"
          style="max-width: 220px"
          :items="klienArList"
          item-title="display_label"
          item-value="id"
          :loading="klienArLoading"
          @focus="ensureKlienArLoaded()"
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

    <!-- Tabel -->
    <VCard>
      <BaseTable
        :headers="headers"
        :items="items"
        :total="meta.total"
        :loading="loading"
        :per-page="meta.per_page"
        :page="meta.current_page"
        :row-props="getRowProps"
        @update:options="onTableOptions"
        @click:row="(_, { item }) => openDetail(item)"
      >
        <template #item.no="{ index }">
          {{ (meta.current_page - 1) * meta.per_page + index + 1 }}
        </template>

        <template #item.no_referensi="{ item }">
          <div class="d-flex align-center gap-1">
            <span v-if="item.no_referensi" class="font-weight-medium text-mono">
              {{ item.no_referensi }}
            </span>
            <span v-else class="text-medium-emphasis">—</span>
            <!-- Badge multi-invoice -->
            <VTooltip v-if="multiRefMap[item.no_referensi] > 1" text="1 referensi untuk beberapa invoice">
              <template #activator="{ props }">
                <VChip v-bind="props" size="x-small" color="purple" variant="tonal" label>
                  ×{{ multiRefMap[item.no_referensi] }}
                </VChip>
              </template>
            </VTooltip>
          </div>
        </template>

        <template #item.pic_nama="{ item }">
          <div class="font-weight-medium">{{ item.pic_nama ?? '—' }}</div>
          <div v-if="item.input_oleh && item.input_oleh !== item.pic_nama" class="text-caption text-medium-emphasis">
            Input: {{ item.input_oleh }}
          </div>
        </template>

        <template #item.no_invoice="{ item }">
          <RouterLink
            :to="{ name: 'finance-invoice-show', params: { id: item.invoice_id } }"
            class="text-primary text-decoration-none font-weight-medium"
            @click.stop
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

        <template #item.sisa_piutang="{ item }">
          <span :class="item.sisa_piutang > 0 ? 'text-error' : 'text-success'" class="font-weight-medium">
            {{ formatCurrency(item.sisa_piutang ?? 0) }}
          </span>
        </template>

        <template #item.invoice_status="{ item }">
          <InvoiceStatusBadge v-if="item.invoice_status" :status="item.invoice_status" />
          <span v-else class="text-medium-emphasis">—</span>
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
          <VChip v-else size="small" variant="tonal" color="warning" label>
            Belum Diproses
          </VChip>
        </template>
      </BaseTable>
    </VCard>

    <!-- Detail Dialog -->
    <VDialog v-model="detailDialog" max-width="620" scrollable>
      <VCard v-if="selectedItem">
        <VCardTitle class="d-flex align-center justify-space-between pt-4 px-6">
          <div class="d-flex align-center gap-2">
            <span class="text-h6 font-weight-bold">Detail Pembayaran</span>
            <VChip
              v-if="multiInvoices.length > 1"
              color="purple"
              size="small"
              variant="tonal"
              prepend-icon="ri-file-list-3-line"
            >
              {{ multiInvoices.length }} Invoice
            </VChip>
          </div>
          <VBtn icon="ri-close-line" variant="text" size="small" @click="detailDialog = false" />
        </VCardTitle>

        <VDivider />

        <VCardText class="pa-6">
          <!-- Status Banner -->
          <VAlert
            :color="statusRekonColor(selectedItem.status_rekonsiliasi) || 'warning'"
            variant="tonal"
            density="compact"
            class="mb-4"
            :icon="selectedItem.status_rekonsiliasi === 'MATCHED' ? 'ri-checkbox-circle-line' : 'ri-time-line'"
          >
            <span class="font-weight-medium">
              Rekonsiliasi: {{ selectedItem.status_rekonsiliasi ?? 'Belum Diproses' }}
            </span>
          </VAlert>

          <!-- Info Bayar -->
          <VRow dense>
            <VCol cols="6">
              <div class="text-caption text-medium-emphasis mb-1">No. Referensi</div>
              <div class="font-weight-medium text-mono">{{ selectedItem.no_referensi ?? '—' }}</div>
            </VCol>
            <VCol cols="6">
              <div class="text-caption text-medium-emphasis mb-1">Tanggal Bayar</div>
              <div class="font-weight-medium">{{ formatDate(selectedItem.tanggal_pembayaran) }}</div>
            </VCol>
            <VCol cols="6" class="mt-3">
              <div class="text-caption text-medium-emphasis mb-1">Jumlah Bayar</div>
              <div class="text-success font-weight-bold text-subtitle-1">
                {{ formatCurrency(selectedItem.jumlah_pembayaran) }}
              </div>
            </VCol>
            <VCol cols="6" class="mt-3">
              <div class="text-caption text-medium-emphasis mb-1">Metode</div>
              <VChip :color="metodeColor(selectedItem.metode_pembayaran)" size="small" variant="tonal" label>
                {{ selectedItem.metode_pembayaran }}
              </VChip>
            </VCol>
            <VCol cols="6" class="mt-3">
              <div class="text-caption text-medium-emphasis mb-1">PIC AR</div>
              <div class="font-weight-medium">{{ selectedItem.pic_nama ?? '—' }}</div>
            </VCol>
            <VCol cols="6" class="mt-3">
              <div class="text-caption text-medium-emphasis mb-1">Diinput oleh</div>
              <div>{{ selectedItem.input_oleh ?? '—' }}</div>
            </VCol>
          </VRow>

          <VDivider class="my-4" />

          <!-- Multi-Invoice Section -->
          <template v-if="loadingMulti">
            <div class="d-flex align-center gap-2 py-2 text-medium-emphasis">
              <VProgressCircular size="16" width="2" indeterminate />
              <span class="text-caption">Memuat invoice terkait...</span>
            </div>
          </template>

          <template v-else-if="multiInvoices.length > 0">
            <div class="text-caption text-medium-emphasis mb-2 font-weight-medium text-uppercase">
              Invoice yang Dibayar <span class="text-purple">({{ multiInvoices.length }})</span>
            </div>
            <VTable density="compact" class="rounded border mb-2">
              <thead>
                <tr>
                  <th class="text-caption">No. Invoice</th>
                  <th class="text-caption">Klien</th>
                  <th class="text-caption text-right">Total Tagihan</th>
                  <th class="text-caption text-right">Dibayar</th>
                  <th class="text-caption text-right">Sisa</th>
                  <th class="text-caption text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="pay in multiInvoices" :key="pay.id">
                  <td class="text-mono">
                    <RouterLink
                      :to="{ name: 'finance-invoice-show', params: { id: pay.invoice_id } }"
                      class="text-primary text-decoration-none font-weight-medium"
                      @click="detailDialog = false"
                    >
                      {{ pay.no_invoice }}
                    </RouterLink>
                  </td>
                  <td class="text-caption">{{ pay.klien }}</td>
                  <td class="text-right text-caption">{{ formatCurrency(pay.total_tagihan) }}</td>
                  <td class="text-right text-caption text-success font-weight-medium">
                    {{ formatCurrency(pay.jumlah_pembayaran) }}
                  </td>
                  <td class="text-right text-caption" :class="pay.sisa_piutang > 0 ? 'text-error' : 'text-success'">
                    {{ formatCurrency(pay.sisa_piutang) }}
                  </td>
                  <td class="text-center">
                    <InvoiceStatusBadge v-if="pay.invoice_status" :status="pay.invoice_status" />
                  </td>
                </tr>
              </tbody>
            </VTable>
          </template>

          <!-- Info Rekonsiliasi Bank -->
          <template v-if="selectedItem.no_ref_bank || selectedItem.tgl_rekonsiliasi">
            <VDivider class="my-4" />
            <div class="text-caption text-medium-emphasis mb-2 font-weight-medium text-uppercase">
              Info Rekonsiliasi Bank
            </div>
            <VRow dense>
              <VCol cols="6">
                <div class="text-caption text-medium-emphasis mb-1">No. Ref Bank</div>
                <div class="text-mono">{{ selectedItem.no_ref_bank ?? '—' }}</div>
              </VCol>
              <VCol cols="6">
                <div class="text-caption text-medium-emphasis mb-1">Tgl Rekonsiliasi</div>
                <div>{{ formatDate(selectedItem.tgl_rekonsiliasi) ?? '—' }}</div>
              </VCol>
            </VRow>
          </template>

          <template v-if="selectedItem.keterangan">
            <VDivider class="my-4" />
            <div class="text-caption text-medium-emphasis mb-1">Keterangan</div>
            <div class="text-body-2">{{ selectedItem.keterangan }}</div>
          </template>
        </VCardText>
      </VCard>
    </VDialog>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useCrud } from '@/composables/useCrud'
import { useLazyFetchAll } from '@/composables/useLazyFetchAll'
import { useFormatter } from '@/composables/useFormatter'
import InvoiceStatusBadge from '@/modules/Finance/shared/components/InvoiceStatusBadge.vue'
import api from '@/utils/axios'

const authStore = useAuthStore()
const { formatCurrency, formatDate } = useFormatter()

const canSeeAll = computed(() =>
  authStore.isAdmin || authStore.isManager || authStore.isSupervisor
)

const { items, loading, meta, params, fetchList } = useCrud('/finance/jurnal-pic')
const { items: karyawanList, loading: karyawanLoading, fetchAll: fetchKaryawan } = useCrud('/master/karyawan')
const { items: klienArList,  loading: klienArLoading,  fetchAll: fetchKlienAr }  = useCrud('/finance/klien-ar')

const { ensureLoaded: ensureKaryawanLoaded } = useLazyFetchAll(fetchKaryawan)
const { ensureLoaded: ensureKlienArLoaded }  = useLazyFetchAll(fetchKlienAr)

const picItems = computed(() => {
  if (!canSeeAll.value && authStore.user?.karyawan) {
    return [authStore.user.karyawan]
  }
  return karyawanList.value
})

params.no_referensi        = null
params.karyawan_id         = null
params.klien_ar_id         = null
params.metode_pembayaran   = null
params.tanggal_dari        = null
params.tanggal_sampai      = null
params.status_rekonsiliasi = null

// Hitung berapa kali tiap no_referensi muncul di halaman ini (deteksi multi-invoice)
const multiRefMap = computed(() => {
  const map = {}
  for (const item of items.value) {
    if (item.no_referensi) {
      map[item.no_referensi] = (map[item.no_referensi] ?? 0) + 1
    }
  }
  return map
})

// State detail modal
const detailDialog   = ref(false)
const selectedItem   = ref(null)
const multiInvoices  = ref([])
const loadingMulti   = ref(false)
const exporting      = ref(false)

async function openDetail(item) {
  selectedItem.value  = item
  multiInvoices.value = []
  detailDialog.value  = true

  if (!item.no_referensi) return

  loadingMulti.value = true
  try {
    const { data } = await api.get('/finance/jurnal-pic/by-referensi', {
      params: { no_referensi: item.no_referensi },
    })
    multiInvoices.value = data.data ?? []
  } catch {
    multiInvoices.value = [item]
  } finally {
    loadingMulti.value = false
  }
}

const headers = [
  { title: 'No',                  key: 'no',                  sortable: false, width: '50px' },
  { title: 'No. Referensi',       key: 'no_referensi',        sortable: false },
  { title: 'PIC / Diinput oleh',  key: 'pic_nama',            sortable: false },
  { title: 'No Invoice / Klien',  key: 'no_invoice',          sortable: false },
  { title: 'Tgl Bayar',           key: 'tanggal_pembayaran',  sortable: false },
  { title: 'Jumlah Bayar',        key: 'jumlah_pembayaran',   sortable: false },
  { title: 'Sisa Piutang',        key: 'sisa_piutang',        sortable: false },
  { title: 'Status Invoice',      key: 'invoice_status',      sortable: false },
  { title: 'Metode',              key: 'metode_pembayaran',   sortable: false },
  { title: 'Status Rekonsiliasi', key: 'status_rekonsiliasi', sortable: false },
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

function getRowProps({ item }) {
  if (item.status_rekonsiliasi === 'UNMATCHED') return { class: 'jurnal-row--unmatched cursor-pointer' }
  if (!item.status_rekonsiliasi) return { class: 'jurnal-row--belum cursor-pointer' }
  return { class: 'cursor-pointer' }
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

async function doExport() {
  exporting.value = true
  try {
    const p = {}
    if (params.no_referensi)        p.no_referensi        = params.no_referensi
    if (params.karyawan_id)         p.karyawan_id         = params.karyawan_id
    if (params.klien_ar_id)         p.klien_ar_id         = params.klien_ar_id
    if (params.metode_pembayaran)   p.metode_pembayaran   = params.metode_pembayaran
    if (params.tanggal_dari)        p.tanggal_dari        = params.tanggal_dari
    if (params.tanggal_sampai)      p.tanggal_sampai      = params.tanggal_sampai
    if (params.status_rekonsiliasi) p.status_rekonsiliasi = params.status_rekonsiliasi

    const response = await api.get('/finance/jurnal-pic/export-excel', {
      params: p,
      responseType: 'blob',
    })
    const url  = URL.createObjectURL(new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }))
    const link    = document.createElement('a')
    link.href     = url
    link.download = `JURNAL PIC - ${getKaryawanLabel()} - ${buildTimestamp()}.xlsx`
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

function getKaryawanLabel() {
  if (params.karyawan_id) {
    const found = karyawanList.value.find(k => k.id === params.karyawan_id)
    if (found) return found.nama_karyawan
  }
  return authStore.user?.karyawan?.nama_karyawan ?? 'SEMUA'
}

onMounted(() => {
  if (!canSeeAll.value && authStore.user?.karyawan_id) {
    params.karyawan_id = authStore.user.karyawan_id
  }
  doFetch()
})
onBeforeUnmount(() => controller?.abort())
</script>

<style scoped>
.jurnal-row--unmatched :deep(td) {
  background-color: rgba(var(--v-theme-error), 0.06) !important;
}
.jurnal-row--belum :deep(td) {
  background-color: rgba(var(--v-theme-warning), 0.06) !important;
}
.cursor-pointer {
  cursor: pointer;
}
</style>
