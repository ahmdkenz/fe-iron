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

    <div class="layout">

      <!-- ══════ LEFT BRAND ══════ -->
      <div class="brand-col d-none d-lg-block">
        <canvas ref="canvasRef" class="matrix-canvas" />
        <div class="brand-content">
          <div class="brand-inner">

            <div class="sys-badge mb-10">
              <span class="sys-dot" />
              LIVE SYSTEM &nbsp;·&nbsp; ENTERPRISE READY
            </div>

            <div class="iron-hero">I.R.O.N</div>
            <div class="iron-fullname mb-10">
              Intelligent Record of Organization Number
            </div>

            <div class="h-sep mb-10" />

            <div class="letter-stack mb-10">
              <div
                v-for="(l, i) in ironLetters"
                :key="i"
                class="lrow"
                :style="`--li:${i}`"
              >
                <span class="lc">{{ l.char }}</span>
                <span class="ld" />
                <span class="lm"><b>{{ l.hi }}</b>{{ l.tail }}</span>
              </div>
            </div>

            <div class="h-sep mb-8" />

            <div class="stat-row">
              <div
                v-for="(s, i) in stats"
                :key="s.label"
                class="stat-card"
                :style="`--si:${i}`"
              >
                <VIcon :icon="s.icon" size="17" class="s-icon mb-1" />
                <span class="sv">{{ s.value }}</span>
                <span class="sl">{{ s.label }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════ RIGHT FORM ══════ -->
      <div class="form-col d-flex align-center justify-center">
        <div class="glass-card">

          <!-- Mobile brand -->
          <div class="mob-brand d-flex d-lg-none align-center gap-3 mb-8">
            <div class="mob-emblem d-flex align-center justify-center">
              <span class="mob-monogram">IR</span>
            </div>
            <div>
              <div class="mob-iron">I.R.O.N</div>
              <div class="mob-sub">Intelligent Record of Organization Number</div>
            </div>
          </div>

          <!-- Form header -->
          <div class="text-center mb-8">
            <div class="d-none d-lg-flex justify-center mb-5">
              <div class="emblem-orbit">
                <div class="orbit-spin" />
                <div class="emblem-center d-flex flex-column align-center justify-center">
                  <span class="emblem-mono">IR</span>
                  <span class="emblem-sub">IRON</span>
                </div>
              </div>
            </div>

            <h2 class="card-title">Masuk ke Sistem</h2>

            <div class="card-motto">
              <span class="motto-pill">Presisi</span>
              <span class="motto-sep">·</span>
              <span class="motto-pill">Akurasi</span>
              <span class="motto-sep">·</span>
              <span class="motto-pill">Integritas</span>
            </div>

            <p class="card-sub">
              Sistem manajemen keuangan enterprise terintegrasi.<br>
              Autentikasi untuk memulai sesi kerja Anda.
            </p>
          </div>

          <VForm ref="formRef" @submit.prevent="handleLogin">
            <VTextField
              v-model="form.username"
              label="Username"
              placeholder="Masukkan Username Anda"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="ri-user-3-line"
              :rules="[v => !!v || 'Username tidak boleh kosong']"
              :error-messages="errors.username"
              class="fx-field mb-4"
            />
            <VTextField
              v-model="form.password"
              label="Kata Sandi"
              placeholder="············"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="ri-lock-2-line"
              :type="showPassword ? 'text' : 'password'"
              :append-inner-icon="showPassword ? 'ri-eye-off-line' : 'ri-eye-line'"
              :rules="[v => !!v || 'Kata sandi tidak boleh kosong']"
              :error-messages="errors.password"
              class="fx-field mb-3"
              @click:append-inner="showPassword = !showPassword"
            />
            <div class="d-flex align-center justify-space-between mb-6">
              <VCheckbox
                v-model="rememberMe"
                label="Ingat Sesi"
                hide-details
                density="compact"
                color="primary"
                class="fx-cb"
              />
              <a href="#" class="a-forgot">Lupa Kata Sandi?</a>
            </div>
            <VAlert
              v-if="errorMessage"
              type="error"
              variant="tonal"
              class="mb-5"
              closable
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
                <VProgressCircular indeterminate size="22" width="2" color="white" />
              </template>
              {{ isSubmitting ? 'Memproses...' : 'Masuk ke Sistem' }}
            </VBtn>
            <p class="text-center mt-6 a-contact-row">
              Kendala akses?
              <a href="#" class="a-contact">Hubungi Administrator</a>
            </p>
          </VForm>
        </div>
      </div>
    </div>

    <!-- ══════ SUCCESS OVERLAY ══════ -->
    <Transition name="fade">
      <div
        v-if="showOverlay"
        class="sov d-flex flex-column align-center justify-center"
      >
        <div class="sov-wrap mb-6">
          <div class="sov-ring" />
          <div class="sov-box d-flex align-center justify-center">
            <VIcon icon="ri-shield-check-line" size="40" class="sov-icon" />
          </div>
        </div>
        <h2 class="sov-title">Otentikasi Berhasil</h2>
        <p class="sov-name">Selamat datang, {{ employeeDisplayName }}</p>
        <p class="sov-status loading-dots">{{ processingText }}</p>
        <div class="sov-prog mt-6">
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

// ── Matrix Canvas ─────────────────────────────────────────────────────────────
const canvasRef = ref(null)
const FONT      = 14
const CHARS     = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$%+=-*/|<>{}[]'
let animFrame   = null
let drops       = []
let mqListener  = null
let resizeFn    = null

function initCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const parent  = canvas.parentElement
  canvas.width  = parent.offsetWidth
  canvas.height = parent.offsetHeight
  drops = Array.from(
    { length: Math.floor(canvas.width / FONT) },
    () => Math.random() * -(canvas.height / FONT),
  )
}

function tick() {
  const canvas = canvasRef.value
  if (!canvas) { animFrame = requestAnimationFrame(tick); return }
  const ctx  = canvas.getContext('2d')
  const dark = resolvedTheme.value === 'dark'

  ctx.fillStyle = dark ? 'rgba(12,12,12,0.055)' : 'rgba(232,233,235,0.055)'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.font = `${FONT}px "Courier New", monospace`

  for (let i = 0; i < drops.length; i++) {
    const x = i * FONT
    const y = drops[i] * FONT

    ctx.fillStyle = dark ? 'rgba(255,255,255,0.82)' : 'rgba(9,9,11,0.82)'
    ctx.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], x, y)

    ctx.fillStyle = dark ? 'rgba(56,189,248,0.45)' : 'rgba(3,105,161,0.45)'
    ctx.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], x, y - FONT * 2)

    if (y > canvas.height && Math.random() > 0.975) drops[i] = 0
    drops[i] += 0.35 + Math.random() * 0.35
  }

  animFrame = requestAnimationFrame(tick)
}

onMounted(() => {
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  systemDark.value = mq.matches
  mqListener = e => { systemDark.value = e.matches }
  mq.addEventListener('change', mqListener)

  initCanvas()
  animFrame = requestAnimationFrame(tick)

  resizeFn = () => initCanvas()
  window.addEventListener('resize', resizeFn)
})

onUnmounted(() => {
  if (animFrame) cancelAnimationFrame(animFrame)
  if (resizeFn)  window.removeEventListener('resize', resizeFn)
  if (mqListener) {
    window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', mqListener)
  }
})

// ── Brand Data ────────────────────────────────────────────────────────────────
const ironLetters = [
  { char: 'I', hi: 'Intelligent',  tail: '' },
  { char: 'R', hi: 'Record',       tail: ' of' },
  { char: 'O', hi: 'Organization', tail: '' },
  { char: 'N', hi: 'Number',       tail: '' },
]

const stats = [
  { value: '155K+', label: 'Total Laporan',  icon: 'ri-file-chart-line' },
  { value: '2.8K',  label: 'Pengguna Aktif', icon: 'ri-team-line' },
  { value: '99.9%', label: 'Uptime',         icon: 'ri-shield-check-line' },
]

const employeeDisplayName = computed(() =>
  authStore.user?.karyawan?.nama_karyawan
  || authStore.user?.username
  || 'Pengguna',
)

// ── Login ─────────────────────────────────────────────────────────────────────
async function handleLogin() {
  errorMessage.value = ''
  errors.username = []
  errors.password = []

  const { valid } = await formRef.value.validate()
  if (!valid) return

  try {
    isSubmitting.value = true
    await authStore.login(form.username, form.password)

    showOverlay.value = true
    setTimeout(() => { processingText.value = 'Menyiapkan ruang kerja aman...' }, 800)
    setTimeout(() => { processingText.value = 'Menginisialisasi dasbor utama...' }, 1600)
    setTimeout(() => { router.push({ name: 'dashboard' }) }, 2800)
  } catch (err) {
    isSubmitting.value = false
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
/* ── Light tokens ── */
[data-theme="light"] {
  --bg:      #f4f4f5;
  --bg-b:    #e8e9eb;
  --bg-card: #ffffff;
  --txt:     #09090b;
  --mut:     rgba(9,9,11,0.58);
  --dim:     rgba(9,9,11,0.34);
  --acc:     #0369a1;
  --acc-hi:  #0284c7;
  --acc-lo:  rgba(3,105,161,0.08);
  --bdr:     rgba(9,9,11,0.1);
  --bdr-hi:  rgba(3,105,161,0.28);
  --shadow:  0 20px 56px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06);
  --btn-bg:  #0369a1;
}

/* ── Dark tokens ── */
[data-theme="dark"] {
  --bg:      #080808;
  --bg-b:    #0c0c0c;
  --bg-card: #111111;
  --txt:     #ffffff;
  --mut:     rgba(255,255,255,0.58);
  --dim:     rgba(255,255,255,0.32);
  --acc:     #38bdf8;
  --acc-hi:  #7dd3fc;
  --acc-lo:  rgba(56,189,248,0.08);
  --bdr:     rgba(255,255,255,0.08);
  --bdr-hi:  rgba(56,189,248,0.28);
  --shadow:  0 20px 56px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4);
  --btn-bg:  #0284c7;
}

/* ── Root ── */
.lr-root {
  min-height: 100vh;
  width: 100%;
  background: var(--bg);
  color: var(--txt);
  font-family: 'Inter', sans-serif;
  position: relative;
  overflow: hidden;
  transition: background 0.25s, color 0.25s;
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
  background: var(--bg-card);
  border: 1px solid var(--bdr);
  border-radius: 10px;
  padding: 4px;
  box-shadow: var(--shadow);
  transition: background 0.25s, border-color 0.25s;
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
.theme-btn:hover       { background: var(--acc-lo); color: var(--acc); }
.theme-btn--active     { background: var(--acc-lo); color: var(--acc); }

/* ── Layout ── */
.layout {
  display: flex;
  min-height: 100vh;
}

/* ── Brand column ── */
.brand-col {
  flex: 1;
  background: var(--bg-b);
  border-right: 1px solid var(--bdr);
  position: relative;
  overflow: hidden;
  min-height: 100vh;
  transition: background 0.25s, border-color 0.25s;
}

.matrix-canvas {
  position: absolute;
  inset: 0;
  z-index: 1;
  opacity: 0.45;
}

.brand-content {
  position: relative;
  z-index: 3;
  min-height: 100vh;
  padding: 3rem 3.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.brand-inner {
  max-width: 500px;
  animation: slide-left 0.7s cubic-bezier(0.34, 1.2, 0.64, 1) both;
}
@keyframes slide-left {
  from { opacity: 0; transform: translateX(-20px); }
  to   { opacity: 1; transform: translateX(0); }
}

/* Badge */
.sys-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: #10b981;
  background: rgba(16,185,129,0.1);
  border: 1px solid rgba(16,185,129,0.2);
  border-radius: 20px;
  padding: 5px 14px;
}
.sys-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #10b981;
  animation: dot-pulse 2s ease-in-out infinite;
}
@keyframes dot-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.2; transform: scale(0.65); }
}

/* IRON title */
.iron-hero {
  font-size: 5rem;
  font-weight: 900;
  letter-spacing: 0.32em;
  line-height: 1;
  color: var(--acc);
}
.iron-fullname {
  font-size: 0.92rem;
  color: var(--mut);
  line-height: 1.6;
}

/* Separator */
.h-sep { height: 1px; background: var(--bdr); border: none; }

/* Letter rows */
.letter-stack { display: flex; flex-direction: column; gap: 0.5rem; }
.lrow {
  display: flex; align-items: center; gap: 1.2rem;
  animation: lrow-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) calc(var(--li) * 0.11s) both;
  transition: transform 0.2s;
}
.lrow:hover { transform: translateX(6px); }
@keyframes lrow-in {
  from { opacity: 0; transform: translateX(-24px); }
  to   { opacity: 1; transform: translateX(0); }
}
.lc {
  font-size: 2.8rem; font-weight: 900; line-height: 1;
  min-width: 2.2rem; text-align: center; flex-shrink: 0;
  color: var(--acc);
}
.ld { width: 20px; height: 1px; flex-shrink: 0; background: var(--bdr-hi); opacity: 0.55; }
.lm   { font-size: 1.1rem; color: var(--mut); line-height: 1.3; }
.lm b { font-weight: 700; color: var(--txt); }

/* Stats */
.stat-row { display: flex; gap: 0.75rem; }
.stat-card {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px;
  background: var(--acc-lo);
  border: 1px solid var(--bdr);
  border-radius: 12px; padding: 0.8rem 0.4rem;
  cursor: default;
  animation: stat-rise 0.5s cubic-bezier(0.34, 1.2, 0.64, 1) calc(var(--si) * 0.1s + 0.5s) both;
  transition: transform 0.2s, border-color 0.2s;
}
.stat-card:hover { transform: translateY(-4px); border-color: var(--bdr-hi); }
@keyframes stat-rise {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
.s-icon { color: var(--acc) !important; }
.sv { font-size: 1.35rem; font-weight: 800; color: var(--acc); line-height: 1; }
.sl { font-size: 0.62rem; color: var(--dim); text-transform: uppercase; letter-spacing: 0.08em; text-align: center; }

/* ── Form column ── */
.form-col {
  flex: 0 0 100%; max-width: 100%;
  background: var(--bg);
  padding: 2rem 1.5rem;
  min-height: 100vh;
  transition: background 0.25s;
}
@media (min-width: 1280px) {
  .form-col { flex: 0 0 500px; max-width: 500px; }
}

/* Card */
.glass-card {
  width: 100%; max-width: 420px;
  background: var(--bg-card);
  border: 1px solid var(--bdr);
  border-radius: 16px;
  padding: 2.75rem 2.25rem;
  box-shadow: var(--shadow);
  animation: card-up 0.65s cubic-bezier(0.34, 1.2, 0.64, 1) 0.15s both;
  transition: background 0.25s, border-color 0.25s, box-shadow 0.25s;
}
@keyframes card-up {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Mobile brand */
.mob-emblem {
  width: 48px; height: 48px; border-radius: 10px; flex-shrink: 0;
  background: var(--acc-lo); border: 1px solid var(--bdr-hi);
}
.mob-monogram { font-size: 1rem; font-weight: 900; letter-spacing: 2px; color: var(--acc); }
.mob-iron     { font-size: 1.05rem; font-weight: 800; color: var(--acc); letter-spacing: 3px; }
.mob-sub      { font-size: 0.65rem; color: var(--mut); line-height: 1.45; }

/* Emblem orbit */
.emblem-orbit {
  position: relative; width: 88px; height: 88px;
  display: flex; align-items: center; justify-content: center;
}
.orbit-spin {
  position: absolute; inset: 0; border-radius: 50%;
  background: conic-gradient(from 0deg, transparent 40%, var(--acc) 65%, transparent 72%);
  animation: spin 3s linear infinite;
  opacity: 0.6;
}
@keyframes spin { to { transform: rotate(360deg); } }
.emblem-center {
  width: 72px; height: 72px; border-radius: 50%;
  background: var(--bg-card); border: 1px solid var(--bdr);
  position: relative; z-index: 1;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 1px;
  transition: background 0.25s, border-color 0.25s;
}
.emblem-mono {
  font-size: 1.4rem; font-weight: 900; letter-spacing: 3px;
  color: var(--acc); line-height: 1;
}
.emblem-sub {
  font-size: 0.48rem; font-weight: 700; letter-spacing: 0.18em;
  color: var(--dim); text-transform: uppercase;
}

/* Card text */
.card-title { font-size: 1.45rem; font-weight: 800; color: var(--txt); margin-bottom: 0.55rem; }
.card-motto {
  display: flex; align-items: center; justify-content: center;
  gap: 0.45rem; margin-bottom: 0.8rem;
}
.motto-pill {
  font-size: 0.67rem; font-weight: 700; letter-spacing: 0.1em;
  color: var(--acc); text-transform: uppercase;
}
.motto-sep { color: var(--dim); font-size: 0.7rem; }
.card-sub  { font-size: 0.78rem; color: var(--mut); margin: 0; line-height: 1.65; }

/* Fields */
.fx-field :deep(.v-field)           { background-color: var(--bg) !important; border-radius: 10px; }
.fx-field :deep(.v-field__outline)  { --v-field-border-color: var(--bdr) !important; }
.fx-field :deep(.v-field--focused .v-field__outline) { --v-field-border-color: var(--bdr-hi) !important; }
.fx-field :deep(.v-field__input)    { color: var(--txt); }
.fx-field :deep(.v-label)           { color: var(--mut); }
.fx-field :deep(.v-icon)            { color: var(--dim); }
.fx-field :deep(.v-field--focused .v-icon) { color: var(--acc); }
.fx-cb    :deep(.v-label)           { color: var(--mut); font-size: 0.83rem; }

.a-forgot {
  font-size: 0.81rem; font-weight: 600; color: var(--acc);
  text-decoration: none; opacity: 0.8; transition: opacity 0.2s;
}
.a-forgot:hover { opacity: 1; }

/* Login button */
.fx-btn {
  background: var(--btn-bg) !important;
  color: #ffffff !important;
  font-weight: 700 !important;
  font-size: 0.95rem !important;
  letter-spacing: 0.04em;
  border-radius: 10px !important;
  transition: transform 0.15s ease, box-shadow 0.2s ease !important;
}
.fx-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(2,132,199,0.4) !important;
}

.a-contact-row { font-size: 0.8rem; color: var(--dim); }
.a-contact { font-weight: 600; color: var(--acc); text-decoration: none; transition: color 0.2s; }
.a-contact:hover { color: var(--acc-hi); }

/* ── Success overlay ── */
.sov {
  position: fixed; inset: 0; z-index: 9999;
  background: var(--bg);
  transition: background 0.25s;
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease; }
.fade-enter-from,  .fade-leave-to      { opacity: 0; }

.sov-wrap {
  position: relative; width: 100px; height: 100px;
  display: flex; align-items: center; justify-content: center;
}
.sov-ring {
  position: absolute; inset: 0; border-radius: 50%;
  background: conic-gradient(from 0deg, transparent 38%, var(--acc) 65%, transparent 70%);
  animation: spin 1.4s linear infinite;
}
.sov-box {
  width: 76px; height: 76px; border-radius: 50%;
  background: var(--bg-card); border: 1px solid var(--bdr);
  position: relative; z-index: 1;
  display: flex; align-items: center; justify-content: center;
}
.sov-icon   { color: var(--acc) !important; }
.sov-title  { font-size: 1.3rem; font-weight: 800; color: var(--txt); margin-bottom: 0.25rem; }
.sov-name   { color: var(--acc); font-size: 0.92rem; font-weight: 500; margin-bottom: 0.2rem; }
.sov-status { color: var(--mut); font-size: 0.8rem; }

.sov-prog { width: 240px; height: 3px; background: var(--acc-lo); border-radius: 4px; overflow: hidden; }
.sov-bar  {
  height: 100%; background: var(--btn-bg); border-radius: 4px;
  animation: fill 2.8s cubic-bezier(0.4,0,0.2,1) forwards;
}
@keyframes fill { 0%{width:0} 30%{width:40%} 65%{width:72%} 100%{width:100%} }

.loading-dots::after { content: ''; animation: dots 1.5s steps(4,end) infinite; }
@keyframes dots { 0%,20%{content:''} 40%{content:'.'} 60%{content:'..'} 80%,100%{content:'...'} }
</style>
