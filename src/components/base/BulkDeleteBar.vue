<template>
  <Transition name="bulk-bar">
    <div
      v-if="selected.length > 0"
      class="bulk-bar-root"
      style="
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 2000;
        max-width: calc(100vw - 32px);
      "
    >
      <VCard
        elevation="8"
        rounded="pill"
      >
        <VCardText class="py-2 px-4">
          <div class="d-flex flex-wrap align-center justify-center gap-3">
            <span class="text-body-2 font-weight-medium text-no-wrap">
              {{ selected.length }} data dipilih
            </span>
            <VDivider vertical style="height: 20px;" class="d-none d-sm-block" />
            <VBtn
              color="error"
              size="small"
              variant="tonal"
              prepend-icon="ri-delete-bin-line"
              @click="$emit('delete')"
            >
              Hapus
            </VBtn>
            <VBtn
              size="small"
              variant="text"
              @click="$emit('clear')"
            >
              Batal Pilih
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  selected: { type: Array, default: () => [] },
})
defineEmits(['delete', 'clear'])
</script>

<style scoped>
.bulk-bar-enter-active,
.bulk-bar-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.bulk-bar-enter-from,
.bulk-bar-leave-to {
  transform: translateX(-50%) translateY(16px);
  opacity: 0;
}
</style>
