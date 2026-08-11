<template>
  <VRow
    v-if="!xs"
    dense
  >
    <slot />
  </VRow>
  <VExpansionPanels
    v-else
    v-model="panel"
    variant="accordion"
    class="mt-2"
  >
    <VExpansionPanel value="more">
      <VExpansionPanelTitle>{{ title }}</VExpansionPanelTitle>
      <VExpansionPanelText eager>
        <VRow dense>
          <slot />
        </VRow>
      </VExpansionPanelText>
    </VExpansionPanel>
  </VExpansionPanels>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useDisplay } from 'vuetify'

const props = defineProps({
  title: { type: String, default: 'Detail Lainnya' },
  hasError: { type: Boolean, default: false },
})

const { xs } = useDisplay()

const panel = ref(null)

watch(() => props.hasError, val => {
  if (val) panel.value = 'more'
})
</script>
