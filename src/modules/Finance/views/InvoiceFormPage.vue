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
      class="text-center py-12"
    >
      <VProgressCircular
        indeterminate
        color="primary"
      />
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
      <!-- Section 1: Info Invoice -->
      <VCard class="mb-4">
        <VCardTitle class="pa-4 pb-2">
          <VIcon
            icon="ri-file-list-3-line"
            class="me-2"
          />
          Informasi Invoice
        </VCardTitle>
        <VDivider />
        <VCardText>
          <VRow>
            <VCol
              cols="12"
              md="4"
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
              />
            </VCol>
            <VCol
              cols="12"
              md="4"
            >
              <VTextField
                v-model="form.tanggal_invoice"
                label="Tanggal Invoice"
                density="compact"
                variant="outlined"
                type="date"
                :rules="[v => !!v || 'Tanggal wajib diisi']"
                @update:model-value="onTanggalChange"
              />
            </VCol>
            <VCol
              cols="12"
              md="4"
            >
              <VTextField
                v-model="form.tanggal_jatuh_tempo"
                label="Tanggal Jatuh Tempo"
                density="compact"
                variant="outlined"
                type="date"
                hint="Opsional"
                persistent-hint
              />
            </VCol>
            <VCol
              cols="12"
              md="4"
            >
              <VTextField
                v-model="form.no_surat_jalan"
                label="No. Surat Jalan"
                density="compact"
                variant="outlined"
              />
            </VCol>
          </VRow>
        </VCardText>
      </VCard>

      <!-- Section 2: Klien & Periode -->
      <VCard class="mb-4">
        <VCardTitle class="pa-4 pb-2">
          <VIcon
            icon="ri-building-4-line"
            class="me-2"
          />
          Klien & Periode
        </VCardTitle>
        <VDivider />
        <VCardText>
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
                readonly
              />
            </VCol>

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
                :rules="[v => !!v || 'Periode akhir wajib diisi']"
              />
            </VCol>
          </VRow>
        </VCardText>
      </VCard>

      <!-- Section 3: Carryover -->
      <VCard class="mb-4">
        <VCardTitle class="pa-4 pb-2">
          <VIcon
            icon="ri-history-line"
            class="me-2"
          />
          Tagihan Periode Sebelumnya
        </VCardTitle>
        <VDivider />
        <VCardText>
          <VRow align="center">
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                :model-value="formatCurrency(form.tagihan_periode_sebelumnya)"
                :label="isEditing ? 'Carryover (Readonly)' : 'Carryover (Sisa Tagihan Sebelumnya)'"
                density="compact"
                variant="outlined"
                readonly
                :loading="!isEditing && carryoverLoading"
                :prepend-inner-icon="isEditing ? undefined : 'ri-information-line'"
              />
            </VCol>
            <VCol
              v-if="!isEditing"
              cols="12"
              md="6"
            >
              <span class="text-body-2 text-medium-emphasis">
                Nilai ini otomatis diambil dari sisa tagihan klien yang belum lunas.
              </span>
            </VCol>
          </VRow>
        </VCardText>
      </VCard>

      <!-- Section 4: Item Invoice -->
      <VCard class="mb-4">
        <VCardTitle class="pa-4 pb-2 d-flex align-center justify-space-between">
          <span><VIcon
            icon="ri-list-check-2"
            class="me-2"
          />Item Tagihan</span>
          <VBtn
            color="primary"
            size="small"
            prepend-icon="ri-add-line"
            variant="tonal"
            @click="addItem"
          >
            Tambah Baris
          </VBtn>
        </VCardTitle>
        <VDivider />
        <VCardText>
          <div
            v-if="form.items.length === 0"
            class="text-center text-medium-emphasis py-8"
          >
            Belum ada item. Klik "Tambah Baris" untuk mulai.
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
            class="mt-2"
          >
            {{ itemsError }}
          </VAlert>
        </VCardText>
      </VCard>

      <!-- Section 5: Ringkasan -->
      <VCard class="mb-4">
        <VCardTitle class="pa-4 pb-2">
          <VIcon
            icon="ri-calculator-line"
            class="me-2"
          />
          Ringkasan Tagihan
        </VCardTitle>
        <VDivider />
        <VCardText>
          <VRow justify="end">
            <VCol
              cols="12"
              md="5"
            >
              <table class="summary-table w-100">
                <tr>
                  <td class="text-medium-emphasis">
                    Subtotal
                  </td>
                  <td class="text-right font-weight-medium">
                    {{ formatCurrency(subtotal) }}
                  </td>
                </tr>
                <tr>
                  <td class="text-medium-emphasis">
                    Tagihan Periode Sebelumnya
                  </td>
                  <td class="text-right font-weight-medium">
                    {{ formatCurrency(form.tagihan_periode_sebelumnya) }}
                  </td>
                </tr>
                <tr class="text-h6 font-weight-bold">
                  <td>Total Tagihan</td>
                  <td class="text-right text-primary">
                    {{ formatCurrency(totalTagihan) }}
                  </td>
                </tr>
                <tr>
                  <td
                    colspan="2"
                    class="text-caption text-medium-emphasis pt-2"
                  >
                    Terbilang: <em>{{ terbilang(totalTagihan) }}</em>
                  </td>
                </tr>
              </table>
            </VCol>
          </VRow>
        </VCardText>
      </VCard>

      <!-- Section 6: Keterangan -->
      <VCard class="mb-4">
        <VCardText>
          <VTextField
            v-model="form.keterangan"
            label="Keterangan"
            density="compact"
            variant="outlined"
          />
        </VCardText>
      </VCard>

      <!-- Error global -->
      <VAlert
        v-if="errorMessage"
        type="error"
        variant="tonal"
        class="mb-4"
      >
        {{ errorMessage }}
      </VAlert>

      <!-- Action Buttons -->
      <div class="d-flex gap-3 justify-end">
        <template v-if="!isEditing">
          <VBtn
            variant="tonal"
            color="secondary"
            :disabled="saving"
            @click="submitAs('DRAFT')"
          >
            Simpan sebagai Draft
          </VBtn>
          <VBtn
            color="primary"
            :disabled="saving"
            @click="submitAs('TERKIRIM')"
          >
            Simpan & Kirim
          </VBtn>
        </template>
        <VBtn
          v-else
          variant="tonal"
          color="secondary"
          :disabled="saving"
          @click="submitAs()"
        >
          Simpan Perubahan
        </VBtn>
      </div>
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
.summary-table td {
  padding: 4px 8px;
}
</style>
