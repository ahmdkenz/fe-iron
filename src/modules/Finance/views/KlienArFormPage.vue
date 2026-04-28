<template>
  <div>
    <PageHeader
      :title="isEditing ? 'Edit Klien AR' : 'Tambah Klien AR'"
      subtitle="Kelola data klien Account Receivable"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Klien AR', to: { name: 'finance-klien-ar' } },
        { title: isEditing ? 'Edit Klien AR' : 'Tambah Klien AR', disabled: true },
      ]"
    >
      <VBtn
        variant="tonal"
        color="secondary"
        :to="{ name: 'finance-klien-ar' }"
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
      class="d-flex justify-center align-center py-12"
    >
      <VProgressCircular
        indeterminate
        color="primary"
      />
    </div>

    <VForm
      v-else
      ref="formRef"
      @submit.prevent
    >
      <VCard class="mb-4">
        <VCardTitle class="pa-4 pb-2">
          <VIcon
            icon="ri-building-line"
            class="me-2"
          />
          Identitas Klien
        </VCardTitle>
        <VDivider />
        <VCardText>
          <VRow>
            <VCol
              cols="12"
              md="4"
            >
              <VTextField
                v-model="form.kode_klien"
                label="Kode Klien"
                density="compact"
                variant="outlined"
                :rules="[v => !!v || 'Kode klien otomatis belum siap']"
                :error-messages="errors.kode_klien"
                readonly
                persistent-hint
                :loading="kodePreviewLoading"
                :hint="isEditing ? 'Kode klien existing dipertahankan' : 'Otomatis terisi berdasarkan tipe klien'"
              />
            </VCol>
            <VCol
              cols="12"
              md="8"
            >
              <VTextField
                v-model="form.nama_klien"
                label="Nama Klien"
                density="compact"
                variant="outlined"
                :rules="[v => !!v || 'Nama klien wajib diisi']"
                :error-messages="errors.nama_klien"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="form.alias"
                label="Alias"
                density="compact"
                variant="outlined"
                :error-messages="errors.alias"
              />
            </VCol>
            <VCol
              cols="12"
              md="3"
            >
              <VSelect
                v-model="form.tipe_klien"
                label="Tipe Klien"
                density="compact"
                variant="outlined"
                :items="tipeKlienOptions"
                item-title="label"
                item-value="value"
                :rules="[v => !!v || 'Tipe klien wajib dipilih']"
                :error-messages="errors.tipe_klien"
              />
            </VCol>

            <VCol
              cols="12"
              md="3"
            >
              <VSelect
                v-model="form.kategori_ar"
                label="Kategori AR"
                density="compact"
                variant="outlined"
                :items="kategoriArOptions"
                item-title="label"
                item-value="value"
                :rules="[v => !!v || 'Kategori AR wajib dipilih']"
                :error-messages="errors.kategori_ar"
              />
            </VCol>
          </VRow>
        </VCardText>
      </VCard>

      <VCard class="mb-4">
        <VCardTitle class="pa-4 pb-2">
          <VIcon
            icon="ri-file-list-3-line"
            class="me-2"
          />
          Klasifikasi &amp; Administrasi
        </VCardTitle>
        <VDivider />
        <VCardText>
          <VRow>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="form.tipe_outlet"
                label="Tipe Outlet"
                density="compact"
                variant="outlined"
                :error-messages="errors.tipe_outlet"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="form.stokis_area"
                label="Area Stokis"
                density="compact"
                variant="outlined"
                :error-messages="errors.stokis_area"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="form.no_npwp"
                label="No. NPWP"
                density="compact"
                variant="outlined"
                :error-messages="errors.no_npwp"
              />
            </VCol>
            <VCol
              cols="12"
              md="3"
            >
              <VTextField
                v-model="form.kat_1"
                label="Kategori 1"
                density="compact"
                variant="outlined"
                :error-messages="errors.kat_1"
              />
            </VCol>
            <VCol
              cols="12"
              md="3"
            >
              <VTextField
                v-model="form.kat_2"
                label="Kategori 2"
                density="compact"
                variant="outlined"
                :error-messages="errors.kat_2"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
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
          </VRow>
        </VCardText>
      </VCard>

      <VCard class="mb-4">
        <VCardTitle class="pa-4 pb-2">
          <VIcon
            icon="ri-links-line"
            class="me-2"
          />
          Relasi Internal
        </VCardTitle>
        <VDivider />
        <VCardText>
          <VRow>
            <VCol
              cols="12"
              md="6"
            >
              <VAutocomplete
                v-model="form.perusahaan_id"
                label="Perusahaan (Penagih)"
                density="compact"
                variant="outlined"
                :items="perusahaanList"
                item-title="nama_perusahaan"
                item-value="id"
                :rules="[v => !!v || 'Perusahaan wajib dipilih']"
                :error-messages="errors.perusahaan_id"
                :loading="perusahaanLoading"
                clearable
                @focus="ensurePerusahaanLoaded()"
                @update:model-value="onPerusahaanChange"
              >
                <template #item="{ props: p, item }">
                  <VListItem
                    v-bind="p"
                    :title="item.raw.nama_perusahaan"
                    :subtitle="item.raw.kode_perusahaan"
                  />
                </template>
              </VAutocomplete>
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VAutocomplete
                v-model="form.karyawan_ar_id"
                label="Staff AR"
                density="compact"
                variant="outlined"
                :items="karyawanList"
                item-title="nama_karyawan"
                item-value="id"
                :rules="[v => !!v || 'Staff AR wajib dipilih']"
                :error-messages="errors.karyawan_ar_id"
                :loading="karyawanLoading"
                clearable
                @focus="ensureKaryawanLoaded()"
              >
                <template #item="{ props: p, item }">
                  <VListItem
                    v-bind="p"
                    :title="item.raw.nama_karyawan"
                    :subtitle="item.raw.nik"
                  />
                </template>
              </VAutocomplete>
            </VCol>
            <VCol
              v-if="form.tipe_klien === 'RESTO'"
              cols="12"
            >
              <VAutocomplete
                v-model="form.resto_id"
                label="Resto (Opsional)"
                density="compact"
                variant="outlined"
                :items="restoList"
                item-title="nama_resto"
                item-value="id"
                :error-messages="errors.resto_id"
                :loading="restoLoading"
                clearable
                @focus="ensureRestoLoaded()"
              >
                <template #item="{ props: p, item }">
                  <VListItem
                    v-bind="p"
                    :title="item.raw.nama_resto"
                    :subtitle="item.raw.kode_resto"
                  />
                </template>
              </VAutocomplete>
            </VCol>
          </VRow>
        </VCardText>
      </VCard>

      <VAlert
        v-if="errorMessage"
        type="error"
        variant="tonal"
        class="mb-4"
      >
        {{ errorMessage }}
      </VAlert>

      <div class="d-flex justify-end gap-3">
        <VBtn
          variant="tonal"
          color="secondary"
          :to="{ name: 'finance-klien-ar' }"
        >
          Batal
        </VBtn>
        <VBtn
          color="primary"
          :disabled="saving"
          @click="handleSubmit"
        >
          <VIcon
            icon="ri-save-line"
            class="me-1"
          />
          Simpan
        </VBtn>
      </div>
    </VForm>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCrud } from '@/composables/useCrud.js'
import { useLazyFetchAll } from '@/composables/useLazyFetchAll.js'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { setFlashAlert } from '@/utils/flashAlert'
import api from '@/utils/axios.js'
import { BOOLEAN_STATUS_OPTIONS, normalizeBooleanStatus } from '@/utils/status.js'

const route = useRoute()
const router = useRouter()
const { showError } = useSweetAlert()
const id = route.params.id
const isEditing = computed(() => !!id)

const { create, update, saving, fetchOne } = useCrud('/finance/klien-ar')
const { items: perusahaanList, loading: perusahaanLoading, fetchAll: fetchPerusahaan } = useCrud('/master/perusahaan')
const { items: karyawanList, loading: karyawanLoading, fetchAll: fetchKaryawan } = useCrud('/master/karyawan')
const { items: restoList, loading: restoLoading, fetchAll: fetchResto } = useCrud('/master/resto')
const { ensureLoaded: ensurePerusahaanLoaded } = useLazyFetchAll(fetchPerusahaan)
const { ensureLoaded: ensureKaryawanLoaded } = useLazyFetchAll(fetchKaryawan)
const { ensureLoaded: ensureRestoLoaded } = useLazyFetchAll(fetchResto)

const formRef = ref(null)
const pageLoading = ref(!!id)
const errorMessage = ref('')
const kodePreviewLoading = ref(false)

const tipeKlienOptions = [
  { label: 'PT', value: 'PT' },
  { label: 'Resto', value: 'RESTO' },
  { label: 'Stokis', value: 'STOKIS' },
  { label: 'Mitra', value: 'MITRA' },
]

const kategoriArOptions = [
  { label: 'Internal', value: 'INTERNAL' },
  { label: 'Eksternal', value: 'EKSTERNAL' },
]

const statusOptions = BOOLEAN_STATUS_OPTIONS

const errors = reactive({
  kode_klien: [],
  nama_klien: [],
  alias: [],
  tipe_klien: [],
  kategori_ar: [],
  tipe_outlet: [],
  stokis_area: [],
  no_npwp: [],
  kat_1: [],
  kat_2: [],
  perusahaan_id: [],
  karyawan_ar_id: [],
  resto_id: [],
})

const defaultForm = () => ({
  kode_klien: '',
  nama_klien: '',
  alias: '',
  tipe_klien: 'PT',
  kategori_ar: 'INTERNAL',
  tipe_outlet: '',
  stokis_area: '',
  no_npwp: '',
  kat_1: '',
  kat_2: '',
  perusahaan_id: null,
  karyawan_ar_id: null,
  resto_id: null,
  status: 1,
})

const form = reactive(defaultForm())

function resetErrors() {
  Object.keys(errors).forEach(key => {
    errors[key] = []
  })
}

function onPerusahaanChange() {
  form.karyawan_ar_id = null
}

async function refreshKodeKlienPreview() {
  if (isEditing.value || !form.tipe_klien) return

  kodePreviewLoading.value = true
  try {
    const { data } = await api.get('/finance/klien-ar/preview-kode', {
      params: { tipe_klien: form.tipe_klien },
    })

    form.kode_klien = data.data?.kode_klien ?? ''
  } catch {
    form.kode_klien = ''
  } finally {
    kodePreviewLoading.value = false
  }
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
      text: isEditing.value ? 'Perubahan klien AR berhasil disimpan.' : 'Klien AR berhasil ditambahkan.',
    })
    router.push({ name: 'finance-klien-ar' })
  } else if (res.errors) {
    Object.entries(res.errors).forEach(([key, value]) => {
      if (key in errors)
        errors[key] = value
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

  if (!isEditing.value) {
    await refreshKodeKlienPreview()
    pageLoading.value = false
    
    return
  }

  await Promise.all([
    ensurePerusahaanLoaded(),
    ensureKaryawanLoaded(),
    ensureRestoLoaded(),
  ])

  const data = await fetchOne(id)

  if (data) {
    Object.assign(form, {
      kode_klien: data.kode_klien ?? '',
      nama_klien: data.nama_klien ?? '',
      alias: data.alias ?? '',
      tipe_klien: data.tipe_klien ?? 'PT',
      kategori_ar: data.kategori_ar ?? 'INTERNAL',
      tipe_outlet: data.tipe_outlet ?? '',
      stokis_area: data.stokis_area ?? '',
      no_npwp: data.no_npwp ?? '',
      kat_1: data.kat_1 ?? '',
      kat_2: data.kat_2 ?? '',
      perusahaan_id: data.perusahaan_id ?? null,
      karyawan_ar_id: data.karyawan_ar_id ?? null,
      resto_id: data.resto_id ?? null,
      status: normalizeBooleanStatus(data.status),
    })
  }

  pageLoading.value = false
})

watch(() => form.tipe_klien, async tipeKlien => {
  if (tipeKlien !== 'RESTO')
    form.resto_id = null

  if (tipeKlien === 'MITRA')
    form.kategori_ar = 'EKSTERNAL'

  await refreshKodeKlienPreview()
})
</script>
