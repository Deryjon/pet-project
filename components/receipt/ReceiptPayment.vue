<script setup lang="ts">
import type { ReceiptData } from "@/composables/useReceipts";

defineProps<{ receipt: ReceiptData }>();

function fmt(v: number) {
  return Math.round(v).toLocaleString("ru-RU");
}
</script>

<template>
  <div class="rv-payment">
    <div v-if="receipt.paidCash > 0" class="rv-row">
      <span class="rv-muted">Наличные:</span>
      <span>{{ fmt(receipt.paidCash) }}</span>
    </div>
    <div v-if="receipt.paidCard > 0" class="rv-row">
      <span class="rv-muted">Карта:</span>
      <span>{{ fmt(receipt.paidCard) }}</span>
    </div>
    <div v-if="receipt.paidCashback > 0" class="rv-row">
      <span class="rv-muted">Кешбек:</span>
      <span>{{ fmt(receipt.paidCashback) }}</span>
    </div>
    <div v-if="receipt.debt > 0" class="rv-row rv-bold">
      <span>В долг:</span>
      <span>{{ fmt(receipt.debt) }}</span>
    </div>
  </div>
</template>

<style scoped>
.rv-payment { display: grid; gap: 2px; }
.rv-row { display: flex; justify-content: space-between; gap: 8px; }
.rv-muted { opacity: 0.75; }
.rv-bold { font-weight: 700; }
</style>
