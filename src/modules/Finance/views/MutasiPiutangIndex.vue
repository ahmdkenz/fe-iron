<template>
  <div>
    <PageHeader
      title="Mutasi Piutang"
      subtitle="Pergerakan piutang per klien dalam satu periode"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Mutasi Piutang', disabled: true },
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
        <VAutocomplete
          v-model="filters.klien_ar_id"
          placeholder="Semua Klien"
          clearable
          hide-details
          density="compact"
          style="max-width: 240px"
          :items="klienList"
          item-title="nama_klien"
          item-value="id"
          :loading="klienLoading"
          @focus="ensureKlienLoaded()"
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
              <VAvatar color="secondary" variant="tonal" size="44">
                <VIcon icon="ri-wallet-3-line" />
              </VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">Saldo Awal</div>
                <div class="text-h6 font-weight-bold">{{ formatCurrency(report.summary?.saldo_awal ?? 0) }}</div>
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
                <div class="text-caption text-medium-emphasis">Invoice Masuk</div>
                <div class="text-h6 font-weight-bold">{{ formatCurrency(report.summary?.invoice_masuk ?? 0) }}</div>
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
                <div class="text-caption text-medium-emphasis">Pembayaran</div>
                <div class="text-h6 font-weight-bold">{{ formatCurrency(report.summary?.pembayaran ?? 0) }}</div>
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
                <div class="text-caption text-medium-emphasis">Saldo Akhir</div>
                <div class="text-h6 font-weight-bold">{{ formatCurrency(report.summary?.saldo_akhir ?? 0) }}</div>
              </div>
            </div>
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
          &nbsp;·&nbsp; {{ report.rows?.length ?? 0 }} klien
        </div>
      </VCardText>
      <VDivider class="mt-2" />

      <VProgressLinear v-if="loading" indeterminate color="primary" />

      <VTable density="compact" class="mutasi-table">
        <thead>
          <tr>
            <th>Klien</th>
            <th>Perusahaan</th>
            <th class="text-right">Saldo Awal</th>
            <th class="text-right">Invoice Masuk</th>
            <th class="text-right">Pembayaran</th>
            <th class="text-right">Saldo Akhir</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in report.rows" :key="row.klien_id">
            <td>
              <div class="font-weight-medium">{{ row.nama_klien }}</div>
              <div class="text-caption text-medium-emphasis">{{ row.kode_klien }}</div>
            </td>
            <td>
              <VChip v-if="row.perusahaan" color="secondary" size="small" variant="tonal" label>
                {{ row.perusahaan }}
              </VChip>
              <span v-else>-</span>
            </td>
            <td class="text-right">{{ formatCurrency(row.saldo_awal) }}</td>
            <td class="text-right text-warning font-weight-medium">
              {{ row.invoice_masuk > 0 ? formatCurrency(row.invoice_masuk) : '-' }}
            </td>
            <td class="text-right text-success font-weight-medium">
              {{ row.pembayaran > 0 ? formatCurrency(row.pembayaran) : '-' }}
            </td>
            <td class="text-right font-weight-bold" :class="row.saldo_akhir > 0 ? 'text-error' : 'text-success'">
              {{ formatCurrency(row.saldo_akhir) }}
            </td>
          </tr>

          <tr v-if="!loading && (!report.rows || report.rows.length === 0)">
            <td colspan="6" class="text-center text-medium-emphasis py-6">
              Tidak ada data mutasi piutang
            </td>
          </tr>

          <tr v-if="report.rows?.length" class="font-weight-bold bg-surface-variant">
            <td colspan="2">Total</td>
            <td class="text-right">{{ formatCurrency(report.summary?.saldo_awal ?? 0) }}</td>
            <td class="text-right text-warning">{{ formatCurrency(report.summary?.invoice_masuk ?? 0) }}</td>
            <td class="text-right text-success">{{ formatCurrency(report.summary?.pembayaran ?? 0) }}</td>
            <td class="text-right text-error">{{ formatCurrency(report.summary?.saldo_akhir ?? 0) }}</td>
          </tr>
        </tbody>
      </VTable>
    </VCard>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useCrud } from '@/composables/useCrud'
import { useLazyFetchAll } from '@/composables/useLazyFetchAll'
import { useFormatter } from '@/composables/useFormatter'
import api from '@/utils/axios'

const { formatCurrency } = useFormatter()
const { items: klienList, loading: klienLoading, fetchAll: fetchKlien } = useCrud('/finance/klien-ar')
const { ensureLoaded: ensureKlienLoaded } = useLazyFetchAll(fetchKlien)

const loading = ref(false)
const report  = reactive({ periode_awal: null, periode_akhir: null, summary: null, rows: [] })

const now = new Date()
const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
const lastDay  = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

const filters = reactive({
  periode_awal:  firstDay,
  periode_akhir: lastDay,
  klien_ar_id:   null,
})

async function doFetch() {
  loading.value = true
  try {
    const params = {}
    if (filters.periode_awal)  params.periode_awal  = filters.periode_awal
    if (filters.periode_akhir) params.periode_akhir = filters.periode_akhir
    if (filters.klien_ar_id)   params.klien_ar_id   = filters.klien_ar_id

    const { data } = await api.get('/finance/mutasi-piutang', { params })
    Object.assign(report, data.data)
  } finally {
    loading.value = false
  }
}

onMounted(doFetch)
</script>

<style scoped>
.mutasi-table th,
.mutasi-table td {
  padding: 8px 12px;
  white-space: nowrap;
}
</style>
