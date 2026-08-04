<template>
  <VCard class="mb-4">
    <VCardText>
      <div class="d-flex flex-wrap align-center justify-space-between gap-2 mb-3">
        <div class="min-width-0">
          <div class="text-body-1 font-weight-medium text-truncate">
            Progress Rekonsiliasi
          </div>
          <div class="text-caption text-medium-emphasis progress-card__period">
            {{ periodeLabel }}
          </div>
        </div>
        <div class="text-end flex-shrink-0">
          <div class="text-h5 font-weight-bold">
            {{ percentLabel }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ matched }} dari {{ total }}
          </div>
        </div>
      </div>

      <div class="progress-segmented mb-3">
        <div
          v-if="matched"
          class="progress-segmented__seg bg-success"
          :style="{ width: pct(matched) }"
        />
        <div
          v-if="unmatched"
          class="progress-segmented__seg bg-warning"
          :style="{ width: pct(unmatched) }"
        />
        <div
          v-if="lainnya"
          class="progress-segmented__seg bg-grey"
          :style="{ width: pct(lainnya) }"
        />
      </div>

      <div class="d-flex flex-wrap gap-4">
        <div class="d-flex align-center gap-2">
          <span class="legend-dot bg-success" />
          <span class="text-caption">{{ matched }} Cocok ({{ pct(matched) }})</span>
        </div>
        <div class="d-flex align-center gap-2">
          <span class="legend-dot bg-warning" />
          <span class="text-caption">{{ unmatched }} Belum Cocok ({{ pct(unmatched) }})</span>
        </div>
        <div class="d-flex align-center gap-2">
          <span class="legend-dot bg-grey" />
          <span class="text-caption">{{ lainnya }} Lainnya ({{ pct(lainnya) }})</span>
        </div>
      </div>
    </VCardText>
  </VCard>
</template>

<script setup>
import { computed } from 'vue'
import { useFormatter } from '@/composables/useFormatter'

const props = defineProps({
  report: { type: Object, default: () => ({}) },
})

const { formatDate } = useFormatter()

const total     = computed(() => props.report?.total_transaksi ?? 0)
const matched   = computed(() => props.report?.jumlah_matched ?? 0)
const unmatched = computed(() => props.report?.jumlah_unmatched ?? 0)
const lainnya   = computed(() => Math.max(0, total.value - matched.value - unmatched.value))

const periodeLabel = computed(() => {
  const r = props.report
  if (!r?.periode_awal) return ''

  return `${formatDate(r.periode_awal)} – ${formatDate(r.periode_akhir)} · ${r.nama_file ?? ''}`
})

function pct(part) {
  if (!total.value) return '0%'

  return `${((part / total.value) * 100).toFixed(1).replace('.', ',')}%`
}

const percentLabel = computed(() => pct(matched.value))
</script>

<style scoped>
.progress-segmented {
  display: flex;
  width: 100%;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  background: rgba(var(--v-theme-on-surface), 0.08);
}
.progress-segmented__seg {
  height: 100%;
  transition: width 0.3s ease;
}
.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}
.progress-card__period {
  word-break: break-word;
}
</style>
