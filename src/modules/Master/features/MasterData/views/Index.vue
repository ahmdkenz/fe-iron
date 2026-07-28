<template>
  <div>
    <VTabs
      v-model="tab"
      class="mb-4"
      density="comfortable"
    >
      <VTab value="master">
        <VIcon
          icon="ri-database-2-line"
          start
        />
        Import Master Data
      </VTab>
      <VTab value="invoice">
        <VIcon
          icon="ri-file-list-3-line"
          start
        />
        Import Master Invoice
        <VChip
          v-if="pendingReview > 0"
          size="x-small"
          color="warning"
          variant="flat"
          class="ms-2"
        >
          {{ pendingReview }}
        </VChip>
      </VTab>
    </VTabs>

    <!--
      keep-alive: progress & tabel review tab invoice tidak hilang saat
      user bolak-balik antar tab sementara import berjalan di latar belakang 
    -->
    <VWindow
      v-model="tab"
      class="master-data-window"
    >
      <VWindowItem
        value="master"
        eager
      >
        <MasterDataTab />
      </VWindowItem>
      <VWindowItem
        value="invoice"
        eager
      >
        <MasterInvoiceTab />
      </VWindowItem>
    </VWindow>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import MasterDataTab from '../components/MasterDataTab.vue'
import MasterInvoiceTab from '../components/MasterInvoiceTab.vue'
import { useMasterInvoiceImportStore } from '@/stores/master-invoice-import.store'

const tab = ref('master')
const invoiceStore = useMasterInvoiceImportStore()

const pendingReview = computed(() => invoiceStore.pendingReview)
</script>

<style scoped>
/* VWindow memotong konten yang lebih tinggi dari item aktif (mis. dialog &
   tabel review), jadi overflow-nya dibiarkan terlihat. */
.master-data-window :deep(.v-window__container) {
  overflow: visible;
}
</style>
