<template>
  <div>
    <PageHeader
      title="Ending Balance"
      subtitle="Saldo akhir piutang per klien per periode"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Ending Balance', disabled: true },
      ]"
    >
      </PageHeader>

    <!-- Filter -->
    <VCard class="mb-4">
      <VCardText class="d-flex flex-wrap gap-3">
        <VTextField
          v-model="filters.periode_awal"
          label="Dari Periode"
          type="date"
          density="compact"
          hide-details
          style="max-width: 180px"
          @update:model-value="() => { doFetch(1); doFetchB2B(1) }"
        />
        <VTextField
          v-model="filters.periode_akhir"
          label="Sampai Periode"
          type="date"
          density="compact"
          hide-details
          style="max-width: 180px"
          @update:model-value="() => { doFetch(1); doFetchB2B(1) }"
        />
        <VSelect
          v-model="filters.status"
          label="Status"
          density="compact"
          hide-details
          clearable
          style="max-width: 160px"
          :items="[{ title: 'Draft', value: 'DRAFT' }, { title: 'Locked', value: 'LOCKED' }]"
          @update:model-value="() => { doFetch(1); doFetchB2B(1) }"
        />
      </VCardText>
    </VCard>

    <!-- Tabel B2B -->
    <VCard class="mb-4">
      <VCardTitle class="px-4 pt-4 pb-0 text-body-1 font-weight-bold d-flex align-center gap-2">
        <VIcon icon="ri-building-line" size="20" color="primary" />
        Ending Balance B2B
      </VCardTitle>
      <VDataTableServer
        :headers="headers"
        :items="rowsB2B"
        :items-length="metaB2B.total"
        :loading="loadingB2B"
        :items-per-page="metaB2B.per_page"
        item-value="id"
        show-expand
        v-model:expanded="expandedB2B"
        @update:options="onTableOptionsB2B"
      >
        <template #item.no="{ index }">
          <span class="text-medium-emphasis">{{ (currentPageB2B - 1) * metaB2B.per_page + index + 1 }}</span>
        </template>

        <template #item.nama_klien="{ item }">
          <div class="font-weight-medium text-no-wrap">{{ item.nama_klien }}</div>
        </template>

        <template #item.periode="{ item }">
          <div class="text-caption text-no-wrap">
            {{ formatDate(item.periode_awal) }} – {{ formatDate(item.periode_akhir) }}
          </div>
        </template>

        <template #item.saldo_awal="{ item }">
          {{ formatRp(item.saldo_awal) }}
        </template>

        <template #item.invoice_masuk="{ item }">
          {{ formatRp(item.invoice_masuk) }}
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
          <div class="text-caption text-medium-emphasis">{{ item.outstanding_count }} Invoice</div>
        </template>

        <template #item.overdue="{ item }">
          <div :class="item.overdue > 0 ? 'text-error font-weight-medium' : 'text-medium-emphasis'">
            {{ formatRp(item.overdue) }}
          </div>
          <div class="text-caption text-medium-emphasis">{{ item.overdue_count }} Invoice</div>
        </template>

        <template #item.status="{ item }">
          <VChip
            :color="item.status === 'LOCKED' ? 'success' : 'warning'"
            size="small"
            label
          >
            {{ item.status }}
          </VChip>
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
              <EbInvoiceBreakdown :eb-id="item.id" />
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
              :to="{ name: 'finance-ending-balance-show', params: { id: item.id } }"
            >
              <VIcon icon="ri-eye-line" />
              <VTooltip activator="parent">Detail</VTooltip>
            </VBtn>
            <VBtn
              v-if="item.status === 'LOCKED' && authStore.canOperateEndingBalance && !item.has_active_koreksi"
              icon
              size="x-small"
              variant="tonal"
              color="info"
              @click="openKoreksiDialog(item)"
            >
              <VIcon icon="ri-pencil-line" />
              <VTooltip activator="parent">Ajukan Koreksi</VTooltip>
            </VBtn>
            <VBtn
              v-if="item.status === 'DRAFT' && authStore.canOperateEndingBalance"
              icon
              size="x-small"
              variant="text"
              color="warning"
              :loading="recalcId === item.id"
              @click="doRecalculate(item)"
            >
              <VIcon icon="ri-refresh-line" />
              <VTooltip activator="parent">Hitung Ulang</VTooltip>
            </VBtn>
            <VBtn
              v-if="item.status === 'DRAFT' && authStore.canOperateEndingBalance"
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
          </div>
        </template>
      </VDataTableServer>
    </VCard>

    <!-- Tabel B2C -->
    <VCard>
      <VCardTitle class="px-4 pt-4 pb-0 text-body-1 font-weight-bold d-flex align-center gap-2">
        <VIcon icon="ri-store-line" size="20" color="secondary" />
        Ending Balance B2C
      </VCardTitle>
      <VDataTableServer
        :headers="headers"
        :items="rows"
        :items-length="meta.total"
        :loading="loading"
        :items-per-page="meta.per_page"
        item-value="id"
        show-expand
        v-model:expanded="expanded"
        @update:options="onTableOptions"
      >
        <template #item.no="{ index }">
          <span class="text-medium-emphasis">{{ (currentPage - 1) * meta.per_page + index + 1 }}</span>
        </template>

        <template #item.nama_klien="{ item }">
          <div class="font-weight-medium text-no-wrap">{{ item.nama_klien }}</div>
        </template>

        <template #item.periode="{ item }">
          <div class="text-caption text-no-wrap">
            {{ formatDate(item.periode_awal) }} – {{ formatDate(item.periode_akhir) }}
          </div>
        </template>

        <template #item.saldo_awal="{ item }">
          {{ formatRp(item.saldo_awal) }}
        </template>

        <template #item.invoice_masuk="{ item }">
          {{ formatRp(item.invoice_masuk) }}
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
          <div class="text-caption text-medium-emphasis">{{ item.outstanding_count }} Invoice</div>
        </template>

        <template #item.overdue="{ item }">
          <div :class="item.overdue > 0 ? 'text-error font-weight-medium' : 'text-medium-emphasis'">
            {{ formatRp(item.overdue) }}
          </div>
          <div class="text-caption text-medium-emphasis">{{ item.overdue_count }} Invoice</div>
        </template>

        <template #item.status="{ item }">
          <VChip
            :color="item.status === 'LOCKED' ? 'success' : 'warning'"
            size="small"
            label
          >
            {{ item.status }}
          </VChip>
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
              <EbInvoiceBreakdown :eb-id="item.id" />
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
              :to="{ name: 'finance-ending-balance-show', params: { id: item.id } }"
            >
              <VIcon icon="ri-eye-line" />
              <VTooltip activator="parent">Detail</VTooltip>
            </VBtn>
            <VBtn
              v-if="item.status === 'LOCKED' && authStore.canOperateEndingBalance && !item.has_active_koreksi"
              icon
              size="x-small"
              variant="tonal"
              color="info"
              @click="openKoreksiDialog(item)"
            >
              <VIcon icon="ri-pencil-line" />
              <VTooltip activator="parent">Ajukan Koreksi</VTooltip>
            </VBtn>
            <VBtn
              v-if="item.status === 'DRAFT' && authStore.canOperateEndingBalance"
              icon
              size="x-small"
              variant="text"
              color="warning"
              :loading="recalcId === item.id"
              @click="doRecalculate(item)"
            >
              <VIcon icon="ri-refresh-line" />
              <VTooltip activator="parent">Hitung Ulang</VTooltip>
            </VBtn>
            <VBtn
              v-if="item.status === 'DRAFT' && authStore.canOperateEndingBalance"
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
          </div>
        </template>
      </VDataTableServer>
    </VCard>

    <!-- Dialog Konfirmasi Lock -->
    <VDialog v-model="showLockDialog" max-width="400">
      <VCard>
        <VCardTitle class="pt-4 px-4">Tutup Periode</VCardTitle>
        <VCardText>
          Kunci ending balance <strong>{{ lockTarget?.nama_klien }}</strong> untuk periode
          {{ formatDate(lockTarget?.periode_awal) }} – {{ formatDate(lockTarget?.periode_akhir) }}?
          <br><br>
          Setelah dikunci, koreksi manual memerlukan persetujuan SPV dan Manager.
        </VCardText>
        <VCardActions class="px-4 pb-4">
          <VSpacer />
          <VBtn variant="text" @click="showLockDialog = false">Batal</VBtn>
          <VBtn color="success" :loading="lockingId !== null" @click="doLock">Kunci</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Dialog Ajukan Koreksi -->
    <VDialog v-model="showKoreksiDialog" max-width="680" persistent>
      <VCard>
        <VCardTitle class="pt-4 px-4 text-body-1 font-weight-bold">
          Ajukan Koreksi Manual
        </VCardTitle>
        <VCardSubtitle class="px-4 pb-2 text-caption">
          {{ koreksiTarget?.nama_klien }} · {{ formatDate(koreksiTarget?.periode_awal) }} – {{ formatDate(koreksiTarget?.periode_akhir) }}
        </VCardSubtitle>
        <VDivider />

        <!-- Context panel: ringkasan saldo -->
        <VCard variant="tonal" class="mx-4 mt-4 mb-1" rounded="lg">
          <VCardText class="py-3 px-4">
            <VRow dense>
              <VCol cols="12" sm="4">
                <div class="text-caption text-medium-emphasis mb-1">Saldo Akhir Sistem</div>
                <div class="text-body-1 font-weight-medium">{{ formatRp(koreksiTarget?.saldo_akhir_sistem) }}</div>
              </VCol>
              <VCol cols="12" sm="4">
                <div class="text-caption text-medium-emphasis mb-1">Saldo Akhir Final (Sekarang)</div>
                <div class="text-body-1 font-weight-bold">{{ formatRp(koreksiTarget?.saldo_akhir_final) }}</div>
              </VCol>
              <VCol cols="12" sm="4">
                <div class="text-caption text-medium-emphasis mb-1">Saldo Setelah Koreksi</div>
                <div class="text-body-1 font-weight-bold text-primary">
                  {{ formatRp(Number(koreksiTarget?.saldo_akhir_final ?? 0) + Number(koreksiForm.nilai_koreksi || 0)) }}
                </div>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>

        <VCardText class="pt-3">
          <VRow>
            <VCol cols="12">
              <VTextField
                v-model="koreksiForm.nilai_koreksi"
                label="Nilai Koreksi"
                type="number"
                hint="Masukkan nilai positif untuk menambah saldo, negatif untuk mengurangi saldo"
                persistent-hint
              />
            </VCol>
            <VCol cols="12">
              <VTextarea
                v-model="koreksiForm.alasan_koreksi"
                label="Alasan Koreksi"
                rows="3"
                auto-grow
                counter="1000"
                hint="Wajib diisi. Maks 1000 karakter."
                persistent-hint
              />
            </VCol>
            <VCol cols="12">
              <VTextField
                v-model="koreksiForm.dokumen_url"
                label="URL Dokumen Pendukung (opsional)"
                hint="Lampirkan link Google Drive, SharePoint, atau URL lainnya"
                persistent-hint
              />
            </VCol>
          </VRow>
          <VAlert
            type="info"
            density="compact"
            variant="tonal"
            icon="ri-shield-check-line"
            class="mt-4"
          >
            Koreksi ini memerlukan persetujuan dua tahap: <strong>SPV</strong> terlebih dahulu, kemudian <strong>Manager</strong>. Saldo tidak akan berubah sampai keduanya menyetujui.
          </VAlert>
          <VAlert v-if="koreksiError" type="error" class="mt-2" density="compact">{{ koreksiError }}</VAlert>
        </VCardText>
        <VCardActions class="px-4 pb-4">
          <VSpacer />
          <VBtn variant="text" :disabled="submittingKoreksi" @click="showKoreksiDialog = false">Batal</VBtn>
          <VBtn color="primary" :loading="submittingKoreksi" @click="submitKoreksiDialog">Ajukan Koreksi</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, defineComponent, h } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import api from '@/utils/axios'

// ─── Komponen inline: breakdown invoice per EB ───────────────────────────────
const EbInvoiceBreakdown = defineComponent({
  props: { ebId: { type: Number, required: true } },
  setup(props) {
    const rows    = ref([])
    const loading = ref(true)
    const error   = ref('')

    const fmt     = val => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val ?? 0)
    const fmtDate = d   => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'
    const statusColor = s => ({ DRAFT: 'default', TERKIRIM: 'primary', SEBAGIAN: 'warning', LUNAS: 'success' })[s] ?? 'default'

    onMounted(async () => {
      try {
        const { data } = await api.get(`/finance/ending-balance/${props.ebId}/invoices`)
        rows.value = data.data ?? []
      } catch (e) {
        error.value = e?.response?.data?.message ?? 'Gagal memuat data invoice.'
      } finally {
        loading.value = false
      }
    })

    return () => {
      if (loading.value) {
        return h('div', { class: 'eb-breakdown d-flex align-center justify-center pa-4 gap-2 text-caption text-medium-emphasis' }, [
          h('VProgressCircular', { indeterminate: true, size: 16, width: 2 }),
          'Memuat invoice...',
        ])
      }
      if (error.value) {
        return h('div', { class: 'eb-breakdown pa-4 text-caption text-error text-center' }, error.value)
      }
      if (!rows.value.length) {
        return h('div', { class: 'eb-breakdown pa-4 text-caption text-medium-emphasis text-center' }, 'Tidak ada invoice dalam periode ini.')
      }

      const thClass  = 'eb-th text-caption text-medium-emphasis font-weight-medium text-uppercase'
      const tdClass  = 'eb-td text-caption'

      return h('div', { class: 'eb-breakdown' }, [
        h('div', { class: 'eb-breakdown__header text-caption text-medium-emphasis px-6 py-2' },
          `${rows.value.length} invoice dalam periode ini`),
        h('table', { class: 'eb-table w-100' }, [
          h('thead', {}, [
            h('tr', {}, [
              h('th', { class: `${thClass} text-start` }, 'No Invoice'),
              h('th', { class: `${thClass} text-start` }, 'Tanggal'),
              h('th', { class: `${thClass} text-start` }, 'Jatuh Tempo'),
              h('th', { class: `${thClass} text-end` }, 'Tagihan'),
              h('th', { class: `${thClass} text-end` }, 'Dibayar'),
              h('th', { class: `${thClass} text-end` }, 'Sisa'),
              h('th', { class: `${thClass} text-center` }, 'Status'),
            ]),
          ]),
          h('tbody', {}, rows.value.map(inv => {
            const sisaSubtotal = Math.max(0, (inv.subtotal ?? 0) - (inv.total_pembayaran ?? 0))
            return h('tr', { key: inv.id, class: 'eb-table__row' }, [
              h('td', { class: `${tdClass} font-weight-medium` }, [
                h('span', {}, inv.no_invoice),
                inv.is_opening_balance ? h('VChip', { size: 'x-small', color: 'secondary', label: true, class: 'ml-2', style: 'font-size:10px' }, { default: () => 'OB' }) : null,
              ]),
              h('td', { class: `${tdClass} text-medium-emphasis` }, fmtDate(inv.tanggal_invoice)),
              h('td', { class: `${tdClass} ${inv.tanggal_jatuh_tempo && inv.sisa_tagihan > 0 && inv.tanggal_jatuh_tempo < new Date().toISOString().slice(0,10) ? 'text-error' : 'text-medium-emphasis'}` }, fmtDate(inv.tanggal_jatuh_tempo)),
              h('td', { class: `${tdClass} text-end` }, fmt(inv.subtotal)),
              h('td', { class: `${tdClass} text-end text-success` }, fmt(inv.total_pembayaran)),
              h('td', { class: `${tdClass} text-end font-weight-bold ${sisaSubtotal > 0 ? 'text-warning' : 'text-success'}` }, fmt(sisaSubtotal)),
              h('td', { class: `${tdClass} text-center` }, [
                h('VChip', { size: 'x-small', color: statusColor(inv.status), label: true }, { default: () => inv.status }),
              ]),
            ])
          })),
        ]),
      ])
    }
  }
})

const authStore = useAuthStore()

// ─── State B2C ────────────────────────────────────────────────────────────────
const loading     = ref(false)
const rows        = ref([])
const meta        = ref({ total: 0, per_page: 15 })
const currentPage = ref(1)
const expanded    = ref([])

// ─── State B2B ────────────────────────────────────────────────────────────────
const loadingB2B     = ref(false)
const rowsB2B        = ref([])
const metaB2B        = ref({ total: 0, per_page: 15 })
const currentPageB2B = ref(1)
const expandedB2B    = ref([])

function toDateStr(d) {
  const year  = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day   = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
const now      = new Date()
const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
const lastDay  = new Date(now.getFullYear(), now.getMonth() + 1, 0)
const filters  = reactive({
  periode_awal:  toDateStr(firstDay),
  periode_akhir: toDateStr(lastDay),
  status: null,
})

const lockingId       = ref(null)
const showLockDialog  = ref(false)
const lockTarget      = ref(null)
const recalcId        = ref(null)

const showKoreksiDialog = ref(false)
const koreksiTarget     = ref(null)
const koreksiForm       = reactive({ nilai_koreksi: '', alasan_koreksi: '', dokumen_url: '' })
const submittingKoreksi = ref(false)
const koreksiError      = ref('')

const headers = [
  { title: 'No',             key: 'no',                sortable: false, width: '60px' },
  { title: 'Client',         key: 'nama_klien',        sortable: false },
  { title: 'Periode',        key: 'periode',           sortable: false, width: '210px' },
  { title: 'Saldo Awal',     key: 'saldo_awal',        sortable: false, align: 'end' },
  { title: 'Invoice Masuk',  key: 'invoice_masuk',     sortable: false, align: 'end' },
  { title: 'Pembayaran',     key: 'pembayaran',        sortable: false, align: 'end' },
  { title: 'Saldo Akhir',    key: 'saldo_akhir_final', sortable: false, align: 'end' },
  { title: 'Outstanding',    key: 'outstanding',       sortable: false, align: 'end' },
  { title: 'Overdue',        key: 'overdue',           sortable: false, align: 'end' },
  { title: 'Status',         key: 'status',            sortable: false },
  { title: 'Aksi',           key: 'actions',           sortable: false, align: 'end' },
]

function formatRp(val) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val ?? 0)
}
function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

async function doFetch(page = 1) {
  loading.value = true
  try {
    const { data } = await api.get('/finance/ending-balance', {
      params: { ...filters, segment: 'B2C', page },
    })
    rows.value = data.data ?? []
    meta.value = { total: data.meta?.total ?? 0, per_page: data.meta?.per_page ?? 15 }
  } finally {
    loading.value = false
  }
}

async function doFetchB2B(page = 1) {
  loadingB2B.value = true
  try {
    const { data } = await api.get('/finance/ending-balance', {
      params: { ...filters, segment: 'B2B', page },
    })
    rowsB2B.value = data.data ?? []
    metaB2B.value = { total: data.meta?.total ?? 0, per_page: data.meta?.per_page ?? 15 }
  } finally {
    loadingB2B.value = false
  }
}

function onTableOptions({ page }) {
  currentPage.value = page
  doFetch(page)
}

function onTableOptionsB2B({ page }) {
  currentPageB2B.value = page
  doFetchB2B(page)
}

async function doRecalculate(item) {
  recalcId.value = item.id
  try {
    const { data } = await api.patch(`/finance/ending-balance/${item.id}/recalculate`)
    const idx = rows.value.findIndex(r => r.id === item.id)
    if (idx !== -1) rows.value[idx] = data.data
    const idxB2B = rowsB2B.value.findIndex(r => r.id === item.id)
    if (idxB2B !== -1) rowsB2B.value[idxB2B] = data.data
  } catch (e) {
    alert(e?.response?.data?.message ?? 'Gagal menghitung ulang.')
  } finally {
    recalcId.value = null
  }
}

function confirmLock(item) {
  lockTarget.value  = item
  showLockDialog.value = true
}

async function doLock() {
  if (!lockTarget.value) return
  lockingId.value = lockTarget.value.id
  try {
    await api.patch(`/finance/ending-balance/${lockTarget.value.id}/lock`)
    showLockDialog.value = false
    doFetch(currentPage.value)
    doFetchB2B(currentPageB2B.value)
  } catch (e) {
    alert(e?.response?.data?.message ?? 'Gagal mengunci.')
  } finally {
    lockingId.value = null
    lockTarget.value = null
  }
}

function openKoreksiDialog(item) {
  koreksiTarget.value        = item
  koreksiForm.nilai_koreksi  = ''
  koreksiForm.alasan_koreksi = ''
  koreksiForm.dokumen_url    = ''
  koreksiError.value         = ''
  showKoreksiDialog.value    = true
}

async function submitKoreksiDialog() {
  koreksiError.value = ''
  if (!koreksiForm.nilai_koreksi || !koreksiForm.alasan_koreksi) {
    koreksiError.value = 'Nilai koreksi dan alasan wajib diisi.'
    return
  }
  submittingKoreksi.value = true
  try {
    await api.post(`/finance/ending-balance/${koreksiTarget.value.id}/koreksi`, koreksiForm)
    showKoreksiDialog.value = false
    const idx = rows.value.findIndex(r => r.id === koreksiTarget.value.id)
    if (idx !== -1) rows.value[idx] = { ...rows.value[idx], has_active_koreksi: true }
    const idxB2B = rowsB2B.value.findIndex(r => r.id === koreksiTarget.value.id)
    if (idxB2B !== -1) rowsB2B.value[idxB2B] = { ...rowsB2B.value[idxB2B], has_active_koreksi: true }
  } catch (e) {
    koreksiError.value = e?.response?.data?.message ?? 'Gagal mengajukan koreksi.'
  } finally {
    submittingKoreksi.value = false
  }
}

onMounted(() => { doFetch(); doFetchB2B() })
</script>

<style scoped>
/* Fix: hover row jangan berubah putih */
:deep(.v-data-table__tr:hover > td) {
  background: rgba(var(--v-theme-on-surface), 0.05) !important;
}

/* Expanded row: hapus background putih bawaan */
:deep(.v-data-table__tr--expanded > td) {
  background: transparent !important;
}

/* Wrapper expanded row — ikuti background tabel utama */
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

/* Tabel invoice breakdown */
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

/* Zebra stripe sama dengan Vuetify standard */
:deep(.eb-table__row) {
  transition: background 0.15s;
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
