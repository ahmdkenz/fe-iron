<template>
  <div>
    <PageHeader
      title="Invoice AR"
      subtitle="Kelola tagihan Account Receivable"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Invoice', disabled: true }
      ]"
    >
      <div class="d-flex gap-2 justify-end w-100">
        <template v-if="!xs">
          <VBtn
            color="primary"
            prepend-icon="ri-file-excel-line"
            :loading="exportingExcel"
            @click="showExportModal = true"
          >
            Export
          </VBtn>
          <VBtn
            color="primary"
            prepend-icon="ri-add-line"
            :to="{ name: 'finance-invoice-create' }"
          >
            Buat Invoice
          </VBtn>
        </template>
        <template v-else>
          <VBtn
            icon
            color="primary"
            size="small"
            :loading="exportingExcel"
            aria-label="Export"
            @click="showExportModal = true"
          >
            <VIcon icon="ri-file-excel-line" />
            <VTooltip
              activator="parent"
              location="bottom"
            >
              Export
            </VTooltip>
          </VBtn>
          <VBtn
            icon
            color="primary"
            size="small"
            aria-label="Buat Invoice"
            :to="{ name: 'finance-invoice-create' }"
          >
            <VIcon icon="ri-add-line" />
            <VTooltip
              activator="parent"
              location="bottom"
            >
              Buat Invoice
            </VTooltip>
          </VBtn>
        </template>
      </div>
    </PageHeader>

    <!-- Summary Cards -->
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
                <VIcon icon="ri-file-list-3-line" />
              </VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">
                  Total Invoice
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
                color="warning"
                variant="tonal"
                size="44"
              >
                <VIcon icon="ri-bill-line" />
              </VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">
                  Total Tagihan
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
                <VIcon icon="ri-money-cny-circle-line" />
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

    <!-- Tab Selector B2B/B2C (hanya untuk admin/manager/supervisor) -->
    <VTabs v-if="canSeeAll" :model-value="activeSegmentTab" class="mb-4" @update:model-value="onSegmentTabChange">
      <VTab value="b2b">Invoice B2B</VTab>
      <VTab value="b2c">Invoice B2C</VTab>
    </VTabs>

    <!-- B2B Table (hanya untuk admin/manager/supervisor) -->
    <VCard v-if="canSeeAll && activeSegmentTab === 'b2b'" class="mb-4">
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
          <span class="text-subtitle-1 font-weight-semibold">Invoice B2B</span>
        </div>
        <VBtn
          variant="text"
          color="secondary"
          size="small"
          prepend-icon="ri-refresh-line"
          @click="resetFiltersB2B"
        >
          Reset
        </VBtn>
      </div>
      <VDivider />
      <div class="d-flex flex-wrap align-center gap-4 px-4 py-3">
        <div style="min-width: 200px; flex: 1; max-width: 280px;">
          <div class="text-caption text-medium-emphasis mb-2">Pencarian</div>
          <VTextField
            v-model="filtersB2B.search"
            placeholder="Cari no. invoice / klien..."
            clearable
            hide-details
            density="compact"
            prepend-inner-icon="ri-search-line"
            @update:model-value="debouncedFetchB2B"
          />
        </div>
        <VDivider vertical style="height: 40px; align-self: flex-end;" class="d-none d-sm-block" />
        <div>
          <div class="text-caption text-medium-emphasis mb-2">Dari</div>
          <VTextField
            v-model="dateFiltersB2B.tanggal_dari"
            type="date"
            hide-details
            density="compact"
            style="min-width: 150px; max-width: 170px;"
          />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">Sampai</div>
          <VTextField
            v-model="dateFiltersB2B.tanggal_sampai"
            type="date"
            hide-details
            density="compact"
            style="min-width: 150px; max-width: 170px;"
          />
        </div>
        <VBtn
          color="primary"
          variant="tonal"
          size="small"
          prepend-icon="ri-filter-3-line"
          style="align-self: flex-end;"
          @click="applyDateFiltersB2B"
        >
          Filter
        </VBtn>
      </div>
      <VDivider />
      <BaseTable
        :headers="headersB2B"
        :items="itemsB2B"
        :total="metaB2B.total"
        :loading="loadingB2B"
        :per-page="metaB2B.per_page"
        :page="metaB2B.current_page"
        show-select
        v-model:selected="selectedInvoices"
        mobile-cards
        mobile-menu-select
        column-resize-key="finance-invoice-b2b"
        @update:options="onTableOptionsB2B"
      >
        <template #mobile-card="{ item, selected, toggle }">
          <div class="d-flex align-center justify-space-between gap-2 mb-2">
            <div class="min-width-0">
              <div class="d-flex align-center gap-1">
                <VChip
                  color="primary"
                  size="small"
                  variant="tonal"
                  label
                >
                  {{ item.no_invoice }}
                </VChip>
                <VIcon
                  v-if="item.is_eb_locked"
                  icon="ri-lock-line"
                  size="14"
                  color="warning"
                />
              </div>
              <div class="text-caption text-medium-emphasis text-truncate mt-1">
                {{ item.klien_ar?.nama_klien ?? '-' }}
              </div>
            </div>
            <InvoiceStatusBadge :status="item.status" />
          </div>
          <div class="d-flex align-end justify-space-between gap-2">
            <div class="min-width-0">
              <div class="text-caption text-medium-emphasis">
                {{ formatDate(item.tanggal_invoice) }} · Total {{ formatCurrency(item.subtotal) }}
              </div>
              <div
                class="font-weight-bold"
                :class="Math.max(0, item.subtotal - item.total_pembayaran - (item.total_penyesuaian ?? 0)) > 0 ? 'text-error' : 'text-success'"
              >
                Sisa: {{ formatCurrency(Math.max(0, item.subtotal - item.total_pembayaran - (item.total_penyesuaian ?? 0))) }}
              </div>
            </div>
            <div class="d-flex align-center gap-1 flex-shrink-0">
              <VBtn
                v-if="item.can_record_payment && item.status !== 'LUNAS'"
                icon="ri-money-cny-circle-line"
                size="small"
                variant="tonal"
                color="success"
                aria-label="Catat Bayar"
                @click="openCatatBayar(item)"
              />
              <MobileCardActions
                :selected="selected"
                :editable="item.status === 'DRAFT' && !item.is_eb_locked"
                :deletable="item.status === 'DRAFT' && !item.is_eb_locked"
                @detail="router.push({ name: 'finance-invoice-show', params: { id: item.id } })"
                @edit="router.push({ name: 'finance-invoice-edit', params: { id: item.id } })"
                @delete="confirmDelete(item)"
                @toggle-select="toggle"
              >
                <template #menu-extra>
                  <template v-if="item.can_print">
                    <VDivider class="my-1" />
                    <VListItem
                      prepend-icon="ri-whatsapp-line"
                      title="Kirim WhatsApp"
                      @click="openShareDialog([item])"
                    />
                    <VListItem
                      prepend-icon="ri-printer-line"
                      title="Cetak Invoice"
                      @click="printInvoice(item)"
                    />
                  </template>
                </template>
              </MobileCardActions>
            </div>
          </div>
        </template>

        <template #item.no="{ index }">
          {{ (metaB2B.current_page - 1) * metaB2B.per_page + index + 1 }}
        </template>
        <template #item.no_invoice="{ item }">
          <div class="d-flex align-center gap-1">
            <VChip
              color="primary"
              size="small"
              variant="tonal"
              label
            >
              {{ item.no_invoice }}
            </VChip>
            <VIcon
              v-if="item.is_eb_locked"
              icon="ri-lock-line"
              size="14"
              color="warning"
            >
              <VTooltip activator="parent">Periode invoice ini sudah dikunci di Ending Balance â€” tidak dapat diedit/dihapus</VTooltip>
            </VIcon>
          </div>
        </template>
        <template #item.klien_ar="{ item }">
          {{ item.klien_ar?.nama_klien ?? '-' }}
        </template>
        <template #item.tanggal_invoice="{ item }">
          <span class="text-no-wrap">{{ formatDate(item.tanggal_invoice) }}</span>
        </template>
        <template #item.subtotal="{ item }">
          {{ formatCurrency(item.subtotal) }}
        </template>
        <template #item.sisa_tagihan="{ item }">
          <span :class="Math.max(0, item.subtotal - item.total_pembayaran - (item.total_penyesuaian ?? 0)) > 0 ? 'text-error' : 'text-success'">
            {{ formatCurrency(Math.max(0, item.subtotal - item.total_pembayaran - (item.total_penyesuaian ?? 0))) }}
          </span>
        </template>
        <template #item.status="{ item }">
          <InvoiceStatusBadge :status="item.status" />
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <VBtn
              v-if="item.can_record_payment && item.status !== 'LUNAS'"
              icon
              size="small"
              variant="tonal"
              color="success"
              @click="openCatatBayar(item)"
            >
              <VIcon icon="ri-money-cny-circle-line" size="18" />
              <VTooltip activator="parent">Catat Bayar</VTooltip>
            </VBtn>
            <VBtn
              v-if="item.can_print"
              icon
              size="small"
              variant="tonal"
              color="success"
              @click="openShareDialog([item])"
            >
              <VIcon icon="ri-whatsapp-line" size="18" />
              <VTooltip activator="parent">Kirim via WhatsApp</VTooltip>
            </VBtn>
            <VBtn
              icon
              size="small"
              variant="text"
              color="info"
              :to="{ name: 'finance-invoice-show', params: { id: item.id } }"
            >
              <VIcon icon="ri-eye-line" size="18" />
              <VTooltip activator="parent">Detail</VTooltip>
            </VBtn>
            <VBtn
              v-if="item.status === 'DRAFT' && !item.is_eb_locked"
              icon
              size="small"
              variant="text"
              color="primary"
              :to="{ name: 'finance-invoice-edit', params: { id: item.id } }"
            >
              <VIcon icon="ri-pencil-line" size="18" />
              <VTooltip activator="parent">Edit</VTooltip>
            </VBtn>
            <VBtn
              v-if="item.can_print"
              icon
              size="small"
              variant="text"
              color="secondary"
              :loading="printingId === item.id"
              @click="printInvoice(item)"
            >
              <VIcon icon="ri-printer-line" size="18" />
              <VTooltip activator="parent">Cetak Invoice</VTooltip>
            </VBtn>
            <VBtn
              v-if="item.status === 'DRAFT' && !item.is_eb_locked"
              icon
              size="small"
              variant="text"
              color="error"
              @click="confirmDelete(item)"
            >
              <VIcon icon="ri-delete-bin-line" size="18" />
              <VTooltip activator="parent">Hapus</VTooltip>
            </VBtn>
          </div>
        </template>
      </BaseTable>
    </VCard>

    <!-- B2C Table -->
    <VCard v-if="!canSeeAll || activeSegmentTab === 'b2c'">
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
          <span class="text-subtitle-1 font-weight-semibold">{{ invoiceB2CTableTitle }}</span>
        </div>
        <VBtn
          variant="text"
          color="secondary"
          size="small"
          prepend-icon="ri-refresh-line"
          @click="resetFiltersB2C"
        >
          Reset
        </VBtn>
      </div>
      <VDivider />
      <div class="d-flex flex-wrap align-center gap-4 px-4 py-3">
        <div style="min-width: 200px; flex: 1; max-width: 280px;">
          <div class="text-caption text-medium-emphasis mb-2">Pencarian</div>
          <VTextField
            v-model="filtersB2C.search"
            placeholder="Cari no. invoice / klien..."
            clearable
            hide-details
            density="compact"
            prepend-inner-icon="ri-search-line"
            @update:model-value="debouncedFetchB2C"
          />
        </div>
        <VDivider vertical style="height: 40px; align-self: flex-end;" class="d-none d-sm-block" />
        <div>
          <div class="text-caption text-medium-emphasis mb-2">Dari</div>
          <VTextField
            v-model="dateFiltersB2C.tanggal_dari"
            type="date"
            hide-details
            density="compact"
            style="min-width: 150px; max-width: 170px;"
          />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">Sampai</div>
          <VTextField
            v-model="dateFiltersB2C.tanggal_sampai"
            type="date"
            hide-details
            density="compact"
            style="min-width: 150px; max-width: 170px;"
          />
        </div>
        <VBtn
          color="primary"
          variant="tonal"
          size="small"
          prepend-icon="ri-filter-3-line"
          style="align-self: flex-end;"
          @click="applyDateFiltersB2C"
        >
          Filter
        </VBtn>
      </div>
      <VDivider />
      <BaseTable
        :headers="headers"
        :items="itemsB2C"
        :total="metaB2C.total"
        :loading="loadingB2C"
        :per-page="metaB2C.per_page"
        :page="metaB2C.current_page"
        show-select
        v-model:selected="selectedInvoices"
        mobile-cards
        mobile-menu-select
        column-resize-key="finance-invoice-b2c"
        @update:options="onTableOptionsB2C"
      >
        <template #mobile-card="{ item, selected, toggle }">
          <div class="d-flex align-center justify-space-between gap-2 mb-2">
            <div class="min-width-0">
              <div class="d-flex align-center gap-1">
                <VChip
                  color="primary"
                  size="small"
                  variant="tonal"
                  label
                >
                  {{ item.no_invoice }}
                </VChip>
                <VIcon
                  v-if="item.is_eb_locked"
                  icon="ri-lock-line"
                  size="14"
                  color="warning"
                />
              </div>
              <div class="text-caption text-medium-emphasis text-truncate mt-1">
                {{ item.klien_ar?.nama_klien ?? '-' }}
              </div>
              <div
                v-if="item.resto"
                class="text-caption text-medium-emphasis text-truncate"
              >
                {{ item.resto?.nama_resto }}
              </div>
            </div>
            <InvoiceStatusBadge :status="item.status" />
          </div>
          <div class="d-flex align-end justify-space-between gap-2">
            <div class="min-width-0">
              <div class="text-caption text-medium-emphasis">
                {{ formatDate(item.tanggal_invoice) }} · Total {{ formatCurrency(item.subtotal) }}
              </div>
              <div
                class="font-weight-bold"
                :class="Math.max(0, item.subtotal - item.total_pembayaran - (item.total_penyesuaian ?? 0)) > 0 ? 'text-error' : 'text-success'"
              >
                Sisa: {{ formatCurrency(Math.max(0, item.subtotal - item.total_pembayaran - (item.total_penyesuaian ?? 0))) }}
              </div>
            </div>
            <div class="d-flex align-center gap-1 flex-shrink-0">
              <VBtn
                v-if="item.can_record_payment && item.status !== 'LUNAS'"
                icon="ri-money-cny-circle-line"
                size="small"
                variant="tonal"
                color="success"
                aria-label="Catat Bayar"
                @click="openCatatBayar(item)"
              />
              <MobileCardActions
                :selected="selected"
                :editable="item.status === 'DRAFT' && !item.is_eb_locked"
                :deletable="item.status === 'DRAFT' && !item.is_eb_locked"
                @detail="router.push({ name: 'finance-invoice-show', params: { id: item.id } })"
                @edit="router.push({ name: 'finance-invoice-edit', params: { id: item.id } })"
                @delete="confirmDelete(item)"
                @toggle-select="toggle"
              >
                <template #menu-extra>
                  <template v-if="item.can_print">
                    <VDivider class="my-1" />
                    <VListItem
                      prepend-icon="ri-whatsapp-line"
                      title="Kirim WhatsApp"
                      @click="openShareDialog([item])"
                    />
                    <VListItem
                      prepend-icon="ri-printer-line"
                      title="Cetak Invoice"
                      @click="printInvoice(item)"
                    />
                  </template>
                </template>
              </MobileCardActions>
            </div>
          </div>
        </template>

        <template #item.no="{ index }">
          {{ (metaB2C.current_page - 1) * metaB2C.per_page + index + 1 }}
        </template>
        <template #item.no_invoice="{ item }">
          <div class="d-flex align-center gap-1">
            <VChip
              color="primary"
              size="small"
              variant="tonal"
              label
            >
              {{ item.no_invoice }}
            </VChip>
            <VIcon
              v-if="item.is_eb_locked"
              icon="ri-lock-line"
              size="14"
              color="warning"
            >
              <VTooltip activator="parent">Periode invoice ini sudah dikunci di Ending Balance â€” tidak dapat diedit/dihapus</VTooltip>
            </VIcon>
          </div>
        </template>
        <template #item.klien_ar="{ item }">
          {{ item.klien_ar?.nama_klien ?? '-' }}
        </template>
        <template #item.outlet="{ item }">
          {{ item.resto?.nama_resto ?? '-' }}
        </template>
        <template #item.tanggal_invoice="{ item }">
          <span class="text-no-wrap">{{ formatDate(item.tanggal_invoice) }}</span>
        </template>
        <template #item.subtotal="{ item }">
          {{ formatCurrency(item.subtotal) }}
        </template>
        <template #item.sisa_tagihan="{ item }">
          <span :class="Math.max(0, item.subtotal - item.total_pembayaran - (item.total_penyesuaian ?? 0)) > 0 ? 'text-error' : 'text-success'">
            {{ formatCurrency(Math.max(0, item.subtotal - item.total_pembayaran - (item.total_penyesuaian ?? 0))) }}
          </span>
        </template>
        <template #item.status="{ item }">
          <InvoiceStatusBadge :status="item.status" />
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <VBtn
              v-if="item.can_record_payment && item.status !== 'LUNAS'"
              icon
              size="small"
              variant="tonal"
              color="success"
              @click="openCatatBayar(item)"
            >
              <VIcon icon="ri-money-cny-circle-line" size="18" />
              <VTooltip activator="parent">Catat Bayar</VTooltip>
            </VBtn>
            <VBtn
              v-if="item.can_print"
              icon
              size="small"
              variant="tonal"
              color="success"
              @click="openShareDialog([item])"
            >
              <VIcon icon="ri-whatsapp-line" size="18" />
              <VTooltip activator="parent">Kirim via WhatsApp</VTooltip>
            </VBtn>
            <VBtn
              icon
              size="small"
              variant="text"
              color="info"
              :to="{ name: 'finance-invoice-show', params: { id: item.id } }"
            >
              <VIcon icon="ri-eye-line" size="18" />
              <VTooltip activator="parent">Detail</VTooltip>
            </VBtn>
            <VBtn
              v-if="item.status === 'DRAFT' && !item.is_eb_locked"
              icon
              size="small"
              variant="text"
              color="primary"
              :to="{ name: 'finance-invoice-edit', params: { id: item.id } }"
            >
              <VIcon icon="ri-pencil-line" size="18" />
              <VTooltip activator="parent">Edit</VTooltip>
            </VBtn>
            <VBtn
              v-if="item.can_print"
              icon
              size="small"
              variant="text"
              color="secondary"
              :loading="printingId === item.id"
              @click="printInvoice(item)"
            >
              <VIcon icon="ri-printer-line" size="18" />
              <VTooltip activator="parent">Cetak Invoice</VTooltip>
            </VBtn>
            <VBtn
              v-if="item.status === 'DRAFT' && !item.is_eb_locked"
              icon
              size="small"
              variant="text"
              color="error"
              @click="confirmDelete(item)"
            >
              <VIcon icon="ri-delete-bin-line" size="18" />
              <VTooltip activator="parent">Hapus</VTooltip>
            </VBtn>
          </div>
        </template>
      </BaseTable>
    </VCard>

    <!-- Confirm Delete -->
    <BaseModal
      v-if="showDelete"
      v-model="showDelete"
      title="Hapus Invoice"
      :loading="loadingB2C"
      confirm-action="hapus"
      @confirm="doDelete"
    >
      <p>
        Apakah Anda yakin ingin menghapus invoice
        <strong>{{ selectedInvoice?.no_invoice }}</strong>?
      </p>
      <VAlert
        v-if="deleteError"
        type="error"
        variant="tonal"
        class="mt-3"
      >
        {{ deleteError }}
      </VAlert>
    </BaseModal>

    <!-- Export Modal -->
    <BaseModal
      v-if="showExportModal"
      v-model="showExportModal"
      title="Export Invoice"
      confirm-label="Export"
      @confirm="exportExcel"
    >
      <VTextField
        v-model="exportMonth"
        type="month"
        label="Pilih Bulan"
        variant="outlined"
        density="compact"
      />
    </BaseModal>

    <!-- Catat Bayar Modal -->
    <PembayaranForm
      v-if="selectedForPayment"
      v-model="showPembayaran"
      :invoice-id="selectedForPayment.id"
      :sisa-tagihan="Math.max(0, selectedForPayment.subtotal - selectedForPayment.total_pembayaran - (selectedForPayment.total_penyesuaian ?? 0))"
      @saved="onPembayaranSaved"
    />

    <!-- Bulk Action Bar -->
    <BulkActionBar
      :selected="selectedInvoices"
      @share="openShareDialog(selectedInvoices)"
      @delete="doBulkDelete"
      @clear="selectedInvoices = []"
    />

    <!-- Share Dialog -->
    <ShareInvoicesDialog
      v-model="showShareDialog"
      :pre-selected="shareTargetInvoices"
    />
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'

function getDefaultMonthRange() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate()
  return {
    tanggal_dari:   `${year}-${month}-01`,
    tanggal_sampai: `${year}-${month}-${String(lastDay).padStart(2, '0')}`,
  }
}
import { useSweetAlert } from '@/composables/useSweetAlert'
import { useCrud } from '@/composables/useCrud.js'
import { useFormatter } from '@/composables/useFormatter.js'
import { useAuthStore } from '@/stores/auth.store'
import api from '@/utils/axios.js'
import { readBlobError } from '@/utils/readBlobError.js'
import { openLoadingPrintTab, openPrintTab } from '@/utils/printWindow.js'
import InvoiceStatusBadge from '@/modules/Finance/shared/components/InvoiceStatusBadge.vue'
import ShareInvoicesDialog from '@/modules/Finance/shared/components/ShareInvoicesDialog.vue'
import BulkActionBar from '@/modules/Finance/shared/components/BulkActionBar.vue'
import MobileCardActions from '@/components/shared/MobileCardActions.vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'

const PembayaranForm = defineAsyncComponent(() => import('@/modules/Finance/shared/components/PembayaranForm.vue'))

const { xs } = useDisplay()
const router = useRouter()
const { showSuccess, showError, showLoading, closeAlert, confirmDelete: confirmDeleteSwal } = useSweetAlert()
const authStore = useAuthStore()
const { items: itemsB2C, loading: loadingB2C, meta: metaB2C, params: paramsB2C, fetchList: fetchListB2C, remove } = useCrud('/finance/invoices')
const { items: itemsB2B, loading: loadingB2B, meta: metaB2B, params: paramsB2B, fetchList: fetchListB2B } = useCrud('/finance/invoices')
const { formatCurrency, formatDate } = useFormatter()

const canSeeAll = authStore.hasAnyRole(['ADMIN', 'MANAGER', 'SUPERVISOR'])
const invoiceB2CTableTitle = computed(() => authStore.isArOnly ? 'Table Invoice' : 'Invoice B2C')

const { tanggal_dari: defaultDari, tanggal_sampai: defaultSampai } = getDefaultMonthRange()
const filtersB2B = reactive({ search: '' })
const filtersB2C = reactive({ search: '' })
const dateFiltersB2B = reactive({ tanggal_dari: defaultDari, tanggal_sampai: defaultSampai })
const dateFiltersB2C = reactive({ tanggal_dari: defaultDari, tanggal_sampai: defaultSampai })

if (canSeeAll) {
  paramsB2C.segment = 'B2C'
  paramsB2B.segment = 'B2B'
}

Object.assign(paramsB2C, { tanggal_dari: defaultDari, tanggal_sampai: defaultSampai, per_page: 25 })
Object.assign(paramsB2B, { tanggal_dari: defaultDari, tanggal_sampai: defaultSampai, per_page: 25 })

const summary          = reactive({ total_invoice: null, total_tagihan: null, total_pembayaran: null, total_sisa: null })
const showDelete       = ref(false)
const deleteError      = ref('')
const selectedInvoice  = ref(null)
const showPembayaran   = ref(false)
const selectedInvoices = ref([])
const showShareDialog  = ref(false)
const shareTargetInvoices = ref([])
const selectedForPayment  = ref(null)
const exportingExcel   = ref(false)
const showExportModal  = ref(false)
const exportMonth      = ref(new Date().toISOString().slice(0, 7))
const printingId        = ref(null)
const activeSegmentTab  = ref(canSeeAll ? 'b2b' : 'b2c')
let b2bLoaded = false

const headers = [
  { title: 'No',           key: 'no',              sortable: false, width: '60px' },
  { title: 'No Invoice',   key: 'no_invoice',      sortable: false },
  { title: 'Klien',        key: 'klien_ar',        sortable: false },
  { title: 'Outlet',       key: 'outlet',          sortable: false },
  { title: 'Tanggal',      key: 'tanggal_invoice', sortable: false, width: '115px' },
  { title: 'Total Barang', key: 'subtotal',        sortable: false },
  { title: 'Sisa Tagihan', key: 'sisa_tagihan',    sortable: false },
  { title: 'Status',       key: 'status',          sortable: false },
  { title: 'Aksi',         key: 'actions',         sortable: false, align: 'center', width: '160px' },
]

const headersB2B = [
  { title: 'No',               key: 'no',                   sortable: false, width: '60px' },
  { title: 'No Invoice',       key: 'no_invoice',           sortable: false },
  { title: 'Client',           key: 'klien_ar',             sortable: false },
  { title: 'Tgl. Invoice',     key: 'tanggal_invoice',      sortable: false, width: '115px' },
  { title: 'Total Barang',     key: 'subtotal',             sortable: false },
  { title: 'Sisa Tagihan',     key: 'sisa_tagihan',         sortable: false },
  { title: 'Status',           key: 'status',               sortable: false },
  { title: 'Aksi',             key: 'actions',              sortable: false, align: 'center', width: '160px' },
]

let listControllerB2C = null
let listControllerB2B = null
let summaryController = null
let debounceTimerB2B  = null
let debounceTimerB2C  = null

function abortPendingRequests() {
  listControllerB2C?.abort()
  listControllerB2B?.abort()
  summaryController?.abort()
  listControllerB2C = null
  listControllerB2B = null
  summaryController = null
}

async function loadListB2C() {
  listControllerB2C?.abort()
  const controller = new AbortController()
  listControllerB2C = controller
  await fetchListB2C({}, { signal: controller.signal })
  if (listControllerB2C === controller)
    listControllerB2C = null
}

async function loadListB2B() {
  if (!canSeeAll) return
  listControllerB2B?.abort()
  const controller = new AbortController()
  listControllerB2B = controller
  await fetchListB2B({}, { signal: controller.signal })
  if (listControllerB2B === controller)
    listControllerB2B = null
}

async function loadSummary() {
  summaryController?.abort()
  const controller = new AbortController()
  summaryController = controller
  try {
    const { data } = await api.get('/finance/invoices/summary', {
      params: {
        ...(!canSeeAll && { karyawan_id: paramsB2C.karyawan_id }),
      },
      signal: controller.signal,
    })
    if (controller.signal.aborted) return
    Object.assign(summary, data.data)
  } catch (err) {
    if (err.code === 'ERR_CANCELED') return
  } finally {
    if (summaryController === controller)
      summaryController = null
  }
}

function doFetchB2B() {
  Object.assign(paramsB2B, filtersB2B)
  paramsB2B.page = 1
  loadListB2B()
}

function doFetchB2C() {
  Object.assign(paramsB2C, filtersB2C)
  paramsB2C.page = 1
  loadListB2C()
}

function debouncedFetchB2B() {
  clearTimeout(debounceTimerB2B)
  debounceTimerB2B = setTimeout(doFetchB2B, 400)
}

function debouncedFetchB2C() {
  clearTimeout(debounceTimerB2C)
  debounceTimerB2C = setTimeout(doFetchB2C, 400)
}

function applyDateFiltersB2B() {
  Object.assign(paramsB2B, dateFiltersB2B)
  paramsB2B.page = 1
  loadListB2B()
}

function applyDateFiltersB2C() {
  Object.assign(paramsB2C, dateFiltersB2C)
  paramsB2C.page = 1
  loadListB2C()
}

function resetFiltersB2B() {
  const { tanggal_dari, tanggal_sampai } = getDefaultMonthRange()
  Object.assign(filtersB2B, { search: '' })
  Object.assign(dateFiltersB2B, { tanggal_dari, tanggal_sampai })
  Object.assign(paramsB2B, filtersB2B, dateFiltersB2B)
  paramsB2B.page = 1
  loadListB2B()
}

function resetFiltersB2C() {
  const { tanggal_dari, tanggal_sampai } = getDefaultMonthRange()
  Object.assign(filtersB2C, { search: '' })
  Object.assign(dateFiltersB2C, { tanggal_dari, tanggal_sampai })
  Object.assign(paramsB2C, filtersB2C, dateFiltersB2C)
  paramsB2C.page = 1
  loadListB2C()
}

function onSegmentTabChange(tab) {
  activeSegmentTab.value = tab
  if (tab === 'b2b' && !b2bLoaded) {
    b2bLoaded = true
    loadListB2B()
  }
}

function refreshLists() {
  loadListB2C()
  if (canSeeAll && b2bLoaded) loadListB2B()
  loadSummary()
}

function onTableOptionsB2C({ page, itemsPerPage }) {
  paramsB2C.page = page
  paramsB2C.per_page = itemsPerPage
  loadListB2C()
}

function onTableOptionsB2B({ page, itemsPerPage }) {
  paramsB2B.page = page
  paramsB2B.per_page = itemsPerPage
  loadListB2B()
}

function monthToRange(ym) {
  const [year, month] = ym.split('-').map(Number)
  const lastDay = new Date(year, month, 0).getDate()
  return {
    tanggal_dari:   `${ym}-01`,
    tanggal_sampai: `${ym}-${String(lastDay).padStart(2, '0')}`,
  }
}

async function exportExcel() {
  showExportModal.value = false
  exportingExcel.value = true
  showLoading({ title: 'Mengeksport Data Invoice', text: 'Mohon tunggu sebentar...' })
  try {
    const { tanggal_dari, tanggal_sampai } = monthToRange(exportMonth.value)
    const isB2B = canSeeAll && activeSegmentTab.value === 'b2b'

    const query = new URLSearchParams()
    query.set('tanggal_dari', tanggal_dari)
    query.set('tanggal_sampai', tanggal_sampai)
    query.set('segment', isB2B ? 'B2B' : 'B2C')

    const res = await api.get(`/finance/invoices/export-excel?${query}`, { responseType: 'blob', timeout: 300000 })
    const url  = URL.createObjectURL(res.data)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `Data Tagihan Invoice-${new Date().toISOString().slice(0, 10)}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
    showSuccess({ title: 'Export Berhasil!', text: 'File berhasil diunduh.' })
  } catch {
    await showError('Gagal mengunduh data Excel.')
  } finally {
    exportingExcel.value = false
    closeAlert({ onlyLoading: true })
  }
}
function confirmDelete(inv) { selectedInvoice.value = inv; deleteError.value = ''; showDelete.value = true }

function openCatatBayar(item) {
  selectedForPayment.value = item
  showPembayaran.value     = true
}

function onPembayaranSaved() {
  refreshLists()
}

async function printInvoice(item) {
  if (item.share_url) {
    if (!openPrintTab(item.share_url))
      await showError('Popup diblokir browser. Izinkan popup untuk membuka dokumen cetak.')

    return
  }

  printingId.value = item.id
  const printWindow = openLoadingPrintTab()
  try {
    const res = await api.get(`/finance/invoices/${item.id}/print`, { responseType: 'blob', timeout: 300000 })
    const blobUrl = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))

    if (!printWindow) {
      URL.revokeObjectURL(blobUrl)
      await showError('Popup diblokir browser. Izinkan popup untuk membuka dokumen cetak.')

      return
    }

    printWindow.location.href = blobUrl
    setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000)
  } catch (err) {
    printWindow?.close()
    await showError(await readBlobError(err, 'Gagal membuka dokumen cetak'))
  } finally {
    printingId.value = null
  }
}

function openShareDialog(invoices) {
  shareTargetInvoices.value = Array.isArray(invoices) ? invoices : [invoices]
  showShareDialog.value = true
}

async function doBulkDelete() {
  const draftItems = selectedInvoices.value.filter(inv => inv.status === 'DRAFT')
  const skipped = selectedInvoices.value.length - draftItems.length

  if (!draftItems.length) {
    await showError('Tidak ada invoice berstatus DRAFT yang bisa dihapus.')
    return
  }

  const confirmText = skipped > 0
    ? `Hanya ${draftItems.length} invoice DRAFT yang akan dihapus. ${skipped} invoice non-DRAFT dilewati.`
    : `Sebanyak ${draftItems.length} invoice yang dipilih akan dihapus.`

  const { isConfirmed } = await confirmDeleteSwal(confirmText)
  if (!isConfirmed) return

  showLoading({ title: 'Menghapus Data', text: 'Invoice sedang dihapus...' })
  try {
    const res = await api.delete('/finance/invoices/bulk', {
      data: { ids: draftItems.map(inv => inv.id) },
    })
    const deleted = res.data?.data?.deleted ?? draftItems.length
    selectedInvoices.value = []
    refreshLists()
    await showSuccess(`${deleted} invoice berhasil dihapus.`)
  } catch (err) {
    await showError(err.response?.data?.message ?? 'Gagal menghapus invoice')
  } finally {
    closeAlert({ onlyLoading: true })
  }
}

async function doDelete() {
  deleteError.value = ''

  const deleteId = selectedInvoice.value?.id
  if (!deleteId) return

  showDelete.value = false
  await nextTick()

  const res = await remove(deleteId)
  if (res.success) {
    refreshLists()
    await showSuccess('Invoice berhasil dihapus.')
  } else {
    deleteError.value = res.message || 'Gagal menghapus data'
    await showError(deleteError.value)
  }
}

onMounted(() => {
  loadListB2C()
  if (canSeeAll) {
    b2bLoaded = true
    loadListB2B()
  }
  loadSummary()
})

onBeforeUnmount(() => {
  clearTimeout(debounceTimerB2B)
  clearTimeout(debounceTimerB2C)
  abortPendingRequests()
})
</script>

