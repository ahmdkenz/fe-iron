<template>
  <BaseModal
    :model-value="modelValue"
    title="Catat Pembayaran"
    :loading="saving"
    width="500"
    @update:model-value="$emit('update:modelValue', $event)"
    @confirm="handleSubmit"
  >
    <VForm ref="formRef">
      <VRow>
        <VCol cols="12">
          <VAlert type="info" variant="tonal" density="compact">
            Sisa Tagihan: <strong>{{ formatCurrency(sisaTagihan) }}</strong>
          </VAlert>
        </VCol>

        <VCol cols="12" md="6">
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

        <VCol cols="12" md="6">
          <VTextField
            v-model.number="form.jumlah_pembayaran"
            label="Jumlah Pembayaran"
            density="compact"
            variant="outlined"
            type="number"
            :rules="[
              v => !!v || 'Jumlah wajib diisi',
              v => v > 0 || 'Jumlah harus lebih dari 0',
            ]"
            :error-messages="errors.jumlah_pembayaran"
            prefix="Rp"
            @update:model-value="handleJumlahInput"
          />
        </VCol>

        <VCol cols="12" md="6">
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

        <VCol cols="12" md="6">
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

        <VCol cols="12" md="6">
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

        <VCol v-if="duplikatInfo" cols="12">
          <VAlert type="warning" variant="tonal" density="compact">
            <strong>Peringatan:</strong> Nomor referensi ini sudah digunakan oleh
            <strong>{{ duplikatInfo.pic ?? 'PIC tidak diketahui' }}</strong>
            pada <strong>{{ duplikatInfo.tanggal_pembayaran }}</strong>
            untuk tagihan <strong>{{ duplikatInfo.no_tagihan }}</strong>
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

        <VCol cols="12">
          <VFileInput
            v-model="form.bukti_pembayaran"
            label="Bukti Pembayaran (Opsional)"
            density="compact"
            variant="outlined"
            accept="application/pdf,image/jpeg,image/jpg,image/png"
            prepend-icon=""
            prepend-inner-icon="ri-attachment-line"
            :rules="[
              v => { const file = Array.isArray(v) ? v[0] : v; return !file || file.size === undefined || file.size <= 10 * 1024 * 1024 || 'Ukuran file maksimal 10 MB' },
            ]"
            :error-messages="errors.bukti_pembayaran"
            hint="PDF, JPG, atau PNG — maks 10 MB"
            persistent-hint
          />
        </VCol>
      </VRow>

      <VAlert v-if="errorMessage" type="error" variant="tonal" class="mt-2">
        {{ errorMessage }}
      </VAlert>
    </VForm>
  </BaseModal>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { useFormatter } from '@/composables/useFormatter.js'
import api from '@/utils/axios.js'

const checkingRef = ref(false)
const duplikatInfo = ref(null)

const props = defineProps({
  modelValue: Boolean,
  tagihanId: { type: [Number, String], default: null },
  sisaTagihan: { type: Number, default: 0 },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const { formatCurrency } = useFormatter()
const { showSuccess, showError, showLoading, closeAlert } = useSweetAlert()
const saving = ref(false)

const formRef = ref(null)
const errorMessage = ref('')

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
  tanggal_pembayaran: [], jumlah_pembayaran: [], metode_pembayaran: [], kategori_voucher: [],
  no_referensi: [], keterangan: [], bukti_pembayaran: [],
})

const defaultForm = () => ({
  tanggal_pembayaran: new Date().toISOString().slice(0, 10),
  jumlah_pembayaran: null,
  metode_pembayaran: 'TRANSFER',
  kategori_voucher: null,
  no_referensi: '',
  keterangan: '',
  bukti_pembayaran: [],
})

const form = reactive(defaultForm())

watch(() => props.modelValue, val => {
  if (val) {
    Object.keys(errors).forEach(k => (errors[k] = []))
    errorMessage.value = ''
    duplikatInfo.value = null
    Object.assign(form, defaultForm())
  }
})

function handleJumlahInput(val) {
  if (val > props.sisaTagihan) {
    form.jumlah_pembayaran = props.sisaTagihan
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

  errorMessage.value = ''
  Object.keys(errors).forEach(k => (errors[k] = []))
  saving.value = true
  showLoading({ title: 'Menyimpan Pembayaran', text: 'Pembayaran sedang diproses...' })

  try {
    const payload = new FormData()
    payload.append('tanggal_pembayaran', form.tanggal_pembayaran)
    payload.append('jumlah_pembayaran', form.jumlah_pembayaran)
    payload.append('metode_pembayaran', form.metode_pembayaran)
    payload.append('kategori_voucher', form.kategori_voucher)
    if (form.no_referensi) payload.append('no_referensi', form.no_referensi)
    if (form.keterangan) payload.append('keterangan', form.keterangan)
    const buktiFile = Array.isArray(form.bukti_pembayaran) ? form.bukti_pembayaran[0] : form.bukti_pembayaran
    if (buktiFile instanceof File) payload.append('bukti_pembayaran', buktiFile)

    await api.post(`/ap/tagihan/${props.tagihanId}/pembayaran`, payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    Object.keys(errors).forEach(k => (errors[k] = []))
    errorMessage.value = ''
    duplikatInfo.value = null
    Object.assign(form, defaultForm())
    emit('update:modelValue', false)
    emit('saved')
    showSuccess('Pembayaran berhasil dicatat.')
  } catch (err) {
    const errData = err.response?.data
    if (errData?.errors) {
      Object.entries(errData.errors).forEach(([k, v]) => { if (k in errors) errors[k] = v })
    }
    errorMessage.value = errData?.message ?? 'Terjadi kesalahan'
    await showError(errorMessage.value)
  } finally {
    closeAlert({ onlyLoading: true })
    saving.value = false
  }
}
</script>
