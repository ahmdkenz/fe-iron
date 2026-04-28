<template>
  <div>
    <PageHeader
      title="Rekap Piutang per Klien"
      subtitle="Ringkasan outstanding per klien AR"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Rekap per Klien', disabled: true },
      ]"
    />

    <!-- Filter -->
    <VCard class="mb-4">
      <VCardText class="d-flex flex-wrap gap-3">
        <VSelect
          v-model="filters.periode_bulan"
          placeholder="Semua Bulan"
          clearable
          hide-details
          density="compact"
          style="max-width: 160px"
          :items="bulanOptions"
          item-title="label"
          item-value="value"
          @update:model-value="doFetch"
        />
        <VTextField
          v-model="filters.periode_tahun"
          placeholder="Tahun"
          clearable
          hide-details
          density="compact"
          style="max-width: 100px"
          type="number"
          @update:model-value="debouncedFetch"
        />
      </VCardText>
    </VCard>

    <!-- Summary Cards -->
    <VRow class="mb-4">
      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <VCard>
          <VCardText>
            <div class="d-flex align-center gap-3">
              <VAvatar color="primary" variant="tonal" size="44">
                <VIcon icon="ri-building-4-line" />
              </VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">Total Klien</div>
                <div class="text-h6 font-weight-bold">{{ rows.length }}</div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard>
          <VCardText>
            <div class="d-flex align-center gap-3">
              <VAvatar color="warning" variant="tonal" size="44">
                <VIcon icon="ri-bill-line" />
              </VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">Total Tagihan</div>
                <div class="text-h6 font-weight-bold">{{ formatCurrency(totalTagihan) }}</div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard>
          <VCardText>
            <div class="d-flex align-center gap-3">
              <VAvatar color="success" variant="tonal" size="44">
                <VIcon icon="ri-money-cny-circle-line" />
              </VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">Total Terbayar</div>
                <div class="text-h6 font-weight-bold">{{ formatCurrency(totalPembayaran) }}</div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard>
          <VCardText>
            <div class="d-flex align-center gap-3">
              <VAvatar color="error" variant="tonal" size="44">
                <VIcon icon="ri-error-warning-line" />
              </VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">Sisa Piutang</div>
                <div class="text-h6 font-weight-bold">{{ formatCurrency(totalSisa) }}</div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Tabel -->
    <VCard>
      <VProgressLinear v-if="loading" indeterminate color="primary" />
      <BaseTable
        :headers="headers"
        :items="rows"
        :total="rows.length"
        :loading="loading"
        :per-page="rows.length || 10"
        :page="1"
        hide-footer
      >
        <template #item.no="{ index }">
          {{ index + 1 }}
        </template>
        <template #item.nama_klien="{ item }">
          <div>
            <div class="font-weight-medium">{{ item.nama_klien }}</div>
            <div class="text-caption text-medium-emphasis">{{ item.kode_klien }}</div>
          </div>
        </template>
        <template #item.perusahaan="{ item }">
          <VChip v-if="item.perusahaan" color="secondary" size="small" variant="tonal" label>
            {{ item.perusahaan }}
          </VChip>
          <span v-else>-</span>
        </template>
        <template #item.total_tagihan="{ item }">
          {{ formatCurrency(item.total_tagihan) }}
        </template>
        <template #item.total_pembayaran="{ item }">
          {{ formatCurrency(item.total_pembayaran) }}
        </template>
        <template #item.sisa_tagihan="{ item }">
          <span :class="item.sisa_tagihan > 0 ? 'text-error font-weight-bold' : 'text-success'">
            {{ formatCurrency(item.sisa_tagihan) }}
          </span>
        </template>
        <template #item.status_breakdown="{ item }">
          <div class="d-flex gap-1 flex-wrap">
            <VChip v-if="item.draft"    color="default"  size="x-small" label>D: {{ item.draft }}</VChip>
            <VChip v-if="item.terkirim" color="info"     size="x-small" label>T: {{ item.terkirim }}</VChip>
            <VChip v-if="item.sebagian" color="warning"  size="x-small" label>S: {{ item.sebagian }}</VChip>
            <VChip v-if="item.lunas"    color="success"  size="x-small" label>L: {{ item.lunas }}</VChip>
          </div>
        </template>
        <template #item.actions="{ item }">
          <VBtn
            icon size="small" variant="text" color="info"
            :to="{ name: 'finance-invoice-index', query: { klien_ar_id: item.klien_id } }"
          >
            <VIcon icon="ri-eye-line" size="18" />
            <VTooltip activator="parent">Lihat Invoice</VTooltip>
          </VBtn>
        </template>
      </BaseTable>
    </VCard>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useFormatter } from '@/composables/useFormatter'
import api from '@/utils/axios'

const { formatCurrency } = useFormatter()

const loading = ref(false)
const rows    = ref([])

const filters = reactive({ periode_bulan: null, periode_tahun: null })

const headers = [
  { title: 'No',         key: 'no',               sortable: false, width: '50px' },
  { title: 'Klien',      key: 'nama_klien',        sortable: false },
  { title: 'Perusahaan', key: 'perusahaan',        sortable: false },
  { title: 'Jml Invoice',key: 'total_invoice',     sortable: false, align: 'center' },
  { title: 'Total Tagihan',   key: 'total_tagihan',   sortable: false },
  { title: 'Total Terbayar',  key: 'total_pembayaran',sortable: false },
  { title: 'Sisa Piutang',    key: 'sisa_tagihan',    sortable: false },
  { title: 'Status',     key: 'status_breakdown',  sortable: false },
  { title: 'Aksi',       key: 'actions',           sortable: false, align: 'center', width: '70px' },
]

const bulanOptions = [
  { label: 'Januari', value: 1 }, { label: 'Februari', value: 2 }, { label: 'Maret', value: 3 },
  { label: 'April', value: 4 },   { label: 'Mei', value: 5 },      { label: 'Juni', value: 6 },
  { label: 'Juli', value: 7 },    { label: 'Agustus', value: 8 },  { label: 'September', value: 9 },
  { label: 'Oktober', value: 10 },{ label: 'November', value: 11 },{ label: 'Desember', value: 12 },
]

const totalTagihan    = computed(() => rows.value.reduce((s, r) => s + r.total_tagihan, 0))
const totalPembayaran = computed(() => rows.value.reduce((s, r) => s + r.total_pembayaran, 0))
const totalSisa       = computed(() => rows.value.reduce((s, r) => s + r.sisa_tagihan, 0))

let debounceTimer = null

function debouncedFetch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(doFetch, 400)
}

async function doFetch() {
  loading.value = true
  try {
    const params = {}
    if (filters.periode_bulan) params.periode_bulan = filters.periode_bulan
    if (filters.periode_tahun) params.periode_tahun = filters.periode_tahun

    const { data } = await api.get('/finance/invoices/rekap-klien', { params })
    rows.value = data.data ?? []
  } finally {
    loading.value = false
  }
}

onMounted(doFetch)
</script>
