<template>
  <div>
    <PageHeader
      title="Laporan"
      subtitle="Semua laporan keuangan dan piutang dalam satu tempat"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Laporan', disabled: true },
      ]"
    />

    <VTabs
      v-model="activeTab"
      show-arrows
      class="mb-4"
    >
      <VTab value="jurnal-pic">Jurnal PIC</VTab>
      <VTab value="rekening-koran">Rekening Koran</VTab>
      <VTab value="aging">Aging</VTab>
      <VTab value="rekap-klien">Rekap Klien</VTab>
      <VTab value="riwayat-bayar">Riwayat Bayar</VTab>
      <VTab value="mutasi-piutang">Mutasi Piutang</VTab>
      <VTab value="rekap-pembayaran">Rekap Pembayaran</VTab>
      <VTab value="kinerja-ar">Kinerja AR</VTab>
      <VTab v-if="false" value="jatuh-tempo">Jatuh Tempo</VTab>
    </VTabs>

    <VTabsWindow v-model="activeTab">
      <VTabsWindowItem value="jurnal-pic">
        <KeepAlive>
          <JurnalPicSection v-if="activeTab === 'jurnal-pic' || visited.has('jurnal-pic')" />
        </KeepAlive>
      </VTabsWindowItem>

      <VTabsWindowItem value="rekening-koran">
        <KeepAlive>
          <RekeningKoranSection v-if="activeTab === 'rekening-koran' || visited.has('rekening-koran')" />
        </KeepAlive>
      </VTabsWindowItem>

      <VTabsWindowItem value="aging">
        <KeepAlive>
          <AgingReportSection v-if="activeTab === 'aging' || visited.has('aging')" />
        </KeepAlive>
      </VTabsWindowItem>

      <VTabsWindowItem value="rekap-klien">
        <KeepAlive>
          <RekapKlienSection v-if="activeTab === 'rekap-klien' || visited.has('rekap-klien')" />
        </KeepAlive>
      </VTabsWindowItem>

      <VTabsWindowItem value="riwayat-bayar">
        <KeepAlive>
          <PembayaranArSection v-if="activeTab === 'riwayat-bayar' || visited.has('riwayat-bayar')" />
        </KeepAlive>
      </VTabsWindowItem>

      <VTabsWindowItem value="mutasi-piutang">
        <KeepAlive>
          <MutasiPiutangSection v-if="activeTab === 'mutasi-piutang' || visited.has('mutasi-piutang')" />
        </KeepAlive>
      </VTabsWindowItem>

      <VTabsWindowItem value="rekap-pembayaran">
        <KeepAlive>
          <RekapPembayaranSection v-if="activeTab === 'rekap-pembayaran' || visited.has('rekap-pembayaran')" />
        </KeepAlive>
      </VTabsWindowItem>

      <VTabsWindowItem value="kinerja-ar">
        <KeepAlive>
          <KinerjaArSection v-if="activeTab === 'kinerja-ar' || visited.has('kinerja-ar')" />
        </KeepAlive>
      </VTabsWindowItem>

      <VTabsWindowItem value="jatuh-tempo">
        <KeepAlive>
          <JatuhTempoSection v-if="activeTab === 'jatuh-tempo' || visited.has('jatuh-tempo')" />
        </KeepAlive>
      </VTabsWindowItem>
    </VTabsWindow>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import JurnalPicSection     from '@/modules/Finance/components/laporan-sections/JurnalPicSection.vue'
import RekeningKoranSection from '@/modules/Finance/components/laporan-sections/RekeningKoranSection.vue'
import AgingReportSection   from '@/modules/Finance/components/laporan-sections/AgingReportSection.vue'
import RekapKlienSection    from '@/modules/Finance/components/laporan-sections/RekapKlienSection.vue'
import PembayaranArSection  from '@/modules/Finance/components/laporan-sections/PembayaranArSection.vue'
import MutasiPiutangSection from '@/modules/Finance/components/laporan-sections/MutasiPiutangSection.vue'
import RekapPembayaranSection from '@/modules/Finance/components/laporan-sections/RekapPembayaranSection.vue'
import KinerjaArSection     from '@/modules/Finance/components/laporan-sections/KinerjaArSection.vue'
import JatuhTempoSection    from '@/modules/Finance/components/laporan-sections/JatuhTempoSection.vue'

const VALID_TABS = [
  'jurnal-pic', 'rekening-koran', 'aging', 'rekap-klien',
  'riwayat-bayar', 'mutasi-piutang', 'rekap-pembayaran', 'kinerja-ar',
]

const route  = useRoute()
const router = useRouter()

const initialTab = VALID_TABS.includes(route.query.tab) ? route.query.tab : 'jurnal-pic'
const activeTab  = ref(initialTab)
const visited    = ref(new Set([initialTab]))

watch(activeTab, (tab) => {
  visited.value.add(tab)
  router.replace({ query: { tab } })
})

watch(() => route.query.tab, (tab) => {
  if (tab && VALID_TABS.includes(tab) && tab !== activeTab.value) {
    activeTab.value = tab
  }
})
</script>
