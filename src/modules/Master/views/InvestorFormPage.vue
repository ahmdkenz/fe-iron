<template>
  <div>
    <PageHeader 
      :title="isEditing ? 'Edit Investor' : 'Tambah Investor'" 
      subtitle="Kelola data investor"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Investor', to: { name: 'master-investor' } },
        { title: isEditing ? 'Edit Investor' : 'Tambah Investor', disabled: true }
      ]"
    >
      <VBtn
        variant="tonal"
        color="secondary"
        :to="{ name: 'master-investor' }"
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
      <!-- Data Investor -->
      <VCard class="mb-4">
        <VCardTitle class="pa-4 pb-2">
          <VIcon
            icon="ri-user-star-line"
            class="me-2"
          />
          Data Investor
        </VCardTitle>
        <VDivider />
        <VCardText>
          <VRow>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="form.nama_investor"
                label="Nama Investor"
                density="compact"
                variant="outlined"
                :rules="[v => !!v || 'Nama investor wajib diisi']"
                :error-messages="errors.nama_investor"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="form.no_hp"
                label="No. HP"
                density="compact"
                variant="outlined"
                :error-messages="errors.no_hp"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="form.ktp"
                label="No. KTP"
                density="compact"
                variant="outlined"
                :error-messages="errors.ktp"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="form.npwp"
                label="NPWP"
                density="compact"
                variant="outlined"
                :error-messages="errors.npwp"
              />
            </VCol>
            <VCol cols="12">
              <VTextField
                v-model="form.alamat"
                label="Alamat"
                density="compact"
                variant="outlined"
                :error-messages="errors.alamat"
              />
            </VCol>
          </VRow>
        </VCardText>
      </VCard>

      <!-- Data Pengelola -->
      <VCard class="mb-4">
        <VCardTitle class="pa-4 pb-2">
          <VIcon
            icon="ri-user-settings-line"
            class="me-2"
          />
          Data Pengelola
        </VCardTitle>
        <VDivider />
        <VCardText>
          <VRow>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="form.pengelola"
                label="Nama Pengelola"
                density="compact"
                variant="outlined"
                :error-messages="errors.pengelola"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="form.no_hp_pengelola"
                label="No. HP Pengelola"
                density="compact"
                variant="outlined"
                :error-messages="errors.no_hp_pengelola"
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
          :to="{ name: 'master-investor' }"
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

const { create, update, saving, fetchOne } = useCrud('/master/investor')

const formRef = ref(null)
const pageLoading = ref(!!id)
const errorMessage = ref('')

const errors = reactive({
  nama_investor: [], ktp: [], npwp: [], no_hp: [],
  pengelola: [], no_hp_pengelola: [], alamat: [], keterangan: [],
})

const statusOptions = BOOLEAN_STATUS_OPTIONS

const form = reactive({
  nama_investor: '', ktp: '', npwp: '', no_hp: '',
  pengelola: '', no_hp_pengelola: '', alamat: '', keterangan: '', status: 1,
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
      text: isEditing.value ? 'Perubahan investor berhasil disimpan.' : 'Investor berhasil ditambahkan.',
    })
    router.push({ name: 'master-investor' })
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
    form.nama_investor   = data.nama_investor   ?? ''
    form.ktp             = data.ktp             ?? ''
    form.npwp            = data.npwp            ?? ''
    form.no_hp           = data.no_hp           ?? ''
    form.pengelola       = data.pengelola       ?? ''
    form.no_hp_pengelola = data.no_hp_pengelola ?? ''
    form.alamat          = data.alamat          ?? ''
    form.keterangan      = data.keterangan      ?? ''
    form.status          = normalizeBooleanStatus(data.status)
  }
  pageLoading.value = false
})
</script>
