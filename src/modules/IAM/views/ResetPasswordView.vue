<template>
  <div class="rp-root">

    <div class="center-wrap">
      <div class="glass-card">

        <!-- Logo -->
        <div class="card-logo">
          <div class="emblem-orbit">
            <div class="orbit-spin" />
            <div class="emblem-center">
              <span class="emblem-mono">IR</span>
              <span class="emblem-sub">IRON</span>
            </div>
          </div>
        </div>

        <h2 class="card-title">Reset Password</h2>
        <p class="card-sub">Buat password baru untuk akun Anda</p>

        <template v-if="!tokenValid">
          <VAlert type="error" variant="tonal" class="mt-6 mb-4" icon="ri-error-warning-line">
            Link reset password tidak valid atau telah kedaluwarsa.<br />
            Silakan minta link baru.
          </VAlert>
          <VBtn block variant="outlined" class="rp-btn-back" @click="goToLogin">
            <VIcon icon="ri-arrow-left-line" class="me-2" />
            Kembali ke Login
          </VBtn>
        </template>

        <template v-else-if="!resetDone">
          <VForm ref="formRef" @submit.prevent="handleReset" class="mt-6">

            <VTextField
              v-model="form.password"
              label="Password Baru"
              placeholder="············"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="ri-lock-unlock-line"
              :type="showPassword ? 'text' : 'password'"
              :append-inner-icon="showPassword ? 'ri-eye-off-line' : 'ri-eye-line'"
              :rules="[v => !!v || 'Password baru wajib diisi']"
              :error-messages="errors.password"
              class="fx-field mb-4"
              @click:append-inner="showPassword = !showPassword"
              @input="errors.password = []"
            />

            <VTextField
              v-model="form.password_confirmation"
              label="Konfirmasi Password Baru"
              placeholder="············"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="ri-lock-2-line"
              :type="showConfirm ? 'text' : 'password'"
              :append-inner-icon="showConfirm ? 'ri-eye-off-line' : 'ri-eye-line'"
              :rules="[v => !!v || 'Konfirmasi password wajib diisi']"
              :error-messages="errors.password_confirmation"
              class="fx-field mb-2"
              @click:append-inner="showConfirm = !showConfirm"
              @input="errors.password_confirmation = []"
            />

            <VAlert
              type="info"
              variant="tonal"
              density="compact"
              class="mb-4"
              icon="ri-information-line"
            >
              Password harus minimal 8 karakter, mengandung huruf besar, huruf kecil, angka, dan karakter spesial.
            </VAlert>

            <VAlert
              v-if="errorMessage"
              type="error"
              variant="tonal"
              class="mb-4"
              closable
              density="compact"
              @click:close="errorMessage = ''"
            >
              {{ errorMessage }}
            </VAlert>

            <VBtn
              type="submit"
              block
              size="large"
              :loading="isSubmitting"
              :disabled="isSubmitting"
              class="fx-btn"
              elevation="0"
            >
              <template #loader>
                <VProgressCircular indeterminate size="20" width="2" color="current" />
              </template>
              {{ isSubmitting ? 'Memproses...' : 'Reset Password' }}
            </VBtn>

          </VForm>
        </template>

        <template v-else>
          <div class="success-wrap mt-6">
            <div class="success-icon-wrap mb-4">
              <VIcon icon="ri-shield-check-line" size="42" class="success-icon" />
            </div>
            <p class="success-text mb-5">Password berhasil direset. Silakan login dengan password baru Anda.</p>
            <VBtn block size="large" class="fx-btn" elevation="0" @click="goToLogin">
              <VIcon icon="ri-login-circle-line" class="me-2" />
              Login Sekarang
            </VBtn>
          </div>
        </template>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '@/utils/axios'

const router = useRouter()
const route  = useRoute()

const formRef      = ref(null)
const showPassword = ref(false)
const showConfirm  = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')
const resetDone    = ref(false)
const tokenValid   = ref(true)

const form   = reactive({ password: '', password_confirmation: '' })
const errors = reactive({ password: [], password_confirmation: [] })

const token = route.query.token
const email = route.query.email

onMounted(() => {
  if (!token || !email) {
    tokenValid.value = false
  }
})

function goToLogin() {
  router.push({ name: 'login' })
}

async function handleReset() {
  errors.password              = []
  errors.password_confirmation = []
  errorMessage.value           = ''

  const { valid } = await formRef.value.validate()
  if (!valid) return

  try {
    isSubmitting.value = true
    await api.post('/auth/reset-password', {
      token,
      email,
      password:              form.password,
      password_confirmation: form.password_confirmation,
    })
    resetDone.value = true
  } catch (err) {
    const data = err.response?.data
    if (data?.errors?.password) {
      errors.password = data.errors.password
    } else if (data?.errors?.password_confirmation) {
      errors.password_confirmation = data.errors.password_confirmation
    } else {
      errorMessage.value = data?.message ?? 'Gagal mereset password. Silakan coba lagi.'
      if (err.response?.status === 422 && data?.message?.includes('tidak valid')) {
        tokenValid.value = false
      }
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.rp-root {
  min-height: 100vh;
  width: 100%;
  font-family: 'Inter', sans-serif;
  position: relative;
  overflow: hidden;
  background: url('/images/bg/accounting.jpg') center / cover no-repeat fixed;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rp-root::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.52);
  z-index: 0;
}

.center-wrap {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  padding: 16px;
}

.glass-card {
  background: rgba(15, 25, 50, 0.5);
  backdrop-filter: blur(20px) saturate(160%);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 20px;
  padding: 36px 32px 32px;
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.55), 0 2px 8px rgba(0, 0, 0, 0.35);
}

/* ── Logo / Emblem ── */
.card-logo { display: flex; justify-content: center; margin-bottom: 1.4rem; }

.emblem-orbit {
  position: relative;
  width: 72px; height: 72px;
  display: flex; align-items: center; justify-content: center;
}
.orbit-spin {
  position: absolute; inset: 0; border-radius: 50%;
  background: conic-gradient(from 0deg, transparent 40%, #38bdf8 65%, transparent 72%);
  animation: spin 3s linear infinite;
  opacity: 0.65;
}
@keyframes spin { to { transform: rotate(360deg); } }
.emblem-center {
  width: 58px; height: 58px; border-radius: 50%;
  background: rgba(15, 25, 50, 0.5);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.14);
  position: relative; z-index: 1;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 1px;
}
.emblem-mono { font-size: 1.1rem; font-weight: 900; letter-spacing: 3px; color: #38bdf8; line-height: 1; }
.emblem-sub  { font-size: 0.4rem; font-weight: 700; letter-spacing: 0.18em; color: rgba(255,255,255,0.38); text-transform: uppercase; }

.card-title { font-size: 1.5rem; font-weight: 800; color: #ffffff; text-align: center; margin-bottom: 0.3rem; }
.card-sub   { font-size: 0.78rem; color: rgba(255,255,255,0.65); text-align: center; margin: 0 0 0.2rem; }

/* ── Fields ── */
.fx-field :deep(.v-field)                    { background-color: rgba(255,255,255,0.07) !important; border-radius: 10px; }
.fx-field :deep(.v-field__outline)           { --v-field-border-color: rgba(255,255,255,0.12) !important; }
.fx-field :deep(.v-field--focused .v-field__outline) { --v-field-border-color: rgba(56,189,248,0.4) !important; }
.fx-field :deep(.v-field__input)             { color: #ffffff; }
.fx-field :deep(.v-label)                   { color: rgba(255,255,255,0.65); }
.fx-field :deep(.v-icon)                    { color: rgba(255,255,255,0.38); }
.fx-field :deep(.v-field--focused .v-icon)  { color: #38bdf8; }

/* ── Button ── */
.fx-btn {
  background: rgba(255,255,255,0.9) !important;
  color: #0f172a !important;
  font-weight: 700 !important;
  font-size: 0.95rem !important;
  border-radius: 10px !important;
  transition: transform 0.15s ease, box-shadow 0.2s ease !important;
}
.fx-btn:not(:disabled):hover {
  background: #ffffff !important;
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(255,255,255,0.25) !important;
}

.rp-btn-back {
  color: #38bdf8 !important;
  border-color: rgba(56,189,248,0.35) !important;
  border-radius: 10px !important;
}

/* ── Success ── */
.success-wrap { text-align: center; }
.success-icon-wrap {
  width: 80px; height: 80px; border-radius: 50%;
  background: rgba(34,197,94,0.12);
  border: 1px solid rgba(34,197,94,0.3);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto;
}
.success-icon { color: #22c55e !important; }
.success-text { color: rgba(255,255,255,0.75); font-size: 0.88rem; line-height: 1.6; }
</style>
