<script setup lang="ts">
import type { ReceiptData } from "@/composables/useReceipts";

defineProps<{ receipt: ReceiptData }>();
</script>

<template>
  <div v-if="receipt.clientName || receipt.clientPhone" class="rv-client-info">
    <div v-if="receipt.clientName" class="rv-row">
      <span class="rv-muted">Клиент:</span>
      <span>{{ receipt.clientName }}</span>
    </div>
    <div v-if="receipt.clientPhone" class="rv-row">
      <span class="rv-muted">Телефон:</span>
      <span>{{ receipt.clientPhone }}</span>
    </div>
  </div>
</template>

<style scoped>
.rv-client-info { display: grid; gap: 2px; }
.rv-row { display: flex; justify-content: space-between; gap: 8px; }
.rv-muted { opacity: 0.75; }
</style>
