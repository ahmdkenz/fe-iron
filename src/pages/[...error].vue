<template>
  <div
    class="d-flex align-center justify-center"
    style="min-height: 100vh;"
  >
    <div class="text-center">
      <h1 class="text-h1 font-weight-bold mb-4">
        404
      </h1>
      <p class="text-h6 text-medium-emphasis mb-6">
        Halaman tidak ditemukan
      </p>
      <VBtn
        color="primary"
        :to="{ name: 'dashboard' }"
      >
        Kembali ke Dashboard
      </VBtn>
    </div>
  </div>
</template>
