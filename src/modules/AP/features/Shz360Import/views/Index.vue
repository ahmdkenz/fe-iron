<template>
  <div>
    <PageHeader
      title="Import SHZ360"
      subtitle="Staging PO & penerimaan barang dari SHZ360 sebelum jadi tagihan AP"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Import SHZ360', disabled: true }
      ]"
    >
      <VBtn
        v-if="authStore.canOperateApShz360Import"
        color="primary"
        prepend-icon="ri-refresh-line"
        :loading="retrying"
        @click="doRetrySync"
      >
        Sync Sekarang
      </VBtn>
    </PageHeader>

    <VAlert
      v-if="lastRun"
      class="mb-4"
      :type="lastRun.status === 'success' ? 'success' : (lastRun.status === 'failed' ? 'error' : 'info')"
      variant="tonal"
      density="compact"
    >
      Sync terakhir ({{ formatDateTime(lastRun.started_at) }}): <strong>{{ lastRun.status }}</strong> —
      PO {{ lastRun.po_upserted }}/{{ lastRun.po_fetched }}, Terima PO {{ lastRun.receipt_upserted }}/{{ lastRun.receipt_fetched }}
      <span v-if="lastRun.message"> — {{ lastRun.message }}</span>
    </VAlert>

    <VCard>
      <VCardText class="d-flex flex-wrap gap-3 pb-0">
        <VTextField
          v-model="params.kode_po"
          placeholder="Cari kode PO..."
          clearable
          hide-details
          density="compact"
          style="max-width: 220px"
          prepend-inner-icon="ri-search-line"
          @update:model-value="debouncedFetch"
        />
        <VTextField
          v-model="params.kode_receipt"
          placeholder="Cari kode terima PO..."
          clearable
          hide-details
          density="compact"
          style="max-width: 220px"
          prepend-inner-icon="ri-search-line"
          @update:model-value="debouncedFetch"
        />
        <VSelect
          v-model="params.import_status"
          placeholder="Semua Status"
          clearable
          hide-details
          density="compact"
          style="max-width: 200px"
          :items="statusOptions"
          item-title="label"
          item-value="value"
          @update:model-value="doFetch"
        />
        <VSwitch
          v-model="params.need_mapping"
          label="Perlu mapping vendor"
          hide-details
          density="compact"
          :true-value="1"
          :false-value="''"
          @update:model-value="doFetch"
        />
      </VCardText>

      <BaseTable
        :headers="headers"
        :items="items"
        :total="meta.total"
        :loading="loading"
        :per-page="meta.per_page"
        :page="meta.current_page"
        column-resize-key="ap-shz360-import-index"
        class="mt-2"
        @update:options="onTableOptions"
      >
        <template #item.no="{ index }">
          {{ (meta.current_page - 1) * meta.per_page + index + 1 }}
        </template>
        <template #item.kode_receipt="{ item }">
          <VChip color="primary" size="small" variant="tonal" label>{{ item.kode_receipt }}</VChip>
        </template>
        <template #item.kode_po="{ item }">
          {{ item.kode_po ?? '-' }}
        </template>
        <template #item.vendor_nama="{ item }">
          <span v-if="item.vendor_nama">{{ item.vendor_nama }}</span>
          <VChip v-else-if="item.need_mapping" color="warning" size="small" variant="tonal">
            Perlu dipetakan — {{ item.source_supplier_name ?? 'Supplier tidak diketahui' }}
          </VChip>
          <span v-else>-</span>
        </template>
        <template #item.total_diterima="{ item }">
          {{ formatCurrency(item.total_diterima) }}
        </template>
        <template #item.import_status="{ item }">
          <Shz360ImportStatusBadge :status="item.import_status" />
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <VBtn icon size="small" variant="text" color="info" @click="openDetail(item)">
              <VIcon icon="ri-eye-line" size="18" />
              <VTooltip activator="parent">Detail</VTooltip>
            </VBtn>
            <VBtn
              v-if="item.need_mapping && authStore.canOperateApShz360Import"
              icon
              size="small"
              variant="text"
              color="warning"
              @click="openMapVendor(item)"
            >
              <VIcon icon="ri-link-m" size="18" />
              <VTooltip activator="parent">Petakan Vendor</VTooltip>
            </VBtn>
            <VBtn
              v-if="!item.need_mapping && item.import_status !== 'CONVERTED' && item.import_status !== 'IGNORED' && authStore.canOperateApShz360Import"
              icon
              size="small"
              variant="text"
              color="primary"
              @click="openConvert(item)"
            >
              <VIcon icon="ri-file-add-line" size="18" />
              <VTooltip activator="parent">Buat Tagihan</VTooltip>
            </VBtn>
            <VBtn
              v-if="item.import_status === 'CONVERTED' && item.tagihan_ap_id"
              icon
              size="small"
              variant="text"
              color="success"
              :to="{ name: 'ap-tagihan-show', params: { id: item.tagihan_ap_id } }"
            >
              <VIcon icon="ri-bill-line" size="18" />
              <VTooltip activator="parent">Lihat Tagihan</VTooltip>
            </VBtn>
            <VBtn
              v-if="!['CONVERTED', 'IGNORED'].includes(item.import_status) && authStore.canOperateApShz360Import"
              icon
              size="small"
              variant="text"
              color="error"
              @click="confirmIgnore(item)"
            >
              <VIcon icon="ri-close-circle-line" size="18" />
              <VTooltip activator="parent">Abaikan</VTooltip>
            </VBtn>
          </div>
        </template>
      </BaseTable>
    </VCard>

    <!-- Detail -->
    <BaseModal v-model="showDetail" title="Detail Staging SHZ360" width="800">
      <div v-if="detailLoading" class="text-center pa-6">
        <VProgressCircular indeterminate color="primary" />
      </div>
      <div v-else-if="detailItem">
        <VRow class="mb-3">
          <VCol cols="6"><strong>Kode Terima PO:</strong> {{ detailItem.kode_receipt }}</VCol>
          <VCol cols="6"><strong>Kode PO:</strong> {{ detailItem.kode_po ?? '-' }}</VCol>
          <VCol cols="6"><strong>Vendor:</strong> {{ detailItem.vendor_nama ?? '-' }}</VCol>
          <VCol cols="6"><strong>No. Invoice:</strong> {{ detailItem.no_invoice ?? '-' }}</VCol>
          <VCol cols="6"><strong>No. Surat Jalan:</strong> {{ detailItem.no_surat_jalan ?? '-' }}</VCol>
          <VCol cols="6"><strong>No. Faktur Pajak:</strong> {{ detailItem.no_faktur_pajak ?? '-' }}</VCol>
        </VRow>
        <p class="text-subtitle-2 mb-2">Item Diterima</p>
        <VTable density="compact" class="mb-4">
          <thead>
            <tr><th>Barang</th><th>Satuan</th><th class="text-right">Qty Diterima</th><th class="text-right">Harga</th><th class="text-right">Subtotal</th></tr>
          </thead>
          <tbody>
            <tr v-for="(it, idx) in detailItem.items" :key="idx">
              <td>{{ it.nama_barang }}</td>
              <td>{{ it.satuan }}</td>
              <td class="text-right">{{ it.qty_diterima }}</td>
              <td class="text-right">{{ formatCurrency(it.harga) }}</td>
              <td class="text-right">{{ formatCurrency(it.subtotal) }}</td>
            </tr>
          </tbody>
        </VTable>
      </div>
      <template #actions>
        <AppActionButton action="batalkan" label="Tutup" @click="showDetail = false" />
      </template>
    </BaseModal>

    <!-- Map Vendor -->
    <BaseModal
      v-if="showMapVendor"
      v-model="showMapVendor"
      title="Petakan Vendor"
      width="640"
      :loading="mappingVendor"
      confirm-action="custom"
      confirm-label="Petakan"
      confirm-icon="ri-link-m"
      :disabled="mapVendorMode === 'existing' ? !mapVendorForm.vendor_ap_id : !canSubmitNewVendor"
      @confirm="doMapVendor"
    >
      <VCard variant="tonal" color="primary" rounded="lg" class="mb-4">
        <VCardText class="d-flex align-center gap-3 pa-3">
          <VAvatar size="40" color="primary" variant="flat" rounded="lg">
            <VIcon icon="ri-truck-line" size="20" />
          </VAvatar>
          <div class="flex-grow-1 min-w-0">
            <div class="text-caption text-medium-emphasis">Supplier dari SHZ360</div>
            <div class="font-weight-bold text-truncate">{{ selectedItem?.source_supplier_name ?? '-' }}</div>
          </div>
          <VChip size="small" variant="flat" color="primary" label>PO {{ selectedItem?.kode_po ?? '-' }}</VChip>
        </VCardText>
      </VCard>

      <div class="text-body-2 font-weight-medium mb-2">Pilih cara memetakan:</div>
      <VRow dense class="mb-2">
        <VCol cols="12" sm="6">
          <VCard
            variant="outlined"
            :color="mapVendorMode === 'existing' ? 'primary' : undefined"
            class="mode-card cursor-pointer"
            :class="{ 'mode-card--selected': mapVendorMode === 'existing' }"
            @click="mapVendorMode = 'existing'"
          >
            <VCardText class="pa-3 d-flex align-center gap-3">
              <VAvatar size="38" color="primary" variant="tonal" rounded="lg">
                <VIcon icon="ri-links-line" size="18" />
              </VAvatar>
              <div class="flex-grow-1">
                <div class="font-weight-bold text-body-2">Vendor Ada</div>
                <div class="text-caption text-medium-emphasis">Sudah terdaftar di sistem</div>
              </div>
              <VAvatar v-if="mapVendorMode === 'existing'" size="20" color="primary">
                <VIcon icon="ri-check-line" size="13" color="white" />
              </VAvatar>
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="12" sm="6">
          <VCard
            variant="outlined"
            :color="mapVendorMode === 'create' ? 'success' : undefined"
            class="mode-card cursor-pointer"
            :class="{ 'mode-card--selected': mapVendorMode === 'create' }"
            @click="mapVendorMode = 'create'"
          >
            <VCardText class="pa-3 d-flex align-center gap-3">
              <VAvatar size="38" color="success" variant="tonal" rounded="lg">
                <VIcon icon="ri-user-add-line" size="18" />
              </VAvatar>
              <div class="flex-grow-1">
                <div class="font-weight-bold text-body-2">Vendor Baru</div>
                <div class="text-caption text-medium-emphasis">Buat otomatis dari data SHZ360</div>
              </div>
              <VAvatar v-if="mapVendorMode === 'create'" size="20" color="success">
                <VIcon icon="ri-check-line" size="13" color="white" />
              </VAvatar>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <VExpandTransition>
        <div v-if="mapVendorMode === 'existing'" key="existing">
          <VAutocomplete
            v-model="mapVendorForm.vendor_ap_id"
            label="Vendor AP"
            variant="outlined"
            density="compact"
            prepend-inner-icon="ri-store-2-line"
            :items="vendorList"
            item-title="display_label"
            item-value="id"
            :loading="vendorLoading"
            clearable
            class="mt-2"
            @focus="ensureVendorLoaded"
          >
            <template #item="{ props: p, item }">
              <VListItem v-bind="p" :title="item.raw.nama_vendor" :subtitle="item.raw.no_npwp ? `NPWP: ${item.raw.no_npwp}` : item.raw.kode_vendor" />
            </template>
          </VAutocomplete>

          <VExpandTransition>
            <VCard v-if="selectedVendorDetail" variant="outlined" rounded="lg" class="mt-3">
              <DetailRow label="NPWP" :value="selectedVendorDetail.no_npwp" label-width="110px" />
              <DetailRow label="Bank" :value="selectedVendorDetail.bank_nama" label-width="110px" />
              <DetailRow label="No. Rekening" :value="selectedVendorDetail.bank_no_rekening" label-width="110px" />
              <DetailRow label="Atas Nama" :value="selectedVendorDetail.bank_atas_nama" label-width="110px" />
              <DetailRow label="PIC AP" :value="selectedVendorDetail.karyawan_ap?.nama_karyawan" label-width="110px" />
            </VCard>
          </VExpandTransition>
        </div>

        <div v-else key="create">
          <VAlert type="info" variant="tonal" density="compact" class="mb-3" icon="ri-information-line">
            Nama, NPWP, dan info bank otomatis terisi dari data SHZ360.
          </VAlert>

          <VCard variant="outlined" rounded="lg" class="mb-4">
            <DetailRow label="Nama Vendor" :value="selectedItem?.source_supplier?.nama_supplier" label-width="120px" />
            <DetailRow label="NPWP" :value="selectedItem?.source_supplier?.npwp" label-width="120px" />
            <DetailRow label="Bank" :value="selectedItem?.source_supplier?.bank_nama" label-width="120px" />
            <DetailRow label="No. Rekening" :value="selectedItem?.source_supplier?.bank_no_rekening" label-width="120px" />
            <DetailRow label="Atas Nama" :value="selectedItem?.source_supplier?.bank_atas_nama" label-width="120px" />
          </VCard>

          <VAutocomplete
            v-model="newVendorForm.karyawan_ap_id"
            label="PIC AP"
            variant="outlined"
            density="compact"
            prepend-inner-icon="ri-user-line"
            :items="karyawanList"
            item-title="nama_karyawan"
            item-value="id"
            hint="Wajib dipilih — SHZ360 tidak menyediakan data ini"
            persistent-hint
            :loading="karyawanLoading"
            @focus="ensureKaryawanLoaded"
          >
            <template #item="{ props: p, item }">
              <VListItem v-bind="p" :title="item.raw.nama_karyawan" :subtitle="item.raw.nik" />
            </template>
          </VAutocomplete>
        </div>
      </VExpandTransition>
    </BaseModal>

    <!-- Convert to Tagihan -->
    <BaseModal
      v-if="showConvert"
      v-model="showConvert"
      title="Buat Tagihan dari Staging"
      :loading="converting"
      confirm-action="custom"
      confirm-label="Buat Tagihan"
      confirm-icon="ri-file-add-line"
      @confirm="doConvert"
    >
      <p class="mb-3">
        Tagihan akan dibuat dari penerimaan <strong>{{ selectedItem?.kode_receipt }}</strong>
        (PO {{ selectedItem?.kode_po }}, vendor {{ selectedItem?.vendor_nama }}).
      </p>
      <VRow>
        <VCol cols="12" md="6">
          <VTextField v-model="convertForm.no_invoice_vendor" label="No. Invoice Vendor" density="compact" />
        </VCol>
        <VCol cols="12" md="6">
          <VTextField v-model="convertForm.tanggal_tagihan" label="Tanggal Tagihan" type="date" density="compact" />
        </VCol>
        <VCol cols="12" md="6">
          <VTextField v-model="convertForm.tanggal_jatuh_tempo" label="Tanggal Jatuh Tempo" type="date" density="compact" />
        </VCol>
        <VCol cols="12" md="6">
          <VTextField v-model.number="convertForm.ppn_masukan" label="PPN Masukan" type="number" density="compact" />
        </VCol>
        <VCol cols="12" md="6">
          <VTextField v-model.number="convertForm.pph23" label="PPh 23" type="number" density="compact" />
        </VCol>
      </VRow>
      <VAlert v-if="convertError" type="error" variant="tonal" class="mt-2">{{ convertError }}</VAlert>
    </BaseModal>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { useAuthStore } from '@/stores/auth.store'
import { useCrud } from '@/composables/useCrud'
import { useLazyFetchAll } from '@/composables/useLazyFetchAll'
import { useFormatter } from '@/composables/useFormatter'
import api from '@/utils/axios'
import Shz360ImportStatusBadge from '../components/Shz360ImportStatusBadge.vue'
import DetailRow from '@/components/shared/DetailRow.vue'

const authStore = useAuthStore()
const { showSuccess, showError, confirmDelete: swalConfirm } = useSweetAlert()
const { formatCurrency } = useFormatter()

const { items, loading, meta, params, fetchList, fetchOne, item: detailItem } = useCrud('/ap/shz360/imports')
const { items: vendorList, loading: vendorLoading, fetchAll: fetchVendor } = useCrud('/ap/vendors')
const { items: karyawanList, loading: karyawanLoading, fetchAll: fetchKaryawan } = useCrud('/master/karyawan')
const { ensureLoaded: ensureVendorLoaded } = useLazyFetchAll(fetchVendor)
const { ensureLoaded: ensureKaryawanLoaded } = useLazyFetchAll(fetchKaryawan)

params.import_status = ''
params.kode_po = ''
params.kode_receipt = ''
params.need_mapping = ''

const headers = [
  { title: 'No', key: 'no', sortable: false, width: '60px' },
  { title: 'Kode Terima PO', key: 'kode_receipt', sortable: false, minWidth: '160px' },
  { title: 'Kode PO', key: 'kode_po', sortable: false, minWidth: '140px' },
  { title: 'Vendor', key: 'vendor_nama', sortable: false, minWidth: '220px' },
  { title: 'Total Diterima', key: 'total_diterima', sortable: false, minWidth: '150px' },
  { title: 'Status', key: 'import_status', sortable: false, minWidth: '160px' },
  { title: 'Aksi', key: 'actions', sortable: false, align: 'center', width: '160px' },
]

const statusOptions = [
  { label: 'Baru', value: 'NEW' },
  { label: 'Siap Dikonversi', value: 'READY_FOR_AP' },
  { label: 'Sudah Jadi Tagihan', value: 'CONVERTED' },
  { label: 'Diabaikan', value: 'IGNORED' },
]

let debounceTimer = null
function debouncedFetch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(doFetch, 400)
}

function doFetch() {
  params.page = 1
  fetchList()
}

function onTableOptions({ page, itemsPerPage }) {
  params.page = page
  params.per_page = itemsPerPage
  fetchList()
}

function formatDateTime(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString('id-ID')
}

// ─── Retry sync ───────────────────────────────────────────────────
const retrying = ref(false)
const lastRun = ref(null)

async function loadLastRun() {
  try {
    const { data } = await api.get('/ap/shz360/sync/last-run')
    lastRun.value = data.data
  } catch {
    // belum pernah sync, biarkan kosong
  }
}

async function doRetrySync() {
  retrying.value = true
  try {
    const { data } = await api.post('/ap/shz360/sync/retry')
    lastRun.value = data.data
    if (data.data.status === 'success') {
      await showSuccess(data.message)
    } else {
      await showError(data.data.message || 'Sync gagal')
    }
    fetchList()
  } catch (err) {
    await showError(err.response?.data?.message ?? 'Gagal menjalankan sync')
  } finally {
    retrying.value = false
  }
}

// ─── Detail ───────────────────────────────────────────────────────
const showDetail = ref(false)
const detailLoading = ref(false)

async function openDetail(item) {
  showDetail.value = true
  detailLoading.value = true
  await fetchOne(item.id)
  detailLoading.value = false
}

// ─── Map vendor ───────────────────────────────────────────────────
const showMapVendor = ref(false)
const mappingVendor = ref(false)
const selectedItem = ref(null)
const mapVendorMode = ref('existing')
const mapVendorForm = reactive({ vendor_ap_id: null })
const newVendorForm = reactive({ karyawan_ap_id: null })

const canSubmitNewVendor = computed(() => !!newVendorForm.karyawan_ap_id)

const selectedVendorDetail = computed(() => {
  if (!mapVendorForm.vendor_ap_id) return null
  return vendorList.value.find(v => v.id === mapVendorForm.vendor_ap_id) ?? null
})

function openMapVendor(item) {
  selectedItem.value = item
  mapVendorMode.value = 'existing'
  mapVendorForm.vendor_ap_id = null
  newVendorForm.karyawan_ap_id = null
  showMapVendor.value = true
}

async function doMapVendor() {
  mappingVendor.value = true
  try {
    if (mapVendorMode.value === 'existing') {
      if (!mapVendorForm.vendor_ap_id) return
      await api.post(`/ap/shz360/imports/${selectedItem.value.id}/map-vendor`, {
        vendor_ap_id: mapVendorForm.vendor_ap_id,
      })
      await showSuccess('Vendor berhasil dipetakan.')
    } else {
      if (!canSubmitNewVendor.value) return
      await api.post(`/ap/shz360/imports/${selectedItem.value.id}/create-vendor`, { ...newVendorForm })
      await showSuccess('Vendor baru berhasil dibuat dan dipetakan.')
    }
    showMapVendor.value = false
    fetchList()
  } catch (err) {
    await showError(err.response?.data?.message ?? 'Gagal memetakan vendor')
  } finally {
    mappingVendor.value = false
  }
}

// ─── Convert to tagihan ─────────────────────────────────────────────
const showConvert = ref(false)
const converting = ref(false)
const convertError = ref('')
const convertForm = reactive({
  no_invoice_vendor: '',
  tanggal_tagihan: new Date().toISOString().slice(0, 10),
  tanggal_jatuh_tempo: '',
  ppn_masukan: 0,
  pph23: 0,
})

function openConvert(item) {
  selectedItem.value = item
  convertError.value = ''
  convertForm.no_invoice_vendor = ''
  convertForm.tanggal_tagihan = new Date().toISOString().slice(0, 10)
  convertForm.tanggal_jatuh_tempo = ''
  convertForm.ppn_masukan = 0
  convertForm.pph23 = 0
  showConvert.value = true
}

async function doConvert() {
  convertError.value = ''
  converting.value = true
  try {
    const { data } = await api.post(`/ap/shz360/imports/${selectedItem.value.id}/convert-to-tagihan`, convertForm)
    showConvert.value = false
    fetchList()
    await showSuccess(`Tagihan ${data.data.no_tagihan} berhasil dibuat.`)
  } catch (err) {
    convertError.value = err.response?.data?.message ?? 'Gagal membuat tagihan'
    await showError(convertError.value)
  } finally {
    converting.value = false
  }
}

// ─── Ignore ───────────────────────────────────────────────────────
async function confirmIgnore(item) {
  const { isConfirmed } = await swalConfirm({
    title: 'Abaikan Data Ini?',
    text: `Penerimaan ${item.kode_receipt} tidak akan dikonversi jadi tagihan.`,
    confirmButtonText: 'Ya, abaikan',
  })
  if (!isConfirmed) return

  try {
    await api.post(`/ap/shz360/imports/${item.id}/ignore`)
    fetchList()
    await showSuccess('Data staging diabaikan.')
  } catch (err) {
    await showError(err.response?.data?.message ?? 'Gagal mengabaikan data')
  }
}

doFetch()
loadLastRun()
</script>

<style scoped>
.mode-card {
  transition: box-shadow 0.15s, background 0.15s;
}
.mode-card:hover {
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.12);
}
.mode-card--selected {
  background: rgba(var(--v-theme-on-surface), 0.04) !important;
}
.cursor-pointer {
  cursor: pointer;
}
</style>
