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
      <!-- Ringkasan Saldo -->
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

      <!-- Aksi DRAFT -->
      <VCard v-if="eb.status === 'DRAFT' && authStore.canOperateEndingBalance" class="mb-4">
        <VCardText class="d-flex align-center justify-space-between flex-wrap gap-3">
          <div class="text-body-2 text-medium-emphasis">
            Periode ini masih <strong>DRAFT</strong>. Setelah data diverifikasi, tutup periode untuk mengunci nilai.
          </div>
          <div class="d-flex gap-2">
            <VBtn
              variant="outlined"
              color="warning"
              prepend-icon="ri-refresh-line"
              :loading="recalculating"
              @click="doRecalculate"
            >
              Hitung Ulang
            </VBtn>
            <VBtn
              color="success"
              prepend-icon="ri-lock-line"
              :loading="locking"
              @click="showLockDialog = true"
            >
              Tutup Periode
            </VBtn>
          </div>
        </VCardText>
      </VCard>

      <!-- Form Submit Koreksi -->
      <VCard
        v-if="eb.status === 'LOCKED' && authStore.canOperateEndingBalance && !eb.has_active_koreksi"
        class="mb-4"
      >
        <VCardTitle class="pt-4 px-4 text-body-1 font-weight-bold">Ajukan Koreksi Manual</VCardTitle>
        <VCardText>
          <VRow>
            <VCol cols="12" md="4">
              <VTextField
                v-model="koreksiForm.nilai_koreksi"
                label="Nilai Koreksi (positif = tambah, negatif = kurang)"
                type="number"
                :hint="`Saldo akhir baru: ${formatRp(Number(eb.saldo_akhir_final) + Number(koreksiForm.nilai_koreksi || 0))}`"
                persistent-hint
              />
            </VCol>
            <VCol cols="12" md="8">
              <VTextarea
                v-model="koreksiForm.alasan_koreksi"
                label="Alasan Koreksi"
                rows="2"
                auto-grow
              />
            </VCol>
            <VCol cols="12" md="6">
              <VTextField
                v-model="koreksiForm.dokumen_url"
                label="URL Dokumen Pendukung (opsional)"
              />
            </VCol>
          </VRow>
          <VAlert v-if="koreksiError" type="error" class="mt-2" density="compact">{{ koreksiError }}</VAlert>
        </VCardText>
        <VCardActions class="px-4 pb-4">
          <VSpacer />
          <VBtn color="primary" :loading="submittingKoreksi" @click="submitKoreksi">
            Ajukan Koreksi
          </VBtn>
        </VCardActions>
      </VCard>

      <VAlert
        v-if="eb.has_active_koreksi"
        type="info"
        class="mb-4"
        density="compact"
      >
        Terdapat koreksi yang sedang dalam proses persetujuan. Koreksi baru bisa diajukan setelah selesai.
      </VAlert>

      <!-- Riwayat Koreksi -->
      <VCard v-if="eb.koreksi?.length">
        <VCardTitle class="pt-4 px-4 text-body-1 font-weight-bold">Riwayat Koreksi</VCardTitle>
        <VTable density="compact">
          <thead>
            <tr>
              <th>Nilai Koreksi</th>
              <th>Alasan</th>
              <th>Status</th>
              <th>Diajukan Oleh</th>
              <th>SPV</th>
              <th>Manager</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="k in eb.koreksi" :key="k.id">
              <td class="font-weight-bold" :class="k.nilai_koreksi >= 0 ? 'text-success' : 'text-error'">
                {{ k.nilai_koreksi >= 0 ? '+' : '' }}{{ formatRp(k.nilai_koreksi) }}
              </td>
              <td>{{ k.alasan_koreksi }}</td>
              <td>
                <VChip size="x-small" :color="statusColor(k.status)" label>{{ k.status }}</VChip>
              </td>
              <td class="text-caption">{{ k.submitted_by }}<br>{{ formatDatetime(k.submitted_at) }}</td>
              <td class="text-caption">
                <template v-if="k.spv">
                  {{ k.spv }}<br>
                  <span :class="k.status === 'REJECTED' && !k.manager ? 'text-error' : 'text-success'">
                    {{ k.spv_note }}
                  </span>
                </template>
                <span v-else class="text-medium-emphasis">—</span>
              </td>
              <td class="text-caption">
                <template v-if="k.manager">
                  {{ k.manager }}<br>
                  <span :class="k.status === 'REJECTED' ? 'text-error' : 'text-success'">
                    {{ k.manager_note }}
                  </span>
                </template>
                <span v-else class="text-medium-emphasis">—</span>
              </td>
            </tr>
          </tbody>
        </VTable>
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
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
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

const koreksiForm      = reactive({ nilai_koreksi: '', alasan_koreksi: '', dokumen_url: '' })
const submittingKoreksi = ref(false)
const koreksiError      = ref('')

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

async function fetchEb() {
  loading.value = true
  try {
    const { data } = await api.get(`/finance/ending-balance/${route.params.id}`)
    eb.value = data.data
  } finally {
    loading.value = false
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

async function submitKoreksi() {
  koreksiError.value = ''
  if (!koreksiForm.nilai_koreksi || !koreksiForm.alasan_koreksi) {
    koreksiError.value = 'Nilai koreksi dan alasan wajib diisi.'
    return
  }
  submittingKoreksi.value = true
  try {
    await api.post(`/finance/ending-balance/${eb.value.id}/koreksi`, koreksiForm)
    koreksiForm.nilai_koreksi  = ''
    koreksiForm.alasan_koreksi = ''
    koreksiForm.dokumen_url    = ''
    fetchEb()
  } catch (e) {
    koreksiError.value = e?.response?.data?.message ?? 'Gagal mengajukan koreksi.'
  } finally {
    submittingKoreksi.value = false
  }
}

onMounted(fetchEb)
</script>
