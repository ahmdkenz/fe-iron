<template>
  <div class="date-range-filter-sheet d-inline-block">
    <VBtn
      variant="tonal"
      color="primary"
      size="small"
      prepend-icon="ri-calendar-line"
      @click="open = true"
    >
      {{ triggerLabel }}
    </VBtn>

    <VBottomSheet v-model="open">
      <VCard class="date-range-filter-sheet__card">
        <VCardTitle class="d-flex align-center justify-space-between pa-4 pb-2">
          <span class="text-body-1 font-weight-medium">Filter Tanggal</span>
          <VBtn
            icon="ri-close-line"
            variant="text"
            size="small"
            @click="open = false"
          />
        </VCardTitle>
        <VDivider />
        <VCardText class="d-flex flex-column gap-4 pa-4">
          <VTextField
            :model-value="dari"
            label="Dari"
            type="date"
            density="compact"
            hide-details
            @update:model-value="$emit('update:dari', $event)"
          />
          <VTextField
            :model-value="sampai"
            label="Sampai"
            type="date"
            density="compact"
            hide-details
            @update:model-value="$emit('update:sampai', $event)"
          />
        </VCardText>
        <VDivider />
        <VCardText class="pa-4">
          <VBtn
            block
            color="primary"
            prepend-icon="ri-filter-3-line"
            @click="handleApply"
          >
            Terapkan
          </VBtn>
        </VCardText>
      </VCard>
    </VBottomSheet>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  dari: { type: String, default: '' },
  sampai: { type: String, default: '' },
  label: { type: String, default: 'Tanggal' },
})

const emit = defineEmits(['update:dari', 'update:sampai', 'apply'])

const open = ref(false)

const triggerLabel = computed(() => {
  if (!props.dari && !props.sampai) return props.label

  return `${shortDate(props.dari)} - ${shortDate(props.sampai)}`
})

function shortDate(iso) {
  if (!iso) return '...'

  const parts = iso.split('-')
  if (parts.length !== 3) return iso

  const [, month, day] = parts

  return `${day}/${month}`
}

function handleApply() {
  emit('apply')
  open.value = false
}
</script>

<style scoped>
.date-range-filter-sheet__card {
  border-radius: 16px 16px 0 0;
}
</style>
