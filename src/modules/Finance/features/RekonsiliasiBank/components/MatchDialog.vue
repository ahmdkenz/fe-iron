<template>
  <VDialog
    :model-value="modelValue && !showBuktiStep"
    max-width="680"
    persistent
    scrollable
    @update:model-value="onDialogUpdate"
  >
    <VCard>
      <VCardTitle class="pa-4 pb-2">
        <span class="text-h6">Cocokkan Transaksi</span>
      </VCardTitle>
      <VDivider />
      <VCardText
        class="pa-4"
        style="max-height: 70vh"
      >
        <!-- Info bank yang akan otomatis jadi data pembayaran -->
        <VCard
          variant="tonal"
          color="primary"
          class="mb-4 pa-3"
        >
          <div class="text-caption text-medium-emphasis mb-2 font-weight-medium">
            Data Pembayaran Otomatis dari Bank
          </div>
          <div class="d-flex gap-4 flex-wrap">
            <div>
              <div class="text-caption text-medium-emphasis">
                Tanggal Bayar
              </div>
              <div class="text-body-2 font-weight-medium">
                {{ formatDate(item?.tanggal) }}
              </div>
            </div>
            <div>
              <div class="text-caption text-medium-emphasis">
                No Referensi
              </div>
              <div class="text-body-2 font-weight-medium text-primary">
                {{ item?.no_referensi || '-' }}
              </div>
            </div>
            <div>
              <div class="text-caption text-medium-emphasis">
                Jumlah
              </div>
              <div class="text-body-2 font-weight-medium text-success">
                {{ formatCurrency(item?.kredit ?? 0) }}
              </div>
            </div>
            <div>
              <div class="text-caption text-medium-emphasis">
                Metode
              </div>
              <div class="text-body-2 font-weight-medium">
                TRANSFER
              </div>
            </div>
          </div>
        </VCard>

        <div class="d-flex flex-wrap gap-3 mb-5">
          <VBtn
            v-for="opt in modeOptions"
            :key="opt.value"
            :color="mode === opt.value ? 'primary' : 'default'"
            :variant="mode === opt.value ? 'flat' : 'outlined'"
            size="small"
            rounded="lg"
            class="px-4 mode-toggle-btn"
            @click="mode = opt.value"
          >
            <VIcon
              start
              size="16"
            >
              {{ opt.icon }}
            </VIcon>
            {{ opt.label }}
          </VBtn>
        </div>

        <template v-if="mode === 'multi'">
          <div class="d-flex align-center gap-2 mb-2">
            <VIcon
              size="18"
              color="primary"
            >
              ri-git-merge-line
            </VIcon>
            <span class="text-body-2 font-weight-medium">Multi Payment — Lintas Resto/Investor</span>
          </div>
          <div class="text-caption text-medium-emphasis mb-3">
            Pilih invoice apa saja (boleh resto/investor berbeda, asal 1 entitas penagih yang sama) untuk dilunaskan
            dari 1 transaksi bank ini. Nominal per invoice otomatis terisi sesuai sisa tagihan saat dipilih, dan bisa
            diedit manual. Maksimum 50 invoice per Multi Payment.
          </div>

          <div class="d-flex align-center justify-space-between mb-3">
            <span class="text-body-2 font-weight-medium">Alokasi Invoice ({{ multiAllocations.length }})</span>
            <VBtn
              color="primary"
              size="small"
              variant="tonal"
              prepend-icon="ri-add-line"
              :disabled="multiAllocations.length >= 50"
              @click="multiPickerOpen = true"
            >
              Tambah Invoice
            </VBtn>
          </div>

          <div
            v-if="multiAllocations.length > 0"
            class="d-flex align-center justify-space-between mb-2"
          >
            <VCheckbox
              :model-value="multiAllSelected"
              :indeterminate="multiSomeSelected && !multiAllSelected"
              hide-details
              density="compact"
              color="primary"
              @update:model-value="toggleMultiSelectAll"
            >
              <template #label>
                <span class="text-caption font-weight-medium">Pilih Semua</span>
              </template>
            </VCheckbox>

            <VBtn
              v-if="multiSomeSelected"
              color="error"
              size="small"
              variant="tonal"
              prepend-icon="ri-delete-bin-line"
              @click="removeMultiAllocationsBulk"
            >
              Hapus Terpilih ({{ multiSelectedIds.length }})
            </VBtn>
          </div>

          <div
            v-if="multiAllocations.length === 0"
            class="d-flex flex-column align-center justify-center py-8 text-medium-emphasis"
          >
            <VIcon
              icon="ri-file-list-3-line"
              size="36"
              class="mb-2 opacity-40"
            />
            <span class="text-body-2">Belum ada invoice dipilih</span>
          </div>

          <div
            v-else
            class="d-flex flex-column gap-2 mb-3"
          >
            <VCard
              v-for="(row, idx) in multiAllocations"
              :key="row.invoice_id"
              variant="outlined"
            >
              <VCardText class="pa-3">
                <div class="d-flex align-start gap-2">
                  <VCheckbox
                    :model-value="multiSelectedIds.includes(row.invoice_id)"
                    hide-details
                    density="compact"
                    color="primary"
                    class="flex-shrink-0"
                    @update:model-value="toggleMultiSelect(row.invoice_id)"
                  />
                  <div class="flex-grow-1 min-width-0">
                    <div class="d-flex align-center gap-2 flex-wrap mb-1">
                      <span class="text-body-2 font-weight-semibold">{{ row.no_invoice }}</span>
                      <span
                        v-if="row.nama_resto"
                        class="text-caption text-primary"
                      >{{ row.nama_resto }}</span>
                    </div>
                    <div class="text-caption text-medium-emphasis mb-2">
                      {{ row.nama_klien ?? '-' }} · Sisa Tagihan: {{ formatCurrency(row.sisa_tagihan) }}
                    </div>
                    <VTextField
                      :model-value="row.jumlah"
                      type="number"
                      label="Nominal Dibayar"
                      density="compact"
                      variant="outlined"
                      hide-details
                      :min="0"
                      :max="row.sisa_tagihan"
                      @update:model-value="val => clampMultiJumlah(row, Number(val))"
                    />
                  </div>
                  <VBtn
                    icon
                    variant="text"
                    size="small"
                    color="error"
                    @click="removeMultiAllocation(idx)"
                  >
                    <VIcon
                      icon="ri-delete-bin-line"
                      size="18"
                    />
                  </VBtn>
                </div>
              </VCardText>
            </VCard>
          </div>

          <VCard
            variant="tonal"
            :color="multiTotalAlokasi > (Number(item?.kredit) || 0) + 0.01 ? 'error' : 'success'"
            class="pa-3"
          >
            <div class="d-flex justify-space-between text-body-2">
              <span>Total Alokasi</span>
              <strong>{{ formatCurrency(multiTotalAlokasi) }}</strong>
            </div>
            <div class="d-flex justify-space-between text-caption text-medium-emphasis">
              <span>Nominal Kredit Bank</span>
              <span>{{ formatCurrency(item?.kredit ?? 0) }}</span>
            </div>
            <div
              v-if="multiSisaBelumAlokasi > 0.01"
              class="text-caption mt-1"
            >
              Sisa {{ formatCurrency(multiSisaBelumAlokasi) }} akan tercatat sebagai Kelebihan Bayar dan bisa
              dialokasikan ke invoice lain setelah transaksi ini dicocokkan.
            </div>
          </VCard>
        </template>

        <template v-else-if="mode === 'pdm'">
          <div class="d-flex align-center gap-2 mb-2">
            <VIcon
              size="18"
              color="deep-purple"
            >
              ri-book-line
            </VIcon>
            <span class="text-body-2 font-weight-medium">Catat sebagai Pendapatan di Muka</span>
          </div>
          <div class="text-caption text-medium-emphasis mb-3">
            Gunakan mode ini bila dana masuk belum bisa dicocokkan ke invoice manapun. Seluruh nominal transaksi bank
            akan dicatat sebagai Pendapatan di Muka (PDM) milik Client/Resto yang dipilih, dan bisa dialokasikan ke
            invoice nanti melalui Laporan Pendapatan di Muka.
          </div>

          <VAutocomplete
            v-model="pdmKlienId"
            :items="klienList"
            item-title="display_label"
            item-value="id"
            label="Client / Resto AR"
            placeholder="Cari nama klien atau resto..."
            density="compact"
            variant="outlined"
            clearable
            :loading="klienLoading"
            class="mb-3"
            @focus="ensureKlienLoaded"
          />

          <VTextField
            :model-value="formatCurrency(item?.kredit ?? 0)"
            label="Nominal PDM"
            density="compact"
            variant="outlined"
            readonly
            hint="Nominal PDM mengikuti seluruh nilai kredit transaksi bank ini"
            persistent-hint
            class="mb-3"
          />

          <VTextField
            v-model="pdmKeterangan"
            label="Keterangan (opsional)"
            density="compact"
            variant="outlined"
          />
        </template>

        <template v-else>
          <!-- ── Section: Invoice Opening Balance ── -->
          <div class="d-flex align-center gap-2 mb-2">
            <VIcon
              size="18"
              color="deep-purple"
            >
              ri-bookmark-line
            </VIcon>
            <span class="text-body-2 font-weight-medium">Invoice Opening Balance</span>
          </div>
          <VTextField
            v-model="obSearch"
            placeholder="Cari no invoice OB, nama klien, atau nama resto..."
            density="compact"
            variant="outlined"
            prepend-inner-icon="ri-search-line"
            clearable
            class="mb-3"
            hide-details
            @input="onObSearchInput"
            @click:clear="obSearch = ''; fetchCandidates('ob')"
          />

          <VProgressLinear
            v-if="obLoading"
            indeterminate
            color="primary"
            class="mb-2"
            rounded
          />
          <VAlert
            v-if="!obLoading && obCandidates.length === 0"
            type="info"
            variant="tonal"
            density="compact"
            class="mb-2"
          >
            Tidak ada invoice Opening Balance yang terbuka.
          </VAlert>

          <div
            v-if="obCandidates.length > 0"
            class="d-flex flex-column gap-2"
          >
            <VCard
              v-for="inv in obCandidates"
              :key="inv.id"
              :variant="selectedInvoiceId === inv.id ? 'tonal' : 'outlined'"
              :color="selectedInvoiceId === inv.id ? 'primary' : undefined"
              class="cursor-pointer"
              @click="selectedInvoiceId = inv.id"
            >
              <VCardText class="pa-3">
                <div class="d-flex align-center gap-2">
                  <VIcon
                    :color="selectedInvoiceId === inv.id ? 'primary' : 'grey'"
                    size="18"
                  >
                    {{ selectedInvoiceId === inv.id ? 'ri-radio-button-fill' : 'ri-checkbox-blank-circle-line' }}
                  </VIcon>
                  <div class="flex-1-1 min-width-0">
                    <div class="d-flex align-center gap-2 flex-wrap mb-1">
                      <span class="text-body-2 font-weight-semibold">{{ inv.no_invoice }}</span>
                      <VChip
                        :color="statusInvoiceColor(inv.status)"
                        size="x-small"
                        variant="tonal"
                      >
                        {{ inv.status }}
                      </VChip>
                      <VChip
                        v-if="inv.is_opening_balance"
                        color="deep-purple"
                        size="x-small"
                        variant="tonal"
                      >
                        OB
                      </VChip>
                    </div>
                    <div class="d-flex flex-wrap gap-x-3 gap-y-0">
                      <span class="text-caption text-medium-emphasis">{{ inv.nama_klien ?? '-' }}</span>
                      <span class="text-caption text-medium-emphasis">Tgl: {{ formatDate(inv.tanggal) }}</span>
                      <span class="text-caption text-medium-emphasis">Total: {{ formatCurrency(inv.total_tagihan) }}</span>
                      <span class="text-caption font-weight-medium text-warning">Sisa: {{ formatCurrency(inv.sisa_tagihan) }}</span>
                    </div>
                    <div
                      v-if="inv.nama_resto"
                      class="d-flex flex-wrap gap-x-2 mt-0.5"
                    >
                      <span class="text-caption text-primary">{{ inv.nama_resto }}</span>
                    </div>
                  </div>
                </div>
              </VCardText>
            </VCard>
          </div>

          <div
            v-if="obCandidates.length > 0"
            class="d-flex align-center justify-space-between mt-2"
          >
            <span class="text-caption text-medium-emphasis">Menampilkan {{ obCandidates.length }} dari {{ obTotal }}</span>
            <VBtn
              v-if="obHasMore"
              size="small"
              variant="text"
              color="primary"
              :loading="obLoadingMore"
              @click="loadMore('ob')"
            >
              Muat lagi
            </VBtn>
          </div>

          <!-- ── OB: pilih invoice reguler periode sebelumnya yang ikut dilunaskan ── -->
          <div
            v-if="selectedIsOb"
            class="mt-3"
          >
            <VCard
              variant="outlined"
              color="deep-purple"
              class="pa-3"
            >
              <div class="d-flex align-center justify-space-between mb-1">
                <span class="text-body-2 font-weight-medium">Lunaskan Invoice Reguler Periode Sebelumnya</span>
                <VBtn
                  v-if="settleableInvoices.length"
                  size="x-small"
                  variant="text"
                  color="primary"
                  @click="toggleSelectAllSettle"
                >
                  {{ selectedSettleIds.length === settleableInvoices.length ? 'Hapus semua' : 'Pilih semua' }}
                </VBtn>
              </div>
              <div class="text-caption text-medium-emphasis mb-2">
                Invoice reguler yang tercantum di rincian OB ini akan otomatis LUNAS sesuai nominalnya.
              </div>

              <VProgressLinear
                v-if="settleableLoading"
                indeterminate
                color="primary"
                class="mb-2"
                rounded
              />
              <VAlert
                v-else-if="!settleableInvoices.length"
                type="info"
                variant="tonal"
                density="compact"
              >
                Tidak ada invoice reguler yang bisa dilunaskan otomatis untuk OB ini.
              </VAlert>
              <template v-else>
                <div style="max-height: 200px; overflow-y: auto;">
                  <VCheckbox
                    v-for="row in settleRows"
                    :key="row.id"
                    v-model="selectedSettleIds"
                    :value="row.id"
                    density="compact"
                    hide-details
                  >
                    <template #label>
                      <div class="d-flex flex-column">
                        <div class="d-flex align-center gap-2">
                          <span class="text-body-2">{{ row.no_invoice }}</span>
                          <VChip
                            v-if="row.selected && row.predictedStatus"
                            :color="statusSettleColor(row.predictedStatus)"
                            size="x-small"
                            variant="tonal"
                          >
                            {{ statusSettleLabel(row.predictedStatus) }}
                          </VChip>
                        </div>
                        <span class="text-caption text-medium-emphasis">
                          {{ formatDate(row.tanggal_invoice) }} · Sisa {{ formatCurrency(row.sisa_tagihan) }}
                          <template v-if="row.selected && row.predictedStatus === 'SEBAGIAN'">
                            · Estimasi terbayar {{ formatCurrency(row.predictedAmount) }}
                          </template>
                        </span>
                      </div>
                    </template>
                  </VCheckbox>
                </div>
                <div class="d-flex justify-space-between text-caption mt-2">
                  <span>Total dipilih:</span>
                  <strong :class="settleHasShortfall ? 'text-error' : 'text-success'">{{ formatCurrency(selectedSettleTotal) }}</strong>
                </div>
                <div class="d-flex justify-space-between text-caption text-medium-emphasis">
                  <span>Estimasi dana OB tersedia (setelah transaksi ini):</span>
                  <strong>{{ formatCurrency(settlePredictedAvailable) }}</strong>
                </div>
                <VAlert
                  v-if="settleHasShortfall"
                  type="warning"
                  variant="tonal"
                  density="compact"
                  class="mt-2"
                >
                  <div class="text-body-2 mb-2">
                    Estimasi dana tidak cukup untuk seluruh invoice terpilih:
                    {{ settleSummary.fullCount }} invoice akan LUNAS<template v-if="settleSummary.partialCount">
                      ,
                      1 invoice akan SEBAGIAN sebesar {{ formatCurrency(settleSummary.partialAmount) }}
                    </template><template v-if="settleSummary.unpaidCount">
                      ,
                      {{ settleSummary.unpaidCount }} invoice tidak akan terbayar
                    </template>.
                    Sisanya tetap pada status saat ini dan bisa dilunaskan pada pembayaran OB berikutnya.
                  </div>
                  <VCheckbox
                    v-model="settleShortfallAck"
                    density="compact"
                    hide-details
                    color="warning"
                  >
                    <template #label>
                      <span class="text-caption">Saya paham dana diperkirakan tidak mencukupi seluruh invoice terpilih dan tetap ingin melanjutkan pembayaran sebagian.</span>
                    </template>
                  </VCheckbox>
                </VAlert>
              </template>
            </VCard>
          </div>

          <VDivider class="my-4" />

          <!-- ── Section: Invoice Reguler ── -->
          <div class="d-flex align-center gap-2 mb-2">
            <VIcon
              size="18"
              color="primary"
            >
              ri-file-list-3-line
            </VIcon>
            <span class="text-body-2 font-weight-medium">Invoice Reguler</span>
          </div>
          <VTextField
            v-model="regularSearch"
            placeholder="Cari no invoice, nama klien, atau nama resto..."
            density="compact"
            variant="outlined"
            prepend-inner-icon="ri-search-line"
            clearable
            class="mb-3"
            hide-details
            @input="onRegularSearchInput"
            @click:clear="regularSearch = ''; fetchCandidates('regular')"
          />

          <VProgressLinear
            v-if="regularLoading"
            indeterminate
            color="primary"
            class="mb-2"
            rounded
          />
          <VAlert
            v-if="!regularLoading && regularCandidates.length === 0"
            type="info"
            variant="tonal"
            density="compact"
            class="mb-2"
          >
            Tidak ada invoice reguler yang terbuka. Coba ubah kata kunci pencarian.
          </VAlert>

          <div
            v-if="regularCandidates.length > 0"
            class="d-flex flex-column gap-2"
          >
            <VCard
              v-for="inv in regularCandidates"
              :key="inv.id"
              :variant="selectedInvoiceId === inv.id ? 'tonal' : 'outlined'"
              :color="selectedInvoiceId === inv.id ? 'primary' : undefined"
              class="cursor-pointer"
              @click="selectedInvoiceId = inv.id"
            >
              <VCardText class="pa-3">
                <div class="d-flex align-center gap-2">
                  <VIcon
                    :color="selectedInvoiceId === inv.id ? 'primary' : 'grey'"
                    size="18"
                  >
                    {{ selectedInvoiceId === inv.id ? 'ri-radio-button-fill' : 'ri-checkbox-blank-circle-line' }}
                  </VIcon>
                  <div class="flex-1-1 min-width-0">
                    <div class="d-flex align-center gap-2 flex-wrap mb-1">
                      <span class="text-body-2 font-weight-semibold">{{ inv.no_invoice }}</span>
                      <VChip
                        :color="statusInvoiceColor(inv.status)"
                        size="x-small"
                        variant="tonal"
                      >
                        {{ inv.status }}
                      </VChip>
                    </div>
                    <div class="d-flex flex-wrap gap-x-3 gap-y-0">
                      <span class="text-caption text-medium-emphasis">{{ inv.nama_klien ?? '-' }}</span>
                      <span class="text-caption text-medium-emphasis">Tgl: {{ formatDate(inv.tanggal) }}</span>
                      <span class="text-caption text-medium-emphasis">Total: {{ formatCurrency(inv.total_tagihan) }}</span>
                      <span class="text-caption font-weight-medium text-warning">Sisa: {{ formatCurrency(inv.sisa_tagihan) }}</span>
                    </div>
                    <div
                      v-if="inv.nama_resto"
                      class="d-flex flex-wrap gap-x-2 mt-0.5"
                    >
                      <span class="text-caption text-primary">{{ inv.nama_resto }}</span>
                    </div>
                  </div>
                </div>
              </VCardText>
            </VCard>
          </div>

          <div
            v-if="regularCandidates.length > 0"
            class="d-flex align-center justify-space-between mt-2"
          >
            <span class="text-caption text-medium-emphasis">Menampilkan {{ regularCandidates.length }} dari {{ regularTotal }}</span>
            <VBtn
              v-if="regularHasMore"
              size="small"
              variant="text"
              color="primary"
              :loading="regularLoadingMore"
              @click="loadMore('regular')"
            >
              Muat lagi
            </VBtn>
          </div>
        </template>

        <VAlert
          v-if="matchError"
          type="error"
          variant="tonal"
          class="mt-3"
          density="compact"
        >
          {{ matchError }}
        </VAlert>
      </VCardText>
      <VDivider />
      <VCardActions class="pa-4">
        <VSpacer />
        <AppActionButton
          action="batalkan"
          @click="onDialogUpdate(false)"
        />
        <AppActionButton
          action="lanjutkan"
          :disabled="canProceedDisabled"
          @click="proceedToBuktiStep"
        />
      </VCardActions>
    </VCard>
  </VDialog>

  <InvoiceArMultiPickerDialog
    v-model="multiPickerOpen"
    :invoice-list="multiCandidateList"
    :loading="multiCandidateLoading"
    :disabled-ids="multiAllocations.map(a => a.invoice_id)"
    @search="fetchMultiCandidates"
    @confirm="onMultiPickerConfirm"
  />

  <BuktiBayarDialog
    v-model:file="buktiBayar"
    :model-value="modelValue && showBuktiStep"
    :saving="matchSaving"
    :error-message="matchError"
    :file-error="buktiBayarError"
    @update:model-value="onDialogUpdate"
    @back="showBuktiStep = false"
    @confirm="doManualMatch"
  />
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useCrud } from '@/composables/useCrud'
import { useFormatter } from '@/composables/useFormatter'
import { useLazyFetchAll } from '@/composables/useLazyFetchAll'
import { useSettleWaterfall } from '@/composables/useSettleWaterfall'
import api from '@/utils/axios'
import BuktiBayarDialog from './BuktiBayarDialog.vue'
import InvoiceArMultiPickerDialog from './InvoiceArMultiPickerDialog.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  item: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'matched', 'connection-error'])

const { formatCurrency, formatDate } = useFormatter()

const statusInvoiceColor = s => ({ LUNAS: 'success', SEBAGIAN: 'warning', TERKIRIM: 'info', DRAFT: 'grey' }[s] ?? 'grey')

// Mode "Invoice" (default) vs "Catat PDM" (tanpa invoice, seluruh kredit bank jadi PDM)
const mode           = ref('invoice')
const pdmKlienId     = ref(null)
const pdmKeterangan  = ref('')

const modeOptions = [
  { value: 'invoice', label: 'Invoice', icon: 'ri-file-list-3-line' },
  { value: 'multi', label: 'Multi Payment', icon: 'ri-git-merge-line' },
  { value: 'pdm', label: 'Catat PDM', icon: 'ri-book-line' },
]

const { items: klienList, loading: klienLoading, fetchAll: fetchKlien } = useCrud('/finance/klien-ar')
const { ensureLoaded: ensureKlienLoaded } = useLazyFetchAll(fetchKlien)

const selectedInvoiceId  = ref(null)
const matchSaving        = ref(false)
const matchError         = ref(null)
const buktiBayar         = ref([])
const buktiBayarError    = ref(null)
const showBuktiStep      = ref(false)

const PER_PAGE = 50

// Section: Invoice Opening Balance
const obCandidates  = ref([])
const obSearch      = ref('')
const obLoading     = ref(false)
const obLoadingMore = ref(false)
const obPage        = ref(1)
const obLastPage    = ref(1)
const obTotal       = ref(0)
let   obTimer       = null

// Section: Invoice Reguler
const regularCandidates  = ref([])
const regularSearch      = ref('')
const regularLoading     = ref(false)
const regularLoadingMore = ref(false)
const regularPage        = ref(1)
const regularLastPage    = ref(1)
const regularTotal       = ref(0)
let   regularTimer       = null

const obHasMore      = computed(() => obPage.value < obLastPage.value)
const regularHasMore = computed(() => regularPage.value < regularLastPage.value)

// OB: pelunasan invoice reguler periode sebelumnya
const settleableLoading  = ref(false)
const settleableInvoices = ref([])
const selectedSettleIds  = ref([])
const settleAvailable    = ref(0)
const settleShortfallAck = ref(false)

const selectedIsOb = computed(() =>
  obCandidates.value.some(inv => inv.id === selectedInvoiceId.value),
)

// sisa_tagihan OB terpilih, sudah tersedia di kartu OB (lihat template baris 77)
const selectedObSisa = computed(() =>
  Number(obCandidates.value.find(inv => inv.id === selectedInvoiceId.value)?.sisa_tagihan ?? 0),
)

const {
  rows: settleRows,
  predictedAvailable: settlePredictedAvailable,
  selectedTotal: selectedSettleTotal,
  hasShortfall: settleHasShortfall,
  summary: settleSummary,
} = useSettleWaterfall(
  settleableInvoices,
  selectedSettleIds,
  settleAvailable,
  () => Number(props.item?.kredit || 0),
  selectedObSisa,
)

const canProceedSettle = computed(() =>
  !selectedIsOb.value || !settleHasShortfall.value || settleShortfallAck.value,
)

const statusSettleColor = s => ({ LUNAS: 'success', SEBAGIAN: 'warning', UNPAID: 'grey' }[s] ?? 'grey')
const statusSettleLabel = s => ({ LUNAS: 'Estimasi Lunas', SEBAGIAN: 'Estimasi Sebagian', UNPAID: 'Belum Terbayar' }[s] ?? '')

function toggleSelectAllSettle() {
  selectedSettleIds.value = selectedSettleIds.value.length === settleableInvoices.value.length
    ? []
    : settleableInvoices.value.map(inv => inv.id)
}

async function loadSettleableOriginals(obInvoiceId) {
  settleableInvoices.value = []
  selectedSettleIds.value  = []
  settleAvailable.value    = 0
  settleShortfallAck.value = false
  if (!obInvoiceId) return

  settleableLoading.value = true
  try {
    const { data } = await api.get(`/finance/invoices/${obInvoiceId}/settleable-originals`)

    settleableInvoices.value = data?.data?.invoices ?? []
    settleAvailable.value    = Number(data?.data?.available ?? 0)
    selectedSettleIds.value  = settleableInvoices.value.map(inv => inv.id)
  } catch {
    settleableInvoices.value = []
    selectedSettleIds.value  = []
    settleAvailable.value    = 0
  } finally {
    settleableLoading.value = false
  }
}

watch(selectedInvoiceId, id => {
  if (id && selectedIsOb.value) {
    loadSettleableOriginals(id)
  } else {
    settleableInvoices.value = []
    selectedSettleIds.value  = []
    settleAvailable.value    = 0
    settleShortfallAck.value = false
  }
})

// Reset konfirmasi shortfall bila seleksi atau nominal transaksi bank berubah,
// supaya konfirmasi lama tidak terbawa ke kondisi shortfall yang berbeda.
watch(selectedSettleIds, () => { settleShortfallAck.value = false }, { deep: true })
watch(() => props.item?.kredit, () => { settleShortfallAck.value = false })

async function fetchCandidates(type, { append = false } = {}) {
  const id = props.item?.id
  if (!id) return
  const isOb   = type === 'ob'
  const search = isOb ? obSearch.value : regularSearch.value
  const page   = append ? (isOb ? obPage.value : regularPage.value) + 1 : 1

  if (append) {
    if (isOb) obLoadingMore.value = true
    else regularLoadingMore.value = true
  } else {
    if (isOb) obLoading.value = true
    else regularLoading.value = true
  }

  try {
    const { data } = await api.get(`/finance/rekonsiliasi-bank/detail/${id}/invoice-candidates`, {
      params: { search: search || undefined, type, page, per_page: PER_PAGE },
    })

    const items    = data.data?.data ?? []
    const lastPage = data.data?.last_page ?? 1
    const total    = data.data?.total ?? items.length

    if (isOb) {
      obCandidates.value = append ? [...obCandidates.value, ...items] : items
      obPage.value       = page
      obLastPage.value   = lastPage
      obTotal.value      = total
    } else {
      regularCandidates.value = append ? [...regularCandidates.value, ...items] : items
      regularPage.value       = page
      regularLastPage.value   = lastPage
      regularTotal.value      = total
    }
  } catch (err) {
    // Jangan sembunyikan kegagalan sebagai "daftar kosong": kosongkan daftar
    // terkait lalu tampilkan pesan error agar bisa dibedakan dari hasil nihil.
    if (!append) {
      if (isOb) obCandidates.value = []
      else regularCandidates.value = []
    }
    matchError.value = err?.response?.data?.message
      ?? 'Gagal memuat daftar invoice. Periksa koneksi lalu coba lagi.'
  } finally {
    if (append) {
      if (isOb) obLoadingMore.value = false
      else regularLoadingMore.value = false
    } else {
      if (isOb) obLoading.value = false
      else regularLoading.value = false
    }
  }
}

function loadMore(type) {
  fetchCandidates(type, { append: true })
}

function onObSearchInput() {
  clearTimeout(obTimer)
  obTimer = setTimeout(() => fetchCandidates('ob'), 400)
}

function onRegularSearchInput() {
  clearTimeout(regularTimer)
  regularTimer = setTimeout(() => fetchCandidates('regular'), 400)
}

// ── Mode "Multi Payment" — banyak invoice (boleh lintas resto/investor,
// asal 1 entitas penagih sama) dari 1 transaksi bank ini, alokasi dilengkapi
// waterfall auto-fill saat invoice dipilih dari picker (pola sama seperti
// ApMatchDialog.vue di alur Payment Voucher AP).
const multiAllocations       = ref([]) // { invoice_id, no_invoice, nama_klien, nama_resto, sisa_tagihan, jumlah }
const multiPickerOpen        = ref(false)
const multiCandidateList     = ref([])
const multiCandidateLoading  = ref(false)
const multiSelectedIds       = ref([]) // invoice_id[] dicentang untuk bulk delete

const multiTotalAlokasi = computed(() =>
  multiAllocations.value.reduce((sum, row) => sum + (Number(row.jumlah) || 0), 0))

const multiAllSelected = computed(() =>
  multiAllocations.value.length > 0 && multiSelectedIds.value.length === multiAllocations.value.length)

const multiSomeSelected = computed(() => multiSelectedIds.value.length > 0)

const multiSisaBelumAlokasi = computed(() =>
  round2(Math.max(0, (Number(props.item?.kredit) || 0) - multiTotalAlokasi.value)))

const multiIsWithinKredit = computed(() =>
  multiTotalAlokasi.value <= (Number(props.item?.kredit) || 0) + 0.01)

const canProceedMulti = computed(() =>
  multiAllocations.value.length > 0
  && multiAllocations.value.every(row => Number(row.jumlah) > 0)
  && multiIsWithinKredit.value)

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100
}

async function fetchMultiCandidates(search = '') {
  const id = props.item?.id
  if (!id) return
  multiCandidateLoading.value = true
  try {
    const { data } = await api.get(`/finance/rekonsiliasi-bank/detail/${id}/invoice-candidates`, {
      // Multi Payment v1 sengaja dibatasi ke invoice reguler saja — OB punya
      // mekanisme "lunaskan invoice periode sebelumnya" sendiri (mode Invoice)
      // yang belum kompatibel dengan alokasi per-baris di sini.
      params: { search: search || undefined, type: 'regular', per_page: 50 },
    })

    multiCandidateList.value = data.data?.data ?? []
  } catch {
    multiCandidateList.value = []
  } finally {
    multiCandidateLoading.value = false
  }
}

function onMultiPickerConfirm(selectedRows) {
  const existingIds = new Set(multiAllocations.value.map(a => a.invoice_id))
  let pool = Math.max(0, round2((Number(props.item?.kredit) || 0) - multiTotalAlokasi.value))

  selectedRows.forEach(inv => {
    if (existingIds.has(inv.id)) return
    const sisa   = Number(inv.sisa_tagihan) || 0
    const jumlah = round2(Math.min(sisa, pool))

    pool = round2(Math.max(0, pool - jumlah))

    multiAllocations.value.push({
      invoice_id: inv.id,
      no_invoice: inv.no_invoice,
      nama_klien: inv.nama_klien,
      nama_resto: inv.nama_resto,
      sisa_tagihan: sisa,
      jumlah,
    })
  })
  matchError.value = ''
}

function clampMultiJumlah(row, val) {
  if (Number.isNaN(val)) val = 0
  if (val > row.sisa_tagihan) row.jumlah = row.sisa_tagihan
  else if (val < 0) row.jumlah = 0
  else row.jumlah = val
}

function removeMultiAllocation(idx) {
  const row = multiAllocations.value[idx]

  multiAllocations.value.splice(idx, 1)

  if (row) {
    const selIdx = multiSelectedIds.value.indexOf(row.invoice_id)
    if (selIdx !== -1) multiSelectedIds.value.splice(selIdx, 1)
  }
}

function toggleMultiSelect(invoiceId) {
  const idx = multiSelectedIds.value.indexOf(invoiceId)
  if (idx === -1) multiSelectedIds.value.push(invoiceId)
  else multiSelectedIds.value.splice(idx, 1)
}

function toggleMultiSelectAll(val) {
  multiSelectedIds.value = val ? multiAllocations.value.map(row => row.invoice_id) : []
}

function removeMultiAllocationsBulk() {
  const ids = multiSelectedIds.value

  multiAllocations.value = multiAllocations.value.filter(row => !ids.includes(row.invoice_id))
  multiSelectedIds.value = []
}

const canProceedDisabled = computed(() => {
  if (mode.value === 'multi') return !canProceedMulti.value
  if (mode.value === 'pdm') return !pdmKlienId.value

  return !selectedInvoiceId.value || obLoading.value || regularLoading.value || !canProceedSettle.value
})

function resetState() {
  mode.value               = 'invoice'
  pdmKlienId.value         = null
  pdmKeterangan.value      = ''

  selectedInvoiceId.value  = null
  obCandidates.value       = []
  obSearch.value           = ''
  obPage.value              = 1
  obLastPage.value          = 1
  obTotal.value             = 0

  regularCandidates.value  = []
  regularSearch.value      = ''
  regularPage.value        = 1
  regularLastPage.value    = 1
  regularTotal.value       = 0
  matchError.value         = null
  buktiBayar.value         = []
  buktiBayarError.value    = null
  showBuktiStep.value      = false
  settleableInvoices.value = []
  selectedSettleIds.value  = []
  settleAvailable.value    = 0
  settleShortfallAck.value = false
  clearTimeout(obTimer)
  clearTimeout(regularTimer)

  multiAllocations.value      = []
  multiSelectedIds.value      = []
  multiPickerOpen.value       = false
  multiCandidateList.value    = []
}

watch(() => props.modelValue, open => {
  if (!open) {
    resetState()
    
    return
  }
  resetState()
  fetchCandidates('ob')
  fetchCandidates('regular')
  fetchMultiCandidates()
}, { immediate: true })

function onDialogUpdate(value) {
  emit('update:modelValue', value)
}

function proceedToBuktiStep() {
  if (!props.item) return
  if (mode.value === 'multi') {
    if (!canProceedMulti.value) return
  } else if (mode.value === 'invoice') {
    if (!selectedInvoiceId.value || !canProceedSettle.value) return
  } else if (!pdmKlienId.value) {
    return
  }
  matchError.value = null
  showBuktiStep.value = true
}

// Koneksi terputus/timeout: server mungkin sudah menyimpan. Minta parent memuat
// ulang data otoritatif agar tidak salah lapor "gagal". Selain itu, tampilkan
// error field bukti_pembayaran (jika ada) dan pesan error umum.
function handleMatchError(err) {
  if (!err?.response || err?.code === 'ECONNABORTED') {
    emit('update:modelValue', false)
    emit('connection-error', 'Koneksi terputus saat menyimpan. Data telah dimuat ulang — silakan periksa status transaksi.')
    
    return
  }
  const fieldErrors = err?.response?.data?.errors
  if (fieldErrors?.bukti_pembayaran) {
    buktiBayarError.value = fieldErrors.bukti_pembayaran[0]
  }
  matchError.value = fieldErrors
    ? Object.values(fieldErrors).flat()[0]
    : (err?.response?.data?.message ?? 'Terjadi kesalahan, coba lagi.')
}

async function doManualMatch() {
  if (mode.value === 'multi') return doManualMatchMulti()

  return mode.value === 'invoice' ? doManualMatchInvoice() : doManualMatchPdm()
}

async function doManualMatchMulti() {
  if (!canProceedMulti.value || !props.item) return
  matchSaving.value    = true
  matchError.value     = null
  buktiBayarError.value = null
  try {
    const payload = new FormData()

    multiAllocations.value.forEach((row, idx) => {
      payload.append(`alokasi[${idx}][invoice_id]`, row.invoice_id)
      payload.append(`alokasi[${idx}][jumlah]`, row.jumlah)
    })

    const file = Array.isArray(buktiBayar.value) ? buktiBayar.value[0] : buktiBayar.value
    if (file instanceof File) payload.append('bukti_pembayaran', file)

    const { data } = await api.post(
      `/finance/rekonsiliasi-bank/detail/${props.item.id}/catat-bayar-multi`,
      payload,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )

    emit('matched', { itemId: props.item.id, updated: data.data })
    emit('update:modelValue', false)
  } catch (err) {
    handleMatchError(err)
  } finally {
    matchSaving.value = false
  }
}

async function doManualMatchInvoice() {
  if (!selectedInvoiceId.value || !props.item || !canProceedSettle.value) return
  matchSaving.value    = true
  matchError.value     = null
  buktiBayarError.value = null
  try {
    const payload = new FormData()

    payload.append('invoice_id', selectedInvoiceId.value)
    if (selectedIsOb.value) {
      selectedSettleIds.value.forEach(id => payload.append('settle_original_invoice_ids[]', id))
    }
    const file = Array.isArray(buktiBayar.value) ? buktiBayar.value[0] : buktiBayar.value
    if (file instanceof File) payload.append('bukti_pembayaran', file)

    const { data } = await api.post(
      `/finance/rekonsiliasi-bank/detail/${props.item.id}/catat-bayar`,
      payload,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )

    emit('matched', { itemId: props.item.id, updated: data.data })
    emit('update:modelValue', false)
  } catch (err) {
    handleMatchError(err)
  } finally {
    matchSaving.value = false
  }
}

async function doManualMatchPdm() {
  if (!pdmKlienId.value || !props.item) return
  matchSaving.value    = true
  matchError.value     = null
  buktiBayarError.value = null
  try {
    const payload = new FormData()

    payload.append('klien_ar_id', pdmKlienId.value)
    if (pdmKeterangan.value) payload.append('keterangan', pdmKeterangan.value)
    const file = Array.isArray(buktiBayar.value) ? buktiBayar.value[0] : buktiBayar.value
    if (file instanceof File) payload.append('bukti_pembayaran', file)

    const { data } = await api.post(
      `/finance/rekonsiliasi-bank/detail/${props.item.id}/catat-pdm`,
      payload,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )

    emit('matched', { itemId: props.item.id, updated: data.data })
    emit('update:modelValue', false)
  } catch (err) {
    handleMatchError(err)
  } finally {
    matchSaving.value = false
  }
}
</script>

<style scoped>
.mode-toggle-btn {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.mode-toggle-btn:hover {
  transform: translateY(-1px);
}
</style>
