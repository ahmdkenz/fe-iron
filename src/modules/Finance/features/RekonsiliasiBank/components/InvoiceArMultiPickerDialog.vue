<template>
  <VDialog
    v-model="isOpen"
    max-width="720"
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
                icon="ri-file-list-3-line"
                size="22"
                color="white"
              />
            </div>
            <div>
              <div class="text-h6 font-weight-bold">
                Pilih Invoice
              </div>
              <div class="text-caption text-medium-emphasis">
                Bisa pilih dari resto/investor berbeda sekaligus, asal 1 entitas penagih
              </div>
            </div>
          </div>
          <VBtn
            icon
            variant="text"
            size="small"
            color="default"
            @click="isOpen = false"
          >
            <VIcon
              icon="ri-close-line"
              size="20"
            />
          </VBtn>
        </div>

        <VTextField
          v-model="search"
          placeholder="Cari no. invoice / nama klien / resto..."
          clearable
          hide-details
          density="compact"
          variant="outlined"
          class="mt-4"
          prepend-inner-icon="ri-search-line"
          @update:model-value="onSearch"
        />

        <!-- Select all toolbar -->
        <div
          v-if="!loading && invoiceList.length"
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
                Pilih Semua ({{ invoiceList.length }})
              </span>
            </template>
          </VCheckbox>
        </div>
      </div>

      <VDivider />

      <!-- Body: invoice checklist -->
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
          <!-- Empty -->
          <div
            v-if="!invoiceList.length"
            class="d-flex flex-column align-center justify-center py-10 text-medium-emphasis"
          >
            <VIcon
              icon="ri-file-list-3-line"
              size="40"
              class="mb-2 opacity-40"
            />
            <span class="text-body-2">Tidak ada invoice outstanding</span>
          </div>

          <div
            v-else
            class="px-4 py-4 d-flex flex-column gap-2"
          >
            <div
              v-for="inv in invoiceList"
              :key="inv.id"
              class="invoice-row"
              :class="{ 'invoice-row--checked': checkedIds.includes(inv.id), 'invoice-row--disabled': disabledIds.includes(inv.id) }"
              @click="toggleCheck(inv)"
            >
              <VCheckbox
                :model-value="checkedIds.includes(inv.id)"
                :disabled="disabledIds.includes(inv.id)"
                hide-details
                density="compact"
                color="primary"
                class="flex-shrink-0"
                style="pointer-events: none;"
              />
              <div class="flex-grow-1 min-width-0">
                <div class="d-flex align-center gap-2 mb-1 flex-wrap">
                  <span class="text-body-2 font-weight-semibold">{{ inv.no_invoice }}</span>
                  <VChip
                    size="x-small"
                    :color="inv.status === 'SEBAGIAN' ? 'warning' : 'secondary'"
                    variant="tonal"
                    label
                  >
                    {{ inv.status }}
                  </VChip>
                  <span class="text-caption text-medium-emphasis">
                    {{ formatDate(inv.tanggal) }}
                  </span>
                  <span
                    v-if="disabledIds.includes(inv.id)"
                    class="text-caption text-success"
                  >
                    &bull; Sudah ditambahkan
                  </span>
                </div>
                <div class="text-caption text-medium-emphasis">
                  <VIcon
                    icon="ri-user-3-line"
                    size="12"
                    class="me-1"
                  />{{ inv.nama_klien ?? '-' }}
                  <span
                    v-if="inv.nama_resto"
                    class="ms-2"
                  >
                    <VIcon
                      icon="ri-store-2-line"
                      size="12"
                      class="me-1"
                    />{{ inv.nama_resto }}
                  </span>
                  <span class="ms-2">Total: <strong>{{ formatCurrency(inv.total_tagihan) }}</strong></span>
                  <span class="ms-2 text-error font-weight-medium">
                    &middot; Sisa: {{ formatCurrency(inv.sisa_tagihan) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </VCardText>

      <VDivider />

      <!-- Footer -->
      <div class="picker-dialog-footer pa-4">
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
            <span class="text-body-2 font-weight-semibold">{{ checkedIds.length }} dipilih</span>
            <VDivider
              vertical
              class="mx-2"
              style="height: 14px; align-self: center;"
            />
            <span class="text-body-2 font-weight-bold text-primary">{{ formatCurrency(totalSisa) }}</span>
          </div>
          <div
            v-else
            class="text-caption text-medium-emphasis"
          >
            Pilih minimal 1 invoice
          </div>

          <!-- Actions -->
          <div class="d-flex gap-2 ms-auto">
            <AppActionButton
              action="batalkan"
              size="small"
              @click="isOpen = false"
            />
            <AppActionButton
              action="custom"
              size="small"
              icon="ri-download-2-line"
              :disabled="!checkedIds.length"
              @click="doConfirm"
            >
              Tambahkan Terpilih
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
import { useFormatter } from '@/composables/useFormatter'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  invoiceList: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  disabledIds: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue', 'confirm', 'search'])

const { formatCurrency, formatDate } = useFormatter()

const isOpen = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const search = ref('')
const checkedIds = ref([])

const selectableList = computed(() => props.invoiceList.filter(inv => !props.disabledIds.includes(inv.id)))

const allSelected = computed(() =>
  selectableList.value.length > 0 && checkedIds.value.length === selectableList.value.length)

const someSelected = computed(() => checkedIds.value.length > 0)

const totalSisa = computed(() =>
  props.invoiceList
    .filter(inv => checkedIds.value.includes(inv.id))
    .reduce((sum, inv) => sum + (Number(inv.sisa_tagihan) || 0), 0))

function toggleCheck(inv) {
  if (props.disabledIds.includes(inv.id)) return
  const idx = checkedIds.value.indexOf(inv.id)
  if (idx === -1) checkedIds.value.push(inv.id)
  else checkedIds.value.splice(idx, 1)
}

function toggleAll(val) {
  checkedIds.value = val ? selectableList.value.map(inv => inv.id) : []
}

let debounceTimer = null
function onSearch(val) {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => emit('search', val), 400)
}

watch(isOpen, open => {
  if (!open) return

  search.value = ''
  checkedIds.value = []
})

function doConfirm() {
  const selected = props.invoiceList.filter(inv => checkedIds.value.includes(inv.id))
  if (!selected.length) return
  emit('confirm', selected)
  isOpen.value = false
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

.invoice-row {
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

.invoice-row:hover {
  border-color: rgba(var(--v-theme-primary), 0.4);
  background: rgba(var(--v-theme-primary), 0.03);
}

.invoice-row--checked {
  border-color: rgba(var(--v-theme-primary), 0.5);
  background: rgba(var(--v-theme-primary), 0.06);
}

.invoice-row--disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
