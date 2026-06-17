<template>
  <div>
    <PageHeader
      title="Approval Koreksi Ending Balance"
      subtitle="Koreksi saldo akhir yang menunggu tindakan Anda"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Ending Balance', to: { name: 'finance-ending-balance' } },
        { title: 'Approval Koreksi', disabled: true },
      ]"
    >
      <VBtn variant="text" prepend-icon="ri-arrow-left-line" :to="{ name: 'finance-ending-balance' }">Kembali</VBtn>
    </PageHeader>

    <VCard :loading="loading">
      <VCardText v-if="!loading && !rows.length" class="text-center text-medium-emphasis py-10">
        Tidak ada koreksi yang menunggu persetujuan Anda.
      </VCardText>

      <VTable v-else density="comfortable">
        <thead>
          <tr>
            <th>Klien</th>
            <th>Nilai Koreksi</th>
            <th>Alasan</th>
            <th>Diajukan</th>
            <th class="text-center">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="k in rows" :key="k.id">
            <td>
              <div class="font-weight-medium">{{ k.nama_klien }}</div>
              <VBtn
                size="x-small"
                variant="text"
                color="primary"
                :to="{ name: 'finance-ending-balance-show', params: { id: k.ending_balance_id } }"
              >
                Lihat EB
              </VBtn>
            </td>
            <td class="font-weight-bold" :class="k.nilai_koreksi >= 0 ? 'text-success' : 'text-error'">
              {{ k.nilai_koreksi >= 0 ? '+' : '' }}{{ formatRp(k.nilai_koreksi) }}
            </td>
            <td style="max-width: 260px; white-space: normal;">{{ k.alasan_koreksi }}</td>
            <td class="text-caption">
              {{ k.submitted_by }}<br>{{ formatDatetime(k.submitted_at) }}
            </td>
            <td>
              <div class="d-flex gap-2 justify-center">
                <!-- Note input per baris -->
                <VTextField
                  v-model="notes[k.id]"
                  label="Catatan"
                  density="compact"
                  hide-details
                  style="max-width: 180px"
                />
                <VBtn
                  color="success"
                  size="small"
                  :loading="actioning === k.id + '_approve'"
                  @click="doAction(k, 'approve')"
                >
                  Approve
                </VBtn>
                <VBtn
                  color="error"
                  size="small"
                  variant="outlined"
                  :loading="actioning === k.id + '_reject'"
                  @click="doAction(k, 'reject')"
                >
                  Tolak
                </VBtn>
              </div>
            </td>
          </tr>
        </tbody>
      </VTable>
    </VCard>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import api from '@/utils/axios'

const authStore = useAuthStore()
const loading   = ref(false)
const rows      = ref([])
const notes     = reactive({})
const actioning = ref(null)

function formatRp(val) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val ?? 0)
}
function formatDatetime(d) {
  if (!d) return '-'
  return new Date(d).toLocaleString('id-ID')
}

async function fetchPending() {
  loading.value = true
  try {
    const { data } = await api.get('/finance/ending-balance/koreksi/pending')
    rows.value = data.data ?? []
  } finally {
    loading.value = false
  }
}

async function doAction(koreksi, action) {
  const key    = `${koreksi.id}_${action}`
  const note   = notes[koreksi.id] ?? ''
  const isSPV  = koreksi.status === 'PENDING_SPV'
  const suffix = isSPV ? `-spv` : `-manager`
  const url    = `/finance/ending-balance/koreksi/${koreksi.id}/${action}${suffix}`

  if (action === 'reject' && !note) {
    alert('Catatan wajib diisi saat menolak koreksi.')
    return
  }

  actioning.value = key
  try {
    await api.patch(url, { note })
    fetchPending()
  } catch (e) {
    alert(e?.response?.data?.message ?? 'Terjadi kesalahan.')
  } finally {
    actioning.value = null
  }
}

onMounted(fetchPending)
</script>
