<template>
  <div>
    <PageHeader
      title="Ending Balance"
      subtitle="Saldo akhir piutang per klien per periode"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Ending Balance', disabled: true },
      ]"
    >
      </PageHeader>

    <!-- Tabel B2B -->
    <VCard class="mb-4">
      <VCardTitle class="px-4 pt-4 pb-0 text-body-1 font-weight-bold d-flex align-center gap-2">
        <VIcon icon="ri-building-line" size="20" color="primary" />
        Ending Balance B2B
      </VCardTitle>
      <VCardText class="d-flex flex-wrap gap-3 pb-0">
        <VTextField
          v-model="filtersB2B.periode_awal"
          label="Dari Periode"
          type="date"
          density="compact"
          hide-details
          style="max-width: 180px"
          @update:model-value="doFetchB2B(1)"
        />
        <VTextField
          v-model="filtersB2B.periode_akhir"
          label="Sampai Periode"
          type="date"
          density="compact"
          hide-details
          style="max-width: 180px"
          @update:model-value="doFetchB2B(1)"
        />
        <VSelect
          v-model="filtersB2B.status"
          label="Status"
          density="compact"
          hide-details
          clearable
          style="max-width: 160px"
          :items="[{ title: 'Draft', value: 'DRAFT' }, { title: 'Locked', value: 'LOCKED' }]"
          @update:model-value="doFetchB2B(1)"
        />
      </VCardText>
      <BaseTable
        :headers="headers"
        :items="rowsB2B"
        :total="metaB2B.total"
        :loading="loadingB2B"
        :per-page="metaB2B.per_page"
        :page="currentPageB2B"
        item-value="id"
        show-expand
        v-model:expanded="expandedB2B"
        column-resize-key="finance-ending-balance-b2b"
        @update:options="onTableOptionsB2B"
      >
        <template #item.no="{ index }">
          <span class="text-medium-emphasis">{{ (currentPageB2B - 1) * metaB2B.per_page + index + 1 }}</span>
        </template>

        <template #item.nama_klien="{ item }">
          <div class="font-weight-medium text-no-wrap">{{ item.nama_klien }}</div>
        </template>

        <template #item.periode="{ item }">
          <div class="text-caption text-no-wrap">
            {{ formatDate(item.periode_awal) }} – {{ formatDate(item.periode_akhir) }}
          </div>
        </template>

        <template #item.saldo_awal="{ item }">
          {{ formatRp(item.saldo_awal) }}
        </template>

        <template #item.invoice_masuk="{ item }">
          {{ formatRp(item.invoice_masuk) }}
        </template>

        <template #item.pembayaran="{ item }">
          {{ formatRp(item.pembayaran) }}
        </template>

        <template #item.saldo_akhir_final="{ item }">
          <div :class="item.saldo_akhir_sistem !== item.saldo_akhir_final ? 'text-warning font-weight-bold' : 'font-weight-bold'">
            {{ formatRp(item.saldo_akhir_final) }}
          </div>
          <div v-if="item.saldo_akhir_sistem !== item.saldo_akhir_final" class="text-caption text-medium-emphasis">
            (sistem: {{ formatRp(item.saldo_akhir_sistem) }})
          </div>
        </template>

        <template #item.outstanding="{ item }">
          <div :class="item.outstanding > 0 ? 'font-weight-medium' : 'text-medium-emphasis'">
            {{ formatRp(item.outstanding) }}
          </div>
          <div class="text-caption text-medium-emphasis">{{ item.outstanding_count }} Invoice</div>
        </template>

        <template #item.overdue="{ item }">
          <div :class="item.overdue > 0 ? 'text-error font-weight-medium' : 'text-medium-emphasis'">
            {{ formatRp(item.overdue) }}
          </div>
          <div class="text-caption text-medium-emphasis">{{ item.overdue_count }} Invoice</div>
        </template>

        <template #item.status="{ item }">
          <EndingBalanceStatusBadge :status="item.status" />
          <VChip
            v-if="item.has_active_koreksi"
            color="info"
            size="x-small"
            class="ml-1"
            label
          >
            Ada Koreksi
          </VChip>
        </template>

        <template #expanded-row="{ item }">
          <tr>
            <td :colspan="headers.length + 1" class="pa-0">
              <EbInvoiceBreakdown :eb-id="item.id" />
            </td>
          </tr>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <VBtn
              icon
              size="x-small"
              variant="text"
              color="primary"
              :to="{ name: 'finance-ending-balance-show', params: { id: item.id } }"
            >
              <VIcon icon="ri-eye-line" />
              <VTooltip activator="parent">Detail</VTooltip>
            </VBtn>
            <VBtn
              v-if="authStore.canOperateEndingBalance && !item.has_active_koreksi"
              icon
              size="x-small"
              variant="tonal"
              color="info"
              @click="openKoreksiDialog(item)"
            >
              <VIcon icon="ri-pencil-line" />
              <VTooltip activator="parent">{{ item.status === 'LOCKED' ? 'Ajukan Koreksi' : 'Penyesuaian Invoice' }}</VTooltip>
            </VBtn>
            <VBtn
              v-if="item.status === 'DRAFT' && authStore.canLockEndingBalance"
              icon
              size="x-small"
              variant="tonal"
              color="success"
              :loading="lockingId === item.id"
              @click="confirmLock(item)"
            >
              <VIcon icon="ri-lock-line" />
              <VTooltip activator="parent">Kunci Periode</VTooltip>
            </VBtn>
            <VBtn
              v-if="item.status === 'LOCKED' && authStore.canLockEndingBalance"
              icon
              size="x-small"
              variant="tonal"
              color="warning"
              :loading="unlockingId === item.id"
              @click="confirmUnlock(item)"
            >
              <VIcon icon="ri-lock-unlock-line" />
              <VTooltip activator="parent">Buka Periode</VTooltip>
            </VBtn>
          </div>
        </template>
      </BaseTable>
    </VCard>

    <!-- Tabel B2C -->
    <VCard>
      <VCardTitle class="px-4 pt-4 pb-0 text-body-1 font-weight-bold d-flex align-center gap-2">
        <VIcon icon="ri-store-line" size="20" color="secondary" />
        Ending Balance B2C
      </VCardTitle>
      <VCardText class="d-flex flex-wrap gap-3 pb-0">
        <VTextField
          v-model="filtersB2C.periode_awal"
          label="Dari Periode"
          type="date"
          density="compact"
          hide-details
          style="max-width: 180px"
          @update:model-value="doFetch(1)"
        />
        <VTextField
          v-model="filtersB2C.periode_akhir"
          label="Sampai Periode"
          type="date"
          density="compact"
          hide-details
          style="max-width: 180px"
          @update:model-value="doFetch(1)"
        />
        <VSelect
          v-model="filtersB2C.status"
          label="Status"
          density="compact"
          hide-details
          clearable
          style="max-width: 160px"
          :items="[{ title: 'Draft', value: 'DRAFT' }, { title: 'Locked', value: 'LOCKED' }]"
          @update:model-value="doFetch(1)"
        />
      </VCardText>
      <BaseTable
        :headers="headers"
        :items="rows"
        :total="meta.total"
        :loading="loading"
        :per-page="meta.per_page"
        :page="currentPage"
        item-value="id"
        show-expand
        v-model:expanded="expanded"
        column-resize-key="finance-ending-balance-b2c"
        @update:options="onTableOptions"
      >
        <template #item.no="{ index }">
          <span class="text-medium-emphasis">{{ (currentPage - 1) * meta.per_page + index + 1 }}</span>
        </template>

        <template #item.nama_klien="{ item }">
          <div class="font-weight-medium text-no-wrap">{{ item.nama_klien }}</div>
        </template>

        <template #item.periode="{ item }">
          <div class="text-caption text-no-wrap">
            {{ formatDate(item.periode_awal) }} – {{ formatDate(item.periode_akhir) }}
          </div>
        </template>

        <template #item.saldo_awal="{ item }">
          {{ formatRp(item.saldo_awal) }}
        </template>

        <template #item.invoice_masuk="{ item }">
          {{ formatRp(item.invoice_masuk) }}
        </template>

        <template #item.pembayaran="{ item }">
          {{ formatRp(item.pembayaran) }}
        </template>

        <template #item.saldo_akhir_final="{ item }">
          <div :class="item.saldo_akhir_sistem !== item.saldo_akhir_final ? 'text-warning font-weight-bold' : 'font-weight-bold'">
            {{ formatRp(item.saldo_akhir_final) }}
          </div>
          <div v-if="item.saldo_akhir_sistem !== item.saldo_akhir_final" class="text-caption text-medium-emphasis">
            (sistem: {{ formatRp(item.saldo_akhir_sistem) }})
          </div>
        </template>

        <template #item.outstanding="{ item }">
          <div :class="item.outstanding > 0 ? 'font-weight-medium' : 'text-medium-emphasis'">
            {{ formatRp(item.outstanding) }}
          </div>
          <div class="text-caption text-medium-emphasis">{{ item.outstanding_count }} Invoice</div>
        </template>

        <template #item.overdue="{ item }">
          <div :class="item.overdue > 0 ? 'text-error font-weight-medium' : 'text-medium-emphasis'">
            {{ formatRp(item.overdue) }}
          </div>
          <div class="text-caption text-medium-emphasis">{{ item.overdue_count }} Invoice</div>
        </template>

        <template #item.status="{ item }">
          <EndingBalanceStatusBadge :status="item.status" />
          <VChip
            v-if="item.has_active_koreksi"
            color="info"
            size="x-small"
            class="ml-1"
            label
          >
            Ada Koreksi
          </VChip>
        </template>

        <template #expanded-row="{ item }">
          <tr>
            <td :colspan="headers.length + 1" class="pa-0">
              <EbInvoiceBreakdown :eb-id="item.id" />
            </td>
          </tr>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <VBtn
              icon
              size="x-small"
              variant="text"
              color="primary"
              :to="{ name: 'finance-ending-balance-show', params: { id: item.id } }"
            >
              <VIcon icon="ri-eye-line" />
              <VTooltip activator="parent">Detail</VTooltip>
            </VBtn>
            <VBtn
              v-if="authStore.canOperateEndingBalance && !item.has_active_koreksi"
              icon
              size="x-small"
              variant="tonal"
              color="info"
              @click="openKoreksiDialog(item)"
            >
              <VIcon icon="ri-pencil-line" />
              <VTooltip activator="parent">{{ item.status === 'LOCKED' ? 'Ajukan Koreksi' : 'Penyesuaian Invoice' }}</VTooltip>
            </VBtn>
            <VBtn
              v-if="item.status === 'DRAFT' && authStore.canLockEndingBalance"
              icon
              size="x-small"
              variant="tonal"
              color="success"
              :loading="lockingId === item.id"
              @click="confirmLock(item)"
            >
              <VIcon icon="ri-lock-line" />
              <VTooltip activator="parent">Kunci Periode</VTooltip>
            </VBtn>
            <VBtn
              v-if="item.status === 'LOCKED' && authStore.canLockEndingBalance"
              icon
              size="x-small"
              variant="tonal"
              color="warning"
              :loading="unlockingId === item.id"
              @click="confirmUnlock(item)"
            >
              <VIcon icon="ri-lock-unlock-line" />
              <VTooltip activator="parent">Buka Periode</VTooltip>
            </VBtn>
          </div>
        </template>
      </BaseTable>
    </VCard>

    <!-- Dialog Konfirmasi Lock -->
    <VDialog v-model="showLockDialog" max-width="400">
      <VCard>
        <VCardTitle class="pt-4 px-4">Tutup Periode</VCardTitle>
        <VCardText>
          Kunci ending balance <strong>{{ lockTarget?.nama_klien }}</strong> untuk periode
          {{ formatDate(lockTarget?.periode_awal) }} – {{ formatDate(lockTarget?.periode_akhir) }}?
          <br><br>
          Setelah dikunci, koreksi manual memerlukan persetujuan SPV dan Manager.
        </VCardText>
        <VCardActions class="px-4 pb-4">
          <VSpacer />
          <VBtn variant="text" @click="showLockDialog = false">Batal</VBtn>
          <VBtn color="success" :loading="lockingId !== null" @click="doLock">Kunci</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Dialog Konfirmasi Unlock -->
    <VDialog v-model="showUnlockDialog" max-width="420">
      <VCard>
        <VCardTitle class="pt-4 px-4">Buka Kunci Periode</VCardTitle>
        <VCardText>
          Buka kunci ending balance <strong>{{ unlockTarget?.nama_klien }}</strong> untuk periode
          {{ formatDate(unlockTarget?.periode_awal) }} – {{ formatDate(unlockTarget?.periode_akhir) }}?
          <br><br>
          Setelah dibuka, invoice dalam periode ini dapat diubah kembali via import.
          <VAlert type="warning" variant="tonal" density="compact" class="mt-3">
            Pastikan data yang akan diubah sudah dikonfirmasi sebelum mengunci ulang.
          </VAlert>
        </VCardText>
        <VCardActions class="px-4 pb-4">
          <VSpacer />
          <VBtn variant="text" @click="showUnlockDialog = false">Batal</VBtn>
          <VBtn color="warning" :loading="unlockingId !== null" @click="doUnlock">Buka Kunci</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Dialog Ajukan Koreksi -->
    <VDialog v-model="showKoreksiDialog" max-width="680" persistent>
      <VCard>
        <VCardTitle class="pt-4 px-4 text-body-1 font-weight-bold">
          {{ isKoreksiDraft ? 'Penyesuaian Invoice' : 'Ajukan Koreksi Manual' }}
        </VCardTitle>
        <VCardSubtitle class="px-4 pb-2 text-caption">
          {{ koreksiTarget?.nama_klien }} · {{ formatDate(koreksiTarget?.periode_awal) }} – {{ formatDate(koreksiTarget?.periode_akhir) }}
        </VCardSubtitle>
        <VDivider />

        <!-- Context panel: ringkasan saldo -->
        <VCard variant="tonal" class="mx-4 mt-4 mb-1" rounded="lg">
          <VCardText class="py-3 px-4">
            <VRow dense>
              <VCol cols="12" sm="4">
                <div class="text-caption text-medium-emphasis mb-1">Saldo Akhir Sistem</div>
                <div class="text-body-1 font-weight-medium">{{ formatRp(koreksiTarget?.saldo_akhir_sistem) }}</div>
              </VCol>
              <VCol cols="12" sm="4">
                <div class="text-caption text-medium-emphasis mb-1">Saldo Akhir Final (Sekarang)</div>
                <div class="text-body-1 font-weight-bold">{{ formatRp(koreksiTarget?.saldo_akhir_final) }}</div>
              </VCol>
              <VCol cols="12" sm="4">
                <div class="text-caption text-medium-emphasis mb-1">Saldo Setelah Koreksi</div>
                <div class="text-body-1 font-weight-bold text-primary">
                  {{ formatRp(Number(koreksiTarget?.saldo_akhir_final ?? 0) + nilaiKoreksiComputed) }}
                </div>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>

        <VCardText class="pt-3">
          <VRow>
            <VCol cols="12">
              <VSelect
                v-model="koreksiForm.invoice_id"
                :items="koreksiInvoiceItems"
                :loading="koreksiInvoicesLoading"
                :label="isKoreksiDraft ? 'Tautkan ke Invoice' : 'Tautkan ke Invoice (opsional)'"
                :clearable="!isKoreksiDraft"
                :hint="koreksiForm.invoice_id
                  ? 'Outstanding invoice ini akan berkurang sebesar jumlah penyesuaian.'
                  : (isKoreksiDraft ? 'Wajib pilih invoice untuk EB draft.' : 'Kosongkan untuk koreksi nominal pada total saldo.')"
                persistent-hint
                no-data-text="Tidak ada invoice dengan sisa tagihan."
                @update:model-value="(v) => { if (v) koreksiForm.tipe_koreksi = 'kurangi' }"
              />
            </VCol>
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
                <VBtn value="tambah" style="flex: 1" prepend-icon="ri-add-line" :disabled="!!koreksiForm.invoice_id">Tambah Saldo</VBtn>
                <VBtn value="kurangi" style="flex: 1" prepend-icon="ri-subtract-line">Kurangi Saldo</VBtn>
              </VBtnToggle>
              <VTextField
                v-model="koreksiForm.jumlah_koreksi"
                label="Jumlah Koreksi"
                type="number"
                min="0"
                :hint="koreksiForm.invoice_id && koreksiSelectedOutstanding !== null
                  ? `Maks ${formatRp(koreksiSelectedOutstanding)} (sisa tagihan invoice)`
                  : `Saldo akan ${koreksiForm.tipe_koreksi === 'tambah' ? 'bertambah' : 'berkurang'} sebesar jumlah ini`"
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
                hint="Wajib diisi. Maks 1000 karakter."
                persistent-hint
              />
            </VCol>
            <VCol cols="12">
              <VTextField
                v-model="koreksiForm.dokumen_url"
                label="URL Dokumen Pendukung (opsional)"
                hint="Lampirkan link Google Drive, SharePoint, atau URL lainnya"
                persistent-hint
              />
            </VCol>
          </VRow>
          <VAlert
            v-if="isKoreksiDraft"
            type="warning"
            density="compact"
            variant="tonal"
            icon="ri-flashlight-line"
            class="mt-4"
          >
            EB ini masih <strong>draft</strong>, penyesuaian <strong>langsung berlaku</strong> tanpa persetujuan. Outstanding invoice & saldo akhir akan berkurang seketika.
          </VAlert>
          <VAlert
            v-else
            type="info"
            density="compact"
            variant="tonal"
            icon="ri-shield-check-line"
            class="mt-4"
          >
            Koreksi ini memerlukan persetujuan dua tahap: <strong>SPV</strong> terlebih dahulu, kemudian <strong>Manager</strong>. Saldo tidak akan berubah sampai keduanya menyetujui.
          </VAlert>
          <VAlert v-if="koreksiError" type="error" class="mt-2" density="compact">{{ koreksiError }}</VAlert>
        </VCardText>
        <VCardActions class="px-4 pb-4">
          <VSpacer />
          <VBtn variant="text" :disabled="submittingKoreksi" @click="showKoreksiDialog = false">Batal</VBtn>
          <VBtn color="primary" :loading="submittingKoreksi" @click="submitKoreksiDialog">
            {{ isKoreksiDraft ? 'Terapkan Penyesuaian' : 'Ajukan Koreksi' }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, defineComponent, h } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import api from '@/utils/axios'
import EndingBalanceStatusBadge from '@/modules/Finance/shared/components/EndingBalanceStatusBadge.vue'

// ─── Komponen inline: breakdown invoice per EB ───────────────────────────────
const EbInvoiceBreakdown = defineComponent({
  props: { ebId: { type: Number, required: true } },
  setup(props) {
    const rows    = ref([])
    const loading = ref(true)
    const error   = ref('')

    const fmt     = val => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val ?? 0)
    const fmtDate = d   => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'
    const statusColor = s => ({ DRAFT: 'default', TERKIRIM: 'primary', SEBAGIAN: 'warning', LUNAS: 'success' })[s] ?? 'default'

    onMounted(async () => {
      try {
        const { data } = await api.get(`/finance/ending-balance/${props.ebId}/invoices`)
        rows.value = data.data ?? []
      } catch (e) {
        error.value = e?.response?.data?.message ?? 'Gagal memuat data invoice.'
      } finally {
        loading.value = false
      }
    })

    return () => {
      if (loading.value) {
        return h('div', { class: 'eb-breakdown d-flex align-center justify-center pa-4 gap-2 text-caption text-medium-emphasis' }, [
          h('VProgressCircular', { indeterminate: true, size: 16, width: 2 }),
          'Memuat invoice...',
        ])
      }
      if (error.value) {
        return h('div', { class: 'eb-breakdown pa-4 text-caption text-error text-center' }, error.value)
      }
      if (!rows.value.length) {
        return h('div', { class: 'eb-breakdown pa-4 text-caption text-medium-emphasis text-center' }, 'Tidak ada invoice dalam periode ini.')
      }

      const thClass  = 'eb-th text-caption text-medium-emphasis font-weight-medium text-uppercase'
      const tdClass  = 'eb-td text-caption'

      return h('div', { class: 'eb-breakdown' }, [
        h('div', { class: 'eb-breakdown__header text-caption text-medium-emphasis px-6 py-2' },
          `${rows.value.length} invoice dalam periode ini`),
        h('table', { class: 'eb-table w-100' }, [
          h('thead', {}, [
            h('tr', {}, [
              h('th', { class: `${thClass} text-start` }, 'No Invoice'),
              h('th', { class: `${thClass} text-start` }, 'Tanggal'),
              h('th', { class: `${thClass} text-start` }, 'Jatuh Tempo'),
              h('th', { class: `${thClass} text-end` }, 'Tagihan'),
              h('th', { class: `${thClass} text-end` }, 'CN/DN'),
              h('th', { class: `${thClass} text-end` }, 'Dibayar'),
              h('th', { class: `${thClass} text-end` }, 'Sisa'),
              h('th', { class: `${thClass} text-center` }, 'Status'),
            ]),
          ]),
          h('tbody', {}, rows.value.map(inv => {
            const sisaSubtotal = Math.max(0, (inv.subtotal ?? 0) - (inv.total_pembayaran ?? 0) - (inv.total_penyesuaian ?? 0))
            return h('tr', { key: inv.id, class: 'eb-table__row' }, [
              h('td', { class: `${tdClass} font-weight-medium` }, [
                h('span', {}, inv.no_invoice),
                inv.is_opening_balance ? h('VChip', { size: 'x-small', color: 'secondary', label: true, class: 'ml-2', style: 'font-size:10px' }, { default: () => 'OB' }) : null,
                Number(inv.total_penyesuaian) > 0 ? h('VChip', { size: 'x-small', color: 'info', label: true, class: 'ml-2', style: 'font-size:10px' }, { default: () => `Disesuaikan −${fmt(inv.total_penyesuaian)}` }) : null,
              ]),
              h('td', { class: `${tdClass} text-medium-emphasis` }, fmtDate(inv.tanggal_invoice)),
              h('td', { class: `${tdClass} ${inv.tanggal_jatuh_tempo && inv.sisa_tagihan > 0 && inv.tanggal_jatuh_tempo < new Date().toISOString().slice(0,10) ? 'text-error' : 'text-medium-emphasis'}` }, fmtDate(inv.tanggal_jatuh_tempo)),
              h('td', { class: `${tdClass} text-end` }, fmt(inv.subtotal)),
              h('td', { class: `${tdClass} text-end` }, (() => {
                const hasCN = (inv.total_cn ?? 0) > 0
                const hasDN = (inv.total_dn ?? 0) > 0
                if (!hasCN && !hasDN) return '—'
                const lines = []
                if (hasDN) lines.push(h('div', { class: 'text-success' }, `+ ${fmt(inv.total_dn)}`))
                if (hasCN) lines.push(h('div', { class: 'text-error'   }, `− ${fmt(inv.total_cn)}`))
                return lines
              })()),
              h('td', { class: `${tdClass} text-end text-success` }, fmt(inv.total_pembayaran)),
              h('td', { class: `${tdClass} text-end font-weight-bold ${sisaSubtotal > 0 ? 'text-warning' : 'text-success'}` }, fmt(sisaSubtotal)),
              h('td', { class: `${tdClass} text-center` }, [
                h('VChip', { size: 'x-small', color: statusColor(inv.status), label: true }, { default: () => inv.status }),
              ]),
            ])
          })),
        ]),
      ])
    }
  }
})

const authStore = useAuthStore()

// ─── State B2C ────────────────────────────────────────────────────────────────
const loading     = ref(false)
const rows        = ref([])
const meta        = ref({ total: 0, per_page: 15 })
const currentPage = ref(1)
const expanded    = ref([])

// ─── State B2B ────────────────────────────────────────────────────────────────
const loadingB2B     = ref(false)
const rowsB2B        = ref([])
const metaB2B        = ref({ total: 0, per_page: 15 })
const currentPageB2B = ref(1)
const expandedB2B    = ref([])

function toDateStr(d) {
  const year  = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day   = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
const now      = new Date()
const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
const lastDay  = new Date(now.getFullYear(), now.getMonth() + 1, 0)
const filtersB2B = reactive({
  periode_awal:  toDateStr(firstDay),
  periode_akhir: toDateStr(lastDay),
  status: null,
})

const filtersB2C = reactive({
  periode_awal:  toDateStr(firstDay),
  periode_akhir: toDateStr(lastDay),
  status: null,
})

const lockingId       = ref(null)
const showLockDialog  = ref(false)
const lockTarget      = ref(null)
const unlockingId     = ref(null)
const showUnlockDialog = ref(false)
const unlockTarget    = ref(null)
const showKoreksiDialog = ref(false)
const koreksiTarget     = ref(null)
const koreksiForm       = reactive({ tipe_koreksi: 'tambah', jumlah_koreksi: '', alasan_koreksi: '', dokumen_url: '', invoice_id: null })
const submittingKoreksi = ref(false)
const koreksiError      = ref('')
const koreksiInvoices   = ref([])
const koreksiInvoicesLoading = ref(false)

const nilaiKoreksiComputed = computed(() => {
  const jumlah = Number(koreksiForm.jumlah_koreksi || 0)
  return koreksiForm.tipe_koreksi === 'tambah' ? jumlah : -jumlah
})

// Sisa tagihan (outstanding) per invoice — sama dengan formula backend
function invoiceOutstanding(inv) {
  if (!inv) return 0
  if (Number(inv.subtotal) === 0) return Math.max(0, Number(inv.sisa_tagihan ?? 0))
  return Math.max(0, Number(inv.subtotal ?? 0) - Number(inv.total_pembayaran ?? 0) - Number(inv.total_penyesuaian ?? 0))
}

// EB DRAFT → penyesuaian per-invoice langsung berlaku & wajib pilih invoice
const isKoreksiDraft = computed(() => koreksiTarget.value?.status === 'DRAFT')

// Item dropdown invoice (hanya yang masih punya outstanding)
const koreksiInvoiceItems = computed(() =>
  koreksiInvoices.value
    .map(inv => ({ ...inv, outstanding: invoiceOutstanding(inv) }))
    .filter(inv => inv.outstanding > 0)
    .map(inv => ({
      title: `${inv.no_invoice} — sisa ${formatRp(inv.outstanding)}`,
      value: inv.id,
      outstanding: inv.outstanding,
    }))
)

const koreksiSelectedOutstanding = computed(() => {
  const item = koreksiInvoiceItems.value.find(i => i.value === koreksiForm.invoice_id)
  return item ? item.outstanding : null
})

const headers = [
  { title: 'No',             key: 'no',                sortable: false, width: '60px' },
  { title: 'Client',         key: 'nama_klien',        sortable: false },
  { title: 'Periode',        key: 'periode',           sortable: false, width: '210px' },
  { title: 'Saldo Awal',     key: 'saldo_awal',        sortable: false, align: 'end' },
  { title: 'Invoice Masuk',  key: 'invoice_masuk',     sortable: false, align: 'end' },
  { title: 'Pembayaran',     key: 'pembayaran',        sortable: false, align: 'end' },
  { title: 'Saldo Akhir',    key: 'saldo_akhir_final', sortable: false, align: 'end' },
  { title: 'Outstanding',    key: 'outstanding',       sortable: false, align: 'end' },
  { title: 'Overdue',        key: 'overdue',           sortable: false, align: 'end' },
  { title: 'Status',         key: 'status',            sortable: false },
  { title: 'Aksi',           key: 'actions',           sortable: false, align: 'end' },
]

function formatRp(val) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val ?? 0)
}
function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

async function doFetch(page = 1) {
  loading.value = true
  try {
    const { data } = await api.get('/finance/ending-balance', {
      params: { ...filtersB2C, segment: 'B2C', page },
      timeout: 60000,
    })
    rows.value = data.data ?? []
    meta.value = { total: data.meta?.total ?? 0, per_page: data.meta?.per_page ?? 15 }
  } finally {
    loading.value = false
  }
}

async function doFetchB2B(page = 1) {
  loadingB2B.value = true
  try {
    const { data } = await api.get('/finance/ending-balance', {
      params: { ...filtersB2B, segment: 'B2B', page },
      timeout: 60000,
    })
    rowsB2B.value = data.data ?? []
    metaB2B.value = { total: data.meta?.total ?? 0, per_page: data.meta?.per_page ?? 15 }
  } finally {
    loadingB2B.value = false
  }
}

function onTableOptions({ page }) {
  currentPage.value = page
  doFetch(page)
}

function onTableOptionsB2B({ page }) {
  currentPageB2B.value = page
  doFetchB2B(page)
}

function confirmLock(item) {
  lockTarget.value  = item
  showLockDialog.value = true
}

async function doLock() {
  if (!lockTarget.value) return
  lockingId.value = lockTarget.value.id
  try {
    await api.patch(`/finance/ending-balance/${lockTarget.value.id}/lock`)
    showLockDialog.value = false
    doFetch(currentPage.value)
    doFetchB2B(currentPageB2B.value)
  } catch (e) {
    alert(e?.response?.data?.message ?? 'Gagal mengunci.')
  } finally {
    lockingId.value = null
    lockTarget.value = null
  }
}

function confirmUnlock(item) {
  unlockTarget.value    = item
  showUnlockDialog.value = true
}

async function doUnlock() {
  if (!unlockTarget.value) return
  unlockingId.value = unlockTarget.value.id
  try {
    await api.patch(`/finance/ending-balance/${unlockTarget.value.id}/unlock`)
    showUnlockDialog.value = false
    doFetch(currentPage.value)
    doFetchB2B(currentPageB2B.value)
  } catch (e) {
    alert(e?.response?.data?.message ?? 'Gagal membuka kunci periode.')
  } finally {
    unlockingId.value  = null
    unlockTarget.value = null
  }
}

async function openKoreksiDialog(item) {
  koreksiTarget.value           = item
  // EB DRAFT hanya untuk penyesuaian per-invoice (kurangi); LOCKED default tambah.
  koreksiForm.tipe_koreksi      = item.status === 'DRAFT' ? 'kurangi' : 'tambah'
  koreksiForm.jumlah_koreksi    = ''
  koreksiForm.alasan_koreksi    = ''
  koreksiForm.dokumen_url       = ''
  koreksiForm.invoice_id        = null
  koreksiError.value            = ''
  koreksiInvoices.value         = []
  showKoreksiDialog.value       = true

  koreksiInvoicesLoading.value = true
  try {
    const { data } = await api.get(`/finance/ending-balance/${item.id}/invoices`)
    koreksiInvoices.value = data.data ?? []
  } catch (e) {
    koreksiError.value = e?.response?.data?.message ?? 'Gagal memuat daftar invoice.'
  } finally {
    koreksiInvoicesLoading.value = false
  }
}

async function submitKoreksiDialog() {
  koreksiError.value = ''
  if (!koreksiForm.jumlah_koreksi || !koreksiForm.alasan_koreksi) {
    koreksiError.value = 'Jumlah koreksi dan alasan wajib diisi.'
    return
  }
  if (isKoreksiDraft.value && !koreksiForm.invoice_id) {
    koreksiError.value = 'Untuk EB draft, pilih invoice yang akan disesuaikan.'
    return
  }
  if (koreksiForm.invoice_id) {
    if (koreksiForm.tipe_koreksi !== 'kurangi') {
      koreksiError.value = 'Penyesuaian per-invoice hanya untuk mengurangi saldo.'
      return
    }
    const jumlah = Number(koreksiForm.jumlah_koreksi || 0)
    if (koreksiSelectedOutstanding.value !== null && jumlah > koreksiSelectedOutstanding.value) {
      koreksiError.value = `Jumlah melebihi sisa tagihan invoice (${formatRp(koreksiSelectedOutstanding.value)}).`
      return
    }
  }
  submittingKoreksi.value = true
  try {
    const payload = {
      nilai_koreksi:  nilaiKoreksiComputed.value,
      alasan_koreksi: koreksiForm.alasan_koreksi,
      dokumen_url:    koreksiForm.dokumen_url,
      invoice_id:     koreksiForm.invoice_id,
    }
    await api.post(`/finance/ending-balance/${koreksiTarget.value.id}/koreksi`, payload)
    const wasDraft = isKoreksiDraft.value
    showKoreksiDialog.value = false
    if (wasDraft) {
      // DRAFT: penyesuaian langsung berlaku → muat ulang agar saldo & outstanding terupdate
      doFetch(currentPage.value)
      doFetchB2B(currentPageB2B.value)
    } else {
      // LOCKED: koreksi menunggu approval → tandai ada koreksi aktif
      const idx = rows.value.findIndex(r => r.id === koreksiTarget.value.id)
      if (idx !== -1) rows.value[idx] = { ...rows.value[idx], has_active_koreksi: true }
      const idxB2B = rowsB2B.value.findIndex(r => r.id === koreksiTarget.value.id)
      if (idxB2B !== -1) rowsB2B.value[idxB2B] = { ...rowsB2B.value[idxB2B], has_active_koreksi: true }
    }
  } catch (e) {
    koreksiError.value = e?.response?.data?.message ?? 'Gagal mengajukan koreksi.'
  } finally {
    submittingKoreksi.value = false
  }
}

onMounted(() => { doFetch(); doFetchB2B() })
</script>

<style scoped>
/* Fix: hover row jangan berubah putih */
:deep(.v-data-table__tr:hover > td) {
  background: rgba(var(--v-theme-on-surface), 0.05) !important;
}

/* Expanded row: hapus background putih bawaan */
:deep(.v-data-table__tr--expanded > td) {
  background: transparent !important;
}

/* Wrapper expanded row — ikuti background tabel utama */
:deep(.eb-breakdown) {
  border-top: 2px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-bottom: 2px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.eb-breakdown__header {
  padding: 6px 16px;
  font-size: 0.75rem;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  opacity: 0.7;
  letter-spacing: 0.02em;
  background: rgba(var(--v-theme-on-surface), 0.03);
}

/* Tabel invoice breakdown */
:deep(.eb-table) {
  border-collapse: collapse;
  width: 100%;
}

:deep(.eb-th) {
  padding: 8px 16px;
  letter-spacing: 0.05em;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  white-space: nowrap;
  background: rgba(var(--v-theme-on-surface), 0.03);
}

:deep(.eb-td) {
  padding: 8px 16px;
  white-space: nowrap;
}

/* Zebra stripe sama dengan Vuetify standard */
:deep(.eb-table__row) {
  transition: background 0.15s;
}

:deep(.eb-table__row:nth-child(odd)) {
  background: transparent !important;
}

:deep(.eb-table__row:nth-child(even)) {
  background: rgba(var(--v-theme-on-surface), 0.04) !important;
}

:deep(.eb-table__row:hover) {
  background: rgba(var(--v-theme-on-surface), 0.08) !important;
}
</style>
