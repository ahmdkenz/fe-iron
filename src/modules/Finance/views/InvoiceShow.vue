<template>
  <div>
    <PageHeader
      :title="pageTitle"
      :subtitle="pageSubtitle"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: listLabel, to: listRoute },
        { title: detailLabel, disabled: true },
      ]"
    >
      <div class="d-flex flex-wrap gap-2">
        <VBtn
          variant="tonal"
          color="secondary"
          :to="listRoute"
        >
          <VIcon
            icon="ri-arrow-left-line"
            class="me-1"
          />
          Kembali
        </VBtn>
        <VBtn
          v-if="showEditButton"
          color="primary"
          :to="editRoute"
        >
          <VIcon
            icon="ri-pencil-line"
            class="me-1"
          />
          Edit
        </VBtn>
        <VBtn
          v-if="invoice?.can_submit"
          color="primary"
          variant="tonal"
          @click="showResubmitModal = true"
        >
          <VIcon
            icon="ri-send-plane-line"
            class="me-1"
          />
          Ajukan Ulang
        </VBtn>
        <VBtn
          v-if="invoice?.can_approve"
          color="success"
          @click="showApproveModal = true"
        >
          <VIcon
            icon="ri-checkbox-circle-line"
            class="me-1"
          />
          Approve
        </VBtn>
        <VBtn
          v-if="invoice?.can_reject"
          color="error"
          variant="tonal"
          @click="showRejectModal = true"
        >
          <VIcon
            icon="ri-close-circle-line"
            class="me-1"
          />
          Reject
        </VBtn>
        <VBtn
          v-if="canChangeStatus"
          color="info"
          variant="tonal"
          @click="showUbahStatus = true"
        >
          <VIcon
            icon="ri-exchange-line"
            class="me-1"
          />
          Ubah Status
        </VBtn>
        <VBtn
          v-if="invoice?.can_print"
          color="info"
          variant="elevated"
          class="font-weight-bold text-white elevation-2"
          @click="printInvoice"
        >
          <VIcon
            icon="ri-printer-line"
            class="me-1"
          />
          Cetak
        </VBtn>
        <VBtn
          v-if="invoice?.can_print"
          color="success"
          variant="tonal"
          @click="shareViaWhatsapp"
        >
          <VIcon
            icon="ri-whatsapp-line"
            class="me-1"
          />
          Kirim WA
        </VBtn>
      </div>
    </PageHeader>

    <VAlert
      v-if="pageErrorMessage"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      {{ pageErrorMessage }}
    </VAlert>

    <VAlert
      v-if="actionMessage"
      type="success"
      variant="tonal"
      class="mb-4"
    >
      {{ actionMessage }}
    </VAlert>

    <VAlert
      v-if="actionErrorMessage"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      {{ actionErrorMessage }}
    </VAlert>

    <VAlert
      v-if="isB2B && invoice"
      type="info"
      variant="tonal"
      icon="ri-building-4-line"
      class="mb-4"
      density="compact"
    >
      <strong>Invoice B2B</strong> — Tagihan ke PT / Perusahaan.
      Klien: <strong>{{ invoice.klien_ar?.nama_klien }}</strong>
      <template v-if="invoice.resto">
        &nbsp;|&nbsp; Outlet: <strong>{{ invoice.resto.nama_resto }}</strong>
      </template>
    </VAlert>

    <div
      v-if="loading"
      class="text-center py-12"
    >
      <VProgressCircular
        indeterminate
        color="primary"
      />
    </div>

    <template v-else-if="invoice">
      <VRow align="start">
        <VCol
          cols="12"
          lg="8"
        >
          <div class="invoice-show-stack">
            <VCard
              class="rounded-xl elevation-2 border"
              :class="isB2B ? 'b2b-card' : ''"
            >
              <VCardTitle
                class="pa-4 pb-2 font-weight-bold d-flex align-center"
                :class="isB2B ? 'text-info' : 'text-primary'"
              >
                <VIcon
                  icon="ri-file-list-3-line"
                  class="me-2"
                />
                Informasi {{ documentLabel }}
                <VChip
                  v-if="isB2B"
                  color="info"
                  size="x-small"
                  variant="tonal"
                  label
                  class="ms-2"
                >
                  <VIcon
                    icon="ri-building-4-line"
                    size="12"
                    class="me-1"
                  />
                  B2B
                </VChip>
              </VCardTitle>
              <VDivider />
              <VCardText>
                <VRow>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <DetailRow
                      label="No. Invoice"
                      :value="invoice.no_invoice"
                    />
                    <DetailRow
                      label="Tanggal"
                      :value="formatDate(invoice.tanggal_invoice)"
                    />
                    <DetailRow
                      v-if="invoice.tanggal_kirim_barang"
                      label="Tanggal Kirim Barang"
                    >
                      <span class="font-weight-semibold text-info">{{ formatDate(invoice.tanggal_kirim_barang) }}</span>
                    </DetailRow>
                    <DetailRow
                      v-if="invoice.tanggal_jatuh_tempo"
                      label="Jatuh Tempo"
                    >
                      <span :class="isOverdue ? 'text-error font-weight-bold' : ''">
                        {{ formatDate(invoice.tanggal_jatuh_tempo) }}
                        <VChip
                          v-if="isOverdue"
                          color="error"
                          size="x-small"
                          variant="tonal"
                          label
                          class="ms-1"
                        >
                          Lewat Jatuh Tempo
                        </VChip>
                      </span>
                    </DetailRow>
                    <DetailRow label="Periode">
                      <span>{{ formatDate(invoice.periode_awal) }} - {{ formatDate(invoice.periode_akhir) }}</span>
                    </DetailRow>
                    <DetailRow
                      label="No. Surat Jalan"
                      :value="invoice.no_surat_jalan"
                    />
                    <DetailRow
                      label="Keterangan"
                      :value="invoice.keterangan"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <DetailRow label="Status Invoice">
                      <InvoiceStatusBadge :status="invoice.status" />
                    </DetailRow>
                    <DetailRow
                      v-if="isOpeningBalance"
                      label="Status Approval"
                    >
                      <ApprovalStatusBadge :status="invoice.approval_status" />
                    </DetailRow>

                    <!-- B2C: semua info klien ditampilkan inline -->
                    <template v-if="!isB2B">
                      <DetailRow label="Klien">
                        <span>{{ invoice.klien_ar?.nama_klien }}</span>
                        <VChip
                          color="success"
                          size="x-small"
                          variant="tonal"
                          label
                          class="ms-2"
                        >
                          B2C
                        </VChip>
                      </DetailRow>
                      <DetailRow
                        label="Kode Klien"
                        :value="invoice.klien_ar?.kode_klien"
                      />
                      <template v-if="invoice.klien_ar?.resto?.investor">
                        <DetailRow
                          label="Investor"
                          :value="invoice.klien_ar.resto.investor.nama_investor + (invoice.klien_ar.resto.investor.no_hp ? ' · ' + invoice.klien_ar.resto.investor.no_hp : '')"
                        />
                        <DetailRow
                          v-if="invoice.klien_ar.resto.investor.pengelola"
                          label="Pengelola"
                          :value="invoice.klien_ar.resto.investor.pengelola + (invoice.klien_ar.resto.investor.no_hp_pengelola ? ' · ' + invoice.klien_ar.resto.investor.no_hp_pengelola : '')"
                        />
                      </template>
                      <DetailRow
                        label="Entitas Penagih"
                        :value="invoice.perusahaan?.nama_perusahaan"
                      />
                      <DetailRow
                        label="Staff AR"
                        :value="invoice.klien_ar?.karyawan_ar?.nama_karyawan"
                      />
                    </template>

                    <!-- B2B: hanya referensi ringkas — detail lengkap ada di card "Informasi Klien B2B" -->
                    <template v-else>
                      <DetailRow label="Klien">
                        <span class="font-weight-semibold text-info">{{ invoice.klien_ar?.nama_klien }}</span>
                      </DetailRow>
                      <DetailRow
                        v-if="invoice.klien_ar?.perusahaan"
                        label="Penerima Tagihan"
                        :value="invoice.klien_ar.perusahaan.nama_perusahaan"
                      />
                      <DetailRow
                        label="Entitas Penagih"
                        :value="invoice.karyawan?.perusahaan?.nama_perusahaan"
                      />
                    </template>
                  </VCol>
                </VRow>
              </VCardText>
            </VCard>

            <!-- Card khusus B2B: Informasi Klien & Outlet -->
            <VCard
              v-if="isB2B"
              class="rounded-xl elevation-2 border b2b-client-card"
            >
              <VCardTitle class="pa-4 pb-2 font-weight-bold text-info d-flex align-center">
                <VIcon
                  icon="ri-building-4-line"
                  class="me-2"
                />
                Informasi Klien B2B
                <VSpacer />
                <VChip
                  color="info"
                  size="x-small"
                  variant="tonal"
                  label
                >
                  PT / Perusahaan
                </VChip>
              </VCardTitle>
              <VDivider color="info" />
              <VCardText>
                <VRow>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <div class="text-caption text-medium-emphasis font-weight-medium text-uppercase mb-2">
                      Identitas Klien
                    </div>
                    <DetailRow
                      label="Nama Klien"
                      :value="invoice.klien_ar?.nama_klien"
                    />
                    <DetailRow
                      label="Kode Klien"
                      :value="invoice.klien_ar?.kode_klien"
                    />
                    <DetailRow
                      label="Staff AR"
                      :value="invoice.klien_ar?.karyawan_ar?.nama_karyawan"
                    />
                    <VDivider class="my-3" />
                    <div class="text-caption text-medium-emphasis font-weight-medium text-uppercase mb-2">
                      Tagihan Resto
                    </div>
                    <template v-if="invoice.resto">
                      <DetailRow label="Nama Resto">
                        <span class="font-weight-semibold">{{ invoice.resto.nama_resto }}</span>
                      </DetailRow>
                      <DetailRow
                        label="Kode Resto"
                        :value="invoice.resto.kode_resto"
                      />
                    </template>
                    <template v-else>
                      <VAlert
                        type="info"
                        variant="tonal"
                        density="compact"
                        icon="ri-merge-cells-horizontal"
                        class="mt-1"
                      >
                        <strong>Invoice Konsolidasi</strong> — tagihan mencakup seluruh resto klien pada tanggal pengiriman.
                      </VAlert>
                    </template>
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <template v-if="invoice.klien_ar?.resto?.investor">
                      <div class="text-caption text-medium-emphasis font-weight-medium text-uppercase mb-2">
                        Pemilik &amp; Pengelola
                      </div>
                      <DetailRow
                        label="Investor"
                        :value="invoice.klien_ar.resto.investor.nama_investor"
                      />
                      <DetailRow
                        v-if="invoice.klien_ar.resto.investor.no_hp"
                        label="HP Investor"
                        :value="invoice.klien_ar.resto.investor.no_hp"
                      />
                      <DetailRow
                        v-if="invoice.klien_ar.resto.investor.pengelola"
                        label="Pengelola"
                        :value="invoice.klien_ar.resto.investor.pengelola"
                      />
                      <DetailRow
                        v-if="invoice.klien_ar.resto.investor.no_hp_pengelola"
                        label="HP Pengelola"
                        :value="invoice.klien_ar.resto.investor.no_hp_pengelola"
                      />
                    </template>
                  </VCol>
                </VRow>
              </VCardText>
            </VCard>

            <VCard
              v-if="isOpeningBalance"
              class="rounded-xl elevation-2 border"
            >
              <VCardTitle
                class="pa-4 pb-2 font-weight-bold d-flex align-center"
                :class="isB2B ? 'text-info' : 'text-primary'"
              >
                <VIcon
                  icon="ri-file-list-2-line"
                  class="me-2"
                />
                Rincian Invoice Asal
              </VCardTitle>
              <VDivider />
              <OpeningBalanceDetailTable
                :details="invoice.opening_balance_details ?? []"
                readonly
              />
            </VCard>

            <VCard
              v-if="isOpeningBalance"
              class="rounded-xl elevation-2 border"
            >
              <VCardTitle
                class="pa-4 pb-2 font-weight-bold d-flex align-center"
                :class="isB2B ? 'text-info' : 'text-primary'"
              >
                <VIcon
                  icon="ri-history-line"
                  class="me-2"
                />
                Riwayat Approval
              </VCardTitle>
              <VDivider />
              <VTable
                density="compact"
                class="invoice-table"
              >
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Waktu</th>
                    <th>Aksi</th>
                    <th>Pengguna</th>
                    <th>Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="approvalLogs.length === 0">
                    <td
                      colspan="5"
                      class="text-center text-medium-emphasis py-4"
                    >
                      Belum ada riwayat approval
                    </td>
                  </tr>
                  <tr
                    v-for="(log, index) in approvalLogs"
                    :key="log.id"
                  >
                    <td>{{ index + 1 }}</td>
                    <td>{{ formatDateTime(log.created_at) }}</td>
                    <td>
                      <VChip
                        size="small"
                        :color="approvalActionColor(log.action)"
                        variant="tonal"
                        label
                      >
                        {{ approvalActionLabel(log.action) }}
                      </VChip>
                    </td>
                    <td>{{ log.actor_name ?? '-' }}</td>
                    <td>{{ log.note ?? '-' }}</td>
                  </tr>
                </tbody>
              </VTable>
            </VCard>

            <VCard
              v-if="!invoice.is_opening_balance"
              class="rounded-xl elevation-2 border"
            >
              <VCardTitle
                class="pa-4 pb-2 font-weight-bold d-flex align-center"
                :class="isB2B ? 'text-info' : 'text-primary'"
              >
                <VIcon
                  icon="ri-list-check-2"
                  class="me-2"
                />
                Item Tagihan
              </VCardTitle>
              <VDivider />
              <VTable
                density="compact"
                class="invoice-table"
              >
                <thead>
                  <tr>
                    <th>No</th>
                    <th v-if="isB2B">
                      No Invoice Resto
                    </th>
                    <th v-if="isB2B">
                      Kode Resto
                    </th>
                    <th v-if="isB2B">
                      Nama Resto
                    </th>
                    <th>Barang</th>
                    <th>Nama Barang</th>
                    <th class="text-right">
                      Qty
                    </th>
                    <th>Satuan</th>
                    <th class="text-right">
                      Harga Satuan
                    </th>
                    <th class="text-right">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(it, i) in invoice.items"
                    :key="it.id"
                  >
                    <td>{{ i + 1 }}</td>
                    <td v-if="isB2B">
                      <VChip
                        v-if="it.no_invoice_resto"
                        size="x-small"
                        color="info"
                        variant="tonal"
                        label
                      >
                        {{ it.no_invoice_resto }}
                      </VChip>
                      <span v-else>-</span>
                    </td>
                    <td v-if="isB2B">
                      {{ it.kode_resto ?? '-' }}
                    </td>
                    <td v-if="isB2B">
                      {{ it.nama_resto ?? '-' }}
                    </td>
                    <td>
                      <VChip
                        v-if="it.barang?.kode_barang"
                        size="small"
                        color="secondary"
                        variant="tonal"
                        label
                      >
                        {{ it.barang.kode_barang }}
                      </VChip>
                      <span v-else>-</span>
                    </td>
                    <td>{{ it.nama_barang }}</td>
                    <td class="text-right">
                      {{ it.qty }}
                    </td>
                    <td>{{ it.satuan }}</td>
                    <td class="text-right">
                      {{ formatCurrency(it.harga_satuan) }}
                    </td>
                    <td class="text-right">
                      {{ formatCurrency(it.subtotal) }}
                    </td>
                  </tr>
                </tbody>
              </VTable>
            </VCard>

            <VCard class="rounded-xl elevation-2 border">
              <VCardTitle
                class="pa-4 pb-2 font-weight-bold d-flex align-center justify-space-between"
                :class="isB2B ? 'text-info' : 'text-primary'"
              >
                <span>
                  <VIcon
                    icon="ri-bank-card-line"
                    class="me-2"
                  />
                  Riwayat Pembayaran
                </span>
              </VCardTitle>
              <VDivider />
              <VAlert
                v-if="isOpeningBalance && !invoice.can_record_payment"
                type="warning"
                variant="tonal"
                class="ma-4 mb-0"
              >
                Opening balance belum aktif sebagai piutang. Pembayaran baru bisa dicatat setelah approval disetujui.
              </VAlert>
              <VTable density="compact">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Tanggal</th>
                    <th>Metode</th>
                    <th class="text-right">
                      Jumlah
                    </th>
                    <th>No. Referensi</th>
                    <th>Keterangan</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="invoice.pembayarans?.length === 0">
                    <td
                      colspan="7"
                      class="text-center text-medium-emphasis py-4"
                    >
                      Belum ada pembayaran
                    </td>
                  </tr>
                  <tr
                    v-for="(p, i) in invoice.pembayarans"
                    :key="p.id"
                  >
                    <td>{{ i + 1 }}</td>
                    <td>{{ formatDate(p.tanggal_pembayaran) }}</td>
                    <td>
                      <VChip
                        size="small"
                        :color="metodeColor(p.metode_pembayaran)"
                        variant="tonal"
                        label
                      >
                        {{ p.metode_pembayaran }}
                      </VChip>
                    </td>
                    <td class="text-right">
                      {{ formatCurrency(p.jumlah_pembayaran) }}
                    </td>
                    <td>{{ p.no_referensi ?? '-' }}</td>
                    <td>{{ p.keterangan ?? '-' }}</td>
                    <td>
                      <VBtn
                        v-if="canManagePayments"
                        icon
                        size="x-small"
                        variant="text"
                        color="error"
                        @click="confirmDeletePembayaran(p)"
                      >
                        <VIcon
                          icon="ri-delete-bin-line"
                          size="16"
                        />
                        <VTooltip activator="parent">
                          Hapus
                        </VTooltip>
                      </VBtn>
                    </td>
                  </tr>
                </tbody>
              </VTable>
            </VCard>
          </div>
        </VCol>

        <VCol
          cols="12"
          lg="4"
        >
          <div class="invoice-show-stack">
            <VCard class="rounded-xl elevation-2 border">
              <VCardTitle
                class="pa-4 pb-2 font-weight-bold d-flex align-center"
                :class="isB2B ? 'text-info' : 'text-primary'"
              >
                <VIcon
                  icon="ri-calculator-line"
                  class="me-2"
                />
                Ringkasan Tagihan
              </VCardTitle>
              <VDivider />
              <VCardText>
                <DetailRow
                  label="Subtotal"
                  :value="formatCurrency(invoice.subtotal)"
                />
                <DetailRow
                  label="Tagihan Sebelumnya"
                  :value="formatCurrency(invoice.tagihan_periode_sebelumnya)"
                />
                <VDivider class="my-2" />
                <DetailRow
                  label="Total Tagihan"
                  :value="formatCurrency(invoice.total_tagihan)"
                />
                <DetailRow
                  label="Total Terbayar"
                  :value="formatCurrency(invoice.total_pembayaran)"
                />
                <VDivider class="my-2" />
                <div class="d-flex py-2">
                  <span
                    class="text-body-2 text-medium-emphasis"
                    style="min-width: 130px"
                  >Sisa Tagihan</span>
                  <span
                    class="text-body-1 font-weight-bold"
                    :class="invoice.sisa_tagihan > 0 ? 'text-error' : 'text-success'"
                  >
                    {{ formatCurrency(invoice.sisa_tagihan) }}
                  </span>
                </div>
              </VCardText>
            </VCard>

            <!-- Sidebar widget khusus B2B -->
            <VCard
              v-if="isB2B"
              class="rounded-xl elevation-2 border b2b-client-card"
            >
              <VCardTitle class="pa-4 pb-2 font-weight-bold text-info d-flex align-center">
                <VIcon
                  icon="ri-building-4-line"
                  class="me-2"
                />
                Konteks B2B
              </VCardTitle>
              <VDivider color="info" />
              <VCardText class="pt-3">
                <div class="d-flex align-center mb-3">
                  <VAvatar
                    color="info"
                    variant="tonal"
                    size="36"
                    class="me-3"
                  >
                    <VIcon
                      icon="ri-building-4-line"
                      size="18"
                    />
                  </VAvatar>
                  <div>
                    <div class="text-body-2 font-weight-semibold">
                      {{ invoice.klien_ar?.nama_klien }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ invoice.klien_ar?.kode_klien }}
                    </div>
                  </div>
                </div>
                <VDivider class="mb-3" />
                <div class="mb-3">
                  <template v-if="invoice.resto">
                    <div class="text-caption text-medium-emphasis mb-1">
                      Outlet Ditagihkan
                    </div>
                    <div class="d-flex align-center gap-2">
                      <VIcon
                        icon="ri-store-line"
                        color="info"
                        size="16"
                      />
                      <span class="text-body-2 font-weight-medium">{{ invoice.resto.nama_resto }}</span>
                    </div>
                    <div class="text-caption text-medium-emphasis ms-6">
                      {{ invoice.resto.kode_resto }}
                    </div>
                  </template>
                  <template v-else>
                    <div class="text-caption text-medium-emphasis mb-1">
                      Mode Tagihan
                    </div>
                    <VChip
                      color="info"
                      size="small"
                      variant="tonal"
                      label
                      prepend-icon="ri-merge-cells-horizontal"
                    >
                      Konsolidasi
                    </VChip>
                    <div
                      v-if="invoice.tanggal_kirim_barang"
                      class="text-caption text-medium-emphasis mt-1"
                    >
                      Tgl kirim: <strong>{{ formatDate(invoice.tanggal_kirim_barang) }}</strong>
                    </div>
                  </template>
                </div>
                <div v-if="invoice.karyawan?.perusahaan?.nama_perusahaan">
                  <div class="text-caption text-medium-emphasis mb-1">
                    Entitas Penagih
                  </div>
                  <div class="d-flex align-center gap-2">
                    <VIcon
                      icon="ri-briefcase-4-line"
                      color="info"
                      size="16"
                    />
                    <span class="text-body-2 font-weight-medium">{{ invoice.karyawan.perusahaan.nama_perusahaan }}</span>
                  </div>
                </div>
              </VCardText>
            </VCard>

            <VCard
              v-if="isOpeningBalance"
              class="rounded-xl elevation-2 border"
            >
              <VCardTitle
                class="pa-4 pb-2 font-weight-bold d-flex align-center"
                :class="isB2B ? 'text-info' : 'text-primary'"
              >
                <VIcon
                  icon="ri-shield-check-line"
                  class="me-2"
                />
                Persetujuan Opening Balance
              </VCardTitle>
              <VDivider />
              <VCardText>
                <div class="d-flex align-center justify-space-between mb-4">
                  <span class="text-body-2 text-medium-emphasis">Status Approval</span>
                  <ApprovalStatusBadge :status="invoice.approval_status" />
                </div>

                <DetailRow
                  label="Diajukan Oleh"
                  :value="invoice.submitted_by_name ?? invoice.created_by_name"
                />
                <DetailRow
                  label="Diajukan Pada"
                  :value="formatDateTime(invoice.submitted_at)"
                />
                <DetailRow
                  label="Disetujui Oleh"
                  :value="invoice.approved_by_name"
                />
                <DetailRow
                  label="Disetujui Pada"
                  :value="formatDateTime(invoice.approved_at)"
                />
                <DetailRow
                  label="Ditolak Oleh"
                  :value="invoice.rejected_by_name"
                />
                <DetailRow
                  label="Ditolak Pada"
                  :value="formatDateTime(invoice.rejected_at)"
                />
                <DetailRow
                  v-if="latestDecisionLog?.note"
                  :label="invoice.approval_status === 'REJECTED' ? 'Catatan Penolakan' : 'Catatan Approval'"
                  :value="latestDecisionLog.note"
                />

                <VAlert
                  v-if="approvalNotice"
                  :type="approvalNotice.type"
                  variant="tonal"
                  class="mt-4"
                >
                  <div class="font-weight-medium mb-1">
                    {{ approvalNotice.title }}
                  </div>
                  <div>{{ approvalNotice.text }}</div>
                </VAlert>
              </VCardText>
            </VCard>
          </div>
        </VCol>
      </VRow>
    </template>

    <BaseModal
      v-model="showUbahStatus"
      title="Ubah Status Invoice"
      :loading="statusLoading"
      @confirm="doUbahStatus"
    >
      <VSelect
        v-model="newStatus"
        label="Status Baru"
        variant="outlined"
        density="compact"
        :items="nextStatuses"
        item-title="label"
        item-value="value"
      />
    </BaseModal>

    <BaseModal
      v-model="showDeletePembayaran"
      title="Hapus Pembayaran"
      :loading="deleteLoading"
      @confirm="doDeletePembayaran"
    >
      <p>Apakah Anda yakin ingin menghapus catatan pembayaran ini?</p>
    </BaseModal>

    <BaseModal
      v-model="showApproveModal"
      title="Setujui Opening Balance"
      :loading="approvalLoading"
      @confirm="submitApprove"
    >
      <VTextarea
        v-model="approveNote"
        label="Catatan Approval"
        variant="outlined"
        rows="3"
        auto-grow
        hint="Opsional"
        persistent-hint
      />

      <template #actions>
        <VBtn
          variant="tonal"
          color="secondary"
          @click="showApproveModal = false"
        >
          Batal
        </VBtn>
        <VBtn
          color="success"
          :disabled="approvalLoading"
          @click="submitApprove"
        >
          Setujui
        </VBtn>
      </template>
    </BaseModal>

    <BaseModal
      v-model="showRejectModal"
      title="Tolak Opening Balance"
      :loading="approvalLoading"
      @confirm="submitReject"
    >
      <VTextarea
        v-model="rejectNote"
        label="Alasan Penolakan"
        variant="outlined"
        rows="3"
        auto-grow
        :rules="[value => !!value || 'Catatan penolakan wajib diisi']"
      />

      <template #actions>
        <VBtn
          variant="tonal"
          color="secondary"
          @click="showRejectModal = false"
        >
          Batal
        </VBtn>
        <VBtn
          color="error"
          :disabled="approvalLoading"
          @click="submitReject"
        >
          Tolak
        </VBtn>
      </template>
    </BaseModal>

    <BaseModal
      v-model="showResubmitModal"
      title="Ajukan Ulang Opening Balance"
      :loading="approvalLoading"
      @confirm="submitResubmit"
    >
      <VTextarea
        v-model="resubmitNote"
        label="Catatan Pengajuan Ulang"
        variant="outlined"
        rows="3"
        auto-grow
        hint="Opsional"
        persistent-hint
      />

      <template #actions>
        <VBtn
          variant="tonal"
          color="secondary"
          @click="showResubmitModal = false"
        >
          Batal
        </VBtn>
        <VBtn
          color="primary"
          :disabled="approvalLoading"
          @click="submitResubmit"
        >
          Ajukan Ulang
        </VBtn>
      </template>
    </BaseModal>

    <!-- Share Dialog -->
    <ShareInvoicesDialog
      v-model="showShareDialog"
      :pre-selected="invoice ? [invoice] : []"
    />
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useCrud } from '@/composables/useCrud'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { useFormatter } from '@/composables/useFormatter'
import { useAuthStore } from '@/stores/auth.store'
import { useFinanceNotificationStore } from '@/stores/finance-notification.store'
import api from '@/utils/axios'
import ApprovalStatusBadge from '../components/ApprovalStatusBadge.vue'
import InvoiceStatusBadge from '../components/InvoiceStatusBadge.vue'
import OpeningBalanceDetailTable from '../components/OpeningBalanceDetailTable.vue'
import ShareInvoicesDialog from '../components/ShareInvoicesDialog.vue'

const route = useRoute()
const authStore = useAuthStore()
const financeNotificationStore = useFinanceNotificationStore()
const { showSuccess, showError, showLoading, closeAlert } = useSweetAlert()
const id = computed(() => route.params.id)

const { fetchOne, loading, error } = useCrud('/finance/invoices')
const { formatCurrency, formatDate, formatDateTime } = useFormatter()

const invoice = shallowRef(null)
const showUbahStatus = ref(false)
const showShareDialog = ref(false)
const showDeletePembayaran = ref(false)
const showApproveModal = ref(false)
const showRejectModal = ref(false)
const showResubmitModal = ref(false)
const selectedPembayaran = ref(null)
const newStatus = ref('')
const statusLoading = ref(false)
const deleteLoading = ref(false)
const approvalLoading = ref(false)
const approveNote = ref('')
const rejectNote = ref('')
const resubmitNote = ref('')
const pageErrorMessage = ref('')
const actionMessage = ref('')
const actionErrorMessage = ref('')
let loadInvoiceController = null

const statusTransitions = {
  TERKIRIM: [{ label: 'Lunas', value: 'LUNAS' }],
  SEBAGIAN: [{ label: 'Lunas', value: 'LUNAS' }],
}

const isOpeningBalance = computed(() => invoice.value?.is_opening_balance === true)
const isB2B = computed(() => invoice.value?.klien_ar?.tipe_klien === 'PT')
const documentLabel = computed(() => isOpeningBalance.value ? 'Opening Balance' : 'Invoice')

const isOverdue = computed(() => {
  if (!invoice.value?.tanggal_jatuh_tempo) return false
  return new Date(invoice.value.tanggal_jatuh_tempo) < new Date()
})

const canManagePayments = computed(() => !!invoice.value && invoice.value.can_record_payment)

const canChangeStatus = computed(() =>
  !!invoice.value && invoice.value.status !== 'DRAFT' && invoice.value.can_record_payment)

const approvalLogs = computed(() => invoice.value?.approval_logs ?? [])

const latestDecisionLog = computed(() =>
  approvalLogs.value.find(log => ['APPROVED', 'REJECTED'].includes(log.action)))

const listRoute = computed(() => {
  return isOpeningBalance.value
    ? { name: 'finance-opening-balance' }
    : { name: 'finance-invoice-index' }
})

const listLabel = computed(() => {
  return isOpeningBalance.value ? 'Opening Balance' : 'Invoice'
})

const detailLabel = computed(() => isOpeningBalance.value ? 'Detail Opening Balance' : 'Detail Invoice')

const pageTitle = computed(() => {
  if (!invoice.value) return detailLabel.value

  return isOpeningBalance.value
    ? `Opening Balance ${invoice.value.no_invoice}`
    : `Invoice ${invoice.value.no_invoice}`
})

const pageSubtitle = computed(() => {
  if (isOpeningBalance.value) return 'Detail saldo awal piutang klien dan proses persetujuannya'
  return isB2B.value
    ? 'Invoice B2B — Tagihan langsung ke perusahaan/PT'
    : 'Invoice B2C — Tagihan ke pengelola outlet'
})

const showEditButton = computed(() => {
  if (!invoice.value) return false

  return isOpeningBalance.value
    ? invoice.value.can_edit
    : invoice.value.status === 'DRAFT'
})

const editRoute = computed(() =>
  isOpeningBalance.value
    ? { name: 'finance-opening-balance-edit', params: { id: id.value } }
    : { name: 'finance-invoice-edit', params: { id: id.value } })

const nextStatuses = computed(() => canChangeStatus.value ? (statusTransitions[invoice.value?.status] ?? []) : [])

const approvalNotice = computed(() => {
  if (!isOpeningBalance.value) return null

  if (invoice.value?.approval_status === 'PENDING') {
    return {
      type: 'warning',
      title: 'Menunggu Persetujuan Direktur',
      text: 'Opening balance ini belum aktif sebagai piutang. Pembayaran, cetak, dan perubahan status baru tersedia setelah approval disetujui.',
    }
  }

  if (invoice.value?.approval_status === 'REJECTED') {
    return {
      type: 'error',
      title: 'Pengajuan Ditolak',
      text: 'Perbaiki data opening balance bila diperlukan, lalu ajukan ulang untuk proses persetujuan berikutnya.',
    }
  }

  if (invoice.value?.approval_status === 'APPROVED') {
    return {
      type: 'success',
      title: 'Approval Selesai',
      text: 'Opening balance sudah disetujui dan aktif mengikuti alur piutang normal.',
    }
  }

  return null
})

function resetActionFeedback() {
  actionMessage.value = ''
  actionErrorMessage.value = ''
}

function resetApprovalModals() {
  showApproveModal.value = false
  showRejectModal.value = false
  showResubmitModal.value = false
  approveNote.value = ''
  rejectNote.value = ''
  resubmitNote.value = ''
}

function approvalActionLabel(action) {
  const labels = {
    SUBMITTED: 'Diajukan',
    RESUBMITTED: 'Diajukan Ulang',
    APPROVED: 'Disetujui',
    REJECTED: 'Ditolak',
  }

  return labels[action] ?? action
}

function approvalActionColor(action) {
  const colors = {
    SUBMITTED: 'warning',
    RESUBMITTED: 'primary',
    APPROVED: 'success',
    REJECTED: 'error',
  }

  return colors[action] ?? 'secondary'
}

function metodeColor(method) {
  const map = {
    TRANSFER: 'info',
    CASH: 'success',
    GIRO: 'warning',
  }

  return map[method] ?? 'secondary'
}

async function loadInvoice() {
  pageErrorMessage.value = ''
  loadInvoiceController?.abort()

  const controller = new AbortController()

  loadInvoiceController = controller

  const data = await fetchOne(id.value, {
    signal: controller.signal,
  })

  if (controller.signal.aborted)
    return

  invoice.value = data
  newStatus.value = ''

  if (!data)
    pageErrorMessage.value = error.value ?? 'Data invoice tidak ditemukan'
}

async function doUbahStatus() {
  if (!newStatus.value) return

  resetActionFeedback()
  statusLoading.value = true
  showLoading({
    title: 'Mengubah Status Invoice',
    text: 'Status invoice sedang diperbarui...',
  })

  try {
    const { data } = await api.patch(`/finance/invoices/${id.value}/status`, { status: newStatus.value })

    actionMessage.value = data.message ?? 'Status invoice berhasil diperbarui'
    showUbahStatus.value = false
    await loadInvoice()
  } catch (err) {
    actionErrorMessage.value = err.response?.data?.message ?? 'Gagal mengubah status invoice'
  } finally {
    closeAlert({ onlyLoading: true })
    statusLoading.value = false
  }
}

function confirmDeletePembayaran(pembayaran) {
  selectedPembayaran.value = pembayaran
  showDeletePembayaran.value = true
}

async function doDeletePembayaran() {
  if (!selectedPembayaran.value) return

  resetActionFeedback()
  showDeletePembayaran.value = false
  await nextTick()
  deleteLoading.value = true
  showLoading({
    title: 'Menghapus Pembayaran',
    text: 'Catatan pembayaran sedang dihapus...',
  })

  try {
    await api.delete(`/finance/pembayaran/${selectedPembayaran.value.id}`)
    actionMessage.value = 'Pembayaran berhasil dihapus'
    showDeletePembayaran.value = false
    selectedPembayaran.value = null
    await loadInvoice()
    await showSuccess('Pembayaran berhasil dihapus.')
  } catch (err) {
    actionErrorMessage.value = err.response?.data?.message ?? 'Gagal menghapus pembayaran'
    await showError(actionErrorMessage.value)
  } finally {
    closeAlert({ onlyLoading: true })
    deleteLoading.value = false
  }
}

async function submitApprove() {
  resetActionFeedback()
  approvalLoading.value = true
  showLoading({
    title: 'Menyetujui Opening Balance',
    text: 'Persetujuan sedang diproses...',
  })

  try {
    const { data } = await api.patch(`/finance/opening-balance/${id.value}/approve`, {
      note: approveNote.value || null,
    })

    actionMessage.value = data.message ?? 'Opening balance berhasil disetujui'
    resetApprovalModals()
    await loadInvoice()
    await refreshPendingOpeningBalanceBadge()
  } catch (err) {
    actionErrorMessage.value = err.response?.data?.message ?? 'Gagal menyetujui opening balance'
  } finally {
    closeAlert({ onlyLoading: true })
    approvalLoading.value = false
  }
}

async function submitReject() {
  if (!rejectNote.value.trim()) {
    actionErrorMessage.value = 'Catatan penolakan wajib diisi'

    return
  }

  resetActionFeedback()
  approvalLoading.value = true
  showLoading({
    title: 'Menolak Opening Balance',
    text: 'Keputusan sedang diproses...',
  })

  try {
    const { data } = await api.patch(`/finance/opening-balance/${id.value}/reject`, {
      note: rejectNote.value.trim(),
    })

    actionMessage.value = data.message ?? 'Opening balance berhasil ditolak'
    resetApprovalModals()
    await loadInvoice()
    await refreshPendingOpeningBalanceBadge()
  } catch (err) {
    actionErrorMessage.value = err.response?.data?.message ?? 'Gagal menolak opening balance'
  } finally {
    closeAlert({ onlyLoading: true })
    approvalLoading.value = false
  }
}

async function submitResubmit() {
  resetActionFeedback()
  approvalLoading.value = true
  showLoading({
    title: 'Mengajukan Ulang Opening Balance',
    text: 'Pengajuan ulang sedang diproses...',
  })

  try {
    const { data } = await api.patch(`/finance/opening-balance/${id.value}/resubmit`, {
      note: resubmitNote.value || null,
    })

    actionMessage.value = data.message ?? 'Opening balance berhasil diajukan ulang'
    resetApprovalModals()
    await loadInvoice()
    await refreshPendingOpeningBalanceBadge()
  } catch (err) {
    actionErrorMessage.value = err.response?.data?.message ?? 'Gagal mengajukan ulang opening balance'
  } finally {
    closeAlert({ onlyLoading: true })
    approvalLoading.value = false
  }
}

async function printInvoice() {
  try {
    const res = await api.get(`/finance/invoices/${id.value}/print`, { responseType: 'blob' })
    const blobUrl = URL.createObjectURL(res.data)
    window.open(blobUrl, '_blank')
    setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000)
  } catch {
    await showError('Gagal membuka dokumen cetak')
  }
}

function shareViaWhatsapp() {
  showShareDialog.value = true
}

async function refreshPendingOpeningBalanceBadge() {
  if (authStore.canApproveOpeningBalance)
    await financeNotificationStore.fetchPendingOpeningBalanceCount()
}

watch(id, loadInvoice, { immediate: true })

onBeforeUnmount(() => {
  loadInvoiceController?.abort()
})
</script>

<style lang="scss" scoped>
.invoice-show-stack {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.invoice-table :deep(table) {
  background: transparent;
}

.invoice-table :deep(th) {
  white-space: nowrap;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.invoice-table :deep(td) {
  vertical-align: middle;
}

.b2b-card,
.b2b-client-card {
  border-left: 3px solid rgb(var(--v-theme-info)) !important;
}
</style>
