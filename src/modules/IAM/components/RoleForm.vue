<template>
  <BaseModal
    :model-value="modelValue"
    :title="isEditing ? 'Edit Role' : 'Tambah Role'"
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
            :icon="isEditing ? 'ri-shield-check-line' : 'ri-shield-star-line'"
            size="22"
          />
        </VAvatar>
        <div class="flex-grow-1 min-width-0">
          <div class="text-subtitle-2 font-weight-bold text-truncate">
            {{ isEditing ? (form.nama_role || 'Edit Role') : 'Role Baru' }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ isEditing ? 'Perbarui informasi role' : 'Buat role akses pengguna baru' }}
          </div>
        </div>
        <VChip
          v-if="form.name"
          color="primary"
          size="small"
          variant="tonal"
          label
          class="font-weight-bold flex-shrink-0"
        >
          {{ form.name }}
        </VChip>
      </div>

      <!-- Section: Identitas Role -->
      <div
        class="text-caption font-weight-bold text-uppercase d-flex align-center gap-1 mb-2"
        style="color: rgb(var(--v-theme-primary))"
      >
        <VIcon
          icon="ri-shield-line"
          size="13"
        />
        Identitas Role
      </div>
      <VRow dense>
        <VCol
          cols="12"
          md="6"
        >
          <BaseInput
            v-model="form.name"
            label="Kode Role"
            prepend-inner-icon="ri-key-line"
            hint="Contoh: ADMIN, MANAGER, SUPERVISOR, AR, AP"
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
            prepend-inner-icon="ri-text"
            :rules="[v => !!v || 'Nama tampilan wajib diisi']"
            :error-messages="errors.nama_role"
          />
        </VCol>
        <VCol cols="12">
          <VTextField
            v-model="form.keterangan"
            label="Keterangan"
            variant="outlined"
            density="compact"
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
            <div class="text-body-2 font-weight-medium">Status Role</div>
            <div class="text-caption text-medium-emphasis">
              {{ form.status ? 'Aktif — role dapat digunakan' : 'Nonaktif — role dinonaktifkan' }}
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
