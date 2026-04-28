<template>
  <BaseModal
    :model-value="modelValue"
    :title="isEditing ? 'Edit Investor' : 'Tambah Investor'"
    :loading="saving"
    @update:model-value="$emit('update:modelValue', $event)"
    @confirm="handleSubmit"
  >
    <VForm ref="formRef">
      <VRow>
        <VCol cols="12">
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
          <BaseSelect
            v-model="form.status"
            label="Status"
            :items="statusOptions"
            item-title="label"
            item-value="value"
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
  investorData: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const { create, update, saving } = useCrud('/master/investor')

const formRef      = ref(null)
const errorMessage = ref('')

const errors = reactive({
  nama_investor: [], ktp: [], npwp: [], no_hp: [],
  pengelola: [], no_hp_pengelola: [], alamat: [], keterangan: [],
})

const isEditing = computed(() => !!props.investorData)

const statusOptions = BOOLEAN_STATUS_OPTIONS

const defaultForm = () => ({
  nama_investor: '',
  ktp: '',
  npwp: '',
  no_hp: '',
  pengelola: '',
  no_hp_pengelola: '',
  alamat: '',
  keterangan: '',
  status: 1,
})

const form = reactive(defaultForm())

watch(() => props.modelValue, val => {
  if (val) {
    Object.assign(errors, {
      nama_investor: [], ktp: [], npwp: [], no_hp: [],
      pengelola: [], no_hp_pengelola: [], alamat: [], keterangan: [],
    })
    errorMessage.value = ''

    if (props.investorData) {
      Object.assign(form, {
        nama_investor: props.investorData.nama_investor   ?? '',
        ktp: props.investorData.ktp             ?? '',
        npwp: props.investorData.npwp            ?? '',
        no_hp: props.investorData.no_hp           ?? '',
        pengelola: props.investorData.pengelola       ?? '',
        no_hp_pengelola: props.investorData.no_hp_pengelola ?? '',
        alamat: props.investorData.alamat          ?? '',
        keterangan: props.investorData.keterangan      ?? '',
        status: normalizeBooleanStatus(props.investorData.status),
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

  const payload = { ...form }

  const res = isEditing.value
    ? await update(props.investorData.id, payload)
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
