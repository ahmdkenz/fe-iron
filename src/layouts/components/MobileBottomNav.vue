<script setup>
import { useConfigStore } from '@core/stores/config'
import { useAuthStore } from '@/stores/auth.store'

const props = defineProps({
  navItems: {
    type: Array,
    required: true,
  },
})

const configStore = useConfigStore()
const authStore = useAuthStore()
const route = useRoute()

// Dock bawah dikomposisi eksplisit per role — bukan lagi lewat flag generik
// di nav data, karena bentuknya beda secara struktural per role. Slot 'route'
// di-resolve dari props.navItems (sudah difilter role) supaya title/icon/badge
// tetap satu sumber kebenaran dengan nav data. Slot boleh override `to`/`icon`
// sendiri (mis. Profile) untuk rute yang sengaja tidak dimasukkan ke
// navigation/vertical (supaya tidak nyasar ke sidebar desktop). Tipe 'group'
// masih didukung resolvedDockItems untuk role lain di masa depan, meski tidak
// ada bucket yang memakainya saat ini.
const DOCK_CONFIG = {
  AR: [
    { type: 'route', name: 'dashboard' },
    { type: 'route', name: 'finance-klien-ar' },
    { type: 'route', name: 'finance-invoice-index' },
    { type: 'route', name: 'finance-ending-balance' },
  ],
  AP: [
    { type: 'route', name: 'ap-dashboard' },
    { type: 'route', name: 'ap-vendor-index' },
    { type: 'route', name: 'ap-tagihan-index' },
    { type: 'route', name: 'ap-pembayaran-index' },
  ],
  DEFAULT: [
    { type: 'route', name: 'dashboard' },
    { type: 'route', name: 'finance-invoice-index', label: 'Invoice' },
    { type: 'route', name: 'ap-tagihan-index', label: 'Tagihan' },
    {
      type: 'route',
      name: 'profile-settings',
      label: 'Profile',
      to: { name: 'profile-settings' },
      icon: 'ri-user-line',
    },
  ],
}

const dockBucket = computed(() => {
  if (authStore.isApOnly && !authStore.isArOnly)
    return 'AP'
  if (authStore.isArOnly && !authStore.isApOnly)
    return 'AR'

  // ADMIN/MANAGER/SUPERVISOR, dan kasus langka AR+AP tanpa role admin-tier.
  return 'DEFAULT'
})

const isMoreMenuOpen = ref(false)
const searchQuery = ref('')

// null = showing the top-level group grid; otherwise the heading drilled into.
const activeGroupHeading = ref(null)

// Peta heading → semua item di bawahnya (tanpa filter mobileNav), dipakai
// untuk deteksi active-state & badge tombol grup "AR"/"AP" di dock — harus
// tetap benar walau item tsb tidak (lagi) ditandai 'more'.
const rawGroupsByHeading = computed(() => {
  const map = {}
  let current = null

  props.navItems.forEach(item => {
    if ('heading' in item) {
      current = item.heading
      map[current] = []

      return
    }

    if (current)
      map[current].push(item)
  })

  return map
})

const isHeadingActive = heading => (rawGroupsByHeading.value[heading] ?? []).some(item => item.to?.name === route.name)
const headingHasBadge = heading => (rawGroupsByHeading.value[heading] ?? []).some(item => !!item.badgeContent)

function openGroupFromDock(heading) {
  searchQuery.value = ''
  activeGroupHeading.value = heading
  isMoreMenuOpen.value = true
}

function openMoreMenu() {
  searchQuery.value = ''
  isMoreMenuOpen.value = true
}

function toggleMoreMenu() {
  if (isMoreMenuOpen.value) {
    isMoreMenuOpen.value = false
    return
  }
  openMoreMenu()
}

const resolvedDockItems = computed(() => DOCK_CONFIG[dockBucket.value]
  .map(slot => {
    if (slot.type === 'group') {
      return {
        type: 'group',
        key: `group:${slot.heading}`,
        title: slot.label,
        icon: groupIcons[slot.heading] ?? 'ri-folder-2-line',
        heading: slot.heading,
        active: isHeadingActive(slot.heading) || (isMoreMenuOpen.value && activeGroupHeading.value === slot.heading),
        hasBadge: headingHasBadge(slot.heading),
      }
    }

    const navItem = props.navItems.find(item => item.to?.name === slot.name)

    // Role memfilter navItem-nya — jangan render slot dock yang datanya hilang.
    // Slot dengan `to`/`icon` sendiri (mis. Profile) tidak butuh entri di
    // navItems sama sekali — dock bawah sengaja terpisah dari sidebar desktop.
    if (!navItem && !slot.to)
      return null

    return {
      type: 'route',
      key: `route:${slot.name}`,
      title: slot.label ?? navItem?.title,
      icon: slot.icon ?? navItem?.icon?.icon,
      to: slot.to ?? navItem?.to,
      badgeContent: navItem?.badgeContent,
      active: route.name === (slot.to?.name ?? navItem?.to?.name),
    }
  })
  .filter(Boolean))

// Dock row dirender sebagai satu v-for, dengan sentinel { type: 'fab' } disisipkan
// di titik tengah supaya tombol "Lainnya" muncul sebagai FAB melingkar terangkat
// (bukan lagi item terakhir di baris) — jumlah dock item tiap bucket saat ini
// selalu genap (4), jadi split selalu rata 2 kiri/2 kanan.
const dockItemsWithFab = computed(() => {
  const items = resolvedDockItems.value
  const midpoint = Math.ceil(items.length / 2)

  return [
    ...items.slice(0, midpoint),
    { type: 'fab', key: 'fab' },
    ...items.slice(midpoint),
  ]
})

// Turn the flat heading/item list into { heading, items[] } groups so "Lainnya"
// can show a compact grid of group tiles first, drilling down into a group's
// own item grid on tap instead of listing everything at once.
// Hanya item bertanda `mobileNav: 'more'` yang masuk sini — item 'primary'
// sudah tampil di bottom nav dan sisanya sengaja disembunyikan dari menu mobile
// (tetap bisa diakses lewat URL langsung sesuai role, hanya tidak dipromosikan di sini).
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

    if (item.mobileNav === 'more')
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
  'ACCOUNT PAYABLE': 'ri-wallet-3-line',
  REKONSILIASI: 'ri-bank-line',
  LAPORAN: 'ri-file-chart-line',
}

const groupIcon = group => groupIcons[group.heading] ?? group.items[0]?.icon?.icon ?? 'ri-folder-2-line'

const activeGroup = computed(() => groupedNavItems.value.find(
  group => group.heading === activeGroupHeading.value,
) ?? null)

function openGroup(heading) {
  activeGroupHeading.value = heading
}

function closeGroup() {
  activeGroupHeading.value = null
}

// Hasil pencarian lintas grup — flatten semua item 'more' (yang memang sudah
// role-filtered lewat props.navItems) plus heading asalnya untuk ditampilkan
// sebagai breadcrumb kecil di tiap tile hasil.
const allMoreItemsFlat = computed(() => groupedNavItems.value.flatMap(
  group => group.items.map(item => ({ ...item, heading: group.heading })),
))

const isSearching = computed(() => searchQuery.value.trim().length > 0)

const searchResults = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return query
    ? allMoreItemsFlat.value.filter(item => item.title.toLowerCase().includes(query))
    : []
})

watch(() => route.name, () => {
  isMoreMenuOpen.value = false
})

watch(isMoreMenuOpen, isOpen => {
  if (!isOpen) {
    activeGroupHeading.value = null
    searchQuery.value = ''
  }
})
</script>

<template>
  <Teleport to="body">
    <nav
      v-if="configStore.isLessThanOverlayNavBreakpoint"
      class="mobile-bottom-nav"
      :class="{ 'mobile-bottom-nav--menu-open': isMoreMenuOpen }"
    >
      <template
        v-for="item in dockItemsWithFab"
        :key="item.key"
      >
        <RouterLink
          v-if="item.type === 'route'"
          :to="item.to"
          class="mobile-bottom-nav-item"
          :class="{ active: item.active }"
        >
          <VBadge
            :model-value="!!item.badgeContent"
            :content="item.badgeContent"
            color="error"
            location="top end"
          >
            <span class="mobile-bottom-nav-item-icon">
              <VIcon
                :icon="item.icon"
                size="22"
              />
            </span>
          </VBadge>
          <span class="mobile-bottom-nav-item-label">{{ item.title }}</span>
        </RouterLink>

        <button
          v-else-if="item.type === 'group'"
          type="button"
          class="mobile-bottom-nav-item"
          :class="{ active: item.active }"
          @click="openGroupFromDock(item.heading)"
        >
          <VBadge
            :model-value="item.hasBadge"
            dot
            color="error"
            location="top end"
          >
            <span class="mobile-bottom-nav-item-icon">
              <VIcon
                :icon="item.icon"
                size="22"
              />
            </span>
          </VBadge>
          <span class="mobile-bottom-nav-item-label">{{ item.title }}</span>
        </button>

        <div
          v-else
          class="mobile-bottom-nav-fab-slot"
        >
          <button
            type="button"
            class="mobile-bottom-nav-fab"
            :class="{ active: isMoreMenuOpen }"
            aria-label="Buka menu"
            @click="toggleMoreMenu"
          >
            <VIcon
              icon="ri-add-line"
              size="26"
              class="mobile-bottom-nav-fab-icon"
            />
          </button>
        </div>
      </template>
    </nav>

    <VBottomSheet
      v-if="configStore.isLessThanOverlayNavBreakpoint"
      v-model="isMoreMenuOpen"
      content-class="mobile-more-menu-overlay"
    >
      <VCard class="mobile-more-menu">
        <div class="mobile-more-menu-handle" />

        <VCardText>
          <div
            v-if="!activeGroup && !isSearching"
            class="mobile-menu-header"
          >
            Menu
          </div>

          <button
            v-if="activeGroup && !isSearching"
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

          <VTextField
            v-model="searchQuery"
            clearable
            hide-details
            density="compact"
            placeholder="Cari menu..."
            prepend-inner-icon="ri-search-line"
            class="mobile-menu-search"
          />

          <div class="mobile-menu-grid">
            <template v-if="isSearching">
              <RouterLink
                v-for="item in searchResults"
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
                <span class="mobile-menu-tile-heading">{{ item.heading }}</span>
                <span class="mobile-menu-tile-label">{{ item.title }}</span>
              </RouterLink>

              <p
                v-if="!searchResults.length"
                class="mobile-menu-empty"
              >
                Menu tidak ditemukan.
              </p>
            </template>

            <template v-else-if="!activeGroup">
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
  block-size: 64px;
  border-block-start: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  box-shadow: 0 -2px 8px rgb(0 0 0 / 8%);
  inset-block-end: 0;
  inset-inline: 0;
  padding-block-end: env(safe-area-inset-bottom, 0);

  // Di atas z-index VOverlay Vuetify (mulai 2000, +10/overlay yang ditumpuk)
  // supaya dock tidak ikut diredupkan scrim & tetap tappable selagi sheet
  // "Menu" terbuka. Kondisional, jadi tidak mengganggu stacking dialog/overlay
  // lain di luar interaksi ini.
  &--menu-open {
    z-index: 2500;
  }
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

  &.active {
    color: rgb(var(--v-theme-primary));
  }
}

.mobile-bottom-nav-item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  inline-size: 40px;
  block-size: 28px;
  transition: background-color 0.15s, color 0.15s;
}

.mobile-bottom-nav-item.active .mobile-bottom-nav-item-icon {
  background: rgba(var(--v-theme-primary), 0.14);
  color: rgb(var(--v-theme-primary));
  animation: mobile-nav-icon-pop 0.3s ease;
}

@keyframes mobile-nav-icon-pop {
  0% {
    transform: scale(1);
  }
  40% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1);
  }
}

// 👉 FAB tengah ("Lainnya" di-restyle) — lingkaran terangkat di atas garis dock,
// dengan morph ikon +/× dan feedback tekan supaya terasa jadi aksi utama.
.mobile-bottom-nav-fab-slot {
  display: flex;
  flex: 1 1 0;
  align-items: flex-start;
  justify-content: center;
  position: relative;
}

.mobile-bottom-nav-fab {
  position: absolute;
  inset-block-start: -22px;
  display: flex;
  align-items: center;
  justify-content: center;
  inline-size: 52px;
  block-size: 52px;
  border: 3px solid rgb(var(--v-theme-surface));
  border-radius: 50%;
  background: rgb(var(--v-theme-primary));
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.45), 0 2px 6px rgb(0 0 0 / 15%);
  color: rgb(var(--v-theme-on-primary));
  cursor: pointer;
  animation: mobile-nav-fab-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  transition: box-shadow 0.25s ease, transform 0.2s ease;

  &:active {
    transform: scale(0.9);
  }

  &.active {
    box-shadow: 0 6px 18px rgba(var(--v-theme-primary), 0.55), 0 2px 6px rgb(0 0 0 / 15%);
  }
}

.mobile-bottom-nav-fab-icon {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.mobile-bottom-nav-fab.active .mobile-bottom-nav-fab-icon {
  transform: rotate(45deg);
}

@keyframes mobile-nav-fab-pop {
  0% {
    transform: scale(0.4);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.mobile-bottom-nav-item-label {
  display: -webkit-box;
  overflow: hidden;
  min-block-size: 2.3em;
  max-inline-size: 100%;
  font-size: 0.6875rem;
  line-height: 1.15;
  overflow-wrap: break-word;
  text-align: center;
  white-space: normal;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.mobile-more-menu {
  max-block-size: 75vh;
  overflow-y: auto;
  padding-block-end: env(safe-area-inset-bottom, 0);
}

// Sheet berhenti di atas dock (bukan lagi flush ke viewport bottom) supaya
// tidak menutupi .mobile-bottom-nav — nilai sama dengan tinggi dock (64px)
// + safe area, meniru pola padding-block-end di DefaultLayoutWithVerticalNav.vue.
:deep(.mobile-more-menu-overlay) {
  margin-block-end: calc(64px + env(safe-area-inset-bottom, 0px)) !important;
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

.mobile-menu-header {
  color: rgb(var(--v-theme-on-surface));
  font-size: 0.9375rem;
  font-weight: 600;
  margin-block-end: 4px;
  padding-block: 8px;
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

.mobile-menu-search {
  margin-block-end: 8px;
}

.mobile-menu-empty {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.8125rem;
  padding-block: 24px;
  text-align: center;
  inline-size: 100%;
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

.mobile-menu-tile-heading {
  display: block;
  overflow: hidden;
  margin-block-end: 2px;
  max-inline-size: 100%;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.5625rem;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
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
