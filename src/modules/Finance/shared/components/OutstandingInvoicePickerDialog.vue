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
                icon="ri-download-2-line"
                size="22"
                color="white"
              />
            </div>
            <div>
              <div class="text-h6 font-weight-bold">
                Pilih Invoice Outstanding
              </div>
              <div class="text-caption text-medium-emphasis">
                Pilih invoice periode sebelumnya untuk dimuat ke rincian
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

        <!-- Select all toolbar -->
        <div
          v-if="!loading && invoices.length"
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
                Pilih Semua ({{ invoices.length }})
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
            v-if="!invoices.length"
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
              v-for="inv in invoices"
              :key="inv.no_invoice"
              class="invoice-row"
              :class="{ 'invoice-row--checked': checkedNos.includes(inv.no_invoice) }"
              @click="toggleCheck(inv.no_invoice)"
            >
              <VCheckbox
                :model-value="checkedNos.includes(inv.no_invoice)"
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
                    {{ formatDate(inv.tanggal_invoice) }}
                  </span>
                </div>
                <div class="text-caption text-medium-emphasis">
                  Total: <strong>{{ formatCurrency(inv.subtotal) }}</strong>
                  <span class="ms-2 text-error font-weight-medium">
                    · Sisa: {{ formatCurrency(inv.sisa_tagihan) }}
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
            v-if="checkedNos.length"
            class="summary-pill"
          >
            <VIcon
              icon="ri-checkbox-circle-fill"
              size="16"
              color="success"
              class="me-1"
            />
            <span class="text-body-2 font-weight-semibold">{{ checkedNos.length }} dipilih</span>
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
            <VBtn
              variant="text"
              color="secondary"
              size="small"
              @click="isOpen = false"
            >
              Batal
            </VBtn>
            <VBtn
              color="primary"
              size="small"
              :disabled="!checkedNos.length"
              prepend-icon="ri-download-2-line"
              @click="doConfirm"
            >
              Muat Terpilih
            </VBtn>
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
  invoices: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  preselectedNos: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const { formatCurrency, formatDate } = useFormatter()

const isOpen = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const checkedNos = ref([])

const allSelected = computed(() =>
  props.invoices.length > 0 && checkedNos.value.length === props.invoices.length)

const someSelected = computed(() => checkedNos.value.length > 0)

const totalSisa = computed(() =>
  props.invoices
    .filter(inv => checkedNos.value.includes(inv.no_invoice))
    .reduce((sum, inv) => sum + (Number(inv.sisa_tagihan) || 0), 0))

function toggleCheck(no) {
  const idx = checkedNos.value.indexOf(no)
  if (idx === -1) checkedNos.value.push(no)
  else checkedNos.value.splice(idx, 1)
}

function toggleAll(val) {
  checkedNos.value = val ? props.invoices.map(inv => inv.no_invoice) : []
}

watch(isOpen, open => {
  if (!open) return

  const validNos = new Set(props.invoices.map(inv => inv.no_invoice))

  checkedNos.value = props.preselectedNos.filter(no => validNos.has(no))
})

function doConfirm() {
  const selected = props.invoices.filter(inv => checkedNos.value.includes(inv.no_invoice))
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
