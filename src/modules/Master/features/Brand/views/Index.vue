<template>
  <div>
    <!-- ═══ MOBILE (<600px) — tampilan lama, tidak diubah ═══ -->
    <template v-if="xs">
      <PageHeader
        title="Manajemen Brand"
        subtitle="Kelola data brand"
        :breadcrumbs="[
          { title: 'Dashboard', to: { name: 'dashboard' } },
          { title: 'Brand', disabled: true }
        ]"
      >
        <VBtn
          color="primary"
          prepend-icon="ri-add-line"
          @click="openCreate"
        >
          Tambah Brand
        </VBtn>
      </PageHeader>

      <VCard>
        <VCardText class="d-flex gap-4 pb-0">
          <VTextField
            v-model="params.search"
            placeholder="Cari kode / nama brand..."
            clearable
            hide-details
            density="compact"
            style="max-width: 300px"
            prepend-inner-icon="ri-search-line"
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
          <template #item.kode_brand="{ item }">
            <VChip
              color="primary"
              size="small"
              variant="tonal"
              label
            >
              {{ item.kode_brand }}
            </VChip>
          </template>
          <template #item.keterangan="{ item }">
            {{ item.keterangan ?? '-' }}
          </template>
          <template #item.status="{ item }">
            <StatusChip :active="item.status" />
          </template>
          <template #item.created_by_name="{ item }">
            {{ item.created_by_name ?? '-' }}
          </template>
          <template #item.updated_by_name="{ item }">
            {{ item.updated_by_name ?? '-' }}
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
                icon
                size="small"
                variant="text"
                color="primary"
                @click="openEdit(item)"
              >
                <VIcon
                  icon="ri-pencil-line"
                  size="18"
                />
                <VTooltip activator="parent">
                  Edit
                </VTooltip>
              </VBtn>
              <VBtn
                icon
                size="small"
                variant="text"
                color="error"
                @click="confirmDelete(item)"
              >
                <VIcon
                  icon="ri-delete-bin-line"
                  size="18"
                />
                <VTooltip activator="parent">
                  Hapus
                </VTooltip>
              </VBtn>
            </div>
          </template>
        </BaseTable>
      </VCard>
    </template>

    <!-- ═══ DESKTOP (≥600px) — redesign modern & berwarna ═══ -->
    <template v-else>
      <ManagementIndexShell
        tone="indigo"
        icon="ri-price-tag-3-line"
        title="Manajemen Brand"
        subtitle="Kelola data brand"
        :breadcrumbs="[
          { title: 'Dashboard', to: { name: 'dashboard' } },
          { title: 'Brand', disabled: true }
        ]"
        :stats="stats"
        :stats-loading="loading && !items.length"
        search-placeholder="Cari kode / nama brand..."
        v-model:search="params.search"
        v-model:status="statusFilter"
        @update:search="debouncedFetch"
        @update:status="onStatusChange"
      >
        <template #actions>
          <VBtn
            color="primary"
            prepend-icon="ri-add-line"
            @click="openCreate"
          >
            Tambah Brand
          </VBtn>
        </template>

        <BaseTable
          :headers="headers"
          :items="items"
          :total="meta.total"
          :loading="loading"
          :per-page="meta.per_page"
          :page="meta.current_page"
          @update:options="onTableOptions"
        >
          <template #item.no="{ index }">
            {{ (meta.current_page - 1) * meta.per_page + index + 1 }}
          </template>
          <template #item.kode_brand="{ item }">
            <VChip
              color="primary"
              size="small"
              variant="tonal"
              label
            >
              {{ item.kode_brand }}
            </VChip>
          </template>
          <template #item.keterangan="{ item }">
            {{ item.keterangan ?? '-' }}
          </template>
          <template #item.status="{ item }">
            <StatusChip :active="item.status" />
          </template>
          <template #item.created_by_name="{ item }">
            {{ item.created_by_name ?? '-' }}
          </template>
          <template #item.updated_by_name="{ item }">
            {{ item.updated_by_name ?? '-' }}
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
                icon
                size="small"
                variant="text"
                color="primary"
                @click="openEdit(item)"
              >
                <VIcon
                  icon="ri-pencil-line"
                  size="18"
                />
                <VTooltip activator="parent">
                  Edit
                </VTooltip>
              </VBtn>
              <VBtn
                icon
                size="small"
                variant="text"
                color="error"
                @click="confirmDelete(item)"
              >
                <VIcon
                  icon="ri-delete-bin-line"
                  size="18"
                />
                <VTooltip activator="parent">
                  Hapus
                </VTooltip>
              </VBtn>
            </div>
          </template>
        </BaseTable>
      </ManagementIndexShell>
    </template>



    <!-- Detail Dialog -->
    <DetailDialog
      v-model="showDetail"
      title="Detail Brand"
    >
      <template #hero>
        <VAvatar
          size="88"
          color="primary"
          class="mb-3"
        >
          <span class="text-h4 font-weight-bold text-white">{{ selectedBrand?.nama_brand?.charAt(0)?.toUpperCase() }}</span>
        </VAvatar>
        <div class="text-h6 font-weight-bold mb-2">
          {{ selectedBrand?.nama_brand }}
        </div>
        <VChip
          color="primary"
          size="small"
          variant="tonal"
          label
        >
          {{ selectedBrand?.kode_brand }}
        </VChip>
      </template>

      <DetailRow
        label="Keterangan"
        :value="selectedBrand?.keterangan"
      />
      <DetailRow label="Status">
        <StatusChip :active="selectedBrand?.status" />
      </DetailRow>
      <DetailRow
        label="Created By"
        :value="selectedBrand?.created_by_name"
      />
      <DetailRow
        label="Updated By"
        :value="selectedBrand?.updated_by_name"
      />
      <DetailRow
        label="Created At"
        :value="selectedBrand?.created_at"
      />
      <DetailRow
        label="Updated At"
        :value="selectedBrand?.updated_at"
      />
    </DetailDialog>

    <!-- Confirm Delete -->
    <BaseModal
      v-if="showDelete"
      v-model="showDelete"
      title="Hapus Brand"
      :loading="loading"
      confirm-action="hapus"
      @confirm="doDelete"
    >
      <p>Apakah Anda yakin ingin menghapus brand <strong>{{ selectedBrand?.nama_brand }}</strong>?</p>
      <VAlert
        v-if="deleteError"
        type="error"
        variant="tonal"
        class="mt-3"
      >
        {{ deleteError }}
      </VAlert>
    </BaseModal>

    <!-- Form Tambah / Edit Brand -->
    <BrandForm
      v-model="showForm"
      :brand-data="selectedForm"
      :minimizable="true"
      @minimize="minimizeForm"
      @saved="onFormSaved"
    />
  </div>
</template>

<script setup>
import { computed, nextTick, onActivated, onDeactivated, onMounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { useCrud } from '@/composables/useCrud.js'
import { useMinimizeWidgetStore } from '@/stores/minimize-widget.store'
import api from '@/utils/axios'

const { xs } = useDisplay()
const { showSuccess, showError } = useSweetAlert()
const { items, loading, meta, params, fetchList, remove } = useCrud('/master/brand')
const minimizeStore = useMinimizeWidgetStore()

const FORM_WIDGET_ID = 'brand-form'

const showDelete  = ref(false)
const showDetail  = ref(false)
const showForm    = ref(false)
const deleteError = ref('')
const selectedBrand = ref(null)
const selectedForm  = ref(null)
const statusFilter  = ref('all')

const stats = computed(() => ({
  total: meta.total,
  aktif: items.value.filter(i => i.status).length,
  nonaktif: items.value.filter(i => !i.status).length,
}))

const headers = [
  { title: 'No',          key: 'no',              sortable: false, width: '60px' },
  { title: 'Kode Brand',  key: 'kode_brand',      sortable: false },
  { title: 'Nama Brand',  key: 'nama_brand',      sortable: false },
  { title: 'Keterangan',  key: 'keterangan',      sortable: false },
  { title: 'Status',      key: 'status',          sortable: false },
  { title: 'Created By',  key: 'created_by_name', sortable: false },
  { title: 'Updated By',  key: 'updated_by_name', sortable: false },
  { title: 'Aksi',        key: 'actions',         sortable: false, align: 'center', width: '120px' },
]

let debounceTimer = null
function debouncedFetch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { params.page = 1; fetchList() }, 400)
}

function onTableOptions({ page, itemsPerPage }) {
  params.page = page
  params.per_page = itemsPerPage
  fetchList()
}

function onStatusChange(val) {
  statusFilter.value = val
  if (val === 'all') delete params.status
  else params.status = val
  params.page = 1
  fetchList()
}

function openCreate() {
  minimizeStore.register(FORM_WIDGET_ID, { title: 'Form Tambah Brand', routeName: 'master-brand', type: 'form', minimized: false, mode: 'create', recordId: null, endpoint: null })
  selectedForm.value = null
  showForm.value = true
}
function openEdit(b) {
  minimizeStore.register(FORM_WIDGET_ID, { title: 'Form Edit Brand', routeName: 'master-brand', type: 'form', minimized: false, mode: 'edit', recordId: b.id, endpoint: '/master/brand' })
  selectedForm.value = b
  showForm.value = true
}
function minimizeForm() {
  minimizeStore.setMinimized(FORM_WIDGET_ID, true)
  showForm.value = false
}
function onFormSaved() { minimizeStore.remove(FORM_WIDGET_ID); showForm.value = false; fetchList() }

watch(showForm, (val) => {
  if (!val) {
    const w = minimizeStore.widgets[FORM_WIDGET_ID]
    if (w && !w.minimized) minimizeStore.remove(FORM_WIDGET_ID)
  }
})

onActivated(async () => {
  if (minimizeStore.widgets[FORM_WIDGET_ID]?.pendingRestore) {
    const widget = minimizeStore.widgets[FORM_WIDGET_ID]
    minimizeStore.clearPendingRestore(FORM_WIDGET_ID)
    minimizeStore.setMinimizedFalse(FORM_WIDGET_ID)
    if (widget.mode === 'edit' && widget.recordId && widget.endpoint) {
      try {
        const res = await api.get(`${widget.endpoint}/${widget.recordId}`)
        selectedForm.value = res.data?.data ?? null
      } catch {
        selectedForm.value = null
      }
    } else {
      selectedForm.value = null
    }
    showForm.value = true
  }
})
function openDetail(b)     { selectedBrand.value = b;    showDetail.value = true }
function confirmDelete(b)  { selectedBrand.value = b;    deleteError.value = ''; showDelete.value = true }

// Dialog teleports (VDialog) survive keep-alive deactivation, so force-close
// anything not intentionally minimized to avoid a stuck scrim on other pages.
onDeactivated(() => {
  showDetail.value = false
  showDelete.value = false

  const widget = minimizeStore.widgets[FORM_WIDGET_ID]
  if (showForm.value && !widget?.minimized)
    showForm.value = false
})

async function doDelete() {
  deleteError.value = ''

  const deleteId = selectedBrand.value?.id
  if (!deleteId) return

  showDelete.value = false
  await nextTick()

  const res = await remove(deleteId)
  if (res.success) {
    fetchList()
    await showSuccess('Brand berhasil dihapus.')
  } else {
    deleteError.value = res.message || 'Gagal menghapus data'
    await showError(deleteError.value)
  }
}

onMounted(() => fetchList())
</script>
