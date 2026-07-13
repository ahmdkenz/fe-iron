<template>
  <VDialog :model-value="modelValue" max-width="680" persistent scrollable @update:model-value="$emit('update:modelValue', $event)">
    <VCard>
      <VCardTitle class="d-flex align-center gap-2 pa-4 pb-3">
        <VIcon color="warning" size="20">ri-exchange-dollar-line</VIcon>
        <span class="text-h6">Alokasikan Kelebihan Bayar</span>
      </VCardTitle>
      <VDivider />

      <VCardText class="pa-4" style="max-height: 70vh">
        <div class="d-flex flex-wrap gap-4 align-center rounded-lg pa-3 mb-4 bg-error-subtle">
          <div>
            <div class="text-caption text-medium-emphasis">Klien</div>
            <div class="text-body-2 font-weight-semibold">{{ item?.pembayaran?.klien ?? '-' }}</div>
          </div>
          <VDivider vertical class="align-self-stretch" />
          <div>
            <div class="text-caption text-medium-emphasis">Total Kelebihan</div>
            <div class="text-body-2 font-weight-semibold">{{ formatCurrency(item?.kelebihan_bayar?.total ?? 0) }}</div>
          </div>
          <VDivider vertical class="align-self-stretch" />
          <div>
            <div class="text-caption text-medium-emphasis">Sudah Dialokasi</div>
            <div class="text-body-2">{{ formatCurrency(item?.kelebihan_bayar?.sudah_dialokasi ?? 0) }}</div>
          </div>
          <VDivider vertical class="align-self-stretch" />
          <div>
            <div class="text-caption text-medium-emphasis">Sisa Kelebihan</div>
            <div class="text-body-2 font-weight-bold text-error">{{ formatCurrency(item?.kelebihan_bayar?.sisa ?? 0) }}</div>
          </div>
        </div>

        <div class="text-caption text-medium-emphasis text-uppercase font-weight-medium mb-2" style="letter-spacing: 0.6px">
          Pilih Invoice B2C (investor yang sama)
        </div>

        <VProgressLinear v-if="invoiceB2CLoading" indeterminate color="primary" class="mb-3" rounded />
        <VAlert v-if="!invoiceB2CLoading && invoiceB2CList.length === 0" type="info" variant="tonal" density="compact" class="mb-3">
          Tidak ada invoice B2C yang terbuka untuk investor ini.
        </VAlert>

        <div v-if="invoiceB2CList.length > 0" class="d-flex flex-column gap-2 mb-3">
          <div
            class="d-flex align-center px-1 mb-1"
            @click.stop="toggleAllB2C"
          >
            <VCheckbox
              :model-value="allB2CSelected"
              :indeterminate="someB2CSelected && !allB2CSelected"
              color="primary"
              density="compact"
              hide-details
              readonly
              class="flex-0-0 mt-0"
            />
            <span class="text-body-2 ms-1 cursor-pointer">Pilih Semua</span>
          </div>
          <div
            v-for="inv in invoiceB2CList"
            :key="inv.id"
            class="rounded-lg cursor-pointer"
            style="border: 2px solid; transition: border-color 0.15s, background 0.15s"
            :style="selectedInvoices[inv.id]
              ? 'border-color: rgb(var(--v-theme-primary)); background: rgba(var(--v-theme-primary), 0.06)'
              : 'border-color: rgba(var(--v-border-color), 0.28)'"
            @click="toggleInvoice(inv)"
          >
            <div class="d-flex align-center gap-3 pa-3" :class="{ 'pb-2': selectedInvoices[inv.id] }">
              <VCheckbox
                :model-value="!!selectedInvoices[inv.id]"
                color="primary"
                density="compact"
                hide-details
                readonly
                class="flex-0-0 mt-0"
              />
              <div class="flex-1-1 min-width-0">
                <div class="d-flex align-center gap-2 flex-wrap">
                  <span class="text-body-2 font-weight-semibold">{{ inv.no_invoice }}</span>
                  <VChip :color="statusInvoiceColor(inv.status)" size="x-small" variant="tonal">{{ inv.status }}</VChip>
                </div>
                <div class="d-flex flex-wrap gap-x-3 gap-y-0 mt-1">
                  <span class="text-caption text-medium-emphasis">{{ formatDate(inv.tanggal) }}</span>
                  <span class="text-caption text-medium-emphasis">Total: {{ formatCurrency(inv.total_tagihan) }}</span>
                  <span class="text-caption font-weight-medium text-warning">Sisa: {{ formatCurrency(inv.sisa_tagihan) }}</span>
                </div>
                <div v-if="inv.nama_resto || inv.nama_klien" class="d-flex flex-wrap gap-x-2 mt-0.5">
                  <span v-if="inv.nama_resto" class="text-caption text-primary">{{ inv.nama_resto }}</span>
                  <span v-else-if="inv.nama_klien" class="text-caption text-primary">{{ inv.nama_klien }}</span>
                </div>
              </div>
            </div>
            <div v-if="selectedInvoices[inv.id]" class="d-flex gap-3 px-3 pb-3" @click.stop>
              <VTextField
                v-model.number="selectedInvoices[inv.id].jumlah"
                label="Jumlah Dialokasikan"
                type="number"
                :hint="`Maks: ${formatCurrency(inv.sisa_tagihan)}`"
                persistent-hint
                density="compact"
                variant="outlined"
                prefix="Rp"
                style="max-width: 220px"
                @click.stop
              />
              <VTextField
                v-model="selectedInvoices[inv.id].keterangan"
                label="Keterangan (opsional)"
                density="compact"
                variant="outlined"
                class="flex-1-1"
                @click.stop
              />
            </div>
          </div>
        </div>

        <div class="text-caption text-medium-emphasis text-uppercase font-weight-medium mb-2 mt-4" style="letter-spacing: 0.6px">
          Pilih Invoice B2B (klien yang sama)
        </div>

        <VProgressLinear v-if="invoiceB2BLoading" indeterminate color="primary" class="mb-3" rounded />
        <VAlert v-if="!invoiceB2BLoading && invoiceB2BList.length === 0" type="info" variant="tonal" density="compact" class="mb-3">
          Tidak ada invoice B2B yang terbuka untuk klien ini.
        </VAlert>

        <div v-if="invoiceB2BList.length > 0" class="d-flex flex-column gap-2 mb-3">
          <div
            class="d-flex align-center px-1 mb-1"
            @click.stop="toggleAllB2B"
          >
            <VCheckbox
              :model-value="allB2BSelected"
              :indeterminate="someB2BSelected && !allB2BSelected"
              color="primary"
              density="compact"
              hide-details
              readonly
              class="flex-0-0 mt-0"
            />
            <span class="text-body-2 ms-1 cursor-pointer">Pilih Semua</span>
          </div>
          <div
            v-for="inv in invoiceB2BList"
            :key="inv.id"
            class="rounded-lg cursor-pointer"
            style="border: 2px solid; transition: border-color 0.15s, background 0.15s"
            :style="selectedInvoices[inv.id]
              ? 'border-color: rgb(var(--v-theme-primary)); background: rgba(var(--v-theme-primary), 0.06)'
              : 'border-color: rgba(var(--v-border-color), 0.28)'"
            @click="toggleInvoice(inv)"
          >
            <div class="d-flex align-center gap-3 pa-3" :class="{ 'pb-2': selectedInvoices[inv.id] }">
              <VCheckbox
                :model-value="!!selectedInvoices[inv.id]"
                color="primary"
                density="compact"
                hide-details
                readonly
                class="flex-0-0 mt-0"
              />
              <div class="flex-1-1 min-width-0">
                <div class="d-flex align-center gap-2 flex-wrap">
                  <span class="text-body-2 font-weight-semibold">{{ inv.no_invoice }}</span>
                  <VChip :color="statusInvoiceColor(inv.status)" size="x-small" variant="tonal">{{ inv.status }}</VChip>
                  <VChip v-if="inv.is_opening_balance" color="deep-purple" size="x-small" variant="tonal">OB</VChip>
                </div>
                <div class="d-flex flex-wrap gap-x-3 gap-y-0 mt-1">
                  <span class="text-caption text-medium-emphasis">{{ formatDate(inv.tanggal) }}</span>
                  <span class="text-caption text-medium-emphasis">Total: {{ formatCurrency(inv.total_tagihan) }}</span>
                  <span class="text-caption font-weight-medium text-warning">Sisa: {{ formatCurrency(inv.sisa_tagihan) }}</span>
                </div>
                <div v-if="inv.nama_klien" class="d-flex flex-wrap gap-x-2 mt-0.5">
                  <span class="text-caption text-primary">{{ inv.nama_klien }}</span>
                </div>
              </div>
            </div>
            <div v-if="selectedInvoices[inv.id]" class="d-flex gap-3 px-3 pb-3" @click.stop>
              <VTextField
                v-model.number="selectedInvoices[inv.id].jumlah"
                label="Jumlah Dialokasikan"
                type="number"
                :hint="`Maks: ${formatCurrency(inv.sisa_tagihan)}`"
                persistent-hint
                density="compact"
                variant="outlined"
                prefix="Rp"
                style="max-width: 220px"
                @click.stop
              />
              <VTextField
                v-model="selectedInvoices[inv.id].keterangan"
                label="Keterangan (opsional)"
                density="compact"
                variant="outlined"
                class="flex-1-1"
                @click.stop
              />
            </div>
          </div>
        </div>

        <div
          v-if="Object.keys(selectedInvoices).length > 0"
          class="d-flex justify-space-between align-center rounded-lg px-4 py-2 mb-1"
          :class="sisaRemaining < 0 ? 'bg-error-subtle' : 'bg-success-subtle'"
        >
          <span class="text-body-2">
            <span class="text-medium-emphasis">Total Dialokasikan:</span>
            <strong class="ms-1">{{ formatCurrency(totalAlokasi) }}</strong>
          </span>
          <span
            class="text-body-2 font-weight-medium"
            :class="sisaRemaining < 0 ? 'text-error' : 'text-success'"
          >
            Sisa: {{ formatCurrency(sisaRemaining) }}
          </span>
        </div>

        <template v-if="item?.kelebihan_bayar?.riwayat?.length > 0">
          <VDivider class="my-4" />
          <div class="text-caption text-medium-emphasis text-uppercase font-weight-medium mb-2" style="letter-spacing: 0.6px">
            Riwayat Alokasi
          </div>
          <div class="d-flex flex-column gap-1">
            <div
              v-for="r in item.kelebihan_bayar.riwayat"
              :key="r.id"
              class="d-flex align-center flex-wrap gap-x-2 gap-y-0 text-caption pa-2 rounded"
              style="background: rgba(var(--v-border-color), 0.06)"
            >
              <VIcon size="13" color="success" class="me-1">ri-checkbox-circle-line</VIcon>
              <span class="font-weight-medium">{{ r.no_invoice }}</span>
              <span class="text-medium-emphasis">•</span>
              <span class="text-success font-weight-medium">{{ formatCurrency(r.jumlah) }}</span>
              <span class="text-medium-emphasis">•</span>
              <span class="text-medium-emphasis">{{ formatDate(r.tanggal) }}</span>
              <span class="text-medium-emphasis">•</span>
              <span class="text-medium-emphasis">oleh {{ r.created_by }}</span>
            </div>
          </div>
        </template>

        <template v-if="item?.kelebihan_bayar">
          <VDivider class="my-4" />
          <div class="text-caption text-medium-emphasis text-uppercase font-weight-medium mb-2" style="letter-spacing: 0.6px">
            Pendapatan di Muka (PDM)
          </div>

          <div
            v-if="item.kelebihan_bayar.pdm?.status === 'AKTIF'"
            class="d-flex align-center gap-3 rounded-lg pa-3"
            style="background: rgba(103,58,183,0.06); border: 1px solid rgba(103,58,183,0.2)"
          >
            <VIcon color="deep-purple" size="18">ri-time-line</VIcon>
            <div class="flex-1-1">
              <div class="text-body-2 font-weight-semibold text-deep-purple">PDM TERCATAT</div>
              <div class="text-caption text-medium-emphasis">
                {{ formatCurrency(item.kelebihan_bayar.pdm.jumlah) }}
                &bull; {{ formatDate(item.kelebihan_bayar.pdm.tanggal_pencatatan) }}
                &bull; oleh {{ item.kelebihan_bayar.pdm.created_by }}
              </div>
            </div>
            <AppActionButton action="batalkan" label="Batalkan PDM" icon="ri-close-circle-line" size="x-small" :loading="pdmCanceling" @click="doBatalkanPdm" />
          </div>

          <div v-else-if="item.kelebihan_bayar.sisa > 0">
            <AppActionButton
              action="custom"
              color="deep-purple"
              icon="ri-book-line"
              size="small"
              :loading="pdmSaving"
              @click="doCatatPdm"
            >
              Catat {{ formatCurrency(item.kelebihan_bayar.sisa) }} sebagai PDM
            </AppActionButton>
            <div class="text-caption text-medium-emphasis mt-1">
              Uang diterima namun belum ada invoice yang cocok
            </div>
          </div>

          <VAlert v-if="pdmError" type="error" variant="tonal" density="compact" class="mt-2">
            {{ pdmError }}
          </VAlert>
        </template>

        <VAlert v-if="kelebihanError" type="error" variant="tonal" density="compact" class="mt-3">
          {{ kelebihanError }}
        </VAlert>
      </VCardText>

      <VDivider />
      <VCardActions class="pa-3 gap-2">
        <VSpacer />
        <AppActionButton action="batalkan" @click="$emit('update:modelValue', false)" />
        <AppActionButton
          action="gunakan"
          label="Alokasikan"
          :disabled="Object.keys(selectedInvoices).length === 0 || totalAlokasi <= 0 || sisaRemaining < 0 || invoiceB2CLoading || invoiceB2BLoading"
          :loading="kelebihanSaving"
          @click="doAlokasikanKelebihan"
        />
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useFormatter } from '@/composables/useFormatter'
import api from '@/utils/axios'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  item: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'changed'])

const { formatCurrency, formatDate } = useFormatter()

const statusInvoiceColor = s => ({ LUNAS: 'success', SEBAGIAN: 'warning', TERKIRIM: 'info', DRAFT: 'grey' }[s] ?? 'grey')

const invoiceB2CList    = ref([])
const invoiceB2CLoading = ref(false)
const invoiceB2BList    = ref([])
const invoiceB2BLoading = ref(false)
const selectedInvoices  = ref({})
const kelebihanSaving   = ref(false)
const kelebihanError    = ref(null)

const pdmSaving    = ref(false)
const pdmCanceling = ref(false)
const pdmError     = ref(null)

const totalAlokasi = computed(() =>
  Object.values(selectedInvoices.value).reduce((s, v) => s + (Number(v.jumlah) || 0), 0),
)
const sisaRemaining = computed(() =>
  (props.item?.kelebihan_bayar?.sisa ?? 0) - totalAlokasi.value,
)

const allB2CSelected = computed(() =>
  invoiceB2CList.value.length > 0 &&
  invoiceB2CList.value.every(inv => !!selectedInvoices.value[inv.id]),
)
const someB2CSelected = computed(() =>
  invoiceB2CList.value.some(inv => !!selectedInvoices.value[inv.id]),
)
const allB2BSelected = computed(() =>
  invoiceB2BList.value.length > 0 &&
  invoiceB2BList.value.every(inv => !!selectedInvoices.value[inv.id]),
)
const someB2BSelected = computed(() =>
  invoiceB2BList.value.some(inv => !!selectedInvoices.value[inv.id]),
)

async function fetchInvoiceLists() {
  const itemId = props.item?.id
  if (!itemId) return
  invoiceB2CLoading.value = true
  invoiceB2BLoading.value = true
  try {
    const [resB2C, resB2B] = await Promise.all([
      api.get(`/finance/rekonsiliasi-bank/detail/${itemId}/invoice-b2c`),
      api.get(`/finance/rekonsiliasi-bank/detail/${itemId}/invoice-b2b`),
    ])
    invoiceB2CList.value = resB2C.data?.data ?? []
    invoiceB2BList.value = resB2B.data?.data ?? []
  } finally {
    invoiceB2CLoading.value = false
    invoiceB2BLoading.value = false
  }
}

function resetState() {
  selectedInvoices.value = {}
  kelebihanError.value   = null
  pdmError.value         = null
  invoiceB2CList.value   = []
  invoiceB2BList.value   = []
}

watch(() => props.modelValue, open => {
  if (!open) {
    resetState()
    return
  }
  resetState()
  fetchInvoiceLists()
}, { immediate: true })

// Distribusi floating/waterfall: alokasikan sisa kelebihan berurutan ke tiap
// invoice sebesar min(sisa_tagihan, sisa kelebihan tersisa). Invoice yang tidak
// kebagian (kelebihan sudah habis) tidak dimasukkan -> tidak tercentang.
function distributeAll(list, currentSelected, totalSisaKelebihan) {
  const next = { ...currentSelected }

  list.forEach(inv => delete next[inv.id])

  const allocatedOthers = Object.values(next)
    .reduce((s, v) => s + (Number(v.jumlah) || 0), 0)
  let remaining = totalSisaKelebihan - allocatedOthers

  for (const inv of list) {
    if (remaining <= 0) break
    const give = Math.min(inv.sisa_tagihan, remaining)
    if (give <= 0) continue
    next[inv.id] = { jumlah: give, keterangan: '' }
    remaining -= give
  }
  return next
}

function toggleAllB2C() {
  if (allB2CSelected.value) {
    const next = { ...selectedInvoices.value }
    invoiceB2CList.value.forEach(inv => delete next[inv.id])
    selectedInvoices.value = next
    return
  }
  selectedInvoices.value = distributeAll(
    invoiceB2CList.value,
    selectedInvoices.value,
    props.item?.kelebihan_bayar?.sisa ?? 0,
  )
}

function toggleAllB2B() {
  if (allB2BSelected.value) {
    const next = { ...selectedInvoices.value }
    invoiceB2BList.value.forEach(inv => delete next[inv.id])
    selectedInvoices.value = next
    return
  }
  selectedInvoices.value = distributeAll(
    invoiceB2BList.value,
    selectedInvoices.value,
    props.item?.kelebihan_bayar?.sisa ?? 0,
  )
}

function toggleInvoice(inv) {
  if (selectedInvoices.value[inv.id]) {
    const next = { ...selectedInvoices.value }
    delete next[inv.id]
    selectedInvoices.value = next
  } else {
    const autoJumlah = Math.min(inv.sisa_tagihan, sisaRemaining.value)
    selectedInvoices.value = {
      ...selectedInvoices.value,
      [inv.id]: { jumlah: autoJumlah > 0 ? autoJumlah : null, keterangan: '' },
    }
  }
}

async function doAlokasikanKelebihan() {
  const entries = Object.entries(selectedInvoices.value).filter(([, v]) => Number(v.jumlah) > 0)
  if (!entries.length) return
  const itemId = props.item.id
  kelebihanSaving.value = true
  kelebihanError.value  = null
  try {
    for (const [invoiceId, { jumlah, keterangan }] of entries) {
      await api.post(`/finance/rekonsiliasi-bank/detail/${itemId}/kelebihan`, {
        invoice_id : Number(invoiceId),
        jumlah,
        keterangan : keterangan || null,
      })
    }
    selectedInvoices.value = {}
    emit('changed', itemId)
    await fetchInvoiceLists()
  } catch (err) {
    kelebihanError.value = err?.response?.data?.message ?? 'Terjadi kesalahan, coba lagi.'
  } finally {
    kelebihanSaving.value = false
  }
}

async function doCatatPdm() {
  const itemId = props.item.id
  const sisa   = props.item?.kelebihan_bayar?.sisa ?? 0
  pdmSaving.value = true
  pdmError.value  = null
  try {
    await api.post(`/finance/pendapatan-di-muka/detail/${itemId}/catat`, {
      jumlah             : sisa,
      tanggal_pencatatan : new Date().toISOString().slice(0, 10),
    })
    emit('changed', itemId)
  } catch (err) {
    pdmError.value = err?.response?.data?.message ?? 'Terjadi kesalahan saat mencatat PDM.'
  } finally {
    pdmSaving.value = false
  }
}

async function doBatalkanPdm() {
  const pdmId = props.item?.kelebihan_bayar?.pdm?.id
  if (!pdmId) return
  const itemId = props.item.id
  pdmCanceling.value = true
  pdmError.value     = null
  try {
    await api.delete(`/finance/pendapatan-di-muka/${pdmId}/batal`)
    emit('changed', itemId)
  } catch (err) {
    pdmError.value = err?.response?.data?.message ?? 'Terjadi kesalahan saat membatalkan PDM.'
  } finally {
    pdmCanceling.value = false
  }
}
</script>
