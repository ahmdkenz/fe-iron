<template>
  <div class="bundle-page">
    <div
      v-if="loading"
      class="d-flex justify-center align-center py-16"
    >
      <VProgressCircular
        indeterminate
        color="primary"
        size="52"
      />
    </div>

    <VAlert
      v-else-if="error"
      type="error"
      variant="tonal"
      class="ma-4"
    >
      {{ error }}
    </VAlert>

    <template v-else-if="data">
      <!-- Header -->
      <div class="bundle-header">
        <div class="bundle-header-content">
          <div class="text-overline text-medium-emphasis mb-1">
            REKAP TAGIHAN B2B
          </div>
          <div class="text-h5 font-weight-bold">
            {{ data.klien.nama_klien }}
          </div>
          <VChip
            color="info"
            size="small"
            variant="tonal"
            class="mt-1"
          >
            {{ data.klien.kode_klien }}
          </VChip>
        </div>
      </div>

      <div class="bundle-body">
        <!-- Ringkasan Grand Total -->
        <VCard class="mb-4" color="primary" variant="tonal">
          <VCardText class="pa-4">
            <VRow>
              <VCol cols="6" class="text-center">
                <div class="text-caption text-medium-emphasis">Total Tagihan</div>
                <div class="text-h6 font-weight-bold">{{ formatCurrency(data.grand_total) }}</div>
              </VCol>
              <VCol cols="6" class="text-center">
                <div class="text-caption text-medium-emphasis">Sisa Tagihan</div>
                <div
                  class="text-h6 font-weight-bold"
                  :class="data.grand_sisa > 0 ? 'text-error' : 'text-success'"
                >
                  {{ formatCurrency(data.grand_sisa) }}
                </div>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>

        <!-- Daftar per Resto -->
        <VCard
          v-for="(restoGroup, idx) in data.restos"
          :key="idx"
          class="mb-4"
        >
          <div class="d-flex align-center gap-2 pa-4 pb-2">
            <VIcon icon="ri-store-line" color="primary" size="20" />
            <span class="text-subtitle-1 font-weight-semibold">{{ restoGroup.nama_resto }}</span>
            <VSpacer />
            <VChip
              size="x-small"
              :color="restoGroup.subtotal_sisa > 0 ? 'error' : 'success'"
              variant="tonal"
            >
              Sisa: {{ formatCurrency(restoGroup.subtotal_sisa) }}
            </VChip>
          </div>
          <VDivider />

          <VTable density="compact">
            <thead>
              <tr>
                <th>No. Invoice</th>
                <th>Tanggal</th>
                <th>Periode</th>
                <th class="text-right">Total</th>
                <th class="text-right">Sisa</th>
                <th class="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="inv in restoGroup.invoices"
                :key="inv.id"
              >
                <td>
                  <a
                    v-if="inv.share_url"
                    :href="inv.share_url"
                    target="_blank"
                    class="text-primary text-decoration-none"
                  >
                    {{ inv.no_invoice }}
                    <VIcon icon="ri-external-link-line" size="12" class="ms-1" />
                  </a>
                  <span v-else>{{ inv.no_invoice }}</span>
                </td>
                <td class="text-caption">{{ inv.tanggal_invoice }}</td>
                <td class="text-caption">{{ inv.periode_awal }} – {{ inv.periode_akhir }}</td>
                <td class="text-right text-caption">{{ formatCurrency(inv.total_tagihan) }}</td>
                <td
                  class="text-right text-caption font-weight-medium"
                  :class="inv.sisa_tagihan > 0 ? 'text-error' : 'text-success'"
                >
                  {{ formatCurrency(inv.sisa_tagihan) }}
                </td>
                <td class="text-center">
                  <VChip
                    :color="statusColor(inv.status)"
                    size="x-small"
                    variant="tonal"
                  >
                    {{ inv.status }}
                  </VChip>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="font-weight-semibold bg-grey-lighten-5">
                <td colspan="3" class="text-caption">Subtotal {{ restoGroup.nama_resto }}</td>
                <td class="text-right text-caption">{{ formatCurrency(restoGroup.subtotal_tagihan) }}</td>
                <td class="text-right text-caption" :class="restoGroup.subtotal_sisa > 0 ? 'text-error' : 'text-success'">
                  {{ formatCurrency(restoGroup.subtotal_sisa) }}
                </td>
                <td />
              </tr>
            </tfoot>
          </VTable>
        </VCard>

        <!-- Footer -->
        <div class="text-center text-caption text-medium-emphasis mt-6 mb-2">
          Halaman ini bersifat konfidensial dan ditujukan khusus untuk
          <strong>{{ data.klien.nama_klien }}</strong>.
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const token = route.params.token

const loading = ref(true)
const error   = ref('')
const data    = ref(null)

onMounted(async () => {
  try {
    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'
    const res = await axios.get(`${baseUrl}/klien-ar/public/${token}`)
    data.value = res.data?.data ?? null
    if (!data.value) error.value = 'Data tidak ditemukan.'
  } catch (e) {
    error.value = e?.response?.status === 404
      ? 'Link tidak valid atau sudah kedaluwarsa.'
      : 'Gagal memuat data. Coba lagi nanti.'
  } finally {
    loading.value = false
  }
})

function formatCurrency(val) {
  if (!val && val !== 0) return '-'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(val)
}

function statusColor(status) {
  const map = {
    TERKIRIM: 'info',
    SEBAGIAN: 'warning',
    LUNAS: 'success',
  }
  return map[status] ?? 'default'
}
</script>

<style scoped>
.bundle-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.bundle-header {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)), rgb(var(--v-theme-info)));
  color: white;
  padding: 24px 16px;
}

.bundle-header-content {
  max-width: 720px;
  margin: 0 auto;
}

.bundle-body {
  max-width: 720px;
  margin: 0 auto;
  padding: 16px;
}
</style>