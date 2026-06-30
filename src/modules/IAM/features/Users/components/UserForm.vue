<template>
  <BaseModal
    :model-value="modelValue"
    :title="isEditing ? 'Edit User' : 'Tambah User'"
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
            :icon="isEditing ? 'ri-user-settings-line' : 'ri-user-add-line'"
            size="22"
          />
        </VAvatar>
        <div class="flex-grow-1 min-width-0">
          <div class="text-subtitle-2 font-weight-bold text-truncate">
            {{ isEditing ? (form.username || 'Edit User') : 'User Baru' }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ isEditing ? 'Perbarui data akun pengguna' : 'Isi detail akun yang akan dibuat' }}
          </div>
        </div>
      </div>

      <!-- Section: Identitas Akun -->
      <div
        class="text-caption font-weight-bold text-uppercase d-flex align-center gap-1 mb-2"
        style="color: rgb(var(--v-theme-primary))"
      >
        <VIcon
          icon="ri-account-circle-line"
          size="13"
        />
        Identitas Akun
      </div>
      <VRow dense>
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
            prepend-inner-icon="ri-fingerprint-line"
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
            prepend-inner-icon="ri-at-line"
            :rules="[v => !!v || 'Username wajib diisi']"
            :error-messages="errors.username"
          />
        </VCol>
        <VCol cols="12">
          <BaseInput
            v-model="form.email"
            label="Email"
            type="email"
            prepend-inner-icon="ri-mail-line"
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
            prepend-inner-icon="ri-phone-line"
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
            prepend-inner-icon="ri-shield-user-line"
            :items="roles"
            item-title="nama_role"
            item-value="id"
            :rules="[v => !!v || 'Role wajib dipilih']"
            :error-messages="errors.role_id"
            :loading="rolesLoading"
          />
        </VCol>
      </VRow>

      <!-- Section: Keamanan -->
      <div
        class="text-caption font-weight-bold text-uppercase d-flex align-center gap-1 mt-3 mb-2"
        style="color: rgb(var(--v-theme-warning))"
      >
        <VIcon
          icon="ri-lock-line"
          size="13"
        />
        Keamanan
      </div>
      <VRow dense>
        <VCol
          v-if="!isEditing"
          cols="12"
        >
          <VTextField
            v-model="form.password"
            label="Password"
            variant="outlined"
            density="compact"
            prepend-inner-icon="ri-key-line"
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
        >
          <VTextField
            v-model="form.password"
            label="Password Baru (kosongkan jika tidak ubah)"
            variant="outlined"
            density="compact"
            prepend-inner-icon="ri-key-line"
            :type="showPwd ? 'text' : 'password'"
            :append-inner-icon="showPwd ? 'ri-eye-off-line' : 'ri-eye-line'"
            :error-messages="errors.password"
            @click:append-inner="showPwd = !showPwd"
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
            <div class="text-body-2 font-weight-medium">Status Akun</div>
            <div class="text-caption text-medium-emphasis">
              {{ form.status ? 'Aktif — pengguna dapat login' : 'Nonaktif — akses diblokir' }}
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
