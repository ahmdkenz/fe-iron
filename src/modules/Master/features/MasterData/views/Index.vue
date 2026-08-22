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
      </VTab>
      <VTab value="opening-balance">
        <VIcon
          icon="ri-wallet-3-line"
          start
        />
        Import Master Opening Balance
      </VTab>
    </VTabs>

    <!--
      eager: progress tab invoice tidak hilang saat user bolak-balik antar tab
      sementara import berjalan di latar belakang 
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
      <VWindowItem
        value="opening-balance"
        eager
      >
        <MasterOpeningBalanceTab />
      </VWindowItem>
    </VWindow>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import MasterDataTab from '../components/MasterDataTab.vue'
import MasterInvoiceTab from '../components/MasterInvoiceTab.vue'
import MasterOpeningBalanceTab from '../components/MasterOpeningBalanceTab.vue'

const tab = ref('master')
</script>

<style scoped>
/* VWindow memotong konten yang lebih tinggi dari item aktif (mis. dialog &
   tabel riwayat perubahan), jadi overflow-nya dibiarkan terlihat. */
.master-data-window :deep(.v-window__container) {
  overflow: visible;
}
</style>
