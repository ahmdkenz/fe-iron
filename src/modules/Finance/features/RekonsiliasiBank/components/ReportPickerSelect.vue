<template>
  <VSelect
    :model-value="modelValue"
    :items="reports"
    :loading="loading"
    item-value="id"
    variant="outlined"
    density="comfortable"
    hide-details
    class="report-picker"
    :style="xs ? 'min-width: 0' : 'min-width: 260px'"
    @update:model-value="v => $emit('update:modelValue', v)"
  >
    <template #prepend-inner>
      <VIcon
        icon="ri-bank-line"
        size="18"
        color="primary"
      />
    </template>

    <template #selection="{ item }">
      <span class="text-body-2 font-weight-medium text-truncate">
        {{ reportLabel(item.raw) }}
      </span>
    </template>

    <template #item="{ item, props: itemProps }">
      <VListItem
        v-bind="itemProps"
        :title="undefined"
      >
        <div class="d-flex flex-column">
          <span class="font-weight-medium">{{ reportLabel(item.raw) }}</span>
          <span class="text-caption text-medium-emphasis">{{ item.raw.nama_file }}</span>
        </div>
      </VListItem>
    </template>
  </VSelect>
</template>

<script setup>
import { useDisplay } from 'vuetify'
import { useFormatter } from '@/composables/useFormatter'

defineProps({
  modelValue: { type: [Number, String], default: null },
  reports: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})
defineEmits(['update:modelValue'])

const { xs } = useDisplay()
const { formatDate } = useFormatter()

function reportLabel(report) {
  if (!report) return ''
  const bank = report.bank_type && report.bank_type !== 'GENERAL' ? report.bank_type : 'Bank'

  return `${bank} · ${formatDate(report.periode_awal)} – ${formatDate(report.periode_akhir)}`
}
</script>

<style scoped>
.report-picker :deep(.v-field__input) {
  flex-wrap: nowrap;
}
</style>
