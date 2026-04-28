<template>
  <div class="auth-wrapper d-flex">
    <div class="auth-illustration-col d-none d-md-flex align-center justify-center">
      <div class="bg-ambient ambient-primary" />
      <div class="bg-ambient ambient-info" />

      <div class="particle p-1" />
      <div class="particle p-2" />
      <div class="particle p-3" />
      <div class="particle p-4" />
      <div class="particle p-5" />

      <div class="hero-text-wrapper">
        <div class="d-flex align-center gap-3 mb-2">
          <div class="text-overline font-weight-bold text-primary tracking-wide">
            SYSTEM OVERVIEW
          </div>
          <div class="live-indicator">
            <span class="dot pulse-dot" /> LIVE
          </div>
        </div>
        <h1 class="brand-acronym text-white font-weight-black mb-1">
          I.R.O.N
        </h1>
        <h2 class="brand-fullname text-white font-weight-medium mb-4">
          <span class="text-primary">Integrated</span> Reporting<br>Operation Network
        </h2>
        <div class="brand-divider mb-4" />
        <p
          class="text-secondary text-body-2"
          style="max-width: 380px; line-height: 1.6;"
        >
          Infrastruktur pelaporan presisi tinggi untuk memantau, menganalisis, dan mengoptimalkan aliran data enterprise Anda secara real-time.
        </p>
      </div>

      <div class="pulse-ring ring-1" />
      <div class="pulse-ring ring-2" />
      <div class="pulse-ring ring-3" />

      <div class="network-core">
        <div class="core-glow" />
        <div class="core-orbit orbit-x" />
        <div class="core-orbit orbit-y" />
        <div class="core-icon-box">
          <VIcon
            icon="ri-node-tree"
            size="48"
            color="white"
          />
        </div>
      </div>

      <div class="stat-card card-top-right">
        <div class="d-flex align-center">
          <div class="icon-avatar bg-light-primary mr-3">
            <VIcon
              icon="ri-user-add-line"
              size="22"
              color="#666cff"
            />
          </div>
          <div>
            <div class="text-h6 font-weight-semibold text-white d-flex align-center gap-2">
              2,856 
              <span class="text-error text-caption font-weight-medium">▼ 8.1%</span>
            </div>
            <div class="text-caption text-secondary">
              Pengguna Baru
            </div>
          </div>
        </div>
      </div>

      <div class="stat-card card-bottom-left">
        <div class="d-flex justify-space-between align-start mb-2">
          <div class="icon-avatar bg-light-info">
            <VIcon
              icon="ri-bar-chart-box-line"
              size="22"
              color="#26c6da"
            />
          </div>
          <div class="text-success text-caption font-weight-medium">
            +22% ▲
          </div>
        </div>
        <div class="text-h5 font-weight-semibold text-white mt-3">
          155k
        </div>
        <div class="text-caption text-secondary mb-3">
          Total Laporan
        </div>
        <VChip
          size="small"
          color="secondary"
          variant="tonal"
          class="rounded-pill px-3"
        >
          Kuartal Terakhir
        </VChip>
      </div>

      <div class="stat-card card-bottom-right pa-4">
        <div class="d-flex justify-space-between align-start mb-2">
          <div>
            <div class="text-h6 font-weight-semibold text-white">
              Rp 38.5M
            </div>
            <div class="text-caption text-secondary">
              Arus Kas
            </div>
          </div>
          <div class="text-success text-caption font-weight-medium">
            +62%
          </div>
        </div>
        <svg
          viewBox="0 0 100 30"
          class="sparkline-chart mt-2"
        >
          <path
            d="M0 25 L20 15 L40 20 L60 5 L80 15 L100 0"
            fill="none"
            stroke="#666cff"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
    </div>

    <div class="auth-card-col d-flex align-center justify-center">
      <VCard
        class="auth-card pa-8 pa-sm-10"
        flat
        color="transparent"
      >
        <div class="mb-8">
          <h4 class="text-h5 font-weight-semibold mb-2 text-white d-flex align-center">
            Selamat Datang di I.R.O.N! <span class="wave-emoji ml-2">👋</span>
          </h4>
          <p class="text-body-2 text-secondary">
            Silakan masuk menggunakan kredensial Anda untuk memulai sesi kerja yang produktif.
          </p>
        </div>

        <VForm
          ref="formRef"
          @submit.prevent="handleLogin"
        >
          <div class="mb-5">
            <VTextField
              v-model="form.username"
              label="Username"
              placeholder="Masukkan Username Anda"
              variant="outlined"
              density="comfortable"
              :rules="[v => !!v || 'Username tidak boleh kosong']"
              :error-messages="errors.username"
              class="custom-input"
            />
          </div>

          <div class="mb-3">
            <VTextField
              v-model="form.password"
              label="Kata Sandi"
              placeholder="············"
              variant="outlined"
              density="comfortable"
              :type="showPassword ? 'text' : 'password'"
              :append-inner-icon="showPassword ? 'ri-eye-off-line' : 'ri-eye-line'"
              :rules="[v => !!v || 'Kata sandi tidak boleh kosong']"
              :error-messages="errors.password"
              class="custom-input"
              @click:append-inner="showPassword = !showPassword"
            />
          </div>

          <div class="d-flex align-center justify-space-between mb-6 mt-1">
            <VCheckbox 
              v-model="rememberMe" 
              label="Ingat Sesi" 
              hide-details 
              density="compact" 
              color="primary"
            />
            <a
              href="#"
              class="text-primary text-caption text-decoration-none font-weight-medium"
            >
              Lupa sandi?
            </a>
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
            color="#666cff"
            size="large"
            :loading="isSubmitting"
            :disabled="isSubmitting"
            class="font-weight-medium text-white text-none mt-2"
            elevation="2"
          >
            <template #loader>
              <VProgressCircular
                indeterminate
                size="22"
                width="2"
                color="white"
              />
            </template>
            {{ isSubmitting ? 'Memproses...' : 'Masuk Sistem' }}
          </VBtn>
          
          <div class="text-center mt-6 text-body-2">
            <span class="text-secondary">Kendala akses platform? </span>
            <a
              href="#"
              class="text-primary text-decoration-none font-weight-medium"
            >
              Hubungi Administrator
            </a>
          </div>
        </VForm>
      </VCard>
    </div>
  </div>

  <Transition name="fade">
    <div
      v-if="showOverlay"
      class="glass-overlay d-flex flex-column align-center justify-center"
    >
      <div class="loader-core position-relative text-center mb-4">
        <div class="glow-spin" />
        <div class="logo-box-loader mx-auto d-flex align-center justify-center bg-surface">
          <img
            :src="ironLogo"
            alt="IRON Logo"
            class="brand-logo-loader"
            draggable="false"
          >
        </div>
      </div>
      <div
        class="text-center"
        style="z-index: 10;"
      >
        <h2 class="text-h5 font-weight-bold mb-2 text-white">
          Otentikasi Berhasil
        </h2>
        <p class="overlay-employee-name mb-1">
          Selamat datang, {{ employeeDisplayName }}
        </p>
        <p class="text-secondary text-caption loading-dots">
          {{ processingText }}
        </p>
      </div>
      <div class="cyber-progress mt-6">
        <div class="cyber-progress-bar" />
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed, ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store.js'

const router = useRouter()
const authStore = useAuthStore()

const formRef = ref(null)
const showPassword = ref(false)
const rememberMe = ref(false)
const errorMessage = ref('')
const showOverlay = ref(false)
const isSubmitting = ref(false)
const processingText = ref('Memverifikasi kredensial...')
const errors = reactive({ username: [], password: [] })

const form = reactive({ username: '', password: '' })
const ironLogo = '/images/iron/IRON%20(1).png'

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
    
    setTimeout(() => {
      router.push({ name: 'dashboard' })
    }, 2800)
    
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
:root {
  --bg-main: #28243D;
  --bg-surface: #312D4B;
  --primary-color: #666CFF;
  --text-primary: rgba(231, 227, 252, 0.87);
  --text-secondary: rgba(231, 227, 252, 0.68);
  --border-color: rgba(231, 227, 252, 0.22);
}

.text-secondary { color: var(--text-secondary) !important; }
.text-primary { color: var(--primary-color) !important; }
.bg-surface { background-color: var(--bg-surface) !important; }
.tracking-wide { letter-spacing: 0.1em; }
.gap-3 { gap: 0.75rem; }

/* ================= UTILITY & LAYOUT ================= */
.auth-wrapper {
  width: 100%;
  min-height: 100vh;
  background-color: var(--bg-main);
  color: var(--text-primary);
  font-family: 'Inter', sans-serif;
}

.auth-illustration-col {
  flex: 1;
  position: relative;
  background-color: var(--bg-main);
  overflow: hidden;
}

.auth-card-col {
  flex: 0 0 100%;
  max-width: 100%;
  background-color: var(--bg-surface);
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.1);
}
@media (min-width: 960px) {
  .auth-card-col {
    flex: 0 0 450px;
    max-width: 450px;
  }
}

.auth-card {
  width: 100%;
  max-width: 400px;
}

.wave-emoji {
  display: inline-block;
  animation: wave 2.5s infinite;
  transform-origin: 70% 70%;
}
@keyframes wave {
  0% { transform: rotate(0deg); }
  10% { transform: rotate(14deg); }
  20% { transform: rotate(-8deg); }
  30% { transform: rotate(14deg); }
  40% { transform: rotate(-4deg); }
  50% { transform: rotate(10deg); }
  60%, 100% { transform: rotate(0deg); }
}

/* ================= TEKS ELEGAN (HERO TEXT) ================= */
.hero-text-wrapper {
  position: absolute;
  top: 15%;
  left: 8%;
  z-index: 15;
  animation: fade-in-right 1s ease-out;
}

.brand-acronym {
  font-size: 3.5rem;
  letter-spacing: 2px;
  text-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

.brand-fullname {
  font-size: 1.5rem;
  line-height: 1.3;
}

.brand-divider {
  width: 60px;
  height: 4px;
  background: linear-gradient(90deg, #666cff, #26c6da);
  border-radius: 2px;
}

.live-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: bold;
  color: #26c6da;
  background: rgba(38, 198, 218, 0.1);
  padding: 4px 8px;
  border-radius: 12px;
  border: 1px solid rgba(38, 198, 218, 0.2);
}

.pulse-dot {
  width: 6px; height: 6px;
  background-color: #26c6da;
  border-radius: 50%;
  box-shadow: 0 0 8px #26c6da;
  animation: blink 1.5s infinite ease-in-out;
}

@keyframes blink {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.8); }
}
@keyframes fade-in-right {
  0% { opacity: 0; transform: translateX(-20px); }
  100% { opacity: 1; transform: translateX(0); }
}

/* ================= EFEK ANIMASI BACKGROUND ================= */

/* 1. Ambient Background (Cahaya Pendar) */
.bg-ambient {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.15;
  z-index: 0;
  animation: float-ambient 12s infinite alternate ease-in-out;
}
.ambient-primary { width: 400px; height: 400px; background: #666cff; top: -10%; left: -10%; }
.ambient-info { width: 350px; height: 350px; background: #26c6da; bottom: 0%; right: 10%; animation-delay: -6s; }

@keyframes float-ambient {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(50px, 40px) scale(1.1); }
}

/* 2. Network Pulse Rings (Gelombang Tengah) */
.pulse-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 1px solid rgba(102, 108, 255, 0.25);
  z-index: 1;
  animation: pulse-out 6s linear infinite;
}
.ring-1 { width: 250px; height: 250px; animation-delay: 0s; }
.ring-2 { width: 250px; height: 250px; animation-delay: -2s; }
.ring-3 { width: 250px; height: 250px; animation-delay: -4s; }

@keyframes pulse-out {
  0% { width: 250px; height: 250px; opacity: 0.8; border-width: 2px; }
  100% { width: 800px; height: 800px; opacity: 0; border-width: 1px; }
}

/* 3. Floating Particles (Partikel Data Abstrak) */
.particle {
  position: absolute;
  border-radius: 50%;
  background: rgba(231, 227, 252, 0.4);
  box-shadow: 0 0 8px rgba(231, 227, 252, 0.3);
  z-index: 2;
  animation: float-random 10s infinite alternate ease-in-out;
}
.p-1 { width: 8px; height: 8px; top: 25%; left: 45%; animation-delay: 0s; }
.p-2 { width: 5px; height: 5px; top: 65%; left: 30%; animation-delay: -2s; }
.p-3 { width: 10px; height: 10px; bottom: 25%; right: 35%; animation-delay: -4s; }
.p-4 { width: 6px; height: 6px; top: 30%; right: 25%; animation-delay: -6s; }
.p-5 { width: 4px; height: 4px; bottom: 45%; left: 50%; animation-delay: -8s; }

@keyframes float-random {
  0% { transform: translate(0, 0) scale(1); opacity: 0.2; }
  100% { transform: translate(30px, -30px) scale(1.5); opacity: 0.6; }
}

/* ================= NETWORK CORE (CENTERPIECE) ================= */
.network-core {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  z-index: 5;
  width: 120px; height: 120px;
  display: flex; justify-content: center; align-items: center;
}

.core-glow {
  position: absolute;
  width: 80px; height: 80px;
  background: radial-gradient(circle, rgba(102,108,255,0.8) 0%, rgba(38,198,218,0.2) 70%, transparent 100%);
  border-radius: 50%;
  filter: blur(10px);
  animation: pulse-glow 3s infinite alternate;
}

.core-orbit {
  position: absolute;
  width: 140px; height: 140px;
  border: 1px dashed rgba(231, 227, 252, 0.3);
  border-radius: 50%;
}
.orbit-x { animation: spin-orbit 8s linear infinite; transform: rotateX(75deg); }
.orbit-y { animation: spin-orbit-reverse 12s linear infinite; transform: rotateY(75deg); border-color: rgba(38, 198, 218, 0.4); }

.core-icon-box {
  position: relative;
  z-index: 10;
  width: 70px; height: 70px;
  background: rgba(49, 45, 75, 0.8);
  border: 1px solid rgba(102, 108, 255, 0.5);
  border-radius: 16px;
  display: flex; justify-content: center; align-items: center;
  box-shadow: 0 0 20px rgba(102, 108, 255, 0.4);
  transform: rotate(45deg);
  animation: float-y 5s infinite ease-in-out alternate;
}
.core-icon-box .v-icon {
  transform: rotate(-45deg); /* Mengembalikan rotasi ikon agar tegak */
}

@keyframes pulse-glow {
  0% { transform: scale(0.8); opacity: 0.5; }
  100% { transform: scale(1.2); opacity: 1; }
}
@keyframes spin-orbit {
  0% { transform: rotateX(75deg) rotateZ(0deg); }
  100% { transform: rotateX(75deg) rotateZ(360deg); }
}
@keyframes spin-orbit-reverse {
  0% { transform: rotateY(75deg) rotateZ(360deg); }
  100% { transform: rotateY(75deg) rotateZ(0deg); }
}

/* ================= KARTU DATA (STAT CARDS) ================= */
.stat-card {
  position: absolute;
  background: var(--bg-surface);
  padding: 1.25rem;
  border-radius: 10px;
  box-shadow: 0 4px 14px 0 rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(231, 227, 252, 0.08);
  z-index: 10;
  animation: float-y 7s infinite ease-in-out;
}

.card-top-right { top: 15%; right: 10%; animation-delay: 0s; min-width: 220px; }
.card-bottom-left { bottom: 12%; left: 8%; animation-delay: -2s; min-width: 190px; }
.card-bottom-right { bottom: 15%; right: 15%; animation-delay: -4s; width: 240px; }

@keyframes float-y {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

.icon-avatar {
  width: 40px; 
  height: 40px;
  border-radius: 8px;
  display: flex; 
  align-items: center; 
  justify-content: center;
}
.bg-light-primary { background: rgba(102, 108, 255, 0.16); }
.bg-light-info { background: rgba(38, 198, 218, 0.16); }

.sparkline-chart {
  width: 100%; 
  height: 40px;
  filter: drop-shadow(0 4px 6px rgba(102, 108, 255, 0.3));
}

/* ================= FORM INPUTS ================= */
.custom-input :deep(.v-field) {
  border-radius: 6px;
  background-color: transparent !important;
}
.custom-input :deep(.v-field__outline) {
  --v-field-border-color: rgba(231, 227, 252, 0.22);
}
.custom-input :deep(.v-field--focused .v-field__outline) {
  --v-field-border-color: var(--primary-color) !important;
}
.custom-input :deep(.v-field__input) { color: var(--text-primary); }
.custom-input :deep(.v-label) { color: var(--text-secondary); }

:deep(.v-selection-control__input input:checked + .v-icon) {
  color: var(--primary-color) !important;
}

/* ================= OVERLAY LOADER ================= */
.glass-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(40, 36, 61, 0.9);
  backdrop-filter: blur(8px);
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.glow-spin {
  position: absolute;
  top: 50%; left: 50%;
  width: 120px; height: 120px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: conic-gradient(from 0deg, transparent 0%, #666cff 25%, #26c6da 50%, transparent 50%);
  animation: spin 1.5s linear infinite;
  filter: blur(8px);
  z-index: 0;
}

@keyframes spin {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

.logo-box-loader {
  position: relative;
  width: 90px; height: 90px;
  border-radius: 50%;
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  z-index: 1;
  overflow: hidden;
}

.brand-logo-loader {
  width: 60px;
  height: 60px;
  object-fit: contain;
}

.overlay-employee-name {
  color: #8c90ff;
  font-size: 1rem;
  font-weight: 500;
}

.loading-dots::after { content: ''; animation: dots 1.5s steps(4, end) infinite; }
@keyframes dots {
  0%, 20% { content: ''; } 40% { content: '.'; } 60% { content: '..'; } 80%, 100% { content: '...'; }
}

.cyber-progress {
  width: 250px; height: 4px;
  background: rgba(231, 227, 252, 0.1);
  border-radius: 4px; position: relative; overflow: hidden;
}
.cyber-progress-bar {
  width: 0%; height: 100%;
  background: var(--primary-color);
  border-radius: 4px;
  animation: fill-bar 2.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
@keyframes fill-bar {
  0% { width: 0%; } 30% { width: 45%; } 60% { width: 75%; } 100% { width: 100%; }
}
</style>