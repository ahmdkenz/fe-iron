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
                  <div class="hero-stat">
                    <span class="hero-stat__label">Klien</span>
                    <strong class="hero-stat__value">{{ selectedKlien?.nama_klien ?? 'Belum dipilih' }}</strong>
                  </div>
                  <div class="hero-stat">
                    <span class="hero-stat__label">Saldo Awal</span>
                    <strong class="hero-stat__value">{{ formattedSaldoAwal }}</strong>
                  </div>
                  <div class="hero-stat">
                    <span class="hero-stat__label">Periode</span>
                    <strong class="hero-stat__value">{{ periodLabel }}</strong>
                  </div>
                </div>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <VCol
          cols="12"
          lg="8"
        >
          <VCard class="opening-balance-card">
            <VCardText class="pa-6 pa-md-8">
              <div class="section-heading mb-6">
                <div class="section-heading__icon">
                  <VIcon icon="ri-wallet-3-line" />
                </div>
                <div>
                  <h3 class="text-h6 font-weight-bold mb-1">
                    Detail Pengajuan
                  </h3>
                  <p class="text-body-2 text-medium-emphasis mb-0">
                    Lengkapi data klien, tanggal, periode, dan saldo awal tanpa mengubah proses pengajuan yang sudah berjalan.
                  </p>
                </div>
              </div>

              <VAlert
                v-if="isEditing"
                type="info"
                variant="tonal"
                class="mb-6"
              >
                Perubahan hanya menyimpan revisi data. Setelah itu, ajukan ulang opening balance dari halaman detail.
              </VAlert>

              <div class="form-section">
                <div class="form-section__header">
                  <div>
                    <h4 class="text-subtitle-1 font-weight-bold mb-1">
                      Klien dan Nilai Saldo
                    </h4>
                    <p class="text-body-2 text-medium-emphasis mb-0">
                      Tentukan klien AR yang diajukan beserta nominal saldo awal piutangnya.
                    </p>
                  </div>
                </div>

                <VRow>
                  <VCol cols="12">
                    <VAutocomplete
                      v-model="form.klien_ar_id"
                      label="Klien AR"
                      density="compact"
                      variant="outlined"
                      :items="klienList"
                      item-title="nama_klien"
                      item-value="id"
                      :rules="[v => !!v || 'Klien wajib dipilih']"
                      :error-messages="errors.klien_ar_id"
                      :loading="klienLoading"
                      prepend-inner-icon="ri-user-star-line"
                      clearable
                    >
                      <template #item="{ props: p, item }">
                        <VListItem
                          v-bind="p"
                          :title="item.raw.nama_klien"
                          :subtitle="[item.raw.kode_klien, item.raw.tipe_klien].filter(Boolean).join(' - ')"
                        />
                      </template>
                    </VAutocomplete>
                  </VCol>

                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      :model-value="selectedCompanyName"
                      label="Perusahaan Penagih"
                      density="compact"
                      variant="outlined"
                      prepend-inner-icon="ri-building-4-line"
                      readonly
                    />
                  </VCol>

                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model.number="form.saldo_awal"
                      label="Saldo Awal (Rp)"
                      density="compact"
                      variant="outlined"
                      type="number"
                      min="0"
                      prefix="Rp"
                      prepend-inner-icon="ri-money-dollar-circle-line"
                      :rules="[v => v > 0 || 'Saldo harus lebih dari 0']"
                      :error-messages="errors.saldo_awal"
                    />
                  </VCol>
                </VRow>
              </div>

              <div class="form-section">
                <div class="form-section__header">
                  <div>
                    <h4 class="text-subtitle-1 font-weight-bold mb-1">
                      Tanggal dan Periode
                    </h4>
                    <p class="text-body-2 text-medium-emphasis mb-0">
                      Gunakan tanggal pengajuan dan rentang periode yang sesuai dengan saldo awal yang dicatat.
                    </p>
                  </div>
                </div>

                <VRow>
                  <VCol
                    cols="12"
                    md="4"
                  >
                    <VTextField
                      v-model="form.tanggal"
                      label="Tanggal"
                      density="compact"
                      variant="outlined"
                      type="date"
                      prepend-inner-icon="ri-calendar-line"
                      :rules="[v => !!v || 'Tanggal wajib diisi']"
                      :error-messages="errors.tanggal"
                    />
                  </VCol>

                  <VCol
                    cols="12"
                    md="4"
                  >
                    <VTextField
                      v-model="form.periode_awal"
                      label="Periode Awal"
                      density="compact"
                      variant="outlined"
                      type="date"
                      prepend-inner-icon="ri-calendar-event-line"
                      :rules="[v => !!v || 'Periode awal wajib diisi']"
                      :error-messages="errors.periode_awal"
                    />
                  </VCol>

                  <VCol
                    cols="12"
                    md="4"
                  >
                    <VTextField
                      v-model="form.periode_akhir"
                      label="Periode Akhir"
                      density="compact"
                      variant="outlined"
                      type="date"
                      prepend-inner-icon="ri-calendar-check-line"
                      :rules="[v => !!v || 'Periode akhir wajib diisi']"
                      :error-messages="errors.periode_akhir"
                    />
                  </VCol>
                </VRow>
              </div>

              <div class="form-section">
                <div class="form-section__header">
                  <div>
                    <h4 class="text-subtitle-1 font-weight-bold mb-1">
                      Catatan Pengajuan
                    </h4>
                    <p class="text-body-2 text-medium-emphasis mb-0">
                      Tambahkan keterangan bila ada informasi tambahan yang perlu diketahui reviewer.
                    </p>
                  </div>
                </div>

                <VTextarea
                  v-model="form.keterangan"
                  label="Keterangan"
                  density="compact"
                  variant="outlined"
                  rows="3"
                  auto-grow
                  :error-messages="errors.keterangan"
                />
              </div>

              <VAlert
                v-if="errorMessage"
                type="error"
                variant="tonal"
                class="mt-6"
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
                Setelah berhasil, halaman akan diarahkan ke detail opening balance.
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
                  :loading="saving"
                  :disabled="saving"
                >
                  {{ submitLabel }}
                </VBtn>
              </div>
            </VCardActions>
          </VCard>
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
                  <span class="summary-list__label">Klien AR</span>
                  <strong class="summary-list__value">{{ selectedKlien?.nama_klien ?? '-' }}</strong>
                  <span class="summary-list__hint">{{ selectedKlienMeta }}</span>
                </div>

                <div class="summary-list__item">
                  <span class="summary-list__label">Perusahaan</span>
                  <strong class="summary-list__value">{{ selectedCompanyName || '-' }}</strong>
                </div>

                <div class="summary-list__item">
                  <span class="summary-list__label">Tanggal</span>
                  <strong class="summary-list__value">{{ formattedTanggal }}</strong>
                </div>

                <div class="summary-list__item">
                  <span class="summary-list__label">Periode</span>
                  <strong class="summary-list__value">{{ periodLabel }}</strong>
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
      </VRow>
    </VForm>
  </div>
</template>

<script setup>
/* eslint-disable camelcase */
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFormatter } from '@/composables/useFormatter'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { useCrud } from '@/composables/useCrud'
import { setFlashAlert } from '@/utils/flashAlert'
import api from '@/utils/axios'

const route = useRoute()
const router = useRouter()
const { formatCurrency, formatDate } = useFormatter()
const { showError, showLoading, closeAlert } = useSweetAlert()
const id = computed(() => route.params.id)
const isEditing = computed(() => !!id.value)
const { items: klienList, loading: klienLoading, fetchAll: fetchKlien } = useCrud('/finance/klien-ar')
const { fetchOne } = useCrud('/finance/invoices')

const formRef = ref(null)
const pageLoading = ref(false)
const errorMessage = ref('')
const saving = ref(false)

const errors = reactive({
  klien_ar_id: [], tanggal: [], saldo_awal: [], periode_awal: [], periode_akhir: [], keterangan: [],
})

const form = reactive({
  klien_ar_id: null,
  tanggal: new Date().toISOString().slice(0, 10),
  saldo_awal: null,
  periode_awal: '',
  periode_akhir: '',
  keterangan: '',
})

const pageTitle = computed(() => isEditing.value ? 'Edit Opening Balance' : 'Saldo Awal (Opening Balance)')

const pageSubtitle = computed(() =>
  isEditing.value
    ? 'Perbarui data opening balance yang ditolak sebelum diajukan ulang'
    : 'Ajukan saldo piutang awal untuk klien AR')

const breadcrumbLabel = computed(() => isEditing.value ? 'Edit Opening Balance' : 'Buat Opening Balance')

const submitLabel = computed(() => isEditing.value ? 'Simpan Perubahan' : 'Ajukan Opening Balance')

const heroTitle = computed(() =>
  isEditing.value
    ? 'Perbarui pengajuan saldo awal yang perlu direvisi'
    : 'Buat pengajuan saldo awal dengan struktur yang lebih rapi')

const heroSubtitle = computed(() =>
  isEditing.value
    ? 'Sesuaikan kembali data opening balance yang ditolak, lalu simpan revisinya sebelum diajukan ulang.'
    : 'Seluruh field dan proses tetap sama, hanya tampilannya dibuat lebih jelas agar lebih nyaman saat diisi.')

const selectedKlien = computed(() =>
  klienList.value.find(item => item.id === form.klien_ar_id) ?? null)

const selectedCompanyName = computed(() =>
  selectedKlien.value?.perusahaan?.nama_perusahaan
  ?? selectedKlien.value?.perusahaan?.nama_singkatan_perusahaan
  ?? '')

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

const periodLabel = computed(() => {
  if (!form.periode_awal || !form.periode_akhir)
    return 'Pilih periode awal dan akhir'

  return `${formatDate(form.periode_awal)} - ${formatDate(form.periode_akhir)}`
})

const checklistItems = computed(() => [
  { label: 'Klien AR', done: !!form.klien_ar_id },
  { label: 'Tanggal', done: !!form.tanggal },
  { label: 'Periode', done: !!form.periode_awal && !!form.periode_akhir },
  { label: 'Saldo awal', done: Number(form.saldo_awal) > 0 },
])

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
      klien_ar_id: data.klien_ar_id ?? null,
      tanggal: data.tanggal_invoice ?? new Date().toISOString().slice(0, 10),
      saldo_awal: data.subtotal ?? null,
      periode_awal: data.periode_awal ?? '',
      periode_akhir: data.periode_akhir ?? '',
      keterangan: data.keterangan ?? '',
    })
  } catch (err) {
    errorMessage.value = err.response?.data?.message ?? 'Gagal memuat opening balance'
  } finally {
    pageLoading.value = false
  }
}

async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  errorMessage.value = ''
  Object.keys(errors).forEach(k => (errors[k] = []))
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

onMounted(async () => {
  await fetchKlien()
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

.form-section + .form-section {
  margin-block-start: 28px;
  padding-block-start: 28px;
  border-block-start: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.form-section__header {
  margin-block-end: 16px;
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
