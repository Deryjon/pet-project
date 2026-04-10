<script setup lang="ts">
import UniversalDataTable from "@/components/UniversalDataTable.vue";
</script>

<template>
  <UniversalDataTable>
    <template #header>
      <slot name="header" />
    </template>

    <slot />

    <template #pagination>
      <slot name="pagination" />
    </template>

    <template #details>
      <slot name="details" />
    </template>
  </UniversalDataTable>
</template>
