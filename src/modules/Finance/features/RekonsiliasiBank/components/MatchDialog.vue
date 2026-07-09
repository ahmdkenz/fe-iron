<template>
  <VDialog :model-value="modelValue && !showBuktiStep" max-width="680" persistent scrollable @update:model-value="onDialogUpdate">
    <VCard>
      <VCardTitle class="pa-4 pb-2"><span class="text-h6">Cocokkan Transaksi</span></VCardTitle>
      <VDivider />
      <VCardText class="pa-4" style="max-height: 70vh">
        <!-- Info bank yang akan otomatis jadi data pembayaran -->
        <VCard variant="tonal" color="primary" class="mb-4 pa-3">
          <div class="text-caption text-medium-emphasis mb-2 font-weight-medium">Data Pembayaran Otomatis dari Bank</div>
          <div class="d-flex gap-4 flex-wrap">
            <div>
              <div class="text-caption text-medium-emphasis">Tanggal Bayar</div>
              <div class="text-body-2 font-weight-medium">{{ formatDate(item?.tanggal) }}</div>
            </div>
            <div>
              <div class="text-caption text-medium-emphasis">No Referensi</div>
              <div class="text-body-2 font-weight-medium text-primary">{{ item?.no_referensi || '-' }}</div>
            </div>
            <div>
              <div class="text-caption text-medium-emphasis">Jumlah</div>
              <div class="text-body-2 font-weight-medium text-success">{{ formatCurrency(item?.kredit ?? 0) }}</div>
            </div>
            <div>
              <div class="text-caption text-medium-emphasis">Metode</div>
              <div class="text-body-2 font-weight-medium">TRANSFER</div>
            </div>
          </div>
        </VCard>

        <!-- ── Section: Invoice Opening Balance ── -->
        <div class="d-flex align-center gap-2 mb-2">
          <VIcon size="18" color="deep-purple">ri-bookmark-line</VIcon>
          <span class="text-body-2 font-weight-medium">Invoice Opening Balance</span>
        </div>
        <VTextField
          v-model="obSearch"
          placeholder="Cari no invoice OB atau nama klien..."
          density="compact"
          variant="outlined"
          prepend-inner-icon="ri-search-line"
          clearable
          class="mb-3"
          hide-details
          @input="onObSearchInput"
          @click:clear="obSearch = ''; fetchCandidates('ob')"
        />

        <VProgressLinear v-if="obLoading" indeterminate color="primary" class="mb-2" rounded />
        <VAlert v-if="!obLoading && obCandidates.length === 0" type="info" variant="tonal" density="compact" class="mb-2">
          Tidak ada invoice Opening Balance yang terbuka.
        </VAlert>

        <div v-if="obCandidates.length > 0" class="d-flex flex-column gap-2">
          <VCard
            v-for="inv in obCandidates"
            :key="inv.id"
            :variant="selectedInvoiceId === inv.id ? 'tonal' : 'outlined'"
            :color="selectedInvoiceId === inv.id ? 'primary' : undefined"
            class="cursor-pointer"
            @click="selectedInvoiceId = inv.id"
          >
            <VCardText class="pa-3">
              <div class="d-flex align-center gap-2">
                <VIcon :color="selectedInvoiceId === inv.id ? 'primary' : 'grey'" size="18">
                  {{ selectedInvoiceId === inv.id ? 'ri-radio-button-fill' : 'ri-checkbox-blank-circle-line' }}
                </VIcon>
                <div class="flex-1-1 min-width-0">
                  <div class="d-flex align-center gap-2 flex-wrap mb-1">
                    <span class="text-body-2 font-weight-semibold">{{ inv.no_invoice }}</span>
                    <VChip :color="statusInvoiceColor(inv.status)" size="x-small" variant="tonal">{{ inv.status }}</VChip>
                    <VChip v-if="inv.is_opening_balance" color="deep-purple" size="x-small" variant="tonal">OB</VChip>
                  </div>
                  <div class="d-flex flex-wrap gap-x-3 gap-y-0">
                    <span class="text-caption text-medium-emphasis">{{ inv.nama_klien ?? '-' }}</span>
                    <span class="text-caption text-medium-emphasis">Tgl: {{ formatDate(inv.tanggal) }}</span>
                    <span class="text-caption text-medium-emphasis">Total: {{ formatCurrency(inv.total_tagihan) }}</span>
                    <span class="text-caption font-weight-medium text-warning">Sisa: {{ formatCurrency(inv.sisa_tagihan) }}</span>
                  </div>
                  <div v-if="inv.nama_resto" class="d-flex flex-wrap gap-x-2 mt-0.5">
                    <span class="text-caption text-primary">{{ inv.nama_resto }}</span>
                  </div>
                </div>
              </div>
            </VCardText>
          </VCard>
        </div>

        <div v-if="obCandidates.length > 0" class="d-flex align-center justify-space-between mt-2">
          <span class="text-caption text-medium-emphasis">Menampilkan {{ obCandidates.length }} dari {{ obTotal }}</span>
          <VBtn v-if="obHasMore" size="small" variant="text" color="primary" :loading="obLoadingMore" @click="loadMore('ob')">
            Muat lagi
          </VBtn>
        </div>

        <!-- ── OB: pilih invoice reguler periode sebelumnya yang ikut dilunaskan ── -->
        <div v-if="selectedIsOb" class="mt-3">
          <VCard variant="outlined" color="deep-purple" class="pa-3">
            <div class="d-flex align-center justify-space-between mb-1">
              <span class="text-body-2 font-weight-medium">Lunaskan Invoice Reguler Periode Sebelumnya</span>
              <VBtn
                v-if="settleableInvoices.length"
                size="x-small"
                variant="text"
                color="primary"
                @click="toggleSelectAllSettle"
              >
                {{ selectedSettleIds.length === settleableInvoices.length ? 'Hapus semua' : 'Pilih semua' }}
              </VBtn>
            </div>
            <div class="text-caption text-medium-emphasis mb-2">
              Invoice reguler yang tercantum di rincian OB ini akan otomatis LUNAS sesuai nominalnya.
            </div>

            <VProgressLinear v-if="settleableLoading" indeterminate color="primary" class="mb-2" rounded />
            <VAlert v-else-if="!settleableInvoices.length" type="info" variant="tonal" density="compact">
              Tidak ada invoice reguler yang bisa dilunaskan otomatis untuk OB ini.
            </VAlert>
            <template v-else>
              <div style="max-height: 200px; overflow-y: auto;">
                <VCheckbox
                  v-for="inv in settleableInvoices"
                  :key="inv.id"
                  v-model="selectedSettleIds"
                  :value="inv.id"
                  density="compact"
                  hide-details
                >
                  <template #label>
                    <div class="d-flex flex-column">
                      <span class="text-body-2">{{ inv.no_invoice }}</span>
                      <span class="text-caption text-medium-emphasis">
                        {{ formatDate(inv.tanggal_invoice) }} · Sisa {{ formatCurrency(inv.sisa_tagihan) }}
                      </span>
                    </div>
                  </template>
                </VCheckbox>
              </div>
              <div class="d-flex justify-space-between text-caption mt-2">
                <span>Total dipilih:</span>
                <strong :class="settleExceeds ? 'text-error' : 'text-success'">{{ formatCurrency(selectedSettleTotal) }}</strong>
              </div>
              <VAlert v-if="settleExceeds" type="warning" variant="tonal" density="compact" class="mt-2">
                Total invoice yang dipilih melebihi jumlah transaksi bank ({{ formatCurrency(item?.kredit ?? 0) }}).
              </VAlert>
            </template>
          </VCard>
        </div>

        <VDivider class="my-4" />

        <!-- ── Section: Invoice Reguler ── -->
        <div class="d-flex align-center gap-2 mb-2">
          <VIcon size="18" color="primary">ri-file-list-3-line</VIcon>
          <span class="text-body-2 font-weight-medium">Invoice Reguler</span>
        </div>
        <VTextField
          v-model="regularSearch"
          placeholder="Cari no invoice atau nama klien..."
          density="compact"
          variant="outlined"
          prepend-inner-icon="ri-search-line"
          clearable
          class="mb-3"
          hide-details
          @input="onRegularSearchInput"
          @click:clear="regularSearch = ''; fetchCandidates('regular')"
        />

        <VProgressLinear v-if="regularLoading" indeterminate color="primary" class="mb-2" rounded />
        <VAlert v-if="!regularLoading && regularCandidates.length === 0" type="info" variant="tonal" density="compact" class="mb-2">
          Tidak ada invoice reguler yang terbuka. Coba ubah kata kunci pencarian.
        </VAlert>

        <div v-if="regularCandidates.length > 0" class="d-flex flex-column gap-2">
          <VCard
            v-for="inv in regularCandidates"
            :key="inv.id"
            :variant="selectedInvoiceId === inv.id ? 'tonal' : 'outlined'"
            :color="selectedInvoiceId === inv.id ? 'primary' : undefined"
            class="cursor-pointer"
            @click="selectedInvoiceId = inv.id"
          >
            <VCardText class="pa-3">
              <div class="d-flex align-center gap-2">
                <VIcon :color="selectedInvoiceId === inv.id ? 'primary' : 'grey'" size="18">
                  {{ selectedInvoiceId === inv.id ? 'ri-radio-button-fill' : 'ri-checkbox-blank-circle-line' }}
                </VIcon>
                <div class="flex-1-1 min-width-0">
                  <div class="d-flex align-center gap-2 flex-wrap mb-1">
                    <span class="text-body-2 font-weight-semibold">{{ inv.no_invoice }}</span>
                    <VChip :color="statusInvoiceColor(inv.status)" size="x-small" variant="tonal">{{ inv.status }}</VChip>
                  </div>
                  <div class="d-flex flex-wrap gap-x-3 gap-y-0">
                    <span class="text-caption text-medium-emphasis">{{ inv.nama_klien ?? '-' }}</span>
                    <span class="text-caption text-medium-emphasis">Tgl: {{ formatDate(inv.tanggal) }}</span>
                    <span class="text-caption text-medium-emphasis">Total: {{ formatCurrency(inv.total_tagihan) }}</span>
                    <span class="text-caption font-weight-medium text-warning">Sisa: {{ formatCurrency(inv.sisa_tagihan) }}</span>
                  </div>
                  <div v-if="inv.nama_resto" class="d-flex flex-wrap gap-x-2 mt-0.5">
                    <span class="text-caption text-primary">{{ inv.nama_resto }}</span>
                  </div>
                </div>
              </div>
            </VCardText>
          </VCard>
        </div>

        <div v-if="regularCandidates.length > 0" class="d-flex align-center justify-space-between mt-2">
          <span class="text-caption text-medium-emphasis">Menampilkan {{ regularCandidates.length }} dari {{ regularTotal }}</span>
          <VBtn v-if="regularHasMore" size="small" variant="text" color="primary" :loading="regularLoadingMore" @click="loadMore('regular')">
            Muat lagi
          </VBtn>
        </div>

        <VAlert v-if="matchError" type="error" variant="tonal" class="mt-3" density="compact">{{ matchError }}</VAlert>
      </VCardText>
      <VDivider />
      <VCardActions class="pa-4">
        <VSpacer />
        <VBtn variant="text" @click="onDialogUpdate(false)">Batal</VBtn>
        <VBtn color="primary" variant="tonal" :disabled="!selectedInvoiceId || obLoading || regularLoading" @click="proceedToBuktiStep">
          <VIcon start size="16">ri-arrow-right-line</VIcon>Lanjutkan
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <BuktiBayarDialog
    v-model:file="buktiBayar"
    :model-value="modelValue && showBuktiStep"
    :saving="matchSaving"
    :error-message="matchError"
    :file-error="buktiBayarError"
    @update:model-value="onDialogUpdate"
    @back="showBuktiStep = false"
    @confirm="doManualMatch"
  />
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useFormatter } from '@/composables/useFormatter'
import api from '@/utils/axios'
import BuktiBayarDialog from './BuktiBayarDialog.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  item: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'matched', 'connection-error'])

const { formatCurrency, formatDate } = useFormatter()

const statusInvoiceColor = s => ({ LUNAS: 'success', SEBAGIAN: 'warning', TERKIRIM: 'info', DRAFT: 'grey' }[s] ?? 'grey')

const selectedInvoiceId  = ref(null)
const matchSaving        = ref(false)
const matchError         = ref(null)
const buktiBayar         = ref([])
const buktiBayarError    = ref(null)
const showBuktiStep      = ref(false)

const PER_PAGE = 50

// Section: Invoice Opening Balance
const obCandidates  = ref([])
const obSearch      = ref('')
const obLoading     = ref(false)
const obLoadingMore = ref(false)
const obPage        = ref(1)
const obLastPage    = ref(1)
const obTotal       = ref(0)
let   obTimer       = null

// Section: Invoice Reguler
const regularCandidates  = ref([])
const regularSearch      = ref('')
const regularLoading     = ref(false)
const regularLoadingMore = ref(false)
const regularPage        = ref(1)
const regularLastPage    = ref(1)
const regularTotal       = ref(0)
let   regularTimer       = null

const obHasMore      = computed(() => obPage.value < obLastPage.value)
const regularHasMore = computed(() => regularPage.value < regularLastPage.value)

// OB: pelunasan invoice reguler periode sebelumnya
const settleableLoading  = ref(false)
const settleableInvoices = ref([])
const selectedSettleIds  = ref([])

const selectedIsOb = computed(() =>
  obCandidates.value.some(inv => inv.id === selectedInvoiceId.value),
)

const selectedSettleTotal = computed(() =>
  settleableInvoices.value
    .filter(inv => selectedSettleIds.value.includes(inv.id))
    .reduce((sum, inv) => sum + Number(inv.sisa_tagihan || 0), 0),
)

const settleExceeds = computed(() =>
  selectedSettleTotal.value > Number(props.item?.kredit || 0) + 0.01,
)

function toggleSelectAllSettle() {
  selectedSettleIds.value = selectedSettleIds.value.length === settleableInvoices.value.length
    ? []
    : settleableInvoices.value.map(inv => inv.id)
}

async function loadSettleableOriginals(obInvoiceId) {
  settleableInvoices.value = []
  selectedSettleIds.value  = []
  if (!obInvoiceId) return

  settleableLoading.value = true
  try {
    const { data } = await api.get(`/finance/invoices/${obInvoiceId}/settleable-originals`)
    settleableInvoices.value = data?.data?.invoices ?? []
    selectedSettleIds.value  = settleableInvoices.value.map(inv => inv.id)
  } catch {
    settleableInvoices.value = []
    selectedSettleIds.value  = []
  } finally {
    settleableLoading.value = false
  }
}

watch(selectedInvoiceId, id => {
  if (id && selectedIsOb.value) {
    loadSettleableOriginals(id)
  } else {
    settleableInvoices.value = []
    selectedSettleIds.value  = []
  }
})

async function fetchCandidates(type, { append = false } = {}) {
  const id = props.item?.id
  if (!id) return
  const isOb   = type === 'ob'
  const search = isOb ? obSearch.value : regularSearch.value
  const page   = append ? (isOb ? obPage.value : regularPage.value) + 1 : 1

  if (append) {
    if (isOb) obLoadingMore.value = true
    else regularLoadingMore.value = true
  } else {
    if (isOb) obLoading.value = true
    else regularLoading.value = true
  }

  try {
    const { data } = await api.get(`/finance/rekonsiliasi-bank/detail/${id}/invoice-candidates`, {
      params: { search: search || undefined, type, page, per_page: PER_PAGE },
    })
    const items    = data.data?.data ?? []
    const lastPage = data.data?.last_page ?? 1
    const total    = data.data?.total ?? items.length

    if (isOb) {
      obCandidates.value = append ? [...obCandidates.value, ...items] : items
      obPage.value       = page
      obLastPage.value   = lastPage
      obTotal.value      = total
    } else {
      regularCandidates.value = append ? [...regularCandidates.value, ...items] : items
      regularPage.value       = page
      regularLastPage.value   = lastPage
      regularTotal.value      = total
    }
  } catch (err) {
    // Jangan sembunyikan kegagalan sebagai "daftar kosong": kosongkan daftar
    // terkait lalu tampilkan pesan error agar bisa dibedakan dari hasil nihil.
    if (!append) {
      if (isOb) obCandidates.value = []
      else regularCandidates.value = []
    }
    matchError.value = err?.response?.data?.message
      ?? 'Gagal memuat daftar invoice. Periksa koneksi lalu coba lagi.'
  } finally {
    if (append) {
      if (isOb) obLoadingMore.value = false
      else regularLoadingMore.value = false
    } else {
      if (isOb) obLoading.value = false
      else regularLoading.value = false
    }
  }
}

function loadMore(type) {
  fetchCandidates(type, { append: true })
}

function onObSearchInput() {
  clearTimeout(obTimer)
  obTimer = setTimeout(() => fetchCandidates('ob'), 400)
}

function onRegularSearchInput() {
  clearTimeout(regularTimer)
  regularTimer = setTimeout(() => fetchCandidates('regular'), 400)
}

function resetState() {
  selectedInvoiceId.value  = null
  obCandidates.value       = []
  obSearch.value           = ''
  obPage.value              = 1
  obLastPage.value          = 1
  obTotal.value             = 0

  regularCandidates.value  = []
  regularSearch.value      = ''
  regularPage.value        = 1
  regularLastPage.value    = 1
  regularTotal.value       = 0
  matchError.value         = null
  buktiBayar.value         = []
  buktiBayarError.value    = null
  showBuktiStep.value      = false
  settleableInvoices.value = []
  selectedSettleIds.value  = []
  clearTimeout(obTimer)
  clearTimeout(regularTimer)
}

watch(() => props.modelValue, open => {
  if (!open) {
    resetState()
    return
  }
  resetState()
  fetchCandidates('ob')
  fetchCandidates('regular')
}, { immediate: true })

function onDialogUpdate(value) {
  emit('update:modelValue', value)
}

function proceedToBuktiStep() {
  if (!selectedInvoiceId.value || !props.item) return
  if (selectedIsOb.value && settleExceeds.value) {
    matchError.value = 'Total invoice reguler yang dipilih melebihi jumlah transaksi bank.'
    return
  }
  matchError.value = null
  showBuktiStep.value = true
}

async function doManualMatch() {
  if (!selectedInvoiceId.value || !props.item) return
  if (selectedIsOb.value && settleExceeds.value) {
    matchError.value = 'Total invoice reguler yang dipilih melebihi jumlah transaksi bank.'
    return
  }
  matchSaving.value    = true
  matchError.value     = null
  buktiBayarError.value = null
  try {
    const payload = new FormData()
    payload.append('invoice_id', selectedInvoiceId.value)
    if (selectedIsOb.value) {
      selectedSettleIds.value.forEach(id => payload.append('settle_original_invoice_ids[]', id))
    }
    const file = Array.isArray(buktiBayar.value) ? buktiBayar.value[0] : buktiBayar.value
    if (file instanceof File) payload.append('bukti_pembayaran', file)

    const { data } = await api.post(
      `/finance/rekonsiliasi-bank/detail/${props.item.id}/catat-bayar`,
      payload,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    emit('matched', { itemId: props.item.id, updated: data.data })
    emit('update:modelValue', false)
  } catch (err) {
    if (!err?.response || err?.code === 'ECONNABORTED') {
      // Koneksi terputus/timeout: server mungkin sudah menyimpan. Minta parent
      // memuat ulang data otoritatif agar tidak salah lapor "gagal".
      emit('update:modelValue', false)
      emit('connection-error', 'Koneksi terputus saat menyimpan. Data telah dimuat ulang — silakan periksa status transaksi.')
    } else {
      const fieldErrors = err?.response?.data?.errors
      if (fieldErrors?.bukti_pembayaran) {
        buktiBayarError.value = fieldErrors.bukti_pembayaran[0]
      }
      matchError.value = fieldErrors
        ? Object.values(fieldErrors).flat()[0]
        : (err?.response?.data?.message ?? 'Terjadi kesalahan, coba lagi.')
    }
  } finally {
    matchSaving.value = false
  }
}
</script>
