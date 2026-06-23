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
      <div class="d-flex gap-2">
        <VBtn
          color="primary"
          prepend-icon="ri-file-excel-line"
          :loading="exportingExcel"
          @click="exportExcel"
        >
          Export
        </VBtn>
        <VBtn
          color="primary"
          prepend-icon="ri-upload-line"
          @click="openImport"
        >
          Import
        </VBtn>
        <VBtn
          color="primary"
          prepend-icon="ri-add-line"
          :to="{ name: 'finance-invoice-create' }"
        >
          Buat Invoice
        </VBtn>
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

    <!-- B2B Table (hanya untuk admin/manager/supervisor) -->
    <VCard v-if="canSeeAll" class="mb-4">
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
        <div style="min-width: 140px; max-width: 180px;">
          <div class="text-caption text-medium-emphasis mb-2">Status</div>
          <VSelect
            v-model="filtersB2B.status"
            placeholder="Semua Status"
            clearable
            hide-details
            density="compact"
            :items="statusOptions"
            item-title="label"
            item-value="value"
            @update:model-value="doFetchB2B"
          />
        </div>
        <div style="min-width: 180px; flex: 1; max-width: 260px;">
          <div class="text-caption text-medium-emphasis mb-2">Klien</div>
          <VAutocomplete
            v-model="filtersB2B.klien_ar_id"
            placeholder="Semua Klien"
            clearable
            hide-details
            density="compact"
            :items="klienList"
            item-title="nama_klien"
            item-value="id"
            :loading="klienLoading"
            @focus="ensureKlienLoaded()"
            @update:model-value="doFetchB2B"
          />
        </div>
        <VDivider vertical style="height: 40px; align-self: flex-end;" class="d-none d-sm-block" />
        <div>
          <div class="text-caption text-medium-emphasis mb-2">Dari</div>
          <VTextField
            v-model="filtersB2B.tanggal_dari"
            type="date"
            hide-details
            density="compact"
            style="min-width: 150px; max-width: 170px;"
            @update:model-value="debouncedFetchB2B"
          />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">Sampai</div>
          <VTextField
            v-model="filtersB2B.tanggal_sampai"
            type="date"
            hide-details
            density="compact"
            style="min-width: 150px; max-width: 170px;"
            @update:model-value="debouncedFetchB2B"
          />
        </div>
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
        @update:options="onTableOptionsB2B"
      >
        <template #item.no="{ index }">
          {{ (metaB2B.current_page - 1) * metaB2B.per_page + index + 1 }}
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
        <template #item.penerima_tagihan="{ item }">
          {{ item.perusahaan?.nama_perusahaan ?? '-' }}
        </template>
        <template #item.tanggal_invoice="{ item }">
          <span class="text-no-wrap">{{ formatDate(item.tanggal_invoice) }}</span>
        </template>
        <template #item.tanggal_kirim_barang="{ item }">
          <span class="text-no-wrap">{{ item.tanggal_kirim_barang ? formatDate(item.tanggal_kirim_barang) : '-' }}</span>
        </template>
        <template #item.subtotal="{ item }">
          {{ formatCurrency(item.subtotal) }}
        </template>
        <template #item.sisa_tagihan="{ item }">
          <span :class="Math.max(0, item.subtotal - item.total_pembayaran) > 0 ? 'text-error' : 'text-success'">
            {{ formatCurrency(Math.max(0, item.subtotal - item.total_pembayaran)) }}
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
              v-if="item.status === 'DRAFT'"
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
              icon
              size="small"
              variant="text"
              color="secondary"
              :loading="printingId === item.id"
              @click="printInvoice(item.id)"
            >
              <VIcon icon="ri-printer-line" size="18" />
              <VTooltip activator="parent">Cetak Invoice</VTooltip>
            </VBtn>
            <VBtn
              v-if="item.status === 'DRAFT'"
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
          <span class="text-subtitle-1 font-weight-semibold">Invoice B2C</span>
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
        <div style="min-width: 140px; max-width: 180px;">
          <div class="text-caption text-medium-emphasis mb-2">Status</div>
          <VSelect
            v-model="filtersB2C.status"
            placeholder="Semua Status"
            clearable
            hide-details
            density="compact"
            :items="statusOptions"
            item-title="label"
            item-value="value"
            @update:model-value="doFetchB2C"
          />
        </div>
        <div style="min-width: 180px; flex: 1; max-width: 260px;">
          <div class="text-caption text-medium-emphasis mb-2">Klien</div>
          <VAutocomplete
            v-model="filtersB2C.klien_ar_id"
            placeholder="Semua Klien"
            clearable
            hide-details
            density="compact"
            :items="klienList"
            item-title="nama_klien"
            item-value="id"
            :loading="klienLoading"
            @focus="ensureKlienLoaded()"
            @update:model-value="doFetchB2C"
          />
        </div>
        <VDivider vertical style="height: 40px; align-self: flex-end;" class="d-none d-sm-block" />
        <div>
          <div class="text-caption text-medium-emphasis mb-2">Dari</div>
          <VTextField
            v-model="filtersB2C.tanggal_dari"
            type="date"
            hide-details
            density="compact"
            style="min-width: 150px; max-width: 170px;"
            @update:model-value="debouncedFetchB2C"
          />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">Sampai</div>
          <VTextField
            v-model="filtersB2C.tanggal_sampai"
            type="date"
            hide-details
            density="compact"
            style="min-width: 150px; max-width: 170px;"
            @update:model-value="debouncedFetchB2C"
          />
        </div>
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
        @update:options="onTableOptionsB2C"
      >
        <template #item.no="{ index }">
          {{ (metaB2C.current_page - 1) * metaB2C.per_page + index + 1 }}
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
          <span class="text-no-wrap">{{ formatDate(item.tanggal_invoice) }}</span>
        </template>
        <template #item.subtotal="{ item }">
          {{ formatCurrency(item.subtotal) }}
        </template>
        <template #item.sisa_tagihan="{ item }">
          <span :class="Math.max(0, item.subtotal - item.total_pembayaran) > 0 ? 'text-error' : 'text-success'">
            {{ formatCurrency(Math.max(0, item.subtotal - item.total_pembayaran)) }}
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
              v-if="item.status === 'DRAFT'"
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
              icon
              size="small"
              variant="text"
              color="secondary"
              :loading="printingId === item.id"
              @click="printInvoice(item.id)"
            >
              <VIcon icon="ri-printer-line" size="18" />
              <VTooltip activator="parent">Cetak Invoice</VTooltip>
            </VBtn>
            <VBtn
              v-if="item.status === 'DRAFT'"
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

    <!-- Catat Bayar Modal -->
    <PembayaranForm
      v-if="selectedForPayment"
      v-model="showPembayaran"
      :invoice-id="selectedForPayment.id"
      :sisa-tagihan="Math.max(0, selectedForPayment.subtotal - selectedForPayment.total_pembayaran)"
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

    <!-- Import Modal -->
    <VDialog
      v-model="showImport"
      max-width="660"
      persistent
    >
      <VCard>
        <VCardTitle class="d-flex align-center justify-space-between pa-4">
          <span>Import Invoice AR</span>
          <div class="d-flex ga-1">
            <VBtn
              v-if="importing"
              icon
              size="small"
              variant="text"
              title="Minimize ke latar belakang"
              @click="minimizeImport"
            >
              <VIcon icon="ri-subtract-line" />
            </VBtn>
            <VBtn
              icon
              size="small"
              variant="text"
              @click="closeImport"
            >
              <VIcon icon="ri-close-line" />
            </VBtn>
          </div>
        </VCardTitle>
        <VDivider />
        <VCardText class="pt-4">
          <!-- Langkah 1: Pilih Jenis -->
          <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase letter-spacing-widened mb-2">
            Langkah 1 — Pilih Jenis Invoice
          </div>
          <div class="d-flex gap-2 mb-5">
            <div
              class="flex-1-1 pa-3 rounded-lg border cursor-pointer"
              :style="importType === 'b2c'
                ? 'border: 2px solid rgb(var(--v-theme-primary)); background: rgba(var(--v-theme-primary), 0.08);'
                : 'border: 2px solid rgba(var(--v-border-color), var(--v-border-opacity));'"
              @click="importType = 'b2c'"
            >
              <div class="d-flex align-center gap-2">
                <VAvatar
                  :color="importType === 'b2c' ? 'primary' : 'secondary'"
                  variant="tonal"
                  size="32"
                >
                  <VIcon
                    icon="ri-user-line"
                    size="16"
                  />
                </VAvatar>
                <div>
                  <div
                    class="text-body-2 font-weight-semibold"
                    :class="importType === 'b2c' ? 'text-primary' : ''"
                  >
                    B2C
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    Klien Perorangan / Resto
                  </div>
                </div>
                <VSpacer />
                <VIcon
                  :icon="importType === 'b2c' ? 'ri-checkbox-circle-fill' : 'ri-checkbox-blank-circle-line'"
                  :color="importType === 'b2c' ? 'primary' : 'secondary'"
                  size="18"
                />
              </div>
            </div>
            <div
              class="flex-1-1 pa-3 rounded-lg border cursor-pointer"
              :style="importType === 'b2b'
                ? 'border: 2px solid rgb(var(--v-theme-success)); background: rgba(var(--v-theme-success), 0.08);'
                : 'border: 2px solid rgba(var(--v-border-color), var(--v-border-opacity));'"
              @click="importType = 'b2b'"
            >
              <div class="d-flex align-center gap-2">
                <VAvatar
                  :color="importType === 'b2b' ? 'success' : 'secondary'"
                  variant="tonal"
                  size="32"
                >
                  <VIcon
                    icon="ri-building-4-line"
                    size="16"
                  />
                </VAvatar>
                <div>
                  <div
                    class="text-body-2 font-weight-semibold"
                    :class="importType === 'b2b' ? 'text-success' : ''"
                  >
                    B2B
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    Klien PT / Perusahaan
                  </div>
                </div>
                <VSpacer />
                <VIcon
                  :icon="importType === 'b2b' ? 'ri-checkbox-circle-fill' : 'ri-checkbox-blank-circle-line'"
                  :color="importType === 'b2b' ? 'success' : 'secondary'"
                  size="18"
                />
              </div>
            </div>
          </div>

          <!-- Langkah 2: Download Template -->
          <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase letter-spacing-widened mb-2">
            Langkah 2 — Download Template &amp; Isi Data
          </div>
          <VBtn
            v-if="importType === 'b2c'"
            variant="outlined"
            color="primary"
            prepend-icon="ri-file-excel-line"
            size="small"
            class="mb-3"
            @click="downloadTemplate('b2c')"
          >
            Download Template B2C
          </VBtn>
          <VBtn
            v-else
            variant="outlined"
            color="success"
            prepend-icon="ri-file-excel-line"
            size="small"
            class="mb-3"
            @click="downloadTemplate('b2b')"
          >
            Download Template B2B
          </VBtn>

          <!-- Panduan per tipe -->
          <VAlert
            v-if="importType === 'b2c'"
            type="info"
            variant="tonal"
            density="compact"
            class="mb-4"
          >
            <div class="font-weight-semibold mb-1 text-body-2">
              Template B2C — 2 Sheet:
            </div>
            <div class="text-caption">
              <strong>Sheet 1 (Invoice):</strong> no_urut · no_invoice · nama_klien · tanggal_invoice · tanggal_jatuh_tempo · periode_awal · periode_akhir · no_surat_jalan · keterangan
            </div>
            <div class="text-caption mt-1">
              <strong>Sheet 2 (Item Invoice):</strong> no_urut_invoice · kode_barang · nama_barang · qty · satuan · harga_satuan
            </div>
            <div class="text-caption mt-2 font-weight-medium text-info">
              Tagihan sebelumnya dihitung otomatis dari sisa tagihan klien yang belum lunas — tidak perlu diisi.
            </div>
          </VAlert>
          <VAlert
            v-else
            type="success"
            variant="tonal"
            density="compact"
            class="mb-4"
          >
            <div class="font-weight-semibold mb-1 text-body-2">
              Template B2B — 2 Sheet (Data Invoice + Item Invoice):
            </div>
            <div class="text-caption">
              <strong>Sheet 1 — Kolom A–G (Data Invoice):</strong>
              no_urut · nama_klien · <strong>tanggal_kirim_barang</strong> · no_surat_jalan (opt) · tanggal_jatuh_tempo (opt) · periode_awal (opt) · periode_akhir (opt)
            </div>
            <div class="text-caption mt-1">
              <strong>Sheet 2 — Kolom A–I (Item Invoice):</strong>
              no_urut_invoice · no_invoice_resto · kode_resto · nama_resto · kode_barang · nama_barang · qty · satuan · harga_satuan
            </div>
            <div class="text-caption mt-2 font-weight-medium text-success">
              No. Invoice konsolidasi digenerate otomatis oleh sistem (format: SI-ABB-DDMMYYYYHHmmss-XXX). Gunakan no_urut yang sama di Sheet 2 untuk menghubungkan item ke invoice.
            </div>
          </VAlert>

          <!-- Catatan umum -->
          <div class="text-caption text-medium-emphasis mb-4 d-flex align-center gap-1">
            <VIcon
              icon="ri-information-line"
              size="14"
            />
            Format tanggal: <strong>DD-MM-YYYY</strong> &nbsp;·&nbsp; Kolom <strong>nama_klien</strong> harus persis sesuai data di sistem &nbsp;·&nbsp; Hapus baris [CONTOH] sebelum upload
          </div>

          <!-- Langkah 3: Upload -->
          <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase letter-spacing-widened mb-2">
            Langkah 3 — Upload File
          </div>
          <VFileInput
            v-model="importFile"
            label="Pilih File (.xlsx)"
            accept=".xlsx,.xls"
            prepend-icon="ri-file-upload-line"
            variant="outlined"
            density="compact"
            :clearable="true"
            hide-details="auto"
            :disabled="importing"
            @update:model-value="importResult = null"
          />

          <!-- Progress saat import berjalan di latar belakang -->
          <div
            v-if="importing && importProgress"
            class="mt-4"
          >
            <div class="d-flex align-center justify-space-between text-caption mb-1">
              <span>
                {{ importProgress.status === 'queued' ? 'Menunggu antrian…' : 'Memproses data…' }}
              </span>
              <span v-if="importProgress.progress_total > 0">
                {{ importProgress.processed }} / {{ importProgress.progress_total }} baris
              </span>
            </div>
            <VProgressLinear
              :model-value="importProgress.progress_total > 0 ? (importProgress.processed / importProgress.progress_total) * 100 : 0"
              :indeterminate="importProgress.status === 'queued' || !importProgress.progress_total"
              color="warning"
              height="8"
              rounded
            />
            <div class="text-caption text-medium-emphasis mt-1">
              Anda boleh menutup dialog ini — proses tetap berjalan di latar belakang.
            </div>
          </div>

          <div
            v-if="importResult"
            class="mt-4"
          >
            <VAlert
              :type="importResult.failed > 0 ? 'warning' : 'success'"
              variant="tonal"
              class="mb-3"
            >
              Import selesai:
              <strong>{{ importResult.inserted }}</strong> ditambahkan,
              <strong>{{ importResult.failed }}</strong> gagal
              (total {{ importResult.total }} baris).
            </VAlert>

            <div
              v-if="importResult.errors?.length"
              class="mt-2"
            >
              <div class="text-subtitle-2 mb-2">
                Detail Error:
              </div>
              <VTable
                density="compact"
                class="border rounded"
              >
                <thead>
                  <tr>
                    <th>Sheet</th>
                    <th>Baris</th>
                    <th>Pesan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(err, i) in importResult.errors"
                    :key="i"
                  >
                    <td>{{ err.sheet }}</td>
                    <td>{{ err.row }}</td>
                    <td>{{ err.message }}</td>
                  </tr>
                </tbody>
              </VTable>
            </div>
          </div>
        </VCardText>
        <VDivider />
        <VCardActions class="pa-4 gap-2 justify-end">
          <VBtn
            variant="outlined"
            @click="closeImport"
          >
            Tutup
          </VBtn>
          <VBtn
            color="warning"
            :loading="importing"
            :disabled="!importFile"
            prepend-icon="ri-upload-line"
            @click="doImport"
          >
            Import
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Floating Import Progress Widget (saat modal di-minimize) -->
    <Transition name="slide-up">
      <VCard
        v-if="isImportMinimized"
        elevation="8"
        rounded="lg"
        style="position: fixed; bottom: 24px; right: 24px; z-index: 2400; width: 300px; cursor: pointer;"
        @click="restoreImport"
      >
        <VCardText class="pa-3">
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="d-flex align-center ga-2">
              <VIcon
                :icon="importing ? 'ri-loader-4-line' : 'ri-checkbox-circle-line'"
                :color="importing ? 'warning' : 'success'"
                size="18"
              />
              <span class="text-subtitle-2 font-weight-medium">
                Import Invoice ({{ importType.toUpperCase() }})
              </span>
            </div>
            <VBtn
              icon
              size="x-small"
              variant="text"
              @click.stop="closeImport"
            >
              <VIcon icon="ri-close-line" size="16" />
            </VBtn>
          </div>

          <template v-if="importing && importProgress">
            <VProgressLinear
              :model-value="importProgress.progress_total > 0
                ? (importProgress.processed / importProgress.progress_total) * 100
                : 0"
              :indeterminate="importProgress.status === 'queued' || !importProgress.progress_total"
              color="warning"
              height="6"
              rounded
              class="mb-1"
            />
            <div class="text-caption text-medium-emphasis">
              {{ importProgress.status === 'queued'
                ? 'Menunggu antrian…'
                : `${importProgress.processed} / ${importProgress.progress_total} baris diproses` }}
            </div>
          </template>

          <template v-else-if="importResult">
            <div class="text-caption">
              <strong>{{ importResult.inserted }}</strong> ditambahkan,
              <strong>{{ importResult.failed }}</strong> gagal
            </div>
            <div class="text-caption text-primary mt-1">
              Klik untuk lihat detail →
            </div>
          </template>
        </VCardText>
      </VCard>
    </Transition>
  </div>
</template>

<script setup>
import { defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'

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
import { useLazyFetchAll } from '@/composables/useLazyFetchAll.js'
import { useFormatter } from '@/composables/useFormatter.js'
import { useAuthStore } from '@/stores/auth.store'
import api from '@/utils/axios.js'
import InvoiceStatusBadge from '../components/InvoiceStatusBadge.vue'
import ShareInvoicesDialog from '../components/ShareInvoicesDialog.vue'
import BulkActionBar from '../components/BulkActionBar.vue'

const PembayaranForm = defineAsyncComponent(() => import('../components/PembayaranForm.vue'))

const { showSuccess, showError, showLoading, closeAlert, confirmDelete: confirmDeleteSwal } = useSweetAlert()
const authStore = useAuthStore()
const { items: itemsB2C, loading: loadingB2C, meta: metaB2C, params: paramsB2C, fetchList: fetchListB2C, remove } = useCrud('/finance/invoices')
const { items: itemsB2B, loading: loadingB2B, meta: metaB2B, params: paramsB2B, fetchList: fetchListB2B } = useCrud('/finance/invoices')
const { items: klienList, loading: klienLoading, fetchAll: fetchKlien } = useCrud('/finance/klien-ar')
const { ensureLoaded: ensureKlienLoaded } = useLazyFetchAll(fetchKlien)
const { formatCurrency, formatDate } = useFormatter()

const canSeeAll = authStore.hasAnyRole(['ADMIN', 'MANAGER', 'SUPERVISOR'])

const { tanggal_dari: defaultDari, tanggal_sampai: defaultSampai } = getDefaultMonthRange()
const filtersB2B = reactive({ search: '', status: '', klien_ar_id: null, tanggal_dari: defaultDari, tanggal_sampai: defaultSampai })
const filtersB2C = reactive({ search: '', status: '', klien_ar_id: null, tanggal_dari: defaultDari, tanggal_sampai: defaultSampai })

if (canSeeAll) {
  paramsB2C.segment = 'B2C'
  paramsB2B.segment = 'B2B'
}

Object.assign(paramsB2C, { tanggal_dari: defaultDari, tanggal_sampai: defaultSampai })
Object.assign(paramsB2B, { tanggal_dari: defaultDari, tanggal_sampai: defaultSampai })

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
const showImport        = ref(false)
const importing         = ref(false)
const printingId        = ref(null)
const importFile        = ref(null)
const importResult      = ref(null)
const importType        = ref('b2c')
const importProgress    = ref(null)
const isImportMinimized = ref(false)
let   importPollTimer   = null

const headers = [
  { title: 'No',           key: 'no',              sortable: false, width: '60px' },
  { title: 'No Invoice',   key: 'no_invoice',      sortable: false },
  { title: 'Klien',        key: 'klien_ar',        sortable: false },
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
  { title: 'Penerima Tagihan', key: 'penerima_tagihan',     sortable: false },
  { title: 'Tgl. Invoice',     key: 'tanggal_invoice',      sortable: false, width: '115px' },
  { title: 'Tgl. Kirim',       key: 'tanggal_kirim_barang', sortable: false, width: '115px' },
  { title: 'Total Barang',     key: 'subtotal',             sortable: false },
  { title: 'Sisa Tagihan',     key: 'sisa_tagihan',         sortable: false },
  { title: 'Status',           key: 'status',               sortable: false },
  { title: 'Aksi',             key: 'actions',              sortable: false, align: 'center', width: '160px' },
]

const statusOptions = [
  { label: 'Draft',    value: 'DRAFT'    },
  { label: 'Terkirim', value: 'TERKIRIM' },
  { label: 'Sebagian', value: 'SEBAGIAN' },
  { label: 'Lunas',    value: 'LUNAS'    },
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

function resetFiltersB2B() {
  const { tanggal_dari, tanggal_sampai } = getDefaultMonthRange()
  Object.assign(filtersB2B, { search: '', status: '', klien_ar_id: null, tanggal_dari, tanggal_sampai })
  doFetchB2B()
}

function resetFiltersB2C() {
  const { tanggal_dari, tanggal_sampai } = getDefaultMonthRange()
  Object.assign(filtersB2C, { search: '', status: '', klien_ar_id: null, tanggal_dari, tanggal_sampai })
  doFetchB2C()
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

async function exportExcel() {
  exportingExcel.value = true
  showLoading({ title: 'Mengeksport Data Invoice', text: 'Mohon tunggu sebentar...' })
  try {
    const query = new URLSearchParams()
    if (filtersB2C.status)         query.set('status', filtersB2C.status)
    if (filtersB2C.klien_ar_id)    query.set('klien_ar_id', filtersB2C.klien_ar_id)
    if (filtersB2C.tanggal_dari)   query.set('tanggal_dari', filtersB2C.tanggal_dari)
    if (filtersB2C.tanggal_sampai) query.set('tanggal_sampai', filtersB2C.tanggal_sampai)

    const res = await api.get(`/finance/invoices/export-excel?${query}`, { responseType: 'blob' })
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

function openImport() {
  importFile.value     = null
  importResult.value   = null
  importProgress.value = null
  importType.value     = 'b2c'
  showImport.value     = true
}

function closeImport() {
  showImport.value        = false
  isImportMinimized.value = false
  stopImportPolling()
  importing.value      = false
  importProgress.value = null
  if (importResult.value?.inserted > 0) {
    loadListB2C()
    if (canSeeAll) loadListB2B()
    loadSummary()
  }
}

function minimizeImport() {
  showImport.value        = false
  isImportMinimized.value = true
}

function restoreImport() {
  showImport.value        = true
  isImportMinimized.value = false
}

async function downloadTemplate(type = 'b2c') {
  try {
    const res  = await api.get('/finance/invoices/import-template', { responseType: 'blob', params: { type } })
    const url  = URL.createObjectURL(res.data)
    const a    = document.createElement('a')
    a.href     = url
    a.download = type === 'b2b' ? 'Template Tagihan Invoice B2B.xlsx' : 'Template Tagihan Invoice B2C.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    await showError('Gagal mengunduh template.')
  }
}

function stopImportPolling() {
  if (importPollTimer) {
    clearTimeout(importPollTimer)
    importPollTimer = null
  }
}

async function doImport() {
  if (!importFile.value) return
  importing.value      = true
  importResult.value   = null
  importProgress.value = { status: 'queued', processed: 0, progress_total: 0 }

  try {
    const formData = new FormData()
    formData.append('file', importFile.value)
    formData.append('type', importType.value)

    const res = await api.post('/finance/invoices/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    const batchId = res.data?.data?.batch_id
    if (!batchId) throw new Error('Batch import tidak valid.')

    importFile.value = null
    pollImportStatus(batchId)
  } catch (err) {
    const message = err?.response?.data?.message || 'Gagal mengimport data.'
    importing.value      = false
    importProgress.value = null
    await showError(message)
  }
}

function pollImportStatus(batchId) {
  stopImportPolling()
  importPollTimer = setTimeout(async () => {
    try {
      const res  = await api.get(`/finance/invoices/import/${batchId}/status`)
      const data = res.data?.data
      importProgress.value = data

      if (data.status === 'completed' || data.status === 'failed') {
        importing.value = false
        if (data.status === 'failed') {
          importProgress.value    = null
          await showError(data.message || 'Import gagal diproses.')
          isImportMinimized.value = false
        } else {
          importResult.value = data
        }
        return
      }
      pollImportStatus(batchId)
    } catch {
      // Lanjutkan polling; gangguan jaringan sementara tidak menghentikan proses server.
      pollImportStatus(batchId)
    }
  }, 1500)
}

function confirmDelete(inv) { selectedInvoice.value = inv; deleteError.value = ''; showDelete.value = true }

function openCatatBayar(item) {
  selectedForPayment.value = item
  showPembayaran.value     = true
}

function onPembayaranSaved() {
  loadListB2C()
  if (canSeeAll) loadListB2B()
  loadSummary()
}

async function printInvoice(id) {
  printingId.value = id
  try {
    const res = await api.get(`/finance/invoices/${id}/print`, { responseType: 'blob' })
    const blobUrl = URL.createObjectURL(res.data)
    window.open(blobUrl, '_blank')
    setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000)
  } catch {
    await showError('Gagal membuka dokumen cetak')
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
    loadListB2C()
    if (canSeeAll) loadListB2B()
    loadSummary()
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
    loadListB2C()
    if (canSeeAll) loadListB2B()
    loadSummary()
    await showSuccess('Invoice berhasil dihapus.')
  } else {
    deleteError.value = res.message || 'Gagal menghapus data'
    await showError(deleteError.value)
  }
}

onMounted(() => {
  loadListB2C()
  if (canSeeAll) loadListB2B()
  loadSummary()
})

onBeforeUnmount(() => {
  clearTimeout(debounceTimerB2B)
  clearTimeout(debounceTimerB2C)
  stopImportPolling()
  abortPendingRequests()
})
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(16px);
  opacity: 0;
}
</style>
