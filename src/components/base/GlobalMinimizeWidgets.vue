<template>
  <Transition
    v-for="widget in minimizeStore.minimizedWidgets"
    :key="widget.id"
    name="slide-up"
  >
    <VCard
      elevation="8"
      rounded="lg"
      :style="`position: fixed; bottom: ${getBottomOffset(widget.id)}px; right: 24px; z-index: 2400; width: 300px; cursor: pointer;`"
      @click="restore(widget)"
    >
      <VCardText class="pa-3">
        <div class="d-flex align-center justify-space-between mb-2">
          <div class="d-flex align-center ga-2">
            <VIcon
              :icon="getStatusIcon(widget)"
              :color="getStatusColor(widget)"
              size="18"
            />
            <span class="text-subtitle-2 font-weight-medium">{{ widget.title }}</span>
          </div>
          <VBtn
            icon
            size="x-small"
            variant="text"
            @click.stop="minimizeStore.remove(widget.id)"
          >
            <VIcon
              icon="ri-close-line"
              size="16"
            />
          </VBtn>
        </div>

        <!-- Import type: show progress or result -->
        <template v-if="widget.type === 'import'">
          <template v-if="widget.importing && widget.progress">
            <VProgressLinear
              :model-value="widget.progress.progress_total > 0
                ? (widget.progress.processed / widget.progress.progress_total) * 100
                : 0"
              :indeterminate="widget.progress.status === 'queued' || !widget.progress.progress_total"
              color="warning"
              height="6"
              rounded
              class="mb-1"
            />
            <div class="text-caption text-medium-emphasis">
              {{ widget.progress.status === 'queued'
                ? 'Menunggu antrian…'
                : `${widget.progress.processed} / ${widget.progress.progress_total} baris diproses` }}
            </div>
          </template>
          <template v-else-if="widget.result">
            <div class="text-caption">
              <strong>{{ widget.result.inserted }}</strong> ditambahkan,
              <strong>{{ widget.result.updated }}</strong> diperbarui,
              <strong>{{ widget.result.failed }}</strong> gagal
            </div>
            <div class="text-caption text-primary mt-1">
              Klik untuk lihat detail →
            </div>
          </template>
          <template v-else>
            <div class="text-caption text-medium-emphasis">
              Mempersiapkan import…
            </div>
          </template>
        </template>

        <!-- Form type -->
        <template v-else>
          <div class="text-caption text-medium-emphasis">
            Form sedang menunggu — klik untuk melanjutkan
          </div>
        </template>
      </VCardText>
    </VCard>
  </Transition>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useMinimizeWidgetStore } from '@/stores/minimize-widget.store'

const router = useRouter()
const minimizeStore = useMinimizeWidgetStore()

function getBottomOffset(id) {
  const widgets = minimizeStore.minimizedWidgets
  const idx = widgets.findIndex(w => w.id === id)

  return 24 + idx * 96
}

function getStatusIcon(widget) {
  if (widget.type === 'form') return 'ri-edit-line'
  if (widget.importing) return 'ri-loader-4-line'
  if (widget.result) return 'ri-checkbox-circle-line'

  return 'ri-upload-line'
}

function getStatusColor(widget) {
  if (widget.type === 'form') return 'primary'
  if (widget.importing) return 'warning'
  if (widget.result) return 'success'

  return 'secondary'
}

function restore(widget) {
  minimizeStore.markPendingRestore(widget.id)
  router.push({ name: widget.routeName })
}
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
