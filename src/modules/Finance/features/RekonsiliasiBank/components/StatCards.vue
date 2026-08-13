<template>
  <div class="mb-4">
    <StatCard :cards="trioCards" />

    <div class="rekon-hero mt-3 d-flex align-center gap-3">
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
    </div>
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
/* Trio cards (Total Transaksi/Sudah Cocok/Belum Cocok) pakai <StatCard>
   shared (glass Dark Aurora). Kartu "Total Kredit" tetap bespoke di sini
   (full-width, nilai currency panjang) tapi di-reskin ke gaya glass yang
   sama: rounded 16px, border tipis, backdrop-filter, icon circular glow. */
.rekon-hero {
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(var(--v-theme-surface), 0.6);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  backdrop-filter: blur(6px);
}

.v-theme--dark .rekon-hero {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.08);
}

.rekon-hero__icon {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-info), 0.16);
  color: rgb(var(--v-theme-info));
  box-shadow: 0 0 0 1px rgba(var(--v-theme-info), 0.15), 0 0 16px rgba(var(--v-theme-info), 0.35);
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
  .rekon-hero__value {
    font-size: 1rem;
  }

  .rekon-hero__icon {
    width: 36px;
    height: 36px;
  }
}
</style>
