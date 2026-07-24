<template>
  <div>
    <PageHeader
      :title="eb ? `Ending Balance AP — ${eb.nama_vendor}` : 'Detail Ending Balance AP'"
      :subtitle="eb ? `${formatDate(eb.periode_awal)} – ${formatDate(eb.periode_akhir)}` : ''"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Ending Balance AP', to: { name: 'ap-ending-balance-index' } },
        { title: 'Detail', disabled: true },
      ]"
    >
      <VBtn
        variant="text"
        prepend-icon="ri-arrow-left-line"
        :to="{ name: 'ap-ending-balance-index' }"
      >
        Kembali
      </VBtn>
    </PageHeader>

    <div
      v-if="loading"
      class="text-center py-10"
    >
      <VProgressCircular indeterminate />
    </div>

    <template v-else-if="eb">
      <!-- ── 1. Ringkasan Saldo ── -->
      <VRow class="mb-4">
        <VCol
          cols="6"
          md="3"
        >
          <VCard>
            <VCardText>
              <div class="text-caption text-medium-emphasis mb-1">
                Saldo Awal
              </div>
              <div class="text-h6 font-weight-bold">
                {{ formatRp(eb.saldo_awal) }}
              </div>
            </VCardText>
          </VCard>
        </VCol>
        <VCol
          cols="6"
          md="3"
        >
          <VCard>
            <VCardText>
              <div class="text-caption text-medium-emphasis mb-1">
                Tagihan Masuk
              </div>
              <div class="text-h6 font-weight-bold text-primary">
                + {{ formatRp(eb.tagihan_masuk) }}
              </div>
            </VCardText>
          </VCard>
        </VCol>
        <VCol
          cols="6"
          md="3"
        >
          <VCard>
            <VCardText>
              <div class="text-caption text-medium-emphasis mb-1">
                Pembayaran
              </div>
              <div class="text-h6 font-weight-bold text-success">
                - {{ formatRp(eb.pembayaran) }}
              </div>
            </VCardText>
          </VCard>
        </VCol>
        <VCol
          cols="6"
          md="3"
        >
          <VCard :color="eb.saldo_akhir_sistem !== eb.saldo_akhir_final ? 'warning' : undefined">
            <VCardText>
              <div class="text-caption text-medium-emphasis mb-1">
                Saldo Akhir Final
                <EndingBalanceStatusBadge
                  :status="eb.status"
                  class="ml-1"
                />
              </div>
              <div class="text-h6 font-weight-bold">
                {{ formatRp(eb.saldo_akhir_final) }}
              </div>
              <div
                v-if="eb.saldo_akhir_sistem !== eb.saldo_akhir_final"
                class="text-caption"
              >
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
        Periode dikunci<template v-if="eb.locked_by">
          oleh <strong>{{ eb.locked_by }}</strong>
        </template><template v-if="eb.locked_at">
          pada {{ formatDatetime(eb.locked_at) }}
        </template>.
        Perubahan saldo memerlukan koreksi manual dengan persetujuan Manager/Supervisor.
      </VAlert>

      <!-- Aksi DRAFT -->
      <VCard
        v-if="eb.status === 'DRAFT'"
        class="mb-4"
      >
        <VCardText class="d-flex align-center justify-space-between flex-wrap gap-3">
          <div class="text-body-2 text-medium-emphasis">
            Periode ini masih <strong>DRAFT</strong>. Setelah data diverifikasi, tutup periode untuk mengunci nilai.
          </div>
          <div class="d-flex gap-2">
            <AppActionButton
              v-if="authStore.canOperateEndingBalanceAp"
              action="ajukan"
              label="Ajukan Koreksi"
              :loading="openingKoreksi"
              @click="openKoreksiDialog"
            />
            <AppActionButton
              v-if="authStore.canLockEndingBalanceAp"
              action="custom"
              color="success"
              icon="ri-lock-line"
              :loading="locking"
              @click="showLockDialog = true"
            >
              Tutup Periode
            </AppActionButton>
          </div>
        </VCardText>
      </VCard>

      <!-- Alert koreksi aktif -->
      <VAlert
        v-if="eb.has_active_koreksi"
        type="info"
        class="mb-4"
        density="compact"
      >
        Terdapat koreksi yang sedang dalam proses persetujuan. Koreksi baru bisa diajukan setelah selesai.
      </VAlert>

      <!-- Aksi Koreksi + Unlock (LOCKED) -->
      <VCard
        v-if="eb.status === 'LOCKED'"
        class="mb-4"
      >
        <VCardText class="d-flex align-center justify-space-between flex-wrap gap-3">
          <div class="text-body-2 text-medium-emphasis">
            Periode ini sudah <strong>TERKUNCI</strong>. Jika ada perbedaan nilai, ajukan koreksi atau buka kunci untuk re-hitung.
          </div>
          <div class="d-flex gap-2">
            <AppActionButton
              v-if="authStore.canOperateEndingBalanceAp && !eb.has_active_koreksi"
              action="ajukan"
              label="Ajukan Koreksi"
              :loading="openingKoreksi"
              @click="openKoreksiDialog"
            />
            <AppActionButton
              v-if="authStore.canLockEndingBalanceAp"
              action="custom"
              color="warning"
              icon="ri-lock-unlock-line"
              :loading="unlocking"
              @click="showUnlockDialog = true"
            >
              Buka Periode
            </AppActionButton>
          </div>
        </VCardText>
      </VCard>

      <!-- ── 2. Perhitungan Saldo ── -->
      <VCard class="mb-4">
        <VCardTitle class="pt-4 px-5 text-body-1 font-weight-bold">
          Perhitungan Saldo
        </VCardTitle>
        <VDivider />
        <VCardText class="px-5 py-4">
          <div class="calc-row">
            <span class="text-medium-emphasis">Saldo Awal</span>
            <span>{{ formatRp(eb.saldo_awal) }}</span>
          </div>
          <div class="calc-row">
            <span class="text-medium-emphasis">+ Tagihan Masuk</span>
            <span class="text-primary">{{ formatRp(eb.tagihan_masuk) }}</span>
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

      <!-- ── 3 & 4. Daftar Tagihan / Pembayaran (lazy: dimuat saat panel dibuka) ── -->
      <VExpansionPanels
        v-model="openPanels"
        multiple
        class="mb-4"
        variant="accordion"
      >
        <VExpansionPanel value="tagihan">
          <VExpansionPanelTitle>
            Daftar Tagihan
            <VChip
              v-if="tagihanList.length"
              size="x-small"
              color="primary"
              class="ms-2"
            >
              {{ tagihanList.length }}
            </VChip>
          </VExpansionPanelTitle>
          <VExpansionPanelText>
            <div
              v-if="tagihanLoading"
              class="text-center pa-8"
            >
              <VProgressCircular indeterminate />
            </div>
            <VAlert
              v-else-if="tagihanError"
              type="error"
              density="compact"
            >
              {{ tagihanError }}
            </VAlert>
            <template v-else-if="tagihanLoaded">
              <div
                v-if="!tagihanList.length"
                class="text-center text-medium-emphasis pa-8"
              >
                Tidak ada tagihan dalam periode ini.
              </div>
              <VTable
                v-else
                density="compact"
                class="eb-invoice-table"
              >
                <thead>
                  <tr>
                    <th>No Tagihan</th>
                    <th>Tgl Tagihan</th>
                    <th>Jatuh Tempo</th>
                    <th class="text-end">
                      Total Tagihan
                    </th>
                    <th class="text-end">
                      Terbayar
                    </th>
                    <th class="text-end">
                      Sisa
                    </th>
                    <th class="text-center">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="t in tagihanList"
                    :key="t.id"
                  >
                    <td class="font-weight-medium text-no-wrap">
                      {{ t.no_tagihan }}
                      <VChip
                        v-if="t.is_opening_balance"
                        size="x-small"
                        color="secondary"
                        label
                        class="ms-1"
                      >
                        OB
                      </VChip>
                    </td>
                    <td class="text-caption text-medium-emphasis text-no-wrap">
                      {{ formatDate(t.tanggal_tagihan) }}
                    </td>
                    <td
                      class="text-caption text-no-wrap"
                      :class="isOverdue(t) ? 'text-error font-weight-medium' : 'text-medium-emphasis'"
                    >
                      {{ formatDate(t.tanggal_jatuh_tempo) }}
                    </td>
                    <td class="text-end text-no-wrap">
                      {{ formatRp(t.total_tagihan) }}
                    </td>
                    <td class="text-end text-no-wrap text-success">
                      {{ formatRp(t.total_pembayaran) }}
                    </td>
                    <td
                      class="text-end text-no-wrap font-weight-bold"
                      :class="t.sisa_tagihan > 0 ? 'text-warning' : 'text-success'"
                    >
                      {{ formatRp(t.sisa_tagihan) }}
                    </td>
                    <td class="text-center">
                      <VChip
                        size="x-small"
                        :color="tagihanStatusColor(t.status)"
                        label
                      >
                        {{ t.status }}
                      </VChip>
                    </td>
                  </tr>
                </tbody>
              </VTable>
            </template>
          </VExpansionPanelText>
        </VExpansionPanel>

        <VExpansionPanel value="pembayaran">
          <VExpansionPanelTitle>
            Daftar Pembayaran
            <VChip
              v-if="payments.length"
              size="x-small"
              color="success"
              class="ms-2"
            >
              {{ payments.length }}
            </VChip>
          </VExpansionPanelTitle>
          <VExpansionPanelText>
            <div
              v-if="paymentsLoading"
              class="text-center pa-8"
            >
              <VProgressCircular indeterminate />
            </div>
            <VAlert
              v-else-if="paymentsError"
              type="error"
              density="compact"
            >
              {{ paymentsError }}
            </VAlert>
            <template v-else-if="paymentsLoaded">
              <div
                v-if="!payments.length"
                class="text-center text-medium-emphasis pa-8"
              >
                Tidak ada pembayaran dalam periode ini.
              </div>
              <VTable
                v-else
                density="compact"
                class="eb-invoice-table"
              >
                <thead>
                  <tr>
                    <th>No Tagihan</th>
                    <th>Tanggal</th>
                    <th class="text-end">
                      Jumlah
                    </th>
                    <th>Metode</th>
                    <th>No Referensi</th>
                    <th>Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="p in payments"
                    :key="p.id"
                  >
                    <td class="font-weight-medium text-no-wrap">
                      {{ p.no_tagihan }}
                    </td>
                    <td class="text-caption text-medium-emphasis text-no-wrap">
                      {{ formatDate(p.tanggal_pembayaran) }}
                    </td>
                    <td class="text-end text-no-wrap font-weight-bold text-success">
                      {{ formatRp(p.jumlah_pembayaran) }}
                    </td>
                    <td>
                      <VChip
                        size="x-small"
                        :color="metodeColor(p.metode_pembayaran)"
                        label
                      >
                        {{ p.metode_pembayaran }}
                      </VChip>
                    </td>
                    <td class="text-caption text-medium-emphasis">
                      {{ p.no_referensi || '—' }}
                    </td>
                    <td
                      class="text-caption text-medium-emphasis"
                      style="max-width: 200px; white-space: normal;"
                    >
                      {{ p.keterangan || '—' }}
                    </td>
                  </tr>
                </tbody>
              </VTable>
            </template>
          </VExpansionPanelText>
        </VExpansionPanel>
      </VExpansionPanels>

      <!-- ── 5. Riwayat Koreksi Ending Balance AP ── -->
      <VCard class="mb-4">
        <VCardTitle class="pt-4 px-5 text-body-1 font-weight-bold">
          Riwayat Koreksi Ending Balance AP
          <VChip
            v-if="eb.koreksi?.length"
            size="x-small"
            color="info"
            class="ms-2"
          >
            {{ eb.koreksi.length }}
          </VChip>
        </VCardTitle>
        <VDivider />
        <div
          v-if="!eb.koreksi?.length"
          class="text-center text-medium-emphasis pa-8"
        >
          Belum ada riwayat koreksi untuk periode ini.
        </div>
        <VTable
          v-else
          density="comfortable"
          class="eb-koreksi-table"
        >
          <thead>
            <tr>
              <th class="text-no-wrap">
                Tipe
              </th>
              <th class="text-no-wrap">
                No Dokumen
              </th>
              <th class="text-no-wrap">
                Nilai Koreksi
              </th>
              <th class="text-no-wrap">
                Tagihan
              </th>
              <th>Alasan</th>
              <th class="text-no-wrap">
                Status
              </th>
              <th class="text-no-wrap">
                Pengaju
              </th>
              <th class="text-no-wrap">
                Keputusan Approver
              </th>
              <th class="text-no-wrap">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            <template
              v-for="k in eb.koreksi"
              :key="k.id"
            >
              <tr>
                <td>
                  <VChip
                    size="x-small"
                    :color="tipeBadgeColor(k.tipe)"
                    label
                  >
                    {{ tipeLabel(k.tipe) }}
                  </VChip>
                </td>
                <td class="text-caption font-weight-medium text-no-wrap">
                  {{ k.no_dokumen || '—' }}
                </td>
                <td
                  class="font-weight-bold text-no-wrap"
                  :class="k.nilai_koreksi >= 0 ? 'text-success' : 'text-error'"
                >
                  {{ k.nilai_koreksi >= 0 ? '+' : '' }}{{ formatRp(k.nilai_koreksi) }}
                </td>
                <td class="text-caption text-no-wrap">
                  <span v-if="k.no_tagihan">{{ k.no_tagihan }}</span>
                  <span
                    v-else
                    class="text-medium-emphasis"
                  >—</span>
                </td>
                <td style="max-width: 220px; white-space: normal;">
                  {{ k.alasan_koreksi }}
                </td>
                <td>
                  <VChip
                    size="x-small"
                    :color="statusColor(k.status)"
                    label
                  >
                    {{ statusLabel(k.status) }}
                  </VChip>
                </td>
                <td class="text-caption text-no-wrap">
                  <span class="font-weight-medium">{{ k.submitted_by }}</span><br>
                  <span class="text-medium-emphasis">{{ formatDatetime(k.submitted_at) }}</span>
                </td>
                <td class="text-caption">
                  <template v-if="k.approved_by">
                    <span class="font-weight-medium">{{ k.approved_by }}</span><br>
                    <span :class="k.status === 'REJECTED' ? 'text-error' : 'text-success'">{{ k.approved_note || '—' }}</span><br>
                    <span class="text-medium-emphasis">{{ formatDatetime(k.approved_at) }}</span>
                  </template>
                  <span
                    v-else
                    class="text-medium-emphasis"
                  >Menunggu</span>
                </td>
                <td class="text-no-wrap">
                  <div class="d-flex gap-1 flex-wrap">
                    <VBtn
                      v-if="k.tipe === 'CREDIT_NOTE' || k.tipe === 'DEBIT_NOTE'"
                      size="x-small"
                      variant="tonal"
                      color="primary"
                      prepend-icon="ri-printer-line"
                      @click="openPrintDialog(k)"
                    >
                      Cetak
                    </VBtn>
                    <VBtn
                      v-if="k.items?.length"
                      size="x-small"
                      variant="tonal"
                      color="secondary"
                      :prepend-icon="expandedKoreksiId === k.id ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'"
                      @click="toggleKoreksiExpand(k.id)"
                    >
                      {{ expandedKoreksiId === k.id ? 'Tutup' : 'Detail Item' }}
                    </VBtn>
                  </div>
                </td>
              </tr>
              <tr v-if="k.items?.length && expandedKoreksiId === k.id">
                <td
                  colspan="9"
                  class="pa-0"
                >
                  <div class="bg-surface-variant pa-3">
                    <div class="text-caption text-medium-emphasis font-weight-bold mb-2">
                      Detail Perubahan Item
                    </div>
                    <VTable
                      density="compact"
                      class="eb-item-table"
                    >
                      <thead>
                        <tr>
                          <th>Barang</th>
                          <th class="text-end">
                            Qty Lama
                          </th>
                          <th class="text-end">
                            Harga Lama
                          </th>
                          <th class="text-end">
                            Subtotal Lama
                          </th>
                          <th class="text-end">
                            Qty Baru
                          </th>
                          <th class="text-end">
                            Harga Baru
                          </th>
                          <th class="text-end">
                            Subtotal Baru
                          </th>
                          <th class="text-end">
                            Selisih
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="item in k.items"
                          :key="item.id"
                        >
                          <td class="font-weight-medium">
                            {{ item.nama_barang }}
                          </td>
                          <td class="text-end text-caption">
                            {{ item.qty_lama }}
                          </td>
                          <td class="text-end text-caption">
                            {{ formatRp(item.harga_satuan_lama) }}
                          </td>
                          <td class="text-end">
                            {{ formatRp(item.subtotal_lama) }}
                          </td>
                          <td class="text-end text-caption">
                            {{ item.qty_baru }}
                          </td>
                          <td class="text-end text-caption">
                            {{ formatRp(item.harga_satuan_baru) }}
                          </td>
                          <td class="text-end">
                            {{ formatRp(item.subtotal_baru) }}
                          </td>
                          <td
                            class="text-end font-weight-bold"
                            :class="item.selisih >= 0 ? 'text-success' : 'text-error'"
                          >
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
        <VCardTitle class="pt-4 px-5 text-body-1 font-weight-bold">
          Aktivitas
        </VCardTitle>
        <VDivider />
        <VCardText class="px-5 py-4">
          <VRow dense>
            <VCol
              cols="12"
              sm="6"
              md="4"
            >
              <div class="audit-row">
                <span class="text-caption text-medium-emphasis">Dibuat pada</span>
                <span class="text-body-2">{{ formatDatetime(eb.created_at) }}</span>
              </div>
            </VCol>
            <VCol
              cols="12"
              sm="6"
              md="4"
            >
              <div class="audit-row">
                <span class="text-caption text-medium-emphasis">Dibuat oleh</span>
                <span class="text-body-2 font-weight-medium">{{ eb.created_by || '—' }}</span>
              </div>
            </VCol>
            <VCol
              cols="12"
              sm="6"
              md="4"
            >
              <div class="audit-row">
                <span class="text-caption text-medium-emphasis">Dihitung pada</span>
                <span class="text-body-2">{{ formatDatetime(eb.updated_at) }}</span>
              </div>
            </VCol>
            <template v-if="eb.status === 'LOCKED'">
              <VCol
                cols="12"
                sm="6"
                md="4"
              >
                <div class="audit-row">
                  <span class="text-caption text-medium-emphasis">Ditutup oleh</span>
                  <span class="text-body-2 font-weight-medium">{{ eb.locked_by || '—' }}</span>
                </div>
              </VCol>
              <VCol
                cols="12"
                sm="6"
                md="4"
              >
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
  <VDialog
    v-model="showLockDialog"
    max-width="420"
  >
    <VCard>
      <VCardTitle class="pt-4 px-4">
        Tutup Periode
      </VCardTitle>
      <VCardText>
        Kunci ending balance <strong>{{ eb?.nama_vendor }}</strong> untuk periode
        {{ formatDate(eb?.periode_awal) }} – {{ formatDate(eb?.periode_akhir) }}?
        <br><br>
        Setelah dikunci, nilai tidak bisa diubah. Koreksi manual memerlukan persetujuan Manager/Supervisor.
      </VCardText>
      <VCardActions class="px-4 pb-4">
        <VSpacer />
        <AppActionButton
          action="batalkan"
          @click="showLockDialog = false"
        />
        <AppActionButton
          action="custom"
          color="success"
          :loading="locking"
          @click="doLock"
        >
          Kunci
        </AppActionButton>
      </VCardActions>
    </VCard>
  </VDialog>

  <!-- Dialog Konfirmasi Unlock -->
  <VDialog
    v-model="showUnlockDialog"
    max-width="420"
  >
    <VCard>
      <VCardTitle class="pt-4 px-4">
        Buka Kunci Periode
      </VCardTitle>
      <VCardText>
        Buka kunci ending balance <strong>{{ eb?.nama_vendor }}</strong> untuk periode
        {{ formatDate(eb?.periode_awal) }} – {{ formatDate(eb?.periode_akhir) }}?
        <VAlert
          type="warning"
          variant="tonal"
          density="compact"
          class="mt-3"
        >
          Pastikan data yang akan diubah sudah dikonfirmasi sebelum mengunci ulang.
        </VAlert>
      </VCardText>
      <VCardActions class="px-4 pb-4">
        <VSpacer />
        <AppActionButton
          action="batalkan"
          @click="showUnlockDialog = false"
        />
        <AppActionButton
          action="custom"
          color="warning"
          :loading="unlocking"
          @click="doUnlock"
        >
          Buka Kunci
        </AppActionButton>
      </VCardActions>
    </VCard>
  </VDialog>

  <!-- Dialog Ajukan Koreksi (multi-step) -->
  <KoreksiWizardDialog
    v-if="showKoreksiDialog"
    v-model="showKoreksiDialog"
    :eb="eb"
    :tagihan-list="tagihanList"
    :tagihan-loading="tagihanLoading"
    @submitted="onKoreksiSubmitted"
  />
</template>

<script setup>
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import api from '@/utils/axios'
import EndingBalanceStatusBadge from '@/modules/Finance/shared/components/EndingBalanceStatusBadge.vue'

const KoreksiWizardDialog = defineAsyncComponent(() => import('../components/KoreksiWizardDialog.vue'))

const route     = useRoute()
const authStore = useAuthStore()

const loading  = ref(false)
const eb       = ref(null)

const locking          = ref(false)
const showLockDialog   = ref(false)
const unlocking        = ref(false)
const showUnlockDialog = ref(false)

// Tagihan — dimuat lazy saat panel dibuka (atau saat dialog koreksi butuh datanya)
const tagihanList   = ref([])
const tagihanLoading = ref(false)
const tagihanError   = ref('')
const tagihanLoaded  = ref(false)

// Pembayaran — dimuat lazy saat panel dibuka
const payments        = ref([])
const paymentsLoading = ref(false)
const paymentsError   = ref('')
const paymentsLoaded  = ref(false)

const openPanels = ref([])

const showKoreksiDialog = ref(false)
const openingKoreksi    = ref(false)

const expandedKoreksiId = ref(null)

const koreksiNet = computed(() => (eb.value?.saldo_akhir_final ?? 0) - (eb.value?.saldo_akhir_sistem ?? 0))

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
  return { PENDING: 'info', APPROVED: 'success', REJECTED: 'error' }[s] ?? 'default'
}
function statusLabel(s) {
  return { PENDING: 'Menunggu Approval', APPROVED: 'Disetujui', REJECTED: 'Ditolak' }[s] ?? s
}
function tagihanStatusColor(s) {
  return { DRAFT: 'default', DITERIMA: 'primary', SEBAGIAN: 'warning', LUNAS: 'success' }[s] ?? 'default'
}
function metodeColor(m) {
  return { TRANSFER: 'primary', CASH: 'success', GIRO: 'info' }[m] ?? 'default'
}
function tipeBadgeColor(tipe) {
  return { CREDIT_NOTE: 'error', DEBIT_NOTE: 'info', KOREKSI_SALDO: 'secondary' }[tipe] ?? 'default'
}
function tipeLabel(tipe) {
  return { CREDIT_NOTE: 'CN', DEBIT_NOTE: 'DN', KOREKSI_SALDO: 'Koreksi Saldo' }[tipe] ?? tipe
}
function isOverdue(t) {
  return t.tanggal_jatuh_tempo
    && t.sisa_tagihan > 0
    && t.tanggal_jatuh_tempo < new Date().toISOString().slice(0, 10)
}

async function fetchEb() {
  loading.value = true
  try {
    const { data } = await api.get(`/ap/ending-balance/${route.params.id}`)

    eb.value = data.data
  } finally {
    loading.value = false
  }
}

async function fetchTagihan() {
  tagihanLoading.value = true
  tagihanError.value = ''
  try {
    const { data } = await api.get(`/ap/ending-balance/${route.params.id}/tagihan`)

    tagihanList.value = data.data ?? []
    tagihanLoaded.value = true
  } catch (e) {
    tagihanError.value = e?.response?.data?.message ?? 'Gagal memuat data tagihan.'
  } finally {
    tagihanLoading.value = false
  }
}

async function fetchPayments() {
  paymentsLoading.value = true
  paymentsError.value = ''
  try {
    const { data } = await api.get(`/ap/ending-balance/${route.params.id}/pembayaran`)

    payments.value = data.data ?? []
    paymentsLoaded.value = true
  } catch (e) {
    paymentsError.value = e?.response?.data?.message ?? 'Gagal memuat data pembayaran.'
  } finally {
    paymentsLoading.value = false
  }
}

async function ensureTagihanLoaded() {
  if (tagihanLoaded.value || tagihanLoading.value) return
  await fetchTagihan()
}

async function ensurePaymentsLoaded() {
  if (paymentsLoaded.value || paymentsLoading.value) return
  await fetchPayments()
}

watch(openPanels, panels => {
  if (panels.includes('tagihan')) ensureTagihanLoaded()
  if (panels.includes('pembayaran')) ensurePaymentsLoaded()
})

async function doLock() {
  locking.value = true
  try {
    const { data } = await api.patch(`/ap/ending-balance/${eb.value.id}/lock`)

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
    const { data } = await api.patch(`/ap/ending-balance/${eb.value.id}/unlock`)

    eb.value = data.data
    showUnlockDialog.value = false
  } catch (e) {
    alert(e?.response?.data?.message ?? 'Gagal membuka kunci periode.')
  } finally {
    unlocking.value = false
  }
}

async function openKoreksiDialog() {
  openingKoreksi.value = true
  await ensureTagihanLoaded()
  openingKoreksi.value = false
  showKoreksiDialog.value = true
}

async function onKoreksiSubmitted() {
  await fetchEb()
}

function toggleKoreksiExpand(id) {
  expandedKoreksiId.value = expandedKoreksiId.value === id ? null : id
}

async function openPrintDialog(k) {
  try {
    const res = await api.get(`/ap/ending-balance/koreksi/${k.id}/print`, { responseType: 'blob' })
    const blobUrl = URL.createObjectURL(res.data)

    window.open(blobUrl, '_blank')
    setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000)
  } catch (e) {
    alert(e?.response?.data?.message ?? 'Gagal membuka dokumen cetak.')
  }
}

onMounted(() => {
  fetchEb()
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

.cursor-pointer {
  cursor: pointer;
}
</style>
