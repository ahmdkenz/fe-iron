<template>
  <div>
    <PageHeader
      title="Kinerja AR per PIC"
      subtitle="Performa penagihan per AR officer"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Kinerja AR', disabled: true },
      ]"
    />

    <!-- Filter -->
    <VCard class="mb-4">
      <VCardText class="d-flex flex-wrap gap-3">
        <VTextField
          v-model="filters.periode_awal"
          label="Dari Tanggal"
          type="date"
          density="compact"
          hide-details
          style="max-width: 180px"
          @update:model-value="doFetch"
        />
        <VTextField
          v-model="filters.periode_akhir"
          label="Sampai Tanggal"
          type="date"
          density="compact"
          hide-details
          style="max-width: 180px"
          @update:model-value="doFetch"
        />
      </VCardText>
    </VCard>

    <!-- Summary Cards -->
    <VRow class="mb-4">
      <VCol cols="12" sm="6" md="3">
        <VCard>
          <VCardText>
            <div class="d-flex align-center gap-3">
              <VAvatar color="primary" variant="tonal" size="44">
                <VIcon icon="ri-user-star-line" />
              </VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">Jumlah AR Officer</div>
                <div class="text-h6 font-weight-bold">{{ report.rows?.length ?? 0 }}</div>
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
                <div class="text-h6 font-weight-bold">{{ formatCurrency(report.summary?.total_tagihan ?? 0) }}</div>
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
                <div class="text-caption text-medium-emphasis">Total Terkumpul</div>
                <div class="text-h6 font-weight-bold">{{ formatCurrency(report.summary?.total_terkumpul ?? 0) }}</div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard :color="collectionRateColor(report.summary?.collection_rate ?? 0)" variant="tonal">
          <VCardText class="pa-3">
            <div class="text-caption font-weight-medium mb-1">Collection Rate Keseluruhan</div>
            <div class="text-subtitle-1 font-weight-bold">{{ report.summary?.collection_rate ?? 0 }}%</div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Tabel -->
    <VCard>
      <VCardText class="pb-0">
        <div class="text-caption text-medium-emphasis">
          Periode: <strong>{{ report.periode_awal ?? '-' }}</strong>
          s/d <strong>{{ report.periode_akhir ?? '-' }}</strong>
        </div>
      </VCardText>
      <VDivider class="mt-2" />
      <VProgressLinear v-if="loading" indeterminate color="primary" />
      <BaseTable
        :headers="headers"
        :items="paginatedRows"
        :total="report.rows.length"
        :loading="loading"
        :per-page="perPage"
        :page="page"
        @update:options="onTableOptions"
      >
        <template #item.no="{ index }">
          {{ (page - 1) * perPage + index + 1 }}
        </template>
        <template #item.nama_karyawan="{ item }">
          <div class="font-weight-medium">{{ item.nama_karyawan }}</div>
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
        <template #item.total_terkumpul="{ item }">
          <span class="text-success font-weight-medium">{{ formatCurrency(item.total_terkumpul) }}</span>
        </template>
        <template #item.total_sisa="{ item }">
          <span :class="item.total_sisa > 0 ? 'text-error' : 'text-success'">
            {{ formatCurrency(item.total_sisa) }}
          </span>
        </template>
        <template #item.collection_rate="{ item }">
          <div class="d-flex align-center gap-2 justify-center">
            <VProgressLinear
              :model-value="item.collection_rate"
              :color="collectionRateColor(item.collection_rate)"
              height="6"
              rounded
              style="max-width: 80px"
            />
            <span class="text-caption font-weight-bold" :class="`text-${collectionRateColor(item.collection_rate)}`">
              {{ item.collection_rate }}%
            </span>
          </div>
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
const report  = reactive({ periode_awal: null, periode_akhir: null, summary: null, rows: [] })

const now      = new Date()
const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
const lastDay  = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

const filters = reactive({
  periode_awal:  firstDay,
  periode_akhir: lastDay,
})

const page    = ref(1)
const perPage = ref(15)

const paginatedRows = computed(() =>
  report.rows.slice((page.value - 1) * perPage.value, page.value * perPage.value)
)

function onTableOptions({ page: p, itemsPerPage }) {
  page.value    = p
  perPage.value = itemsPerPage
}

const headers = [
  { title: 'No',             key: 'no',               sortable: false, width: '50px' },
  { title: 'AR Officer',     key: 'nama_karyawan',    sortable: false },
  { title: 'Perusahaan',     key: 'perusahaan',       sortable: false },
  { title: 'Klien',          key: 'jumlah_klien',     sortable: false, align: 'center' },
  { title: 'Invoice',        key: 'jumlah_invoice',   sortable: false, align: 'center' },
  { title: 'Total Tagihan',  key: 'total_tagihan',    sortable: false, align: 'end' },
  { title: 'Terkumpul',      key: 'total_terkumpul',  sortable: false, align: 'end' },
  { title: 'Sisa',           key: 'total_sisa',       sortable: false, align: 'end' },
  { title: 'Collection Rate',key: 'collection_rate',  sortable: false, align: 'center' },
]

function collectionRateColor(rate) {
  if (rate >= 90) return 'success'
  if (rate >= 70) return 'warning'
  return 'error'
}

async function doFetch() {
  page.value    = 1
  loading.value = true
  try {
    const params = {}
    if (filters.periode_awal)  params.periode_awal  = filters.periode_awal
    if (filters.periode_akhir) params.periode_akhir = filters.periode_akhir

    const { data } = await api.get('/finance/kinerja-ar', { params })
    Object.assign(report, data.data)
  } finally {
    loading.value = false
  }
}

onMounted(doFetch)
</script>
