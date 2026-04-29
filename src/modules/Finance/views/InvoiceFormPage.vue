<template>
  <div>
    <PageHeader
      :title="isEditing ? 'Edit Invoice AR' : 'Buat Invoice AR'"
      :subtitle="isEditing ? 'Ubah data invoice (hanya status Draft)' : 'Buat invoice tagihan baru'"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Invoice', to: { name: 'finance-invoice-index' } },
        { title: isEditing ? 'Edit Invoice' : 'Buat Invoice', disabled: true }
      ]"
    >
      <VBtn
        variant="tonal"
        color="secondary"
        :to="{ name: 'finance-invoice-index' }"
      >
        <VIcon
          icon="ri-arrow-left-line"
          class="me-1"
        />
        Kembali
      </VBtn>
    </PageHeader>

    <div
      v-if="loadingData"
      class="text-center py-16"
    >
      <VProgressCircular
        indeterminate
        color="primary"
        size="48"
      />
      <div class="text-body-2 text-medium-emphasis mt-3">
        Memuat data invoice...
      </div>
    </div>

    <VAlert
      v-else-if="isEditing && !invoice"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      Invoice tidak ditemukan atau tidak dapat diedit.
    </VAlert>

    <VForm
      v-else
      ref="formRef"
      @submit.prevent
    >
      <VAlert
        v-if="errorMessage"
        type="error"
        variant="tonal"
        closable
        class="mb-4"
      >
        {{ errorMessage }}
      </VAlert>

      <VRow>
        <!-- ─── Kolom Utama ─── -->
        <VCol
          cols="12"
          lg="8"
        >
          <!-- Section 1: Informasi Invoice -->
          <VCard class="mb-4 section-card">
            <div class="section-header">
              <div class="section-icon bg-primary">
                <VIcon
                  icon="ri-file-list-3-line"
                  size="16"
                  color="white"
                />
              </div>
              <span class="text-subtitle-1 font-weight-semibold">Informasi Invoice</span>
            </div>
            <VDivider />
            <VCardText class="pt-4">
              <VRow>
                <VCol
                  cols="12"
                  md="6"
                >
                  <VTextField
                    v-model="form.no_invoice"
                    label="No. Invoice"
                    density="compact"
                    variant="outlined"
                    readonly
                    :hint="isEditing ? '' : 'Otomatis terisi setelah klien dipilih'"
                    :persistent-hint="!isEditing"
                    :loading="!isEditing && noInvoiceLoading"
                    prepend-inner-icon="ri-hashtag"
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="6"
                >
                  <VTextField
                    v-model="form.tanggal_invoice"
                    label="Tanggal Invoice"
                    density="compact"
                    variant="outlined"
                    type="date"
                    prepend-inner-icon="ri-calendar-line"
                    :rules="[v => !!v || 'Tanggal wajib diisi']"
                    @update:model-value="onTanggalChange"
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="6"
                >
                  <VTextField
                    v-model="form.tanggal_jatuh_tempo"
                    label="Tanggal Jatuh Tempo"
                    density="compact"
                    variant="outlined"
                    type="date"
                    prepend-inner-icon="ri-calendar-check-line"
                    hint="Opsional"
                    persistent-hint
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="6"
                >
                  <VTextField
                    v-model="form.no_surat_jalan"
                    label="No. Surat Jalan"
                    density="compact"
                    variant="outlined"
                    prepend-inner-icon="ri-truck-line"
                  />
                </VCol>
              </VRow>
            </VCardText>
          </VCard>

          <!-- Section 2: Klien & Periode -->
          <VCard class="mb-4 section-card">
            <div class="section-header">
              <div class="section-icon bg-success">
                <VIcon
                  icon="ri-building-4-line"
                  size="16"
                  color="white"
                />
              </div>
              <span class="text-subtitle-1 font-weight-semibold">Klien & Periode</span>
            </div>
            <VDivider />
            <VCardText class="pt-4">
              <VRow>
                <VCol
                  cols="12"
                  md="6"
                >
                  <VAutocomplete
                    v-model="form.klien_ar_id"
                    label="Klien AR"
                    density="compact"
                    variant="outlined"
                    :items="klienList"
                    item-title="nama_klien"
                    item-value="id"
                    prepend-inner-icon="ri-user-3-line"
                    :rules="[v => !!v || 'Klien wajib dipilih']"
                    :loading="klienLoading"
                    clearable
                    @focus="ensureKlienLoaded()"
                    @update:model-value="onKlienChange"
                  >
                    <template #item="{ props: p, item }">
                      <VListItem
                        v-bind="p"
                        :title="item.raw.nama_klien"
                        :subtitle="`${item.raw.kode_klien} · ${item.raw.tipe_klien}`"
                      />
                    </template>
                  </VAutocomplete>
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <VTextField
                    :model-value="perusahaanPenagih"
                    label="Perusahaan Penagih"
                    density="compact"
                    variant="outlined"
                    prepend-inner-icon="ri-bank-line"
                    readonly
                  />
                </VCol>

                <VCol cols="12">
                  <div class="text-caption text-medium-emphasis mb-2 d-flex align-center gap-1">
                    <VIcon
                      icon="ri-calendar-2-line"
                      size="13"
                    />
                    Rentang Periode Tagihan
                  </div>
                  <VRow>
                    <VCol
                      cols="12"
                      md="6"
                    >
                      <VTextField
                        v-model="form.periode_awal"
                        label="Periode Awal"
                        density="compact"
                        variant="outlined"
                        type="date"
                        prepend-inner-icon="ri-calendar-event-line"
                        :rules="[v => !!v || 'Periode awal wajib diisi']"
                      />
                    </VCol>
                    <VCol
                      cols="12"
                      md="6"
                    >
                      <VTextField
                        v-model="form.periode_akhir"
                        label="Periode Akhir"
                        density="compact"
                        variant="outlined"
                        type="date"
                        prepend-inner-icon="ri-calendar-event-fill"
                        :rules="[v => !!v || 'Periode akhir wajib diisi']"
                      />
                    </VCol>
                  </VRow>
                </VCol>
              </VRow>
            </VCardText>
          </VCard>

          <!-- Section 3: Item Tagihan -->
          <VCard class="mb-4 section-card">
            <div class="section-header">
              <div class="d-flex align-center gap-3">
                <div class="section-icon bg-warning">
                  <VIcon
                    icon="ri-list-check-2"
                    size="16"
                    color="white"
                  />
                </div>
                <span class="text-subtitle-1 font-weight-semibold">Item Tagihan</span>
                <VChip
                  v-if="form.items.length > 0"
                  size="x-small"
                  color="warning"
                  variant="tonal"
                  class="font-weight-medium"
                >
                  {{ form.items.length }} item
                </VChip>
              </div>
              <VBtn
                color="primary"
                size="small"
                prepend-icon="ri-add-line"
                variant="tonal"
                @click="addItem"
              >
                Tambah Baris
              </VBtn>
            </div>
            <VDivider />

            <VCardText>
              <div
                v-if="form.items.length === 0"
                class="text-center text-medium-emphasis py-10"
              >
                <VIcon
                  icon="ri-inbox-line"
                  size="44"
                  class="mb-3 d-block opacity-40"
                />
                <div class="text-body-2">
                  Belum ada item.
                </div>
                <div class="text-caption mt-1">
                  Klik "Tambah Baris" untuk mulai menambahkan tagihan.
                </div>
              </div>

              <InvoiceItemRow
                v-for="(itm, idx) in form.items"
                :key="idx"
                :item="itm"
                :barang-list="barangList"
                :barang-loading="barangLoading"
                @update:item="updateItem(idx, $event)"
                @remove="removeItem(idx)"
              />

              <VAlert
                v-if="itemsError"
                type="error"
                variant="tonal"
                density="compact"
                class="mt-1"
              >
                {{ itemsError }}
              </VAlert>
            </VCardText>
          </VCard>

          <!-- Section 4: Keterangan -->
          <VCard class="mb-4">
            <div class="section-header">
              <div class="section-icon bg-secondary">
                <VIcon
                  icon="ri-sticky-note-line"
                  size="16"
                  color="white"
                />
              </div>
              <span class="text-subtitle-1 font-weight-semibold">Keterangan</span>
              <VChip
                size="x-small"
                color="secondary"
                variant="tonal"
              >
                Opsional
              </VChip>
            </div>
            <VDivider />
            <VCardText class="pt-4">
              <VTextField
                v-model="form.keterangan"
                label="Keterangan tambahan"
                density="compact"
                variant="outlined"
                prepend-inner-icon="ri-chat-1-line"
              />
            </VCardText>
          </VCard>
        </VCol>

        <!-- ─── Sidebar Ringkasan ─── -->
        <VCol
          cols="12"
          lg="4"
        >
          <div class="sticky-sidebar">
            <!-- Carryover Banner -->
            <VCard
              class="mb-4"
              color="info"
              variant="tonal"
            >
              <VCardText class="pa-4">
                <div class="d-flex align-center gap-2 mb-3">
                  <VIcon
                    icon="ri-history-line"
                    size="18"
                  />
                  <span class="text-body-2 font-weight-semibold">Tagihan Periode Sebelumnya</span>
                </div>
                <div class="text-h5 font-weight-bold mb-1">
                  {{ formatCurrency(form.tagihan_periode_sebelumnya) }}
                </div>
                <div
                  v-if="!isEditing"
                  class="text-caption"
                >
                  Otomatis dari sisa tagihan klien yang belum lunas
                </div>
                <VProgressLinear
                  v-if="!isEditing && carryoverLoading"
                  indeterminate
                  color="info"
                  class="mt-2 rounded"
                />
              </VCardText>
            </VCard>

            <!-- Ringkasan Total -->
            <VCard class="mb-4">
              <div class="section-header">
                <div class="section-icon bg-primary">
                  <VIcon
                    icon="ri-calculator-line"
                    size="16"
                    color="white"
                  />
                </div>
                <span class="text-subtitle-1 font-weight-semibold">Ringkasan Tagihan</span>
              </div>
              <VDivider />
              <VCardText class="pt-4">
                <table class="summary-table w-100">
                  <tr>
                    <td class="text-body-2 text-medium-emphasis pb-2">
                      Subtotal Item
                    </td>
                    <td class="text-body-2 text-right font-weight-medium pb-2">
                      {{ formatCurrency(subtotal) }}
                    </td>
                  </tr>
                  <tr>
                    <td class="text-body-2 text-medium-emphasis pb-2">
                      Tagihan Sebelumnya
                    </td>
                    <td class="text-body-2 text-right font-weight-medium pb-2">
                      {{ formatCurrency(form.tagihan_periode_sebelumnya) }}
                    </td>
                  </tr>
                </table>

                <VDivider class="my-3" />

                <div class="d-flex justify-space-between align-center mb-2">
                  <span class="text-subtitle-1 font-weight-bold">Total Tagihan</span>
                  <span class="text-h6 font-weight-bold text-primary">
                    {{ formatCurrency(totalTagihan) }}
                  </span>
                </div>

                <VCard
                  variant="tonal"
                  color="primary"
                  class="pa-3 rounded-lg"
                >
                  <div class="text-caption text-medium-emphasis">
                    Terbilang:
                  </div>
                  <div class="text-caption font-weight-medium mt-1">
                    <em>{{ terbilang(totalTagihan) }}</em>
                  </div>
                </VCard>
              </VCardText>
            </VCard>

            <!-- Action Buttons -->
            <VCard>
              <VCardText class="pa-4">
                <template v-if="!isEditing">
                  <VBtn
                    block
                    color="primary"
                    class="mb-3"
                    size="large"
                    prepend-icon="ri-send-plane-line"
                    :disabled="saving"
                    :loading="saving"
                    @click="submitAs('TERKIRIM')"
                  >
                    Simpan & Kirim
                  </VBtn>
                  <VBtn
                    block
                    variant="tonal"
                    color="secondary"
                    prepend-icon="ri-draft-line"
                    :disabled="saving"
                    @click="submitAs('DRAFT')"
                  >
                    Simpan sebagai Draft
                  </VBtn>
                </template>
                <VBtn
                  v-else
                  block
                  color="primary"
                  size="large"
                  prepend-icon="ri-save-line"
                  :disabled="saving"
                  :loading="saving"
                  @click="submitAs()"
                >
                  Simpan Perubahan
                </VBtn>
              </VCardText>
            </VCard>
          </div>
        </VCol>
      </VRow>
    </VForm>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCrud } from '@/composables/useCrud'
import { useLazyFetchAll } from '@/composables/useLazyFetchAll'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { useFormatter } from '@/composables/useFormatter'
import { setFlashAlert } from '@/utils/flashAlert'
import api from '@/utils/axios'
import InvoiceItemRow from '../components/InvoiceItemRow.vue'

const router = useRouter()
const route  = useRoute()
const { showError } = useSweetAlert()

const id        = route.params.id
const isEditing = computed(() => !!id)

const { create, fetchOne, update, saving } = useCrud('/finance/invoices')
const { items: klienList, loading: klienLoading, fetchAll: fetchKlien } = useCrud('/finance/klien-ar')
const { items: barangList, loading: barangLoading, fetchAll: fetchBarang } = useCrud('/master/barang')
const { ensureLoaded: ensureKlienLoaded } = useLazyFetchAll(fetchKlien)
const { ensureLoaded: ensureBarangLoaded } = useLazyFetchAll(fetchBarang)
const { formatCurrency } = useFormatter()

const formRef          = ref(null)
const errorMessage     = ref('')
const itemsError       = ref('')
const loadingData      = ref(!!id)
const invoice          = ref(null)
const noInvoiceLoading = ref(false)
const carryoverLoading = ref(false)
const selectedKlien    = ref(null)

const form = reactive({
  no_invoice: '',
  tanggal_invoice: new Date().toISOString().slice(0, 10),
  tanggal_jatuh_tempo: '',
  periode_awal: '',
  periode_akhir: '',
  klien_ar_id: null,
  no_surat_jalan: '',
  tagihan_periode_sebelumnya: 0,
  keterangan: '',
  items: [],
})

const perusahaanPenagih = computed(() => {
  if (isEditing.value) return invoice.value?.perusahaan?.nama_perusahaan ?? ''

  return selectedKlien.value?.perusahaan?.nama_perusahaan ?? ''
})

const subtotal = computed(() =>
  form.items.reduce((sum, it) => sum + (it.subtotal ?? 0), 0),
)

const totalTagihan = computed(() =>
  subtotal.value + (form.tagihan_periode_sebelumnya ?? 0),
)

function onTanggalChange() {
  if (!isEditing.value) refreshNoInvoice()
}

async function onKlienChange(klienId) {
  if (isEditing.value) return

  selectedKlien.value = klienList.value.find(k => k.id === klienId) ?? null
  form.no_invoice = ''
  form.tagihan_periode_sebelumnya = 0

  if (!klienId) return

  await Promise.all([refreshNoInvoice(), loadCarryover(klienId)])
}

async function refreshNoInvoice() {
  if (!form.klien_ar_id || !form.tanggal_invoice) return
  noInvoiceLoading.value = true
  try {
    const { data } = await api.get('/finance/invoices/preview-no', {
      params: { klien_ar_id: form.klien_ar_id, tanggal: form.tanggal_invoice },
    })

    form.no_invoice = data.data?.no_invoice ?? ''
  } catch {
    form.no_invoice = ''
  } finally {
    noInvoiceLoading.value = false
  }
}

async function loadCarryover(klienId) {
  carryoverLoading.value = true
  try {
    const { data } = await api.get('/finance/invoices/carryover', {
      params: { klien_ar_id: klienId },
    })

    form.tagihan_periode_sebelumnya = data.data?.carryover ?? 0
  } catch {
    form.tagihan_periode_sebelumnya = 0
  } finally {
    carryoverLoading.value = false
  }
}

function addItem() {
  void ensureBarangLoaded()

  form.items.push({
    barang_id: null,
    nama_barang: '',
    qty: 1,
    satuan: 'pcs',
    harga_satuan: 0,
    subtotal: 0,
    keterangan: '',
  })
  itemsError.value = ''
}

function updateItem(idx, val) { form.items[idx] = val }
function removeItem(idx)      { form.items.splice(idx, 1) }

async function submitAs(status = null) {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  if (form.items.length === 0) {
    itemsError.value = 'Minimal 1 item tagihan wajib diisi.'

    return
  }
  itemsError.value   = ''
  errorMessage.value = ''

  const payload = { ...form }
  if (status) payload.status = status

  const res = isEditing.value
    ? await update(id, payload)
    : await create(payload)

  if (res.success) {
    setFlashAlert({
      icon: 'success',
      title: 'Berhasil',
      text: isEditing.value ? 'Perubahan invoice berhasil disimpan.' : 'Invoice berhasil dibuat.',
    })
    router.push({ name: 'finance-invoice-show', params: { id: id ?? res.data.id } })
  } else {
    errorMessage.value = res.message ?? 'Terjadi kesalahan'
    await showError(errorMessage.value)
  }
}

onMounted(async () => {
  if (!isEditing.value) return

  const [, , data] = await Promise.all([
    ensureKlienLoaded(),
    ensureBarangLoaded(),
    fetchOne(id),
  ])

  loadingData.value = false
  if (!data || data.status !== 'DRAFT') return

  invoice.value = data
  Object.assign(form, {
    no_invoice:                  data.no_invoice,
    tanggal_invoice:             data.tanggal_invoice,
    tanggal_jatuh_tempo:         data.tanggal_jatuh_tempo ?? '',
    periode_awal:                data.periode_awal,
    periode_akhir:               data.periode_akhir,
    klien_ar_id:                 data.klien_ar_id,
    no_surat_jalan:              data.no_surat_jalan ?? '',
    tagihan_periode_sebelumnya:  data.tagihan_periode_sebelumnya ?? 0,
    keterangan:                  data.keterangan ?? '',
    items: (data.items ?? []).map(it => ({
      id:           it.id,
      barang_id:    it.barang_id,
      nama_barang:  it.nama_barang,
      qty:          it.qty,
      satuan:       it.satuan,
      harga_satuan: it.harga_satuan,
      subtotal:     it.subtotal,
      keterangan:   it.keterangan ?? '',
    })),
  })
})

function terbilang(angka) {
  if (!angka || angka === 0) return 'nol rupiah'

  const satuan = ['',
    'satu', 'dua', 'tiga', 'empat', 'lima',
    'enam', 'tujuh', 'delapan', 'sembilan',
    'sepuluh', 'sebelas', 'dua belas', 'tiga belas', 'empat belas',
    'lima belas', 'enam belas', 'tujuh belas', 'delapan belas', 'sembilan belas']

  function ratusan(n) {
    if (n < 20) return satuan[n]
    const pStr = ['', '', 'dua puluh', 'tiga puluh', 'empat puluh',
      'lima puluh', 'enam puluh', 'tujuh puluh', 'delapan puluh', 'sembilan puluh']
    const sisa = n % 10

    return (pStr[Math.floor(n / 10)] + (sisa ? ' ' + satuan[sisa] : '')).trim()
  }

  function ribuan(n) {
    if (n < 100) return ratusan(n)
    const ratus = Math.floor(n / 100)
    const sisa  = n % 100
    const r     = ratus === 1 ? 'seratus' : satuan[ratus] + ' ratus'

    return (r + (sisa ? ' ' + ratusan(sisa) : '')).trim()
  }

  function convert(n) {
    if (n === 0) return ''
    if (n < 1000) return ribuan(n)
    if (n < 1000000) {
      const rb   = Math.floor(n / 1000)
      const sisa = n % 1000
      const r    = rb === 1 ? 'seribu' : ribuan(rb) + ' ribu'

      return (r + (sisa ? ' ' + ribuan(sisa) : '')).trim()
    }
    if (n < 1000000000) {
      const jt   = Math.floor(n / 1000000)
      const sisa = n % 1000000

      return (ribuan(jt) + ' juta' + (sisa ? ' ' + convert(sisa) : '')).trim()
    }
    const ml   = Math.floor(n / 1000000000)
    const sisa = n % 1000000000

    return (ribuan(ml) + ' miliar' + (sisa ? ' ' + convert(sisa) : '')).trim()
  }

  return convert(Math.floor(angka)) + ' rupiah'
}
</script>

<style scoped>
.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
}

.section-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.section-card {
  border-inline-start: 3px solid rgb(var(--v-theme-primary));
}

.sticky-sidebar {
  position: sticky;
  top: 80px;
}


.summary-table {
  border-collapse: collapse;
  width: 100%;
}

.summary-table td {
  padding: 3px 0;
}
</style>
