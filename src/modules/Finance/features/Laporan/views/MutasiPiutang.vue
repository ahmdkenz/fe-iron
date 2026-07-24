<template>
  <div class="mutasi-piutang-page">
    <PageHeader
      title="Mutasi Piutang"
      subtitle="Pergerakan piutang per klien dalam satu periode"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Laporan', to: { name: 'finance-laporan' } },
        { title: 'Mutasi Piutang', disabled: true },
      ]"
    >
      <VBtn
        variant="tonal"
        prepend-icon="ri-arrow-left-line"
        :to="{ name: 'finance-laporan' }"
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
            cols="12"
            sm="auto"
          >
            <VBtnToggle
              v-model="segment"
              color="primary"
              variant="outlined"
              mandatory
              divided
              density="compact"
              @update:model-value="doFetch"
            >
              <VBtn
                value="ALL"
                size="small"
                style="min-width: 80px"
              >
                Semua
              </VBtn>
              <VBtn
                value="B2C"
                size="small"
                style="min-width: 70px"
              >
                B2C
              </VBtn>
              <VBtn
                value="B2B"
                size="small"
                style="min-width: 70px"
              >
                B2B
              </VBtn>
            </VBtnToggle>
          </VCol>

          <VCol
            cols="6"
            sm="auto"
          >
            <VTextField
              v-model="filters.periode_awal"
              label="Dari Tanggal"
              type="date"
              density="compact"
              variant="outlined"
              hide-details
              style="min-width: 150px"
              @update:model-value="debouncedFetch"
            />
          </VCol>

          <VCol
            cols="6"
            sm="auto"
          >
            <VTextField
              v-model="filters.periode_akhir"
              label="Sampai Tanggal"
              type="date"
              density="compact"
              variant="outlined"
              hide-details
              style="min-width: 150px"
              @update:model-value="debouncedFetch"
            />
          </VCol>

          <VCol
            cols="12"
            sm
          >
            <VAutocomplete
              v-model="filters.klien_ar_id"
              label="Klien"
              placeholder="Pilih atau cari klien..."
              variant="outlined"
              clearable
              hide-details
              density="compact"
              prepend-inner-icon="ri-search-line"
              :items="klienList"
              item-title="display_label"
              item-value="id"
              :loading="klienLoading"
              @focus="ensureKlienLoaded"
              @update:model-value="doFetch"
            />
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
              color="secondary"
              variant="tonal"
              size="54"
              rounded
            >
              <VIcon
                icon="ri-wallet-3-line"
                size="28"
              />
            </VAvatar>
            <div>
              <div class="text-caption text-medium-emphasis font-weight-medium text-uppercase mb-1">
                Saldo Awal
              </div>
              <div class="text-h6 font-weight-bold text-high-emphasis">
                {{ formatCurrency(report.summary?.saldo_awal ?? 0) }}
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
              color="warning"
              variant="tonal"
              size="54"
              rounded
            >
              <VIcon
                icon="ri-bill-line"
                size="28"
              />
            </VAvatar>
            <div>
              <div class="text-caption text-medium-emphasis font-weight-medium text-uppercase mb-1">
                Invoice Masuk
              </div>
              <div class="text-h6 font-weight-bold text-high-emphasis">
                {{ formatCurrency(report.summary?.invoice_masuk ?? 0) }}
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
                Pembayaran
              </div>
              <div class="text-h6 font-weight-bold text-high-emphasis">
                {{ formatCurrency(report.summary?.pembayaran ?? 0) }}
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
              color="error"
              variant="tonal"
              size="54"
              rounded
            >
              <VIcon
                icon="ri-error-warning-line"
                size="28"
              />
            </VAvatar>
            <div>
              <div class="text-caption text-medium-emphasis font-weight-medium text-uppercase mb-1">
                Saldo Akhir
              </div>
              <div class="text-h6 font-weight-bold text-high-emphasis">
                {{ formatCurrency(report.summary?.saldo_akhir ?? 0) }}
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
            Daftar Mutasi Piutang
          </h3>
          <div class="text-caption text-medium-emphasis">
            Menampilkan periode: <strong>{{ report.periode_awal ?? '-' }}</strong> s/d <strong>{{ report.periode_akhir ?? '-' }}</strong>
          </div>
        </div>
        <VChip
          size="small"
          color="primary"
          variant="tonal"
          class="font-weight-medium"
        >
          Total: {{ report.meta?.total ?? report.rows?.length ?? 0 }} Klien
        </VChip>
      </div>

      <VDivider />

      <BaseTable
        v-model:expanded="expanded"
        :headers="headers"
        :items="report.rows"
        :total="report.meta?.total ?? 0"
        :loading="loading"
        :per-page="perPage"
        :page="page"
        show-expand
        item-value="klien_id"
        hover
        wrap-text
        @update:options="onTableOptions"
        @click:row="onRowClick"
      >
        <template #item.no="{ index }">
          <span class="text-medium-emphasis">{{ (page - 1) * perPage + index + 1 }}</span>
        </template>
        
        <template #item.nama_klien="{ item }">
          <div class="font-weight-medium text-high-emphasis">
            {{ item.nama_klien }}
          </div>
          <div class="text-caption text-medium-emphasis mt-1">
            {{ item.kode_klien }}<template v-if="item.nama_resto">
              · {{ item.nama_resto }}
            </template>
          </div>
        </template>
        
        <template #item.pic_ar="{ item }">
          <div class="font-weight-medium">
            {{ item.pic_ar ?? '-' }}
          </div>
          <div class="text-caption text-medium-emphasis mt-1">
            {{ item.perusahaan ?? '-' }}
          </div>
        </template>
        
        <template #item.saldo_awal="{ item }">
          {{ formatCurrency(item.saldo_awal) }}
        </template>
        
        <template #item.invoice_masuk="{ item }">
          <span class="text-warning font-weight-bold">
            {{ item.invoice_masuk > 0 ? formatCurrency(item.invoice_masuk) : '-' }}
          </span>
        </template>
        
        <template #item.pembayaran="{ item }">
          <span class="text-success font-weight-bold">
            {{ item.pembayaran > 0 ? formatCurrency(item.pembayaran) : '-' }}
          </span>
        </template>
        
        <template #item.saldo_akhir="{ item }">
          <VChip 
            :color="item.saldo_akhir > 0 ? 'error' : 'success'" 
            variant="flat" 
            size="small" 
            class="font-weight-bold"
          >
            {{ formatCurrency(item.saldo_akhir) }}
          </VChip>
        </template>
        
        <template #item.jumlah_mutasi="{ item }">
          <div class="text-end">
            <div class="font-weight-medium">
              {{ item.jumlah_invoice_masuk ?? 0 }} Inv
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ item.jumlah_pembayaran ?? 0 }} Bayar
            </div>
          </div>
        </template>

        <template #expanded-row="{ item, columns }">
          <tr class="mutasi-detail-row">
            <td
              :colspan="columns.length"
              class="pa-0"
            >
              <div class="pa-5">
                <VCard
                  elevation="0"
                  border
                  class="bg-surface"
                >
                  <VCardTitle class="px-4 py-3 text-subtitle-2 text-primary bg-primary-lighten-5">
                    <VIcon
                      icon="ri-list-check-2"
                      class="mr-2"
                      size="20"
                    />
                    Detail Transaksi: {{ item.nama_klien }}
                  </VCardTitle>
                  <VDivider />
                  
                  <div class="mutasi-detail-scroll">
                    <VTable
                      density="comfortable"
                      class="mutasi-detail-table"
                    >
                      <thead>
                        <tr>
                          <th class="font-weight-bold text-uppercase text-caption">
                            Tanggal
                          </th>
                          <th class="font-weight-bold text-uppercase text-caption">
                            Tipe
                          </th>
                          <th class="font-weight-bold text-uppercase text-caption">
                            Dokumen
                          </th>
                          <th class="font-weight-bold text-uppercase text-caption">
                            Invoice
                          </th>
                          <th class="font-weight-bold text-uppercase text-caption text-end">
                            Debit
                          </th>
                          <th class="font-weight-bold text-uppercase text-caption text-end">
                            Kredit
                          </th>
                          <th class="font-weight-bold text-uppercase text-caption text-end">
                            Saldo
                          </th>
                          <th class="font-weight-bold text-uppercase text-caption">
                            Keterangan
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-if="!(item.details?.length)">
                          <td
                            colspan="8"
                            class="text-center text-medium-emphasis py-4"
                          >
                            Tidak ada data transaksi.
                          </td>
                        </tr>
                        <tr
                          v-for="(detail, i) in item.details ?? []"
                          :key="`${detail.tipe}-${detail.id ?? i}-${detail.no_dokumen ?? i}`"
                        >
                          <td class="text-no-wrap">
                            {{ formatDate(detail.tanggal) }}
                          </td>
                          <td>
                            <VChip
                              :color="mutasiColor(detail.tipe)"
                              size="x-small"
                              variant="flat"
                              class="font-weight-bold text-uppercase"
                            >
                              {{ mutasiLabel(detail.tipe) }}
                            </VChip>
                          </td>
                          <td class="text-no-wrap text-medium-emphasis">
                            {{ detail.no_dokumen ?? '-' }}
                          </td>
                          <td class="text-no-wrap">
                            <RouterLink
                              v-if="detail.invoice_id"
                              :to="{ name: 'finance-invoice-show', params: { id: detail.invoice_id } }"
                              class="text-primary font-weight-medium text-decoration-none"
                            >
                              {{ detail.no_invoice ?? '-' }}
                            </RouterLink>
                            <span
                              v-else
                              class="text-medium-emphasis"
                            >{{ detail.no_invoice ?? '-' }}</span>
                          </td>
                          <td class="text-end text-warning font-weight-medium text-no-wrap">
                            {{ detail.debit > 0 ? formatCurrency(detail.debit) : '-' }}
                          </td>
                          <td class="text-end text-success font-weight-medium text-no-wrap">
                            {{ detail.kredit > 0 ? formatCurrency(detail.kredit) : '-' }}
                          </td>
                          <td class="text-end font-weight-bold text-no-wrap bg-grey-lighten-4">
                            {{ formatCurrency(detail.saldo ?? 0) }}
                          </td>
                          <td class="text-caption">
                            {{ detail.keterangan ?? '-' }}
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
const { items: klienList, loading: klienLoading, fetchAll: fetchKlien } = useCrud('/finance/klien-ar')
const { ensureLoaded: ensureKlienLoaded } = useLazyFetchAll(fetchKlien)

const loading = ref(false)
const report  = reactive({ periode_awal: null, periode_akhir: null, summary: null, rows: [], meta: null })
const segment = ref('ALL')
const expanded = ref([])

const filters = reactive({
  periode_awal: null,
  periode_akhir: null,
  klien_ar_id: null,
})

const page    = ref(1)
const perPage = ref(15)

function onTableOptions({ page: p, itemsPerPage }) {
  page.value    = p
  perPage.value = itemsPerPage
  doFetch({ resetPage: false })
}

const headers = [
  { title: 'No',           key: 'no',            sortable: false, width: '50px' },
  { title: 'Klien',        key: 'nama_klien',    sortable: false },
  { title: 'PIC/Entitas',  key: 'pic_ar',        sortable: false },
  { title: 'Saldo Awal',   key: 'saldo_awal',    sortable: false, align: 'end' },
  { title: 'Invoice Masuk', key: 'invoice_masuk', sortable: false, align: 'end' },
  { title: 'Pembayaran',   key: 'pembayaran',    sortable: false, align: 'end' },
  { title: 'Saldo Akhir',  key: 'saldo_akhir',   sortable: false, align: 'end' },
  { title: 'Mutasi',       key: 'jumlah_mutasi', sortable: false, align: 'end' },
]

function mutasiLabel(type) {
  return {
    SALDO_AWAL: 'Saldo Awal',
    INVOICE: 'Invoice',
    PEMBAYARAN: 'Pembayaran',
  }[type] ?? type ?? '-'
}

function mutasiColor(type) {
  return {
    SALDO_AWAL: 'secondary',
    INVOICE: 'warning',
    PEMBAYARAN: 'success',
  }[type] ?? 'default'
}

function onRowClick(_event, { item } = {}) {
  const key = item?.klien_id
  if (key == null) return

  expanded.value = expanded.value.includes(key)
    ? expanded.value.filter(v => v !== key)
    : [...expanded.value, key]
}

async function doFetch({ resetPage = true } = {}) {
  if (resetPage) page.value = 1
  loading.value = true
  try {
    const params = { page: page.value, per_page: perPage.value }
    if (filters.periode_awal)    params.periode_awal  = filters.periode_awal
    if (filters.periode_akhir)   params.periode_akhir = filters.periode_akhir
    if (filters.klien_ar_id)     params.klien_ar_id   = filters.klien_ar_id
    if (segment.value !== 'ALL') params.segment       = segment.value

    const { data } = await api.get('/finance/mutasi-piutang', { params })

    Object.assign(report, data.data)
    expanded.value = []
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

<style scoped>
/* Latar belakang lembut untuk mengindikasikan bahwa ini adalah row yang diperluas */
.mutasi-detail-row > td {
  background: rgba(var(--v-theme-primary), 0.03) !important;
  border-bottom: 2px solid rgba(var(--v-theme-primary), 0.1) !important;
}

.mutasi-detail-scroll {
  overflow-x: auto;
}

/* Memperjelas pemisahan header di tabel detail */
.mutasi-detail-table thead th {
  background: rgba(var(--v-theme-surface), 1);
  border-bottom: 2px solid rgba(var(--v-theme-on-surface), 0.08) !important;
}

/* Zebra striping tipis untuk tabel detail */
.mutasi-detail-table tbody tr:nth-of-type(even) {
  background: rgba(var(--v-theme-on-surface), 0.01);
}
</style>