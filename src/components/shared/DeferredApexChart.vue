<script setup>
import { computed, defineAsyncComponent, markRaw, onBeforeUnmount, shallowRef, useAttrs, watch } from 'vue'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps({
  type: {
    type: String,
    required: true,
  },
  height: {
    type: [Number, String],
    default: undefined,
  },
  width: {
    type: [Number, String],
    default: undefined,
  },
  options: {
    type: Object,
    required: true,
  },
  series: {
    type: Array,
    required: true,
  },
  delay: {
    type: Number,
    default: 0,
  },
})

const attrs = useAttrs()
const containerRef = ref(null)
const isVisible = useElementVisibility(containerRef)
const chartComponent = shallowRef(null)
let scheduledHandle = null
let delayHandle = null

const placeholderStyle = computed(() => {
  const normalizedHeight = normalizeLength(props.height, '320px')
  const normalizedWidth = normalizeLength(props.width, '100%')

  return {
    minHeight: normalizedHeight,
    width: normalizedWidth,
  }
})

watch(isVisible, visible => {
  if (visible)
    scheduleChartMount()
}, { immediate: true })

onBeforeUnmount(() => {
  clearScheduledHandle()
})

function scheduleChartMount() {
  if (chartComponent.value || scheduledHandle || delayHandle)
    return

  const mountChart = () => {
    scheduledHandle = null
    chartComponent.value = markRaw(defineAsyncComponent(() => import('vue3-apexcharts')))
  }

  const scheduleIdle = () => {
    delayHandle = null
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      scheduledHandle = window.requestIdleCallback(mountChart, { timeout: 600 })

      return
    }
    scheduledHandle = window.setTimeout(mountChart, 16)
  }

  if (props.delay > 0) {
    delayHandle = window.setTimeout(scheduleIdle, props.delay)

    return
  }

  scheduleIdle()
}

function clearScheduledHandle() {
  if (typeof window === 'undefined')
    return

  if (delayHandle !== null) {
    window.clearTimeout(delayHandle)
    delayHandle = null
  }

  if (!scheduledHandle)
    return

  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(scheduledHandle)
  } else {
    window.clearTimeout(scheduledHandle)
  }

  scheduledHandle = null
}

function normalizeLength(value, fallback) {
  if (value === undefined || value === null || value === '')
    return fallback

  if (typeof value === 'number')
    return `${value}px`

  return value
}
</script>

<template>
  <div
    ref="containerRef"
    class="deferred-apex-chart"
  >
    <Component
      :is="chartComponent"
      v-if="chartComponent"
      v-bind="attrs"
      :type="type"
      :height="height"
      :width="width"
      :options="options"
      :series="series"
    />
    <div
      v-else
      class="deferred-apex-chart__placeholder"
      :style="placeholderStyle"
      aria-hidden="true"
    />
  </div>
</template>

<style scoped>
.deferred-apex-chart {
  inline-size: 100%;
}

.deferred-apex-chart__placeholder {
  inline-size: 100%;
}
</style>
