<template>
  <div
    class="mis"
    :class="`mis--${tone}`"
  >
    <div class="mis__header glass-header">
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

      <div class="mis__head-row">
        <div class="d-flex align-center gap-3 min-width-0">
          <div class="mis__icon-badge flex-shrink-0">
            <VIcon
              :icon="icon"
              :size="xs ? 18 : 24"
            />
          </div>
          <div class="min-width-0">
            <h4 class="text-h5 font-weight-bold mis__title">
              {{ title }}
            </h4>
            <p
              v-if="subtitle"
              class="text-body-2 mis__subtitle mt-1 mb-0"
            >
              {{ subtitle }}
            </p>
          </div>
        </div>
        <div
          class="d-flex flex-wrap gap-2 w-100 w-sm-auto"
          :class="{ 'mis__head-actions--compact': compactActions }"
        >
          <slot name="actions" />
        </div>
      </div>

      <div class="mis__stats">
        <div class="mis__stat glass-stat">
          <div class="mis__stat-icon glass-stat-icon mis__stat-icon--total">
            <VIcon
              icon="ri-database-2-line"
              size="18"
            />
          </div>
          <div class="min-width-0">
            <div class="mis__stat-value glass-stat-value">
              {{ statsLoading ? '…' : formatStat(stats.total) }}
            </div>
            <div class="mis__stat-label glass-stat-label">
              Total Data
            </div>
          </div>
        </div>
        <div class="mis__stat glass-stat">
          <div class="mis__stat-icon glass-stat-icon mis__stat-icon--active">
            <VIcon
              icon="ri-checkbox-circle-line"
              size="18"
            />
          </div>
          <div class="min-width-0">
            <div class="mis__stat-value glass-stat-value">
              {{ statsLoading ? '…' : formatStat(stats.aktif) }}
            </div>
            <div class="mis__stat-label glass-stat-label">
              Aktif
            </div>
          </div>
        </div>
        <div class="mis__stat glass-stat">
          <div class="mis__stat-icon glass-stat-icon mis__stat-icon--inactive">
            <VIcon
              icon="ri-close-circle-line"
              size="18"
            />
          </div>
          <div class="min-width-0">
            <div class="mis__stat-value glass-stat-value">
              {{ statsLoading ? '…' : formatStat(stats.nonaktif) }}
            </div>
            <div class="mis__stat-label glass-stat-label">
              Nonaktif
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mis__panel">
      <div class="mis__toolbar">
        <VTextField
          :model-value="search"
          clearable
          hide-details
          density="compact"
          class="mis__search"
          :placeholder="searchPlaceholder"
          prepend-inner-icon="ri-search-line"
          @update:model-value="val => emit('update:search', val)"
        />

        <VRadioGroup
          :model-value="status"
          class="mis__status-radio"
          inline
          hide-details
          density="compact"
          @update:model-value="val => emit('update:status', val)"
        >
          <VRadio
            label="Semua"
            value="all"
            color="rgb(var(--tone-1))"
          />
          <VRadio
            label="Aktif"
            :value="1"
            color="rgb(var(--tone-1))"
          />
          <VRadio
            label="Nonaktif"
            :value="0"
            color="rgb(var(--tone-1))"
          />
        </VRadioGroup>
      </div>

      <div class="mis__table">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useDisplay } from 'vuetify'

const { xs } = useDisplay()

defineProps({
  tone: { type: String, default: 'blue' },
  icon: { type: String, default: 'ri-database-2-line' },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  breadcrumbs: { type: Array, default: () => [] },
  stats: { type: Object, default: () => ({ total: 0, aktif: 0, nonaktif: 0 }) },
  statsLoading: { type: Boolean, default: false },
  search: { type: String, default: '' },
  searchPlaceholder: { type: String, default: 'Cari data...' },
  status: { type: [String, Number], default: 'all' },
  compactActions: { type: Boolean, default: false },
})

const emit = defineEmits(['update:search', 'update:status'])

const numberFormatter = new Intl.NumberFormat('id-ID')

function formatStat(value) {
  return numberFormatter.format(value ?? 0)
}
</script>

<style scoped lang="scss">
.mis {
  background: rgb(var(--v-theme-background));
}

.mis--blue {
  --tone-1: 59, 130, 246;
  --tone-2: 34, 211, 238;
}

.mis--violet {
  --tone-1: 139, 92, 246;
  --tone-2: 232, 121, 249;
}

.mis--amber {
  --tone-1: 245, 158, 11;
  --tone-2: 251, 146, 60;
}

.mis--teal {
  --tone-1: 20, 184, 166;
  --tone-2: 52, 211, 153;
}

.mis--rose {
  --tone-1: 236, 72, 153;
  --tone-2: 244, 114, 182;
}

.mis--orange {
  --tone-1: 249, 115, 22;
  --tone-2: 250, 204, 21;
}

.mis--indigo {
  --tone-1: 99, 102, 241;
  --tone-2: 129, 140, 248;
}

.mis--emerald {
  --tone-1: 34, 197, 94;
  --tone-2: 132, 204, 22;
}

/* Breadcrumb glass (.modern-breadcrumb-wrapper dst) & stat-tile base
   (.glass-stat/.glass-stat-icon) dikonsolidasi di assets/styles/styles.scss.
   .glass-header (juga di styles.scss) sengaja polos tanpa box/glow — cuma
   breadcrumb pill & tiap stat card yang punya kotak/glass sendiri. */

/* ─── Header ──────────────────────────────────────────────────────────── */
.mis__head-row {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.mis__icon-badge {
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

.mis__title {
  line-height: 1.2;
}

.mis__subtitle {
  color: rgba(var(--v-theme-on-surface), 0.65);
}

/* ─── Stat tiles ──────────────────────────────────────────────────────── */
.mis__stats {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 18px;
}

/* Base visual .mis__stat/.mis__stat-icon (glass tile, circular icon glow)
   ada di .glass-stat/.glass-stat-icon (styles.scss). Di sini cuma warna
   semantik per-metric: Total=primary (blue/cyan), Aktif=success (green),
   Nonaktif=error (red) — TIDAK ikut tone halaman. */
.mis__stat-icon--total {
  --stat-c: var(--v-theme-primary);
}

.mis__stat-icon--active {
  --stat-c: var(--v-theme-success);
}

.mis__stat-icon--inactive {
  --stat-c: var(--v-theme-error);
}

/* ─── Panel (toolbar + table) ─────────────────────────────────────────── */
.mis__panel {
  position: relative;
  z-index: 1;
  border-radius: 18px;
  overflow: hidden;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.v-theme--dark .mis__panel {
  background: linear-gradient(180deg, rgba(var(--tone-1), 0.06), transparent 20%), rgb(var(--v-theme-surface));
  border-color: rgba(var(--tone-1), 0.18);
}

.mis__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.mis__search {
  max-width: 320px;
  flex: 1 1 240px;
}

.mis__status-radio {
  flex-shrink: 0;
}

.mis__status-radio :deep(.v-input__control) {
  min-height: 0;
}

.mis__status-radio :deep(.v-selection-control-group) {
  flex-wrap: nowrap;
  gap: 18px;
}

.mis__status-radio :deep(.v-selection-control) {
  flex: 0 0 auto;
  min-height: 0;
}

.mis__status-radio :deep(.v-selection-control__wrapper) {
  inline-size: 26px;
  block-size: 26px;
}

.mis__status-radio :deep(.v-label) {
  font-size: 0.8125rem;
  font-weight: 500;
  white-space: nowrap;
  opacity: 0.85;
}

.mis__table {
  padding: 6px 10px 12px;
}

.mis__table :deep(.v-data-table__tr:hover > td:first-child) {
  box-shadow: inset 3px 0 0 0 rgb(var(--tone-1));
}

@media (max-width: 599.98px) {
  .mis__search {
    max-width: 100%;
  }

  .mis__header {
    padding: 14px 0;
  }

  /* Ringkas header di ponsel: breadcrumb & subtitle panjang disembunyikan
     agar area di atas tabel tidak boros ruang. */
  .modern-breadcrumb-wrapper {
    display: none !important;
  }

  .mis__subtitle {
    display: none;
  }

  .mis__title {
    font-size: 1.05rem !important;
  }

  .mis__icon-badge {
    inline-size: 32px;
    block-size: 32px;
  }

  .mis__status-radio :deep(.v-selection-control-group) {
    flex-wrap: wrap;
    gap: 8px;
  }

  /* Opt-in (compactActions): tombol aksi mengecil ke lebar konten & rata kanan
     agar tombol ikon (mis. + Tambah) duduk sebaris judul. Default tetap w-100. */
  .mis__head-actions--compact {
    width: auto !important;
    margin-inline-start: auto;
    flex: 0 0 auto;
  }

  /* Statistik besar → 3 kartu ringkas sejajar (summary kecil). */
  .mis__stats {
    gap: 8px;
    margin-top: 12px;
  }

  .mis__stat {
    flex: 1 1 0;
    min-width: 0;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    padding: 8px 10px;
    border-radius: 12px;
  }

  .mis__stat-icon {
    display: none;
  }

  .mis__stat-value {
    font-size: 0.95rem;
  }

  .mis__stat-label {
    font-size: 0.6rem;
    letter-spacing: 0.02em;
  }

  .mis__toolbar {
    padding: 12px;
    gap: 10px;
  }
}
</style>
