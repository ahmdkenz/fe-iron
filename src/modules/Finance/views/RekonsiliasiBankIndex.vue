<template>
  <div>
    <PageHeader
      title="Rekonsiliasi Bank"
      subtitle="Upload rekening koran bank dan cocokkan dengan data pembayaran"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Rekonsiliasi Bank', disabled: true },
      ]"
    />

    <!-- Tombol Upload -->
    <VCard class="mb-4">
      <VCardText class="d-flex align-center gap-3">
        <VBtn color="primary" prepend-icon="ri-upload-cloud-2-line" @click="dialog = true">
          Upload Rekening Koran Bank
        </VBtn>
        <span class="text-caption text-medium-emphasis">
          Dukung format file: BCA (.csv), Mandiri / BNI / BRI (.xlsx)
        </span>
      </VCardText>
    </VCard>

    <!-- Tabel History Upload -->
    <VCard>
      <VProgressLinear v-if="loading" indeterminate color="primary" />
      <BaseTable
        :headers="headers"
        :items="items"
        :total="total"
        :loading="loading"
        :per-page="perPage"
        :page="page"
        @update:options="onTableOptions"
      >
        <template #item.bank_type="{ item }">
          <VChip :color="bankColor(item.bank_type)" size="small" variant="tonal" label>
            {{ item.bank_type }}
          </VChip>
        </template>
        <template #item.periode="{ item }">
          {{ item.periode_awal }} — {{ item.periode_akhir }}
        </template>
        <template #item.total_kredit="{ item }">
          {{ formatCurrency(item.total_kredit) }}
        </template>
        <template #item.status="{ item }">
          <div class="d-flex gap-1 flex-wrap">
            <VChip color="success" size="x-small" variant="tonal">
              {{ item.jumlah_matched }} MATCHED
            </VChip>
            <VChip color="error" size="x-small" variant="tonal">
              {{ item.jumlah_unmatched }} UNMATCHED
            </VChip>
            <VChip color="grey" size="x-small" variant="tonal">
              {{ item.total_transaksi - item.jumlah_matched - item.jumlah_unmatched }} lainnya
            </VChip>
          </div>
        </template>
        <template #item.aksi="{ item }">
          <div class="d-flex gap-2">
            <VBtn
              size="x-small"
              variant="tonal"
              color="primary"
              icon="ri-eye-line"
              :to="{ name: 'finance-rekonsiliasi-bank-show', params: { id: item.id } }"
            />
            <VBtn
              size="x-small"
              variant="tonal"
              color="error"
              icon="ri-delete-bin-line"
              @click="confirmDelete(item)"
            />
          </div>
        </template>
      </BaseTable>
    </VCard>

    <!-- Dialog Upload -->
    <VDialog v-model="dialog" max-width="480" persistent>
      <VCard>
        <VCardTitle class="d-flex align-center justify-space-between pa-4">
          <span>Upload Rekening Koran Bank</span>
          <VBtn icon="ri-close-line" variant="text" size="small" @click="closeDialog" />
        </VCardTitle>
        <VDivider />
        <VCardText class="pt-4 d-flex flex-column gap-4">
          <VSelect
            v-model="form.bank_type"
            label="Pilih Bank"
            :items="bankOptions"
            item-title="label"
            item-value="value"
            hide-details="auto"
            :rules="[v => !!v || 'Bank wajib dipilih']"
          />

          <!-- Dropzone -->
          <div
            class="dropzone"
            :class="{ 'dropzone--active': isDragging }"
            @dragover.prevent="isDragging = true"
            @dragleave="isDragging = false"
            @drop.prevent="onDrop"
            @click="$refs.fileInput.click()"
          >
            <VIcon icon="ri-file-upload-line" size="40" class="mb-2 text-primary" />
            <div v-if="form.file" class="text-body-2 font-weight-medium text-primary">
              {{ form.file.name }}
            </div>
            <div v-else class="text-body-2 text-medium-emphasis text-center">
              <div>Klik atau drag & drop file di sini</div>
              <div class="text-caption mt-1">BCA: .csv &nbsp;|&nbsp; Mandiri/BNI/BRI: .xlsx atau .xls</div>
            </div>
            <input
              ref="fileInput"
              type="file"
              accept=".csv,.xlsx,.xls"
              style="display:none"
              @change="onFileChange"
            />
          </div>

          <VAlert v-if="uploadError" type="error" density="compact" variant="tonal">
            {{ uploadError }}
          </VAlert>
        </VCardText>
        <VCardActions class="pa-4 pt-0 justify-end gap-2">
          <VBtn variant="text" @click="closeDialog">Batal</VBtn>
          <VBtn
            color="primary"
            :loading="uploading"
            :disabled="!form.bank_type || !form.file"
            @click="doUpload"
          >
            Upload & Proses
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Dialog Konfirmasi Hapus -->
    <VDialog v-model="deleteDialog" max-width="380">
      <VCard>
        <VCardTitle class="pa-4">Hapus Data Upload?</VCardTitle>
        <VCardText>
          Semua data transaksi dari file <strong>{{ deleteTarget?.nama_file }}</strong> akan dihapus permanen.
        </VCardText>
        <VCardActions class="justify-end pa-4 gap-2">
          <VBtn variant="text" @click="deleteDialog = false">Batal</VBtn>
          <VBtn color="error" :loading="deleting" @click="doDelete">Hapus</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useFormatter } from '@/composables/useFormatter'
import api from '@/utils/axios'

const { formatCurrency } = useFormatter()

const loading  = ref(false)
const items    = ref([])
const total    = ref(0)
const page     = ref(1)
const perPage  = ref(15)

const dialog      = ref(false)
const uploading   = ref(false)
const uploadError = ref('')
const isDragging  = ref(false)
const fileInput   = ref(null)

const form = reactive({ bank_type: null, file: null })

const deleteDialog = ref(false)
const deleteTarget = ref(null)
const deleting     = ref(false)

const bankOptions = [
  { label: 'BCA', value: 'BCA' },
  { label: 'Bank Mandiri', value: 'MANDIRI' },
  { label: 'BNI', value: 'BNI' },
  { label: 'BRI', value: 'BRI' },
]

const bankColor = (type) => ({ BCA: 'info', MANDIRI: 'warning', BNI: 'error', BRI: 'primary' }[type] ?? 'secondary')

const headers = [
  { title: 'No',           key: 'no',          sortable: false, width: '50px' },
  { title: 'Tanggal Upload', key: 'created_at', sortable: false },
  { title: 'Bank',         key: 'bank_type',   sortable: false, width: '100px' },
  { title: 'Nama File',    key: 'nama_file',   sortable: false },
  { title: 'Periode',      key: 'periode',     sortable: false },
  { title: 'Total Kredit', key: 'total_kredit',sortable: false, align: 'end' },
  { title: 'Status Cocok', key: 'status',      sortable: false },
  { title: 'Aksi',         key: 'aksi',        sortable: false, width: '90px' },
]

function onTableOptions({ page: p, itemsPerPage }) {
  page.value    = p
  perPage.value = itemsPerPage
  fetchList()
}

async function fetchList() {
  loading.value = true
  try {
    const { data } = await api.get('/finance/rekonsiliasi-bank', {
      params: { page: page.value, per_page: perPage.value },
    })
    items.value = data.data?.data ?? []
    total.value = data.data?.total ?? 0
  } finally {
    loading.value = false
  }
}

function onFileChange(e) {
  form.file = e.target.files[0] ?? null
}

function onDrop(e) {
  isDragging.value = false
  form.file = e.dataTransfer.files[0] ?? null
}

function closeDialog() {
  dialog.value     = false
  form.bank_type   = null
  form.file        = null
  uploadError.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

async function doUpload() {
  uploadError.value = ''
  uploading.value   = true
  try {
    const fd = new FormData()
    fd.append('bank_type', form.bank_type)
    fd.append('file', form.file)
    await api.post('/finance/rekonsiliasi-bank/upload', fd)
    closeDialog()
    fetchList()
  } catch (err) {
    uploadError.value = err?.response?.data?.message ?? 'Upload gagal. Pastikan format file sesuai.'
  } finally {
    uploading.value = false
  }
}

function confirmDelete(item) {
  deleteTarget.value = item
  deleteDialog.value = true
}

async function doDelete() {
  deleting.value = true
  try {
    await api.delete(`/finance/rekonsiliasi-bank/${deleteTarget.value.id}`)
    deleteDialog.value = false
    fetchList()
  } finally {
    deleting.value = false
  }
}

onMounted(fetchList)
</script>

<style scoped>
.dropzone {
  border: 2px dashed rgba(var(--v-theme-primary), 0.4);
  border-radius: 8px;
  padding: 28px 16px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: border-color 0.2s, background 0.2s;
}
.dropzone:hover,
.dropzone--active {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.05);
}
</style>
