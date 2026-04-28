<template>
  <div>
    <PageHeader 
      title="Edit Invoice AR" 
      subtitle="Ubah data invoice (hanya status Draft)"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Invoice', to: { name: 'finance-invoice-index' } },
        { title: 'Edit Invoice', disabled: true }
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
      v-else-if="!invoice"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      Invoice tidak ditemukan atau tidak dapat diedit.
    </VAlert>

    <template v-else>
      <VForm
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
                  :model-value="invoice.perusahaan?.nama_perusahaan"
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

        <!-- Section 3: Carryover (readonly on edit) -->
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
            <VRow>
              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  :model-value="formatCurrency(form.tagihan_periode_sebelumnya)"
                  label="Carryover (Readonly)"
                  density="compact"
                  variant="outlined"
                  readonly
                />
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
              Belum ada item.
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

        <VAlert
          v-if="errorMessage"
          type="error"
          variant="tonal"
          class="mb-4"
        >
          {{ errorMessage }}
        </VAlert>

        <div class="d-flex gap-3 justify-end">
          <VBtn
            variant="tonal"
            color="secondary"
            :disabled="saving"
            @click="submitForm"
          >
            Simpan Perubahan
          </VBtn>
        </div>
      </VForm>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCrud } from '@/composables/useCrud'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { useFormatter } from '@/composables/useFormatter'
import { setFlashAlert } from '@/utils/flashAlert'
import InvoiceItemRow from '../components/InvoiceItemRow.vue'

const router = useRouter()
const route  = useRoute()
const { showError } = useSweetAlert()
const id     = route.params.id

const { fetchOne, update, saving } = useCrud('/finance/invoices')
const { items: klienList, loading: klienLoading, fetchAll: fetchKlien } = useCrud('/finance/klien-ar')
const { items: barangList, loading: barangLoading, fetchAll: fetchBarang } = useCrud('/master/barang')
const { formatCurrency } = useFormatter()

const formRef      = ref(null)
const errorMessage = ref('')
const itemsError   = ref('')
const loadingData  = ref(true)
const invoice      = ref(null)

const form = reactive({
  no_invoice: '',
  tanggal_invoice: '',
  periode_awal: '',
  periode_akhir: '',
  klien_ar_id: null,
  no_surat_jalan: '',
  tagihan_periode_sebelumnya: 0,
  keterangan: '',
  items: [],
})

const subtotal = computed(() =>
  form.items.reduce((sum, it) => sum + (it.subtotal ?? 0), 0),
)

const totalTagihan = computed(() =>
  subtotal.value + (form.tagihan_periode_sebelumnya ?? 0),
)

function addItem() {
  form.items.push({
    barang_id: null, nama_barang: '', qty: 1,
    satuan: 'pcs', harga_satuan: 0, subtotal: 0, keterangan: '',
  })
  itemsError.value = ''
}
function updateItem(idx, val) { form.items[idx] = val }
function removeItem(idx)      { form.items.splice(idx, 1) }

async function submitForm() {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  if (form.items.length === 0) {
    itemsError.value = 'Minimal 1 item tagihan wajib diisi.'
    
    return
  }
  itemsError.value   = ''
  errorMessage.value = ''

  const res = await update(id, { ...form })
  if (res.success) {
    setFlashAlert({
      icon: 'success',
      title: 'Berhasil',
      text: 'Perubahan invoice berhasil disimpan.',
    })
    router.push({ name: 'finance-invoice-show', params: { id } })
  } else {
    errorMessage.value = res.message ?? 'Terjadi kesalahan'
    await showError(errorMessage.value)
  }
}

onMounted(async () => {
  const [, , data] = await Promise.all([
    fetchKlien(),
    fetchBarang(),
    fetchOne(id),
  ])

  loadingData.value = false
  if (!data || data.status !== 'DRAFT') return

  invoice.value = data
  Object.assign(form, {
    no_invoice: data.no_invoice,
    tanggal_invoice: data.tanggal_invoice,
    periode_awal: data.periode_awal,
    periode_akhir: data.periode_akhir,
    klien_ar_id: data.klien_ar_id,
    no_surat_jalan: data.no_surat_jalan ?? '',
    tagihan_periode_sebelumnya: data.tagihan_periode_sebelumnya ?? 0,
    keterangan: data.keterangan ?? '',
    items: (data.items ?? []).map(it => ({
      id: it.id,
      barang_id: it.barang_id,
      nama_barang: it.nama_barang,
      qty: it.qty,
      satuan: it.satuan,
      harga_satuan: it.harga_satuan,
      subtotal: it.subtotal,
      keterangan: it.keterangan ?? '',
    })),
  })
})
</script>

<style scoped>
.summary-table td {
  padding: 4px 8px;
}
</style>
