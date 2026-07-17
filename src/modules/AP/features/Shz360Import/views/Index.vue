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
      :disabled="!canSubmitMapVendor"
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

      <VAlert
        v-if="suggestedVendor"
        type="success"
        variant="tonal"
        density="compact"
        class="mb-4"
        icon="ri-checkbox-circle-line"
      >
        <div class="text-body-2">
          Vendor sudah terdaftar sebagai <strong>{{ suggestedVendor.nama_vendor }}</strong> ({{ suggestedVendor.kode_vendor }}).
        </div>
        <div class="text-caption text-medium-emphasis">
          PIC AP: {{ suggestedVendor.karyawan_ap_nama ?? '-' }} — sudah dipilih otomatis di bawah, atau pilih "Vendor Baru" kalau ini sebenarnya vendor lain.
        </div>
      </VAlert>

      <VBtnToggle v-model="mapVendorMode" mandatory color="primary" variant="outlined" density="compact" divided class="mb-4">
        <VBtn value="existing" size="small" style="min-width: 180px">
          <VIcon start size="16">ri-store-2-line</VIcon>Vendor Terdaftar
        </VBtn>
        <VBtn value="new" size="small" style="min-width: 150px">
          <VIcon start size="16">ri-add-circle-line</VIcon>Vendor Baru
        </VBtn>
      </VBtnToggle>

      <template v-if="mapVendorMode === 'existing'">
        <VAutocomplete
          v-model="existingVendorForm.vendor_ap_id"
          label="Vendor"
          variant="outlined"
          density="compact"
          prepend-inner-icon="ri-store-2-line"
          :items="vendorList"
          item-title="display_label"
          item-value="id"
          :loading="vendorLoading"
          clearable
        >
          <template #item="{ props: p, item }">
            <VListItem v-bind="p" :title="item.raw.display_label" />
          </template>
        </VAutocomplete>
      </template>

      <template v-else>
        <VAlert type="info" variant="tonal" density="compact" class="mb-4" icon="ri-information-line">
          Nama, NPWP, dan info bank otomatis terisi dari data SHZ360.
        </VAlert>

        <VCard variant="outlined" rounded="lg" class="mb-4">
          <DetailRow label="Nama Vendor" :value="selectedItem?.source_supplier?.nama_supplier" label-width="120px" />
          <DetailRow label="NPWP" :value="selectedItem?.source_supplier?.npwp" label-width="120px" />
          <DetailRow label="Bank" :value="selectedItem?.source_supplier?.bank_nama" label-width="120px" />
          <DetailRow label="No. Rekening" :value="selectedItem?.source_supplier?.bank_no_rekening" label-width="120px" />
          <DetailRow label="Atas Nama" :value="selectedItem?.source_supplier?.bank_atas_nama" label-width="120px" />
        </VCard>

        <VTextField
          v-model="newVendorForm.kode_vendor"
          label="Kode Supplier"
          variant="outlined"
          density="compact"
          prepend-inner-icon="ri-hashtag"
          hint="Ter-prefill dari SHZ360, bisa diedit bila perlu"
          persistent-hint
          class="mb-2"
        />

        <VTextField
          v-if="authStore.isApOnly"
          :model-value="displayKaryawanAp"
          label="PIC AP"
          variant="outlined"
          density="compact"
          prepend-inner-icon="ri-user-line"
          hint="Otomatis terisi sesuai akun Anda"
          persistent-hint
          readonly
        />
        <VAutocomplete
          v-else
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
      </template>
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

const displayKaryawanAp = computed(() => authStore.user?.karyawan?.nama_karyawan ?? '')

const { items, loading, meta, params, fetchList, fetchOne, item: detailItem } = useCrud('/ap/shz360/imports')
const { items: karyawanList, loading: karyawanLoading, fetchAll: fetchKaryawan } = useCrud('/master/karyawan')
const { ensureLoaded: ensureKaryawanLoaded } = useLazyFetchAll(fetchKaryawan)
const { items: vendorList, loading: vendorLoading, fetchAll: fetchVendor } = useCrud('/ap/vendors')
const { ensureLoaded: ensureVendorLoaded } = useLazyFetchAll(fetchVendor)

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
const mapVendorMode = ref('new')
const newVendorForm = reactive({ karyawan_ap_id: null, kode_vendor: null })
const existingVendorForm = reactive({ vendor_ap_id: null })

const suggestedVendor = computed(() => selectedItem.value?.suggested_vendor_ap ?? null)

const canSubmitMapVendor = computed(() => {
  return mapVendorMode.value === 'existing'
    ? !!existingVendorForm.vendor_ap_id
    : !!newVendorForm.karyawan_ap_id && !!newVendorForm.kode_vendor
})

function openMapVendor(item) {
  selectedItem.value = item
  newVendorForm.karyawan_ap_id = authStore.isApOnly ? (authStore.user?.karyawan?.id ?? null) : null
  newVendorForm.kode_vendor = item.source_supplier?.kode_supplier ?? null
  existingVendorForm.vendor_ap_id = item.suggested_vendor_ap?.id ?? null
  mapVendorMode.value = item.suggested_vendor_ap ? 'existing' : 'new'
  showMapVendor.value = true
  ensureVendorLoaded()
}

async function doMapVendor() {
  if (!canSubmitMapVendor.value) return
  mappingVendor.value = true
  try {
    if (mapVendorMode.value === 'existing') {
      await api.post(`/ap/shz360/imports/${selectedItem.value.id}/map-vendor`, { ...existingVendorForm })
      await showSuccess('Vendor berhasil dipetakan.')
    } else {
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
