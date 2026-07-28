<template>
  <div>
    <PageHeader
      title="Dashboard AP"
      subtitle="Ringkasan Account Payable"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Dashboard AP', disabled: true }
      ]"
    />

    <ApDashboardSection />
  </div>
</template>
