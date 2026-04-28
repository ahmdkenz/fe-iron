<template>
  <VDataTableServer
    class="base-table"
    :class="{ 'base-table--wrap-text': wrapText }"
    v-bind="$attrs"
    :headers="headers"
    :items="items"
    :items-length="total"
    :loading="loading"
    :items-per-page="perPage"
    :page="page"
    @update:options="handleOptionsUpdate"
  >
    <template
      v-for="(_, name) in $slots"
      #[name]="slotProps"
    >
      <slot
        :name="name"
        v-bind="slotProps ?? {}"
      />
    </template>
  </VDataTableServer>
</template>

<script setup>
const props = defineProps({
  headers: { type: Array, required: true },
  items: { type: Array, default: () => [] },
  total: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
  perPage: { type: Number, default: 10 },
  page: { type: Number, default: 1 },
  wrapText: { type: Boolean, default: false },
})

const emit = defineEmits(['update:options'])

function handleOptionsUpdate(options) {
  if (options.page === props.page && options.itemsPerPage === props.perPage)
    return

  emit('update:options', options)
}
</script>

<style scoped>
.base-table--wrap-text :deep(.v-table__wrapper > table) {
  min-width: 100%;
  width: max-content;
}

.base-table--wrap-text :deep(.v-table__wrapper > table > thead > tr > th),
.base-table--wrap-text :deep(.v-table__wrapper > table > tbody > tr > td) {
  height: auto;
  line-height: 1.4;
  overflow-wrap: normal;
  padding-block: 12px;
  white-space: normal;
  word-break: normal;
}

.base-table--wrap-text :deep(.v-table__wrapper > table > thead > tr > th) {
  min-height: var(--v-table-header-height);
}

.base-table--wrap-text :deep(.v-table__wrapper > table > tbody > tr > td) {
  min-height: var(--v-table-row-height);
}

.base-table--wrap-text :deep(.v-data-table-header__content) {
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  line-height: 1.35;
  overflow-wrap: normal;
  white-space: normal;
  word-break: normal;
}

.base-table--wrap-text :deep(.v-chip) {
  block-size: auto;
  max-inline-size: 100%;
}

.base-table--wrap-text :deep(.v-chip__content) {
  overflow-wrap: normal;
  text-align: start;
  white-space: normal;
  word-break: normal;
}
</style>
