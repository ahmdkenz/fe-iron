<template>
  <div
    ref="rootEl"
    class="base-table-wrapper"
  >
    <VDataTableServer
      class="base-table"
      :class="{ 'base-table--wrap-text': wrapText }"
      v-bind="$attrs"
      :headers="resizedHeaders"
      :items="items"
      :items-length="total"
      :loading="loading"
      :items-per-page="perPage"
      :page="page"
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
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

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
})

const emit = defineEmits(['update:options'])

defineOptions({ inheritAttrs: false })

function handleOptionsUpdate(options) {
  if (options.page === props.page && options.itemsPerPage === props.perPage)
    return

  emit('update:options', options)
}

// ─── Column resize ────────────────────────────────────────────────────────
const STORAGE_PREFIX = 'iron:table-column-widths:v1:'
const EDGE_ZONE = 8
const LOCKED_COLUMN_KEYS = ['no', 'actions', 'data-table-select', 'data-table-expand', 'data-table-group']

const route = useRoute()
const rootEl = ref(null)
const dragState = ref(null)
const storedWidths = ref({})

const resizeStorageKey = computed(() => {
  if (props.columnResizeKey) return props.columnResizeKey

  const routeName = route?.name ? String(route.name) : 'table'
  const signature = props.headers.filter(header => header.key).map(header => header.key).join('|')

  return `${routeName}::${signature}`
})

watch(resizeStorageKey, key => {
  storedWidths.value = readStoredWidths(key)
}, { immediate: true })

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
  if (!props.resizableColumns) return props.headers

  return props.headers.map(header => {
    if (!header.key || isColumnLocked(header)) return header

    const stored = storedWidths.value[header.key]

    return {
      ...header,
      ...(stored != null ? { width: `${stored}px` } : {}),
      headerProps: {
        ...(header.headerProps || {}),
        class: [header.headerProps?.class, 'base-table__th--resizable'].filter(Boolean),
        'data-column-resize-key': header.key,
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
</style>

<style>
body.base-table-resizing {
  cursor: col-resize !important;
  user-select: none !important;
}
</style>
