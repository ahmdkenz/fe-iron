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
    >
      <VBtn variant="text" prepend-icon="ri-arrow-left-line" :to="{ name: 'finance-laporan' }">Kembali</VBtn>
    </PageHeader>

    <PendapatanDiMukaSection />
  </div>
</template>

<script setup>
import PendapatanDiMukaSection from '../components/PendapatanDiMukaSection.vue'
</script>
