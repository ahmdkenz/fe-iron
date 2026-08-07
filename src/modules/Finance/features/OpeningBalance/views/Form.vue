<template>
  <div class="opening-balance-page">
    <PageHeader
      :title="pageTitle"
      :subtitle="pageSubtitle"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Opening Balance', to: { name: 'finance-opening-balance' } },
        { title: breadcrumbLabel, disabled: true }
      ]"
    >
      <VBtn
        variant="tonal"
        color="secondary"
        :to="{ name: 'finance-opening-balance' }"
      >
        <VIcon
          icon="ri-arrow-left-line"
          class="me-1"
        />
        Kembali
      </VBtn>
    </PageHeader>

    <div
      v-if="pageLoading"
      class="py-6"
    >
      <VCard class="opening-balance-loading-card">
        <VCardText class="text-center py-12">
          <VProgressCircular
            indeterminate
            color="primary"
            class="mb-4"
          />
          <div class="text-body-1 font-weight-medium">
            Memuat data opening balance...
          </div>
          <div class="text-body-2 text-medium-emphasis mt-1">
            Mohon tunggu sebentar, formulir sedang disiapkan.
          </div>
        </VCardText>
      </VCard>
    </div>

    <VForm
      v-else
      ref="formRef"
      @submit.prevent="handleSubmit"
    >
      <VRow class="opening-balance-layout">
        <VCol cols="12">
          <VCard class="opening-balance-hero">
            <VCardText class="pa-6 pa-md-8">
              <div class="d-flex flex-wrap align-center justify-space-between gap-6">
                <div class="opening-balance-hero__copy">
                  <div class="text-overline text-primary font-weight-bold mb-2">
                    {{ isEditing ? 'REVISI OPENING BALANCE' : 'PENGAJUAN OPENING BALANCE' }}
                  </div>
                  <h2 class="text-h5 text-md-h4 font-weight-bold mb-2">
                    {{ heroTitle }}
                  </h2>
                  <p class="text-body-1 text-medium-emphasis mb-0">
                    {{ heroSubtitle }}
                  </p>
                </div>

                <div class="opening-balance-hero__stats">
                  <template v-if="mode === 'single'">
                    <div class="hero-stat">
                      <span class="hero-stat__label">Klien</span>
                      <strong class="hero-stat__value">{{ selectedKlien?.nama_klien ?? 'Belum dipilih' }}</strong>
                    </div>
                    <div class="hero-stat">
                      <span class="hero-stat__label">Saldo Awal</span>
                      <strong class="hero-stat__value">{{ formattedSaldoAwal }}</strong>
                    </div>
                  </template>
                  <template v-else>
                    <div class="hero-stat">
                      <span class="hero-stat__label">Jumlah Client</span>
                      <strong class="hero-stat__value">{{ bulkClientCount }} dari {{ bulkGroups.length }} baris</strong>
                    </div>
                    <div class="hero-stat">
                      <span class="hero-stat__label">Total Saldo Awal</span>
                      <strong class="hero-stat__value">{{ formattedBulkTotalSaldo }}</strong>
                    </div>
                  </template>
                </div>
              </div>

              <div
                v-if="!isEditing"
                class="mode-select mt-6"
              >
                <button
                  v-for="option in modeOptions"
                  :key="option.value"
                  type="button"
                  class="mode-select-card"
                  :class="{ 'mode-select-card--active': mode === option.value }"
                  @click="mode = option.value"
                >
                  <span class="mode-select-card__check">
                    <VIcon
                      icon="ri-checkbox-circle-fill"
                      size="18"
                    />
                  </span>
                  <span class="mode-select-card__icon">
                    <VIcon
                      :icon="option.icon"
                      size="22"
                    />
                  </span>
                  <span class="mode-select-card__body">
                    <strong class="mode-select-card__title">{{ option.title }}</strong>
                    <span class="mode-select-card__desc">{{ option.description }}</span>
                  </span>
                </button>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <VCol cols="12">
          <VAlert
            type="info"
            variant="tonal"
            density="compact"
            icon="ri-information-line"
          >
            <div class="text-body-2">
              <strong>Kapan menggunakan Opening Balance?</strong>
              Hanya untuk piutang <em>historis</em> yang berasal dari luar sistem (spreadsheet, sistem lama, atau manual).
              Jika invoice sudah pernah diinput di sistem ini, sisa tagihan sudah otomatis terbawa — tidak perlu Opening Balance.
            </div>
          </VAlert>
        </VCol>

        <!-- SINGLE MODE -->
        <template v-if="mode === 'single'">
          <VCol
            cols="12"
            lg="8"
          >
            <OpeningBalanceGroupFields
              v-model:group="form"
              :klien-list="klienList"
              :klien-loading="klienLoading"
              :is-editing="isEditing"
              show-no-invoice
              :errors="errors"
              @focus-klien="ensureKlienLoaded"
            />
          </VCol>

          <VCol
            cols="12"
            lg="4"
          >
            <VCard class="opening-balance-sidebar-card mb-4">
              <VCardText class="pa-6">
                <div class="section-heading section-heading--compact mb-5">
                  <div class="section-heading__icon section-heading__icon--soft">
                    <VIcon icon="ri-file-chart-line" />
                  </div>
                  <div>
                    <h3 class="text-subtitle-1 font-weight-bold mb-1">
                      Ringkasan
                    </h3>
                    <p class="text-body-2 text-medium-emphasis mb-0">
                      Preview data pengajuan yang sedang diisi.
                    </p>
                  </div>
                </div>

                <div class="summary-amount mb-5">
                  <span class="summary-amount__label">Saldo awal saat ini</span>
                  <div class="summary-amount__value">
                    {{ formattedSaldoAwal }}
                  </div>
                </div>

                <div class="summary-list">
                  <div class="summary-list__item">
                    <span class="summary-list__label">Mode</span>
                    <VChip
                      size="small"
                      :color="isEditing ? 'warning' : 'primary'"
                      variant="tonal"
                      label
                    >
                      {{ isEditing ? 'Edit data' : 'Pengajuan baru' }}
                    </VChip>
                  </div>

                  <div class="summary-list__item">
                    <span class="summary-list__label">Client</span>
                    <strong class="summary-list__value">{{ selectedKlien?.nama_klien ?? '-' }}</strong>
                    <span class="summary-list__hint">{{ selectedKlienMeta }}</span>
                  </div>

                  <div class="summary-list__item">
                    <span class="summary-list__label">Entitas</span>
                    <strong class="summary-list__value">{{ selectedCompanyName || '-' }}</strong>
                  </div>

                  <div class="summary-list__item">
                    <span class="summary-list__label">PIC AR</span>
                    <strong class="summary-list__value">{{ selectedPicArName || '-' }}</strong>
                  </div>

                  <div class="summary-list__item">
                    <span class="summary-list__label">Tanggal</span>
                    <strong class="summary-list__value">{{ formattedTanggal }}</strong>
                  </div>
                </div>
              </VCardText>
            </VCard>

            <VCard class="opening-balance-sidebar-card mb-4">
              <VCardText class="pa-6">
                <div class="section-heading section-heading--compact mb-4">
                  <div class="section-heading__icon section-heading__icon--soft">
                    <VIcon icon="ri-task-line" />
                  </div>
                  <div>
                    <h3 class="text-subtitle-1 font-weight-bold mb-1">
                      Checklist Form
                    </h3>
                    <p class="text-body-2 text-medium-emphasis mb-0">
                      Pastikan komponen utama pengajuan sudah lengkap.
                    </p>
                  </div>
                </div>

                <div class="checklist-list">
                  <div
                    v-for="item in checklistItems"
                    :key="item.label"
                    class="checklist-list__item"
                  >
                    <VAvatar
                      :color="item.done ? 'success' : 'secondary'"
                      variant="tonal"
                      size="36"
                    >
                      <VIcon :icon="item.done ? 'ri-check-line' : 'ri-time-line'" />
                    </VAvatar>

                    <div class="flex-grow-1">
                      <div class="text-body-2 font-weight-medium">
                        {{ item.label }}
                      </div>
                      <div class="text-caption text-medium-emphasis">
                        {{ item.done ? 'Sudah terisi' : 'Belum lengkap' }}
                      </div>
                    </div>
                  </div>
                </div>
              </VCardText>
            </VCard>

            <VAlert
              type="info"
              variant="tonal"
              class="opening-balance-tip"
            >
              Gunakan periode yang sesuai dengan saldo awal piutang agar approval lebih mudah diverifikasi.
            </VAlert>
          </VCol>
        </template>

        <!-- BULK MODE -->
        <template v-else>
          <VCol
            cols="12"
            lg="8"
          >
            <div class="bulk-groups-list">
              <VCard
                class="opening-balance-card muat-client-card mb-6"
                variant="outlined"
              >
                <VCardText class="pa-4 d-flex align-center gap-4 flex-wrap">
                  <div class="muat-client-card__icon">
                    <VIcon
                      icon="ri-download-2-line"
                      size="20"
                    />
                  </div>
                  <div class="flex-grow-1">
                    <div class="text-body-2 font-weight-bold">
                      {{ authStore.isPicArOnly ? 'Muat Semua Client Saya' : 'Muat Client per PIC AR' }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ authStore.isPicArOnly
                        ? 'Ambil semua Client yang menjadi tanggung jawab Anda tanpa memilih satu per satu.'
                        : 'Pilih PIC AR untuk memuat daftar Client miliknya, lalu pilih Client yang ingin diajukan.' }}
                    </div>
                  </div>
                  <VBtn
                    size="small"
                    color="success"
                    variant="tonal"
                    prepend-icon="ri-download-2-line"
                    :disabled="bulkGroups.length >= BULK_MAX_GROUPS"
                    @click="openKlienPicker"
                  >
                    Muat Client
                  </VBtn>
                </VCardText>
              </VCard>

              <OpeningBalanceGroupFields
                v-for="(group, i) in bulkGroups"
                :key="group._localId"
                v-model:group="bulkGroups[i]"
                :klien-list="klienList"
                :klien-loading="klienLoading"
                :group-index="i"
                :removable="bulkGroups.length > 1"
                :errors="groupErrors[i] || {}"
                :initial-outstanding-invoices="group._initialInvoices ?? null"
                class="mb-6"
                @focus-klien="ensureKlienLoaded"
                @remove="removeGroup(i)"
              />

              <VBtn
                variant="tonal"
                color="primary"
                prepend-icon="ri-add-line"
                :disabled="bulkGroups.length >= BULK_MAX_GROUPS"
                @click="addGroup"
              >
                Tambah Client
              </VBtn>
              <div
                v-if="bulkGroups.length >= BULK_MAX_GROUPS"
                class="text-caption text-medium-emphasis mt-2"
              >
                Batas maksimum {{ BULK_MAX_GROUPS }} Client per pengajuan massal.
              </div>
            </div>

            <KlienArPickerDialog
              v-model="klienPickerOpen"
              :klien-list="klienList"
              :loading="klienLoading"
              :preselected-ids="bulkGroups.map(g => g.klien_ar_id).filter(Boolean)"
              :show-pic-ar-filter="!authStore.isPicArOnly"
              :saving="klienPickerSaving"
              @confirm="handleLoadClients"
            />
          </VCol>

          <VCol
            cols="12"
            lg="4"
          >
            <VCard class="opening-balance-sidebar-card mb-4">
              <VCardText class="pa-6">
                <div class="section-heading section-heading--compact mb-5">
                  <div class="section-heading__icon section-heading__icon--soft">
                    <VIcon icon="ri-file-chart-line" />
                  </div>
                  <div>
                    <h3 class="text-subtitle-1 font-weight-bold mb-1">
                      Ringkasan
                    </h3>
                    <p class="text-body-2 text-medium-emphasis mb-0">
                      Preview seluruh pengajuan yang sedang diisi.
                    </p>
                  </div>
                </div>

                <div class="summary-amount mb-5">
                  <span class="summary-amount__label">Total saldo awal</span>
                  <div class="summary-amount__value">
                    {{ formattedBulkTotalSaldo }}
                  </div>
                </div>

                <div class="summary-list">
                  <div class="summary-list__item">
                    <span class="summary-list__label">Mode</span>
                    <VChip
                      size="small"
                      color="primary"
                      variant="tonal"
                      label
                    >
                      Massal ({{ bulkGroups.length }} baris)
                    </VChip>
                  </div>

                  <div class="summary-list__item">
                    <span class="summary-list__label">Client terisi</span>
                    <strong class="summary-list__value">{{ bulkClientCount }} dari {{ bulkGroups.length }}</strong>
                  </div>
                </div>
              </VCardText>
            </VCard>

            <VCard class="opening-balance-sidebar-card mb-4">
              <VCardText class="pa-6">
                <div class="section-heading section-heading--compact mb-4">
                  <div class="section-heading__icon section-heading__icon--soft">
                    <VIcon icon="ri-task-line" />
                  </div>
                  <div>
                    <h3 class="text-subtitle-1 font-weight-bold mb-1">
                      Checklist per Client
                    </h3>
                    <p class="text-body-2 text-medium-emphasis mb-0">
                      Pastikan setiap baris sudah lengkap sebelum diajukan.
                    </p>
                  </div>
                </div>

                <div class="checklist-list">
                  <div
                    v-for="item in bulkGroupSummaries"
                    :key="item.index"
                    class="checklist-list__item"
                  >
                    <VAvatar
                      :color="item.complete ? 'success' : 'secondary'"
                      variant="tonal"
                      size="36"
                    >
                      <VIcon :icon="item.complete ? 'ri-check-line' : 'ri-time-line'" />
                    </VAvatar>

                    <div class="flex-grow-1">
                      <div class="text-body-2 font-weight-medium">
                        Client #{{ item.index + 1 }}
                      </div>
                      <div class="text-caption text-medium-emphasis">
                        {{ item.klienName ?? 'Belum dipilih' }}
                      </div>
                    </div>
                  </div>
                </div>
              </VCardText>
            </VCard>

            <VAlert
              type="info"
              variant="tonal"
              class="opening-balance-tip"
            >
              Semua baris diajukan dalam satu proses — jika salah satu baris gagal, seluruh pengajuan akan dibatalkan.
            </VAlert>
          </VCol>
        </template>

        <VCol cols="12">
          <VCard class="opening-balance-card">
            <VCardText
              v-if="errorMessage"
              class="pa-6 pa-md-8"
            >
              <VAlert
                type="error"
                variant="tonal"
              >
                {{ errorMessage }}
              </VAlert>
            </VCardText>

            <VDivider />

            <VCardActions class="opening-balance-card__actions px-6 px-md-8 py-4">
              <div class="action-note text-body-2 text-medium-emphasis">
                <VIcon
                  icon="ri-information-line"
                  size="18"
                  class="me-2"
                />
                {{ mode === 'single'
                  ? 'Setelah berhasil, halaman akan diarahkan ke detail opening balance.'
                  : 'Setelah berhasil, halaman akan diarahkan ke daftar opening balance.' }}
              </div>

              <div class="d-flex flex-wrap gap-3">
                <VBtn
                  variant="tonal"
                  color="secondary"
                  :to="{ name: 'finance-opening-balance' }"
                >
                  Kembali
                </VBtn>

                <VBtn
                  type="submit"
                  color="primary"
                  prepend-icon="ri-send-plane-2-line"
                  :disabled="saving"
                >
                  {{ submitLabel }}
                </VBtn>
              </div>
            </VCardActions>
          </VCard>
        </VCol>
      </VRow>
    </VForm>
  </div>
</template>

<script setup>
/* eslint-disable camelcase */
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFormatter, toISODate } from '@/composables/useFormatter'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { useCrud } from '@/composables/useCrud'
import { useLazyFetchAll } from '@/composables/useLazyFetchAll'
import { useAuthStore } from '@/stores/auth.store'
import { setFlashAlert } from '@/utils/flashAlert'
import api from '@/utils/axios'
import OpeningBalanceGroupFields from '../components/OpeningBalanceGroupFields.vue'
import KlienArPickerDialog from '../components/KlienArPickerDialog.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { formatCurrency, formatDate } = useFormatter()
const { showError, showLoading, closeAlert } = useSweetAlert()
const id = computed(() => route.params.id)
const isEditing = computed(() => !!id.value)
const { items: klienList, loading: klienLoading, fetchAll: fetchKlien, ensureItem: ensureKlienItem } = useCrud('/finance/klien-ar')
const { ensureLoaded: ensureKlienLoaded } = useLazyFetchAll(fetchKlien)
const { fetchOne } = useCrud('/finance/invoices')

const formRef = ref(null)
const pageLoading = ref(false)
const errorMessage = ref('')
const saving = ref(false)

const BULK_MAX_GROUPS = 50
const mode = ref('single')

function createEmptyGroup() {
  return {
    no_invoice: '',
    klien_ar_id: null,
    tanggal: new Date().toISOString().slice(0, 10),
    saldo_awal: null,
    keterangan: '',
    details: [],
  }
}

function emptyErrorsBucket() {
  return { no_invoice: [], klien_ar_id: [], tanggal: [], saldo_awal: [], keterangan: [], details: [] }
}

const errors = reactive(emptyErrorsBucket())
const form = reactive(createEmptyGroup())

let nextGroupId = 1
const bulkGroups = ref([{ _localId: nextGroupId++, ...createEmptyGroup() }])
const groupErrors = ref([emptyErrorsBucket()])

function addGroup() {
  if (bulkGroups.value.length >= BULK_MAX_GROUPS) return
  bulkGroups.value.push({ _localId: nextGroupId++, ...createEmptyGroup() })
  groupErrors.value.push(emptyErrorsBucket())
}

function removeGroup(index) {
  if (bulkGroups.value.length <= 1) return
  bulkGroups.value.splice(index, 1)
  groupErrors.value.splice(index, 1)
}

const klienPickerOpen = ref(false)
const klienPickerSaving = ref(false)

async function openKlienPicker() {
  await ensureKlienLoaded()
  klienPickerOpen.value = true
}

function mapOutstandingInvoiceToRow(inv) {
  return {
    no_invoice_asal: inv.no_invoice,
    tanggal_invoice_asal: inv.tanggal_invoice ?? '',
    deskripsi: `Sisa tagihan ${inv.no_invoice}`,
    jumlah_tagihan_asal: inv.subtotal,
    sisa_tagihan_asal: inv.sisa_tagihan,
    keterangan: inv.keterangan ?? '',
    kode_resto: '',
    nama_resto: '',
    items: (inv.items ?? []).map(item => ({
      barang_id: item.barang_id ?? null,
      kode_barang: item.kode_barang ?? '',
      nama_barang: item.nama_barang ?? '',
      qty: item.qty ?? 1,
      satuan: item.satuan ?? 'pcs',
      harga_satuan: item.harga_satuan ?? 0,
      subtotal: item.subtotal ?? 0,
      keterangan: item.keterangan ?? '',
    })),
  }
}

async function handleLoadClients({ klien: selectedKlien, includeLastMonth }) {
  const selectedIds = new Set(selectedKlien.map(k => k.id))

  bulkGroups.value = bulkGroups.value.filter(g => {
    if (!g.klien_ar_id || selectedIds.has(g.klien_ar_id)) return true

    const untouched = !g.saldo_awal && g.details.length === 0 && !g.keterangan

    return !untouched
  })

  const already = new Set(bulkGroups.value.map(g => g.klien_ar_id).filter(Boolean))
  const newGroups = []

  selectedKlien.forEach(k => {
    if (already.has(k.id) || bulkGroups.value.length + newGroups.length >= BULK_MAX_GROUPS) return
    const group = { _localId: nextGroupId++, ...createEmptyGroup(), klien_ar_id: k.id }

    newGroups.push(group)
  })

  bulkGroups.value.push(...newGroups)
  groupErrors.value = bulkGroups.value.map(() => emptyErrorsBucket())

  if (includeLastMonth && newGroups.length > 0) {
    klienPickerSaving.value = true
    try {
      const { data } = await api.get('/finance/invoices/outstanding-bulk', {
        params: { klien_ar_ids: newGroups.map(g => g.klien_ar_id) },
      })
      const grouped = data.data ?? {}

      newGroups.forEach(g => {
        const invoices = grouped[g.klien_ar_id] ?? []

        // Cari objek yang benar-benar reaktif di dalam bulkGroups.value — memutasi
        // `g` (referensi mentah dari newGroups) langsung tidak memicu re-render Vue.
        const target = bulkGroups.value.find(x => x._localId === g._localId)
        if (!target) return

        target._initialInvoices = invoices
        if (invoices.length === 0) return

        target.details = invoices.map(mapOutstandingInvoiceToRow)
        target.saldo_awal = target.details.reduce((sum, d) => sum + (Number(d.sisa_tagihan_asal) || 0), 0)
      })
    } catch {
      // biarkan semua baris baru kosong — user tetap bisa isi manual / pakai "Muat Data" per baris
    } finally {
      klienPickerSaving.value = false
    }
  }

  klienPickerOpen.value = false
}

const modeOptions = [
  {
    value: 'single',
    icon: 'ri-user-line',
    title: 'Satu Client',
    description: 'Ajukan 1 opening balance untuk 1 Client.',
  },
  {
    value: 'bulk',
    icon: 'ri-group-line',
    title: 'Banyak Client (Massal)',
    description: 'Ajukan opening balance untuk banyak Client sekaligus dalam satu proses.',
  },
]

const pageTitle = computed(() => isEditing.value ? 'Edit Opening Balance' : 'Saldo Awal (Opening Balance)')

const pageSubtitle = computed(() =>
  isEditing.value
    ? 'Perbarui data opening balance yang ditolak sebelum diajukan ulang'
    : 'Ajukan saldo piutang awal untuk Client')

const breadcrumbLabel = computed(() => isEditing.value ? 'Edit Opening Balance' : 'Buat Opening Balance')

const submitLabel = computed(() => {
  if (isEditing.value) return 'Simpan Perubahan'

  return mode.value === 'single' ? 'Ajukan Opening Balance' : `Ajukan ${bulkGroups.value.length} Opening Balance`
})

const heroTitle = computed(() => {
  if (isEditing.value) return 'Perbarui pengajuan saldo awal yang perlu direvisi'

  return mode.value === 'single'
    ? 'Buat pengajuan saldo awal dengan struktur yang lebih rapi'
    : 'Ajukan saldo awal untuk banyak Client sekaligus'
})

const heroSubtitle = computed(() => {
  if (isEditing.value) return 'Sesuaikan kembali data opening balance yang ditolak, lalu simpan revisinya sebelum diajukan ulang.'

  return mode.value === 'single'
    ? 'Seluruh field dan proses tetap sama, hanya tampilannya dibuat lebih jelas agar lebih nyaman saat diisi.'
    : 'Tambahkan sebanyak mungkin Client yang dibutuhkan, lalu ajukan semuanya sekaligus dalam satu proses.'
})

const selectedKlien = computed(() =>
  klienList.value.find(item => item.id === form.klien_ar_id) ?? null)

const selectedCompanyName = computed(() =>
  selectedKlien.value?.perusahaan?.nama_perusahaan
  ?? selectedKlien.value?.perusahaan?.nama_singkatan_perusahaan
  ?? selectedKlien.value?.karyawan_ar?.perusahaan?.nama_perusahaan
  ?? selectedKlien.value?.karyawan_ar?.perusahaan?.nama_singkatan_perusahaan
  ?? '')

const selectedPicArName = computed(() => selectedKlien.value?.karyawan_ar?.nama_karyawan ?? '')

const selectedKlienMeta = computed(() => {
  if (!selectedKlien.value) return 'Belum ada klien yang dipilih'

  return [selectedKlien.value.kode_klien, selectedKlien.value.tipe_klien]
    .filter(Boolean)
    .join(' - ')
})

const formattedSaldoAwal = computed(() => {
  if (form.saldo_awal === null || form.saldo_awal === undefined || form.saldo_awal === '')
    return '-'

  return formatCurrency(form.saldo_awal)
})

const formattedTanggal = computed(() => form.tanggal ? formatDate(form.tanggal) : '-')

const checklistItems = computed(() => [
  { label: 'No. Opening Balance', done: !!form.no_invoice },
  { label: 'Client', done: !!form.klien_ar_id },
  { label: 'Tanggal', done: !!form.tanggal },
  { label: 'Saldo awal', done: Number(form.saldo_awal) > 0 },
])

const bulkClientCount = computed(() => bulkGroups.value.filter(g => g.klien_ar_id).length)

const bulkTotalSaldo = computed(() =>
  bulkGroups.value.reduce((sum, g) => sum + (Number(g.saldo_awal) || 0), 0))

const formattedBulkTotalSaldo = computed(() => formatCurrency(bulkTotalSaldo.value))

const bulkGroupSummaries = computed(() => bulkGroups.value.map((g, i) => {
  const klien = klienList.value.find(k => k.id === g.klien_ar_id) ?? null

  return {
    index: i,
    klienName: klien?.nama_klien ?? null,
    complete: !!g.klien_ar_id && !!g.tanggal && Number(g.saldo_awal) > 0,
  }
}))

const duplicateGroupIndexes = computed(() => {
  const seenAt = new Map()
  const dupes = new Set()

  bulkGroups.value.forEach((g, i) => {
    if (!g.klien_ar_id) return
    if (seenAt.has(g.klien_ar_id)) {
      dupes.add(seenAt.get(g.klien_ar_id))
      dupes.add(i)
    } else {
      seenAt.set(g.klien_ar_id, i)
    }
  })

  return dupes
})

async function loadOpeningBalance() {
  if (!isEditing.value) return

  pageLoading.value = true
  errorMessage.value = ''

  try {
    const data = await fetchOne(id.value)

    if (!data) {
      errorMessage.value = 'Data opening balance tidak ditemukan'

      return
    }

    Object.assign(form, {
      no_invoice: data.no_invoice ?? '',
      klien_ar_id: data.klien_ar_id ?? null,
      tanggal: toISODate(data.tanggal_invoice) || new Date().toISOString().slice(0, 10),
      saldo_awal: data.subtotal ?? null,
      keterangan: data.keterangan ?? '',
      details: data.opening_balance_details ?? [],
    })
    ensureKlienItem(data.klien_ar)
  } catch (err) {
    errorMessage.value = err.response?.data?.message ?? 'Gagal memuat opening balance'
  } finally {
    pageLoading.value = false
  }
}

async function submitSingle() {
  Object.keys(errors).forEach(k => (errors[k] = []))

  if (form.details.length > 0) {
    const sum = form.details.reduce((acc, d) => acc + (Number(d.sisa_tagihan_asal) || 0), 0)
    if (Math.abs(sum - Number(form.saldo_awal)) > 0.01) {
      errors.details = [`Jumlah sisa tagihan rincian (${sum.toFixed(2)}) harus sama dengan saldo awal (${Number(form.saldo_awal).toFixed(2)})`]

      return
    }
  }

  saving.value = true
  showLoading({
    title: isEditing.value ? 'Menyimpan Perubahan' : 'Mengajukan Opening Balance',
    text: 'Data sedang diproses...',
  })

  try {
    const request = isEditing.value
      ? api.put(`/finance/opening-balance/${id.value}`, { ...form })
      : api.post('/finance/opening-balance', { ...form })

    const { data } = await request

    setFlashAlert({
      icon: 'success',
      title: 'Berhasil',
      text: isEditing.value
        ? 'Perubahan opening balance berhasil disimpan.'
        : 'Opening balance berhasil diajukan.',
    })

    router.push({ name: 'finance-invoice-show', params: { id: data.data.id } })
  } catch (err) {
    const errData = err.response?.data
    if (errData?.errors) {
      Object.entries(errData.errors).forEach(([k, v]) => { if (k in errors) errors[k] = v })
    }
    errorMessage.value = errData?.message ?? 'Terjadi kesalahan'
    await showError(errorMessage.value)
  } finally {
    closeAlert({ onlyLoading: true })
    saving.value = false
  }
}

async function submitBulk() {
  groupErrors.value = bulkGroups.value.map(() => emptyErrorsBucket())

  if (duplicateGroupIndexes.value.size > 0) {
    duplicateGroupIndexes.value.forEach(i => {
      groupErrors.value[i].klien_ar_id = ['Client ini dipilih lebih dari sekali dalam pengajuan ini']
    })
    errorMessage.value = 'Ada Client yang dipilih lebih dari sekali. Perbaiki dulu sebelum mengajukan.'

    return
  }

  let hasSumError = false
  bulkGroups.value.forEach((g, i) => {
    if (g.details.length > 0) {
      const sum = g.details.reduce((acc, d) => acc + (Number(d.sisa_tagihan_asal) || 0), 0)
      if (Math.abs(sum - Number(g.saldo_awal)) > 0.01) {
        groupErrors.value[i].details = [`Jumlah sisa tagihan rincian (${sum.toFixed(2)}) harus sama dengan saldo awal (${Number(g.saldo_awal).toFixed(2)})`]
        hasSumError = true
      }
    }
  })
  if (hasSumError) {
    errorMessage.value = 'Ada baris Client dengan rincian yang belum sesuai saldo awal. Perbaiki dulu sebelum mengajukan.'

    return
  }

  saving.value = true
  showLoading({
    title: 'Mengajukan Opening Balance Massal',
    text: `Memproses ${bulkGroups.value.length} pengajuan...`,
  })

  try {
    const items = bulkGroups.value.map(g => ({
      klien_ar_id: g.klien_ar_id,
      tanggal: g.tanggal,
      saldo_awal: g.saldo_awal,
      keterangan: g.keterangan,
      details: g.details,
    }))

    const { data } = await api.post('/finance/opening-balance/bulk', { items })

    setFlashAlert({
      icon: 'success',
      title: 'Berhasil',
      text: `${data.data.length} opening balance berhasil diajukan.`,
    })

    router.push({ name: 'finance-opening-balance' })
  } catch (err) {
    const errData = err.response?.data
    if (errData?.errors) {
      Object.entries(errData.errors).forEach(([key, messages]) => {
        const match = key.match(/^items\.(\d+)\.(.+)$/)
        if (!match) return
        const idx = Number(match[1])
        const rest = match[2]
        const bucket = rest.startsWith('details') ? 'details' : rest.split('.')[0]

        groupErrors.value[idx] ??= emptyErrorsBucket()
        groupErrors.value[idx][bucket] = [...(groupErrors.value[idx][bucket] ?? []), ...messages]
      })
    }
    errorMessage.value = errData?.message ?? 'Terjadi kesalahan'
    await showError(errorMessage.value)
  } finally {
    closeAlert({ onlyLoading: true })
    saving.value = false
  }
}

async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  errorMessage.value = ''

  if (mode.value === 'single') await submitSingle()
  else await submitBulk()
}

onMounted(async () => {
  await loadOpeningBalance()
})
</script>

<style scoped>
.opening-balance-layout {
  row-gap: 4px;
}

.opening-balance-loading-card,
.opening-balance-card,
.opening-balance-sidebar-card,
.opening-balance-hero {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
}

.opening-balance-hero {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at top right, rgba(var(--v-theme-primary), 0.18), transparent 32%),
    linear-gradient(135deg, rgba(var(--v-theme-primary), 0.08), rgba(var(--v-theme-info), 0.05)),
    rgb(var(--v-theme-surface));
}

.opening-balance-hero::before,
.opening-balance-hero::after {
  position: absolute;
  border-radius: 999px;
  content: '';
  inset-block-start: auto;
  pointer-events: none;
}

.opening-balance-hero::before {
  inset-inline-end: -32px;
  inset-block-end: -48px;
  inline-size: 180px;
  block-size: 180px;
  background: rgba(var(--v-theme-primary), 0.08);
}

.opening-balance-hero::after {
  inset-inline-end: 80px;
  inset-block-end: 42px;
  inline-size: 64px;
  block-size: 64px;
  background: rgba(var(--v-theme-info), 0.12);
}

.opening-balance-hero__copy {
  max-inline-size: 680px;
  position: relative;
  z-index: 1;
}

.opening-balance-hero__stats {
  display: grid;
  gap: 12px;
  min-inline-size: min(100%, 320px);
  position: relative;
  z-index: 1;
}

.mode-select {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.mode-select-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1 1 240px;
  padding: 16px;
  border: 2px solid rgba(var(--v-theme-on-surface), 0.1);
  border-radius: 16px;
  background: rgba(var(--v-theme-surface), 0.85);
  cursor: pointer;
  text-align: start;
  font: inherit;
  color: inherit;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
}

.mode-select-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.35);
}

.mode-select-card--active {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.08);
  box-shadow: 0 8px 20px rgba(var(--v-theme-primary), 0.12);
}

.mode-select-card__check {
  position: absolute;
  inset-block-start: 10px;
  inset-inline-end: 10px;
  color: rgb(var(--v-theme-primary));
  opacity: 0;
  transition: opacity 0.15s;
}

.mode-select-card--active .mode-select-card__check {
  opacity: 1;
}

.mode-select-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: 40px;
  block-size: 40px;
  border-radius: 12px;
  flex-shrink: 0;
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
}

.mode-select-card__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mode-select-card__title {
  font-size: 0.95rem;
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
}

.mode-select-card__desc {
  font-size: 0.8rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  line-height: 1.4;
}

.hero-stat {
  padding: 14px 16px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 18px;
  background: rgba(var(--v-theme-surface), 0.72);
  backdrop-filter: blur(10px);
}

.hero-stat__label {
  display: block;
  margin-block-end: 4px;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.hero-stat__value {
  display: block;
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
  font-size: 0.95rem;
  line-height: 1.45;
}

.section-heading {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.section-heading--compact {
  gap: 12px;
}

.section-heading__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: 44px;
  block-size: 44px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.18), rgba(var(--v-theme-info), 0.1));
  color: rgb(var(--v-theme-primary));
  flex-shrink: 0;
}

.section-heading__icon--soft {
  inline-size: 40px;
  block-size: 40px;
  border-radius: 12px;
  background: rgba(var(--v-theme-primary), 0.1);
}

.opening-balance-card__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.action-note {
  display: inline-flex;
  align-items: center;
}

.summary-amount {
  padding: 18px 20px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.14), rgba(var(--v-theme-info), 0.08));
  border: 1px solid rgba(var(--v-theme-primary), 0.14);
}

.summary-amount__label {
  display: block;
  margin-block-end: 6px;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.summary-amount__value {
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
  font-size: clamp(1.4rem, 2vw, 2rem);
  font-weight: 700;
  line-height: 1.2;
}

.summary-list {
  display: grid;
  gap: 16px;
}

.summary-list__item {
  display: grid;
  gap: 6px;
}

.summary-list__label {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.82rem;
}

.summary-list__value {
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
  line-height: 1.45;
}

.summary-list__hint {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.78rem;
}

.checklist-list {
  display: grid;
  gap: 14px;
}

.checklist-list__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 16px;
  background: rgba(var(--v-theme-surface), 0.75);
}

.opening-balance-tip {
  border: 1px solid rgba(var(--v-theme-info), 0.14);
}

.bulk-groups-list {
  display: flex;
  flex-direction: column;
}

.muat-client-card {
  border-style: dashed;
  border-color: rgba(var(--v-theme-success), 0.35);
  background: rgba(var(--v-theme-success), 0.04);
}

.muat-client-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: 40px;
  block-size: 40px;
  border-radius: 12px;
  flex-shrink: 0;
  background: rgba(var(--v-theme-success), 0.14);
  color: rgb(var(--v-theme-success));
}

@media (max-width: 1279px) {
  .opening-balance-hero__stats {
    inline-size: 100%;
    min-inline-size: 0;
  }
}

@media (max-width: 767px) {
  .opening-balance-card__actions {
    align-items: stretch;
  }

  .action-note {
    inline-size: 100%;
  }
}
</style>
