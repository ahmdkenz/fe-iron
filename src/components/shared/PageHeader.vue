<template>
  <div class="mb-4 page-header">
    <!-- Modern 3D Finance Breadcrumbs -->
    <div
      v-if="breadcrumbs && breadcrumbs.length"
      class="modern-breadcrumb-wrapper d-flex align-center mb-3"
      style="overflow-x: auto; max-width: 100%;"
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

    <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-sm-space-between gap-3">
      <div class="min-width-0">
        <h4 class="text-h5 font-weight-bold page-header__title">
          {{ title }}
        </h4>
        <p
          v-if="subtitle"
          class="text-body-2 text-medium-emphasis mt-1 mb-0 page-header__subtitle"
        >
          {{ subtitle }}
        </p>
      </div>
      <div class="d-flex flex-wrap gap-2 w-100 w-sm-auto page-header__actions">
        <slot :mobile="xs" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useDisplay } from 'vuetify'

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  breadcrumbs: { type: Array, default: () => [] },
})

// Exposed to the default slot as `mobile` so pages can render icon-only
// AppActionButton (`:compact="mobile"`) for routine actions on phone-sized
// screens, per the mobile design plan's <600px breakpoint.
const { xs } = useDisplay()
</script>

<style scoped>
/* Breadcrumb glass (.modern-breadcrumb-wrapper dst) dikonsolidasi di
   assets/styles/styles.scss. PageHeader tidak punya konsep tone per-halaman
   (beda dari PageHeroHeader/ManagementIndexShell), jadi breadcrumb aktif
   pakai gradient primary→info tetap. */
.page-header {
  --tone-1: var(--v-theme-primary);
  --tone-2: var(--v-theme-info);
}

@media (max-width: 599.98px) {
  /* Ringkas header di ponsel: breadcrumb & subtitle disembunyikan agar area
     di atas konten tidak boros ruang (samakan dengan PageHeroHeader.vue). */
  .modern-breadcrumb-wrapper { display: none !important; }
  .page-header__subtitle { display: none; }
  .page-header__title { font-size: 1.05rem !important; }

  /* Tombol aksi (bisa berupa AppActionButton :compact) dirapatkan & rata
     kanan supaya tidak menumpuk rata kiri dengan banyak spasi kosong. */
  .page-header__actions {
    justify-content: flex-end;
    gap: 6px;
  }
}
</style>
