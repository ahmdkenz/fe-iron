<template>
  <div>
    <PageHeader
      title="Import SHZ360"
      subtitle="Staging PO & penerimaan barang dari SHZ360 sebelum jadi tagihan AP"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Import SHZ360', disabled: true }
      ]"
    />

    <!-- Sync Health -->
    <VCard
      class="mb-4"
      variant="outlined"
      rounded="lg"
    >
      <VCardText class="d-flex flex-wrap align-center gap-4 py-3">
        <div class="d-flex align-center gap-2">
          <VIcon
            :icon="syncStatusMeta.icon"
            :color="syncStatusMeta.color"
            size="20"
          />
          <div>
            <div class="text-caption text-medium-emphasis">
              Sync Terakhir
            </div>
            <div
              class="font-weight-medium"
              :class="`text-${syncStatusMeta.color}`"
            >
              {{ syncStatusMeta.label }}
            </div>
          </div>
        </div>
        <template v-if="lastRun">
          <VDivider
            vertical
            inset
            length="32"
          />
          <div>
            <div class="text-caption text-medium-emphasis">
              Waktu
            </div>
            <div class="text-body-2">
              {{ formatDateTime(lastRun.started_at) }} → {{ formatDateTime(lastRun.finished_at) }}
            </div>
          </div>
          <VDivider
            vertical
            inset
            length="32"
          />
          <div>
            <div class="text-caption text-medium-emphasis">
              PO
            </div>
            <div class="text-body-2">
              {{ lastRun.po_upserted }}/{{ lastRun.po_fetched }} upserted
            </div>
          </div>
          <VDivider
            vertical
            inset
            length="32"
          />
          <div>
            <div class="text-caption text-medium-emphasis">
              Terima PO
            </div>
            <div class="text-body-2">
              {{ lastRun.receipt_upserted }}/{{ lastRun.receipt_fetched }} upserted
            </div>
          </div>
          <VDivider
            vertical
            inset
            length="32"
          />
          <VBtn
            v-if="lastRun.error_count > 0"
            size="small"
            variant="tonal"
            color="error"
            prepend-icon="ri-error-warning-line"
            @click="openSyncErrors"
          >
            {{ lastRun.error_count }} Error
          </VBtn>
          <VChip
            v-else
            size="small"
            variant="tonal"
            color="success"
          >
            Tidak ada error
          </VChip>
        </template>
        <VSpacer />
        <VBtn
          v-if="authStore.canOperateApShz360Import"
          color="secondary"
          variant="tonal"
          size="small"
          prepend-icon="ri-history-line"
          :disabled="retrying"
          class="me-2"
          @click="doFullResync"
        >
          Full Resync
        </VBtn>
        <VBtn
          v-if="authStore.canOperateApShz360Import"
          color="primary"
          size="small"
          prepend-icon="ri-refresh-line"
          :disabled="retrying"
          @click="doRetrySync"
        >
          Sync Sekarang
        </VBtn>
      </VCardText>
      <VAlert
        v-if="!lastRun"
        type="info"
        variant="tonal"
        density="compact"
        class="ma-0"
        tile
      >
        Belum pernah ada sync yang berjalan. Klik "Sync Sekarang" untuk memulai.
      </VAlert>
      <VAlert
        v-else-if="lastRun.status === 'failed'"
        type="error"
        variant="tonal"
        density="compact"
        class="ma-0"
        tile
      >
        Sync gagal total (transport ke SHZ360 bermasalah, bukan error per baris): {{ lastRun.message }}
      </VAlert>
      <VAlert
        v-else-if="lastRun.status === 'partial_success'"
        type="warning"
        variant="tonal"
        density="compact"
        class="ma-0"
        tile
      >
        Sync selesai, tapi {{ lastRun.error_count }} baris data gagal diproses (sync tidak diulang otomatis untuk baris ini sampai berhasil).
      </VAlert>
      <VAlert
        v-else-if="lastRun.message"
        type="warning"
        variant="tonal"
        density="compact"
        class="ma-0"
        tile
      >
        {{ lastRun.message }}
      </VAlert>
    </VCard>

    <!-- KPI Cards -->
    <VRow
      class="mb-2"
      dense
    >
      <VCol
        v-for="card in kpiCards"
        :key="card.title"
        cols="6"
        sm="4"
        lg="2"
      >
        <VCard
          :variant="card.filterKey !== undefined && activeFilterKey === card.filterKey ? 'tonal' : 'outlined'"
          :color="card.filterKey !== undefined && activeFilterKey === card.filterKey ? card.color : undefined"
          rounded="lg"
          :class="card.filterKey !== undefined ? 'cursor-pointer' : ''"
          @click="card.filterKey !== undefined && setStatusFilter(card.filterKey)"
        >
          <VCardText class="py-3 px-3">
            <div class="d-flex align-center justify-space-between mb-1">
              <span class="text-caption text-medium-emphasis text-truncate">{{ card.title }}</span>
              <VIcon
                :icon="card.icon"
                size="16"
                :color="card.color"
              />
            </div>
            <div
              class="text-h6 font-weight-bold text-truncate"
              :class="`text-${card.color}`"
            >
              {{ card.value }}
            </div>
            <div class="text-caption text-medium-emphasis text-truncate">
              {{ card.caption }}
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Prioritas AP -->
    <div class="d-flex flex-wrap align-center gap-2 mb-4">
      <span class="text-caption text-medium-emphasis font-weight-medium me-1">Prioritas AP:</span>
      <VBtn
        v-for="s in shortcuts"
        :key="s.key"
        size="small"
        :variant="activeFilterKey === s.key ? 'flat' : 'tonal'"
        :color="s.color"
        :prepend-icon="s.icon"
        @click="setStatusFilter(s.key)"
      >
        {{ s.label }}
        <VChip
          size="x-small"
          class="ms-2"
          :color="activeFilterKey === s.key ? 'white' : s.color"
          variant="flat"
        >
          {{ s.count }}
        </VChip>
      </VBtn>
    </div>

    <VCard>
      <VCardText class="d-flex flex-wrap gap-3 pb-0">
        <VTextField
          v-model="params.kode_po"
          placeholder="Cari kode PO..."
          clearable
          hide-details
          density="compact"
          style="max-width: 220px"
          prepend-inner-icon="ri-search-line"
          @update:model-value="debouncedFetch"
        />
        <VTextField
          v-model="params.kode_receipt"
          placeholder="Cari kode terima PO..."
          clearable
          hide-details
          density="compact"
          style="max-width: 220px"
          prepend-inner-icon="ri-search-line"
          @update:model-value="debouncedFetch"
        />
        <VSelect
          v-model="params.import_status"
          placeholder="Semua Status"
          clearable
          hide-details
          density="compact"
          style="max-width: 200px"
          :items="statusOptions"
          item-title="label"
          item-value="value"
          @update:model-value="doFetch"
        />
        <VSwitch
          v-model="params.need_mapping"
          label="Perlu mapping vendor"
          hide-details
          density="compact"
          :true-value="1"
          false-value=""
          @update:model-value="doFetch"
        />
      </VCardText>

      <BaseTable
        :headers="headers"
        :items="items"
        :total="meta.total"
        :loading="loading"
        :per-page="meta.per_page"
        :page="meta.current_page"
        column-resize-key="ap-shz360-import-index"
        class="mt-2"
        @update:options="onTableOptions"
      >
        <template #item.no="{ index }">
          {{ (meta.current_page - 1) * meta.per_page + index + 1 }}
        </template>
        <template #item.kode_receipt="{ item }">
          <VChip
            color="primary"
            size="small"
            variant="tonal"
            label
          >
            {{ item.kode_receipt }}
          </VChip>
        </template>
        <template #item.tanggal_receipt="{ item }">
          {{ formatDate(item.tanggal_receipt) }}
        </template>
        <template #item.kode_po="{ item }">
          {{ item.kode_po ?? '-' }}
        </template>
        <template #item.source_supplier_name="{ item }">
          {{ item.source_supplier_name ?? '-' }}
        </template>
        <template #item.vendor_nama="{ item }">
          <span v-if="item.vendor_nama">{{ item.vendor_nama }}</span>
          <VChip
            v-else-if="item.need_mapping"
            color="warning"
            size="small"
            variant="tonal"
          >
            Perlu dipetakan
          </VChip>
          <span v-else>-</span>
        </template>
        <template #item.total_diterima="{ item }">
          {{ formatCurrency(item.total_diterima) }}
        </template>
        <template #item.has_reject_items="{ item }">
          <VTooltip
            v-if="item.has_reject_items"
            text="Ada barang ditolak"
          >
            <template #activator="{ props: p }">
              <VIcon
                v-bind="p"
                icon="ri-error-warning-line"
                color="error"
                size="20"
              />
            </template>
          </VTooltip>
          <span
            v-else
            class="text-medium-emphasis"
          >-</span>
        </template>
        <template #item.import_status="{ item }">
          <Shz360ImportStatusBadge :status="item.import_status" />
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <VBtn
              icon
              size="small"
              variant="text"
              color="info"
              @click="openDetail(item)"
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
              v-if="item.need_mapping && authStore.canOperateApShz360Import"
              icon
              size="small"
              variant="text"
              color="warning"
              @click="openMapVendor(item)"
            >
              <VIcon
                icon="ri-link-m"
                size="18"
              />
              <VTooltip activator="parent">
                Petakan Vendor
              </VTooltip>
            </VBtn>
            <VBtn
              v-if="!item.need_mapping && item.import_status !== 'CONVERTED' && item.import_status !== 'IGNORED' && authStore.canOperateApShz360Import"
              icon
              size="small"
              variant="text"
              color="primary"
              @click="openConvert(item)"
            >
              <VIcon
                icon="ri-file-add-line"
                size="18"
              />
              <VTooltip activator="parent">
                Buat Tagihan
              </VTooltip>
            </VBtn>
            <VBtn
              v-if="item.import_status === 'CONVERTED' && item.tagihan_ap_id"
              icon
              size="small"
              variant="text"
              color="success"
              :to="{ name: 'ap-tagihan-show', params: { id: item.tagihan_ap_id } }"
            >
              <VIcon
                icon="ri-bill-line"
                size="18"
              />
              <VTooltip activator="parent">
                Lihat Tagihan
              </VTooltip>
            </VBtn>
            <VBtn
              v-if="!['CONVERTED', 'IGNORED'].includes(item.import_status) && authStore.canOperateApShz360Import"
              icon
              size="small"
              variant="text"
              color="error"
              @click="confirmIgnore(item)"
            >
              <VIcon
                icon="ri-close-circle-line"
                size="18"
              />
              <VTooltip activator="parent">
                Abaikan
              </VTooltip>
            </VBtn>
          </div>
        </template>
      </BaseTable>
    </VCard>

    <!-- Detail -->
    <BaseModal
      v-model="showDetail"
      title="Detail Staging SHZ360"
      width="1120"
    >
      <div
        v-if="detailLoading"
        class="text-center pa-6"
      >
        <VProgressCircular
          indeterminate
          color="primary"
        />
      </div>
      <div v-else-if="detailItem">
        <VRow class="mb-2">
          <VCol
            cols="12"
            md="6"
          >
            <VCard
              variant="outlined"
              rounded="lg"
            >
              <VCardTitle class="text-body-1 font-weight-bold py-3">
                Informasi Terima PO
              </VCardTitle>
              <VDivider />
              <DetailRow
                label="Kode Terima PO"
                :value="detailItem.kode_receipt"
                label-width="150px"
              />
              <DetailRow
                label="Tanggal Terima"
                :value="formatDate(detailItem.tanggal_receipt)"
                label-width="150px"
              />
              <DetailRow
                label="No. Invoice"
                :value="detailItem.no_invoice"
                label-width="150px"
              />
              <DetailRow
                label="No. Surat Jalan"
                :value="detailItem.no_surat_jalan"
                label-width="150px"
              />
              <DetailRow
                label="No. Faktur Pajak"
                :value="detailItem.no_faktur_pajak"
                label-width="150px"
              />
              <div class="px-4 px-sm-5 py-3">
                <Shz360ImportStatusBadge :status="detailItem.import_status" />
              </div>
            </VCard>
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <VCard
              variant="outlined"
              rounded="lg"
            >
              <VCardTitle class="text-body-1 font-weight-bold py-3">
                Informasi PO
              </VCardTitle>
              <VDivider />
              <DetailRow
                label="Kode PO"
                :value="detailItem.kode_po"
                label-width="150px"
              />
              <DetailRow
                label="Tanggal PO"
                :value="formatDate(detailItem.tanggal_po)"
                label-width="150px"
              />
              <DetailRow
                label="Supplier SHZ360"
                label-width="150px"
              >
                {{ supplierLabel(detailItem.source_supplier) }}
              </DetailRow>
              <DetailRow
                label="Vendor AP"
                label-width="150px"
              >
                <span v-if="detailItem.vendor_nama">{{ detailItem.vendor_nama }}</span>
                <VChip
                  v-else
                  color="warning"
                  size="small"
                  variant="tonal"
                >
                  Belum dipetakan
                </VChip>
              </DetailRow>
              <DetailRow
                label="Status PO"
                :value="detailItem.status_po"
                label-width="150px"
              />
              <DetailRow
                label="Total PO"
                :value="formatCurrency(detailItem.po_grand_total)"
                label-width="150px"
              />
            </VCard>
          </VCol>
        </VRow>
        <p class="text-subtitle-2 mb-2 mt-2">
          Item Diterima
        </p>
        <div class="overflow-x-auto mb-4">
          <VTable density="compact">
            <thead>
              <tr>
                <th>Barang</th>
                <th class="text-right">
                  Qty PO
                </th>
                <th class="text-right">
                  Qty Diterima
                </th>
                <th>Satuan</th>
                <th>Status</th>
                <th class="text-right">
                  Harga
                </th>
                <th class="text-right">
                  PPN
                </th>
                <th class="text-right">
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody>
              <template
                v-for="(it, idx) in detailItem.items"
                :key="idx"
              >
                <tr>
                  <td>
                    {{ it.nama_barang }}
                    <div
                      v-if="it.kode_barang"
                      class="text-caption text-medium-emphasis"
                    >
                      {{ it.kode_barang }}
                    </div>
                  </td>
                  <td class="text-right">
                    {{ it.qty_po ?? '-' }}
                  </td>
                  <td class="text-right">
                    {{ it.qty_diterima }}
                  </td>
                  <td>{{ it.satuan }}</td>
                  <td>
                    <VChip
                      v-if="itemStatusMap[it.status_detail_terima_po]"
                      size="x-small"
                      variant="tonal"
                      :color="itemStatusMap[it.status_detail_terima_po].color"
                      label
                    >
                      {{ itemStatusMap[it.status_detail_terima_po].label }}
                    </VChip>
                    <span v-else>-</span>
                  </td>
                  <td class="text-right">
                    {{ formatCurrency(it.harga) }}
                  </td>
                  <td class="text-right">
                    {{ it.ppn !== null ? `${it.ppn}%` : '-' }}
                  </td>
                  <td class="text-right">
                    {{ formatCurrency(it.subtotal) }}
                  </td>
                </tr>
                <tr v-if="it.qty_tolak > 0">
                  <td
                    colspan="8"
                    class="text-caption text-warning py-1"
                  >
                    <span class="d-inline-flex align-center gap-1">
                      <VIcon
                        icon="ri-error-warning-line"
                        size="14"
                      />
                      <span>Ditolak {{ it.qty_tolak }} {{ it.satuan }}<span v-if="it.keterangan_tolak"> — {{ it.keterangan_tolak }}</span></span>
                    </span>
                  </td>
                </tr>
              </template>
            </tbody>
          </VTable>
        </div>
      </div>
      <template #actions>
        <AppActionButton
          action="batalkan"
          label="Tutup"
          @click="showDetail = false"
        />
      </template>
    </BaseModal>

    <!-- Map Vendor -->
    <BaseModal
      v-if="showMapVendor"
      v-model="showMapVendor"
      title="Petakan Vendor"
      width="640"
      :loading="mappingVendor"
      confirm-action="custom"
      confirm-label="Petakan"
      confirm-icon="ri-link-m"
      :disabled="!canSubmitMapVendor"
      @confirm="doMapVendor"
    >
      <VCard
        variant="tonal"
        color="primary"
        rounded="lg"
        class="mb-4"
      >
        <VCardText class="d-flex align-center gap-3 pa-3">
          <VAvatar
            size="40"
            color="primary"
            variant="flat"
            rounded="lg"
          >
            <VIcon
              icon="ri-truck-line"
              size="20"
            />
          </VAvatar>
          <div class="flex-grow-1 min-w-0">
            <div class="text-caption text-medium-emphasis">
              Supplier dari SHZ360
            </div>
            <div class="font-weight-bold text-truncate">
              {{ selectedItem?.source_supplier_name ?? '-' }}
            </div>
          </div>
          <VChip
            size="small"
            variant="flat"
            color="primary"
            label
          >
            PO {{ selectedItem?.kode_po ?? '-' }}
          </VChip>
        </VCardText>
      </VCard>

      <VAlert
        v-if="suggestedVendor"
        type="success"
        variant="tonal"
        density="compact"
        class="mb-4"
        icon="ri-checkbox-circle-line"
      >
        <div class="text-body-2">
          Vendor sudah terdaftar sebagai <strong>{{ suggestedVendor.nama_vendor }}</strong> ({{ suggestedVendor.kode_vendor }}).
        </div>
        <div class="text-caption text-medium-emphasis">
          PIC AP: {{ suggestedVendor.karyawan_ap_nama ?? '-' }} — sudah dipilih otomatis di bawah, atau pilih "Vendor Baru" kalau ini sebenarnya vendor lain.
        </div>
      </VAlert>

      <VBtnToggle
        v-model="mapVendorMode"
        mandatory
        color="primary"
        variant="outlined"
        density="compact"
        divided
        class="mb-4"
      >
        <VBtn
          value="existing"
          size="small"
          style="min-width: 180px"
        >
          <VIcon
            start
            size="16"
          >
            ri-store-2-line
          </VIcon>Vendor Terdaftar
        </VBtn>
        <VBtn
          value="new"
          size="small"
          style="min-width: 150px"
        >
          <VIcon
            start
            size="16"
          >
            ri-add-circle-line
          </VIcon>Vendor Baru
        </VBtn>
      </VBtnToggle>

      <template v-if="mapVendorMode === 'existing'">
        <VAutocomplete
          v-model="existingVendorForm.vendor_ap_id"
          label="Vendor"
          variant="outlined"
          density="compact"
          prepend-inner-icon="ri-store-2-line"
          :items="vendorList"
          item-title="display_label"
          item-value="id"
          :loading="vendorLoading"
          clearable
        >
          <template #item="{ props: p, item }">
            <VListItem
              v-bind="p"
              :title="item.raw.display_label"
            />
          </template>
        </VAutocomplete>
      </template>

      <template v-else>
        <VAlert
          type="info"
          variant="tonal"
          density="compact"
          class="mb-4"
          icon="ri-information-line"
        >
          Nama, NPWP, dan info bank otomatis terisi dari data SHZ360.
        </VAlert>

        <VCard
          variant="outlined"
          rounded="lg"
          class="mb-4"
        >
          <DetailRow
            label="Nama Vendor"
            :value="selectedItem?.source_supplier?.nama_supplier"
            label-width="120px"
          />
          <DetailRow
            label="NPWP"
            :value="selectedItem?.source_supplier?.npwp"
            label-width="120px"
          />
          <DetailRow
            label="Bank"
            :value="selectedItem?.source_supplier?.bank_nama"
            label-width="120px"
          />
          <DetailRow
            label="No. Rekening"
            :value="selectedItem?.source_supplier?.bank_no_rekening"
            label-width="120px"
          />
          <DetailRow
            label="Atas Nama"
            :value="selectedItem?.source_supplier?.bank_atas_nama"
            label-width="120px"
          />
        </VCard>

        <VTextField
          v-model="newVendorForm.kode_vendor"
          label="Kode Supplier"
          variant="outlined"
          density="compact"
          prepend-inner-icon="ri-hashtag"
          hint="Ter-prefill dari SHZ360, bisa diedit bila perlu"
          persistent-hint
          class="mb-2"
        />

        <VTextField
          v-if="authStore.isApOnly"
          :model-value="displayKaryawanAp"
          label="PIC AP"
          variant="outlined"
          density="compact"
          prepend-inner-icon="ri-user-line"
          hint="Otomatis terisi sesuai akun Anda"
          persistent-hint
          readonly
        />
        <VAutocomplete
          v-else
          v-model="newVendorForm.karyawan_ap_id"
          label="PIC AP"
          variant="outlined"
          density="compact"
          prepend-inner-icon="ri-user-line"
          :items="karyawanList"
          item-title="nama_karyawan"
          item-value="id"
          hint="Wajib dipilih — SHZ360 tidak menyediakan data ini"
          persistent-hint
          :loading="karyawanLoading"
          @focus="ensureKaryawanLoaded({ params: { role: 'AP' } })"
        >
          <template #item="{ props: p, item }">
            <VListItem
              v-bind="p"
              :title="item.raw.nama_karyawan"
              :subtitle="item.raw.nik"
            />
          </template>
        </VAutocomplete>
      </template>
    </BaseModal>

    <!-- Convert to Tagihan -->
    <BaseModal
      v-if="showConvert"
      v-model="showConvert"
      title="Buat Tagihan dari Staging"
      :loading="converting"
      confirm-action="custom"
      confirm-label="Buat Tagihan"
      confirm-icon="ri-file-add-line"
      @confirm="doConvert"
    >
      <p class="mb-3">
        Tagihan akan dibuat dari penerimaan <strong>{{ selectedItem?.kode_receipt }}</strong>
        (PO {{ selectedItem?.kode_po }}, vendor {{ selectedItem?.vendor_nama }}).
      </p>
      <VRow>
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            v-model="convertForm.no_invoice_vendor"
            label="No. Invoice Vendor"
            density="compact"
          />
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            v-model="convertForm.tanggal_tagihan"
            label="Tanggal Tagihan"
            type="date"
            density="compact"
          />
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            v-model="convertForm.tanggal_jatuh_tempo"
            label="Tanggal Jatuh Tempo"
            type="date"
            density="compact"
          />
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            v-model.number="convertForm.ppn_masukan"
            label="PPN Masukan"
            type="number"
            density="compact"
          />
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            v-model.number="convertForm.pph23"
            label="PPh 23"
            type="number"
            density="compact"
          />
        </VCol>
      </VRow>
      <VAlert
        v-if="convertError"
        type="error"
        variant="tonal"
        class="mt-2"
      >
        {{ convertError }}
      </VAlert>
    </BaseModal>

    <!-- Sync Errors -->
    <BaseModal
      v-model="showSyncErrors"
      title="Error Sync Terbaru"
      width="720"
    >
      <div
        v-if="syncErrorsLoading"
        class="text-center pa-6"
      >
        <VProgressCircular
          indeterminate
          color="primary"
        />
      </div>
      <div
        v-else-if="syncErrorList.length === 0"
        class="text-center text-medium-emphasis py-6"
      >
        Tidak ada error sync.
      </div>
      <div v-else>
        <VAlert
          type="info"
          variant="tonal"
          density="compact"
          class="mb-3"
          icon="ri-information-line"
        >
          Daftar ini adalah baris data yang gagal diproses saat sync (sync run tetap selesai sebagai "Selesai Sebagian"),
          berbeda dengan sync yang gagal total karena transport/koneksi ke SHZ360.
        </VAlert>
        <VTable density="compact">
          <thead>
            <tr>
              <th>Run</th>
              <th>Waktu Run</th>
              <th>Sumber</th>
              <th>ID</th>
              <th>Pesan</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="err in syncErrorList"
              :key="err.id"
            >
              <td class="text-caption">
                #{{ err.sync_run_id }}
              </td>
              <td class="text-caption">
                {{ formatDateTime(err.run_started_at) }}
              </td>
              <td>
                <VChip
                  size="x-small"
                  variant="tonal"
                  label
                >
                  {{ err.source_type }}
                </VChip>
              </td>
              <td class="text-caption">
                {{ err.source_id ?? '-' }}
              </td>
              <td class="text-caption text-error">
                {{ err.message }}
              </td>
            </tr>
          </tbody>
        </VTable>
      </div>
      <template #actions>
        <AppActionButton
          action="batalkan"
          label="Tutup"
          @click="showSyncErrors = false"
        />
      </template>
    </BaseModal>

    <!-- Sync Progress -->
    <Shz360SyncProgressDialog
      v-model="showSyncDialog"
      :mode="syncDialogMode"
      :progress="syncProgress"
    />
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { useAuthStore } from '@/stores/auth.store'
import { useCrud } from '@/composables/useCrud'
import { useLazyFetchAll } from '@/composables/useLazyFetchAll'
import { useFormatter } from '@/composables/useFormatter'
import api from '@/utils/axios'
import { AP_ITEM_RECEIPT_STATUS_MAP } from '@/utils/status'
import Shz360ImportStatusBadge from '../components/Shz360ImportStatusBadge.vue'
import Shz360SyncProgressDialog from '../components/Shz360SyncProgressDialog.vue'
import DetailRow from '@/components/shared/DetailRow.vue'

const authStore = useAuthStore()
const { showAlert, showSuccess, showError, confirmDelete: swalConfirm } = useSweetAlert()
const { formatCurrency, formatDate } = useFormatter()

const itemStatusMap = AP_ITEM_RECEIPT_STATUS_MAP

const displayKaryawanAp = computed(() => authStore.user?.karyawan?.nama_karyawan ?? '')

const { items, loading, meta, params, fetchList, fetchOne, item: detailItem } = useCrud('/ap/shz360/imports')
const { items: karyawanList, loading: karyawanLoading, fetchAll: fetchKaryawan } = useCrud('/master/karyawan')
const { ensureLoaded: ensureKaryawanLoaded } = useLazyFetchAll(fetchKaryawan)
const { items: vendorList, loading: vendorLoading, fetchAll: fetchVendor } = useCrud('/ap/vendors')
const { ensureLoaded: ensureVendorLoaded } = useLazyFetchAll(fetchVendor)

params.import_status = ''
params.kode_po = ''
params.kode_receipt = ''
params.need_mapping = ''

const headers = [
  { title: 'No', key: 'no', sortable: false, width: '56px' },
  { title: 'Kode Terima PO', key: 'kode_receipt', sortable: false, minWidth: '150px' },
  { title: 'Tgl Terima', key: 'tanggal_receipt', sortable: false, minWidth: '110px' },
  { title: 'Kode PO', key: 'kode_po', sortable: false, minWidth: '130px' },
  { title: 'Supplier SHZ360', key: 'source_supplier_name', sortable: false, minWidth: '180px' },
  { title: 'Vendor AP', key: 'vendor_nama', sortable: false, minWidth: '180px' },
  { title: 'Total Diterima', key: 'total_diterima', sortable: false, minWidth: '140px' },
  { title: 'Reject', key: 'has_reject_items', sortable: false, width: '80px', align: 'center' },
  { title: 'Status', key: 'import_status', sortable: false, minWidth: '150px' },
  { title: 'Aksi', key: 'actions', sortable: false, align: 'center', width: '160px' },
]

const statusOptions = [
  { label: 'Baru', value: 'NEW' },
  { label: 'Siap Dikonversi', value: 'READY_FOR_AP' },
  { label: 'Sudah Jadi Tagihan', value: 'CONVERTED' },
  { label: 'Diabaikan', value: 'IGNORED' },
]

let debounceTimer = null
function debouncedFetch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(doFetch, 400)
}

function doFetch() {
  params.page = 1
  fetchList()
}

function onTableOptions({ page, itemsPerPage }) {
  params.page = page
  params.per_page = itemsPerPage
  fetchList()
}

function formatDateTime(value) {
  if (!value) return '-'
  
  return new Date(value).toLocaleString('id-ID')
}

function supplierLabel(supplier) {
  if (!supplier?.nama_supplier) return '-'
  
  return supplier.kode_supplier ? `${supplier.kode_supplier} - ${supplier.nama_supplier}` : supplier.nama_supplier
}

// ─── Retry sync ───────────────────────────────────────────────────
const retrying = ref(false)
const lastRun = ref(null)

const syncStatusMetaMap = {
  success: { color: 'success', icon: 'ri-checkbox-circle-line', label: 'Berhasil' },
  partial_success: { color: 'warning', icon: 'ri-alert-line', label: 'Selesai Sebagian' },
  failed: { color: 'error', icon: 'ri-close-circle-line', label: 'Gagal' },
  running: { color: 'info', icon: 'ri-loader-4-line', label: 'Berjalan' },
}

const syncStatusMeta = computed(() => {
  if (!lastRun.value) return { color: 'secondary', icon: 'ri-question-line', label: 'Belum pernah sync' }
  
  return syncStatusMetaMap[lastRun.value.status] ?? { color: 'secondary', icon: 'ri-question-line', label: lastRun.value.status }
})

async function loadLastRun() {
  try {
    const { data } = await api.get('/ap/shz360/sync/last-run')

    lastRun.value = data.data
  } catch {
    // belum pernah sync, biarkan kosong
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Dialog progress sync — menggantikan popup SweetAlert lama dengan dialog custom
// yang menampilkan tahapan (PO → Terima PO) secara live.
const showSyncDialog = ref(false)
const syncDialogMode = ref('retry')

const syncProgress = reactive({
  status: 'sending',
  po_fetched: 0,
  po_upserted: 0,
  receipt_fetched: 0,
  receipt_upserted: 0,
})

function resetSyncProgress() {
  syncProgress.status = 'sending'
  syncProgress.po_fetched = 0
  syncProgress.po_upserted = 0
  syncProgress.receipt_fetched = 0
  syncProgress.receipt_upserted = 0
}

function applyRunToProgress(run) {
  syncProgress.status = run.status
  syncProgress.po_fetched = run.po_fetched
  syncProgress.po_upserted = run.po_upserted
  syncProgress.receipt_fetched = run.receipt_fetched
  syncProgress.receipt_upserted = run.receipt_upserted
}

// Poll /sync/last-run sampai muncul row BARU (id beda dari sebelum sync dipicu)
// yang sudah berstatus final — sepanjang masih 'running' dialog progress diupdate
// dengan angka asli (kolom-kolom ini ke-increment per baris langsung di DB).
async function pollSyncRun(previousId) {
  while (true) {
    await sleep(1500)

    let run = null
    try {
      const { data } = await api.get('/ap/shz360/sync/last-run')

      run = data.data
    } catch {
      continue // belum pernah ada run sama sekali, atau blip jaringan — coba lagi
    }

    if (!run || run.id === previousId) continue

    if (run.status === 'running') {
      applyRunToProgress(run)
      continue
    }

    return run
  }
}

async function executeSync(endpoint, mode) {
  retrying.value = true

  const previousId = lastRun.value?.id ?? null

  syncDialogMode.value = mode
  resetSyncProgress()
  showSyncDialog.value = true
  try {
    await api.post(endpoint)
    syncProgress.status = 'running'

    const run = await pollSyncRun(previousId)

    lastRun.value = run
    applyRunToProgress(run)
    await sleep(600) // biarkan step tracker sempat tampil "Selesai" sebelum ditutup
    showSyncDialog.value = false

    if (run.status === 'success') {
      await showSuccess('Sync berhasil dijalankan ulang')
    } else if (run.status === 'partial_success') {
      await showAlert({ icon: 'warning', title: 'Selesai Sebagian', text: `Sync selesai sebagian, ada ${run.error_count} baris gagal.` })
    } else {
      await showError(run.message || 'Sync gagal')
    }
    fetchList()
    loadSummary()
  } catch (err) {
    showSyncDialog.value = false
    if (!err.response) {
      // Request awal gagal terkirim (koneksi terputus/timeout) — jarang terjadi
      // karena endpoint retry sekarang cuma dispatch job, balasnya instan.
      await showAlert({
        icon: 'warning',
        title: 'Permintaan Timeout',
        text: 'Koneksi ke server terputus/timeout saat mengirim permintaan sync.',
      })
    } else {
      await showError(err.response?.data?.message ?? 'Gagal menjalankan sync')
    }
    await loadLastRun()
  } finally {
    retrying.value = false
  }
}

function doRetrySync() {
  return executeSync('/ap/shz360/sync/retry', 'retry')
}

async function doFullResync() {
  const { isConfirmed } = await swalConfirm({
    title: 'Full Resync SHZ360?',
    text: 'Ini akan menarik ULANG SEMUA PO & Terima PO berstatus approved_direktur yang ada saat ini, mengabaikan histori sync sebelumnya. Proses bisa memakan waktu beberapa menit untuk data besar.',
    confirmButtonText: 'Ya, full resync',
  })

  if (!isConfirmed) return

  return executeSync('/ap/shz360/sync/full-resync', 'full-resync')
}

// ─── Sync errors ────────────────────────────────────────────────────
const showSyncErrors = ref(false)
const syncErrorsLoading = ref(false)
const syncErrorList = ref([])

async function openSyncErrors() {
  showSyncErrors.value = true
  syncErrorsLoading.value = true
  try {
    const { data } = await api.get('/ap/shz360/sync/errors', { params: { limit: 10 } })

    syncErrorList.value = data.data ?? []
  } catch (err) {
    await showError(err.response?.data?.message ?? 'Gagal memuat error sync')
  } finally {
    syncErrorsLoading.value = false
  }
}

// ─── Summary / KPI / Prioritas AP ───────────────────────────────────
const summary = ref(null)

async function loadSummary() {
  try {
    const { data } = await api.get('/ap/shz360/imports/summary')

    summary.value = data.data
  } catch {
    // non-critical, KPI tetap tampil dengan nilai default
  }
}

const kpiCards = computed(() => {
  const s = summary.value ?? {}
  
  return [
    {
      title: 'Total Staging', value: s.total_receipts ?? 0,
      caption: 'Seluruh penerimaan ter-staging',
      icon: 'ri-stack-line', color: 'primary', filterKey: 'all',
    },
    {
      title: 'Perlu Mapping', value: s.need_mapping_count ?? 0,
      caption: formatCurrency(s.need_mapping_amount ?? 0),
      icon: 'ri-link-m', color: 'warning', filterKey: 'need_mapping',
    },
    {
      title: 'Siap Dikonversi', value: s.ready_count ?? 0,
      caption: formatCurrency(s.ready_amount ?? 0),
      icon: 'ri-checkbox-circle-line', color: 'info', filterKey: 'READY_FOR_AP',
    },
    {
      title: 'Sudah Jadi Tagihan', value: s.converted_count ?? 0,
      caption: formatCurrency(s.converted_amount ?? 0),
      icon: 'ri-file-check-line', color: 'success', filterKey: 'CONVERTED',
    },
    {
      title: 'Diabaikan', value: s.ignored_count ?? 0,
      caption: 'Tidak dikonversi jadi tagihan',
      icon: 'ri-close-circle-line', color: 'secondary', filterKey: 'IGNORED',
    },
    {
      title: 'Total Nominal Diterima', value: formatCurrency(s.total_amount ?? 0),
      caption: `${s.rejected_receipt_count ?? 0} penerimaan ada barang ditolak`,
      icon: 'ri-money-dollar-circle-line', color: 'primary',
    },
  ]
})

const shortcuts = computed(() => {
  const s = summary.value ?? {}
  
  return [
    { key: 'need_mapping', label: 'Perlu Mapping', icon: 'ri-link-m', color: 'warning', count: s.need_mapping_count ?? 0 },
    { key: 'READY_FOR_AP', label: 'Siap Convert', icon: 'ri-checkbox-circle-line', color: 'info', count: s.ready_count ?? 0 },
    { key: 'NEW', label: 'Baru', icon: 'ri-inbox-line', color: 'secondary', count: s.new_count ?? 0 },
    { key: 'error_sync', label: 'Error Sync', icon: 'ri-error-warning-line', color: 'error', count: lastRun.value?.error_count ?? 0 },
  ]
})

const activeFilterKey = computed(() => {
  if (params.need_mapping) return 'need_mapping'
  if (params.import_status) return params.import_status
  
  return 'all'
})

function setStatusFilter(key) {
  if (key === 'error_sync') {
    openSyncErrors()
    
    return
  }
  if (key === 'need_mapping') {
    const isActive = activeFilterKey.value === 'need_mapping'

    params.need_mapping = isActive ? '' : 1
    params.import_status = ''
  } else if (key === 'all') {
    params.need_mapping = ''
    params.import_status = ''
  } else {
    const isActive = activeFilterKey.value === key

    params.import_status = isActive ? '' : key
    params.need_mapping = ''
  }
  doFetch()
}

// ─── Detail ───────────────────────────────────────────────────────
const showDetail = ref(false)
const detailLoading = ref(false)

async function openDetail(item) {
  showDetail.value = true
  detailLoading.value = true
  await fetchOne(item.id)
  detailLoading.value = false
}

// ─── Map vendor ───────────────────────────────────────────────────
const showMapVendor = ref(false)
const mappingVendor = ref(false)
const selectedItem = ref(null)
const mapVendorMode = ref('new')
const newVendorForm = reactive({ karyawan_ap_id: null, kode_vendor: null })
const existingVendorForm = reactive({ vendor_ap_id: null })

const suggestedVendor = computed(() => selectedItem.value?.suggested_vendor_ap ?? null)

const canSubmitMapVendor = computed(() => {
  return mapVendorMode.value === 'existing'
    ? !!existingVendorForm.vendor_ap_id
    : !!newVendorForm.karyawan_ap_id && !!newVendorForm.kode_vendor
})

function openMapVendor(item) {
  selectedItem.value = item
  newVendorForm.karyawan_ap_id = authStore.isApOnly ? (authStore.user?.karyawan?.id ?? null) : null
  newVendorForm.kode_vendor = item.source_supplier?.kode_supplier ?? null
  existingVendorForm.vendor_ap_id = item.suggested_vendor_ap?.id ?? null
  mapVendorMode.value = item.suggested_vendor_ap ? 'existing' : 'new'
  showMapVendor.value = true
  ensureVendorLoaded()
}

async function doMapVendor() {
  if (!canSubmitMapVendor.value) return
  mappingVendor.value = true
  try {
    if (mapVendorMode.value === 'existing') {
      await api.post(`/ap/shz360/imports/${selectedItem.value.id}/map-vendor`, { ...existingVendorForm })
      await showSuccess('Vendor berhasil dipetakan.')
    } else {
      await api.post(`/ap/shz360/imports/${selectedItem.value.id}/create-vendor`, { ...newVendorForm })
      await showSuccess('Vendor baru berhasil dibuat dan dipetakan.')
    }
    showMapVendor.value = false
    fetchList()
    loadSummary()
  } catch (err) {
    await showError(err.response?.data?.message ?? 'Gagal memetakan vendor')
  } finally {
    mappingVendor.value = false
  }
}

// ─── Convert to tagihan ─────────────────────────────────────────────
const showConvert = ref(false)
const converting = ref(false)
const convertError = ref('')

const convertForm = reactive({
  no_invoice_vendor: '',
  tanggal_tagihan: new Date().toISOString().slice(0, 10),
  tanggal_jatuh_tempo: '',
  ppn_masukan: 0,
  pph23: 0,
})

function openConvert(item) {
  selectedItem.value = item
  convertError.value = ''
  convertForm.no_invoice_vendor = ''
  convertForm.tanggal_tagihan = new Date().toISOString().slice(0, 10)
  convertForm.tanggal_jatuh_tempo = ''
  convertForm.ppn_masukan = 0
  convertForm.pph23 = 0
  showConvert.value = true
}

async function doConvert() {
  convertError.value = ''
  converting.value = true
  try {
    const { data } = await api.post(`/ap/shz360/imports/${selectedItem.value.id}/convert-to-tagihan`, convertForm)

    showConvert.value = false
    fetchList()
    loadSummary()
    await showSuccess(`Tagihan ${data.data.no_tagihan} berhasil dibuat.`)
  } catch (err) {
    convertError.value = err.response?.data?.message ?? 'Gagal membuat tagihan'
    await showError(convertError.value)
  } finally {
    converting.value = false
  }
}

// ─── Ignore ───────────────────────────────────────────────────────
async function confirmIgnore(item) {
  const { isConfirmed } = await swalConfirm({
    title: 'Abaikan Data Ini?',
    text: `Penerimaan ${item.kode_receipt} tidak akan dikonversi jadi tagihan.`,
    confirmButtonText: 'Ya, abaikan',
  })

  if (!isConfirmed) return

  try {
    await api.post(`/ap/shz360/imports/${item.id}/ignore`)
    fetchList()
    loadSummary()
    await showSuccess('Data staging diabaikan.')
  } catch (err) {
    await showError(err.response?.data?.message ?? 'Gagal mengabaikan data')
  }
}

doFetch()
loadLastRun()
loadSummary()
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
