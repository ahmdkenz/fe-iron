<template>
  <div>
    <PageHeader
      :title="`Rekonsiliasi — ${report.bank_type ?? ''}`"
      :subtitle="report.nama_file ?? 'Detail transaksi'"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Rekonsiliasi Bank', to: { name: 'finance-rekonsiliasi-bank' } },
        { title: 'Detail', disabled: true },
      ]"
    >
      <VBtn variant="text" prepend-icon="ri-arrow-left-line" :to="{ name: 'finance-rekonsiliasi-bank' }">Kembali</VBtn>
    </PageHeader>

    <!-- Info Header -->
    <VCard class="mb-4" v-if="report.id">
      <VCardText>
        <div class="d-flex flex-wrap gap-4 align-center">
          <VChip :color="bankColor(report.bank_type)" variant="tonal" label>
            {{ report.bank_type }}
          </VChip>
          <div>
            <div class="text-caption text-medium-emphasis">Periode</div>
            <div class="text-body-2 font-weight-medium">{{ report.periode_awal }} — {{ report.periode_akhir }}</div>
          </div>
          <div>
            <div class="text-caption text-medium-emphasis">File</div>
            <div class="text-body-2">{{ report.nama_file }}</div>
          </div>
          <div>
            <div class="text-caption text-medium-emphasis">Diupload oleh</div>
            <div class="text-body-2">{{ report.uploaded_by }}</div>
          </div>
          <VSpacer />
          <div class="text-caption text-medium-emphasis text-right">
            {{ report.created_at }}
          </div>
        </div>
      </VCardText>
    </VCard>

    <!-- Summary Cards -->
    <VRow class="mb-4">
      <VCol cols="6" sm="3">
        <VCard>
          <VCardText class="text-center">
            <div class="text-caption text-medium-emphasis">Total Transaksi</div>
            <div class="text-h5 font-weight-bold">{{ report.total_transaksi ?? 0 }}</div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="6" sm="3">
        <VCard>
          <VCardText class="text-center">
            <div class="text-caption text-medium-emphasis">MATCHED</div>
            <div class="text-h5 font-weight-bold text-success">{{ report.jumlah_matched ?? 0 }}</div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="6" sm="3">
        <VCard>
          <VCardText class="text-center">
            <div class="text-caption text-medium-emphasis">UNMATCHED</div>
            <div class="text-h5 font-weight-bold text-error">{{ report.jumlah_unmatched ?? 0 }}</div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="6" sm="3">
        <VCard>
          <VCardText class="text-center">
            <div class="text-caption text-medium-emphasis">Total Kredit</div>
            <div class="text-h5 font-weight-bold text-primary">{{ formatCurrency(report.total_kredit ?? 0) }}</div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Filter Tabs + Table -->
    <VCard>
      <VCardText class="pb-0">
        <VBtnToggle v-model="filterStatus" variant="outlined" mandatory divided density="compact">
          <VBtn value="SEMUA"     size="small" style="min-width: 80px">Semua</VBtn>
          <VBtn value="MATCHED"   size="small" style="min-width: 90px"><span class="text-success">MATCHED</span></VBtn>
          <VBtn value="POSSIBLE"  size="small" style="min-width: 95px"><span class="text-warning">POSSIBLE</span></VBtn>
          <VBtn value="UNMATCHED" size="small" style="min-width: 105px"><span class="text-error">UNMATCHED</span></VBtn>
        </VBtnToggle>
      </VCardText>
      <VDivider class="mt-3" />
      <VProgressLinear v-if="loading" indeterminate color="primary" />
      <BaseTable
        :headers="headers"
        :items="paginatedRows"
        :total="filteredRows.length"
        :loading="loading"
        :per-page="perPage"
        :page="page"
        @update:options="onTableOptions"
      >
        <template #item.no="{ index }">
          {{ (page - 1) * perPage + index + 1 }}
        </template>
        <template #item.debit="{ item }">
          <span v-if="item.debit > 0" class="text-warning font-weight-medium">{{ formatCurrency(item.debit) }}</span>
          <span v-else class="text-disabled">-</span>
        </template>
        <template #item.kredit="{ item }">
          <span v-if="item.kredit > 0" class="text-success font-weight-medium">{{ formatCurrency(item.kredit) }}</span>
          <span v-else class="text-disabled">-</span>
        </template>
        <template #item.saldo="{ item }">
          {{ formatCurrency(item.saldo) }}
        </template>
        <template #item.status_cocok="{ item }">
          <VChip :color="statusColor(item.status_cocok)" size="x-small" variant="tonal" label>
            {{ item.status_cocok }}
          </VChip>
        </template>
        <!-- No Referensi dari transaksi bank -->
        <template #item.no_referensi="{ item }">
          <span v-if="item.no_referensi" class="text-caption font-weight-medium text-primary">
            {{ item.no_referensi }}
          </span>
          <span v-else class="text-disabled">-</span>
        </template>

        <template #item.pembayaran="{ item }">
          <div v-if="item.pembayaran" class="text-caption">
            <div class="font-weight-medium">{{ item.pembayaran.no_referensi || '-' }}</div>
            <div class="text-medium-emphasis">{{ item.pembayaran.tanggal_pembayaran }}</div>
            <div class="text-medium-emphasis">{{ item.pembayaran.klien }}</div>
          </div>
          <span v-else class="text-disabled">-</span>
        </template>

        <!-- Selisih Bank -->
        <template #item.selisih_bank="{ item }">
          <template v-if="item.selisih_bank !== null && item.selisih_bank !== undefined">
            <VChip v-if="item.selisih_bank === 0" color="success" size="x-small" variant="tonal">
              Rp 0
            </VChip>
            <span v-else :class="item.selisih_bank > 0 ? 'text-error font-weight-medium' : 'text-warning font-weight-medium'">
              {{ item.selisih_bank > 0 ? '+' : '-' }}{{ formatCurrency(Math.abs(item.selisih_bank)) }}
            </span>
          </template>
          <span v-else class="text-disabled">-</span>
        </template>

        <!-- Dicocokkan Oleh -->
        <template #item.matched_by="{ item }">
          <span v-if="item.matched_by" class="text-caption font-weight-medium">{{ item.matched_by }}</span>
          <span v-else-if="item.status_cocok === 'MATCHED'" class="text-caption font-weight-medium">{{ report.uploaded_by }}</span>
          <span v-else class="text-disabled">-</span>
        </template>

        <!-- Kelebihan Bayar -->
        <template #item.kelebihan="{ item }">
          <div v-if="item.kelebihan_bayar?.sisa > 0" class="d-flex flex-column align-start gap-1">
            <span class="text-caption text-error font-weight-medium">
              {{ formatCurrency(item.kelebihan_bayar.sisa) }}
            </span>
            <VBtn size="x-small" color="error" variant="tonal" @click="openKelebihanDialog(item)">
              Alokasikan / PDM
            </VBtn>
          </div>
          <div v-else-if="item.kelebihan_bayar?.total > 0" class="d-flex flex-column align-start gap-1">
            <VChip v-if="item.kelebihan_bayar?.pdm?.status === 'AKTIF'" size="x-small" color="deep-purple" variant="tonal">
              PDM
            </VChip>
            <VChip v-else size="x-small" color="success" variant="tonal">
              Teralokasi
            </VChip>
          </div>
          <span v-else class="text-disabled">-</span>
        </template>

        <!-- Aksi -->
        <template #item.aksi="{ item }">
          <div class="d-flex gap-1 align-center flex-wrap">
            <template v-if="item.status_cocok === 'UNMATCHED'">
              <VBtn size="x-small" variant="tonal" color="primary" :loading="matchLoading === item.id" @click="openMatchDialog(item)">
                <VIcon start size="14">ri-link-m</VIcon>Cocokkan
              </VBtn>
              <VBtn size="x-small" variant="text" color="grey" :loading="abaikanLoading === item.id" @click="doAbaikan(item)">
                Abaikan
              </VBtn>
            </template>
            <template v-else-if="item.status_cocok === 'POSSIBLE'">
              <VBtn size="x-small" variant="tonal" color="warning" :loading="matchLoading === item.id" @click="openMatchDialog(item)">
                <VIcon start size="14">ri-link-m</VIcon>Cocokkan
              </VBtn>
              <VBtn size="x-small" variant="text" color="grey" :loading="abaikanLoading === item.id" @click="doAbaikan(item)">
                Abaikan
              </VBtn>
            </template>
            <template v-else-if="item.status_cocok === 'MATCHED'">
              <VBtn size="x-small" variant="outlined" color="error" :loading="unmatchLoading === item.id" @click="openUnmatchDialog(item)">
                <VIcon start size="14">ri-link-unlink</VIcon>Batalkan
              </VBtn>
            </template>
          </div>
        </template>
      </BaseTable>
    </VCard>

    <!-- ── Dialog: Pilih Pembayaran Manual ── -->
    <VDialog v-model="matchDialog" max-width="750" persistent>
      <VCard>
        <VCardTitle class="pa-4 pb-2"><span class="text-h6">Cocokkan Transaksi Manual</span></VCardTitle>
        <VDivider />
        <VCardText class="pa-4">
          <VCard variant="tonal" color="primary" class="mb-4 pa-3">
            <div class="text-caption text-medium-emphasis mb-1">Transaksi Bank</div>
            <div class="d-flex gap-4 flex-wrap">
              <div><span class="text-caption text-medium-emphasis">Tanggal: </span><span class="text-body-2 font-weight-medium">{{ selectedItem?.tanggal }}</span></div>
              <div><span class="text-caption text-medium-emphasis">Kredit: </span><span class="text-body-2 font-weight-medium text-success">{{ formatCurrency(selectedItem?.kredit ?? 0) }}</span></div>
              <div class="flex-1-1"><span class="text-caption text-medium-emphasis">Keterangan: </span><span class="text-body-2">{{ selectedItem?.keterangan }}</span></div>
            </div>
          </VCard>
          <div class="text-body-2 font-weight-medium mb-2">Pilih Pembayaran yang Cocok:</div>
          <VProgressLinear v-if="kandidatLoading" indeterminate color="primary" class="mb-2" />
          <VAlert v-if="!kandidatLoading && kandidatList.length === 0" type="info" variant="tonal" class="mb-2">
            Tidak ada kandidat pembayaran dalam rentang ±14 hari dengan nominal yang sama.
          </VAlert>
          <div v-if="kandidatList.length > 0">
            <VCard
              v-for="k in kandidatList"
              :key="k.id"
              :variant="selectedPembayaranId === k.id ? 'tonal' : 'outlined'"
              :color="selectedPembayaranId === k.id ? 'primary' : undefined"
              class="mb-2 cursor-pointer"
              @click="selectedPembayaranId = k.id"
            >
              <VCardText class="pa-3">
                <div class="d-flex align-center gap-2">
                  <VIcon :color="selectedPembayaranId === k.id ? 'primary' : 'grey'" size="18">
                    {{ selectedPembayaranId === k.id ? 'ri-radio-button-fill' : 'ri-checkbox-blank-circle-line' }}
                  </VIcon>
                  <div class="flex-1-1">
                    <div class="d-flex flex-wrap gap-x-4 gap-y-1">
                      <div><span class="text-caption text-medium-emphasis">Klien: </span><span class="text-body-2 font-weight-medium">{{ k.klien ?? '-' }}</span></div>
                      <div><span class="text-caption text-medium-emphasis">No Invoice: </span><span class="text-body-2">{{ k.no_invoice ?? '-' }}</span></div>
                      <div><span class="text-caption text-medium-emphasis">Tgl Bayar: </span><span class="text-body-2">{{ k.tanggal_pembayaran }}</span></div>
                      <div><span class="text-caption text-medium-emphasis">No Ref: </span><span class="text-body-2">{{ k.no_referensi || '-' }}</span></div>
                      <div><span class="text-caption text-medium-emphasis">Nominal: </span><span class="text-body-2 font-weight-medium text-success">{{ formatCurrency(k.jumlah_pembayaran) }}</span></div>
                    </div>
                    <div v-if="k.keterangan" class="text-caption text-medium-emphasis mt-1">{{ k.keterangan }}</div>
                  </div>
                </div>
              </VCardText>
            </VCard>
          </div>
          <VAlert v-if="matchError" type="error" variant="tonal" class="mt-3">{{ matchError }}</VAlert>
        </VCardText>
        <VDivider />
        <VCardActions class="pa-4">
          <VSpacer />
          <VBtn variant="text" @click="closeMatchDialog">Batal</VBtn>
          <VBtn color="primary" variant="tonal" :disabled="!selectedPembayaranId || kandidatLoading" :loading="matchSaving" @click="doManualMatch">
            Simpan Cocok
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- ── Dialog: Konfirmasi Batalkan Cocok ── -->
    <VDialog v-model="unmatchDialog" max-width="400" persistent>
      <VCard>
        <VCardTitle class="pa-4 pb-2"><span class="text-h6">Batalkan Cocok Transaksi</span></VCardTitle>
        <VDivider />
        <VCardText class="pa-4">
          <p class="text-body-2 mb-0">
            Apakah Anda yakin ingin membatalkan cocok transaksi ini?
            Status akan kembali ke <strong>UNMATCHED</strong>.
          </p>
        </VCardText>
        <VDivider />
        <VCardActions class="pa-4">
          <VSpacer />
          <VBtn variant="text" @click="unmatchDialog = false">Batal</VBtn>
          <VBtn color="error" variant="tonal" :loading="unmatchSaving" @click="doUnmatch">Ya, Batalkan</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- ── Dialog: Alokasikan Kelebihan Bayar ── -->
    <VDialog v-model="kelebihanDialog" max-width="680" persistent scrollable>
      <VCard>
        <!-- Header -->
        <VCardTitle class="d-flex align-center gap-2 pa-4 pb-3">
          <VIcon color="warning" size="20">ri-exchange-dollar-line</VIcon>
          <span class="text-h6">Alokasikan Kelebihan Bayar</span>
        </VCardTitle>
        <VDivider />

        <VCardText class="pa-4" style="max-height: 70vh">
          <!-- Info strip -->
          <div class="d-flex flex-wrap gap-4 align-center rounded-lg pa-3 mb-4 bg-error-subtle">
            <div>
              <div class="text-caption text-medium-emphasis">Klien</div>
              <div class="text-body-2 font-weight-semibold">{{ kelebihanItem?.pembayaran?.klien ?? '-' }}</div>
            </div>
            <VDivider vertical class="align-self-stretch" />
            <div>
              <div class="text-caption text-medium-emphasis">Total Kelebihan</div>
              <div class="text-body-2 font-weight-semibold">{{ formatCurrency(kelebihanItem?.kelebihan_bayar?.total ?? 0) }}</div>
            </div>
            <VDivider vertical class="align-self-stretch" />
            <div>
              <div class="text-caption text-medium-emphasis">Sudah Dialokasi</div>
              <div class="text-body-2">{{ formatCurrency(kelebihanItem?.kelebihan_bayar?.sudah_dialokasi ?? 0) }}</div>
            </div>
            <VDivider vertical class="align-self-stretch" />
            <div>
              <div class="text-caption text-medium-emphasis">Sisa Kelebihan</div>
              <div class="text-body-2 font-weight-bold text-error">{{ formatCurrency(kelebihanItem?.kelebihan_bayar?.sisa ?? 0) }}</div>
            </div>
          </div>

          <!-- Label section -->
          <div class="text-caption text-medium-emphasis text-uppercase font-weight-medium mb-2" style="letter-spacing: 0.6px">
            Pilih Invoice B2C (investor yang sama)
          </div>

          <VProgressLinear v-if="invoiceB2CLoading" indeterminate color="primary" class="mb-3" rounded />
          <VAlert v-if="!invoiceB2CLoading && invoiceB2CList.length === 0" type="info" variant="tonal" density="compact" class="mb-3">
            Tidak ada invoice B2C yang terbuka untuk investor ini.
          </VAlert>

          <!-- Invoice cards -->
          <div v-if="invoiceB2CList.length > 0" class="d-flex flex-column gap-2 mb-3">
            <div
              v-for="inv in invoiceB2CList"
              :key="inv.id"
              class="rounded-lg cursor-pointer"
              style="border: 2px solid; transition: border-color 0.15s, background 0.15s"
              :style="selectedInvoices[inv.id]
                ? 'border-color: rgb(var(--v-theme-primary)); background: rgba(var(--v-theme-primary), 0.06)'
                : 'border-color: rgba(var(--v-border-color), 0.28)'"
              @click="toggleInvoice(inv)"
            >
              <!-- Invoice info row -->
              <div class="d-flex align-center gap-3 pa-3" :class="{ 'pb-2': selectedInvoices[inv.id] }">
                <VCheckbox
                  :model-value="!!selectedInvoices[inv.id]"
                  color="primary"
                  density="compact"
                  hide-details
                  readonly
                  class="flex-0-0 mt-0"
                />
                <div class="flex-1-1 min-width-0">
                  <div class="d-flex align-center gap-2 flex-wrap">
                    <span class="text-body-2 font-weight-semibold">{{ inv.no_invoice }}</span>
                    <VChip :color="statusInvoiceColor(inv.status)" size="x-small" variant="tonal">{{ inv.status }}</VChip>
                  </div>
                  <div class="d-flex flex-wrap gap-x-3 gap-y-0 mt-1">
                    <span class="text-caption text-medium-emphasis">{{ inv.tanggal }}</span>
                    <span class="text-caption text-medium-emphasis">Total: {{ formatCurrency(inv.total_tagihan) }}</span>
                    <span class="text-caption font-weight-medium text-warning">Sisa: {{ formatCurrency(inv.sisa_tagihan) }}</span>
                  </div>
                  <div v-if="inv.nama_resto || inv.nama_klien" class="d-flex flex-wrap gap-x-2 mt-0.5">
                    <span v-if="inv.nama_resto" class="text-caption text-primary">{{ inv.nama_resto }}</span>
                    <span v-else-if="inv.nama_klien" class="text-caption text-primary">{{ inv.nama_klien }}</span>
                  </div>
                </div>
              </div>

              <!-- Inline input saat dipilih -->
              <div v-if="selectedInvoices[inv.id]" class="d-flex gap-3 px-3 pb-3" @click.stop>
                <VTextField
                  v-model.number="selectedInvoices[inv.id].jumlah"
                  label="Jumlah Dialokasikan"
                  type="number"
                  :hint="`Maks: ${formatCurrency(inv.sisa_tagihan)}`"
                  persistent-hint
                  density="compact"
                  variant="outlined"
                  prefix="Rp"
                  style="max-width: 220px"
                  @click.stop
                />
                <VTextField
                  v-model="selectedInvoices[inv.id].keterangan"
                  label="Keterangan (opsional)"
                  density="compact"
                  variant="outlined"
                  class="flex-1-1"
                  @click.stop
                />
              </div>
            </div>
          </div>

          <!-- Summary bar -->
          <div
            v-if="invoiceB2CList.length > 0 && Object.keys(selectedInvoices).length > 0"
            class="d-flex justify-space-between align-center rounded-lg px-4 py-2 mb-1"
            :class="sisaRemaining < 0 ? 'bg-error-subtle' : 'bg-success-subtle'"
          >
            <span class="text-body-2">
              <span class="text-medium-emphasis">Total Dialokasikan:</span>
              <strong class="ms-1">{{ formatCurrency(totalAlokasi) }}</strong>
            </span>
            <span
              class="text-body-2 font-weight-medium"
              :class="sisaRemaining < 0 ? 'text-error' : 'text-success'"
            >
              Sisa: {{ formatCurrency(sisaRemaining) }}
            </span>
          </div>

          <!-- Riwayat alokasi -->
          <template v-if="kelebihanItem?.kelebihan_bayar?.riwayat?.length > 0">
            <VDivider class="my-4" />
            <div class="text-caption text-medium-emphasis text-uppercase font-weight-medium mb-2" style="letter-spacing: 0.6px">
              Riwayat Alokasi
            </div>
            <div class="d-flex flex-column gap-1">
              <div
                v-for="r in kelebihanItem.kelebihan_bayar.riwayat"
                :key="r.id"
                class="d-flex align-center flex-wrap gap-x-2 gap-y-0 text-caption pa-2 rounded"
                style="background: rgba(var(--v-border-color), 0.06)"
              >
                <VIcon size="13" color="success" class="me-1">ri-checkbox-circle-line</VIcon>
                <span class="font-weight-medium">{{ r.no_invoice }}</span>
                <span class="text-medium-emphasis">•</span>
                <span class="text-success font-weight-medium">{{ formatCurrency(r.jumlah) }}</span>
                <span class="text-medium-emphasis">•</span>
                <span class="text-medium-emphasis">{{ r.tanggal }}</span>
                <span class="text-medium-emphasis">•</span>
                <span class="text-medium-emphasis">oleh {{ r.created_by }}</span>
              </div>
            </div>
          </template>

          <!-- Pendapatan di Muka -->
          <template v-if="kelebihanItem?.kelebihan_bayar">
            <VDivider class="my-4" />
            <div class="text-caption text-medium-emphasis text-uppercase font-weight-medium mb-2" style="letter-spacing: 0.6px">
              Pendapatan di Muka (PDM)
            </div>

            <!-- PDM aktif -->
            <div
              v-if="kelebihanItem.kelebihan_bayar.pdm?.status === 'AKTIF'"
              class="d-flex align-center gap-3 rounded-lg pa-3"
              style="background: rgba(103,58,183,0.06); border: 1px solid rgba(103,58,183,0.2)"
            >
              <VIcon color="deep-purple" size="18">ri-time-line</VIcon>
              <div class="flex-1-1">
                <div class="text-body-2 font-weight-semibold text-deep-purple">PDM TERCATAT</div>
                <div class="text-caption text-medium-emphasis">
                  {{ formatCurrency(kelebihanItem.kelebihan_bayar.pdm.jumlah) }}
                  &bull; {{ kelebihanItem.kelebihan_bayar.pdm.tanggal_pencatatan }}
                  &bull; oleh {{ kelebihanItem.kelebihan_bayar.pdm.created_by }}
                </div>
              </div>
              <VBtn size="x-small" variant="tonal" color="error" :loading="pdmCanceling" @click="doBatalkanPdm">
                Batalkan PDM
              </VBtn>
            </div>

            <!-- Sisa > 0 dan belum ada PDM aktif -->
            <div v-else-if="kelebihanItem.kelebihan_bayar.sisa > 0">
              <VBtn
                variant="tonal"
                color="deep-purple"
                size="small"
                :loading="pdmSaving"
                @click="doCatatPdm"
              >
                <VIcon start size="16">ri-book-line</VIcon>
                Catat {{ formatCurrency(kelebihanItem.kelebihan_bayar.sisa) }} sebagai PDM
              </VBtn>
              <div class="text-caption text-medium-emphasis mt-1">
                Uang diterima namun belum ada invoice yang cocok
              </div>
            </div>

            <VAlert v-if="pdmError" type="error" variant="tonal" density="compact" class="mt-2">
              {{ pdmError }}
            </VAlert>
          </template>

          <VAlert v-if="kelebihanError" type="error" variant="tonal" density="compact" class="mt-3">
            {{ kelebihanError }}
          </VAlert>
        </VCardText>

        <VDivider />
        <VCardActions class="pa-3 gap-2">
          <VSpacer />
          <VBtn variant="text" color="secondary" @click="closeKelebihanDialog">Batal</VBtn>
          <VBtn
            color="error"
            variant="flat"
            :disabled="Object.keys(selectedInvoices).length === 0 || totalAlokasi <= 0 || sisaRemaining < 0 || invoiceB2CLoading"
            :loading="kelebihanSaving"
            @click="doAlokasikanKelebihan"
          >
            <VIcon start size="16">ri-check-line</VIcon>
            Alokasikan
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useFormatter } from '@/composables/useFormatter'
import api from '@/utils/axios'

const route = useRoute()
const { formatCurrency } = useFormatter()

const loading = ref(false)
const report  = reactive({
  id: null, bank_type: null, nama_file: null,
  periode_awal: null, periode_akhir: null,
  total_transaksi: 0, total_kredit: 0,
  jumlah_matched: 0, jumlah_unmatched: 0,
  uploaded_by: null, created_at: null,
  details: [],
})

const filterStatus    = ref('SEMUA')
const page            = ref(1)
const perPage         = ref(25)
const abaikanLoading  = ref(null)
const matchLoading    = ref(null)
const unmatchLoading  = ref(null)

// ── Match dialog ──
const matchDialog          = ref(false)
const selectedItem         = ref(null)
const selectedPembayaranId = ref(null)
const kandidatList         = ref([])
const kandidatLoading      = ref(false)
const matchSaving          = ref(false)
const matchError           = ref(null)

// ── Unmatch dialog ──
const unmatchDialog  = ref(false)
const unmatchItem    = ref(null)
const unmatchSaving  = ref(false)

// ── Kelebihan dialog ──
const kelebihanDialog   = ref(false)
const kelebihanItem     = ref(null)
const invoiceB2CList    = ref([])
const invoiceB2CLoading = ref(false)
const selectedInvoices  = ref({}) // { [invoiceId]: { jumlah, keterangan } }
const kelebihanSaving   = ref(false)
const kelebihanError    = ref(null)

// ── PDM ──
const pdmSaving    = ref(false)
const pdmCanceling = ref(false)
const pdmError     = ref(null)

const totalAlokasi = computed(() =>
  Object.values(selectedInvoices.value).reduce((s, v) => s + (Number(v.jumlah) || 0), 0),
)
const sisaRemaining = computed(() =>
  (kelebihanItem.value?.kelebihan_bayar?.sisa ?? 0) - totalAlokasi.value,
)

const filteredRows = computed(() => {
  if (filterStatus.value === 'SEMUA') return report.details
  return report.details.filter(d => d.status_cocok === filterStatus.value)
})

const paginatedRows = computed(() => {
  if (perPage.value === -1) return filteredRows.value
  const start = (page.value - 1) * perPage.value
  return filteredRows.value.slice(start, start + perPage.value)
})

watch(filterStatus, () => { page.value = 1 })

function onTableOptions({ page: p, itemsPerPage }) {
  page.value    = p
  perPage.value = itemsPerPage
}

const bankColor   = (t) => ({ BCA: 'info', MANDIRI: 'warning', BNI: 'error', BRI: 'primary', CIMB: 'deep-purple', BSI: 'green' }[t] ?? 'secondary')
const statusColor = (s) => ({ MATCHED: 'success', POSSIBLE: 'warning', UNMATCHED: 'error', DIABAIKAN: 'grey' }[s] ?? 'grey')
const statusInvoiceColor = (s) => ({ LUNAS: 'success', SEBAGIAN: 'warning', TERKIRIM: 'info', DRAFT: 'grey' }[s] ?? 'grey')

const headers = [
  { title: 'No',             key: 'no',            sortable: false, width: '50px' },
  { title: 'Tanggal',        key: 'tanggal',       sortable: false, width: '110px' },
  { title: 'Keterangan',     key: 'keterangan',    sortable: false },
  { title: 'No Ref Bank',    key: 'no_referensi',  sortable: false, width: '140px' },
  { title: 'Debit',          key: 'debit',         sortable: false, align: 'end' },
  { title: 'Kredit',         key: 'kredit',        sortable: false, align: 'end' },
  { title: 'Saldo',          key: 'saldo',         sortable: false, align: 'end' },
  { title: 'Status',         key: 'status_cocok',  sortable: false, width: '110px' },
  { title: 'Cocok Dengan',   key: 'pembayaran',    sortable: false },
  { title: 'Selisih',        key: 'selisih_bank',  sortable: false, width: '90px', align: 'center' },
  { title: 'Dicocokkan Oleh',key: 'matched_by',    sortable: false, width: '130px' },
  { title: 'Kelebihan',      key: 'kelebihan',     sortable: false, width: '120px' },
  { title: 'Aksi',           key: 'aksi',          sortable: false, width: '160px' },
]

async function fetchDetail() {
  loading.value = true
  try {
    const { data } = await api.get(`/finance/rekonsiliasi-bank/${route.params.id}`)
    Object.assign(report, data.data)
  } finally {
    loading.value = false
  }
}

async function doAbaikan(item) {
  abaikanLoading.value = item.id
  try {
    await api.patch(`/finance/rekonsiliasi-bank/detail/${item.id}/abaikan`)
    const wasUnmatched = item.status_cocok === 'UNMATCHED'
    item.status_cocok = 'DIABAIKAN'
    item.pembayaran   = null
    if (wasUnmatched) report.jumlah_unmatched = Math.max(0, report.jumlah_unmatched - 1)
  } finally {
    abaikanLoading.value = null
  }
}

// ── Manual Match ──
async function openMatchDialog(item) {
  selectedItem.value         = item
  selectedPembayaranId.value = null
  kandidatList.value         = []
  matchError.value           = null
  matchDialog.value          = true
  matchLoading.value         = item.id

  kandidatLoading.value = true
  try {
    const { data } = await api.get(`/finance/rekonsiliasi-bank/detail/${item.id}/kandidat`)
    kandidatList.value = data.data ?? []
  } finally {
    kandidatLoading.value = false
    matchLoading.value    = null
  }
}

function closeMatchDialog() {
  matchDialog.value          = false
  selectedItem.value         = null
  selectedPembayaranId.value = null
  kandidatList.value         = []
  matchError.value           = null
}

async function doManualMatch() {
  if (!selectedPembayaranId.value || !selectedItem.value) return
  matchSaving.value = true
  matchError.value  = null
  try {
    const { data } = await api.patch(
      `/finance/rekonsiliasi-bank/detail/${selectedItem.value.id}/match`,
      { pembayaran_ar_id: selectedPembayaranId.value },
    )
    const updated = data.data
    const row = report.details.find(d => d.id === selectedItem.value.id)
    if (row) {
      const wasUnmatched = row.status_cocok === 'UNMATCHED'
      row.status_cocok    = updated.status_cocok
      row.pembayaran      = updated.pembayaran
      row.matched_by      = updated.matched_by
      row.selisih_bank    = updated.selisih_bank ?? 0
      row.kelebihan_bayar = updated.kelebihan_bayar ?? null
      report.jumlah_matched++
      if (wasUnmatched) report.jumlah_unmatched = Math.max(0, report.jumlah_unmatched - 1)
    }
    closeMatchDialog()
  } catch (err) {
    matchError.value = err?.response?.data?.message ?? 'Terjadi kesalahan, coba lagi.'
  } finally {
    matchSaving.value = false
  }
}

// ── Unmatch ──
function openUnmatchDialog(item) {
  unmatchItem.value   = item
  unmatchDialog.value = true
}

async function doUnmatch() {
  if (!unmatchItem.value) return
  unmatchSaving.value  = true
  unmatchLoading.value = unmatchItem.value.id
  try {
    await api.patch(`/finance/rekonsiliasi-bank/detail/${unmatchItem.value.id}/unmatch`)
    const row = report.details.find(d => d.id === unmatchItem.value.id)
    if (row) {
      row.status_cocok   = 'UNMATCHED'
      row.pembayaran     = null
      row.matched_by     = null
      row.selisih_bank   = null
      row.kelebihan_bayar = null
      report.jumlah_matched   = Math.max(0, report.jumlah_matched - 1)
      report.jumlah_unmatched++
    }
    unmatchDialog.value  = false
    unmatchItem.value    = null
  } finally {
    unmatchSaving.value  = false
    unmatchLoading.value = null
  }
}

// ── Kelebihan Bayar ──
async function openKelebihanDialog(item) {
  kelebihanItem.value    = item
  selectedInvoices.value = {}
  kelebihanError.value   = null
  pdmError.value         = null
  invoiceB2CList.value   = []
  kelebihanDialog.value  = true

  invoiceB2CLoading.value = true
  try {
    const { data } = await api.get(`/finance/rekonsiliasi-bank/detail/${item.id}/invoice-b2c`)
    invoiceB2CList.value = data.data ?? []
  } finally {
    invoiceB2CLoading.value = false
  }
}

function toggleInvoice(inv) {
  if (selectedInvoices.value[inv.id]) {
    const next = { ...selectedInvoices.value }
    delete next[inv.id]
    selectedInvoices.value = next
  } else {
    const autoJumlah = Math.min(inv.sisa_tagihan, sisaRemaining.value)
    selectedInvoices.value = {
      ...selectedInvoices.value,
      [inv.id]: { jumlah: autoJumlah > 0 ? autoJumlah : null, keterangan: '' },
    }
  }
}

function closeKelebihanDialog() {
  kelebihanDialog.value  = false
  kelebihanItem.value    = null
  selectedInvoices.value = {}
  kelebihanError.value   = null
  pdmError.value         = null
  invoiceB2CList.value   = []
}

async function doAlokasikanKelebihan() {
  const entries = Object.entries(selectedInvoices.value).filter(([, v]) => Number(v.jumlah) > 0)
  if (!entries.length) return
  const itemId = kelebihanItem.value.id
  kelebihanSaving.value = true
  kelebihanError.value  = null
  try {
    for (const [invoiceId, { jumlah, keterangan }] of entries) {
      await api.post(`/finance/rekonsiliasi-bank/detail/${itemId}/kelebihan`, {
        invoice_id : Number(invoiceId),
        jumlah,
        keterangan : keterangan || null,
      })
    }
    await fetchDetail()
    const updatedItem = report.details.find(d => d.id === itemId)
    if (updatedItem) kelebihanItem.value = updatedItem
    selectedInvoices.value = {}
    invoiceB2CLoading.value = true
    try {
      const { data } = await api.get(`/finance/rekonsiliasi-bank/detail/${itemId}/invoice-b2c`)
      invoiceB2CList.value = data.data ?? []
    } finally {
      invoiceB2CLoading.value = false
    }
  } catch (err) {
    kelebihanError.value = err?.response?.data?.message ?? 'Terjadi kesalahan, coba lagi.'
  } finally {
    kelebihanSaving.value = false
  }
}

// ── PDM functions ──
async function doCatatPdm() {
  const itemId = kelebihanItem.value.id
  const sisa   = kelebihanItem.value?.kelebihan_bayar?.sisa ?? 0
  pdmSaving.value = true
  pdmError.value  = null
  try {
    await api.post(`/finance/pendapatan-di-muka/detail/${itemId}/catat`, {
      jumlah             : sisa,
      tanggal_pencatatan : new Date().toISOString().slice(0, 10),
    })
    await fetchDetail()
    const updatedItem = report.details.find(d => d.id === itemId)
    if (updatedItem) kelebihanItem.value = updatedItem
  } catch (err) {
    pdmError.value = err?.response?.data?.message ?? 'Terjadi kesalahan saat mencatat PDM.'
  } finally {
    pdmSaving.value = false
  }
}

async function doBatalkanPdm() {
  const pdmId = kelebihanItem.value?.kelebihan_bayar?.pdm?.id
  if (!pdmId) return
  pdmCanceling.value = true
  pdmError.value     = null
  try {
    await api.delete(`/finance/pendapatan-di-muka/${pdmId}/batal`)
    await fetchDetail()
    const itemId      = kelebihanItem.value.id
    const updatedItem = report.details.find(d => d.id === itemId)
    if (updatedItem) kelebihanItem.value = updatedItem
  } catch (err) {
    pdmError.value = err?.response?.data?.message ?? 'Terjadi kesalahan saat membatalkan PDM.'
  } finally {
    pdmCanceling.value = false
  }
}

onMounted(fetchDetail)
</script>
