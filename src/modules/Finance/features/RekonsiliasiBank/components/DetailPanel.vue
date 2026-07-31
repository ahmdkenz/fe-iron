<template>
  <VCard
    class="detail-panel d-flex flex-column"
    :class="{ 'detail-panel--compact': compact }"
  >
    <VCardTitle class="d-flex align-center justify-space-between pa-4 pb-2">
      <span class="text-body-1 font-weight-medium">Detail Mutasi Terpilih</span>
      <VBtn
        v-if="closable"
        icon="ri-close-line"
        variant="text"
        size="small"
        @click="$emit('close')"
      />
    </VCardTitle>
    <VDivider />

    <div
      v-if="!item"
      class="flex-1-1 d-flex align-center justify-center pa-6 text-center"
    >
      <div class="text-caption text-medium-emphasis">
        Pilih baris transaksi pada tabel untuk melihat detailnya di sini.
      </div>
    </div>

    <template v-else>
      <VCardText
        class="flex-1-1"
        style="overflow-y: auto;"
      >
        <div
          class="text-h5 font-weight-bold mb-1"
          :class="item.kredit > 0 ? 'text-success' : 'text-warning'"
        >
          {{ item.kredit > 0 ? '+' : '-' }}{{ formatCurrency(item.kredit > 0 ? item.kredit : item.debit) }}
        </div>
        <div class="text-body-2 mb-1">
          {{ item.keterangan }}
        </div>
        <div class="text-caption text-medium-emphasis mb-4">
          {{ item.tanggal }}
        </div>

        <div
          class="text-caption text-medium-emphasis text-uppercase font-weight-medium mb-2"
          style="letter-spacing: 0.6px"
        >
          Informasi Mutasi
        </div>
        <div class="d-flex flex-column gap-2 mb-4">
          <div class="d-flex justify-space-between">
            <span class="text-caption text-medium-emphasis">Referensi</span>
            <span class="text-caption font-weight-medium">{{ item.no_referensi || '-' }}</span>
          </div>
          <div class="d-flex justify-space-between">
            <span class="text-caption text-medium-emphasis">Tipe Transaksi</span>
            <span class="text-caption font-weight-medium">{{ item.kredit > 0 ? 'Kredit' : 'Debit' }}</span>
          </div>
          <div class="d-flex justify-space-between">
            <span class="text-caption text-medium-emphasis">Saldo</span>
            <span class="text-caption font-weight-medium">{{ formatCurrency(item.saldo) }}</span>
          </div>
          <div class="d-flex justify-space-between align-center">
            <span class="text-caption text-medium-emphasis">Status</span>
            <VChip
              :color="statusColor(item.status_cocok)"
              size="x-small"
              variant="tonal"
              label
            >
              {{ item.status_cocok }}
            </VChip>
          </div>
          <div
            v-if="item.matched_by || item.status_cocok === 'MATCHED'"
            class="d-flex justify-space-between"
          >
            <span class="text-caption text-medium-emphasis">Dicocokkan Oleh</span>
            <span class="text-caption font-weight-medium">{{ item.matched_by || uploadedBy || '-' }}</span>
          </div>
          <div
            v-if="item.selisih_bank !== null && item.selisih_bank !== undefined"
            class="d-flex justify-space-between"
          >
            <span class="text-caption text-medium-emphasis">Selisih</span>
            <span
              class="text-caption font-weight-medium"
              :class="selisihClass"
            >
              {{ selisihLabel }}
            </span>
          </div>
        </div>

        <template v-if="item.pembayaran">
          <div
            class="text-caption text-medium-emphasis text-uppercase font-weight-medium mb-2"
            style="letter-spacing: 0.6px"
          >
            Cocok Dengan
          </div>
          <VSheet
            color="grey-lighten-4"
            rounded
            class="pa-3 mb-4"
          >
            <RouterLink
              v-if="item.pembayaran.invoice_id"
              :to="{ name: 'finance-invoice-show', params: { id: item.pembayaran.invoice_id } }"
              class="text-primary text-decoration-none font-weight-medium d-block"
            >
              {{ item.pembayaran.no_invoice }}
            </RouterLink>
            <VChip
              v-else-if="item.pembayaran.jumlah_invoice"
              size="x-small"
              color="primary"
              variant="tonal"
              label
              class="mb-1"
            >
              {{ item.pembayaran.jumlah_invoice }} Invoice
            </VChip>
            <div class="text-caption text-medium-emphasis">
              {{ item.pembayaran.klien ?? item.pembayaran.vendor }}
            </div>
          </VSheet>
        </template>

        <template v-if="item.kelebihan_bayar?.sisa > 0 || item.kelebihan_bayar?.total > 0">
          <div
            class="text-caption text-medium-emphasis text-uppercase font-weight-medium mb-2"
            style="letter-spacing: 0.6px"
          >
            Kelebihan Bayar
          </div>
          <div class="mb-4">
            <template v-if="item.kelebihan_bayar.sisa > 0">
              <div class="text-caption text-error font-weight-medium mb-2">
                {{ formatCurrency(item.kelebihan_bayar.sisa) }}
              </div>
              <AppActionButton
                v-if="item.can_manage_match"
                action="gunakan"
                label="Alokasikan / PDM"
                size="small"
                @click="$emit('kelebihan', item)"
              />
            </template>
            <VChip
              v-else-if="item.kelebihan_bayar.pdm?.status === 'AKTIF'"
              size="x-small"
              color="deep-purple"
              variant="tonal"
            >
              PDM
            </VChip>
            <VChip
              v-else
              size="x-small"
              color="success"
              variant="tonal"
            >
              Teralokasi
            </VChip>
          </div>
        </template>
      </VCardText>

      <VDivider />
      <VCardActions class="pa-3 d-flex flex-column gap-2 align-stretch">
        <template v-if="(item.status_cocok === 'UNMATCHED' || item.status_cocok === 'POSSIBLE') && canProcessRow(item)">
          <AppActionButton
            action="cocokkan"
            label="Cocokkan Transaksi"
            block
            @click="$emit('cocokkan', item)"
          />
          <VBtn
            variant="text"
            color="grey"
            block
            :loading="abaikanLoadingId === item.id"
            @click="$emit('abaikan', item)"
          >
            Tandai Sebagai Belum Cocok (Abaikan)
          </VBtn>
        </template>
        <template v-else-if="item.status_cocok === 'MATCHED'">
          <AppActionButton
            v-if="item.can_manage_match"
            action="batalkan"
            label="Batalkan Kecocokan"
            icon="ri-link-unlink"
            block
            :loading="unmatchLoadingId === item.id"
            @click="$emit('unmatch', item)"
          />
          <VChip
            :color="item.status_posting_2 === 'POSTED' ? 'success' : 'grey'"
            size="small"
            variant="tonal"
            label
            class="align-self-center"
          >
            {{ item.status_posting_2 === 'POSTED' ? 'Sudah Posting' : 'Belum Posting' }}
          </VChip>
        </template>
        <div
          v-else
          class="text-caption text-disabled text-center"
        >
          Tidak ada aksi untuk baris ini.
        </div>
      </VCardActions>
    </template>
  </VCard>
</template>

<script setup>
import { computed } from 'vue'
import { useFormatter } from '@/composables/useFormatter'

const props = defineProps({
  item: { type: Object, default: null },
  uploadedBy: { type: String, default: null },
  canProcessRow: { type: Function, required: true },
  abaikanLoadingId: { type: [Number, String], default: null },
  unmatchLoadingId: { type: [Number, String], default: null },
  closable: { type: Boolean, default: true },

  // Dipakai saat panel ditaruh di dalam VBottomSheet (mobile) — ukuran
  // mengikuti konten (dibatasi tinggi maksimum + scroll) alih-alih memaksa
  // memenuhi tinggi kolom seperti pada layout side-panel desktop.
  compact: { type: Boolean, default: false },
})

defineEmits(['close', 'cocokkan', 'abaikan', 'unmatch', 'kelebihan'])

const { formatCurrency } = useFormatter()

const statusColor = s => ({ MATCHED: 'success', POSSIBLE: 'warning', UNMATCHED: 'error', DIABAIKAN: 'grey' }[s] ?? 'grey')

const selisihClass = computed(() => {
  const s = props.item?.selisih_bank
  if (!s) return 'text-success'

  return s > 0 ? 'text-error' : 'text-warning'
})

const selisihLabel = computed(() => {
  const s = props.item?.selisih_bank
  if (s === 0) return 'Rp 0'

  return `${s > 0 ? '+' : '-'}${formatCurrency(Math.abs(s))}`
})
</script>

<style scoped>
/* Posisi vertikal desktop dihitung dari baris tabel yang diklik di Index.vue.
   Komponen ini hanya membatasi tinggi panel supaya ukuran visualnya tetap
   stabil; jika isinya panjang, yang scroll adalah isi VCardText. */
.detail-panel {
  max-height: calc(100vh - 96px);
}

.detail-panel--compact {
  max-height: 80vh;
  border-radius: 16px 16px 0 0;
}
</style>
