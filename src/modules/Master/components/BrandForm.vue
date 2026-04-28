<template>
  <BaseModal
    :model-value="modelValue"
    :title="isEditing ? 'Edit Brand' : 'Tambah Brand'"
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
            v-model="form.kode_brand"
            label="Kode Brand"
            density="compact"
            variant="outlined"
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
            :rules="[v => !!v || 'Nama brand wajib diisi']"
            :error-messages="errors.nama_brand"
          />
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
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

watch(() => props.modelValue, val => {
  if (val) {
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
