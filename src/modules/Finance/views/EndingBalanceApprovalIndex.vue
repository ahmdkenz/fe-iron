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
        Approval Koreksi B2B
      </VCardTitle>

      <VDataTable
        :headers="headers"
        :items="b2bRows"
        :loading="loading"
        :items-per-page="10"
        :items-per-page-options="[{ value: 10, title: '10' }, { value: 25, title: '25' }, { value: 50, title: '50' }, { value: -1, title: 'Semua' }]"
        no-data-text="Tidak ada koreksi B2B yang menunggu persetujuan Anda."
        density="comfortable"
      >
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
        Approval Koreksi B2C
      </VCardTitle>

      <VDataTable
        :headers="headers"
        :items="b2cRows"
        :loading="loading"
        :items-per-page="10"
        :items-per-page-options="[{ value: 10, title: '10' }, { value: 25, title: '25' }, { value: 50, title: '50' }, { value: -1, title: 'Semua' }]"
        no-data-text="Tidak ada koreksi B2C yang menunggu persetujuan Anda."
        density="comfortable"
      >
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
        Ending Balance B2B — Sudah Disetujui
      </VCardTitle>

      <VDataTable
        :headers="approvedHeaders"
        :items="approvedB2bRows"
        :loading="loadingApproved"
        :items-per-page="10"
        :items-per-page-options="[{ value: 10, title: '10' }, { value: 25, title: '25' }, { value: 50, title: '50' }, { value: -1, title: 'Semua' }]"
        no-data-text="Belum ada koreksi B2B yang disetujui."
        density="comfortable"
      >
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
      </VDataTable>
    </VCard>

    <!-- B2C Approved -->
    <VCard class="mb-6">
      <VCardTitle class="d-flex align-center gap-2 pa-4 pb-2">
        <VIcon icon="ri-store-2-line" size="20" color="success" />
        Ending Balance B2C — Sudah Disetujui
      </VCardTitle>

      <VDataTable
        :headers="approvedHeaders"
        :items="approvedB2cRows"
        :loading="loadingApproved"
        :items-per-page="10"
        :items-per-page-options="[{ value: 10, title: '10' }, { value: 25, title: '25' }, { value: 50, title: '50' }, { value: -1, title: 'Semua' }]"
        no-data-text="Belum ada koreksi B2C yang disetujui."
        density="comfortable"
      >
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
      </VDataTable>
    </VCard>

    <!-- Action Dialog -->
    <VDialog v-model="dialog.open" max-width="480" persistent>
      <VCard class="overflow-hidden">
        <!-- Gradient band -->
        <div :class="['action-band', dialog.action === 'approve' ? 'action-band--success' : 'action-band--error']">
          <VBtn icon variant="text" size="small" class="action-band-close" @click="closeDialog">
            <VIcon icon="ri-close-line" size="20" color="white" />
          </VBtn>
        </div>

        <!-- Floating avatar + title -->
        <div class="action-hero text-center">
          <VAvatar
            :color="dialog.action === 'approve' ? 'success' : 'error'"
            size="68"
            class="action-avatar"
          >
            <VIcon
              :icon="dialog.action === 'approve' ? 'ri-check-double-line' : 'ri-close-circle-line'"
              size="32"
              color="white"
            />
          </VAvatar>
          <div class="text-h6 font-weight-bold mt-3">
            {{ dialog.action === 'approve' ? 'Setujui Koreksi' : 'Tolak Koreksi' }}
          </div>
          <div class="text-body-2 text-medium-emphasis mt-1">
            {{ dialog.action === 'approve'
              ? 'Pastikan data sudah benar sebelum menyetujui.'
              : 'Berikan alasan penolakan yang jelas.' }}
          </div>
        </div>

        <VDivider class="mt-4" />

        <VCardText class="pa-5">
          <!-- Info summary -->
          <div class="info-box rounded-lg pa-4 mb-4">
            <div class="d-flex justify-space-between align-center mb-3">
              <span class="info-label d-flex align-center gap-1">
                <VIcon icon="ri-building-line" size="15" />
                Klien
              </span>
              <span class="text-body-2 font-weight-semibold">{{ dialog.koreksi?.nama_klien }}</span>
            </div>
            <div v-if="dialog.koreksi?.no_invoice" class="d-flex justify-space-between align-center mb-3">
              <span class="info-label d-flex align-center gap-1">
                <VIcon icon="ri-file-list-3-line" size="15" />
                Invoice Tertaut
              </span>
              <span class="text-body-2 font-weight-semibold">{{ dialog.koreksi?.no_invoice }}</span>
            </div>
            <div class="d-flex justify-space-between align-center mb-3">
              <span class="info-label d-flex align-center gap-1">
                <VIcon icon="ri-money-dollar-circle-line" size="15" />
                Nilai Koreksi
              </span>
              <span
                class="text-body-2 font-weight-bold"
                :class="(dialog.koreksi?.nilai_koreksi ?? 0) >= 0 ? 'text-success' : 'text-error'"
              >
                {{ (dialog.koreksi?.nilai_koreksi ?? 0) >= 0 ? '+' : '' }}{{ formatRp(dialog.koreksi?.nilai_koreksi) }}
              </span>
            </div>
            <div class="d-flex justify-space-between align-start gap-4">
              <span class="info-label d-flex align-center gap-1 flex-shrink-0">
                <VIcon icon="ri-chat-1-line" size="15" />
                Alasan
              </span>
              <span class="text-body-2 text-right">{{ dialog.koreksi?.alasan_koreksi ?? '-' }}</span>
            </div>
          </div>

          <!-- Keterangan -->
          <VTextarea
            v-model="dialog.keterangan"
            :label="dialog.action === 'reject' ? 'Keterangan (Wajib)' : 'Keterangan (Opsional)'"
            :placeholder="dialog.action === 'reject'
              ? 'Tuliskan alasan penolakan...'
              : 'Tambahkan catatan jika diperlukan...'"
            rows="3"
            auto-grow
            variant="outlined"
            density="compact"
            hide-details="auto"
            :error-messages="dialog.error ? [dialog.error] : []"
          />
        </VCardText>

        <VDivider />
        <VCardActions class="pa-4 justify-end gap-2">
          <VBtn variant="tonal" color="secondary" @click="closeDialog">Batal</VBtn>
          <VBtn
            :color="dialog.action === 'approve' ? 'success' : 'error'"
            :loading="dialog.loading"
            :prepend-icon="dialog.action === 'approve' ? 'ri-check-line' : 'ri-close-line'"
            @click="confirmAction"
          >
            {{ dialog.action === 'approve' ? 'Setujui' : 'Tolak' }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '@/utils/axios'

const loading = ref(false)
const rows    = ref([])

const headers = [
  { title: 'CLIENT',           key: 'nama_klien',    sortable: false },
  { title: 'NOMINAL PENYESUAIAN', key: 'nilai_koreksi', sortable: false },
  { title: 'ALASAN',           key: 'alasan_koreksi',sortable: false },
  { title: 'DIAJUKAN OLEH',    key: 'submitted_by',  sortable: false },
  { title: 'TANGGAL DIAJUKAN', key: 'submitted_at',  sortable: false },
  { title: 'AKSI',             key: 'actions',       sortable: false, align: 'center' },
]

const b2bRows = computed(() => rows.value.filter(k => k.segment === 'B2B'))
const b2cRows = computed(() => rows.value.filter(k => k.segment === 'B2C'))

const loadingApproved = ref(false)
const approvedRows    = ref([])

const approvedHeaders = [
  { title: 'CLIENT',            key: 'nama_klien',         sortable: false },
  { title: 'NOMINAL PENYESUAIAN', key: 'nilai_koreksi',    sortable: false },
  { title: 'SALDO SEBELUM',     key: 'saldo_sebelum',      sortable: false },
  { title: 'SALDO SESUDAH',     key: 'saldo_sesudah',      sortable: false },
  { title: 'ALASAN',            key: 'alasan_koreksi',     sortable: false },
  { title: 'DIAJUKAN OLEH',     key: 'submitted_by',       sortable: false },
  { title: 'DISETUJUI SPV',     key: 'spv',                sortable: false },
  { title: 'DISETUJUI MANAGER', key: 'manager',            sortable: false },
  { title: 'TGL APPROVED',      key: 'manager_actioned_at',sortable: false },
  { title: 'AKSI',              key: 'actions',            sortable: false, align: 'center' },
]

const approvedB2bRows = computed(() => approvedRows.value.filter(k => k.segment === 'B2B'))
const approvedB2cRows = computed(() => approvedRows.value.filter(k => k.segment === 'B2C'))

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

async function fetchPending() {
  loading.value = true
  try {
    const { data } = await api.get('/finance/ending-balance/koreksi/pending')
    rows.value = data.data ?? []
  } finally {
    loading.value = false
  }
}

async function fetchApproved() {
  loadingApproved.value = true
  try {
    const { data } = await api.get('/finance/ending-balance/koreksi/approved')
    approvedRows.value = data.data ?? []
  } finally {
    loadingApproved.value = false
  }
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

  const k      = dialog.koreksi
  const isSPV  = k.status === 'PENDING_SPV'
  const suffix = isSPV ? '-spv' : '-manager'
  const url    = `/finance/ending-balance/koreksi/${k.id}/${dialog.action}${suffix}`

  try {
    await api.patch(url, { note: dialog.keterangan.trim() || null })
    dialog.open = false
    fetchPending()
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

<style scoped>
.action-band {
  height: 88px;
  position: relative;
  flex-shrink: 0;
}

.action-band--success {
  background: linear-gradient(135deg, rgb(var(--v-theme-success)) 0%, rgba(var(--v-theme-success), 0.65) 100%);
}

.action-band--error {
  background: linear-gradient(135deg, rgb(var(--v-theme-error)) 0%, rgba(var(--v-theme-error), 0.65) 100%);
}

.action-band-close {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0.85;
  transition: opacity 0.2s;
}

.action-band-close:hover {
  opacity: 1;
}

.action-hero {
  margin-top: -34px;
  padding: 0 24px 4px;
}

.action-avatar {
  border: 4px solid rgb(var(--v-theme-surface));
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.info-box {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.info-label {
  font-size: 0.8125rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
  white-space: nowrap;
}
</style>
