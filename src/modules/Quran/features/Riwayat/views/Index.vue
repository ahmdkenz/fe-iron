<template>
  <div>
    <PageHeader
      title="Riwayat Baca Al-Qur'an"
      subtitle="Sampai mana terakhir dibaca, dan ayat-ayat yang ditandai"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Al-Qur\'an', to: { name: 'quran-index' } },
        { title: 'Riwayat', disabled: true }
      ]"
    />

    <VTabs
      v-model="activeTab"
      class="mb-4"
    >
      <VTab value="riwayat">
        Riwayat Baca
      </VTab>
      <VTab value="bookmark">
        Bookmark
      </VTab>
    </VTabs>

    <VCard v-if="activeTab === 'riwayat'">
      <VList v-if="progressList.length">
        <VListItem
          v-for="row in progressList"
          :key="row.nomorSurah"
          :to="{ name: 'quran-baca', params: { nomor: row.nomorSurah } }"
        >
          <template #prepend>
            <VAvatar
              color="primary"
              variant="tonal"
            >
              <VIcon icon="ri-book-open-line" />
            </VAvatar>
          </template>
          <VListItemTitle>{{ row.namaSurah }}</VListItemTitle>
          <VListItemSubtitle>
            Sampai ayat {{ row.ayatNumber }} &middot; {{ formatDate(row.updatedAt) }}
          </VListItemSubtitle>
        </VListItem>
      </VList>
      <VCardText v-else>
        <VAlert
          type="info"
          variant="tonal"
        >
          Belum ada riwayat baca. Mulai baca dari halaman <RouterLink :to="{ name: 'quran-index' }">
            Al-Qur'an
          </RouterLink>.
        </VAlert>
      </VCardText>
    </VCard>

    <VCard v-else>
      <VList v-if="bookmarkList.length">
        <VListItem
          v-for="row in bookmarkList"
          :key="row.id"
        >
          <template #prepend>
            <VAvatar
              color="warning"
              variant="tonal"
            >
              <VIcon icon="ri-bookmark-fill" />
            </VAvatar>
          </template>
          <VListItemTitle>{{ row.namaSurah }} &middot; Ayat {{ row.ayatNumber }}</VListItemTitle>
          <VListItemSubtitle>
            {{ row.catatan || 'Tanpa catatan' }} &middot; {{ formatDate(row.createdAt) }}
          </VListItemSubtitle>
          <template #append>
            <div class="d-flex gap-1">
              <VBtn
                icon
                size="small"
                variant="text"
                :to="{ name: 'quran-baca', params: { nomor: row.nomorSurah }, query: { ayat: row.ayatNumber } }"
              >
                <VIcon icon="ri-arrow-right-line" />
                <VTooltip activator="parent">
                  Buka
                </VTooltip>
              </VBtn>
              <VBtn
                icon
                size="small"
                variant="text"
                color="error"
                @click="onRemoveBookmark(row.id)"
              >
                <VIcon icon="ri-delete-bin-line" />
                <VTooltip activator="parent">
                  Hapus
                </VTooltip>
              </VBtn>
            </div>
          </template>
        </VListItem>
      </VList>
      <VCardText v-else>
        <VAlert
          type="info"
          variant="tonal"
        >
          Belum ada ayat yang ditandai.
        </VAlert>
      </VCardText>
    </VCard>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useQuranLocalStore } from '../../../composables/useQuranLocalStore'

const { listProgress, listBookmarks, removeBookmark } = useQuranLocalStore()

const activeTab = ref('riwayat')
const progressList = ref(listProgress())
const bookmarkList = ref(listBookmarks())

function onRemoveBookmark(id) {
  removeBookmark(id)
  bookmarkList.value = listBookmarks()
}

function formatDate(iso) {
  if (!iso) return '-'

  return new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}
</script>
