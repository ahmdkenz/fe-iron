<template>
  <BaseModal
    :model-value="modelValue"
    :title="isEditing ? 'Edit Barang' : 'Tambah Barang'"
    :loading="saving"
    @update:model-value="$emit('update:modelValue', $event)"
    @confirm="handleSubmit"
  >
    <VForm ref="formRef">
      <VRow>
        <!-- Kode Barang -->
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            v-model="form.kode_barang"
            label="Kode Barang"
            density="compact"
            variant="outlined"
            :rules="[v => !!v || 'Kode barang wajib diisi']"
            :error-messages="errors.kode_barang"
            :disabled="isEditing"
            @input="form.kode_barang = form.kode_barang.toUpperCase()"
          />
        </VCol>

        <!-- Nama Barang -->
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            v-model="form.nama_barang"
            label="Nama Barang"
            density="compact"
            variant="outlined"
            :rules="[v => !!v || 'Nama barang wajib diisi']"
            :error-messages="errors.nama_barang"
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

        <!-- Spesifikasi -->
        <VCol cols="12">
          <VTextField
            v-model="form.spesifikasi"
            label="Spesifikasi"
            density="compact"
            variant="outlined"
            :error-messages="errors.spesifikasi"
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
import { BOOLEAN_STATUS_OPTIONS, normalizeBooleanStatus } from '@/utils/status.js'

const props = defineProps({
  modelValue: Boolean,
  barangData: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const { create, update, saving } = useCrud('/master/barang')
const { items: perusahaanList, loading: perusahaanLoading, fetchAll: fetchPerusahaan } = useCrud('/master/perusahaan')
const { items: brandList, loading: brandLoading, fetchAll: fetchBrands } = useCrud('/master/brand')

const formRef      = ref(null)
const errorMessage = ref('')
const isEditing    = computed(() => !!props.barangData)

const errors = reactive({
  kode_barang: [], nama_barang: [], perusahaan_id: [],
  brand_id: [], spesifikasi: [], keterangan: [],
})

const statusOptions = BOOLEAN_STATUS_OPTIONS

const defaultForm = () => ({
  kode_barang: '',
  nama_barang: '',
  perusahaan_id: null,
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
    fetchPerusahaan()
    fetchBrands()

    if (props.barangData) {
      Object.assign(form, {
        kode_barang: props.barangData.kode_barang   ?? '',
        nama_barang: props.barangData.nama_barang   ?? '',
        perusahaan_id: props.barangData.perusahaan_id ?? null,
        brand_id: props.barangData.brand_id      ?? null,
        spesifikasi: props.barangData.spesifikasi   ?? '',
        keterangan: props.barangData.keterangan    ?? '',
        status: normalizeBooleanStatus(props.barangData.status),
      })
    } else {
      Object.assign(form, defaultForm())
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
