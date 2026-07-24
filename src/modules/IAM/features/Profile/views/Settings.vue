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

    <!-- ── Hero Card ── -->
    <VCard
      class="profile-hero mb-5"
      elevation="3"
    >
      <div class="hero-circle hero-circle--top" />
      <div class="hero-circle hero-circle--bottom" />

      <VCardText class="hero-content pa-6 d-flex align-center gap-x-5">
        <div class="avatar-wrapper">
          <div class="avatar-ring" />
          <VAvatar
            size="88"
            color="white"
            class="avatar-inner elevation-4"
          >
            <span class="text-h4 font-weight-bold text-primary">
              {{ namaKaryawan.charAt(0).toUpperCase() }}
            </span>
          </VAvatar>
        </div>

        <div class="flex-grow-1">
          <h2 class="text-h5 font-weight-bold text-white mb-1">
            {{ namaKaryawan }}
          </h2>
          <p class="text-body-2 mb-3 hero-username">
            @{{ authStore.user?.username ?? '-' }}
          </p>
          <div class="d-flex gap-2 flex-wrap">
            <VChip
              size="small"
              variant="outlined"
              class="hero-chip"
            >
              <VIcon
                icon="ri-shield-user-line"
                size="13"
                class="me-1"
              />
              {{ namaRole }}
            </VChip>
            <VChip
              size="small"
              variant="outlined"
              class="hero-chip"
            >
              <VIcon
                icon="ri-building-line"
                size="13"
                class="me-1"
              />
              {{ authStore.user?.karyawan?.perusahaan?.nama_perusahaan ?? '-' }}
            </VChip>
          </div>
        </div>
      </VCardText>
    </VCard>

    <!-- ── Row: Edit Akun + Detail Kepegawaian ── -->
    <VRow class="mb-1">
      <!-- Edit Info Akun -->
      <VCol
        cols="12"
        md="7"
      >
        <VForm
          ref="profileFormRef"
          @submit.prevent="handleUpdateProfile"
        >
          <VCard
            class="h-100"
            elevation="1"
          >
            <div class="section-header">
              <div class="section-icon section-icon--primary me-3">
                <VIcon
                  icon="ri-edit-line"
                  size="18"
                />
              </div>
              <div>
                <div class="text-subtitle-1 font-weight-semibold">
                  Edit Info Akun
                </div>
                <div class="text-caption text-medium-emphasis">
                  Perbarui informasi akun Anda
                </div>
              </div>
            </div>

            <VDivider />

            <VCardText class="pa-5">
              <VRow>
                <VCol cols="12">
                  <VTextField
                    v-model="form.username"
                    label="Username"
                    density="comfortable"
                    variant="outlined"
                    prepend-inner-icon="ri-user-line"
                    :rules="[v => !!v || 'Username wajib diisi', v => (v && v.length >= 3) || 'Minimal 3 karakter']"
                    :error-messages="errors.username"
                    @input="errors.username = []"
                  />
                </VCol>
                <VCol cols="12">
                  <VTextField
                    v-model="form.email"
                    label="Email"
                    type="email"
                    density="comfortable"
                    variant="outlined"
                    prepend-inner-icon="ri-mail-line"
                    :error-messages="errors.email"
                    @input="errors.email = []"
                  />
                </VCol>
                <VCol cols="12">
                  <VTextField
                    v-model="form.no_hp"
                    label="No. HP"
                    density="comfortable"
                    variant="outlined"
                    prepend-inner-icon="ri-phone-line"
                    :error-messages="errors.no_hp"
                    @input="errors.no_hp = []"
                  />
                </VCol>
              </VRow>
            </VCardText>

            <VDivider />

            <VCardActions class="pa-4 justify-end">
              <VBtn
                color="primary"
                :loading="savingProfile"
                type="submit"
                variant="elevated"
                min-width="160"
              >
                <VIcon
                  icon="ri-save-line"
                  class="me-2"
                />
                Simpan Perubahan
              </VBtn>
            </VCardActions>
          </VCard>
        </VForm>
      </VCol>

      <!-- Detail Kepegawaian (read-only) -->
      <VCol
        cols="12"
        md="5"
      >
        <VCard
          class="h-100"
          elevation="1"
        >
          <div class="section-header">
            <div class="section-icon section-icon--info me-3">
              <VIcon
                icon="ri-id-card-line"
                size="18"
              />
            </div>
            <div>
              <div class="text-subtitle-1 font-weight-semibold">
                Detail Kepegawaian
              </div>
              <div class="text-caption text-medium-emphasis">
                Data dari sistem HR
              </div>
            </div>
          </div>

          <VDivider />

          <VCardText class="pa-5">
            <div class="info-item d-flex align-center mb-3">
              <VAvatar
                size="34"
                color="primary"
                variant="tonal"
                class="me-3 flex-shrink-0"
              >
                <VIcon
                  icon="ri-user-line"
                  size="17"
                />
              </VAvatar>
              <div class="min-width-0">
                <div class="text-caption text-medium-emphasis">
                  Nama Karyawan
                </div>
                <div class="text-body-2 font-weight-medium text-truncate">
                  {{ namaKaryawan }}
                </div>
              </div>
            </div>

            <div class="info-item d-flex align-center mb-3">
              <VAvatar
                size="34"
                color="info"
                variant="tonal"
                class="me-3 flex-shrink-0"
              >
                <VIcon
                  icon="ri-fingerprint-line"
                  size="17"
                />
              </VAvatar>
              <div class="min-width-0">
                <div class="text-caption text-medium-emphasis">
                  NIK
                </div>
                <div class="text-body-2 font-weight-medium text-truncate">
                  {{ authStore.user?.karyawan?.nik ?? '-' }}
                </div>
              </div>
            </div>

            <div class="info-item d-flex align-center mb-3">
              <VAvatar
                size="34"
                color="success"
                variant="tonal"
                class="me-3 flex-shrink-0"
              >
                <VIcon
                  icon="ri-building-line"
                  size="17"
                />
              </VAvatar>
              <div class="min-width-0">
                <div class="text-caption text-medium-emphasis">
                  Perusahaan
                </div>
                <div class="text-body-2 font-weight-medium text-truncate">
                  {{ authStore.user?.karyawan?.perusahaan?.nama_perusahaan ?? '-' }}
                </div>
              </div>
            </div>

            <div class="info-item d-flex align-center">
              <VAvatar
                size="34"
                color="warning"
                variant="tonal"
                class="me-3 flex-shrink-0"
              >
                <VIcon
                  icon="ri-shield-user-line"
                  size="17"
                />
              </VAvatar>
              <div class="min-width-0">
                <div class="text-caption text-medium-emphasis">
                  Role
                </div>
                <div class="text-body-2 font-weight-medium text-truncate">
                  {{ namaRole }}
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- ── Ubah Password ── -->
    <VForm
      ref="passwordFormRef"
      @submit.prevent="handleUpdatePassword"
    >
      <VCard
        class="mt-4"
        elevation="1"
      >
        <div class="section-header password-header-tint">
          <div class="section-icon section-icon--warning me-3">
            <VIcon
              icon="ri-lock-password-line"
              size="18"
            />
          </div>
          <div>
            <div class="text-subtitle-1 font-weight-semibold">
              Ubah Password
            </div>
            <div class="text-caption text-medium-emphasis">
              Ganti password akun Anda secara berkala
            </div>
          </div>
        </div>

        <VDivider />

        <VCardText class="pa-5">
          <VRow>
            <VCol
              cols="12"
              md="4"
            >
              <VTextField
                v-model="passwordForm.current_password"
                label="Password Saat Ini"
                density="comfortable"
                variant="outlined"
                prepend-inner-icon="ri-lock-line"
                :type="showCurrentPwd ? 'text' : 'password'"
                :append-inner-icon="showCurrentPwd ? 'ri-eye-off-line' : 'ri-eye-line'"
                :rules="[v => !!v || 'Password saat ini wajib diisi']"
                :error-messages="passwordErrors.current_password"
                @click:append-inner="showCurrentPwd = !showCurrentPwd"
                @input="passwordErrors.current_password = []"
              />
            </VCol>
            <VCol
              cols="12"
              md="4"
            >
              <VTextField
                v-model="passwordForm.new_password"
                label="Password Baru"
                density="comfortable"
                variant="outlined"
                prepend-inner-icon="ri-lock-unlock-line"
                :type="showNewPwd ? 'text' : 'password'"
                :append-inner-icon="showNewPwd ? 'ri-eye-off-line' : 'ri-eye-line'"
                :rules="[v => !!v || 'Password baru wajib diisi']"
                :error-messages="passwordErrors.new_password"
                @click:append-inner="showNewPwd = !showNewPwd"
                @input="passwordErrors.new_password = []"
              />
            </VCol>
            <VCol
              cols="12"
              md="4"
            >
              <VTextField
                v-model="passwordForm.new_password_confirmation"
                label="Konfirmasi Password Baru"
                density="comfortable"
                variant="outlined"
                prepend-inner-icon="ri-lock-2-line"
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
            icon="ri-information-line"
          >
            Password minimal 8 karakter.
          </VAlert>
        </VCardText>

        <VDivider />

        <VCardActions class="pa-4 justify-end">
          <VBtn
            color="warning"
            :loading="savingPassword"
            type="submit"
            variant="elevated"
            min-width="160"
          >
            <VIcon
              icon="ri-lock-line"
              class="me-2"
            />
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
  authStore.user?.karyawan?.nama_karyawan ?? authStore.user?.username ?? '-',
)

const namaRole = computed(() =>
  authStore.user?.role?.nama_role ?? authStore.user?.role?.name ?? authStore.user?.roles?.[0] ?? '-',
)

// ── Profile form ──
const profileFormRef = ref(null)
const savingProfile  = ref(false)

const form   = reactive({ username: '', email: '', no_hp: '' })
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
      email: form.email,
      no_hp: form.no_hp,
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
  current_password: '',
  new_password: '',
  new_password_confirmation: '',
})

const passwordErrors = reactive({
  current_password: [],
  new_password: [],
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

<style scoped>
/* ── Hero Card ── */
.profile-hero {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #162032 0%, rgb(var(--v-theme-primary)) 55%, rgb(var(--v-theme-info)) 100%);
}

.hero-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.07);
  pointer-events: none;
}

.hero-circle--top    { width: 300px; height: 300px; top: -110px; right: -70px; }
.hero-circle--bottom { width: 200px; height: 200px; bottom: -90px; left: -50px; }

.hero-content { position: relative; z-index: 1; }

.hero-username { color: rgba(255, 255, 255, 0.75); }

.hero-chip {
  border-color: rgba(255, 255, 255, 0.45) !important;
  color: white !important;
}

/* ── Avatar with ring ── */
.avatar-wrapper { position: relative; flex-shrink: 0; }

.avatar-ring {
  position: absolute;
  inset: -5px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.1);
  z-index: 0;
}

.avatar-inner { position: relative; z-index: 1; }

/* ── Section Headers ── */
.section-header {
  display: flex;
  align-items: center;
  padding: 1rem 1.25rem;
}

.password-header-tint {
  background: rgba(var(--v-theme-warning), 0.04);
}

/* ── Section Icons (custom, replaces VAvatar tonal) ── */
.section-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.section-icon--primary {
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
}

.section-icon--info {
  background: rgba(var(--v-theme-info), 0.12);
  color: rgb(var(--v-theme-info));
}

.section-icon--warning {
  background: rgba(var(--v-theme-warning), 0.14);
  color: rgb(var(--v-theme-warning));
}

/* ── Info Items (read-only) ── */
.info-item {
  padding: 0.65rem 0.85rem;
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.025);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  transition: background 0.2s ease, border-color 0.2s ease;
}

.info-item:hover {
  background: rgba(var(--v-theme-primary), 0.05);
  border-color: rgba(var(--v-theme-primary), 0.15);
}

.min-width-0 { min-width: 0; }
</style>
