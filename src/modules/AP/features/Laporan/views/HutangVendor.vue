<template>
  <div>
    <PageHeader
      title="Hutang per Vendor"
      subtitle="Ringkasan outstanding tagihan per vendor"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'ap-dashboard' } },
        { title: 'Laporan', to: { name: 'ap-laporan' } },
        { title: 'Hutang per Vendor', disabled: true },
      ]"
    >
      <VBtn
        variant="tonal"
        color="primary"
        prepend-icon="ri-file-excel-2-line"
        size="small"
        class="me-2"
        :loading="exporting.excel"
        @click="doExport('excel')"
      >
        Excel
      </VBtn>
      <VBtn
        variant="tonal"
        color="error"
        prepend-icon="ri-file-pdf-2-line"
        size="small"
        class="me-2"
        :loading="exporting.pdf"
        @click="doExport('pdf')"
      >
        PDF
      </VBtn>
      <VBtn
        variant="text"
        prepend-icon="ri-arrow-left-line"
        :to="{ name: 'ap-laporan' }"
      >
        Kembali
      </VBtn>
    </PageHeader>

    <VCard elevation="0" border rounded="lg" class="mb-6">
      <VCardTitle class="px-5 pt-5 pb-0 text-subtitle-2 text-uppercase text-medium-emphasis font-weight-bold">
        Filter Laporan
      </VCardTitle>
      <VCardText class="pa-5">
        <VRow align="center" dense>
          <VCol cols="6" sm="auto">
            <VTextField
              v-model="draft.tanggal_dari"
              label="Dari Tanggal Tagihan"
              type="date"
              density="compact"
              variant="outlined"
              hide-details
              style="min-width: 170px"
            />
          </VCol>
          <VCol cols="6" sm="auto">
            <VTextField
              v-model="draft.tanggal_sampai"
              label="Sampai Tanggal Tagihan"
              type="date"
              density="compact"
              variant="outlined"
              hide-details
              style="min-width: 170px"
            />
          </VCol>
          <VCol cols="12" sm="auto">
            <VAutocomplete
              v-model="draft.vendor_ap_id"
              label="Vendor"
              placeholder="Semua Vendor"
              variant="outlined"
              clearable
              hide-details
              density="compact"
              prepend-inner-icon="ri-search-line"
              style="min-width: 220px"
              :items="vendorList"
              item-title="display_label"
              item-value="id"
              :loading="vendorLoading"
              @focus="ensureVendorLoaded()"
            />
          </VCol>
          <VCol cols="12" sm="auto">
            <VBtn
              color="primary"
              prepend-icon="ri-filter-3-line"
              :loading="loading"
              @click="doFetch"
            >
              Filter
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <VRow class="mb-6">
      <VCol cols="12" sm="6" md="3">
        <VCard elevation="0" border rounded="lg">
          <VCardText class="d-flex align-center gap-4 pa-5">
            <VAvatar color="primary" variant="tonal" size="54" rounded>
              <VIcon icon="ri-store-2-line" size="28" />
            </VAvatar>
            <div>
              <div class="text-caption text-medium-emphasis font-weight-medium text-uppercase mb-1">Jumlah Vendor</div>
              <div class="text-h6 font-weight-bold text-high-emphasis">{{ report.summary?.jumlah_vendor ?? 0 }}</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard elevation="0" border rounded="lg">
          <VCardText class="d-flex align-center gap-4 pa-5">
            <VAvatar color="secondary" variant="tonal" size="54" rounded>
              <VIcon icon="ri-bill-line" size="28" />
            </VAvatar>
            <div>
              <div class="text-caption text-medium-emphasis font-weight-medium text-uppercase mb-1">Total Tagihan</div>
              <div class="text-h6 font-weight-bold text-high-emphasis">{{ formatCurrency(report.summary?.total_tagihan ?? 0) }}</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard elevation="0" border rounded="lg">
          <VCardText class="d-flex align-center gap-4 pa-5">
            <VAvatar color="error" variant="tonal" size="54" rounded>
              <VIcon icon="ri-error-warning-line" size="28" />
            </VAvatar>
            <div>
              <div class="text-caption text-medium-emphasis font-weight-medium text-uppercase mb-1">Sisa Hutang</div>
              <div class="text-h6 font-weight-bold text-high-emphasis">{{ formatCurrency(report.summary?.sisa_tagihan ?? 0) }}</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard elevation="0" border rounded="lg">
          <VCardText class="d-flex align-center gap-4 pa-5">
            <VAvatar color="warning" variant="tonal" size="54" rounded>
              <VIcon icon="ri-alarm-warning-line" size="28" />
            </VAvatar>
            <div>
              <div class="text-caption text-medium-emphasis font-weight-medium text-uppercase mb-1">Overdue</div>
              <div class="text-h6 font-weight-bold text-high-emphasis">{{ formatCurrency(report.summary?.overdue_amount ?? 0) }}</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VCard elevation="0" border rounded="lg">
      <div class="d-flex flex-wrap align-center justify-space-between px-5 py-4 bg-var-theme-background">
        <div>
          <h3 class="text-subtitle-1 font-weight-bold mb-1">Daftar Hutang per Vendor</h3>
          <div class="text-caption text-medium-emphasis">
            Per Tanggal: <strong>{{ report.as_of_date ?? '-' }}</strong>
          </div>
        </div>
        <VChip size="small" color="primary" variant="tonal" class="font-weight-medium">
          Total: {{ report.meta?.total ?? report.rows?.length ?? 0 }} Vendor
        </VChip>
      </div>

      <VDivider />
      <VProgressLinear v-if="loading" indeterminate color="primary" height="3" />

      <BaseTable
        v-model:expanded="expanded"
        :headers="headers"
        :items="report.rows"
        :total="report.meta?.total ?? 0"
        :loading="loading"
        :per-page="perPage"
        :page="page"
        show-expand
        item-value="vendor_id"
        hover
        wrap-text
        @update:options="onTableOptions"
        @click:row="onRowClick"
      >
        <template #item.no="{ index }">
          <span class="text-medium-emphasis">{{ (page - 1) * perPage + index + 1 }}</span>
        </template>

        <template #item.nama_vendor="{ item }">
          <div class="font-weight-medium text-high-emphasis">{{ item.nama_vendor }}</div>
          <div class="text-caption text-medium-emphasis mt-1">{{ item.kode_vendor }}</div>
        </template>

        <template #item.pic_ap="{ item }">
          <div class="font-weight-medium">{{ item.pic_ap ?? '-' }}</div>
          <div class="text-caption text-medium-emphasis mt-1">{{ item.entitas ?? '-' }}</div>
        </template>

        <template #item.total_tagihan="{ item }">
          {{ formatCurrency(item.total_tagihan) }}
        </template>

        <template #item.total_pembayaran="{ item }">
          <span class="text-success font-weight-medium">
            {{ item.total_pembayaran > 0 ? formatCurrency(item.total_pembayaran) : '-' }}
          </span>
        </template>

        <template #item.sisa_tagihan="{ item }">
          <VChip
            :color="item.sisa_tagihan > 0 ? 'error' : 'success'"
            variant="flat"
            size="small"
            class="font-weight-bold"
          >
            {{ formatCurrency(item.sisa_tagihan) }}
          </VChip>
        </template>

        <template #item.overdue_amount="{ item }">
          <span :class="item.overdue_amount > 0 ? 'text-error font-weight-bold' : ''">
            {{ item.overdue_amount > 0 ? formatCurrency(item.overdue_amount) : '-' }}
          </span>
        </template>

        <template #item.jatuh_tempo_terdekat="{ item }">
          {{ formatDate(item.jatuh_tempo_terdekat) ?? '-' }}
        </template>

        <template #expanded-row="{ item, columns }">
          <tr class="hv-detail-row">
            <td :colspan="columns.length" class="pa-0">
              <div class="pa-5">
                <VCard elevation="0" border class="bg-surface">
                  <VCardTitle class="px-4 py-3 text-subtitle-2 text-primary bg-primary-lighten-5">
                    <VIcon icon="ri-list-check-2" class="mr-2" size="20" />
                    Detail Tagihan: {{ item.nama_vendor }}
                  </VCardTitle>
                  <VDivider />
                  <div class="hv-detail-scroll">
                    <VTable density="comfortable" class="hv-detail-table">
                      <thead>
                        <tr>
                          <th class="font-weight-bold text-uppercase text-caption">No Tagihan</th>
                          <th class="font-weight-bold text-uppercase text-caption">Tgl Tagihan</th>
                          <th class="font-weight-bold text-uppercase text-caption">Jatuh Tempo</th>
                          <th class="font-weight-bold text-uppercase text-caption text-end">Total Tagihan</th>
                          <th class="font-weight-bold text-uppercase text-caption text-end">Total Bayar</th>
                          <th class="font-weight-bold text-uppercase text-caption text-end">Sisa</th>
                          <th class="font-weight-bold text-uppercase text-caption">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-if="!(item.details?.length)">
                          <td colspan="7" class="text-center text-medium-emphasis py-4">Tidak ada tagihan.</td>
                        </tr>
                        <tr v-for="d in item.details ?? []" :key="d.tagihan_id">
                          <td class="text-no-wrap font-weight-medium">{{ d.no_tagihan }}</td>
                          <td class="text-no-wrap">{{ formatDate(d.tanggal_tagihan) ?? '-' }}</td>
                          <td class="text-no-wrap">{{ formatDate(d.tanggal_jatuh_tempo) ?? '-' }}</td>
                          <td class="text-end text-no-wrap">{{ formatCurrency(d.total_tagihan) }}</td>
                          <td class="text-end text-no-wrap text-success">{{ formatCurrency(d.total_pembayaran) }}</td>
                          <td class="text-end text-no-wrap font-weight-bold">{{ formatCurrency(d.sisa_tagihan) }}</td>
                          <td>
                            <VChip size="x-small" variant="tonal">{{ d.status }}</VChip>
                          </td>
                        </tr>
                      </tbody>
                    </VTable>
                  </div>
                </VCard>
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
import { useCrud } from '@/composables/useCrud'
import { useLazyFetchAll } from '@/composables/useLazyFetchAll'
import { useFormatter } from '@/composables/useFormatter'
import api from '@/utils/axios'

const { formatCurrency, formatDate } = useFormatter()
const { items: vendorList, loading: vendorLoading, fetchAll: fetchVendor } = useCrud('/ap/vendors')
const { ensureLoaded: ensureVendorLoaded } = useLazyFetchAll(fetchVendor)

const loading   = ref(false)
const exporting = reactive({ excel: false, pdf: false })
const report    = reactive({ as_of_date: null, summary: null, rows: [], meta: null })
const expanded  = ref([])

// Draft diedit bebas; hanya diterapkan ke filter aktif saat tombol Filter ditekan.
const draft = reactive({
  tanggal_dari: null,
  tanggal_sampai: null,
  vendor_ap_id: null,
})

const page    = ref(1)
const perPage = ref(15)

const headers = [
  { title: 'No',            key: 'no',                    sortable: false, width: '50px' },
  { title: 'Vendor',        key: 'nama_vendor',            sortable: false },
  { title: 'PIC AP/Entitas',key: 'pic_ap',                 sortable: false },
  { title: 'Total Tagihan', key: 'total_tagihan',          sortable: false, align: 'end' },
  { title: 'Total Bayar',   key: 'total_pembayaran',       sortable: false, align: 'end' },
  { title: 'Sisa Hutang',   key: 'sisa_tagihan',           sortable: false, align: 'end' },
  { title: 'Overdue',       key: 'overdue_amount',         sortable: false, align: 'end' },
  { title: 'JT Terdekat',   key: 'jatuh_tempo_terdekat',   sortable: false },
]

function buildParams() {
  const params = {}
  if (draft.tanggal_dari)   params.tanggal_dari   = draft.tanggal_dari
  if (draft.tanggal_sampai) params.tanggal_sampai = draft.tanggal_sampai
  if (draft.vendor_ap_id)   params.vendor_ap_id   = draft.vendor_ap_id

  return params
}

function onTableOptions({ page: p, itemsPerPage }) {
  page.value    = p
  perPage.value = itemsPerPage
  fetchReport({ resetPage: false })
}

function onRowClick(_event, { item } = {}) {
  const key = item?.vendor_id
  if (key == null) return

  expanded.value = expanded.value.includes(key)
    ? expanded.value.filter(v => v !== key)
    : [...expanded.value, key]
}

async function fetchReport({ resetPage = true } = {}) {
  if (resetPage) page.value = 1
  loading.value = true
  try {
    const params = { ...buildParams(), page: page.value, per_page: perPage.value }
    const { data } = await api.get('/ap/laporan/hutang-vendor', { params })
    Object.assign(report, data.data)
    expanded.value = []
  } finally {
    loading.value = false
  }
}

function doFetch() {
  fetchReport({ resetPage: true })
}

async function doExport(type) {
  exporting[type] = true
  try {
    const response = await api.get(`/ap/laporan/hutang-vendor/export-${type === 'excel' ? 'excel' : 'pdf'}`, {
      params: buildParams(),
      responseType: 'blob',
    })
    const mime = type === 'excel'
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'application/pdf'
    const url  = URL.createObjectURL(new Blob([response.data], { type: mime }))
    const link = document.createElement('a')
    link.href     = url
    link.download = `hutang-vendor-${report.as_of_date ?? ''}.${type === 'excel' ? 'xlsx' : 'pdf'}`
    link.click()
    URL.revokeObjectURL(url)
  } finally {
    exporting[type] = false
  }
}

onMounted(() => fetchReport())
</script>

<style scoped>
.hv-detail-row > td {
  background: rgba(var(--v-theme-primary), 0.03) !important;
  border-bottom: 2px solid rgba(var(--v-theme-primary), 0.1) !important;
}

.hv-detail-scroll {
  overflow-x: auto;
}

.hv-detail-table thead th {
  background: rgba(var(--v-theme-surface), 1);
  border-bottom: 2px solid rgba(var(--v-theme-on-surface), 0.08) !important;
}
</style>
