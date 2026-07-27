<template>
  <VDialog
    v-model="isOpen"
    max-width="600"
    scrollable
    persistent
  >
    <VCard rounded="lg">
      <!-- Header -->
      <div class="share-dialog-header pa-5 pb-4">
        <div class="d-flex align-center justify-space-between">
          <div class="d-flex align-center gap-3">
            <div class="share-wa-icon">
              <VIcon
                icon="ri-whatsapp-line"
                size="22"
                color="white"
              />
            </div>
            <div>
              <div class="text-h6 font-weight-bold">
                Kirim via WhatsApp
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ isInvestorBulkMode ? 'Rekap gabungan invoice investor' : 'Pilih invoice yang ingin dikirim' }}
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

        <!-- Client Info -->
        <div
          v-if="firstInvoice"
          class="client-info-bar mt-4"
        >
          <VAvatar
            color="primary"
            variant="tonal"
            size="36"
            class="flex-shrink-0"
          >
            <VIcon
              icon="ri-user-3-line"
              size="18"
            />
          </VAvatar>
          <div class="flex-grow-1 min-width-0">
            <div class="text-body-2 font-weight-semibold text-truncate">
              {{ clientName || '—' }}
            </div>
            <div
              v-if="clientPhone"
              class="text-caption text-medium-emphasis"
            >
              +{{ clientPhone }}
            </div>
            <div
              v-else
              class="text-caption text-error d-flex align-center gap-1"
            >
              <VIcon
                icon="ri-error-warning-line"
                size="12"
              />
              No. WhatsApp belum diisi
            </div>
          </div>
        </div>
      </div>

      <VDivider />

      <!-- Body: invoice checklist -->
      <VCardText
        class="pa-0"
        style="max-height: 380px; overflow-y: auto;"
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

        <!-- Mode: investor-bulk (read-only, otomatis) -->
        <template v-else-if="isInvestorBulkMode">
          <div
            v-if="!bulkPreview || !bulkPreview.total_invoice"
            class="d-flex flex-column align-center justify-center py-10 text-medium-emphasis"
          >
            <VIcon
              icon="ri-file-unknow-line"
              size="40"
              class="mb-2 opacity-40"
            />
            <span class="text-body-2">Tidak ada invoice yang bisa digabung pada periode ini</span>
          </div>

          <template v-else>
            <div class="px-5 pt-4 pb-2">
              <div class="text-body-2 font-weight-semibold">
                {{ bulkPreview.investor?.nama_investor }}
              </div>
              <div class="text-caption text-medium-emphasis">
                Periode {{ bulkPreview.periode?.tanggal_dari }} s/d {{ bulkPreview.periode?.tanggal_sampai }}
                &bull; {{ bulkPreview.total_invoice }} invoice &bull; {{ bulkPreview.total_resto }} outlet
              </div>
            </div>

            <div
              v-for="group in bulkPreview.resto_groups"
              :key="group.resto_id ?? group.nama_resto"
              class="px-4 pb-2"
            >
              <div class="section-label pt-2 pb-2">
                <VIcon
                  icon="ri-store-2-line"
                  size="14"
                  color="primary"
                  class="me-1"
                />
                {{ group.nama_resto }}
                <VChip
                  size="x-small"
                  color="primary"
                  variant="tonal"
                  class="ms-1"
                >
                  {{ group.invoices.length }}
                </VChip>
              </div>
              <div class="d-flex flex-column gap-2">
                <div
                  v-for="inv in group.invoices"
                  :key="inv.id"
                  class="invoice-row"
                  style="cursor: default;"
                >
                  <div class="flex-grow-1 min-width-0">
                    <div class="d-flex align-center gap-2 mb-1">
                      <VChip
                        color="primary"
                        size="x-small"
                        variant="flat"
                        label
                      >
                        {{ inv.status }}
                      </VChip>
                      <span class="text-body-2 font-weight-semibold">{{ inv.no_invoice }}</span>
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      Total: <strong>{{ formatCurrency(inv.subtotal) }}</strong>
                      <span
                        v-if="inv.sisa > 0"
                        class="ms-2 text-error"
                      >· Sisa: {{ formatCurrency(inv.sisa) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </template>

        <!-- Mode: client (checklist manual, existing) -->
        <template v-else>
          <!-- Empty -->
          <div
            v-if="!obInvoices.length && !regularInvoices.length"
            class="d-flex flex-column align-center justify-center py-10 text-medium-emphasis"
          >
            <VIcon
              icon="ri-file-unknow-line"
              size="40"
              class="mb-2 opacity-40"
            />
            <span class="text-body-2">Tidak ada invoice yang bisa dibagikan</span>
          </div>

          <!-- Select all -->
          <div
            v-if="obInvoices.length || regularInvoices.length"
            class="select-all-row"
            @click="toggleAll"
          >
            <VCheckbox
              :model-value="allChecked"
              :indeterminate="someChecked && !allChecked"
              hide-details
              density="compact"
              color="primary"
              class="flex-shrink-0"
              style="pointer-events: none;"
            />
            <span class="text-body-2 font-weight-semibold">Pilih Semua</span>
            <VChip
              size="x-small"
              color="primary"
              variant="tonal"
              class="ms-1"
            >
              {{ allInvoices.length }}
            </VChip>
          </div>

          <!-- Opening Balance section -->
          <div v-if="obInvoices.length">
            <div class="section-label px-5 pt-4 pb-2">
              <VIcon
                icon="ri-history-line"
                size="14"
                color="warning"
                class="me-1"
              />
              Opening Balance
              <VChip
                size="x-small"
                color="warning"
                variant="tonal"
                class="ms-1"
              >
                {{ obInvoices.length }}
              </VChip>
            </div>
            <div class="px-4 pb-2 d-flex flex-column gap-2">
              <div
                v-for="inv in obInvoices"
                :key="inv.id"
                class="invoice-row"
                :class="{ 'invoice-row--checked': checkedIds.includes(inv.id) }"
                @click="toggleCheck(inv.id)"
              >
                <VCheckbox
                  :model-value="checkedIds.includes(inv.id)"
                  hide-details
                  density="compact"
                  color="warning"
                  class="flex-shrink-0"
                  style="pointer-events: none;"
                />
                <div class="flex-grow-1 min-width-0">
                  <div class="d-flex align-center gap-2 mb-1">
                    <VChip
                      color="warning"
                      size="x-small"
                      variant="flat"
                      label
                    >
                      OB
                    </VChip>
                    <span class="text-body-2 font-weight-semibold">{{ inv.no_invoice }}</span>
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    Saldo Awal: <strong>{{ formatCurrency(inv.subtotal) }}</strong>
                    <span
                      v-if="inv.sisa_tagihan > 0"
                      class="ms-2 text-error"
                    >· Sisa: {{ formatCurrency(inv.sisa_tagihan) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Regular Invoice section -->
          <div v-if="regularInvoices.length">
            <div class="section-label px-5 pt-3 pb-2">
              <VIcon
                icon="ri-file-list-3-line"
                size="14"
                color="primary"
                class="me-1"
              />
              Invoice Reguler
              <VChip
                size="x-small"
                color="primary"
                variant="tonal"
                class="ms-1"
              >
                {{ regularInvoices.length }}
              </VChip>
            </div>
            <div class="px-4 pb-4 d-flex flex-column gap-2">
              <div
                v-for="inv in regularInvoices"
                :key="inv.id"
                class="invoice-row"
                :class="{ 'invoice-row--checked': checkedIds.includes(inv.id) }"
                @click="toggleCheck(inv.id)"
              >
                <VCheckbox
                  :model-value="checkedIds.includes(inv.id)"
                  hide-details
                  density="compact"
                  color="primary"
                  class="flex-shrink-0"
                  style="pointer-events: none;"
                />
                <div class="flex-grow-1 min-width-0">
                  <div class="d-flex align-center gap-2 mb-1">
                    <VChip
                      color="primary"
                      size="x-small"
                      variant="flat"
                      label
                    >
                      Reguler
                    </VChip>
                    <span class="text-body-2 font-weight-semibold">{{ inv.no_invoice }}</span>
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    Total: <strong>{{ formatCurrency(inv.subtotal) }}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </VCardText>

      <VDivider />

      <!-- Footer -->
      <div class="share-dialog-footer pa-4">
        <div class="d-flex align-center justify-space-between gap-3 flex-wrap">
          <!-- Summary -->
          <div
            v-if="isInvestorBulkMode"
            class="summary-pill"
          >
            <template v-if="bulkPreview?.total_invoice">
              <VIcon
                icon="ri-checkbox-circle-fill"
                size="16"
                color="success"
                class="me-1"
              />
              <span class="text-body-2 font-weight-semibold">{{ bulkPreview.total_invoice }} invoice</span>
              <VDivider
                vertical
                class="mx-2"
                style="height: 14px; align-self: center;"
              />
              <span class="text-body-2 font-weight-bold text-primary">{{ formatCurrency(bulkPreview.total_tagihan) }}</span>
            </template>
            <span
              v-else
              class="text-caption text-medium-emphasis"
            >Tidak ada invoice untuk digabung</span>
          </div>
          <div
            v-else-if="checkedIds.length"
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
            <span class="text-body-2 font-weight-bold text-primary">{{ formatCurrency(grandTotal) }}</span>
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
              v-if="isInvestorBulkMode"
              action="custom"
              color="success"
              size="small"
              icon="ri-whatsapp-line"
              :disabled="!bulkPreview?.total_invoice || !clientPhone || loading"
              @click="doSendInvestorBulk"
            >
              Kirim WA
            </AppActionButton>
            <AppActionButton
              v-else
              action="custom"
              color="success"
              size="small"
              icon="ri-whatsapp-line"
              :disabled="!checkedIds.length || !clientPhone"
              @click="doSend"
            >
              Kirim WA
            </AppActionButton>
          </div>
        </div>
      </div>
    </VCard>
  </VDialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import api from '@/utils/axios.js'
import { useFormatter } from '@/composables/useFormatter.js'
import { useSweetAlert } from '@/composables/useSweetAlert.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  preSelected: { type: Array, default: () => [] },
  mode: { type: String, default: 'client' }, // 'client' | 'investor-bulk'
  periodeDari: { type: String, default: '' },
  periodeSampai: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

const { formatCurrency } = useFormatter()
const { showError } = useSweetAlert()

const isOpen = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const loading = ref(false)
const allInvoices = ref([])
const checkedIds = ref([])

const obInvoices = computed(() => allInvoices.value.filter(inv => inv.is_opening_balance))
const regularInvoices = computed(() => allInvoices.value.filter(inv => !inv.is_opening_balance))

const firstInvoice = computed(() => props.preSelected[0] ?? null)

const clientName = computed(() => {
  const inv = firstInvoice.value
  if (!inv) return ''
  
  return inv.klien_ar?.nama_klien ?? ''
})

const clientPhone = computed(() => {
  const inv = firstInvoice.value
  if (!inv) return ''
  const raw = inv.klien_ar?.no_wa ?? ''
  if (!raw) return ''
  
  return raw.startsWith('0') ? '62' + raw.slice(1) : raw.replace(/^\+/, '')
})

const grandTotal = computed(() =>
  allInvoices.value
    .filter(inv => checkedIds.value.includes(inv.id))
    .reduce((sum, inv) => sum + (inv.subtotal ?? 0), 0),
)

const allChecked = computed(() =>
  allInvoices.value.length > 0 && checkedIds.value.length === allInvoices.value.length,
)

const someChecked = computed(() => checkedIds.value.length > 0)

function toggleCheck(id) {
  const idx = checkedIds.value.indexOf(id)
  if (idx === -1) checkedIds.value.push(id)
  else checkedIds.value.splice(idx, 1)
}

function toggleAll() {
  if (allChecked.value) checkedIds.value = []
  else checkedIds.value = allInvoices.value.map(inv => inv.id)
}

const isInvestorBulkMode = computed(() => props.mode === 'investor-bulk')
const bulkPreview = ref(null)

watch(isOpen, async open => {
  if (!open) return

  if (isInvestorBulkMode.value) {
    await fetchInvestorBulkPreview()
  } else {
    await fetchRelated()
  }
})

async function fetchInvestorBulkPreview() {
  bulkPreview.value = null
  if (!firstInvoice.value) return

  loading.value = true
  try {
    const res = await api.post('/finance/invoices/bulk-b2c-investor/preview', {
      anchor_invoice_id: firstInvoice.value.id,
      tanggal_dari: props.periodeDari,
      tanggal_sampai: props.periodeSampai,
    })

    bulkPreview.value = res.data?.data ?? null
  } catch (err) {
    await showError(err.response?.data?.message ?? 'Gagal memuat preview bulk invoice investor')
  } finally {
    loading.value = false
  }
}

function buildInvestorBulkMessage(data, shareUrl) {
  const klien = clientName.value
  const totalInvoice = new Intl.NumberFormat('id-ID').format(data.total_tagihan)
  const totalSisa = new Intl.NumberFormat('id-ID').format(data.total_sisa)

  return (
    `Yth. Bapak/Ibu *${klien}*,\n\n` +
    `Bersama ini kami sampaikan rekap tagihan investor *${data.investor?.nama_investor ?? ''}* ` +
    `untuk ${data.total_invoice} invoice dari ${data.total_resto} resto/outlet ` +
    `periode ${data.periode?.tanggal_dari ?? ''} s/d ${data.periode?.tanggal_sampai ?? ''}:\n\n` +
    `Total Tagihan: Rp ${totalInvoice}\n` +
    `Sisa Tagihan: Rp ${totalSisa}\n\n` +
    `Silakan akses dan unduh dokumen rekap melalui tautan berikut:\n${shareUrl}\n\n` +
    `Mohon kesediaannya untuk melakukan pembayaran sesuai dengan total tagihan di atas. Atas perhatian dan kerja samanya, kami ucapkan terima kasih.`
  )
}

async function doSendInvestorBulk() {
  if (!clientPhone.value) {
    await showError('Nomor WhatsApp klien belum diisi. Silakan lengkapi data No. WhatsApp pada form Client.')

    return
  }

  if (!firstInvoice.value) return

  loading.value = true
  try {
    const res = await api.post('/finance/invoices/bulk-b2c-investor/link', {
      anchor_invoice_id: firstInvoice.value.id,
      tanggal_dari: props.periodeDari,
      tanggal_sampai: props.periodeSampai,
    })

    const data = res.data?.data
    if (!data?.share_url) {
      await showError('Gagal membuat tautan bulk invoice investor')

      return
    }

    const msg = buildInvestorBulkMessage(data, data.share_url)

    window.open(`https://wa.me/${clientPhone.value}?text=${encodeURIComponent(msg)}`, '_blank')
    isOpen.value = false
  } catch (err) {
    await showError(err.response?.data?.message ?? 'Gagal membuat tautan bulk invoice investor')
  } finally {
    loading.value = false
  }
}

async function fetchRelated() {
  if (!firstInvoice.value) return

  const klienId = firstInvoice.value.klien_ar_id
    ?? firstInvoice.value.klien_ar?.id
    ?? null

  if (!klienId) return

  loading.value = true
  try {
    const [resReg, resOb] = await Promise.all([
      api.get('/finance/invoices', { params: { klien_ar_id: klienId, per_page: 100 } }),
      api.get('/finance/opening-balance', { params: { klien_ar_id: klienId, per_page: 100 } }),
    ])

    const preSelectedIds = new Set(props.preSelected.map(inv => inv.id))

    const combined = [
      ...(resOb.data?.data ?? []),
      ...(resReg.data?.data ?? []),
    ].filter(inv => inv.share_url)

    allInvoices.value = combined
    checkedIds.value = combined
      .filter(inv => preSelectedIds.has(inv.id))
      .map(inv => inv.id)
  } catch {
    await showError('Gagal memuat daftar invoice klien')
  } finally {
    loading.value = false
  }
}

function formatInvoiceItem(inv) {
  const t = new Intl.NumberFormat('id-ID').format(inv.subtotal)
  
  return `- ${inv.no_invoice} | Rp ${t}\n  ${inv.share_url}`
}

function buildMessage(selected) {
  const klien = clientName.value
  const obList = selected.filter(inv => inv.is_opening_balance)
  const regList = selected.filter(inv => !inv.is_opening_balance)
  const total = selected.reduce((s, inv) => s + (inv.subtotal ?? 0), 0)

  if (selected.length === 1) {
    const inv = selected[0]
    const t = new Intl.NumberFormat('id-ID').format(inv.subtotal)
    const label = inv.is_opening_balance ? 'Opening Balance' : 'Invoice'
    
    return (
      `Yth. Bapak/Ibu *${klien}*,\n\n` +
      `Bersama ini kami sampaikan ${label} *${inv.no_invoice}* dengan rincian sebagai berikut:\n\n` +
      `Total Tagihan: Rp ${t}\n\n` +
      `Silakan akses dan unduh dokumen melalui tautan berikut:\n${inv.share_url}\n\n` +
      `Mohon kesediaannya untuk melakukan pembayaran sesuai dengan total tagihan di atas. Atas perhatian dan kerja samanya, kami ucapkan terima kasih.`
    )
  }

  let msg = `Yth. Bapak/Ibu *${klien}*,\n\nBersama ini kami sampaikan rincian tagihan yang perlu diselesaikan:\n`

  if (obList.length) {
    msg += '\n*Opening Balance:*\n\n'
    msg += obList.map(formatInvoiceItem).join('\n\n')
    msg += '\n'
  }

  if (regList.length) {
    msg += '\n*Invoice Reguler:*\n\n'
    msg += regList.map(formatInvoiceItem).join('\n\n')
    msg += '\n'
  }

  const grandStr = new Intl.NumberFormat('id-ID').format(total)

  msg += `\n*Total Keseluruhan: Rp ${grandStr}*\n\nMohon kesediaannya untuk melakukan pembayaran sesuai dengan total tagihan di atas. Atas perhatian dan kerja samanya, kami ucapkan terima kasih.`

  return msg
}

async function doSend() {
  if (!clientPhone.value) {
    await showError('Nomor WhatsApp klien belum diisi. Silakan lengkapi data No. WhatsApp pada form Client.')
    
    return
  }

  const selected = allInvoices.value.filter(inv => checkedIds.value.includes(inv.id))
  if (!selected.length) return

  const msg = buildMessage(selected)

  window.open(`https://wa.me/${clientPhone.value}?text=${encodeURIComponent(msg)}`, '_blank')
  isOpen.value = false
}
</script>

<style scoped>
.share-dialog-header {
  background: rgb(var(--v-theme-surface));
}

.share-wa-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #25d366;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.client-info-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(var(--v-theme-primary), 0.06);
  border: 1px solid rgba(var(--v-theme-primary), 0.15);
  border-radius: 10px;
  padding: 10px 14px;
}

.select-all-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 16px 0;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
  background: rgba(var(--v-theme-primary), 0.04);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.select-all-row:hover {
  border-color: rgba(var(--v-theme-primary), 0.4);
  background: rgba(var(--v-theme-primary), 0.07);
}

.section-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgb(var(--v-theme-on-surface), 0.5);
  display: flex;
  align-items: center;
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

.share-dialog-footer {
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
