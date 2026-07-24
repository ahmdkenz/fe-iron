<template>
  <div>
    <PageHeader
      title="Histori Pembayaran"
      subtitle="Riwayat alokasi payment voucher per vendor dan per tagihan"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'ap-dashboard' } },
        { title: 'Laporan', to: { name: 'ap-laporan' } },
        { title: 'Histori Pembayaran', disabled: true },
      ]"
    >
      <VBtn
        color="primary"
        variant="flat"
        prepend-icon="ri-download-2-line"
        class="me-2"
        :loading="exporting"
        @click="doExport"
      >
        Export
      </VBtn>
      <VBtn
        variant="text"
        prepend-icon="ri-arrow-left-line"
        :to="{ name: 'ap-laporan' }"
      >
        Kembali
      </VBtn>
    </PageHeader>

    <VCard
      elevation="0"
      border
      rounded="lg"
      class="mb-6"
    >
      <VCardTitle class="px-5 pt-5 pb-0 text-subtitle-2 text-uppercase text-medium-emphasis font-weight-bold">
        Filter Laporan
      </VCardTitle>
      <VCardText class="pa-5">
        <VRow
          align="center"
          dense
        >
          <VCol
            cols="6"
            sm="auto"
          >
            <VTextField
              v-model="draft.tanggal_dari"
              label="Dari Tanggal"
              type="date"
              density="compact"
              variant="outlined"
              hide-details
              style="min-width: 160px"
            />
          </VCol>
          <VCol
            cols="6"
            sm="auto"
          >
            <VTextField
              v-model="draft.tanggal_sampai"
              label="Sampai Tanggal"
              type="date"
              density="compact"
              variant="outlined"
              hide-details
              style="min-width: 160px"
            />
          </VCol>
          <VCol
            cols="12"
            sm="auto"
          >
            <VAutocomplete
              v-model="draft.vendor_ap_id"
              label="Vendor"
              placeholder="Semua Vendor"
              variant="outlined"
              clearable
              hide-details
              density="compact"
              prepend-inner-icon="ri-search-line"
              style="min-width: 200px"
              :items="vendorList"
              item-title="display_label"
              item-value="id"
              :loading="vendorLoading"
              @focus="ensureVendorLoaded"
            />
          </VCol>
          <VCol
            cols="6"
            sm="auto"
          >
            <VSelect
              v-model="draft.metode_pembayaran"
              label="Metode"
              placeholder="Semua Metode"
              variant="outlined"
              clearable
              hide-details
              density="compact"
              style="min-width: 140px"
              :items="[
                { title: 'Transfer', value: 'TRANSFER' },
                { title: 'Cash', value: 'CASH' },
                { title: 'Giro', value: 'GIRO' },
              ]"
            />
          </VCol>
          <VCol
            cols="6"
            sm="auto"
          >
            <VSelect
              v-model="draft.kategori_voucher"
              label="Kategori"
              placeholder="Semua Kategori"
              variant="outlined"
              clearable
              hide-details
              density="compact"
              style="min-width: 160px"
              :items="[
                { title: 'Bahan Baku', value: 'BB' },
                { title: 'Non Bahan Baku', value: 'NBB' },
              ]"
            />
          </VCol>
          <VCol
            cols="12"
            sm="auto"
          >
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
      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <VCard
          elevation="0"
          border
          rounded="lg"
        >
          <VCardText class="d-flex align-center gap-4 pa-5">
            <VAvatar
              color="primary"
              variant="tonal"
              size="54"
              rounded
            >
              <VIcon
                icon="ri-exchange-funds-line"
                size="28"
              />
            </VAvatar>
            <div>
              <div class="text-caption text-medium-emphasis font-weight-medium text-uppercase mb-1">
                Total
              </div>
              <div class="text-h6 font-weight-bold text-high-emphasis">
                {{ formatCurrency(report.summary?.total ?? 0) }}
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <VCard
          elevation="0"
          border
          rounded="lg"
        >
          <VCardText class="d-flex align-center gap-4 pa-5">
            <VAvatar
              color="info"
              variant="tonal"
              size="54"
              rounded
            >
              <VIcon
                icon="ri-bank-line"
                size="28"
              />
            </VAvatar>
            <div>
              <div class="text-caption text-medium-emphasis font-weight-medium text-uppercase mb-1">
                Transfer
              </div>
              <div class="text-h6 font-weight-bold text-high-emphasis">
                {{ formatCurrency(report.summary?.transfer ?? 0) }}
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <VCard
          elevation="0"
          border
          rounded="lg"
        >
          <VCardText class="d-flex align-center gap-4 pa-5">
            <VAvatar
              color="success"
              variant="tonal"
              size="54"
              rounded
            >
              <VIcon
                icon="ri-money-cny-circle-line"
                size="28"
              />
            </VAvatar>
            <div>
              <div class="text-caption text-medium-emphasis font-weight-medium text-uppercase mb-1">
                Cash
              </div>
              <div class="text-h6 font-weight-bold text-high-emphasis">
                {{ formatCurrency(report.summary?.cash ?? 0) }}
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <VCard
          elevation="0"
          border
          rounded="lg"
        >
          <VCardText class="d-flex align-center gap-4 pa-5">
            <VAvatar
              color="secondary"
              variant="tonal"
              size="54"
              rounded
            >
              <VIcon
                icon="ri-file-list-3-line"
                size="28"
              />
            </VAvatar>
            <div>
              <div class="text-caption text-medium-emphasis font-weight-medium text-uppercase mb-1">
                Giro
              </div>
              <div class="text-h6 font-weight-bold text-high-emphasis">
                {{ formatCurrency(report.summary?.giro ?? 0) }}
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VCard
      elevation="0"
      border
      rounded="lg"
    >
      <div class="d-flex flex-wrap align-center justify-space-between px-5 py-4 bg-var-theme-background">
        <div>
          <h3 class="text-subtitle-1 font-weight-bold mb-1">
            Daftar Histori Pembayaran
          </h3>
          <div class="text-caption text-medium-emphasis">
            Periode: <strong>{{ report.tanggal_dari ?? '-' }}</strong> s/d <strong>{{ report.tanggal_sampai ?? '-' }}</strong>
          </div>
        </div>
        <VChip
          size="small"
          color="primary"
          variant="tonal"
          class="font-weight-medium"
        >
          {{ report.summary?.jumlah_transaksi ?? 0 }} Transaksi
        </VChip>
      </div>

      <VDivider />

      <BaseTable
        :headers="headers"
        :items="report.rows"
        :total="report.meta?.total ?? 0"
        :loading="loading"
        :per-page="perPage"
        :page="page"
        hover
        wrap-text
        @update:options="onTableOptions"
      >
        <template #item.no="{ index }">
          <span class="text-medium-emphasis">{{ (page - 1) * perPage + index + 1 }}</span>
        </template>

        <template #item.tanggal_pembayaran="{ item }">
          {{ formatDate(item.tanggal_pembayaran) ?? '-' }}
        </template>

        <template #item.nama_vendor="{ item }">
          <div class="font-weight-medium text-high-emphasis">
            {{ item.nama_vendor }}
          </div>
          <div class="text-caption text-medium-emphasis mt-1">
            {{ item.kode_vendor }}
          </div>
        </template>

        <template #item.no_tagihan="{ item }">
          <div>{{ item.no_tagihan }}</div>
          <div class="text-caption text-medium-emphasis mt-1">
            {{ item.no_referensi }}
          </div>
        </template>

        <template #item.pic_ap="{ item }">
          <div class="font-weight-medium">
            {{ item.pic_ap ?? '-' }}
          </div>
          <div class="text-caption text-medium-emphasis mt-1">
            {{ item.perusahaan ?? '-' }}
          </div>
        </template>

        <template #item.metode_pembayaran="{ item }">
          <VChip
            size="x-small"
            variant="tonal"
          >
            {{ item.metode_pembayaran }}
          </VChip>
        </template>

        <template #item.kategori_voucher="{ item }">
          <VChip
            size="x-small"
            variant="tonal"
            :color="item.kategori_voucher === 'BB' ? 'warning' : 'info'"
          >
            {{ item.kategori_voucher === 'BB' ? 'Bahan Baku' : 'Non Bahan Baku' }}
          </VChip>
        </template>

        <template #item.jumlah_dialokasikan="{ item }">
          <span class="font-weight-bold">{{ formatCurrency(item.jumlah_dialokasikan) }}</span>
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
const exporting = ref(false)
const report    = reactive({ tanggal_dari: null, tanggal_sampai: null, summary: null, rows: [], meta: null })

const draft = reactive({
  tanggal_dari: null,
  tanggal_sampai: null,
  vendor_ap_id: null,
  metode_pembayaran: null,
  kategori_voucher: null,
})

const page    = ref(1)
const perPage = ref(15)

const headers = [
  { title: 'No',          key: 'no',                  sortable: false, width: '50px' },
  { title: 'Tanggal',     key: 'tanggal_pembayaran',   sortable: false },
  { title: 'Vendor',      key: 'nama_vendor',          sortable: false },
  { title: 'Tagihan/Ref', key: 'no_tagihan',           sortable: false },
  { title: 'PIC AP/Entitas', key: 'pic_ap',            sortable: false },
  { title: 'Metode',      key: 'metode_pembayaran',    sortable: false },
  { title: 'Kategori',    key: 'kategori_voucher',     sortable: false },
  { title: 'Jumlah',      key: 'jumlah_dialokasikan',  sortable: false, align: 'end' },
]

function buildParams() {
  const params = {}
  if (draft.tanggal_dari)      params.tanggal_dari      = draft.tanggal_dari
  if (draft.tanggal_sampai)    params.tanggal_sampai    = draft.tanggal_sampai
  if (draft.vendor_ap_id)      params.vendor_ap_id      = draft.vendor_ap_id
  if (draft.metode_pembayaran) params.metode_pembayaran = draft.metode_pembayaran
  if (draft.kategori_voucher)  params.kategori_voucher  = draft.kategori_voucher

  return params
}

function onTableOptions({ page: p, itemsPerPage }) {
  page.value    = p
  perPage.value = itemsPerPage
  fetchReport({ resetPage: false })
}

async function fetchReport({ resetPage = true } = {}) {
  if (resetPage) page.value = 1
  loading.value = true
  try {
    const params = { ...buildParams(), page: page.value, per_page: perPage.value }
    const { data } = await api.get('/ap/laporan/histori-pembayaran', { params })

    Object.assign(report, data.data)
  } finally {
    loading.value = false
  }
}

function doFetch() {
  fetchReport({ resetPage: true })
}

async function doExport() {
  exporting.value = true
  try {
    const response = await api.get('/ap/laporan/histori-pembayaran/export-excel', {
      params: buildParams(),
      responseType: 'blob',
    })

    const url  = URL.createObjectURL(new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }))

    const link = document.createElement('a')

    link.href     = url
    link.download = 'histori-pembayaran-ap.xlsx'
    link.click()
    URL.revokeObjectURL(url)
  } finally {
    exporting.value = false
  }
}

onMounted(() => fetchReport())
</script>
