<template>
  <VDialog
    v-model="isOpen"
    max-width="480"
    persistent
  >
    <VCard class="overflow-hidden">
      <!-- Gradient band -->
      <div
        class="action-band"
        :class="[action === 'approve' ? 'action-band--success' : 'action-band--error']"
      >
        <VBtn
          icon
          variant="text"
          size="small"
          class="action-band-close"
          @click="$emit('close')"
        >
          <VIcon
            icon="ri-close-line"
            size="20"
            color="white"
          />
        </VBtn>
      </div>

      <!-- Floating avatar + title -->
      <div class="action-hero text-center">
        <VAvatar
          :color="action === 'approve' ? 'success' : 'error'"
          size="68"
          class="action-avatar"
        >
          <VIcon
            :icon="action === 'approve' ? 'ri-check-double-line' : 'ri-close-circle-line'"
            size="32"
            color="white"
          />
        </VAvatar>
        <div class="text-h6 font-weight-bold mt-3">
          {{ action === 'approve' ? 'Setujui Koreksi' : 'Tolak Koreksi' }}
        </div>
        <div class="text-body-2 text-medium-emphasis mt-1">
          {{ action === 'approve'
            ? 'Pastikan data sudah benar sebelum menyetujui.'
            : 'Berikan alasan penolakan yang jelas.' }}
        </div>
      </div>

      <VDivider class="mt-4" />

      <VCardText class="pa-5">
        <!-- Info summary -->
        <div class="info-box rounded-lg pa-4 mb-4">
          <div class="d-flex justify-space-between align-center mb-3">
            <span class="info-label d-flex align-center gap-1">
              <VIcon
                icon="ri-store-2-line"
                size="15"
              />
              Vendor
            </span>
            <span class="text-body-2 font-weight-semibold">{{ koreksi?.nama_vendor }}</span>
          </div>
          <div
            v-if="koreksi?.no_tagihan"
            class="d-flex justify-space-between align-center mb-3"
          >
            <span class="info-label d-flex align-center gap-1">
              <VIcon
                icon="ri-bill-line"
                size="15"
              />
              Tagihan Tertaut
            </span>
            <span class="text-body-2 font-weight-semibold">{{ koreksi?.no_tagihan }}</span>
          </div>
          <div class="d-flex justify-space-between align-center mb-3">
            <span class="info-label d-flex align-center gap-1">
              <VIcon
                icon="ri-money-dollar-circle-line"
                size="15"
              />
              Nilai Koreksi
            </span>
            <span
              class="text-body-2 font-weight-bold"
              :class="(koreksi?.nilai_koreksi ?? 0) >= 0 ? 'text-success' : 'text-error'"
            >
              {{ (koreksi?.nilai_koreksi ?? 0) >= 0 ? '+' : '' }}{{ formatRp(koreksi?.nilai_koreksi) }}
            </span>
          </div>
          <div class="d-flex justify-space-between align-center mb-3">
            <span class="info-label d-flex align-center gap-1">
              <VIcon
                icon="ri-price-tag-3-line"
                size="15"
              />
              Tipe
            </span>
            <VChip
              size="x-small"
              :color="tipeBadgeColor(koreksi?.tipe)"
              label
            >
              {{ tipeLabel(koreksi?.tipe) }}
            </VChip>
          </div>
          <div
            v-if="koreksi?.no_dokumen"
            class="d-flex justify-space-between align-center mb-3"
          >
            <span class="info-label d-flex align-center gap-1">
              <VIcon
                icon="ri-file-text-line"
                size="15"
              />
              No Dokumen
            </span>
            <span class="text-body-2 font-weight-semibold">{{ koreksi?.no_dokumen }}</span>
          </div>
          <div class="d-flex justify-space-between align-start gap-4">
            <span class="info-label d-flex align-center gap-1 flex-shrink-0">
              <VIcon
                icon="ri-chat-1-line"
                size="15"
              />
              Alasan
            </span>
            <span class="text-body-2 text-right">{{ koreksi?.alasan_koreksi ?? '-' }}</span>
          </div>
        </div>

        <!-- Keterangan -->
        <VTextarea
          :model-value="keterangan"
          :label="action === 'reject' ? 'Keterangan (Wajib)' : 'Keterangan (Opsional)'"
          :placeholder="action === 'reject'
            ? 'Tuliskan alasan penolakan...'
            : 'Tambahkan catatan jika diperlukan...'"
          rows="3"
          auto-grow
          variant="outlined"
          density="compact"
          hide-details="auto"
          :error-messages="error ? [error] : []"
          @update:model-value="$emit('update:keterangan', $event)"
        />
      </VCardText>

      <VDivider />
      <VCardActions class="pa-4 justify-end gap-2">
        <AppActionButton
          action="batalkan"
          @click="$emit('close')"
        />
        <AppActionButton
          action="custom"
          :color="action === 'approve' ? 'success' : 'error'"
          :icon="action === 'approve' ? 'ri-check-line' : 'ri-close-line'"
          :loading="loading"
          @click="$emit('confirm')"
        >
          {{ action === 'approve' ? 'Setujui' : 'Tolak' }}
        </AppActionButton>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script setup>
defineProps({
  action: { type: String, default: 'approve' },
  koreksi: { type: Object, default: null },
  keterangan: { type: String, default: '' },
  error: { type: String, default: '' },
  loading: { type: Boolean, default: false },
})
defineEmits(['update:keterangan', 'close', 'confirm'])

const isOpen = defineModel({ type: Boolean, default: false })

function formatRp(val) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val ?? 0)
}

function tipeBadgeColor(tipe) {
  return { CREDIT_NOTE: 'error', DEBIT_NOTE: 'info', KOREKSI_SALDO: 'secondary' }[tipe] ?? 'default'
}

function tipeLabel(tipe) {
  return { CREDIT_NOTE: 'CN', DEBIT_NOTE: 'DN', KOREKSI_SALDO: 'Koreksi Saldo' }[tipe] ?? (tipe || '—')
}
</script>

<style scoped>
.action-band {
  height: 88px;
  position: relative;
  flex-shrink: 0;
}

.action-band--success {
  background: linear-gradient(135deg, rgb(var(--v-theme-success)) 0%, rgba(var(--v-theme-success), 0.65) 100%);
}

.action-band--error {
  background: linear-gradient(135deg, rgb(var(--v-theme-error)) 0%, rgba(var(--v-theme-error), 0.65) 100%);
}

.action-band-close {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0.85;
  transition: opacity 0.2s;
}

.action-band-close:hover {
  opacity: 1;
}

.action-hero {
  margin-top: -34px;
  padding: 0 24px 4px;
}

.action-avatar {
  border: 4px solid rgb(var(--v-theme-surface));
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.info-box {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.info-label {
  font-size: 0.8125rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
  white-space: nowrap;
}
</style>
