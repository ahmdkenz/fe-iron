<template>
  <div>
    <PageHeader
      :title="isEditing ? 'Edit Opening Balance AP' : 'Saldo Awal Hutang (Opening Balance AP)'"
      :subtitle="isEditing ? 'Perbarui data opening balance yang ditolak sebelum diajukan ulang' : 'Ajukan saldo hutang awal untuk Vendor'"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Opening Balance', to: { name: 'ap-opening-balance-index' } },
        { title: isEditing ? 'Edit Opening Balance' : 'Buat Opening Balance', disabled: true }
      ]"
    >
      <VBtn
        variant="tonal"
        color="secondary"
        :to="{ name: 'ap-opening-balance-index' }"
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
      class="text-center py-16"
    >
      <VProgressCircular
        indeterminate
        color="primary"
        size="48"
      />
      <div class="text-body-2 text-medium-emphasis mt-3">
        Memuat data opening balance...
      </div>
    </div>

    <VAlert
      v-else-if="loadError"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      {{ loadError }}
    </VAlert>

    <VForm
      v-else
      ref="formRef"
      @submit.prevent="handleSubmit"
    >
      <VRow>
        <VCol
          cols="12"
          lg="8"
        >
          <VCard class="mb-4 section-card">
            <div class="section-header">
              <div class="section-icon bg-primary">
                <VIcon
                  icon="ri-wallet-3-line"
                  size="16"
                  color="white"
                />
              </div>
              <span class="text-subtitle-1 font-weight-semibold">Detail Pengajuan</span>
            </div>
            <VDivider />
            <VCardText class="pt-4">
              <VAlert
                type="info"
                variant="tonal"
                density="compact"
                class="mb-4"
                icon="ri-information-line"
              >
                Hanya untuk hutang <em>historis</em> yang berasal dari luar sistem (spreadsheet, sistem lama, atau manual).
                Jika tagihan sudah pernah diinput di sistem ini, tidak perlu Opening Balance.
              </VAlert>

              <VRow>
                <VCol cols="12">
                  <VTextField
                    v-model="form.no_tagihan"
                    label="No. Opening Balance"
                    density="compact"
                    variant="outlined"
                    prepend-inner-icon="ri-hashtag"
                    :rules="[v => !!v || 'No. Opening Balance wajib diisi']"
                    :error-messages="errors.no_tagihan"
                  />
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <VAutocomplete
                    v-model="form.vendor_ap_id"
                    label="Vendor"
                    density="compact"
                    variant="outlined"
                    :items="vendorList"
                    item-title="display_label"
                    item-value="id"
                    prepend-inner-icon="ri-store-2-line"
                    :rules="[v => !!v || 'Vendor wajib dipilih']"
                    :error-messages="errors.vendor_ap_id"
                    :loading="vendorLoading"
                    clearable
                    @focus="ensureVendorLoaded"
                    @update:model-value="onVendorChange"
                  >
                    <template #item="{ props: p, item }">
                      <VListItem
                        v-bind="p"
                        :title="item.raw.display_label"
                      />
                    </template>
                  </VAutocomplete>
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
                    readonly
                    hint="Dihitung otomatis dari total sisa tagihan rincian"
                    persistent-hint
                  />
                </VCol>

                <VCol
                  cols="12"
                  md="6"
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
                  md="6"
                >
                  <VTextField
                    v-model="form.tanggal_jatuh_tempo"
                    label="Jatuh Tempo (opsional)"
                    density="compact"
                    variant="outlined"
                    type="date"
                    prepend-inner-icon="ri-alarm-warning-line"
                    :error-messages="errors.tanggal_jatuh_tempo"
                    clearable
                  />
                </VCol>
              </VRow>
            </VCardText>
          </VCard>

          <VCard class="section-card">
            <div class="section-header">
              <div class="d-flex align-center gap-3">
                <div class="section-icon bg-warning">
                  <VIcon
                    icon="ri-list-check-2"
                    size="16"
                    color="white"
                  />
                </div>
                <span class="text-subtitle-1 font-weight-semibold">Rincian Invoice Vendor Asal</span>
                <VChip
                  size="x-small"
                  color="secondary"
                  variant="tonal"
                  label
                >
                  Opsional
                </VChip>
              </div>
            </div>
            <VDivider />
            <VCardText class="pt-0">
              <p class="text-body-2 text-medium-emphasis mb-3">
                Daftarkan invoice-invoice vendor asli yang membentuk saldo ini untuk keperluan audit.
              </p>
              <VCard
                variant="outlined"
                rounded="lg"
                class="ob-detail-wrapper"
              >
                <OpeningBalanceApDetailTable
                  :details="form.details"
                  :saldo-awal="Number(form.saldo_awal) || 0"
                  :outstanding-tagihan="outstandingTagihan"
                  :loading-outstanding="loadingOutstanding"
                  @update:details="form.details = $event"
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
            </VCardText>
          </VCard>
        </VCol>

        <VCol
          cols="12"
          lg="4"
        >
          <div class="sticky-sidebar">
            <VCard class="mb-4">
              <div class="section-header">
                <div class="section-icon bg-primary">
                  <VIcon
                    icon="ri-file-chart-line"
                    size="16"
                    color="white"
                  />
                </div>
                <span class="text-subtitle-1 font-weight-semibold">Ringkasan</span>
              </div>
              <VDivider />
              <VCardText class="pt-4">
                <table class="summary-table w-100">
                  <tr>
                    <td class="text-body-2 text-medium-emphasis pb-2">
                      Vendor
                    </td>
                    <td class="text-body-2 text-right font-weight-medium pb-2">
                      {{ selectedVendor?.nama_vendor ?? '-' }}
                    </td>
                  </tr>
                  <tr>
                    <td class="text-body-2 text-medium-emphasis pb-2">
                      Tanggal
                    </td>
                    <td class="text-body-2 text-right font-weight-medium pb-2">
                      {{ formattedTanggal }}
                    </td>
                  </tr>
                </table>
                <VDivider class="my-3" />
                <div class="d-flex justify-space-between align-center">
                  <span class="text-subtitle-1 font-weight-bold">Saldo Awal</span>
                  <span class="text-h6 font-weight-bold text-primary">{{ formatCurrency(form.saldo_awal) }}</span>
                </div>
              </VCardText>
            </VCard>

            <VCard class="mb-4">
              <VCardText class="pa-4">
                <VAlert
                  v-if="errorMessage"
                  type="error"
                  variant="tonal"
                  density="compact"
                  class="mb-4"
                >
                  {{ errorMessage }}
                </VAlert>
                <VTextarea
                  v-model="form.keterangan"
                  label="Keterangan"
                  density="compact"
                  variant="outlined"
                  rows="2"
                  auto-grow
                  :error-messages="errors.keterangan"
                  class="mb-4"
                />
                <VBtn
                  type="submit"
                  block
                  color="primary"
                  size="large"
                  prepend-icon="ri-send-plane-line"
                  :disabled="saving"
                  :loading="saving"
                >
                  {{ isEditing ? 'Simpan Perubahan' : 'Ajukan Opening Balance' }}
                </VBtn>
              </VCardText>
            </VCard>
          </div>
        </VCol>
      </VRow>
    </VForm>
  </div>
</template>

<script setup>
/* eslint-disable camelcase */
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCrud } from '@/composables/useCrud'
import { useLazyFetchAll } from '@/composables/useLazyFetchAll'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { useFormatter, toISODate } from '@/composables/useFormatter'
import { setFlashAlert } from '@/utils/flashAlert'
import api from '@/utils/axios'
import OpeningBalanceApDetailTable from '../components/OpeningBalanceApDetailTable.vue'

const route = useRoute()
const router = useRouter()
const { showError } = useSweetAlert()
const { formatCurrency, formatDate } = useFormatter()

const id = route.params.id
const isEditing = computed(() => !!id)

const { create, fetchOne, update, saving } = useCrud('/ap/opening-balance')
const { items: vendorList, loading: vendorLoading, fetchAll: fetchVendor, ensureItem: ensureVendorItem } = useCrud('/ap/vendors')
const { ensureLoaded: ensureVendorLoaded } = useLazyFetchAll(fetchVendor)

const formRef = ref(null)
const pageLoading = ref(!!id)
const loadError = ref('')
const errorMessage = ref('')

const errors = reactive({
  no_tagihan: [], vendor_ap_id: [], tanggal: [], tanggal_jatuh_tempo: [], saldo_awal: [], keterangan: [], details: [],
})

const form = reactive({
  no_tagihan: '',
  vendor_ap_id: null,
  tanggal: new Date().toISOString().slice(0, 10),
  tanggal_jatuh_tempo: '',
  saldo_awal: null,
  keterangan: '',
  details: [],
})

const selectedVendor = computed(() => vendorList.value.find(v => v.id === form.vendor_ap_id) ?? null)

const formattedTanggal = computed(() => form.tanggal ? formatDate(form.tanggal) : '-')

const outstandingTagihan = ref([])
const loadingOutstanding = ref(false)

async function fetchOutstandingTagihan(vendorApId) {
  if (!vendorApId) { outstandingTagihan.value = [] 

    return }
  loadingOutstanding.value = true
  try {
    const { data } = await api.get('/ap/tagihan/outstanding', {
      params: { vendor_ap_id: vendorApId, tanggal: form.tanggal },
    })

    outstandingTagihan.value = data.data ?? []
  } catch {
    outstandingTagihan.value = []
  } finally {
    loadingOutstanding.value = false
  }
}

watch(() => form.vendor_ap_id, v => fetchOutstandingTagihan(v))
watch(() => form.tanggal, () => {
  if (form.vendor_ap_id) fetchOutstandingTagihan(form.vendor_ap_id)
})

watch(() => form.details, newDetails => {
  if (newDetails.length > 0)
    form.saldo_awal = newDetails.reduce((sum, d) => sum + (Number(d.sisa_tagihan_asal) || 0), 0)
})

async function loadPreviewNo() {
  if (!form.tanggal) return
  try {
    const { data } = await api.get('/ap/opening-balance/preview-no', {
      params: { tanggal: form.tanggal },
    })

    form.no_tagihan = data.data?.no_tagihan ?? ''
  } catch {
    // biarkan kosong jika gagal, akan divalidasi di backend
  }
}

function onVendorChange() {
  if (!isEditing.value && !form.no_tagihan) loadPreviewNo()
}

async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  errorMessage.value = ''
  Object.keys(errors).forEach(k => (errors[k] = []))

  if (form.details.length > 0) {
    const sum = form.details.reduce((acc, d) => acc + (Number(d.sisa_tagihan_asal) || 0), 0)
    if (Math.abs(sum - Number(form.saldo_awal)) > 0.01) {
      errors.details = [`Jumlah sisa tagihan rincian (${sum.toFixed(2)}) harus sama dengan saldo awal (${Number(form.saldo_awal).toFixed(2)})`]
      
      return
    }
  }

  const payload = { ...form }
  const res = isEditing.value ? await update(id, payload) : await create(payload)

  if (res.success) {
    setFlashAlert({
      icon: 'success',
      title: 'Berhasil',
      text: isEditing.value ? 'Perubahan opening balance berhasil disimpan.' : 'Opening balance berhasil diajukan.',
    })
    router.push({ name: 'ap-opening-balance-index' })
  } else {
    if (res.errors) {
      Object.entries(res.errors).forEach(([k, v]) => { if (k in errors) errors[k] = v })
    }
    errorMessage.value = res.message ?? 'Terjadi kesalahan'
    await showError(errorMessage.value)
  }
}

onMounted(async () => {
  ensureVendorLoaded()

  if (!isEditing.value) {
    loadPreviewNo()
    
    return
  }

  pageLoading.value = true

  const data = await fetchOne(id)

  pageLoading.value = false

  if (!data) {
    loadError.value = 'Data opening balance tidak ditemukan'
    
    return
  }
  if (!data.can_edit) {
    loadError.value = 'Opening balance ini tidak dapat diedit.'
    
    return
  }

  ensureVendorItem(data.vendor_ap)

  Object.assign(form, {
    no_tagihan: data.no_tagihan,
    vendor_ap_id: data.vendor_ap_id,
    tanggal: toISODate(data.tanggal_tagihan) || new Date().toISOString().slice(0, 10),
    tanggal_jatuh_tempo: toISODate(data.tanggal_jatuh_tempo) ?? '',
    saldo_awal: data.subtotal ?? null,
    keterangan: data.keterangan ?? '',
    details: data.opening_balance_ap_details ?? [],
  })
})
</script>

<style scoped>
.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
}

.section-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.section-card {
  border-inline-start: 3px solid rgb(var(--v-theme-primary));
}

.sticky-sidebar {
  position: sticky;
  top: 80px;
}

.summary-table {
  border-collapse: collapse;
  width: 100%;
}

.summary-table td {
  padding: 3px 0;
}

.ob-detail-wrapper {
  border-color: rgba(var(--v-border-color), var(--v-border-opacity));
  overflow: hidden;
}
</style>
