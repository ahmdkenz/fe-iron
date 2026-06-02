<template>
  <div>
    <!-- Filter -->
    <VCard class="mb-4">
      <VCardText class="d-flex flex-wrap gap-3 align-center">
        <VTextField
          v-model="filters.tanggal_dari"
          label="Dari Tanggal"
          type="date"
          density="compact"
          hide-details
          style="max-width: 180px"
          @update:model-value="doFetch"
        />
        <VTextField
          v-model="filters.tanggal_sampai"
          label="Sampai Tanggal"
          type="date"
          density="compact"
          hide-details
          style="max-width: 180px"
          @update:model-value="doFetch"
        />
        <VAutocomplete
          v-model="filters.investor_id"
          placeholder="Semua Investor"
          clearable
          hide-details
          density="compact"
          style="max-width: 240px"
          :items="investorList"
          item-title="nama_investor"
          item-value="id"
          :loading="investorLoading"
          @focus="ensureInvestorLoaded()"
          @update:model-value="doFetch"
        />
        <VSelect
          v-model="filters.status"
          placeholder="Semua Status"
          clearable
          hide-details
          density="compact"
          style="max-width: 160px"
          :items="statusOptions"
          item-title="label"
          item-value="value"
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
      <VCol cols="12" sm="6" md="4">
        <VCard>
          <VCardText>
            <div class="d-flex align-center gap-3">
              <VAvatar color="deep-purple" variant="tonal" size="44">
                <VIcon icon="ri-time-line" />
              </VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">Total PDM Aktif</div>
                <div class="text-h6 font-weight-bold">{{ formatCurrency(summary.total_aktif) }}</div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="4">
        <VCard color="error" variant="tonal">
          <VCardText class="pa-3">
            <div class="text-caption font-weight-medium mb-1">Total PDM Dibatalkan</div>
            <div class="text-subtitle-1 font-weight-bold">{{ formatCurrency(summary.total_dibatalkan) }}</div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="4">
        <VCard color="primary" variant="tonal">
          <VCardText class="pa-3">
            <div class="text-caption font-weight-medium mb-1">Jumlah Record</div>
            <div class="text-subtitle-1 font-weight-bold">{{ summary.jumlah_record }}</div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Tabel -->
    <VCard>
      <VProgressLinear v-if="loading" indeterminate color="deep-purple" />
      <BaseTable
        :headers="headers"
        :items="paginatedRows"
        :total="totalRows"
        :loading="loading"
        :per-page="perPage"
        :page="page"
        @update:options="onTableOptions"
      >
        <template #item.no="{ index }">
          {{ (page - 1) * perPage + index + 1 }}
        </template>

        <template #item.tanggal_pencatatan="{ item }">
          <span class="font-weight-medium">{{ formatDate(item.tanggal_pencatatan) }}</span>
        </template>

        <template #item.klien="{ item }">
          <span class="text-body-2 font-weight-medium">{{ item.klien ?? '-' }}</span>
        </template>

        <template #item.investor="{ item }">
          <span class="text-caption">{{ item.investor ?? '-' }}</span>
        </template>

        <template #item.no_referensi_sumber="{ item }">
          <span class="text-caption font-mono">{{ item.no_referensi_sumber ?? '-' }}</span>
        </template>

        <template #item.jumlah="{ item }">
          <div>
            <div class="font-weight-bold">{{ formatCurrency(item.jumlah) }}</div>
            <div v-if="item.status === 'AKTIF' && item.sisa_pdm < item.jumlah" class="text-caption text-warning">
              Sisa: {{ formatCurrency(item.sisa_pdm) }}
            </div>
          </div>
        </template>

        <template #item.status="{ item }">
          <VChip
            size="x-small"
            :color="statusColor(item.status)"
            variant="tonal"
          >
            {{ item.status }}
          </VChip>
        </template>

        <template #item.keterangan="{ item }">
          <span class="text-caption text-medium-emphasis">{{ item.keterangan ?? '-' }}</span>
        </template>

        <template #item.created_by="{ item }">
          <span class="text-caption">{{ item.created_by ?? '-' }}</span>
        </template>

        <template #item.aksi="{ item }">
          <VBtn
            v-if="item.status === 'AKTIF'"
            size="x-small"
            variant="tonal"
            color="deep-purple"
            @click="openGunakanDialog(item)"
          >
            Gunakan
          </VBtn>
          <span v-else class="text-disabled text-caption">-</span>
        </template>
      </BaseTable>
    </VCard>

    <!-- Dialog: Gunakan PDM untuk Invoice -->
    <VDialog v-model="gunakanDialog" max-width="560" persistent>
      <VCard>
        <VCardTitle class="d-flex align-center gap-2 pa-4 pb-3">
          <VIcon color="deep-purple" size="20">ri-exchange-dollar-line</VIcon>
          <span class="text-h6">Gunakan PDM untuk Melunasi Invoice</span>
        </VCardTitle>
        <VDivider />

        <VCardText class="pa-4">
          <!-- Info PDM -->
          <div class="rounded-lg pa-3 mb-4" style="background: rgba(103,58,183,0.06); border: 1px solid rgba(103,58,183,0.2)">
            <div class="d-flex flex-wrap gap-4">
              <div>
                <div class="text-caption text-medium-emphasis">Klien</div>
                <div class="text-body-2 font-weight-semibold">{{ selectedPdm?.klien ?? '-' }}</div>
              </div>
              <div>
                <div class="text-caption text-medium-emphasis">No Ref Sumber</div>
                <div class="text-body-2">{{ selectedPdm?.no_referensi_sumber ?? '-' }}</div>
              </div>
              <div>
                <div class="text-caption text-medium-emphasis">Sisa PDM Tersedia</div>
                <div class="text-body-2 font-weight-bold text-deep-purple">{{ formatCurrency(selectedPdm?.sisa_pdm ?? 0) }}</div>
              </div>
            </div>
          </div>

          <!-- Pilih Invoice -->
          <div class="text-body-2 font-weight-medium mb-2">Pilih Invoice / Opening Balance</div>
          <VProgressLinear v-if="invoiceLoading" indeterminate color="deep-purple" class="mb-3" rounded />
          <VAlert
            v-if="!invoiceLoading && invoiceList.length === 0"
            type="info"
            variant="tonal"
            density="compact"
            class="mb-3"
          >
            Tidak ada invoice terbuka untuk klien ini.
          </VAlert>

          <VAutocomplete
            v-if="invoiceList.length > 0"
            v-model="gunakanForm.invoice_id"
            label="Pilih Invoice"
            :items="invoiceList"
            item-title="label"
            item-value="id"
            hide-details="auto"
            density="compact"
            clearable
            class="mb-4"
            @update:model-value="onInvoiceSelected"
          />

          <!-- Input Jumlah -->
          <VTextField
            v-model.number="gunakanForm.jumlah"
            label="Jumlah Digunakan"
            type="number"
            :hint="gunakanForm.invoice_id ? `Maks: ${formatCurrency(maxJumlah)}` : ''"
            persistent-hint
            density="compact"
            variant="outlined"
            prefix="Rp"
            class="mb-4"
          />

          <!-- Keterangan -->
          <VTextField
            v-model="gunakanForm.keterangan"
            label="Keterangan (opsional)"
            density="compact"
            variant="outlined"
          />

          <VAlert v-if="gunakanError" type="error" variant="tonal" density="compact" class="mt-3">
            {{ gunakanError }}
          </VAlert>
        </VCardText>

        <VDivider />
        <VCardActions class="pa-4 gap-2">
          <VSpacer />
          <VBtn variant="text" @click="closeGunakanDialog">Batal</VBtn>
          <VBtn
            color="deep-purple"
            variant="flat"
            :loading="gunakanSaving"
            :disabled="!gunakanForm.invoice_id || !gunakanForm.jumlah || gunakanForm.jumlah <= 0"
            @click="doGunakan"
          >
            <VIcon start size="16">ri-check-line</VIcon>
            Alokasikan
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useCrud } from '@/composables/useCrud'
import { useLazyFetchAll } from '@/composables/useLazyFetchAll'
import { useFormatter } from '@/composables/useFormatter'
import { useSweetAlert } from '@/composables/useSweetAlert'
import api from '@/utils/axios'

const { formatCurrency, formatDate } = useFormatter()
const { showError, showSuccess } = useSweetAlert()

const { items: investorList, loading: investorLoading, fetchAll: fetchInvestor } = useCrud('/master/investor')
const { ensureLoaded: ensureInvestorLoaded } = useLazyFetchAll(fetchInvestor)

const loading  = ref(false)
const exporting = ref(false)

const now      = new Date()
const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
const lastDay  = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

const filters = reactive({
  tanggal_dari:  firstDay,
  tanggal_sampai: lastDay,
  investor_id:   null,
  status:        null,
})

const summary   = reactive({ total_aktif: 0, total_dibatalkan: 0, jumlah_record: 0 })
const rows      = ref([])
const totalRows = ref(0)
const page      = ref(1)
const perPage   = ref(15)

const paginatedRows = computed(() =>
  rows.value.slice((page.value - 1) * perPage.value, page.value * perPage.value)
)

function onTableOptions({ page: p, itemsPerPage }) {
  page.value    = p
  perPage.value = itemsPerPage
}

const headers = [
  { title: 'No',               key: 'no',                   sortable: false, width: '50px' },
  { title: 'Tanggal',          key: 'tanggal_pencatatan',   sortable: false, width: '120px' },
  { title: 'Klien',            key: 'klien',                sortable: false },
  { title: 'Investor',         key: 'investor',             sortable: false },
  { title: 'No Ref Sumber',    key: 'no_referensi_sumber',  sortable: false },
  { title: 'Jumlah PDM',       key: 'jumlah',               sortable: false, align: 'end' },
  { title: 'Status',           key: 'status',               sortable: false, width: '110px' },
  { title: 'Keterangan',       key: 'keterangan',           sortable: false },
  { title: 'Dicatat Oleh',     key: 'created_by',           sortable: false, width: '130px' },
  { title: 'Aksi',             key: 'aksi',                 sortable: false, width: '100px' },
]

const statusOptions = [
  { label: 'Aktif',      value: 'AKTIF'      },
  { label: 'Dibatalkan', value: 'DIBATALKAN' },
  { label: 'Terpakai',   value: 'TERPAKAI'   },
]

function statusColor(status) {
  return { AKTIF: 'deep-purple', DIBATALKAN: 'error', TERPAKAI: 'success' }[status] ?? 'grey'
}

function buildParams() {
  const p = {}
  if (filters.tanggal_dari)   p.tanggal_dari   = filters.tanggal_dari
  if (filters.tanggal_sampai) p.tanggal_sampai = filters.tanggal_sampai
  if (filters.investor_id)    p.investor_id    = filters.investor_id
  if (filters.status)         p.status         = filters.status
  return p
}

async function doFetch() {
  page.value    = 1
  loading.value = true
  try {
    const { data } = await api.get('/finance/pendapatan-di-muka', { params: buildParams() })
    rows.value  = data.data ?? []
    totalRows.value = data.meta?.total ?? rows.value.length
    Object.assign(summary, data.summary ?? {})
  } catch (err) {
    const msg = err.response?.data?.message ?? 'Gagal memuat laporan Pendapatan di Muka.'
    showError({ text: msg })
  } finally {
    loading.value = false
  }
}

async function doExport() {
  exporting.value = true
  try {
    const response = await api.get('/finance/pendapatan-di-muka/export-excel', {
      params:       buildParams(),
      responseType: 'blob',
    })
    const url  = URL.createObjectURL(new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }))
    const link    = document.createElement('a')
    link.href     = url
    link.download = `PENDAPATAN-DI-MUKA-${buildTimestamp()}.xlsx`
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

// ── Dialog: Gunakan PDM ──
const gunakanDialog  = ref(false)
const selectedPdm    = ref(null)
const invoiceList    = ref([])
const invoiceLoading = ref(false)
const gunakanError   = ref(null)
const gunakanSaving  = ref(false)
const maxJumlah      = ref(0)

const gunakanForm = reactive({
  invoice_id: null,
  jumlah:     null,
  keterangan: '',
})

async function openGunakanDialog(pdm) {
  selectedPdm.value      = pdm
  gunakanForm.invoice_id = null
  gunakanForm.jumlah     = null
  gunakanForm.keterangan = ''
  gunakanError.value     = null
  invoiceList.value      = []
  maxJumlah.value        = pdm.sisa_pdm ?? pdm.jumlah
  gunakanDialog.value    = true

  invoiceLoading.value = true
  try {
    const { data } = await api.get('/finance/invoices', {
      params: { klien_ar_id: pdm.klien_ar_id, per_page: 100 },
    })
    const allInvoices = data.data?.data ?? data.data ?? []
    invoiceList.value = allInvoices
      .filter(inv => inv.status !== 'LUNAS' && inv.status !== 'DRAFT')
      .map(inv => ({
        id:    inv.id,
        label: `${inv.no_invoice} — ${inv.status} — Sisa: Rp ${Number(inv.sisa_tagihan ?? 0).toLocaleString('id-ID')}`,
        sisa_tagihan: inv.sisa_tagihan ?? 0,
      }))
  } catch {
    // diam — tabel kosong sudah tampil pesan
  } finally {
    invoiceLoading.value = false
  }
}

function onInvoiceSelected(invoiceId) {
  const inv = invoiceList.value.find(i => i.id === invoiceId)
  if (inv) {
    const sisaInv = Number(inv.sisa_tagihan)
    const sisaPdm = Number(selectedPdm.value?.sisa_pdm ?? 0)
    maxJumlah.value    = Math.min(sisaInv, sisaPdm)
    gunakanForm.jumlah = maxJumlah.value > 0 ? maxJumlah.value : null
  }
}

function closeGunakanDialog() {
  gunakanDialog.value    = false
  selectedPdm.value      = null
  invoiceList.value      = []
  gunakanError.value     = null
  gunakanForm.invoice_id = null
  gunakanForm.jumlah     = null
  gunakanForm.keterangan = ''
}

async function doGunakan() {
  if (!selectedPdm.value || !gunakanForm.invoice_id || !gunakanForm.jumlah) return
  gunakanSaving.value = true
  gunakanError.value  = null
  try {
    await api.post(`/finance/pendapatan-di-muka/${selectedPdm.value.id}/gunakan`, {
      invoice_id: gunakanForm.invoice_id,
      jumlah:     gunakanForm.jumlah,
      keterangan: gunakanForm.keterangan || null,
    })
    showSuccess({ text: 'PDM berhasil digunakan untuk melunasi invoice.' })
    closeGunakanDialog()
    doFetch()
  } catch (err) {
    gunakanError.value = err.response?.data?.message ?? 'Terjadi kesalahan, coba lagi.'
  } finally {
    gunakanSaving.value = false
  }
}

onMounted(doFetch)
</script>
