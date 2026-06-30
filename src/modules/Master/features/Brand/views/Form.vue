<template>
  <div>
    <PageHeader 
      :title="isEditing ? 'Edit Brand' : 'Tambah Brand'" 
      subtitle="Kelola data brand produk"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Brand', to: { name: 'master-brand' } },
        { title: isEditing ? 'Edit Brand' : 'Tambah Brand', disabled: true }
      ]"
    >
      <VBtn
        variant="tonal"
        color="secondary"
        :to="{ name: 'master-brand' }"
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
            icon="ri-price-tag-3-line"
            class="me-2"
          />
          Informasi Brand
        </VCardTitle>
        <VDivider />
        <VCardText>
          <VRow>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="form.kode_brand"
                label="Kode Brand"
                density="compact"
                variant="outlined"
                :rules="[v => !!v || 'Kode brand wajib diisi']"
                :error-messages="errors.kode_brand"
                :disabled="isEditing"
                @input="form.kode_brand = form.kode_brand.toUpperCase()"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="form.nama_brand"
                label="Nama Brand"
                density="compact"
                variant="outlined"
                :rules="[v => !!v || 'Nama brand wajib diisi']"
                :error-messages="errors.nama_brand"
              />
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
          :to="{ name: 'master-brand' }"
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
import { useSweetAlert } from '@/composables/useSweetAlert'
import { setFlashAlert } from '@/utils/flashAlert'
import { BOOLEAN_STATUS_OPTIONS, normalizeBooleanStatus } from '@/utils/status.js'

const route = useRoute()
const router = useRouter()
const { showError } = useSweetAlert()
const id = route.params.id
const isEditing = computed(() => !!id)

const { create, update, saving, fetchOne } = useCrud('/master/brand')

const formRef = ref(null)
const pageLoading = ref(!!id)
const errorMessage = ref('')
const errors = reactive({ kode_brand: [], nama_brand: [], keterangan: [] })

const statusOptions = BOOLEAN_STATUS_OPTIONS

const form = reactive({ kode_brand: '', nama_brand: '', keterangan: '', status: 1 })

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
      text: isEditing.value ? 'Perubahan brand berhasil disimpan.' : 'Brand berhasil ditambahkan.',
    })
    router.push({ name: 'master-brand' })
  } else {
    if (res.errors) Object.assign(errors, res.errors)
    else {
      errorMessage.value = res.message ?? 'Gagal menyimpan data'
      await showError(errorMessage.value)
    }
  }
}

onMounted(async () => {
  if (!isEditing.value) return
  const data = await fetchOne(id)
  if (data) {
    form.kode_brand = data.kode_brand ?? ''
    form.nama_brand = data.nama_brand ?? ''
    form.keterangan = data.keterangan ?? ''
    form.status     = normalizeBooleanStatus(data.status)
  }
  pageLoading.value = false
})
</script>
