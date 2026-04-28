<template>
  <BaseModal
    :model-value="modelValue"
    :title="isEditing ? 'Edit User' : 'Tambah User'"
    :loading="saving"
    @update:model-value="$emit('update:modelValue', $event)"
    @confirm="handleSubmit"
  >
    <VForm ref="formRef">
      <VRow>
        <!-- NIK Karyawan with autocomplete -->
        <VCol cols="12">
          <VAutocomplete
            v-model="selectedKaryawan"
            v-model:search="nikSearch"
            :items="karyawanOptions"
            item-title="nik"
            item-value="id"
            label="NIK Karyawan"
            density="compact"
            variant="outlined"
            placeholder="Ketik NIK untuk mencari..."
            clearable
            no-filter
            return-object
            :loading="nikLoading"
            :error-messages="errors.karyawan_id"
            @update:search="onNikSearch"
            @update:model-value="onKaryawanSelect"
          >
            <template #item="{ props: itemProps, item }">
              <VListItem
                v-bind="itemProps"
                :title="item.raw.nik"
                :subtitle="item.raw.nama_karyawan"
              />
            </template>
            <template #selection="{ item }">
              <span>{{ item.raw.nik }} — {{ item.raw.nama_karyawan }}</span>
            </template>
          </VAutocomplete>
        </VCol>

        <VCol cols="12">
          <BaseInput
            v-model="form.username"
            label="Username"
            :rules="[v => !!v || 'Username wajib diisi']"
            :error-messages="errors.username"
          />
        </VCol>
        <VCol cols="12">
          <BaseInput
            v-model="form.email"
            label="Email"
            type="email"
            :rules="[v => !!v || 'Email wajib diisi']"
            :error-messages="errors.email"
          />
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <BaseInput
            v-model="form.no_hp"
            label="No. HP"
            :error-messages="errors.no_hp"
          />
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <BaseSelect
            v-model="form.role_id"
            label="Role"
            :items="roles"
            item-title="nama_role"
            item-value="id"
            :rules="[v => !!v || 'Role wajib dipilih']"
            :error-messages="errors.role_id"
            :loading="rolesLoading"
          />
        </VCol>
        <VCol
          v-if="!isEditing"
          cols="12"
          md="6"
        >
          <VTextField
            v-model="form.password"
            label="Password"
            variant="outlined"
            density="comfortable"
            :type="showPwd ? 'text' : 'password'"
            :append-inner-icon="showPwd ? 'ri-eye-off-line' : 'ri-eye-line'"
            :rules="[v => !!v || 'Password wajib diisi']"
            :error-messages="errors.password"
            @click:append-inner="showPwd = !showPwd"
          />
        </VCol>
        <VCol
          v-if="isEditing"
          cols="12"
          md="6"
        >
          <VTextField
            v-model="form.password"
            label="Password Baru (kosongkan jika tidak ubah)"
            variant="outlined"
            density="comfortable"
            :type="showPwd ? 'text' : 'password'"
            :append-inner-icon="showPwd ? 'ri-eye-off-line' : 'ri-eye-line'"
            :error-messages="errors.password"
            @click:append-inner="showPwd = !showPwd"
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
import api from '@/utils/axios.js'
import { BOOLEAN_STATUS_OPTIONS, normalizeBooleanStatus } from '@/utils/status.js'

const props = defineProps({
  modelValue: Boolean,
  userData: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const { create, update, saving, errors: crudErrors } = useCrud('/iam/users')
const { items: roles, loading: rolesLoading, fetchAll: fetchRoles } = useCrud('/iam/roles')

const formRef = ref(null)
const showPwd = ref(false)
const errorMessage = ref('')
const errors = reactive({ username: [], email: [], password: [], no_hp: [], role_id: [], karyawan_id: [] })

// NIK autocomplete state
const nikSearch = ref('')
const nikLoading = ref(false)
const karyawanOptions = ref([])
const selectedKaryawan = ref(null)
let nikDebounceTimer = null

const isEditing = computed(() => !!props.userData)

const statusOptions = BOOLEAN_STATUS_OPTIONS

const defaultForm = () => ({ username: '', email: '', no_hp: '', password: '', role_id: null, status: 1, karyawan_id: null })
const form = reactive(defaultForm())

async function onNikSearch(val) {
  if (!val || val.length < 1) {
    karyawanOptions.value = []
    
    return
  }
  clearTimeout(nikDebounceTimer)
  nikDebounceTimer = setTimeout(async () => {
    nikLoading.value = true
    try {
      const params = { nik: val }
      if (isEditing.value && props.userData?.id) params.exclude_user_id = props.userData.id
      const res = await api.get('/master/karyawan/search', { params })

      karyawanOptions.value = res.data?.data ?? []
    } catch {
      karyawanOptions.value = []
    } finally {
      nikLoading.value = false
    }
  }, 300)
}

function onKaryawanSelect(val) {
  form.karyawan_id = val?.id ?? null
}

watch(() => props.modelValue, val => {
  if (val) {
    Object.assign(errors, { username: [], email: [], password: [], no_hp: [], role_id: [], karyawan_id: [] })
    errorMessage.value = ''
    showPwd.value = false
    nikSearch.value = ''
    karyawanOptions.value = []
    fetchRoles()
    if (props.userData) {
      form.username = props.userData.username ?? ''
      form.email = props.userData.email ?? ''
      form.no_hp = props.userData.no_hp ?? ''
      form.password = ''
      form.role_id = props.userData.role?.id ?? null
      form.status = normalizeBooleanStatus(props.userData.status)
      form.karyawan_id = props.userData.karyawan_id ?? null

      // Pre-populate karyawan display if editing
      if (props.userData.karyawan) {
        selectedKaryawan.value = props.userData.karyawan
        karyawanOptions.value = [props.userData.karyawan]
      } else {
        selectedKaryawan.value = null
      }
    } else {
      Object.assign(form, defaultForm())
      selectedKaryawan.value = null
    }
  }
})

async function handleSubmit() {
  errorMessage.value = ''
  Object.keys(errors).forEach(k => (errors[k] = []))

  const { valid } = await formRef.value.validate()
  if (!valid) return

  const payload = { ...form }
  if (isEditing.value && !payload.password) delete payload.password

  const res = isEditing.value
    ? await update(props.userData.id, payload)
    : await create(payload)

  if (res.success) {
    emit('saved')
  } else {
    if (res.errors) Object.assign(errors, res.errors)
    else errorMessage.value = 'Gagal menyimpan data'
  }
}
</script>
