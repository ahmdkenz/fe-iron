<template>
  <BaseModal
    :model-value="modelValue"
    :title="isEditing ? 'Edit Perusahaan' : 'Tambah Perusahaan'"
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
            v-model="form.kode_perusahaan"
            label="Kode Perusahaan"
            density="compact"
            variant="outlined"
            hint="Contoh: PT-ABC, CV-XYZ"
            persistent-hint
            :rules="[v => !!v || 'Kode wajib diisi']"
            :error-messages="errors.kode_perusahaan"
            :disabled="isEditing"
            @input="form.kode_perusahaan = form.kode_perusahaan.toUpperCase()"
          />
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            v-model="form.nama_singkatan_perusahaan"
            label="Singkatan Perusahaan"
            density="compact"
            variant="outlined"
            hint="Contoh: ABC, XYZ"
            persistent-hint
            :rules="[v => !!v || 'Singkatan wajib diisi']"
            :error-messages="errors.nama_singkatan_perusahaan"
            @input="form.nama_singkatan_perusahaan = form.nama_singkatan_perusahaan.toUpperCase()"
          />
        </VCol>
        <VCol cols="12">
          <VTextField
            v-model="form.nama_perusahaan"
            label="Nama Perusahaan"
            density="compact"
            variant="outlined"
            :rules="[v => !!v || 'Nama perusahaan wajib diisi']"
            :error-messages="errors.nama_perusahaan"
          />
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
          <VTextField
            v-model="form.alamat"
            label="Alamat"
            density="compact"
            variant="outlined"
            :error-messages="errors.alamat"
          />
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            v-model="form.kota"
            label="Kota"
            density="compact"
            variant="outlined"
            :error-messages="errors.kota"
          />
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            v-model="form.kode_pos"
            label="Kode POS"
            density="compact"
            variant="outlined"
            :error-messages="errors.kode_pos"
          />
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            v-model="form.no_telp"
            label="No. Telepon"
            density="compact"
            variant="outlined"
            :error-messages="errors.no_telp"
          />
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            v-model="form.email"
            label="Email"
            density="compact"
            variant="outlined"
            type="email"
            :error-messages="errors.email"
          />
        </VCol>
        <VCol cols="12">
          <VTextField
            v-model="form.no_npwp"
            label="NPWP"
            density="compact"
            variant="outlined"
            hint="Contoh: 12.345.678.9-012.000"
            persistent-hint
            :error-messages="errors.no_npwp"
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
  perusahaanData: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const { create, update, saving } = useCrud('/master/perusahaan')

const formRef = ref(null)
const errorMessage = ref('')
const errors = reactive({ kode_perusahaan: [], nama_perusahaan: [], nama_singkatan_perusahaan: [], keterangan: [], alamat: [], kota: [], kode_pos: [], no_telp: [], email: [], no_npwp: [] })

const isEditing = computed(() => !!props.perusahaanData)

const statusOptions = BOOLEAN_STATUS_OPTIONS

const defaultForm = () => ({
  kode_perusahaan: '',
  nama_perusahaan: '',
  nama_singkatan_perusahaan: '',
  keterangan: '',
  alamat: '',
  kota: '',
  kode_pos: '',
  no_telp: '',
  email: '',
  no_npwp: '',
  status: 1,
})

const form = reactive(defaultForm())

watch(() => props.modelValue, val => {
  if (val) {
    Object.assign(errors, { kode_perusahaan: [], nama_perusahaan: [], nama_singkatan_perusahaan: [], keterangan: [], alamat: [], kota: [], kode_pos: [], no_telp: [], email: [], no_npwp: [] })
    errorMessage.value = ''
    if (props.perusahaanData) {
      form.kode_perusahaan           = props.perusahaanData.kode_perusahaan ?? ''
      form.nama_perusahaan           = props.perusahaanData.nama_perusahaan ?? ''
      form.nama_singkatan_perusahaan = props.perusahaanData.nama_singkatan_perusahaan ?? ''
      form.keterangan                = props.perusahaanData.keterangan ?? ''
      form.alamat                    = props.perusahaanData.alamat ?? ''
      form.kota                      = props.perusahaanData.kota ?? ''
      form.kode_pos                  = props.perusahaanData.kode_pos ?? ''
      form.no_telp                   = props.perusahaanData.no_telp ?? ''
      form.email                     = props.perusahaanData.email ?? ''
      form.no_npwp                   = props.perusahaanData.no_npwp ?? ''
      form.status                    = normalizeBooleanStatus(props.perusahaanData.status)
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
    ? await update(props.perusahaanData.id, form)
    : await create(form)

  if (res.success) {
    emit('saved')
  } else {
    if (res.errors) Object.assign(errors, res.errors)
    else errorMessage.value = 'Gagal menyimpan data'
  }
}
</script>
