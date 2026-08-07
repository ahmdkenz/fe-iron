<template>
  <div class="ob-group-fields">
    <VCard class="opening-balance-card">
      <VCardText class="pa-6 pa-md-8">
        <div class="d-flex align-start justify-space-between gap-2 flex-wrap mb-6">
          <div class="section-heading">
            <div class="section-heading__icon">
              <VIcon icon="ri-wallet-3-line" />
            </div>
            <div>
              <h3 class="text-h6 font-weight-bold mb-1">
                {{ groupIndex !== null ? `Client #${groupIndex + 1}` : 'Detail Pengajuan' }}
              </h3>
              <p class="text-body-2 text-medium-emphasis mb-0">
                {{ groupIndex !== null
                  ? 'Data client, tanggal, dan saldo awal untuk baris ini.'
                  : 'Lengkapi data klien, tanggal, periode, dan saldo awal tanpa mengubah proses pengajuan yang sudah berjalan.' }}
              </p>
            </div>
          </div>

          <VBtn
            v-if="removable"
            icon="ri-delete-bin-line"
            variant="text"
            color="error"
            size="small"
            @click="emit('remove')"
          />
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
                Tentukan Client yang diajukan beserta nominal saldo awal piutangnya.
              </p>
            </div>
          </div>

          <VRow>
            <VCol
              v-if="showNoInvoice"
              cols="12"
            >
              <VTextField
                v-model="group.no_invoice"
                label="No. Opening Balance"
                density="compact"
                variant="outlined"
                prepend-inner-icon="ri-hashtag"
                :rules="[v => !!v || 'No. Opening Balance wajib diisi']"
                :error-messages="errors.no_invoice"
                hint="Format: OB-{SINGKATAN}-{DDMMYYYYHHMMSSmmm} — Contoh PT: OB-ABB-13062026143022479 | Contoh RESTO: OB-MKS-13062026143022479"
                persistent-hint
                readonly
                tabindex="-1"
                class="readonly-locked-field"
              />
            </VCol>

            <VCol
              v-else
              cols="12"
            >
              <VAlert
                type="info"
                variant="tonal"
                density="compact"
                icon="ri-information-line"
              >
                No. Opening Balance akan dibuat otomatis saat disimpan.
              </VAlert>
            </VCol>

            <VCol cols="12">
              <VAutocomplete
                v-model="group.klien_ar_id"
                label="Client"
                density="compact"
                variant="outlined"
                :items="sortedKlienList"
                item-title="display_label"
                item-value="id"
                :filter-keys="['raw.display_label', 'raw.display_subtitle']"
                :rules="[v => !!v || 'Klien wajib dipilih']"
                :error-messages="errors.klien_ar_id"
                :loading="klienLoading"
                prepend-inner-icon="ri-user-star-line"
                clearable
                placeholder="Cari nama klien, kode, atau PIC AR..."
                hint="Ketik nama PIC AR untuk menyaring semua klien miliknya"
                persistent-hint
                @focus="emit('focus-klien')"
              >
                <template #item="{ props: p, item }">
                  <VListItem
                    v-bind="p"
                    :title="item.raw.display_label"
                  >
                    <template #subtitle>
                      <div class="d-flex align-center flex-wrap gap-1 mt-1">
                        <VChip
                          size="x-small"
                          color="primary"
                          variant="tonal"
                          label
                        >
                          {{ item.raw.kode_klien }}
                        </VChip>
                        <VChip
                          size="x-small"
                          :color="klienTipeColor(item.raw.tipe_klien)"
                          variant="tonal"
                          label
                        >
                          {{ item.raw.tipe_klien }}
                        </VChip>
                        <span
                          v-if="item.raw.karyawan_ar?.nama_karyawan"
                          class="text-caption text-medium-emphasis"
                        >
                          PIC: {{ item.raw.karyawan_ar.nama_karyawan }}
                        </span>
                      </div>
                      <div
                        v-if="item.raw.resto?.nama_resto"
                        class="text-caption text-medium-emphasis mt-1"
                      >
                        {{ item.raw.resto.nama_resto }}
                      </div>
                    </template>
                  </VListItem>
                </template>
              </VAutocomplete>
            </VCol>

            <VCol
              cols="12"
              md="4"
            >
              <VTextField
                :model-value="selectedCompanyName"
                label="Entitas Bisnis"
                density="compact"
                variant="outlined"
                prepend-inner-icon="ri-building-4-line"
                readonly
              />
            </VCol>

            <VCol
              cols="12"
              md="4"
            >
              <VTextField
                :model-value="selectedPicArName"
                label="PIC AR"
                density="compact"
                variant="outlined"
                prepend-inner-icon="ri-user-line"
                readonly
              />
            </VCol>

            <VCol
              cols="12"
              md="4"
            >
              <VTextField
                v-model.number="group.saldo_awal"
                label="Saldo Awal (Rp)"
                density="compact"
                variant="outlined"
                type="number"
                min="0"
                prefix="Rp"
                prepend-inner-icon="ri-money-dollar-circle-line"
                :rules="[v => v > 0 || 'Saldo harus lebih dari 0']"
                :error-messages="errors.saldo_awal"
                readonly
                tabindex="-1"
                class="readonly-locked-field"
                hint="Dihitung otomatis dari total sisa tagihan rincian"
                persistent-hint
              />
            </VCol>
          </VRow>
        </div>

        <div class="form-section">
          <div class="form-section__header">
            <div>
              <h4 class="text-subtitle-1 font-weight-bold mb-1">
                Tanggal
              </h4>
              <p class="text-body-2 text-medium-emphasis mb-0">
                Isi <strong>Tanggal</strong> dengan tanggal pengajuan hari ini.
              </p>
            </div>
          </div>

          <VRow>
            <VCol
              cols="12"
              md="4"
            >
              <VTextField
                v-model="group.tanggal"
                label="Tanggal"
                density="compact"
                variant="outlined"
                type="date"
                prepend-inner-icon="ri-calendar-line"
                :rules="[v => !!v || 'Tanggal wajib diisi']"
                :error-messages="errors.tanggal"
                hint="Tanggal pengajuan Opening Balance (hari ini)"
                persistent-hint
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
            v-model="group.keterangan"
            label="Keterangan"
            density="compact"
            variant="outlined"
            rows="3"
            auto-grow
            :error-messages="errors.keterangan"
          />
        </div>
      </VCardText>
    </VCard>

    <VCard class="opening-balance-card mt-4">
      <VCardText class="pa-6 pa-md-8">
        <div class="form-section">
          <div class="form-section__header">
            <div class="d-flex align-center gap-2 flex-wrap">
              <div>
                <h4 class="text-subtitle-1 font-weight-bold mb-1">
                  Rincian Invoice Asal
                  <VChip
                    size="x-small"
                    color="secondary"
                    variant="tonal"
                    label
                    class="ms-1"
                  >
                    Opsional
                  </VChip>
                </h4>
                <p class="text-body-2 text-medium-emphasis mb-0">
                  Daftarkan invoice-invoice asli yang membentuk saldo ini untuk keperluan audit dan aging per dokumen.
                </p>
              </div>
            </div>
          </div>

          <VCard
            variant="outlined"
            rounded="lg"
            class="ob-detail-wrapper"
          >
            <OpeningBalanceDetailTable
              :details="group.details"
              :saldo-awal="Number(group.saldo_awal) || 0"
              :outstanding-invoices="outstandingInvoices"
              :loading-outstanding="loadingOutstanding"
              @update:details="group.details = $event"
            />
          </VCard>

          <VAlert
            v-if="errors.details?.length"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-2"
          >
            {{ errors.details[0] }}
          </VAlert>
        </div>
      </VCardText>
    </VCard>
  </div>
</template>

<script setup>
/* eslint-disable camelcase */
import { computed, ref, watch } from 'vue'
import api from '@/utils/axios'
import OpeningBalanceDetailTable from './OpeningBalanceDetailTable.vue'

const props = defineProps({
  klienList: { type: Array, default: () => [] },
  klienLoading: { type: Boolean, default: false },
  showNoInvoice: { type: Boolean, default: true },
  isEditing: { type: Boolean, default: false },
  groupIndex: { type: Number, default: null },
  removable: { type: Boolean, default: false },
  errors: { type: Object, default: () => ({}) },
  // Invoice yang sudah dimuat lebih dulu oleh parent (mis. hasil "Muat Client"
  // massal, 1 request bulk) — dipakai untuk seed tombol "Muat Data" tanpa
  // komponen ini perlu fetch sendiri lagi (menghindari N request paralel
  // saat banyak baris di-mount sekaligus).
  initialOutstandingInvoices: { type: Array, default: null },
})

const emit = defineEmits(['remove', 'focus-klien'])

const group = defineModel('group', { type: Object, required: true })

const outstandingInvoices = ref(props.initialOutstandingInvoices ?? [])
const loadingOutstanding = ref(false)

// initialOutstandingInvoices bisa datang belakangan (parent baru selesai
// fetch bulk setelah komponen ini sudah ter-mount) — sinkronkan begitu tiba.
watch(() => props.initialOutstandingInvoices, val => {
  if (val) outstandingInvoices.value = val
})

async function fetchOutstandingInvoices(klienArId) {
  if (!klienArId) {
    outstandingInvoices.value = []

    return
  }
  loadingOutstanding.value = true
  try {
    const { data } = await api.get('/finance/invoices/outstanding', {
      params: { klien_ar_id: klienArId, tanggal: group.value.tanggal },
    })

    outstandingInvoices.value = data.data ?? []
  } catch {
    outstandingInvoices.value = []
  } finally {
    loadingOutstanding.value = false
  }
}

const sortedKlienList = computed(() =>
  [...props.klienList].sort((a, b) => {
    const picA = a.karyawan_ar?.nama_karyawan ?? ''
    const picB = b.karyawan_ar?.nama_karyawan ?? ''
    if (picA !== picB) return picA.localeCompare(picB, 'id')

    return (a.nama_klien ?? '').localeCompare(b.nama_klien ?? '', 'id')
  }),
)

function klienTipeColor(tipe) {
  return { RESTO: 'success', PT: 'info' }[tipe] ?? 'default'
}

const selectedKlien = computed(() =>
  props.klienList.find(item => item.id === group.value.klien_ar_id) ?? null)

const selectedCompanyName = computed(() =>
  selectedKlien.value?.perusahaan?.nama_perusahaan
  ?? selectedKlien.value?.perusahaan?.nama_singkatan_perusahaan
  ?? selectedKlien.value?.karyawan_ar?.perusahaan?.nama_perusahaan
  ?? selectedKlien.value?.karyawan_ar?.perusahaan?.nama_singkatan_perusahaan
  ?? '')

const selectedPicArName = computed(() => selectedKlien.value?.karyawan_ar?.nama_karyawan ?? '')

function generateObNoInvoice() {
  const singkatan = (
    selectedKlien.value?.perusahaan?.nama_singkatan_perusahaan
    ?? selectedKlien.value?.kode_klien
    ?? 'OB'
  ).replace(/[^A-Za-z0-9]/g, '').toUpperCase()

  const now = new Date()
  const pad = (n, len = 2) => String(n).padStart(len, '0')
  const dd = pad(now.getDate())
  const mm = pad(now.getMonth() + 1)
  const yyyy = now.getFullYear()
  const hh = pad(now.getHours())
  const min = pad(now.getMinutes())
  const ss = pad(now.getSeconds())
  const ms = pad(now.getMilliseconds(), 3)

  return `OB-${singkatan}-${dd}${mm}${yyyy}${hh}${min}${ss}${ms}`
}

watch(() => group.value.klien_ar_id, newVal => {
  if (newVal && !props.isEditing && props.showNoInvoice)
    group.value.no_invoice = generateObNoInvoice()
  fetchOutstandingInvoices(newVal)
})

watch(() => group.value.tanggal, () => {
  if (group.value.klien_ar_id) fetchOutstandingInvoices(group.value.klien_ar_id)
})

watch(() => group.value.details, newDetails => {
  if (newDetails.length > 0)
    group.value.saldo_awal = newDetails.reduce((sum, d) => sum + (Number(d.sisa_tagihan_asal) || 0), 0)
})
</script>

<style scoped>
.readonly-locked-field :deep(input) {
  cursor: default;
  pointer-events: none;
}

.opening-balance-card {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
}

.section-heading {
  display: flex;
  align-items: flex-start;
  gap: 14px;
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

.form-section + .form-section {
  margin-block-start: 28px;
  padding-block-start: 28px;
  border-block-start: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.form-section__header {
  margin-block-end: 16px;
}

.ob-detail-wrapper {
  border-color: rgba(var(--v-border-color), var(--v-border-opacity));
  overflow: hidden;
}
</style>
