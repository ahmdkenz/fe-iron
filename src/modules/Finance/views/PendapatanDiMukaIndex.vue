<template>
  <div>
    <PageHeader
      title="Pendapatan di Muka"
      subtitle="Daftar pembayaran yang diterima sebelum jasa diberikan"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Laporan', to: { name: 'finance-laporan' } },
        { title: 'Pendapatan di Muka', disabled: true },
      ]"
    />

    <PendapatanDiMukaSection />
  </div>
</template>

<script setup>
import PendapatanDiMukaSection from '@/modules/Finance/components/laporan-sections/PendapatanDiMukaSection.vue'
</script>
