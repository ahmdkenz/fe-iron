<template>
  <VCard
    class="invoice-item-card mb-3"
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
          Item Tagihan
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
        <!-- Baris 1: Kode Barang (readonly) + Nama Barang (select) -->
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
            placeholder="Opsional — isi manual atau otomatis dari pilihan"
            @update:model-value="value => updateField('kode_barang', value)"
          />
        </VCol>

        <VCol
          cols="12"
          sm="6"
        >
          <VCombobox
            :model-value="localItem.nama_barang"
            label="Nama Barang"
            density="compact"
            variant="outlined"
            :items="barangList"
            item-title="nama_barang"
            item-value="nama_barang"
            :loading="barangLoading"
            no-filter
            clearable
            hide-details="auto"
            :rules="[v => !!v || 'Nama barang wajib diisi']"
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

        <!-- Baris 1b: No Invoice Asal + Resto (khusus klien B2B/PT) -->
        <VCol
          v-if="showRestoFields"
          cols="12"
          sm="6"
        >
          <VTextField
            :model-value="localItem.no_invoice_resto"
            label="No Invoice Asal"
            density="compact"
            variant="outlined"
            prepend-inner-icon="ri-receipt-line"
            placeholder="Nomor invoice/dokumen asal"
            hide-details="auto"
            :rules="[v => !!v || 'No Invoice Asal wajib diisi']"
            @update:model-value="value => updateField('no_invoice_resto', value)"
          />
        </VCol>

        <VCol
          v-if="showRestoFields"
          cols="12"
          sm="6"
        >
          <VAutocomplete
            :model-value="localItem.kode_resto"
            label="Resto"
            density="compact"
            variant="outlined"
            prepend-inner-icon="ri-store-line"
            :items="restoOptions"
            item-title="nama_resto"
            item-value="kode_resto"
            :loading="restoLoading"
            hide-details="auto"
            :rules="[v => !!v || 'Resto wajib dipilih']"
            @update:model-value="onRestoChange"
          >
            <template #item="{ props: p, item }">
              <VListItem
                v-bind="p"
                :title="item.raw.nama_resto"
                :subtitle="item.raw.kode_resto"
              />
            </template>
          </VAutocomplete>
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

        <!-- Baris 3: Keterangan -->
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

const createDefaultItem = () => ({
  barang_id: null,
  kode_barang: '',
  nama_barang: '',
  qty: 1,
  satuan: 'pcs',
  harga_satuan: 0,
  subtotal: 0,
  keterangan: '',
  no_invoice_resto: '',
  kode_resto: '',
  nama_resto: '',
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
      no_invoice_resto: '',
      kode_resto: '',
      nama_resto: '',
    }),
  },
  restoOptions: {
    type: Array,
    default: () => [],
  },
  restoLoading: {
    type: Boolean,
    default: false,
  },
  showRestoFields: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:item', 'remove'])
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

// Data lama bisa punya barang_id tanpa kode_barang tersimpan; ambil satu kali
// langsung by-id (bukan dari daftar pencarian yang sekarang hanya sebagian).
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

function onRestoChange(kodeResto) {
  const resto = props.restoOptions.find(r => r.kode_resto === kodeResto)

  localItem.kode_resto = kodeResto ?? ''
  localItem.nama_resto = resto?.nama_resto ?? ''
  emitItem()
}

function updateNumberField(field, value) {
  localItem[field] = normalizeNumber(value)
  recalculate()
}

function onNamaBarangChange(value) {
  if (value && typeof value === 'object') {
    // User memilih dari dropdown
    localItem.barang_id    = value.id ?? null
    localItem.kode_barang  = value.kode_barang ?? localItem.kode_barang
    localItem.nama_barang  = value.nama_barang ?? ''
    localItem.satuan       = value.satuan ?? localItem.satuan
    localItem.harga_satuan = normalizeNumber(value.harga_beli ?? value.harga_jual ?? 0)
  } else {
    // User mengetik bebas
    localItem.barang_id   = null
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
  if (!value)
    return '0'

  return numberFormatter.format(value)
}
</script>

<style scoped>
.invoice-item-card {
  border-color: rgba(var(--v-border-color), var(--v-border-opacity));
  transition: border-color 0.2s;
}

.invoice-item-card:hover {
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
