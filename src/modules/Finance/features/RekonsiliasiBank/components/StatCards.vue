<template>
  <div class="mb-4">
    <div class="rekon-stat-row">
      <div
        v-for="card in trioCards"
        :key="card.key"
        class="rekon-stat"
      >
        <div
          class="rekon-stat__icon"
          :class="`rekon-stat__icon--${card.color}`"
        >
          <VIcon
            :icon="card.icon"
            size="18"
          />
        </div>
        <div class="min-width-0">
          <div class="rekon-stat__value">
            {{ card.value }}
          </div>
          <div class="rekon-stat__label">
            {{ card.label }}
          </div>
        </div>
      </div>
    </div>

    <VCard class="rekon-hero mt-3">
      <VCardText class="d-flex align-center gap-3">
        <div class="rekon-hero__icon">
          <VIcon
            icon="ri-money-dollar-circle-line"
            size="22"
          />
        </div>
        <div class="min-width-0 flex-grow-1">
          <div class="text-caption text-medium-emphasis">
            Total Kredit
          </div>
          <div class="rekon-hero__value">
            {{ formattedKredit }}
          </div>
          <div class="text-caption text-medium-emphasis">
            Total mutasi masuk
          </div>
        </div>
      </VCardText>
    </VCard>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useFormatter } from '@/composables/useFormatter'

const props = defineProps({
  report: { type: Object, default: () => ({}) },
})

const { formatCurrency } = useFormatter()

// Persentase Sudah/Belum Cocok sengaja tidak ditampilkan lagi di sini —
// sudah ada di progress bar + legend ProgressCard tepat di bawah komponen
// ini, jadi caption di sini cuma duplikat & bikin kartu mobile sempit.
const trioCards = computed(() => {
  const r = props.report ?? {}

  return [
    {
      key: 'total',
      icon: 'ri-bank-card-line',
      color: 'primary',
      label: 'Total Transaksi',
      value: r.total_transaksi ?? 0,
    },
    {
      key: 'matched',
      icon: 'ri-checkbox-circle-line',
      color: 'success',
      label: 'Sudah Cocok',
      value: r.jumlah_matched ?? 0,
    },
    {
      key: 'unmatched',
      icon: 'ri-error-warning-line',
      color: 'warning',
      label: 'Belum Cocok',
      value: r.jumlah_unmatched ?? 0,
    },
  ]
})

// Total Kredit dipisah jadi kartu sendiri (full-width) karena satu-satunya
// nilai yang panjangnya tidak bisa diprediksi (mata uang) — di kartu penuh,
// nilai ini tidak pernah perlu terpotong/melipat di layar manapun.
const formattedKredit = computed(() => formatCurrency(props.report?.total_kredit ?? 0))
</script>

<style scoped>
.rekon-stat-row {
  display: flex;
  gap: 10px;
}

.rekon-stat {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.rekon-stat__icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.rekon-stat__icon--primary { background: rgba(var(--v-theme-primary), 0.12); color: rgb(var(--v-theme-primary)); }
.rekon-stat__icon--success { background: rgba(var(--v-theme-success), 0.12); color: rgb(var(--v-theme-success)); }
.rekon-stat__icon--warning { background: rgba(var(--v-theme-warning), 0.12); color: rgb(var(--v-theme-warning)); }

.rekon-stat__value {
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1.2;
}

.rekon-stat__label {
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rekon-hero__icon {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-info), 0.12);
  color: rgb(var(--v-theme-info));
}

.rekon-hero__value {
  font-size: 1.375rem;
  font-weight: 700;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 599.98px) {
  .rekon-stat-row {
    gap: 6px;
  }

  .rekon-stat {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    padding: 8px;
  }

  .rekon-stat__icon {
    display: none;
  }

  .rekon-stat__value {
    font-size: 0.9rem;
  }

  .rekon-stat__label {
    font-size: 0.6rem;
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
    line-height: 1.2;
  }

  .rekon-hero__value {
    font-size: 1rem;
  }

  .rekon-hero__icon {
    width: 36px;
    height: 36px;
  }
}
</style>
