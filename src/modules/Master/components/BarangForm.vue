<template>
  <BaseModal
    :model-value="modelValue"
    :title="isEditing ? 'Edit Barang' : 'Tambah Barang'"
    :loading="saving"
    width="640"
    @update:model-value="$emit('update:modelValue', $event)"
    @confirm="handleSubmit"
  >
    <VForm ref="formRef">
      <!-- Hero Banner -->
      <div
        class="d-flex align-center gap-3 pa-3 rounded-lg mb-5"
        style="background: rgba(var(--v-theme-primary), 0.06); border: 1px solid rgba(var(--v-theme-primary), 0.12)"
      >
        <VAvatar
          :color="isEditing ? 'primary' : 'secondary'"
          size="44"
          rounded="lg"
        >
          <VIcon
            :icon="isEditing ? 'ri-edit-box-line' : 'ri-add-box-line'"
            size="22"
          />
        </VAvatar>
        <div class="flex-grow-1 min-width-0">
          <div class="text-subtitle-2 font-weight-bold text-truncate">
            {{ isEditing ? (form.nama_barang || 'Edit Barang') : 'Barang Baru' }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ isEditing ? 'Perbarui informasi barang' : 'Isi detail barang yang akan ditambahkan' }}
          </div>
        </div>
        <VChip
          v-if="form.kode_barang"
          color="primary"
          size="small"
          variant="tonal"
          label
          class="font-weight-bold flex-shrink-0"
        >
          {{ form.kode_barang }}
        </VChip>
      </div>

      <!-- Section: Identitas -->
      <div
        class="text-caption font-weight-bold text-uppercase d-flex align-center gap-1 mb-2"
        style="color: rgb(var(--v-theme-primary))"
      >
        <VIcon
          icon="ri-fingerprint-line"
          size="13"
        />
        Identitas Barang
      </div>
      <VRow dense>
        <VCol
          cols="12"
          md="5"
        >
          <VTextField
            v-model="form.kode_barang"
            label="Kode Barang"
            density="compact"
            variant="outlined"
            prepend-inner-icon="ri-barcode-line"
            :rules="[v => !!v || 'Kode barang wajib diisi']"
            :error-messages="errors.kode_barang"
            :disabled="isEditing"
            @input="form.kode_barang = form.kode_barang.toUpperCase()"
          />
        </VCol>
        <VCol
          cols="12"
          md="7"
        >
          <VCombobox
            v-model="namaBarangModel"
            label="Nama Barang"
            density="compact"
            variant="outlined"
            prepend-inner-icon="ri-box-3-line"
            :items="externalCatalog"
            item-title="nama_barang"
            :rules="[v => !!v || 'Nama barang wajib diisi']"
            :error-messages="errors.nama_barang"
            :loading="catalogLoading"
            return-object
            clearable
            @update:model-value="onNamaBarangChange"
          >
            <template #item="{ props: p, item }">
              <VListItem v-bind="p">
                <template #title>{{ item.raw.nama_barang }}</template>
                <template #subtitle>
                  <VChip size="x-small" color="primary" variant="tonal" label class="mr-1">
                    {{ item.raw.kode_barang }}
                  </VChip>
                  <span class="text-caption text-medium-emphasis">{{ item.raw.kategori }}</span>
                </template>
              </VListItem>
            </template>
          </VCombobox>
        </VCol>
        <VCol cols="12">
          <VTextField
            v-model="form.spesifikasi"
            label="Spesifikasi"
            density="compact"
            variant="outlined"
            prepend-inner-icon="ri-list-check-3"
            placeholder="Contoh: 500ml, Merah, Type A..."
            :error-messages="errors.spesifikasi"
          />
        </VCol>
      </VRow>

      <!-- Section: Klasifikasi -->
      <div
        class="text-caption font-weight-bold text-uppercase d-flex align-center gap-1 mt-3 mb-2"
        style="color: rgb(var(--v-theme-info))"
      >
        <VIcon
          icon="ri-folder-3-line"
          size="13"
        />
        Klasifikasi
      </div>
      <VRow dense>
        <VCol
          cols="12"
          md="7"
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
          md="5"
        >
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
            <div class="text-body-2 font-weight-medium">Status Barang</div>
            <div class="text-caption text-medium-emphasis">
              {{ form.status ? 'Aktif — barang dapat digunakan' : 'Nonaktif — barang tidak tersedia' }}
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
import { normalizeBooleanStatus } from '@/utils/status.js'
import api from '@/utils/axios'

const props = defineProps({
  modelValue: Boolean,
  barangData: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const { create, update, saving } = useCrud('/master/barang')
const { items: brandList, loading: brandLoading, fetchAll: fetchBrands } = useCrud('/master/brand')

const formRef      = ref(null)
const errorMessage = ref('')
const isEditing    = computed(() => !!props.barangData)

const externalCatalog = ref([])
const catalogLoading  = ref(false)
const namaBarangModel = ref(null)

async function fetchExternalCatalog() {
  if (externalCatalog.value.length) return
  catalogLoading.value = true
  try {
    const res = await api.get('/master/barang/external-catalog')
    externalCatalog.value = res.data?.data ?? []
  } catch {
    externalCatalog.value = []
  } finally {
    catalogLoading.value = false
  }
}

function onNamaBarangChange(val) {
  if (val && typeof val === 'object') {
    form.nama_barang = val.nama_barang
    if (!isEditing.value) {
      form.kode_barang = val.kode_barang?.toUpperCase() ?? ''
    }
  } else {
    form.nama_barang = val ?? ''
  }
}

const errors = reactive({
  kode_barang: [], nama_barang: [],
  brand_id: [], spesifikasi: [], keterangan: [],
})

const defaultForm = () => ({
  kode_barang: '',
  nama_barang: '',
  brand_id: null,
  spesifikasi: '',
  keterangan: '',
  status: 1,
})

const form = reactive(defaultForm())

watch(() => props.modelValue, async val => {
  if (val) {
    Object.keys(errors).forEach(k => (errors[k] = []))
    errorMessage.value = ''
    fetchBrands()
    fetchExternalCatalog()

    if (props.barangData) {
      Object.assign(form, {
        kode_barang: props.barangData.kode_barang ?? '',
        nama_barang: props.barangData.nama_barang ?? '',
        brand_id:    props.barangData.brand_id    ?? null,
        spesifikasi: props.barangData.spesifikasi ?? '',
        keterangan:  props.barangData.keterangan  ?? '',
        status:      normalizeBooleanStatus(props.barangData.status),
      })
      namaBarangModel.value = props.barangData.nama_barang ?? ''
    } else {
      Object.assign(form, defaultForm())
      namaBarangModel.value = null
    }
  }
})

async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  errorMessage.value = ''
  Object.keys(errors).forEach(k => (errors[k] = []))

  const res = isEditing.value
    ? await update(props.barangData.id, { ...form })
    : await create({ ...form })

  if (res.success) {
    emit('saved')
  } else if (res.errors) {
    Object.entries(res.errors).forEach(([k, v]) => { if (k in errors) errors[k] = v })
  } else {
    errorMessage.value = res.message ?? 'Terjadi kesalahan'
  }
}
</script>
