<template>
  <div class="quran-audio-player d-flex align-center gap-3">
    <VBtn
      icon
      size="small"
      :color="isPlaying ? 'primary' : undefined"
      variant="tonal"
      :disabled="!src"
      @click="toggle"
    >
      <VIcon :icon="isPlaying ? 'ri-pause-fill' : 'ri-play-fill'" />
    </VBtn>

    <div class="flex-grow-1 min-width-0">
      <div
        v-if="label"
        class="text-caption text-truncate text-medium-emphasis"
      >
        {{ label }}
      </div>
      <VSlider
        :model-value="currentTime"
        :max="duration || 0"
        density="compact"
        hide-details
        color="primary"
        :disabled="!src"
        @update:model-value="seek"
      />
    </div>

    <span
      class="text-caption text-medium-emphasis text-no-wrap"
      style="min-width: 80px; text-align: right;"
    >
      {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
    </span>

    <audio
      ref="audioEl"
      :src="src"
      preload="none"
      @loadedmetadata="onLoadedMetadata"
      @timeupdate="onTimeUpdate"
      @play="isPlaying = true"
      @pause="isPlaying = false"
      @ended="onEnded"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  src: { type: String, default: '' },
  label: { type: String, default: '' },
  autoplay: { type: Boolean, default: false },
})

const emit = defineEmits(['ended'])

const audioEl = ref(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)

function onLoadedMetadata() {
  duration.value = audioEl.value?.duration || 0
}

function onTimeUpdate() {
  currentTime.value = audioEl.value?.currentTime || 0
}

function onEnded() {
  isPlaying.value = false
  emit('ended')
}

function toggle() {
  if (!audioEl.value) return

  if (isPlaying.value)
    audioEl.value.pause()
  else
    audioEl.value.play()
}

function seek(value) {
  if (audioEl.value)
    audioEl.value.currentTime = value
}

function formatTime(sec) {
  if (!sec || Number.isNaN(sec)) return '0:00'

  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60).toString().padStart(2, '0')

  return `${m}:${s}`
}

// Ganti src (mis. pindah ayat/qari) → reset posisi & lanjut putar otomatis
// kalau autoplay aktif (dipakai utk fitur "lanjut ke ayat berikutnya").
watch(() => props.src, () => {
  currentTime.value = 0
  duration.value = 0

  if (props.src && props.autoplay) {
    requestAnimationFrame(() => audioEl.value?.play())
  }
})

defineExpose({
  play: () => audioEl.value?.play(),
  pause: () => audioEl.value?.pause(),
})
</script>

<style scoped>
.quran-audio-player {
  width: 100%;
}
</style>
