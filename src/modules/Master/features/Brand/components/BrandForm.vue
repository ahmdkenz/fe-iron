<template>
  <BaseModal
    :model-value="modelValue"
    :title="isEditing ? 'Edit Brand' : 'Tambah Brand'"
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
            :icon="isEditing ? 'ri-edit-box-line' : 'ri-award-fill'"
            size="22"
          />
        </VAvatar>
        <div class="flex-grow-1 min-width-0">
          <div class="text-subtitle-2 font-weight-bold text-truncate">
            {{ isEditing ? (form.nama_brand || 'Edit Brand') : 'Brand Baru' }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ isEditing ? 'Perbarui informasi brand' : 'Isi detail brand yang akan ditambahkan' }}
          </div>
        </div>
        <VChip
          v-if="form.kode_brand"
          color="primary"
          size="small"
          variant="tonal"
          label
          class="font-weight-bold flex-shrink-0"
        >
          {{ form.kode_brand }}
        </VChip>
      </div>

      <!-- Section: Identitas Brand -->
      <div
        class="text-caption font-weight-bold text-uppercase d-flex align-center gap-1 mb-2"
        style="color: rgb(var(--v-theme-primary))"
      >
        <VIcon
          icon="ri-award-line"
          size="13"
        />
        Identitas Brand
      </div>
      <VRow dense>
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            v-model="form.kode_brand"
            label="Kode Brand"
            density="compact"
            variant="outlined"
            prepend-inner-icon="ri-barcode-line"
            :rules="[v => !!v || 'Kode brand wajib diisi']"
            :error-messages="errors.kode_brand"
            :disabled="isEditing"
            @input="form.kode_brand = form.kode_brand.toUpperCase()"
          />
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            v-model="form.nama_brand"
            label="Nama Brand"
            density="compact"
            variant="outlined"
            prepend-inner-icon="ri-award-line"
            :rules="[v => !!v || 'Nama brand wajib diisi']"
            :error-messages="errors.nama_brand"
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
            <div class="text-body-2 font-weight-medium">Status Brand</div>
            <div class="text-caption text-medium-emphasis">
              {{ form.status ? 'Aktif — brand dapat digunakan' : 'Nonaktif — brand dinonaktifkan' }}
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
  brandData: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const { create, update, saving } = useCrud('/master/brand')

const formRef      = ref(null)
const errorMessage = ref('')
const errors = reactive({ kode_brand: [], nama_brand: [], keterangan: [] })

const isEditing = computed(() => !!props.brandData)

const statusOptions = BOOLEAN_STATUS_OPTIONS

const defaultForm = () => ({
  kode_brand: '',
  nama_brand: '',
  keterangan: '',
  status: 1,
})

const form = reactive(defaultForm())

watch([() => props.modelValue, () => props.brandData], ([open]) => {
  if (!open) return
  Object.assign(errors, { kode_brand: [], nama_brand: [], keterangan: [] })
  errorMessage.value = ''

  if (props.brandData) {
    Object.assign(form, {
      kode_brand: props.brandData.kode_brand ?? '',
      nama_brand: props.brandData.nama_brand ?? '',
      keterangan: props.brandData.keterangan ?? '',
      status: normalizeBooleanStatus(props.brandData.status),
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

  const res = isEditing.value
    ? await update(props.brandData.id, { ...form })
    : await create({ ...form })

  if (res.success) {
    emit('saved')
  } else if (res.errors) {
    Object.entries(res.errors).forEach(([k, v]) => { if (k in errors) errors[k] = v })
  } else {
    errorMessage.value = res.message ?? 'Terjadi kesalahan'
  }
}
</script>
