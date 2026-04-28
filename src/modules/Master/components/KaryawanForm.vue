<template>
  <BaseModal
    :model-value="modelValue"
    :title="isEditing ? 'Edit Karyawan' : 'Tambah Karyawan'"
    :loading="saving"
    @update:model-value="$emit('update:modelValue', $event)"
    @confirm="handleSubmit"
  >
    <VForm ref="formRef">
      <VRow>
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            v-model="form.nik"
            label="NIK"
            density="compact"
            variant="outlined"
            :rules="[v => !!v || 'NIK wajib diisi']"
            :error-messages="errors.nik"
            :disabled="isEditing"
          />
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            v-model="form.nama_karyawan"
            label="Nama Karyawan"
            density="compact"
            variant="outlined"
            :rules="[v => !!v || 'Nama karyawan wajib diisi']"
            :error-messages="errors.nama_karyawan"
          />
        </VCol>
        <VCol cols="12">
          <VAutocomplete
            v-model="form.perusahaan_id"
            label="Perusahaan"
            density="compact"
            variant="outlined"
            :items="perusahaanList"
            item-title="nama_perusahaan"
            item-value="id"
            :rules="[v => !!v || 'Perusahaan wajib dipilih']"
            :error-messages="errors.perusahaan_id"
            :loading="perusahaanLoading"
            clearable
          >
            <template #item="{ props: itemProps, item }">
              <VListItem
                v-bind="itemProps"
                :title="item.raw.nama_perusahaan"
                :subtitle="item.raw.kode_perusahaan"
              />
            </template>
          </VAutocomplete>
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
        <VCol
          cols="12"
          md="6"
        >
          <BaseSelect
            v-model="form.status"
            label="Status"
            :items="statusOptions"
            item-title="label"
            item-value="value"
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
import { useCrud } from '@/composables/useCrud.js'
import { BOOLEAN_STATUS_OPTIONS, normalizeBooleanStatus } from '@/utils/status.js'

const props = defineProps({
  modelValue: Boolean,
  karyawanData: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const { create, update, saving } = useCrud('/master/karyawan')
const { items: perusahaanList, loading: perusahaanLoading, fetchAll: fetchPerusahaan } = useCrud('/master/perusahaan')

const formRef = ref(null)
const errorMessage = ref('')
const errors = reactive({ nik: [], nama_karyawan: [], perusahaan_id: [], keterangan: [] })

const isEditing = computed(() => !!props.karyawanData)

const statusOptions = BOOLEAN_STATUS_OPTIONS

const defaultForm = () => ({
  nik: '',
  nama_karyawan: '',
  perusahaan_id: null,
  keterangan: '',
  status: 1,
})

const form = reactive(defaultForm())

watch(() => props.modelValue, val => {
  if (val) {
    Object.assign(errors, { nik: [], nama_karyawan: [], perusahaan_id: [], keterangan: [] })
    errorMessage.value = ''
    fetchPerusahaan()
    if (props.karyawanData) {
      form.nik           = props.karyawanData.nik ?? ''
      form.nama_karyawan = props.karyawanData.nama_karyawan ?? ''
      form.perusahaan_id = props.karyawanData.perusahaan_id ?? null
      form.keterangan    = props.karyawanData.keterangan ?? ''
      form.status        = normalizeBooleanStatus(props.karyawanData.status)
    } else {
      Object.assign(form, defaultForm())
    }
  }
})

async function handleSubmit() {
  errorMessage.value = ''
  Object.keys(errors).forEach(k => (errors[k] = []))

  const { valid } = await formRef.value.validate()
  if (!valid) return

  const res = isEditing.value
    ? await update(props.karyawanData.id, form)
    : await create(form)

  if (res.success) {
    emit('saved')
  } else {
    if (res.errors) Object.assign(errors, res.errors)
    else errorMessage.value = 'Gagal menyimpan data'
  }
}
</script>
