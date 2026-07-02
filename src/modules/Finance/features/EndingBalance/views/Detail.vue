<template>
  <div>
    <PageHeader
      :title="eb ? `Ending Balance — ${eb.nama_klien}` : 'Detail Ending Balance'"
      :subtitle="eb ? `${formatDate(eb.periode_awal)} – ${formatDate(eb.periode_akhir)}` : ''"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Ending Balance', to: { name: 'finance-ending-balance' } },
        { title: 'Detail', disabled: true },
      ]"
    >
      <VBtn variant="text" prepend-icon="ri-arrow-left-line" :to="{ name: 'finance-ending-balance' }">Kembali</VBtn>
    </PageHeader>

    <div v-if="loading" class="text-center py-10">
      <VProgressCircular indeterminate />
    </div>

    <template v-else-if="eb">
      <!-- ── 1. Ringkasan Saldo ── -->
      <VRow class="mb-4">
        <VCol cols="6" md="3">
          <VCard>
            <VCardText>
              <div class="text-caption text-medium-emphasis mb-1">Saldo Awal</div>
              <div class="text-h6 font-weight-bold">{{ formatRp(eb.saldo_awal) }}</div>
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="6" md="3">
          <VCard>
            <VCardText>
              <div class="text-caption text-medium-emphasis mb-1">Invoice Masuk</div>
              <div class="text-h6 font-weight-bold text-primary">+ {{ formatRp(eb.invoice_masuk) }}</div>
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="6" md="3">
          <VCard>
            <VCardText>
              <div class="text-caption text-medium-emphasis mb-1">Pembayaran</div>
              <div class="text-h6 font-weight-bold text-success">- {{ formatRp(eb.pembayaran) }}</div>
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="6" md="3">
          <VCard :color="eb.saldo_akhir_sistem !== eb.saldo_akhir_final ? 'warning' : undefined">
            <VCardText>
              <div class="text-caption text-medium-emphasis mb-1">
                Saldo Akhir Final
                <EndingBalanceStatusBadge :status="eb.status" class="ml-1" />
              </div>
              <div class="text-h6 font-weight-bold">{{ formatRp(eb.saldo_akhir_final) }}</div>
              <div v-if="eb.saldo_akhir_sistem !== eb.saldo_akhir_final" class="text-caption">
                Sistem: {{ formatRp(eb.saldo_akhir_sistem) }}
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Info periode terkunci -->
      <VAlert
        v-if="eb.status === 'LOCKED'"
        type="success"
        variant="tonal"
        density="compact"
        icon="ri-lock-line"
        class="mb-4"
      >
        Periode dikunci<template v-if="eb.locked_by"> oleh <strong>{{ eb.locked_by }}</strong></template><template v-if="eb.locked_at"> pada {{ formatDatetime(eb.locked_at) }}</template>.
        Perubahan saldo memerlukan koreksi manual dengan persetujuan SPV dan Manager.
      </VAlert>

      <!-- Aksi DRAFT -->
      <VCard v-if="eb.status === 'DRAFT'" class="mb-4">
        <VCardText class="d-flex align-center justify-space-between flex-wrap gap-3">
          <div class="text-body-2 text-medium-emphasis">
            Periode ini masih <strong>DRAFT</strong>. Setelah data diverifikasi, tutup periode untuk mengunci nilai.
          </div>
          <div class="d-flex gap-2">
            <VBtn v-if="authStore.canOperateEndingBalance" color="info" variant="tonal" prepend-icon="ri-pencil-line" @click="openKoreksiDialog">Ajukan Koreksi</VBtn>
            <VBtn v-if="authStore.canLockEndingBalance" color="success" prepend-icon="ri-lock-line" :loading="locking" @click="showLockDialog = true">
              Tutup Periode
            </VBtn>
          </div>
        </VCardText>
      </VCard>

      <!-- Alert koreksi aktif -->
      <VAlert v-if="eb.has_active_koreksi" type="info" class="mb-4" density="compact">
        Terdapat koreksi yang sedang dalam proses persetujuan. Koreksi baru bisa diajukan setelah selesai.
      </VAlert>

      <!-- Aksi Koreksi + Unlock (LOCKED) -->
      <VCard v-if="eb.status === 'LOCKED'" class="mb-4">
        <VCardText class="d-flex align-center justify-space-between flex-wrap gap-3">
          <div class="text-body-2 text-medium-emphasis">
            Periode ini sudah <strong>TERKUNCI</strong>. Jika ada perbedaan nilai, ajukan koreksi atau buka kunci untuk re-import.
          </div>
          <div class="d-flex gap-2">
            <VBtn
              v-if="authStore.canOperateEndingBalance && !eb.has_active_koreksi"
              color="info"
              prepend-icon="ri-pencil-line"
              @click="openKoreksiDialog"
            >Ajukan Koreksi</VBtn>
            <VBtn
              v-if="authStore.canLockEndingBalance"
              color="warning"
              variant="tonal"
              prepend-icon="ri-lock-unlock-line"
              :loading="unlocking"
              @click="showUnlockDialog = true"
            >Buka Periode</VBtn>
          </div>
        </VCardText>
      </VCard>

      <!-- ── 2. Perhitungan Saldo ── -->
      <VCard class="mb-4">
        <VCardTitle class="pt-4 px-5 text-body-1 font-weight-bold">Perhitungan Saldo</VCardTitle>
        <VDivider />
        <VCardText class="px-5 py-4">
          <div class="calc-row">
            <span class="text-medium-emphasis">Saldo Awal</span>
            <span>{{ formatRp(eb.saldo_awal) }}</span>
          </div>
          <div class="calc-row">
            <span class="text-medium-emphasis">+ Invoice Masuk</span>
            <span class="text-primary">{{ formatRp(eb.invoice_masuk) }}</span>
          </div>
          <div class="calc-row">
            <span class="text-medium-emphasis">− Pembayaran</span>
            <span class="text-success">{{ formatRp(eb.pembayaran) }}</span>
          </div>
          <VDivider class="my-3" />
          <div class="calc-row font-weight-bold">
            <span>= Saldo Akhir Sistem</span>
            <span>{{ formatRp(eb.saldo_akhir_sistem) }}</span>
          </div>
          <template v-if="eb.saldo_akhir_final !== eb.saldo_akhir_sistem">
            <div class="calc-row mt-2">
              <span class="text-medium-emphasis">
                {{ koreksiNet >= 0 ? '+' : '−' }} Koreksi Disetujui
              </span>
              <span :class="koreksiNet >= 0 ? 'text-success' : 'text-error'">
                {{ formatRp(Math.abs(koreksiNet)) }}
              </span>
            </div>
            <VDivider class="my-3" />
            <div class="calc-row font-weight-bold text-primary">
              <span>= Saldo Akhir Final</span>
              <span>{{ formatRp(eb.saldo_akhir_final) }}</span>
            </div>
          </template>
        </VCardText>
      </VCard>

      <!-- ── 3. Daftar Invoice ── -->
      <VCard class="mb-4">
        <VCardTitle class="pt-4 px-5 text-body-1 font-weight-bold">
          Daftar Invoice
          <VChip v-if="invoices.length" size="x-small" color="primary" class="ms-2">{{ invoices.length }}</VChip>
        </VCardTitle>
        <VDivider />
        <div v-if="invoicesLoading" class="text-center pa-8">
          <VProgressCircular indeterminate />
        </div>
        <VAlert v-else-if="invoicesError" type="error" class="ma-4" density="compact">{{ invoicesError }}</VAlert>
        <template v-else>
          <div v-if="!invoices.length" class="text-center text-medium-emphasis pa-8">
            Tidak ada invoice dalam periode ini.
          </div>
          <VTable v-else density="compact" class="eb-invoice-table">
            <thead>
              <tr>
                <th>No Invoice</th>
                <th>Tgl Invoice</th>
                <th>Jatuh Tempo</th>
                <th class="text-end">Total Tagihan</th>
                <th class="text-end">Terbayar</th>
                <th class="text-end">Sisa</th>
                <th class="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="inv in invoices" :key="inv.id">
                <td class="font-weight-medium text-no-wrap">
                  {{ inv.no_invoice }}
                  <VChip v-if="inv.is_opening_balance" size="x-small" color="secondary" label class="ms-1">OB</VChip>
                </td>
                <td class="text-caption text-medium-emphasis text-no-wrap">{{ formatDate(inv.tanggal_invoice) }}</td>
                <td class="text-caption text-no-wrap" :class="isOverdue(inv) ? 'text-error font-weight-medium' : 'text-medium-emphasis'">
                  {{ formatDate(inv.tanggal_jatuh_tempo) }}
                </td>
                <td class="text-end text-no-wrap">{{ formatRp(inv.subtotal) }}</td>
                <td class="text-end text-no-wrap text-success">{{ formatRp(inv.total_pembayaran) }}</td>
                <td class="text-end text-no-wrap font-weight-bold" :class="sisaPerInvoice(inv) > 0 ? 'text-warning' : 'text-success'">
                  {{ formatRp(sisaPerInvoice(inv)) }}
                </td>
                <td class="text-center">
                  <VChip size="x-small" :color="invoiceStatusColor(inv.status)" label>{{ inv.status }}</VChip>
                </td>
              </tr>
            </tbody>
          </VTable>
        </template>
      </VCard>

      <!-- ── 4. Daftar Pembayaran ── -->
      <VCard class="mb-4">
        <VCardTitle class="pt-4 px-5 text-body-1 font-weight-bold">
          Daftar Pembayaran
          <VChip v-if="payments.length" size="x-small" color="success" class="ms-2">{{ payments.length }}</VChip>
        </VCardTitle>
        <VDivider />
        <div v-if="paymentsLoading" class="text-center pa-8">
          <VProgressCircular indeterminate />
        </div>
        <VAlert v-else-if="paymentsError" type="error" class="ma-4" density="compact">{{ paymentsError }}</VAlert>
        <template v-else>
          <div v-if="!payments.length" class="text-center text-medium-emphasis pa-8">
            Tidak ada pembayaran dalam periode ini.
          </div>
          <VTable v-else density="compact" class="eb-invoice-table">
            <thead>
              <tr>
                <th>No Invoice</th>
                <th>Tanggal</th>
                <th class="text-end">Jumlah</th>
                <th>Metode</th>
                <th>No Referensi</th>
                <th>Jenis</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in payments" :key="p.id" :class="p.jenis === 'ALO_CROSS' ? 'bg-surface-variant' : ''">
                <td class="font-weight-medium text-no-wrap">{{ p.no_invoice }}</td>
                <td class="text-caption text-medium-emphasis text-no-wrap">{{ formatDate(p.tanggal_pembayaran) }}</td>
                <td class="text-end text-no-wrap font-weight-bold" :class="p.jenis === 'ALO_CROSS' ? 'text-medium-emphasis' : 'text-success'">
                  {{ formatRp(p.jumlah_pembayaran) }}
                </td>
                <td>
                  <VChip size="x-small" :color="metodeColor(p.metode_pembayaran)" label>{{ p.metode_pembayaran }}</VChip>
                </td>
                <td class="text-caption text-medium-emphasis">{{ p.no_referensi || '—' }}</td>
                <td>
                  <VChip v-if="p.jenis === 'ALO'" size="x-small" color="info" label>ALO</VChip>
                  <VChip v-else-if="p.jenis === 'PDM'" size="x-small" color="secondary" label>PDM</VChip>
                  <VTooltip v-else-if="p.jenis === 'ALO_CROSS'" :text="`Dialokasikan ke: ${p.nama_klien_tujuan}`">
                    <template #activator="{ props }">
                      <VChip v-bind="props" size="x-small" color="warning" label>ALO → Klien Lain</VChip>
                    </template>
                  </VTooltip>
                  <span v-else class="text-caption text-medium-emphasis">—</span>
                </td>
                <td class="text-caption text-medium-emphasis" style="max-width: 200px; white-space: normal;">{{ p.keterangan || '—' }}</td>
              </tr>
            </tbody>
          </VTable>
        </template>
      </VCard>

      <!-- ── 5. Riwayat Koreksi Ending Balance ── -->
      <VCard class="mb-4">
        <VCardTitle class="pt-4 px-5 text-body-1 font-weight-bold">
          Riwayat Koreksi Ending Balance
          <VChip v-if="eb.koreksi?.length" size="x-small" color="info" class="ms-2">{{ eb.koreksi.length }}</VChip>
        </VCardTitle>
        <VDivider />
        <div v-if="!eb.koreksi?.length" class="text-center text-medium-emphasis pa-8">
          Belum ada riwayat koreksi untuk periode ini.
        </div>
        <VTable v-else density="comfortable" class="eb-koreksi-table">
          <thead>
            <tr>
              <th class="text-no-wrap">Tipe</th>
              <th class="text-no-wrap">No Dokumen</th>
              <th class="text-no-wrap">Nilai Koreksi</th>
              <th class="text-no-wrap">Invoice</th>
              <th>Alasan</th>
              <th class="text-no-wrap">Status</th>
              <th class="text-no-wrap">Pengaju</th>
              <th class="text-no-wrap">Keputusan SPV</th>
              <th class="text-no-wrap">Keputusan Manager</th>
              <th class="text-no-wrap">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="k in eb.koreksi" :key="k.id">
              <tr>
                <td>
                  <VChip size="x-small" :color="tipeBadgeColor(k.tipe)" label>{{ tipeLabel(k.tipe) }}</VChip>
                </td>
                <td class="text-caption font-weight-medium text-no-wrap">
                  {{ k.no_dokumen || '—' }}
                </td>
                <td class="font-weight-bold text-no-wrap" :class="k.nilai_koreksi >= 0 ? 'text-success' : 'text-error'">
                  {{ k.nilai_koreksi >= 0 ? '+' : '' }}{{ formatRp(k.nilai_koreksi) }}
                </td>
                <td class="text-caption text-no-wrap">
                  <span v-if="k.no_invoice">{{ k.no_invoice }}</span>
                  <span v-else class="text-medium-emphasis">—</span>
                </td>
                <td style="max-width: 220px; white-space: normal;">{{ k.alasan_koreksi }}</td>
                <td>
                  <VChip size="x-small" :color="statusColor(k.status)" label>{{ statusLabel(k.status) }}</VChip>
                </td>
                <td class="text-caption text-no-wrap">
                  <span class="font-weight-medium">{{ k.submitted_by }}</span><br>
                  <span class="text-medium-emphasis">{{ formatDatetime(k.submitted_at) }}</span>
                </td>
                <td class="text-caption">
                  <template v-if="k.spv">
                    <span class="font-weight-medium">{{ k.spv }}</span><br>
                    <span :class="k.status === 'REJECTED' && !k.manager ? 'text-error' : 'text-success'">{{ k.spv_note || '—' }}</span><br>
                    <span class="text-medium-emphasis">{{ formatDatetime(k.spv_actioned_at) }}</span>
                  </template>
                  <span v-else class="text-medium-emphasis">Menunggu</span>
                </td>
                <td class="text-caption">
                  <template v-if="k.manager">
                    <span class="font-weight-medium">{{ k.manager }}</span><br>
                    <span :class="k.status === 'REJECTED' ? 'text-error' : 'text-success'">{{ k.manager_note || '—' }}</span><br>
                    <span class="text-medium-emphasis">{{ formatDatetime(k.manager_actioned_at) }}</span>
                  </template>
                  <span v-else class="text-medium-emphasis">{{ k.spv ? 'Menunggu' : '—' }}</span>
                </td>
                <td class="text-no-wrap">
                  <div class="d-flex gap-1 flex-wrap">
                    <!-- Tombol cetak untuk CN/DN -->
                    <VBtn
                      v-if="k.tipe === 'CREDIT_NOTE' || k.tipe === 'DEBIT_NOTE'"
                      size="x-small"
                      variant="tonal"
                      color="primary"
                      prepend-icon="ri-printer-line"
                      @click="openPrintDialog(k)"
                    >Cetak</VBtn>
                    <!-- Toggle expand untuk koreksi yang punya items -->
                    <VBtn
                      v-if="k.items?.length"
                      size="x-small"
                      variant="tonal"
                      color="secondary"
                      :prepend-icon="expandedKoreksiId === k.id ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'"
                      @click="toggleKoreksiExpand(k.id)"
                    >{{ expandedKoreksiId === k.id ? 'Tutup' : 'Detail Item' }}</VBtn>
                  </div>
                </td>
              </tr>
              <!-- Expandable: detail item (KOREKSI_QTY_HARGA, CN/DN dengan items) -->
              <tr v-if="k.items?.length && expandedKoreksiId === k.id">
                <td colspan="10" class="pa-0">
                  <div class="bg-surface-variant pa-3">
                    <div class="text-caption text-medium-emphasis font-weight-bold mb-2">Detail Perubahan Item</div>
                    <VTable density="compact" class="eb-item-table">
                      <thead>
                        <tr>
                          <th>Barang</th>
                          <th class="text-end">Qty Lama</th>
                          <th class="text-end">Harga Lama</th>
                          <th class="text-end">Subtotal Lama</th>
                          <th class="text-end">Qty Baru</th>
                          <th class="text-end">Harga Baru</th>
                          <th class="text-end">Subtotal Baru</th>
                          <th class="text-end">Selisih</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="item in k.items" :key="item.id">
                          <td class="font-weight-medium">{{ item.nama_barang }}</td>
                          <td class="text-end text-caption">{{ item.qty_lama }}</td>
                          <td class="text-end text-caption">{{ formatRp(item.harga_satuan_lama) }}</td>
                          <td class="text-end">{{ formatRp(item.subtotal_lama) }}</td>
                          <td class="text-end text-caption">{{ item.qty_baru }}</td>
                          <td class="text-end text-caption">{{ formatRp(item.harga_satuan_baru) }}</td>
                          <td class="text-end">{{ formatRp(item.subtotal_baru) }}</td>
                          <td class="text-end font-weight-bold" :class="item.selisih >= 0 ? 'text-success' : 'text-error'">
                            {{ item.selisih >= 0 ? '+' : '' }}{{ formatRp(item.selisih) }}
                          </td>
                        </tr>
                      </tbody>
                    </VTable>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </VTable>
      </VCard>

      <!-- ── 6. Aktivitas / Audit Trail ── -->
      <VCard class="mb-4">
        <VCardTitle class="pt-4 px-5 text-body-1 font-weight-bold">Aktivitas</VCardTitle>
        <VDivider />
        <VCardText class="px-5 py-4">
          <VRow dense>
            <VCol cols="12" sm="6" md="4">
              <div class="audit-row">
                <span class="text-caption text-medium-emphasis">Dibuat pada</span>
                <span class="text-body-2">{{ formatDatetime(eb.created_at) }}</span>
              </div>
            </VCol>
            <VCol cols="12" sm="6" md="4">
              <div class="audit-row">
                <span class="text-caption text-medium-emphasis">Dibuat oleh</span>
                <span class="text-body-2 font-weight-medium">{{ eb.created_by || '—' }}</span>
              </div>
            </VCol>
            <VCol cols="12" sm="6" md="4">
              <div class="audit-row">
                <span class="text-caption text-medium-emphasis">Dihitung pada</span>
                <span class="text-body-2">{{ formatDatetime(eb.updated_at) }}</span>
              </div>
            </VCol>
            <template v-if="eb.status === 'LOCKED'">
              <VCol cols="12" sm="6" md="4">
                <div class="audit-row">
                  <span class="text-caption text-medium-emphasis">Ditutup oleh</span>
                  <span class="text-body-2 font-weight-medium">{{ eb.locked_by || '—' }}</span>
                </div>
              </VCol>
              <VCol cols="12" sm="6" md="4">
                <div class="audit-row">
                  <span class="text-caption text-medium-emphasis">Ditutup pada</span>
                  <span class="text-body-2">{{ formatDatetime(eb.locked_at) }}</span>
                </div>
              </VCol>
            </template>
          </VRow>
        </VCardText>
      </VCard>
    </template>
  </div>

  <!-- Dialog Konfirmasi Lock -->
  <VDialog v-model="showLockDialog" max-width="420">
    <VCard>
      <VCardTitle class="pt-4 px-4">Tutup Periode</VCardTitle>
      <VCardText>
        Kunci ending balance <strong>{{ eb?.nama_klien }}</strong> untuk periode
        {{ formatDate(eb?.periode_awal) }} – {{ formatDate(eb?.periode_akhir) }}?
        <br><br>
        Setelah dikunci, nilai tidak bisa diubah. Koreksi manual memerlukan persetujuan SPV dan Manager.
      </VCardText>
      <VCardActions class="px-4 pb-4">
        <VSpacer />
        <VBtn variant="text" @click="showLockDialog = false">Batal</VBtn>
        <VBtn color="success" :loading="locking" @click="doLock">Kunci</VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <!-- Dialog Konfirmasi Unlock -->
  <VDialog v-model="showUnlockDialog" max-width="420">
    <VCard>
      <VCardTitle class="pt-4 px-4">Buka Kunci Periode</VCardTitle>
      <VCardText>
        Buka kunci ending balance <strong>{{ eb?.nama_klien }}</strong> untuk periode
        {{ formatDate(eb?.periode_awal) }} – {{ formatDate(eb?.periode_akhir) }}?
        <br><br>
        Setelah dibuka, invoice dalam periode ini dapat diubah kembali via import.
        <VAlert type="warning" variant="tonal" density="compact" class="mt-3">
          Pastikan data yang akan diubah sudah dikonfirmasi sebelum mengunci ulang.
        </VAlert>
      </VCardText>
      <VCardActions class="px-4 pb-4">
        <VSpacer />
        <VBtn variant="text" @click="showUnlockDialog = false">Batal</VBtn>
        <VBtn color="warning" :loading="unlocking" @click="doUnlock">Buka Kunci</VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <!-- ═══ Dialog Ajukan Koreksi (multi-step) ═══ -->
  <VDialog v-model="showKoreksiDialog" max-width="760" persistent scrollable>
    <VCard>
      <VCardTitle class="pt-4 px-4 text-body-1 font-weight-bold d-flex align-center">
        <span>Ajukan Koreksi</span>
        <VSpacer />
        <span class="text-caption text-medium-emphasis font-weight-regular">
          {{ eb?.nama_klien }} · {{ formatDate(eb?.periode_awal) }} – {{ formatDate(eb?.periode_akhir) }}
        </span>
      </VCardTitle>
      <VDivider />

      <VCardText class="pt-4" style="max-height: 70vh; overflow-y: auto;">

        <!-- ── Step 1: Pilih Tipe ── -->
        <template v-if="koreksiStep === 1">
          <div class="text-body-2 font-weight-medium mb-3">Pilih jenis koreksi:</div>
          <VRow>
            <VCol cols="12" sm="6">
              <VCard
                variant="outlined"
                :color="koreksiForm.tipe === 'CREDIT_NOTE' ? 'error' : undefined"
                class="tipe-card cursor-pointer"
                :class="{ 'tipe-card--selected': koreksiForm.tipe === 'CREDIT_NOTE' }"
                @click="koreksiForm.tipe = 'CREDIT_NOTE'"
              >
                <VCardText class="pa-4 d-flex align-center gap-3">
                  <VAvatar size="44" color="error" variant="tonal" rounded="lg">
                    <VIcon icon="ri-arrow-down-circle-line" size="22" />
                  </VAvatar>
                  <div class="flex-grow-1">
                    <div class="font-weight-bold text-error">Credit Note</div>
                    <div class="text-caption text-medium-emphasis">Pengurangan tagihan klien</div>
                  </div>
                  <VAvatar v-if="koreksiForm.tipe === 'CREDIT_NOTE'" size="22" color="error">
                    <VIcon icon="ri-check-line" size="14" color="white" />
                  </VAvatar>
                </VCardText>
              </VCard>
            </VCol>
            <VCol cols="12" sm="6">
              <VCard
                variant="outlined"
                :color="koreksiForm.tipe === 'DEBIT_NOTE' ? 'info' : undefined"
                class="tipe-card cursor-pointer"
                :class="{ 'tipe-card--selected': koreksiForm.tipe === 'DEBIT_NOTE' }"
                @click="koreksiForm.tipe = 'DEBIT_NOTE'"
              >
                <VCardText class="pa-4 d-flex align-center gap-3">
                  <VAvatar size="44" color="info" variant="tonal" rounded="lg">
                    <VIcon icon="ri-arrow-up-circle-line" size="22" />
                  </VAvatar>
                  <div class="flex-grow-1">
                    <div class="font-weight-bold text-info">Debit Note</div>
                    <div class="text-caption text-medium-emphasis">Penambahan tagihan klien</div>
                  </div>
                  <VAvatar v-if="koreksiForm.tipe === 'DEBIT_NOTE'" size="22" color="info">
                    <VIcon icon="ri-check-line" size="14" color="white" />
                  </VAvatar>
                </VCardText>
              </VCard>
            </VCol>
            <VCol cols="12" sm="6">
              <VCard
                variant="outlined"
                :color="koreksiForm.tipe === 'KOREKSI_QTY_HARGA' ? 'warning' : undefined"
                class="tipe-card cursor-pointer"
                :class="{ 'tipe-card--selected': koreksiForm.tipe === 'KOREKSI_QTY_HARGA' }"
                @click="koreksiForm.tipe = 'KOREKSI_QTY_HARGA'"
              >
                <VCardText class="pa-4 d-flex align-center gap-3">
                  <VAvatar size="44" color="warning" variant="tonal" rounded="lg">
                    <VIcon icon="ri-edit-box-line" size="22" />
                  </VAvatar>
                  <div class="flex-grow-1">
                    <div class="font-weight-bold" style="color: rgb(var(--v-theme-warning))">Koreksi Qty & Harga</div>
                    <div class="text-caption text-medium-emphasis">Perbaiki item invoice (qty/harga)</div>
                  </div>
                  <VAvatar v-if="koreksiForm.tipe === 'KOREKSI_QTY_HARGA'" size="22" color="warning">
                    <VIcon icon="ri-check-line" size="14" color="white" />
                  </VAvatar>
                </VCardText>
              </VCard>
            </VCol>
            <VCol v-if="eb?.status === 'LOCKED'" cols="12" sm="6">
              <VCard
                variant="outlined"
                :color="koreksiForm.tipe === 'KOREKSI_SALDO' ? 'secondary' : undefined"
                class="tipe-card cursor-pointer"
                :class="{ 'tipe-card--selected': koreksiForm.tipe === 'KOREKSI_SALDO' }"
                @click="koreksiForm.tipe = 'KOREKSI_SALDO'"
              >
                <VCardText class="pa-4 d-flex align-center gap-3">
                  <VAvatar size="44" color="secondary" variant="tonal" rounded="lg">
                    <VIcon icon="ri-funds-line" size="22" />
                  </VAvatar>
                  <div class="flex-grow-1">
                    <div class="font-weight-bold text-secondary">Koreksi Saldo</div>
                    <div class="text-caption text-medium-emphasis">Penyesuaian saldo tanpa invoice</div>
                  </div>
                  <VAvatar v-if="koreksiForm.tipe === 'KOREKSI_SALDO'" size="22" color="secondary">
                    <VIcon icon="ri-check-line" size="14" color="white" />
                  </VAvatar>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>
        </template>

        <!-- ── Step 2: Isi Form ── -->
        <template v-else>
          <!-- Header step 2 -->
          <div class="d-flex align-center gap-2 mb-4">
            <VChip :color="tipeBadgeColor(koreksiForm.tipe)" size="small" label>{{ tipeLabel(koreksiForm.tipe) }}</VChip>
            <span class="text-caption text-medium-emphasis">Lengkapi informasi koreksi di bawah ini</span>
          </div>

          <!-- ── Form Credit Note & Debit Note ── -->
          <template v-if="koreksiForm.tipe === 'CREDIT_NOTE' || koreksiForm.tipe === 'DEBIT_NOTE'">
            <VRow>
              <VCol cols="12">
                <div class="text-caption font-weight-medium text-medium-emphasis mb-2">
                  Pilih Invoice yang di-{{ koreksiForm.tipe === 'CREDIT_NOTE' ? 'kurangi' : 'tambah' }}
                </div>
                <div v-if="!invoices.length" class="text-center py-4 text-medium-emphasis text-caption">
                  Tidak ada invoice tersedia.
                </div>
                <div v-else class="koreksi-invoice-list">
                  <div
                    v-for="inv in invoices"
                    :key="inv.id"
                    class="koreksi-invoice-row"
                    :class="{ 'koreksi-invoice-row--selected': koreksiForm.invoice_id === inv.id }"
                    @click="koreksiForm.invoice_id = inv.id; onInvoiceSelectedForKoreksiItem(inv.id)"
                  >
                    <div class="flex-grow-1 min-w-0">
                      <div class="d-flex align-center gap-2 mb-1 flex-wrap">
                        <span class="text-body-2 font-weight-bold">{{ inv.no_invoice }}</span>
                        <VChip size="x-small" :color="invoiceStatusColor(inv.status)" variant="tonal" label>{{ inv.status }}</VChip>
                        <VChip v-if="isOverdue(inv)" size="x-small" color="error" variant="tonal" label>Jatuh Tempo</VChip>
                      </div>
                      <div class="text-caption text-medium-emphasis">
                        {{ formatDate(inv.tanggal_invoice) }} · JT: {{ formatDate(inv.tanggal_jatuh_tempo) || '-' }}
                      </div>
                      <div class="text-caption mt-1">
                        Sisa: <span class="font-weight-bold text-error">{{ formatRp(sisaPerInvoice(inv)) }}</span>
                        <span class="text-medium-emphasis ms-2">/ {{ formatRp(inv.subtotal) }}</span>
                      </div>
                    </div>
                    <VAvatar v-if="koreksiForm.invoice_id === inv.id" size="24" color="primary" class="flex-shrink-0">
                      <VIcon icon="ri-check-line" size="14" color="white" />
                    </VAvatar>
                  </div>
                </div>
              </VCol>
            </VRow>

            <div v-if="itemsLoading" class="text-center py-4">
              <VProgressCircular indeterminate size="24" />
              <span class="text-caption ml-2">Memuat item invoice...</span>
            </div>

            <template v-else-if="koreksiForm.invoice_id && koreksiItems.length">
              <div class="text-caption text-medium-emphasis mb-2 mt-3">
                Edit qty dan harga baru (kosongkan jika tidak berubah):
              </div>
              <VTable density="compact" class="eb-item-edit-table mb-3">
                <thead>
                  <tr>
                    <th>Barang</th>
                    <th class="text-end">Qty Lama</th>
                    <th class="text-end">Harga Lama</th>
                    <th class="text-end">Subtotal Lama</th>
                    <th class="text-end" style="min-width: 110px">Qty Baru</th>
                    <th class="text-end" style="min-width: 130px">Harga Baru</th>
                    <th class="text-end">Subtotal Baru</th>
                    <th class="text-end">Selisih</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in koreksiItems" :key="item.id">
                    <td class="text-caption font-weight-medium">{{ item.nama_barang }}</td>
                    <td class="text-end text-caption">{{ item.qty }}</td>
                    <td class="text-end text-caption">{{ formatRp(item.harga_satuan) }}</td>
                    <td class="text-end text-caption">{{ formatRp(item.subtotalLama) }}</td>
                    <td class="text-end">
                      <VTextField
                        v-model="item.qty_baru"
                        type="number"
                        min="0"
                        density="compact"
                        variant="outlined"
                        hide-details
                        style="min-width: 90px"
                        @update:model-value="recalcSelisih(idx)"
                      />
                    </td>
                    <td class="text-end">
                      <VTextField
                        v-model="item.harga_baru"
                        type="number"
                        min="0"
                        density="compact"
                        variant="outlined"
                        hide-details
                        style="min-width: 110px"
                        @update:model-value="recalcSelisih(idx)"
                      />
                    </td>
                    <td class="text-end text-caption" :class="item.subtotalBaru != null ? (item.subtotalBaru < item.subtotalLama ? 'text-error' : 'text-success') : 'text-medium-emphasis'">
                      {{ item.subtotalBaru != null ? formatRp(item.subtotalBaru) : '—' }}
                    </td>
                    <td class="text-end font-weight-bold text-caption" :class="(item.selisih ?? 0) >= 0 ? 'text-success' : 'text-error'">
                      {{ item.selisih != null ? ((item.selisih >= 0 ? '+' : '') + formatRp(item.selisih)) : '—' }}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="7" class="text-end font-weight-bold text-caption">
                      {{ koreksiForm.tipe === 'CREDIT_NOTE' ? 'Total Pengurangan:' : 'Total Penambahan:' }}
                    </td>
                    <td class="text-end font-weight-bold" :class="totalSelisihItems >= 0 ? 'text-success' : 'text-error'">
                      {{ (totalSelisihItems >= 0 ? '+' : '') + formatRp(totalSelisihItems) }}
                    </td>
                  </tr>
                </tfoot>
              </VTable>
              <VRow>
                <VCol cols="12">
                  <VTextarea
                    v-model="koreksiForm.alasan_koreksi"
                    label="Alasan"
                    rows="3"
                    auto-grow
                    counter="1000"
                    persistent-hint
                  />
                </VCol>
                <VCol cols="12">
                  <VTextField
                    v-model="koreksiForm.dokumen_url"
                    label="URL Dokumen Pendukung (opsional)"
                    hint="Link Google Drive, SharePoint, atau URL lainnya"
                    persistent-hint
                  />
                </VCol>
              </VRow>
            </template>

            <!-- Fallback: invoice dipilih tapi tidak ada items (invoice tanpa line item) -->
            <template v-else-if="koreksiForm.invoice_id && !itemsLoading">
              <VRow class="mt-2">
                <VCol cols="12">
                  <VTextField
                    v-model="koreksiForm.nilai"
                    :label="koreksiForm.tipe === 'CREDIT_NOTE' ? 'Nilai Pengurangan (Rp)' : 'Nilai Penambahan (Rp)'"
                    type="number"
                    min="0"
                    :hint="koreksiForm.tipe === 'CREDIT_NOTE' ? 'Tagihan klien akan berkurang sebesar nilai ini' : 'Tagihan klien akan bertambah sebesar nilai ini'"
                    persistent-hint
                  />
                </VCol>
                <VCol cols="12">
                  <VTextarea
                    v-model="koreksiForm.alasan_koreksi"
                    label="Alasan"
                    rows="3"
                    auto-grow
                    counter="1000"
                    persistent-hint
                  />
                </VCol>
                <VCol cols="12">
                  <VTextField
                    v-model="koreksiForm.dokumen_url"
                    label="URL Dokumen Pendukung (opsional)"
                    hint="Link Google Drive, SharePoint, atau URL lainnya"
                    persistent-hint
                  />
                </VCol>
              </VRow>
            </template>
          </template>

          <!-- ── Form Koreksi Qty & Harga ── -->
          <template v-else-if="koreksiForm.tipe === 'KOREKSI_QTY_HARGA'">
            <VRow>
              <VCol cols="12">
                <div class="text-caption font-weight-medium text-medium-emphasis mb-2">Pilih Invoice</div>
                <div v-if="!invoices.length" class="text-center py-4 text-medium-emphasis text-caption">
                  Tidak ada invoice tersedia.
                </div>
                <div v-else class="koreksi-invoice-list">
                  <div
                    v-for="inv in invoices"
                    :key="inv.id"
                    class="koreksi-invoice-row"
                    :class="{ 'koreksi-invoice-row--selected': koreksiForm.invoice_id === inv.id }"
                    @click="koreksiForm.invoice_id = inv.id; onInvoiceSelectedForKoreksiItem(inv.id)"
                  >
                    <div class="flex-grow-1 min-w-0">
                      <div class="d-flex align-center gap-2 mb-1 flex-wrap">
                        <span class="text-body-2 font-weight-bold">{{ inv.no_invoice }}</span>
                        <VChip size="x-small" :color="invoiceStatusColor(inv.status)" variant="tonal" label>{{ inv.status }}</VChip>
                        <VChip v-if="isOverdue(inv)" size="x-small" color="error" variant="tonal" label>Jatuh Tempo</VChip>
                      </div>
                      <div class="text-caption text-medium-emphasis">
                        {{ formatDate(inv.tanggal_invoice) }} · JT: {{ formatDate(inv.tanggal_jatuh_tempo) || '-' }}
                      </div>
                      <div class="text-caption mt-1">
                        Sisa: <span class="font-weight-bold text-error">{{ formatRp(sisaPerInvoice(inv)) }}</span>
                        <span class="text-medium-emphasis ms-2">/ {{ formatRp(inv.subtotal) }}</span>
                      </div>
                    </div>
                    <VAvatar v-if="koreksiForm.invoice_id === inv.id" size="24" color="primary" class="flex-shrink-0">
                      <VIcon icon="ri-check-line" size="14" color="white" />
                    </VAvatar>
                  </div>
                </div>
              </VCol>
            </VRow>

            <div v-if="itemsLoading" class="text-center py-4">
              <VProgressCircular indeterminate size="24" />
              <span class="text-caption ml-2">Memuat item invoice...</span>
            </div>

            <template v-else-if="koreksiForm.invoice_id && koreksiItems.length">
              <div class="text-caption text-medium-emphasis mb-2">Isi qty dan harga baru (kosongkan jika tidak berubah):</div>
              <VTable density="compact" class="eb-item-edit-table mb-3">
                <thead>
                  <tr>
                    <th>Barang</th>
                    <th class="text-end">Qty Lama</th>
                    <th class="text-end">Harga Lama</th>
                    <th class="text-end">Subtotal Lama</th>
                    <th class="text-end" style="min-width: 110px">Qty Baru</th>
                    <th class="text-end" style="min-width: 130px">Harga Baru</th>
                    <th class="text-end">Subtotal Baru</th>
                    <th class="text-end">Selisih</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in koreksiItems" :key="item.id">
                    <td class="text-caption font-weight-medium">{{ item.nama_barang }}</td>
                    <td class="text-end text-caption">{{ item.qty }}</td>
                    <td class="text-end text-caption">{{ formatRp(item.harga_satuan) }}</td>
                    <td class="text-end text-caption">{{ formatRp(item.subtotalLama) }}</td>
                    <td class="text-end">
                      <VTextField
                        v-model="item.qty_baru"
                        type="number"
                        min="0"
                        density="compact"
                        variant="outlined"
                        hide-details
                        style="min-width: 90px"
                        @update:model-value="recalcSelisih(idx)"
                      />
                    </td>
                    <td class="text-end">
                      <VTextField
                        v-model="item.harga_baru"
                        type="number"
                        min="0"
                        density="compact"
                        variant="outlined"
                        hide-details
                        style="min-width: 110px"
                        @update:model-value="recalcSelisih(idx)"
                      />
                    </td>
                    <td class="text-end text-caption" :class="item.subtotalBaru != null ? (item.subtotalBaru < item.subtotalLama ? 'text-error' : 'text-success') : 'text-medium-emphasis'">
                      {{ item.subtotalBaru != null ? formatRp(item.subtotalBaru) : '—' }}
                    </td>
                    <td class="text-end font-weight-bold text-caption" :class="(item.selisih ?? 0) >= 0 ? 'text-success' : 'text-error'">
                      {{ item.selisih != null ? ((item.selisih >= 0 ? '+' : '') + formatRp(item.selisih)) : '—' }}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="7" class="text-end font-weight-bold text-caption">Total Selisih:</td>
                    <td class="text-end font-weight-bold" :class="totalSelisihItems >= 0 ? 'text-success' : 'text-error'">
                      {{ (totalSelisihItems >= 0 ? '+' : '') + formatRp(totalSelisihItems) }}
                    </td>
                  </tr>
                </tfoot>
              </VTable>

              <VRow>
                <VCol cols="12">
                  <VTextarea
                    v-model="koreksiForm.alasan_koreksi"
                    label="Alasan Koreksi"
                    rows="3"
                    auto-grow
                    counter="1000"
                    persistent-hint
                  />
                </VCol>
                <VCol cols="12">
                  <VTextField
                    v-model="koreksiForm.dokumen_url"
                    label="URL Dokumen Pendukung (opsional)"
                    hint="Link Google Drive, SharePoint, atau URL lainnya"
                    persistent-hint
                  />
                </VCol>
              </VRow>
            </template>
          </template>

          <!-- ── Form Koreksi Saldo ── -->
          <template v-else-if="koreksiForm.tipe === 'KOREKSI_SALDO'">
            <VRow>
              <VCol cols="12">
                <div class="text-caption text-medium-emphasis mb-2">Jenis Koreksi</div>
                <VBtnToggle
                  v-model="koreksiForm.tipe_koreksi"
                  mandatory
                  density="compact"
                  variant="outlined"
                  color="primary"
                  class="mb-4"
                  style="width: 100%"
                >
                  <VBtn value="tambah" style="flex: 1" prepend-icon="ri-add-line">Tambah Saldo</VBtn>
                  <VBtn value="kurangi" style="flex: 1" prepend-icon="ri-subtract-line">Kurangi Saldo</VBtn>
                </VBtnToggle>
                <VTextField
                  v-model="koreksiForm.nilai"
                  label="Jumlah Koreksi (Rp)"
                  type="number"
                  min="0"
                  :hint="`Saldo akan ${koreksiForm.tipe_koreksi === 'tambah' ? 'bertambah' : 'berkurang'} sebesar jumlah ini`"
                  persistent-hint
                />
              </VCol>
              <VCol cols="12">
                <VTextarea
                  v-model="koreksiForm.alasan_koreksi"
                  label="Alasan Koreksi"
                  rows="3"
                  auto-grow
                  counter="1000"
                  persistent-hint
                />
              </VCol>
              <VCol cols="12">
                <VTextField
                  v-model="koreksiForm.dokumen_url"
                  label="URL Dokumen Pendukung (opsional)"
                  hint="Link Google Drive, SharePoint, atau URL lainnya"
                  persistent-hint
                />
              </VCol>
            </VRow>
          </template>

          <VAlert type="info" density="compact" variant="tonal" icon="ri-shield-check-line" class="mt-4">
            Semua koreksi memerlukan persetujuan dua tahap: <strong>SPV</strong> lalu <strong>Manager</strong>. Saldo tidak berubah sampai keduanya menyetujui.
          </VAlert>
          <VAlert v-if="koreksiError" type="error" class="mt-2" density="compact">{{ koreksiError }}</VAlert>
        </template>

      </VCardText>

      <VDivider />
      <VCardActions class="px-4 py-3">
        <VBtn variant="text" :disabled="submittingKoreksi" @click="closeKoreksiDialog">Batal</VBtn>
        <VSpacer />
        <VBtn v-if="koreksiStep === 2" variant="text" @click="koreksiStep = 1">Kembali</VBtn>
        <VBtn
          v-if="koreksiStep === 1"
          color="primary"
          :disabled="!koreksiForm.tipe"
          @click="koreksiStep = 2"
        >Lanjut</VBtn>
        <VBtn
          v-else
          color="primary"
          :loading="submittingKoreksi"
          @click="submitKoreksiDialog"
        >Ajukan Koreksi</VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import api from '@/utils/axios'
import EndingBalanceStatusBadge from '@/modules/Finance/shared/components/EndingBalanceStatusBadge.vue'

const route     = useRoute()
const authStore = useAuthStore()

const loading  = ref(false)
const eb       = ref(null)

const locking          = ref(false)
const showLockDialog   = ref(false)
const unlocking        = ref(false)
const showUnlockDialog = ref(false)

// Invoice
const invoices        = ref([])
const invoicesLoading = ref(false)
const invoicesError   = ref('')

// Pembayaran
const payments        = ref([])
const paymentsLoading = ref(false)
const paymentsError   = ref('')

// Koreksi dialog — multi-step
const showKoreksiDialog = ref(false)
const koreksiStep       = ref(1)
const koreksiForm = reactive({
  tipe:          '',
  tipe_koreksi:  'tambah',  // untuk KOREKSI_SALDO: tambah | kurangi
  invoice_id:    null,
  nilai:         '',
  alasan_koreksi:'',
  dokumen_url:   '',
})
const submittingKoreksi = ref(false)
const koreksiError      = ref('')

// Items untuk KOREKSI_QTY_HARGA
const koreksiItems  = ref([])   // { id, nama_barang, qty, harga_satuan, qty_baru, harga_baru, selisih }
const itemsLoading  = ref(false)

const totalSelisihItems = computed(() =>
  koreksiItems.value.reduce((s, i) => s + (i.selisih ?? 0), 0)
)

// Expand koreksi item baris
const expandedKoreksiId = ref(null)

// Net koreksi yang sudah disetujui
const koreksiNet = computed(() => (eb.value?.saldo_akhir_final ?? 0) - (eb.value?.saldo_akhir_sistem ?? 0))

// Dropdown invoice untuk modal
const invoiceOptions = computed(() =>
  invoices.value.map(inv => ({
    id:    inv.id,
    label: `${inv.no_invoice} — ${formatRp(sisaPerInvoice(inv))} sisa`,
  }))
)

// ─── Format helpers ──────────────────────────────────────────────────────────

function formatRp(val) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val ?? 0)
}
function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}
function formatDatetime(d) {
  if (!d) return '-'
  return new Date(d).toLocaleString('id-ID')
}
function statusColor(s) {
  return { PENDING_SPV: 'warning', PENDING_MANAGER: 'info', APPROVED: 'success', REJECTED: 'error' }[s] ?? 'default'
}
function statusLabel(s) {
  return { PENDING_SPV: 'Menunggu SPV', PENDING_MANAGER: 'Menunggu Manager', APPROVED: 'Disetujui', REJECTED: 'Ditolak' }[s] ?? s
}
function invoiceStatusColor(s) {
  return { DRAFT: 'default', TERKIRIM: 'primary', SEBAGIAN: 'warning', LUNAS: 'success' }[s] ?? 'default'
}
function metodeColor(m) {
  return { TRANSFER: 'primary', CASH: 'success', GIRO: 'info' }[m] ?? 'default'
}
function tipeBadgeColor(tipe) {
  return { CREDIT_NOTE: 'error', DEBIT_NOTE: 'info', KOREKSI_QTY_HARGA: 'warning', KOREKSI_SALDO: 'secondary' }[tipe] ?? 'default'
}
function tipeLabel(tipe) {
  return { CREDIT_NOTE: 'CN', DEBIT_NOTE: 'DN', KOREKSI_QTY_HARGA: 'Koreksi Item', KOREKSI_SALDO: 'Koreksi Saldo' }[tipe] ?? tipe
}
function sisaPerInvoice(inv) {
  if (inv.subtotal === 0) return inv.sisa_tagihan
  const net = inv.subtotal - inv.total_pembayaran - (inv.total_cn ?? 0) + (inv.total_dn ?? 0)
  return Math.max(0, net)
}
function isOverdue(inv) {
  return inv.tanggal_jatuh_tempo
    && sisaPerInvoice(inv) > 0
    && inv.tanggal_jatuh_tempo < new Date().toISOString().slice(0, 10)
}

// ─── Data loaders ─────────────────────────────────────────────────────────────

async function fetchEb() {
  loading.value = true
  try {
    const { data } = await api.get(`/finance/ending-balance/${route.params.id}`)
    eb.value = data.data
  } finally {
    loading.value = false
  }
}

async function fetchInvoices() {
  invoicesLoading.value = true
  invoicesError.value = ''
  try {
    const { data } = await api.get(`/finance/ending-balance/${route.params.id}/invoices`)
    invoices.value = data.data ?? []
  } catch (e) {
    invoicesError.value = e?.response?.data?.message ?? 'Gagal memuat data invoice.'
  } finally {
    invoicesLoading.value = false
  }
}

async function fetchPayments() {
  paymentsLoading.value = true
  paymentsError.value = ''
  try {
    const { data } = await api.get(`/finance/ending-balance/${route.params.id}/payments`)
    payments.value = data.data ?? []
  } catch (e) {
    paymentsError.value = e?.response?.data?.message ?? 'Gagal memuat data pembayaran.'
  } finally {
    paymentsLoading.value = false
  }
}

async function doLock() {
  locking.value = true
  try {
    const { data } = await api.patch(`/finance/ending-balance/${eb.value.id}/lock`)
    eb.value = data.data
    showLockDialog.value = false
  } catch (e) {
    alert(e?.response?.data?.message ?? 'Gagal mengunci.')
  } finally {
    locking.value = false
  }
}

async function doUnlock() {
  unlocking.value = true
  try {
    const { data } = await api.patch(`/finance/ending-balance/${eb.value.id}/unlock`)
    eb.value = data.data
    showUnlockDialog.value = false
  } catch (e) {
    alert(e?.response?.data?.message ?? 'Gagal membuka kunci periode.')
  } finally {
    unlocking.value = false
  }
}

// ─── Koreksi dialog ─────────────────────────────────────────────────────────

function openKoreksiDialog() {
  koreksiStep.value           = 1
  koreksiForm.tipe            = ''
  koreksiForm.tipe_koreksi    = 'tambah'
  koreksiForm.invoice_id      = null
  koreksiForm.nilai           = ''
  koreksiForm.alasan_koreksi  = ''
  koreksiForm.dokumen_url     = ''
  koreksiItems.value          = []
  koreksiError.value          = ''
  showKoreksiDialog.value     = true
}

function closeKoreksiDialog() {
  showKoreksiDialog.value = false
}

async function onInvoiceSelectedForKoreksiItem(invoiceId) {
  koreksiItems.value = []
  if (!invoiceId) return

  itemsLoading.value = true
  try {
    const { data } = await api.get(`/finance/invoices/${invoiceId}`)
    const items = data.data?.items ?? data.data?.invoice_items ?? []
    koreksiItems.value = items.map(i => ({
      id:           i.id,
      invoice_item_id: i.id,
      nama_barang:  i.nama_barang,
      qty:          Number(i.qty),
      harga_satuan: Number(i.harga_satuan),
      subtotalLama: Math.round(Number(i.qty) * Number(i.harga_satuan) * 100) / 100,
      qty_baru:     '',
      harga_baru:   '',
      subtotalBaru: null,
      selisih:      null,
    }))
  } catch {
    koreksiItems.value = []
  } finally {
    itemsLoading.value = false
  }
}

function recalcSelisih(idx) {
  const item = koreksiItems.value[idx]
  const qtyBaru    = Number(item.qty_baru) || item.qty
  const hargaBaru  = Number(item.harga_baru) || item.harga_satuan
  item.subtotalBaru = Math.round(qtyBaru * hargaBaru * 100) / 100
  item.selisih      = Math.round((item.subtotalBaru - item.subtotalLama) * 100) / 100
}

async function submitKoreksiDialog() {
  koreksiError.value = ''

  const tipe = koreksiForm.tipe

  // Validasi sederhana
  if (!koreksiForm.alasan_koreksi) {
    koreksiError.value = 'Alasan koreksi wajib diisi.'
    return
  }

  let payload = { tipe, alasan_koreksi: koreksiForm.alasan_koreksi, dokumen_url: koreksiForm.dokumen_url || null }

  if (tipe === 'CREDIT_NOTE' || tipe === 'DEBIT_NOTE') {
    if (!koreksiForm.invoice_id) { koreksiError.value = 'Invoice wajib dipilih.'; return }
    payload.invoice_id = koreksiForm.invoice_id

    const changedItems = koreksiItems.value.filter(i => i.qty_baru !== '' || i.harga_baru !== '')
    if (changedItems.length > 0) {
      if (itemsLoading.value) { koreksiError.value = 'Tunggu item invoice selesai dimuat.'; return }
      const total = changedItems.reduce((s, i) => s + (i.selisih ?? 0), 0)
      if (tipe === 'CREDIT_NOTE' && total >= 0) {
        koreksiError.value = 'Credit Note harus menghasilkan pengurangan tagihan (total selisih harus negatif).'; return
      }
      if (tipe === 'DEBIT_NOTE' && total <= 0) {
        koreksiError.value = 'Debit Note harus menghasilkan penambahan tagihan (total selisih harus positif).'; return
      }
      payload.items = changedItems.map(i => ({
        invoice_item_id:   i.id,
        qty_baru:          Number(i.qty_baru) || i.qty,
        harga_satuan_baru: Number(i.harga_baru) || i.harga_satuan,
      }))
    } else {
      if (!koreksiForm.nilai || Number(koreksiForm.nilai) <= 0) {
        koreksiError.value = tipe === 'CREDIT_NOTE' ? 'Nilai pengurangan wajib diisi (> 0).' : 'Nilai penambahan wajib diisi (> 0).'
        return
      }
      payload.nilai_koreksi = tipe === 'CREDIT_NOTE' ? -Math.abs(Number(koreksiForm.nilai)) : Math.abs(Number(koreksiForm.nilai))
    }

  } else if (tipe === 'KOREKSI_QTY_HARGA') {
    if (!koreksiForm.invoice_id) { koreksiError.value = 'Invoice wajib dipilih.'; return }
    const changedItems = koreksiItems.value.filter(i => i.qty_baru !== '' || i.harga_baru !== '')
    if (!changedItems.length) { koreksiError.value = 'Minimal satu item harus diubah qty atau harganya.'; return }
    payload.invoice_id = koreksiForm.invoice_id
    payload.items = changedItems.map(i => ({
      invoice_item_id:  i.id,
      qty_baru:         Number(i.qty_baru) || i.qty,
      harga_satuan_baru:Number(i.harga_baru) || i.harga_satuan,
    }))

  } else if (tipe === 'KOREKSI_SALDO') {
    if (!koreksiForm.nilai || Number(koreksiForm.nilai) <= 0) { koreksiError.value = 'Jumlah koreksi wajib diisi (> 0).'; return }
    const jumlah = Number(koreksiForm.nilai)
    payload.nilai_koreksi = koreksiForm.tipe_koreksi === 'tambah' ? jumlah : -jumlah
  }

  submittingKoreksi.value = true
  try {
    await api.post(`/finance/ending-balance/${eb.value.id}/koreksi`, payload)
    showKoreksiDialog.value = false
    await fetchEb()
  } catch (e) {
    koreksiError.value = e?.response?.data?.message ?? 'Gagal mengajukan koreksi.'
  } finally {
    submittingKoreksi.value = false
  }
}

// ─── Expand & Print ──────────────────────────────────────────────────────────

function toggleKoreksiExpand(id) {
  expandedKoreksiId.value = expandedKoreksiId.value === id ? null : id
}

async function openPrintDialog(k) {
  try {
    const res = await api.get(`/finance/ending-balance/koreksi/${k.id}/print`, { responseType: 'blob' })
    const blobUrl = URL.createObjectURL(res.data)
    window.open(blobUrl, '_blank')
    setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000)
  } catch (e) {
    alert(e?.response?.data?.message ?? 'Gagal membuka dokumen cetak.')
  }
}

onMounted(() => {
  fetchEb()
  fetchInvoices()
  fetchPayments()
})
</script>

<style scoped>
.calc-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.audit-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 0;
}

.eb-invoice-table :deep(th) {
  white-space: nowrap;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.eb-invoice-table :deep(td) {
  vertical-align: middle;
}
.eb-koreksi-table :deep(td) {
  vertical-align: top;
}
.eb-item-table :deep(th),
.eb-item-edit-table :deep(th) {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
}

.tipe-card {
  transition: box-shadow 0.15s, background 0.15s;
  min-height: 80px;
}
.tipe-card:hover {
  box-shadow: 0 3px 10px rgba(0,0,0,0.12);
}
.tipe-card--selected {
  background: rgba(var(--v-theme-on-surface), 0.04) !important;
}

.koreksi-invoice-list {
  max-height: 260px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-right: 2px;
}
.koreksi-invoice-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface));
  transition: border-color 0.15s, background 0.15s;
}
.koreksi-invoice-row:hover {
  border-color: rgba(var(--v-theme-primary), 0.4);
  background: rgba(var(--v-theme-primary), 0.03);
}
.koreksi-invoice-row--selected {
  border-color: rgba(var(--v-theme-primary), 0.6);
  background: rgba(var(--v-theme-primary), 0.07);
}

.cursor-pointer {
  cursor: pointer;
}

@media print {
  #print-area {
    display: block !important;
  }
}
</style>
