<script setup lang="ts">
defineProps<{ lines: Array<{ key: string; label: string; value: string }> }>();
</script>

<template>
  <div class="rv-info-lines">
    <div v-for="line in lines" :key="line.key" class="rv-row">
      <span class="rv-muted">{{ line.label }}:</span>
      <span>{{ line.value }}</span>
    </div>
  </div>
</template>

<style scoped>
.rv-info-lines { display: grid; gap: 2px; }
.rv-row { display: flex; justify-content: space-between; gap: 8px; }
.rv-muted { opacity: 0.75; }
</style>
