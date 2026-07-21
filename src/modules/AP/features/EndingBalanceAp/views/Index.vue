<template>
  <div>
    <PageHeader
      title="Ending Balance AP"
      :subtitle="authStore.canApproveEndingBalanceAp
        ? 'Tinjau dan proses koreksi ending balance AP yang memerlukan persetujuan'
        : 'Saldo akhir hutang per vendor per periode'"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Ending Balance AP', disabled: true },
      ]"
    >
    </PageHeader>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- Approver (ADMIN/MANAGER/SUPERVISOR): inbox approval + list          -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <template v-if="authStore.canApproveEndingBalanceAp">
      <div class="mb-4 d-flex align-center gap-3">
        <span class="text-h6 font-weight-semibold">Koreksi Menunggu Persetujuan</span>
        <VChip v-if="pendingRows.length" size="small" color="error" label>{{ pendingRows.length }} menunggu</VChip>
      </div>

      <VCard class="mb-6">
        <VDataTable
          :headers="pendingHeaders"
          :items="pendingRows"
          :loading="pendingLoading"
          :items-per-page="10"
          :items-per-page-options="[{ value: 10, title: '10' }, { value: 25, title: '25' }, { value: 50, title: '50' }, { value: 100, title: '100' }]"
          no-data-text="Tidak ada koreksi yang menunggu persetujuan Anda."
          density="comfortable"
        >
          <template #item.tipe="{ item }">
            <VChip size="x-small" :color="tipeBadgeColor(item.tipe)" label>{{ tipeLabel(item.tipe) }}</VChip>
          </template>
          <template #item.no_dokumen="{ item }">
            <span class="text-caption font-weight-medium">{{ item.no_dokumen || '—' }}</span>
          </template>
          <template #item.nama_vendor="{ item }">
            <span class="font-weight-medium">{{ item.nama_vendor }}</span>
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
                :to="{ name: 'ap-ending-balance-show', params: { id: item.ending_balance_ap_id } }">
                <VIcon icon="ri-eye-line" size="18" />
                <VTooltip activator="parent">Lihat EB</VTooltip>
              </VBtn>
              <VBtn icon size="small" color="success" variant="tonal" @click="openApprovalActionDialog(item, 'approve')">
                <VIcon icon="ri-check-line" size="18" />
                <VTooltip activator="parent">Setujui</VTooltip>
              </VBtn>
              <VBtn icon size="small" color="error" variant="tonal" @click="openApprovalActionDialog(item, 'reject')">
                <VIcon icon="ri-close-line" size="18" />
                <VTooltip activator="parent">Tolak</VTooltip>
              </VBtn>
            </div>
          </template>
        </VDataTable>
      </VCard>

      <div class="d-flex align-center gap-3 mt-6 mb-4">
        <span class="text-h6 font-weight-semibold">List Ending Balance AP</span>
        <VDivider />
      </div>
    </template>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- List Ending Balance AP                                              -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <VCard>
      <VCardText class="d-flex flex-wrap align-center gap-3 pb-0">
        <VTextField
          v-model="periodeDraft.periode_awal"
          label="Dari Periode"
          type="date"
          density="compact"
          hide-details
          style="max-width: 180px"
        />
        <VTextField
          v-model="periodeDraft.periode_akhir"
          label="Sampai Periode"
          type="date"
          density="compact"
          hide-details
          style="max-width: 180px"
        />
        <VSelect
          v-model="filters.status"
          label="Status"
          density="compact"
          hide-details
          clearable
          style="max-width: 160px"
          :items="[{ title: 'Draft', value: 'DRAFT' }, { title: 'Locked', value: 'LOCKED' }]"
          @update:model-value="doFetch(1)"
        />
        <VBtn
          color="primary"
          variant="tonal"
          size="small"
          prepend-icon="ri-filter-3-line"
          @click="applyPeriodeFilters"
        >
          Filter
        </VBtn>
      </VCardText>
      <BaseTable
        :headers="headers"
        :items="rows"
        :total="meta.total"
        :loading="loading"
        :per-page="meta.per_page"
        :page="currentPage"
        item-value="id"
        show-expand
        v-model:expanded="expanded"
        column-resize-key="ap-ending-balance"
        @update:options="onTableOptions"
      >
        <template #item.no="{ index }">
          <span class="text-medium-emphasis">{{ (currentPage - 1) * meta.per_page + index + 1 }}</span>
        </template>

        <template #item.nama_vendor="{ item }">
          <div class="font-weight-medium text-no-wrap">{{ item.nama_vendor }}</div>
          <div class="text-caption text-medium-emphasis">{{ item.kode_vendor }}</div>
        </template>

        <template #item.perusahaan="{ item }">
          <span class="text-caption">{{ item.perusahaan ?? '-' }}</span>
        </template>

        <template #item.periode="{ item }">
          <div class="text-caption text-no-wrap">
            {{ formatDate(item.periode_awal) }} – {{ formatDate(item.periode_akhir) }}
          </div>
        </template>

        <template #item.saldo_awal="{ item }">
          {{ formatRp(item.saldo_awal) }}
        </template>

        <template #item.tagihan_masuk="{ item }">
          {{ formatRp(item.tagihan_masuk) }}
        </template>

        <template #item.pembayaran="{ item }">
          {{ formatRp(item.pembayaran) }}
        </template>

        <template #item.saldo_akhir_final="{ item }">
          <div :class="item.saldo_akhir_sistem !== item.saldo_akhir_final ? 'text-warning font-weight-bold' : 'font-weight-bold'">
            {{ formatRp(item.saldo_akhir_final) }}
          </div>
          <div v-if="item.saldo_akhir_sistem !== item.saldo_akhir_final" class="text-caption text-medium-emphasis">
            (sistem: {{ formatRp(item.saldo_akhir_sistem) }})
          </div>
        </template>

        <template #item.outstanding="{ item }">
          <div :class="item.outstanding > 0 ? 'font-weight-medium' : 'text-medium-emphasis'">
            {{ formatRp(item.outstanding) }}
          </div>
          <div class="text-caption text-medium-emphasis">{{ item.outstanding_count }} Tagihan</div>
        </template>

        <template #item.overdue="{ item }">
          <div :class="item.overdue > 0 ? 'text-error font-weight-medium' : 'text-medium-emphasis'">
            {{ formatRp(item.overdue) }}
          </div>
          <div class="text-caption text-medium-emphasis">{{ item.overdue_count }} Tagihan</div>
        </template>

        <template #item.status="{ item }">
          <EndingBalanceStatusBadge :status="item.status" />
          <VChip
            v-if="item.has_active_koreksi"
            color="info"
            size="x-small"
            class="ml-1"
            label
          >
            Ada Koreksi
          </VChip>
        </template>

        <template #expanded-row="{ item }">
          <tr>
            <td :colspan="headers.length + 1" class="pa-0">
              <EbTagihanBreakdown :eb-id="item.id" />
            </td>
          </tr>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <VBtn
              icon
              size="x-small"
              variant="text"
              color="primary"
              :to="{ name: 'ap-ending-balance-show', params: { id: item.id } }"
            >
              <VIcon icon="ri-eye-line" />
              <VTooltip activator="parent">Detail</VTooltip>
            </VBtn>
            <VBtn
              v-if="item.status === 'DRAFT' && authStore.canLockEndingBalanceAp"
              icon
              size="x-small"
              variant="tonal"
              color="success"
              :loading="lockingId === item.id"
              @click="confirmLock(item)"
            >
              <VIcon icon="ri-lock-line" />
              <VTooltip activator="parent">Kunci Periode</VTooltip>
            </VBtn>
            <VBtn
              v-if="item.status === 'LOCKED' && authStore.canLockEndingBalanceAp"
              icon
              size="x-small"
              variant="tonal"
              color="warning"
              :loading="unlockingId === item.id"
              @click="confirmUnlock(item)"
            >
              <VIcon icon="ri-lock-unlock-line" />
              <VTooltip activator="parent">Buka Periode</VTooltip>
            </VBtn>
          </div>
        </template>
      </BaseTable>
    </VCard>

    <!-- Dialog Konfirmasi Lock -->
    <VDialog v-model="showLockDialog" max-width="400">
      <VCard>
        <VCardTitle class="pt-4 px-4">Tutup Periode</VCardTitle>
        <VCardText>
          Kunci ending balance <strong>{{ lockTarget?.nama_vendor }}</strong> untuk periode
          {{ formatDate(lockTarget?.periode_awal) }} – {{ formatDate(lockTarget?.periode_akhir) }}?
          <br><br>
          Setelah dikunci, koreksi manual memerlukan persetujuan Manager/Supervisor.
        </VCardText>
        <VCardActions class="px-4 pb-4">
          <VSpacer />
          <AppActionButton action="batalkan" @click="showLockDialog = false" />
          <AppActionButton action="custom" color="success" :loading="lockingId !== null" @click="doLock">Kunci</AppActionButton>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Dialog Konfirmasi Unlock -->
    <VDialog v-model="showUnlockDialog" max-width="420">
      <VCard>
        <VCardTitle class="pt-4 px-4">Buka Kunci Periode</VCardTitle>
        <VCardText>
          Buka kunci ending balance <strong>{{ unlockTarget?.nama_vendor }}</strong> untuk periode
          {{ formatDate(unlockTarget?.periode_awal) }} – {{ formatDate(unlockTarget?.periode_akhir) }}?
          <VAlert type="warning" variant="tonal" density="compact" class="mt-3">
            Pastikan data yang akan diubah sudah dikonfirmasi sebelum mengunci ulang.
          </VAlert>
        </VCardText>
        <VCardActions class="px-4 pb-4">
          <VSpacer />
          <AppActionButton action="batalkan" @click="showUnlockDialog = false" />
          <AppActionButton action="custom" color="warning" :loading="unlockingId !== null" @click="doUnlock">Buka Kunci</AppActionButton>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Dialog Aksi Approval (Setujui/Tolak koreksi) -->
    <KoreksiApprovalDialog
      v-model="approvalActionDialog.open"
      :action="approvalActionDialog.action"
      :koreksi="approvalActionDialog.koreksi"
      :keterangan="approvalActionDialog.keterangan"
      :error="approvalActionDialog.error"
      :loading="approvalActionDialog.loading"
      @update:keterangan="approvalActionDialog.keterangan = $event"
      @close="closeApprovalActionDialog"
      @confirm="confirmApprovalAction"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, defineComponent, h } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import api from '@/utils/axios'
import EndingBalanceStatusBadge from '@/modules/Finance/shared/components/EndingBalanceStatusBadge.vue'
import KoreksiApprovalDialog from '../components/KoreksiApprovalDialog.vue'

// ─── Komponen inline: breakdown tagihan per EB ───────────────────────────────
const EbTagihanBreakdown = defineComponent({
  props: { ebId: { type: Number, required: true } },
  setup(props) {
    const rows    = ref([])
    const loading = ref(true)
    const error   = ref('')

    const fmt     = val => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val ?? 0)
    const fmtDate = d   => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'
    const statusColor = s => ({ DRAFT: 'default', DITERIMA: 'primary', SEBAGIAN: 'warning', LUNAS: 'success' })[s] ?? 'default'

    onMounted(async () => {
      try {
        const { data } = await api.get(`/ap/ending-balance/${props.ebId}/tagihan`)
        rows.value = data.data ?? []
      } catch (e) {
        error.value = e?.response?.data?.message ?? 'Gagal memuat data tagihan.'
      } finally {
        loading.value = false
      }
    })

    return () => {
      if (loading.value) {
        return h('div', { class: 'eb-breakdown d-flex align-center justify-center pa-4 gap-2 text-caption text-medium-emphasis' }, [
          h('VProgressCircular', { indeterminate: true, size: 16, width: 2 }),
          'Memuat tagihan...',
        ])
      }
      if (error.value) {
        return h('div', { class: 'eb-breakdown pa-4 text-caption text-error text-center' }, error.value)
      }
      if (!rows.value.length) {
        return h('div', { class: 'eb-breakdown pa-4 text-caption text-medium-emphasis text-center' }, 'Tidak ada tagihan dalam periode ini.')
      }

      const thClass = 'eb-th text-caption text-medium-emphasis font-weight-medium text-uppercase'
      const tdClass = 'eb-td text-caption'

      return h('div', { class: 'eb-breakdown' }, [
        h('div', { class: 'eb-breakdown__header text-caption text-medium-emphasis px-6 py-2' },
          `${rows.value.length} tagihan dalam periode ini`),
        h('table', { class: 'eb-table w-100' }, [
          h('thead', {}, [
            h('tr', {}, [
              h('th', { class: `${thClass} text-start` }, 'No Tagihan'),
              h('th', { class: `${thClass} text-start` }, 'Tanggal'),
              h('th', { class: `${thClass} text-start` }, 'Jatuh Tempo'),
              h('th', { class: `${thClass} text-end` }, 'Tagihan'),
              h('th', { class: `${thClass} text-end` }, 'CN/DN'),
              h('th', { class: `${thClass} text-end` }, 'Dibayar'),
              h('th', { class: `${thClass} text-end` }, 'Sisa'),
              h('th', { class: `${thClass} text-center` }, 'Status'),
            ]),
          ]),
          h('tbody', {}, rows.value.map(t => {
            return h('tr', { key: t.id, class: 'eb-table__row' }, [
              h('td', { class: `${tdClass} font-weight-medium` }, [
                h('span', {}, t.no_tagihan),
                t.is_opening_balance ? h('VChip', { size: 'x-small', color: 'secondary', label: true, class: 'ml-2', style: 'font-size:10px' }, { default: () => 'OB' }) : null,
              ]),
              h('td', { class: `${tdClass} text-medium-emphasis` }, fmtDate(t.tanggal_tagihan)),
              h('td', { class: `${tdClass} ${t.tanggal_jatuh_tempo && t.sisa_tagihan > 0 && t.tanggal_jatuh_tempo < new Date().toISOString().slice(0,10) ? 'text-error' : 'text-medium-emphasis'}` }, fmtDate(t.tanggal_jatuh_tempo)),
              h('td', { class: `${tdClass} text-end` }, fmt(t.total_tagihan)),
              h('td', { class: `${tdClass} text-end` }, (() => {
                const hasCN = (t.total_cn ?? 0) > 0
                const hasDN = (t.total_dn ?? 0) > 0
                if (!hasCN && !hasDN) return '—'
                const lines = []
                if (hasDN) lines.push(h('div', { class: 'text-success' }, `+ ${fmt(t.total_dn)}`))
                if (hasCN) lines.push(h('div', { class: 'text-error'   }, `− ${fmt(t.total_cn)}`))
                return lines
              })()),
              h('td', { class: `${tdClass} text-end text-success` }, fmt(t.total_pembayaran)),
              h('td', { class: `${tdClass} text-end font-weight-bold ${t.sisa_tagihan > 0 ? 'text-warning' : 'text-success'}` }, fmt(t.sisa_tagihan)),
              h('td', { class: `${tdClass} text-center` }, [
                h('VChip', { size: 'x-small', color: statusColor(t.status), label: true }, { default: () => t.status }),
              ]),
            ])
          })),
        ]),
      ])
    }
  },
})

const authStore = useAuthStore()

const loading     = ref(false)
const rows        = ref([])
const meta        = ref({ total: 0, per_page: 15 })
const currentPage = ref(1)
const expanded    = ref([])

function toDateStr(d) {
  const year  = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day   = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
const now      = new Date()
const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
const lastDay  = new Date(now.getFullYear(), now.getMonth() + 1, 0)

const filters = reactive({
  periode_awal:  toDateStr(firstDay),
  periode_akhir: toDateStr(lastDay),
  status: null,
})

const periodeDraft = reactive({
  periode_awal:  toDateStr(firstDay),
  periode_akhir: toDateStr(lastDay),
})

const lockingId        = ref(null)
const showLockDialog    = ref(false)
const lockTarget        = ref(null)
const unlockingId       = ref(null)
const showUnlockDialog  = ref(false)
const unlockTarget      = ref(null)

const headers = [
  { title: 'No',            key: 'no',                sortable: false, width: '60px' },
  { title: 'Vendor',        key: 'nama_vendor',       sortable: false },
  { title: 'Perusahaan',    key: 'perusahaan',        sortable: false },
  { title: 'Periode',       key: 'periode',           sortable: false, width: '210px' },
  { title: 'Saldo Awal',    key: 'saldo_awal',        sortable: false, align: 'end' },
  { title: 'Tagihan Masuk', key: 'tagihan_masuk',     sortable: false, align: 'end' },
  { title: 'Pembayaran',    key: 'pembayaran',        sortable: false, align: 'end' },
  { title: 'Saldo Akhir',   key: 'saldo_akhir_final', sortable: false, align: 'end' },
  { title: 'Outstanding',   key: 'outstanding',       sortable: false, align: 'end' },
  { title: 'Overdue',       key: 'overdue',           sortable: false, align: 'end' },
  { title: 'Status',        key: 'status',            sortable: false },
  { title: 'Aksi',          key: 'actions',           sortable: false, align: 'end' },
]

function formatRp(val) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val ?? 0)
}
function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}
function formatDatetime(d) {
  if (!d) return '-'
  return new Date(d).toLocaleString('id-ID')
}

async function doFetch(page = 1) {
  loading.value = true
  try {
    const { data } = await api.get('/ap/ending-balance', {
      params: { ...filters, page },
      timeout: 60000,
    })
    rows.value = data.data ?? []
    meta.value = { total: data.meta?.total ?? 0, per_page: data.meta?.per_page ?? 15 }
  } finally {
    loading.value = false
  }
}

function applyPeriodeFilters() {
  Object.assign(filters, periodeDraft)
  doFetch(1)
}

function onTableOptions({ page }) {
  currentPage.value = page
  doFetch(page)
}

function confirmLock(item) {
  lockTarget.value     = item
  showLockDialog.value = true
}

async function doLock() {
  if (!lockTarget.value) return
  lockingId.value = lockTarget.value.id
  try {
    await api.patch(`/ap/ending-balance/${lockTarget.value.id}/lock`)
    showLockDialog.value = false
    doFetch(currentPage.value)
  } catch (e) {
    alert(e?.response?.data?.message ?? 'Gagal mengunci.')
  } finally {
    lockingId.value  = null
    lockTarget.value = null
  }
}

function confirmUnlock(item) {
  unlockTarget.value     = item
  showUnlockDialog.value = true
}

async function doUnlock() {
  if (!unlockTarget.value) return
  unlockingId.value = unlockTarget.value.id
  try {
    await api.patch(`/ap/ending-balance/${unlockTarget.value.id}/unlock`)
    showUnlockDialog.value = false
    doFetch(currentPage.value)
  } catch (e) {
    alert(e?.response?.data?.message ?? 'Gagal membuka kunci periode.')
  } finally {
    unlockingId.value  = null
    unlockTarget.value = null
  }
}

// ─── State & fungsi Approval Koreksi ─────────────────────────────────────────
const pendingLoading = ref(false)
const pendingRows    = ref([])

const pendingHeaders = [
  { title: 'TIPE',             key: 'tipe',          sortable: false },
  { title: 'NO DOKUMEN',       key: 'no_dokumen',    sortable: false },
  { title: 'VENDOR',           key: 'nama_vendor',   sortable: false },
  { title: 'NOMINAL',          key: 'nilai_koreksi', sortable: false },
  { title: 'ALASAN',           key: 'alasan_koreksi',sortable: false },
  { title: 'DIAJUKAN OLEH',    key: 'submitted_by',  sortable: false },
  { title: 'TANGGAL DIAJUKAN', key: 'submitted_at',  sortable: false },
  { title: 'AKSI',             key: 'actions',       sortable: false, align: 'center' },
]

const approvalActionDialog = reactive({
  open      : false,
  action    : null,
  koreksi   : null,
  keterangan: '',
  error     : '',
  loading   : false,
})

function tipeBadgeColor(tipe) {
  return { CREDIT_NOTE: 'error', DEBIT_NOTE: 'info', KOREKSI_SALDO: 'secondary' }[tipe] ?? 'default'
}

function tipeLabel(tipe) {
  return { CREDIT_NOTE: 'CN', DEBIT_NOTE: 'DN', KOREKSI_SALDO: 'Koreksi Saldo' }[tipe] ?? (tipe || '—')
}

async function fetchPending() {
  pendingLoading.value = true
  try {
    const { data } = await api.get('/ap/ending-balance/koreksi/pending')
    pendingRows.value = data.data ?? []
  } finally {
    pendingLoading.value = false
  }
}

function openApprovalActionDialog(koreksi, action) {
  approvalActionDialog.koreksi    = koreksi
  approvalActionDialog.action     = action
  approvalActionDialog.keterangan = ''
  approvalActionDialog.error      = ''
  approvalActionDialog.loading    = false
  approvalActionDialog.open       = true
}

function closeApprovalActionDialog() {
  approvalActionDialog.open = false
}

async function confirmApprovalAction() {
  if (approvalActionDialog.action === 'reject' && !approvalActionDialog.keterangan.trim()) {
    approvalActionDialog.error = 'Keterangan wajib diisi saat menolak koreksi.'
    return
  }

  approvalActionDialog.error   = ''
  approvalActionDialog.loading = true

  const k   = approvalActionDialog.koreksi
  const url = `/ap/ending-balance/koreksi/${k.id}/${approvalActionDialog.action}`

  try {
    await api.patch(url, { note: approvalActionDialog.keterangan.trim() || null })
    approvalActionDialog.open = false
    fetchPending()
    doFetch(currentPage.value)
  } catch (e) {
    approvalActionDialog.error = e?.response?.data?.message ?? 'Terjadi kesalahan.'
  } finally {
    approvalActionDialog.loading = false
  }
}

onMounted(() => {
  doFetch()
  if (authStore.canApproveEndingBalanceAp) {
    fetchPending()
  }
})
</script>

<style scoped>
:deep(.v-data-table__tr:hover > td) {
  background: rgba(var(--v-theme-on-surface), 0.05) !important;
}

:deep(.v-data-table__tr--expanded > td) {
  background: transparent !important;
}

:deep(.eb-breakdown) {
  border-top: 2px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-bottom: 2px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.eb-breakdown__header {
  padding: 6px 16px;
  font-size: 0.75rem;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  opacity: 0.7;
  letter-spacing: 0.02em;
  background: rgba(var(--v-theme-on-surface), 0.03);
}

:deep(.eb-table) {
  border-collapse: collapse;
  width: 100%;
}

:deep(.eb-th) {
  padding: 8px 16px;
  letter-spacing: 0.05em;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  white-space: nowrap;
  background: rgba(var(--v-theme-on-surface), 0.03);
}

:deep(.eb-td) {
  padding: 8px 16px;
  white-space: nowrap;
}

:deep(.eb-table__row:nth-child(odd)) {
  background: transparent !important;
}

:deep(.eb-table__row:nth-child(even)) {
  background: rgba(var(--v-theme-on-surface), 0.04) !important;
}

:deep(.eb-table__row:hover) {
  background: rgba(var(--v-theme-on-surface), 0.08) !important;
}
</style>
