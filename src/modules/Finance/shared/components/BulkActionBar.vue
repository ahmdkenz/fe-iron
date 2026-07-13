<template>
  <Transition name="bulk-bar">
    <div
      v-if="selected.length"
      class="bulk-action-bar"
    >
      <div class="d-flex align-center gap-3 flex-wrap">
        <div class="d-flex align-center gap-2">
          <VAvatar
            color="primary"
            variant="tonal"
            size="32"
          >
            <VIcon
              icon="ri-checkbox-multiple-line"
              size="18"
            />
          </VAvatar>
          <span class="text-body-2 font-weight-semibold">
            {{ selected.length }} item dipilih
          </span>
        </div>

        <VDivider
          vertical
          class="bulk-divider"
        />

        <div class="d-flex gap-2 flex-wrap">
          <VBtn
            color="success"
            variant="tonal"
            size="small"
            prepend-icon="ri-whatsapp-line"
            :disabled="!canShare"
            @click="emit('share')"
          >
            Kirim WA
            <VTooltip
              v-if="!canShare"
              activator="parent"
            >
              Pilih satu klien yang sama untuk berbagi via WhatsApp
            </VTooltip>
          </VBtn>

          <AppActionButton
            action="hapus"
            size="small"
            :disabled="!hasDraft"
            @click="emit('delete')"
          >
            Hapus Data
            <VTooltip
              v-if="!hasDraft"
              activator="parent"
            >
              Tidak ada invoice DRAFT yang bisa dihapus
            </VTooltip>
          </AppActionButton>
        </div>

        <VSpacer />

        <VBtn
          variant="text"
          color="secondary"
          size="small"
          prepend-icon="ri-close-line"
          @click="emit('clear')"
        >
          Batal Pilih
        </VBtn>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  selected: { type: Array, default: () => [] },
})

const emit = defineEmits(['share', 'delete', 'clear'])

const canShare = computed(() => {
  if (!props.selected.length) return false
  const ids = props.selected.map(inv => inv.klien_ar_id ?? inv.klien_ar?.id)
  return new Set(ids).size === 1
})

const hasDraft = computed(() => props.selected.some(inv => inv.status === 'DRAFT'))
</script>

<style scoped>
.bulk-action-bar {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  padding: 12px 20px;
  min-width: 360px;
  max-width: calc(100vw - 48px);
}

.bulk-divider {
  height: 28px;
  align-self: center;
}

.bulk-bar-enter-active,
.bulk-bar-leave-active {
  transition: all 0.25s ease;
}

.bulk-bar-enter-from,
.bulk-bar-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(16px);
}
</style>
