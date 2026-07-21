<template>
  <VDialog :model-value="modelValue" max-width="760" persistent scrollable @update:model-value="$emit('update:modelValue', $event)">
    <VCard>
      <VCardTitle class="pt-4 px-4 text-body-1 font-weight-bold d-flex align-center">
        <span>Ajukan Koreksi</span>
        <VSpacer />
        <span class="text-caption text-medium-emphasis font-weight-regular">
          {{ eb?.nama_vendor }} · {{ formatDate(eb?.periode_awal) }} – {{ formatDate(eb?.periode_akhir) }}
        </span>
      </VCardTitle>
      <VDivider />

      <VCardText class="pt-4" style="max-height: 70vh; overflow-y: auto;">

        <!-- ── Step 1: Pilih Tipe ── -->
        <template v-if="koreksiStep === 1">
          <div class="text-body-2 font-weight-medium mb-3">Pilih jenis koreksi:</div>
          <VRow>
            <VCol cols="12" sm="6">
              <VCard
                variant="outlined"
                :color="koreksiForm.tipe === 'CREDIT_NOTE' ? 'error' : undefined"
                class="tipe-card cursor-pointer"
                :class="{ 'tipe-card--selected': koreksiForm.tipe === 'CREDIT_NOTE' }"
                @click="koreksiForm.tipe = 'CREDIT_NOTE'"
              >
                <VCardText class="pa-4 d-flex align-center gap-3">
                  <VAvatar size="44" color="error" variant="tonal" rounded="lg">
                    <VIcon icon="ri-arrow-down-circle-line" size="22" />
                  </VAvatar>
                  <div class="flex-grow-1">
                    <div class="font-weight-bold text-error">Credit Note</div>
                    <div class="text-caption text-medium-emphasis">Pengurangan hutang ke vendor</div>
                  </div>
                  <VAvatar v-if="koreksiForm.tipe === 'CREDIT_NOTE'" size="22" color="error">
                    <VIcon icon="ri-check-line" size="14" color="white" />
                  </VAvatar>
                </VCardText>
              </VCard>
            </VCol>
            <VCol cols="12" sm="6">
              <VCard
                variant="outlined"
                :color="koreksiForm.tipe === 'DEBIT_NOTE' ? 'info' : undefined"
                class="tipe-card cursor-pointer"
                :class="{ 'tipe-card--selected': koreksiForm.tipe === 'DEBIT_NOTE' }"
                @click="koreksiForm.tipe = 'DEBIT_NOTE'"
              >
                <VCardText class="pa-4 d-flex align-center gap-3">
                  <VAvatar size="44" color="info" variant="tonal" rounded="lg">
                    <VIcon icon="ri-arrow-up-circle-line" size="22" />
                  </VAvatar>
                  <div class="flex-grow-1">
                    <div class="font-weight-bold text-info">Debit Note</div>
                    <div class="text-caption text-medium-emphasis">Penambahan hutang ke vendor</div>
                  </div>
                  <VAvatar v-if="koreksiForm.tipe === 'DEBIT_NOTE'" size="22" color="info">
                    <VIcon icon="ri-check-line" size="14" color="white" />
                  </VAvatar>
                </VCardText>
              </VCard>
            </VCol>
            <VCol v-if="eb?.status === 'LOCKED'" cols="12" sm="6">
              <VCard
                variant="outlined"
                :color="koreksiForm.tipe === 'KOREKSI_SALDO' ? 'secondary' : undefined"
                class="tipe-card cursor-pointer"
                :class="{ 'tipe-card--selected': koreksiForm.tipe === 'KOREKSI_SALDO' }"
                @click="koreksiForm.tipe = 'KOREKSI_SALDO'"
              >
                <VCardText class="pa-4 d-flex align-center gap-3">
                  <VAvatar size="44" color="secondary" variant="tonal" rounded="lg">
                    <VIcon icon="ri-funds-line" size="22" />
                  </VAvatar>
                  <div class="flex-grow-1">
                    <div class="font-weight-bold text-secondary">Koreksi Saldo</div>
                    <div class="text-caption text-medium-emphasis">Penyesuaian saldo tanpa tagihan</div>
                  </div>
                  <VAvatar v-if="koreksiForm.tipe === 'KOREKSI_SALDO'" size="22" color="secondary">
                    <VIcon icon="ri-check-line" size="14" color="white" />
                  </VAvatar>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>
        </template>

        <!-- ── Step 2: Isi Form ── -->
        <template v-else>
          <div class="d-flex align-center gap-2 mb-4">
            <VChip :color="tipeBadgeColor(koreksiForm.tipe)" size="small" label>{{ tipeLabel(koreksiForm.tipe) }}</VChip>
            <span class="text-caption text-medium-emphasis">Lengkapi informasi koreksi di bawah ini</span>
          </div>

          <!-- ── Form Credit Note & Debit Note ── -->
          <template v-if="koreksiForm.tipe === 'CREDIT_NOTE' || koreksiForm.tipe === 'DEBIT_NOTE'">
            <VRow>
              <VCol cols="12">
                <div class="text-caption font-weight-medium text-medium-emphasis mb-2">
                  Pilih Tagihan yang di-{{ koreksiForm.tipe === 'CREDIT_NOTE' ? 'kurangi' : 'tambah' }}
                </div>
                <div v-if="tagihanLoading" class="text-center py-4 text-medium-emphasis text-caption">
                  <VProgressCircular indeterminate size="20" class="mr-2" /> Memuat tagihan...
                </div>
                <div v-else-if="!tagihanList.length" class="text-center py-4 text-medium-emphasis text-caption">
                  Tidak ada tagihan tersedia.
                </div>
                <div v-else class="koreksi-invoice-list">
                  <div
                    v-for="t in tagihanList"
                    :key="t.id"
                    class="koreksi-invoice-row"
                    :class="{ 'koreksi-invoice-row--selected': koreksiForm.tagihan_ap_id === t.id }"
                    @click="koreksiForm.tagihan_ap_id = t.id; onTagihanSelectedForKoreksiItem(t.id)"
                  >
                    <div class="flex-grow-1 min-w-0">
                      <div class="d-flex align-center gap-2 mb-1 flex-wrap">
                        <span class="text-body-2 font-weight-bold">{{ t.no_tagihan }}</span>
                        <VChip size="x-small" :color="tagihanStatusColor(t.status)" variant="tonal" label>{{ t.status }}</VChip>
                        <VChip v-if="isOverdue(t)" size="x-small" color="error" variant="tonal" label>Jatuh Tempo</VChip>
                      </div>
                      <div class="text-caption text-medium-emphasis">
                        {{ formatDate(t.tanggal_tagihan) }} · JT: {{ formatDate(t.tanggal_jatuh_tempo) || '-' }}
                      </div>
                      <div class="text-caption mt-1">
                        Sisa: <span class="font-weight-bold text-error">{{ formatRp(t.sisa_tagihan) }}</span>
                        <span class="text-medium-emphasis ms-2">/ {{ formatRp(t.total_tagihan) }}</span>
                      </div>
                    </div>
                    <VAvatar v-if="koreksiForm.tagihan_ap_id === t.id" size="24" color="primary" class="flex-shrink-0">
                      <VIcon icon="ri-check-line" size="14" color="white" />
                    </VAvatar>
                  </div>
                </div>
              </VCol>
            </VRow>

            <div v-if="itemsLoading" class="text-center py-4">
              <VProgressCircular indeterminate size="24" />
              <span class="text-caption ml-2">Memuat item tagihan...</span>
            </div>

            <template v-else-if="koreksiForm.tagihan_ap_id && koreksiItems.length">
              <div class="text-caption text-medium-emphasis mb-2 mt-3">
                Edit qty dan harga baru (kosongkan jika tidak berubah):
              </div>
              <VTable density="compact" class="eb-item-edit-table mb-3">
                <thead>
                  <tr>
                    <th>Barang</th>
                    <th class="text-end">Qty Lama</th>
                    <th class="text-end">Harga Lama</th>
                    <th class="text-end">Subtotal Lama</th>
                    <th class="text-end" style="min-width: 110px">Qty Baru</th>
                    <th class="text-end" style="min-width: 130px">Harga Baru</th>
                    <th class="text-end">Subtotal Baru</th>
                    <th class="text-end">Selisih</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in koreksiItems" :key="item.id">
                    <td class="text-caption font-weight-medium">{{ item.nama_barang }}</td>
                    <td class="text-end text-caption">{{ item.qty }}</td>
                    <td class="text-end text-caption">{{ formatRp(item.harga_satuan) }}</td>
                    <td class="text-end text-caption">{{ formatRp(item.subtotalLama) }}</td>
                    <td class="text-end">
                      <VTextField
                        v-model="item.qty_baru"
                        type="number"
                        min="0"
                        density="compact"
                        variant="outlined"
                        hide-details
                        style="min-width: 90px"
                        @update:model-value="recalcSelisih(idx)"
                      />
                    </td>
                    <td class="text-end">
                      <VTextField
                        v-model="item.harga_baru"
                        type="number"
                        min="0"
                        density="compact"
                        variant="outlined"
                        hide-details
                        style="min-width: 110px"
                        @update:model-value="recalcSelisih(idx)"
                      />
                    </td>
                    <td class="text-end text-caption" :class="item.subtotalBaru != null ? (item.subtotalBaru < item.subtotalLama ? 'text-error' : 'text-success') : 'text-medium-emphasis'">
                      {{ item.subtotalBaru != null ? formatRp(item.subtotalBaru) : '—' }}
                    </td>
                    <td class="text-end font-weight-bold text-caption" :class="(item.selisih ?? 0) >= 0 ? 'text-success' : 'text-error'">
                      {{ item.selisih != null ? ((item.selisih >= 0 ? '+' : '') + formatRp(item.selisih)) : '—' }}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="7" class="text-end font-weight-bold text-caption">
                      {{ koreksiForm.tipe === 'CREDIT_NOTE' ? 'Total Pengurangan:' : 'Total Penambahan:' }}
                    </td>
                    <td class="text-end font-weight-bold" :class="totalSelisihItems >= 0 ? 'text-success' : 'text-error'">
                      {{ (totalSelisihItems >= 0 ? '+' : '') + formatRp(totalSelisihItems) }}
                    </td>
                  </tr>
                </tfoot>
              </VTable>
              <VRow>
                <VCol cols="12">
                  <VTextarea
                    v-model="koreksiForm.alasan_koreksi"
                    label="Alasan"
                    rows="3"
                    auto-grow
                    counter="1000"
                    persistent-hint
                  />
                </VCol>
                <VCol cols="12">
                  <VTextField
                    v-model="koreksiForm.dokumen_url"
                    label="URL Dokumen Pendukung (opsional)"
                    hint="Link Google Drive, SharePoint, atau URL lainnya"
                    persistent-hint
                  />
                </VCol>
              </VRow>
            </template>

            <!-- Fallback: tagihan dipilih tapi tidak ada items -->
            <template v-else-if="koreksiForm.tagihan_ap_id && !itemsLoading">
              <VRow class="mt-2">
                <VCol cols="12">
                  <VTextField
                    v-model="koreksiForm.nilai"
                    :label="koreksiForm.tipe === 'CREDIT_NOTE' ? 'Nilai Pengurangan (Rp)' : 'Nilai Penambahan (Rp)'"
                    type="number"
                    min="0"
                    :hint="koreksiForm.tipe === 'CREDIT_NOTE' ? 'Hutang ke vendor akan berkurang sebesar nilai ini' : 'Hutang ke vendor akan bertambah sebesar nilai ini'"
                    persistent-hint
                  />
                </VCol>
                <VCol cols="12">
                  <VTextarea
                    v-model="koreksiForm.alasan_koreksi"
                    label="Alasan"
                    rows="3"
                    auto-grow
                    counter="1000"
                    persistent-hint
                  />
                </VCol>
                <VCol cols="12">
                  <VTextField
                    v-model="koreksiForm.dokumen_url"
                    label="URL Dokumen Pendukung (opsional)"
                    hint="Link Google Drive, SharePoint, atau URL lainnya"
                    persistent-hint
                  />
                </VCol>
              </VRow>
            </template>
          </template>

          <!-- ── Form Koreksi Saldo ── -->
          <template v-else-if="koreksiForm.tipe === 'KOREKSI_SALDO'">
            <VRow>
              <VCol cols="12">
                <div class="text-caption text-medium-emphasis mb-2">Jenis Koreksi</div>
                <VBtnToggle
                  v-model="koreksiForm.tipe_koreksi"
                  mandatory
                  density="compact"
                  variant="outlined"
                  color="primary"
                  class="mb-4"
                  style="width: 100%"
                >
                  <VBtn value="tambah" style="flex: 1" prepend-icon="ri-add-line">Tambah Saldo</VBtn>
                  <VBtn value="kurangi" style="flex: 1" prepend-icon="ri-subtract-line">Kurangi Saldo</VBtn>
                </VBtnToggle>
                <VTextField
                  v-model="koreksiForm.nilai"
                  label="Jumlah Koreksi (Rp)"
                  type="number"
                  min="0"
                  :hint="`Saldo akan ${koreksiForm.tipe_koreksi === 'tambah' ? 'bertambah' : 'berkurang'} sebesar jumlah ini`"
                  persistent-hint
                />
              </VCol>
              <VCol cols="12">
                <VTextarea
                  v-model="koreksiForm.alasan_koreksi"
                  label="Alasan Koreksi"
                  rows="3"
                  auto-grow
                  counter="1000"
                  persistent-hint
                />
              </VCol>
              <VCol cols="12">
                <VTextField
                  v-model="koreksiForm.dokumen_url"
                  label="URL Dokumen Pendukung (opsional)"
                  hint="Link Google Drive, SharePoint, atau URL lainnya"
                  persistent-hint
                />
              </VCol>
            </VRow>
          </template>

          <VAlert type="info" density="compact" variant="tonal" icon="ri-shield-check-line" class="mt-4">
            Koreksi memerlukan persetujuan <strong>Manager/Supervisor</strong>. Saldo tidak berubah sampai disetujui.
          </VAlert>
          <VAlert v-if="koreksiError" type="error" class="mt-2" density="compact">{{ koreksiError }}</VAlert>
        </template>

      </VCardText>

      <VDivider />
      <VCardActions class="px-4 py-3">
        <AppActionButton action="batalkan" :disabled="submittingKoreksi" @click="$emit('update:modelValue', false)" />
        <VSpacer />
        <VBtn v-if="koreksiStep === 2" variant="text" @click="koreksiStep = 1">Kembali</VBtn>
        <AppActionButton
          v-if="koreksiStep === 1"
          action="lanjutkan"
          :disabled="!koreksiForm.tipe"
          @click="koreksiStep = 2"
        />
        <AppActionButton
          v-else
          action="ajukan"
          label="Ajukan Koreksi"
          :loading="submittingKoreksi"
          @click="submitKoreksiDialog"
        />
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import api from '@/utils/axios'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  eb: { type: Object, default: null },
  tagihanList: { type: Array, default: () => [] },
  tagihanLoading: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'submitted'])

const koreksiStep = ref(1)
const koreksiForm = reactive({
  tipe:          '',
  tipe_koreksi:  'tambah',  // untuk KOREKSI_SALDO: tambah | kurangi
  tagihan_ap_id: null,
  nilai:         '',
  alasan_koreksi:'',
  dokumen_url:   '',
})
const submittingKoreksi = ref(false)
const koreksiError      = ref('')

// Koreksi per-item opsional untuk CREDIT_NOTE/DEBIT_NOTE
const koreksiItems  = ref([])
const itemsLoading  = ref(false)

const totalSelisihItems = computed(() =>
  koreksiItems.value.reduce((s, i) => s + (i.selisih ?? 0), 0)
)

function formatRp(val) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val ?? 0)
}
function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}
function tagihanStatusColor(s) {
  return { DRAFT: 'default', DITERIMA: 'primary', SEBAGIAN: 'warning', LUNAS: 'success' }[s] ?? 'default'
}
function tipeBadgeColor(tipe) {
  return { CREDIT_NOTE: 'error', DEBIT_NOTE: 'info', KOREKSI_SALDO: 'secondary' }[tipe] ?? 'default'
}
function tipeLabel(tipe) {
  return { CREDIT_NOTE: 'CN', DEBIT_NOTE: 'DN', KOREKSI_SALDO: 'Koreksi Saldo' }[tipe] ?? tipe
}
function isOverdue(t) {
  return t.tanggal_jatuh_tempo
    && t.sisa_tagihan > 0
    && t.tanggal_jatuh_tempo < new Date().toISOString().slice(0, 10)
}

function resetForm() {
  koreksiStep.value           = 1
  koreksiForm.tipe            = ''
  koreksiForm.tipe_koreksi    = 'tambah'
  koreksiForm.tagihan_ap_id   = null
  koreksiForm.nilai           = ''
  koreksiForm.alasan_koreksi  = ''
  koreksiForm.dokumen_url     = ''
  koreksiItems.value          = []
  koreksiError.value          = ''
}

watch(() => props.modelValue, open => {
  if (open) resetForm()
})

async function onTagihanSelectedForKoreksiItem(tagihanId) {
  koreksiItems.value = []
  if (!tagihanId) return

  itemsLoading.value = true
  try {
    const { data } = await api.get(`/ap/tagihan/${tagihanId}`)
    const items = data.data?.items ?? []
    koreksiItems.value = items.map(i => ({
      id:                 i.id,
      tagihan_ap_item_id: i.id,
      nama_barang:        i.nama_barang,
      qty:                Number(i.qty),
      harga_satuan:       Number(i.harga_satuan),
      subtotalLama:       Math.round(Number(i.qty) * Number(i.harga_satuan) * 100) / 100,
      qty_baru:           '',
      harga_baru:         '',
      subtotalBaru:       null,
      selisih:            null,
    }))
  } catch {
    koreksiItems.value = []
  } finally {
    itemsLoading.value = false
  }
}

function recalcSelisih(idx) {
  const item = koreksiItems.value[idx]
  const qtyBaru    = Number(item.qty_baru) || item.qty
  const hargaBaru  = Number(item.harga_baru) || item.harga_satuan
  item.subtotalBaru = Math.round(qtyBaru * hargaBaru * 100) / 100
  item.selisih      = Math.round((item.subtotalBaru - item.subtotalLama) * 100) / 100
}

async function submitKoreksiDialog() {
  koreksiError.value = ''

  const tipe = koreksiForm.tipe

  if (!koreksiForm.alasan_koreksi) {
    koreksiError.value = 'Alasan koreksi wajib diisi.'
    return
  }

  let payload = { tipe, alasan_koreksi: koreksiForm.alasan_koreksi, dokumen_url: koreksiForm.dokumen_url || null }

  if (tipe === 'CREDIT_NOTE' || tipe === 'DEBIT_NOTE') {
    if (!koreksiForm.tagihan_ap_id) { koreksiError.value = 'Tagihan wajib dipilih.'; return }
    payload.tagihan_ap_id = koreksiForm.tagihan_ap_id

    const changedItems = koreksiItems.value.filter(i => i.qty_baru !== '' || i.harga_baru !== '')
    if (changedItems.length > 0) {
      if (itemsLoading.value) { koreksiError.value = 'Tunggu item tagihan selesai dimuat.'; return }
      const total = changedItems.reduce((s, i) => s + (i.selisih ?? 0), 0)
      if (tipe === 'CREDIT_NOTE' && total >= 0) {
        koreksiError.value = 'Credit Note harus menghasilkan pengurangan hutang (total selisih harus negatif).'; return
      }
      if (tipe === 'DEBIT_NOTE' && total <= 0) {
        koreksiError.value = 'Debit Note harus menghasilkan penambahan hutang (total selisih harus positif).'; return
      }
      payload.items = changedItems.map(i => ({
        tagihan_ap_item_id: i.id,
        qty_baru:           Number(i.qty_baru) || i.qty,
        harga_satuan_baru:  Number(i.harga_baru) || i.harga_satuan,
      }))
    } else {
      if (!koreksiForm.nilai || Number(koreksiForm.nilai) <= 0) {
        koreksiError.value = tipe === 'CREDIT_NOTE' ? 'Nilai pengurangan wajib diisi (> 0).' : 'Nilai penambahan wajib diisi (> 0).'
        return
      }
      payload.nilai_koreksi = tipe === 'CREDIT_NOTE' ? -Math.abs(Number(koreksiForm.nilai)) : Math.abs(Number(koreksiForm.nilai))
    }

  } else if (tipe === 'KOREKSI_SALDO') {
    if (!koreksiForm.nilai || Number(koreksiForm.nilai) <= 0) { koreksiError.value = 'Jumlah koreksi wajib diisi (> 0).'; return }
    const jumlah = Number(koreksiForm.nilai)
    payload.nilai_koreksi = koreksiForm.tipe_koreksi === 'tambah' ? jumlah : -jumlah
  }

  submittingKoreksi.value = true
  try {
    await api.post(`/ap/ending-balance/${props.eb.id}/koreksi`, payload)
    emit('update:modelValue', false)
    emit('submitted')
  } catch (e) {
    koreksiError.value = e?.response?.data?.message ?? 'Gagal mengajukan koreksi.'
  } finally {
    submittingKoreksi.value = false
  }
}
</script>

<style scoped>
.tipe-card {
  transition: box-shadow 0.15s, background 0.15s;
  min-height: 80px;
}
.tipe-card:hover {
  box-shadow: 0 3px 10px rgba(0,0,0,0.12);
}
.tipe-card--selected {
  background: rgba(var(--v-theme-on-surface), 0.04) !important;
}

.koreksi-invoice-list {
  max-height: 260px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-right: 2px;
}
.koreksi-invoice-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface));
  transition: border-color 0.15s, background 0.15s;
}
.koreksi-invoice-row:hover {
  border-color: rgba(var(--v-theme-primary), 0.4);
  background: rgba(var(--v-theme-primary), 0.03);
}
.koreksi-invoice-row--selected {
  border-color: rgba(var(--v-theme-primary), 0.6);
  background: rgba(var(--v-theme-primary), 0.07);
}

.cursor-pointer {
  cursor: pointer;
}
</style>
