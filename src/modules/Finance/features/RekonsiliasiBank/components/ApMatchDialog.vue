<template>
  <VDialog
    v-model="isOpen"
    max-width="760"
    scrollable
    persistent
  >
    <VCard rounded="lg">
      <VCardTitle class="pa-4 pb-3 d-flex align-center justify-space-between">
        <div class="d-flex align-center gap-3">
          <div class="header-icon">
            <VIcon
              icon="ri-bank-card-2-line"
              size="20"
              color="white"
            />
          </div>
          <div>
            <div class="text-h6 font-weight-bold">
              Cocokkan Payment Voucher AP
            </div>
            <div class="text-caption text-medium-emphasis">
              Alokasikan mutasi debit ke satu atau beberapa tagihan vendor
            </div>
          </div>
        </div>
        <VBtn
          icon
          variant="text"
          size="small"
          @click="isOpen = false"
        >
          <VIcon icon="ri-close-line" />
        </VBtn>
      </VCardTitle>
      <VDivider />

      <VCardText
        class="pa-4"
        style="max-height: 70vh; overflow-y: auto;"
      >
        <div class="bank-summary mb-4 d-flex align-start gap-3">
          <div class="bank-summary-icon">
            <VIcon
              icon="ri-arrow-right-up-line"
              size="18"
              color="white"
            />
          </div>
          <div class="min-width-0">
            <div class="text-caption text-medium-emphasis">
              Nominal Debit Bank
            </div>
            <div class="text-h6 font-weight-bold text-primary">
              {{ formatCurrency(item?.debit ?? 0) }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ formatDate(item?.tanggal) }} &middot; {{ item?.keterangan }}
            </div>
          </div>
        </div>

        <div class="section-label mb-2">
          Detail Voucher
        </div>
        <VRow
          dense
          class="mb-4"
        >
          <VCol
            cols="12"
            sm="6"
          >
            <VSelect
              v-model="kategoriVoucher"
              label="Kategori Voucher"
              :items="kategoriOptions"
              item-title="label"
              item-value="value"
              variant="outlined"
              density="compact"
              :error-messages="kategoriError"
            />
          </VCol>
          <VCol
            cols="12"
            sm="6"
          >
            <VTextField
              v-model="keterangan"
              label="Keterangan (opsional)"
              variant="outlined"
              density="compact"
            />
          </VCol>
        </VRow>

        <div class="d-flex align-center justify-space-between mb-3">
          <span class="section-label mb-0">Alokasi Tagihan AP</span>
          <VBtn
            color="primary"
            size="small"
            variant="tonal"
            prepend-icon="ri-add-line"
            @click="openPicker"
          >
            Tambah Tagihan
          </VBtn>
        </div>

        <div
          v-if="allocations.length === 0"
          class="empty-state mb-4"
        >
          <VIcon
            icon="ri-file-list-3-line"
            size="36"
            class="mb-2 d-block"
          />
          <div class="text-body-2 font-weight-medium">
            Belum ada tagihan dipilih
          </div>
          <div class="text-caption">
            Klik "Tambah Tagihan" untuk memilih tagihan outstanding vendor
          </div>
        </div>

        <table
          v-else
          class="allocation-table w-100 mb-4"
        >
          <thead>
            <tr>
              <th class="text-left">
                No. Tagihan
              </th>
              <th class="text-left">
                Vendor
              </th>
              <th class="text-right">
                Sisa Tagihan
              </th>
              <th
                class="text-right"
                style="width: 180px;"
              >
                Jumlah Dibayar
              </th>
              <th style="width: 48px;" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, idx) in allocations"
              :key="row.tagihan_ap_id"
            >
              <td>
                <VChip
                  color="primary"
                  size="small"
                  variant="tonal"
                  label
                >
                  {{ row.no_tagihan }}
                </VChip>
              </td>
              <td>{{ row.vendor ?? '-' }}</td>
              <td class="text-right text-error">
                {{ formatCurrency(row.sisa_tagihan) }}
              </td>
              <td>
                <VTextField
                  v-model.number="row.jumlah"
                  type="number"
                  density="compact"
                  variant="outlined"
                  hide-details
                  prefix="Rp"
                  @update:model-value="v => clampJumlah(row, v)"
                />
              </td>
              <td class="text-center">
                <VBtn
                  icon
                  size="small"
                  variant="text"
                  color="error"
                  @click="removeAllocation(idx)"
                >
                  <VIcon
                    icon="ri-delete-bin-line"
                    size="18"
                  />
                </VBtn>
              </td>
            </tr>
          </tbody>
        </table>

        <VAlert
          :type="isBalanced ? 'success' : 'error'"
          :icon="isBalanced ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'"
          variant="tonal"
          density="comfortable"
          class="mb-4"
        >
          <div class="d-flex justify-space-between align-center flex-wrap gap-4">
            <div>
              <div
                class="text-caption"
                style="opacity: .75;"
              >
                Total Alokasi
              </div>
              <div class="text-body-1 font-weight-bold">
                {{ formatCurrency(totalAlokasi) }}
              </div>
            </div>
            <div class="text-end">
              <div
                class="text-caption"
                style="opacity: .75;"
              >
                Selisih
              </div>
              <div class="text-body-1 font-weight-bold">
                {{ formatCurrency(selisih) }}
              </div>
            </div>
          </div>
        </VAlert>

        <VDivider class="mb-4" />

        <VFileInput
          v-model="buktiFile"
          label="Bukti Pembayaran (opsional)"
          density="compact"
          variant="outlined"
          accept="application/pdf,image/jpeg,image/jpg,image/png"
          prepend-icon=""
          prepend-inner-icon="ri-attachment-line"
          :error-messages="buktiError"
          hint="PDF, JPG, atau PNG — maks 10 MB"
          persistent-hint
        />

        <VAlert
          v-if="matchError"
          type="error"
          variant="tonal"
          density="compact"
          class="mt-4"
        >
          {{ matchError }}
        </VAlert>
      </VCardText>

      <VDivider />
      <VCardActions class="pa-4">
        <VSpacer />
        <AppActionButton
          action="batalkan"
          @click="isOpen = false"
        />
        <AppActionButton
          action="cocokkan"
          :loading="saving"
          :disabled="!canSubmit"
          @click="doSubmit"
        />
      </VCardActions>
    </VCard>

    <TagihanApMultiPickerDialog
      v-model="pickerDialog"
      :tagihan-list="candidateList"
      :loading="candidateLoading"
      :disabled-ids="allocations.map(a => a.tagihan_ap_id)"
      @search="fetchCandidates"
      @confirm="onPickerConfirm"
    />
  </VDialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useFormatter } from '@/composables/useFormatter'
import api from '@/utils/axios'
import TagihanApMultiPickerDialog from '@/modules/AP/features/PembayaranAp/components/TagihanApMultiPickerDialog.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  item: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'matched', 'connection-error'])

const { formatCurrency, formatDate } = useFormatter()

const isOpen = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const kategoriOptions = [
  { label: 'Bahan Baku (BB)', value: 'BB' },
  { label: 'Non Bahan Baku (NBB)', value: 'NBB' },
]

const kategoriVoucher = ref(null)
const keterangan       = ref('')
const allocations       = ref([])
const buktiFile         = ref(null)
const saving            = ref(false)
const matchError        = ref('')
const kategoriError     = ref('')
const buktiError        = ref('')

const pickerDialog      = ref(false)
const candidateList     = ref([])
const candidateLoading  = ref(false)
let candidateAbort      = null

const totalAlokasi = computed(() =>
  allocations.value.reduce((sum, row) => sum + (Number(row.jumlah) || 0), 0))

const selisih = computed(() => round2((Number(props.item?.debit) || 0) - totalAlokasi.value))
const isBalanced = computed(() => Math.abs(selisih.value) <= 0.01)

const canSubmit = computed(() =>
  !!kategoriVoucher.value
  && allocations.value.length > 0
  && allocations.value.every(row => Number(row.jumlah) > 0)
  && isBalanced.value)

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100
}

function resetState() {
  kategoriVoucher.value = null
  keterangan.value      = ''
  allocations.value     = []
  buktiFile.value       = null
  matchError.value      = ''
  kategoriError.value   = ''
  buktiError.value      = ''
  candidateList.value   = []
}

watch(isOpen, open => {
  if (!open) return
  resetState()
  fetchCandidates()
}, { immediate: true })

async function fetchCandidates(search = '') {
  candidateAbort?.abort()

  const controller = new AbortController()

  candidateAbort = controller
  candidateLoading.value = true
  try {
    const { data } = await api.get(`/finance/rekonsiliasi-bank/detail/${props.item.id}/tagihan-ap-candidates`, {
      params: { search: search || undefined, per_page: 50 },
      signal: controller.signal,
    })

    candidateList.value = data.data?.data ?? data.data ?? []
  } catch (err) {
    if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return
    candidateList.value = []
  } finally {
    if (candidateAbort === controller) candidateLoading.value = false
  }
}

function openPicker() {
  pickerDialog.value = true
}

function onPickerConfirm(selectedRows) {
  const existingIds = new Set(allocations.value.map(a => a.tagihan_ap_id))
  let pool = Math.max(0, round2((Number(props.item?.debit) || 0) - totalAlokasi.value))

  selectedRows.forEach(t => {
    if (existingIds.has(t.id)) return
    const sisa   = Number(t.sisa_tagihan) || 0
    const jumlah = round2(Math.min(sisa, pool))

    pool = round2(Math.max(0, pool - jumlah))

    allocations.value.push({
      tagihan_ap_id: t.id,
      no_tagihan: t.no_tagihan,
      vendor: t.vendor,
      sisa_tagihan: sisa,
      jumlah,
    })
  })
  matchError.value = ''
}

function clampJumlah(row, val) {
  if (val > row.sisa_tagihan) row.jumlah = row.sisa_tagihan
  if (val < 0) row.jumlah = 0
}

function removeAllocation(idx) {
  allocations.value.splice(idx, 1)
}

async function doSubmit() {
  matchError.value    = ''
  kategoriError.value = ''
  buktiError.value    = ''

  if (!kategoriVoucher.value) {
    kategoriError.value = 'Kategori voucher wajib dipilih.'

    return
  }
  if (!allocations.value.length) {
    matchError.value = 'Pilih minimal 1 tagihan.'

    return
  }
  if (!isBalanced.value) {
    matchError.value = 'Total alokasi harus sama dengan nominal debit bank.'

    return
  }

  saving.value = true
  try {
    const payload = new FormData()

    payload.append('kategori_voucher', kategoriVoucher.value)
    if (keterangan.value) payload.append('keterangan', keterangan.value)

    const file = Array.isArray(buktiFile.value) ? buktiFile.value[0] : buktiFile.value
    if (file instanceof File) payload.append('bukti_pembayaran', file)

    allocations.value.forEach((row, idx) => {
      payload.append(`alokasi[${idx}][tagihan_ap_id]`, row.tagihan_ap_id)
      payload.append(`alokasi[${idx}][jumlah]`, row.jumlah)
    })

    await api.post(`/finance/rekonsiliasi-bank/detail/${props.item.id}/catat-voucher-ap`, payload)

    isOpen.value = false
    emit('matched')
  } catch (err) {
    if (!err?.response || err?.code === 'ECONNABORTED') {
      isOpen.value = false
      emit('connection-error', 'Koneksi terputus. Data telah dimuat ulang — silakan periksa status transaksi.')

      return
    }

    const errors = err?.response?.data?.errors
    if (errors?.bukti_pembayaran) buktiError.value = errors.bukti_pembayaran[0]
    else if (errors?.kategori_voucher) kategoriError.value = errors.kategori_voucher[0]
    else matchError.value = err?.response?.data?.message ?? 'Gagal mencatat voucher, coba lagi.'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.header-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgb(var(--v-theme-primary));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.bank-summary {
  background: rgba(var(--v-theme-primary), 0.06);
  border: 1px solid rgba(var(--v-theme-primary), 0.15);
  border-radius: 10px;
  padding: 12px 16px;
}

.bank-summary-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgb(var(--v-theme-primary));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.section-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.empty-state {
  text-align: center;
  padding: 32px 16px;
  border: 1px dashed rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 10px;
  color: rgba(var(--v-theme-on-surface), 0.5);
}

.allocation-table {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 10px;
  border-collapse: separate;
  border-spacing: 0;
  overflow: hidden;
}

.allocation-table th,
.allocation-table td {
  padding: 8px 10px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.allocation-table th {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.6);
  background: rgba(var(--v-theme-on-surface), 0.03);
}

.allocation-table tbody tr:hover {
  background: rgba(var(--v-theme-primary), 0.03);
}

.allocation-table tbody tr:last-child td {
  border-bottom: none;
}
</style>
