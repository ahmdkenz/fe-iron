<template>
  <VCard
    class="tagihan-item-card mb-3"
    variant="outlined"
    rounded="lg"
  >
    <div class="item-card-header">
      <div class="d-flex align-center gap-2">
        <VIcon
          icon="ri-list-unordered"
          size="15"
          class="text-medium-emphasis"
        />
        <span class="text-caption text-medium-emphasis font-weight-semibold text-uppercase">
          Item Tagihan {{ index !== null ? `#${index + 1}` : '' }}
        </span>
      </div>
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
          Hapus Baris
        </VTooltip>
      </VBtn>
    </div>

    <VDivider />

    <VCardText class="pa-3">
      <VRow dense>
        <VCol
          cols="12"
          sm="6"
        >
          <VTextField
            :model-value="localItem.kode_barang"
            label="Kode Barang"
            density="compact"
            variant="outlined"
            prepend-inner-icon="ri-barcode-line"
            hide-details="auto"
            placeholder="Opsional"
            @update:model-value="value => updateField('kode_barang', value)"
          />
        </VCol>

        <VCol
          cols="12"
          sm="6"
        >
          <VCombobox
            :model-value="localItem.nama_barang"
            label="Nama Barang / Jasa"
            density="compact"
            variant="outlined"
            :items="barangList"
            item-title="nama_barang"
            item-value="nama_barang"
            :loading="barangLoading"
            no-filter
            clearable
            hide-details="auto"
            :rules="[v => !!v || 'Nama barang/jasa wajib diisi']"
            @focus="() => barangList.length === 0 && searchBarangNow()"
            @update:search="searchBarang"
            @update:model-value="onNamaBarangChange"
          >
            <template #item="{ props: p, item }">
              <VListItem
                v-bind="p"
                :title="item.raw.nama_barang"
                :subtitle="item.raw.kode_barang"
              />
            </template>
          </VCombobox>
        </VCol>

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
            :rules="[v => v > 0 || 'Qty > 0']"
            hide-details="auto"
            @update:model-value="value => updateNumberField('qty', value)"
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
            @update:model-value="value => updateField('satuan', value)"
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
            :rules="[v => v >= 0 || 'Harga harus >= 0']"
            prefix="Rp"
            hide-details="auto"
            @update:model-value="value => updateNumberField('harga_satuan', value)"
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

        <VCol cols="12">
          <VTextField
            :model-value="localItem.keterangan"
            label="Keterangan"
            density="compact"
            variant="outlined"
            prepend-inner-icon="ri-chat-1-line"
            hide-details
            @update:model-value="value => updateField('keterangan', value)"
          />
        </VCol>
      </VRow>
    </VCardText>
  </VCard>
</template>

<script setup>
import { reactive, watch } from 'vue'
import { useRemoteSearch } from '@/composables/useRemoteSearch'
import api from '@/utils/axios'

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
  index: { type: Number, default: null },
})

const emit = defineEmits(['update:item', 'remove'])

const createDefaultItem = () => ({
  barang_id: null,
  kode_barang: '',
  nama_barang: '',
  qty: 1,
  satuan: 'pcs',
  harga_satuan: 0,
  subtotal: 0,
  keterangan: '',
})

const numberFormatter = new Intl.NumberFormat('id-ID')
const localItem = reactive(createDefaultItem())

const { items: barangList, loading: barangLoading, search: searchBarang, searchNow: searchBarangNow } = useRemoteSearch('/master/barang')

syncLocalItem(props.item)

watch(() => props.item, value => {
  syncLocalItem(value)
})

function syncLocalItem(item = {}) {
  Object.assign(localItem, createDefaultItem(), item)
  resolveKodeBarang()
}

async function resolveKodeBarang() {
  if (!localItem.barang_id || localItem.kode_barang) return

  try {
    const { data } = await api.get(`/master/barang/${localItem.barang_id}`)
    if (data.data?.kode_barang) localItem.kode_barang = data.data.kode_barang
  } catch {
    // biarkan kosong jika gagal, tidak kritikal untuk pengisian form
  }
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

function onNamaBarangChange(value) {
  if (value && typeof value === 'object') {
    localItem.barang_id = value.id ?? null
    localItem.kode_barang = value.kode_barang ?? localItem.kode_barang
    localItem.nama_barang = value.nama_barang ?? ''
    localItem.satuan = value.satuan ?? localItem.satuan
    localItem.harga_satuan = normalizeNumber(value.harga_beli ?? value.harga_jual ?? 0)
  } else {
    localItem.barang_id = null
    localItem.nama_barang = value ?? ''
    if (!localItem.kode_barang) localItem.kode_barang = ''
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
  if (!value) return '0'
  
  return numberFormatter.format(value)
}
</script>

<style scoped>
.tagihan-item-card {
  border-color: rgba(var(--v-border-color), var(--v-border-opacity));
  transition: border-color 0.2s;
}

.tagihan-item-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.4);
}

.item-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(var(--v-theme-on-surface), 0.03);
}
</style>
