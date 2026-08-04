<template>
  <div
    class="phh"
    :class="`phh--${tone}`"
  >
    <div class="phh__header">
      <span
        class="phh__glow phh__glow--a"
        aria-hidden="true"
      />
      <span
        class="phh__glow phh__glow--b"
        aria-hidden="true"
      />

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
          class="phh__stat"
        >
          <div
            class="phh__stat-icon"
            :class="stat.color ? `phh__stat-icon--${stat.color}` : 'phh__stat-icon--tone'"
          >
            <VIcon
              :icon="stat.icon"
              size="18"
            />
          </div>
          <div class="min-width-0">
            <div class="phh__stat-value">
              {{ statsLoading ? '…' : formatStat(stat.value) }}
            </div>
            <div class="phh__stat-label">
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

.phh--sky {
  --phh-c1: 2, 132, 199;
  --phh-c2: 125, 211, 252;
}

.phh--fuchsia {
  --phh-c1: 192, 38, 211;
  --phh-c2: 240, 171, 252;
}

.phh--gold {
  --phh-c1: 161, 98, 7;
  --phh-c2: 250, 204, 21;
}

.phh--slate {
  --phh-c1: 71, 85, 105;
  --phh-c2: 148, 163, 184;
}

/* ─── Breadcrumb (mirrors PageHeader.vue / ManagementIndexShell.vue) ───── */
.modern-breadcrumb-wrapper {
  background: rgba(var(--v-theme-surface), 0.3);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  padding: 5px 8px;
  border-radius: 10px;
  width: max-content;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 4px 15px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(12px);
  position: relative;
  overflow: hidden;
}

.breadcrumb-pill {
  padding: 6px 14px;
  font-size: 0.85rem;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  text-decoration: none;
  font-weight: 500;
  letter-spacing: 0.3px;
  position: relative;
  z-index: 1;
}

.breadcrumb-link {
  color: rgba(var(--v-theme-on-surface), 0.65);
  background: transparent;
}

.breadcrumb-link:hover {
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.1);
  transform: translateY(-1px);
}

.breadcrumb-active {
  background: linear-gradient(135deg, rgb(var(--phh-c1)), rgb(var(--phh-c2)));
  color: white;
  box-shadow: 0 4px 15px rgba(var(--phh-c1), 0.4);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.separator {
  display: flex;
  align-items: center;
  color: rgba(var(--v-theme-on-surface), 0.3);
}

/* ─── Header ──────────────────────────────────────────────────────────── */
.phh__header {
  position: relative;
  overflow: hidden;
  border-radius: 20px;
  padding: 20px 22px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, rgba(var(--phh-c1), 0.10), rgba(var(--phh-c2), 0.04)), rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--phh-c1), 0.16);
}

.v-theme--dark .phh__header {
  background: linear-gradient(135deg, rgba(var(--phh-c1), 0.20), rgba(var(--phh-c2), 0.08)), rgb(var(--v-theme-surface));
  border-color: rgba(var(--phh-c1), 0.28);
  box-shadow: 0 20px 45px -28px rgba(var(--phh-c1), 0.65);
}

.phh__glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(40px);
  pointer-events: none;
  opacity: 0.4;
}

.phh__glow--a {
  inline-size: 220px;
  block-size: 220px;
  inset-block-start: -90px;
  inset-inline-end: -60px;
  background: rgb(var(--phh-c1));
}

.phh__glow--b {
  inline-size: 160px;
  block-size: 160px;
  inset-block-end: -70px;
  inset-inline-start: 12%;
  background: rgb(var(--phh-c2));
  opacity: 0.3;
}

.v-theme--dark .phh__glow {
  opacity: 0.65;
}

.v-theme--dark .phh__glow--b {
  opacity: 0.4;
}

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
  background: linear-gradient(135deg, rgb(var(--phh-c1)), rgb(var(--phh-c2)));
  box-shadow: 0 8px 20px -6px rgba(var(--phh-c1), 0.6);
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

.phh__stat {
  flex: 1 1 160px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 14px;
  background: rgba(var(--v-theme-surface), 0.6);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  backdrop-filter: blur(6px);
}

.v-theme--dark .phh__stat {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.08);
}

.phh__stat-icon {
  flex-shrink: 0;
  inline-size: 36px;
  block-size: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.phh__stat-icon--tone {
  background: rgba(var(--phh-c1), 0.16);
  color: rgb(var(--phh-c1));
}

.phh__stat-icon--primary {
  background: rgba(var(--v-theme-primary), 0.16);
  color: rgb(var(--v-theme-primary));
}

.phh__stat-icon--success {
  background: rgba(var(--v-theme-success), 0.16);
  color: rgb(var(--v-theme-success));
}

.phh__stat-icon--error {
  background: rgba(var(--v-theme-error), 0.14);
  color: rgb(var(--v-theme-error));
}

.phh__stat-icon--warning {
  background: rgba(var(--v-theme-warning), 0.16);
  color: rgb(var(--v-theme-warning));
}

.phh__stat-icon--info {
  background: rgba(var(--v-theme-info), 0.16);
  color: rgb(var(--v-theme-info));
}

.phh__stat-value {
  font-size: 1.15rem;
  font-weight: 700;
  line-height: 1.2;
}

.phh__stat-label {
  font-size: 0.72rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

@media (max-width: 599.98px) {
  .phh__header {
    padding: 14px;
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
