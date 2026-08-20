<template>
  <Transition name="bulk-bar">
    <div
      v-if="selected.length"
      class="bulk-action-bar"
      :class="{ 'bulk-action-bar-above-nav': configStore.isLessThanOverlayNavBreakpoint }"
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
            :icon="xs || undefined"
            :prepend-icon="xs ? undefined : 'ri-whatsapp-line'"
            :aria-label="xs ? 'Kirim WA' : undefined"
            :disabled="isMultiClient"
            @click="emit('share')"
          >
            <VIcon
              v-if="xs"
              icon="ri-whatsapp-line"
              size="18"
            />
            <span v-else>Kirim WA</span>
            <VTooltip
              v-if="xs || isMultiClient"
              activator="parent"
            >
              {{ isMultiClient ? "Pilih invoice dari 1 klien saja untuk kirim WA. Gunakan 'Kirim Email' untuk lintas klien." : 'Kirim WA' }}
            </VTooltip>
          </VBtn>

          <VBtn
            color="info"
            variant="tonal"
            size="small"
            :icon="xs || undefined"
            :prepend-icon="xs ? undefined : 'ri-mail-send-line'"
            :aria-label="xs ? 'Kirim Email' : undefined"
            @click="emit('email')"
          >
            <VIcon
              v-if="xs"
              icon="ri-mail-send-line"
              size="18"
            />
            <span v-else>Kirim Email</span>
            <VTooltip
              v-if="xs"
              activator="parent"
            >
              Kirim Email
            </VTooltip>
          </VBtn>

          <AppActionButton
            v-if="showDelete && hasDraft"
            action="hapus"
            size="small"
            :compact="xs"
            @click="emit('delete')"
          />
        </div>

        <VSpacer />

        <AppActionButton
          action="custom"
          icon="ri-close-line"
          label="Batal Pilih"
          color="secondary"
          variant="text"
          size="small"
          :compact="xs"
          @click="emit('clear')"
        />
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'
import { useDisplay } from 'vuetify'
import { useConfigStore } from '@core/stores/config'

const props = defineProps({
  selected: { type: Array, default: () => [] },
  showDelete: { type: Boolean, default: true },
})

const emit = defineEmits(['share', 'email', 'delete', 'clear'])

const configStore = useConfigStore()
const { xs } = useDisplay()

// "Kirim WA" (wa.me, satu penerima) tidak bisa melayani selection lintas klien —
// itu sekarang jadi tugas "Kirim Email" (batch per PIC AR). Lihat ShareInvoicesDialog.vue.
const isMultiClient = computed(() =>
  new Set(props.selected.map(inv => inv.klien_ar_id ?? inv.klien_ar?.id).filter(Boolean)).size > 1,
)

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

/* Clear the fixed MobileBottomNav (60px + safe-area) so the bar stays tappable. */
.bulk-action-bar-above-nav {
  bottom: calc(60px + env(safe-area-inset-bottom, 0px) + 16px);
}

@media (max-width: 599.98px) {
  .bulk-action-bar {
    min-width: 0;
    max-width: calc(100vw - 32px);
    padding: 10px 14px;
  }
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
