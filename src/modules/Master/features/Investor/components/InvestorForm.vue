<template>
  <BaseModal
    :model-value="modelValue"
    :title="isEditing ? 'Edit Investor' : 'Tambah Investor'"
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
            :icon="isEditing ? 'ri-edit-box-line' : 'ri-money-dollar-circle-line'"
            size="22"
          />
        </VAvatar>
        <div class="flex-grow-1 min-width-0">
          <div class="text-subtitle-2 font-weight-bold text-truncate">
            {{ isEditing ? (form.nama_investor || 'Edit Investor') : 'Investor Baru' }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ isEditing ? 'Perbarui data investor' : 'Isi detail investor yang akan ditambahkan' }}
          </div>
        </div>
      </div>

      <!-- Section: Data Investor -->
      <div
        class="text-caption font-weight-bold text-uppercase d-flex align-center gap-1 mb-2"
        style="color: rgb(var(--v-theme-primary))"
      >
        <VIcon
          icon="ri-user-line"
          size="13"
        />
        Data Investor
      </div>
      <VRow dense>
        <VCol cols="12">
          <VTextField
            v-model="form.nama_investor"
            label="Nama Investor"
            density="compact"
            variant="outlined"
            prepend-inner-icon="ri-user-line"
            :rules="[v => !!v || 'Nama investor wajib diisi']"
            :error-messages="errors.nama_investor"
          />
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            v-model="form.ktp"
            label="No. KTP"
            density="compact"
            variant="outlined"
            prepend-inner-icon="ri-id-card-line"
            :error-messages="errors.ktp"
          />
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            v-model="form.npwp"
            label="NPWP"
            density="compact"
            variant="outlined"
            prepend-inner-icon="ri-file-paper-line"
            :error-messages="errors.npwp"
          />
        </VCol>
        <VCol cols="12">
          <VTextField
            v-model="form.no_hp"
            label="No. HP"
            density="compact"
            variant="outlined"
            prepend-inner-icon="ri-phone-line"
            :error-messages="errors.no_hp"
          />
        </VCol>
      </VRow>

      <!-- Section: Data Pengelola -->
      <div
        class="text-caption font-weight-bold text-uppercase d-flex align-center gap-1 mt-3 mb-2"
        style="color: rgb(var(--v-theme-info))"
      >
        <VIcon
          icon="ri-user-star-line"
          size="13"
        />
        Data Pengelola
      </div>
      <VRow dense>
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            v-model="form.pengelola"
            label="Nama Pengelola"
            density="compact"
            variant="outlined"
            prepend-inner-icon="ri-user-star-line"
            :error-messages="errors.pengelola"
          />
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            v-model="form.no_hp_pengelola"
            label="No. HP Pengelola"
            density="compact"
            variant="outlined"
            prepend-inner-icon="ri-phone-line"
            :error-messages="errors.no_hp_pengelola"
          />
        </VCol>
      </VRow>

      <!-- Section: Data Cabang -->
      <div
        class="text-caption font-weight-bold text-uppercase d-flex align-center gap-1 mt-3 mb-2"
        style="color: rgb(var(--v-theme-secondary))"
      >
        <VIcon
          icon="ri-git-branch-line"
          size="13"
        />
        Data Cabang
      </div>
      <VRow dense>
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            v-model="form.kode_cabang"
            label="Kode Cabang"
            density="compact"
            variant="outlined"
            prepend-inner-icon="ri-barcode-line"
            :error-messages="errors.kode_cabang"
          />
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            v-model="form.id_cabang"
            label="ID Cabang"
            density="compact"
            variant="outlined"
            prepend-inner-icon="ri-hashtag"
            :error-messages="errors.id_cabang"
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
              Status Investor
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ form.status ? 'Aktif — investor terdaftar' : 'Nonaktif — investor dinonaktifkan' }}
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
  investorData: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const { create, update, saving } = useCrud('/master/investor')

const formRef      = ref(null)
const errorMessage = ref('')

const errors = reactive({
  nama_investor: [], ktp: [], npwp: [], no_hp: [],
  pengelola: [], no_hp_pengelola: [], kode_cabang: [], id_cabang: [],
})

const isEditing = computed(() => !!props.investorData)

const statusOptions = BOOLEAN_STATUS_OPTIONS

const defaultForm = () => ({
  nama_investor: '',
  ktp: '',
  npwp: '',
  no_hp: '',
  pengelola: '',
  no_hp_pengelola: '',
  kode_cabang: '',
  id_cabang: '',
  status: 1,
})

const form = reactive(defaultForm())

watch([() => props.modelValue, () => props.investorData], ([open]) => {
  if (!open) return
  Object.assign(errors, {
    nama_investor: [], ktp: [], npwp: [], no_hp: [],
    pengelola: [], no_hp_pengelola: [], kode_cabang: [], id_cabang: [],
  })
  errorMessage.value = ''

  if (props.investorData) {
    Object.assign(form, {
      nama_investor: props.investorData.nama_investor   ?? '',
      ktp: props.investorData.ktp             ?? '',
      npwp: props.investorData.npwp            ?? '',
      no_hp: props.investorData.no_hp           ?? '',
      pengelola: props.investorData.pengelola       ?? '',
      no_hp_pengelola: props.investorData.no_hp_pengelola ?? '',
      kode_cabang: props.investorData.kode_cabang    ?? '',
      id_cabang: props.investorData.id_cabang      ?? '',
      status: normalizeBooleanStatus(props.investorData.status),
    })
  } else {
    Object.assign(form, defaultForm())
  }
})

async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  errorMessage.value = ''
  Object.keys(errors).forEach(k => (errors[k] = []))

  const payload = { ...form }

  const res = isEditing.value
    ? await update(props.investorData.id, payload)
    : await create(payload)

  if (res.success) {
    emit('saved')
  } else if (res.errors) {
    Object.entries(res.errors).forEach(([k, v]) => { if (k in errors) errors[k] = v })
  } else {
    errorMessage.value = res.message ?? 'Terjadi kesalahan'
  }
}
</script>
