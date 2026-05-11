<template>
  <div class="ob-detail-table">
    <div
      v-if="!readonly"
      class="ob-detail-table__header"
    >
      <div class="d-flex align-center gap-3 flex-wrap">
        <VChip
          :color="sumMatchesSaldo ? 'success' : (rows.length > 0 ? 'error' : 'secondary')"
          variant="tonal"
          size="small"
          label
        >
          <VIcon
            :icon="sumMatchesSaldo ? 'ri-check-line' : 'ri-error-warning-line'"
            size="14"
            class="me-1"
          />
          Total Sisa: {{ formatCurrency(totalSisa) }} / {{ formatCurrency(saldoAwal) }}
        </VChip>
      </div>

      <VBtn
        size="small"
        color="primary"
        variant="tonal"
        prepend-icon="ri-add-line"
        @click="addRow"
      >
        Tambah Invoice Asal
      </VBtn>
    </div>

    <VAlert
      v-if="!readonly && rows.length > 0 && !sumMatchesSaldo"
      type="error"
      variant="tonal"
      density="compact"
      class="ma-4"
    >
      Jumlah sisa tagihan rincian ({{ formatCurrency(totalSisa) }}) harus sama dengan saldo awal ({{ formatCurrency(saldoAwal) }}).
    </VAlert>

    <div
      v-if="rows.length === 0"
      class="ob-detail-table__empty"
    >
      <VIcon
        icon="ri-file-list-3-line"
        size="32"
        class="mb-2 text-medium-emphasis"
      />
      <p class="text-body-2 text-medium-emphasis mb-1">
        Belum ada rincian invoice asal
      </p>
      <p
        v-if="!readonly"
        class="text-caption text-medium-emphasis"
      >
        Klik "Tambah Invoice Asal" untuk mendaftarkan invoice-invoice asli yang membentuk saldo ini.
      </p>
      <p
        v-else
        class="text-caption text-medium-emphasis"
      >
        Opening balance ini dicatat sebagai lump sum tanpa rincian per invoice.
      </p>
    </div>

    <!-- Edit Mode -->
    <div
      v-else-if="!readonly"
      class="ob-detail-rows"
    >
      <VCard
        v-for="(row, i) in rows"
        :key="i"
        class="ob-detail-row mb-4"
        variant="outlined"
        rounded="lg"
      >
        <!-- Detail Header -->
        <div class="ob-detail-row__header">
          <div class="d-flex align-center gap-2">
            <VIcon
              icon="ri-file-text-line"
              size="15"
              class="text-medium-emphasis"
            />
            <span class="text-caption text-medium-emphasis font-weight-semibold text-uppercase">
              Invoice Asal #{{ i + 1 }}
            </span>
            <VChip
              v-if="row.items && row.items.length > 0"
              size="x-small"
              color="primary"
              variant="tonal"
              label
            >
              {{ row.items.length }} item
            </VChip>
          </div>
          <VBtn
            icon
            size="x-small"
            variant="text"
            color="error"
            @click="removeRow(i)"
          >
            <VIcon
              icon="ri-delete-bin-line"
              size="16"
            />
            <VTooltip activator="parent">
              Hapus Invoice Asal
            </VTooltip>
          </VBtn>
        </div>

        <VDivider />

        <!-- Detail Fields -->
        <VCardText class="pa-3">
          <VRow dense>
            <VCol
              cols="12"
              sm="4"
            >
              <VTextField
                v-model="row.no_invoice_asal"
                label="No. Invoice Asal"
                density="compact"
                variant="outlined"
                placeholder="Contoh: INV-2024-001"
                :rules="[v => !!v || 'No. invoice wajib diisi']"
                hide-details="auto"
                @input="emitRows"
              />
            </VCol>

            <VCol
              cols="12"
              sm="4"
            >
              <VTextField
                v-model="row.tanggal_invoice_asal"
                label="Tanggal Invoice Asal"
                density="compact"
                variant="outlined"
                type="date"
                :rules="[v => !!v || 'Tanggal wajib diisi']"
                hide-details="auto"
                @change="emitRows"
              />
            </VCol>

            <VCol
              cols="12"
              sm="4"
            >
              <VTextField
                v-model="row.deskripsi"
                label="Deskripsi"
                density="compact"
                variant="outlined"
                placeholder="Contoh: Penjualan Minyak Goreng"
                :rules="[v => !!v || 'Deskripsi wajib diisi']"
                hide-details="auto"
                @input="emitRows"
              />
            </VCol>

            <VCol
              cols="12"
              sm="4"
            >
              <VTextField
                :model-value="row.items && row.items.length > 0 ? calcItemsTotal(row.items) : row.jumlah_tagihan_asal"
                label="Jumlah Tagihan Asal (Rp)"
                density="compact"
                variant="outlined"
                type="number"
                min="0"
                prefix="Rp"
                :readonly="row.items && row.items.length > 0"
                :hint="row.items && row.items.length > 0 ? 'Dihitung otomatis dari item' : ''"
                :persistent-hint="row.items && row.items.length > 0"
                hide-details="auto"
                @update:model-value="v => { if (!(row.items && row.items.length > 0)) { row.jumlah_tagihan_asal = Number(v) || 0; emitRows() } }"
              />
            </VCol>

            <VCol
              cols="12"
              sm="4"
            >
              <VTextField
                v-model.number="row.sisa_tagihan_asal"
                label="Sisa Tagihan Asal (Rp)"
                density="compact"
                variant="outlined"
                type="number"
                min="0.01"
                prefix="Rp"
                :rules="[v => v > 0 || 'Harus > 0']"
                hide-details="auto"
                @input="emitRows"
              />
            </VCol>

            <VCol
              cols="12"
              sm="4"
            >
              <VTextField
                v-model="row.keterangan"
                label="Keterangan"
                density="compact"
                variant="outlined"
                hide-details
                @input="emitRows"
              />
            </VCol>
          </VRow>
        </VCardText>

        <!-- Items Section -->
        <VDivider />

        <div class="ob-items-section">
          <div class="ob-items-section__header">
            <div class="d-flex align-center gap-2">
              <VIcon
                icon="ri-list-check-2"
                size="14"
                class="text-medium-emphasis"
              />
              <span class="text-caption font-weight-semibold text-uppercase text-medium-emphasis">
                Item Invoice
              </span>
              <VChip
                size="x-small"
                color="secondary"
                variant="tonal"
                label
              >
                Opsional
              </VChip>
            </div>
            <VBtn
              size="x-small"
              color="primary"
              variant="tonal"
              prepend-icon="ri-add-line"
              @click="addItem(i)"
            >
              Tambah Item
            </VBtn>
          </div>

          <div
            v-if="!row.items || row.items.length === 0"
            class="ob-items-empty"
          >
            <span class="text-caption text-medium-emphasis">
              Belum ada item. Klik "Tambah Item" untuk mendetailkan barang/jasa dalam invoice ini.
            </span>
          </div>

          <div
            v-else
            class="ob-items-list"
          >
            <div
              v-for="(item, j) in row.items"
              :key="j"
              class="mb-2"
            >
              <OpeningBalanceDetailItemRow
                :item="item"
                :barang-list="barangList"
                :barang-loading="barangLoading"
                @update:item="v => updateItem(i, j, v)"
                @remove="removeItem(i, j)"
              />
            </div>

            <div class="ob-items-total">
              <span class="text-caption text-medium-emphasis">Total Item:</span>
              <span class="text-caption font-weight-bold ms-1">{{ formatCurrency(calcItemsTotal(row.items)) }}</span>
            </div>
          </div>
        </div>
      </VCard>
    </div>

    <!-- Readonly Mode -->
    <template v-else>
      <div
        v-for="(row, i) in rows"
        :key="i"
        class="ob-readonly-row"
      >
        <!-- Invoice header info -->
        <div class="ob-readonly-row__header">
          <div class="d-flex align-center gap-2 flex-wrap">
            <span class="text-caption text-medium-emphasis font-weight-semibold text-uppercase">
              #{{ i + 1 }}
            </span>
            <VChip
              size="small"
              color="secondary"
              variant="tonal"
              label
            >
              {{ row.no_invoice_asal }}
            </VChip>
            <span class="text-body-2">{{ row.deskripsi }}</span>
            <span class="text-caption text-medium-emphasis">{{ formatDate(row.tanggal_invoice_asal) }}</span>
          </div>
          <div class="d-flex gap-4 text-right">
            <div>
              <div class="text-caption text-medium-emphasis">
                Jumlah Tagihan
              </div>
              <div class="text-body-2 font-weight-medium">
                {{ formatCurrency(row.jumlah_tagihan_asal) }}
              </div>
            </div>
            <div>
              <div class="text-caption text-medium-emphasis">
                Sisa Tagihan
              </div>
              <div class="text-body-2 font-weight-bold text-primary">
                {{ formatCurrency(row.sisa_tagihan_asal) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Items sub-table (if any) -->
        <template v-if="row.items && row.items.length > 0">
          <VTable
            density="compact"
            class="ob-items-readonly-table"
          >
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Barang / Jasa</th>
                <th class="text-right">
                  Qty
                </th>
                <th>Satuan</th>
                <th class="text-right">
                  Harga Satuan
                </th>
                <th class="text-right">
                  Subtotal
                </th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, j) in row.items"
                :key="j"
              >
                <td>{{ j + 1 }}</td>
                <td>
                  <div>{{ item.nama_barang }}</div>
                  <div
                    v-if="item.barang?.kode_barang"
                    class="text-caption text-medium-emphasis"
                  >
                    {{ item.barang.kode_barang }}
                  </div>
                </td>
                <td class="text-right">
                  {{ item.qty }}
                </td>
                <td>{{ item.satuan || '-' }}</td>
                <td class="text-right">
                  {{ formatCurrency(item.harga_satuan) }}
                </td>
                <td class="text-right font-weight-medium">
                  {{ formatCurrency(item.subtotal) }}
                </td>
                <td class="text-medium-emphasis">
                  {{ item.keterangan || '-' }}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="ob-items-total-row">
                <td
                  colspan="5"
                  class="text-right font-weight-bold text-caption"
                >
                  Total
                </td>
                <td class="text-right font-weight-bold">
                  {{ formatCurrency(calcItemsTotal(row.items)) }}
                </td>
                <td />
              </tr>
            </tfoot>
          </VTable>
        </template>
        <div
          v-else
          class="ob-readonly-row__no-items"
        >
          <VIcon
            icon="ri-information-line"
            size="13"
            class="me-1"
          />
          Tidak ada rincian item untuk invoice ini
        </div>

        <VDivider
          v-if="i < rows.length - 1"
          class="my-2"
        />
      </div>

      <!-- Grand total -->
      <div
        v-if="rows.length > 0"
        class="ob-grand-total"
      >
        <span class="text-body-2 font-weight-bold">Total Sisa Tagihan</span>
        <span class="text-body-1 font-weight-bold text-primary">{{ formatCurrency(totalSisa) }}</span>
      </div>
    </template>
  </div>
</template>

<script setup>
/* eslint-disable camelcase */
import { computed, ref, watch } from 'vue'
import { useFormatter } from '@/composables/useFormatter'
import OpeningBalanceDetailItemRow from './OpeningBalanceDetailItemRow.vue'

const props = defineProps({
  details: {
    type: Array,
    default: () => [],
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  saldoAwal: {
    type: Number,
    default: 0,
  },
  barangList: {
    type: Array,
    default: () => [],
  },
  barangLoading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:details'])
const { formatCurrency, formatDate } = useFormatter()

const createRow = () => ({
  no_invoice_asal: '',
  tanggal_invoice_asal: '',
  deskripsi: '',
  jumlah_tagihan_asal: 0,
  sisa_tagihan_asal: 0,
  keterangan: '',
  items: [],
})

const createItem = () => ({
  barang_id: null,
  nama_barang: '',
  qty: 1,
  satuan: 'pcs',
  harga_satuan: 0,
  subtotal: 0,
  keterangan: '',
})

const rows = ref(props.details.map(d => ({ items: [], ...d })))

watch(() => props.details, val => {
  rows.value = val.map(d => ({ items: [], ...d }))
}, { deep: true })

const totalSisa = computed(() =>
  rows.value.reduce((sum, r) => sum + (Number(r.sisa_tagihan_asal) || 0), 0)
)

const sumMatchesSaldo = computed(() =>
  rows.value.length === 0 || Math.abs(totalSisa.value - props.saldoAwal) <= 0.01
)

function calcItemsTotal(items) {
  return (items ?? []).reduce((sum, it) => sum + (Number(it.subtotal) || 0), 0)
}

function addRow() {
  rows.value.push(createRow())
  emitRows()
}

function removeRow(index) {
  rows.value.splice(index, 1)
  emitRows()
}

function addItem(detailIndex) {
  if (!rows.value[detailIndex].items) {
    rows.value[detailIndex].items = []
  }
  rows.value[detailIndex].items.push(createItem())
  emitRows()
}

function updateItem(detailIndex, itemIndex, value) {
  rows.value[detailIndex].items[itemIndex] = value
  // Auto-sync jumlah_tagihan_asal when items exist
  rows.value[detailIndex].jumlah_tagihan_asal = calcItemsTotal(rows.value[detailIndex].items)
  emitRows()
}

function removeItem(detailIndex, itemIndex) {
  rows.value[detailIndex].items.splice(itemIndex, 1)
  rows.value[detailIndex].jumlah_tagihan_asal = calcItemsTotal(rows.value[detailIndex].items)
  emitRows()
}

function emitRows() {
  emit('update:details', rows.value.map(r => ({
    ...r,
    jumlah_tagihan_asal: r.items && r.items.length > 0
      ? calcItemsTotal(r.items)
      : r.jumlah_tagihan_asal,
  })))
}
</script>

<style scoped>
.ob-detail-table__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  flex-wrap: wrap;
  gap: 8px;
}

.ob-detail-table__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
  text-align: center;
}

.ob-detail-rows {
  padding: 8px 16px 16px;
}

.ob-detail-row {
  border-color: rgba(var(--v-border-color), var(--v-border-opacity));
  transition: border-color 0.2s;
}

.ob-detail-row:hover {
  border-color: rgba(var(--v-theme-primary), 0.4);
}

.ob-detail-row__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(var(--v-theme-on-surface), 0.03);
}

.ob-items-section {
  padding: 10px 12px 12px;
  background: rgba(var(--v-theme-primary), 0.02);
}

.ob-items-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-block-end: 10px;
}

.ob-items-empty {
  padding: 8px 4px;
}

.ob-items-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ob-items-total {
  margin-block-start: 8px;
  padding: 4px 12px;
  text-align: right;
  background: rgba(var(--v-theme-primary), 0.05);
  border-radius: 6px;
}

/* Readonly styles */
.ob-readonly-row {
  padding: 12px 16px;
}

.ob-readonly-row__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-block-end: 8px;
  flex-wrap: wrap;
}

.ob-readonly-row__no-items {
  padding: 6px 4px;
  font-size: 0.78rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  display: flex;
  align-items: center;
}

.ob-items-readonly-table {
  width: 100%;
  margin-block-start: 4px;
}

.ob-items-total-row td {
  background: rgba(var(--v-theme-primary), 0.05);
  border-top: 1px solid rgba(var(--v-theme-primary), 0.2);
}

.ob-grand-total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(var(--v-theme-primary), 0.06);
  border-top: 2px solid rgba(var(--v-theme-primary), 0.2);
}
</style>
