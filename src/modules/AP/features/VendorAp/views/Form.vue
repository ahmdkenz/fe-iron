<template>
  <div>
    <PageHeader
      :title="isEditing ? 'Edit Vendor' : 'Tambah Vendor'"
      subtitle="Kelola data vendor/pemasok Account Payable"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Vendor', to: { name: 'ap-vendor-index' } },
        { title: isEditing ? 'Edit Vendor' : 'Tambah Vendor', disabled: true },
      ]"
    >
      <VBtn variant="tonal" color="secondary" :to="{ name: 'ap-vendor-index' }">
        <VIcon icon="ri-arrow-left-line" class="me-1" />
        Kembali
      </VBtn>
    </PageHeader>

    <div v-if="pageLoading" class="d-flex justify-center align-center py-12">
      <VProgressCircular indeterminate color="primary" />
    </div>

    <VForm v-else ref="formRef" @submit.prevent>
      <VCard class="mb-4">
        <VCardTitle class="pa-4 pb-2 d-flex align-center gap-2">
          <VIcon icon="ri-store-2-line" size="18" color="primary" />
          <span>Data Vendor</span>
        </VCardTitle>
        <VDivider />
        <VCardText class="pt-4">
          <VRow>
            <VCol cols="12" md="3">
              <VTextField
                :model-value="form.kode_vendor || 'Digenerate otomatis'"
                label="Kode Vendor"
                density="compact"
                variant="outlined"
                readonly
              />
            </VCol>
            <VCol cols="12" md="9">
              <VTextField
                v-model="form.nama_vendor"
                label="Nama Vendor"
                density="compact"
                variant="outlined"
                :rules="[v => !!v || 'Nama vendor wajib diisi']"
                :error-messages="errors.nama_vendor"
              />
            </VCol>

            <VCol cols="12" md="6">
              <VTextField
                v-model="form.no_npwp"
                label="No. NPWP"
                density="compact"
                variant="outlined"
                :error-messages="errors.no_npwp"
              />
            </VCol>
            <VCol cols="12" md="3">
              <VSwitch
                v-model="form.status_pkp"
                label="Status PKP"
                density="compact"
                color="primary"
                hide-details
              />
            </VCol>
            <VCol cols="12" md="3">
              <VSelect
                v-model="form.status"
                label="Status"
                density="compact"
                variant="outlined"
                :items="statusOptions"
                item-title="label"
                item-value="value"
              />
            </VCol>

            <VCol cols="12" md="6">
              <VTextField
                v-model="form.kategori"
                label="Kategori"
                density="compact"
                variant="outlined"
                placeholder="Bahan Baku, Jasa, ATK, dll."
                :error-messages="errors.kategori"
              />
            </VCol>
            <VCol cols="12" md="6">
              <VTextField
                v-model.number="form.termin_hari"
                label="Termin (hari)"
                type="number"
                density="compact"
                variant="outlined"
                :error-messages="errors.termin_hari"
              />
            </VCol>
          </VRow>
        </VCardText>
      </VCard>

      <VCard class="mb-4">
        <VCardTitle class="pa-4 pb-2 d-flex align-center gap-2">
          <VIcon icon="ri-bank-line" size="18" color="primary" />
          <span>Info Rekening Bank</span>
          <VChip size="x-small" color="secondary" variant="tonal">Opsional</VChip>
        </VCardTitle>
        <VDivider />
        <VCardText class="pt-4">
          <VRow>
            <VCol cols="12" md="4">
              <VTextField
                v-model="form.bank_nama"
                label="Nama Bank"
                density="compact"
                variant="outlined"
              />
            </VCol>
            <VCol cols="12" md="4">
              <VTextField
                v-model="form.bank_no_rekening"
                label="No. Rekening"
                density="compact"
                variant="outlined"
              />
            </VCol>
            <VCol cols="12" md="4">
              <VTextField
                v-model="form.bank_atas_nama"
                label="Atas Nama"
                density="compact"
                variant="outlined"
              />
            </VCol>
          </VRow>
        </VCardText>
      </VCard>

      <VCard class="mb-4">
        <VCardTitle class="pa-4 pb-2 d-flex align-center gap-2">
          <VIcon icon="ri-links-line" size="18" color="primary" />
          <span>Relasi Internal</span>
        </VCardTitle>
        <VDivider />
        <VCardText class="pt-4">
          <VRow>
            <VCol cols="12" md="6">
              <VAutocomplete
                v-model="form.perusahaan_id"
                label="Entitas Perusahaan"
                density="compact"
                variant="outlined"
                prepend-inner-icon="ri-building-2-line"
                :items="perusahaanList"
                item-title="nama_perusahaan"
                item-value="id"
                :loading="perusahaanLoading"
                :rules="[v => !!v || 'Entitas Perusahaan wajib dipilih']"
                :error-messages="errors.perusahaan_id"
                @focus="ensurePerusahaanLoaded()"
              >
                <template #item="{ props: p, item }">
                  <VListItem
                    v-bind="p"
                    :title="item.raw.nama_perusahaan"
                    :subtitle="item.raw.nama_singkatan_perusahaan ?? item.raw.kode_perusahaan"
                  />
                </template>
              </VAutocomplete>
            </VCol>
            <VCol cols="12" md="6">
              <VAutocomplete
                v-model="form.karyawan_ap_id"
                label="PIC AP (Staff Pengelola)"
                density="compact"
                variant="outlined"
                :items="karyawanList"
                item-title="nama_karyawan"
                item-value="id"
                :rules="[v => !!v || 'PIC AP wajib dipilih']"
                :error-messages="errors.karyawan_ap_id"
                :loading="karyawanLoading"
                @focus="ensureKaryawanLoaded()"
              >
                <template #item="{ props: p, item }">
                  <VListItem v-bind="p" :title="item.raw.nama_karyawan" :subtitle="item.raw.nik" />
                </template>
              </VAutocomplete>
            </VCol>
          </VRow>
        </VCardText>
      </VCard>

      <VAlert v-if="errorMessage" type="error" variant="tonal" class="mb-4">
        {{ errorMessage }}
      </VAlert>

      <div class="d-flex justify-end gap-3">
        <VBtn variant="tonal" color="secondary" :to="{ name: 'ap-vendor-index' }">
          Batal
        </VBtn>
        <VBtn color="primary" :disabled="saving" @click="handleSubmit">
          <VIcon icon="ri-save-line" class="me-1" />
          Simpan
        </VBtn>
      </div>
    </VForm>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCrud } from '@/composables/useCrud.js'
import { useLazyFetchAll } from '@/composables/useLazyFetchAll.js'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { setFlashAlert } from '@/utils/flashAlert'
import { BOOLEAN_STATUS_OPTIONS, normalizeBooleanStatus } from '@/utils/status.js'

const route = useRoute()
const router = useRouter()
const { showError } = useSweetAlert()
const id = route.params.id
const isEditing = computed(() => !!id)

const { create, update, saving, fetchOne } = useCrud('/ap/vendors')
const { items: karyawanList, loading: karyawanLoading, fetchAll: fetchKaryawan } = useCrud('/master/karyawan')
const { items: perusahaanList, loading: perusahaanLoading, fetchAll: fetchPerusahaan } = useCrud('/master/perusahaan')
const { ensureLoaded: ensureKaryawanLoaded } = useLazyFetchAll(fetchKaryawan)
const { ensureLoaded: ensurePerusahaanLoaded } = useLazyFetchAll(fetchPerusahaan)

const formRef = ref(null)
const pageLoading = ref(!!id)
const errorMessage = ref('')

const statusOptions = BOOLEAN_STATUS_OPTIONS

const errors = reactive({
  nama_vendor: [], no_npwp: [], kategori: [], termin_hari: [],
  perusahaan_id: [], karyawan_ap_id: [],
})

const defaultForm = () => ({
  kode_vendor: '',
  nama_vendor: '',
  no_npwp: '',
  status_pkp: false,
  kategori: '',
  termin_hari: null,
  bank_nama: '',
  bank_no_rekening: '',
  bank_atas_nama: '',
  perusahaan_id: null,
  karyawan_ap_id: null,
  status: 1,
})

const form = reactive(defaultForm())

function resetErrors() {
  Object.keys(errors).forEach(key => { errors[key] = [] })
}

async function handleSubmit() {
  errorMessage.value = ''
  resetErrors()

  const { valid } = await formRef.value.validate()
  if (!valid) return

  const payload = { ...form }
  const res = isEditing.value ? await update(id, payload) : await create(payload)

  if (res.success) {
    setFlashAlert({
      icon: 'success',
      title: 'Berhasil',
      text: isEditing.value ? 'Perubahan vendor berhasil disimpan.' : 'Vendor berhasil ditambahkan.',
    })
    router.push({ name: 'ap-vendor-index' })
  } else if (res.errors) {
    Object.entries(res.errors).forEach(([key, value]) => {
      if (key in errors) errors[key] = value
    })
    errorMessage.value = res.message ?? ''
  } else {
    errorMessage.value = res.message ?? 'Terjadi kesalahan'
    await showError(errorMessage.value)
  }
}

onMounted(async () => {
  resetErrors()
  errorMessage.value = ''

  await Promise.all([ensureKaryawanLoaded(), ensurePerusahaanLoaded()])

  if (!isEditing.value) {
    pageLoading.value = false
    return
  }

  const data = await fetchOne(id)
  if (data) {
    Object.assign(form, {
      kode_vendor: data.kode_vendor ?? '',
      nama_vendor: data.nama_vendor ?? '',
      no_npwp: data.no_npwp ?? '',
      status_pkp: !!data.status_pkp,
      kategori: data.kategori ?? '',
      termin_hari: data.termin_hari ?? null,
      bank_nama: data.bank_nama ?? '',
      bank_no_rekening: data.bank_no_rekening ?? '',
      bank_atas_nama: data.bank_atas_nama ?? '',
      perusahaan_id: data.perusahaan_id ?? null,
      karyawan_ap_id: data.karyawan_ap_id ?? null,
      status: normalizeBooleanStatus(data.status),
    })
  }

  pageLoading.value = false
})
</script>
