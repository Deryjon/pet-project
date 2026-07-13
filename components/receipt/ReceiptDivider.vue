<script setup lang="ts">
defineProps<{ style: "single" | "double" | "none" }>();
</script>

<template>
  <div v-if="style !== 'none'" class="rv-divider">
    <div class="rv-dash" />
    <div v-if="style === 'double'" class="rv-dash rv-dash-second" />
  </div>
</template>

<style scoped>
.rv-divider {
  margin: var(--section-gap) 0;
}
.rv-dash {
  border-top: 1px dashed #000;
}
.rv-dash-second {
  margin-top: var(--divider-gap);
}
</style>
