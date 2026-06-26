<template>
  <div class="lr-root" :data-theme="resolvedTheme">

    <!-- ── Theme Toggle ── -->
    <div class="theme-bar">
      <button
        v-for="t in themes"
        :key="t.value"
        class="theme-btn"
        :class="{ 'theme-btn--active': currentTheme === t.value }"
        :title="t.label"
        @click="currentTheme = t.value"
      >
        <VIcon :icon="t.icon" size="13" />
        <span>{{ t.label }}</span>
      </button>
    </div>

    <!-- ══════ CENTER FORM ══════ -->
    <div class="center-wrap">
      <div class="glass-card">

        <!-- Logo / Emblem -->
        <div class="card-logo">
          <div class="emblem-orbit">
            <div class="orbit-spin" />
            <div class="emblem-center">
              <span class="emblem-mono">IR</span>
              <span class="emblem-sub">IRON</span>
            </div>
          </div>
        </div>

        <!-- Title -->
        <h2 class="card-title">Login</h2>
        <p class="card-sub">Masuk ke sistem I.R.O.N</p>

        <VForm ref="formRef" @submit.prevent="handleLogin" class="mt-6">

          <VTextField
            v-model="form.username"
            label="Username"
            placeholder="Masukkan Username"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="ri-user-3-line"
            :rules="[v => !!v || 'Username tidak boleh kosong']"
            :error-messages="errors.username"
            class="fx-field mb-4"
          />

          <VTextField
            v-model="form.password"
            label="Password"
            placeholder="············"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="ri-lock-2-line"
            :type="showPassword ? 'text' : 'password'"
            :append-inner-icon="showPassword ? 'ri-eye-off-line' : 'ri-eye-line'"
            :rules="[v => !!v || 'Password tidak boleh kosong']"
            :error-messages="errors.password"
            class="fx-field mb-2"
            @click:append-inner="showPassword = !showPassword"
          />

          <div class="row-opts mb-5">
            <VCheckbox
              v-model="rememberMe"
              label="Remember me"
              hide-details
              density="compact"
              color="primary"
              class="fx-cb"
            />
            <a href="#" class="a-forgot">Forgot password?</a>
          </div>

          <!-- Attempt warning -->
          <div v-if="failedAttempts > 0 && !isLocked" class="attempt-warn mb-4">
            <VIcon icon="ri-error-warning-line" size="14" class="mr-1" />
            {{ failedAttempts }}/3 percobaan gagal
            <span v-if="failedAttempts === 2"> — percobaan selanjutnya akan mengunci akun.</span>
          </div>

          <!-- Lockout alert -->
          <VAlert
            v-if="isLocked"
            type="warning"
            variant="tonal"
            class="mb-4"
            icon="ri-lock-2-line"
            density="compact"
          >
            Akun terkunci. Coba lagi dalam
            <strong class="countdown-text">{{ lockCountdown }}</strong>
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
            :disabled="isSubmitting || isLocked"
            class="fx-btn"
            elevation="0"
          >
            <template #loader>
              <VProgressCircular indeterminate size="20" width="2" color="current" />
            </template>
            <template v-if="isLocked">
              <VIcon icon="ri-lock-2-line" size="15" class="mr-1" />
              Terkunci {{ lockCountdown }}
            </template>
            <template v-else>
              {{ isSubmitting ? 'Memproses...' : 'Login' }}
            </template>
          </VBtn>

          <p class="text-center mt-5 a-contact-row">
            Kendala akses?
            <a href="#" class="a-contact">Hubungi Administrator</a>
          </p>

        </VForm>
      </div>
    </div>

    <!-- ══════ SUCCESS OVERLAY ══════ -->
    <Transition name="fade">
      <div v-if="showOverlay" class="sov">
        <div class="sov-wrap mb-6">
          <div class="sov-ring" />
          <div class="sov-box">
            <VIcon icon="ri-shield-check-line" size="38" class="sov-icon" />
          </div>
        </div>
        <h2 class="sov-title">Otentikasi Berhasil</h2>
        <p class="sov-name">Selamat datang, {{ employeeDisplayName }}</p>
        <p class="sov-status loading-dots">{{ processingText }}</p>
        <div class="sov-prog mt-5">
          <div class="sov-bar" />
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { computed, ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store.js'

const router    = useRouter()
const authStore = useAuthStore()

// ── Form ──────────────────────────────────────────────────────────────────────
const formRef        = ref(null)
const showPassword   = ref(false)
const rememberMe     = ref(false)
const errorMessage   = ref('')
const showOverlay    = ref(false)
const isSubmitting   = ref(false)
const processingText = ref('Memverifikasi kredensial...')
const errors = reactive({ username: [], password: [] })
const form   = reactive({ username: '', password: '' })

// ── Lockout ───────────────────────────────────────────────────────────────────
const MAX_ATTEMPTS     = 3
const LOCK_DURATION    = 5 * 60 * 1000
const LOCK_ATTEMPT_KEY = 'iron_login_attempts'
const LOCK_UNTIL_KEY   = 'iron_login_locked_until'

const failedAttempts = ref(0)
const lockedUntil    = ref(0)
const lockCountdown  = ref('')
let countdownTimer   = null

const isLocked = computed(() => lockedUntil.value > Date.now())

function loadLockState() {
  failedAttempts.value = parseInt(localStorage.getItem(LOCK_ATTEMPT_KEY) || '0')
  const until = parseInt(localStorage.getItem(LOCK_UNTIL_KEY) || '0')
  if (until > Date.now()) {
    lockedUntil.value = until
    startCountdown()
  } else if (until) {
    clearLockState()
  }
}

function clearLockState() {
  failedAttempts.value = 0
  lockedUntil.value    = 0
  localStorage.removeItem(LOCK_ATTEMPT_KEY)
  localStorage.removeItem(LOCK_UNTIL_KEY)
}

function startCountdown() {
  if (countdownTimer) clearInterval(countdownTimer)
  updateCountdown()
  countdownTimer = setInterval(() => {
    if (Date.now() >= lockedUntil.value) {
      clearLockState()
      clearInterval(countdownTimer)
      countdownTimer = null
      lockCountdown.value = ''
    } else {
      updateCountdown()
    }
  }, 1000)
}

function updateCountdown() {
  const remaining = lockedUntil.value - Date.now()
  const mins = Math.floor(remaining / 60000)
  const secs = Math.floor((remaining % 60000) / 1000)
  lockCountdown.value = `${mins}:${secs.toString().padStart(2, '0')}`
}

function recordFailure() {
  failedAttempts.value++
  localStorage.setItem(LOCK_ATTEMPT_KEY, String(failedAttempts.value))
  if (failedAttempts.value >= MAX_ATTEMPTS) {
    lockedUntil.value = Date.now() + LOCK_DURATION
    localStorage.setItem(LOCK_UNTIL_KEY, String(lockedUntil.value))
    startCountdown()
  }
}

// ── Theme ─────────────────────────────────────────────────────────────────────
const themes = [
  { value: 'light',  label: 'Light',  icon: 'ri-sun-line' },
  { value: 'dark',   label: 'Dark',   icon: 'ri-moon-line' },
  { value: 'system', label: 'System', icon: 'ri-computer-line' },
]
const currentTheme = ref('dark')
const systemDark   = ref(false)

const resolvedTheme = computed(() =>
  currentTheme.value === 'system'
    ? (systemDark.value ? 'dark' : 'light')
    : currentTheme.value,
)

let mqListener = null

onMounted(() => {
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  systemDark.value = mq.matches
  mqListener = e => { systemDark.value = e.matches }
  mq.addEventListener('change', mqListener)
  loadLockState()
})

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
  if (mqListener) {
    window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', mqListener)
  }
})

const employeeDisplayName = computed(() =>
  authStore.user?.karyawan?.nama_karyawan
  || authStore.user?.username
  || 'Pengguna',
)

// ── Login ─────────────────────────────────────────────────────────────────────
async function handleLogin() {
  if (isLocked.value) return

  errorMessage.value = ''
  errors.username = []
  errors.password = []

  const { valid } = await formRef.value.validate()
  if (!valid) return

  try {
    isSubmitting.value = true
    await authStore.login(form.username, form.password)

    clearLockState()
    showOverlay.value = true
    setTimeout(() => { processingText.value = 'Menyiapkan ruang kerja aman...' }, 800)
    setTimeout(() => { processingText.value = 'Menginisialisasi dasbor utama...' }, 1600)
    setTimeout(() => { router.push({ name: 'dashboard' }) }, 2800)
  } catch (err) {
    isSubmitting.value = false
    recordFailure()
    const data = err.response?.data
    if (data?.errors) {
      errors.username = data.errors.username ?? []
      errors.password = data.errors.password ?? []
    } else {
      errorMessage.value = data?.message ?? 'Akses ditolak. Periksa kembali ID Pengguna dan Kata Sandi Anda.'
    }
  }
}
</script>

<style scoped>
/* ── Tokens ── */
[data-theme="light"] {
  --overlay:   rgba(10, 18, 40, 0.38);
  --acc:       #38bdf8;
  --acc-hi:    #7dd3fc;
  --acc-lo:    rgba(56, 189, 248, 0.15);
  --bdr:       rgba(255, 255, 255, 0.22);
  --bdr-hi:    rgba(56, 189, 248, 0.5);
  --txt:       #ffffff;
  --mut:       rgba(255, 255, 255, 0.75);
  --dim:       rgba(255, 255, 255, 0.5);
  --btn-txt:   #0f172a;
  --glass-bg:  rgba(255, 255, 255, 0.22);
  --glass-bdr: rgba(255, 255, 255, 0.35);
  --field-bg:  rgba(255, 255, 255, 0.15);
  --shadow:    0 32px 80px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.15);
}

[data-theme="dark"] {
  --overlay:   rgba(0, 0, 0, 0.52);
  --acc:       #38bdf8;
  --acc-hi:    #7dd3fc;
  --acc-lo:    rgba(56, 189, 248, 0.12);
  --bdr:       rgba(255, 255, 255, 0.12);
  --bdr-hi:    rgba(56, 189, 248, 0.4);
  --txt:       #ffffff;
  --mut:       rgba(255, 255, 255, 0.65);
  --dim:       rgba(255, 255, 255, 0.38);
  --btn-txt:   #ffffff;
  --glass-bg:  rgba(15, 25, 50, 0.5);
  --glass-bdr: rgba(255, 255, 255, 0.14);
  --field-bg:  rgba(255, 255, 255, 0.07);
  --shadow:    0 32px 80px rgba(0, 0, 0, 0.55), 0 2px 8px rgba(0, 0, 0, 0.35);
}

/* ── Root ── */
.lr-root {
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

.lr-root::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--overlay);
  z-index: 0;
  transition: background 0.35s;
}

/* ── Theme bar ── */
.theme-bar {
  position: fixed;
  top: 1rem;
  right: 1.25rem;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 2px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(14px) saturate(160%);
  -webkit-backdrop-filter: blur(14px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 10px;
  padding: 4px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
}

.theme-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 7px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.71rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.18s, color 0.18s;
}
.theme-btn:hover   { background: var(--acc-lo); color: var(--acc); }
.theme-btn--active { background: var(--acc-lo); color: var(--acc); }

/* ── Center wrap ── */
.center-wrap {
  position: relative;
  z-index: 1;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.25rem;
  min-height: 100vh;
}

/* ── Glass card ── */
.glass-card {
  width: 100%;
  max-width: 400px;
  background: var(--glass-bg);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid var(--glass-bdr);
  border-radius: 20px;
  padding: 2.5rem 2.25rem 2rem;
  box-shadow: var(--shadow);
  animation: card-up 0.6s cubic-bezier(0.34, 1.2, 0.64, 1) both;
}
@keyframes card-up {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Emblem ── */
.card-logo {
  display: flex;
  justify-content: center;
  margin-bottom: 1.25rem;
}

.emblem-orbit {
  position: relative;
  width: 80px; height: 80px;
  display: flex; align-items: center; justify-content: center;
}
.orbit-spin {
  position: absolute; inset: 0; border-radius: 50%;
  background: conic-gradient(from 0deg, transparent 40%, var(--acc) 65%, transparent 72%);
  animation: spin 3s linear infinite;
  opacity: 0.65;
}
@keyframes spin { to { transform: rotate(360deg); } }
.emblem-center {
  width: 64px; height: 64px; border-radius: 50%;
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-bdr);
  position: relative; z-index: 1;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 1px;
}
.emblem-mono {
  font-size: 1.25rem; font-weight: 900; letter-spacing: 3px;
  color: var(--acc); line-height: 1;
}
.emblem-sub {
  font-size: 0.44rem; font-weight: 700; letter-spacing: 0.18em;
  color: var(--dim); text-transform: uppercase;
}

/* ── Card text ── */
.card-title {
  font-size: 1.65rem;
  font-weight: 800;
  color: var(--txt);
  text-align: center;
  margin-bottom: 0.3rem;
  letter-spacing: 0.01em;
}
.card-sub {
  font-size: 0.78rem;
  color: var(--mut);
  text-align: center;
  margin: 0;
  line-height: 1.5;
}

/* ── Fields ── */
.fx-field :deep(.v-field)           { background-color: var(--field-bg) !important; border-radius: 10px; }
.fx-field :deep(.v-field__outline)  { --v-field-border-color: var(--bdr) !important; }
.fx-field :deep(.v-field--focused .v-field__outline) { --v-field-border-color: var(--bdr-hi) !important; }
.fx-field :deep(.v-field__input)    { color: var(--txt); }
.fx-field :deep(.v-label)           { color: var(--mut); }
.fx-field :deep(.v-icon)            { color: var(--dim); }
.fx-field :deep(.v-field--focused .v-icon) { color: var(--acc); }
.fx-cb    :deep(.v-label)           { color: var(--mut); font-size: 0.82rem; }

/* ── Row opts ── */
.row-opts {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.a-forgot {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--acc);
  text-decoration: none;
  opacity: 0.85;
  transition: opacity 0.2s;
  white-space: nowrap;
}
.a-forgot:hover { opacity: 1; }

/* ── Login button ── */
.fx-btn {
  background: rgba(255, 255, 255, 0.9) !important;
  color: #0f172a !important;
  font-weight: 700 !important;
  font-size: 0.95rem !important;
  letter-spacing: 0.04em;
  border-radius: 10px !important;
  transition: transform 0.15s ease, box-shadow 0.2s ease, background 0.2s ease !important;
}
.fx-btn:not(:disabled):hover {
  background: #ffffff !important;
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(255, 255, 255, 0.25) !important;
}

.a-contact-row { font-size: 0.79rem; color: var(--dim); }
.a-contact { font-weight: 600; color: var(--acc); text-decoration: none; transition: color 0.2s; }
.a-contact:hover { color: var(--acc-hi); }

/* ── Lockout ── */
.attempt-warn {
  font-size: 0.76rem;
  font-weight: 500;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.22);
  border-radius: 8px;
  padding: 6px 10px;
  display: flex;
  align-items: center;
}
.countdown-text { font-family: 'Courier New', monospace; letter-spacing: 0.05em; }

/* ── Success overlay ── */
.sov {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease; }
.fade-enter-from,  .fade-leave-to      { opacity: 0; }

.sov-wrap {
  position: relative; width: 96px; height: 96px;
  display: flex; align-items: center; justify-content: center;
}
.sov-ring {
  position: absolute; inset: 0; border-radius: 50%;
  background: conic-gradient(from 0deg, transparent 38%, var(--acc) 65%, transparent 70%);
  animation: spin 1.4s linear infinite;
}
.sov-box {
  width: 74px; height: 74px; border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  position: relative; z-index: 1;
  display: flex; align-items: center; justify-content: center;
}
.sov-icon   { color: var(--acc) !important; }
.sov-title  { font-size: 1.3rem; font-weight: 800; color: #ffffff; margin-bottom: 0.2rem; }
.sov-name   { color: var(--acc); font-size: 0.9rem; font-weight: 500; margin-bottom: 0.15rem; }
.sov-status { color: rgba(255, 255, 255, 0.6); font-size: 0.79rem; }

.sov-prog { width: 220px; height: 3px; background: rgba(56, 189, 248, 0.15); border-radius: 4px; overflow: hidden; }
.sov-bar  {
  height: 100%; background: #38bdf8; border-radius: 4px;
  animation: fill 2.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
@keyframes fill { 0%{width:0} 30%{width:40%} 65%{width:72%} 100%{width:100%} }

.loading-dots::after { content: ''; animation: dots 1.5s steps(4, end) infinite; }
@keyframes dots { 0%,20%{content:''} 40%{content:'.'} 60%{content:'..'} 80%,100%{content:'...'} }
</style>
