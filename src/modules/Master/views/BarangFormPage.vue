<template>
  <div>
    <PageHeader 
      :title="isEditing ? 'Edit Barang' : 'Tambah Barang'" 
      subtitle="Kelola data barang"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Barang', to: { name: 'master-barang' } },
        { title: isEditing ? 'Edit Barang' : 'Tambah Barang', disabled: true }
      ]"
    >
      <VBtn
        variant="tonal"
        color="secondary"
        :to="{ name: 'master-barang' }"
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
      <!-- Identitas Barang -->
      <VCard class="mb-4">
        <VCardTitle class="pa-4 pb-2">
          <VIcon
            icon="ri-box-3-line"
            class="me-2"
          />
          Identitas Barang
        </VCardTitle>
        <VDivider />
        <VCardText>
          <VRow>
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
            <VCol cols="12">
              <VTextField
                v-model="form.spesifikasi"
                label="Spesifikasi"
                density="compact"
                variant="outlined"
                :error-messages="errors.spesifikasi"
              />
            </VCol>
          </VRow>
        </VCardText>
      </VCard>

      <!-- Klasifikasi -->
      <VCard class="mb-4">
        <VCardTitle class="pa-4 pb-2">
          <VIcon
            icon="ri-folder-3-line"
            class="me-2"
          />
          Klasifikasi
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
                @focus="ensureBrandsLoaded()"
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
              <VTextField
                v-model="form.keterangan"
                label="Keterangan"
                density="compact"
                variant="outlined"
                :error-messages="errors.keterangan"
              />
            </VCol>
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
          :to="{ name: 'master-barang' }"
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

const { create, update, saving, fetchOne } = useCrud('/master/barang')
const { items: perusahaanList, loading: perusahaanLoading, fetchAll: fetchPerusahaan } = useCrud('/master/perusahaan')
const { items: brandList, loading: brandLoading, fetchAll: fetchBrands } = useCrud('/master/brand')
const { ensureLoaded: ensurePerusahaanLoaded } = useLazyFetchAll(fetchPerusahaan)
const { ensureLoaded: ensureBrandsLoaded } = useLazyFetchAll(fetchBrands)

const formRef = ref(null)
const pageLoading = ref(!!id)
const errorMessage = ref('')

const errors = reactive({
  kode_barang: [], nama_barang: [], perusahaan_id: [], brand_id: [], spesifikasi: [], keterangan: [],
})

const statusOptions = BOOLEAN_STATUS_OPTIONS

const form = reactive({
  kode_barang: '', nama_barang: '', perusahaan_id: null, brand_id: null, spesifikasi: '', keterangan: '', status: 1,
})

async function handleSubmit() {
  errorMessage.value = ''
  Object.keys(errors).forEach(k => (errors[k] = []))

  const { valid } = await formRef.value.validate()
  if (!valid) return
  const res = isEditing.value ? await update(id, form) : await create(form)
  if (res.success) {
    setFlashAlert({
      icon: 'success',
      title: 'Berhasil',
      text: isEditing.value ? 'Perubahan barang berhasil disimpan.' : 'Barang berhasil ditambahkan.',
    })
    router.push({ name: 'master-barang' })
  } else {
    if (res.errors) Object.assign(errors, res.errors)
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

  await Promise.all([ensurePerusahaanLoaded(), ensureBrandsLoaded()])

  const data = await fetchOne(id)
  if (data) {
    form.kode_barang   = data.kode_barang   ?? ''
    form.nama_barang   = data.nama_barang   ?? ''
    form.perusahaan_id = data.perusahaan_id ?? null
    form.brand_id      = data.brand_id      ?? null
    form.spesifikasi   = data.spesifikasi   ?? ''
    form.keterangan    = data.keterangan    ?? ''
    form.status        = normalizeBooleanStatus(data.status)
  }
  pageLoading.value = false
})
</script>
