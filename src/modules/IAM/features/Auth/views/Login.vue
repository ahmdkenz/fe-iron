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

    <!-- ══════ LEFT BRAND PANEL ══════ -->
    <aside class="brand-panel">
      <div class="brand-inner">
        <div class="brand-logo-tile">
          <img src="/images/iron/Logo_IRON.png" alt="IRON" class="brand-logo-img" />
        </div>
        <h1 class="brand-name">I.R.O.N</h1>
        <p class="brand-tag">Intelligent Record of Numbers</p>
        <p class="brand-desc">
          Sistem akuntansi terpadu untuk mengelola keuangan,
          invoice, dan laporan bisnis Anda dalam satu tempat.
        </p>

        <ul class="brand-points">
          <li>
            <VIcon icon="ri-shield-check-line" size="18" class="bp-icon" />
            <span>Keamanan data terjamin</span>
          </li>
          <li>
            <VIcon icon="ri-line-chart-line" size="18" class="bp-icon" />
            <span>Laporan keuangan real-time</span>
          </li>
          <li>
            <VIcon icon="ri-time-line" size="18" class="bp-icon" />
            <span>Efisiensi proses operasional</span>
          </li>
        </ul>
      </div>

      <p class="brand-foot">© {{ currentYear }} PT Sheza Mitra Amanah</p>
    </aside>

    <!-- ══════ RIGHT FORM PANEL ══════ -->
    <main class="form-panel">
      <div class="form-card">

        <!-- Compact logo for mobile -->
        <div class="mobile-logo">
          <img src="/images/iron/Logo_IRON.png" alt="IRON" />
          <span>I.R.O.N</span>
        </div>

        <h2 class="card-title">Selamat Datang</h2>
        <p class="card-sub">Masuk untuk melanjutkan ke sistem I.R.O.N</p>

        <VForm ref="formRef" @submit.prevent="handleLogin" class="mt-7">

          <label class="fx-label">Username</label>
          <VTextField
            v-model="form.username"
            placeholder="Masukkan username"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="ri-user-3-line"
            :rules="[v => !!v || 'Username tidak boleh kosong']"
            :error-messages="errors.username"
            class="fx-field mb-4"
          />

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
            class="fx-field mb-2"
            @click:append-inner="showPassword = !showPassword"
          />

          <div class="row-opts mb-5">
            <VCheckbox
              v-model="rememberMe"
              label="Remember me"
              hide-details
              density="compact"
              class="fx-cb"
            />
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
              <VProgressCircular indeterminate size="20" width="2" color="white" />
            </template>
            <template v-if="isLocked">
              <VIcon icon="ri-lock-2-line" size="15" class="mr-1" />
              Terkunci {{ lockCountdown }}
            </template>
            <template v-else>
              {{ isSubmitting ? 'Memproses...' : 'Login' }}
            </template>
          </VBtn>

        </VForm>
      </div>
    </main>

    <!-- ══════ SUCCESS OVERLAY ══════ -->
    <Transition name="fade">
      <div v-if="showOverlay" class="sov">
        <div class="sov-wrap mb-6">
          <div class="sov-spinner" />
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

const currentYear = new Date().getFullYear()

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
  --page-bg:    #f1f5f9;
  --surface:    #ffffff;
  --txt:        #0f172a;
  --mut:        #64748b;
  --dim:        #94a3b8;
  --border:     #e2e8f0;
  --border-hi:  #1b3b73;
  --field-bg:   #f8fafc;
  --shadow:     0 24px 60px rgba(15, 23, 42, 0.10), 0 2px 6px rgba(15, 23, 42, 0.04);
}

[data-theme="dark"] {
  --page-bg:    #0d1c38;
  --surface:    #15294a;
  --txt:        #f1f5f9;
  --mut:        #9fb0cc;
  --dim:        #6b7e9e;
  --border:     #294063;
  --border-hi:  #ed7d2b;
  --field-bg:   #102140;
  --shadow:     0 24px 60px rgba(0, 0, 0, 0.45), 0 2px 6px rgba(0, 0, 0, 0.3);
}

/* shared brand constants */
:root, [data-theme] {
  --brand:        #1b3b73;
  --brand-deep:   #142d59;
  --accent:       #ed7d2b;
  --accent-hover: #d76c1d;
}

/* ── Root ── */
.lr-root {
  min-height: 100vh;
  width: 100%;
  font-family: 'Inter', sans-serif;
  position: relative;
  display: flex;
  background: var(--page-bg);
  transition: background 0.3s;
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
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 4px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.theme-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 7px;
  border: none;
  background: transparent;
  color: var(--mut);
  font-size: 0.71rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.18s, color 0.18s;
}
.theme-btn:hover   { background: var(--field-bg); color: var(--accent); }
.theme-btn--active { background: var(--brand); color: #ffffff; }

/* ══════ LEFT BRAND PANEL ══════ */
.brand-panel {
  width: 46%;
  max-width: 620px;
  background: var(--brand);
  color: #ffffff;
  padding: 3.5rem 3rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
}

.brand-inner {
  margin: auto 0;
  max-width: 420px;
}

.brand-logo-tile {
  width: 92px;
  height: 92px;
  border-radius: 22px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.18);
}
.brand-logo-img { width: 62px; height: 62px; object-fit: contain; }

.brand-name {
  font-size: 2.4rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  line-height: 1;
  margin: 0 0 0.5rem;
}
.brand-tag {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--accent);
  margin: 0 0 1.5rem;
  letter-spacing: 0.02em;
}
.brand-desc {
  font-size: 0.92rem;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.78);
  margin: 0 0 2.25rem;
}

.brand-points {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.95rem;
}
.brand-points li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}
.bp-icon {
  color: var(--accent) !important;
  flex-shrink: 0;
}

.brand-foot {
  position: absolute;
  bottom: 1.75rem;
  left: 3rem;
  font-size: 0.74rem;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

/* ══════ RIGHT FORM PANEL ══════ */
.form-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2.5rem 1.5rem;
}

.form-card {
  width: 100%;
  max-width: 400px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 2.75rem 2.5rem;
  box-shadow: var(--shadow);
  animation: card-up 0.55s cubic-bezier(0.34, 1.2, 0.64, 1) both;
}
@keyframes card-up {
  from { opacity: 0; transform: translateY(22px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* mobile logo (hidden on desktop) */
.mobile-logo {
  display: none;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 1.5rem;
}
.mobile-logo img { width: 40px; height: 40px; object-fit: contain; }
.mobile-logo span { font-size: 1.25rem; font-weight: 900; color: var(--txt); letter-spacing: 0.04em; }

/* ── Card text ── */
.card-title {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--txt);
  margin-bottom: 0.4rem;
  letter-spacing: 0.01em;
}
.card-sub {
  font-size: 0.85rem;
  color: var(--mut);
  margin: 0;
  line-height: 1.5;
}

/* ── Fields ── */
.fx-label {
  display: block;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--txt);
  margin-bottom: 0.4rem;
  letter-spacing: 0.01em;
}
.fx-field :deep(.v-field)           { background-color: var(--field-bg) !important; border-radius: 10px; }
.fx-field :deep(.v-field__outline)  { --v-field-border-color: var(--border) !important; --v-field-border-opacity: 1; }
.fx-field :deep(.v-field--focused .v-field__outline) { --v-field-border-color: var(--border-hi) !important; }
.fx-field :deep(.v-field__input)    { color: var(--txt); }
.fx-field :deep(input::placeholder) { color: var(--dim); opacity: 1; }
.fx-field :deep(.v-icon)            { color: var(--dim); }
.fx-field :deep(.v-field--focused .v-icon) { color: var(--accent); }
.fx-cb    :deep(.v-label)           { color: var(--mut); font-size: 0.82rem; opacity: 1; }
.fx-cb    :deep(.v-selection-control__input) { color: var(--brand); }

/* ── Row opts ── */
.row-opts {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.a-forgot {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--accent);
  text-decoration: none;
  transition: color 0.2s;
  white-space: nowrap;
}
.a-forgot:hover { color: var(--accent-hover); }

/* ── Login button ── */
.fx-btn {
  background: var(--brand) !important;
  color: #ffffff !important;
  font-weight: 700 !important;
  font-size: 0.95rem !important;
  letter-spacing: 0.04em;
  border-radius: 10px !important;
  height: 48px !important;
  transition: transform 0.15s ease, box-shadow 0.2s ease, background 0.2s ease !important;
}
.fx-btn:not(:disabled):hover {
  background: var(--brand-deep) !important;
  transform: translateY(-1px);
  box-shadow: 0 8px 22px rgba(27, 59, 115, 0.3) !important;
}

.a-contact-row { font-size: 0.79rem; color: var(--mut); }
.a-contact { font-weight: 600; color: var(--accent); text-decoration: none; transition: color 0.2s; }
.a-contact:hover { color: var(--accent-hover); }

/* ── Lockout ── */
.attempt-warn {
  font-size: 0.76rem;
  font-weight: 500;
  color: #b45309;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.28);
  border-radius: 8px;
  padding: 6px 10px;
  display: flex;
  align-items: center;
}
.countdown-text { font-family: 'Courier New', monospace; letter-spacing: 0.05em; }

/* ── Success overlay ── */
.sov {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(11, 17, 32, 0.85);
  backdrop-filter: blur(8px);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease; }
.fade-enter-from,  .fade-leave-to      { opacity: 0; }

.sov-wrap {
  position: relative; width: 96px; height: 96px;
  display: flex; align-items: center; justify-content: center;
}
.sov-spinner {
  position: absolute; inset: 0; border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.12);
  border-top-color: var(--accent);
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.sov-box {
  width: 74px; height: 74px; border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.16);
  position: relative; z-index: 1;
  display: flex; align-items: center; justify-content: center;
}
.sov-icon   { color: var(--accent) !important; }
.sov-title  { font-size: 1.3rem; font-weight: 800; color: #ffffff; margin-bottom: 0.2rem; }
.sov-name   { color: var(--accent); font-size: 0.9rem; font-weight: 500; margin-bottom: 0.15rem; }
.sov-status { color: rgba(255, 255, 255, 0.6); font-size: 0.79rem; }

.sov-prog { width: 220px; height: 3px; background: rgba(255, 255, 255, 0.12); border-radius: 4px; overflow: hidden; }
.sov-bar  {
  height: 100%; background: var(--accent); border-radius: 4px;
  animation: fill 2.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
@keyframes fill { 0%{width:0} 30%{width:40%} 65%{width:72%} 100%{width:100%} }

.loading-dots::after { content: ''; animation: dots 1.5s steps(4, end) infinite; }
@keyframes dots { 0%,20%{content:''} 40%{content:'.'} 60%{content:'..'} 80%,100%{content:'...'} }

/* ── Responsive ── */
@media (max-width: 900px) {
  .brand-panel { display: none; }
  .mobile-logo { display: flex; }
  .form-panel  { padding: 1.5rem 1rem; }
}
</style>
