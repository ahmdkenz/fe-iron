<template>
  <VRow
    align="center"
    class="invoice-item-row mb-1"
  >
    <VCol
      cols="12"
      md="4"
    >
      <VAutocomplete
        :model-value="localItem.barang_id"
        label="Barang"
        density="compact"
        variant="outlined"
        :items="barangList"
        item-title="nama_barang"
        item-value="id"
        :loading="barangLoading"
        clearable
        hide-details
        @update:model-value="onBarangChange"
      >
        <template #item="{ props: p, item }">
          <VListItem
            v-bind="p"
            :title="item.raw.nama_barang"
            :subtitle="item.raw.kode_barang"
          />
        </template>
      </VAutocomplete>
    </VCol>

    <VCol
      cols="12"
      md="3"
    >
      <VTextField
        :model-value="localItem.nama_barang"
        label="Nama Barang"
        density="compact"
        variant="outlined"
        :rules="[v => !!v || 'Nama barang wajib diisi']"
        hide-details="auto"
        @update:model-value="value => updateField('nama_barang', value)"
      />
    </VCol>

    <VCol
      cols="6"
      md="1"
    >
      <VTextField
        :model-value="localItem.qty"
        label="Qty"
        density="compact"
        variant="outlined"
        type="number"
        min="0"
        :rules="[v => v > 0 || 'Qty > 0']"
        hide-details="auto"
        @update:model-value="value => updateNumberField('qty', value)"
      />
    </VCol>

    <VCol
      cols="6"
      md="1"
    >
      <VTextField
        :model-value="localItem.satuan"
        label="Satuan"
        density="compact"
        variant="outlined"
        hide-details
        @update:model-value="value => updateField('satuan', value)"
      />
    </VCol>

    <VCol
      cols="6"
      md="2"
    >
      <VTextField
        :model-value="localItem.harga_satuan"
        label="Harga Satuan"
        density="compact"
        variant="outlined"
        type="number"
        min="0"
        :rules="[v => v >= 0 || 'Harga harus >= 0']"
        prefix="Rp"
        hide-details="auto"
        @update:model-value="value => updateNumberField('harga_satuan', value)"
      />
    </VCol>

    <VCol
      cols="5"
      md="1"
    >
      <VTextField
        :model-value="formatNumber(localItem.subtotal)"
        label="Subtotal"
        density="compact"
        variant="outlined"
        prefix="Rp"
        readonly
        hide-details
      />
    </VCol>

    <VCol
      cols="1"
      md="auto"
    >
      <VBtn
        icon
        size="small"
        variant="text"
        color="error"
        @click="$emit('remove')"
      >
        <VIcon
          icon="ri-delete-bin-line"
          size="18"
        />
        <VTooltip activator="parent">
          Hapus Baris
        </VTooltip>
      </VBtn>
    </VCol>
  </VRow>
</template>

<script setup>
import { reactive, watch } from 'vue'

const createDefaultItem = () => ({
  barang_id: null,
  nama_barang: '',
  qty: 1,
  satuan: 'pcs',
  harga_satuan: 0,
  subtotal: 0,
  keterangan: '',
})

const props = defineProps({
  item: {
    type: Object,
    default: () => ({
      barang_id: null,
      nama_barang: '',
      qty: 1,
      satuan: 'pcs',
      harga_satuan: 0,
      subtotal: 0,
      keterangan: '',
    }),
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

const emit = defineEmits(['update:item', 'remove'])
const numberFormatter = new Intl.NumberFormat('id-ID')
const localItem = reactive(createDefaultItem())

syncLocalItem(props.item)

watch(() => props.item, value => {
  syncLocalItem(value)
})

function syncLocalItem(item = {}) {
  Object.assign(localItem, createDefaultItem(), item)
}

function emitItem() {
  emit('update:item', { ...localItem })
}

function updateField(field, value) {
  localItem[field] = value
  emitItem()
}

function updateNumberField(field, value) {
  localItem[field] = normalizeNumber(value)
  recalculate()
}

function onBarangChange(id) {
  localItem.barang_id = id ?? null

  const found = props.barangList.find(barang => barang.id === id)
  if (found) {
    localItem.nama_barang = found.nama_barang
    localItem.satuan = found.satuan ?? localItem.satuan
    localItem.harga_satuan = normalizeNumber(found.harga_beli ?? found.harga_jual ?? 0)
  }

  recalculate()
}

function recalculate() {
  localItem.subtotal = normalizeNumber(localItem.qty) * normalizeNumber(localItem.harga_satuan)
  emitItem()
}

function normalizeNumber(value) {
  const parsedValue = Number(value)

  return Number.isFinite(parsedValue) ? parsedValue : 0
}

function formatNumber(value) {
  if (!value)
    return '0'

  return numberFormatter.format(value)
}
</script>

<style scoped>
.invoice-item-row {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  padding-bottom: 4px;
}
</style>
