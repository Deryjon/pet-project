<script setup lang="ts">
import type { ReceiptData } from "@/composables/useReceipts";

const props = defineProps<{ receipt: ReceiptData }>();
const emit = defineEmits<{ print: []; send: [] }>();

function onPrint() {
  emit("print");
  if (import.meta.client) window.print();
}

function onDownload() {
  if (!import.meta.client) return;
  const lines = [
    `Чек #${props.receipt.number}`,
    ...props.receipt.items.map((i) => `${i.name} — ${i.quantity} x ${i.price} = ${i.total}`),
    `ИТОГО: ${props.receipt.totalDue}`,
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `receipt-${props.receipt.number}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
</script>

<template>
  <div class="rv-actions no-print">
    <button type="button" class="rv-btn rv-btn-primary" @click="onPrint">Печать</button>
    <button type="button" class="rv-btn" @click="emit('send')">Отправить</button>
    <button type="button" class="rv-btn" @click="onDownload">Скачать</button>
  </div>
</template>

<style scoped>
.rv-actions { display: flex; gap: 8px; margin-top: 12px; }
.rv-btn {
  flex: 1;
  min-height: 40px;
  border-radius: 12px;
  background: #2a2a2a;
  color: #fff;
  font-weight: 600;
  font-size: 13px;
}
.rv-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.rv-btn-primary { background: #1f78ff; }
</style>
