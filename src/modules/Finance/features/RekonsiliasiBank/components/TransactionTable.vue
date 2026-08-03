<template>
  <div>
    <VTextField
      v-model="params.search"
      placeholder="Cari No Ref Bank..."
      clearable
      hide-details
      density="compact"
      style="max-width: 280px"
      class="mb-3"
      prepend-inner-icon="ri-search-line"
      @update:model-value="onSearchInput"
    />

    <BaseTable
      :headers="headers"
      :items="rows"
      :total="meta.total"
      :loading="loading"
      :per-page="meta.per_page"
      :page="meta.current_page"
      item-value="id"
      interactive-rows
      mobile-cards
      :row-props="rowProps"
      @update:options="onTableOptions"
      @row-activate="$emit('select-row', $event)"
    >
    <template #mobile-card="{ item }">
      <div
        class="d-flex align-center justify-space-between gap-2"
        @click="$emit('select-row', item)"
      >
        <span class="text-caption font-weight-medium">{{ item.tanggal }}</span>
        <VChip
          :color="statusColor(item.status_cocok)"
          size="small"
          variant="tonal"
          label
        >
          {{ item.status_cocok }}
        </VChip>
      </div>
      <div
        class="text-body-2 font-weight-medium mt-1 text-truncate"
        @click="$emit('select-row', item)"
      >
        {{ item.keterangan }}
      </div>
      <div
        v-if="item.no_referensi"
        class="text-caption text-primary"
        @click="$emit('select-row', item)"
      >
        {{ item.no_referensi }}
      </div>
      <div
        class="d-flex align-center justify-space-between mt-2"
        @click="$emit('select-row', item)"
      >
        <span
          v-if="item.kredit > 0"
          class="text-subtitle-2 font-weight-bold text-success"
        >+{{ formatCurrency(item.kredit) }}</span>
        <span
          v-else
          class="text-subtitle-2 font-weight-bold text-warning"
        >-{{ formatCurrency(item.debit) }}</span>
        <VIcon
          icon="ri-arrow-right-s-line"
          size="18"
          class="text-medium-emphasis"
        />
      </div>
    </template>

    <template #item.no="{ index }">
      {{ (meta.current_page - 1) * meta.per_page + index + 1 }}
    </template>
    <template #item.debit="{ item }">
      <span
        v-if="item.debit > 0"
        class="text-warning font-weight-medium"
      >{{ formatCurrency(item.debit) }}</span>
      <span
        v-else
        class="text-disabled"
      >-</span>
    </template>
    <template #item.kredit="{ item }">
      <span
        v-if="item.kredit > 0"
        class="text-success font-weight-medium"
      >{{ formatCurrency(item.kredit) }}</span>
      <span
        v-else
        class="text-disabled"
      >-</span>
    </template>
    <template #item.saldo="{ item }">
      {{ formatCurrency(item.saldo) }}
    </template>
    <template #item.status_cocok="{ item }">
      <VChip
        :color="statusColor(item.status_cocok)"
        size="x-small"
        variant="tonal"
        label
      >
        {{ item.status_cocok }}
      </VChip>
    </template>
    <template #item.no_referensi="{ item }">
      <span
        v-if="item.no_referensi"
        class="text-caption font-weight-medium text-primary"
      >{{ item.no_referensi }}</span>
      <span
        v-else
        class="text-disabled"
      >-</span>
    </template>
    <template #item.pembayaran="{ item }">
      <div
        v-if="item.pembayaran"
        class="text-caption"
      >
        <div class="font-weight-medium">
          {{ item.pembayaran.no_referensi || '-' }}
        </div>
        <RouterLink
          v-if="item.pembayaran.invoice_id"
          :to="{ name: 'finance-invoice-show', params: { id: item.pembayaran.invoice_id } }"
          class="text-primary text-decoration-none"
        >
          {{ item.pembayaran.no_invoice }}
        </RouterLink>
        <VChip
          v-else-if="item.pembayaran.jumlah_invoice"
          size="x-small"
          color="primary"
          variant="tonal"
          label
        >
          {{ item.pembayaran.jumlah_invoice }} Invoice
        </VChip>
        <div class="text-medium-emphasis">
          {{ item.pembayaran.klien ?? item.pembayaran.vendor }}
        </div>
      </div>
      <span
        v-else
        class="text-disabled"
      >-</span>
    </template>
    <template #item.selisih_bank="{ item }">
      <template v-if="item.selisih_bank !== null && item.selisih_bank !== undefined">
        <VChip
          v-if="item.selisih_bank === 0"
          color="success"
          size="x-small"
          variant="tonal"
        >
          Rp 0
        </VChip>
        <span
          v-else
          :class="item.selisih_bank > 0 ? 'text-error font-weight-medium' : 'text-warning font-weight-medium'"
        >
          {{ item.selisih_bank > 0 ? '+' : '-' }}{{ formatCurrency(Math.abs(item.selisih_bank)) }}
        </span>
      </template>
      <span
        v-else
        class="text-disabled"
      >-</span>
    </template>
    <template #item.matched_by="{ item }">
      <span
        v-if="item.matched_by"
        class="text-caption font-weight-medium"
      >{{ item.matched_by }}</span>
      <span
        v-else-if="item.status_cocok === 'MATCHED'"
        class="text-caption font-weight-medium"
      >{{ uploadedBy }}</span>
      <span
        v-else
        class="text-disabled"
      >-</span>
    </template>
    <template #item.kelebihan="{ item }">
      <div
        v-if="item.kelebihan_bayar?.sisa > 0"
        class="d-flex flex-column align-start gap-1"
      >
        <span class="text-caption text-error font-weight-medium">
          {{ formatCurrency(item.kelebihan_bayar.sisa) }}
        </span>
        <AppActionButton
          v-if="item.can_manage_match"
          action="gunakan"
          label="Alokasikan / PDM"
          size="x-small"
          @click="$emit('kelebihan', item)"
        />
      </div>
      <div
        v-else-if="item.kelebihan_bayar?.total > 0"
        class="d-flex flex-column align-start gap-1"
      >
        <VChip
          v-if="item.kelebihan_bayar?.pdm?.status === 'AKTIF'"
          size="x-small"
          color="deep-purple"
          variant="tonal"
        >
          PDM
        </VChip>
        <VChip
          v-else
          size="x-small"
          color="success"
          variant="tonal"
        >
          Teralokasi
        </VChip>
      </div>
      <span
        v-else
        class="text-disabled"
      >-</span>
    </template>
    <template #item.aksi="{ item }">
      <div class="d-flex gap-1 align-center flex-wrap">
        <template v-if="(item.status_cocok === 'UNMATCHED' || item.status_cocok === 'POSSIBLE') && canProcessRow(item)">
          <AppActionButton
            action="cocokkan"
            size="x-small"
            @click="$emit('cocokkan', item)"
          />
          <VBtn
            size="x-small"
            variant="text"
            color="grey"
            :loading="abaikanLoadingId === item.id"
            @click="$emit('abaikan', item)"
          >
            Abaikan
          </VBtn>
        </template>
        <template v-else-if="item.status_cocok === 'MATCHED'">
          <AppActionButton
            v-if="item.can_manage_match && !item.has_approved_koreksi"
            action="batalkan"
            icon="ri-link-unlink"
            size="x-small"
            :loading="unmatchLoadingId === item.id"
            @click="$emit('unmatch', item)"
          />
          <VChip
            v-if="item.status_posting_2 === 'POSTED'"
            color="success"
            size="x-small"
            variant="tonal"
            label
          >
            <VIcon
              start
              size="12"
            >
              ri-check-line
            </VIcon>Sudah Posting
          </VChip>
          <VChip
            v-else
            color="grey"
            size="x-small"
            variant="tonal"
            label
          >
            Belum Posting
          </VChip>
        </template>
        <span
          v-else
          class="text-disabled"
        >-</span>
      </div>
    </template>
    </BaseTable>
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue'
import { useCrud } from '@/composables/useCrud'
import { useFormatter } from '@/composables/useFormatter'

const props = defineProps({
  reportId: { type: [Number, String], required: true },
  status: { type: String, default: 'SEMUA' },
  selectedId: { type: [Number, String], default: null },
  canProcessRow: { type: Function, required: true },
  uploadedBy: { type: String, default: null },
  abaikanLoadingId: { type: [Number, String], default: null },
  unmatchLoadingId: { type: [Number, String], default: null },
})

const emit = defineEmits(['select-row', 'cocokkan', 'abaikan', 'unmatch', 'kelebihan', 'options-change'])

const { formatCurrency } = useFormatter()

const statusColor = s => ({ MATCHED: 'success', POSSIBLE: 'warning', UNMATCHED: 'error', DIABAIKAN: 'grey' }[s] ?? 'grey')

const { items: rows, loading, meta, params, fetchList } =
  useCrud(`/finance/rekonsiliasi-bank/${props.reportId}/details`)

params.status = props.status
params.per_page = 15

const headers = [
  { title: 'No',             key: 'no',            sortable: false, width: '50px' },
  { title: 'Tanggal',        key: 'tanggal',       sortable: false, width: '110px' },
  { title: 'No Ref Bank',    key: 'no_referensi',  sortable: false, width: '140px' },
  { title: 'Debit',          key: 'debit',         sortable: false, align: 'end' },
  { title: 'Kredit',         key: 'kredit',        sortable: false, align: 'end' },
  { title: 'Saldo',          key: 'saldo',         sortable: false, align: 'end' },
  { title: 'Status',         key: 'status_cocok',  sortable: false, width: '110px' },
  { title: 'Cocok Dengan',   key: 'pembayaran',    sortable: false },
  { title: 'Selisih',        key: 'selisih_bank',  sortable: false, width: '90px', align: 'center' },
  { title: 'Dicocokkan Oleh', key: 'matched_by',    sortable: false, width: '130px' },
  { title: 'Kelebihan',      key: 'kelebihan',     sortable: false, width: '120px' },
  { title: 'Keterangan',     key: 'keterangan',    sortable: false },
  { title: 'Aksi',           key: 'aksi',          sortable: false, width: '160px' },
]

function rowProps(ctx) {
  return ctx.item.id === props.selectedId ? { class: 'tx-row--selected' } : {}
}

let searchDebounce = null
function onSearchInput() {
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {
    params.page = 1
    load()
  }, 400)
}

// Cache per (status, page, per_page) — supaya berpindah balik ke tab yang
// sudah pernah dibuka (mis. Belum Cocok -> Sudah Cocok -> Belum Cocok lagi)
// langsung tampil dari cache, tanpa network round-trip & overlay loading lagi.
// Dibersihkan total tiap ada perubahan data (lihat refresh()) karena baris bisa
// berpindah status (abaikan/cocokkan/unmatch) sehingga cache tab lain jadi basi.
const cache = new Map()
const cacheKey = () => `${params.status}|${params.search}|${params.page}|${params.per_page}`

// Token pencegah race: kalau user pindah tab lagi sebelum request sebelumnya
// selesai, respons yang datang belakangan (out-of-order) tidak boleh menimpa
// cache dengan data tab yang sudah ditinggalkan.
let loadToken = 0

async function load({ force = false } = {}) {
  const key = cacheKey()
  if (!force && cache.has(key)) {
    const cached = cache.get(key)
    rows.value = cached.rows
    Object.assign(meta, cached.meta)
    return
  }

  const token = ++loadToken
  await fetchList()
  if (token !== loadToken) return

  cache.set(key, { rows: [...rows.value], meta: { ...meta } })
}

function onTableOptions({ page, itemsPerPage }) {
  params.page = page
  params.per_page = itemsPerPage
  emit('options-change')
  load()
}

watch(() => props.status, status => {
  params.status = status
  params.page = 1
  load()
})

onMounted(() => load())

defineExpose({
  refresh: () => {
    cache.clear()
    return load({ force: true })
  },
  rows,
})
</script>

<style scoped>
:deep(.tx-row--selected) {
  background: rgba(var(--v-theme-primary), 0.06);
}
:deep(.tx-row--selected td:first-child) {
  border-left: 3px solid rgb(var(--v-theme-primary));
}
</style>
