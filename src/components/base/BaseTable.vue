<template>
  <div
    ref="rootEl"
    class="base-table-wrapper"
  >
    <VDataTableServer
      v-if="!isMobileCardView"
      class="base-table"
      :class="{ 'base-table--wrap-text': wrapText, 'base-table--layout-locked': layoutLocked }"
      v-bind="$attrs"
      :headers="resizedHeaders"
      :items="items"
      :items-length="total"
      :loading="loading"
      :items-per-page="perPage"
      :items-per-page-options="itemsPerPageOptions"
      :page="page"
      :item-value="itemValue"
      @update:options="handleOptionsUpdate"
    >
      <template
        v-for="(_, name) in $slots"
        #[name]="slotProps"
      >
        <slot
          :name="name"
          v-bind="slotProps ?? {}"
        />
      </template>
    </VDataTableServer>

    <div
      v-else
      class="base-table-mobile-list"
    >
      <div
        v-if="loading"
        class="base-table-mobile-state"
      >
        <VProgressCircular
          indeterminate
          color="primary"
          size="28"
        />
      </div>
      <div
        v-else-if="!items.length"
        class="base-table-mobile-state text-medium-emphasis"
      >
        Tidak ada data.
      </div>
      <template v-else>
        <div
          v-for="(item, index) in items"
          :key="item[itemValue] ?? index"
          class="base-table-mobile-card"
        >
          <VCheckbox
            v-if="showSelect"
            :model-value="isItemSelected(item)"
            hide-details
            density="compact"
            class="base-table-mobile-card__select"
            @update:model-value="() => toggleItemSelected(item)"
          />
          <div class="base-table-mobile-card__body">
            <slot
              name="mobile-card"
              :item="item"
              :index="index"
            />
          </div>
        </div>
      </template>

      <div
        v-if="totalPages > 1"
        class="base-table-mobile-pagination"
      >
        <VPagination
          :model-value="page"
          :length="totalPages"
          density="comfortable"
          size="small"
          total-visible="5"
          @update:model-value="p => handleOptionsUpdate({ page: p, itemsPerPage: perPage })"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'

const props = defineProps({
  headers: { type: Array, required: true },
  items: { type: Array, default: () => [] },
  total: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
  perPage: { type: Number, default: 10 },
  page: { type: Number, default: 1 },
  wrapText: { type: Boolean, default: false },
  resizableColumns: { type: Boolean, default: true },
  columnResizeKey: { type: String, default: '' },
  columnResizeMinWidth: { type: Number, default: 72 },
  mobileCards: { type: Boolean, default: false },
  itemValue: { type: String, default: 'id' },
})

const emit = defineEmits(['update:options'])

defineOptions({ inheritAttrs: false })

const attrs = useAttrs()
const display = useDisplay()

const isMobileCardView = computed(() => props.mobileCards && display.xs.value)
const totalPages = computed(() => Math.max(1, Math.ceil(props.total / (props.perPage || 1))))

// ─── Safe pagination defaults ──────────────────────────────────────────────
// Tabel server-side tidak boleh menawarkan opsi "Semua" secara default agar
// user tidak bisa tidak sengaja merender ribuan baris sekaligus.
const DEFAULT_ITEMS_PER_PAGE_OPTIONS = [10, 15, 25, 50, 100]
const MAX_SAFE_ITEMS_PER_PAGE = 100

const itemsPerPageOptions = computed(() =>
  attrs['items-per-page-options'] ?? attrs.itemsPerPageOptions ?? DEFAULT_ITEMS_PER_PAGE_OPTIONS,
)

const showSelect = computed(() => Boolean(attrs.showSelect ?? attrs['show-select']))

const selectedItems = computed(() => attrs.selected ?? [])

function isItemSelected(item) {
  return selectedItems.value.some(sel => sel[props.itemValue] === item[props.itemValue])
}

function toggleItemSelected(item) {
  const handler = attrs['onUpdate:selected']
  if (typeof handler !== 'function') return

  const current = selectedItems.value
  const idx = current.findIndex(sel => sel[props.itemValue] === item[props.itemValue])
  const next = idx === -1 ? [...current, item] : current.filter((_, i) => i !== idx)

  handler(next)
}

function handleOptionsUpdate(options) {
  const safeOptions = options.itemsPerPage === -1
    ? { ...options, itemsPerPage: MAX_SAFE_ITEMS_PER_PAGE }
    : options

  if (safeOptions.page === props.page && safeOptions.itemsPerPage === props.perPage)
    return

  emit('update:options', safeOptions)
}

// ─── Column resize ────────────────────────────────────────────────────────
const STORAGE_PREFIX = 'iron:table-column-widths:v1:'
const EDGE_ZONE = 8
const LOCKED_COLUMN_KEYS = ['no', 'actions', 'data-table-select', 'data-table-expand', 'data-table-group']

const route = useRoute()
const rootEl = ref(null)
const dragState = ref(null)
const storedWidths = ref({})
const measuredWidths = ref({})
const layoutLocked = ref(false)

const resizeStorageKey = computed(() => {
  if (props.columnResizeKey) return props.columnResizeKey

  const routeName = route?.name ? String(route.name) : 'table'
  const signature = props.headers.filter(header => header.key).map(header => header.key).join('|')

  return `${routeName}::${signature}`
})

watch(resizeStorageKey, key => {
  storedWidths.value = readStoredWidths(key)
  measuredWidths.value = {}
  layoutLocked.value = false
  nextTick(measureNaturalWidths)
}, { immediate: true })

// Kolom yang belum pernah di-resize manual & belum punya width dari halaman
// perlu diukur dulu dari lebar render alami (auto layout), lalu dikunci lewat
// table-layout: fixed - supaya lebar itu tidak dihitung ulang dari konten tiap render.
watch(
  () => [props.loading, props.items.length],
  ([loadingNow, length], prev) => {
    if (loadingNow || length === 0) return
    if (prev && prev[0] === loadingNow && prev[1] === length) return

    nextTick(measureNaturalWidths)
  },
  { immediate: true },
)

function measureNaturalWidths() {
  const root = rootEl.value
  if (!root) return

  const next = { ...measuredWidths.value }
  let changed = false

  root.querySelectorAll('th[data-column-key]').forEach(th => {
    const key = th.dataset.columnKey
    if (key in storedWidths.value || key in next) return

    const width = th.getBoundingClientRect().width
    if (width > 0) {
      next[key] = Math.round(width)
      changed = true
    }
  })

  if (changed) measuredWidths.value = next
  layoutLocked.value = true
}

function readStoredWidths(key) {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key)

    return raw ? JSON.parse(raw) : {}
  }
  catch {
    return {}
  }
}

function persistWidths() {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + resizeStorageKey.value, JSON.stringify(storedWidths.value))
  }
  catch {
    // localStorage tidak tersedia (privasi/kuota) - abaikan
  }
}

function parseWidthValue(value) {
  if (value == null || value === '') return null

  const num = typeof value === 'number' ? value : Number.parseFloat(value)

  return Number.isFinite(num) ? num : null
}

function isColumnLocked(header) {
  if (header.resizable === true) return false
  if (header.resizable === false) return true

  return LOCKED_COLUMN_KEYS.includes(header.key)
}

const resizedHeaders = computed(() => {
  return props.headers.map(header => {
    if (!header.key) return header

    const resizable = props.resizableColumns && !isColumnLocked(header)
    const stored = storedWidths.value[header.key]
    const measured = measuredWidths.value[header.key]
    const width = stored != null ? `${stored}px` : measured != null ? `${measured}px` : header.width

    return {
      ...header,
      ...(width != null ? { width } : {}),
      headerProps: {
        ...(header.headerProps || {}),
        class: [header.headerProps?.class, resizable && 'base-table__th--resizable'].filter(Boolean),
        'data-column-key': header.key,
        ...(resizable ? { 'data-column-resize-key': header.key } : {}),
      },
    }
  })
})

function findEdgeHeader(event) {
  const th = event.target.closest('th[data-column-resize-key]')
  if (!th) return null

  const rect = th.getBoundingClientRect()
  if (rect.right - event.clientX > EDGE_ZONE) return null

  return th
}

function suppressNextClick() {
  const handler = clickEvent => {
    clickEvent.preventDefault()
    clickEvent.stopPropagation()
  }

  window.addEventListener('click', handler, { capture: true, once: true })
}

function onPointerDown(event) {
  if (event.button !== 0) return

  const th = findEdgeHeader(event)
  if (!th) return

  event.preventDefault()
  suppressNextClick()

  const key = th.dataset.columnResizeKey
  const header = props.headers.find(h => h.key === key)

  dragState.value = {
    key,
    th,
    startX: event.clientX,
    startWidth: th.getBoundingClientRect().width,
    currentWidth: null,
    minWidth: parseWidthValue(header?.minWidth) ?? props.columnResizeMinWidth,
    maxWidth: parseWidthValue(header?.maxWidth),
  }

  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp, { once: true })
  document.body.classList.add('base-table-resizing')
}

function onPointerMove(event) {
  const state = dragState.value
  if (!state) return

  let width = Math.round(state.startWidth + (event.clientX - state.startX))
  width = Math.max(width, state.minWidth)
  if (state.maxWidth != null) width = Math.min(width, state.maxWidth)

  state.currentWidth = width
  state.th.style.width = `${width}px`
  state.th.style.minWidth = `${width}px`
}

function onPointerUp() {
  const state = dragState.value

  window.removeEventListener('pointermove', onPointerMove)
  document.body.classList.remove('base-table-resizing')
  dragState.value = null

  if (!state || state.currentWidth == null) return

  storedWidths.value = { ...storedWidths.value, [state.key]: state.currentWidth }
  persistWidths()
}

function onDblClick(event) {
  const th = findEdgeHeader(event)
  if (!th) return

  event.preventDefault()

  const key = th.dataset.columnResizeKey
  if (!(key in storedWidths.value)) return

  const next = { ...storedWidths.value }

  delete next[key]
  storedWidths.value = next
  persistWidths()

  th.style.width = ''
  th.style.minWidth = ''
}

onMounted(() => {
  rootEl.value?.addEventListener('pointerdown', onPointerDown)
  rootEl.value?.addEventListener('dblclick', onDblClick)
})

onBeforeUnmount(() => {
  rootEl.value?.removeEventListener('pointerdown', onPointerDown)
  rootEl.value?.removeEventListener('dblclick', onDblClick)
  window.removeEventListener('pointermove', onPointerMove)
  document.body.classList.remove('base-table-resizing')
})
</script>

<style scoped>
.base-table--wrap-text :deep(.v-table__wrapper > table) {
  min-width: 100%;
  width: max-content;
}

.base-table--wrap-text :deep(.v-table__wrapper > table > thead > tr > th),
.base-table--wrap-text :deep(.v-table__wrapper > table > tbody > tr > td) {
  height: auto;
  line-height: 1.4;
  overflow-wrap: normal;
  padding-block: 12px;
  white-space: normal;
  word-break: normal;
}

.base-table--wrap-text :deep(.v-table__wrapper > table > thead > tr > th) {
  min-height: var(--v-table-header-height);
}

.base-table--wrap-text :deep(.v-table__wrapper > table > tbody > tr > td) {
  min-height: var(--v-table-row-height);
}

.base-table--wrap-text :deep(.v-data-table-header__content) {
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  line-height: 1.35;
  overflow-wrap: normal;
  white-space: normal;
  word-break: normal;
}

.base-table--wrap-text :deep(.v-chip) {
  block-size: auto;
  max-inline-size: 100%;
}

.base-table--wrap-text :deep(.v-chip__content) {
  overflow-wrap: normal;
  text-align: start;
  white-space: normal;
  word-break: normal;
}

.base-table--layout-locked :deep(.v-table__wrapper > table) {
  table-layout: fixed;
  width: max-content;
  min-width: 100%;
}

.base-table:not(.base-table--wrap-text) :deep(.v-table__wrapper > table > thead > tr > th),
.base-table:not(.base-table--wrap-text) :deep(.v-table__wrapper > table > tbody > tr > td) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.base-table :deep(th.base-table__th--resizable) {
  position: relative;
}

.base-table :deep(th.base-table__th--resizable::after) {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  width: 6px;
  cursor: col-resize;
  z-index: 2;
  transition: background-color 0.15s ease;
}

.base-table :deep(th.base-table__th--resizable:hover::after),
.base-table :deep(th.base-table__th--resizable:active::after) {
  background-color: rgba(var(--v-theme-on-surface), 0.16);
}

.base-table-mobile-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 4px 2px;
}

.base-table-mobile-card {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 10px;
  padding: 12px;
  background: rgba(var(--v-theme-surface), 1);
}

.base-table-mobile-card__select {
  flex-shrink: 0;
  margin-top: -6px;
}

.base-table-mobile-card__body {
  flex: 1 1 auto;
  min-width: 0;
}

.base-table-mobile-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 0;
}

.base-table-mobile-pagination {
  display: flex;
  justify-content: center;
  padding-top: 8px;
}
</style>

<style>
body.base-table-resizing {
  cursor: col-resize !important;
  user-select: none !important;
}
</style>
