<template>
  <VAlert
    :type="type"
    variant="tonal"
  >
    <div class="d-flex align-center justify-space-between ga-2">
      <div class="font-weight-medium">
        {{ title }}
      </div>
      <VBtn
        variant="text"
        size="small"
        density="comfortable"
        :color="type"
        @click="open = !open"
      >
        {{ open ? 'Sembunyikan' : 'Lihat' }}
        <VIcon
          :icon="open ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'"
          end
        />
      </VBtn>
    </div>
    <VExpandTransition>
      <ul
        v-show="open"
        class="ps-4 mt-2"
      >
        <slot />
      </ul>
    </VExpandTransition>
  </VAlert>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  type: { type: String, default: 'info' },
  title: { type: String, required: true },
  defaultOpen: { type: Boolean, default: false },
})

const open = ref(props.defaultOpen)
</script>
