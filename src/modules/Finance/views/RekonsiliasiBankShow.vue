<template>
  <div>
    <PageHeader
      :title="`Rekonsiliasi — ${report.bank_type ?? ''}`"
      :subtitle="report.nama_file ?? 'Detail transaksi'"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Rekonsiliasi Bank', to: { name: 'finance-rekonsiliasi-bank' } },
        { title: 'Detail', disabled: true },
      ]"
    />

    <!-- Info Header -->
    <VCard class="mb-4" v-if="report.id">
      <VCardText>
        <div class="d-flex flex-wrap gap-4 align-center">
          <VChip :color="bankColor(report.bank_type)" variant="tonal" label>
            {{ report.bank_type }}
          </VChip>
          <div>
            <div class="text-caption text-medium-emphasis">Periode</div>
            <div class="text-body-2 font-weight-medium">{{ report.periode_awal }} — {{ report.periode_akhir }}</div>
          </div>
          <div>
            <div class="text-caption text-medium-emphasis">File</div>
            <div class="text-body-2">{{ report.nama_file }}</div>
          </div>
          <div>
            <div class="text-caption text-medium-emphasis">Diupload oleh</div>
            <div class="text-body-2">{{ report.uploaded_by }}</div>
          </div>
          <VSpacer />
          <div class="text-caption text-medium-emphasis text-right">
            {{ report.created_at }}
          </div>
        </div>
      </VCardText>
    </VCard>

    <!-- Summary Chips -->
    <VRow class="mb-4">
      <VCol cols="6" sm="3">
        <VCard>
          <VCardText class="text-center">
            <div class="text-caption text-medium-emphasis">Total Transaksi</div>
            <div class="text-h5 font-weight-bold">{{ report.total_transaksi ?? 0 }}</div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="6" sm="3">
        <VCard>
          <VCardText class="text-center">
            <div class="text-caption text-medium-emphasis">MATCHED</div>
            <div class="text-h5 font-weight-bold text-success">{{ report.jumlah_matched ?? 0 }}</div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="6" sm="3">
        <VCard>
          <VCardText class="text-center">
            <div class="text-caption text-medium-emphasis">UNMATCHED</div>
            <div class="text-h5 font-weight-bold text-error">{{ report.jumlah_unmatched ?? 0 }}</div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="6" sm="3">
        <VCard>
          <VCardText class="text-center">
            <div class="text-caption text-medium-emphasis">Total Kredit</div>
            <div class="text-h5 font-weight-bold text-primary">{{ formatCurrency(report.total_kredit ?? 0) }}</div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Filter Tabs -->
    <VCard>
      <VCardText class="pb-0">
        <VBtnToggle
          v-model="filterStatus"
          variant="outlined"
          mandatory
          divided
          density="compact"
        >
          <VBtn value="SEMUA" size="small" style="min-width: 80px">Semua</VBtn>
          <VBtn value="MATCHED" size="small" style="min-width: 90px">
            <span class="text-success">MATCHED</span>
          </VBtn>
          <VBtn value="POSSIBLE" size="small" style="min-width: 95px">
            <span class="text-warning">POSSIBLE</span>
          </VBtn>
          <VBtn value="UNMATCHED" size="small" style="min-width: 105px">
            <span class="text-error">UNMATCHED</span>
          </VBtn>
        </VBtnToggle>
      </VCardText>
      <VDivider class="mt-3" />
      <VProgressLinear v-if="loading" indeterminate color="primary" />
      <BaseTable
        :headers="headers"
        :items="filteredRows"
        :total="filteredRows.length"
        :loading="loading"
        :per-page="perPage"
        :page="page"
        @update:options="onTableOptions"
      >
        <template #item.no="{ index }">
          {{ (page - 1) * perPage + index + 1 }}
        </template>
        <template #item.debit="{ item }">
          <span v-if="item.debit > 0" class="text-warning font-weight-medium">
            {{ formatCurrency(item.debit) }}
          </span>
          <span v-else class="text-disabled">-</span>
        </template>
        <template #item.kredit="{ item }">
          <span v-if="item.kredit > 0" class="text-success font-weight-medium">
            {{ formatCurrency(item.kredit) }}
          </span>
          <span v-else class="text-disabled">-</span>
        </template>
        <template #item.saldo="{ item }">
          {{ formatCurrency(item.saldo) }}
        </template>
        <template #item.status_cocok="{ item }">
          <VChip :color="statusColor(item.status_cocok)" size="x-small" variant="tonal" label>
            {{ item.status_cocok }}
          </VChip>
        </template>
        <template #item.pembayaran="{ item }">
          <div v-if="item.pembayaran" class="text-caption">
            <div class="font-weight-medium">{{ item.pembayaran.no_referensi || '-' }}</div>
            <div class="text-medium-emphasis">{{ item.pembayaran.tanggal_pembayaran }}</div>
            <div class="text-medium-emphasis">{{ item.pembayaran.klien }}</div>
          </div>
          <span v-else class="text-disabled">-</span>
        </template>
        <template #item.aksi="{ item }">
          <VBtn
            v-if="item.status_cocok === 'UNMATCHED'"
            size="x-small"
            variant="tonal"
            color="grey"
            @click="doAbaikan(item)"
            :loading="abaikanLoading === item.id"
          >
            Abaikan
          </VBtn>
        </template>
      </BaseTable>
    </VCard>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useFormatter } from '@/composables/useFormatter'
import api from '@/utils/axios'

const route = useRoute()
const { formatCurrency } = useFormatter()

const loading = ref(false)
const report  = reactive({
  id: null, bank_type: null, nama_file: null,
  periode_awal: null, periode_akhir: null,
  total_transaksi: 0, total_kredit: 0,
  jumlah_matched: 0, jumlah_unmatched: 0,
  uploaded_by: null, created_at: null,
  details: [],
})

const filterStatus   = ref('SEMUA')
const page           = ref(1)
const perPage        = ref(25)
const abaikanLoading = ref(null)

const filteredRows = computed(() => {
  if (filterStatus.value === 'SEMUA') return report.details
  return report.details.filter(d => d.status_cocok === filterStatus.value)
})

function onTableOptions({ page: p, itemsPerPage }) {
  page.value    = p
  perPage.value = itemsPerPage
}

const bankColor = (type) => ({
  BCA: 'info', MANDIRI: 'warning', BNI: 'error', BRI: 'primary',
  CIMB: 'deep-purple', BSI: 'green',
}[type] ?? 'secondary')
const statusColor = (s) => ({ MATCHED: 'success', POSSIBLE: 'warning', UNMATCHED: 'error', DIABAIKAN: 'grey' }[s] ?? 'grey')

const headers = [
  { title: 'No',          key: 'no',          sortable: false, width: '50px' },
  { title: 'Tanggal',     key: 'tanggal',     sortable: false, width: '110px' },
  { title: 'Keterangan',  key: 'keterangan',  sortable: false },
  { title: 'Debit',       key: 'debit',       sortable: false, align: 'end' },
  { title: 'Kredit',      key: 'kredit',      sortable: false, align: 'end' },
  { title: 'Saldo',       key: 'saldo',       sortable: false, align: 'end' },
  { title: 'Status',      key: 'status_cocok',sortable: false, width: '110px' },
  { title: 'Cocok Dengan',key: 'pembayaran',  sortable: false },
  { title: 'Aksi',        key: 'aksi',        sortable: false, width: '90px' },
]

async function fetchDetail() {
  loading.value = true
  try {
    const { data } = await api.get(`/finance/rekonsiliasi-bank/${route.params.id}`)
    Object.assign(report, data.data)
  } finally {
    loading.value = false
  }
}

async function doAbaikan(item) {
  abaikanLoading.value = item.id
  try {
    await api.patch(`/finance/rekonsiliasi-bank/detail/${item.id}/abaikan`)
    item.status_cocok    = 'DIABAIKAN'
    item.pembayaran      = null
    // Update counter lokal
    report.jumlah_unmatched = Math.max(0, report.jumlah_unmatched - 1)
  } finally {
    abaikanLoading.value = null
  }
}

onMounted(fetchDetail)
</script>
