<template>
  <BaseModal
    :model-value="modelValue"
    :title="isEditing ? 'Edit Karyawan' : 'Tambah Karyawan'"
    :loading="saving"
    @update:model-value="$emit('update:modelValue', $event)"
    @confirm="handleSubmit"
  >
    <VForm ref="formRef">
      <!-- Hero Banner -->
      <div
        class="d-flex align-center gap-3 pa-3 rounded-lg mb-4"
        style="background: rgba(var(--v-theme-primary), 0.06); border: 1px solid rgba(var(--v-theme-primary), 0.15)"
      >
        <VAvatar
          :color="isEditing ? 'warning' : 'primary'"
          size="44"
          rounded="lg"
        >
          <VIcon
            :icon="isEditing ? 'ri-edit-box-line' : 'ri-group-line'"
            size="22"
          />
        </VAvatar>
        <div class="flex-grow-1 min-width-0">
          <div class="text-subtitle-2 font-weight-bold text-truncate">
            {{ isEditing ? (form.nama_karyawan || 'Edit Karyawan') : 'Karyawan Baru' }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ isEditing ? 'Perbarui data karyawan' : 'Isi detail karyawan yang akan ditambahkan' }}
          </div>
        </div>
        <VChip
          v-if="form.nik"
          color="primary"
          size="small"
          variant="tonal"
          label
          class="font-weight-bold flex-shrink-0"
        >
          {{ form.nik }}
        </VChip>
      </div>

      <!-- Section: Data Karyawan -->
      <div
        class="text-caption font-weight-bold text-uppercase d-flex align-center gap-1 mb-2"
        style="color: rgb(var(--v-theme-primary))"
      >
        <VIcon
          icon="ri-user-line"
          size="13"
        />
        Data Karyawan
      </div>
      <VRow dense>
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            v-model="form.nik"
            label="NIK"
            density="compact"
            variant="outlined"
            prepend-inner-icon="ri-fingerprint-line"
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
            prepend-inner-icon="ri-user-line"
            :rules="[v => !!v || 'Nama karyawan wajib diisi']"
            :error-messages="errors.nama_karyawan"
          />
        </VCol>
        <VCol cols="12">
          <VAutocomplete
            v-model="form.perusahaan_id"
            label="Entitas"
            density="compact"
            variant="outlined"
            prepend-inner-icon="ri-building-4-line"
            :items="entitasList"
            item-title="nama_perusahaan"
            item-value="id"
            :rules="[v => !!v || 'Entitas wajib dipilih']"
            :error-messages="errors.perusahaan_id"
            :loading="entitasLoading"
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
            prepend-inner-icon="ri-sticky-note-line"
            :error-messages="errors.keterangan"
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
            <div class="text-body-2 font-weight-medium">Status Karyawan</div>
            <div class="text-caption text-medium-emphasis">
              {{ form.status ? 'Aktif — karyawan terdaftar' : 'Nonaktif — karyawan dinonaktifkan' }}
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
  karyawanData: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const { create, update, saving } = useCrud('/master/karyawan')
const { items: entitasList, loading: entitasLoading, fetchAll: fetchEntitas } = useCrud('/master/perusahaan')

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

watch([() => props.modelValue, () => props.karyawanData], ([open]) => {
  if (!open) return
  Object.assign(errors, { nik: [], nama_karyawan: [], perusahaan_id: [], keterangan: [] })
  errorMessage.value = ''
  fetchEntitas()
  if (props.karyawanData) {
    form.nik           = props.karyawanData.nik ?? ''
    form.nama_karyawan = props.karyawanData.nama_karyawan ?? ''
    form.perusahaan_id = props.karyawanData.perusahaan_id ?? null
    form.keterangan    = props.karyawanData.keterangan ?? ''
    form.status        = normalizeBooleanStatus(props.karyawanData.status)
  } else {
    Object.assign(form, defaultForm())
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
