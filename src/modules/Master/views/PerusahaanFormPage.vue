<template>
  <div>
    <PageHeader 
      :title="isEditing ? 'Edit Perusahaan' : 'Tambah Perusahaan'" 
      subtitle="Kelola data perusahaan"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Perusahaan', to: { name: 'master-perusahaan' } },
        { title: isEditing ? 'Edit Perusahaan' : 'Tambah Perusahaan', disabled: true }
      ]"
    >
      <VBtn
        variant="tonal"
        color="secondary"
        :to="{ name: 'master-perusahaan' }"
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
            icon="ri-building-2-line"
            class="me-2"
          />
          Identitas Perusahaan
        </VCardTitle>
        <VDivider />
        <VCardText>
          <VRow>
            <VCol
              cols="12"
              md="4"
            >
              <VTextField
                v-model="form.kode_perusahaan"
                label="Kode Perusahaan"
                density="compact"
                variant="outlined"
                hint="Contoh: PT-ABC, CV-XYZ"
                persistent-hint
                :rules="[v => !!v || 'Kode wajib diisi']"
                :error-messages="errors.kode_perusahaan"
                :disabled="isEditing"
                @input="form.kode_perusahaan = form.kode_perusahaan.toUpperCase()"
              />
            </VCol>
            <VCol
              cols="12"
              md="4"
            >
              <VTextField
                v-model="form.nama_singkatan_perusahaan"
                label="Singkatan"
                density="compact"
                variant="outlined"
                hint="Contoh: ABC, XYZ"
                persistent-hint
                :rules="[v => !!v || 'Singkatan wajib diisi']"
                :error-messages="errors.nama_singkatan_perusahaan"
                @input="form.nama_singkatan_perusahaan = form.nama_singkatan_perusahaan.toUpperCase()"
              />
            </VCol>
            <VCol
              cols="12"
              md="4"
            >
              <VTextField
                v-model="form.nama_perusahaan"
                label="Nama Perusahaan"
                density="compact"
                variant="outlined"
                :rules="[v => !!v || 'Nama perusahaan wajib diisi']"
                :error-messages="errors.nama_perusahaan"
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

      <!-- Kontak -->
      <VCard class="mb-4">
        <VCardTitle class="pa-4 pb-2">
          <VIcon
            icon="ri-contacts-line"
            class="me-2"
          />
          Informasi Kontak
        </VCardTitle>
        <VDivider />
        <VCardText>
          <VRow>
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
                v-model="form.kota"
                label="Kota"
                density="compact"
                variant="outlined"
                :error-messages="errors.kota"
              />
            </VCol>
            <VCol
              cols="12"
              md="4"
            >
              <VTextField
                v-model="form.kode_pos"
                label="Kode POS"
                density="compact"
                variant="outlined"
                :error-messages="errors.kode_pos"
              />
            </VCol>
            <VCol
              cols="12"
              md="4"
            >
              <VTextField
                v-model="form.no_telp"
                label="No. Telepon"
                density="compact"
                variant="outlined"
                :error-messages="errors.no_telp"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="form.email"
                label="Email"
                density="compact"
                variant="outlined"
                type="email"
                :error-messages="errors.email"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="form.no_npwp"
                label="NPWP"
                density="compact"
                variant="outlined"
                hint="Contoh: 12.345.678.9-012.000"
                persistent-hint
                :error-messages="errors.no_npwp"
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
          :to="{ name: 'master-perusahaan' }"
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

const { create, update, saving, fetchOne } = useCrud('/master/perusahaan')

const formRef = ref(null)
const pageLoading = ref(!!id)
const errorMessage = ref('')

const errors = reactive({
  kode_perusahaan: [], nama_perusahaan: [], nama_singkatan_perusahaan: [],
  keterangan: [], alamat: [], kota: [], kode_pos: [], no_telp: [], email: [], no_npwp: [],
})

const statusOptions = BOOLEAN_STATUS_OPTIONS

const form = reactive({
  kode_perusahaan: '', nama_perusahaan: '', nama_singkatan_perusahaan: '',
  keterangan: '', alamat: '', kota: '', kode_pos: '', no_telp: '', email: '', no_npwp: '', status: 1,
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
      text: isEditing.value ? 'Perubahan perusahaan berhasil disimpan.' : 'Perusahaan berhasil ditambahkan.',
    })
    router.push({ name: 'master-perusahaan' })
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
    form.kode_perusahaan           = data.kode_perusahaan           ?? ''
    form.nama_perusahaan           = data.nama_perusahaan           ?? ''
    form.nama_singkatan_perusahaan = data.nama_singkatan_perusahaan ?? ''
    form.keterangan                = data.keterangan                ?? ''
    form.alamat                    = data.alamat                    ?? ''
    form.kota                      = data.kota                      ?? ''
    form.kode_pos                  = data.kode_pos                  ?? ''
    form.no_telp                   = data.no_telp                   ?? ''
    form.email                     = data.email                     ?? ''
    form.no_npwp                   = data.no_npwp                   ?? ''
    form.status                    = normalizeBooleanStatus(data.status)
  }
  pageLoading.value = false
})
</script>
