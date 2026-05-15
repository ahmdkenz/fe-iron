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
        color="info"
        @click="showPanduan = true"
      >
        <VIcon
          icon="ri-question-line"
          class="me-1"
        />
        Panduan
      </VBtn>
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
      <VAlert
        v-if="isArEditMode"
        type="info"
        variant="tonal"
        class="mb-4"
      >
        Sebagai AR, Anda hanya dapat mengubah <strong>No. WhatsApp</strong> klien.
      </VAlert>

      <!-- Card 1: Informasi Klien -->
      <VCard class="mb-4">
        <VCardTitle class="pa-4 pb-2">
          <VIcon
            icon="ri-building-line"
            class="me-2"
          />
          Informasi Klien
        </VCardTitle>
        <VDivider />
        <VCardText>
          <VRow>
            <VCol
              cols="12"
              md="3"
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
                :hint="isEditing ? 'Dipertahankan' : 'Otomatis terisi'"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="form.nama_klien"
                label="Nama Pengelola (Billing)"
                density="compact"
                variant="outlined"
                :rules="[v => !!v || 'Nama pengelola wajib diisi']"
                :error-messages="errors.nama_klien"
                :readonly="isArEditMode"
                :hint="isB2B ? 'Isi nama kontak keuangan/billing di PT' : (!isEditing && selectedRestoInvestor ? 'Otomatis dari data pengelola investor' : '')"
                persistent-hint
              />
            </VCol>
            <VCol
              cols="12"
              md="3"
            >
              <VSelect
                v-model="form.status"
                label="Status"
                density="compact"
                variant="outlined"
                :items="statusOptions"
                item-title="label"
                item-value="value"
                :readonly="isArEditMode"
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
                :readonly="isArEditMode || isEditing"
                :hint="isEditing ? 'Tidak dapat diubah setelah dibuat' : ''"
                persistent-hint
                @update:model-value="refreshKodeKlienPreview"
              />
            </VCol>
            <VCol
              cols="12"
              md="9"
            >
              <VTextField
                v-model="form.no_npwp"
                label="No. NPWP Pengelola"
                density="compact"
                variant="outlined"
                :error-messages="errors.no_npwp"
                :readonly="isArEditMode"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="form.no_wa"
                label="No. WhatsApp Pengelola"
                placeholder="Contoh: 08123456789"
                density="compact"
                variant="outlined"
                :error-messages="errors.no_wa"
                clearable
              />
            </VCol>
          </VRow>
        </VCardText>
      </VCard>

      <!-- Card 2: Relasi Internal -->
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
            <VCol cols="12">
              <VAutocomplete
                v-model="form.resto_id"
                :label="isB2B ? 'Resto (Opsional untuk B2B)' : 'Resto (Wajib)'"
                density="compact"
                variant="outlined"
                :items="filteredRestoList"
                item-title="nama_resto"
                item-value="id"
                clearable
                :rules="[v => isB2B || !!v || 'Resto wajib dipilih untuk tipe B2C']"
                :error-messages="errors.resto_id"
                :loading="restoLoading"
                :readonly="isArEditMode"
                :persistent-hint="isB2B"
                :hint="isB2B ? 'Untuk tipe PT/STOKIS, semua Resto di bawah PT ini ditagih ke klien AR ini.' : ''"
                @focus="ensureRestoLoaded()"
                @update:model-value="onRestoChange"
              >
                <template #item="{ props: p, item }">
                  <VListItem
                    v-bind="p"
                    :title="item.raw.nama_resto"
                    :subtitle="item.raw.kode_resto + (item.raw.investor ? ' · ' + item.raw.investor.nama_investor : '')"
                  />
                </template>
              </VAutocomplete>
            </VCol>

            <VCol
              v-if="selectedRestoInvestor"
              cols="12"
            >
              <VAlert
                type="info"
                variant="tonal"
                density="compact"
                class="mb-0"
              >
                <div class="text-caption font-weight-semibold mb-1">
                  Info Investor & Pengelola
                </div>
                <div class="text-caption">
                  <strong>Investor:</strong> {{ selectedRestoInvestor.nama_investor }}
                </div>
                <div
                  v-if="selectedRestoInvestor.pengelola"
                  class="text-caption"
                >
                  <strong>Pengelola:</strong> {{ selectedRestoInvestor.pengelola }}
                  <span v-if="selectedRestoInvestor.no_hp_pengelola"> · {{ selectedRestoInvestor.no_hp_pengelola }}</span>
                </div>
              </VAlert>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-if="isArRole"
                :model-value="displayKaryawan"
                label="PIC AR (Staff Penagihan)"
                density="compact"
                variant="outlined"
                :rules="[() => !!form.karyawan_ar_id || 'PIC AR wajib dipilih']"
                :error-messages="errors.karyawan_ar_id"
                :loading="isEditing && karyawanLoading"
                readonly
              />
              <VAutocomplete
                v-else
                v-model="form.karyawan_ar_id"
                label="PIC AR (Staff Penagihan)"
                density="compact"
                variant="outlined"
                :items="karyawanList"
                item-title="nama_karyawan"
                item-value="id"
                :rules="[v => !!v || 'PIC AR wajib dipilih']"
                :error-messages="errors.karyawan_ar_id"
                :loading="karyawanLoading"
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

    <!-- Dialog Panduan Pengisian -->
    <VDialog
      v-model="showPanduan"
      max-width="680"
      scrollable
    >
      <VCard>
        <VCardTitle class="pa-4 pb-2 d-flex align-center justify-space-between">
          <div class="d-flex align-center gap-2">
            <VIcon icon="ri-book-2-line" color="info" />
            <span>Panduan Pengisian Klien AR</span>
          </div>
          <VBtn icon size="small" variant="text" @click="showPanduan = false">
            <VIcon icon="ri-close-line" />
          </VBtn>
        </VCardTitle>
        <VDivider />

        <VCardText class="pa-0">
          <VTabs v-model="panduanTab" color="primary" class="px-4 pt-2">
            <VTab value="b2c">
              <VIcon icon="ri-store-line" class="me-1" size="18" />
              B2C (RESTO / MITRA)
            </VTab>
            <VTab value="b2b">
              <VIcon icon="ri-building-4-line" class="me-1" size="18" />
              B2B (PT / STOKIS)
            </VTab>
          </VTabs>
          <VDivider />

          <VTabsWindow v-model="panduanTab" class="pa-4">
            <!-- Tab B2C -->
            <VTabsWindowItem value="b2c">
              <VAlert type="success" variant="tonal" density="compact" class="mb-4">
                <strong>B2C</strong> — Penagihan ke pengelola outlet (Resto atau Mitra). Kode: <code>AR-B2C-xxx</code>
              </VAlert>

              <VTable density="compact" class="rounded border mb-4">
                <thead>
                  <tr>
                    <th style="width:35%">Field</th>
                    <th>Cara Mengisi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="font-weight-medium">Tipe Klien</td>
                    <td>Pilih <strong>RESTO</strong> (outlet langsung) atau <strong>MITRA</strong> (distributor/partner)</td>
                  </tr>
                  <tr>
                    <td class="font-weight-medium">Resto <span class="text-error">*</span></td>
                    <td>Pilih outlet yang terkait — info investor &amp; pengelola muncul otomatis</td>
                  </tr>
                  <tr>
                    <td class="font-weight-medium">Nama Pengelola (Billing)</td>
                    <td>Otomatis terisi dari nama Pengelola investor; ubah jika berbeda</td>
                  </tr>
                  <tr>
                    <td class="font-weight-medium">No. NPWP</td>
                    <td>NPWP pengelola (opsional)</td>
                  </tr>
                  <tr>
                    <td class="font-weight-medium">No. WhatsApp</td>
                    <td>Nomor aktif pengelola untuk notifikasi (format: 08xx atau 62xx)</td>
                  </tr>
                  <tr>
                    <td class="font-weight-medium">PIC AR</td>
                    <td>Staff AR yang bertanggung jawab menagih klien ini</td>
                  </tr>
                </tbody>
              </VTable>

              <VAlert type="info" variant="tonal" density="compact" icon="ri-information-line">
                Setiap B2C memiliki 1 Klien AR per pengelola/outlet. Invoice ditagih langsung ke pengelola resto tersebut.
              </VAlert>
            </VTabsWindowItem>

            <!-- Tab B2B -->
            <VTabsWindowItem value="b2b">
              <VAlert type="primary" variant="tonal" density="compact" class="mb-4">
                <strong>B2B</strong> — Penagihan langsung ke PT. Kode: <code>AR-B2B-xxx</code>
              </VAlert>

              <VTable density="compact" class="rounded border mb-4">
                <thead>
                  <tr>
                    <th style="width:35%">Field</th>
                    <th>Cara Mengisi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="font-weight-medium">Tipe Klien</td>
                    <td>Pilih <strong>PT</strong> (perusahaan) atau <strong>STOKIS</strong> (grosir/distributor besar)</td>
                  </tr>
                  <tr>
                    <td class="font-weight-medium">Resto</td>
                    <td><em>Opsional</em> — isi salah satu Resto milik PT ini sebagai referensi jika diperlukan</td>
                  </tr>
                  <tr>
                    <td class="font-weight-medium">Nama Pengelola (Billing)</td>
                    <td>Isi <strong>manual</strong> — nama kontak keuangan/billing di PT tersebut</td>
                  </tr>
                  <tr>
                    <td class="font-weight-medium">No. NPWP <span class="text-error">*</span></td>
                    <td>NPWP perusahaan PT — penting untuk penerbitan faktur pajak</td>
                  </tr>
                  <tr>
                    <td class="font-weight-medium">No. WhatsApp</td>
                    <td>Nomor WA kontak keuangan/billing di PT</td>
                  </tr>
                  <tr>
                    <td class="font-weight-medium">PIC AR</td>
                    <td>Staff AR yang bertanggung jawab menagih ke PT ini</td>
                  </tr>
                </tbody>
              </VTable>

              <VAlert type="warning" variant="tonal" density="compact" icon="ri-building-4-line">
                <strong>Pola B2B:</strong> 1 PT = 1 Klien AR. PT bisa punya beberapa Resto — masing-masing Resto menghasilkan invoice sendiri, tapi semua ditagih ke satu Klien AR PT ini.
              </VAlert>
            </VTabsWindowItem>
          </VTabsWindow>
        </VCardText>

        <VDivider />
        <VCardActions class="pa-3 justify-end">
          <VBtn color="primary" variant="tonal" @click="showPanduan = false">Mengerti</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCrud } from '@/composables/useCrud.js'
import { useLazyFetchAll } from '@/composables/useLazyFetchAll.js'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { setFlashAlert } from '@/utils/flashAlert'
import api from '@/utils/axios.js'
import { BOOLEAN_STATUS_OPTIONS, normalizeBooleanStatus } from '@/utils/status.js'
import { useAuthStore } from '@/stores/auth.store.js'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { showError } = useSweetAlert()
const id = route.params.id
const isEditing = computed(() => !!id)
const isArRole    = computed(() => authStore.isArOnly)
const isArEditMode = computed(() => isArRole.value && isEditing.value)
const isB2B        = computed(() => ['PT', 'STOKIS'].includes(form.tipe_klien))

const filteredRestoList = computed(() => {
  if (isArRole.value) {
    const myKaryawanId = authStore.user?.karyawan?.id
    if (!myKaryawanId) return restoList.value
    const assigned = restoList.value?.filter(r => r.karyawan_id === myKaryawanId) ?? []
    return assigned.length > 0 ? assigned : restoList.value
  }

  if (form.karyawan_ar_id) {
    const assigned = restoList.value?.filter(r => r.karyawan_id === form.karyawan_ar_id) ?? []
    return assigned.length > 0 ? assigned : restoList.value
  }

  return restoList.value
})

const { create, update, saving, fetchOne } = useCrud('/finance/klien-ar')
const { items: karyawanList, loading: karyawanLoading, fetchAll: fetchKaryawan } = useCrud('/master/karyawan')
const { items: restoList, loading: restoLoading, fetchAll: fetchResto } = useCrud('/master/resto')
const { ensureLoaded: ensureKaryawanLoaded } = useLazyFetchAll(fetchKaryawan)
const { ensureLoaded: ensureRestoLoaded } = useLazyFetchAll(fetchResto)

const formRef           = ref(null)
const pageLoading       = ref(!!id)
const errorMessage      = ref('')
const kodePreviewLoading = ref(false)
const showPanduan       = ref(false)
const panduanTab        = ref('b2c')

const selectedRestoInvestor = ref(null)

const statusOptions = BOOLEAN_STATUS_OPTIONS

const tipeKlienOptions = [
  { label: 'RESTO (B2C)',   value: 'RESTO'  },
  { label: 'MITRA (B2C)',   value: 'MITRA'  },
  { label: 'PT (B2B)',      value: 'PT'     },
  { label: 'STOKIS (B2B)', value: 'STOKIS' },
]

const displayKaryawan = computed(() => {
  if (isEditing.value)
    return karyawanList.value?.find(k => k.id === form.karyawan_ar_id)?.nama_karyawan ?? ''

  return authStore.user?.karyawan?.nama_karyawan ?? ''
})

const errors = reactive({
  kode_klien: [],
  nama_klien: [],
  tipe_klien: [],
  no_npwp: [],
  no_wa: [],
  karyawan_ar_id: [],
  resto_id: [],
})

const defaultForm = () => ({
  kode_klien: '',
  nama_klien: '',
  tipe_klien: 'MITRA',
  no_npwp: '',
  no_wa: '',
  karyawan_ar_id: isArRole.value ? (authStore.user?.karyawan?.id ?? null) : null,
  resto_id: null,
  status: 1,
})

const form = reactive(defaultForm())

function resetErrors() {
  Object.keys(errors).forEach(key => {
    errors[key] = []
  })
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

watch(() => form.karyawan_ar_id, (newId, oldId) => {
  if (!isArRole.value && newId !== oldId && !isEditing.value) {
    form.resto_id = null
    selectedRestoInvestor.value = null
  }
})

function onRestoChange(restoId) {
  if (!restoId) {
    selectedRestoInvestor.value = null
    return
  }

  const selectedResto = restoList.value?.find(r => r.id === restoId)
  selectedRestoInvestor.value = selectedResto?.investor ?? null

  if (selectedRestoInvestor.value?.pengelola && !form.nama_klien) {
    form.nama_klien = selectedRestoInvestor.value.pengelola
  }
}

async function handleSubmit() {
  errorMessage.value = ''
  resetErrors()

  const { valid } = await formRef.value.validate()
  if (!valid) return

  if (isArEditMode.value) {
    try {
      await api.patch(`/finance/klien-ar/${id}/wa`, { no_wa: form.no_wa || null })
      setFlashAlert({ icon: 'success', title: 'Berhasil', text: 'No. WhatsApp berhasil diperbarui.' })
      router.push({ name: 'finance-klien-ar' })
    } catch (e) {
      const msg = e.response?.data?.message ?? 'Terjadi kesalahan'
      errorMessage.value = msg
      await showError(msg)
    }
    return
  }

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

  const restoLoadOpts = { force: true }

  if (!isEditing.value) {
    await Promise.all([
      refreshKodeKlienPreview(),
      ensureRestoLoaded(restoLoadOpts),
    ])
    pageLoading.value = false

    return
  }

  await Promise.all([
    ensureKaryawanLoaded(),
    ensureRestoLoaded(restoLoadOpts),
  ])

  const data = await fetchOne(id)

  if (data) {
    Object.assign(form, {
      kode_klien:     data.kode_klien ?? '',
      nama_klien:     data.nama_klien ?? '',
      tipe_klien:     data.tipe_klien ?? 'MITRA',
      no_npwp:        data.no_npwp ?? '',
      no_wa:          data.no_wa ?? '',
      karyawan_ar_id: data.karyawan_ar_id ?? null,
      resto_id:       data.resto_id ?? null,
      status:         normalizeBooleanStatus(data.status),
    })

    if (data.resto?.investor) {
      selectedRestoInvestor.value = data.resto.investor
    }
  }

  pageLoading.value = false
})
</script>
