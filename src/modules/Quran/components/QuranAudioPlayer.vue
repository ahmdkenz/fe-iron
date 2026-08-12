<template>
  <div class="quran-audio-player d-flex align-center gap-3">
    <VBtn
      icon
      size="small"
      :color="playing ? 'primary' : undefined"
      variant="tonal"
      :disabled="disabled"
      @click="$emit('toggle')"
    >
      <VIcon :icon="playing ? 'ri-pause-fill' : 'ri-play-fill'" />
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
        :disabled="disabled"
        @update:model-value="$emit('seek', $event)"
      />
    </div>

    <span
      class="text-caption text-medium-emphasis text-no-wrap"
      style="min-width: 80px; text-align: right;"
    >
      {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
    </span>
  </div>
</template>

<script setup>
defineProps({
  playing: { type: Boolean, default: false },
  currentTime: { type: Number, default: 0 },
  duration: { type: Number, default: 0 },
  disabled: { type: Boolean, default: false },
  label: { type: String, default: '' },
})

defineEmits(['toggle', 'seek'])

function formatTime(sec) {
  if (!sec || Number.isNaN(sec)) return '0:00'

  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60).toString().padStart(2, '0')

  return `${m}:${s}`
}
</script>

<style scoped>
.quran-audio-player {
  width: 100%;
}
</style>
