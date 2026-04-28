<template>
  <div class="mb-4">
    <!-- Modern 3D Finance Breadcrumbs -->
    <div
      v-if="breadcrumbs && breadcrumbs.length"
      class="modern-breadcrumb-wrapper d-flex align-center mb-3"
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

    <div class="d-flex align-center justify-space-between">
      <div>
        <h4 class="text-h5 font-weight-bold">
          {{ title }}
        </h4>
        <p
          v-if="subtitle"
          class="text-body-2 text-medium-emphasis mt-1 mb-0"
        >
          {{ subtitle }}
        </p>
      </div>
      <div class="d-flex gap-2">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  breadcrumbs: { type: Array, default: () => [] },
})
</script>

<style scoped>
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

.modern-breadcrumb-wrapper::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
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
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.15);
  transform: translateY(-1px);
}

.breadcrumb-active {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)), rgb(var(--v-theme-info, 30, 136, 229)));
  color: white;
  box-shadow: 0 4px 15px rgba(var(--v-theme-primary), 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.3);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.separator {
  display: flex;
  align-items: center;
  color: rgba(var(--v-theme-on-surface), 0.3);
}
</style>
