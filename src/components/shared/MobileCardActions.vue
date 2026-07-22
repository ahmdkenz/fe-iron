<template>
  <div class="mca">
    <!-- Aksi utama: Detail selalu terlihat agar 1-tap dan tidak "tersembunyi". -->
    <VBtn
      size="small"
      variant="tonal"
      color="info"
      prepend-icon="ri-eye-line"
      class="mca__detail"
      @click="emit('detail')"
    >
      {{ detailLabel }}
    </VBtn>

    <!-- Aksi sekunder & berisiko masuk menu titik tiga supaya kartu tidak ramai. -->
    <VMenu location="bottom end">
      <template #activator="{ props: menuProps }">
        <VBtn
          v-bind="menuProps"
          icon="ri-more-2-fill"
          size="small"
          variant="text"
          color="default"
          aria-label="Menu aksi lainnya"
        />
      </template>

      <VList
        density="compact"
        min-width="180"
      >
        <VListItem
          v-if="editable"
          prepend-icon="ri-pencil-line"
          title="Edit"
          @click="emit('edit')"
        />
        <VListItem
          v-if="deletable"
          prepend-icon="ri-delete-bin-line"
          title="Hapus"
          base-color="error"
          @click="emit('delete')"
        />

        <template v-if="selectable">
          <VDivider class="my-1" />
          <VListItem
            :prepend-icon="selected ? 'ri-checkbox-blank-circle-line' : 'ri-checkbox-circle-line'"
            :title="selected ? 'Batal pilih' : 'Pilih'"
            @click="emit('toggleSelect')"
          />
        </template>

        <!-- Slot opsional untuk aksi tambahan spesifik halaman. -->
        <slot name="menu-extra" />
      </VList>
    </VMenu>
  </div>
</template>

<script setup>
defineProps({
  selected: { type: Boolean, default: false },
  editable: { type: Boolean, default: true },
  deletable: { type: Boolean, default: true },
  selectable: { type: Boolean, default: true },
  detailLabel: { type: String, default: 'Detail' },
})

const emit = defineEmits(['detail', 'edit', 'delete', 'toggleSelect'])
</script>

<style scoped>
.mca {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.mca__detail {
  text-transform: none;
  letter-spacing: 0;
}
</style>
