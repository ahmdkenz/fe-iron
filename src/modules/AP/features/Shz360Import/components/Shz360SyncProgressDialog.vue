<template>
  <VDialog
    v-model="isOpen"
    max-width="440"
    persistent
  >
    <VCard
      rounded="xl"
      class="sync-dialog-card pa-6 text-center"
    >
      <VChip
        v-if="isOpen"
        size="x-small"
        variant="tonal"
        color="secondary"
        class="sync-timer-chip"
      >
        <VIcon
          icon="ri-time-line"
          size="12"
          start
        />{{ elapsedLabel }}
      </VChip>

      <div class="sync-icon-wrap mb-4">
        <div class="sync-icon-ring" />
        <div class="sync-icon-ring sync-icon-ring-delay" />
        <VAvatar
          size="64"
          :color="phase === 'done' ? 'success' : 'primary'"
          variant="flat"
          class="sync-icon-avatar"
        >
          <VIcon
            :icon="phase === 'done' ? 'ri-checkbox-circle-line' : headerIcon"
            size="30"
            :class="{ 'sync-icon-spin': phase !== 'done' }"
          />
        </VAvatar>
      </div>

      <h3 class="text-h6 font-weight-bold mb-1">
        {{ title }}
      </h3>

      <Transition
        name="sync-fade"
        mode="out-in"
      >
        <p
          :key="phase"
          class="text-body-2 text-medium-emphasis mb-1"
        >
          {{ phaseLabelMap[phase] }}
        </p>
      </Transition>
      <Transition
        name="sync-fade"
        mode="out-in"
      >
        <p
          :key="tipIndex"
          class="text-caption text-disabled mb-5"
        >
          {{ tips[tipIndex] }}
        </p>
      </Transition>

      <div class="step-tracker mb-5">
        <div class="step-track">
          <div
            class="step-track-fill"
            :style="{ width: `${trackFillPct}%` }"
          />
        </div>
        <div class="step-nodes">
          <div
            v-for="(step, idx) in steps"
            :key="step.key"
            class="step-node"
            :class="stepStatus(idx)"
          >
            <div class="step-node-circle">
              <VIcon
                v-if="stepStatus(idx) === 'done'"
                icon="ri-check-line"
                size="14"
              />
              <VProgressCircular
                v-else-if="stepStatus(idx) === 'active'"
                indeterminate
                size="14"
                width="2"
                color="white"
              />
              <VIcon
                v-else
                :icon="step.icon"
                size="12"
              />
            </div>
            <span class="step-node-label">{{ step.label }}</span>
          </div>
        </div>
      </div>

      <div
        v-if="showPo"
        class="sync-progress-row mb-3"
      >
        <div class="d-flex align-center justify-space-between mb-1">
          <span class="text-caption font-weight-medium d-flex align-center ga-1">
            <VIcon
              icon="ri-file-list-3-line"
              size="14"
              color="primary"
            /> Purchase Order
          </span>
          <span
            class="text-caption font-weight-bold sync-count"
            :class="{ 'sync-count-pulse': poPulse }"
          >
            {{ progress.po_upserted }}/{{ progress.po_fetched }}
          </span>
        </div>
        <VProgressLinear
          :model-value="poPct"
          color="primary"
          height="8"
          rounded
          class="sync-progress-bar"
        />
      </div>

      <div
        v-if="showReceipt"
        class="sync-progress-row mb-1"
      >
        <div class="d-flex align-center justify-space-between mb-1">
          <span class="text-caption font-weight-medium d-flex align-center ga-1">
            <VIcon
              icon="ri-truck-line"
              size="14"
              color="success"
            /> Terima PO
          </span>
          <span
            class="text-caption font-weight-bold sync-count"
            :class="{ 'sync-count-pulse': receiptPulse }"
          >
            {{ progress.receipt_upserted }}/{{ progress.receipt_fetched }}
          </span>
        </div>
        <VProgressLinear
          :model-value="receiptPct"
          color="success"
          height="8"
          rounded
          class="sync-progress-bar"
        />
      </div>

      <p class="text-caption text-disabled mt-4 mb-0 d-flex align-center justify-center ga-1">
        <VIcon
          icon="ri-shield-check-line"
          size="12"
        /> Proses berjalan di server — jangan tutup tab ini.
      </p>
    </VCard>
  </VDialog>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  mode: { type: String, default: 'retry' }, // 'retry' | 'full-resync'
  progress: {
    type: Object,
    default: () => ({ status: 'sending', po_fetched: 0, po_upserted: 0, receipt_fetched: 0, receipt_upserted: 0 }),
  },
})

const isOpen = defineModel({ type: Boolean, default: false })

const titleMap = {
  retry: 'Sinkronisasi SHZ360',
  'full-resync': 'Full Resync SHZ360',
}

const iconMap = {
  retry: 'ri-refresh-line',
  'full-resync': 'ri-history-line',
}

const title = computed(() => titleMap[props.mode] ?? titleMap.retry)
const headerIcon = computed(() => iconMap[props.mode] ?? iconMap.retry)

const steps = [
  { key: 'send', label: 'Kirim', icon: 'ri-send-plane-line' },
  { key: 'po', label: 'Data PO', icon: 'ri-file-list-3-line' },
  { key: 'receipt', label: 'Terima PO', icon: 'ri-truck-line' },
  { key: 'done', label: 'Selesai', icon: 'ri-checkbox-circle-line' },
]

const phase = computed(() => {
  const p = props.progress
  if (['success', 'partial_success', 'failed'].includes(p.status)) return 'done'
  if (p.status === 'sending') return 'sending'
  if (p.po_fetched === 0 && p.receipt_fetched === 0) return 'connecting'
  if (p.po_fetched > 0 && p.po_upserted < p.po_fetched) return 'po'
  if (p.po_upserted >= p.po_fetched && p.po_fetched > 0 && p.receipt_fetched === 0) return 'awaiting-receipt'
  if (p.receipt_fetched > 0 && p.receipt_upserted < p.receipt_fetched) return 'receipt'
  
  return 'finishing'
})

const phaseLabelMap = {
  sending: 'Mengirim permintaan sync...',
  connecting: 'Menghubungkan ke SHZ360...',
  po: 'Mengambil data Purchase Order...',
  'awaiting-receipt': 'Purchase Order selesai, mengambil Terima PO...',
  receipt: 'Mengambil data Terima PO...',
  finishing: 'Menyelesaikan proses...',
  done: 'Sinkronisasi selesai',
}

const stepIndex = computed(() => {
  switch (phase.value) {
  case 'sending':
  case 'connecting': return 0
  case 'po': return 1
  case 'awaiting-receipt':
  case 'receipt': return 2
  case 'finishing': return 3
  case 'done': return 4
  default: return 0
  }
})

function stepStatus(idx) {
  if (idx < stepIndex.value) return 'done'
  if (idx === stepIndex.value) return 'active'
  
  return 'pending'
}

const trackFillPct = computed(() => (Math.min(stepIndex.value, 3) / 3) * 100)

const poPct = computed(() => (props.progress.po_fetched > 0
  ? Math.min(100, (props.progress.po_upserted / props.progress.po_fetched) * 100)
  : 0))

const receiptPct = computed(() => (props.progress.receipt_fetched > 0
  ? Math.min(100, (props.progress.receipt_upserted / props.progress.receipt_fetched) * 100)
  : 0))

const showPo = computed(() => props.progress.po_fetched > 0 || stepIndex.value >= 1)
const showReceipt = computed(() => props.progress.receipt_fetched > 0 || stepIndex.value >= 2)

// ─── Tips berganti & timer berjalan — aktif hanya selagi dialog terbuka ──────
const tips = [
  'Kamu tidak perlu me-refresh halaman ini.',
  'Baris yang gagal diproses dicatat sebagai error, bukan menggagalkan seluruh sync.',
  'Untuk data besar, proses ini bisa memakan waktu beberapa menit.',
  'Sinkronisasi berjalan di background worker server.',
]

const tipIndex = ref(0)
const elapsedSeconds = ref(0)
let tipTimer = null
let elapsedTimer = null

const elapsedLabel = computed(() => {
  const m = Math.floor(elapsedSeconds.value / 60)
  const s = elapsedSeconds.value % 60
  
  return `${m}:${String(s).padStart(2, '0')}`
})

function startTimers() {
  elapsedSeconds.value = 0
  tipIndex.value = 0
  elapsedTimer = setInterval(() => { elapsedSeconds.value++ }, 1000)
  tipTimer = setInterval(() => { tipIndex.value = (tipIndex.value + 1) % tips.length }, 4000)
}

function stopTimers() {
  clearInterval(elapsedTimer)
  clearInterval(tipTimer)
  elapsedTimer = null
  tipTimer = null
}

watch(isOpen, val => (val ? startTimers() : stopTimers()))
onBeforeUnmount(stopTimers)

// ─── Efek pulse tiap angka bertambah ─────────────────────────────────────────
const poPulse = ref(false)
const receiptPulse = ref(false)
let poPulseTimer = null
let receiptPulseTimer = null

watch(() => props.progress.po_upserted, () => {
  poPulse.value = true
  clearTimeout(poPulseTimer)
  poPulseTimer = setTimeout(() => { poPulse.value = false }, 350)
})
watch(() => props.progress.receipt_upserted, () => {
  receiptPulse.value = true
  clearTimeout(receiptPulseTimer)
  receiptPulseTimer = setTimeout(() => { receiptPulse.value = false }, 350)
})
</script>

<style scoped>
.sync-dialog-card {
  position: relative;
  overflow: hidden;
}

.sync-dialog-card::before {
  position: absolute;
  inset: -15% -15% auto;
  height: 12rem;
  content: '';
  background: radial-gradient(circle at top, rgba(var(--v-theme-primary), 0.22), transparent 70%);
  animation: sync-blob-pulse 4s ease-in-out infinite;
  pointer-events: none;
}

@keyframes sync-blob-pulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.08); }
}

.sync-timer-chip {
  position: absolute;
  inset-block-start: 16px;
  inset-inline-end: 16px;
}

.sync-icon-wrap {
  position: relative;
  z-index: 1;
  inline-size: 64px;
  block-size: 64px;
  margin-inline: auto;
}

.sync-icon-ring {
  position: absolute;
  inset: 0;
  border: 2px solid rgb(var(--v-theme-primary));
  border-radius: 50%;
  opacity: 0;
  animation: sync-pulse-ring 2s cubic-bezier(0.2, 0.6, 0.4, 1) infinite;
}

.sync-icon-ring-delay {
  animation-delay: 1s;
}

@keyframes sync-pulse-ring {
  0% { opacity: 0.55; transform: scale(0.9); }
  100% { opacity: 0; transform: scale(1.9); }
}

.sync-icon-avatar {
  position: relative;
  z-index: 1;
  box-shadow: 0 10px 28px rgba(var(--v-theme-primary), 0.35);
}

.sync-icon-spin {
  animation: sync-spin 1.6s linear infinite;
}

@keyframes sync-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.sync-fade-enter-active,
.sync-fade-leave-active {
  transition: opacity 0.3s ease;
}

.sync-fade-enter-from,
.sync-fade-leave-to {
  opacity: 0;
}

.step-tracker {
  position: relative;
  z-index: 1;
}

.step-track {
  position: absolute;
  inset-inline: 14%;
  block-size: 2px;
  background: rgba(var(--v-theme-on-surface), 0.12);
  inset-block-start: 14px;
}

.step-track-fill {
  block-size: 100%;
  background: rgb(var(--v-theme-primary));
  transition: width 0.5s ease;
}

.step-nodes {
  position: relative;
  display: flex;
  justify-content: space-between;
}

.step-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  inline-size: 25%;
  gap: 6px;
}

.step-node-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  inline-size: 28px;
  block-size: 28px;
  border: 2px solid rgba(var(--v-theme-on-surface), 0.18);
  border-radius: 50%;
  background: rgb(var(--v-theme-surface));
  color: rgba(var(--v-theme-on-surface), 0.5);
  transition: background 0.3s ease, border-color 0.3s ease, color 0.3s ease;
}

.step-node.active .step-node-circle {
  border-color: rgb(var(--v-theme-primary));
  background: rgb(var(--v-theme-primary));
  color: #fff;
}

.step-node.done .step-node-circle {
  border-color: rgb(var(--v-theme-success));
  background: rgb(var(--v-theme-success));
  color: #fff;
}

.step-node-label {
  font-size: 0.68rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  text-align: center;
  white-space: nowrap;
}

.sync-count {
  display: inline-block;
  transition: transform 0.2s ease, color 0.2s ease;
}

.sync-count-pulse {
  color: rgb(var(--v-theme-primary));
  transform: scale(1.18);
}

.sync-progress-bar :deep(.v-progress-linear__determinate) {
  background-image: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.28) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.28) 50%,
    rgba(255, 255, 255, 0.28) 75%,
    transparent 75%,
    transparent
  );
  background-size: 1rem 1rem;
  animation: sync-stripes 1s linear infinite;
}

@keyframes sync-stripes {
  from { background-position: 1rem 0; }
  to { background-position: 0 0; }
}
</style>
