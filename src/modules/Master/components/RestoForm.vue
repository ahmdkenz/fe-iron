<template>
  <BaseModal
    :model-value="modelValue"
    :title="isEditing ? 'Edit Resto' : 'Tambah Resto'"
    :loading="saving"
    @update:model-value="$emit('update:modelValue', $event)"
    @confirm="handleSubmit"
  >
    <VForm ref="formRef">
      <VRow>
        <!-- Kode Resto (auto-generated, readonly) -->
        <VCol cols="12">
          <VTextField
            :model-value="isEditing ? restoDataRef?.kode_resto : kodePreview"
            label="Kode Resto"
            density="compact"
            variant="outlined"
            readonly
            :hint="isEditing ? 'Kode tidak dapat diubah' : 'Otomatis terisi setelah Perusahaan & Brand dipilih'"
            persistent-hint
            :loading="previewLoading"
          />
        </VCol>

        <!-- Nama Resto -->
        <VCol cols="12">
          <VTextField
            v-model="form.nama_resto"
            label="Nama Resto"
            density="compact"
            variant="outlined"
            :rules="[v => !!v || 'Nama resto wajib diisi']"
            :error-messages="errors.nama_resto"
          />
        </VCol>

        <!-- Perusahaan -->
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

        <!-- Brand -->
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

        <!-- Investor -->
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
          />
        </VCol>

        <!-- PIC (Karyawan) -->
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

        <!-- Area -->
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

        <!-- Kota -->
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

        <!-- Alamat -->
        <VCol cols="12">
          <VTextField
            v-model="form.alamat"
            label="Alamat"
            density="compact"
            variant="outlined"
            :error-messages="errors.alamat"
          />
        </VCol>

        <!-- No. Telp -->
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            v-model="form.no_telp"
            label="No. Telp"
            density="compact"
            variant="outlined"
            :error-messages="errors.no_telp"
          />
        </VCol>

        <!-- Tanggal Aktif -->
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
            :error-messages="errors.tgl_aktif"
          />
        </VCol>

        <!-- Keterangan -->
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            v-model="form.keterangan"
            label="Keterangan"
            density="compact"
            variant="outlined"
            :error-messages="errors.keterangan"
          />
        </VCol>

        <!-- Status -->
        <VCol
          cols="12"
          md="6"
        >
          <BaseSelect
            v-model="form.status"
            label="Status"
            :items="statusOptions"
            item-title="label"
            item-value="value"
          />
        </VCol>
      </VRow>

      <VAlert
        v-if="errorMessage"
        type="error"
        variant="tonal"
        class="mt-2"
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

const { items: perusahaanList, loading: perusahaanLoading, fetchAll: fetchPerusahaan } = useCrud('/master/perusahaan')
const { items: investorList,   loading: investorLoading,   fetchAll: fetchInvestor   } = useCrud('/master/investor')
const { items: karyawanList,   loading: karyawanLoading,   fetchAll: fetchKaryawan   } = useCrud('/master/karyawan')

const brandList    = ref([])
const brandLoading = ref(false)
const kodePreview  = ref('')
const previewLoading = ref(false)

const formRef      = ref(null)
const errorMessage = ref('')
const restoDataRef = computed(() => props.restoData)
const isEditing    = computed(() => !!props.restoData)

const errors = reactive({
  nama_resto: [], perusahaan_id: [], brand_id: [], investor_id: [],
  karyawan_id: [], area: [], kota: [], alamat: [], no_telp: [],
  tgl_aktif: [], keterangan: [],
})

const statusOptions = BOOLEAN_STATUS_OPTIONS

const defaultForm = () => ({
  nama_resto: '',
  perusahaan_id: null,
  brand_id: null,
  investor_id: null,
  karyawan_id: null,
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
  fetchBrands(val)
}

function onBrandChange() {
  refreshKodePreview()
}

watch(() => props.modelValue, async val => {
  if (val) {
    Object.keys(errors).forEach(k => (errors[k] = []))
    errorMessage.value = ''
    kodePreview.value  = ''

    fetchPerusahaan()
    fetchInvestor()
    fetchKaryawan()

    if (props.restoData) {
      Object.assign(form, {
        nama_resto: props.restoData.nama_resto    ?? '',
        perusahaan_id: props.restoData.perusahaan_id ?? null,
        brand_id: props.restoData.brand_id      ?? null,
        investor_id: props.restoData.investor_id   ?? null,
        karyawan_id: props.restoData.karyawan_id   ?? null,
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
