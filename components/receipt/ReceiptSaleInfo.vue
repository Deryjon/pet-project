<script setup lang="ts">
import type { ReceiptData, ReceiptSettingsData } from "@/composables/useReceipts";

const props = defineProps<{ receipt: ReceiptData; settings: ReceiptSettingsData }>();

const dateLabel = new Date(props.receipt.createdAt).toLocaleString("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
</script>

<template>
  <div class="rv-sale-info">
    <div class="rv-row">
      <span class="rv-muted">Чек #:</span>
      <span class="rv-bold">{{ receipt.number }}</span>
    </div>
    <div class="rv-row">
      <span class="rv-muted">Дата:</span>
      <span>{{ dateLabel }}</span>
    </div>
    <div v-if="settings.showManagerName && receipt.managerName" class="rv-row">
      <span class="rv-muted">Продавец:</span>
      <span>{{ receipt.managerName }}</span>
    </div>
    <div v-if="settings.showManagerPhone && receipt.managerPhone" class="rv-row">
      <span class="rv-muted">Телефон продавца:</span>
      <span>{{ receipt.managerPhone }}</span>
    </div>
  </div>
</template>

<style scoped>
.rv-sale-info { display: grid; gap: 2px; }
.rv-row { display: flex; justify-content: space-between; gap: 8px; }
.rv-muted { opacity: 0.75; }
.rv-bold { font-weight: 700; }
</style>
