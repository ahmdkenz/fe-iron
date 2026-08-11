<template>
  <BaseTable
    :headers="headers"
    :items="reports"
    :total="total"
    :loading="loading"
    pagination-mode="load-more"
    :has-more="hasMore"
    :loading-more="loadingMore"
    :loaded-count="reports.length"
    item-value="id"
    interactive-rows
    mobile-cards
    :row-props="rowProps"
    @load-more="$emit('load-more')"
    @row-activate="({ item }) => $emit('select-report', item)"
  >
    <template #mobile-card="{ item }">
      <div
        class="d-flex align-start justify-space-between gap-2"
        @click="$emit('select-report', item)"
      >
        <div class="font-weight-medium text-truncate">
          {{ item.nama_file }}
        </div>
        <span class="text-caption text-medium-emphasis flex-shrink-0">
          {{ item.created_at }}
        </span>
      </div>
      <div
        class="text-caption text-medium-emphasis mt-1"
        @click="$emit('select-report', item)"
      >
        {{ formatDate(item.periode_awal) }} – {{ formatDate(item.periode_akhir) }}
      </div>
      <div
        class="d-flex gap-1 flex-wrap mt-2"
        @click="$emit('select-report', item)"
      >
        <VChip
          color="success"
          size="x-small"
          variant="tonal"
        >
          {{ item.jumlah_matched }} MATCHED
        </VChip>
        <VChip
          color="error"
          size="x-small"
          variant="tonal"
        >
          {{ item.jumlah_unmatched }} UNMATCHED
        </VChip>
      </div>
      <div class="d-flex align-end justify-space-between gap-2 mt-2">
        <div>
          <div class="text-caption text-medium-emphasis">
            Total Kredit
          </div>
          <div class="font-weight-bold">
            {{ formatCurrency(item.total_kredit) }}
          </div>
        </div>
        <VBtn
          v-if="deletable"
          icon="ri-delete-bin-line"
          size="small"
          variant="tonal"
          color="error"
          aria-label="Hapus"
          @click="$emit('delete', item)"
        />
      </div>
    </template>

    <template #item.no="{ index }">
      {{ index + 1 }}
    </template>
    <template #item.periode="{ item }">
      {{ formatDate(item.periode_awal) }} — {{ formatDate(item.periode_akhir) }}
    </template>
    <template #item.total_kredit="{ item }">
      {{ formatCurrency(item.total_kredit) }}
    </template>
    <template #item.status="{ item }">
      <div class="d-flex gap-1 flex-wrap">
        <VChip
          color="success"
          size="x-small"
          variant="tonal"
        >
          {{ item.jumlah_matched }} MATCHED
        </VChip>
        <VChip
          color="error"
          size="x-small"
          variant="tonal"
        >
          {{ item.jumlah_unmatched }} UNMATCHED
        </VChip>
        <VChip
          color="grey"
          size="x-small"
          variant="tonal"
        >
          {{ item.total_transaksi - item.jumlah_matched - item.jumlah_unmatched }} lainnya
        </VChip>
      </div>
    </template>
    <template #item.aksi="{ item }">
      <VBtn
        v-if="deletable"
        size="x-small"
        variant="tonal"
        color="error"
        icon="ri-delete-bin-line"
        @click="$emit('delete', item)"
      />
    </template>
  </BaseTable>
</template>

<script setup>
import { useFormatter } from '@/composables/useFormatter'

const props = defineProps({
  reports: { type: Array, default: () => [] },
  total: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
  loadingMore: { type: Boolean, default: false },
  hasMore: { type: Boolean, default: false },
  selectedReportId: { type: [Number, String], default: null },
  deletable: { type: Boolean, default: true },
})

defineEmits(['select-report', 'delete', 'load-more'])

const { formatCurrency, formatDate } = useFormatter()

const headers = [
  { title: 'No',             key: 'no',          sortable: false, width: '50px' },
  { title: 'Tanggal Upload', key: 'created_at', sortable: false },
  { title: 'Nama File',      key: 'nama_file',   sortable: false },
  { title: 'Periode',        key: 'periode',     sortable: false },
  { title: 'Total Kredit',   key: 'total_kredit', sortable: false, align: 'end' },
  { title: 'Status Cocok',   key: 'status',      sortable: false },
  { title: 'Aksi',           key: 'aksi',        sortable: false, width: '70px' },
]

function rowProps(ctx) {
  return ctx.item.id === props.selectedReportId ? { class: 'tx-row--selected' } : {}
}
</script>

<style scoped>
:deep(.tx-row--selected) {
  background: rgba(var(--v-theme-primary), 0.06);
}
:deep(.tx-row--selected td:first-child) {
  border-left: 3px solid rgb(var(--v-theme-primary));
}

/* Ringkas lagi tampilan mobile-card khusus halaman ini (page-specific, aman
   diringkas langsung). nama_file/total kredit tanpa util ukuran ikut
   base-table-mobile-card__body; text-caption & VChip dikecilkan langsung. */
@media (max-width: 599.98px) {
  :deep(.base-table-mobile-card__body) {
    font-size: 0.8125rem !important;
  }

  .text-caption {
    font-size: 0.7rem !important;
  }

  :deep(.v-chip) {
    font-size: 0.65rem !important;
    --v-chip-height: 20px;
  }

  :deep(.base-table-mobile-card) {
    padding: 8px !important;
  }
}
</style>
