<template>
  <div>
    <PageHeader 
      :title="isEditing ? 'Edit Resto' : 'Tambah Resto'" 
      subtitle="Kelola data restoran"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Resto', to: { name: 'master-resto' } },
        { title: isEditing ? 'Edit Resto' : 'Tambah Resto', disabled: true }
      ]"
    >
      <VBtn
        variant="tonal"
        color="secondary"
        :to="{ name: 'master-resto' }"
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
      <!-- Identitas -->
      <VCard class="mb-4">
        <VCardTitle class="pa-4 pb-2">
          <VIcon
            icon="ri-store-3-line"
            class="me-2"
          />
          Identitas Resto
        </VCardTitle>
        <VDivider />
        <VCardText>
          <VRow>
            <VCol
              cols="12"
              md="4"
            >
              <VTextField
                :model-value="isEditing ? kodeResto : kodePreview"
                label="Kode Resto"
                density="compact"
                variant="outlined"
                readonly
                :hint="isEditing ? 'Kode tidak dapat diubah' : 'Otomatis terisi setelah Perusahaan & Brand dipilih'"
                persistent-hint
                :loading="previewLoading"
              />
            </VCol>
            <VCol
              cols="12"
              md="8"
            >
              <VTextField
                v-model="form.nama_resto"
                label="Nama Resto"
                density="compact"
                variant="outlined"
                :rules="[v => !!v || 'Nama resto wajib diisi']"
                :error-messages="errors.nama_resto"
              />
            </VCol>
          </VRow>
        </VCardText>
      </VCard>

      <!-- Relasi -->
      <VCard class="mb-4">
        <VCardTitle class="pa-4 pb-2">
          <VIcon
            icon="ri-links-line"
            class="me-2"
          />
          Relasi
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
                label="Perusahaan"
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
                v-model="form.brand_id"
                label="Brand"
                density="compact"
                variant="outlined"
                :items="brandList"
                item-title="nama_brand"
                item-value="id"
                :rules="[v => !!v || 'Brand wajib dipilih']"
                :error-messages="errors.brand_id"
                :loading="brandLoading"
                clearable
                :disabled="!form.perusahaan_id && !isEditing"
                @update:model-value="onBrandChange"
              >
                <template #item="{ props: p, item }">
                  <VListItem
                    v-bind="p"
                    :title="item.raw.nama_brand"
                    :subtitle="item.raw.kode_brand"
                  />
                </template>
              </VAutocomplete>
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VAutocomplete
                v-model="form.investor_id"
                label="Investor"
                density="compact"
                variant="outlined"
                :items="investorList"
                item-title="nama_investor"
                item-value="id"
                :error-messages="errors.investor_id"
                :loading="investorLoading"
                clearable
                @focus="ensureInvestorLoaded()"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VAutocomplete
                v-model="form.karyawan_id"
                label="PIC"
                density="compact"
                variant="outlined"
                :items="karyawanList"
                item-title="nama_karyawan"
                item-value="id"
                :error-messages="errors.karyawan_id"
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
          </VRow>
        </VCardText>
      </VCard>

      <!-- Lokasi & Kontak -->
      <VCard class="mb-4">
        <VCardTitle class="pa-4 pb-2">
          <VIcon
            icon="ri-map-pin-2-line"
            class="me-2"
          />
          Lokasi &amp; Kontak
        </VCardTitle>
        <VDivider />
        <VCardText>
          <VRow>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="form.area"
                label="Area"
                density="compact"
                variant="outlined"
                :error-messages="errors.area"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="form.kota"
                label="Kota"
                density="compact"
                variant="outlined"
                :error-messages="errors.kota"
              />
            </VCol>
            <VCol cols="12">
              <VTextField
                v-model="form.alamat"
                label="Alamat"
                density="compact"
                variant="outlined"
                :error-messages="errors.alamat"
              />
            </VCol>
            <VCol
              cols="12"
              md="4"
            >
              <VTextField
                v-model="form.no_telp"
                label="No. Telp"
                density="compact"
                variant="outlined"
                :error-messages="errors.no_telp"
              />
            </VCol>
            <VCol
              cols="12"
              md="4"
            >
              <VTextField
                v-model="form.tgl_aktif"
                label="Tanggal Aktif"
                density="compact"
                variant="outlined"
                type="date"
                :error-messages="errors.tgl_aktif"
              />
            </VCol>
            <VCol
              cols="12"
              md="4"
            >
              <BaseSelect
                v-model="form.status"
                label="Status"
                :items="statusOptions"
                item-title="label"
                item-value="value"
              />
            </VCol>
            <VCol cols="12">
              <VTextField
                v-model="form.keterangan"
                label="Keterangan"
                density="compact"
                variant="outlined"
                :error-messages="errors.keterangan"
              />
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
          :to="{ name: 'master-resto' }"
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCrud } from '@/composables/useCrud'
import { useLazyFetchAll } from '@/composables/useLazyFetchAll'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { setFlashAlert } from '@/utils/flashAlert'
import api from '@/utils/axios'
import { BOOLEAN_STATUS_OPTIONS, normalizeBooleanStatus } from '@/utils/status'

const route = useRoute()
const router = useRouter()
const { showError } = useSweetAlert()
const id = route.params.id
const isEditing = computed(() => !!id)

const { create, update, saving, fetchOne } = useCrud('/master/resto')
const { items: perusahaanList, loading: perusahaanLoading, fetchAll: fetchPerusahaan } = useCrud('/master/perusahaan')
const { items: investorList,   loading: investorLoading,   fetchAll: fetchInvestor   } = useCrud('/master/investor')
const { items: karyawanList,   loading: karyawanLoading,   fetchAll: fetchKaryawan   } = useCrud('/master/karyawan')
const { ensureLoaded: ensurePerusahaanLoaded } = useLazyFetchAll(fetchPerusahaan)
const { ensureLoaded: ensureInvestorLoaded } = useLazyFetchAll(fetchInvestor)
const { ensureLoaded: ensureKaryawanLoaded } = useLazyFetchAll(fetchKaryawan)

const brandList      = ref([])
const brandLoading   = ref(false)
const kodePreview    = ref('')
const kodeResto      = ref('')
const previewLoading = ref(false)

const formRef = ref(null)
const pageLoading = ref(!!id)
const errorMessage = ref('')

const errors = reactive({
  nama_resto: [], perusahaan_id: [], brand_id: [], investor_id: [],
  karyawan_id: [], area: [], kota: [], alamat: [], no_telp: [], tgl_aktif: [], keterangan: [],
})

const statusOptions = BOOLEAN_STATUS_OPTIONS

const form = reactive({
  nama_resto: '', perusahaan_id: null, brand_id: null, investor_id: null,
  karyawan_id: null, area: '', kota: '', alamat: '', no_telp: '', tgl_aktif: '', keterangan: '', status: 1,
})

async function fetchBrandsByPerusahaan(perusahaanId) {
  if (!perusahaanId) { brandList.value = [] 

    return }
  brandLoading.value = true
  try {
    const res = await api.get('/master/brand', { params: { all: true, perusahaan_id: perusahaanId } })

    brandList.value = res.data?.data ?? []
  } finally {
    brandLoading.value = false
  }
}

async function refreshKodePreview() {
  if (!form.perusahaan_id || !form.brand_id || isEditing.value) return
  previewLoading.value = true
  try {
    const res = await api.get('/master/resto/preview-kode', {
      params: { perusahaan_id: form.perusahaan_id, brand_id: form.brand_id },
    })

    kodePreview.value = res.data?.data?.kode ?? ''
  } catch {
    kodePreview.value = ''
  } finally {
    previewLoading.value = false
  }
}

function onPerusahaanChange(val) {
  form.brand_id = null
  kodePreview.value = ''
  fetchBrandsByPerusahaan(val)
}

function onBrandChange() {
  refreshKodePreview()
}

async function handleSubmit() {
  errorMessage.value = ''
  Object.keys(errors).forEach(k => (errors[k] = []))

  const { valid } = await formRef.value.validate()
  if (!valid) return
  const res = isEditing.value ? await update(id, { ...form }) : await create({ ...form })
  if (res.success) {
    setFlashAlert({
      icon: 'success',
      title: 'Berhasil',
      text: isEditing.value ? 'Perubahan resto berhasil disimpan.' : 'Resto berhasil ditambahkan.',
    })
    router.push({ name: 'master-resto' })
  } else {
    if (res.errors) Object.entries(res.errors).forEach(([k, v]) => { if (k in errors) errors[k] = v })
    else {
      errorMessage.value = res.message ?? 'Gagal menyimpan data'
      await showError(errorMessage.value)
    }
  }
}

onMounted(async () => {
  if (!isEditing.value) {
    pageLoading.value = false 

    return
  }

  await Promise.all([
    ensurePerusahaanLoaded(),
    ensureInvestorLoaded(),
    ensureKaryawanLoaded(),
  ])

  const data = await fetchOne(id)
  if (data) {
    kodeResto.value = data.kode_resto ?? ''
    Object.assign(form, {
      nama_resto: data.nama_resto    ?? '',
      perusahaan_id: data.perusahaan_id ?? null,
      brand_id: data.brand_id      ?? null,
      investor_id: data.investor_id   ?? null,
      karyawan_id: data.karyawan_id   ?? null,
      area: data.area          ?? '',
      kota: data.kota          ?? '',
      alamat: data.alamat        ?? '',
      no_telp: data.no_telp       ?? '',
      tgl_aktif: data.tgl_aktif     ?? '',
      keterangan: data.keterangan    ?? '',
      status: normalizeBooleanStatus(data.status),
    })
    if (form.perusahaan_id) await fetchBrandsByPerusahaan(form.perusahaan_id)
  }
  pageLoading.value = false
})
</script>
