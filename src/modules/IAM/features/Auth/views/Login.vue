<template>
  <div class="lr-root" :data-theme="resolvedTheme">

    <!-- Theme Toggle -->
    <div class="theme-bar">
      <button
        v-for="t in themes"
        :key="t.value"
        class="theme-btn"
        :class="{ 'theme-btn--active': currentTheme === t.value }"
        :title="t.label"
        type="button"
        @click="currentTheme = t.value"
      >
        <VIcon :icon="t.icon" size="14" />
        <span>{{ t.label }}</span>
      </button>
    </div>

    <!-- LEFT: BRAND / ACCOUNTING SYSTEM PANEL -->
    <aside class="brand-panel">
      <div class="brand-grid" />
      <div class="brand-orb brand-orb--one" />
      <div class="brand-orb brand-orb--two" />

      <div class="brand-content">
        <div class="brand-top">
          <div class="brand-logo-tile">
            <img
              src="/images/iron/Logo_IRON.png"
              alt="Logo I.R.O.N"
              class="brand-logo-img"
            />
          </div>

          <div>
            <p class="brand-eyebrow">ACCOUNTING WORKSPACE</p>
            <h1 class="brand-name">I.R.O.N</h1>
          </div>
        </div>

        <div class="brand-copy">
          <p class="brand-tagline">Intelligent Record of Numbers</p>

          <h2 class="brand-title">
            Semua angka bisnis Anda,
            <span>dalam satu kendali.</span>
          </h2>

          <p class="brand-desc">
            Kelola invoice, piutang, arus kas, dan laporan keuangan
            melalui satu sistem yang terstruktur, aman, dan mudah dipantau.
          </p>
        </div>

        <!-- Accounting Dashboard Preview -->
        <section class="ledger-preview" aria-label="Ringkasan sistem keuangan">
          <div class="ledger-head">
            <div>
              <p class="ledger-label">FINANCIAL OVERVIEW</p>
              <p class="ledger-title">Ringkasan Keuangan</p>
            </div>

            <div class="ledger-status">
              <span class="status-dot" />
              Sistem aktif
            </div>
          </div>

          <div class="ledger-chart">
            <div class="chart-grid-line chart-grid-line--1" />
            <div class="chart-grid-line chart-grid-line--2" />
            <div class="chart-grid-line chart-grid-line--3" />

            <div class="chart-bars">
              <span class="bar bar--1" />
              <span class="bar bar--2" />
              <span class="bar bar--3" />
              <span class="bar bar--4" />
              <span class="bar bar--5" />
              <span class="bar bar--6" />
              <span class="bar bar--7" />
            </div>

            <svg
              class="chart-line"
              viewBox="0 0 320 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M0 82 C25 72, 35 68, 58 72
                   S95 60, 118 63
                   S155 47, 180 54
                   S215 30, 240 40
                   S280 20, 320 12"
              />
            </svg>
          </div>

          <div class="ledger-summary">
            <div class="ledger-stat">
              <VIcon icon="ri-file-list-3-line" size="17" />
              <div>
                <span>Invoice</span>
                <strong>Terkelola</strong>
              </div>
            </div>

            <div class="ledger-stat">
              <VIcon icon="ri-funds-line" size="17" />
              <div>
                <span>Arus Kas</span>
                <strong>Terpantau</strong>
              </div>
            </div>

            <div class="ledger-stat">
              <VIcon icon="ri-pie-chart-2-line" size="17" />
              <div>
                <span>Laporan</span>
                <strong>Real-time</strong>
              </div>
            </div>
          </div>
        </section>

        <div class="brand-trust">
          <div class="trust-item">
            <VIcon icon="ri-shield-check-line" size="18" />
            <span>Akses sistem terlindungi</span>
          </div>

          <div class="trust-item">
            <VIcon icon="ri-time-line" size="18" />
            <span>Data bisnis siap dipantau</span>
          </div>
        </div>
      </div>

      <p class="brand-foot">
        © {{ currentYear }} PT Sheza Mitra Amanah
      </p>
    </aside>

    <!-- RIGHT: LOGIN FORM -->
    <main class="form-panel">
      <div class="form-glow form-glow--one" />
      <div class="form-glow form-glow--two" />

      <div class="form-card">

        <!-- Mobile Brand -->
        <div class="mobile-brand">
          <div class="mobile-logo-tile">
            <img src="/images/iron/Logo_IRON.png" alt="I.R.O.N" />
          </div>

          <div>
            <span class="mobile-brand-label">ACCOUNTING WORKSPACE</span>
            <strong>I.R.O.N</strong>
          </div>
        </div>

        <div class="form-heading">
          <span class="secure-badge">
            <VIcon icon="ri-shield-keyhole-line" size="14" />
            Secure Access
          </span>

          <h2 class="card-title">Selamat Datang</h2>

          <p class="card-sub">
            Masuk untuk mengakses workspace keuangan Anda.
          </p>
        </div>

        <VForm
          ref="formRef"
          class="login-form"
          @submit.prevent="handleLogin"
        >
          <div class="field-group">
            <label class="fx-label">Username</label>

            <VTextField
              v-model="form.username"
              placeholder="Masukkan username"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="ri-user-3-line"
              :rules="[v => !!v || 'Username tidak boleh kosong']"
              :error-messages="errors.username"
              class="fx-field"
              autocomplete="username"
            />
          </div>

          <div class="field-group">
            <label class="fx-label">Password</label>

            <VTextField
              v-model="form.password"
              placeholder="Masukkan password"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="ri-lock-2-line"
              :type="showPassword ? 'text' : 'password'"
              :append-inner-icon="showPassword ? 'ri-eye-off-line' : 'ri-eye-line'"
              :rules="[v => !!v || 'Password tidak boleh kosong']"
              :error-messages="errors.password"
              class="fx-field"
              autocomplete="current-password"
              @click:append-inner="showPassword = !showPassword"
            />
          </div>

          <div class="row-opts">
            <VCheckbox
              v-model="rememberMe"
              label="Remember me"
              hide-details
              density="compact"
              class="fx-cb"
            />
          </div>

          <!-- Warning failed login -->
          <div
            v-if="failedAttempts > 0 && !isLocked"
            class="attempt-warn"
          >
            <VIcon icon="ri-error-warning-line" size="15" />

            <span>
              {{ failedAttempts }}/3 percobaan gagal
              <template v-if="failedAttempts === 2">
                — percobaan berikutnya akan mengunci akses.
              </template>
            </span>
          </div>

          <!-- Lockout Alert -->
          <VAlert
            v-if="isLocked"
            type="warning"
            variant="tonal"
            class="lock-alert"
            icon="ri-lock-2-line"
            density="compact"
          >
            Akun terkunci. Coba kembali dalam
            <strong class="countdown-text">{{ lockCountdown }}</strong>
          </VAlert>

          <!-- Login Error -->
          <VAlert
            v-if="errorMessage"
            type="error"
            variant="tonal"
            class="error-alert"
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
              <VProgressCircular
                indeterminate
                size="20"
                width="2"
                color="white"
              />
            </template>

            <template v-if="isLocked">
              <VIcon icon="ri-lock-2-line" size="16" class="mr-1" />
              Terkunci {{ lockCountdown }}
            </template>

            <template v-else>
              <VIcon
                v-if="!isSubmitting"
                icon="ri-login-circle-line"
                size="18"
                class="mr-2"
              />
              {{ isSubmitting ? 'Memverifikasi akses...' : 'Login' }}
            </template>
          </VBtn>

          <div class="form-security-note">
            <VIcon icon="ri-lock-line" size="14" />
            <span>Koneksi Anda dilindungi melalui autentikasi sistem.</span>
          </div>
        </VForm>
      </div>
    </main>

    <!-- SUCCESS OVERLAY -->
    <Transition name="fade">
      <div v-if="showOverlay" class="sov">
        <div class="sov-wrap mb-6">
          <div class="sov-spinner" />

          <div class="sov-box">
            <VIcon
              icon="ri-shield-check-line"
              size="38"
              class="sov-icon"
            />
          </div>
        </div>

        <span class="sov-label">ACCESS VERIFIED</span>

        <h2 class="sov-title">Otentikasi Berhasil</h2>

        <p class="sov-name">
          Selamat datang, {{ employeeDisplayName }}
        </p>

        <p class="sov-status loading-dots">
          {{ processingText }}
        </p>

        <div class="sov-prog mt-5">
          <div class="sov-bar" />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import {
  computed,
  onMounted,
  onUnmounted,
  reactive,
  ref,
} from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store.js'

const router = useRouter()
const authStore = useAuthStore()

const currentYear = new Date().getFullYear()

// ─────────────────────────────────────────────────────────
// Form State
// ─────────────────────────────────────────────────────────
const formRef = ref(null)
const showPassword = ref(false)
const rememberMe = ref(false)
const errorMessage = ref('')
const showOverlay = ref(false)
const isSubmitting = ref(false)

const processingText = ref('Memverifikasi kredensial...')

const errors = reactive({
  username: [],
  password: [],
})

const form = reactive({
  username: '',
  password: '',
})

// ─────────────────────────────────────────────────────────
// Login Lockout State
// ─────────────────────────────────────────────────────────
const MAX_ATTEMPTS = 3
const LOCK_DURATION = 5 * 60 * 1000

const LOCK_ATTEMPT_KEY = 'iron_login_attempts'
const LOCK_UNTIL_KEY = 'iron_login_locked_until'

const failedAttempts = ref(0)
const lockedUntil = ref(0)
const lockCountdown = ref('')

let countdownTimer = null

const isLocked = computed(() => {
  return lockedUntil.value > Date.now()
})

function loadLockState() {
  failedAttempts.value = parseInt(
    localStorage.getItem(LOCK_ATTEMPT_KEY) || '0',
    10,
  )

  const until = parseInt(
    localStorage.getItem(LOCK_UNTIL_KEY) || '0',
    10,
  )

  if (until > Date.now()) {
    lockedUntil.value = until
    startCountdown()
  } else if (until) {
    clearLockState()
  }
}

function clearLockState() {
  failedAttempts.value = 0
  lockedUntil.value = 0
  lockCountdown.value = ''

  localStorage.removeItem(LOCK_ATTEMPT_KEY)
  localStorage.removeItem(LOCK_UNTIL_KEY)
}

function updateCountdown() {
  const remaining = lockedUntil.value - Date.now()

  if (remaining <= 0) {
    lockCountdown.value = ''
    return
  }

  const minutes = Math.floor(remaining / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)

  lockCountdown.value = `${minutes}:${seconds
    .toString()
    .padStart(2, '0')}`
}

function startCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }

  updateCountdown()

  countdownTimer = setInterval(() => {
    if (Date.now() >= lockedUntil.value) {
      clearLockState()

      clearInterval(countdownTimer)
      countdownTimer = null

      return
    }

    updateCountdown()
  }, 1000)
}

function recordFailure() {
  failedAttempts.value += 1

  localStorage.setItem(
    LOCK_ATTEMPT_KEY,
    String(failedAttempts.value),
  )

  if (failedAttempts.value >= MAX_ATTEMPTS) {
    lockedUntil.value = Date.now() + LOCK_DURATION

    localStorage.setItem(
      LOCK_UNTIL_KEY,
      String(lockedUntil.value),
    )

    startCountdown()
  }
}

// ─────────────────────────────────────────────────────────
// Theme State
// ─────────────────────────────────────────────────────────
const themes = [
  {
    value: 'light',
    label: 'Light',
    icon: 'ri-sun-line',
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: 'ri-moon-line',
  },
  {
    value: 'system',
    label: 'System',
    icon: 'ri-computer-line',
  },
]

const currentTheme = ref('dark')
const systemDark = ref(false)

const resolvedTheme = computed(() => {
  if (currentTheme.value === 'system') {
    return systemDark.value ? 'dark' : 'light'
  }

  return currentTheme.value
})

let mediaQuery = null
let mqListener = null

// ─────────────────────────────────────────────────────────
// User Display Name
// ─────────────────────────────────────────────────────────
const employeeDisplayName = computed(() => {
  return (
    authStore.user?.karyawan?.nama_karyawan
    || authStore.user?.username
    || 'Pengguna'
  )
})

// ─────────────────────────────────────────────────────────
// Lifecycle
// ─────────────────────────────────────────────────────────
onMounted(() => {
  mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

  systemDark.value = mediaQuery.matches

  mqListener = event => {
    systemDark.value = event.matches
  }

  mediaQuery.addEventListener('change', mqListener)

  loadLockState()
})

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }

  if (mediaQuery && mqListener) {
    mediaQuery.removeEventListener('change', mqListener)
  }
})

// ─────────────────────────────────────────────────────────
// Login Handler
// ─────────────────────────────────────────────────────────
async function handleLogin() {
  if (isLocked.value) {
    return
  }

  errorMessage.value = ''
  errors.username = []
  errors.password = []

  const { valid } = await formRef.value.validate()

  if (!valid) {
    return
  }

  try {
    isSubmitting.value = true

    await authStore.login(
      form.username,
      form.password,
    )

    clearLockState()

    showOverlay.value = true

    setTimeout(() => {
      processingText.value = 'Menyiapkan ruang kerja aman...'
    }, 800)

    setTimeout(() => {
      processingText.value = 'Menginisialisasi dasbor utama...'
    }, 1600)

    setTimeout(() => {
      router.push({ name: 'dashboard' })
    }, 2800)
  } catch (err) {
    isSubmitting.value = false

    recordFailure()

    const data = err.response?.data

    if (data?.errors) {
      errors.username = data.errors.username ?? []
      errors.password = data.errors.password ?? []
    } else {
      errorMessage.value = data?.message
        ?? 'Akses ditolak. Periksa kembali username dan password Anda.'
    }
  }
}
</script>

<style scoped>
[data-theme="light"] {
  --page-bg: #edf3fb;
  --surface: #ffffff;
  --surface-soft: #f8fbff;
  --txt: #17233a;
  --mut: #6b7a90;
  --dim: #9ba8b8;
  --border: #dbe5f0;
  --field-bg: #f9fbfd;
  --field-hover: #f1f6fb;

  --brand: #173b73;
  --brand-deep: #102b57;
  --brand-soft: #eaf1fb;

  --accent: #ee7b2d;
  --accent-soft: #fff0e5;

  --shadow:
    0 28px 70px rgba(23, 59, 115, 0.11),
    0 3px 10px rgba(23, 59, 115, 0.04);
}

[data-theme="dark"] {
  --page-bg: #08162d;
  --surface: #102544;
  --surface-soft: #0c1e39;
  --txt: #f5f8fc;
  --mut: #a6b5ca;
  --dim: #7385a0;
  --border: #294867;
  --field-bg: #0d203b;
  --field-hover: #112a4d;

  --brand: #24589f;
  --brand-deep: #173f79;
  --brand-soft: #143462;

  --accent: #f38a3e;
  --accent-soft: rgba(243, 138, 62, 0.14);

  --shadow:
    0 28px 70px rgba(0, 0, 0, 0.36),
    0 3px 10px rgba(0, 0, 0, 0.22);
}

/* ─────────────────────────────────────────────────────────
   Root
───────────────────────────────────────────────────────── */
.lr-root {
  width: 100%;
  min-height: 100vh;
  position: relative;
  display: flex;
  overflow: hidden;
  color: var(--txt);
  font-family: "Inter", sans-serif;
  background:
    radial-gradient(circle at 84% 12%, rgba(61, 126, 209, 0.11), transparent 28%),
    radial-gradient(circle at 72% 84%, rgba(238, 123, 45, 0.08), transparent 25%),
    var(--page-bg);
  transition: background 0.3s ease;
}

/* ─────────────────────────────────────────────────────────
   Theme Toggle
───────────────────────────────────────────────────────── */
.theme-bar {
  position: fixed;
  top: 1.1rem;
  right: 1.25rem;
  z-index: 100;

  display: flex;
  align-items: center;
  gap: 3px;

  padding: 4px;
  border: 1px solid var(--border);
  border-radius: 12px;

  background: var(--surface);
  box-shadow: 0 8px 25px rgba(15, 35, 66, 0.12);
  backdrop-filter: blur(14px);
}

.theme-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  padding: 6px 10px;
  border: 0;
  border-radius: 8px;

  color: var(--mut);
  background: transparent;

  font-family: inherit;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.02em;

  cursor: pointer;
  transition: 0.2s ease;
}

.theme-btn:hover {
  color: var(--brand);
  background: var(--field-bg);
}

.theme-btn--active {
  color: #ffffff;
  background: var(--brand);
  box-shadow: 0 5px 12px rgba(23, 59, 115, 0.24);
}

/* ─────────────────────────────────────────────────────────
   Left Brand Panel
───────────────────────────────────────────────────────── */
.brand-panel {
  width: 47%;
  max-width: 680px;
  min-height: 100vh;

  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  padding: 3.2rem 3.5rem;
  color: #ffffff;

  background:
    radial-gradient(circle at 82% 18%, rgba(238, 123, 45, 0.24), transparent 28%),
    radial-gradient(circle at 18% 84%, rgba(84, 143, 231, 0.2), transparent 30%),
    linear-gradient(142deg, #10284f 0%, #173b73 52%, #0d2957 100%);
}

.brand-grid {
  position: absolute;
  inset: 0;

  opacity: 0.15;
  pointer-events: none;

  background-image:
    linear-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.12) 1px, transparent 1px);

  background-size: 40px 40px;
  mask-image: linear-gradient(to bottom, black, transparent 88%);
}

.brand-orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(4px);
}

.brand-orb--one {
  width: 230px;
  height: 230px;
  top: -90px;
  right: -100px;
  background: rgba(238, 123, 45, 0.18);
}

.brand-orb--two {
  width: 160px;
  height: 160px;
  bottom: 72px;
  left: -80px;
  background: rgba(105, 166, 255, 0.17);
}

.brand-content {
  width: 100%;
  max-width: 500px;
  margin: auto 0;
  position: relative;
  z-index: 1;
}

.brand-top {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2.6rem;
}

.brand-logo-tile {
  width: 68px;
  height: 68px;

  display: flex;
  align-items: center;
  justify-content: center;

  border: 1px solid rgba(255, 255, 255, 0.34);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.96);

  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.2);
}

.brand-logo-img {
  width: 48px;
  height: 48px;
  object-fit: contain;
}

.brand-eyebrow {
  margin: 0 0 0.3rem;

  color: rgba(255, 255, 255, 0.6);

  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.14em;
}

.brand-name {
  margin: 0;

  color: #ffffff;

  font-size: 1.9rem;
  font-weight: 900;
  line-height: 1;
  letter-spacing: 0.08em;
}

.brand-copy {
  margin-bottom: 2rem;
}

.brand-tagline {
  margin: 0 0 0.75rem;

  color: var(--accent);

  font-size: 0.83rem;
  font-weight: 800;
  letter-spacing: 0.035em;
}

.brand-title {
  max-width: 430px;
  margin: 0 0 1rem;

  color: #ffffff;

  font-size: clamp(1.8rem, 2.6vw, 2.55rem);
  font-weight: 800;
  line-height: 1.17;
  letter-spacing: -0.035em;
}

.brand-title span {
  display: block;
  color: #a9caff;
}

.brand-desc {
  max-width: 440px;
  margin: 0;

  color: rgba(255, 255, 255, 0.76);

  font-size: 0.91rem;
  line-height: 1.75;
}

/* ─────────────────────────────────────────────────────────
   Ledger Preview
───────────────────────────────────────────────────────── */
.ledger-preview {
  margin-top: 1.6rem;
  padding: 1.25rem;

  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 20px;

  background: linear-gradient(
    145deg,
    rgba(255, 255, 255, 0.13),
    rgba(255, 255, 255, 0.055)
  );

  box-shadow: 0 22px 35px rgba(0, 0, 0, 0.16);
  backdrop-filter: blur(14px);
}

.ledger-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;

  margin-bottom: 1rem;
}

.ledger-label {
  margin: 0 0 0.25rem;

  color: rgba(255, 255, 255, 0.53);

  font-size: 0.61rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.ledger-title {
  margin: 0;

  color: #ffffff;

  font-size: 0.94rem;
  font-weight: 700;
}

.ledger-status {
  display: inline-flex;
  align-items: center;
  gap: 0.38rem;

  padding: 0.35rem 0.55rem;
  border-radius: 999px;

  color: #dfffe8;
  background: rgba(42, 196, 111, 0.14);

  font-size: 0.65rem;
  font-weight: 700;
  white-space: nowrap;
}

.status-dot {
  width: 6px;
  height: 6px;

  border-radius: 50%;

  background: #58d68d;
  box-shadow: 0 0 0 4px rgba(88, 214, 141, 0.14);
}

.ledger-chart {
  height: 132px;
  position: relative;
  overflow: hidden;

  border-radius: 12px;

  background: rgba(8, 24, 53, 0.22);
}

.chart-grid-line {
  position: absolute;
  left: 0;
  right: 0;

  height: 1px;
  background: rgba(255, 255, 255, 0.1);
}

.chart-grid-line--1 {
  top: 25%;
}

.chart-grid-line--2 {
  top: 50%;
}

.chart-grid-line--3 {
  top: 75%;
}

.chart-bars {
  position: absolute;
  inset: auto 14px 0;

  height: 78px;

  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 8px;
}

.bar {
  width: 100%;
  max-width: 22px;

  border-radius: 5px 5px 0 0;

  background: linear-gradient(
    to top,
    rgba(94, 164, 255, 0.28),
    rgba(126, 184, 255, 0.76)
  );
}

.bar--1 {
  height: 34%;
}

.bar--2 {
  height: 52%;
}

.bar--3 {
  height: 45%;
}

.bar--4 {
  height: 72%;
}

.bar--5 {
  height: 57%;
}

.bar--6 {
  height: 83%;
}

.bar--7 {
  height: 68%;
}

.chart-line {
  position: absolute;
  inset: 15px 0 10px;

  width: 100%;
  height: 100%;
  overflow: visible;
}

.chart-line path {
  fill: none;
  stroke: var(--accent);
  stroke-width: 3;
  stroke-linecap: round;

  filter: drop-shadow(0 3px 5px rgba(238, 123, 45, 0.35));
}

.ledger-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.6rem;

  margin-top: 1rem;
}

.ledger-stat {
  min-width: 0;

  display: flex;
  align-items: center;
  gap: 0.45rem;

  padding: 0.65rem;
  border-radius: 10px;

  background: rgba(255, 255, 255, 0.08);
}

.ledger-stat :deep(.v-icon) {
  flex-shrink: 0;
  color: var(--accent);
}

.ledger-stat span,
.ledger-stat strong {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ledger-stat span {
  margin-bottom: 0.13rem;

  color: rgba(255, 255, 255, 0.55);

  font-size: 0.61rem;
}

.ledger-stat strong {
  color: rgba(255, 255, 255, 0.94);

  font-size: 0.68rem;
  font-weight: 700;
}

.brand-trust {
  display: flex;
  flex-wrap: wrap;
  gap: 1.1rem;

  margin-top: 1.35rem;
}

.trust-item {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;

  color: rgba(255, 255, 255, 0.7);

  font-size: 0.74rem;
  font-weight: 500;
}

.trust-item :deep(.v-icon) {
  color: var(--accent);
}

.brand-foot {
  position: absolute;
  bottom: 1.65rem;
  left: 3.5rem;
  z-index: 1;

  margin: 0;

  color: rgba(255, 255, 255, 0.45);

  font-size: 0.71rem;
}

/* ─────────────────────────────────────────────────────────
   Right Form Panel
───────────────────────────────────────────────────────── */
.form-panel {
  flex: 1;

  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  padding: 5rem 1.5rem 2.5rem;
}

.form-glow {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(4px);
}

.form-glow--one {
  width: 330px;
  height: 330px;

  top: -145px;
  right: -150px;

  background: rgba(37, 104, 186, 0.11);
}

.form-glow--two {
  width: 220px;
  height: 220px;

  bottom: -100px;
  left: -110px;

  background: rgba(238, 123, 45, 0.08);
}

.form-card {
  width: 100%;
  max-width: 430px;

  position: relative;
  z-index: 1;

  padding: 2.6rem;

  border: 1px solid var(--border);
  border-radius: 24px;

  background: var(--surface);
  box-shadow: var(--shadow);
  backdrop-filter: blur(16px);

  animation: card-rise 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes card-rise {
  from {
    opacity: 0;
    transform: translateY(22px) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.mobile-brand {
  display: none;
  align-items: center;
  gap: 0.75rem;

  margin-bottom: 2rem;
}

.mobile-logo-tile {
  width: 42px;
  height: 42px;

  display: grid;
  place-items: center;

  border-radius: 12px;
  background: #ffffff;

  box-shadow: 0 7px 16px rgba(23, 59, 115, 0.18);
}

.mobile-logo-tile img {
  width: 31px;
  height: 31px;
  object-fit: contain;
}

.mobile-brand-label {
  display: block;
  margin-bottom: 0.18rem;

  color: var(--mut);

  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.11em;
}

.mobile-brand strong {
  color: var(--txt);

  font-size: 1.1rem;
  font-weight: 900;
  letter-spacing: 0.08em;
}

.form-heading {
  margin-bottom: 1.85rem;
}

.secure-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;

  margin-bottom: 0.9rem;
  padding: 0.36rem 0.6rem;

  border: 1px solid rgba(23, 59, 115, 0.18);
  border-radius: 999px;

  color: var(--brand);
  background: var(--brand-soft);

  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.card-title {
  margin: 0 0 0.45rem;

  color: var(--txt);

  font-size: 1.72rem;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.035em;
}

.card-sub {
  margin: 0;

  color: var(--mut);

  font-size: 0.86rem;
  line-height: 1.65;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field-group {
  display: flex;
  flex-direction: column;
}

.fx-label {
  margin-bottom: 0.45rem;

  color: var(--txt);

  font-size: 0.77rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.fx-field :deep(.v-field) {
  border-radius: 12px;
  background: var(--field-bg) !important;
  transition: background 0.2s ease;
}

.fx-field :deep(.v-field:hover) {
  background: var(--field-hover) !important;
}

.fx-field :deep(.v-field__outline) {
  --v-field-border-color: var(--border) !important;
  --v-field-border-opacity: 1;
}

.fx-field :deep(.v-field--focused .v-field__outline) {
  --v-field-border-color: var(--brand) !important;
  --v-field-border-opacity: 1;
}

.fx-field :deep(.v-field--focused) {
  box-shadow: 0 0 0 4px rgba(23, 59, 115, 0.12);
}

.fx-field :deep(.v-field__input) {
  color: var(--txt);
  font-size: 0.88rem;
}

.fx-field :deep(input::placeholder) {
  color: var(--dim);
  opacity: 1;
}

.fx-field :deep(.v-icon) {
  color: var(--dim);
}

.fx-field :deep(.v-field--focused .v-icon) {
  color: var(--brand);
}

.row-opts {
  display: flex;
  align-items: center;
  justify-content: space-between;

  margin-top: -0.25rem;
}

.fx-cb :deep(.v-label) {
  color: var(--mut);

  font-size: 0.79rem;
  opacity: 1;
}

.fx-cb :deep(.v-selection-control__input) {
  color: var(--brand);
}

.attempt-warn {
  display: flex;
  align-items: flex-start;
  gap: 0.45rem;

  padding: 0.7rem 0.8rem;

  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 10px;

  color: #b45309;
  background: rgba(245, 158, 11, 0.1);

  font-size: 0.74rem;
  font-weight: 600;
  line-height: 1.45;
}

.attempt-warn :deep(.v-icon) {
  flex-shrink: 0;
  margin-top: 1px;
}

.lock-alert,
.error-alert {
  margin: 0 !important;
  border-radius: 11px !important;
  font-size: 0.78rem;
}

.countdown-text {
  font-family: "Courier New", monospace;
  letter-spacing: 0.06em;
}

.fx-btn {
  min-height: 50px !important;
  margin-top: 0.15rem;

  border-radius: 12px !important;

  color: #ffffff !important;
  background: linear-gradient(
    135deg,
    var(--brand),
    var(--brand-deep)
  ) !important;

  font-size: 0.9rem !important;
  font-weight: 800 !important;
  letter-spacing: 0.01em;

  box-shadow: 0 10px 20px rgba(23, 59, 115, 0.22) !important;

  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease !important;
}

.fx-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 26px rgba(23, 59, 115, 0.3) !important;
}

.form-security-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.38rem;

  margin-top: 0.2rem;

  color: var(--dim);

  font-size: 0.68rem;
  text-align: center;
}

.form-security-note :deep(.v-icon) {
  color: var(--brand);
}

/* ─────────────────────────────────────────────────────────
   Success Overlay
───────────────────────────────────────────────────────── */
.sov {
  position: fixed;
  inset: 0;
  z-index: 9999;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  padding: 1.5rem;

  background:
    radial-gradient(circle at center, rgba(34, 91, 162, 0.32), transparent 36%),
    rgba(5, 15, 33, 0.91);

  backdrop-filter: blur(10px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.35s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.sov-wrap {
  width: 96px;
  height: 96px;

  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sov-spinner {
  position: absolute;
  inset: 0;

  border: 3px solid rgba(255, 255, 255, 0.12);
  border-top-color: var(--accent);
  border-radius: 50%;

  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.sov-box {
  width: 72px;
  height: 72px;

  display: flex;
  align-items: center;
  justify-content: center;

  border: 1px solid rgba(255, 255, 255, 0.17);
  border-radius: 50%;

  background: rgba(255, 255, 255, 0.08);
}

.sov-icon {
  color: var(--accent) !important;
}

.sov-label {
  margin-bottom: 0.55rem;

  color: rgba(255, 255, 255, 0.5);

  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.15em;
}

.sov-title {
  margin: 0 0 0.3rem;

  color: #ffffff;

  font-size: 1.38rem;
  font-weight: 800;
}

.sov-name {
  margin: 0 0 0.2rem;

  color: var(--accent);

  font-size: 0.91rem;
  font-weight: 600;
}

.sov-status {
  margin: 0;

  color: rgba(255, 255, 255, 0.62);

  font-size: 0.79rem;
}

.sov-prog {
  width: min(220px, 74vw);
  height: 3px;

  overflow: hidden;
  border-radius: 99px;

  background: rgba(255, 255, 255, 0.13);
}

.sov-bar {
  height: 100%;

  border-radius: inherit;
  background: var(--accent);

  animation: fill 2.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes fill {
  0% {
    width: 0;
  }

  30% {
    width: 40%;
  }

  65% {
    width: 72%;
  }

  100% {
    width: 100%;
  }
}

.loading-dots::after {
  content: "";
  animation: dots 1.5s steps(4, end) infinite;
}

@keyframes dots {
  0%,
  20% {
    content: "";
  }

  40% {
    content: ".";
  }

  60% {
    content: "..";
  }

  80%,
  100% {
    content: "...";
  }
}

/* ─────────────────────────────────────────────────────────
   Responsive
───────────────────────────────────────────────────────── */
@media (max-width: 1120px) {
  .brand-panel {
    width: 43%;
    padding: 3rem 2.5rem;
  }

  .brand-foot {
    left: 2.5rem;
  }

  .ledger-summary {
    grid-template-columns: 1fr;
  }

  .ledger-stat {
    padding: 0.55rem 0.65rem;
  }
}

@media (max-width: 900px) {
  .brand-panel {
    display: none;
  }

  .mobile-brand {
    display: flex;
  }

  .form-panel {
    padding: 5.3rem 1rem 2rem;
  }
}

@media (max-width: 500px) {
  .theme-bar {
    top: 0.75rem;
    right: 0.75rem;
  }

  .theme-btn {
    padding: 7px 8px;
  }

  .theme-btn span {
    display: none;
  }

  .form-card {
    padding: 2rem 1.35rem;
    border-radius: 20px;
  }

  .card-title {
    font-size: 1.5rem;
  }

  .form-security-note {
    font-size: 0.63rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>