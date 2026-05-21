<template>
  <div>
    <PageHeader
      :title="`Rekonsiliasi — ${report.bank_type ?? ''}`"
      :subtitle="report.nama_file ?? 'Detail transaksi'"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Rekonsiliasi Bank', to: { name: 'finance-rekonsiliasi-bank' } },
        { title: 'Detail', disabled: true },
      ]"
    />

    <!-- Info Header -->
    <VCard class="mb-4" v-if="report.id">
      <VCardText>
        <div class="d-flex flex-wrap gap-4 align-center">
          <VChip :color="bankColor(report.bank_type)" variant="tonal" label>
            {{ report.bank_type }}
          </VChip>
          <div>
            <div class="text-caption text-medium-emphasis">Periode</div>
            <div class="text-body-2 font-weight-medium">{{ report.periode_awal }} — {{ report.periode_akhir }}</div>
          </div>
          <div>
            <div class="text-caption text-medium-emphasis">File</div>
            <div class="text-body-2">{{ report.nama_file }}</div>
          </div>
          <div>
            <div class="text-caption text-medium-emphasis">Diupload oleh</div>
            <div class="text-body-2">{{ report.uploaded_by }}</div>
          </div>
          <VSpacer />
          <div class="text-caption text-medium-emphasis text-right">
            {{ report.created_at }}
          </div>
        </div>
      </VCardText>
    </VCard>

    <!-- Summary Cards -->
    <VRow class="mb-4">
      <VCol cols="6" sm="3">
        <VCard>
          <VCardText class="text-center">
            <div class="text-caption text-medium-emphasis">Total Transaksi</div>
            <div class="text-h5 font-weight-bold">{{ report.total_transaksi ?? 0 }}</div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="6" sm="3">
        <VCard>
          <VCardText class="text-center">
            <div class="text-caption text-medium-emphasis">MATCHED</div>
            <div class="text-h5 font-weight-bold text-success">{{ report.jumlah_matched ?? 0 }}</div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="6" sm="3">
        <VCard>
          <VCardText class="text-center">
            <div class="text-caption text-medium-emphasis">UNMATCHED</div>
            <div class="text-h5 font-weight-bold text-error">{{ report.jumlah_unmatched ?? 0 }}</div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="6" sm="3">
        <VCard>
          <VCardText class="text-center">
            <div class="text-caption text-medium-emphasis">Total Kredit</div>
            <div class="text-h5 font-weight-bold text-primary">{{ formatCurrency(report.total_kredit ?? 0) }}</div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Filter Tabs + Table -->
    <VCard>
      <VCardText class="pb-0">
        <VBtnToggle v-model="filterStatus" variant="outlined" mandatory divided density="compact">
          <VBtn value="SEMUA"     size="small" style="min-width: 80px">Semua</VBtn>
          <VBtn value="MATCHED"   size="small" style="min-width: 90px"><span class="text-success">MATCHED</span></VBtn>
          <VBtn value="POSSIBLE"  size="small" style="min-width: 95px"><span class="text-warning">POSSIBLE</span></VBtn>
          <VBtn value="UNMATCHED" size="small" style="min-width: 105px"><span class="text-error">UNMATCHED</span></VBtn>
        </VBtnToggle>
      </VCardText>
      <VDivider class="mt-3" />
      <VProgressLinear v-if="loading" indeterminate color="primary" />
      <BaseTable
        :headers="headers"
        :items="paginatedRows"
        :total="filteredRows.length"
        :loading="loading"
        :per-page="perPage"
        :page="page"
        @update:options="onTableOptions"
      >
        <template #item.no="{ index }">
          {{ (page - 1) * perPage + index + 1 }}
        </template>
        <template #item.debit="{ item }">
          <span v-if="item.debit > 0" class="text-warning font-weight-medium">{{ formatCurrency(item.debit) }}</span>
          <span v-else class="text-disabled">-</span>
        </template>
        <template #item.kredit="{ item }">
          <span v-if="item.kredit > 0" class="text-success font-weight-medium">{{ formatCurrency(item.kredit) }}</span>
          <span v-else class="text-disabled">-</span>
        </template>
        <template #item.saldo="{ item }">
          {{ formatCurrency(item.saldo) }}
        </template>
        <template #item.status_cocok="{ item }">
          <VChip :color="statusColor(item.status_cocok)" size="x-small" variant="tonal" label>
            {{ item.status_cocok }}
          </VChip>
        </template>
        <!-- No Referensi dari transaksi bank -->
        <template #item.no_referensi="{ item }">
          <span v-if="item.no_referensi" class="text-caption font-weight-medium text-primary">
            {{ item.no_referensi }}
          </span>
          <span v-else class="text-disabled">-</span>
        </template>

        <template #item.pembayaran="{ item }">
          <div v-if="item.pembayaran" class="text-caption">
            <div class="font-weight-medium">{{ item.pembayaran.no_referensi || '-' }}</div>
            <div class="text-medium-emphasis">{{ item.pembayaran.tanggal_pembayaran }}</div>
            <div class="text-medium-emphasis">{{ item.pembayaran.klien }}</div>
          </div>
          <span v-else class="text-disabled">-</span>
        </template>

        <!-- Selisih Bank -->
        <template #item.selisih_bank="{ item }">
          <template v-if="item.selisih_bank !== null && item.selisih_bank !== undefined">
            <VChip
              :color="item.selisih_bank === 0 ? 'success' : 'warning'"
              size="x-small"
              variant="tonal"
            >
              {{ item.selisih_bank === 0 ? 'Pas' : formatCurrency(Math.abs(item.selisih_bank)) }}
            </VChip>
          </template>
          <span v-else class="text-disabled">-</span>
        </template>

        <!-- Dicocokkan Oleh -->
        <template #item.matched_by="{ item }">
          <span v-if="item.matched_by" class="text-caption font-weight-medium">{{ item.matched_by }}</span>
          <VChip v-else-if="item.status_cocok === 'MATCHED'" size="x-small" variant="tonal" color="secondary">Auto</VChip>
          <span v-else class="text-disabled">-</span>
        </template>

        <!-- Kelebihan Bayar -->
        <template #item.kelebihan="{ item }">
          <div v-if="item.kelebihan_bayar?.sisa > 0" class="d-flex flex-column align-start gap-1">
            <span class="text-caption text-error font-weight-medium">
              {{ formatCurrency(item.kelebihan_bayar.sisa) }}
            </span>
            <VBtn size="x-small" color="error" variant="tonal" @click="openKelebihanDialog(item)">
              Alokasikan
            </VBtn>
          </div>
          <VChip v-else-if="item.kelebihan_bayar?.total > 0" size="x-small" color="success" variant="tonal">
            Teralokasi
          </VChip>
          <span v-else class="text-disabled">-</span>
        </template>

        <!-- Aksi -->
        <template #item.aksi="{ item }">
          <div class="d-flex gap-1 align-center flex-wrap">
            <template v-if="item.status_cocok === 'UNMATCHED'">
              <VBtn size="x-small" variant="tonal" color="primary" :loading="matchLoading === item.id" @click="openMatchDialog(item)">
                <VIcon start size="14">ri-link-m</VIcon>Cocokkan
              </VBtn>
              <VBtn size="x-small" variant="text" color="grey" :loading="abaikanLoading === item.id" @click="doAbaikan(item)">
                Abaikan
              </VBtn>
            </template>
            <template v-else-if="item.status_cocok === 'POSSIBLE'">
              <VBtn size="x-small" variant="tonal" color="warning" :loading="matchLoading === item.id" @click="openMatchDialog(item)">
                <VIcon start size="14">ri-link-m</VIcon>Cocokkan
              </VBtn>
              <VBtn size="x-small" variant="text" color="grey" :loading="abaikanLoading === item.id" @click="doAbaikan(item)">
                Abaikan
              </VBtn>
            </template>
            <template v-else-if="item.status_cocok === 'MATCHED'">
              <VBtn size="x-small" variant="outlined" color="error" :loading="unmatchLoading === item.id" @click="openUnmatchDialog(item)">
                <VIcon start size="14">ri-link-unlink-m</VIcon>Batalkan
              </VBtn>
            </template>
          </div>
        </template>
      </BaseTable>
    </VCard>

    <!-- ── Dialog: Pilih Pembayaran Manual ── -->
    <VDialog v-model="matchDialog" max-width="750" persistent>
      <VCard>
        <VCardTitle class="pa-4 pb-2"><span class="text-h6">Cocokkan Transaksi Manual</span></VCardTitle>
        <VDivider />
        <VCardText class="pa-4">
          <VCard variant="tonal" color="primary" class="mb-4 pa-3">
            <div class="text-caption text-medium-emphasis mb-1">Transaksi Bank</div>
            <div class="d-flex gap-4 flex-wrap">
              <div><span class="text-caption text-medium-emphasis">Tanggal: </span><span class="text-body-2 font-weight-medium">{{ selectedItem?.tanggal }}</span></div>
              <div><span class="text-caption text-medium-emphasis">Kredit: </span><span class="text-body-2 font-weight-medium text-success">{{ formatCurrency(selectedItem?.kredit ?? 0) }}</span></div>
              <div class="flex-1-1"><span class="text-caption text-medium-emphasis">Keterangan: </span><span class="text-body-2">{{ selectedItem?.keterangan }}</span></div>
            </div>
          </VCard>
          <div class="text-body-2 font-weight-medium mb-2">Pilih Pembayaran yang Cocok:</div>
          <VProgressLinear v-if="kandidatLoading" indeterminate color="primary" class="mb-2" />
          <VAlert v-if="!kandidatLoading && kandidatList.length === 0" type="info" variant="tonal" class="mb-2">
            Tidak ada kandidat pembayaran dalam rentang ±14 hari dengan nominal yang sama.
          </VAlert>
          <div v-if="kandidatList.length > 0">
            <VCard
              v-for="k in kandidatList"
              :key="k.id"
              :variant="selectedPembayaranId === k.id ? 'tonal' : 'outlined'"
              :color="selectedPembayaranId === k.id ? 'primary' : undefined"
              class="mb-2 cursor-pointer"
              @click="selectedPembayaranId = k.id"
            >
              <VCardText class="pa-3">
                <div class="d-flex align-center gap-2">
                  <VIcon :color="selectedPembayaranId === k.id ? 'primary' : 'grey'" size="18">
                    {{ selectedPembayaranId === k.id ? 'ri-radio-button-fill' : 'ri-checkbox-blank-circle-line' }}
                  </VIcon>
                  <div class="flex-1-1">
                    <div class="d-flex flex-wrap gap-x-4 gap-y-1">
                      <div><span class="text-caption text-medium-emphasis">Klien: </span><span class="text-body-2 font-weight-medium">{{ k.klien ?? '-' }}</span></div>
                      <div><span class="text-caption text-medium-emphasis">No Invoice: </span><span class="text-body-2">{{ k.no_invoice ?? '-' }}</span></div>
                      <div><span class="text-caption text-medium-emphasis">Tgl Bayar: </span><span class="text-body-2">{{ k.tanggal_pembayaran }}</span></div>
                      <div><span class="text-caption text-medium-emphasis">No Ref: </span><span class="text-body-2">{{ k.no_referensi || '-' }}</span></div>
                      <div><span class="text-caption text-medium-emphasis">Nominal: </span><span class="text-body-2 font-weight-medium text-success">{{ formatCurrency(k.jumlah_pembayaran) }}</span></div>
                    </div>
                    <div v-if="k.keterangan" class="text-caption text-medium-emphasis mt-1">{{ k.keterangan }}</div>
                  </div>
                </div>
              </VCardText>
            </VCard>
          </div>
          <VAlert v-if="matchError" type="error" variant="tonal" class="mt-3">{{ matchError }}</VAlert>
        </VCardText>
        <VDivider />
        <VCardActions class="pa-4">
          <VSpacer />
          <VBtn variant="text" @click="closeMatchDialog">Batal</VBtn>
          <VBtn color="primary" variant="tonal" :disabled="!selectedPembayaranId || kandidatLoading" :loading="matchSaving" @click="doManualMatch">
            Simpan Cocok
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- ── Dialog: Konfirmasi Batalkan Cocok ── -->
    <VDialog v-model="unmatchDialog" max-width="400" persistent>
      <VCard>
        <VCardTitle class="pa-4 pb-2"><span class="text-h6">Batalkan Cocok Transaksi</span></VCardTitle>
        <VDivider />
        <VCardText class="pa-4">
          <p class="text-body-2 mb-0">
            Apakah Anda yakin ingin membatalkan cocok transaksi ini?
            Status akan kembali ke <strong>UNMATCHED</strong>.
          </p>
        </VCardText>
        <VDivider />
        <VCardActions class="pa-4">
          <VSpacer />
          <VBtn variant="text" @click="unmatchDialog = false">Batal</VBtn>
          <VBtn color="error" variant="tonal" :loading="unmatchSaving" @click="doUnmatch">Ya, Batalkan</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- ── Dialog: Alokasikan Kelebihan Bayar ── -->
    <VDialog v-model="kelebihanDialog" max-width="700" persistent>
      <VCard>
        <VCardTitle class="pa-4 pb-2"><span class="text-h6">Alokasikan Kelebihan Bayar</span></VCardTitle>
        <VDivider />
        <VCardText class="pa-4">
          <!-- Info kelebihan -->
          <VCard variant="tonal" color="error" class="mb-4 pa-3">
            <div class="d-flex flex-wrap gap-x-6 gap-y-1">
              <div>
                <div class="text-caption text-medium-emphasis">Sumber Invoice</div>
                <div class="text-body-2 font-weight-medium">{{ kelebihanItem?.pembayaran?.klien ?? '-' }}</div>
              </div>
              <div>
                <div class="text-caption text-medium-emphasis">Total Kelebihan</div>
                <div class="text-body-2 font-weight-medium">{{ formatCurrency(kelebihanItem?.kelebihan_bayar?.total ?? 0) }}</div>
              </div>
              <div>
                <div class="text-caption text-medium-emphasis">Sudah Dialokasi</div>
                <div class="text-body-2">{{ formatCurrency(kelebihanItem?.kelebihan_bayar?.sudah_dialokasi ?? 0) }}</div>
              </div>
              <div>
                <div class="text-caption text-medium-emphasis">Sisa Kelebihan</div>
                <div class="text-body-2 font-weight-bold text-error">{{ formatCurrency(kelebihanItem?.kelebihan_bayar?.sisa ?? 0) }}</div>
              </div>
            </div>
          </VCard>

          <!-- Pilih invoice B2C -->
          <div class="text-body-2 font-weight-medium mb-2">Pilih Invoice B2C (klien yang sama):</div>
          <VProgressLinear v-if="invoiceB2CLoading" indeterminate color="primary" class="mb-2" />
          <VAlert v-if="!invoiceB2CLoading && invoiceB2CList.length === 0" type="info" variant="tonal" class="mb-3">
            Tidak ada invoice B2C yang terbuka untuk klien ini.
          </VAlert>
          <div v-if="invoiceB2CList.length > 0" class="mb-3">
            <VCard
              v-for="inv in invoiceB2CList"
              :key="inv.id"
              :variant="selectedInvoiceId === inv.id ? 'tonal' : 'outlined'"
              :color="selectedInvoiceId === inv.id ? 'primary' : undefined"
              class="mb-2 cursor-pointer"
              @click="selectedInvoiceId = inv.id"
            >
              <VCardText class="pa-3">
                <div class="d-flex align-center gap-2">
                  <VIcon :color="selectedInvoiceId === inv.id ? 'primary' : 'grey'" size="18">
                    {{ selectedInvoiceId === inv.id ? 'ri-radio-button-fill' : 'ri-checkbox-blank-circle-line' }}
                  </VIcon>
                  <div class="flex-1-1 d-flex flex-wrap gap-x-4 gap-y-1">
                    <div><span class="text-caption text-medium-emphasis">No Invoice: </span><span class="text-body-2 font-weight-medium">{{ inv.no_invoice }}</span></div>
                    <div><span class="text-caption text-medium-emphasis">Tanggal: </span><span class="text-body-2">{{ inv.tanggal }}</span></div>
                    <div><span class="text-caption text-medium-emphasis">Total: </span><span class="text-body-2">{{ formatCurrency(inv.total_tagihan) }}</span></div>
                    <div><span class="text-caption text-medium-emphasis">Sisa: </span><span class="text-body-2 font-weight-medium text-warning">{{ formatCurrency(inv.sisa_tagihan) }}</span></div>
                    <VChip :color="statusInvoiceColor(inv.status)" size="x-small" variant="tonal">{{ inv.status }}</VChip>
                  </div>
                </div>
              </VCardText>
            </VCard>
          </div>

          <!-- Form jumlah & keterangan -->
          <VRow v-if="invoiceB2CList.length > 0">
            <VCol cols="12" md="6">
              <VTextField
                v-model.number="kelebihanJumlah"
                label="Jumlah Dialokasikan"
                type="number"
                :hint="`Maks: ${formatCurrency(kelebihanItem?.kelebihan_bayar?.sisa ?? 0)}`"
                persistent-hint
                density="compact"
                prefix="Rp"
              />
            </VCol>
            <VCol cols="12" md="6">
              <VTextField v-model="kelebihanKeterangan" label="Keterangan (opsional)" density="compact" />
            </VCol>
          </VRow>

          <!-- Riwayat alokasi -->
          <template v-if="kelebihanItem?.kelebihan_bayar?.riwayat?.length > 0">
            <VDivider class="my-3" />
            <div class="text-body-2 font-weight-medium mb-2">Riwayat Alokasi Sebelumnya:</div>
            <VCard variant="outlined" class="pa-2">
              <div
                v-for="r in kelebihanItem.kelebihan_bayar.riwayat"
                :key="r.id"
                class="d-flex gap-2 text-caption py-1"
              >
                <span class="font-weight-medium">{{ r.no_invoice }}</span>
                <span>—</span>
                <span class="text-success">{{ formatCurrency(r.jumlah) }}</span>
                <span>—</span>
                <span class="text-medium-emphasis">{{ r.tanggal }}</span>
                <span>—</span>
                <span class="text-medium-emphasis">oleh {{ r.created_by }}</span>
              </div>
            </VCard>
          </template>

          <VAlert v-if="kelebihanError" type="error" variant="tonal" class="mt-3">{{ kelebihanError }}</VAlert>
        </VCardText>
        <VDivider />
        <VCardActions class="pa-4">
          <VSpacer />
          <VBtn variant="text" @click="closeKelebihanDialog">Batal</VBtn>
          <VBtn
            color="error"
            variant="tonal"
            :disabled="!selectedInvoiceId || !kelebihanJumlah || kelebihanJumlah <= 0 || invoiceB2CLoading"
            :loading="kelebihanSaving"
            @click="doAlokasikanKelebihan"
          >
            Alokasikan
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useFormatter } from '@/composables/useFormatter'
import api from '@/utils/axios'

const route = useRoute()
const { formatCurrency } = useFormatter()

const loading = ref(false)
const report  = reactive({
  id: null, bank_type: null, nama_file: null,
  periode_awal: null, periode_akhir: null,
  total_transaksi: 0, total_kredit: 0,
  jumlah_matched: 0, jumlah_unmatched: 0,
  uploaded_by: null, created_at: null,
  details: [],
})

const filterStatus    = ref('SEMUA')
const page            = ref(1)
const perPage         = ref(25)
const abaikanLoading  = ref(null)
const matchLoading    = ref(null)
const unmatchLoading  = ref(null)

// ── Match dialog ──
const matchDialog          = ref(false)
const selectedItem         = ref(null)
const selectedPembayaranId = ref(null)
const kandidatList         = ref([])
const kandidatLoading      = ref(false)
const matchSaving          = ref(false)
const matchError           = ref(null)

// ── Unmatch dialog ──
const unmatchDialog  = ref(false)
const unmatchItem    = ref(null)
const unmatchSaving  = ref(false)

// ── Kelebihan dialog ──
const kelebihanDialog     = ref(false)
const kelebihanItem       = ref(null)
const invoiceB2CList      = ref([])
const invoiceB2CLoading   = ref(false)
const selectedInvoiceId   = ref(null)
const kelebihanJumlah     = ref(null)
const kelebihanKeterangan = ref('')
const kelebihanSaving     = ref(false)
const kelebihanError      = ref(null)

const filteredRows = computed(() => {
  if (filterStatus.value === 'SEMUA') return report.details
  return report.details.filter(d => d.status_cocok === filterStatus.value)
})

const paginatedRows = computed(() => {
  if (perPage.value === -1) return filteredRows.value
  const start = (page.value - 1) * perPage.value
  return filteredRows.value.slice(start, start + perPage.value)
})

watch(filterStatus, () => { page.value = 1 })

function onTableOptions({ page: p, itemsPerPage }) {
  page.value    = p
  perPage.value = itemsPerPage
}

const bankColor   = (t) => ({ BCA: 'info', MANDIRI: 'warning', BNI: 'error', BRI: 'primary', CIMB: 'deep-purple', BSI: 'green' }[t] ?? 'secondary')
const statusColor = (s) => ({ MATCHED: 'success', POSSIBLE: 'warning', UNMATCHED: 'error', DIABAIKAN: 'grey' }[s] ?? 'grey')
const statusInvoiceColor = (s) => ({ LUNAS: 'success', SEBAGIAN: 'warning', TERKIRIM: 'info', DRAFT: 'grey' }[s] ?? 'grey')

const headers = [
  { title: 'No',             key: 'no',            sortable: false, width: '50px' },
  { title: 'Tanggal',        key: 'tanggal',       sortable: false, width: '110px' },
  { title: 'Keterangan',     key: 'keterangan',    sortable: false },
  { title: 'No Ref Bank',    key: 'no_referensi',  sortable: false, width: '140px' },
  { title: 'Debit',          key: 'debit',         sortable: false, align: 'end' },
  { title: 'Kredit',         key: 'kredit',        sortable: false, align: 'end' },
  { title: 'Saldo',          key: 'saldo',         sortable: false, align: 'end' },
  { title: 'Status',         key: 'status_cocok',  sortable: false, width: '110px' },
  { title: 'Cocok Dengan',   key: 'pembayaran',    sortable: false },
  { title: 'Selisih',        key: 'selisih_bank',  sortable: false, width: '90px', align: 'center' },
  { title: 'Dicocokkan Oleh',key: 'matched_by',    sortable: false, width: '130px' },
  { title: 'Kelebihan',      key: 'kelebihan',     sortable: false, width: '120px' },
  { title: 'Aksi',           key: 'aksi',          sortable: false, width: '160px' },
]

async function fetchDetail() {
  loading.value = true
  try {
    const { data } = await api.get(`/finance/rekonsiliasi-bank/${route.params.id}`)
    Object.assign(report, data.data)
  } finally {
    loading.value = false
  }
}

async function doAbaikan(item) {
  abaikanLoading.value = item.id
  try {
    await api.patch(`/finance/rekonsiliasi-bank/detail/${item.id}/abaikan`)
    const wasUnmatched = item.status_cocok === 'UNMATCHED'
    item.status_cocok = 'DIABAIKAN'
    item.pembayaran   = null
    if (wasUnmatched) report.jumlah_unmatched = Math.max(0, report.jumlah_unmatched - 1)
  } finally {
    abaikanLoading.value = null
  }
}

// ── Manual Match ──
async function openMatchDialog(item) {
  selectedItem.value         = item
  selectedPembayaranId.value = null
  kandidatList.value         = []
  matchError.value           = null
  matchDialog.value          = true
  matchLoading.value         = item.id

  kandidatLoading.value = true
  try {
    const { data } = await api.get(`/finance/rekonsiliasi-bank/detail/${item.id}/kandidat`)
    kandidatList.value = data.data ?? []
  } finally {
    kandidatLoading.value = false
    matchLoading.value    = null
  }
}

function closeMatchDialog() {
  matchDialog.value          = false
  selectedItem.value         = null
  selectedPembayaranId.value = null
  kandidatList.value         = []
  matchError.value           = null
}

async function doManualMatch() {
  if (!selectedPembayaranId.value || !selectedItem.value) return
  matchSaving.value = true
  matchError.value  = null
  try {
    const { data } = await api.patch(
      `/finance/rekonsiliasi-bank/detail/${selectedItem.value.id}/match`,
      { pembayaran_ar_id: selectedPembayaranId.value },
    )
    const updated = data.data
    const row = report.details.find(d => d.id === selectedItem.value.id)
    if (row) {
      const wasUnmatched = row.status_cocok === 'UNMATCHED'
      row.status_cocok  = updated.status_cocok
      row.pembayaran    = updated.pembayaran
      row.matched_by    = updated.matched_by
      row.selisih_bank  = updated.selisih_bank ?? 0
      report.jumlah_matched++
      if (wasUnmatched) report.jumlah_unmatched = Math.max(0, report.jumlah_unmatched - 1)
    }
    closeMatchDialog()
  } catch (err) {
    matchError.value = err?.response?.data?.message ?? 'Terjadi kesalahan, coba lagi.'
  } finally {
    matchSaving.value = false
  }
}

// ── Unmatch ──
function openUnmatchDialog(item) {
  unmatchItem.value   = item
  unmatchDialog.value = true
}

async function doUnmatch() {
  if (!unmatchItem.value) return
  unmatchSaving.value  = true
  unmatchLoading.value = unmatchItem.value.id
  try {
    await api.patch(`/finance/rekonsiliasi-bank/detail/${unmatchItem.value.id}/unmatch`)
    const row = report.details.find(d => d.id === unmatchItem.value.id)
    if (row) {
      row.status_cocok   = 'UNMATCHED'
      row.pembayaran     = null
      row.matched_by     = null
      row.selisih_bank   = null
      row.kelebihan_bayar = null
      report.jumlah_matched   = Math.max(0, report.jumlah_matched - 1)
      report.jumlah_unmatched++
    }
    unmatchDialog.value  = false
    unmatchItem.value    = null
  } finally {
    unmatchSaving.value  = false
    unmatchLoading.value = null
  }
}

// ── Kelebihan Bayar ──
async function openKelebihanDialog(item) {
  kelebihanItem.value       = item
  selectedInvoiceId.value   = null
  kelebihanJumlah.value     = item.kelebihan_bayar?.sisa ?? null
  kelebihanKeterangan.value = ''
  kelebihanError.value      = null
  invoiceB2CList.value      = []
  kelebihanDialog.value     = true

  invoiceB2CLoading.value = true
  try {
    const { data } = await api.get(`/finance/rekonsiliasi-bank/detail/${item.id}/invoice-b2c`)
    invoiceB2CList.value = data.data ?? []
  } finally {
    invoiceB2CLoading.value = false
  }
}

function closeKelebihanDialog() {
  kelebihanDialog.value     = false
  kelebihanItem.value       = null
  selectedInvoiceId.value   = null
  kelebihanJumlah.value     = null
  kelebihanKeterangan.value = ''
  kelebihanError.value      = null
  invoiceB2CList.value      = []
}

async function doAlokasikanKelebihan() {
  if (!selectedInvoiceId.value || !kelebihanJumlah.value) return
  kelebihanSaving.value = true
  kelebihanError.value  = null
  try {
    await api.post(`/finance/rekonsiliasi-bank/detail/${kelebihanItem.value.id}/kelebihan`, {
      invoice_id : selectedInvoiceId.value,
      jumlah     : kelebihanJumlah.value,
      keterangan : kelebihanKeterangan.value || null,
    })
    // Refresh data baris dari server agar kelebihan_bayar terupdate
    await fetchDetail()
    closeKelebihanDialog()
  } catch (err) {
    kelebihanError.value = err?.response?.data?.message ?? 'Terjadi kesalahan, coba lagi.'
  } finally {
    kelebihanSaving.value = false
  }
}

onMounted(fetchDetail)
</script>
