<template>
  <div>
    <PageHeader
      title="Approval Opening Balance"
      subtitle="Tinjau dan proses opening balance yang memerlukan persetujuan"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Approval Opening Balance', disabled: true },
      ]"
    />

    <VRow class="mb-4">
      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <VCard>
          <VCardText>
            <div class="d-flex align-center gap-3">
              <VAvatar
                color="warning"
                variant="tonal"
                size="44"
              >
                <VIcon icon="ri-timer-line" />
              </VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">
                  Total Data
                </div>
                <div class="text-h6 font-weight-bold">
                  {{ summary.total_invoice ?? '-' }}
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <VCard>
          <VCardText>
            <div class="d-flex align-center gap-3">
              <VAvatar
                color="primary"
                variant="tonal"
                size="44"
              >
                <VIcon icon="ri-wallet-3-line" />
              </VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">
                  Total Nominal
                </div>
                <div class="text-h6 font-weight-bold">
                  {{ formatCurrency(summary.total_tagihan) }}
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <VCard>
          <VCardText>
            <div class="d-flex align-center gap-3">
              <VAvatar
                color="success"
                variant="tonal"
                size="44"
              >
                <VIcon icon="ri-checkbox-circle-line" />
              </VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">
                  Total Terbayar
                </div>
                <div class="text-h6 font-weight-bold">
                  {{ formatCurrency(summary.total_pembayaran) }}
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <VCard>
          <VCardText>
            <div class="d-flex align-center gap-3">
              <VAvatar
                color="error"
                variant="tonal"
                size="44"
              >
                <VIcon icon="ri-error-warning-line" />
              </VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">
                  Sisa Piutang
                </div>
                <div class="text-h6 font-weight-bold">
                  {{ formatCurrency(summary.total_sisa) }}
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VCard>
      <VCardText class="d-flex flex-wrap gap-3 pb-0">
        <VTextField
          v-model="params.search"
          placeholder="Cari no. OB / klien..."
          clearable
          hide-details
          density="compact"
          style="max-width: 250px"
          prepend-inner-icon="ri-search-line"
          @update:model-value="debouncedFetch"
        />
        <VSelect
          v-model="params.approval_status"
          placeholder="Semua Approval"
          clearable
          hide-details
          density="compact"
          style="max-width: 230px"
          :items="approvalStatusOptions"
          item-title="label"
          item-value="value"
          @update:model-value="doFetch"
        />
        <VAutocomplete
          v-model="params.klien_ar_id"
          placeholder="Semua Klien"
          clearable
          hide-details
          density="compact"
          style="max-width: 220px"
          :items="klienList"
          item-title="nama_klien"
          item-value="id"
          :loading="klienLoading"
          no-filter
          @focus="() => klienList.length === 0 && searchKlienNow()"
          @update:search="searchKlien"
          @update:model-value="doFetch"
        />
        <VSelect
          v-model="params.periode_bulan"
          placeholder="Bulan"
          clearable
          hide-details
          density="compact"
          style="max-width: 140px"
          :items="bulanOptions"
          item-title="label"
          item-value="value"
          @update:model-value="doFetch"
        />
        <VTextField
          v-model="params.periode_tahun"
          placeholder="Tahun"
          clearable
          hide-details
          density="compact"
          style="max-width: 100px"
          type="number"
          @update:model-value="debouncedFetch"
        />
      </VCardText>

      <BaseTable
        :headers="headers"
        :items="items"
        :total="meta.total"
        :loading="loading"
        :per-page="meta.per_page"
        :page="meta.current_page"
        class="mt-2"
        @update:options="onTableOptions"
      >
        <template #item.no="{ index }">
          {{ (meta.current_page - 1) * meta.per_page + index + 1 }}
        </template>
        <template #item.no_invoice="{ item }">
          <VChip
            color="primary"
            size="small"
            variant="tonal"
            label
          >
            {{ item.no_invoice }}
          </VChip>
        </template>
        <template #item.klien_ar="{ item }">
          {{ item.klien_ar?.nama_klien ?? '-' }}
        </template>
        <template #item.perusahaan="{ item }">
          <VChip
            v-if="item.perusahaan"
            color="secondary"
            size="small"
            variant="tonal"
            label
          >
            {{ item.perusahaan.nama_singkatan_perusahaan }}
          </VChip>
          <span v-else>-</span>
        </template>
        <template #item.tanggal_invoice="{ item }">
          {{ formatDate(item.tanggal_invoice) }}
        </template>
        <template #item.total_tagihan="{ item }">
          {{ formatCurrency(item.total_tagihan) }}
        </template>
        <template #item.submitted_by_name="{ item }">
          {{ item.submitted_by_name ?? item.created_by_name ?? '-' }}
        </template>
        <template #item.submitted_at="{ item }">
          {{ formatDateTime(item.submitted_at) }}
        </template>
        <template #item.approval_status="{ item }">
          <ApprovalStatusBadge :status="item.approval_status" />
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex gap-1 justify-center">
            <VBtn
              v-if="canApproveOpeningBalance && item.approval_status === 'PENDING'"
              icon
              size="small"
              variant="text"
              color="success"
              :loading="approvingId === item.id"
              @click="confirmApprove(item)"
            >
              <VIcon
                icon="ri-checkbox-circle-line"
                size="18"
              />
              <VTooltip activator="parent">
                Approve
              </VTooltip>
            </VBtn>
            <VBtn
              icon
              size="small"
              variant="text"
              color="info"
              :to="{ name: 'finance-invoice-show', params: { id: item.id } }"
            >
              <VIcon
                icon="ri-eye-line"
                size="18"
              />
              <VTooltip activator="parent">
                Review
              </VTooltip>
            </VBtn>
          </div>
        </template>
      </BaseTable>
    </VCard>

    <!-- ── Section 2: List Opening Balance ──────────────────────────────────── -->
    <div class="d-flex align-center gap-3 mt-6 mb-4">
      <span class="text-h6 font-weight-semibold">List Opening Balance</span>
      <VDivider />
    </div>

    <VRow class="mb-4">
      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <VCard>
          <VCardText>
            <div class="d-flex align-center gap-3">
              <VAvatar
                color="primary"
                variant="tonal"
                size="44"
              >
                <VIcon icon="ri-history-line" />
              </VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">
                  Total Data
                </div>
                <div class="text-h6 font-weight-bold">
                  {{ obSummary.total_invoice ?? '-' }}
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <VCard>
          <VCardText>
            <div class="d-flex align-center gap-3">
              <VAvatar
                color="warning"
                variant="tonal"
                size="44"
              >
                <VIcon icon="ri-wallet-3-line" />
              </VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">
                  Total Saldo Awal
                </div>
                <div class="text-h6 font-weight-bold">
                  {{ formatCurrency(obSummary.total_tagihan) }}
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <VCard>
          <VCardText>
            <div class="d-flex align-center gap-3">
              <VAvatar
                color="success"
                variant="tonal"
                size="44"
              >
                <VIcon icon="ri-money-cny-circle-line" />
              </VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">
                  Total Terbayar
                </div>
                <div class="text-h6 font-weight-bold">
                  {{ formatCurrency(obSummary.total_pembayaran) }}
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <VCard>
          <VCardText>
            <div class="d-flex align-center gap-3">
              <VAvatar
                color="error"
                variant="tonal"
                size="44"
              >
                <VIcon icon="ri-error-warning-line" />
              </VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">
                  Sisa Piutang
                </div>
                <div class="text-h6 font-weight-bold">
                  {{ formatCurrency(obSummary.total_sisa) }}
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- B2B Table -->
    <VCard class="mb-4">
      <div class="d-flex align-center justify-space-between px-4 py-3">
        <div class="d-flex align-center gap-2">
          <VAvatar
            color="warning"
            variant="tonal"
            size="32"
          >
            <VIcon
              icon="ri-building-line"
              size="18"
            />
          </VAvatar>
          <span class="text-subtitle-1 font-weight-semibold">Opening Balance B2B</span>
        </div>
        <div class="d-flex align-center gap-2">
          <VBtn
            variant="text"
            color="secondary"
            size="small"
            prepend-icon="ri-refresh-line"
            @click="resetObFiltersB2B"
          >
            Reset
          </VBtn>Approval Opening Balance
        </div>
      </div>
      <VDivider />
      <div class="d-flex flex-wrap align-center gap-4 px-4 py-3">
        <div style="min-width: 200px; flex: 1; max-width: 280px;">
          <div class="text-caption text-medium-emphasis mb-2">Pencarian</div>
          <VTextField
            v-model="obParamsB2B.search"
            placeholder="Cari no. OB / klien..."
            clearable
            hide-details
            density="compact"
            prepend-inner-icon="ri-search-line"
            @update:model-value="debouncedObFetchB2B"
          />
        </div>
        <div style="min-width: 140px; max-width: 180px;">
          <div class="text-caption text-medium-emphasis mb-2">Status</div>
          <VSelect
            v-model="obParamsB2B.status"
            placeholder="Semua Status"
            clearable
            hide-details
            density="compact"
            :items="statusOptions"
            item-title="label"
            item-value="value"
            @update:model-value="doObFetchB2B"
          />
        </div>
        <div style="min-width: 160px; max-width: 220px;">
          <div class="text-caption text-medium-emphasis mb-2">Approval</div>
          <VSelect
            v-model="obParamsB2B.approval_status"
            placeholder="Semua Approval"
            clearable
            hide-details
            density="compact"
            :items="approvalStatusOptions"
            item-title="label"
            item-value="value"
            @update:model-value="doObFetchB2B"
          />
        </div>
        <div style="min-width: 180px; flex: 1; max-width: 260px;">
          <div class="text-caption text-medium-emphasis mb-2">Klien</div>
          <VAutocomplete
            v-model="obParamsB2B.klien_ar_id"
            placeholder="Semua Klien"
            clearable
            hide-details
            density="compact"
            :items="klienList"
            item-title="nama_klien"
            item-value="id"
            :loading="klienLoading"
            no-filter
            @focus="() => klienList.length === 0 && searchKlienNow()"
            @update:search="searchKlien"
            @update:model-value="doObFetchB2B"
          />
        </div>
        <div style="min-width: 130px; max-width: 160px;">
          <div class="text-caption text-medium-emphasis mb-2">Bulan</div>
          <VSelect
            v-model="obParamsB2B.periode_bulan"
            placeholder="Semua"
            clearable
            hide-details
            density="compact"
            :items="bulanOptions"
            item-title="label"
            item-value="value"
            @update:model-value="doObFetchB2B"
          />
        </div>
        <div style="min-width: 90px; max-width: 110px;">
          <div class="text-caption text-medium-emphasis mb-2">Tahun</div>
          <VTextField
            v-model="obParamsB2B.periode_tahun"
            placeholder="Tahun"
            clearable
            hide-details
            density="compact"
            type="number"
            @update:model-value="debouncedObFetchB2B"
          />
        </div>
      </div>
      <VDivider />
      <BaseTable
        :headers="obHeadersB2B"
        :items="obItemsB2B"
        :total="obMetaB2B.total"
        :loading="obLoadingB2B"
        :per-page="obMetaB2B.per_page"
        :page="obMetaB2B.current_page"
        class="mt-2"
        @update:options="onObTableOptionsB2B"
      >
        <template #item.no="{ index }">
          {{ (obMetaB2B.current_page - 1) * obMetaB2B.per_page + index + 1 }}
        </template>
        <template #item.no_invoice="{ item }">
          <VChip
            color="primary"
            size="small"
            variant="tonal"
            label
          >
            {{ item.no_invoice }}
          </VChip>
        </template>
        <template #item.klien_ar="{ item }">
          {{ item.klien_ar?.nama_klien ?? '-' }}
        </template>
        <template #item.tanggal_invoice="{ item }">
          {{ formatDate(item.tanggal_invoice) }}
        </template>
        <template #item.total_tagihan="{ item }">
          {{ formatCurrency(item.total_tagihan) }}
        </template>
        <template #item.total_pembayaran="{ item }">
          {{ formatCurrency(item.total_pembayaran) }}
        </template>
        <template #item.sisa_tagihan="{ item }">
          <span :class="item.sisa_tagihan > 0 ? 'text-error' : 'text-success'">
            {{ formatCurrency(item.sisa_tagihan) }}
          </span>
        </template>
        <template #item.status="{ item }">
          <InvoiceStatusBadge :status="item.status" />
        </template>
        <template #item.ob_b2b_approval_status="{ item }">
          <ApprovalStatusBadge :status="item.approval_status" />
        </template>
        <template #item.ob_b2b_actions="{ item }">
          <div class="d-flex gap-1">
            <VBtn
              v-if="item.can_record_payment && item.status !== 'LUNAS'"
              icon
              size="small"
              variant="tonal"
              color="success"
              @click="openCatatBayar(item)"
            >
              <VIcon
                icon="ri-money-cny-circle-line"
                size="18"
              />
              <VTooltip activator="parent">
                Catat Bayar
              </VTooltip>
            </VBtn>
            <VBtn
              v-if="item.can_print"
              icon
              size="small"
              variant="text"
              color="secondary"
              @click="printInvoice(item.id)"
            >
              <VIcon
                icon="ri-printer-line"
                size="18"
              />
              <VTooltip activator="parent">
                Cetak
              </VTooltip>
            </VBtn>
            <VBtn
              icon
              size="small"
              variant="text"
              color="info"
              :to="{ name: 'finance-invoice-show', params: { id: item.id } }"
            >
              <VIcon
                icon="ri-eye-line"
                size="18"
              />
              <VTooltip activator="parent">
                Detail
              </VTooltip>
            </VBtn>
          </div>
        </template>
      </BaseTable>
    </VCard>

    <!-- B2C Table -->
    <VCard>
      <div class="d-flex align-center justify-space-between px-4 py-3">
        <div class="d-flex align-center gap-2">
          <VAvatar
            color="primary"
            variant="tonal"
            size="32"
          >
            <VIcon
              icon="ri-user-line"
              size="18"
            />
          </VAvatar>
          <span class="text-subtitle-1 font-weight-semibold">Opening Balance B2C</span>
        </div>
        <div class="d-flex align-center gap-2">
          <VBtn
            variant="text"
            color="secondary"
            size="small"
            prepend-icon="ri-refresh-line"
            @click="resetObFiltersB2C"
          >
            Reset
          </VBtn>
        </div>
      </div>
      <VDivider />
      <div class="d-flex flex-wrap align-center gap-4 px-4 py-3">
        <div style="min-width: 200px; flex: 1; max-width: 280px;">
          <div class="text-caption text-medium-emphasis mb-2">Pencarian</div>
          <VTextField
            v-model="obParams.search"
            placeholder="Cari no. OB / klien..."
            clearable
            hide-details
            density="compact"
            prepend-inner-icon="ri-search-line"
            @update:model-value="debouncedObFetch"
          />
        </div>
        <div style="min-width: 140px; max-width: 180px;">
          <div class="text-caption text-medium-emphasis mb-2">Status</div>
          <VSelect
            v-model="obParams.status"
            placeholder="Semua Status"
            clearable
            hide-details
            density="compact"
            :items="statusOptions"
            item-title="label"
            item-value="value"
            @update:model-value="doObFetch"
          />
        </div>
        <div style="min-width: 160px; max-width: 220px;">
          <div class="text-caption text-medium-emphasis mb-2">Approval</div>
          <VSelect
            v-model="obParams.approval_status"
            placeholder="Semua Approval"
            clearable
            hide-details
            density="compact"
            :items="approvalStatusOptions"
            item-title="label"
            item-value="value"
            @update:model-value="doObFetch"
          />
        </div>
        <div style="min-width: 180px; flex: 1; max-width: 260px;">
          <div class="text-caption text-medium-emphasis mb-2">Klien</div>
          <VAutocomplete
            v-model="obParams.klien_ar_id"
            placeholder="Semua Klien"
            clearable
            hide-details
            density="compact"
            :items="klienList"
            item-title="nama_klien"
            item-value="id"
            :loading="klienLoading"
            no-filter
            @focus="() => klienList.length === 0 && searchKlienNow()"
            @update:search="searchKlien"
            @update:model-value="doObFetch"
          />
        </div>
        <div style="min-width: 130px; max-width: 160px;">
          <div class="text-caption text-medium-emphasis mb-2">Bulan</div>
          <VSelect
            v-model="obParams.periode_bulan"
            placeholder="Semua"
            clearable
            hide-details
            density="compact"
            :items="bulanOptions"
            item-title="label"
            item-value="value"
            @update:model-value="doObFetch"
          />
        </div>
        <div style="min-width: 90px; max-width: 110px;">
          <div class="text-caption text-medium-emphasis mb-2">Tahun</div>
          <VTextField
            v-model="obParams.periode_tahun"
            placeholder="Tahun"
            clearable
            hide-details
            density="compact"
            type="number"
            @update:model-value="debouncedObFetch"
          />
        </div>
      </div>
      <VDivider />
      <BaseTable
        :headers="obHeaders"
        :items="obItems"
        :total="obMeta.total"
        :loading="obLoading"
        :per-page="obMeta.per_page"
        :page="obMeta.current_page"
        class="mt-2"
        @update:options="onObTableOptions"
      >
        <template #item.no="{ index }">
          {{ (obMeta.current_page - 1) * obMeta.per_page + index + 1 }}
        </template>
        <template #item.no_invoice="{ item }">
          <VChip
            color="primary"
            size="small"
            variant="tonal"
            label
          >
            {{ item.no_invoice }}
          </VChip>
        </template>
        <template #item.klien_ar="{ item }">
          {{ item.klien_ar?.nama_klien ?? '-' }}
        </template>
        <template #item.tanggal_invoice="{ item }">
          {{ formatDate(item.tanggal_invoice) }}
        </template>
        <template #item.total_tagihan="{ item }">
          {{ formatCurrency(item.total_tagihan) }}
        </template>
        <template #item.total_pembayaran="{ item }">
          {{ formatCurrency(item.total_pembayaran) }}
        </template>
        <template #item.sisa_tagihan="{ item }">
          <span :class="item.sisa_tagihan > 0 ? 'text-error' : 'text-success'">
            {{ formatCurrency(item.sisa_tagihan) }}
          </span>
        </template>
        <template #item.status="{ item }">
          <InvoiceStatusBadge :status="item.status" />
        </template>
        <template #item.ob_approval_status="{ item }">
          <ApprovalStatusBadge :status="item.approval_status" />
        </template>
        <template #item.ob_actions="{ item }">
          <div class="d-flex gap-1">
            <VBtn
              v-if="item.can_record_payment && item.status !== 'LUNAS'"
              icon
              size="small"
              variant="tonal"
              color="success"
              @click="openCatatBayar(item)"
            >
              <VIcon
                icon="ri-money-cny-circle-line"
                size="18"
              />
              <VTooltip activator="parent">
                Catat Bayar
              </VTooltip>
            </VBtn>
            <VBtn
              v-if="item.can_print"
              icon
              size="small"
              variant="text"
              color="secondary"
              @click="printInvoice(item.id)"
            >
              <VIcon
                icon="ri-printer-line"
                size="18"
              />
              <VTooltip activator="parent">
                Cetak
              </VTooltip>
            </VBtn>
            <VBtn
              icon
              size="small"
              variant="text"
              color="info"
              :to="{ name: 'finance-invoice-show', params: { id: item.id } }"
            >
              <VIcon
                icon="ri-eye-line"
                size="18"
              />
              <VTooltip activator="parent">
                Detail
              </VTooltip>
            </VBtn>
          </div>
        </template>
      </BaseTable>
    </VCard>

    <!-- Catat Bayar Modal -->
    <PembayaranForm
      v-if="selectedForPayment"
      v-model="showPembayaran"
      :invoice-id="selectedForPayment.id"
      :sisa-tagihan="selectedForPayment.sisa_tagihan"
      :is-opening-balance="true"
      @saved="onPembayaranSaved"
    />
  </div>
</template>

<script setup>
/* eslint-disable camelcase */
import { defineAsyncComponent, onBeforeUnmount, onDeactivated, onMounted, reactive, ref } from 'vue'
import { useCrud } from '@/composables/useCrud'
import { useRemoteSearch } from '@/composables/useRemoteSearch'
import { useFormatter } from '@/composables/useFormatter'
import { useSweetAlert } from '@/composables/useSweetAlert'
import api from '@/utils/axios'
import { readBlobError } from '@/utils/readBlobError'
import { useAuthStore } from '@/stores/auth.store'
import { useFinanceNotificationStore } from '@/stores/finance-notification.store'
import ApprovalStatusBadge from '@/modules/Finance/shared/components/ApprovalStatusBadge.vue'
import InvoiceStatusBadge from '@/modules/Finance/shared/components/InvoiceStatusBadge.vue'

const PembayaranForm = defineAsyncComponent(() => import('@/modules/Finance/shared/components/PembayaranForm.vue'))

const { items, loading, meta, params, fetchList } = useCrud('/finance/opening-balance')
const { items: klienList, loading: klienLoading, search: searchKlien, searchNow: searchKlienNow } = useRemoteSearch('/finance/klien-ar')
const { items: obItems, loading: obLoading, meta: obMeta, params: obParams, fetchList: fetchObList } = useCrud('/finance/opening-balance')
const { items: obItemsB2B, loading: obLoadingB2B, meta: obMetaB2B, params: obParamsB2B, fetchList: fetchObListB2B } = useCrud('/finance/opening-balance')
const { formatCurrency, formatDate } = useFormatter()
const { showAlert, showSuccess, showError } = useSweetAlert()
const authStore = useAuthStore()
const financeNotificationStore = useFinanceNotificationStore()

const canApproveOpeningBalance = authStore.canApproveOpeningBalance
const approvingId = ref(null)

// ── Approval table params ──────────────────────────────────────────────────
params.approval_status = 'PENDING'
params.klien_ar_id = null
params.periode_bulan = null
params.periode_tahun = null

// ── OB list table params ───────────────────────────────────────────────────
obParams.status = ''
obParams.approval_status = 'APPROVED'
obParams.klien_ar_id = null
obParams.periode_bulan = null
obParams.periode_tahun = null
obParams.segment = 'B2C'

obParamsB2B.status = ''
obParamsB2B.approval_status = 'APPROVED'
obParamsB2B.klien_ar_id = null
obParamsB2B.periode_bulan = null
obParamsB2B.periode_tahun = null
obParamsB2B.segment = 'B2B'

// ── Summaries ──────────────────────────────────────────────────────────────
const summary = reactive({
  total_invoice: null,
  total_tagihan: null,
  total_pembayaran: null,
  total_sisa: null,
})

const obSummary = reactive({
  total_invoice: null,
  total_tagihan: null,
  total_pembayaran: null,
  total_sisa: null,
})

// ── Catat Bayar state ──────────────────────────────────────────────────────
const showPembayaran     = ref(false)
const selectedForPayment = ref(null)

function openCatatBayar(item) {
  selectedForPayment.value = item
  showPembayaran.value     = true
}

function onPembayaranSaved() {
  loadObList()
  loadObListB2B()
  loadObSummary()
}

// ── Export ─────────────────────────────────────────────────────────────────
const isExporting    = ref(false)
const isExportingB2B = ref(false)

async function exportExcel() {
  isExporting.value = true
  try {
    const res = await api.get('/finance/opening-balance/export', {
      params: {
        search:          obParams.search          || undefined,
        status:          obParams.status          || undefined,
        approval_status: obParams.approval_status || undefined,
        klien_ar_id:     obParams.klien_ar_id     || undefined,
        periode_bulan:   obParams.periode_bulan   || undefined,
        periode_tahun:   obParams.periode_tahun   || undefined,
        segment:         'B2C',
      },
      responseType: 'blob',
    })
    const url  = URL.createObjectURL(res.data)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `Data Opening Balance B2C-${new Date().toISOString().slice(0, 10)}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    window.alert('Gagal mengunduh data export.')
  } finally {
    isExporting.value = false
  }
}

async function exportExcelB2B() {
  isExportingB2B.value = true
  try {
    const res = await api.get('/finance/opening-balance/export', {
      params: {
        search:          obParamsB2B.search          || undefined,
        status:          obParamsB2B.status          || undefined,
        approval_status: obParamsB2B.approval_status || undefined,
        klien_ar_id:     obParamsB2B.klien_ar_id     || undefined,
        periode_bulan:   obParamsB2B.periode_bulan   || undefined,
        periode_tahun:   obParamsB2B.periode_tahun   || undefined,
        segment:         'B2B',
      },
      responseType: 'blob',
    })
    const url  = URL.createObjectURL(res.data)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `Data Opening Balance B2B-${new Date().toISOString().slice(0, 10)}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    window.alert('Gagal mengunduh data export.')
  } finally {
    isExportingB2B.value = false
  }
}

// ── Print ──────────────────────────────────────────────────────────────────
async function printInvoice(id) {
  try {
    const res = await api.get(`/finance/invoices/${id}/print`, { responseType: 'blob', timeout: 300000 })
    const blobUrl = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
    window.open(blobUrl, '_blank')
    setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000)
  } catch (err) {
    showError(await readBlobError(err, 'Gagal membuka dokumen cetak'))
  }
}

// ── Table headers ──────────────────────────────────────────────────────────
const headers = [
  { title: 'No', key: 'no', sortable: false, width: '60px' },
  { title: 'No Opening Balance', key: 'no_invoice', sortable: false },
  { title: 'Klien', key: 'klien_ar', sortable: false },
  { title: 'Entitas', key: 'perusahaan', sortable: false },
  { title: 'Tanggal', key: 'tanggal_invoice', sortable: false },
  { title: 'Nominal', key: 'total_tagihan', sortable: false },
  { title: 'Pengaju', key: 'submitted_by_name', sortable: false },
  { title: 'Diajukan Pada', key: 'submitted_at', sortable: false },
  { title: 'Approval', key: 'approval_status', sortable: false },
  { title: 'Aksi', key: 'actions', sortable: false, align: 'center', width: '100px' },
]

const obHeaders = [
  { title: 'No', key: 'no', sortable: false, width: '60px' },
  { title: 'No Opening Balance', key: 'no_invoice', sortable: false },
  { title: 'Klien', key: 'klien_ar', sortable: false },
  { title: 'Tanggal', key: 'tanggal_invoice', sortable: false },
  { title: 'Saldo Awal', key: 'total_tagihan', sortable: false },
  { title: 'Total Terbayar', key: 'total_pembayaran', sortable: false },
  { title: 'Sisa Tagihan', key: 'sisa_tagihan', sortable: false },
  { title: 'Status', key: 'status', sortable: false },
  { title: 'Approval', key: 'ob_approval_status', sortable: false },
  { title: 'Aksi', key: 'ob_actions', sortable: false, align: 'center', width: '120px' },
]

const obHeadersB2B = [
  { title: 'No', key: 'no', sortable: false, width: '60px' },
  { title: 'No Opening Balance', key: 'no_invoice', sortable: false },
  { title: 'Klien', key: 'klien_ar', sortable: false },
  { title: 'Tanggal', key: 'tanggal_invoice', sortable: false },
  { title: 'Saldo Awal', key: 'total_tagihan', sortable: false },
  { title: 'Total Terbayar', key: 'total_pembayaran', sortable: false },
  { title: 'Sisa Tagihan', key: 'sisa_tagihan', sortable: false },
  { title: 'Status', key: 'status', sortable: false },
  { title: 'Approval', key: 'ob_b2b_approval_status', sortable: false },
  { title: 'Aksi', key: 'ob_b2b_actions', sortable: false, align: 'center', width: '120px' },
]

const statusOptions = [
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Terkirim', value: 'TERKIRIM' },
  { label: 'Sebagian', value: 'SEBAGIAN' },
  { label: 'Lunas', value: 'LUNAS' },
]

const approvalStatusOptions = [
  { label: 'Menunggu Persetujuan', value: 'PENDING' },
  { label: 'Disetujui', value: 'APPROVED' },
  { label: 'Ditolak', value: 'REJECTED' },
]

const bulanOptions = [
  { label: 'Januari', value: 1 },
  { label: 'Februari', value: 2 },
  { label: 'Maret', value: 3 },
  { label: 'April', value: 4 },
  { label: 'Mei', value: 5 },
  { label: 'Juni', value: 6 },
  { label: 'Juli', value: 7 },
  { label: 'Agustus', value: 8 },
  { label: 'September', value: 9 },
  { label: 'Oktober', value: 10 },
  { label: 'November', value: 11 },
  { label: 'Desember', value: 12 },
]

// ── Abort controllers ──────────────────────────────────────────────────────
let listController      = null
let summaryController   = null
let obListController    = null
let obListB2BController = null
let obSummaryController = null

function clearDebounceTimer() {
  clearTimeout(debounceTimer)
  debounceTimer = null
}

function clearObDebounceTimer() {
  clearTimeout(obDebounceTimer)
  obDebounceTimer = null
}

function clearObDebounceTimerB2B() {
  clearTimeout(obDebounceTimerB2B)
  obDebounceTimerB2B = null
}

function abortPendingRequests() {
  listController?.abort()
  summaryController?.abort()
  obListController?.abort()
  obListB2BController?.abort()
  obSummaryController?.abort()
  listController      = null
  summaryController   = null
  obListController    = null
  obListB2BController = null
  obSummaryController = null
}

// ── Loaders: approval table ────────────────────────────────────────────────
async function loadList() {
  listController?.abort()
  const controller = new AbortController()
  listController = controller
  await fetchList({}, { signal: controller.signal })
  if (listController === controller) listController = null
}

async function loadSummary() {
  summaryController?.abort()
  const controller = new AbortController()
  summaryController = controller
  try {
    const { data } = await api.get('/finance/opening-balance/summary', {
      params: {
        search:          params.search,
        approval_status: params.approval_status,
        klien_ar_id:     params.klien_ar_id,
        periode_bulan:   params.periode_bulan,
        periode_tahun:   params.periode_tahun,
      },
      signal: controller.signal,
    })
    if (controller.signal.aborted) return
    Object.assign(summary, data.data)
  } catch (err) {
    if (err.code === 'ERR_CANCELED') return
  } finally {
    if (summaryController === controller) summaryController = null
  }
}

// ── Loaders: OB list table ─────────────────────────────────────────────────
async function loadObList() {
  obListController?.abort()
  const controller = new AbortController()
  obListController = controller
  await fetchObList({}, { signal: controller.signal })
  if (obListController === controller) obListController = null
}

async function loadObListB2B() {
  obListB2BController?.abort()
  const controller = new AbortController()
  obListB2BController = controller
  await fetchObListB2B({}, { signal: controller.signal })
  if (obListB2BController === controller) obListB2BController = null
}

async function loadObSummary() {
  obSummaryController?.abort()
  const controller = new AbortController()
  obSummaryController = controller
  try {
    const { data } = await api.get('/finance/opening-balance/summary', {
      params: {
        search:          obParams.search,
        status:          obParams.status,
        approval_status: obParams.approval_status,
        klien_ar_id:     obParams.klien_ar_id,
        periode_bulan:   obParams.periode_bulan,
        periode_tahun:   obParams.periode_tahun,
      },
      signal: controller.signal,
    })
    if (controller.signal.aborted) return
    Object.assign(obSummary, data.data)
  } catch (err) {
    if (err.code === 'ERR_CANCELED') return
  } finally {
    if (obSummaryController === controller) obSummaryController = null
  }
}

// ── Fetch helpers: approval table ──────────────────────────────────────────
function doFetch() {
  params.page = 1
  loadList()
  loadSummary()
}

let debounceTimer = null
function debouncedFetch() {
  clearDebounceTimer()
  debounceTimer = setTimeout(doFetch, 400)
}

function onTableOptions({ page, itemsPerPage }) {
  params.page = page
  params.per_page = itemsPerPage
  loadList()
}

// ── Fetch helpers: OB list table ───────────────────────────────────────────
function doObFetch() {
  obParams.page = 1
  loadObList()
  loadObSummary()
}

let obDebounceTimer = null
function debouncedObFetch() {
  clearObDebounceTimer()
  obDebounceTimer = setTimeout(doObFetch, 400)
}

function onObTableOptions({ page, itemsPerPage }) {
  obParams.page = page
  obParams.per_page = itemsPerPage
  loadObList()
}

function doObFetchB2B() {
  obParamsB2B.page = 1
  loadObListB2B()
}

let obDebounceTimerB2B = null
function debouncedObFetchB2B() {
  clearObDebounceTimerB2B()
  obDebounceTimerB2B = setTimeout(doObFetchB2B, 400)
}

function onObTableOptionsB2B({ page, itemsPerPage }) {
  obParamsB2B.page = page
  obParamsB2B.per_page = itemsPerPage
  loadObListB2B()
}

function resetObFiltersB2B() {
  obParamsB2B.search = ''
  obParamsB2B.status = ''
  obParamsB2B.approval_status = 'APPROVED'
  obParamsB2B.klien_ar_id = null
  obParamsB2B.periode_bulan = null
  obParamsB2B.periode_tahun = null
  doObFetchB2B()
}

function resetObFiltersB2C() {
  obParams.search = ''
  obParams.status = ''
  obParams.approval_status = 'APPROVED'
  obParams.klien_ar_id = null
  obParams.periode_bulan = null
  obParams.periode_tahun = null
  doObFetch()
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

// ── Approve action ─────────────────────────────────────────────────────────
async function confirmApprove(item) {
  const result = await showAlert({
    icon: 'question',
    title: 'Approve Opening Balance?',
    text: `Anda akan menyetujui Opening Balance ${item.no_invoice} atas nama ${item.klien_ar?.nama_klien ?? '-'}.`,
    confirmButtonText: 'Ya, Approve',
    cancelButtonText: 'Batal',
    showCancelButton: true,
    focusCancel: true,
    reverseButtons: true,
  })

  if (!result.isConfirmed) return

  approvingId.value = item.id
  try {
    await api.patch(`/finance/opening-balance/${item.id}/approve`, { note: null })
    await showSuccess({ text: `Opening Balance ${item.no_invoice} berhasil disetujui.` })
    doFetch()
    loadObList()
    loadObSummary()
    financeNotificationStore.fetchPendingOpeningBalanceCount()
  } catch (err) {
    const message = err?.response?.data?.message ?? 'Gagal menyetujui Opening Balance.'
    showError({ text: message })
  } finally {
    approvingId.value = null
  }
}

// ── Lifecycle ──────────────────────────────────────────────────────────────
onMounted(() => {
  loadList()
  loadSummary()
  loadObList()
  loadObListB2B()
  loadObSummary()
})

onDeactivated(() => {
  clearDebounceTimer()
  clearObDebounceTimer()
  clearObDebounceTimerB2B()
  abortPendingRequests()
})

onBeforeUnmount(() => {
  clearDebounceTimer()
  clearObDebounceTimer()
  clearObDebounceTimerB2B()
  abortPendingRequests()
})
</script>
