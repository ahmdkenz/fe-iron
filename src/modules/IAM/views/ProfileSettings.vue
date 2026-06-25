<template>
  <div>
    <PageHeader
      title="Pengaturan Profil"
      subtitle="Kelola informasi akun Anda"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Pengaturan Profil', disabled: true },
      ]"
    />

    <!-- Card 1: Informasi Profil (read-only) -->
    <VCard class="mb-4">
      <VCardTitle class="pa-4 pb-2 d-flex align-center">
        <VIcon icon="ri-user-3-line" class="me-2" />
        Informasi Profil
      </VCardTitle>
      <VDivider />
      <VCardText>
        <VRow>
          <VCol cols="12" md="6">
            <VTextField
              label="Nama Karyawan"
              :model-value="namaKaryawan"
              readonly
              variant="filled"
              density="compact"
            />
          </VCol>
          <VCol cols="12" md="6">
            <VTextField
              label="NIK"
              :model-value="authStore.user?.karyawan?.nik ?? '-'"
              readonly
              variant="filled"
              density="compact"
            />
          </VCol>
          <VCol cols="12" md="6">
            <VTextField
              label="Perusahaan"
              :model-value="authStore.user?.karyawan?.perusahaan?.nama_perusahaan ?? '-'"
              readonly
              variant="filled"
              density="compact"
            />
          </VCol>
          <VCol cols="12" md="6">
            <VTextField
              label="Role"
              :model-value="namaRole"
              readonly
              variant="filled"
              density="compact"
            />
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Card 2: Edit Info Akun -->
    <VForm ref="profileFormRef" @submit.prevent="handleUpdateProfile">
      <VCard class="mb-4">
        <VCardTitle class="pa-4 pb-2 d-flex align-center">
          <VIcon icon="ri-edit-line" class="me-2" />
          Edit Info Akun
        </VCardTitle>
        <VDivider />
        <VCardText>
          <VRow>
            <VCol cols="12" md="6">
              <VTextField
                v-model="form.username"
                label="Username"
                density="compact"
                variant="outlined"
                :rules="[v => !!v || 'Username wajib diisi', v => (v && v.length >= 3) || 'Minimal 3 karakter']"
                :error-messages="errors.username"
                @input="errors.username = []"
              />
            </VCol>
            <VCol cols="12" md="6">
              <VTextField
                v-model="form.email"
                label="Email"
                type="email"
                density="compact"
                variant="outlined"
                :rules="[v => !!v || 'Email wajib diisi']"
                :error-messages="errors.email"
                @input="errors.email = []"
              />
            </VCol>
            <VCol cols="12" md="6">
              <VTextField
                v-model="form.no_hp"
                label="No. HP"
                density="compact"
                variant="outlined"
                :error-messages="errors.no_hp"
                @input="errors.no_hp = []"
              />
            </VCol>
          </VRow>
        </VCardText>
        <VCardActions class="pa-4 justify-end">
          <VBtn
            color="primary"
            :loading="savingProfile"
            type="submit"
          >
            <VIcon icon="ri-save-line" class="me-1" />
            Simpan Perubahan
          </VBtn>
        </VCardActions>
      </VCard>
    </VForm>

    <!-- Card 3: Ubah Password -->
    <VForm ref="passwordFormRef" @submit.prevent="handleUpdatePassword">
      <VCard>
        <VCardTitle class="pa-4 pb-2 d-flex align-center">
          <VIcon icon="ri-lock-password-line" class="me-2" />
          Ubah Password
        </VCardTitle>
        <VDivider />
        <VCardText>
          <VRow>
            <VCol cols="12" md="6">
              <VTextField
                v-model="passwordForm.current_password"
                label="Password Saat Ini"
                density="compact"
                variant="outlined"
                :type="showCurrentPwd ? 'text' : 'password'"
                :append-inner-icon="showCurrentPwd ? 'ri-eye-off-line' : 'ri-eye-line'"
                :rules="[v => !!v || 'Password saat ini wajib diisi']"
                :error-messages="passwordErrors.current_password"
                @click:append-inner="showCurrentPwd = !showCurrentPwd"
                @input="passwordErrors.current_password = []"
              />
            </VCol>
            <VCol cols="12" md="6">
              <VTextField
                v-model="passwordForm.new_password"
                label="Password Baru"
                density="compact"
                variant="outlined"
                :type="showNewPwd ? 'text' : 'password'"
                :append-inner-icon="showNewPwd ? 'ri-eye-off-line' : 'ri-eye-line'"
                :rules="[v => !!v || 'Password baru wajib diisi']"
                :error-messages="passwordErrors.new_password"
                @click:append-inner="showNewPwd = !showNewPwd"
                @input="passwordErrors.new_password = []"
              />
            </VCol>
            <VCol cols="12" md="6">
              <VTextField
                v-model="passwordForm.new_password_confirmation"
                label="Konfirmasi Password Baru"
                density="compact"
                variant="outlined"
                :type="showConfirmPwd ? 'text' : 'password'"
                :append-inner-icon="showConfirmPwd ? 'ri-eye-off-line' : 'ri-eye-line'"
                :rules="[v => !!v || 'Konfirmasi password wajib diisi']"
                :error-messages="passwordErrors.new_password_confirmation"
                @click:append-inner="showConfirmPwd = !showConfirmPwd"
                @input="passwordErrors.new_password_confirmation = []"
              />
            </VCol>
          </VRow>
          <VAlert
            type="info"
            variant="tonal"
            class="mt-3"
            density="compact"
          >
            Password harus minimal 8 karakter dan mengandung huruf besar, huruf kecil, angka, dan karakter spesial.
          </VAlert>
        </VCardText>
        <VCardActions class="pa-4 justify-end">
          <VBtn
            color="warning"
            :loading="savingPassword"
            type="submit"
          >
            <VIcon icon="ri-lock-line" class="me-1" />
            Ubah Password
          </VBtn>
        </VCardActions>
      </VCard>
    </VForm>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useSweetAlert } from '@/composables/useSweetAlert'
import api from '@/utils/axios'
import PageHeader from '@/components/shared/PageHeader.vue'

const authStore = useAuthStore()
const { showSuccess, showError, showLoading, closeAlert } = useSweetAlert()

const namaKaryawan = computed(() =>
  authStore.user?.karyawan?.nama_karyawan ?? authStore.user?.username ?? '-'
)

const namaRole = computed(() =>
  authStore.user?.role?.nama_role ?? authStore.user?.role?.name ?? authStore.user?.roles?.[0] ?? '-'
)

// ── Profile form ──
const profileFormRef = ref(null)
const savingProfile = ref(false)

const form = reactive({ username: '', email: '', no_hp: '' })
const errors = reactive({ username: [], email: [], no_hp: [] })

onMounted(() => {
  form.username = authStore.user?.username ?? ''
  form.email    = authStore.user?.email    ?? ''
  form.no_hp    = authStore.user?.no_hp    ?? ''
})

async function handleUpdateProfile() {
  errors.username = []
  errors.email    = []
  errors.no_hp    = []

  const { valid } = await profileFormRef.value.validate()
  if (!valid) return

  savingProfile.value = true
  showLoading({ title: 'Menyimpan Profil...', text: 'Perubahan sedang diproses.' })

  try {
    await api.put('/auth/profile', {
      username: form.username,
      email:    form.email,
      no_hp:    form.no_hp,
    })
    await authStore.fetchMe()
    closeAlert({ onlyLoading: true })
    showSuccess({ title: 'Berhasil', text: 'Profil berhasil diperbarui.' })
  } catch (err) {
    closeAlert({ onlyLoading: true })
    const serverErrors = err.response?.data?.errors ?? {}
    if (serverErrors.username) errors.username = serverErrors.username
    if (serverErrors.email)    errors.email    = serverErrors.email
    if (serverErrors.no_hp)    errors.no_hp    = serverErrors.no_hp
    if (!Object.keys(serverErrors).length) {
      showError({ title: 'Gagal', text: err.response?.data?.message ?? 'Gagal menyimpan profil.' })
    }
  } finally {
    savingProfile.value = false
  }
}

// ── Password form ──
const passwordFormRef = ref(null)
const savingPassword  = ref(false)
const showCurrentPwd  = ref(false)
const showNewPwd      = ref(false)
const showConfirmPwd  = ref(false)

const passwordForm = reactive({
  current_password:          '',
  new_password:              '',
  new_password_confirmation: '',
})

const passwordErrors = reactive({
  current_password:          [],
  new_password:              [],
  new_password_confirmation: [],
})

async function handleUpdatePassword() {
  passwordErrors.current_password          = []
  passwordErrors.new_password              = []
  passwordErrors.new_password_confirmation = []

  const { valid } = await passwordFormRef.value.validate()
  if (!valid) return

  savingPassword.value = true
  showLoading({ title: 'Mengubah Password...', text: 'Perubahan sedang diproses.' })

  try {
    await api.put('/auth/profile/password', { ...passwordForm })
    passwordForm.current_password          = ''
    passwordForm.new_password              = ''
    passwordForm.new_password_confirmation = ''
    passwordFormRef.value.reset()
    closeAlert({ onlyLoading: true })
    showSuccess({ title: 'Berhasil', text: 'Password berhasil diperbarui.' })
  } catch (err) {
    closeAlert({ onlyLoading: true })
    const serverErrors = err.response?.data?.errors ?? {}
    if (serverErrors.current_password)          passwordErrors.current_password          = serverErrors.current_password
    if (serverErrors.new_password)              passwordErrors.new_password              = serverErrors.new_password
    if (serverErrors.new_password_confirmation) passwordErrors.new_password_confirmation = serverErrors.new_password_confirmation
    if (!Object.keys(serverErrors).length) {
      showError({ title: 'Gagal', text: err.response?.data?.message ?? 'Gagal mengubah password.' })
    }
  } finally {
    savingPassword.value = false
  }
}
</script>
