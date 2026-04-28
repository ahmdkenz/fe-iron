<template>
  <div>
    <PageHeader 
      :title="isEditing ? 'Edit Karyawan' : 'Tambah Karyawan'" 
      subtitle="Kelola data karyawan"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Karyawan', to: { name: 'master-karyawan' } },
        { title: isEditing ? 'Edit Karyawan' : 'Tambah Karyawan', disabled: true }
      ]"
    >
      <VBtn
        variant="tonal"
        color="secondary"
        :to="{ name: 'master-karyawan' }"
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
            icon="ri-user-3-line"
            class="me-2"
          />
          Data Karyawan
        </VCardTitle>
        <VDivider />
        <VCardText>
          <VRow>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="form.nik"
                label="NIK"
                density="compact"
                variant="outlined"
                :rules="[v => !!v || 'NIK wajib diisi']"
                :error-messages="errors.nik"
                :disabled="isEditing"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="form.nama_karyawan"
                label="Nama Karyawan"
                density="compact"
                variant="outlined"
                :rules="[v => !!v || 'Nama karyawan wajib diisi']"
                :error-messages="errors.nama_karyawan"
              />
            </VCol>
            <VCol cols="12">
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
          :to="{ name: 'master-karyawan' }"
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

const { create, update, saving, fetchOne } = useCrud('/master/karyawan')
const { items: perusahaanList, loading: perusahaanLoading, fetchAll: fetchPerusahaan } = useCrud('/master/perusahaan')
const { ensureLoaded: ensurePerusahaanLoaded } = useLazyFetchAll(fetchPerusahaan)

const formRef = ref(null)
const pageLoading = ref(!!id)
const errorMessage = ref('')
const errors = reactive({ nik: [], nama_karyawan: [], perusahaan_id: [], keterangan: [] })

const statusOptions = BOOLEAN_STATUS_OPTIONS

const form = reactive({ nik: '', nama_karyawan: '', perusahaan_id: null, keterangan: '', status: 1 })

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
      text: isEditing.value ? 'Perubahan karyawan berhasil disimpan.' : 'Karyawan berhasil ditambahkan.',
    })
    router.push({ name: 'master-karyawan' })
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

  await ensurePerusahaanLoaded()

  const data = await fetchOne(id)
  if (data) {
    form.nik           = data.nik           ?? ''
    form.nama_karyawan = data.nama_karyawan ?? ''
    form.perusahaan_id = data.perusahaan_id ?? null
    form.keterangan    = data.keterangan    ?? ''
    form.status        = normalizeBooleanStatus(data.status)
  }
  pageLoading.value = false
})
</script>
