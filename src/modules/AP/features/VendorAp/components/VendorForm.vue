<template>
  <BaseModal
    :model-value="modelValue"
    :title="isEditing ? 'Edit Vendor' : 'Tambah Vendor'"
    :loading="saving"
    @update:model-value="$emit('update:modelValue', $event)"
    @confirm="handleSubmit"
  >
    <VForm ref="formRef">
      <!-- Section: Data Vendor -->
      <div
        class="text-caption font-weight-bold text-uppercase d-flex align-center gap-1 mb-2"
        style="color: rgb(var(--v-theme-primary))"
      >
        <VIcon icon="ri-store-2-line" size="13" />
        Data Vendor
      </div>
      <VRow dense>
        <VCol cols="12" md="4">
          <BaseInput
            v-model="form.kode_vendor"
            label="Kode Supplier"
            :rules="[v => !!v || 'Kode Supplier wajib diisi']"
            :error-messages="errors.kode_vendor"
          />
        </VCol>
        <VCol cols="12" md="8">
          <BaseInput
            v-model="form.nama_vendor"
            label="Nama Vendor"
            :rules="[v => !!v || 'Nama vendor wajib diisi']"
            :error-messages="errors.nama_vendor"
          />
        </VCol>
        <VCol cols="12" md="6">
          <BaseInput
            v-model="form.no_npwp"
            label="No. NPWP"
            :error-messages="errors.no_npwp"
          />
        </VCol>
        <VCol cols="12" md="6">
          <BaseSelect
            v-model="form.status"
            label="Status"
            :items="statusOptions"
            item-title="label"
            item-value="value"
          />
        </VCol>
      </VRow>

      <!-- Section: Info Rekening Bank -->
      <div
        class="text-caption font-weight-bold text-uppercase d-flex align-center gap-1 mt-3 mb-2"
        style="color: rgb(var(--v-theme-warning))"
      >
        <VIcon icon="ri-bank-line" size="13" />
        Info Rekening Bank
        <VChip size="x-small" color="secondary" variant="tonal">Opsional</VChip>
      </div>
      <VRow dense>
        <VCol cols="12" md="4">
          <BaseInput v-model="form.bank_nama" label="Nama Bank" />
        </VCol>
        <VCol cols="12" md="4">
          <BaseInput v-model="form.bank_no_rekening" label="No. Rekening" />
        </VCol>
        <VCol cols="12" md="4">
          <BaseInput v-model="form.bank_atas_nama" label="Atas Nama" />
        </VCol>
      </VRow>

      <!-- Section: Relasi Internal -->
      <div
        class="text-caption font-weight-bold text-uppercase d-flex align-center gap-1 mt-3 mb-2"
        style="color: rgb(var(--v-theme-primary))"
      >
        <VIcon icon="ri-links-line" size="13" />
        Relasi Internal
      </div>
      <VRow dense>
        <VCol cols="12">
          <VAutocomplete
            v-model="form.karyawan_ap_id"
            label="PIC AP (Staff Pengelola)"
            density="compact"
            variant="outlined"
            :items="karyawanList"
            item-title="nama_karyawan"
            item-value="id"
            :rules="[v => !!v || 'PIC AP wajib dipilih']"
            :error-messages="errors.karyawan_ap_id"
            :loading="karyawanLoading"
            @focus="ensureKaryawanLoaded({ params: { role: 'AP' } })"
          >
            <template #item="{ props: p, item }">
              <VListItem v-bind="p" :title="item.raw.nama_karyawan" :subtitle="item.raw.nik" />
            </template>
          </VAutocomplete>
        </VCol>
      </VRow>

      <VAlert v-if="errorMessage" type="error" variant="tonal" class="mt-3">
        {{ errorMessage }}
      </VAlert>
    </VForm>
  </BaseModal>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useCrud } from '@/composables/useCrud.js'
import { useLazyFetchAll } from '@/composables/useLazyFetchAll.js'
import { BOOLEAN_STATUS_OPTIONS, normalizeBooleanStatus } from '@/utils/status.js'

const props = defineProps({
  modelValue: Boolean,
  vendorData: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const { create, update, saving } = useCrud('/ap/vendors')
const { items: karyawanList, loading: karyawanLoading, fetchAll: fetchKaryawan } = useCrud('/master/karyawan')
const { ensureLoaded: ensureKaryawanLoaded } = useLazyFetchAll(fetchKaryawan)

const formRef = ref(null)
const errorMessage = ref('')
const errors = reactive({ kode_vendor: [], nama_vendor: [], no_npwp: [], karyawan_ap_id: [] })

const isEditing = computed(() => !!props.vendorData)
const statusOptions = BOOLEAN_STATUS_OPTIONS

const defaultForm = () => ({
  kode_vendor: '',
  nama_vendor: '',
  no_npwp: '',
  bank_nama: '',
  bank_no_rekening: '',
  bank_atas_nama: '',
  karyawan_ap_id: null,
  status: 1,
})

const form = reactive(defaultForm())

watch([() => props.modelValue, () => props.vendorData], ([open]) => {
  if (!open) return

  Object.assign(errors, { kode_vendor: [], nama_vendor: [], no_npwp: [], karyawan_ap_id: [] })
  errorMessage.value = ''
  ensureKaryawanLoaded({ params: { role: 'AP' } })

  if (props.vendorData) {
    Object.assign(form, {
      kode_vendor: props.vendorData.kode_vendor ?? '',
      nama_vendor: props.vendorData.nama_vendor ?? '',
      no_npwp: props.vendorData.no_npwp ?? '',
      bank_nama: props.vendorData.bank_nama ?? '',
      bank_no_rekening: props.vendorData.bank_no_rekening ?? '',
      bank_atas_nama: props.vendorData.bank_atas_nama ?? '',
      karyawan_ap_id: props.vendorData.karyawan_ap_id ?? null,
      status: normalizeBooleanStatus(props.vendorData.status),
    })
  } else {
    Object.assign(form, defaultForm())
  }
})

async function handleSubmit() {
  errorMessage.value = ''
  Object.keys(errors).forEach(k => (errors[k] = []))

  const { valid } = await formRef.value.validate()
  if (!valid) return

  const payload = { ...form }
  const res = isEditing.value
    ? await update(props.vendorData.id, payload)
    : await create(payload)

  if (res.success) {
    emit('saved')
  } else {
    if (res.errors) Object.assign(errors, res.errors)
    errorMessage.value = res.message ?? 'Gagal menyimpan data'
  }
}
</script>
