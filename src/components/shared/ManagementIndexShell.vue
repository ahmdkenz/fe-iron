<template>
  <div
    class="mis"
    :class="`mis--${tone}`"
  >
    <div class="mis__header">
      <span
        class="mis__glow mis__glow--a"
        aria-hidden="true"
      />
      <span
        class="mis__glow mis__glow--b"
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

      <div class="mis__head-row">
        <div class="d-flex align-center gap-3 min-width-0">
          <div class="mis__icon-badge flex-shrink-0">
            <VIcon
              :icon="icon"
              size="24"
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
        <div class="d-flex flex-wrap gap-2 w-100 w-sm-auto">
          <slot name="actions" />
        </div>
      </div>

      <div class="mis__stats">
        <div class="mis__stat">
          <div class="mis__stat-icon mis__stat-icon--total">
            <VIcon
              icon="ri-database-2-line"
              size="18"
            />
          </div>
          <div class="min-width-0">
            <div class="mis__stat-value">
              {{ statsLoading ? '…' : formatStat(stats.total) }}
            </div>
            <div class="mis__stat-label">
              Total Data
            </div>
          </div>
        </div>
        <div class="mis__stat">
          <div class="mis__stat-icon mis__stat-icon--active">
            <VIcon
              icon="ri-checkbox-circle-line"
              size="18"
            />
          </div>
          <div class="min-width-0">
            <div class="mis__stat-value">
              {{ statsLoading ? '…' : formatStat(stats.aktif) }}
            </div>
            <div class="mis__stat-label">
              Aktif
            </div>
          </div>
        </div>
        <div class="mis__stat">
          <div class="mis__stat-icon mis__stat-icon--inactive">
            <VIcon
              icon="ri-close-circle-line"
              size="18"
            />
          </div>
          <div class="min-width-0">
            <div class="mis__stat-value">
              {{ statsLoading ? '…' : formatStat(stats.nonaktif) }}
            </div>
            <div class="mis__stat-label">
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

        <VBtnToggle
          :model-value="status"
          class="mis__status-toggle"
          density="comfortable"
          color="primary"
          variant="outlined"
          mandatory
          divided
          @update:model-value="val => emit('update:status', val)"
        >
          <VBtn
            :value="'all'"
            size="small"
          >
            Semua
          </VBtn>
          <VBtn
            :value="1"
            size="small"
          >
            Aktif
          </VBtn>
          <VBtn
            :value="0"
            size="small"
          >
            Nonaktif
          </VBtn>
        </VBtnToggle>
      </div>

      <div class="mis__table">
        <slot />
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
  stats: { type: Object, default: () => ({ total: 0, aktif: 0, nonaktif: 0 }) },
  statsLoading: { type: Boolean, default: false },
  search: { type: String, default: '' },
  searchPlaceholder: { type: String, default: 'Cari data...' },
  status: { type: [String, Number], default: 'all' },
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
  --mis-c1: 59, 130, 246;
  --mis-c2: 34, 211, 238;
}

.mis--violet {
  --mis-c1: 139, 92, 246;
  --mis-c2: 232, 121, 249;
}

.mis--amber {
  --mis-c1: 245, 158, 11;
  --mis-c2: 251, 146, 60;
}

.mis--teal {
  --mis-c1: 20, 184, 166;
  --mis-c2: 52, 211, 153;
}

/* ─── Breadcrumb (mirrors PageHeader.vue) ────────────────────────────── */
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
  background: linear-gradient(135deg, rgb(var(--mis-c1)), rgb(var(--mis-c2)));
  color: white;
  box-shadow: 0 4px 15px rgba(var(--mis-c1), 0.4);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.separator {
  display: flex;
  align-items: center;
  color: rgba(var(--v-theme-on-surface), 0.3);
}

/* ─── Header ──────────────────────────────────────────────────────────── */
.mis__header {
  position: relative;
  overflow: hidden;
  border-radius: 20px;
  padding: 20px 22px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, rgba(var(--mis-c1), 0.10), rgba(var(--mis-c2), 0.04)), rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--mis-c1), 0.16);
}

.v-theme--dark .mis__header {
  background: linear-gradient(135deg, rgba(var(--mis-c1), 0.20), rgba(var(--mis-c2), 0.08)), rgb(var(--v-theme-surface));
  border-color: rgba(var(--mis-c1), 0.28);
  box-shadow: 0 20px 45px -28px rgba(var(--mis-c1), 0.65);
}

.mis__glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(40px);
  pointer-events: none;
  opacity: 0.4;
}

.mis__glow--a {
  inline-size: 220px;
  block-size: 220px;
  inset-block-start: -90px;
  inset-inline-end: -60px;
  background: rgb(var(--mis-c1));
}

.mis__glow--b {
  inline-size: 160px;
  block-size: 160px;
  inset-block-end: -70px;
  inset-inline-start: 12%;
  background: rgb(var(--mis-c2));
  opacity: 0.3;
}

.v-theme--dark .mis__glow {
  opacity: 0.65;
}

.v-theme--dark .mis__glow--b {
  opacity: 0.4;
}

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
  background: linear-gradient(135deg, rgb(var(--mis-c1)), rgb(var(--mis-c2)));
  box-shadow: 0 8px 20px -6px rgba(var(--mis-c1), 0.6);
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

.mis__stat {
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

.v-theme--dark .mis__stat {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.08);
}

.mis__stat-icon {
  flex-shrink: 0;
  inline-size: 36px;
  block-size: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mis__stat-icon--total {
  background: rgba(var(--mis-c1), 0.16);
  color: rgb(var(--mis-c1));
}

.mis__stat-icon--active {
  background: rgba(var(--v-theme-success), 0.16);
  color: rgb(var(--v-theme-success));
}

.mis__stat-icon--inactive {
  background: rgba(var(--v-theme-error), 0.14);
  color: rgb(var(--v-theme-error));
}

.mis__stat-value {
  font-size: 1.15rem;
  font-weight: 700;
  line-height: 1.2;
}

.mis__stat-label {
  font-size: 0.72rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  text-transform: uppercase;
  letter-spacing: 0.04em;
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
  background: linear-gradient(180deg, rgba(var(--mis-c1), 0.06), transparent 20%), rgb(var(--v-theme-surface));
  border-color: rgba(var(--mis-c1), 0.18);
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

.mis__status-toggle :deep(.v-btn--active) {
  color: rgb(var(--mis-c1)) !important;
}

.mis__table {
  padding: 6px 10px 12px;
}

.mis__table :deep(.v-data-table__tr:hover > td:first-child) {
  box-shadow: inset 3px 0 0 0 rgb(var(--mis-c1));
}

@media (max-width: 599.98px) {
  .mis__search {
    max-width: 100%;
  }

  .mis__header {
    padding: 16px;
  }

  .mis__stat {
    flex: 1 1 100%;
  }

  .mis__toolbar {
    padding: 14px;
  }
}
</style>
