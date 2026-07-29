<template>
  <VRow class="mb-4">
    <VCol
      v-for="card in cards"
      :key="card.key"
      cols="6"
      sm="3"
    >
      <VCard>
        <VCardText class="d-flex align-center gap-3">
          <div
            class="stat-icon"
            :class="`stat-icon--${card.color}`"
          >
            <VIcon
              :icon="card.icon"
              size="20"
            />
          </div>
          <div class="min-width-0">
            <div class="text-caption text-medium-emphasis text-truncate">
              {{ card.label }}
            </div>
            <div class="text-h6 font-weight-bold text-truncate">
              {{ card.value }}
            </div>
            <div class="text-caption text-medium-emphasis text-truncate">
              {{ card.caption }}
            </div>
          </div>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<script setup>
import { computed } from 'vue'
import { useFormatter } from '@/composables/useFormatter'

const props = defineProps({
  report: { type: Object, default: () => ({}) },
})

const { formatCurrency } = useFormatter()

function pct(part, total) {
  if (!total) return '0%'

  return `${((part / total) * 100).toFixed(1).replace('.', ',')}%`
}

const cards = computed(() => {
  const r = props.report ?? {}
  const total = r.total_transaksi ?? 0

  return [
    {
      key: 'total',
      icon: 'ri-bank-card-line',
      color: 'primary',
      label: 'Total Transaksi',
      value: total,
      caption: 'Semua mutasi di laporan ini',
    },
    {
      key: 'matched',
      icon: 'ri-checkbox-circle-line',
      color: 'success',
      label: 'Sudah Cocok',
      value: r.jumlah_matched ?? 0,
      caption: `${pct(r.jumlah_matched ?? 0, total)} dari total transaksi`,
    },
    {
      key: 'unmatched',
      icon: 'ri-error-warning-line',
      color: 'warning',
      label: 'Belum Cocok',
      value: r.jumlah_unmatched ?? 0,
      caption: `${pct(r.jumlah_unmatched ?? 0, total)} dari total transaksi`,
    },
    {
      key: 'kredit',
      icon: 'ri-money-dollar-circle-line',
      color: 'info',
      label: 'Total Kredit',
      value: formatCurrency(r.total_kredit ?? 0),
      caption: 'Total mutasi masuk',
    },
  ]
})
</script>

<style scoped>
.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.stat-icon--primary { background: rgba(var(--v-theme-primary), 0.12); color: rgb(var(--v-theme-primary)); }
.stat-icon--success { background: rgba(var(--v-theme-success), 0.12); color: rgb(var(--v-theme-success)); }
.stat-icon--warning { background: rgba(var(--v-theme-warning), 0.12); color: rgb(var(--v-theme-warning)); }
.stat-icon--info { background: rgba(var(--v-theme-info), 0.12); color: rgb(var(--v-theme-info)); }
</style>
