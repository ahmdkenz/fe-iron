<template>
  <div>
    <PageHeader 
      :title="isEditing ? 'Edit Role' : 'Tambah Role'" 
      subtitle="Kelola hak akses pengguna sistem"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Data Role', to: '/iam/roles' },
        { title: isEditing ? 'Edit Role' : 'Tambah Role', disabled: true }
      ]"
    >
      <VBtn
        variant="tonal"
        color="secondary"
        :to="{ name: 'iam-roles' }"
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
            icon="ri-shield-keyhole-line"
            class="me-2"
          />
          Informasi Role
        </VCardTitle>
        <VDivider />
        <VCardText>
          <VRow>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="form.name"
                label="Kode Role"
                density="compact"
                variant="outlined"
                hint="Bisa uppercase atau lowercase. Contoh: ADMIN, DIREKTUR, MANAGER, SUPERVISOR, AR, AP"
                persistent-hint
                :rules="[v => !!v || 'Kode wajib diisi']"
                :error-messages="errors.name"
                :disabled="isEditing"
                autocapitalize="off"
                spellcheck="false"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="form.nama_role"
                label="Nama Tampilan"
                density="compact"
                variant="outlined"
                :rules="[v => !!v || 'Nama tampilan wajib diisi']"
                :error-messages="errors.nama_role"
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
          :to="{ name: 'iam-roles' }"
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

const { create, update, saving, fetchOne } = useCrud('/iam/roles')

const formRef = ref(null)
const pageLoading = ref(!!id)
const errorMessage = ref('')
const errors = reactive({ name: [], nama_role: [], keterangan: [] })

const statusOptions = BOOLEAN_STATUS_OPTIONS

const form = reactive({ name: '', nama_role: '', keterangan: '', status: 1 })

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
      text: isEditing.value ? 'Perubahan role berhasil disimpan.' : 'Role berhasil ditambahkan.',
    })
    router.push({ name: 'iam-roles' })
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
    form.name       = data.name       ?? ''
    form.nama_role  = data.nama_role  ?? ''
    form.keterangan = data.keterangan ?? ''
    form.status     = normalizeBooleanStatus(data.status)
  }
  pageLoading.value = false
})
</script>
