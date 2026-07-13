<template>
  <div>
    <PageHeader
      title="Opening Balance"
      :subtitle="authStore.canApproveOpeningBalance ? 'Tinjau dan proses opening balance yang memerlukan persetujuan' : 'Kelola saldo awal piutang klien'"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Opening Balance', disabled: true },
      ]"
    >
      <div
        v-if="!authStore.canApproveOpeningBalance"
        class="d-flex gap-2"
      >
        <VBtn
          v-if="authStore.canViewOpeningBalance"
          color="primary"
          prepend-icon="ri-file-excel-line"
          :loading="isExporting"
          @click="showExportModal = true"
        >
          Export
        </VBtn>
        <VBtn
          v-if="authStore.canOperateOpeningBalance"
          color="primary"
          prepend-icon="ri-add-line"
          :to="{ name: 'finance-opening-balance-create' }"
        >
          Ajukan Opening Balance
        </VBtn>
      </div>
    </PageHeader>

    <!-- ── Operator View (buat/kelola OB) — non-approver ──────────────────── -->
    <template v-if="!authStore.canApproveOpeningBalance">
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
                  <VIcon icon="ri-wallet-3-line" />
                </VAvatar>
                <div>
                  <div class="text-caption text-medium-emphasis">
                    Total Saldo Awal
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
      <VCard
        v-if="canSeeAll"
        class="mb-4"
      >
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
              v-model="paramsB2B.search"
              placeholder="Cari no. OB / klien..."
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
              v-model="paramsB2B.status"
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
          <div style="min-width: 160px; max-width: 220px;">
            <div class="text-caption text-medium-emphasis mb-2">Approval</div>
            <VSelect
              v-model="paramsB2B.approval_status"
              placeholder="Semua Approval"
              clearable
              hide-details
              density="compact"
              :items="approvalStatusOptions"
              item-title="label"
              item-value="value"
              @update:model-value="doFetchB2B"
            />
          </div>
          <div style="min-width: 180px; flex: 1; max-width: 260px;">
            <div class="text-caption text-medium-emphasis mb-2">Klien</div>
            <VAutocomplete
              v-model="paramsB2B.klien_ar_id"
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
              @update:model-value="doFetchB2B"
            />
          </div>
          <VDivider vertical style="height: 40px; align-self: flex-end;" class="d-none d-sm-block" />
          <div>
            <div class="text-caption text-medium-emphasis mb-2">Dari</div>
            <VTextField
              v-model="dateDraftB2B.tanggal_dari"
              type="date"
              hide-details
              density="compact"
              style="min-width: 150px; max-width: 170px;"
            />
          </div>
          <div>
            <div class="text-caption text-medium-emphasis mb-2">Sampai</div>
            <VTextField
              v-model="dateDraftB2B.tanggal_sampai"
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
          :headers="headers"
          :items="itemsB2B"
          :total="metaB2B.total"
          :loading="loadingB2B"
          :per-page="metaB2B.per_page"
          :page="metaB2B.current_page"
          show-select
          v-model:selected="selectedInvoices"
          class="mt-2"
          column-resize-key="finance-opening-balance-b2b"
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
          <template #item.tanggal_invoice="{ item }">
            <span class="text-no-wrap">{{ formatDate(item.tanggal_invoice) }}</span>
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
          <template #item.approval_status="{ item }">
            <ApprovalStatusBadge :status="item.approval_status" />
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
                variant="tonal"
                color="success"
                @click="openShareDialog([item])"
              >
                <VIcon
                  icon="ri-whatsapp-line"
                  size="18"
                />
                <VTooltip activator="parent">
                  Kirim via WhatsApp
                </VTooltip>
              </VBtn>
              <VBtn
                v-if="item.can_print"
                icon
                size="small"
                variant="text"
                color="secondary"
                :loading="printingId === item.id"
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
              <VBtn
                v-if="item.can_edit"
                icon
                size="small"
                variant="text"
                color="primary"
                :to="{ name: 'finance-opening-balance-edit', params: { id: item.id } }"
              >
                <VIcon
                  icon="ri-pencil-line"
                  size="18"
                />
                <VTooltip activator="parent">
                  Edit
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
              v-model="params.search"
              placeholder="Cari no. OB / klien..."
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
              v-model="params.status"
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
          <div style="min-width: 160px; max-width: 220px;">
            <div class="text-caption text-medium-emphasis mb-2">Approval</div>
            <VSelect
              v-model="params.approval_status"
              placeholder="Semua Approval"
              clearable
              hide-details
              density="compact"
              :items="approvalStatusOptions"
              item-title="label"
              item-value="value"
              @update:model-value="doFetchB2C"
            />
          </div>
          <div style="min-width: 180px; flex: 1; max-width: 260px;">
            <div class="text-caption text-medium-emphasis mb-2">Klien</div>
            <VAutocomplete
              v-model="params.klien_ar_id"
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
              @update:model-value="doFetchB2C"
            />
          </div>
          <VDivider vertical style="height: 40px; align-self: flex-end;" class="d-none d-sm-block" />
          <div>
            <div class="text-caption text-medium-emphasis mb-2">Dari</div>
            <VTextField
              v-model="dateDraftB2C.tanggal_dari"
              type="date"
              hide-details
              density="compact"
              style="min-width: 150px; max-width: 170px;"
            />
          </div>
          <div>
            <div class="text-caption text-medium-emphasis mb-2">Sampai</div>
            <VTextField
              v-model="dateDraftB2C.tanggal_sampai"
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
          :items="items"
          :total="meta.total"
          :loading="loading"
          :per-page="meta.per_page"
          :page="meta.current_page"
          show-select
          v-model:selected="selectedInvoices"
          class="mt-2"
          column-resize-key="finance-opening-balance-b2c"
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
          <template #item.tanggal_invoice="{ item }">
            <span class="text-no-wrap">{{ formatDate(item.tanggal_invoice) }}</span>
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
          <template #item.approval_status="{ item }">
            <ApprovalStatusBadge :status="item.approval_status" />
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
                variant="tonal"
                color="success"
                @click="openShareDialog([item])"
              >
                <VIcon
                  icon="ri-whatsapp-line"
                  size="18"
                />
                <VTooltip activator="parent">
                  Kirim via WhatsApp
                </VTooltip>
              </VBtn>
              <VBtn
                v-if="item.can_print"
                icon
                size="small"
                variant="text"
                color="secondary"
                :loading="printingId === item.id"
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
              <VBtn
                v-if="item.can_edit"
                icon
                size="small"
                variant="text"
                color="primary"
                :to="{ name: 'finance-opening-balance-edit', params: { id: item.id } }"
              >
                <VIcon
                  icon="ri-pencil-line"
                  size="18"
                />
                <VTooltip activator="parent">
                  Edit
                </VTooltip>
              </VBtn>
            </div>
          </template>
        </BaseTable>
      </VCard>
    </template>

    <!-- Bulk Action Bar (operator view only) -->
    <BulkActionBar
      v-if="!authStore.canApproveOpeningBalance"
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

    <!-- ── Director View ──────────────────────────────────────────────────── -->
    <template v-if="authStore.canApproveOpeningBalance">
      <!-- Section 1: Approval table -->
      <div class="mb-4">
        <span class="text-h6 font-weight-semibold">Persetujuan Opening Balance</span>
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
                    {{ dirApprovalSummary.total_invoice ?? '-' }}
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
                    {{ formatCurrency(dirApprovalSummary.total_tagihan) }}
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
                    {{ formatCurrency(dirApprovalSummary.total_pembayaran) }}
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
                    {{ formatCurrency(dirApprovalSummary.total_sisa) }}
                  </div>
                </div>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Filter Card -->
      <VCard class="mb-4">
        <VCardText class="pa-0">
          <div class="d-flex align-center justify-space-between px-4 py-3">
            <div class="d-flex align-center gap-2">
              <VIcon icon="ri-filter-3-line" size="16" color="primary" />
              <span class="text-body-2 font-weight-semibold">Filter</span>
            </div>
            <VBtn
              variant="text"
              color="secondary"
              size="small"
              prepend-icon="ri-refresh-line"
              @click="resetDirApprovalFilter"
            >
              Reset
            </VBtn>
          </div>
          <VDivider />
          <div class="d-flex flex-wrap align-center gap-4 px-4 py-3">
            <div style="min-width: 200px; flex: 1; max-width: 280px;">
              <div class="text-caption text-medium-emphasis mb-2">Pencarian</div>
              <VTextField
                v-model="dirApprovalParams.search"
                placeholder="Cari no. OB / klien..."
                clearable
                hide-details
                density="compact"
                prepend-inner-icon="ri-search-line"
                @update:model-value="debouncedDirFetch"
              />
            </div>
            <div style="min-width: 160px; max-width: 220px;">
              <div class="text-caption text-medium-emphasis mb-2">Approval</div>
              <VSelect
                v-model="dirApprovalParams.approval_status"
                placeholder="Semua Approval"
                clearable
                hide-details
                density="compact"
                :items="approvalStatusOptions"
                item-title="label"
                item-value="value"
                @update:model-value="doDirFetch"
              />
            </div>
            <div style="min-width: 180px; flex: 1; max-width: 260px;">
              <div class="text-caption text-medium-emphasis mb-2">Klien</div>
              <VAutocomplete
                v-model="dirApprovalParams.klien_ar_id"
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
                @update:model-value="doDirFetch"
              />
            </div>
            <VDivider vertical style="height: 40px; align-self: flex-end;" class="d-none d-sm-block" />
            <div>
              <div class="text-caption text-medium-emphasis mb-2">Dari</div>
              <VTextField
                v-model="dateDraftDirApproval.tanggal_dari"
                type="date"
                hide-details
                density="compact"
                style="min-width: 150px; max-width: 170px;"
              />
            </div>
            <div>
              <div class="text-caption text-medium-emphasis mb-2">Sampai</div>
              <VTextField
                v-model="dateDraftDirApproval.tanggal_sampai"
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
              @click="applyDateFiltersDirApproval"
            >
              Filter
            </VBtn>
          </div>
        </VCardText>
      </VCard>

      <VCard>
        <BaseTable
          :headers="approvalHeaders"
          :items="dirApprovalItems"
          :total="dirApprovalMeta.total"
          :loading="dirApprovalLoading"
          :per-page="dirApprovalMeta.per_page"
          :page="dirApprovalMeta.current_page"
          class="mt-2"
          column-resize-key="finance-opening-balance-approval"
          @update:options="onDirApprovalTableOptions"
        >
          <template #top>
            <div class="d-flex justify-end pa-3">
              <VBtn
                color="success"
                prepend-icon="ri-check-double-line"
                :loading="approvingAll"
                @click="confirmApproveAll"
              >
                Approve Semua
              </VBtn>
            </div>
          </template>
          <template #item.no="{ index }">
            {{ (dirApprovalMeta.current_page - 1) * dirApprovalMeta.per_page + index + 1 }}
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
          <template #item.total_tagihan="{ item }">
            {{ formatCurrency(item.total_tagihan) }}
          </template>
          <template #item.submitted_by_name="{ item }">
            {{ item.submitted_by_name ?? item.created_by_name ?? '-' }}
          </template>
          <template #item.submitted_at="{ item }">
            <span class="text-no-wrap">{{ formatDateTime(item.submitted_at) }}</span>
          </template>
          <template #item.approval_status="{ item }">
            <ApprovalStatusBadge :status="item.approval_status" />
          </template>
          <template #item.dir_approval_actions="{ item }">
            <div class="d-flex gap-1 justify-center">
              <VBtn
                v-if="item.approval_status === 'PENDING'"
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
                v-if="item.approval_status === 'PENDING'"
                icon
                size="small"
                variant="text"
                color="error"
                :loading="rejectingId === item.id"
                @click="confirmReject(item)"
              >
                <VIcon
                  icon="ri-close-circle-line"
                  size="18"
                />
                <VTooltip activator="parent">
                  Tolak
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

      <!-- Section 2: List Opening Balance -->
      <div class="d-flex align-center gap-3 mt-6 mb-4">
        <span class="text-h6 font-weight-semibold">List Opening Balance</span>
        <VDivider />
        <div class="d-flex gap-2">
          <VBtn
            v-if="authStore.canViewOpeningBalance"
            color="primary"
            prepend-icon="ri-file-excel-line"
            :loading="isExporting"
            @click="exportExcel"
          >
            Export
          </VBtn>
          <VBtn
            v-if="authStore.canOperateOpeningBalance"
            color="primary"
            prepend-icon="ri-add-line"
            :to="{ name: 'finance-opening-balance-create' }"
          >
            Ajukan Opening Balance
          </VBtn>
        </div>
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
                    {{ dirObSummary.total_invoice ?? '-' }}
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
                    {{ formatCurrency(dirObSummary.total_tagihan) }}
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
                    {{ formatCurrency(dirObSummary.total_pembayaran) }}
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
                    {{ formatCurrency(dirObSummary.total_sisa) }}
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
          <VBtn
            variant="text"
            color="secondary"
            size="small"
            prepend-icon="ri-refresh-line"
            @click="resetDirObFilterB2B"
          >
            Reset
          </VBtn>
        </div>
        <VDivider />
        <div class="d-flex flex-wrap align-center gap-4 px-4 py-3">
          <div style="min-width: 200px; flex: 1; max-width: 280px;">
            <div class="text-caption text-medium-emphasis mb-2">Pencarian</div>
            <VTextField
              v-model="dirObParamsB2B.search"
              placeholder="Cari no. OB / klien..."
              clearable
              hide-details
              density="compact"
              prepend-inner-icon="ri-search-line"
              @update:model-value="debouncedDirObFetchB2B"
            />
          </div>
          <div style="min-width: 140px; max-width: 180px;">
            <div class="text-caption text-medium-emphasis mb-2">Status</div>
            <VSelect
              v-model="dirObParamsB2B.status"
              placeholder="Semua Status"
              clearable
              hide-details
              density="compact"
              :items="statusOptions"
              item-title="label"
              item-value="value"
              @update:model-value="doDirObFetchB2B"
            />
          </div>
          <div style="min-width: 160px; max-width: 220px;">
            <div class="text-caption text-medium-emphasis mb-2">Approval</div>
            <VSelect
              v-model="dirObParamsB2B.approval_status"
              placeholder="Semua Approval"
              clearable
              hide-details
              density="compact"
              :items="approvalStatusOptions"
              item-title="label"
              item-value="value"
              @update:model-value="doDirObFetchB2B"
            />
          </div>
          <div style="min-width: 180px; flex: 1; max-width: 260px;">
            <div class="text-caption text-medium-emphasis mb-2">Klien</div>
            <VAutocomplete
              v-model="dirObParamsB2B.klien_ar_id"
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
              @update:model-value="doDirObFetchB2B"
            />
          </div>
          <VDivider vertical style="height: 40px; align-self: flex-end;" class="d-none d-sm-block" />
          <div>
            <div class="text-caption text-medium-emphasis mb-2">Dari</div>
            <VTextField
              v-model="dateDraftDirObB2B.tanggal_dari"
              type="date"
              hide-details
              density="compact"
              style="min-width: 150px; max-width: 170px;"
            />
          </div>
          <div>
            <div class="text-caption text-medium-emphasis mb-2">Sampai</div>
            <VTextField
              v-model="dateDraftDirObB2B.tanggal_sampai"
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
            @click="applyDateFiltersDirObB2B"
          >
            Filter
          </VBtn>
        </div>
        <VDivider />
        <BaseTable
          :headers="dirObHeadersB2B"
          :items="dirObItemsB2B"
          :total="dirObMetaB2B.total"
          :loading="dirObLoadingB2B"
          :per-page="dirObMetaB2B.per_page"
          :page="dirObMetaB2B.current_page"
          class="mt-2"
          column-resize-key="finance-opening-balance-dir-b2b"
          @update:options="onDirObTableOptionsB2B"
        >
          <template #item.no="{ index }">
            {{ (dirObMetaB2B.current_page - 1) * dirObMetaB2B.per_page + index + 1 }}
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
          <template #item.dir_ob_b2b_approval_status="{ item }">
            <ApprovalStatusBadge :status="item.approval_status" />
          </template>
          <template #item.dir_ob_b2b_actions="{ item }">
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
                variant="tonal"
                color="success"
                @click="openShareDialog([item])"
              >
                <VIcon
                  icon="ri-whatsapp-line"
                  size="18"
                />
                <VTooltip activator="parent">
                  Kirim via WhatsApp
                </VTooltip>
              </VBtn>
              <VBtn
                v-if="item.can_print"
                icon
                size="small"
                variant="text"
                color="secondary"
                :loading="printingId === item.id"
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
          <VBtn
            variant="text"
            color="secondary"
            size="small"
            prepend-icon="ri-refresh-line"
            @click="resetDirObFilterB2C"
          >
            Reset
          </VBtn>
        </div>
        <VDivider />
        <div class="d-flex flex-wrap align-center gap-4 px-4 py-3">
          <div style="min-width: 200px; flex: 1; max-width: 280px;">
            <div class="text-caption text-medium-emphasis mb-2">Pencarian</div>
            <VTextField
              v-model="dirObParams.search"
              placeholder="Cari no. OB / klien..."
              clearable
              hide-details
              density="compact"
              prepend-inner-icon="ri-search-line"
              @update:model-value="debouncedDirObFetch"
            />
          </div>
          <div style="min-width: 140px; max-width: 180px;">
            <div class="text-caption text-medium-emphasis mb-2">Status</div>
            <VSelect
              v-model="dirObParams.status"
              placeholder="Semua Status"
              clearable
              hide-details
              density="compact"
              :items="statusOptions"
              item-title="label"
              item-value="value"
              @update:model-value="doDirObFetch"
            />
          </div>
          <div style="min-width: 160px; max-width: 220px;">
            <div class="text-caption text-medium-emphasis mb-2">Approval</div>
            <VSelect
              v-model="dirObParams.approval_status"
              placeholder="Semua Approval"
              clearable
              hide-details
              density="compact"
              :items="approvalStatusOptions"
              item-title="label"
              item-value="value"
              @update:model-value="doDirObFetch"
            />
          </div>
          <div style="min-width: 180px; flex: 1; max-width: 260px;">
            <div class="text-caption text-medium-emphasis mb-2">Klien</div>
            <VAutocomplete
              v-model="dirObParams.klien_ar_id"
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
              @update:model-value="doDirObFetch"
            />
          </div>
          <VDivider vertical style="height: 40px; align-self: flex-end;" class="d-none d-sm-block" />
          <div>
            <div class="text-caption text-medium-emphasis mb-2">Dari</div>
            <VTextField
              v-model="dateDraftDirOb.tanggal_dari"
              type="date"
              hide-details
              density="compact"
              style="min-width: 150px; max-width: 170px;"
            />
          </div>
          <div>
            <div class="text-caption text-medium-emphasis mb-2">Sampai</div>
            <VTextField
              v-model="dateDraftDirOb.tanggal_sampai"
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
            @click="applyDateFiltersDirOb"
          >
            Filter
          </VBtn>
        </div>
        <VDivider />
        <BaseTable
          :headers="dirObHeaders"
          :items="dirObItems"
          :total="dirObMeta.total"
          :loading="dirObLoading"
          :per-page="dirObMeta.per_page"
          :page="dirObMeta.current_page"
          class="mt-2"
          column-resize-key="finance-opening-balance-dir-b2c"
          @update:options="onDirObTableOptions"
        >
          <template #item.no="{ index }">
            {{ (dirObMeta.current_page - 1) * dirObMeta.per_page + index + 1 }}
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
          <template #item.dir_ob_approval_status="{ item }">
            <ApprovalStatusBadge :status="item.approval_status" />
          </template>
          <template #item.dir_ob_actions="{ item }">
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
                variant="tonal"
                color="success"
                @click="openShareDialog([item])"
              >
                <VIcon
                  icon="ri-whatsapp-line"
                  size="18"
                />
                <VTooltip activator="parent">
                  Kirim via WhatsApp
                </VTooltip>
              </VBtn>
              <VBtn
                v-if="item.can_print"
                icon
                size="small"
                variant="text"
                color="secondary"
                :loading="printingId === item.id"
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
    </template>

    <!-- Catat Bayar Modal -->
    <PembayaranForm
      v-if="selectedForPayment"
      v-model="showPembayaran"
      :invoice-id="selectedForPayment.id"
      :sisa-tagihan="selectedForPayment.sisa_tagihan"
      :is-opening-balance="true"
      @saved="onPembayaranSaved"
    />

    <!-- Export Modal -->
    <BaseModal
      v-if="showExportModal"
      v-model="showExportModal"
      title="Export Opening Balance"
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
  </div>
</template>

<script setup>
/* eslint-disable camelcase */
import { defineAsyncComponent, onActivated, onBeforeUnmount, onDeactivated, reactive, ref } from 'vue'

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
import { useAuthStore } from '@/stores/auth.store'
import { useCrud } from '@/composables/useCrud'
import { useRemoteSearch } from '@/composables/useRemoteSearch'
import { useFormatter } from '@/composables/useFormatter'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { useFinanceNotificationStore } from '@/stores/finance-notification.store'
import api from '@/utils/axios'
import { readBlobError } from '@/utils/readBlobError'
import ApprovalStatusBadge from '@/modules/Finance/shared/components/ApprovalStatusBadge.vue'
import InvoiceStatusBadge from '@/modules/Finance/shared/components/InvoiceStatusBadge.vue'
import ShareInvoicesDialog from '@/modules/Finance/shared/components/ShareInvoicesDialog.vue'
import BulkActionBar from '@/modules/Finance/shared/components/BulkActionBar.vue'

const PembayaranForm = defineAsyncComponent(() => import('@/modules/Finance/shared/components/PembayaranForm.vue'))

const authStore = useAuthStore()
const { showAlert, showSuccess, showError, showLoading, closeAlert, confirmDelete, resolveThemeTokens } = useSweetAlert()
const financeNotificationStore = useFinanceNotificationStore()

// ── Shared: klien list ─────────────────────────────────────────────────────
const { items: klienList, loading: klienLoading, search: searchKlien, searchNow: searchKlienNow } = useRemoteSearch('/finance/klien-ar')

// ── Non-director: single table ─────────────────────────────────────────────
const { items, loading, meta, params, fetchList } = useCrud('/finance/opening-balance')
const { items: itemsB2B, loading: loadingB2B, meta: metaB2B, params: paramsB2B, fetchList: fetchListB2B } = useCrud('/finance/opening-balance')
const { formatCurrency, formatDate } = useFormatter()

const canSeeAll = authStore.hasAnyRole(['ADMIN', 'MANAGER', 'SUPERVISOR'])

const { tanggal_dari: defaultDari, tanggal_sampai: defaultSampai } = getDefaultMonthRange()

params.status = ''
params.approval_status = ''
params.klien_ar_id = null
params.tanggal_dari = defaultDari
params.tanggal_sampai = defaultSampai

paramsB2B.status = ''
paramsB2B.approval_status = ''
paramsB2B.klien_ar_id = null
paramsB2B.tanggal_dari = defaultDari
paramsB2B.tanggal_sampai = defaultSampai

const dateDraftB2C = reactive({ tanggal_dari: defaultDari, tanggal_sampai: defaultSampai })
const dateDraftB2B = reactive({ tanggal_dari: defaultDari, tanggal_sampai: defaultSampai })

if (canSeeAll) {
  params.segment = 'B2C'
  paramsB2B.segment = 'B2B'
}

const summary = reactive({
  total_invoice: null,
  total_tagihan: null,
  total_pembayaran: null,
  total_sisa: null,
})

// ── Director: approval table ───────────────────────────────────────────────
const { items: dirApprovalItems, loading: dirApprovalLoading, meta: dirApprovalMeta, params: dirApprovalParams, fetchList: fetchDirApprovalList } = useCrud('/finance/opening-balance')

dirApprovalParams.approval_status = 'PENDING'
dirApprovalParams.klien_ar_id = null
dirApprovalParams.tanggal_dari = defaultDari
dirApprovalParams.tanggal_sampai = defaultSampai

const dateDraftDirApproval = reactive({ tanggal_dari: defaultDari, tanggal_sampai: defaultSampai })

const dirApprovalSummary = reactive({
  total_invoice: null,
  total_tagihan: null,
  total_pembayaran: null,
  total_sisa: null,
})

const approvingId  = ref(null)
const rejectingId  = ref(null)
const approvingAll = ref(false)
const printingId   = ref(null)

// ── Director: OB list table ────────────────────────────────────────────────
const { items: dirObItems, loading: dirObLoading, meta: dirObMeta, params: dirObParams, fetchList: fetchDirObList } = useCrud('/finance/opening-balance')
const { items: dirObItemsB2B, loading: dirObLoadingB2B, meta: dirObMetaB2B, params: dirObParamsB2B, fetchList: fetchDirObListB2B } = useCrud('/finance/opening-balance')

dirObParams.status = ''
dirObParams.approval_status = 'APPROVED'
dirObParams.klien_ar_id = null
dirObParams.tanggal_dari = defaultDari
dirObParams.tanggal_sampai = defaultSampai
dirObParams.segment = 'B2C'

dirObParamsB2B.status = ''
dirObParamsB2B.approval_status = 'APPROVED'
dirObParamsB2B.klien_ar_id = null
dirObParamsB2B.tanggal_dari = defaultDari
dirObParamsB2B.tanggal_sampai = defaultSampai
dirObParamsB2B.segment = 'B2B'

const dateDraftDirOb = reactive({ tanggal_dari: defaultDari, tanggal_sampai: defaultSampai })
const dateDraftDirObB2B = reactive({ tanggal_dari: defaultDari, tanggal_sampai: defaultSampai })

const dirObSummary = reactive({
  total_invoice: null,
  total_tagihan: null,
  total_pembayaran: null,
  total_sisa: null,
})

// ── Bulk select state ──────────────────────────────────────────────────────
const selectedInvoices    = ref([])
const showShareDialog     = ref(false)
const shareTargetInvoices = ref([])

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

  const { isConfirmed } = await confirmDelete(confirmText)
  if (!isConfirmed) return

  showLoading({ title: 'Menghapus Data', text: 'Invoice sedang dihapus...' })
  try {
    const res = await api.delete('/finance/invoices/bulk', {
      data: { ids: draftItems.map(inv => inv.id) },
    })
    const deleted = res.data?.data?.deleted ?? draftItems.length
    selectedInvoices.value = []
    loadList()
    if (canSeeAll) loadListB2B()
    loadSummary()
    await showSuccess(`${deleted} invoice berhasil dihapus.`)
  } catch (err) {
    await showError(err.response?.data?.message ?? 'Gagal menghapus invoice')
  } finally {
    closeAlert({ onlyLoading: true })
  }
}

// ── Catat Bayar state ──────────────────────────────────────────────────────
const showPembayaran     = ref(false)
const selectedForPayment = ref(null)

function openCatatBayar(item) {
  selectedForPayment.value = item
  showPembayaran.value     = true
}

function onPembayaranSaved() {
  if (authStore.canApproveOpeningBalance) {
    loadDirObList()
    loadDirObListB2B()
    loadDirObSummary()
  } else {
    loadList()
    if (canSeeAll) loadListB2B()
    loadSummary()
  }
}

// ── Export (non-director) ──────────────────────────────────────────────────
const isExporting     = ref(false)
const showExportModal = ref(false)
const exportMonth     = ref(new Date().toISOString().slice(0, 7))

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
  isExporting.value = true
  showLoading({ title: 'Mengeksport Data Opening Balance', text: 'Mohon tunggu sebentar...' })
  try {
    const { tanggal_dari, tanggal_sampai } = monthToRange(exportMonth.value)
    const res = await api.get('/finance/opening-balance/export', {
      params: {
        search:          params.search          || undefined,
        status:          params.status          || undefined,
        approval_status: params.approval_status || undefined,
        klien_ar_id:     params.klien_ar_id     || undefined,
        karyawan_id:     params.karyawan_id     || undefined,
        tanggal_dari,
        tanggal_sampai,
      },
      responseType: 'blob',
    })
    const url  = URL.createObjectURL(res.data)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `Data Opening Balance-${new Date().toISOString().slice(0, 10)}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
    showSuccess({ title: 'Export Berhasil!', text: 'File berhasil diunduh.' })
  } catch {
    await showError('Gagal mengunduh data export.')
  } finally {
    isExporting.value = false
    closeAlert({ onlyLoading: true })
  }
}

// ── Export (director OB list) ──────────────────────────────────────────────
const isDirExporting    = ref(false)
const isDirExportingB2B = ref(false)

async function exportDirExcel() {
  isDirExporting.value = true
  showLoading({ title: 'Mengeksport Data Opening Balance', text: 'Mohon tunggu sebentar...' })
  try {
    const res = await api.get('/finance/opening-balance/export', {
      params: {
        search:          dirObParams.search          || undefined,
        status:          dirObParams.status          || undefined,
        approval_status: dirObParams.approval_status || undefined,
        klien_ar_id:     dirObParams.klien_ar_id     || undefined,
        tanggal_dari:    dirObParams.tanggal_dari    || undefined,
        tanggal_sampai:  dirObParams.tanggal_sampai  || undefined,
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
    showSuccess({ title: 'Export Berhasil!', text: 'File berhasil diunduh.' })
  } catch {
    await showError('Gagal mengunduh data export.')
  } finally {
    isDirExporting.value = false
    closeAlert({ onlyLoading: true })
  }
}

async function exportDirExcelB2B() {
  isDirExportingB2B.value = true
  showLoading({ title: 'Mengeksport Data Opening Balance', text: 'Mohon tunggu sebentar...' })
  try {
    const res = await api.get('/finance/opening-balance/export', {
      params: {
        search:          dirObParamsB2B.search          || undefined,
        status:          dirObParamsB2B.status          || undefined,
        approval_status: dirObParamsB2B.approval_status || undefined,
        klien_ar_id:     dirObParamsB2B.klien_ar_id     || undefined,
        tanggal_dari:    dirObParamsB2B.tanggal_dari    || undefined,
        tanggal_sampai:  dirObParamsB2B.tanggal_sampai  || undefined,
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
    showSuccess({ title: 'Export Berhasil!', text: 'File berhasil diunduh.' })
  } catch {
    await showError('Gagal mengunduh data export.')
  } finally {
    isDirExportingB2B.value = false
    closeAlert({ onlyLoading: true })
  }
}

// ── Print ──────────────────────────────────────────────────────────────────
async function printInvoice(id) {
  printingId.value = id
  try {
    const res = await api.get(`/finance/invoices/${id}/print`, { responseType: 'blob', timeout: 300000 })
    const blobUrl = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
    window.open(blobUrl, '_blank')
    setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000)
  } catch (err) {
    await showError(await readBlobError(err, 'Gagal membuka dokumen cetak'))
  } finally {
    printingId.value = null
  }
}

// ── Table headers ──────────────────────────────────────────────────────────
const headers = [
  { title: 'No', key: 'no', sortable: false, width: '60px' },
  { title: 'No Opening Balance', key: 'no_invoice', sortable: false },
  { title: 'Klien', key: 'klien_ar', sortable: false },
  { title: 'Tanggal', key: 'tanggal_invoice', sortable: false, width: '115px' },
  { title: 'Saldo Awal', key: 'total_tagihan', sortable: false },
  { title: 'Total Terbayar', key: 'total_pembayaran', sortable: false },
  { title: 'Sisa Tagihan', key: 'sisa_tagihan', sortable: false },
  { title: 'Status', key: 'status', sortable: false },
  { title: 'Approval', key: 'approval_status', sortable: false },
  { title: 'Aksi', key: 'actions', sortable: false, align: 'center', width: '120px' },
]

const approvalHeaders = [
  { title: 'No', key: 'no', sortable: false, width: '60px' },
  { title: 'No Opening Balance', key: 'no_invoice', sortable: false },
  { title: 'Klien', key: 'klien_ar', sortable: false },

  { title: 'Tanggal', key: 'tanggal_invoice', sortable: false, width: '115px' },
  { title: 'Nominal', key: 'total_tagihan', sortable: false },
  { title: 'Pengaju', key: 'submitted_by_name', sortable: false },
  { title: 'Diajukan Pada', key: 'submitted_at', sortable: false, width: '155px' },
  { title: 'Approval', key: 'approval_status', sortable: false },
  { title: 'Aksi', key: 'dir_approval_actions', sortable: false, align: 'center', width: '100px' },
]

const dirObHeaders = [
  { title: 'No', key: 'no', sortable: false, width: '60px' },
  { title: 'No Opening Balance', key: 'no_invoice', sortable: false },
  { title: 'Klien', key: 'klien_ar', sortable: false },
  { title: 'Tanggal', key: 'tanggal_invoice', sortable: false, width: '115px' },
  { title: 'Saldo Awal', key: 'total_tagihan', sortable: false },
  { title: 'Total Terbayar', key: 'total_pembayaran', sortable: false },
  { title: 'Sisa Tagihan', key: 'sisa_tagihan', sortable: false },
  { title: 'Status', key: 'status', sortable: false },
  { title: 'Approval', key: 'dir_ob_approval_status', sortable: false },
  { title: 'Aksi', key: 'dir_ob_actions', sortable: false, align: 'center', width: '120px' },
]

const dirObHeadersB2B = [
  { title: 'No', key: 'no', sortable: false, width: '60px' },
  { title: 'No Opening Balance', key: 'no_invoice', sortable: false },
  { title: 'Klien', key: 'klien_ar', sortable: false },
  { title: 'Tanggal', key: 'tanggal_invoice', sortable: false, width: '115px' },
  { title: 'Saldo Awal', key: 'total_tagihan', sortable: false },
  { title: 'Total Terbayar', key: 'total_pembayaran', sortable: false },
  { title: 'Sisa Tagihan', key: 'sisa_tagihan', sortable: false },
  { title: 'Status', key: 'status', sortable: false },
  { title: 'Approval', key: 'dir_ob_b2b_approval_status', sortable: false },
  { title: 'Aksi', key: 'dir_ob_b2b_actions', sortable: false, align: 'center', width: '120px' },
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


// ── Abort controllers ──────────────────────────────────────────────────────
let listController          = null
let listControllerB2B       = null
let summaryController       = null
let dirApprovalController   = null
let dirApprovalSumCtrl      = null
let dirObController         = null
let dirObB2BController      = null
let dirObSumCtrl            = null

function clearDirDebounceTimer() {
  clearTimeout(dirDebounceTimer)
  dirDebounceTimer = null
}

function clearDirObDebounceTimer() {
  clearTimeout(dirObDebounceTimer)
  dirObDebounceTimer = null
}

function clearDirObDebounceTimerB2B() {
  clearTimeout(dirObDebounceTimerB2B)
  dirObDebounceTimerB2B = null
}

function abortPendingRequests() {
  listController?.abort()
  listControllerB2B?.abort()
  summaryController?.abort()
  dirApprovalController?.abort()
  dirApprovalSumCtrl?.abort()
  dirObController?.abort()
  dirObB2BController?.abort()
  dirObSumCtrl?.abort()
  listController        = null
  listControllerB2B     = null
  summaryController     = null
  dirApprovalController = null
  dirApprovalSumCtrl    = null
  dirObController       = null
  dirObB2BController    = null
  dirObSumCtrl          = null
}

// ── Loaders: non-director ──────────────────────────────────────────────────
async function loadList() {
  listController?.abort()
  const controller = new AbortController()
  listController = controller
  await fetchList({}, { signal: controller.signal })
  if (listController === controller) listController = null
}

async function loadListB2B() {
  if (!canSeeAll) return
  listControllerB2B?.abort()
  const controller = new AbortController()
  listControllerB2B = controller
  await fetchListB2B({}, { signal: controller.signal })
  if (listControllerB2B === controller) listControllerB2B = null
}

async function loadSummary() {
  summaryController?.abort()
  const controller = new AbortController()
  summaryController = controller
  try {
    const { data } = await api.get('/finance/opening-balance/summary', {
      params: {
        search:          params.search,
        status:          params.status,
        approval_status: params.approval_status,
        klien_ar_id:     params.klien_ar_id,
        karyawan_id:     params.karyawan_id,
        tanggal_dari:    params.tanggal_dari,
        tanggal_sampai:  params.tanggal_sampai,
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

// ── Loaders: director approval table ──────────────────────────────────────
async function loadDirApprovalList() {
  dirApprovalController?.abort()
  const controller = new AbortController()
  dirApprovalController = controller
  await fetchDirApprovalList({}, { signal: controller.signal })
  if (dirApprovalController === controller) dirApprovalController = null
}

async function loadDirApprovalSummary() {
  dirApprovalSumCtrl?.abort()
  const controller = new AbortController()
  dirApprovalSumCtrl = controller
  try {
    const { data } = await api.get('/finance/opening-balance/summary', {
      params: {
        search:          dirApprovalParams.search,
        approval_status: dirApprovalParams.approval_status,
        klien_ar_id:     dirApprovalParams.klien_ar_id,
        tanggal_dari:    dirApprovalParams.tanggal_dari,
        tanggal_sampai:  dirApprovalParams.tanggal_sampai,
      },
      signal: controller.signal,
    })
    if (controller.signal.aborted) return
    Object.assign(dirApprovalSummary, data.data)
  } catch (err) {
    if (err.code === 'ERR_CANCELED') return
  } finally {
    if (dirApprovalSumCtrl === controller) dirApprovalSumCtrl = null
  }
}

// ── Loaders: director OB list ──────────────────────────────────────────────
async function loadDirObList() {
  dirObController?.abort()
  const controller = new AbortController()
  dirObController = controller
  await fetchDirObList({}, { signal: controller.signal })
  if (dirObController === controller) dirObController = null
}

async function loadDirObListB2B() {
  dirObB2BController?.abort()
  const controller = new AbortController()
  dirObB2BController = controller
  await fetchDirObListB2B({}, { signal: controller.signal })
  if (dirObB2BController === controller) dirObB2BController = null
}

async function loadDirObSummary() {
  dirObSumCtrl?.abort()
  const controller = new AbortController()
  dirObSumCtrl = controller
  try {
    const { data } = await api.get('/finance/opening-balance/summary', {
      params: {
        search:          dirObParams.search,
        status:          dirObParams.status,
        approval_status: dirObParams.approval_status,
        klien_ar_id:     dirObParams.klien_ar_id,
        tanggal_dari:    dirObParams.tanggal_dari,
        tanggal_sampai:  dirObParams.tanggal_sampai,
      },
      signal: controller.signal,
    })
    if (controller.signal.aborted) return
    Object.assign(dirObSummary, data.data)
  } catch (err) {
    if (err.code === 'ERR_CANCELED') return
  } finally {
    if (dirObSumCtrl === controller) dirObSumCtrl = null
  }
}

// ── Fetch helpers: non-director ────────────────────────────────────────────
function doFetchB2C() {
  params.page = 1
  loadList()
  loadSummary()
}

function doFetchB2B() {
  paramsB2B.page = 1
  loadListB2B()
}

let debounceTimerB2C = null
let debounceTimerB2B = null

function debouncedFetchB2C() {
  clearTimeout(debounceTimerB2C)
  debounceTimerB2C = setTimeout(doFetchB2C, 400)
}

function debouncedFetchB2B() {
  clearTimeout(debounceTimerB2B)
  debounceTimerB2B = setTimeout(doFetchB2B, 400)
}

function onTableOptions({ page, itemsPerPage }) {
  params.page = page
  params.per_page = itemsPerPage
  meta.current_page = page
  meta.per_page = itemsPerPage
  loadList()
}

function onTableOptionsB2B({ page, itemsPerPage }) {
  paramsB2B.page = page
  paramsB2B.per_page = itemsPerPage
  metaB2B.current_page = page
  metaB2B.per_page = itemsPerPage
  loadListB2B()
}

function applyDateFiltersB2C() {
  Object.assign(params, dateDraftB2C)
  doFetchB2C()
}

function applyDateFiltersB2B() {
  Object.assign(paramsB2B, dateDraftB2B)
  doFetchB2B()
}

function resetFiltersB2C() {
  const { tanggal_dari, tanggal_sampai } = getDefaultMonthRange()
  params.search          = ''
  params.status          = ''
  params.approval_status = ''
  params.klien_ar_id     = null
  params.tanggal_dari    = tanggal_dari
  params.tanggal_sampai  = tanggal_sampai
  Object.assign(dateDraftB2C, { tanggal_dari, tanggal_sampai })
  doFetchB2C()
}

function resetFiltersB2B() {
  const { tanggal_dari, tanggal_sampai } = getDefaultMonthRange()
  paramsB2B.search          = ''
  paramsB2B.status          = ''
  paramsB2B.approval_status = ''
  paramsB2B.klien_ar_id     = null
  paramsB2B.tanggal_dari    = tanggal_dari
  paramsB2B.tanggal_sampai  = tanggal_sampai
  Object.assign(dateDraftB2B, { tanggal_dari, tanggal_sampai })
  doFetchB2B()
}

function resetDirApprovalFilter() {
  const { tanggal_dari, tanggal_sampai } = getDefaultMonthRange()
  dirApprovalParams.search          = ''
  dirApprovalParams.approval_status = 'PENDING'
  dirApprovalParams.klien_ar_id     = null
  dirApprovalParams.tanggal_dari    = tanggal_dari
  dirApprovalParams.tanggal_sampai  = tanggal_sampai
  Object.assign(dateDraftDirApproval, { tanggal_dari, tanggal_sampai })
  doDirFetch()
}

function resetDirObFilter() {
  const { tanggal_dari, tanggal_sampai } = getDefaultMonthRange()
  dirObParams.search          = ''
  dirObParams.status          = ''
  dirObParams.approval_status = 'APPROVED'
  dirObParams.klien_ar_id     = null
  dirObParams.tanggal_dari    = tanggal_dari
  dirObParams.tanggal_sampai  = tanggal_sampai
  Object.assign(dateDraftDirOb, { tanggal_dari, tanggal_sampai })
  doDirObFetch()
}

// ── Fetch helpers: director approval table ─────────────────────────────────
function doDirFetch() {
  dirApprovalParams.page = 1
  loadDirApprovalList()
  loadDirApprovalSummary()
}

let dirDebounceTimer = null
function debouncedDirFetch() {
  clearDirDebounceTimer()
  dirDebounceTimer = setTimeout(doDirFetch, 400)
}

function applyDateFiltersDirApproval() {
  Object.assign(dirApprovalParams, dateDraftDirApproval)
  doDirFetch()
}

function onDirApprovalTableOptions({ page, itemsPerPage }) {
  dirApprovalParams.page = page
  dirApprovalParams.per_page = itemsPerPage
  dirApprovalMeta.current_page = page
  dirApprovalMeta.per_page = itemsPerPage
  loadDirApprovalList()
}

// ── Fetch helpers: director OB list ───────────────────────────────────────
function doDirObFetch() {
  dirObParams.page = 1
  loadDirObList()
  loadDirObSummary()
}

let dirObDebounceTimer = null
function debouncedDirObFetch() {
  clearDirObDebounceTimer()
  dirObDebounceTimer = setTimeout(doDirObFetch, 400)
}

function applyDateFiltersDirOb() {
  Object.assign(dirObParams, dateDraftDirOb)
  doDirObFetch()
}

function onDirObTableOptions({ page, itemsPerPage }) {
  dirObParams.page = page
  dirObParams.per_page = itemsPerPage
  dirObMeta.current_page = page
  dirObMeta.per_page = itemsPerPage
  loadDirObList()
}

function doDirObFetchB2B() {
  dirObParamsB2B.page = 1
  loadDirObListB2B()
}

let dirObDebounceTimerB2B = null
function debouncedDirObFetchB2B() {
  clearDirObDebounceTimerB2B()
  dirObDebounceTimerB2B = setTimeout(doDirObFetchB2B, 400)
}

function applyDateFiltersDirObB2B() {
  Object.assign(dirObParamsB2B, dateDraftDirObB2B)
  doDirObFetchB2B()
}

function onDirObTableOptionsB2B({ page, itemsPerPage }) {
  dirObParamsB2B.page = page
  dirObParamsB2B.per_page = itemsPerPage
  dirObMetaB2B.current_page = page
  dirObMetaB2B.per_page = itemsPerPage
  loadDirObListB2B()
}

function resetDirObFilterB2B() {
  const { tanggal_dari, tanggal_sampai } = getDefaultMonthRange()
  dirObParamsB2B.search          = ''
  dirObParamsB2B.status          = ''
  dirObParamsB2B.approval_status = 'APPROVED'
  dirObParamsB2B.klien_ar_id     = null
  dirObParamsB2B.tanggal_dari    = tanggal_dari
  dirObParamsB2B.tanggal_sampai  = tanggal_sampai
  Object.assign(dateDraftDirObB2B, { tanggal_dari, tanggal_sampai })
  doDirObFetchB2B()
}

function resetDirObFilterB2C() {
  const { tanggal_dari, tanggal_sampai } = getDefaultMonthRange()
  dirObParams.search          = ''
  dirObParams.status          = ''
  dirObParams.approval_status = 'APPROVED'
  dirObParams.klien_ar_id     = null
  dirObParams.tanggal_dari    = tanggal_dari
  dirObParams.tanggal_sampai  = tanggal_sampai
  Object.assign(dateDraftDirOb, { tanggal_dari, tanggal_sampai })
  doDirObFetch()
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
    confirmButtonColor: resolveThemeTokens().success,
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
    doDirFetch()
    loadDirObList()
    loadDirObListB2B()
    loadDirObSummary()
    financeNotificationStore.fetchPendingOpeningBalanceCount()
  } catch (err) {
    const message = err?.response?.data?.message ?? 'Gagal menyetujui Opening Balance.'
    showError({ text: message })
  } finally {
    approvingId.value = null
  }
}

// ── Reject action ──────────────────────────────────────────────────────────
async function confirmReject(item) {
  const result = await showAlert({
    icon: 'warning',
    title: 'Tolak Opening Balance?',
    html: `Berikan alasan penolakan untuk <strong>${item.no_invoice}</strong> atas nama <strong>${item.klien_ar?.nama_klien ?? '-'}</strong>.`,
    input: 'textarea',
    inputPlaceholder: 'Alasan penolakan...',
    inputAttributes: { rows: 3 },
    inputValidator: value => !value?.trim() ? 'Alasan penolakan wajib diisi.' : null,
    confirmButtonText: 'Ya, Tolak',
    confirmButtonColor: resolveThemeTokens().error,
    cancelButtonText: 'Batal',
    showCancelButton: true,
    focusCancel: true,
    reverseButtons: true,
  })

  if (!result.isConfirmed) return

  rejectingId.value = item.id
  try {
    await api.patch(`/finance/opening-balance/${item.id}/reject`, { note: result.value })
    await showSuccess({ text: `Opening Balance ${item.no_invoice} berhasil ditolak.` })
    doDirFetch()
    financeNotificationStore.fetchPendingOpeningBalanceCount()
  } catch (err) {
    const message = err?.response?.data?.message ?? 'Gagal menolak Opening Balance.'
    showError({ text: message })
  } finally {
    rejectingId.value = null
  }
}

// ── Approve All action ─────────────────────────────────────────────────────
async function confirmApproveAll() {
  const pending = dirApprovalItems.value.filter(i => i.approval_status === 'PENDING')
  if (!pending.length) {
    showError({ text: 'Tidak ada Opening Balance yang perlu disetujui.' })

    return
  }

  const result = await showAlert({
    icon: 'question',
    title: 'Approve Semua Opening Balance?',
    text: `Anda akan menyetujui ${pending.length} Opening Balance yang sedang ditampilkan.`,
    confirmButtonText: 'Ya, Approve Semua',
    confirmButtonColor: resolveThemeTokens().success,
    cancelButtonText: 'Batal',
    showCancelButton: true,
    focusCancel: true,
    reverseButtons: true,
  })

  if (!result.isConfirmed) return

  approvingAll.value = true
  try {
    await Promise.all(pending.map(item =>
      api.patch(`/finance/opening-balance/${item.id}/approve`, { note: null }),
    ))
    await showSuccess({ text: `${pending.length} Opening Balance berhasil disetujui.` })
    doDirFetch()
    loadDirObList()
    loadDirObListB2B()
    loadDirObSummary()
    financeNotificationStore.fetchPendingOpeningBalanceCount()
  } catch (err) {
    const message = err?.response?.data?.message ?? 'Gagal menyetujui sebagian Opening Balance.'
    showError({ text: message })
    doDirFetch()
  } finally {
    approvingAll.value = false
  }
}

// ── Lifecycle ──────────────────────────────────────────────────────────────
function initLoad() {
  if (authStore.canApproveOpeningBalance) {
    loadDirApprovalList()
    loadDirApprovalSummary()
    loadDirObList()
    loadDirObListB2B()
    loadDirObSummary()
  } else {
    const isPrivileged = authStore.isAdmin || authStore.isManager || authStore.isSupervisor
    if (!isPrivileged && authStore.user?.karyawan_id) {
      params.karyawan_id = authStore.user.karyawan_id
    }
    loadList()
    if (canSeeAll) loadListB2B()
    loadSummary()
  }
}

// onActivated fires on first mount AND every re-activation (KeepAlive).
// Using only onActivated avoids the double-load race that was resetting loading=false
// prematurely (onMounted + onActivated both fired on first mount, causing the aborted
// first request's finally block to clear loading while the second request was still running).
onActivated(initLoad)

onDeactivated(() => {
  clearTimeout(debounceTimerB2C)
  clearTimeout(debounceTimerB2B)
  clearDirDebounceTimer()
  clearDirObDebounceTimer()
  clearDirObDebounceTimerB2B()
  abortPendingRequests()

  // Dialog teleports (VDialog) survive keep-alive deactivation, so force-close
  // them to avoid a stuck scrim on other pages.
  showShareDialog.value = false
  showPembayaran.value = false
  showExportModal.value = false
})

onBeforeUnmount(() => {
  clearTimeout(debounceTimerB2C)
  clearTimeout(debounceTimerB2B)
  clearDirDebounceTimer()
  clearDirObDebounceTimer()
  clearDirObDebounceTimerB2B()
  abortPendingRequests()
})
</script>
