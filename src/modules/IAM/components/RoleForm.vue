<template>
  <BaseModal
    :model-value="modelValue"
    :title="isEditing ? 'Edit Role' : 'Tambah Role'"
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
          <BaseInput
            v-model="form.name"
            label="Kode Role"
            hint="Bisa uppercase atau lowercase. Contoh: ADMIN, DIREKTUR, MANAGER, SUPERVISOR, AR, AP"
            persistent-hint
            :rules="[v => !!v || 'Kode wajib diisi']"
            :error-messages="errors.name"
            :disabled="isEditing"
            autocapitalize="off"
            spellcheck="false"
          />
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <BaseInput
            v-model="form.nama_role"
            label="Nama Tampilan"
            :rules="[v => !!v || 'Nama tampilan wajib diisi']"
            :error-messages="errors.nama_role"
          />
        </VCol>
        <VCol cols="12">
          <VTextField
            v-model="form.keterangan"
            label="Keterangan"
            variant="outlined"
            density="comfortable"
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
  roleData: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const { create, update, saving } = useCrud('/iam/roles')

const formRef = ref(null)
const errorMessage = ref('')
const errors = reactive({ name: [], nama_role: [], keterangan: [] })

const isEditing = computed(() => !!props.roleData)

const statusOptions = BOOLEAN_STATUS_OPTIONS

const defaultForm = () => ({ name: '', nama_role: '', keterangan: '', status: 1 })
const form = reactive(defaultForm())

watch(() => props.modelValue, val => {
  if (val) {
    Object.assign(errors, { name: [], nama_role: [], keterangan: [] })
    errorMessage.value = ''
    if (props.roleData) {
      form.name = props.roleData.name ?? ''
      form.nama_role = props.roleData.nama_role ?? ''
      form.keterangan = props.roleData.keterangan ?? ''
      form.status = normalizeBooleanStatus(props.roleData.status)
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
    ? await update(props.roleData.id, form)
    : await create(form)

  if (res.success) {
    emit('saved')
  } else {
    if (res.errors) Object.assign(errors, res.errors)
    else errorMessage.value = 'Gagal menyimpan data'
  }
}
</script>
