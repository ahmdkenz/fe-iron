<template>
  <VDialog :model-value="modelValue" max-width="480" persistent scrollable @update:model-value="emit('update:modelValue', $event)">
    <VCard>
      <VCardTitle class="pa-4 pb-2"><span class="text-h6">Upload Bukti Bayar</span></VCardTitle>
      <VDivider />
      <VCardText class="pa-4">
        <div class="text-body-2 text-medium-emphasis mb-4">
          Lampirkan bukti transfer untuk pembayaran ini. Langkah ini opsional — Anda bisa langsung menekan "Cocokkan" tanpa upload.
        </div>
        <VFileInput
          :model-value="file"
          label="Bukti Bayar (Opsional)"
          density="compact"
          variant="outlined"
          accept="application/pdf,image/jpeg,image/jpg,image/png"
          prepend-icon=""
          prepend-inner-icon="ri-attachment-line"
          :rules="[
            v => { const f = Array.isArray(v) ? v[0] : v; return !f || f.size === undefined || f.size <= 10 * 1024 * 1024 || 'Ukuran file maksimal 10 MB' },
          ]"
          :error-messages="fileError ? [fileError] : []"
          hint="PDF, JPG, atau PNG — maks 10 MB"
          persistent-hint
          @update:model-value="emit('update:file', $event)"
        />

        <VAlert v-if="errorMessage" type="error" variant="tonal" class="mt-3" density="compact">{{ errorMessage }}</VAlert>
      </VCardText>
      <VDivider />
      <VCardActions class="pa-4">
        <VBtn variant="text" @click="emit('back')">
          <VIcon start size="16">ri-arrow-left-line</VIcon>Kembali
        </VBtn>
        <VSpacer />
        <AppActionButton action="batalkan" @click="emit('update:modelValue', false)" />
        <AppActionButton action="cocokkan" :loading="saving" @click="emit('confirm')" />
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script setup>
defineProps({
  modelValue: { type: Boolean, default: false },
  file: { type: [Array, File], default: () => [] },
  saving: { type: Boolean, default: false },
  errorMessage: { type: String, default: null },
  fileError: { type: String, default: null },
})

const emit = defineEmits(['update:modelValue', 'update:file', 'back', 'confirm'])
</script>
