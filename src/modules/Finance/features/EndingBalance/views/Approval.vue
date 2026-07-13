<template>
  <div>
    <PageHeader
      title="Approval Koreksi Ending Balance"
      subtitle="Koreksi saldo akhir yang menunggu tindakan Anda"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Ending Balance', to: { name: 'finance-ending-balance' } },
        { title: 'Approval Koreksi', disabled: true },
      ]"
    >
      
    </PageHeader>

    <!-- B2B Table -->
    <VCard class="mb-6">
      <VCardTitle class="d-flex align-center gap-2 pa-4 pb-2">
        <VIcon icon="ri-building-line" size="20" />
        Ending Balance B2B
      </VCardTitle>

      <VDataTable
        :headers="headers"
        :items="b2bRows"
        :loading="loading"
        :items-per-page="10"
        :items-per-page-options="[{ value: 10, title: '10' }, { value: 25, title: '25' }, { value: 50, title: '50' }, { value: 100, title: '100' }]"
        no-data-text="Tidak ada koreksi B2B yang menunggu persetujuan Anda."
        density="comfortable"
      >
        <template #item.tipe="{ item }">
          <VChip size="x-small" :color="tipeBadgeColor(item.tipe)" label>{{ tipeLabel(item.tipe) }}</VChip>
        </template>
        <template #item.no_dokumen="{ item }">
          <span class="text-caption font-weight-medium">{{ item.no_dokumen || '—' }}</span>
        </template>
        <template #item.nama_klien="{ item }">
          <span class="font-weight-medium">{{ item.nama_klien }}</span>
        </template>
        <template #item.nilai_koreksi="{ item }">
          <span class="font-weight-bold" :class="item.nilai_koreksi >= 0 ? 'text-success' : 'text-error'">
            {{ item.nilai_koreksi >= 0 ? '+' : '' }}{{ formatRp(item.nilai_koreksi) }}
          </span>
        </template>
        <template #item.submitted_at="{ item }">
          <span class="text-caption">{{ formatDatetime(item.submitted_at) }}</span>
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex gap-1 justify-center">
            <VBtn icon size="small" variant="text" color="primary"
              :to="{ name: 'finance-ending-balance-show', params: { id: item.ending_balance_id } }">
              <VIcon icon="ri-eye-line" size="18" />
              <VTooltip activator="parent">Lihat EB</VTooltip>
            </VBtn>
            <VBtn icon size="small" color="success" variant="tonal" @click="openDialog(item, 'approve')">
              <VIcon icon="ri-check-line" size="18" />
              <VTooltip activator="parent">Setujui</VTooltip>
            </VBtn>
            <VBtn icon size="small" color="error" variant="tonal" @click="openDialog(item, 'reject')">
              <VIcon icon="ri-close-line" size="18" />
              <VTooltip activator="parent">Tolak</VTooltip>
            </VBtn>
          </div>
        </template>
      </VDataTable>
    </VCard>

    <!-- B2C Table -->
    <VCard>
      <VCardTitle class="d-flex align-center gap-2 pa-4 pb-2">
        <VIcon icon="ri-store-2-line" size="20" />
        Ending Balance B2C
      </VCardTitle>

      <VDataTable
        :headers="headers"
        :items="b2cRows"
        :loading="loading"
        :items-per-page="10"
        :items-per-page-options="[{ value: 10, title: '10' }, { value: 25, title: '25' }, { value: 50, title: '50' }, { value: 100, title: '100' }]"
        no-data-text="Tidak ada koreksi B2C yang menunggu persetujuan Anda."
        density="comfortable"
      >
        <template #item.tipe="{ item }">
          <VChip size="x-small" :color="tipeBadgeColor(item.tipe)" label>{{ tipeLabel(item.tipe) }}</VChip>
        </template>
        <template #item.no_dokumen="{ item }">
          <span class="text-caption font-weight-medium">{{ item.no_dokumen || '—' }}</span>
        </template>
        <template #item.nama_klien="{ item }">
          <span class="font-weight-medium">{{ item.nama_klien }}</span>
        </template>
        <template #item.nilai_koreksi="{ item }">
          <span class="font-weight-bold" :class="item.nilai_koreksi >= 0 ? 'text-success' : 'text-error'">
            {{ item.nilai_koreksi >= 0 ? '+' : '' }}{{ formatRp(item.nilai_koreksi) }}
          </span>
        </template>
        <template #item.submitted_at="{ item }">
          <span class="text-caption">{{ formatDatetime(item.submitted_at) }}</span>
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex gap-1 justify-center">
            <VBtn icon size="small" variant="text" color="primary"
              :to="{ name: 'finance-ending-balance-show', params: { id: item.ending_balance_id } }">
              <VIcon icon="ri-eye-line" size="18" />
              <VTooltip activator="parent">Lihat EB</VTooltip>
            </VBtn>
            <VBtn icon size="small" color="success" variant="tonal" @click="openDialog(item, 'approve')">
              <VIcon icon="ri-check-line" size="18" />
              <VTooltip activator="parent">Setujui</VTooltip>
            </VBtn>
            <VBtn icon size="small" color="error" variant="tonal" @click="openDialog(item, 'reject')">
              <VIcon icon="ri-close-line" size="18" />
              <VTooltip activator="parent">Tolak</VTooltip>
            </VBtn>
          </div>
        </template>
      </VDataTable>
    </VCard>

    <!-- B2B Approved -->
    <VCard class="mb-6 mt-6">
      <VCardTitle class="d-flex align-center gap-2 pa-4 pb-2">
        <VIcon icon="ri-building-line" size="20" color="success" />
        Ending Balance B2B — Sudah Approve
      </VCardTitle>

      <BaseTable
        :headers="approvedHeaders"
        :items="approvedB2B.rows"
        :total="approvedB2B.meta?.total ?? 0"
        :loading="loadingApprovedB2B"
        :per-page="approvedB2BPerPage"
        :page="approvedB2BPage"
        no-data-text="Belum ada koreksi B2B yang disetujui."
        density="comfortable"
        @update:options="onApprovedB2BOptions"
      >
        <template #item.status="{ item }">
          <VChip size="x-small" :color="item.status === 'APPROVED' ? 'success' : 'warning'" label>
            {{ item.status === 'APPROVED' ? 'Selesai' : 'Menunggu Approval' }}
          </VChip>
        </template>
        <template #item.tipe="{ item }">
          <VChip size="x-small" :color="tipeBadgeColor(item.tipe)" label>{{ tipeLabel(item.tipe) }}</VChip>
        </template>
        <template #item.no_dokumen="{ item }">
          <span class="text-caption font-weight-medium">{{ item.no_dokumen || '—' }}</span>
        </template>
        <template #item.nama_klien="{ item }">
          <span class="font-weight-medium">{{ item.nama_klien }}</span>
        </template>
        <template #item.nilai_koreksi="{ item }">
          <span class="font-weight-bold" :class="item.nilai_koreksi >= 0 ? 'text-success' : 'text-error'">
            {{ item.nilai_koreksi >= 0 ? '+' : '' }}{{ formatRp(item.nilai_koreksi) }}
          </span>
        </template>
        <template #item.saldo_sebelum="{ item }">
          <span class="text-body-2">{{ formatRp(item.saldo_sebelum) }}</span>
        </template>
        <template #item.saldo_sesudah="{ item }">
          <span class="text-body-2 font-weight-semibold">{{ formatRp(item.saldo_sesudah) }}</span>
        </template>
        <template #item.manager="{ item }">
          <span class="text-caption" :class="item.manager ? 'font-weight-semibold text-success' : 'text-medium-emphasis'">
            {{ item.manager || '—' }}
          </span>
        </template>
        <template #item.manager_actioned_at="{ item }">
          <span class="text-caption">{{ formatDatetime(item.manager_actioned_at) }}</span>
        </template>
        <template #item.actions="{ item }">
          <VBtn icon size="small" variant="text" color="primary"
            :to="{ name: 'finance-ending-balance-show', params: { id: item.ending_balance_id } }">
            <VIcon icon="ri-eye-line" size="18" />
            <VTooltip activator="parent">Lihat Detail EB</VTooltip>
          </VBtn>
        </template>
      </BaseTable>
    </VCard>

    <!-- B2C Approved -->
    <VCard class="mb-6">
      <VCardTitle class="d-flex align-center gap-2 pa-4 pb-2">
        <VIcon icon="ri-store-2-line" size="20" color="success" />
        Ending Balance B2C — Sudah Approve
      </VCardTitle>

      <BaseTable
        :headers="approvedHeaders"
        :items="approvedB2C.rows"
        :total="approvedB2C.meta?.total ?? 0"
        :loading="loadingApprovedB2C"
        :per-page="approvedB2CPerPage"
        :page="approvedB2CPage"
        no-data-text="Belum ada koreksi B2C yang disetujui."
        @update:options="onApprovedB2COptions"
        density="comfortable"
      >
        <template #item.status="{ item }">
          <VChip size="x-small" :color="item.status === 'APPROVED' ? 'success' : 'warning'" label>
            {{ item.status === 'APPROVED' ? 'Selesai' : 'Menunggu Approval' }}
          </VChip>
        </template>
        <template #item.tipe="{ item }">
          <VChip size="x-small" :color="tipeBadgeColor(item.tipe)" label>{{ tipeLabel(item.tipe) }}</VChip>
        </template>
        <template #item.no_dokumen="{ item }">
          <span class="text-caption font-weight-medium">{{ item.no_dokumen || '—' }}</span>
        </template>
        <template #item.nama_klien="{ item }">
          <span class="font-weight-medium">{{ item.nama_klien }}</span>
        </template>
        <template #item.nilai_koreksi="{ item }">
          <span class="font-weight-bold" :class="item.nilai_koreksi >= 0 ? 'text-success' : 'text-error'">
            {{ item.nilai_koreksi >= 0 ? '+' : '' }}{{ formatRp(item.nilai_koreksi) }}
          </span>
        </template>
        <template #item.saldo_sebelum="{ item }">
          <span class="text-body-2">{{ formatRp(item.saldo_sebelum) }}</span>
        </template>
        <template #item.saldo_sesudah="{ item }">
          <span class="text-body-2 font-weight-semibold">{{ formatRp(item.saldo_sesudah) }}</span>
        </template>
        <template #item.manager="{ item }">
          <span class="text-caption" :class="item.manager ? 'font-weight-semibold text-success' : 'text-medium-emphasis'">
            {{ item.manager || '—' }}
          </span>
        </template>
        <template #item.manager_actioned_at="{ item }">
          <span class="text-caption">{{ formatDatetime(item.manager_actioned_at) }}</span>
        </template>
        <template #item.actions="{ item }">
          <VBtn icon size="small" variant="text" color="primary"
            :to="{ name: 'finance-ending-balance-show', params: { id: item.ending_balance_id } }">
            <VIcon icon="ri-eye-line" size="18" />
            <VTooltip activator="parent">Lihat Detail EB</VTooltip>
          </VBtn>
        </template>
      </BaseTable>
    </VCard>

    <!-- Action Dialog -->
    <KoreksiApprovalDialog
      v-model="dialog.open"
      :action="dialog.action"
      :koreksi="dialog.koreksi"
      :keterangan="dialog.keterangan"
      :error="dialog.error"
      :loading="dialog.loading"
      @update:keterangan="dialog.keterangan = $event"
      @close="closeDialog"
      @confirm="confirmAction"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '@/utils/axios'

const loading = ref(false)
const rows    = ref([])

const headers = [
  { title: 'TIPE',             key: 'tipe',          sortable: false },
  { title: 'NO DOKUMEN',       key: 'no_dokumen',    sortable: false },
  { title: 'CLIENT',           key: 'nama_klien',    sortable: false },
  { title: 'NOMINAL',          key: 'nilai_koreksi', sortable: false },
  { title: 'ALASAN',           key: 'alasan_koreksi',sortable: false },
  { title: 'DIAJUKAN OLEH',    key: 'submitted_by',  sortable: false },
  { title: 'TANGGAL DIAJUKAN', key: 'submitted_at',  sortable: false },
  { title: 'AKSI',             key: 'actions',       sortable: false, align: 'center' },
]

const b2bRows = computed(() => rows.value.filter(k => k.segment === 'B2B'))
const b2cRows = computed(() => rows.value.filter(k => k.segment === 'B2C'))

const approvedHeaders = [
  { title: 'STATUS',            key: 'status',             sortable: false },
  { title: 'TIPE',              key: 'tipe',               sortable: false },
  { title: 'NO DOKUMEN',        key: 'no_dokumen',         sortable: false },
  { title: 'CLIENT',            key: 'nama_klien',         sortable: false },
  { title: 'NOMINAL',           key: 'nilai_koreksi',      sortable: false },
  { title: 'SALDO SEBELUM',     key: 'saldo_sebelum',      sortable: false },
  { title: 'SALDO SESUDAH',     key: 'saldo_sesudah',      sortable: false },
  { title: 'ALASAN',            key: 'alasan_koreksi',     sortable: false },
  { title: 'DIAJUKAN OLEH',     key: 'submitted_by',       sortable: false },
  { title: 'DISETUJUI OLEH',    key: 'manager',            sortable: false },
  { title: 'TGL APPROVED',      key: 'manager_actioned_at',sortable: false },
  { title: 'AKSI',              key: 'actions',            sortable: false, align: 'center' },
]

const loadingApprovedB2B = ref(false)
const loadingApprovedB2C = ref(false)
const approvedB2B = reactive({ rows: [], meta: null })
const approvedB2C = reactive({ rows: [], meta: null })
const approvedB2BPage    = ref(1)
const approvedB2BPerPage = ref(10)
const approvedB2CPage    = ref(1)
const approvedB2CPerPage = ref(10)

const dialog = reactive({
  open      : false,
  action    : null,
  koreksi   : null,
  keterangan: '',
  error     : '',
  loading   : false,
})

function formatRp(val) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val ?? 0)
}

function formatDatetime(d) {
  if (!d) return '-'
  return new Date(d).toLocaleString('id-ID')
}

function tipeBadgeColor(tipe) {
  return { CREDIT_NOTE: 'error', DEBIT_NOTE: 'info', KOREKSI_SALDO: 'secondary' }[tipe] ?? 'default'
}

function tipeLabel(tipe) {
  return { CREDIT_NOTE: 'CN', DEBIT_NOTE: 'DN', KOREKSI_SALDO: 'Koreksi Saldo' }[tipe] ?? (tipe || '—')
}

async function fetchPending() {
  loading.value = true
  try {
    const { data } = await api.get('/finance/ending-balance/koreksi/pending')
    rows.value = data.data ?? []
  } finally {
    loading.value = false
  }
}

async function fetchApprovedSegment(segment) {
  const isB2B     = segment === 'B2B'
  const state     = isB2B ? approvedB2B : approvedB2C
  const page      = isB2B ? approvedB2BPage : approvedB2CPage
  const perPage   = isB2B ? approvedB2BPerPage : approvedB2CPerPage
  const loadingRef = isB2B ? loadingApprovedB2B : loadingApprovedB2C

  loadingRef.value = true
  try {
    const { data } = await api.get('/finance/ending-balance/koreksi/approved', {
      params: { segment, page: page.value, per_page: perPage.value },
    })
    state.rows = data.data?.rows ?? []
    state.meta = data.data?.meta ?? null
  } finally {
    loadingRef.value = false
  }
}

function onApprovedB2BOptions({ page: p, itemsPerPage }) {
  approvedB2BPage.value    = p
  approvedB2BPerPage.value = itemsPerPage
  fetchApprovedSegment('B2B')
}

function onApprovedB2COptions({ page: p, itemsPerPage }) {
  approvedB2CPage.value    = p
  approvedB2CPerPage.value = itemsPerPage
  fetchApprovedSegment('B2C')
}

async function fetchApproved() {
  await Promise.all([fetchApprovedSegment('B2B'), fetchApprovedSegment('B2C')])
}

function openDialog(koreksi, action) {
  dialog.koreksi    = koreksi
  dialog.action     = action
  dialog.keterangan = ''
  dialog.error      = ''
  dialog.loading    = false
  dialog.open       = true
}

function closeDialog() {
  dialog.open = false
}

async function confirmAction() {
  if (dialog.action === 'reject' && !dialog.keterangan.trim()) {
    dialog.error = 'Keterangan wajib diisi saat menolak koreksi.'
    return
  }

  dialog.error   = ''
  dialog.loading = true

  // Approval EB satu tahap: semua koreksi pending diproses via endpoint final (-manager)
  // oleh Manager/Supervisor/Admin.
  const k   = dialog.koreksi
  const url = `/finance/ending-balance/koreksi/${k.id}/${dialog.action}-manager`

  try {
    await api.patch(url, { note: dialog.keterangan.trim() || null })
    dialog.open = false
    fetchPending()
    fetchApproved()
  } catch (e) {
    dialog.error = e?.response?.data?.message ?? 'Terjadi kesalahan.'
  } finally {
    dialog.loading = false
  }
}

onMounted(() => {
  fetchPending()
  fetchApproved()
})
</script>
