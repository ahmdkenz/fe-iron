<template>
  <div>
    <PageHeader
      title="Opening Balance"
      :subtitle="authStore.isDirector ? 'Tinjau dan proses opening balance yang memerlukan persetujuan' : 'Kelola saldo awal piutang klien'"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Opening Balance', disabled: true },
      ]"
    >
      <div
        v-if="!authStore.isDirector"
        class="d-flex gap-2"
      >
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
          prepend-icon="ri-upload-line"
          @click="openImport"
        >
          Import
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

    <!-- ── Non-Director View ──────────────────────────────────────────────── -->
    <template v-if="!authStore.isDirector">
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
            v-model="params.status"
            placeholder="Semua Status"
            clearable
            hide-details
            density="compact"
            style="max-width: 160px"
            :items="statusOptions"
            item-title="label"
            item-value="value"
            @update:model-value="doFetch"
          />
          <VSelect
            v-model="params.approval_status"
            placeholder="Semua Approval"
            clearable
            hide-details
            density="compact"
            style="max-width: 220px"
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
          <template #item.tanggal_invoice="{ item }">
            {{ formatDate(item.tanggal_invoice) }}
          </template>
          <template #item.periode="{ item }">
            {{ formatPeriode(item) }}
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

    <!-- ── Director View ──────────────────────────────────────────────────── -->
    <template v-if="authStore.isDirector">
      <!-- Section 1: Approval table -->
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

      <VCard>
        <VCardText class="d-flex flex-wrap gap-3 pb-0">
          <VTextField
            v-model="dirApprovalParams.search"
            placeholder="Cari no. OB / klien..."
            clearable
            hide-details
            density="compact"
            style="max-width: 250px"
            prepend-inner-icon="ri-search-line"
            @update:model-value="debouncedDirFetch"
          />
          <VSelect
            v-model="dirApprovalParams.approval_status"
            placeholder="Semua Approval"
            clearable
            hide-details
            density="compact"
            style="max-width: 230px"
            :items="approvalStatusOptions"
            item-title="label"
            item-value="value"
            @update:model-value="doDirFetch"
          />
          <VAutocomplete
            v-model="dirApprovalParams.klien_ar_id"
            placeholder="Semua Klien"
            clearable
            hide-details
            density="compact"
            style="max-width: 220px"
            :items="klienList"
            item-title="nama_klien"
            item-value="id"
            :loading="klienLoading"
            @update:model-value="doDirFetch"
          />
          <VSelect
            v-model="dirApprovalParams.periode_bulan"
            placeholder="Bulan"
            clearable
            hide-details
            density="compact"
            style="max-width: 140px"
            :items="bulanOptions"
            item-title="label"
            item-value="value"
            @update:model-value="doDirFetch"
          />
          <VTextField
            v-model="dirApprovalParams.periode_tahun"
            placeholder="Tahun"
            clearable
            hide-details
            density="compact"
            style="max-width: 100px"
            type="number"
            @update:model-value="debouncedDirFetch"
          />
        </VCardText>

        <BaseTable
          :headers="approvalHeaders"
          :items="dirApprovalItems"
          :total="dirApprovalMeta.total"
          :loading="dirApprovalLoading"
          :per-page="dirApprovalMeta.per_page"
          :page="dirApprovalMeta.current_page"
          class="mt-2"
          @update:options="onDirApprovalTableOptions"
        >
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

      <VCard>
        <VCardText class="d-flex flex-wrap gap-3 pb-0 align-center">
          <VTextField
            v-model="dirObParams.search"
            placeholder="Cari no. OB / klien..."
            clearable
            hide-details
            density="compact"
            style="max-width: 250px"
            prepend-inner-icon="ri-search-line"
            @update:model-value="debouncedDirObFetch"
          />
          <VSelect
            v-model="dirObParams.status"
            placeholder="Semua Status"
            clearable
            hide-details
            density="compact"
            style="max-width: 160px"
            :items="statusOptions"
            item-title="label"
            item-value="value"
            @update:model-value="doDirObFetch"
          />
          <VSelect
            v-model="dirObParams.approval_status"
            placeholder="Semua Approval"
            clearable
            hide-details
            density="compact"
            style="max-width: 220px"
            :items="approvalStatusOptions"
            item-title="label"
            item-value="value"
            @update:model-value="doDirObFetch"
          />
          <VAutocomplete
            v-model="dirObParams.klien_ar_id"
            placeholder="Semua Klien"
            clearable
            hide-details
            density="compact"
            style="max-width: 220px"
            :items="klienList"
            item-title="nama_klien"
            item-value="id"
            :loading="klienLoading"
            @update:model-value="doDirObFetch"
          />
          <VSelect
            v-model="dirObParams.periode_bulan"
            placeholder="Bulan"
            clearable
            hide-details
            density="compact"
            style="max-width: 140px"
            :items="bulanOptions"
            item-title="label"
            item-value="value"
            @update:model-value="doDirObFetch"
          />
          <VTextField
            v-model="dirObParams.periode_tahun"
            placeholder="Tahun"
            clearable
            hide-details
            density="compact"
            style="max-width: 100px"
            type="number"
            @update:model-value="debouncedDirObFetch"
          />
          <VSpacer />
          <VBtn
            color="primary"
            prepend-icon="ri-file-excel-line"
            :loading="isDirExporting"
            @click="exportDirExcel"
          >
            Export
          </VBtn>
        </VCardText>

        <BaseTable
          :headers="dirObHeaders"
          :items="dirObItems"
          :total="dirObMeta.total"
          :loading="dirObLoading"
          :per-page="dirObMeta.per_page"
          :page="dirObMeta.current_page"
          class="mt-2"
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
            {{ formatDate(item.tanggal_invoice) }}
          </template>
          <template #item.periode="{ item }">
            {{ formatPeriode(item) }}
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
    </template>

    <!-- Catat Bayar Modal -->
    <PembayaranForm
      v-if="selectedForPayment"
      v-model="showPembayaran"
      :invoice-id="selectedForPayment.id"
      :sisa-tagihan="selectedForPayment.sisa_tagihan"
      @saved="onPembayaranSaved"
    />

    <!-- Import Dialog (non-director only) -->
    <VDialog
      v-if="!authStore.isDirector"
      v-model="showImport"
      max-width="600"
      persistent
    >
      <VCard>
        <VCardTitle class="d-flex align-center justify-space-between pa-4">
          <span>Import Data Opening Balance</span>
          <VBtn
            icon
            size="small"
            variant="text"
            @click="closeImport"
          >
            <VIcon icon="ri-close-line" />
          </VBtn>
        </VCardTitle>
        <VDivider />
        <VCardText class="pt-4">
          <VAlert
            type="warning"
            variant="tonal"
            class="mb-3"
            density="compact"
          >
            <div class="text-body-2">
              <strong>Kapan menggunakan Opening Balance?</strong>
              Hanya untuk piutang <em>historis</em> yang berasal dari luar sistem (spreadsheet, sistem lama, atau manual).
              Jika invoice sudah pernah diinput di sistem ini, sisa tagihan sudah otomatis terbawa — tidak perlu Opening Balance.
            </div>
          </VAlert>

          <VAlert
            type="info"
            variant="tonal"
            class="mb-4"
          >
            <div class="mb-2 font-weight-medium">
              Panduan Import:
            </div>
            <ul class="ps-4">
              <li>Download template Excel, isi data, lalu upload file <strong>(.xlsx)</strong> atau <strong>(.csv)</strong>.</li>
              <li>
                Template Excel terdiri dari <strong>3 sheet data</strong>:
                <ul class="ps-3 mt-1">
                  <li><strong>Sheet 1</strong> — Data Opening Balance utama (wajib diisi, termasuk kolom <code>no_urut</code>)</li>
                  <li><strong>Sheet 2</strong> — Rincian Invoice Asal (opsional, referensi via <code>no_urut_ob</code>)</li>
                  <li><strong>Sheet 3</strong> — Item per Invoice Asal (opsional, referensi via <code>no_urut_ob</code> + <code>no_invoice_asal</code>)</li>
                </ul>
              </li>
              <li class="mt-1">
                <strong>File CSV</strong> hanya mengimpor data OB utama (Sheet 1 saja).
              </li>
              <li>Kolom <strong>nama_klien</strong> harus cocok persis dengan nama klien di sistem.</li>
              <li>
                Kolom <strong>tanggal</strong> = tanggal pengajuan OB (hari ini).
                Kolom <strong>periode_awal</strong> dan <strong>periode_akhir</strong> = rentang waktu invoice historis yang belum lunas
                (bukan tanggal hari ini). Contoh: invoice Mei 2026 belum lunas → isi <code>2026-05-01</code> s/d <code>2026-05-31</code>.
              </li>
              <li>Semua tanggal diisi format <strong>YYYY-MM-DD</strong> (contoh: <code>2024-01-15</code>).</li>
              <li>Data berhasil diimport berstatus <strong>DRAFT</strong> dan perlu persetujuan Direktur.</li>
            </ul>
          </VAlert>

          <VBtn
            variant="outlined"
            color="primary"
            prepend-icon="ri-file-excel-line"
            class="mb-4"
            @click="downloadTemplate"
          >
            Download Template
          </VBtn>

          <VFileInput
            v-model="importFile"
            label="Pilih File (.xlsx, .xls, atau .csv)"
            accept=".xlsx,.xls,.csv"
            prepend-icon="ri-file-upload-line"
            variant="outlined"
            density="compact"
            clearable
            hide-details="auto"
            @update:model-value="importResult = null"
          />

          <div
            v-if="importResult"
            class="mt-4"
          >
            <VAlert
              :type="(importResult.failed_ob + importResult.failed_detail + importResult.failed_item) > 0 ? 'warning' : 'success'"
              variant="tonal"
              class="mb-3"
            >
              <div class="font-weight-medium mb-1">
                Import selesai
              </div>
              <div class="text-body-2">
                <span class="text-success font-weight-medium">{{ importResult.inserted_ob }}</span> OB ditambahkan
                <template v-if="!importResult.is_csv">
                  &nbsp;·&nbsp;<span class="text-success font-weight-medium">{{ importResult.inserted_detail }}</span> rincian
                  &nbsp;·&nbsp;<span class="text-success font-weight-medium">{{ importResult.inserted_item }}</span> item
                </template>
                <span
                  v-if="(importResult.failed_ob + importResult.failed_detail + importResult.failed_item) > 0"
                  class="text-error font-weight-medium"
                >
                  &nbsp;·&nbsp;{{ importResult.failed_ob + importResult.failed_detail + importResult.failed_item }} gagal
                </span>
              </div>
            </VAlert>

            <div v-if="importResult.errors?.length">
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
                    v-for="(err, idx) in importResult.errors"
                    :key="idx"
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
  </div>
</template>

<script setup>
/* eslint-disable camelcase */
import { onBeforeUnmount, onDeactivated, onMounted, reactive, ref } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useCrud } from '@/composables/useCrud'
import { useFormatter } from '@/composables/useFormatter'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { useFinanceNotificationStore } from '@/stores/finance-notification.store'
import api from '@/utils/axios'
import ApprovalStatusBadge from '../components/ApprovalStatusBadge.vue'
import InvoiceStatusBadge from '../components/InvoiceStatusBadge.vue'
import PembayaranForm from '../components/PembayaranForm.vue'

const authStore = useAuthStore()
const { showAlert, showSuccess, showError } = useSweetAlert()
const financeNotificationStore = useFinanceNotificationStore()

// ── Shared: klien list ─────────────────────────────────────────────────────
const { items: klienList, loading: klienLoading, fetchAll: fetchKlien } = useCrud('/finance/klien-ar')

// ── Non-director: single table ─────────────────────────────────────────────
const { items, loading, meta, params, fetchList } = useCrud('/finance/opening-balance')
const { formatCurrency, formatDate } = useFormatter()

params.status = ''
params.approval_status = ''
params.klien_ar_id = null
params.periode_bulan = null
params.periode_tahun = null

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
dirApprovalParams.periode_bulan = null
dirApprovalParams.periode_tahun = null

const dirApprovalSummary = reactive({
  total_invoice: null,
  total_tagihan: null,
  total_pembayaran: null,
  total_sisa: null,
})

const approvingId = ref(null)

// ── Director: OB list table ────────────────────────────────────────────────
const { items: dirObItems, loading: dirObLoading, meta: dirObMeta, params: dirObParams, fetchList: fetchDirObList } = useCrud('/finance/opening-balance')

dirObParams.status = ''
dirObParams.approval_status = 'APPROVED'
dirObParams.klien_ar_id = null
dirObParams.periode_bulan = null
dirObParams.periode_tahun = null

const dirObSummary = reactive({
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
  if (authStore.isDirector) {
    loadDirObList()
    loadDirObSummary()
  } else {
    loadList()
    loadSummary()
  }
}

// ── Export (non-director) ──────────────────────────────────────────────────
const isExporting = ref(false)

async function exportExcel() {
  isExporting.value = true
  try {
    const res = await api.get('/finance/opening-balance/export', {
      params: {
        search:          params.search        || undefined,
        status:          params.status        || undefined,
        approval_status: params.approval_status || undefined,
        klien_ar_id:     params.klien_ar_id   || undefined,
        karyawan_id:     params.karyawan_id   || undefined,
        periode_bulan:   params.periode_bulan || undefined,
        periode_tahun:   params.periode_tahun || undefined,
      },
      responseType: 'blob',
    })
    const url  = URL.createObjectURL(res.data)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `Data Opening Balance-${new Date().toISOString().slice(0, 10)}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    window.alert('Gagal mengunduh data export.')
  } finally {
    isExporting.value = false
  }
}

// ── Export (director OB list) ──────────────────────────────────────────────
const isDirExporting = ref(false)

async function exportDirExcel() {
  isDirExporting.value = true
  try {
    const res = await api.get('/finance/opening-balance/export', {
      params: {
        search:          dirObParams.search          || undefined,
        status:          dirObParams.status          || undefined,
        approval_status: dirObParams.approval_status || undefined,
        klien_ar_id:     dirObParams.klien_ar_id     || undefined,
        periode_bulan:   dirObParams.periode_bulan   || undefined,
        periode_tahun:   dirObParams.periode_tahun   || undefined,
      },
      responseType: 'blob',
    })
    const url  = URL.createObjectURL(res.data)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `Data Opening Balance-${new Date().toISOString().slice(0, 10)}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    window.alert('Gagal mengunduh data export.')
  } finally {
    isDirExporting.value = false
  }
}

// ── Import (non-director) ──────────────────────────────────────────────────
const showImport   = ref(false)
const importing    = ref(false)
const importFile   = ref(null)
const importResult = ref(null)

function openImport() {
  importFile.value   = null
  importResult.value = null
  showImport.value   = true
}

function closeImport() {
  showImport.value = false
  if (importResult.value?.inserted_ob > 0) {
    doFetch()
  }
}

async function downloadTemplate() {
  try {
    const res  = await api.get('/finance/opening-balance/import-template', { responseType: 'blob' })
    const url  = URL.createObjectURL(res.data)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'Template OB (Saldo Awal).xlsx'
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    window.alert('Gagal mengunduh template.')
  }
}

async function doImport() {
  if (!importFile.value) return
  importing.value    = true
  importResult.value = null
  try {
    const formData = new FormData()
    formData.append('file', importFile.value)
    const res = await api.post('/finance/opening-balance/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    importResult.value = res.data.data
    importFile.value   = null
  } catch (err) {
    const message = err?.response?.data?.message || 'Gagal mengimport data.'
    window.alert(message)
  } finally {
    importing.value = false
  }
}

// ── Print ──────────────────────────────────────────────────────────────────
async function printInvoice(id) {
  try {
    const res = await api.get(`/finance/invoices/${id}/print`, { responseType: 'blob' })
    const blobUrl = URL.createObjectURL(res.data)
    window.open(blobUrl, '_blank')
    setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000)
  } catch {
    window.alert('Gagal membuka dokumen cetak')
  }
}

// ── Table headers ──────────────────────────────────────────────────────────
const headers = [
  { title: 'No', key: 'no', sortable: false, width: '60px' },
  { title: 'No Opening Balance', key: 'no_invoice', sortable: false },
  { title: 'Klien', key: 'klien_ar', sortable: false },
  { title: 'Tanggal', key: 'tanggal_invoice', sortable: false },
  { title: 'Periode', key: 'periode', sortable: false },
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
  { title: 'Entitas', key: 'perusahaan', sortable: false },
  { title: 'Tanggal', key: 'tanggal_invoice', sortable: false },
  { title: 'Nominal', key: 'total_tagihan', sortable: false },
  { title: 'Pengaju', key: 'submitted_by_name', sortable: false },
  { title: 'Diajukan Pada', key: 'submitted_at', sortable: false },
  { title: 'Approval', key: 'approval_status', sortable: false },
  { title: 'Aksi', key: 'dir_approval_actions', sortable: false, align: 'center', width: '100px' },
]

const dirObHeaders = [
  { title: 'No', key: 'no', sortable: false, width: '60px' },
  { title: 'No Opening Balance', key: 'no_invoice', sortable: false },
  { title: 'Klien', key: 'klien_ar', sortable: false },
  { title: 'Tanggal', key: 'tanggal_invoice', sortable: false },
  { title: 'Periode', key: 'periode', sortable: false },
  { title: 'Saldo Awal', key: 'total_tagihan', sortable: false },
  { title: 'Total Terbayar', key: 'total_pembayaran', sortable: false },
  { title: 'Sisa Tagihan', key: 'sisa_tagihan', sortable: false },
  { title: 'Status', key: 'status', sortable: false },
  { title: 'Approval', key: 'dir_ob_approval_status', sortable: false },
  { title: 'Aksi', key: 'dir_ob_actions', sortable: false, align: 'center', width: '120px' },
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
let listController          = null
let summaryController       = null
let klienController         = null
let dirApprovalController   = null
let dirApprovalSumCtrl      = null
let dirObController         = null
let dirObSumCtrl            = null

function clearDebounceTimer() {
  clearTimeout(debounceTimer)
  debounceTimer = null
}

function clearDirDebounceTimer() {
  clearTimeout(dirDebounceTimer)
  dirDebounceTimer = null
}

function clearDirObDebounceTimer() {
  clearTimeout(dirObDebounceTimer)
  dirObDebounceTimer = null
}

function abortPendingRequests() {
  listController?.abort()
  summaryController?.abort()
  klienController?.abort()
  dirApprovalController?.abort()
  dirApprovalSumCtrl?.abort()
  dirObController?.abort()
  dirObSumCtrl?.abort()
  listController        = null
  summaryController     = null
  klienController       = null
  dirApprovalController = null
  dirApprovalSumCtrl    = null
  dirObController       = null
  dirObSumCtrl          = null
}

// ── Loaders: shared ────────────────────────────────────────────────────────
async function loadKlien() {
  klienController?.abort()
  const controller = new AbortController()
  klienController = controller
  await fetchKlien({ signal: controller.signal })
  if (klienController === controller) klienController = null
}

// ── Loaders: non-director ──────────────────────────────────────────────────
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
        status:          params.status,
        approval_status: params.approval_status,
        klien_ar_id:     params.klien_ar_id,
        karyawan_id:     params.karyawan_id,
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
        periode_bulan:   dirApprovalParams.periode_bulan,
        periode_tahun:   dirApprovalParams.periode_tahun,
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
        periode_bulan:   dirObParams.periode_bulan,
        periode_tahun:   dirObParams.periode_tahun,
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

function onDirApprovalTableOptions({ page, itemsPerPage }) {
  dirApprovalParams.page = page
  dirApprovalParams.per_page = itemsPerPage
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

function onDirObTableOptions({ page, itemsPerPage }) {
  dirObParams.page = page
  dirObParams.per_page = itemsPerPage
  loadDirObList()
}

// ── Helpers ────────────────────────────────────────────────────────────────
function formatPeriode(item) {
  if (!item.periode_awal || !item.periode_akhir) return '-'

  return `${formatDate(item.periode_awal)} - ${formatDate(item.periode_akhir)}`
}

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
    doDirFetch()
    loadDirObList()
    loadDirObSummary()
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
  loadKlien()
  if (authStore.isDirector) {
    loadDirApprovalList()
    loadDirApprovalSummary()
    loadDirObList()
    loadDirObSummary()
  } else {
    const isPrivileged = authStore.isAdmin || authStore.isManager || authStore.isSupervisor
    if (!isPrivileged && authStore.user?.karyawan_id) {
      params.karyawan_id = authStore.user.karyawan_id
    }
    loadList()
    loadSummary()
  }
})

onDeactivated(() => {
  clearDebounceTimer()
  clearDirDebounceTimer()
  clearDirObDebounceTimer()
  abortPendingRequests()
})

onBeforeUnmount(() => {
  clearDebounceTimer()
  clearDirDebounceTimer()
  clearDirObDebounceTimer()
  abortPendingRequests()
})
</script>
