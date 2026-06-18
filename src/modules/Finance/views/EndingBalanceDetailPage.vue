<template>
  <div>
    <PageHeader
      :title="eb ? `Ending Balance — ${eb.nama_klien}` : 'Detail Ending Balance'"
      :subtitle="eb ? `${formatDate(eb.periode_awal)} – ${formatDate(eb.periode_akhir)}` : ''"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Ending Balance', to: { name: 'finance-ending-balance' } },
        { title: 'Detail', disabled: true },
      ]"
    >
      <VBtn variant="text" prepend-icon="ri-arrow-left-line" :to="{ name: 'finance-ending-balance' }">Kembali</VBtn>
    </PageHeader>

    <div v-if="loading" class="text-center py-10">
      <VProgressCircular indeterminate />
    </div>

    <template v-else-if="eb">
      <!-- ── 1. Ringkasan Saldo ── -->
      <VRow class="mb-4">
        <VCol cols="6" md="3">
          <VCard>
            <VCardText>
              <div class="text-caption text-medium-emphasis mb-1">Saldo Awal</div>
              <div class="text-h6 font-weight-bold">{{ formatRp(eb.saldo_awal) }}</div>
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="6" md="3">
          <VCard>
            <VCardText>
              <div class="text-caption text-medium-emphasis mb-1">Invoice Masuk</div>
              <div class="text-h6 font-weight-bold text-primary">+ {{ formatRp(eb.invoice_masuk) }}</div>
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="6" md="3">
          <VCard>
            <VCardText>
              <div class="text-caption text-medium-emphasis mb-1">Pembayaran</div>
              <div class="text-h6 font-weight-bold text-success">- {{ formatRp(eb.pembayaran) }}</div>
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="6" md="3">
          <VCard :color="eb.saldo_akhir_sistem !== eb.saldo_akhir_final ? 'warning' : undefined">
            <VCardText>
              <div class="text-caption text-medium-emphasis mb-1">
                Saldo Akhir Final
                <VChip v-if="eb.status === 'LOCKED'" size="x-small" color="success" class="ml-1">LOCKED</VChip>
                <VChip v-else size="x-small" color="warning" class="ml-1">DRAFT</VChip>
              </div>
              <div class="text-h6 font-weight-bold">{{ formatRp(eb.saldo_akhir_final) }}</div>
              <div v-if="eb.saldo_akhir_sistem !== eb.saldo_akhir_final" class="text-caption">
                Sistem: {{ formatRp(eb.saldo_akhir_sistem) }}
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Info periode terkunci -->
      <VAlert
        v-if="eb.status === 'LOCKED'"
        type="success"
        variant="tonal"
        density="compact"
        icon="ri-lock-line"
        class="mb-4"
      >
        Periode dikunci<template v-if="eb.locked_by"> oleh <strong>{{ eb.locked_by }}</strong></template><template v-if="eb.locked_at"> pada {{ formatDatetime(eb.locked_at) }}</template>.
        Perubahan saldo memerlukan koreksi manual dengan persetujuan SPV dan Manager.
      </VAlert>

      <!-- Aksi DRAFT -->
      <VCard v-if="eb.status === 'DRAFT' && authStore.canOperateEndingBalance" class="mb-4">
        <VCardText class="d-flex align-center justify-space-between flex-wrap gap-3">
          <div class="text-body-2 text-medium-emphasis">
            Periode ini masih <strong>DRAFT</strong>. Setelah data diverifikasi, tutup periode untuk mengunci nilai.
          </div>
          <div class="d-flex gap-2">
            <VBtn variant="outlined" color="warning" prepend-icon="ri-refresh-line" :loading="recalculating" @click="doRecalculate">
              Hitung Ulang
            </VBtn>
            <VBtn color="success" prepend-icon="ri-lock-line" :loading="locking" @click="showLockDialog = true">
              Tutup Periode
            </VBtn>
          </div>
        </VCardText>
      </VCard>

      <!-- Alert koreksi aktif -->
      <VAlert v-if="eb.has_active_koreksi" type="info" class="mb-4" density="compact">
        Terdapat koreksi yang sedang dalam proses persetujuan. Koreksi baru bisa diajukan setelah selesai.
      </VAlert>

      <!-- Aksi Koreksi (LOCKED) -->
      <VCard v-if="eb.status === 'LOCKED' && authStore.canOperateEndingBalance && !eb.has_active_koreksi" class="mb-4">
        <VCardText class="d-flex align-center justify-space-between flex-wrap gap-3">
          <div class="text-body-2 text-medium-emphasis">
            Periode ini sudah <strong>TERKUNCI</strong>. Jika ada perbedaan nilai, ajukan koreksi untuk diproses melalui persetujuan SPV dan Manager.
          </div>
          <VBtn color="info" prepend-icon="ri-pencil-line" @click="openKoreksiDialog">Ajukan Koreksi</VBtn>
        </VCardText>
      </VCard>

      <!-- ── 2. Perhitungan Saldo ── -->
      <VCard class="mb-4">
        <VCardTitle class="pt-4 px-5 text-body-1 font-weight-bold">Perhitungan Saldo</VCardTitle>
        <VDivider />
        <VCardText class="px-5 py-4">
          <div class="calc-row">
            <span class="text-medium-emphasis">Saldo Awal</span>
            <span>{{ formatRp(eb.saldo_awal) }}</span>
          </div>
          <div class="calc-row">
            <span class="text-medium-emphasis">+ Invoice Masuk</span>
            <span class="text-primary">{{ formatRp(eb.invoice_masuk) }}</span>
          </div>
          <div class="calc-row">
            <span class="text-medium-emphasis">− Pembayaran</span>
            <span class="text-success">{{ formatRp(eb.pembayaran) }}</span>
          </div>
          <VDivider class="my-3" />
          <div class="calc-row font-weight-bold">
            <span>= Saldo Akhir Sistem</span>
            <span>{{ formatRp(eb.saldo_akhir_sistem) }}</span>
          </div>
          <template v-if="eb.saldo_akhir_final !== eb.saldo_akhir_sistem">
            <div class="calc-row mt-2">
              <span class="text-medium-emphasis">
                {{ koreksiNet >= 0 ? '+' : '−' }} Koreksi Disetujui
              </span>
              <span :class="koreksiNet >= 0 ? 'text-success' : 'text-error'">
                {{ formatRp(Math.abs(koreksiNet)) }}
              </span>
            </div>
            <VDivider class="my-3" />
            <div class="calc-row font-weight-bold text-primary">
              <span>= Saldo Akhir Final</span>
              <span>{{ formatRp(eb.saldo_akhir_final) }}</span>
            </div>
          </template>
        </VCardText>
      </VCard>

      <!-- ── 3. Daftar Invoice ── -->
      <VCard class="mb-4">
        <VCardTitle class="pt-4 px-5 text-body-1 font-weight-bold">
          Daftar Invoice
          <VChip v-if="invoices.length" size="x-small" color="primary" class="ms-2">{{ invoices.length }}</VChip>
        </VCardTitle>
        <VDivider />
        <div v-if="invoicesLoading" class="text-center pa-8">
          <VProgressCircular indeterminate />
        </div>
        <VAlert v-else-if="invoicesError" type="error" class="ma-4" density="compact">{{ invoicesError }}</VAlert>
        <template v-else>
          <div v-if="!invoices.length" class="text-center text-medium-emphasis pa-8">
            Tidak ada invoice dalam periode ini.
          </div>
          <VTable v-else density="compact" class="eb-invoice-table">
            <thead>
              <tr>
                <th>No Invoice</th>
                <th>Tgl Invoice</th>
                <th>Jatuh Tempo</th>
                <th class="text-end">Total Tagihan</th>
                <th class="text-end">Terbayar</th>
                <th class="text-end">Sisa</th>
                <th class="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="inv in invoices" :key="inv.id">
                <td class="font-weight-medium text-no-wrap">
                  {{ inv.no_invoice }}
                  <VChip v-if="inv.is_opening_balance" size="x-small" color="secondary" label class="ms-1">OB</VChip>
                </td>
                <td class="text-caption text-medium-emphasis text-no-wrap">{{ formatDate(inv.tanggal_invoice) }}</td>
                <td class="text-caption text-no-wrap" :class="isOverdue(inv) ? 'text-error font-weight-medium' : 'text-medium-emphasis'">
                  {{ formatDate(inv.tanggal_jatuh_tempo) }}
                </td>
                <td class="text-end text-no-wrap">{{ formatRp(inv.subtotal) }}</td>
                <td class="text-end text-no-wrap text-success">{{ formatRp(inv.total_pembayaran) }}</td>
                <td class="text-end text-no-wrap font-weight-bold" :class="sisaPerInvoice(inv) > 0 ? 'text-warning' : 'text-success'">
                  {{ formatRp(sisaPerInvoice(inv)) }}
                </td>
                <td class="text-center">
                  <VChip size="x-small" :color="invoiceStatusColor(inv.status)" label>{{ inv.status }}</VChip>
                </td>
              </tr>
            </tbody>
          </VTable>
        </template>
      </VCard>

      <!-- ── 4. Daftar Pembayaran ── -->
      <VCard class="mb-4">
        <VCardTitle class="pt-4 px-5 text-body-1 font-weight-bold">
          Daftar Pembayaran
          <VChip v-if="payments.length" size="x-small" color="success" class="ms-2">{{ payments.length }}</VChip>
        </VCardTitle>
        <VDivider />
        <div v-if="paymentsLoading" class="text-center pa-8">
          <VProgressCircular indeterminate />
        </div>
        <VAlert v-else-if="paymentsError" type="error" class="ma-4" density="compact">{{ paymentsError }}</VAlert>
        <template v-else>
          <div v-if="!payments.length" class="text-center text-medium-emphasis pa-8">
            Tidak ada pembayaran dalam periode ini.
          </div>
          <VTable v-else density="compact" class="eb-invoice-table">
            <thead>
              <tr>
                <th>No Invoice</th>
                <th>Tanggal</th>
                <th class="text-end">Jumlah</th>
                <th>Metode</th>
                <th>No Referensi</th>
                <th>Jenis</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in payments" :key="p.id" :class="p.jenis === 'ALO_CROSS' ? 'bg-surface-variant' : ''">
                <td class="font-weight-medium text-no-wrap">
                  {{ p.no_invoice }}
                </td>
                <td class="text-caption text-medium-emphasis text-no-wrap">{{ formatDate(p.tanggal_pembayaran) }}</td>
                <td class="text-end text-no-wrap font-weight-bold" :class="p.jenis === 'ALO_CROSS' ? 'text-medium-emphasis' : 'text-success'">
                  {{ formatRp(p.jumlah_pembayaran) }}
                </td>
                <td>
                  <VChip size="x-small" :color="metodeColor(p.metode_pembayaran)" label>{{ p.metode_pembayaran }}</VChip>
                </td>
                <td class="text-caption text-medium-emphasis">{{ p.no_referensi || '—' }}</td>
                <td>
                  <VChip v-if="p.jenis === 'ALO'" size="x-small" color="info" label>ALO</VChip>
                  <VChip v-else-if="p.jenis === 'PDM'" size="x-small" color="secondary" label>PDM</VChip>
                  <VTooltip v-else-if="p.jenis === 'ALO_CROSS'" :text="`Dialokasikan ke: ${p.nama_klien_tujuan}`">
                    <template #activator="{ props }">
                      <VChip v-bind="props" size="x-small" color="warning" label>ALO → Klien Lain</VChip>
                    </template>
                  </VTooltip>
                  <span v-else class="text-caption text-medium-emphasis">—</span>
                </td>
                <td class="text-caption text-medium-emphasis" style="max-width: 200px; white-space: normal;">{{ p.keterangan || '—' }}</td>
              </tr>
            </tbody>
          </VTable>
        </template>
      </VCard>

      <!-- ── 5. Riwayat Koreksi Ending Balance ── -->
      <VCard class="mb-4">
        <VCardTitle class="pt-4 px-5 text-body-1 font-weight-bold">
          Riwayat Koreksi Ending Balance
          <VChip v-if="eb.koreksi?.length" size="x-small" color="info" class="ms-2">{{ eb.koreksi.length }}</VChip>
        </VCardTitle>
        <VDivider />
        <div v-if="!eb.koreksi?.length" class="text-center text-medium-emphasis pa-8">
          Belum ada riwayat koreksi untuk periode ini.
        </div>
        <VTable v-else density="comfortable" class="eb-koreksi-table">
          <thead>
            <tr>
              <th class="text-no-wrap">Nilai Koreksi</th>
              <th class="text-no-wrap">Invoice</th>
              <th>Alasan</th>
              <th class="text-no-wrap">Status</th>
              <th class="text-no-wrap">Pengaju</th>
              <th class="text-no-wrap">Keputusan SPV</th>
              <th class="text-no-wrap">Keputusan Manager</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="k in eb.koreksi" :key="k.id">
              <td class="font-weight-bold text-no-wrap" :class="k.nilai_koreksi >= 0 ? 'text-success' : 'text-error'">
                {{ k.nilai_koreksi >= 0 ? '+' : '' }}{{ formatRp(k.nilai_koreksi) }}
              </td>
              <td class="text-caption text-no-wrap">
                <span v-if="k.no_invoice">{{ k.no_invoice }}</span>
                <span v-else class="text-medium-emphasis">—</span>
              </td>
              <td style="max-width: 240px; white-space: normal;">{{ k.alasan_koreksi }}</td>
              <td>
                <VChip size="x-small" :color="statusColor(k.status)" label>{{ statusLabel(k.status) }}</VChip>
              </td>
              <td class="text-caption text-no-wrap">
                <span class="font-weight-medium">{{ k.submitted_by }}</span><br>
                <span class="text-medium-emphasis">{{ formatDatetime(k.submitted_at) }}</span>
              </td>
              <td class="text-caption">
                <template v-if="k.spv">
                  <span class="font-weight-medium">{{ k.spv }}</span><br>
                  <span :class="k.status === 'REJECTED' && !k.manager ? 'text-error' : 'text-success'">{{ k.spv_note || '—' }}</span><br>
                  <span class="text-medium-emphasis">{{ formatDatetime(k.spv_actioned_at) }}</span>
                </template>
                <span v-else class="text-medium-emphasis">Menunggu</span>
              </td>
              <td class="text-caption">
                <template v-if="k.manager">
                  <span class="font-weight-medium">{{ k.manager }}</span><br>
                  <span :class="k.status === 'REJECTED' ? 'text-error' : 'text-success'">{{ k.manager_note || '—' }}</span><br>
                  <span class="text-medium-emphasis">{{ formatDatetime(k.manager_actioned_at) }}</span>
                </template>
                <span v-else class="text-medium-emphasis">{{ k.spv ? 'Menunggu' : '—' }}</span>
              </td>
            </tr>
          </tbody>
        </VTable>
      </VCard>

      <!-- ── 6. Aktivitas / Audit Trail ── -->
      <VCard class="mb-4">
        <VCardTitle class="pt-4 px-5 text-body-1 font-weight-bold">Aktivitas</VCardTitle>
        <VDivider />
        <VCardText class="px-5 py-4">
          <VRow dense>
            <VCol cols="12" sm="6" md="4">
              <div class="audit-row">
                <span class="text-caption text-medium-emphasis">Dibuat pada</span>
                <span class="text-body-2">{{ formatDatetime(eb.created_at) }}</span>
              </div>
            </VCol>
            <VCol cols="12" sm="6" md="4">
              <div class="audit-row">
                <span class="text-caption text-medium-emphasis">Dibuat oleh</span>
                <span class="text-body-2 font-weight-medium">{{ eb.created_by || '—' }}</span>
              </div>
            </VCol>
            <VCol cols="12" sm="6" md="4">
              <div class="audit-row">
                <span class="text-caption text-medium-emphasis">Dihitung pada</span>
                <span class="text-body-2">{{ formatDatetime(eb.updated_at) }}</span>
              </div>
            </VCol>
            <template v-if="eb.status === 'LOCKED'">
              <VCol cols="12" sm="6" md="4">
                <div class="audit-row">
                  <span class="text-caption text-medium-emphasis">Ditutup oleh</span>
                  <span class="text-body-2 font-weight-medium">{{ eb.locked_by || '—' }}</span>
                </div>
              </VCol>
              <VCol cols="12" sm="6" md="4">
                <div class="audit-row">
                  <span class="text-caption text-medium-emphasis">Ditutup pada</span>
                  <span class="text-body-2">{{ formatDatetime(eb.locked_at) }}</span>
                </div>
              </VCol>
            </template>
          </VRow>
        </VCardText>
      </VCard>
    </template>
  </div>

  <!-- Dialog Konfirmasi Lock -->
  <VDialog v-model="showLockDialog" max-width="420">
    <VCard>
      <VCardTitle class="pt-4 px-4">Tutup Periode</VCardTitle>
      <VCardText>
        Kunci ending balance <strong>{{ eb?.nama_klien }}</strong> untuk periode
        {{ formatDate(eb?.periode_awal) }} – {{ formatDate(eb?.periode_akhir) }}?
        <br><br>
        Setelah dikunci, nilai tidak bisa diubah. Koreksi manual memerlukan persetujuan SPV dan Manager.
      </VCardText>
      <VCardActions class="px-4 pb-4">
        <VSpacer />
        <VBtn variant="text" @click="showLockDialog = false">Batal</VBtn>
        <VBtn color="success" :loading="locking" @click="doLock">Kunci</VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <!-- Dialog Ajukan Koreksi -->
  <VDialog v-model="showKoreksiDialog" max-width="680" persistent>
    <VCard>
      <VCardTitle class="pt-4 px-4 text-body-1 font-weight-bold">Ajukan Koreksi Manual</VCardTitle>
      <VCardSubtitle class="px-4 pb-2 text-caption">
        {{ eb?.nama_klien }} · {{ formatDate(eb?.periode_awal) }} – {{ formatDate(eb?.periode_akhir) }}
      </VCardSubtitle>
      <VDivider />

      <VCard variant="tonal" class="mx-4 mt-4 mb-1" rounded="lg">
        <VCardText class="py-3 px-4">
          <VRow dense>
            <VCol cols="12" sm="4">
              <div class="text-caption text-medium-emphasis mb-1">Saldo Akhir Sistem</div>
              <div class="text-body-1 font-weight-medium">{{ formatRp(eb?.saldo_akhir_sistem) }}</div>
            </VCol>
            <VCol cols="12" sm="4">
              <div class="text-caption text-medium-emphasis mb-1">Saldo Akhir Final (Sekarang)</div>
              <div class="text-body-1 font-weight-bold">{{ formatRp(eb?.saldo_akhir_final) }}</div>
            </VCol>
            <VCol cols="12" sm="4">
              <div class="text-caption text-medium-emphasis mb-1">Saldo Setelah Koreksi</div>
              <div class="text-body-1 font-weight-bold text-primary">
                {{ formatRp(Number(eb?.saldo_akhir_final ?? 0) + nilaiKoreksiComputed) }}
              </div>
            </VCol>
          </VRow>
        </VCardText>
      </VCard>

      <VCardText class="pt-3">
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
              v-model="koreksiForm.jumlah_koreksi"
              label="Jumlah Koreksi"
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
              hint="Wajib diisi. Maks 1000 karakter."
              persistent-hint
            />
          </VCol>
          <VCol cols="12">
            <VTextField
              v-model="koreksiForm.dokumen_url"
              label="URL Dokumen Pendukung (opsional)"
              hint="Lampirkan link Google Drive, SharePoint, atau URL lainnya"
              persistent-hint
            />
          </VCol>
        </VRow>
        <VAlert type="info" density="compact" variant="tonal" icon="ri-shield-check-line" class="mt-4">
          Koreksi ini memerlukan persetujuan dua tahap: <strong>SPV</strong> terlebih dahulu, kemudian <strong>Manager</strong>. Saldo tidak akan berubah sampai keduanya menyetujui.
        </VAlert>
        <VAlert v-if="koreksiError" type="error" class="mt-2" density="compact">{{ koreksiError }}</VAlert>
      </VCardText>
      <VCardActions class="px-4 pb-4">
        <VSpacer />
        <VBtn variant="text" :disabled="submittingKoreksi" @click="showKoreksiDialog = false">Batal</VBtn>
        <VBtn color="primary" :loading="submittingKoreksi" @click="submitKoreksiDialog">Ajukan Koreksi</VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import api from '@/utils/axios'

const route     = useRoute()
const authStore = useAuthStore()

const loading  = ref(false)
const eb       = ref(null)

const recalculating  = ref(false)
const locking        = ref(false)
const showLockDialog = ref(false)

// Invoice
const invoices        = ref([])
const invoicesLoading = ref(false)
const invoicesError   = ref('')

// Pembayaran
const payments        = ref([])
const paymentsLoading = ref(false)
const paymentsError   = ref('')

// Koreksi dialog
const showKoreksiDialog = ref(false)
const koreksiForm       = reactive({ tipe_koreksi: 'tambah', jumlah_koreksi: '', alasan_koreksi: '', dokumen_url: '' })
const submittingKoreksi = ref(false)
const koreksiError      = ref('')

const nilaiKoreksiComputed = computed(() => {
  const jumlah = Number(koreksiForm.jumlah_koreksi || 0)
  return koreksiForm.tipe_koreksi === 'tambah' ? jumlah : -jumlah
})

// Net koreksi yang sudah disetujui (saldo_akhir_final - saldo_akhir_sistem)
const koreksiNet = computed(() => (eb.value?.saldo_akhir_final ?? 0) - (eb.value?.saldo_akhir_sistem ?? 0))

function formatRp(val) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val ?? 0)
}
function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}
function formatDatetime(d) {
  if (!d) return '-'
  return new Date(d).toLocaleString('id-ID')
}
function statusColor(s) {
  return { PENDING_SPV: 'warning', PENDING_MANAGER: 'info', APPROVED: 'success', REJECTED: 'error' }[s] ?? 'default'
}
function statusLabel(s) {
  return { PENDING_SPV: 'Menunggu SPV', PENDING_MANAGER: 'Menunggu Manager', APPROVED: 'Disetujui', REJECTED: 'Ditolak' }[s] ?? s
}
function invoiceStatusColor(s) {
  return { DRAFT: 'default', TERKIRIM: 'primary', SEBAGIAN: 'warning', LUNAS: 'success' }[s] ?? 'default'
}
function metodeColor(m) {
  return { TRANSFER: 'primary', CASH: 'success', GIRO: 'info' }[m] ?? 'default'
}
function sisaPerInvoice(inv) {
  return inv.subtotal === 0
    ? inv.sisa_tagihan
    : Math.max(0, inv.subtotal - inv.total_pembayaran)
}
function isOverdue(inv) {
  return inv.tanggal_jatuh_tempo
    && sisaPerInvoice(inv) > 0
    && inv.tanggal_jatuh_tempo < new Date().toISOString().slice(0, 10)
}

async function fetchEb() {
  loading.value = true
  try {
    const { data } = await api.get(`/finance/ending-balance/${route.params.id}`)
    eb.value = data.data
  } finally {
    loading.value = false
  }
}

async function fetchInvoices() {
  invoicesLoading.value = true
  invoicesError.value = ''
  try {
    const { data } = await api.get(`/finance/ending-balance/${route.params.id}/invoices`)
    invoices.value = data.data ?? []
  } catch (e) {
    invoicesError.value = e?.response?.data?.message ?? 'Gagal memuat data invoice.'
  } finally {
    invoicesLoading.value = false
  }
}

async function fetchPayments() {
  paymentsLoading.value = true
  paymentsError.value = ''
  try {
    const { data } = await api.get(`/finance/ending-balance/${route.params.id}/payments`)
    payments.value = data.data ?? []
  } catch (e) {
    paymentsError.value = e?.response?.data?.message ?? 'Gagal memuat data pembayaran.'
  } finally {
    paymentsLoading.value = false
  }
}

async function doRecalculate() {
  recalculating.value = true
  try {
    const { data } = await api.patch(`/finance/ending-balance/${eb.value.id}/recalculate`)
    eb.value = data.data
  } catch (e) {
    alert(e?.response?.data?.message ?? 'Gagal menghitung ulang.')
  } finally {
    recalculating.value = false
  }
}

async function doLock() {
  locking.value = true
  try {
    const { data } = await api.patch(`/finance/ending-balance/${eb.value.id}/lock`)
    eb.value = data.data
    showLockDialog.value = false
  } catch (e) {
    alert(e?.response?.data?.message ?? 'Gagal mengunci.')
  } finally {
    locking.value = false
  }
}

function openKoreksiDialog() {
  koreksiForm.tipe_koreksi   = 'tambah'
  koreksiForm.jumlah_koreksi = ''
  koreksiForm.alasan_koreksi = ''
  koreksiForm.dokumen_url    = ''
  koreksiError.value         = ''
  showKoreksiDialog.value    = true
}

async function submitKoreksiDialog() {
  koreksiError.value = ''
  if (!koreksiForm.jumlah_koreksi || !koreksiForm.alasan_koreksi) {
    koreksiError.value = 'Jumlah koreksi dan alasan wajib diisi.'
    return
  }
  submittingKoreksi.value = true
  try {
    const payload = {
      nilai_koreksi:  nilaiKoreksiComputed.value,
      alasan_koreksi: koreksiForm.alasan_koreksi,
      dokumen_url:    koreksiForm.dokumen_url,
    }
    await api.post(`/finance/ending-balance/${eb.value.id}/koreksi`, payload)
    showKoreksiDialog.value = false
    eb.value = { ...eb.value, has_active_koreksi: true }
  } catch (e) {
    koreksiError.value = e?.response?.data?.message ?? 'Gagal mengajukan koreksi.'
  } finally {
    submittingKoreksi.value = false
  }
}

onMounted(() => {
  fetchEb()
  fetchInvoices()
  fetchPayments()
})
</script>

<style scoped>
.calc-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.audit-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 0;
}

.eb-invoice-table :deep(th) {
  white-space: nowrap;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.eb-invoice-table :deep(td) {
  vertical-align: middle;
}
.eb-koreksi-table :deep(td) {
  vertical-align: top;
}
</style>
