<script setup lang="ts">
import type { ReceiptItemData } from "@/composables/useReceipts";

defineProps<{
  items: ReceiptItemData[];
  showIndex: boolean;
  showDiscounts: boolean;
  showSums: boolean;
  itemDividers: boolean;
}>();

function fmt(v: number) {
  return Math.round(v).toLocaleString("ru-RU");
}
</script>

<template>
  <div class="rv-items">
    <div
      v-for="(item, idx) in items"
      :key="idx"
      class="rv-item-row"
      :class="{ 'rv-item-divider': itemDividers && idx > 0 }"
    >
      <div class="rv-item-name">
        <span v-if="showIndex" class="rv-idx">{{ idx + 1 }}.</span>
        {{ item.name }}
      </div>
      <div v-if="showSums" class="rv-item-line">
        <span class="rv-muted">{{ item.quantity }} x {{ fmt(item.price) }}</span>
        <span class="rv-bold">{{ fmt(item.total) }}</span>
      </div>
      <div v-else class="rv-item-line">
        <span class="rv-muted">{{ item.quantity }} шт.</span>
      </div>
      <div v-if="showDiscounts && item.discount > 0" class="rv-item-discount">
        <span>Скидка{{ item.discountPercent > 0 ? ` ${item.discountPercent}%` : "" }}:</span>
        <span>-{{ fmt(item.discount) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rv-items { display: grid; }
.rv-item-row { padding: 3px 0; page-break-inside: avoid; }
.rv-item-divider { border-top: 1px dashed #ccc; }
.rv-item-name { font-weight: 600; }
.rv-idx { opacity: 0.6; margin-right: 2px; }
.rv-item-line { display: flex; justify-content: space-between; gap: 8px; }
.rv-item-discount { display: flex; justify-content: space-between; gap: 8px; opacity: 0.75; font-size: calc(var(--receipt-font-size) - 2px); }
.rv-muted { opacity: 0.75; }
.rv-bold { font-weight: 700; }
</style>
