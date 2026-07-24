<template>
  <BaseModal
    :model-value="modelValue"
    :title="isEditing ? 'Edit Resto' : 'Tambah Resto'"
    :loading="saving"
    @update:model-value="$emit('update:modelValue', $event)"
    @confirm="handleSubmit"
  >
    <VForm ref="formRef">
      <!-- Hero Banner -->
      <div
        class="d-flex align-center gap-3 pa-3 rounded-lg mb-4"
        style="background: rgba(var(--v-theme-primary), 0.06); border: 1px solid rgba(var(--v-theme-primary), 0.15)"
      >
        <VAvatar
          :color="isEditing ? 'warning' : 'primary'"
          size="44"
          rounded="lg"
        >
          <VIcon
            :icon="isEditing ? 'ri-edit-box-line' : 'ri-store-3-line'"
            size="22"
          />
        </VAvatar>
        <div class="flex-grow-1 min-width-0">
          <div class="text-subtitle-2 font-weight-bold text-truncate">
            {{ isEditing ? (form.nama_resto || 'Edit Resto') : 'Resto Baru' }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ isEditing ? 'Perbarui data restoran' : 'Isi detail restoran yang akan ditambahkan' }}
          </div>
        </div>
        <VChip
          v-if="restoDataRef?.kode_resto || form.kode_resto"
          color="primary"
          size="small"
          variant="tonal"
          label
          class="font-weight-bold flex-shrink-0"
        >
          {{ restoDataRef?.kode_resto || form.kode_resto }}
        </VChip>
      </div>

      <!-- Section: Identitas Resto -->
      <div
        class="text-caption font-weight-bold text-uppercase d-flex align-center gap-1 mb-2"
        style="color: rgb(var(--v-theme-primary))"
      >
        <VIcon
          icon="ri-store-3-line"
          size="13"
        />
        Identitas Resto
      </div>
      <VRow dense>
        <VCol cols="12">
          <VTextField
            v-if="isEditing"
            :model-value="restoDataRef?.kode_resto"
            label="Kode Resto"
            density="compact"
            variant="outlined"
            prepend-inner-icon="ri-barcode-line"
            readonly
            hint="Kode tidak dapat diubah"
            persistent-hint
          />
          <VTextField
            v-else
            v-model="form.kode_resto"
            label="Kode Resto"
            density="compact"
            variant="outlined"
            prepend-inner-icon="ri-barcode-line"
            :rules="[v => !!v || 'Kode resto wajib diisi']"
            :error-messages="errors.kode_resto"
            hint="Isi kode resto secara manual"
            persistent-hint
          />
        </VCol>
        <VCol cols="12">
          <VTextField
            v-model="form.nama_resto"
            label="Nama Resto"
            density="compact"
            variant="outlined"
            prepend-inner-icon="ri-store-3-line"
            :rules="[v => !!v || 'Nama resto wajib diisi']"
            :error-messages="errors.nama_resto"
          />
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <VAutocomplete
            v-model="form.perusahaan_id"
            label="Entitas"
            density="compact"
            variant="outlined"
            prepend-inner-icon="ri-building-4-line"
            :items="entitasList"
            item-title="nama_perusahaan"
            item-value="id"
            :rules="[v => !!v || 'Entitas wajib dipilih']"
            :error-messages="errors.perusahaan_id"
            :loading="entitasLoading"
            clearable
            @update:model-value="onEntitasChange"
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
            prepend-inner-icon="ri-award-line"
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
            prepend-inner-icon="ri-money-dollar-circle-line"
            :items="investorList"
            item-title="nama_investor"
            item-value="id"
            :error-messages="errors.investor_id"
            :loading="investorLoading"
            clearable
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
            prepend-inner-icon="ri-user-star-line"
            :items="karyawanList"
            item-title="nama_karyawan"
            item-value="id"
            :error-messages="errors.karyawan_id"
            :loading="karyawanLoading"
            clearable
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

      <!-- Section: Penanggung Jawab -->
      <div
        class="text-caption font-weight-bold text-uppercase d-flex align-center gap-1 mt-3 mb-2"
        style="color: rgb(var(--v-theme-warning))"
      >
        <VIcon
          icon="ri-user-star-line"
          size="13"
        />
        Penanggung Jawab
      </div>
      <VRow dense>
        <VCol cols="12">
          <VTextField
            v-model="form.supervisor"
            label="Supervisor"
            density="compact"
            variant="outlined"
            prepend-inner-icon="ri-user-star-line"
            :error-messages="errors.supervisor"
          />
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            v-model="form.no_hp_supervisor"
            label="No. HP Supervisor (No SPV)"
            density="compact"
            variant="outlined"
            prepend-inner-icon="ri-phone-line"
            :error-messages="errors.no_hp_supervisor"
          />
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            v-model="form.stokis"
            label="STOKIS"
            density="compact"
            variant="outlined"
            prepend-inner-icon="ri-store-line"
            :error-messages="errors.stokis"
          />
        </VCol>
      </VRow>

      <!-- Section: Lokasi & Kontak -->
      <div
        class="text-caption font-weight-bold text-uppercase d-flex align-center gap-1 mt-3 mb-2"
        style="color: rgb(var(--v-theme-info))"
      >
        <VIcon
          icon="ri-map-pin-line"
          size="13"
        />
        Lokasi &amp; Kontak
      </div>
      <VRow dense>
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            v-model="form.area"
            label="Area"
            density="compact"
            variant="outlined"
            prepend-inner-icon="ri-compass-3-line"
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
            prepend-inner-icon="ri-building-2-line"
            :error-messages="errors.kota"
          />
        </VCol>
        <VCol cols="12">
          <VTextField
            v-model="form.alamat"
            label="Alamat"
            density="compact"
            variant="outlined"
            prepend-inner-icon="ri-map-pin-line"
            :error-messages="errors.alamat"
          />
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            v-model="form.no_telp"
            label="No. Telp"
            density="compact"
            variant="outlined"
            prepend-inner-icon="ri-phone-line"
            :error-messages="errors.no_telp"
          />
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            v-model="form.tgl_aktif"
            label="Tanggal Aktif"
            density="compact"
            variant="outlined"
            type="date"
            prepend-inner-icon="ri-calendar-line"
            :error-messages="errors.tgl_aktif"
          />
        </VCol>
        <VCol cols="12">
          <VTextField
            v-model="form.keterangan"
            label="Keterangan"
            density="compact"
            variant="outlined"
            prepend-inner-icon="ri-sticky-note-line"
            :error-messages="errors.keterangan"
          />
        </VCol>
      </VRow>

      <!-- Status Toggle -->
      <div
        class="d-flex align-center justify-space-between pa-3 rounded-lg mt-3"
        style="border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity))"
      >
        <div class="d-flex align-center gap-2">
          <VIcon
            :icon="form.status ? 'ri-checkbox-circle-line' : 'ri-close-circle-line'"
            :color="form.status ? 'success' : 'error'"
            size="20"
          />
          <div>
            <div class="text-body-2 font-weight-medium">
              Status Resto
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ form.status ? 'Aktif — resto beroperasi' : 'Nonaktif — resto tidak aktif' }}
            </div>
          </div>
        </div>
        <VSwitch
          v-model="form.status"
          :true-value="1"
          :false-value="0"
          color="success"
          hide-details
          density="compact"
          inset
        />
      </div>

      <VAlert
        v-if="errorMessage"
        type="error"
        variant="tonal"
        class="mt-3"
      >
        {{ errorMessage }}
      </VAlert>
    </VForm>
  </BaseModal>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { useCrud } from '@/composables/useCrud.js'
import api from '@/utils/axios.js'
import { BOOLEAN_STATUS_OPTIONS, normalizeBooleanStatus } from '@/utils/status.js'

const props = defineProps({
  modelValue: Boolean,
  restoData: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const { create, update, saving } = useCrud('/master/resto')

const { items: entitasList, loading: entitasLoading, fetchAll: fetchEntitas } = useCrud('/master/perusahaan')
const { items: investorList,   loading: investorLoading,   fetchAll: fetchInvestor   } = useCrud('/master/investor')
const { items: karyawanList,   loading: karyawanLoading,   fetchAll: fetchKaryawan   } = useCrud('/master/karyawan')

const brandList    = ref([])
const brandLoading = ref(false)

const formRef      = ref(null)
const errorMessage = ref('')
const restoDataRef = computed(() => props.restoData)
const isEditing    = computed(() => !!props.restoData)

const errors = reactive({
  kode_resto: [], nama_resto: [], perusahaan_id: [], brand_id: [], investor_id: [],
  karyawan_id: [], supervisor: [], no_hp_supervisor: [], stokis: [],
  area: [], kota: [], alamat: [], no_telp: [], tgl_aktif: [], keterangan: [],
})

const statusOptions = BOOLEAN_STATUS_OPTIONS

const defaultForm = () => ({
  kode_resto: '',
  nama_resto: '',
  perusahaan_id: null,
  brand_id: null,
  investor_id: null,
  karyawan_id: null,
  supervisor: '',
  no_hp_supervisor: '',
  stokis: '',
  area: '',
  kota: '',
  alamat: '',
  no_telp: '',
  tgl_aktif: '',
  keterangan: '',
  status: 1,
})

const form = reactive(defaultForm())

async function fetchBrands(perusahaanId) {
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

function onEntitasChange(val) {
  form.brand_id = null
  fetchBrands(val)
}

function onBrandChange() {}

watch([() => props.modelValue, () => props.restoData], async ([open]) => {
  if (!open) return
  Object.keys(errors).forEach(k => (errors[k] = []))
  errorMessage.value = ''

  fetchEntitas()
  fetchInvestor()
  fetchKaryawan()

  if (props.restoData) {
    Object.assign(form, {
      kode_resto: props.restoData.kode_resto    ?? '',
      nama_resto: props.restoData.nama_resto    ?? '',
      perusahaan_id: props.restoData.perusahaan_id ?? null,
      brand_id: props.restoData.brand_id      ?? null,
      investor_id: props.restoData.investor_id   ?? null,
      karyawan_id: props.restoData.karyawan_id   ?? null,
      supervisor: props.restoData.supervisor     ?? '',
      no_hp_supervisor: props.restoData.no_hp_supervisor ?? '',
      stokis: props.restoData.stokis         ?? '',
      area: props.restoData.area          ?? '',
      kota: props.restoData.kota          ?? '',
      alamat: props.restoData.alamat        ?? '',
      no_telp: props.restoData.no_telp       ?? '',
      tgl_aktif: props.restoData.tgl_aktif     ?? '',
      keterangan: props.restoData.keterangan    ?? '',
      status: normalizeBooleanStatus(props.restoData.status),
    })
    if (form.perusahaan_id) {
      await fetchBrands(form.perusahaan_id)
    }
  } else {
    Object.assign(form, defaultForm())
    brandList.value = []
  }
})

async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  errorMessage.value = ''
  Object.keys(errors).forEach(k => (errors[k] = []))

  const payload = { ...form }

  const res = isEditing.value
    ? await update(props.restoData.id, payload)
    : await create(payload)

  if (res.success) {
    emit('saved')
  } else if (res.errors) {
    Object.entries(res.errors).forEach(([k, v]) => { if (k in errors) errors[k] = v })
  } else {
    errorMessage.value = res.message ?? 'Terjadi kesalahan'
  }
}
</script>
