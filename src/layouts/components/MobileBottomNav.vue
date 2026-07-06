<script setup>
import { useConfigStore } from '@core/stores/config'

const props = defineProps({
  navItems: {
    type: Array,
    required: true,
  },
})

const configStore = useConfigStore()
const route = useRoute()

const pinnedItems = [
  { title: 'Dashboard', to: { name: 'dashboard' }, icon: 'ri-home-smile-2-line' },
  { title: 'Client', to: { name: 'finance-klien-ar' }, icon: 'ri-building-4-line' },
  { title: 'Invoice', to: { name: 'finance-invoice-index' }, icon: 'ri-file-list-3-line' },
  { title: 'Saldo Akhir', to: { name: 'finance-ending-balance' }, icon: 'ri-scales-2-line' },
]

// Only show a pinned shortcut if the current user actually has access to it
// (mirrors whatever role filtering already produced `props.navItems`).
const visiblePinnedItems = computed(() => pinnedItems.filter(
  item => props.navItems.some(navItem => navItem.to?.name === item.to.name),
))

const isItemActive = item => route.name === item.to.name

const isMoreMenuOpen = ref(false)

// Turn the flat heading/item list into { heading, items[] } groups so "Lainnya"
// can show a compact grid of group tiles first, drilling down into a group's
// own item grid on tap instead of listing everything at once.
const groupedNavItems = computed(() => {
  const groups = []
  let current = { heading: 'Umum', items: [] }

  props.navItems.forEach(item => {
    if ('heading' in item) {
      if (current.items.length)
        groups.push(current)
      current = { heading: item.heading, items: [] }

      return
    }

    // Dashboard already has its own shortcut in the pinned bottom bar, so
    // skip it here to avoid showing it twice.
    if (item.to?.name === 'dashboard')
      return

    current.items.push(item)
  })

  if (current.items.length)
    groups.push(current)

  return groups
})

// Nav headings don't carry their own icon, so give each group tile a
// representative one; fall back to its first child's icon if unmapped.
const groupIcons = {
  Umum: 'ri-apps-2-line',
  'USER MANAGEMENT': 'ri-team-line',
  'MASTER DATA': 'ri-database-2-line',
  'ACCOUNT RECEIVABLE': 'ri-hand-coin-line',
  REKONSILIASI: 'ri-bank-line',
  LAPORAN: 'ri-file-chart-line',
}

const groupIcon = group => groupIcons[group.heading] ?? group.items[0]?.icon?.icon ?? 'ri-folder-2-line'

// null = showing the top-level group grid; otherwise the heading drilled into.
const activeGroupHeading = ref(null)

const activeGroup = computed(() => groupedNavItems.value.find(
  group => group.heading === activeGroupHeading.value,
) ?? null)

function openGroup(heading) {
  activeGroupHeading.value = heading
}

function closeGroup() {
  activeGroupHeading.value = null
}

watch(() => route.name, () => {
  isMoreMenuOpen.value = false
})

watch(isMoreMenuOpen, isOpen => {
  if (!isOpen)
    activeGroupHeading.value = null
})
</script>

<template>
  <Teleport to="body">
    <nav
      v-if="configStore.isLessThanOverlayNavBreakpoint"
      class="mobile-bottom-nav"
    >
      <RouterLink
        v-for="item in visiblePinnedItems"
        :key="item.to.name"
        :to="item.to"
        class="mobile-bottom-nav-item"
        :class="{ active: isItemActive(item) }"
      >
        <VIcon
          :icon="item.icon"
          size="22"
        />
        <span>{{ item.title }}</span>
      </RouterLink>

      <button
        type="button"
        class="mobile-bottom-nav-item"
        :class="{ active: isMoreMenuOpen }"
        @click="isMoreMenuOpen = true"
      >
        <VIcon
          icon="ri-menu-line"
          size="22"
        />
        <span>Lainnya</span>
      </button>
    </nav>

    <VBottomSheet
      v-if="configStore.isLessThanOverlayNavBreakpoint"
      v-model="isMoreMenuOpen"
    >
      <VCard class="mobile-more-menu">
        <div class="mobile-more-menu-handle" />

        <VCardText>
          <button
            v-if="activeGroup"
            type="button"
            class="mobile-menu-back"
            @click="closeGroup"
          >
            <VIcon
              icon="ri-arrow-left-s-line"
              size="20"
            />
            <span>{{ activeGroup.heading }}</span>
          </button>

          <div class="mobile-menu-grid">
            <template v-if="!activeGroup">
              <button
                v-for="group in groupedNavItems"
                :key="group.heading"
                type="button"
                class="mobile-menu-tile"
                @click="openGroup(group.heading)"
              >
                <span class="mobile-menu-tile-icon">
                  <VIcon
                    :icon="groupIcon(group)"
                    size="24"
                  />
                </span>
                <span class="mobile-menu-tile-label">{{ group.heading }}</span>
              </button>
            </template>

            <template v-else>
              <RouterLink
                v-for="item in activeGroup.items"
                :key="item.to.name"
                :to="item.to"
                class="mobile-menu-tile"
                :class="{ active: route.name === item.to.name }"
              >
                <VBadge
                  :model-value="!!item.badgeContent"
                  :content="item.badgeContent"
                  color="error"
                  location="top end"
                >
                  <span class="mobile-menu-tile-icon">
                    <VIcon
                      :icon="item.icon?.icon"
                      size="24"
                    />
                  </span>
                </VBadge>
                <span class="mobile-menu-tile-label">{{ item.title }}</span>
              </RouterLink>
            </template>
          </div>
        </VCardText>
      </VCard>
    </VBottomSheet>
  </Teleport>
</template>

<style lang="scss" scoped>
@use "@configured-variables" as variables;

.mobile-bottom-nav {
  position: fixed;

  // ℹ️ Teleported to <body>, so it renders after #app in DOM order and would
  // otherwise stack above ordinary content regardless of z-index ties.
  // Vuetify's own overlays (VBottomSheet) use much higher z-indexes, so they
  // still cover this bar correctly without any extra coordination here.
  z-index: variables.$layout-overlay-z-index;
  display: flex;
  align-items: stretch;
  background: rgb(var(--v-theme-surface));
  block-size: 60px;
  border-block-start: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  box-shadow: 0 -2px 8px rgb(0 0 0 / 8%);
  inset-block-end: 0;
  inset-inline: 0;
  padding-block-end: env(safe-area-inset-bottom, 0);
}

.mobile-bottom-nav-item {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.6875rem;
  gap: 2px;
  line-height: 1;
  text-decoration: none;

  span {
    overflow: hidden;
    max-inline-size: 100%;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &.active {
    color: rgb(var(--v-theme-primary));
  }
}

.mobile-more-menu {
  max-block-size: 75vh;
  overflow-y: auto;
  padding-block-end: env(safe-area-inset-bottom, 0);
}

.mobile-more-menu-handle {
  position: sticky;
  z-index: 1;
  display: flex;
  justify-content: center;
  background: inherit;
  inset-block-start: 0;
  padding-block: 10px 2px;

  &::before {
    display: block;
    border-radius: 999px;
    background: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
    block-size: 4px;
    content: "";
    inline-size: 36px;
    opacity: 0.4;
  }
}

.mobile-menu-back {
  display: flex;
  align-items: center;
  border: none;
  background: none;
  color: rgb(var(--v-theme-on-surface));
  font-size: 0.9375rem;
  font-weight: 600;
  gap: 2px;
  margin-block-end: 4px;
  padding-block: 8px;
}

.mobile-menu-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px 4px;
  padding-block: 4px 12px;
}

.mobile-menu-tile {
  display: flex;
  flex: 0 0 calc(25% - 3px);
  flex-direction: column;
  align-items: center;
  padding: 0;
  border: none;
  background: none;
  color: rgb(var(--v-theme-on-surface));
  font: inherit;
  gap: 6px;
  max-inline-size: calc(25% - 3px);
  text-align: center;
  text-decoration: none;
}

.mobile-menu-tile-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: rgba(var(--v-theme-primary), 0.08);
  block-size: 48px;
  color: rgb(var(--v-theme-primary));
  inline-size: 48px;
}

.mobile-menu-tile-label {
  font-size: 0.6875rem;
  line-height: 1.15;
  max-inline-size: 100%;
}

.mobile-menu-tile.active {
  .mobile-menu-tile-icon {
    background: rgb(var(--v-theme-primary));
    color: rgb(var(--v-theme-on-primary));
  }

  .mobile-menu-tile-label {
    color: rgb(var(--v-theme-primary));
    font-weight: 600;
  }
}
</style>
