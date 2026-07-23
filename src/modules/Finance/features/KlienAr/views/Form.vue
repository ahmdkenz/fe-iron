<template>
  <div>
    <PageHeader
      :title="isEditing ? 'Edit Client' : 'Tambah Client'"
      subtitle="Kelola data klien Account Receivable"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Client', to: { name: 'finance-klien-ar' } },
        { title: isEditing ? 'Edit Client' : 'Tambah Client', disabled: true },
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
      <!-- AR Mode notice -->
      <div
        v-if="isArEditMode"
        class="ar-notice mb-4"
      >
        <VIcon
          icon="ri-shield-user-line"
          size="15"
          class="me-2 flex-shrink-0"
          color="info"
        />
        <span class="text-body-2 text-medium-emphasis">
          Mode AR — hanya <strong class="text-high-emphasis">No. WhatsApp</strong> yang dapat diubah.
        </span>
      </div>

      <!-- Card 1: Data Klien -->
      <VCard class="mb-4">
        <VCardTitle class="pa-4 pb-2 d-flex align-center gap-2">
          <VIcon
            :icon="isB2B ? 'ri-building-4-line' : 'ri-store-line'"
            size="18"
            color="primary"
          />
          <span>Data Klien</span>
          <VChip
            v-if="form.tipe_klien"
            :color="isB2B ? 'info' : 'success'"
            size="x-small"
            variant="tonal"
          >
            {{ isB2B ? 'B2B — PT' : 'B2C — RESTO' }}
          </VChip>
        </VCardTitle>
        <VDivider />
        <VCardText class="pt-4">
          <VRow>
            <!-- Tipe Klien -->
            <VCol cols="12">
              <div v-if="!isEditing && !isArEditMode">
                <div class="text-caption text-medium-emphasis mb-2">
                  Tipe Klien <span class="text-error">*</span>
                </div>
                <VBtnToggle
                  :model-value="form.tipe_klien"
                  mandatory
                  variant="outlined"
                  density="comfortable"
                  color="primary"
                  class="tipe-toggle"
                  @update:model-value="selectTipeKlien"
                >
                  <VBtn value="RESTO" class="tipe-btn">
                    <VIcon icon="ri-store-line" size="16" class="me-2" />
                    <span>
                      <span class="d-block font-weight-medium" style="line-height:1.2">RESTO</span>
                      <span class="d-block text-caption text-medium-emphasis" style="line-height:1.2">B2C</span>
                    </span>
                  </VBtn>
                  <VBtn value="PT" class="tipe-btn">
                    <VIcon icon="ri-building-4-line" size="16" class="me-2" />
                    <span>
                      <span class="d-block font-weight-medium" style="line-height:1.2">PT</span>
                      <span class="d-block text-caption text-medium-emphasis" style="line-height:1.2">B2B</span>
                    </span>
                  </VBtn>
                </VBtnToggle>
              </div>
              <div
                v-else
                class="d-flex align-center gap-2"
              >
                <span class="text-caption text-medium-emphasis">Tipe Klien:</span>
                <VChip
                  :color="isB2B ? 'info' : 'success'"
                  size="small"
                  variant="tonal"
                  :prepend-icon="isB2B ? 'ri-building-4-line' : 'ri-store-line'"
                >
                  {{ isB2B ? 'PT — B2B' : 'RESTO — B2C' }}
                </VChip>
                <span class="text-caption text-disabled">Tidak dapat diubah</span>
              </div>
            </VCol>

            <VCol cols="12" md="3">
              <VTextField
                v-model="form.kode_klien"
                label="Kode Klien"
                density="compact"
                variant="outlined"
                :readonly="true"
                :loading="kodeLoading"
                :error-messages="errors.kode_klien"
                hint="Digenerate otomatis"
                persistent-hint
              />
            </VCol>
            <VCol cols="12" md="6">
              <VTextField
                v-model="form.nama_klien"
                :label="namaKlienLabel"
                density="compact"
                variant="outlined"
                :rules="[v => !!v || `${namaKlienLabel} wajib diisi`]"
                :error-messages="errors.nama_klien"
                :readonly="isArEditMode"
                :hint="namaKlienHint"
                persistent-hint
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
                :readonly="isArEditMode"
              />
            </VCol>

            <VCol cols="12" md="9">
              <VTextField
                v-if="isB2B"
                v-model="form.no_npwp"
                :label="npwpLabel"
                density="compact"
                variant="outlined"
                :rules="npwpRules"
                :error-messages="errors.no_npwp"
                :readonly="isArEditMode"
                hint="Wajib untuk penerbitan faktur pajak"
                persistent-hint
              />
              <VTextField
                v-else
                :model-value="selectedRestoInvestor?.npwp || form.no_npwp || ''"
                label="No. NPWP (dari Investor)"
                density="compact"
                variant="outlined"
                :hint="selectedRestoInvestor?.npwp ? 'Dibaca otomatis dari data Investor — ubah di Master Investor' : 'Belum ada NPWP di data Investor'"
                persistent-hint
                readonly
                :prepend-inner-icon="selectedRestoInvestor?.npwp ? 'ri-shield-check-line' : 'ri-information-line'"
              />
            </VCol>
            <VCol cols="12" md="6">
              <VTextField
                v-model="form.no_wa"
                :label="isB2B ? 'No. WhatsApp Kontak Keuangan PT' : 'No. WhatsApp (Fallback AR)'"
                placeholder="08123456789"
                density="compact"
                variant="outlined"
                :hint="!isB2B ? 'Opsional — digunakan jika HP Investor belum diisi' : ''"
                :persistent-hint="!isB2B"
                :error-messages="errors.no_wa"
                clearable
              />
            </VCol>

            <VCol
              v-if="isB2B"
              cols="12"
              md="9"
            >
              <VAutocomplete
                v-model="form.perusahaan_id"
                label="Entitas Perusahaan (Wajib untuk B2B)"
                density="compact"
                variant="outlined"
                prepend-inner-icon="ri-building-2-line"
                :items="perusahaanList"
                item-title="nama_perusahaan"
                item-value="id"
                clearable
                :loading="perusahaanLoading"
                :rules="[v => !isB2B || !!v || 'Entitas Perusahaan wajib dipilih untuk klien B2B']"
                :error-messages="errors.perusahaan_id"
                :readonly="isArEditMode"
                hint="Pilih entitas yang memiliki Resto-resto yang akan ditagihkan ke PT ini"
                persistent-hint
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
          </VRow>
        </VCardText>
      </VCard>

      <!-- Card 2: Relasi Internal -->
      <VCard class="mb-4">
        <VCardTitle class="pa-4 pb-2 d-flex align-center gap-2">
          <VIcon
            icon="ri-links-line"
            size="18"
            color="primary"
          />
          <span>Relasi Internal</span>
        </VCardTitle>
        <VDivider />
        <VCardText class="pt-4">
          <VRow>
            <VCol
              v-if="!isB2B"
              cols="12"
            >
              <VAutocomplete
                v-model="form.resto_id"
                label="Resto (Wajib)"
                density="compact"
                variant="outlined"
                :items="filteredRestoList"
                item-title="nama_resto"
                item-value="id"
                clearable
                :rules="[v => !!v || 'Resto wajib dipilih untuk tipe B2C']"
                :error-messages="errors.resto_id"
                :loading="restoLoading"
                :readonly="isArEditMode"
                :hint="!form.resto_id && !isEditing ? 'Pilih Resto — nama pengelola terisi otomatis' : ''"
                :persistent-hint="!form.resto_id && !isEditing"
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
              <div class="info-panel">
                <div class="info-panel__row">
                  <span class="text-caption text-medium-emphasis">Investor:</span>
                  <span class="text-caption">{{ selectedRestoInvestor.nama_investor }}</span>
                  <span
                    v-if="selectedRestoInvestor.no_hp"
                    class="text-caption text-disabled"
                  >· {{ selectedRestoInvestor.no_hp }}</span>
                </div>
                <div
                  v-if="selectedRestoInvestor.npwp"
                  class="info-panel__row"
                >
                  <span class="text-caption text-medium-emphasis">NPWP Investor:</span>
                  <span class="text-caption font-weight-medium">{{ selectedRestoInvestor.npwp }}</span>
                </div>
                <div
                  v-if="selectedRestoInvestor.pengelola"
                  class="info-panel__row"
                >
                  <span class="text-caption text-medium-emphasis">Pengelola:</span>
                  <span class="text-caption">{{ selectedRestoInvestor.pengelola }}</span>
                  <span
                    v-if="selectedRestoInvestor.no_hp_pengelola"
                    class="text-caption text-disabled"
                  >· {{ selectedRestoInvestor.no_hp_pengelola }}</span>
                </div>
              </div>
            </VCol>

            <VCol cols="12" md="6">
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
              <VTextField
                v-else-if="!isB2B"
                :model-value="selectedResto?.pic?.nama_karyawan ?? ''"
                label="PIC AR (Staff Penagihan)"
                density="compact"
                variant="outlined"
                :rules="[() => !!form.karyawan_ar_id || 'Pilih Resto dengan PIC terlebih dahulu']"
                :error-messages="errors.karyawan_ar_id"
                :loading="restoLoading"
                readonly
                hint="Mengikuti PIC Resto yang dipilih — ubah di Data Resto bila perlu"
                persistent-hint
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
          <VIcon icon="ri-save-line" class="me-1" />
          Simpan
        </VBtn>
      </div>
    </VForm>

    <!-- Dialog Panduan -->
    <VDialog
      v-model="showPanduan"
      max-width="660"
      scrollable
    >
      <VCard>
        <VCardTitle class="pa-4 pb-2 d-flex align-center justify-space-between">
          <div class="d-flex align-center gap-2">
            <VIcon icon="ri-book-2-line" size="18" color="primary" />
            <span class="text-subtitle-1 font-weight-semibold">Panduan Pengisian Client</span>
          </div>
          <VBtn icon size="small" variant="text" @click="showPanduan = false">
            <VIcon icon="ri-close-line" />
          </VBtn>
        </VCardTitle>
        <VDivider />
        <VCardText class="pa-0">
          <VTabs
            v-model="panduanTab"
            color="primary"
            grow
            class="pt-1"
          >
            <VTab value="b2c">
              <VIcon icon="ri-store-line" size="16" class="me-1" />
              B2C — RESTO
            </VTab>
            <VTab value="b2b">
              <VIcon icon="ri-building-4-line" size="16" class="me-1" />
              B2B — PT
            </VTab>
          </VTabs>
          <VDivider />
          <VTabsWindow v-model="panduanTab" class="pa-4">
            <VTabsWindowItem value="b2c">
              <VTable density="compact" class="rounded border">
                <thead>
                  <tr>
                    <th style="width:36%">Field</th>
                    <th>Cara Mengisi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="font-weight-medium">Tipe Klien</td>
                    <td>Pilih <strong>RESTO</strong> — penagihan ke pengelola outlet langsung</td>
                  </tr>
                  <tr>
                    <td class="font-weight-medium">Resto <span class="text-error">*</span></td>
                    <td>Pilih outlet — info investor &amp; pengelola otomatis muncul</td>
                  </tr>
                  <tr>
                    <td class="font-weight-medium">Nama Investor (Billing)</td>
                    <td>Otomatis dari investor; ubah jika berbeda</td>
                  </tr>
                  <tr>
                    <td class="font-weight-medium">No. NPWP</td>
                    <td>Otomatis dari data Investor — untuk mengubah, edit di Master Investor</td>
                  </tr>
                  <tr>
                    <td class="font-weight-medium">No. WhatsApp</td>
                    <td>Opsional — fallback jika No. HP Investor belum diisi (format: 08xx atau 62xx)</td>
                  </tr>
                  <tr>
                    <td class="font-weight-medium">PIC AR</td>
                    <td>Staff AR yang menagih klien ini</td>
                  </tr>
                </tbody>
              </VTable>
            </VTabsWindowItem>
            <VTabsWindowItem value="b2b">
              <VTable density="compact" class="rounded border">
                <thead>
                  <tr>
                    <th style="width:36%">Field</th>
                    <th>Cara Mengisi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="font-weight-medium">Tipe Klien</td>
                    <td>Pilih <strong>PT</strong> — penagihan ke perusahaan/badan usaha</td>
                  </tr>
                  <tr>
                    <td class="font-weight-medium">Entitas Perusahaan <span class="text-error">*</span></td>
                    <td>Pilih entitas PT — wajib agar Resto bisa dipilih saat buat Invoice B2B</td>
                  </tr>
                  <tr>
                    <td class="font-weight-medium">Nama Kontak (Billing)</td>
                    <td>Isi manual — nama kontak keuangan/billing di PT</td>
                  </tr>
                  <tr>
                    <td class="font-weight-medium">No. NPWP <span class="text-error">*</span></td>
                    <td>NPWP perusahaan — penting untuk faktur pajak</td>
                  </tr>
                  <tr>
                    <td class="font-weight-medium">No. WhatsApp</td>
                    <td>Nomor WA kontak keuangan/billing PT</td>
                  </tr>
                  <tr>
                    <td class="font-weight-medium">PIC AR</td>
                    <td>Staff AR yang menagih ke PT ini</td>
                  </tr>
                </tbody>
              </VTable>
              <p class="text-caption text-medium-emphasis mt-3 mb-0">
                <VIcon icon="ri-information-line" size="13" class="me-1" />
                1 PT = 1 Client. Beberapa Resto bisa dimiliki satu PT — semua ditagih ke Client ini.
              </p>
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
const isB2B        = computed(() => form.tipe_klien === 'PT')

const namaKlienLabel = computed(() =>
  isB2B.value ? 'Nama Kontak Keuangan PT (Billing)' : 'Nama Investor (Billing)'
)
const namaKlienHint = computed(() => {
  if (isB2B.value) return 'Isi nama kontak keuangan/billing di PT'
  if (!isEditing.value && selectedRestoInvestor.value) return 'Otomatis dari data investor'
  return ''
})
const npwpLabel = computed(() =>
  isB2B.value ? 'No. NPWP Perusahaan (Wajib)' : 'No. NPWP Investor (Opsional)'
)
const npwpRules = computed(() =>
  isB2B.value ? [v => !!v || 'NPWP Perusahaan wajib diisi untuk klien B2B'] : []
)

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
const { items: perusahaanList, loading: perusahaanLoading, fetchAll: fetchPerusahaan } = useCrud('/master/perusahaan')
const { ensureLoaded: ensureKaryawanLoaded } = useLazyFetchAll(fetchKaryawan)
const { ensureLoaded: ensureRestoLoaded } = useLazyFetchAll(fetchResto)
const { ensureLoaded: ensurePerusahaanLoaded } = useLazyFetchAll(fetchPerusahaan)

const formRef           = ref(null)
const pageLoading       = ref(!!id)
const kodeLoading       = ref(false)
const errorMessage      = ref('')
const showPanduan       = ref(false)
const panduanTab        = ref('b2c')

const selectedRestoInvestor = ref(null)

const selectedResto = computed(() => restoList.value?.find(r => r.id === form.resto_id) ?? null)

const statusOptions = BOOLEAN_STATUS_OPTIONS

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
  perusahaan_id: [],
  karyawan_ar_id: [],
  resto_id: [],
})

const defaultForm = () => ({
  kode_klien: '',
  nama_klien: '',
  tipe_klien: 'RESTO',
  no_npwp: '',
  no_wa: '',
  perusahaan_id: null,
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

function selectTipeKlien(tipe) {
  if (isEditing.value || isArEditMode.value) return
  form.tipe_klien = tipe
  form.no_npwp = ''
  form.nama_klien = ''
  form.resto_id = null
  form.perusahaan_id = null
  selectedRestoInvestor.value = null
}

watch(() => form.tipe_klien, newType => {
  if (newType) panduanTab.value = newType === 'PT' ? 'b2b' : 'b2c'
})

function onRestoChange(restoId) {
  if (!restoId) {
    selectedRestoInvestor.value = null
    if (!isArRole.value) form.karyawan_ar_id = null
    return
  }

  const resto = restoList.value?.find(r => r.id === restoId)
  selectedRestoInvestor.value = resto?.investor ?? null

  if (selectedRestoInvestor.value?.nama_investor && !form.nama_klien) {
    form.nama_klien = selectedRestoInvestor.value.nama_investor
  }

  // PIC AR untuk tipe RESTO mengikuti PIC Resto — dipaksa juga di backend (KlienArService).
  if (!isArRole.value) form.karyawan_ar_id = resto?.karyawan_id ?? null
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
      text: isEditing.value ? 'Perubahan Client berhasil disimpan.' : 'Client berhasil ditambahkan.',
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
    kodeLoading.value = true
    const [, , previewRes] = await Promise.allSettled([
      ensureRestoLoaded(restoLoadOpts),
      ensurePerusahaanLoaded(),
      api.get('/finance/klien-ar/preview-kode'),
    ])
    if (previewRes.status === 'fulfilled') {
      form.kode_klien = previewRes.value?.data?.data?.kode_klien ?? ''
    }
    kodeLoading.value = false
    pageLoading.value = false

    return
  }

  await Promise.all([
    ensureKaryawanLoaded(),
    ensureRestoLoaded(restoLoadOpts),
    ensurePerusahaanLoaded(),
  ])

  const data = await fetchOne(id)

  if (data) {
    Object.assign(form, {
      kode_klien:     data.kode_klien ?? '',
      nama_klien:     data.nama_klien ?? '',
      tipe_klien:     data.tipe_klien ?? 'MITRA',
      no_npwp:        data.no_npwp ?? '',
      no_wa:          data.no_wa ?? '',
      perusahaan_id:  data.perusahaan_id ?? null,
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

<style scoped>
/* AR mode notice bar */
.ar-notice {
  display: flex;
  align-items: center;
  padding: 9px 14px;
  border-radius: 6px;
  border: 1px solid rgba(var(--v-theme-info), 0.3);
  background-color: rgba(var(--v-theme-info), 0.05);
}

/* Tipe Klien toggle */
.tipe-toggle {
  width: 100%;
  max-width: 400px;
}

.tipe-btn {
  flex: 1;
  height: 48px !important;
  text-transform: none !important;
  letter-spacing: 0 !important;
}

/* Investor info panel */
.info-panel {
  padding: 9px 12px;
  border-radius: 6px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  background-color: rgba(var(--v-theme-on-surface), 0.03);
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.info-panel__row {
  display: flex;
  gap: 6px;
  align-items: baseline;
}
</style>
