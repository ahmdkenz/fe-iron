<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  status: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'close'])

const isProcessing = computed(() => ['queued', 'processing'].includes(props.status?.status))
const isDone = computed(() => ['completed', 'failed'].includes(props.status?.status))

const progressPercent = computed(() => {
  const s = props.status
  if (!s?.total) return 0

  return Math.min(100, Math.round(((s.processed ?? 0) / s.total) * 100))
})

const alertType = computed(() => {
  const s = props.status
  if (!s) return 'info'
  if (s.status === 'failed') return 'error'
  if (s.failed?.length) return 'warning'

  return 'success'
})

// Pesan hasil dibuat identik dengan yang dipakai sebelumnya di flow sinkron,
// hanya sumbernya sekarang dari payload polling status batch, bukan respons
// langsung PATCH bulk-approve.
const resultText = computed(() => {
  const s = props.status
  if (!s) return ''
  if (s.status === 'failed') {
    return s.message
      || `Proses approve semua gagal. ${s.approved ?? 0} dari ${s.total ?? 0} sempat berhasil disetujui sebelum gagal.`
  }
  if (s.failed?.length) {
    return `${s.approved} dari ${s.total} Opening Balance berhasil disetujui. ${s.failed.length} gagal — coba lagi untuk item yang tersisa.`
  }

  return `${s.approved} Opening Balance berhasil disetujui.`
})
</script>

<template>
  <VDialog
    :model-value="modelValue"
    max-width="440"
    persistent
    @update:model-value="v => emit('update:modelValue', v)"
  >
    <VCard>
      <VCardTitle class="pa-4">
        Approve Semua Opening Balance
      </VCardTitle>
      <VDivider />
      <VCardText class="pt-4 d-flex flex-column gap-4">
        <template v-if="isProcessing">
          <div class="d-flex align-center gap-3">
            <VProgressCircular
              indeterminate
              color="success"
              size="28"
            />
            <span class="text-body-2">
              {{ status?.status === 'queued'
                ? 'Menunggu diproses...'
                : `Menyetujui ${status?.processed ?? 0} dari ${status?.total ?? 0}...` }}
            </span>
          </div>
          <VProgressLinear
            :model-value="progressPercent"
            color="success"
            height="8"
            rounded
          />
        </template>
        <template v-else-if="isDone">
          <VAlert
            :type="alertType"
            density="compact"
            variant="tonal"
          >
            {{ resultText }}
          </VAlert>
          <div
            v-if="status?.failed?.length"
            style="max-height: 200px; overflow-y: auto;"
          >
            <div class="text-caption text-medium-emphasis mb-1">
              Detail gagal:
            </div>
            <VTable density="compact">
              <tbody>
                <tr
                  v-for="f in status.failed"
                  :key="f.id"
                >
                  <td class="text-caption">
                    #{{ f.id }}
                  </td>
                  <td class="text-caption">
                    {{ f.message }}
                  </td>
                </tr>
              </tbody>
            </VTable>
          </div>
        </template>
      </VCardText>
      <VCardActions
        v-if="isDone"
        class="pa-4 pt-0 justify-end"
      >
        <VBtn
          color="primary"
          variant="tonal"
          @click="emit('close')"
        >
          Tutup
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped>
/* Ringkas lagi tampilan mobile khusus dialog ini (page-specific, aman
   diringkas langsung). */
@media (max-width: 599.98px) {
  :deep(.v-card-title) {
    padding: 12px !important;
    font-size: 0.9rem !important;
  }

  :deep(.v-card-text) {
    padding: 12px !important;
  }

  :deep(.v-card-actions) {
    padding: 10px 12px !important;
  }

  .text-body-2 {
    font-size: 0.8125rem !important;
  }

  .text-caption {
    font-size: 0.7rem !important;
  }

  :deep(.v-table) {
    font-size: 0.75rem !important;
  }
}
</style>
