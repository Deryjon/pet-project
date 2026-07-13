<script setup lang="ts">
import type { ReceiptData } from "@/composables/useReceipts";

const props = defineProps<{ receipt: ReceiptData; showCashback: boolean }>();

function fmt(v: number) {
  return Math.round(v).toLocaleString("ru-RU");
}
</script>

<template>
  <div class="rv-totals">
    <div v-if="receipt.discount > 0" class="rv-row rv-muted">
      <span>Сумма без скидки:</span>
      <span>{{ fmt(receipt.subtotal) }}</span>
    </div>
    <div v-if="receipt.discount > 0" class="rv-row rv-muted">
      <span>Скидка:</span>
      <span>-{{ fmt(receipt.discount) }}</span>
    </div>
    <div class="rv-row rv-total">
      <span>ИТОГО:</span>
      <span>{{ fmt(receipt.totalDue) }}</span>
    </div>
    <div v-if="showCashback && receipt.cashbackEarned > 0" class="rv-row rv-muted">
      <span>Начислен кешбек:</span>
      <span>{{ fmt(receipt.cashbackEarned) }}</span>
    </div>
  </div>
</template>

<style scoped>
.rv-totals { display: grid; gap: 2px; }
.rv-row { display: flex; justify-content: space-between; gap: 8px; }
.rv-muted { opacity: 0.75; }
.rv-total { font-weight: 800; font-size: calc(var(--receipt-font-size) + 3px); }
</style>
