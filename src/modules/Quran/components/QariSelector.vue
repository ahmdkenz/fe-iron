<template>
  <VSelect
    :model-value="modelValue"
    :items="QARI_LIST"
    item-title="nama"
    item-value="kode"
    label="Qari"
    prepend-inner-icon="ri-mic-line"
    density="comfortable"
    variant="outlined"
    hide-details
    style="min-width: 240px"
    @update:model-value="onChange"
  />
</template>

<script setup>
import { QARI_LIST } from '@/constants/qari'

defineProps({
  modelValue: { type: String, required: true },
})

const emit = defineEmits(['update:modelValue'])

// Preferensi qari disimpan global (bukan per-user) — sekadar kenyamanan
// device, bukan data personal, jadi aman dipakai bersama di browser yang sama.
function onChange(value) {
  emit('update:modelValue', value)
  try {
    localStorage.setItem('quran:qari', value)
  } catch {
    // localStorage tidak tersedia (mis. private mode) — abaikan, cukup jadi non-persisten
  }
}
</script>
