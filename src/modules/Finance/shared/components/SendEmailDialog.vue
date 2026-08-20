<template>
  <VDialog
    v-model="isOpen"
    max-width="600"
    scrollable
    persistent
  >
    <VCard rounded="lg">
      <!-- Header -->
      <div class="email-dialog-header pa-5 pb-4">
        <div class="d-flex align-center justify-space-between">
          <div class="d-flex align-center gap-3">
            <div class="email-icon">
              <VIcon
                icon="ri-mail-send-line"
                size="22"
                color="white"
              />
            </div>
            <div>
              <div class="text-h6 font-weight-bold">
                Kirim via Email
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ phase === 'result' ? 'Status pengiriman' : `${groups.length} klien dipilih` }}
              </div>
            </div>
          </div>
          <VBtn
            icon
            variant="text"
            size="small"
            color="default"
            :disabled="phase === 'sending'"
            @click="isOpen = false"
          >
            <VIcon
              icon="ri-close-line"
              size="20"
            />
          </VBtn>
        </div>
      </div>

      <VDivider />

      <!-- Body -->
      <VCardText
        class="pa-0"
        style="max-height: 420px; overflow-y: auto;"
      >
        <!-- Loading (initial fetch per klien) -->
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

        <!-- Phase: review -->
        <template v-else-if="phase === 'review'">
          <div
            v-if="!groups.length"
            class="d-flex flex-column align-center justify-center py-10 text-medium-emphasis"
          >
            <VIcon
              icon="ri-file-unknow-line"
              size="40"
              class="mb-2 opacity-40"
            />
            <span class="text-body-2">Tidak ada invoice yang bisa dikirim</span>
          </div>

          <div
            v-for="group in groups"
            :key="group.key"
            class="px-4 pb-2 group-block"
          >
            <div class="section-label pt-3 pb-2">
              <VIcon
                icon="ri-user-3-line"
                size="14"
                color="primary"
                class="me-1"
              />
              {{ group.label }}
              <VChip
                size="x-small"
                color="primary"
                variant="tonal"
                class="ms-1"
              >
                {{ group.checkedIds.length }}/{{ group.invoices.length }}
              </VChip>
            </div>

            <div
              v-if="group.email"
              class="email-pill mb-2"
            >
              <VIcon
                icon="ri-mail-line"
                size="14"
                class="me-1"
              />
              {{ group.email }}
            </div>
            <VAlert
              v-else
              type="warning"
              variant="tonal"
              density="compact"
              class="mb-2"
            >
              Klien ini belum punya alamat email terdaftar — isi di halaman Data Investor (RESTO) atau Data Entitas (PT).
            </VAlert>

            <div
              v-if="!group.invoices.length"
              class="text-caption text-medium-emphasis py-2"
            >
              Tidak ada invoice yang bisa dikirim untuk klien ini.
            </div>

            <template v-else>
              <!-- Select all (per grup) -->
              <div
                class="select-all-row mb-2"
                @click="toggleAllInGroup(group)"
              >
                <VCheckbox
                  :model-value="group.checkedIds.length === group.invoices.length"
                  :indeterminate="group.checkedIds.length > 0 && group.checkedIds.length < group.invoices.length"
                  hide-details
                  density="compact"
                  color="primary"
                  class="flex-shrink-0"
                  style="pointer-events: none;"
                />
                <span class="text-body-2 font-weight-semibold">Pilih Semua</span>
              </div>

              <div class="d-flex flex-column gap-2">
                <div
                  v-for="inv in group.invoices"
                  :key="inv.id"
                  class="invoice-row"
                  :class="{ 'invoice-row--checked': group.checkedIds.includes(inv.id) }"
                  @click="toggleCheck(group, inv.id)"
                >
                  <VCheckbox
                    :model-value="group.checkedIds.includes(inv.id)"
                    hide-details
                    density="compact"
                    :color="inv.is_opening_balance ? 'warning' : 'primary'"
                    class="flex-shrink-0"
                    style="pointer-events: none;"
                  />
                  <div class="flex-grow-1 min-width-0">
                    <div class="d-flex align-center gap-2 mb-1">
                      <VChip
                        :color="inv.is_opening_balance ? 'warning' : 'primary'"
                        size="x-small"
                        variant="flat"
                        label
                      >
                        {{ inv.is_opening_balance ? 'OB' : 'Reguler' }}
                      </VChip>
                      <span class="text-body-2 font-weight-semibold">{{ inv.no_invoice }}</span>
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      Total: <strong>{{ formatCurrency(inv.subtotal) }}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </template>

        <!-- Phase: sending / result -->
        <template v-else>
          <div class="pa-5 d-flex flex-column gap-4">
            <template v-if="phase === 'sending'">
              <div class="d-flex align-center gap-3">
                <VProgressCircular
                  indeterminate
                  color="success"
                  size="28"
                />
                <span class="text-body-2">
                  {{ status?.status === 'queued'
                    ? 'Menunggu diproses...'
                    : `Mengirim ${status?.processed ?? 0} dari ${status?.total ?? 0}...` }}
                </span>
              </div>
              <VProgressLinear
                :model-value="progressPercent"
                color="success"
                height="8"
                rounded
              />
            </template>

            <template v-else>
              <VAlert
                :type="resultAlertType"
                density="compact"
                variant="tonal"
              >
                {{ resultText }}
              </VAlert>
              <div
                v-if="status?.results?.length"
                style="max-height: 260px; overflow-y: auto;"
              >
                <div
                  v-for="(r, idx) in status.results"
                  :key="idx"
                  class="result-row"
                >
                  <VIcon
                    :icon="r.success ? 'ri-checkbox-circle-fill' : 'ri-error-warning-fill'"
                    :color="r.success ? 'success' : 'error'"
                    size="16"
                    class="me-2 flex-shrink-0"
                  />
                  <div class="flex-grow-1 min-width-0">
                    <div class="text-body-2 font-weight-medium">
                      {{ r.label }}
                    </div>
                    <div
                      v-if="!r.success"
                      class="text-caption text-error"
                    >
                      {{ r.detail }}
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </template>
      </VCardText>

      <VDivider />

      <!-- Footer -->
      <div class="email-dialog-footer pa-4">
        <div class="d-flex align-center justify-space-between gap-3 flex-wrap">
          <div
            v-if="phase === 'review' && totalChecked"
            class="summary-pill"
          >
            <VIcon
              icon="ri-checkbox-circle-fill"
              size="16"
              color="success"
              class="me-1"
            />
            <span class="text-body-2 font-weight-semibold">{{ sendableGroups.length }} klien &bull; {{ totalChecked }} invoice dipilih</span>
          </div>
          <div
            v-else-if="phase === 'review'"
            class="text-caption text-medium-emphasis"
          >
            Pilih minimal 1 invoice
          </div>
          <VSpacer v-else />

          <div class="d-flex gap-2 ms-auto">
            <AppActionButton
              v-if="phase !== 'sending'"
              action="batalkan"
              size="small"
              @click="isOpen = false"
            >
              {{ phase === 'result' ? 'Tutup' : 'Batalkan' }}
            </AppActionButton>
            <AppActionButton
              v-if="phase === 'review'"
              action="custom"
              color="success"
              size="small"
              icon="ri-mail-send-line"
              :disabled="!sendableGroups.length"
              @click="doSend"
            >
              Kirim Email
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

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  preSelected: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue', 'sent'])

const { formatCurrency } = useFormatter()

const isOpen = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const loading = ref(false)
const groups = ref([])
const phase = ref('review') // 'review' | 'sending' | 'result'
const status = ref(null)

// Klien siap dikirim: sudah punya email TERDAFTAR dan minimal 1 invoice tercentang.
const sendableGroups = computed(() => groups.value.filter(g => g.email && g.checkedIds.length > 0))
const totalChecked = computed(() => sendableGroups.value.reduce((s, g) => s + g.checkedIds.length, 0))

const progressPercent = computed(() => {
  const s = status.value
  if (!s?.total) return 0

  return Math.min(100, Math.round(((s.processed ?? 0) / s.total) * 100))
})

const resultAlertType = computed(() => {
  const s = status.value
  if (!s) return 'info'
  if (s.status === 'failed') return 'error'
  if (s.results?.some(r => !r.success)) return 'warning'

  return 'success'
})

const resultText = computed(() => {
  const s = status.value
  if (!s) return ''
  if (s.status === 'failed') {
    return s.message || `Proses kirim email gagal. ${s.sent ?? 0} dari ${s.total ?? 0} sempat terkirim sebelum gagal.`
  }

  const failedCount = (s.results ?? []).filter(r => !r.success).length
  if (failedCount) {
    return `${s.sent} dari ${s.total} email berhasil terkirim. ${failedCount} gagal/dilewati — lihat detail di bawah.`
  }

  return `${s.sent} email berhasil terkirim.`
})

let pollTimer = null
let pollFailureCount = 0
const MAX_POLL_FAILURES = 5
const POLL_INTERVAL_MS = 2000

watch(isOpen, open => {
  if (open) {
    buildGroups()
  } else {
    clearTimeout(pollTimer)
    phase.value = 'review'
    status.value = null
  }
})

function toggleCheck(group, id) {
  const idx = group.checkedIds.indexOf(id)
  if (idx === -1) group.checkedIds.push(id)
  else group.checkedIds.splice(idx, 1)
}

function toggleAllInGroup(group) {
  if (group.checkedIds.length === group.invoices.length) group.checkedIds = []
  else group.checkedIds = group.invoices.map(inv => inv.id)
}

// Fetch ulang SEMUA invoice (Reguler + OB) tiap klien yang muncul di selection —
// bukan cuma yang ter-centang di tabel — supaya user bisa bebas
// tambah/kurangi invoice per klien sebelum kirim (mirror fetchRelated() di
// ShareInvoicesDialog.vue, tapi paralel utk banyak klien sekaligus krn di sini
// bisa blast ke >1 klien).
async function buildGroups() {
  loading.value = true
  phase.value = 'review'
  status.value = null
  groups.value = []

  const byKlien = new Map()
  for (const inv of props.preSelected) {
    const klienId = inv.klien_ar_id ?? inv.klien_ar?.id
    if (!klienId) continue

    if (!byKlien.has(klienId)) {
      byKlien.set(klienId, {
        klienArId: klienId,
        label: inv.klien_ar?.nama_klien ?? '—',
        email: inv.klien_ar?.email ?? null,
        preselectedIds: new Set(),
      })
    }
    byKlien.get(klienId).preselectedIds.add(inv.id)
  }

  const entries = [...byKlien.values()]

  try {
    groups.value = await Promise.all(entries.map(async entry => {
      try {
        const [resReg, resOb] = await Promise.all([
          api.get('/finance/invoices', { params: { klien_ar_id: entry.klienArId, per_page: 100 } }),
          api.get('/finance/opening-balance', { params: { klien_ar_id: entry.klienArId, per_page: 100 } }),
        ])

        const invoices = [
          ...(resOb.data?.data ?? []),
          ...(resReg.data?.data ?? []),
        ].filter(inv => inv.share_url)

        return {
          key: entry.klienArId,
          klienArId: entry.klienArId,
          label: entry.label,
          email: entry.email,
          invoices,
          checkedIds: invoices.filter(inv => entry.preselectedIds.has(inv.id)).map(inv => inv.id),
        }
      } catch {
        return {
          key: entry.klienArId,
          klienArId: entry.klienArId,
          label: entry.label,
          email: entry.email,
          invoices: [],
          checkedIds: [],
        }
      }
    }))
  } finally {
    loading.value = false
  }
}

async function doSend() {
  if (!sendableGroups.value.length) return

  phase.value = 'sending'
  status.value = { status: 'queued', total: sendableGroups.value.length, processed: 0, sent: 0, results: [] }
  pollFailureCount = 0

  try {
    const { data } = await api.post('/finance/invoices/email-blast', {
      recipients: sendableGroups.value.map(g => ({
        klien_ar_id: g.klienArId,
        invoice_ids: g.checkedIds,
      })),
    })

    const batchId = data?.data?.batch_id
    if (!batchId) throw new Error('batch_id tidak diterima dari server')

    poll(batchId)
  } catch (err) {
    phase.value = 'result'
    status.value = {
      status: 'failed',
      total: sendableGroups.value.length,
      sent: 0,
      results: [],
      message: err.response?.data?.message ?? 'Gagal memulai proses kirim email',
    }
  }
}

function poll(batchId) {
  clearTimeout(pollTimer)
  pollTimer = setTimeout(async () => {
    try {
      const res = await api.get(`/finance/invoices/email-blast/${batchId}/status`)
      const data = res.data?.data

      pollFailureCount = 0
      if (data) status.value = data

      if (data?.status === 'completed' || data?.status === 'failed') {
        phase.value = 'result'
        emit('sent')

        return
      }

      poll(batchId)
    } catch {
      pollFailureCount++
      if (pollFailureCount >= MAX_POLL_FAILURES) {
        status.value = { ...status.value, status: 'failed', message: 'Gagal memuat status pengiriman email.' }
        phase.value = 'result'

        return
      }
      poll(batchId)
    }
  }, POLL_INTERVAL_MS)
}
</script>

<style scoped>
.email-dialog-header {
  background: rgb(var(--v-theme-surface));
}

.email-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgb(var(--v-theme-primary));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.group-block:not(:last-child) {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  padding-bottom: 16px;
  margin-bottom: 4px;
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

.email-pill {
  display: inline-flex;
  align-items: center;
  background: rgba(var(--v-theme-primary), 0.08);
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 0.8125rem;
}

.select-all-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
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

.invoice-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface));
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.invoice-row:hover {
  border-color: rgba(var(--v-theme-primary), 0.4);
  background: rgba(var(--v-theme-primary), 0.03);
}

.invoice-row--checked {
  border-color: rgba(var(--v-theme-primary), 0.5);
  background: rgba(var(--v-theme-primary), 0.06);
}

.result-row {
  display: flex;
  align-items: flex-start;
  padding: 8px 4px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.result-row:last-child {
  border-bottom: none;
}

.email-dialog-footer {
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
