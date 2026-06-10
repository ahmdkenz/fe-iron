<template>
  <VDialog
    v-model="isOpen"
    max-width="680"
    scrollable
    persistent
  >
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between pa-4">
        <div class="d-flex align-center gap-2">
          <VIcon
            icon="ri-whatsapp-line"
            color="success"
            size="22"
          />
          <span class="text-h6">Kirim via WhatsApp</span>
        </div>
        <VBtn
          icon
          variant="text"
          size="small"
          @click="isOpen = false"
        >
          <VIcon icon="ri-close-line" />
        </VBtn>
      </VCardTitle>

      <VDivider />

      <VCardText class="pa-4">
        <!-- Info klien -->
        <div
          v-if="clientName"
          class="d-flex align-center gap-2 mb-4 pa-3 rounded"
          style="background: rgb(var(--v-theme-surface-variant));"
        >
          <VIcon
            icon="ri-user-3-line"
            size="18"
            color="primary"
          />
          <div>
            <div class="text-body-2 font-weight-semibold">{{ clientName }}</div>
            <div
              v-if="!clientPhone"
              class="text-caption text-error"
            >
              Nomor WhatsApp belum diisi — tidak bisa mengirim
            </div>
            <div
              v-else
              class="text-caption text-medium-emphasis"
            >
              {{ clientPhone }}
            </div>
          </div>
        </div>

        <!-- Loading state -->
        <div
          v-if="loading"
          class="d-flex justify-center py-6"
        >
          <VProgressCircular
            indeterminate
            color="primary"
          />
        </div>

        <template v-else>
          <!-- Section: Opening Balance -->
          <div
            v-if="obInvoices.length"
            class="mb-4"
          >
            <div class="text-caption font-weight-bold text-medium-emphasis text-uppercase mb-2">
              Opening Balance
            </div>
            <VCard
              v-for="inv in obInvoices"
              :key="inv.id"
              variant="outlined"
              class="mb-2"
            >
              <VCardText class="pa-3">
                <div class="d-flex align-center gap-2">
                  <VCheckbox
                    v-model="checkedIds"
                    :value="inv.id"
                    hide-details
                    density="compact"
                    class="flex-shrink-0"
                    style="margin-inline-end: 0;"
                  />
                  <div class="flex-grow-1 min-width-0">
                    <div class="d-flex align-center gap-2 flex-wrap">
                      <VChip
                        color="warning"
                        size="x-small"
                        variant="tonal"
                        label
                      >
                        OB
                      </VChip>
                      <span class="text-body-2 font-weight-semibold">{{ inv.no_invoice }}</span>
                    </div>
                    <div class="text-caption text-medium-emphasis mt-1">
                      Total: {{ formatCurrency(inv.total_tagihan) }}
                      <span
                        v-if="inv.sisa_tagihan !== undefined"
                        class="text-error"
                      > · Sisa: {{ formatCurrency(inv.sisa_tagihan) }}</span>
                    </div>
                  </div>
                </div>
              </VCardText>
            </VCard>
          </div>

          <!-- Section: Invoice Reguler -->
          <div v-if="regularInvoices.length">
            <div class="text-caption font-weight-bold text-medium-emphasis text-uppercase mb-2">
              Invoice Reguler
            </div>
            <VCard
              v-for="inv in regularInvoices"
              :key="inv.id"
              variant="outlined"
              class="mb-2"
            >
              <VCardText class="pa-3">
                <div class="d-flex align-center gap-2">
                  <VCheckbox
                    v-model="checkedIds"
                    :value="inv.id"
                    hide-details
                    density="compact"
                    class="flex-shrink-0"
                    style="margin-inline-end: 0;"
                  />
                  <div class="flex-grow-1 min-width-0">
                    <div class="d-flex align-center gap-2 flex-wrap">
                      <VChip
                        color="primary"
                        size="x-small"
                        variant="tonal"
                        label
                      >
                        Reguler
                      </VChip>
                      <span class="text-body-2 font-weight-semibold">{{ inv.no_invoice }}</span>
                    </div>
                    <div class="text-caption text-medium-emphasis mt-1">
                      Periode: {{ inv.periode_awal }} s/d {{ inv.periode_akhir }}
                      · Total: {{ formatCurrency(inv.total_tagihan) }}
                    </div>
                  </div>
                </div>
              </VCardText>
            </VCard>
          </div>

          <!-- Empty state -->
          <div
            v-if="!obInvoices.length && !regularInvoices.length"
            class="text-center text-medium-emphasis py-6"
          >
            Tidak ada invoice yang bisa dibagikan untuk klien ini.
          </div>
        </template>
      </VCardText>

      <VDivider />

      <!-- Footer: total + tombol kirim -->
      <VCardText class="pa-4">
        <div class="d-flex align-center justify-space-between flex-wrap gap-3">
          <div>
            <div class="text-caption text-medium-emphasis">
              {{ checkedIds.length }} invoice dipilih
            </div>
            <div
              v-if="checkedIds.length"
              class="text-body-2 font-weight-bold"
            >
              Total: {{ formatCurrency(grandTotal) }}
            </div>
          </div>

          <div class="d-flex gap-2">
            <VBtn
              variant="text"
              color="secondary"
              @click="isOpen = false"
            >
              Batal
            </VBtn>
            <VBtn
              color="success"
              prepend-icon="ri-whatsapp-line"
              :disabled="!checkedIds.length || !clientPhone"
              @click="doSend"
            >
              Kirim WA
            </VBtn>
          </div>
        </div>
      </VCardText>
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
const clientName = computed(() => firstInvoice.value?.klien_ar?.nama_klien ?? '')
const clientPhone = computed(() => {
  const raw = firstInvoice.value?.klien_ar?.no_wa ?? ''
  if (!raw) return ''
  return raw.startsWith('0') ? '62' + raw.slice(1) : raw.replace(/^\+/, '')
})

const grandTotal = computed(() => {
  return allInvoices.value
    .filter(inv => checkedIds.value.includes(inv.id))
    .reduce((sum, inv) => sum + (inv.total_tagihan ?? 0), 0)
})

watch(isOpen, async open => {
  if (!open) return
  await fetchRelated()
})

async function fetchRelated() {
  if (!firstInvoice.value) return

  const klienId = firstInvoice.value.klien_ar_id ?? firstInvoice.value.klien_ar?.id
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

function buildMessage(selected) {
  const klien = firstInvoice.value?.klien_ar?.nama_klien ?? ''
  const obList = selected.filter(inv => inv.is_opening_balance)
  const regList = selected.filter(inv => !inv.is_opening_balance)
  const total = selected.reduce((s, inv) => s + (inv.total_tagihan ?? 0), 0)

  if (selected.length === 1) {
    const inv = selected[0]
    const totalStr = new Intl.NumberFormat('id-ID').format(inv.total_tagihan)
    if (inv.is_opening_balance) {
      return (
        `Halo, berikut kami kirimkan Opening Balance *${inv.no_invoice}*.\n\n` +
        `Klien: ${klien}\n` +
        `Total Tagihan: Rp ${totalStr}\n\n` +
        `Silakan akses dan unduh invoice di:\n${inv.share_url}`
      )
    }
    return (
      `Halo, berikut kami kirimkan Invoice *${inv.no_invoice}*.\n\n` +
      `Klien: ${klien}\n` +
      `Total Tagihan: Rp ${totalStr}\n` +
      `Periode: ${inv.periode_awal} s/d ${inv.periode_akhir}\n\n` +
      `Silakan akses dan unduh invoice di:\n${inv.share_url}`
    )
  }

  let msg = `Halo *${klien}*,\n\nBerikut kami sampaikan tagihan yang perlu diselesaikan:\n`

  if (obList.length) {
    msg += '\n*Opening Balance:*\n'
    for (const inv of obList) {
      const t = new Intl.NumberFormat('id-ID').format(inv.total_tagihan)
      msg += `- ${inv.no_invoice} | Rp ${t}\n  ${inv.share_url}\n`
    }
  }

  if (regList.length) {
    msg += '\n*Invoice Reguler:*\n'
    for (const inv of regList) {
      const t = new Intl.NumberFormat('id-ID').format(inv.total_tagihan)
      msg += `- ${inv.no_invoice} | Periode: ${inv.periode_awal} s/d ${inv.periode_akhir} | Rp ${t}\n  ${inv.share_url}\n`
    }
  }

  const grandStr = new Intl.NumberFormat('id-ID').format(total)
  msg += `\n*Total Keseluruhan: Rp ${grandStr}*\n\nMohon segera melakukan pembayaran. Terima kasih.`

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
