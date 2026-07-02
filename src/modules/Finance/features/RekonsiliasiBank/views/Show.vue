<template>
  <div>
    <PageHeader
      :title="`Rekonsiliasi — ${bankType}`"
      subtitle="Detail transaksi rekening koran"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Rekonsiliasi Bank', to: { name: 'finance-rekonsiliasi-bank' } },
        { title: 'Detail', disabled: true },
      ]"
    >
      <VBtn variant="text" prepend-icon="ri-arrow-left-line" :to="{ name: 'finance-rekonsiliasi-bank' }">Kembali</VBtn>
    </PageHeader>

    <RekonsiliasiBankDetail :report-id="Number(route.params.id)" />
  </div>
</template>

<script setup>
import { defineAsyncComponent, ref } from 'vue'
import { useRoute } from 'vue-router'

const RekonsiliasiBankDetail = defineAsyncComponent(() => import('./Detail.vue'))

const route    = useRoute()
const bankType = ref('')
</script>
