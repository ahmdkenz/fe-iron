<template>
  <div class="ob-item-row">
    <VRow dense align="center">
      <!-- Baris 1: Kode Barang + Barang -->
      <VCol
        cols="12"
        sm="3"
      >
        <VTextField
          :model-value="localItem.kode_barang"
          label="Kode Barang"
          density="compact"
          variant="outlined"
          readonly
          hide-details
          placeholder="-"
          :bg-color="localItem.kode_barang ? undefined : 'surface'"
        />
      </VCol>

      <VCol
        cols="12"
        sm="7"
      >
        <VAutocomplete
          :model-value="localItem.barang_id"
          label="Barang / Jasa"
          density="compact"
          variant="outlined"
          :items="barangList"
          item-title="nama_barang"
          item-value="id"
          :loading="barangLoading"
          no-filter
          clearable
          hide-details
          @focus="() => barangList.length === 0 && searchBarangNow()"
          @update:search="searchBarang"
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
        sm="2"
        class="d-flex justify-end"
      >
        <VBtn
          icon
          size="x-small"
          variant="text"
          color="error"
          @click="$emit('remove')"
        >
          <VIcon
            icon="ri-delete-bin-line"
            size="16"
          />
          <VTooltip activator="parent">
            Hapus Item
          </VTooltip>
        </VBtn>
      </VCol>

      <!-- Baris 2: Qty + Satuan + Harga + Subtotal -->
      <VCol
        cols="6"
        sm="2"
      >
        <VTextField
          :model-value="localItem.qty"
          label="Qty"
          density="compact"
          variant="outlined"
          type="number"
          min="0"
          :rules="[v => Number(v) > 0 || 'Qty > 0']"
          hide-details="auto"
          @update:model-value="v => updateNumberField('qty', v)"
        />
      </VCol>

      <VCol
        cols="6"
        sm="2"
      >
        <VTextField
          :model-value="localItem.satuan"
          label="Satuan"
          density="compact"
          variant="outlined"
          hide-details
          @update:model-value="v => updateField('satuan', v)"
        />
      </VCol>

      <VCol
        cols="12"
        sm="4"
      >
        <VTextField
          :model-value="localItem.harga_satuan"
          label="Harga Satuan"
          density="compact"
          variant="outlined"
          type="number"
          min="0"
          prefix="Rp"
          :rules="[v => Number(v) >= 0 || 'Harga >= 0']"
          hide-details="auto"
          @update:model-value="v => updateNumberField('harga_satuan', v)"
        />
      </VCol>

      <VCol
        cols="12"
        sm="4"
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

      <!-- Baris 3: Keterangan -->
      <VCol cols="12">
        <VTextField
          :model-value="localItem.keterangan"
          label="Keterangan (opsional)"
          density="compact"
          variant="outlined"
          hide-details
          @update:model-value="v => updateField('keterangan', v)"
        />
      </VCol>
    </VRow>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'
import { useRemoteSearch } from '@/composables/useRemoteSearch'

const createDefault = () => ({
  barang_id: null,
  kode_barang: '',
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
      kode_barang: '',
      nama_barang: '',
      qty: 1,
      satuan: 'pcs',
      harga_satuan: 0,
      subtotal: 0,
      keterangan: '',
    }),
  },
})

const emit = defineEmits(['update:item', 'remove'])

const numberFormatter = new Intl.NumberFormat('id-ID')
const localItem = reactive(createDefault())

const { items: barangList, loading: barangLoading, search: searchBarang, searchNow: searchBarangNow, ensureItem: ensureBarangItem } = useRemoteSearch('/master/barang')

// Gunakan immediate:true agar sync terjadi saat mount tanpa perlu memanggil fungsi manual
watch(
  () => props.item,
  val => {
    Object.assign(localItem, createDefault(), val ?? {})
    if (!localItem.kode_barang && val?.barang?.kode_barang) {
      localItem.kode_barang = val.barang.kode_barang
    }
    if (localItem.barang_id) {
      ensureBarangItem({
        id: localItem.barang_id,
        nama_barang: localItem.nama_barang,
        kode_barang: localItem.kode_barang,
      })
    }
  },
  { immediate: true },
)

function emitItem() {
  emit('update:item', { ...localItem })
}

function updateField(field, value) {
  localItem[field] = value
  emitItem()
}

function updateNumberField(field, value) {
  localItem[field] = toNum(value)
  recalculate()
}

function onBarangChange(id) {
  localItem.barang_id = id ?? null
  const found = barangList.value.find(b => b.id === id)
  if (found) {
    localItem.kode_barang = found.kode_barang || ''
    localItem.nama_barang = found.nama_barang
    if (found.satuan) localItem.satuan = found.satuan
  } else {
    localItem.kode_barang = ''
  }
  recalculate()
}

function recalculate() {
  localItem.subtotal = toNum(localItem.qty) * toNum(localItem.harga_satuan)
  emitItem()
}

function toNum(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function formatNumber(v) {
  return v ? numberFormatter.format(v) : '0'
}
</script>

<style scoped>
.ob-item-row {
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.02);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
