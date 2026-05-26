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
        <!-- Info sisa tagihan -->
        <VCol cols="12">
          <VAlert
            type="info"
            variant="tonal"
            density="compact"
          >
            Sisa Tagihan: <strong>{{ formatCurrency(sisaTagihan) }}</strong>
          </VAlert>
        </VCol>

        <!-- Tanggal Pembayaran -->
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

        <!-- Jumlah Pembayaran -->
        <VCol
          cols="12"
          md="6"
        >
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
          />
        </VCol>

        <!-- Warning kelebihan bayar -->
        <VCol
          v-if="isKelebihan"
          cols="12"
        >
          <VAlert
            type="warning"
            variant="tonal"
            density="compact"
          >
            Kelebihan bayar sebesar
            <strong>{{ formatCurrency(form.jumlah_pembayaran - sisaTagihan) }}</strong>
            akan dicatat dan dapat dialokasikan ke invoice lain melalui Rekonsiliasi Bank.
          </VAlert>
        </VCol>

        <!-- Metode Pembayaran -->
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

        <!-- No Referensi -->
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

        <!-- Warning duplikat referensi -->
        <VCol v-if="duplikatInfo" cols="12">
          <VAlert type="warning" variant="tonal" density="compact">
            <strong>Peringatan:</strong> Nomor referensi ini sudah digunakan oleh
            <strong>{{ duplikatInfo.pic ?? 'PIC tidak diketahui' }}</strong>
            pada <strong>{{ duplikatInfo.tanggal_pembayaran }}</strong>
            untuk invoice <strong>{{ duplikatInfo.no_invoice }}</strong>
            sebesar <strong>{{ formatCurrency(duplikatInfo.jumlah_pembayaran) }}</strong>.
          </VAlert>
        </VCol>

        <!-- Keterangan -->
        <VCol cols="12">
          <VTextField
            v-model="form.keterangan"
            label="Keterangan"
            density="compact"
            variant="outlined"
            :error-messages="errors.keterangan"
          />
        </VCol>

        <!-- Bukti Pembayaran -->
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
              v => !v || !v.length || v[0].size <= 10 * 1024 * 1024 || 'Ukuran file maksimal 10 MB',
            ]"
            :error-messages="errors.bukti_pembayaran"
            hint="PDF, JPG, atau PNG — maks 10 MB"
            persistent-hint
          />
        </VCol>
      </VRow>

      <VAlert
        v-if="errorMessage"
        type="error"
        variant="tonal"
        class="mt-2"
      >
        {{ errorMessage }}
      </VAlert>
    </VForm>
  </BaseModal>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { useFormatter } from '@/composables/useFormatter.js'
import api from '@/utils/axios.js'

const checkingRef  = ref(false)
const duplikatInfo = ref(null)

const props = defineProps({
  modelValue: Boolean,
  invoiceId: { type: [Number, String], default: null },
  sisaTagihan: { type: Number, default: 0 },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const { formatCurrency } = useFormatter()

const isKelebihan = computed(() => form.jumlah_pembayaran > props.sisaTagihan)
const { showSuccess, showError, showLoading, closeAlert } = useSweetAlert()
const saving = ref(false)

const formRef      = ref(null)
const errorMessage = ref('')

const metodeOptions = [
  { label: 'Transfer', value: 'TRANSFER' },
  { label: 'Cash',     value: 'CASH'     },
  { label: 'Giro',     value: 'GIRO'     },
]

const errors = reactive({
  tanggal_pembayaran: [], jumlah_pembayaran: [], metode_pembayaran: [],
  no_referensi: [], keterangan: [], bukti_pembayaran: [],
})

const defaultForm = () => ({
  tanggal_pembayaran: new Date().toISOString().slice(0, 10),
  jumlah_pembayaran: null,
  metode_pembayaran: 'TRANSFER',
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

async function cekDuplikatReferensi() {
  const noRef = form.no_referensi?.trim()
  duplikatInfo.value = null
  if (!noRef) return

  checkingRef.value = true
  try {
    const res = await api.get('/finance/pembayaran/cek-referensi', { params: { no_referensi: noRef } })
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
  showLoading({
    title: 'Menyimpan Pembayaran',
    text: 'Pembayaran sedang diproses...',
  })

  try {
    const payload = new FormData()
    payload.append('tanggal_pembayaran', form.tanggal_pembayaran)
    payload.append('jumlah_pembayaran', form.jumlah_pembayaran)
    payload.append('metode_pembayaran', form.metode_pembayaran)
    if (form.no_referensi) payload.append('no_referensi', form.no_referensi)
    if (form.keterangan)   payload.append('keterangan', form.keterangan)
    if (form.bukti_pembayaran?.length) payload.append('bukti_pembayaran', form.bukti_pembayaran[0])

    await api.post(`/finance/invoices/${props.invoiceId}/pembayaran`, payload, {
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
