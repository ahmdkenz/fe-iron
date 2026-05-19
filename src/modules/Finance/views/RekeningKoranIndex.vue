<template>
  <div>
    <PageHeader
      title="Rekening Koran"
      subtitle="Riwayat transaksi per klien dengan saldo berjalan"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Rekening Koran', disabled: true },
      ]"
    />

    <!-- Filter -->
    <VCard class="mb-4">
      <VCardText class="d-flex flex-wrap gap-3 align-center">
        <VAutocomplete
          v-model="filters.klien_ar_id"
          placeholder="Pilih Klien (wajib)"
          clearable
          hide-details
          density="compact"
          style="max-width: 280px"
          :items="klienList"
          item-title="nama_klien"
          item-value="id"
          :loading="klienLoading"
          @focus="ensureKlienLoaded()"
          @update:model-value="onKlienChange"
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
        <VSpacer />
        <VBtn
          v-if="report.rows.length > 0"
          variant="outlined"
          color="success"
          size="small"
          prepend-icon="ri-file-excel-2-line"
          :loading="exporting.excel"
          @click="doExport('excel')"
        >
          Excel
        </VBtn>
        <VBtn
          v-if="report.rows.length > 0"
          variant="outlined"
          color="error"
          size="small"
          prepend-icon="ri-file-pdf-2-line"
          :loading="exporting.pdf"
          @click="doExport('pdf')"
        >
          PDF
        </VBtn>
      </VCardText>
    </VCard>

    <!-- Empty state: belum pilih klien -->
    <VCard v-if="!filters.klien_ar_id" class="d-flex align-center justify-center" style="min-height: 300px;">
      <VCardText class="text-center text-medium-emphasis">
        <VIcon icon="ri-file-paper-2-line" size="64" class="mb-4 text-disabled" />
        <div class="text-h6 mb-1">Pilih Klien Terlebih Dahulu</div>
        <div class="text-body-2">Rekening koran akan ditampilkan setelah klien dipilih</div>
      </VCardText>
    </VCard>

    <template v-else>
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
                  <div class="text-h6 font-weight-bold">{{ formatCurrency(report.saldo_awal ?? 0) }}</div>
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
                  <div class="text-caption text-medium-emphasis">Total Debit</div>
                  <div class="text-h6 font-weight-bold text-warning">{{ formatCurrency(report.total_debit ?? 0) }}</div>
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
                  <div class="text-caption text-medium-emphasis">Total Kredit</div>
                  <div class="text-h6 font-weight-bold text-success">{{ formatCurrency(report.total_kredit ?? 0) }}</div>
                </div>
              </div>
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="12" sm="6" md="3">
          <VCard>
            <VCardText>
              <div class="d-flex align-center gap-3">
                <VAvatar :color="(report.saldo_akhir ?? 0) > 0 ? 'error' : 'success'" variant="tonal" size="44">
                  <VIcon icon="ri-scale-line" />
                </VAvatar>
                <div>
                  <div class="text-caption text-medium-emphasis">Saldo Akhir</div>
                  <div
                    class="text-h6 font-weight-bold"
                    :class="(report.saldo_akhir ?? 0) > 0 ? 'text-error' : 'text-success'"
                  >
                    {{ formatCurrency(report.saldo_akhir ?? 0) }}
                  </div>
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
            <span v-if="report.klien">
              <strong>{{ report.klien.nama_klien }}</strong>
              <span v-if="report.klien.perusahaan"> &mdash; {{ report.klien.perusahaan }}</span>
            </span>
            &nbsp;&middot;&nbsp;
            Periode: <strong>{{ report.periode_awal ?? '-' }}</strong>
            s/d <strong>{{ report.periode_akhir ?? '-' }}</strong>
            &nbsp;&middot;&nbsp; {{ report.rows?.length ?? 0 }} transaksi
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
          <template #item.tipe="{ item }">
            <VChip
              :color="item.tipe === 'INVOICE' ? 'warning' : 'success'"
              size="x-small"
              variant="tonal"
              label
            >
              {{ item.tipe }}
            </VChip>
          </template>
          <template #item.debit="{ item }">
            <span v-if="item.debit > 0" class="text-warning font-weight-medium">
              {{ formatCurrency(item.debit) }}
            </span>
            <span v-else class="text-disabled">-</span>
          </template>
          <template #item.kredit="{ item }">
            <span v-if="item.kredit > 0" class="text-success font-weight-medium">
              {{ formatCurrency(item.kredit) }}
            </span>
            <span v-else class="text-disabled">-</span>
          </template>
          <template #item.saldo="{ item }">
            <span class="font-weight-bold" :class="item.saldo > 0 ? 'text-error' : 'text-success'">
              {{ formatCurrency(item.saldo) }}
            </span>
          </template>
        </BaseTable>
      </VCard>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useCrud } from '@/composables/useCrud'
import { useLazyFetchAll } from '@/composables/useLazyFetchAll'
import { useFormatter } from '@/composables/useFormatter'
import api from '@/utils/axios'

const { formatCurrency } = useFormatter()
const { items: klienList, loading: klienLoading, fetchAll: fetchKlien } = useCrud('/finance/klien-ar')
const { ensureLoaded: ensureKlienLoaded } = useLazyFetchAll(fetchKlien)

const loading  = ref(false)
const exporting = reactive({ excel: false, pdf: false })
const report   = reactive({
  klien: null,
  periode_awal: null,
  periode_akhir: null,
  saldo_awal: 0,
  total_debit: 0,
  total_kredit: 0,
  saldo_akhir: 0,
  rows: [],
})

const now      = new Date()
const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
const lastDay  = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

const filters = reactive({
  klien_ar_id:   null,
  periode_awal:  firstDay,
  periode_akhir: lastDay,
})

const page    = ref(1)
const perPage = ref(25)

const paginatedRows = computed(() =>
  report.rows.slice((page.value - 1) * perPage.value, page.value * perPage.value)
)

function onTableOptions({ page: p, itemsPerPage }) {
  page.value    = p
  perPage.value = itemsPerPage
}

function onKlienChange() {
  if (filters.klien_ar_id) doFetch()
  else {
    Object.assign(report, { klien: null, saldo_awal: 0, total_debit: 0, total_kredit: 0, saldo_akhir: 0, rows: [] })
  }
}

const headers = [
  { title: 'No',          key: 'no',          sortable: false, width: '50px' },
  { title: 'Tanggal',     key: 'tanggal',     sortable: false, width: '110px' },
  { title: 'Tipe',        key: 'tipe',        sortable: false, width: '100px' },
  { title: 'No. Dokumen', key: 'no_dokumen',  sortable: false },
  { title: 'Keterangan',  key: 'keterangan',  sortable: false },
  { title: 'Debit',       key: 'debit',       sortable: false, align: 'end' },
  { title: 'Kredit',      key: 'kredit',      sortable: false, align: 'end' },
  { title: 'Saldo',       key: 'saldo',       sortable: false, align: 'end' },
]

function buildParams() {
  const params = {}
  if (filters.klien_ar_id)   params.klien_ar_id   = filters.klien_ar_id
  if (filters.periode_awal)  params.periode_awal  = filters.periode_awal
  if (filters.periode_akhir) params.periode_akhir = filters.periode_akhir
  return params
}

async function doFetch() {
  if (!filters.klien_ar_id) return
  page.value    = 1
  loading.value = true
  try {
    const { data } = await api.get('/finance/rekening-koran', { params: buildParams() })
    Object.assign(report, data.data)
  } finally {
    loading.value = false
  }
}

async function doExport(type) {
  exporting[type] = true
  try {
    const endpoint = type === 'excel'
      ? '/finance/rekening-koran/export-excel'
      : '/finance/rekening-koran/export-pdf'

    const mimeType = type === 'excel'
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'application/pdf'

    const ext = type === 'excel' ? 'xlsx' : 'pdf'

    const response = await api.get(endpoint, {
      params: buildParams(),
      responseType: 'blob',
    })

    const url  = URL.createObjectURL(new Blob([response.data], { type: mimeType }))
    const link = document.createElement('a')
    link.href  = url
    link.download = `rekening-koran-${filters.klien_ar_id}-${filters.periode_awal}-${filters.periode_akhir}.${ext}`
    link.click()
    URL.revokeObjectURL(url)
  } finally {
    exporting[type] = false
  }
}
</script>
