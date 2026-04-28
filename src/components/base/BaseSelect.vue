<template>
  <VSelect
    v-bind="$attrs"
    :model-value="modelValue"
    :label="label"
    :items="items"
    :rules="rules"
    :item-title="itemTitle"
    :item-value="itemValue"
    variant="outlined"
    density="comfortable"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>

<script setup>
defineProps({
  modelValue: { type: [String, Number, Object], default: null },
  label: { type: String, default: '' },
  items: { type: Array, default: () => [] },
  rules: { type: Array, default: () => [] },
  itemTitle: { type: String, default: 'title' },
  itemValue: { type: String, default: 'value' },
})
defineEmits(['update:modelValue'])
</script>
