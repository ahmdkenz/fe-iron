<template>
  <VRow class="mb-4">
    <VCol
      v-for="card in cards"
      :key="card.key"
      cols="12"
      sm="6"
      md="3"
    >
      <VCard>
        <VCardText>
          <div class="d-flex align-center gap-3">
            <VAvatar
              :color="card.color ?? 'primary'"
              variant="tonal"
              size="44"
            >
              <VIcon :icon="card.icon" />
            </VAvatar>
            <div>
              <div class="text-caption text-medium-emphasis">
                {{ card.label }}
              </div>
              <div class="text-h6 font-weight-bold">
                {{ card.value ?? '-' }}
              </div>
            </div>
          </div>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<script setup>
defineProps({
  cards: { type: Array, default: () => [] },
})
</script>
