<template>
  <div class="lr-root">
    <div class="bg-grid" />
    <div class="orb orb-a" /><div class="orb orb-b" /><div class="orb orb-c" />
    <div class="scan-line" />

    <span class="gw gw1">BALANCE SHEET</span>
    <span class="gw gw2">CASH FLOW</span>
    <span class="gw gw3">AUDIT LOG</span>
    <span class="gw gw4">P&L STATEMENT</span>
    <span class="gw gw5">JOURNAL ENTRY</span>
    <span class="gw gw6">GENERAL LEDGER</span>

    <div class="pt pt1" /><div class="pt pt2" /><div class="pt pt3" />
    <div class="pt pt4" /><div class="pt pt5" /><div class="pt pt6" />

    <div class="layout">

      <!-- ══════ LEFT BRAND ══════ -->
      <div class="brand-col d-none d-lg-flex flex-column justify-center">
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
              <VIcon
                :icon="s.icon"
                size="18"
                class="s-icon mb-1"
              />
              <span class="sv">{{ s.value }}</span>
              <span class="sl">{{ s.label }}</span>
            </div>
          </div>
        </div>

        <svg
          class="circ-svg"
          viewBox="0 0 300 600"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M80 0 L80 150 L180 250 L180 410 L270 500 L270 600"
            stroke="rgba(14,165,233,0.1)"
            stroke-width="1.5"
          />
          <path
            d="M220 0 L220 110 L130 210 L130 360 L220 460 L220 600"
            stroke="rgba(34,211,238,0.07)"
            stroke-width="1"
          />
          <path
            d="M80 150 L15 150"
            stroke="rgba(14,165,233,0.08)"
            stroke-width="1"
          />
          <path
            d="M180 250 L260 250"
            stroke="rgba(14,165,233,0.08)"
            stroke-width="1"
          />
          <path
            d="M180 410 L100 410"
            stroke="rgba(14,165,233,0.08)"
            stroke-width="1"
          />
          <circle cx="80"  cy="150" r="4" fill="rgba(56,189,248,0.6)" />
          <circle cx="180" cy="250" r="3" fill="rgba(14,165,233,0.45)" />
          <circle cx="180" cy="410" r="5" fill="rgba(56,189,248,0.6)" />
          <circle cx="270" cy="500" r="3" fill="rgba(14,165,233,0.4)" />
          <circle cx="220" cy="110" r="4" fill="rgba(34,211,238,0.5)" />
          <circle cx="130" cy="210" r="3" fill="rgba(14,165,233,0.35)" />
          <circle cx="130" cy="360" r="4" fill="rgba(34,211,238,0.4)" />
        </svg>
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
            <!-- Emblem orbit (desktop only) -->
            <div class="d-none d-lg-flex justify-center mb-5">
              <div class="emblem-orbit">
                <div class="orbit-spin" />
                <div class="emblem-center d-flex flex-column align-center justify-center">
                  <span class="emblem-mono">IR</span>
                  <span class="emblem-sub-text">IRON</span>
                </div>
              </div>
            </div>

            <h2 class="card-title">Masuk ke Sistem</h2>

            <!-- Professional accounting motto -->
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

          <VForm
            ref="formRef"
            @submit.prevent="handleLogin"
          >
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
              <a
                href="#"
                class="a-forgot"
              >Lupa Kata Sandi?</a>
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
                <VProgressCircular
                  indeterminate
                  size="22"
                  width="2"
                  color="white"
                />
              </template>
              {{ isSubmitting ? 'Memproses...' : 'Masuk ke Sistem' }}
            </VBtn>
            <p class="text-center mt-6 a-contact-row">
              Kendala akses?
              <a
                href="#"
                class="a-contact"
              >Hubungi Administrator</a>
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
            <VIcon
              icon="ri-shield-check-line"
              size="40"
              class="sov-icon"
            />
          </div>
        </div>
        <h2 class="sov-title">
          Otentikasi Berhasil
        </h2>
        <p class="sov-name">
          Selamat datang, {{ employeeDisplayName }}
        </p>
        <p class="sov-status loading-dots">
          {{ processingText }}
        </p>
        <div class="sov-prog mt-6">
          <div class="sov-bar" />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store.js'

const router    = useRouter()
const authStore = useAuthStore()

const formRef        = ref(null)
const showPassword   = ref(false)
const rememberMe     = ref(false)
const errorMessage   = ref('')
const showOverlay    = ref(false)
const isSubmitting   = ref(false)
const processingText = ref('Memverifikasi kredensial...')
const errors = reactive({ username: [], password: [] })
const form   = reactive({ username: '', password: '' })

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
/* ─── TOKENS ─── */
:root {
  --ink:  #020812;
  --bhi:  #38bdf8;
  --blue: #0ea5e9;
  --cyan: #22d3ee;
  --grn:  #10b981;
  --txt:  #f0f9ff;
  --mut:  rgba(240,249,255,0.55);
  --dim:  rgba(240,249,255,0.28);
  --b1:   rgba(14,165,233,0.12);
  --b2:   rgba(14,165,233,0.26);
}

/* ─── ROOT ─── */
.lr-root {
  min-height: 100vh; width: 100%;
  background: #020812;
  position: relative; overflow: hidden;
  font-family: 'Inter', sans-serif;
  color: var(--txt);
}

/* ─── GRID ─── */
.bg-grid {
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background-image:
    linear-gradient(rgba(14,165,233,0.028) 1px, transparent 1px),
    linear-gradient(90deg, rgba(14,165,233,0.028) 1px, transparent 1px);
  background-size: 52px 52px;
}

/* ─── ORBS — radial-gradient, NO filter:blur (perf win) ─── */
.orb {
  position: fixed; border-radius: 50%;
  pointer-events: none; z-index: 0;
}
.orb-a {
  width: 800px; height: 800px;
  top: -250px; left: -220px;
  background: radial-gradient(circle, rgba(14,165,233,0.09) 0%, transparent 65%);
}
.orb-b {
  width: 600px; height: 600px;
  bottom: -150px; right: -150px;
  background: radial-gradient(circle, rgba(34,211,238,0.06) 0%, transparent 65%);
}
.orb-c {
  width: 400px; height: 400px;
  top: 38%; left: 26%;
  background: radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 65%);
}

/* ─── SCAN LINE — single element, transform only (GPU) ─── */
.scan-line {
  position: fixed; left: 0; right: 0; height: 1px; z-index: 3;
  pointer-events: none;
  background: linear-gradient(90deg,
    transparent 0%, rgba(56,189,248,0.25) 25%,
    rgba(56,189,248,0.5) 50%,
    rgba(56,189,248,0.25) 75%, transparent 100%);
  will-change: transform, opacity;
  animation: scan-down 10s linear infinite;
}
@keyframes scan-down {
  0%   { transform: translateY(-4px);   opacity: 0; }
  4%   { opacity: 1; }
  92%  { opacity: 0.5; }
  96%  { opacity: 0; }
  100% { transform: translateY(100vh);  opacity: 0; }
}

/* ─── GHOST WORDS — opacity only (GPU) ─── */
.gw {
  position: fixed; z-index: 0; pointer-events: none; user-select: none;
  font-size: 0.6rem; font-weight: 800; letter-spacing: 0.18em;
  color: rgba(14,165,233,0.045);
  will-change: opacity;
  animation: gw-blink 11s ease-in-out infinite alternate;
}
.gw1 { top: 8%;   left: 4%;   animation-delay: 0s; }
.gw2 { top: 30%;  right: 2%;  animation-delay: -3s; }
.gw3 { top: 56%;  left: 1%;   animation-delay: -6s; }
.gw4 { bottom: 18%; right: 3%; animation-delay: -2s; }
.gw5 { bottom: 6%;  left: 28%; animation-delay: -8s; }
.gw6 { top: 72%;  right: 7%;  animation-delay: -4.5s; }
@keyframes gw-blink {
  0%, 20%   { opacity: 0.3; }
  60%, 100% { opacity: 1; }
}

/* ─── PARTICLES — transform + opacity only (GPU) ─── */
.pt {
  position: fixed; border-radius: 50%; z-index: 0; pointer-events: none;
  background: rgba(56,189,248,0.45);
  will-change: transform, opacity;
  animation: pt-float 16s ease-in-out infinite alternate;
}
.pt1 { width: 4px; height: 4px; top: 13%; left: 22%; animation-delay: 0s; }
.pt2 { width: 3px; height: 3px; top: 28%; left: 72%; animation-delay: -2.5s; }
.pt3 { width: 5px; height: 5px; top: 52%; left: 16%; animation-delay: -5s; }
.pt4 { width: 3px; height: 3px; top: 68%; left: 58%; animation-delay: -7.5s; }
.pt5 { width: 4px; height: 4px; top: 22%; left: 44%; animation-delay: -1.5s; }
.pt6 { width: 2px; height: 2px; top: 78%; left: 32%; animation-delay: -10s; }
@keyframes pt-float {
  from { transform: translate(0, 0);        opacity: 0.3; }
  to   { transform: translate(18px, -22px); opacity: 0.85; }
}

/* ─── LAYOUT ─── */
.layout {
  position: relative; z-index: 1;
  display: flex; min-height: 100vh;
}

/* ─── BRAND COLUMN ─── */
.brand-col {
  flex: 1;
  background: linear-gradient(155deg, #030c1d 0%, #020910 100%);
  border-right: 1px solid rgba(14,165,233,0.07);
  padding: 3rem 3.5rem;
  position: relative; overflow: hidden;
  min-height: 100vh;
}

.brand-inner {
  position: relative; z-index: 5; max-width: 520px;
  will-change: transform, opacity;
  animation: brand-enter 0.8s cubic-bezier(0.34, 1.2, 0.64, 1) both;
}
@keyframes brand-enter {
  from { opacity: 0; transform: translateX(-24px); }
  to   { opacity: 1; transform: translateX(0); }
}

/* Badge */
.sys-badge {
  display: inline-flex; align-items: center; gap: 10px;
  font-size: 0.66rem; font-weight: 700; letter-spacing: 0.14em;
  color: var(--grn);
  background: rgba(16,185,129,0.08);
  border: 1px solid rgba(16,185,129,0.18);
  border-radius: 20px; padding: 5px 16px;
}
.sys-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--grn);
  will-change: transform, opacity;
  animation: dot-pulse 2s ease-in-out infinite;
}
@keyframes dot-pulse {
  0%, 100% { opacity: 1;    transform: scale(1); }
  50%      { opacity: 0.2;  transform: scale(0.7); }
}

/* IRON title — text-shadow on one element = acceptable */
.iron-hero {
  font-size: 5.5rem; font-weight: 900;
  letter-spacing: 0.3em; line-height: 1;
  color: var(--bhi);
  text-shadow:
    0 0 15px rgba(56,189,248,0.9),
    0 0 35px rgba(56,189,248,0.5),
    0 0 70px rgba(56,189,248,0.22);
  animation: iron-pulse 4.5s ease-in-out infinite alternate;
}
@keyframes iron-pulse {
  from { text-shadow: 0 0 15px rgba(56,189,248,0.9), 0 0 35px rgba(56,189,248,0.5),  0 0 70px rgba(56,189,248,0.22); }
  to   { text-shadow: 0 0 22px rgba(56,189,248,1),   0 0 55px rgba(56,189,248,0.72), 0 0 110px rgba(56,189,248,0.4); }
}

.iron-fullname {
  font-size: 0.98rem; font-weight: 400;
  color: var(--mut); line-height: 1.55;
}

/* Separator */
.h-sep { height: 1px; border: none; background: linear-gradient(90deg, var(--bhi), var(--cyan), transparent); opacity: 0.22; }

/* Letter rows */
.letter-stack { display: flex; flex-direction: column; gap: 0.55rem; }
.lrow {
  display: flex; align-items: center; gap: 1.4rem;
  will-change: transform, opacity;
  animation: lrow-in 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) calc(var(--li) * 0.12s) both;
  transition: transform 0.22s ease;
}
.lrow:hover { transform: translateX(6px); }
@keyframes lrow-in {
  from { opacity: 0; transform: translateX(-28px); }
  to   { opacity: 1; transform: translateX(0); }
}
.lc {
  font-size: 3rem; font-weight: 900; line-height: 1;
  min-width: 2.4rem; text-align: center; flex-shrink: 0;
  color: var(--bhi);
  text-shadow: 0 0 16px rgba(56,189,248,0.5);
}
.ld { width: 24px; height: 1px; flex-shrink: 0; background: linear-gradient(90deg, rgba(56,189,248,0.5), transparent); }
.lm { font-size: 1.22rem; line-height: 1.3; color: var(--mut); }
.lm b { font-weight: 700; color: var(--txt); }

/* Stats */
.stat-row { display: flex; gap: 0.85rem; }
.stat-card {
  flex: 1;
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  background: rgba(14,165,233,0.05);
  border: 1px solid rgba(14,165,233,0.1);
  border-radius: 12px; padding: 0.85rem 0.5rem;
  cursor: default;
  will-change: transform;
  animation: stat-in 0.5s cubic-bezier(0.34, 1.2, 0.64, 1) calc(var(--si) * 0.1s + 0.55s) both;
  transition: transform 0.22s ease, border-color 0.22s, box-shadow 0.22s;
}
.stat-card:hover {
  transform: translateY(-5px);
  border-color: rgba(14,165,233,0.3);
  box-shadow: 0 8px 20px rgba(14,165,233,0.1);
}
@keyframes stat-in {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
.s-icon { color: var(--blue) !important; }
.sv { font-size: 1.45rem; font-weight: 800; color: var(--bhi); line-height: 1; letter-spacing: -0.02em; }
.sl { font-size: 0.64rem; color: var(--dim); text-transform: uppercase; letter-spacing: 0.08em; text-align: center; }

/* Circuit SVG */
.circ-svg {
  position: absolute; right: 0; top: 0;
  height: 100%; width: 300px;
  opacity: 0.6; pointer-events: none; z-index: 1;
}

/* ─── FORM COLUMN ─── */
.form-col {
  flex: 0 0 100%; max-width: 100%;
  background: #020812;
  padding: 2rem 1.5rem;
  min-height: 100vh;
}
@media (min-width: 1280px) {
  .form-col { flex: 0 0 500px; max-width: 500px; }
}

/* Glass card */
.glass-card {
  position: relative;
  width: 100%; max-width: 420px;
  background: rgba(3, 13, 28, 0.9);
  border: 1px solid rgba(56,189,248,0.14);
  border-radius: 22px;
  padding: 2.75rem 2.25rem;
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(0,0,0,0.65), 0 0 28px rgba(14,165,233,0.05), inset 0 1px 0 rgba(255,255,255,0.04);
  will-change: transform, opacity;
  animation: card-enter 0.7s cubic-bezier(0.34, 1.2, 0.64, 1) 0.15s both,
             card-glow  5s ease-in-out 1s infinite alternate;
}
@keyframes card-enter {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes card-glow {
  from { border-color: rgba(56,189,248,0.1);  box-shadow: 0 24px 64px rgba(0,0,0,0.65), 0 0 22px rgba(14,165,233,0.04),  inset 0 1px 0 rgba(255,255,255,0.04); }
  to   { border-color: rgba(56,189,248,0.28); box-shadow: 0 24px 64px rgba(0,0,0,0.65), 0 0 48px rgba(14,165,233,0.12), inset 0 1px 0 rgba(255,255,255,0.04); }
}

/* Top shimmer line */
.glass-card::before {
  content: '';
  position: absolute; top: 0; left: 15%; right: 15%; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(56,189,248,0.5), transparent);
}

/* Corner glow — opacity + transform = GPU */
.glass-card::after {
  content: '';
  position: absolute; top: -24px; right: -24px;
  width: 90px; height: 90px; border-radius: 50%;
  background: radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%);
  will-change: transform, opacity;
  animation: corner-pulse 5.5s ease-in-out infinite alternate;
}
@keyframes corner-pulse {
  from { opacity: 0.4; transform: scale(0.8); }
  to   { opacity: 1;   transform: scale(1.4); }
}

/* Mobile brand */
.mob-emblem {
  width: 50px; height: 50px; border-radius: 12px; flex-shrink: 0;
  background: rgba(14,165,233,0.08);
  border: 1px solid var(--b2);
}
.mob-monogram {
  font-size: 1.05rem; font-weight: 900; letter-spacing: 2px;
  color: var(--bhi);
  text-shadow: 0 0 10px rgba(56,189,248,0.6);
}
.mob-iron { font-size: 1.1rem; font-weight: 800; color: var(--bhi); letter-spacing: 3px; }
.mob-sub  { font-size: 0.67rem; color: var(--mut); line-height: 1.45; }

/* Emblem orbit (replaces logo) */
.emblem-orbit {
  position: relative; width: 92px; height: 92px;
  display: flex; align-items: center; justify-content: center;
}
.orbit-spin {
  position: absolute; inset: 0; border-radius: 50%;
  background: conic-gradient(from 0deg, transparent 45%, rgba(56,189,248,0.8) 68%, rgba(34,211,238,0.5) 78%, transparent 82%);
  will-change: transform;
  animation: orbit-rotate 3s linear infinite;
}
@keyframes orbit-rotate { to { transform: rotate(360deg); } }
.emblem-center {
  width: 76px; height: 76px; border-radius: 50%;
  background: rgba(3,13,28,0.98);
  border: 1px solid var(--b2);
  position: relative; z-index: 1;
  gap: 1px;
}
.emblem-mono {
  font-size: 1.5rem; font-weight: 900; letter-spacing: 3px;
  color: var(--bhi); line-height: 1;
  text-shadow: 0 0 14px rgba(56,189,248,0.7);
}
.emblem-sub-text {
  font-size: 0.5rem; font-weight: 700; letter-spacing: 0.18em;
  color: rgba(56,189,248,0.5); text-transform: uppercase;
}

/* Card title & motto */
.card-title {
  font-size: 1.5rem; font-weight: 800; color: var(--txt);
  margin-bottom: 0.6rem;
}
.card-motto {
  display: flex; align-items: center; justify-content: center;
  gap: 0.5rem; margin-bottom: 0.85rem;
}
.motto-pill {
  font-size: 0.68rem; font-weight: 700; letter-spacing: 0.1em;
  color: var(--bhi); text-transform: uppercase;
}
.motto-sep {
  color: rgba(56,189,248,0.35); font-size: 0.75rem;
}
.card-sub {
  font-size: 0.8rem; color: var(--mut); margin: 0;
  line-height: 1.65;
}

/* Inputs */
.fx-field :deep(.v-field) { background-color: rgba(2,10,26,0.8) !important; border-radius: 10px; }
.fx-field :deep(.v-field__outline) { --v-field-border-color: rgba(14,165,233,0.16) !important; }
.fx-field :deep(.v-field--focused .v-field__outline) { --v-field-border-color: rgba(56,189,248,0.55) !important; }
.fx-field :deep(.v-field__input) { color: var(--txt); }
.fx-field :deep(.v-label)        { color: var(--mut); }
.fx-field :deep(.v-icon)         { color: var(--dim); }
.fx-field :deep(.v-field--focused .v-icon) { color: var(--bhi); }
.fx-cb :deep(.v-label) { color: var(--mut); font-size: 0.84rem; }

.a-forgot { font-size: 0.82rem; font-weight: 600; color: var(--bhi); text-decoration: none; opacity: 0.8; transition: opacity 0.2s; }
.a-forgot:hover { opacity: 1; }

/* Login button — shimmer uses transform (GPU) */
.fx-btn {
  background: linear-gradient(135deg, #0369a1 0%, #0ea5e9 50%, #22d3ee 100%) !important;
  color: #fff !important; font-weight: 700 !important; font-size: 0.97rem !important;
  letter-spacing: 0.04em; border-radius: 10px !important;
  position: relative; overflow: hidden;
  box-shadow: 0 4px 22px rgba(14,165,233,0.38) !important;
  transition: transform 0.15s ease, box-shadow 0.22s ease !important;
}
.fx-btn::after {
  content: '';
  position: absolute; top: 0; left: 0;
  width: 50%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
  will-change: transform;
  animation: btn-shimmer 4s ease-in-out infinite;
}
@keyframes btn-shimmer {
  0%,  30% { transform: translateX(-200%); }
  70%, 100% { transform: translateX(400%); }
}
.fx-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(14,165,233,0.55) !important;
}

.a-contact-row { font-size: 0.82rem; color: var(--dim); }
.a-contact { font-weight: 600; color: var(--bhi); text-decoration: none; transition: color 0.2s; }
.a-contact:hover { color: var(--cyan); }

/* ─── SUCCESS OVERLAY ─── */
.sov {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(2,8,18,0.94);
  backdrop-filter: blur(14px);
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease; }
.fade-enter-from,  .fade-leave-to      { opacity: 0; }

.sov-wrap {
  position: relative; width: 104px; height: 104px;
  display: flex; align-items: center; justify-content: center;
}
.sov-ring {
  position: absolute; inset: 0; border-radius: 50%;
  background: conic-gradient(from 0deg, transparent 38%, rgba(56,189,248,0.75) 65%, transparent 70%);
  will-change: transform;
  animation: orbit-rotate 1.5s linear infinite;
  filter: blur(3px);
}
.sov-box {
  width: 78px; height: 78px; border-radius: 50%;
  background: rgba(3,13,28,0.98);
  border: 1px solid var(--b2);
  position: relative; z-index: 1;
  overflow: hidden;
}
.sov-icon { color: var(--bhi) !important; filter: drop-shadow(0 0 10px rgba(56,189,248,0.7)); }
.sov-title  { font-size: 1.35rem; font-weight: 800; color: var(--txt); margin-bottom: 0.3rem; }
.sov-name   { color: var(--bhi); font-size: 0.95rem; font-weight: 500; margin-bottom: 0.2rem; }
.sov-status { color: var(--mut); font-size: 0.82rem; }

.sov-prog { width: 260px; height: 3px; background: rgba(14,165,233,0.1); border-radius: 4px; overflow: hidden; }
.sov-bar  {
  height: 100%; background: linear-gradient(90deg, var(--blue), var(--cyan));
  border-radius: 4px;
  animation: prog-fill 2.8s cubic-bezier(0.4,0,0.2,1) forwards;
}
@keyframes prog-fill { 0%{width:0%} 30%{width:40%} 65%{width:72%} 100%{width:100%} }

.loading-dots::after { content: ''; animation: dots 1.5s steps(4,end) infinite; }
@keyframes dots { 0%,20%{content:''} 40%{content:'.'} 60%{content:'..'} 80%,100%{content:'...'} }
</style>
