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
      <div class="d-flex gap-2">
        <VBtn
          v-if="authStore.canOperateEndingBalance"
          color="primary"
          prepend-icon="ri-magic-line"
          :loading="generating"
          @click="showGenerateDialog = true"
        >
          Generate EB
        </VBtn>
      </div>
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
          @update:model-value="doFetch"
        />
        <VTextField
          v-model="filters.periode_akhir"
          label="Sampai Periode"
          type="date"
          density="compact"
          hide-details
          style="max-width: 180px"
          @update:model-value="doFetch"
        />
        <VSelect
          v-model="filters.status"
          label="Status"
          density="compact"
          hide-details
          clearable
          style="max-width: 160px"
          :items="[{ title: 'Draft', value: 'DRAFT' }, { title: 'Locked', value: 'LOCKED' }]"
          @update:model-value="doFetch"
        />
      </VCardText>
    </VCard>

    <!-- Table -->
    <VCard>
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
          <div>
            <div class="font-weight-medium">{{ item.nama_klien }}</div>
            <div class="text-caption text-medium-emphasis">{{ item.kode_klien }} · {{ item.perusahaan }}</div>
          </div>
        </template>

        <template #item.periode="{ item }">
          <div class="text-caption">
            {{ formatDate(item.periode_awal) }} –<br>{{ formatDate(item.periode_akhir) }}
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
              <VTooltip activator="parent">Detail & Koreksi</VTooltip>
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

    <!-- Dialog Generate -->
    <VDialog v-model="showGenerateDialog" max-width="440">
      <VCard>
        <VCardTitle class="pt-4 px-4">Generate Ending Balance</VCardTitle>
        <VCardText>
          <VTextField
            v-model="genForm.periode_awal"
            label="Dari Tanggal"
            type="date"
            class="mb-3"
          />
          <VTextField
            v-model="genForm.periode_akhir"
            label="Sampai Tanggal"
            type="date"
          />
          <VAlert v-if="genError" type="error" class="mt-3" density="compact">{{ genError }}</VAlert>
        </VCardText>
        <VCardActions class="px-4 pb-4">
          <VSpacer />
          <VBtn variant="text" @click="showGenerateDialog = false">Batal</VBtn>
          <VBtn color="primary" :loading="generating" @click="doGenerate">Generate</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, defineComponent, h } from 'vue'
import { useRouter } from 'vue-router'
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
              h('th', { class: `${thClass} text-end` }, 'Tagihan'),
              h('th', { class: `${thClass} text-end` }, 'Dibayar'),
              h('th', { class: `${thClass} text-end` }, 'Sisa'),
              h('th', { class: `${thClass} text-center` }, 'Status'),
            ]),
          ]),
          h('tbody', {}, rows.value.map(inv =>
            h('tr', { key: inv.id, class: 'eb-table__row' }, [
              h('td', { class: `${tdClass} font-weight-medium` }, [
                h('span', {}, inv.no_invoice),
                inv.is_opening_balance ? h('VChip', { size: 'x-small', color: 'secondary', label: true, class: 'ml-2', style: 'font-size:10px' }, { default: () => 'OB' }) : null,
              ]),
              h('td', { class: `${tdClass} text-medium-emphasis` }, fmtDate(inv.tanggal_invoice)),
              h('td', { class: `${tdClass} text-end` }, fmt(inv.total_tagihan)),
              h('td', { class: `${tdClass} text-end text-success` }, fmt(inv.total_pembayaran)),
              h('td', { class: `${tdClass} text-end font-weight-bold ${inv.sisa_tagihan > 0 ? 'text-warning' : 'text-success'}` }, fmt(inv.sisa_tagihan)),
              h('td', { class: `${tdClass} text-center` }, [
                h('VChip', { size: 'x-small', color: statusColor(inv.status), label: true }, { default: () => inv.status }),
              ]),
            ])
          )),
        ]),
      ])
    }
  }
})

const authStore = useAuthStore()
const router    = useRouter()

const loading  = ref(false)
const rows     = ref([])
const meta     = ref({ total: 0, per_page: 15 })
const filters  = reactive({ periode_awal: '', periode_akhir: '', status: null })

const generating       = ref(false)
const showGenerateDialog = ref(false)
const genForm          = reactive({ periode_awal: '', periode_akhir: '' })
const genError         = ref('')

const lockingId       = ref(null)
const showLockDialog  = ref(false)
const lockTarget      = ref(null)
const recalcId        = ref(null)
const expanded        = ref([])
const currentPage     = ref(1)

const headers = [
  { title: 'No',             key: 'no',                sortable: false, width: '60px' },
  { title: 'Client',         key: 'nama_klien',        sortable: false },
  { title: 'Periode',        key: 'periode',           sortable: false },
  { title: 'Saldo Awal',     key: 'saldo_awal',        sortable: false, align: 'end' },
  { title: 'Invoice Masuk',  key: 'invoice_masuk',     sortable: false, align: 'end' },
  { title: 'Pembayaran',     key: 'pembayaran',        sortable: false, align: 'end' },
  { title: 'Saldo Akhir',    key: 'saldo_akhir_final', sortable: false, align: 'end' },
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
      params: { ...filters, page },
    })
    rows.value = data.data ?? []
    meta.value = { total: data.meta?.total ?? 0, per_page: data.meta?.per_page ?? 15 }
  } finally {
    loading.value = false
  }
}

function onTableOptions({ page }) {
  currentPage.value = page
  doFetch(page)
}

async function doGenerate() {
  genError.value = ''
  if (!genForm.periode_awal || !genForm.periode_akhir) {
    genError.value = 'Isi periode awal dan akhir.'
    return
  }
  generating.value = true
  try {
    const { data } = await api.post('/finance/ending-balance/generate', genForm)
    showGenerateDialog.value = false
    doFetch()
    alert(`${data.message}`)
  } catch (e) {
    genError.value = e?.response?.data?.message ?? 'Terjadi kesalahan.'
  } finally {
    generating.value = false
  }
}

async function doRecalculate(item) {
  recalcId.value = item.id
  try {
    const { data } = await api.patch(`/finance/ending-balance/${item.id}/recalculate`)
    const idx = rows.value.findIndex(r => r.id === item.id)
    if (idx !== -1) rows.value[idx] = data.data
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
    doFetch()
  } catch (e) {
    alert(e?.response?.data?.message ?? 'Gagal mengunci.')
  } finally {
    lockingId.value = null
    lockTarget.value = null
  }
}

onMounted(() => doFetch())
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
