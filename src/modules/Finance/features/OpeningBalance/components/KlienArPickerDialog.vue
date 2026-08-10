<template>
  <VDialog
    v-model="isOpen"
    max-width="640"
    scrollable
    persistent
  >
    <VCard rounded="lg">
      <!-- Header -->
      <div class="picker-dialog-header pa-5 pb-4">
        <div class="d-flex align-center justify-space-between">
          <div class="d-flex align-center gap-3">
            <div class="picker-icon">
              <VIcon
                icon="ri-group-line"
                size="22"
                color="white"
              />
            </div>
            <div>
              <div class="text-h6 font-weight-bold">
                Muat Client
              </div>
              <div class="text-caption text-medium-emphasis">
                Pilih Client yang ingin dimuat sebagai baris pengajuan
              </div>
            </div>
          </div>
          <VBtn
            icon
            variant="text"
            size="small"
            color="default"
            :disabled="saving"
            @click="isOpen = false"
          >
            <VIcon
              icon="ri-close-line"
              size="20"
            />
          </VBtn>
        </div>

        <VRow
          dense
          class="mt-4"
        >
          <VCol
            v-if="showPicArFilter"
            cols="12"
            sm="6"
          >
            <VAutocomplete
              v-model="selectedPicArId"
              label="PIC AR"
              placeholder="Pilih PIC AR"
              density="compact"
              variant="outlined"
              clearable
              hide-details
              :items="picArOptions"
              item-title="nama_karyawan"
              item-value="id"
            />
          </VCol>
          <VCol
            cols="12"
            :sm="showPicArFilter ? 6 : 12"
          >
            <VTextField
              v-model="search"
              label="Cari Client"
              placeholder="Nama atau kode Client..."
              density="compact"
              variant="outlined"
              clearable
              hide-details
              prepend-inner-icon="ri-search-line"
            />
          </VCol>
        </VRow>

        <!-- Select all toolbar -->
        <div
          v-if="!loading && visibleKlienList.length"
          class="select-all-bar mt-4"
        >
          <VCheckbox
            :model-value="allSelected"
            :indeterminate="someSelected && !allSelected"
            hide-details
            density="compact"
            color="primary"
            @update:model-value="toggleAll"
          >
            <template #label>
              <span class="text-body-2 font-weight-semibold">
                Pilih Semua ({{ visibleKlienList.length }})
              </span>
            </template>
          </VCheckbox>
        </div>
      </div>

      <VDivider />

      <!-- Body: client checklist -->
      <VCardText
        class="pa-0"
        style="max-height: 420px; overflow-y: auto;"
      >
        <!-- Loading -->
        <div
          v-if="loading"
          class="d-flex justify-center align-center py-10"
        >
          <VProgressCircular
            indeterminate
            color="primary"
            size="32"
          />
        </div>

        <template v-else>
          <!-- Belum pilih PIC AR (Admin/Manager/Supervisor) -->
          <div
            v-if="showPicArFilter && !selectedPicArId && !search"
            class="d-flex flex-column align-center justify-center py-10 text-medium-emphasis"
          >
            <VIcon
              icon="ri-user-search-line"
              size="40"
              class="mb-2 opacity-40"
            />
            <span class="text-body-2">Pilih PIC AR terlebih dahulu untuk menampilkan daftar Client</span>
            <span class="text-caption mt-1">atau ketik nama/kode Client untuk mencari langsung</span>
          </div>

          <!-- Empty -->
          <div
            v-else-if="!visibleKlienList.length"
            class="d-flex flex-column align-center justify-center py-10 text-medium-emphasis"
          >
            <VIcon
              icon="ri-user-line"
              size="40"
              class="mb-2 opacity-40"
            />
            <span class="text-body-2">Tidak ada Client ditemukan</span>
          </div>

          <div
            v-else
            class="px-4 py-4 d-flex flex-column gap-2"
          >
            <div
              v-for="klien in visibleKlienList"
              :key="klien.id"
              class="klien-row"
              :class="{ 'klien-row--checked': checkedIds.includes(klien.id) }"
              @click="toggleCheck(klien.id)"
            >
              <VCheckbox
                :model-value="checkedIds.includes(klien.id)"
                hide-details
                density="compact"
                color="primary"
                class="flex-shrink-0"
                style="pointer-events: none;"
              />
              <div class="flex-grow-1 min-width-0">
                <div class="d-flex align-center gap-2 mb-1 flex-wrap">
                  <span class="text-body-2 font-weight-semibold">{{ klien.nama_klien }}</span>
                  <VChip
                    size="x-small"
                    :color="klien.tipe_klien === 'RESTO' ? 'success' : 'info'"
                    variant="tonal"
                    label
                  >
                    {{ klien.tipe_klien }}
                  </VChip>
                  <span
                    v-if="klien.kode_klien"
                    class="text-caption text-medium-emphasis"
                  >
                    {{ klien.kode_klien }}
                  </span>
                </div>
                <div
                  v-if="klien.karyawan_ar?.nama_karyawan"
                  class="text-caption text-medium-emphasis"
                >
                  PIC: {{ klien.karyawan_ar.nama_karyawan }}
                </div>
                <div
                  v-if="klien.resto?.nama_resto"
                  class="text-caption text-medium-emphasis"
                >
                  {{ klien.resto.nama_resto }}
                </div>
              </div>
            </div>
          </div>
        </template>
      </VCardText>

      <VDivider />

      <!-- Footer -->
      <div class="picker-dialog-footer pa-4">
        <VCheckbox
          v-model="includeLastMonth"
          hide-details
          density="compact"
          color="primary"
          class="mb-2"
          :disabled="saving"
        >
          <template #label>
            <div>
              <div class="text-body-2 font-weight-semibold">
                Sertakan invoice bulan lalu ke Rincian Invoice Asal
              </div>
              <div class="text-caption text-medium-emphasis">
                Otomatis mengisi Rincian Invoice Asal &amp; Saldo Awal dari invoice belum lunas bulan lalu.
              </div>
            </div>
          </template>
        </VCheckbox>

        <div class="d-flex align-center justify-space-between gap-3 flex-wrap">
          <!-- Summary -->
          <div
            v-if="checkedIds.length"
            class="summary-pill"
          >
            <VIcon
              icon="ri-checkbox-circle-fill"
              size="16"
              color="success"
              class="me-1"
            />
            <span class="text-body-2 font-weight-semibold">{{ checkedIds.length }} Client dipilih</span>
          </div>
          <div
            v-else
            class="text-caption text-medium-emphasis"
          >
            Pilih minimal 1 Client
          </div>

          <!-- Actions -->
          <div class="d-flex gap-2 ms-auto">
            <AppActionButton
              action="batalkan"
              size="small"
              :disabled="saving"
              @click="isOpen = false"
            />
            <AppActionButton
              action="custom"
              size="small"
              icon="ri-download-2-line"
              :loading="saving"
              :disabled="!checkedIds.length || saving"
              @click="doConfirm"
            >
              Muat Terpilih
            </AppActionButton>
          </div>
        </div>
      </div>
    </VCard>
  </VDialog>
</template>

<script setup>
/* eslint-disable camelcase */
import { computed, ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  klienList: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  preselectedIds: { type: Array, default: () => [] },
  showPicArFilter: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const isOpen = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const search = ref('')
const selectedPicArId = ref(null)
const checkedIds = ref([])
const includeLastMonth = ref(true)

const picArOptions = computed(() => {
  const seen = new Map()

  props.klienList.forEach(klien => {
    if (klien.karyawan_ar_id && klien.karyawan_ar?.nama_karyawan && !seen.has(klien.karyawan_ar_id))
      seen.set(klien.karyawan_ar_id, { id: klien.karyawan_ar_id, nama_karyawan: klien.karyawan_ar.nama_karyawan })
  })

  return [...seen.values()].sort((a, b) => a.nama_karyawan.localeCompare(b.nama_karyawan, 'id'))
})

const visibleKlienList = computed(() => {
  let list = props.klienList

  if (props.showPicArFilter && selectedPicArId.value)
    list = list.filter(k => k.karyawan_ar_id === selectedPicArId.value)

  const term = search.value.trim().toLowerCase()
  if (term) {
    list = list.filter(k =>
      (k.nama_klien ?? '').toLowerCase().includes(term)
      || (k.kode_klien ?? '').toLowerCase().includes(term))
  }

  if (props.showPicArFilter && !selectedPicArId.value && !term) return []

  return list
})

const allSelected = computed(() =>
  visibleKlienList.value.length > 0
  && visibleKlienList.value.every(k => checkedIds.value.includes(k.id)))

const someSelected = computed(() =>
  visibleKlienList.value.some(k => checkedIds.value.includes(k.id)))

function toggleCheck(id) {
  const idx = checkedIds.value.indexOf(id)
  if (idx === -1) checkedIds.value.push(id)
  else checkedIds.value.splice(idx, 1)
}

function toggleAll(val) {
  const visibleIds = visibleKlienList.value.map(k => k.id)
  if (val) {
    const merged = new Set([...checkedIds.value, ...visibleIds])
    checkedIds.value = [...merged]
  } else {
    checkedIds.value = checkedIds.value.filter(id => !visibleIds.includes(id))
  }
}

watch(isOpen, open => {
  if (!open) return

  const validIds = new Set(props.klienList.map(k => k.id))

  checkedIds.value = props.preselectedIds.filter(id => validIds.has(id))
  search.value = ''
  selectedPicArId.value = null
})

function doConfirm() {
  const selected = props.klienList.filter(k => checkedIds.value.includes(k.id))
  if (!selected.length) return
  emit('confirm', { klien: selected, includeLastMonth: includeLastMonth.value })
}
</script>

<style scoped>
.picker-dialog-header {
  background: rgb(var(--v-theme-surface));
}

.picker-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgb(var(--v-theme-primary));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.select-all-bar {
  display: flex;
  align-items: center;
  background: rgba(var(--v-theme-primary), 0.06);
  border: 1px solid rgba(var(--v-theme-primary), 0.15);
  border-radius: 10px;
  padding: 4px 14px;
}

.klien-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  background: rgb(var(--v-theme-surface));
}

.klien-row:hover {
  border-color: rgba(var(--v-theme-primary), 0.4);
  background: rgba(var(--v-theme-primary), 0.03);
}

.klien-row--checked {
  border-color: rgba(var(--v-theme-primary), 0.5);
  background: rgba(var(--v-theme-primary), 0.06);
}

.picker-dialog-footer {
  background: rgb(var(--v-theme-surface));
}

.summary-pill {
  display: inline-flex;
  align-items: center;
  background: rgba(var(--v-theme-success), 0.1);
  border: 1px solid rgba(var(--v-theme-success), 0.25);
  border-radius: 20px;
  padding: 4px 12px;
}
</style>
