<template>
  <div>
    <VRow class="mb-4">
      <VCol
        v-for="card in cards"
        :key="card.key"
        cols="12"
        sm="6"
        md="3"
      >
        <VCard
          variant="tonal"
          :color="card.color ?? 'primary'"
        >
          <VCardText>
            <div class="d-flex align-center gap-3">
              <VAvatar
                :color="card.color ?? 'primary'"
                variant="flat"
                size="44"
              >
                <VIcon
                  :icon="card.icon ?? 'ri-file-list-3-line'"
                  color="white"
                />
              </VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">
                  {{ card.label }}
                </div>
                <div class="text-h6 font-weight-bold">
                  {{ card.value ?? '-' }}
                </div>
                <div
                  v-if="card.sub"
                  class="text-caption font-weight-medium"
                  :class="card.subColor ? `text-${card.subColor}` : 'text-medium-emphasis'"
                >
                  {{ card.sub }}
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VRow
      v-if="summary.overdue_count || summary.due_soon_count"
      class="mb-4"
    >
      <VCol
        v-if="summary.overdue_count"
        cols="12"
        sm="6"
      >
        <VCard
          color="error"
          variant="tonal"
        >
          <VCardText class="d-flex align-center gap-3">
            <VIcon
              icon="ri-alarm-warning-line"
              size="28"
            />
            <div>
              <div class="text-body-2 font-weight-medium">
                {{ summary.overdue_count }} {{ noun }} telah lewat jatuh tempo
              </div>
              <div class="text-caption">
                Total sisa: {{ formatCurrency(summary.overdue_amount) }}
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol
        v-if="summary.due_soon_count"
        cols="12"
        sm="6"
      >
        <VCard
          color="warning"
          variant="tonal"
        >
          <VCardText class="d-flex align-center gap-3">
            <VIcon
              icon="ri-time-line"
              size="28"
            />
            <div>
              <div class="text-body-2 font-weight-medium">
                {{ summary.due_soon_count }} {{ noun }} jatuh tempo dalam 7 hari
              </div>
              <div class="text-caption">
                Total sisa: {{ formatCurrency(summary.due_soon_amount) }}
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VRow class="mb-4">
      <VCol
        cols="12"
        md="5"
      >
        <VCard class="insight-card insight-card--primary">
          <VCardTitle class="d-flex align-center gap-2">
            <VIcon
              icon="ri-building-4-line"
              color="primary"
              size="20"
            />
            Top Vendor (Sisa Terbesar)
          </VCardTitle>
          <VCardText
            class="insight-scroll"
            style="max-height: 236px; overflow-y: auto;"
          >
            <div
              v-if="!summary.top_vendors?.length"
              class="text-body-2 text-medium-emphasis"
            >
              Tidak ada data
            </div>
            <div
              v-for="(vendor, index) in summary.top_vendors"
              :key="vendor.vendor_ap_id"
              class="d-flex align-center justify-space-between py-2"
              :class="{ 'border-b': index < summary.top_vendors.length - 1 }"
            >
              <div class="d-flex align-center gap-3">
                <VAvatar
                  size="28"
                  color="primary"
                  variant="flat"
                >
                  <span class="text-caption font-weight-bold text-white">{{ index + 1 }}</span>
                </VAvatar>
                <div>
                  <div class="text-body-2 font-weight-medium">
                    {{ vendor.nama_vendor }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ vendor.kode_vendor }} · {{ vendor.jumlah_tagihan }} {{ noun }}
                  </div>
                </div>
              </div>
              <div class="text-body-2 font-weight-bold text-error">
                {{ formatCurrency(vendor.total_sisa) }}
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        md="3"
      >
        <VCard class="insight-card insight-card--info">
          <VCardTitle class="d-flex align-center gap-2">
            <VIcon
              icon="ri-pie-chart-2-line"
              color="info"
              size="20"
            />
            Status
          </VCardTitle>
          <VCardText
            class="insight-scroll"
            style="max-height: 160px; overflow-y: auto;"
          >
            <div
              v-if="!summary.status_breakdown?.length"
              class="text-body-2 text-medium-emphasis"
            >
              Tidak ada data
            </div>
            <div
              v-for="row in summary.status_breakdown"
              :key="row.status"
              class="d-flex align-center justify-space-between py-1"
            >
              <TagihanApStatusBadge :status="row.status" />
              <span class="text-body-2 font-weight-medium">{{ row.jumlah }}</span>
            </div>
          </VCardText>
        </VCard>

        <VCard
          v-if="showApprovalBreakdown"
          class="insight-card insight-card--secondary mt-4"
        >
          <VCardTitle class="d-flex align-center gap-2">
            <VIcon
              icon="ri-shield-check-line"
              color="secondary"
              size="20"
            />
            Approval
          </VCardTitle>
          <VCardText>
            <div
              v-if="!summary.approval_breakdown?.length"
              class="text-body-2 text-medium-emphasis"
            >
              Tidak ada data
            </div>
            <div
              v-for="row in summary.approval_breakdown"
              :key="row.approval_status"
              class="d-flex align-center justify-space-between py-1"
            >
              <ApprovalStatusBadge :status="row.approval_status" />
              <span class="text-body-2 font-weight-medium">{{ row.jumlah }}</span>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        md="4"
      >
        <VCard class="insight-card insight-card--warning">
          <VCardTitle class="d-flex align-center gap-2">
            <VIcon
              icon="ri-calendar-event-line"
              color="warning"
              size="20"
            />
            {{ dueSoonTitle }}
          </VCardTitle>
          <VCardText
            class="insight-scroll"
            style="max-height: 236px; overflow-y: auto;"
          >
            <div
              v-if="!summary.due_soon?.length"
              class="text-body-2 text-medium-emphasis"
            >
              {{ dueSoonEmptyText }}
            </div>
            <component
              :is="detailRouteName ? 'RouterLink' : 'div'"
              v-for="item in summary.due_soon"
              :key="item.id"
              :to="detailRouteName ? { name: detailRouteName, params: { id: item.id } } : undefined"
              class="d-block text-decoration-none"
            >
              <div class="d-flex align-center justify-space-between py-2">
                <div>
                  <div class="text-body-2 font-weight-medium text-high-emphasis">
                    {{ item.no_tagihan }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ item.nama_vendor ?? '-' }} · jatuh tempo {{ formatDate(item.tanggal_jatuh_tempo) }}
                  </div>
                </div>
                <div class="text-body-2 font-weight-bold text-warning">
                  {{ formatCurrency(item.sisa_tagihan) }}
                </div>
              </div>
            </component>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>

<script setup>
import { useFormatter } from '@/composables/useFormatter'
import TagihanApStatusBadge from '@/modules/AP/features/TagihanAp/components/TagihanApStatusBadge.vue'
import ApprovalStatusBadge from '@/modules/Finance/shared/components/ApprovalStatusBadge.vue'

defineProps({
  cards: { type: Array, default: () => [] },
  summary: { type: Object, default: () => ({}) },
  showApprovalBreakdown: { type: Boolean, default: false },
  detailRouteName: { type: String, default: null },
  noun: { type: String, default: 'tagihan' },
  dueSoonTitle: { type: String, default: 'Jatuh Tempo Terdekat' },
  dueSoonEmptyText: { type: String, default: 'Tidak ada yang jatuh tempo dalam 7 hari' },
})

const { formatCurrency, formatDate } = useFormatter()
</script>

<style scoped>
.border-b {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.insight-card {
  border-inline-start: 3px solid transparent;
}

.insight-card--primary {
  border-inline-start-color: rgb(var(--v-theme-primary));
}

.insight-card--info {
  border-inline-start-color: rgb(var(--v-theme-info));
}

.insight-card--secondary {
  border-inline-start-color: rgb(var(--v-theme-secondary));
}

.insight-card--warning {
  border-inline-start-color: rgb(var(--v-theme-warning));
}

.insight-scroll::-webkit-scrollbar {
  width: 6px;
}

.insight-scroll::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-on-surface), 0.2);
  border-radius: 3px;
}
</style>
