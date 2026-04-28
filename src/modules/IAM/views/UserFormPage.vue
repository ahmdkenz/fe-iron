<template>
  <div>
    <PageHeader 
      :title="isEditing ? 'Edit User' : 'Tambah User'" 
      subtitle="Kelola akun pengguna sistem"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Data User', to: '/iam/users' },
        { title: isEditing ? 'Edit User' : 'Tambah User', disabled: true }
      ]"
    >
      <VBtn
        variant="tonal"
        color="secondary"
        :to="{ name: 'iam-users' }"
      >
        <VIcon
          icon="ri-arrow-left-line"
          class="me-1"
        />
        Kembali
      </VBtn>
    </PageHeader>

    <div
      v-if="pageLoading"
      class="d-flex justify-center align-center py-12"
    >
      <VProgressCircular
        indeterminate
        color="primary"
      />
    </div>

    <VForm
      v-else
      ref="formRef"
      @submit.prevent
    >
      <!-- Karyawan -->
      <VCard class="mb-4">
        <VCardTitle class="pa-4 pb-2">
          <VIcon
            icon="ri-user-search-line"
            class="me-2"
          />
          Data Karyawan
        </VCardTitle>
        <VDivider />
        <VCardText>
          <VRow>
            <VCol
              cols="12"
              md="8"
            >
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
          </VRow>
        </VCardText>
      </VCard>

      <!-- Akun & Akses -->
      <VCard class="mb-4">
        <VCardTitle class="pa-4 pb-2">
          <VIcon
            icon="ri-shield-user-line"
            class="me-2"
          />
          Akun &amp; Akses
        </VCardTitle>
        <VDivider />
        <VCardText>
          <VRow>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="form.username"
                label="Username"
                density="compact"
                variant="outlined"
                :rules="[v => !!v || 'Username wajib diisi']"
                :error-messages="errors.username"
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
                :rules="[v => !!v || 'Email wajib diisi']"
                :error-messages="errors.email"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="form.no_hp"
                label="No. HP"
                density="compact"
                variant="outlined"
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
              cols="12"
              md="6"
            >
              <VTextField
                v-model="form.password"
                :label="isEditing ? 'Password Baru (kosongkan jika tidak ingin mengubah)' : 'Password'"
                density="compact"
                variant="outlined"
                :type="showPwd ? 'text' : 'password'"
                :append-inner-icon="showPwd ? 'ri-eye-off-line' : 'ri-eye-line'"
                :rules="isEditing ? [] : [v => !!v || 'Password wajib diisi']"
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
        </VCardText>
      </VCard>

      <VAlert
        v-if="errorMessage"
        type="error"
        variant="tonal"
        class="mb-4"
      >
        {{ errorMessage }}
      </VAlert>

      <div class="d-flex justify-end gap-3">
        <VBtn
          variant="tonal"
          color="secondary"
          :to="{ name: 'iam-users' }"
        >
          Batal
        </VBtn>
        <VBtn
          color="primary"
          :disabled="saving"
          @click="handleSubmit"
        >
          <VIcon
            icon="ri-save-line"
            class="me-1"
          />
          Simpan
        </VBtn>
      </div>
    </VForm>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCrud } from '@/composables/useCrud.js'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { setFlashAlert } from '@/utils/flashAlert'
import api from '@/utils/axios.js'
import { BOOLEAN_STATUS_OPTIONS, normalizeBooleanStatus } from '@/utils/status.js'

const route = useRoute()
const router = useRouter()
const { showError } = useSweetAlert()
const id = route.params.id
const isEditing = computed(() => !!id)

const { create, update, saving, fetchOne } = useCrud('/iam/users')
const { items: roles, loading: rolesLoading, fetchAll: fetchRoles } = useCrud('/iam/roles')

const formRef      = ref(null)
const showPwd      = ref(false)
const pageLoading  = ref(!!id)
const errorMessage = ref('')
const errors = reactive({ username: [], email: [], password: [], no_hp: [], role_id: [], karyawan_id: [] })

const nikSearch       = ref('')
const nikLoading      = ref(false)
const karyawanOptions = ref([])
const selectedKaryawan = ref(null)
let nikDebounceTimer = null

const statusOptions = BOOLEAN_STATUS_OPTIONS

const form = reactive({ username: '', email: '', no_hp: '', password: '', role_id: null, status: 1, karyawan_id: null })

async function onNikSearch(val) {
  if (!val || val.length < 1) { karyawanOptions.value = [] 

    return }
  clearTimeout(nikDebounceTimer)
  nikDebounceTimer = setTimeout(async () => {
    nikLoading.value = true
    try {
      const res = await api.get('/master/karyawan/search', {
        params: { nik: val, ...(id ? { exclude_user_id: id } : {}) },
      })

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

async function handleSubmit() {
  errorMessage.value = ''
  Object.keys(errors).forEach(k => (errors[k] = []))

  const { valid } = await formRef.value.validate()
  if (!valid) return
  const payload = { ...form }
  if (isEditing.value && !payload.password) delete payload.password
  const res = isEditing.value ? await update(id, payload) : await create(payload)
  if (res.success) {
    setFlashAlert({
      icon: 'success',
      title: 'Berhasil',
      text: isEditing.value ? 'Perubahan user berhasil disimpan.' : 'User berhasil ditambahkan.',
    })
    router.push({ name: 'iam-users' })
  } else {
    if (res.errors) Object.assign(errors, res.errors)
    else {
      errorMessage.value = res.message ?? 'Gagal menyimpan data'
      await showError(errorMessage.value)
    }
  }
}

onMounted(async () => {
  await fetchRoles()
  if (!isEditing.value) { pageLoading.value = false 

    return }
  const data = await fetchOne(id)
  if (data) {
    form.username    = data.username    ?? ''
    form.email       = data.email       ?? ''
    form.no_hp       = data.no_hp       ?? ''
    form.password    = ''
    form.role_id     = data.role?.id    ?? null
    form.status      = normalizeBooleanStatus(data.status)
    form.karyawan_id = data.karyawan_id ?? null
    if (data.karyawan) {
      selectedKaryawan.value = data.karyawan
      karyawanOptions.value  = [data.karyawan]
    }
  }
  pageLoading.value = false
})
</script>
