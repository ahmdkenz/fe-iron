<template>
  <div>
    <PageHeader
      title="Pembayaran AP"
      subtitle="Riwayat pembayaran ke vendor"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Pembayaran', disabled: true }
      ]"
    />

    <VCard>
      <VCardText class="d-flex flex-wrap align-center gap-3 pb-0">
        <VSelect
          v-model="params.metode_pembayaran"
          placeholder="Semua Metode"
          clearable
          hide-details
          density="compact"
          style="max-width: 180px"
          :items="metodeOptions"
          item-title="label"
          item-value="value"
          @update:model-value="doFetch"
        />
        <VTextField
          v-model="params.tanggal_dari"
          type="date"
          label="Dari"
          density="compact"
          variant="outlined"
          hide-details
          style="max-width: 180px"
          @update:model-value="doFetch"
        />
        <VTextField
          v-model="params.tanggal_sampai"
          type="date"
          label="Sampai"
          density="compact"
          variant="outlined"
          hide-details
          style="max-width: 180px"
          @update:model-value="doFetch"
        />
        <VSpacer />
        <div class="text-body-2 text-medium-emphasis">
          Total: <strong>{{ formatCurrency(totalJumlah) }}</strong>
        </div>
      </VCardText>

      <BaseTable
        :headers="headers"
        :items="items"
        :total="meta.total"
        :loading="loading"
        :per-page="meta.per_page"
        :page="meta.current_page"
        class="mt-2"
        @update:options="onTableOptions"
      >
        <template #item.no="{ index }">
          {{ (meta.current_page - 1) * meta.per_page + index + 1 }}
        </template>
        <template #item.no_tagihan="{ item }">
          <VBtn
            v-if="item.tagihan_ap_id"
            variant="text"
            size="small"
            color="primary"
            :to="{ name: 'ap-tagihan-show', params: { id: item.tagihan_ap_id } }"
          >
            {{ item.no_tagihan }}
          </VBtn>
        </template>
        <template #item.vendor="{ item }">
          {{ item.vendor ?? '-' }}
        </template>
        <template #item.tanggal_pembayaran="{ item }">
          {{ item.tanggal_pembayaran }}
        </template>
        <template #item.jumlah_pembayaran="{ item }">
          {{ formatCurrency(item.jumlah_pembayaran) }}
        </template>
        <template #item.bukti_url="{ item }">
          <VBtn
            v-if="item.bukti_url"
            icon
            size="small"
            variant="text"
            color="info"
            :href="item.bukti_url"
            target="_blank"
          >
            <VIcon icon="ri-attachment-line" size="18" />
            <VTooltip activator="parent">Lihat Bukti</VTooltip>
          </VBtn>
          <span v-else class="text-medium-emphasis">-</span>
        </template>
      </BaseTable>
    </VCard>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useCrud } from '@/composables/useCrud'
import { useFormatter } from '@/composables/useFormatter'

const { items, loading, meta, params, fetchList } = useCrud('/ap/pembayaran')
const { formatCurrency } = useFormatter()

// Backend menyertakan `total_jumlah` di response meta — useCrud.fetchList()
// meng-Object.assign seluruh meta, jadi field ini otomatis tersedia di sini.
const totalJumlah = computed(() => meta.total_jumlah ?? 0)

const headers = [
  { title: 'No', key: 'no', sortable: false, width: '60px' },
  { title: 'No. Tagihan', key: 'no_tagihan', sortable: false },
  { title: 'Vendor', key: 'vendor', sortable: false },
  { title: 'Tanggal', key: 'tanggal_pembayaran', sortable: false },
  { title: 'Jumlah', key: 'jumlah_pembayaran', sortable: false },
  { title: 'Metode', key: 'metode_pembayaran', sortable: false },
  { title: 'No. Referensi', key: 'no_referensi', sortable: false },
  { title: 'Bukti', key: 'bukti_url', sortable: false, align: 'center' },
]

const metodeOptions = [
  { label: 'Transfer', value: 'TRANSFER' },
  { label: 'Cash', value: 'CASH' },
  { label: 'Giro', value: 'GIRO' },
]

function doFetch() {
  params.page = 1
  fetchList()
}

function onTableOptions({ page, itemsPerPage }) {
  params.page = page
  params.per_page = itemsPerPage
  fetchList()
}

doFetch()
</script>
