<template>
  <div
    class="phh"
    :class="`phh--${tone}`"
  >
    <div class="phh__header glass-header">
      <div
        v-if="breadcrumbs.length"
        class="modern-breadcrumb-wrapper d-flex align-center mb-3"
        style="overflow-x: auto; max-width: 100%; position: relative; z-index: 1;"
      >
        <template
          v-for="(item, index) in breadcrumbs"
          :key="index"
        >
          <RouterLink
            v-if="!item.disabled"
            :to="item.to"
            class="breadcrumb-pill breadcrumb-link d-flex align-center"
          >
            <VIcon
              v-if="item.icon"
              :icon="item.icon"
              size="16"
              class="me-1"
            />
            {{ item.title }}
          </RouterLink>
          <div
            v-else
            class="breadcrumb-pill breadcrumb-active d-flex align-center"
          >
            <VIcon
              v-if="item.icon"
              :icon="item.icon"
              size="16"
              class="me-1"
            />
            {{ item.title }}
          </div>

          <div
            v-if="index < breadcrumbs.length - 1"
            class="separator mx-1"
          >
            <VIcon
              icon="ri-arrow-right-s-line"
              size="18"
            />
          </div>
        </template>
      </div>

      <div class="phh__head-row">
        <div class="d-flex align-center gap-3 min-width-0">
          <div class="phh__icon-badge flex-shrink-0">
            <VIcon
              :icon="icon"
              size="24"
            />
          </div>
          <div class="min-width-0">
            <h4 class="text-h5 font-weight-bold phh__title">
              {{ title }}
            </h4>
            <p
              v-if="subtitle"
              class="text-body-2 phh__subtitle mt-1 mb-0"
            >
              {{ subtitle }}
            </p>
          </div>
        </div>
        <div
          class="d-flex flex-wrap gap-2 w-100 w-sm-auto"
          :class="{ 'phh__head-actions--compact': compactActions }"
        >
          <slot name="actions" />
        </div>
      </div>

      <div
        v-if="stats.length"
        class="phh__stats"
      >
        <div
          v-for="stat in stats"
          :key="stat.key"
          class="phh__stat glass-stat"
        >
          <div
            class="phh__stat-icon glass-stat-icon"
            :class="stat.color ? `phh__stat-icon--${stat.color}` : 'phh__stat-icon--tone'"
          >
            <VIcon
              :icon="stat.icon"
              size="18"
            />
          </div>
          <div class="min-width-0">
            <div class="phh__stat-value glass-stat-value">
              {{ statsLoading ? '…' : formatStat(stat.value) }}
            </div>
            <div class="phh__stat-label glass-stat-label">
              {{ stat.label }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  tone: { type: String, default: 'blue' },
  icon: { type: String, default: 'ri-database-2-line' },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  breadcrumbs: { type: Array, default: () => [] },
  stats: { type: Array, default: () => [] },
  statsLoading: { type: Boolean, default: false },
  compactActions: { type: Boolean, default: false },
})

const numberFormatter = new Intl.NumberFormat('id-ID')

function formatStat(value) {
  if (typeof value === 'string') return value

  return numberFormatter.format(value ?? 0)
}
</script>

<style scoped lang="scss">
.phh {
  background: rgb(var(--v-theme-background));
}

.phh--blue {
  --tone-1: 59, 130, 246;
  --tone-2: 34, 211, 238;
}

.phh--sky {
  --tone-1: 2, 132, 199;
  --tone-2: 125, 211, 252;
}

.phh--fuchsia {
  --tone-1: 192, 38, 211;
  --tone-2: 240, 171, 252;
}

.phh--gold {
  --tone-1: 161, 98, 7;
  --tone-2: 250, 204, 21;
}

.phh--slate {
  --tone-1: 71, 85, 105;
  --tone-2: 148, 163, 184;
}

.phh--emerald {
  --tone-1: 5, 150, 105;
  --tone-2: 110, 231, 183;
}

/* Breadcrumb glass (.modern-breadcrumb-wrapper dst) & stat-tile base
   (.glass-stat/.glass-stat-icon) dikonsolidasi di assets/styles/styles.scss.
   .glass-header (juga di styles.scss) sengaja polos tanpa box/glow — cuma
   breadcrumb pill & tiap stat card yang punya kotak/glass sendiri. */

.phh__head-row {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.phh__icon-badge {
  inline-size: 48px;
  block-size: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: linear-gradient(135deg, rgb(var(--tone-1)), rgb(var(--tone-2)));
  box-shadow: 0 8px 20px -6px rgba(var(--tone-1), 0.6);
}

.phh__title {
  line-height: 1.2;
}

.phh__subtitle {
  color: rgba(var(--v-theme-on-surface), 0.65);
}

/* ─── Stat tiles ──────────────────────────────────────────────────────── */
.phh__stats {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 18px;
}

/* Base visual .phh__stat/.phh__stat-icon (glass tile, circular icon glow)
   ada di .glass-stat/.glass-stat-icon (styles.scss). Di sini cuma varian
   warna semantik per-metric (dari field stat.color di halaman pemanggil). */
.phh__stat-icon--tone {
  --stat-c: var(--tone-1);
}

.phh__stat-icon--primary {
  --stat-c: var(--v-theme-primary);
}

.phh__stat-icon--success {
  --stat-c: var(--v-theme-success);
}

.phh__stat-icon--error {
  --stat-c: var(--v-theme-error);
}

.phh__stat-icon--warning {
  --stat-c: var(--v-theme-warning);
}

.phh__stat-icon--info {
  --stat-c: var(--v-theme-info);
}

@media (max-width: 599.98px) {
  .phh__header {
    padding: 14px 0;
  }

  /* Ringkas header di ponsel: breadcrumb & subtitle panjang disembunyikan
     agar area di atas tabel tidak boros ruang. */
  .modern-breadcrumb-wrapper {
    display: none !important;
  }

  .phh__subtitle {
    display: none;
  }

  .phh__title {
    font-size: 1.05rem !important;
  }

  .phh__icon-badge {
    inline-size: 40px;
    block-size: 40px;
  }

  /* Opt-in (compactActions): tombol aksi mengecil ke lebar konten & rata kanan
     agar tombol ikon (mis. + Tambah) duduk sebaris judul. Default tetap w-100. */
  .phh__head-actions--compact {
    width: auto !important;
    margin-inline-start: auto;
    flex: 0 0 auto;
  }

  /* Statistik besar → grid 2 kolom (2x2) agar tiap kartu cukup lebar untuk
     menampilkan nominal Rupiah penuh, tidak terpotong oleh overflow:hidden
     pada .phh__header. */
  .phh__stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    margin-top: 12px;
  }

  .phh__stat {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    padding: 8px 10px;
    border-radius: 12px;
    min-width: 0;
  }

  .phh__stat-icon {
    display: none;
  }

  .phh__stat-value {
    font-size: 0.95rem;
    overflow-wrap: break-word;
    word-break: break-word;
  }

  .phh__stat-label {
    font-size: 0.6rem;
    letter-spacing: 0.02em;
  }
}
</style>
