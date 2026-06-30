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

    <VRow>
      <VCol
        v-for="report in reports"
        :key="report.route"
        cols="12"
        sm="6"
      >
        <VCard height="100%">
          <VCardText>
            <div class="text-h6 mb-1">{{ report.title }}</div>
            <div class="text-body-2 text-medium-emphasis">{{ report.description }}</div>
          </VCardText>
          <VCardActions class="pt-0 px-4 pb-4">
            <VBtn
              variant="outlined"
              :to="{ name: report.route }"
            >
              Lihat laporan
            </VBtn>
          </VCardActions>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>

<script setup>
const reports = [
  {
    title: 'Jurnal Aktivitas per PIC',
    description: 'Penelusuran pembayaran berdasarkan PIC dan nomor referensi',
    route: 'finance-laporan-jurnal-pic',
  },
  {
    title: 'Rekening Koran',
    description: 'Riwayat transaksi per klien dengan saldo berjalan',
    route: 'finance-laporan-rekening-koran',
  },
  {
    title: 'Laporan Aging',
    description: 'Laporan umur piutang belum terbayar',
    route: 'finance-laporan-aging',
  },
  {
    title: 'Rekap Piutang per Klien',
    description: 'Ringkasan outstanding per Client',
    route: 'finance-laporan-rekap-klien',
  },
  {
    title: 'Riwayat Pembayaran',
    description: 'Daftar semua pembayaran AR',
    route: 'finance-laporan-riwayat-bayar',
  },
  {
    title: 'Mutasi Piutang',
    description: 'Pergerakan piutang per klien dalam satu periode',
    route: 'finance-laporan-mutasi-piutang',
  },
  {
    title: 'Rekap Pembayaran',
    description: 'Rekap pembayaran AR per transaksi',
    route: 'finance-laporan-rekap-pembayaran',
  },
  {
    title: 'Kinerja AR per PIC',
    description: 'Performa penagihan per PIC',
    route: 'finance-laporan-kinerja-ar',
  },
  {
    title: 'Pendapatan di Muka',
    description: 'Daftar pembayaran yang diterima sebelum jasa diberikan',
    route: 'finance-laporan-pdm',
  },
]
</script>
