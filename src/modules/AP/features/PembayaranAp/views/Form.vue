<template>
  <div>
    <PageHeader
      title="Buat Payment Voucher"
      subtitle="Satu Payment Voucher bisa mencakup banyak tagihan dari banyak vendor"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Payment Voucher', to: { name: 'ap-pembayaran-index' } },
        { title: 'Buat Payment Voucher', disabled: true }
      ]"
    >
      <VBtn
        variant="tonal"
        color="secondary"
        :to="{ name: 'ap-pembayaran-index' }"
      >
        <VIcon
          icon="ri-arrow-left-line"
          class="me-1"
        />
        Kembali
      </VBtn>
    </PageHeader>

    <VForm
      ref="formRef"
      @submit.prevent
    >
      <VAlert
        v-if="errorMessage"
        type="error"
        variant="tonal"
        closable
        class="mb-4"
      >
        {{ errorMessage }}
      </VAlert>

      <VRow>
        <VCol
          cols="12"
          lg="8"
        >
          <VCard class="mb-4 section-card">
            <div class="section-header">
              <div class="section-icon bg-primary">
                <VIcon
                  icon="ri-file-list-3-line"
                  size="16"
                  color="white"
                />
              </div>
              <span class="text-subtitle-1 font-weight-semibold">Informasi Payment Voucher</span>
            </div>
            <VDivider />
            <VCardText class="pt-4">
              <VRow>
                <VCol
                  cols="12"
                  md="6"
                >
                  <VTextField
                    v-model="form.tanggal_pembayaran"
                    label="Tanggal Pembayaran"
                    density="compact"
                    variant="outlined"
                    type="date"
                    :rules="[v => !!v || 'Tanggal pembayaran wajib diisi']"
                    :error-messages="errors.tanggal_pembayaran"
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="6"
                >
                  <VSelect
                    v-model="form.metode_pembayaran"
                    label="Metode Pembayaran"
                    density="compact"
                    variant="outlined"
                    :items="metodeOptions"
                    item-title="label"
                    item-value="value"
                    :rules="[v => !!v || 'Metode pembayaran wajib dipilih']"
                    :error-messages="errors.metode_pembayaran"
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="6"
                >
                  <VSelect
                    v-model="form.kategori_voucher"
                    label="Kategori Voucher"
                    density="compact"
                    variant="outlined"
                    :items="kategoriOptions"
                    item-title="label"
                    item-value="value"
                    :rules="[v => !!v || 'Kategori voucher wajib dipilih']"
                    :error-messages="errors.kategori_voucher"
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="6"
                >
                  <VTextField
                    v-model="form.no_referensi"
                    label="No. Referensi"
                    density="compact"
                    variant="outlined"
                    :error-messages="errors.no_referensi"
                    :loading="checkingRef"
                    @blur="cekDuplikatReferensi"
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="6"
                >
                  <VFileInput
                    v-model="form.bukti_pembayaran"
                    label="Bukti Pembayaran (Opsional)"
                    density="compact"
                    variant="outlined"
                    accept="application/pdf,image/jpeg,image/jpg,image/png"
                    prepend-icon=""
                    prepend-inner-icon="ri-attachment-line"
                    :error-messages="errors.bukti_pembayaran"
                    hint="PDF, JPG, atau PNG — maks 10 MB"
                    persistent-hint
                  />
                </VCol>
                <VCol
                  v-if="duplikatInfo"
                  cols="12"
                >
                  <VAlert
                    type="warning"
                    variant="tonal"
                    density="compact"
                  >
                    <strong>Peringatan:</strong> Nomor referensi ini sudah dipakai Payment Voucher lain
                    ({{ duplikatInfo.tagihan_count }} tagihan
                    <template v-if="duplikatInfo.vendor_names?.length">
                      &bull; {{ duplikatInfo.vendor_names.join(', ') }}
                    </template>)
                    pada <strong>{{ duplikatInfo.tanggal_pembayaran }}</strong>
                    sebesar <strong>{{ formatCurrency(duplikatInfo.jumlah_pembayaran) }}</strong>.
                  </VAlert>
                </VCol>
                <VCol cols="12">
                  <VTextField
                    v-model="form.keterangan"
                    label="Keterangan"
                    density="compact"
                    variant="outlined"
                    :error-messages="errors.keterangan"
                  />
                </VCol>
              </VRow>
            </VCardText>
          </VCard>

          <VCard class="mb-4 section-card">
            <div class="section-header">
              <div class="d-flex align-center gap-3">
                <div class="section-icon bg-warning">
                  <VIcon
                    icon="ri-bill-line"
                    size="16"
                    color="white"
                  />
                </div>
                <span class="text-subtitle-1 font-weight-semibold">Alokasi Tagihan</span>
                <VChip
                  v-if="allocations.length > 0"
                  size="x-small"
                  color="warning"
                  variant="tonal"
                  class="font-weight-medium"
                >
                  {{ allocations.length }} tagihan
                </VChip>
              </div>
              <VBtn
                color="primary"
                size="small"
                prepend-icon="ri-add-line"
                variant="tonal"
                @click="openPicker"
              >
                Tambah Tagihan
              </VBtn>
            </div>
            <VDivider />

            <VCardText>
              <div
                v-if="allocations.length === 0"
                class="text-center text-medium-emphasis py-10"
              >
                <VIcon
                  icon="ri-inbox-line"
                  size="44"
                  class="mb-3 d-block opacity-40"
                />
                <div class="text-body-2">
                  Belum ada tagihan dipilih.
                </div>
                <div class="text-caption mt-1">
                  Klik "Tambah Tagihan" untuk memilih tagihan outstanding (bisa dari vendor berbeda).
                </div>
              </div>

              <table
                v-else
                class="allocation-table w-100"
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
                      style="width: 200px;"
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
                v-if="allocationsError"
                type="error"
                variant="tonal"
                density="compact"
                class="mt-3"
              >
                {{ allocationsError }}
              </VAlert>
            </VCardText>
          </VCard>
        </VCol>

        <VCol
          cols="12"
          lg="4"
        >
          <div class="sticky-sidebar">
            <VCard class="mb-4">
              <div class="section-header">
                <div class="section-icon bg-primary">
                  <VIcon
                    icon="ri-calculator-line"
                    size="16"
                    color="white"
                  />
                </div>
                <span class="text-subtitle-1 font-weight-semibold">Ringkasan Payment Voucher</span>
              </div>
              <VDivider />
              <VCardText class="pt-4">
                <div class="d-flex justify-space-between align-center mb-2">
                  <span class="text-body-2 text-medium-emphasis">Jumlah Tagihan</span>
                  <span class="text-body-2 font-weight-medium">{{ allocations.length }}</span>
                </div>
                <VDivider class="my-3" />
                <div class="d-flex justify-space-between align-center mb-2">
                  <span class="text-subtitle-1 font-weight-bold">Total Payment Voucher</span>
                  <span class="text-h6 font-weight-bold text-primary">{{ formatCurrency(totalVoucher) }}</span>
                </div>
              </VCardText>
            </VCard>

            <VCard>
              <VCardText class="pa-4">
                <VBtn
                  block
                  color="primary"
                  size="large"
                  prepend-icon="ri-send-plane-line"
                  :disabled="saving"
                  :loading="saving"
                  @click="handleSubmit"
                >
                  Simpan Payment Voucher
                </VBtn>
              </VCardText>
            </VCard>
          </div>
        </VCol>
      </VRow>
    </VForm>

    <TagihanApMultiPickerDialog
      v-model="showPicker"
      :tagihan-list="pickerList"
      :loading="pickerLoading"
      :disabled-ids="allocations.map(a => a.tagihan_ap_id)"
      @search="fetchOutstanding"
      @confirm="onPickerConfirm"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCrud } from '@/composables/useCrud'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { useFormatter } from '@/composables/useFormatter'
import { setFlashAlert } from '@/utils/flashAlert'
import api from '@/utils/axios'
import TagihanApMultiPickerDialog from '../components/TagihanApMultiPickerDialog.vue'

const route = useRoute()
const router = useRouter()
const { showError } = useSweetAlert()
const { formatCurrency } = useFormatter()

const { create, saving } = useCrud('/ap/pembayaran/voucher')

const formRef = ref(null)
const errorMessage = ref('')
const allocationsError = ref('')
const checkingRef = ref(false)
const duplikatInfo = ref(null)

const showPicker = ref(false)
const pickerList = ref([])
const pickerLoading = ref(false)

const metodeOptions = [
  { label: 'Transfer', value: 'TRANSFER' },
  { label: 'Cash', value: 'CASH' },
  { label: 'Giro', value: 'GIRO' },
]

const kategoriOptions = [
  { label: 'Bahan Baku', value: 'BB' },
  { label: 'Non Bahan Baku', value: 'NBB' },
]

const errors = reactive({
  tanggal_pembayaran: [], metode_pembayaran: [], kategori_voucher: [], no_referensi: [], keterangan: [], bukti_pembayaran: [],
})

const form = reactive({
  tanggal_pembayaran: new Date().toISOString().slice(0, 10),
  metode_pembayaran: 'TRANSFER',
  kategori_voucher: null,
  no_referensi: '',
  keterangan: '',
  bukti_pembayaran: [],
})

const allocations = ref([])

const totalVoucher = computed(() =>
  allocations.value.reduce((sum, row) => sum + (Number(row.jumlah) || 0), 0),
)

function clampJumlah(row, val) {
  if (val > row.sisa_tagihan) row.jumlah = row.sisa_tagihan
  if (val < 0) row.jumlah = 0
}

function openPicker() {
  showPicker.value = true
}

function onPickerConfirm(selectedRows) {
  const existingIds = new Set(allocations.value.map(a => a.tagihan_ap_id))

  selectedRows.forEach(t => {
    if (existingIds.has(t.id)) return
    allocations.value.push({
      tagihan_ap_id: t.id,
      no_tagihan: t.no_tagihan,
      vendor: t.vendor,
      sisa_tagihan: Number(t.sisa_tagihan) || 0,
      jumlah: Number(t.sisa_tagihan) || 0,
    })
  })
  allocationsError.value = ''
}

function removeAllocation(idx) {
  allocations.value.splice(idx, 1)
}

async function fetchOutstanding(search = '') {
  pickerLoading.value = true
  try {
    const { data } = await api.get('/ap/tagihan/outstanding', { params: search ? { search } : {} })

    pickerList.value = data.data ?? []
  } catch {
    pickerList.value = []
  } finally {
    pickerLoading.value = false
  }
}

async function cekDuplikatReferensi() {
  const noRef = form.no_referensi?.trim()

  duplikatInfo.value = null
  if (!noRef) return

  checkingRef.value = true
  try {
    const res = await api.get('/ap/pembayaran/cek-referensi', { params: { no_referensi: noRef } })

    duplikatInfo.value = res.data?.data ?? null
  } catch {
    // abaikan error cek referensi — validasi tetap dilakukan saat submit
  } finally {
    checkingRef.value = false
  }
}

async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  if (allocations.value.length === 0) {
    allocationsError.value = 'Payment Voucher harus mencakup minimal 1 tagihan.'
    
    return
  }
  const invalidRow = allocations.value.find(row => !row.jumlah || row.jumlah <= 0)
  if (invalidRow) {
    allocationsError.value = `Jumlah pembayaran untuk tagihan ${invalidRow.no_tagihan} harus lebih dari 0.`
    
    return
  }
  allocationsError.value = ''
  errorMessage.value = ''
  Object.keys(errors).forEach(k => (errors[k] = []))

  const payload = new FormData()

  payload.append('tanggal_pembayaran', form.tanggal_pembayaran)
  payload.append('metode_pembayaran', form.metode_pembayaran)
  payload.append('kategori_voucher', form.kategori_voucher)
  if (form.no_referensi) payload.append('no_referensi', form.no_referensi)
  if (form.keterangan) payload.append('keterangan', form.keterangan)
  const buktiFile = Array.isArray(form.bukti_pembayaran) ? form.bukti_pembayaran[0] : form.bukti_pembayaran
  if (buktiFile instanceof File) payload.append('bukti_pembayaran', buktiFile)

  allocations.value.forEach((row, idx) => {
    payload.append(`alokasi[${idx}][tagihan_ap_id]`, row.tagihan_ap_id)
    payload.append(`alokasi[${idx}][jumlah]`, row.jumlah)
  })

  const res = await create(payload)

  if (res.success) {
    setFlashAlert({
      icon: 'success',
      title: 'Berhasil',
      text: 'Payment Voucher berhasil dicatat.',
    })
    router.push({ name: 'ap-pembayaran-index' })
  } else {
    if (res.errors) {
      Object.entries(res.errors).forEach(([k, v]) => { if (k in errors) errors[k] = v })
    }
    errorMessage.value = res.message ?? 'Terjadi kesalahan'
    await showError(errorMessage.value)
  }
}

onMounted(async () => {
  await fetchOutstanding()

  const idsParam = route.query.tagihan_ids
  if (idsParam) {
    const ids = String(idsParam).split(',').map(v => Number(v)).filter(Boolean)
    const preselected = pickerList.value.filter(t => ids.includes(t.id))

    onPickerConfirm(preselected)
  }
})
</script>

<style scoped>
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
}

.section-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.section-card {
  border-inline-start: 3px solid rgb(var(--v-theme-primary));
}

.sticky-sidebar {
  position: sticky;
  top: 80px;
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
}
</style>
