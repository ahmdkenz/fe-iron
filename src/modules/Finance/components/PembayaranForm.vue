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
              v => v <= sisaTagihan || `Jumlah melebihi sisa tagihan (${formatCurrency(sisaTagihan)})`,
            ]"
            :error-messages="errors.jumlah_pembayaran"
            prefix="Rp"
          />
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
          />
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
import { ref, reactive, watch } from 'vue'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { useFormatter } from '@/composables/useFormatter.js'
import api from '@/utils/axios.js'

const props = defineProps({
  modelValue: Boolean,
  invoiceId: { type: [Number, String], default: null },
  sisaTagihan: { type: Number, default: 0 },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const { formatCurrency } = useFormatter()
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
  no_referensi: [], keterangan: [],
})

const defaultForm = () => ({
  tanggal_pembayaran: new Date().toISOString().slice(0, 10),
  jumlah_pembayaran: null,
  metode_pembayaran: 'TRANSFER',
  no_referensi: '',
  keterangan: '',
})

const form = reactive(defaultForm())

watch(() => props.modelValue, val => {
  if (val) {
    Object.keys(errors).forEach(k => (errors[k] = []))
    errorMessage.value = ''
    Object.assign(form, defaultForm())
  }
})

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
    await api.post(`/finance/invoices/${props.invoiceId}/pembayaran`, { ...form })
    emit('saved')
    await showSuccess('Pembayaran berhasil dicatat.')
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
