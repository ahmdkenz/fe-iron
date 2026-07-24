<template>
  <BaseModal
    :model-value="modelValue"
    :title="isEditing ? 'Edit Entitas' : 'Tambah Entitas'"
    :loading="saving"
    @update:model-value="$emit('update:modelValue', $event)"
    @confirm="handleSubmit"
  >
    <VForm ref="formRef">
      <!-- Hero Banner -->
      <div
        class="d-flex align-center gap-3 pa-3 rounded-lg mb-4 mgmt-hero"
        style="background: rgba(var(--v-theme-primary), 0.06); border: 1px solid rgba(var(--v-theme-primary), 0.15)"
      >
        <VAvatar
          :color="isEditing ? 'warning' : 'primary'"
          size="44"
          rounded="lg"
        >
          <VIcon
            :icon="isEditing ? 'ri-building-line' : 'ri-building-4-line'"
            size="22"
          />
        </VAvatar>
        <div class="flex-grow-1 min-width-0">
          <div class="text-subtitle-2 font-weight-bold text-truncate">
            {{ isEditing ? (form.nama_perusahaan || 'Edit Entitas') : 'Entitas Baru' }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ isEditing ? 'Perbarui data perusahaan/entitas' : 'Isi detail entitas yang akan ditambahkan' }}
          </div>
        </div>
        <VChip
          v-if="form.kode_perusahaan"
          color="primary"
          size="small"
          variant="tonal"
          label
          class="font-weight-bold flex-shrink-0"
        >
          {{ form.kode_perusahaan }}
        </VChip>
      </div>

      <!-- Section: Identitas Entitas -->
      <div
        class="text-caption font-weight-bold text-uppercase d-flex align-center gap-1 mb-2"
        style="color: rgb(var(--v-theme-primary))"
      >
        <VIcon
          icon="ri-building-4-line"
          size="13"
        />
        Identitas Entitas
      </div>
      <VRow dense>
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            v-model="form.kode_perusahaan"
            label="Kode Entitas"
            density="compact"
            variant="outlined"
            prepend-inner-icon="ri-barcode-line"
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
            label="Singkatan Entitas"
            density="compact"
            variant="outlined"
            prepend-inner-icon="ri-text"
            hint="Contoh: ABC, XYZ"
            persistent-hint
            :error-messages="errors.nama_singkatan_perusahaan"
            @input="form.nama_singkatan_perusahaan = form.nama_singkatan_perusahaan.toUpperCase()"
          />
        </VCol>
        <VCol cols="12">
          <VTextField
            v-model="form.nama_perusahaan"
            label="Nama Entitas"
            density="compact"
            variant="outlined"
            prepend-inner-icon="ri-building-4-line"
            :rules="[v => !!v || 'Nama entitas wajib diisi']"
            :error-messages="errors.nama_perusahaan"
          />
        </VCol>
        <VCol cols="12">
          <VTextField
            v-model="form.keterangan"
            label="Keterangan"
            density="compact"
            variant="outlined"
            prepend-inner-icon="ri-sticky-note-line"
            :error-messages="errors.keterangan"
          />
        </VCol>
      </VRow>

      <!-- Section: Kontak & Lokasi -->
      <div
        class="text-caption font-weight-bold text-uppercase d-flex align-center gap-1 mt-3 mb-2"
        style="color: rgb(var(--v-theme-info))"
      >
        <VIcon
          icon="ri-map-pin-line"
          size="13"
        />
        Kontak &amp; Lokasi
      </div>
      <VRow dense>
        <VCol cols="12">
          <VTextField
            v-model="form.alamat"
            label="Alamat"
            density="compact"
            variant="outlined"
            prepend-inner-icon="ri-map-pin-line"
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
            prepend-inner-icon="ri-building-2-line"
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
            prepend-inner-icon="ri-map-2-line"
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
            prepend-inner-icon="ri-phone-line"
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
            prepend-inner-icon="ri-mail-line"
            :error-messages="errors.email"
          />
        </VCol>
        <VCol cols="12">
          <VTextField
            v-model="form.no_npwp"
            label="NPWP"
            density="compact"
            variant="outlined"
            prepend-inner-icon="ri-file-paper-line"
            hint="Contoh: 12.345.678.9-012.000"
            persistent-hint
            :error-messages="errors.no_npwp"
          />
        </VCol>
      </VRow>

      <!-- Status Toggle -->
      <div
        class="d-flex align-center justify-space-between pa-3 rounded-lg mt-3"
        style="border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity))"
      >
        <div class="d-flex align-center gap-2">
          <VIcon
            :icon="form.status ? 'ri-checkbox-circle-line' : 'ri-close-circle-line'"
            :color="form.status ? 'success' : 'error'"
            size="20"
          />
          <div>
            <div class="text-body-2 font-weight-medium">
              Status Entitas
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ form.status ? 'Aktif — entitas dapat digunakan' : 'Nonaktif — entitas dinonaktifkan' }}
            </div>
          </div>
        </div>
        <VSwitch
          v-model="form.status"
          :true-value="1"
          :false-value="0"
          color="success"
          hide-details
          density="compact"
          inset
        />
      </div>

      <VAlert
        v-if="errorMessage"
        type="error"
        variant="tonal"
        class="mt-3"
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
  entitasData: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const { create, update, saving } = useCrud('/master/perusahaan')

const formRef = ref(null)
const errorMessage = ref('')
const errors = reactive({ kode_perusahaan: [], nama_perusahaan: [], nama_singkatan_perusahaan: [], keterangan: [], alamat: [], kota: [], kode_pos: [], no_telp: [], email: [], no_npwp: [] })

const isEditing = computed(() => !!props.entitasData)

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
    if (props.entitasData) {
      form.kode_perusahaan           = props.entitasData.kode_perusahaan ?? ''
      form.nama_perusahaan           = props.entitasData.nama_perusahaan ?? ''
      form.nama_singkatan_perusahaan = props.entitasData.nama_singkatan_perusahaan ?? ''
      form.keterangan                = props.entitasData.keterangan ?? ''
      form.alamat                    = props.entitasData.alamat ?? ''
      form.kota                      = props.entitasData.kota ?? ''
      form.kode_pos                  = props.entitasData.kode_pos ?? ''
      form.no_telp                   = props.entitasData.no_telp ?? ''
      form.email                     = props.entitasData.email ?? ''
      form.no_npwp                   = props.entitasData.no_npwp ?? ''
      form.status                    = normalizeBooleanStatus(props.entitasData.status)
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
    ? await update(props.entitasData.id, form)
    : await create(form)

  if (res.success) {
    emit('saved')
  } else {
    if (res.errors) Object.assign(errors, res.errors)
    else errorMessage.value = 'Gagal menyimpan data'
  }
}
</script>
