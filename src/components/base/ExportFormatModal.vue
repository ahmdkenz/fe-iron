<template>
  <BaseModal
    v-model="isOpen"
    :title="title"
    confirm-label="Export"
    :loading="loading"
    @confirm="$emit('confirm')"
  >
    <div class="mb-2 text-caption text-medium-emphasis">
      Format File
    </div>
    <div class="d-flex gap-3 mb-3">
      <VCard
        v-for="opt in formatOptions"
        :key="opt.value"
        :variant="format === opt.value ? 'tonal' : 'outlined'"
        :color="format === opt.value ? 'primary' : undefined"
        class="cursor-pointer flex-1-1"
        @click="format = opt.value"
      >
        <VCardText class="pa-4 text-center">
          <VIcon
            :icon="opt.icon"
            :color="format === opt.value ? 'primary' : 'grey'"
            size="28"
            class="mb-2"
          />
          <div class="d-flex align-center justify-center gap-1">
            <span class="text-body-2 font-weight-semibold">{{ opt.label }}</span>
            <VIcon
              v-if="format === opt.value"
              icon="ri-checkbox-circle-fill"
              color="primary"
              size="16"
            />
          </div>
          <div class="text-caption text-medium-emphasis mt-1">
            {{ opt.caption }}
          </div>
        </VCardText>
      </VCard>
    </div>

    <!-- Peringatan, bukan blokir: tombol Export tetap aktif meski alert ini tampil. -->
    <VAlert
      v-if="format === 'xlsx' && rowCount > warnThreshold"
      type="warning"
      variant="tonal"
      density="compact"
    >
      Data cukup besar (&plusmn;{{ rowCountLabel }} baris).
      <template v-if="rowCount > severeThreshold">
        Untuk data sebesar ini, <strong>CSV</strong> jauh lebih cepat &amp; stabil dibanding XLSX &mdash; XLSX berisiko lambat atau gagal.
      </template>
      <template v-else>
        Sebaiknya gunakan <strong>CSV</strong> agar proses export lebih cepat &amp; stabil.
      </template>
    </VAlert>
  </BaseModal>
</template>

<script setup>
const props = defineProps({
  rowCount: { type: Number, default: null },
  title: { type: String, default: 'Export Data' },
  loading: { type: Boolean, default: false },
  warnThreshold: { type: Number, default: 13000 },
  severeThreshold: { type: Number, default: 50000 },
  formatOptions: {
    type: Array,
    default: () => [
      { value: 'xlsx', label: 'XLSX (Excel)', caption: 'Rapi & mudah dibaca, disarankan untuk data tidak terlalu besar', icon: 'ri-file-excel-line' },
      { value: 'csv', label: 'CSV', caption: 'Lebih cepat & stabil untuk data besar', icon: 'ri-file-text-line' },
    ],
  },
})

defineEmits(['confirm'])

const isOpen = defineModel({ type: Boolean, default: false })
const format = defineModel('format', { type: String, default: 'xlsx' })

const rowCountLabel = computed(() => (props.rowCount ?? 0).toLocaleString('id-ID'))
</script>
