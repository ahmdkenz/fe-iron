<template>
  <div>
    <PageHeader
      :title="isEditing ? 'Edit Tagihan AP' : 'Input Tagihan AP'"
      :subtitle="isEditing ? 'Ubah data tagihan (hanya sebelum/setelah ditolak)' : 'Input tagihan baru dari vendor'"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Tagihan', to: { name: 'ap-tagihan-index' } },
        { title: isEditing ? 'Edit Tagihan' : 'Input Tagihan', disabled: true }
      ]"
    >
      <VBtn variant="tonal" color="secondary" :to="{ name: 'ap-tagihan-index' }">
        <VIcon icon="ri-arrow-left-line" class="me-1" />
        Kembali
      </VBtn>
    </PageHeader>

    <div v-if="loadingData" class="text-center py-16">
      <VProgressCircular indeterminate color="primary" size="48" />
      <div class="text-body-2 text-medium-emphasis mt-3">Memuat data tagihan...</div>
    </div>

    <VAlert v-else-if="isEditing && !tagihan" type="error" variant="tonal" class="mb-4">
      Tagihan tidak ditemukan atau tidak dapat diedit.
    </VAlert>

    <VForm v-else ref="formRef" @submit.prevent>
      <VAlert v-if="errorMessage" type="error" variant="tonal" closable class="mb-4">
        {{ errorMessage }}
      </VAlert>

      <VRow>
        <VCol cols="12" lg="8">
          <VCard class="mb-4 section-card">
            <div class="section-header">
              <div class="section-icon bg-primary">
                <VIcon icon="ri-file-list-3-line" size="16" color="white" />
              </div>
              <span class="text-subtitle-1 font-weight-semibold">Informasi Tagihan</span>
            </div>
            <VDivider />
            <VCardText class="pt-4">
              <VRow>
                <VCol cols="12" md="6">
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
                    :loading="vendorLoading"
                    clearable
                    @focus="ensureVendorLoaded"
                    @update:model-value="onVendorChange"
                  >
                    <template #item="{ props: p, item }">
                      <VListItem v-bind="p" :title="item.raw.display_label" :subtitle="item.raw.kategori" />
                    </template>
                  </VAutocomplete>
                </VCol>
                <VCol cols="12" md="6">
                  <VTextField
                    v-model="form.no_invoice_vendor"
                    label="No. Invoice Vendor"
                    density="compact"
                    variant="outlined"
                    prepend-inner-icon="ri-hashtag"
                  />
                </VCol>
                <VCol cols="12" md="6">
                  <VTextField
                    v-model="form.tanggal_tagihan"
                    label="Tanggal Tagihan"
                    density="compact"
                    variant="outlined"
                    type="date"
                    prepend-inner-icon="ri-calendar-line"
                    :rules="[v => !!v || 'Tanggal wajib diisi']"
                  />
                </VCol>
                <VCol cols="12" md="6">
                  <VTextField
                    v-model="form.tanggal_jatuh_tempo"
                    label="Jatuh Tempo"
                    density="compact"
                    variant="outlined"
                    type="date"
                    prepend-inner-icon="ri-alarm-warning-line"
                    clearable
                  />
                </VCol>
                <VCol cols="12" md="6">
                  <VTextField
                    v-model="form.no_po"
                    label="No. PO (Referensi)"
                    density="compact"
                    variant="outlined"
                    prepend-inner-icon="ri-file-text-line"
                    clearable
                  />
                </VCol>
                <VCol cols="12" md="6">
                  <VTextField
                    v-model="form.no_terima_barang"
                    label="No. Terima Barang (Referensi)"
                    density="compact"
                    variant="outlined"
                    prepend-inner-icon="ri-truck-line"
                    clearable
                  />
                </VCol>
              </VRow>
            </VCardText>
          </VCard>

          <VCard class="mb-4 section-card">
            <div class="section-header">
              <div class="section-icon bg-info">
                <VIcon icon="ri-percent-line" size="16" color="white" />
              </div>
              <span class="text-subtitle-1 font-weight-semibold">Pajak (Manual)</span>
            </div>
            <VDivider />
            <VCardText class="pt-4">
              <VRow>
                <VCol cols="12" md="6">
                  <VTextField
                    v-model.number="form.ppn_masukan"
                    label="PPN Masukan"
                    density="compact"
                    variant="outlined"
                    type="number"
                    min="0"
                    prefix="Rp"
                  />
                </VCol>
                <VCol cols="12" md="6">
                  <VTextField
                    v-model.number="form.pph23"
                    label="PPh 23"
                    density="compact"
                    variant="outlined"
                    type="number"
                    min="0"
                    prefix="Rp"
                  />
                </VCol>
              </VRow>
            </VCardText>
          </VCard>
        </VCol>

        <VCol cols="12" lg="4">
          <div class="sticky-sidebar">
            <VCard class="mb-4">
              <div class="section-header">
                <div class="section-icon bg-primary">
                  <VIcon icon="ri-calculator-line" size="16" color="white" />
                </div>
                <span class="text-subtitle-1 font-weight-semibold">Ringkasan Tagihan</span>
              </div>
              <VDivider />
              <VCardText class="pt-4">
                <table class="summary-table w-100">
                  <tr>
                    <td class="text-body-2 text-medium-emphasis pb-2">Subtotal Item</td>
                    <td class="text-body-2 text-right font-weight-medium pb-2">{{ formatCurrency(subtotal) }}</td>
                  </tr>
                  <tr>
                    <td class="text-body-2 text-medium-emphasis pb-2">PPN Masukan</td>
                    <td class="text-body-2 text-right font-weight-medium pb-2">{{ formatCurrency(form.ppn_masukan) }}</td>
                  </tr>
                  <tr>
                    <td class="text-body-2 text-medium-emphasis pb-2">PPh 23</td>
                    <td class="text-body-2 text-right font-weight-medium pb-2">- {{ formatCurrency(form.pph23) }}</td>
                  </tr>
                </table>
                <VDivider class="my-3" />
                <div class="d-flex justify-space-between align-center mb-2">
                  <span class="text-subtitle-1 font-weight-bold">Total Tagihan</span>
                  <span class="text-h6 font-weight-bold text-primary">{{ formatCurrency(totalTagihan) }}</span>
                </div>
              </VCardText>
            </VCard>

            <VCard>
              <VCardText class="pa-4">
                <VBtn
                  block
                  color="primary"
                  size="large"
                  prepend-icon="ri-send-plane-line"
                  :disabled="saving"
                  :loading="saving"
                  @click="handleSubmit"
                >
                  {{ isEditing ? 'Simpan Perubahan' : 'Ajukan untuk Persetujuan' }}
                </VBtn>
                <div class="text-caption text-medium-emphasis mt-2">
                  {{ isEditing
                    ? 'Setelah disimpan, klik "Ajukan Ulang" di halaman detail bila status sebelumnya ditolak.'
                    : 'Tagihan akan masuk antrian approval SUPERVISOR/MANAGER.' }}
                </div>
              </VCardText>
            </VCard>
          </div>
        </VCol>

        <VCol cols="12">
          <VCard class="mb-4 section-card">
            <div class="section-header">
              <div class="d-flex align-center gap-3">
                <div class="section-icon bg-warning">
                  <VIcon icon="ri-list-check-2" size="16" color="white" />
                </div>
                <span class="text-subtitle-1 font-weight-semibold">Item Tagihan</span>
                <VChip v-if="form.items.length > 0" size="x-small" color="warning" variant="tonal" class="font-weight-medium">
                  {{ form.items.length }} item
                </VChip>
              </div>
              <VBtn color="primary" size="small" prepend-icon="ri-add-line" variant="tonal" @click="addItem">
                Tambah Baris
              </VBtn>
            </div>
            <VDivider />

            <VCardText>
              <div v-if="form.items.length === 0" class="text-center text-medium-emphasis py-10">
                <VIcon icon="ri-inbox-line" size="44" class="mb-3 d-block opacity-40" />
                <div class="text-body-2">Belum ada item.</div>
                <div class="text-caption mt-1">Klik "Tambah Baris" untuk mulai menambahkan item tagihan.</div>
              </div>

              <TagihanApItemRow
                v-for="(itm, idx) in form.items"
                :key="idx"
                :item="itm"
                @update:item="updateItem(idx, $event)"
                @remove="removeItem(idx)"
              />

              <VAlert v-if="itemsError" type="error" variant="tonal" density="compact" class="mt-1">
                {{ itemsError }}
              </VAlert>
            </VCardText>
          </VCard>

          <VCard class="mb-4">
            <div class="section-header">
              <div class="section-icon bg-secondary">
                <VIcon icon="ri-sticky-note-line" size="16" color="white" />
              </div>
              <span class="text-subtitle-1 font-weight-semibold">Keterangan</span>
              <VChip size="x-small" color="secondary" variant="tonal">Opsional</VChip>
            </div>
            <VDivider />
            <VCardText class="pt-4">
              <VTextField
                v-model="form.keterangan"
                label="Keterangan tambahan"
                density="compact"
                variant="outlined"
                prepend-inner-icon="ri-chat-1-line"
              />
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </VForm>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCrud } from '@/composables/useCrud'
import { useLazyFetchAll } from '@/composables/useLazyFetchAll'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { useFormatter, toISODate } from '@/composables/useFormatter'
import { setFlashAlert } from '@/utils/flashAlert'
import api from '@/utils/axios'
import TagihanApItemRow from '../components/TagihanApItemRow.vue'

const route = useRoute()
const router = useRouter()
const { showError } = useSweetAlert()

const id = route.params.id
const isEditing = computed(() => !!id)

const { create, fetchOne, update, saving } = useCrud('/ap/tagihan')
const { items: vendorList, loading: vendorLoading, fetchAll: fetchVendor, ensureItem: ensureVendorItem } = useCrud('/ap/vendors')
const { ensureLoaded: ensureVendorLoaded } = useLazyFetchAll(fetchVendor)
const { formatCurrency } = useFormatter()

const formRef = ref(null)
const errorMessage = ref('')
const itemsError = ref('')
const loadingData = ref(!!id)
const tagihan = ref(null)

const form = reactive({
  no_tagihan: '',
  no_invoice_vendor: '',
  tanggal_tagihan: new Date().toISOString().slice(0, 10),
  tanggal_jatuh_tempo: '',
  vendor_ap_id: null,
  no_po: '',
  no_terima_barang: '',
  ppn_masukan: 0,
  pph23: 0,
  keterangan: '',
  items: [],
})

const subtotal = computed(() =>
  form.items.reduce((sum, it) => sum + (it.subtotal ?? 0), 0),
)

const totalTagihan = computed(() =>
  subtotal.value + (form.ppn_masukan ?? 0) - (form.pph23 ?? 0),
)

async function loadPreviewNo() {
  if (!form.vendor_ap_id || !form.tanggal_tagihan) return
  try {
    const { data } = await api.get('/ap/tagihan/preview-no', {
      params: { vendor_ap_id: form.vendor_ap_id, tanggal: form.tanggal_tagihan },
    })
    form.no_tagihan = data.data?.no_tagihan ?? ''
  } catch {
    // biarkan kosong jika gagal, akan digenerate di backend
  }
}

function onVendorChange() {
  if (!isEditing.value) loadPreviewNo()
}

function addItem() {
  form.items.push({
    barang_id: null, kode_barang: '', nama_barang: '', qty: 1,
    satuan: 'pcs', harga_satuan: 0, subtotal: 0, keterangan: '',
  })
  itemsError.value = ''
}

function updateItem(idx, val) { form.items[idx] = val }
function removeItem(idx) { form.items.splice(idx, 1) }

async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  if (form.items.length === 0) {
    itemsError.value = 'Minimal 1 item tagihan wajib diisi.'
    return
  }
  itemsError.value = ''
  errorMessage.value = ''

  const payload = { ...form }

  const res = isEditing.value ? await update(id, payload) : await create(payload)

  if (res.success) {
    setFlashAlert({
      icon: 'success',
      title: 'Berhasil',
      text: isEditing.value ? 'Perubahan tagihan berhasil disimpan.' : 'Tagihan berhasil diajukan untuk persetujuan.',
    })
    router.push({ name: 'ap-tagihan-show', params: { id: id ?? res.data.id } })
  } else {
    errorMessage.value = res.message ?? 'Terjadi kesalahan'
    await showError(errorMessage.value)
  }
}

onMounted(async () => {
  if (!isEditing.value) {
    loadPreviewNo()
    return
  }

  const data = await fetchOne(id)
  loadingData.value = false
  if (!data || !(data.status === 'DRAFT' && ['PENDING', 'REJECTED'].includes(data.approval_status))) return

  tagihan.value = data
  ensureVendorItem(data.vendor_ap)

  Object.assign(form, {
    no_tagihan: data.no_tagihan,
    no_invoice_vendor: data.no_invoice_vendor ?? '',
    tanggal_tagihan: toISODate(data.tanggal_tagihan),
    tanggal_jatuh_tempo: toISODate(data.tanggal_jatuh_tempo) ?? '',
    vendor_ap_id: data.vendor_ap_id,
    no_po: data.no_po ?? '',
    no_terima_barang: data.no_terima_barang ?? '',
    ppn_masukan: data.ppn_masukan ?? 0,
    pph23: data.pph23 ?? 0,
    keterangan: data.keterangan ?? '',
    items: (data.items ?? []).map(it => ({
      barang_id: it.barang_id,
      kode_barang: it.kode_barang ?? '',
      nama_barang: it.nama_barang,
      qty: it.qty,
      satuan: it.satuan,
      harga_satuan: it.harga_satuan,
      subtotal: it.subtotal,
      keterangan: it.keterangan ?? '',
    })),
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
</style>
