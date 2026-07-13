<script setup lang="ts">
import { computed } from "vue";
import type { ReceiptData, ReceiptSettingsData } from "@/composables/useReceipts";
import { renderQrSvg } from "@/utils/qrcode";

const props = defineProps<{ receipt: ReceiptData; settings: ReceiptSettingsData }>();

const qrValue = computed(() => props.settings.qrCodeUrl || props.receipt.qrPayload || "");
</script>

<template>
  <div class="rv-footer">
    <div v-if="settings.hasBarCode" class="rv-center rv-barcode">
      <div class="rv-barcode-bars">{{ receipt.number }}</div>
      <div class="rv-muted rv-small">Штрих-код</div>
    </div>
    <div v-if="settings.showQrCode && qrValue" class="rv-center rv-qr" v-html="renderQrSvg(qrValue, { pixelSize: 4 })" />
    <div v-if="settings.footerMessage" class="rv-center rv-bold">{{ settings.footerMessage }}</div>
    <div v-if="settings.footerNote" class="rv-center rv-muted rv-small">{{ settings.footerNote }}</div>
  </div>
</template>

<style scoped>
.rv-footer { display: grid; gap: 6px; }
.rv-center { text-align: center; }
.rv-bold { font-weight: 700; }
.rv-muted { opacity: 0.75; }
.rv-small { font-size: calc(var(--receipt-font-size) - 2px); }
.rv-barcode-bars {
  font-family: monospace;
  letter-spacing: 3px;
  font-weight: 700;
  font-size: calc(var(--receipt-font-size) + 3px);
}
.rv-qr :deep(svg) { width: 90px; height: 90px; margin: 0 auto; }
</style>
