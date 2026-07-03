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
        © {{ currentYear }} I.R.O.M by PT Sheza Mitra Amanah
      </p>
    </aside>

    <!-- RIGHT: LOGIN FORM -->
 <!-- ======================================================
     FUTURISTIC ACCOUNTING BACKGROUND
====================================================== -->
    <main class="form-panel">

    <div class="auth-visual" aria-hidden="true">

  <!-- Background layers -->
  <div class="auth-visual__mesh" />
  <div class="auth-visual__noise" />
  <div class="auth-visual__floor" />
  <div class="auth-visual__floor-glow" />

  <!-- Ambient lighting -->
  <div class="auth-aurora auth-aurora--blue" />
  <div class="auth-aurora auth-aurora--orange" />

  <!-- Circular holographic orbit behind login card -->
  <div class="auth-orbit">
    <span class="auth-orbit__ring auth-orbit__ring--one" />
    <span class="auth-orbit__ring auth-orbit__ring--two" />
    <span class="auth-orbit__ring auth-orbit__ring--three" />
    <span class="auth-orbit__pulse auth-orbit__pulse--one" />
    <span class="auth-orbit__pulse auth-orbit__pulse--two" />
  </div>

  <!-- Revenue card - top left -->
  <section class="holo-stat holo-stat--revenue">
    <div class="holo-stat__top">
      <span class="holo-stat__icon">
        <VIcon icon="ri-wallet-3-line" size="17" />
      </span>

      <span class="holo-stat__label">TOTAL REVENUE</span>
    </div>

    <strong class="holo-stat__value">Rp 2.450.000.000</strong>

    <div class="holo-stat__trend holo-stat__trend--up">
      <VIcon icon="ri-arrow-up-line" size="14" />
      <span>18.2%</span>
      <small>vs bulan lalu</small>
    </div>
  </section>

  <!-- Invoice card - lower left -->
  <section class="holo-stat holo-stat--invoice">
    <div class="holo-stat__top">
      <span class="holo-stat__icon">
        <VIcon icon="ri-file-list-3-line" size="17" />
      </span>

      <span class="holo-stat__label">INVOICE OVERVIEW</span>
    </div>

    <div class="invoice-stat-row">
      <strong class="invoice-stat-row__value">236</strong>

      <span class="invoice-stat-row__growth">
        +24%
      </span>
    </div>

    <p class="invoice-stat-row__caption">Invoice bulan ini</p>
  </section>

  <!-- Donut chart - right -->
  <section class="holo-donut">
    <div class="holo-donut__header">
      <span class="holo-donut__label">AR COMPOSITION</span>
      <span class="holo-donut__live">
        <span class="holo-donut__live-dot" />
        Real-time
      </span>
    </div>

    <div class="holo-donut__body">
      <svg
        class="donut-svg"
        viewBox="0 0 180 180"
        aria-hidden="true"
      >
        <defs>
          <filter id="donutGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle
          class="donut-svg__track"
          cx="90"
          cy="90"
          r="61"
        />

        <circle
          class="donut-svg__segment donut-svg__segment--one"
          cx="90"
          cy="90"
          r="61"
        />

        <circle
          class="donut-svg__segment donut-svg__segment--two"
          cx="90"
          cy="90"
          r="61"
        />

        <circle
          class="donut-svg__segment donut-svg__segment--three"
          cx="90"
          cy="90"
          r="61"
        />

        <circle
          class="donut-svg__center-ring"
          cx="90"
          cy="90"
          r="39"
        />
      </svg>

      <div class="holo-donut__center">
        <span>OUTSTANDING</span>
        <strong>72%</strong>
      </div>
    </div>

    <div class="holo-donut__legend">
      <span>
        <i class="legend-dot legend-dot--blue" />
        Lancar
      </span>

      <span>
        <i class="legend-dot legend-dot--orange" />
        Overdue
      </span>
    </div>
  </section>

  <!-- Cash flow graph - upper right -->
  <section class="cash-flow-card">
    <div class="cash-flow-card__head">
      <div>
        <span class="cash-flow-card__eyebrow">CASH FLOW</span>
        <strong class="cash-flow-card__title">Performa Arus Kas</strong>
      </div>

      <span class="cash-flow-card__badge">
        <VIcon icon="ri-arrow-up-line" size="14" />
        +28.6%
      </span>
    </div>

    <div class="cash-flow-card__graph">
      <svg
        class="cash-flow-svg"
        viewBox="0 0 650 240"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="cashFlowFillBlue" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="#2f8cff" stop-opacity="0.28" />
            <stop offset="100%" stop-color="#2f8cff" stop-opacity="0" />
          </linearGradient>

          <linearGradient id="cashFlowFillOrange" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="#f38a3e" stop-opacity="0.18" />
            <stop offset="100%" stop-color="#f38a3e" stop-opacity="0" />
          </linearGradient>
        </defs>

        <line class="cash-grid" x1="0" y1="55" x2="650" y2="55" />
        <line class="cash-grid" x1="0" y1="120" x2="650" y2="120" />
        <line class="cash-grid" x1="0" y1="185" x2="650" y2="185" />

        <path
          class="cash-line-area cash-line-area--blue"
          d="M0 200
            C45 185, 63 160, 100 172
            C138 184, 153 125, 194 140
            C238 158, 252 98, 295 114
            C340 130, 357 68, 405 84
            C450 99, 470 54, 515 64
            C560 75, 585 22, 650 30
            L650 240 L0 240 Z"
        />

        <path
          class="cash-line cash-line--blue"
          d="M0 200
            C45 185, 63 160, 100 172
            C138 184, 153 125, 194 140
            C238 158, 252 98, 295 114
            C340 130, 357 68, 405 84
            C450 99, 470 54, 515 64
            C560 75, 585 22, 650 30"
        />

        <path
          class="cash-line-area cash-line-area--orange"
          d="M0 215
            C42 210, 65 178, 102 192
            C145 208, 165 170, 205 180
            C245 193, 263 146, 305 161
            C348 177, 373 120, 415 138
            C457 155, 482 103, 520 120
            C564 140, 600 80, 650 95
            L650 240 L0 240 Z"
        />

        <path
          class="cash-line cash-line--orange"
          d="M0 215
            C42 210, 65 178, 102 192
            C145 208, 165 170, 205 180
            C245 193, 263 146, 305 161
            C348 177, 373 120, 415 138
            C457 155, 482 103, 520 120
            C564 140, 600 80, 650 95"
        />

        <circle class="cash-dot cash-dot--blue cash-dot--one" cx="100" cy="172" r="5" />
        <circle class="cash-dot cash-dot--blue cash-dot--two" cx="194" cy="140" r="5" />
        <circle class="cash-dot cash-dot--blue cash-dot--three" cx="295" cy="114" r="5" />
        <circle class="cash-dot cash-dot--blue cash-dot--four" cx="405" cy="84" r="5" />
        <circle class="cash-dot cash-dot--blue cash-dot--five" cx="515" cy="64" r="5" />
      </svg>

      <div class="cash-flow-card__months">
        <span>Jan</span>
        <span>Mar</span>
        <span>Mei</span>
        <span>Jul</span>
        <span>Sep</span>
        <span>Nov</span>
      </div>
    </div>
  </section>

  <!-- Data beams -->
  <div class="data-beam data-beam--one" />
  <div class="data-beam data-beam--two" />
  <div class="data-beam data-beam--three" />

  <!-- Floating crystal -->
  <div class="finance-crystal finance-crystal--one">
    <span />
  </div>

  <div class="finance-crystal finance-crystal--two">
    <span />
  </div>

  <!-- Floating labels -->
  <div class="finance-chip finance-chip--invoice">
    <VIcon icon="ri-file-list-3-line" size="15" />
    <span>Invoice</span>
  </div>

  <div class="finance-chip finance-chip--report">
    <VIcon icon="ri-pie-chart-2-line" size="15" />
    <span>Report</span>
  </div>

  <div class="finance-chip finance-chip--revenue">
    <VIcon icon="ri-funds-line" size="15" />
    <span>Revenue</span>
  </div>
</div>

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
/* =========================================================
   FUTURISTIC ACCOUNTING BACKGROUND
========================================================= */

[data-theme="light"] {
  --auth-visual-bg: #edf5ff;
  --auth-visual-grid: rgba(37, 104, 186, 0.11);
  --auth-visual-line: rgba(37, 104, 186, 0.2);
  --auth-visual-card: rgba(255, 255, 255, 0.55);
  --auth-visual-border: rgba(47, 121, 211, 0.22);
  --auth-visual-text: #54708f;
  --auth-visual-title: #173b73;
  --auth-orbit: rgba(45, 125, 225, 0.22);
  --auth-floor: rgba(37, 104, 186, 0.1);
}

[data-theme="dark"] {
  --auth-visual-bg: #07182f;
  --auth-visual-grid: rgba(61, 139, 255, 0.1);
  --auth-visual-line: rgba(73, 151, 255, 0.26);
  --auth-visual-card: rgba(13, 35, 69, 0.44);
  --auth-visual-border: rgba(87, 157, 255, 0.19);
  --auth-visual-text: #8fa9ca;
  --auth-visual-title: #e6f0ff;
  --auth-orbit: rgba(64, 143, 255, 0.22);
  --auth-floor: rgba(35, 126, 235, 0.1);
}

/* Panel kanan harus menjadi canvas visual */
.form-panel {
  position: relative;
  overflow: hidden;
  isolation: isolate;

  background:
    radial-gradient(circle at 78% 15%, rgba(41, 120, 231, 0.16), transparent 23%),
    radial-gradient(circle at 18% 90%, rgba(243, 138, 62, 0.08), transparent 23%),
    var(--auth-visual-bg);
}

/* Login card selalu paling depan */
.form-card {
  position: relative;
  z-index: 20;

  background: color-mix(in srgb, var(--surface) 92%, transparent);
  backdrop-filter: blur(20px);
}

/* Wrapper seluruh visual */
.auth-visual {
  position: absolute;
  inset: 0;
  z-index: 1;
  overflow: hidden;
  pointer-events: none;
}

/* Mesh background */
.auth-visual__mesh {
  position: absolute;
  inset: 0;

  opacity: 0.7;

  background-image:
    linear-gradient(var(--auth-visual-grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--auth-visual-grid) 1px, transparent 1px);

  background-size: 42px 42px;

  mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 18%,
    black 72%,
    transparent 100%
  );
}

/* Subtle visual texture */
.auth-visual__noise {
  position: absolute;
  inset: 0;

  opacity: 0.18;

  background:
    radial-gradient(circle at 12% 18%, rgba(70, 151, 255, 0.16) 0 1px, transparent 1px),
    radial-gradient(circle at 32% 44%, rgba(243, 138, 62, 0.14) 0 1px, transparent 1px),
    radial-gradient(circle at 76% 69%, rgba(70, 151, 255, 0.15) 0 1px, transparent 1px);

  background-size: 70px 70px, 105px 105px, 130px 130px;
}

/* Perspective floor */
.auth-visual__floor {
  position: absolute;
  left: -15%;
  right: -15%;
  bottom: -28%;
  height: 53%;

  transform: perspective(620px) rotateX(64deg);

  opacity: 0.82;

  background-image:
    linear-gradient(var(--auth-floor) 1px, transparent 1px),
    linear-gradient(90deg, var(--auth-floor) 1px, transparent 1px);

  background-size: 42px 42px;

  mask-image: linear-gradient(
    to top,
    black 0%,
    rgba(0, 0, 0, 0.65) 42%,
    transparent 100%
  );
}

.auth-visual__floor-glow {
  position: absolute;
  width: 710px;
  height: 310px;
  left: 50%;
  bottom: -165px;

  transform: translateX(-50%);
  border-radius: 50%;

  border: 1px solid rgba(61, 145, 255, 0.38);
  box-shadow:
    0 0 35px rgba(55, 144, 255, 0.22),
    inset 0 0 35px rgba(55, 144, 255, 0.13);

  opacity: 0.8;
}

/* Ambient lights */
.auth-aurora {
  position: absolute;
  border-radius: 50%;
  filter: blur(25px);
}

.auth-aurora--blue {
  width: 330px;
  height: 330px;
  top: -160px;
  right: -130px;

  background: rgba(39, 120, 235, 0.2);

  animation: aurora-drift-blue 12s ease-in-out infinite;
}

.auth-aurora--orange {
  width: 230px;
  height: 230px;
  left: -100px;
  bottom: -90px;

  background: rgba(243, 138, 62, 0.13);

  animation: aurora-drift-orange 14s ease-in-out infinite;
}

/* Orbit behind login card */
.auth-orbit {
  position: absolute;
  width: 660px;
  height: 660px;
  left: 50%;
  top: 50%;

  transform: translate(-50%, -50%);
  border-radius: 50%;
}

.auth-orbit__ring {
  position: absolute;
  inset: 0;
  border: 1px solid var(--auth-orbit);
  border-radius: 50%;
}

.auth-orbit__ring--one {
  transform: rotateX(64deg) rotateZ(8deg);
  animation: orbit-spin-one 18s linear infinite;
}

.auth-orbit__ring--two {
  inset: 62px;
  border-style: dashed;
  transform: rotateX(65deg) rotateZ(-28deg);
  animation: orbit-spin-two 24s linear infinite reverse;
}

.auth-orbit__ring--three {
  inset: 125px;
  border-color: rgba(243, 138, 62, 0.24);
  transform: rotateX(65deg) rotateZ(40deg);
  animation: orbit-spin-three 15s linear infinite;
}

.auth-orbit__pulse {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;

  background: #3d96ff;
  box-shadow:
    0 0 0 5px rgba(61, 150, 255, 0.12),
    0 0 18px rgba(61, 150, 255, 0.9);
}

.auth-orbit__pulse--one {
  top: 75px;
  left: 92px;
  animation: orbit-pulse-one 7s linear infinite;
}

.auth-orbit__pulse--two {
  right: 90px;
  bottom: 80px;

  background: var(--accent);

  box-shadow:
    0 0 0 5px rgba(243, 138, 62, 0.12),
    0 0 18px rgba(243, 138, 62, 0.9);

  animation: orbit-pulse-two 9s linear infinite;
}

/* Generic holographic card */
.holo-stat,
.holo-donut,
.cash-flow-card {
  position: absolute;

  border: 1px solid var(--auth-visual-border);
  background: var(--auth-visual-card);

  box-shadow:
    0 18px 40px rgba(4, 18, 42, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);

  backdrop-filter: blur(12px);
}

/* Revenue card */
.holo-stat {
  border-radius: 16px;
  padding: 1rem 1.05rem;
  color: var(--auth-visual-text);
}

.holo-stat--revenue {
  width: 220px;
  left: 7%;
  top: 16%;

  animation: float-card-one 9s ease-in-out infinite;
}

.holo-stat--invoice {
  width: 190px;
  left: 5%;
  bottom: 13%;

  animation: float-card-two 11s ease-in-out infinite;
}

.holo-stat__top {
  display: flex;
  align-items: center;
  gap: 0.46rem;
  margin-bottom: 0.85rem;
}

.holo-stat__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  color: #4ca1ff;
}

.holo-stat__label {
  font-size: 0.59rem;
  font-weight: 800;
  letter-spacing: 0.1em;
}

.holo-stat__value {
  display: block;
  margin-bottom: 0.58rem;

  color: var(--auth-visual-title);

  font-size: 0.93rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.holo-stat__trend {
  display: flex;
  align-items: center;
  gap: 0.25rem;

  font-size: 0.69rem;
  font-weight: 800;
}

.holo-stat__trend--up {
  color: #49d59a;
}

.holo-stat__trend small {
  margin-left: 0.15rem;

  color: var(--auth-visual-text);

  font-size: 0.62rem;
  font-weight: 600;
}

/* Invoice card */
.invoice-stat-row {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.invoice-stat-row__value {
  color: var(--auth-visual-title);

  font-size: 1.65rem;
  font-weight: 800;
  line-height: 1;
}

.invoice-stat-row__growth {
  color: #49d59a;

  font-size: 0.76rem;
  font-weight: 800;
}

.invoice-stat-row__caption {
  margin: 0.65rem 0 0;

  color: var(--auth-visual-text);

  font-size: 0.68rem;
  font-weight: 600;
}

/* Donut */
.holo-donut {
  width: 230px;
  right: 4%;
  top: 24%;

  padding: 1rem;
  border-radius: 20px;

  animation: float-donut 12s ease-in-out infinite;
}

.holo-donut__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.holo-donut__label {
  color: var(--auth-visual-text);

  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.1em;
}

.holo-donut__live {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;

  color: #53d99d;

  font-size: 0.6rem;
  font-weight: 700;
}

.holo-donut__live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;

  background: #53d99d;
  box-shadow: 0 0 0 4px rgba(83, 217, 157, 0.12);

  animation: live-pulse 2.2s ease-in-out infinite;
}

.holo-donut__body {
  position: relative;
  width: 150px;
  height: 150px;
  margin: 0.8rem auto 0.55rem;
}

.donut-svg {
  width: 150px;
  height: 150px;
  overflow: visible;

  transform: rotate(-90deg);
}

.donut-svg circle {
  fill: none;
  stroke-width: 15;
}

.donut-svg__track {
  stroke: rgba(111, 154, 212, 0.13);
}

.donut-svg__segment {
  stroke-linecap: round;
  transform-origin: 90px 90px;
}

.donut-svg__segment--one {
  stroke: #2f8cff;
  stroke-dasharray: 206 383;
  stroke-dashoffset: 0;

  filter: url(#donutGlow);

  animation: donut-spin-one 7s linear infinite;
}

.donut-svg__segment--two {
  stroke: #f38a3e;
  stroke-dasharray: 96 383;
  stroke-dashoffset: -220;

  filter: url(#donutGlow);

  animation: donut-spin-two 10s linear infinite reverse;
}

.donut-svg__segment--three {
  stroke: #6a6cff;
  stroke-dasharray: 42 383;
  stroke-dashoffset: -329;
}

.donut-svg__center-ring {
  stroke: rgba(95, 153, 230, 0.16);
  stroke-width: 1 !important;
}

.holo-donut__center {
  position: absolute;
  inset: 0;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.holo-donut__center span {
  color: var(--auth-visual-text);

  font-size: 0.52rem;
  font-weight: 800;
  letter-spacing: 0.09em;
}

.holo-donut__center strong {
  margin-top: 0.22rem;

  color: var(--auth-visual-title);

  font-size: 1.4rem;
  font-weight: 800;
}

.holo-donut__legend {
  display: flex;
  justify-content: center;
  gap: 0.8rem;

  color: var(--auth-visual-text);

  font-size: 0.6rem;
  font-weight: 700;
}

.holo-donut__legend span {
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
}

.legend-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.legend-dot--blue {
  background: #2f8cff;
}

.legend-dot--orange {
  background: #f38a3e;
}

/* Cash flow graph */
.cash-flow-card {
  width: min(560px, 58vw);
  height: 250px;
  right: -150px;
  top: 8%;

  padding: 1.1rem 1.2rem;
  border-radius: 22px;

  transform: rotate(-4deg);

  opacity: 0.88;

  animation: cash-flow-float 13s ease-in-out infinite;
}

.cash-flow-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.cash-flow-card__eyebrow {
  display: block;
  margin-bottom: 0.28rem;

  color: var(--auth-visual-text);

  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.11em;
}

.cash-flow-card__title {
  color: var(--auth-visual-title);

  font-size: 0.82rem;
  font-weight: 800;
}

.cash-flow-card__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.22rem;

  color: #4ad89b;

  font-size: 0.67rem;
  font-weight: 800;
}

.cash-flow-card__graph {
  height: 180px;
  margin-top: 0.6rem;
}

.cash-flow-svg {
  width: 100%;
  height: 150px;
  overflow: visible;
}

.cash-grid {
  stroke: var(--auth-visual-line);
  stroke-dasharray: 5 7;
  stroke-width: 1;
}

.cash-line-area {
  opacity: 0;
  animation: cash-area-fade 2.2s ease forwards;
}

.cash-line-area--blue {
  fill: url(#cashFlowFillBlue);
}

.cash-line-area--orange {
  fill: url(#cashFlowFillOrange);
  animation-delay: 0.25s;
}

.cash-line {
  fill: none;
  stroke-width: 4;
  stroke-linecap: round;
  stroke-linejoin: round;

  stroke-dasharray: 1100;
  stroke-dashoffset: 1100;
}

.cash-line--blue {
  stroke: #2f8cff;
  filter: drop-shadow(0 0 8px rgba(47, 140, 255, 0.55));

  animation: cash-line-draw 3.6s ease forwards;
}

.cash-line--orange {
  stroke: #f38a3e;
  filter: drop-shadow(0 0 8px rgba(243, 138, 62, 0.42));

  animation: cash-line-draw 3.9s ease forwards 0.25s;
}

.cash-dot {
  stroke: #0c2141;
  stroke-width: 3;

  opacity: 0;
}

.cash-dot--blue {
  fill: #f38a3e;
  filter: drop-shadow(0 0 6px rgba(243, 138, 62, 0.7));
}

.cash-dot--one {
  animation: cash-dot-show 0.3s ease forwards 0.75s;
}

.cash-dot--two {
  animation: cash-dot-show 0.3s ease forwards 1.15s;
}

.cash-dot--three {
  animation: cash-dot-show 0.3s ease forwards 1.55s;
}

.cash-dot--four {
  animation: cash-dot-show 0.3s ease forwards 1.95s;
}

.cash-dot--five {
  animation: cash-dot-show 0.3s ease forwards 2.35s;
}

.cash-flow-card__months {
  display: flex;
  justify-content: space-between;

  margin-top: -0.15rem;

  color: var(--auth-visual-text);

  font-size: 0.58rem;
  font-weight: 700;
}

/* Decorative data beams */
.data-beam {
  position: absolute;
  width: 1px;

  background: linear-gradient(
    to bottom,
    transparent,
    rgba(67, 150, 255, 0.8),
    transparent
  );

  box-shadow: 0 0 12px rgba(67, 150, 255, 0.72);
}

.data-beam--one {
  height: 160px;
  left: 25%;
  top: 29%;

  animation: beam-pulse 3.5s ease-in-out infinite;
}

.data-beam--two {
  height: 105px;
  right: 21%;
  top: 52%;

  animation: beam-pulse 4.5s ease-in-out infinite 1s;
}

.data-beam--three {
  height: 130px;
  left: 15%;
  bottom: 18%;

  animation: beam-pulse 5.4s ease-in-out infinite 0.5s;
}

/* Floating crystal / holographic diamond */
.finance-crystal {
  position: absolute;
  width: 48px;
  height: 48px;

  transform: rotate(45deg);

  border: 1px solid rgba(82, 163, 255, 0.55);

  background:
    linear-gradient(135deg, rgba(41, 149, 255, 0.43), transparent 58%),
    linear-gradient(315deg, rgba(243, 138, 62, 0.36), transparent 52%);

  box-shadow:
    0 0 24px rgba(44, 141, 255, 0.34),
    inset 0 0 16px rgba(98, 175, 255, 0.18);
}

.finance-crystal::before,
.finance-crystal::after {
  content: "";
  position: absolute;
  background: rgba(134, 195, 255, 0.35);
}

.finance-crystal::before {
  width: 1px;
  height: 100%;
  left: 50%;
  top: 0;
}

.finance-crystal::after {
  width: 100%;
  height: 1px;
  left: 0;
  top: 50%;
}

.finance-crystal span {
  position: absolute;
  inset: 11px;

  border: 1px solid rgba(243, 138, 62, 0.58);
  background: rgba(243, 138, 62, 0.16);
}

.finance-crystal--one {
  left: 18%;
  top: 42%;

  animation: crystal-float-one 10s ease-in-out infinite;
}

.finance-crystal--two {
  right: 19%;
  bottom: 20%;

  width: 58px;
  height: 58px;

  animation: crystal-float-two 12s ease-in-out infinite;
}

/* Floating chips */
.finance-chip {
  position: absolute;
  display: inline-flex;
  align-items: center;
  gap: 0.42rem;

  padding: 0.58rem 0.78rem;

  border: 1px solid var(--auth-visual-border);
  border-radius: 10px;

  color: var(--auth-visual-text);
  background: var(--auth-visual-card);

  box-shadow: 0 10px 26px rgba(3, 17, 38, 0.12);
  backdrop-filter: blur(10px);

  font-size: 0.67rem;
  font-weight: 700;
}

.finance-chip :deep(.v-icon) {
  color: var(--accent);
}

.finance-chip--invoice {
  top: 28%;
  left: 9%;

  animation: chip-float-one 8s ease-in-out infinite;
}

.finance-chip--report {
  top: 49%;
  right: 12%;

  animation: chip-float-two 10s ease-in-out infinite;
}

.finance-chip--revenue {
  right: 8%;
  bottom: 24%;

  animation: chip-float-three 9s ease-in-out infinite;
}

/* =========================================================
   Animations
========================================================= */

@keyframes aurora-drift-blue {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.62;
  }

  50% {
    transform: translate(-35px, 35px) scale(1.15);
    opacity: 0.9;
  }
}

@keyframes aurora-drift-orange {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.45;
  }

  50% {
    transform: translate(35px, -35px) scale(1.18);
    opacity: 0.72;
  }
}

@keyframes orbit-spin-one {
  to {
    transform: rotateX(64deg) rotateZ(368deg);
  }
}

@keyframes orbit-spin-two {
  to {
    transform: rotateX(65deg) rotateZ(-388deg);
  }
}

@keyframes orbit-spin-three {
  to {
    transform: rotateX(65deg) rotateZ(400deg);
  }
}

@keyframes orbit-pulse-one {
  0% {
    transform: translate(0, 0);
    opacity: 0.8;
  }

  25% {
    transform: translate(310px, -68px);
    opacity: 1;
  }

  50% {
    transform: translate(450px, 218px);
    opacity: 0.7;
  }

  75% {
    transform: translate(152px, 436px);
    opacity: 1;
  }

  100% {
    transform: translate(0, 0);
    opacity: 0.8;
  }
}

@keyframes orbit-pulse-two {
  0% {
    transform: translate(0, 0);
    opacity: 0.65;
  }

  25% {
    transform: translate(-290px, 68px);
    opacity: 1;
  }

  50% {
    transform: translate(-445px, -210px);
    opacity: 0.7;
  }

  75% {
    transform: translate(-155px, -430px);
    opacity: 1;
  }

  100% {
    transform: translate(0, 0);
    opacity: 0.65;
  }
}

@keyframes float-card-one {
  0%,
  100% {
    transform: translateY(0) rotate(-2deg);
  }

  50% {
    transform: translateY(-13px) rotate(-2deg);
  }
}

@keyframes float-card-two {
  0%,
  100% {
    transform: translateY(0) rotate(4deg);
  }

  50% {
    transform: translateY(-15px) rotate(4deg);
  }
}

@keyframes float-donut {
  0%,
  100% {
    transform: translateY(0) rotate(3deg);
  }

  50% {
    transform: translateY(-14px) rotate(3deg);
  }
}

@keyframes cash-flow-float {
  0%,
  100% {
    transform: rotate(-4deg) translateY(0);
  }

  50% {
    transform: rotate(-4deg) translateY(-13px);
  }
}

@keyframes live-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 4px rgba(83, 217, 157, 0.12);
  }

  50% {
    box-shadow: 0 0 0 9px rgba(83, 217, 157, 0);
  }
}

@keyframes donut-spin-one {
  to {
    transform: rotate(360deg);
  }
}

@keyframes donut-spin-two {
  to {
    transform: rotate(-360deg);
  }
}

@keyframes cash-line-draw {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes cash-area-fade {
  to {
    opacity: 1;
  }
}

@keyframes cash-dot-show {
  from {
    opacity: 0;
    transform: scale(0);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes beam-pulse {
  0%,
  100% {
    opacity: 0.22;
    transform: scaleY(0.75);
  }

  50% {
    opacity: 1;
    transform: scaleY(1);
  }
}

@keyframes crystal-float-one {
  0%,
  100% {
    transform: rotate(45deg) translateY(0);
  }

  50% {
    transform: rotate(145deg) translateY(-20px);
  }
}

@keyframes crystal-float-two {
  0%,
  100% {
    transform: rotate(45deg) translateY(0);
  }

  50% {
    transform: rotate(-70deg) translateY(-18px);
  }
}

@keyframes chip-float-one {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-10px);
  }
}

@keyframes chip-float-two {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(12px);
  }
}

@keyframes chip-float-three {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-12px);
  }
}

/* =========================================================
   Responsive visual behavior
========================================================= */

@media (max-width: 1280px) {
  .cash-flow-card {
    right: -245px;
    opacity: 0.58;
  }

  .holo-donut {
    right: -54px;
    opacity: 0.6;
  }

  .holo-stat--revenue {
    left: 2%;
    opacity: 0.6;
  }

  .holo-stat--invoice {
    left: -35px;
    opacity: 0.55;
  }

  .finance-crystal--one {
    left: 8%;
  }
}

@media (max-width: 900px) {
  .auth-orbit {
    width: 570px;
    height: 570px;
  }

  .cash-flow-card {
    width: 510px;
    right: -280px;
    top: 10%;
    opacity: 0.38;
  }

  .holo-donut {
    right: -80px;
    opacity: 0.36;
  }

  .holo-stat--revenue {
    left: -85px;
    opacity: 0.36;
  }

  .holo-stat--invoice {
    left: -100px;
    opacity: 0.3;
  }

  .finance-chip--invoice {
    left: -20px;
    opacity: 0.36;
  }

  .finance-chip--report {
    right: -20px;
    opacity: 0.32;
  }

  .finance-chip--revenue,
  .finance-crystal--two {
    display: none;
  }
}

@media (max-width: 560px) {
  .auth-orbit {
    width: 500px;
    height: 500px;
    opacity: 0.45;
  }

  .cash-flow-card,
  .holo-donut,
  .holo-stat,
  .finance-chip,
  .finance-crystal,
  .data-beam {
    display: none;
  }

  .auth-visual__floor {
    bottom: -16%;
    opacity: 0.45;
  }
}

/* Hormati pengguna yang tidak ingin animasi */
@media (prefers-reduced-motion: reduce) {
  .auth-visual *,
  .auth-visual::before,
  .auth-visual::after {
    animation: none !important;
    transition: none !important;
  }

  .cash-line {
    stroke-dashoffset: 0;
  }

  .cash-line-area,
  .cash-dot {
    opacity: 1;
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
