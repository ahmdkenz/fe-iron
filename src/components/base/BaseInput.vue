<template>
  <VTextField
    v-bind="$attrs"
    :model-value="modelValue"
    :label="label"
    :rules="rules"
    variant="outlined"
    density="comfortable"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>

<script setup>
defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  rules: { type: Array, default: () => [] },
})
defineEmits(['update:modelValue'])
</script>
