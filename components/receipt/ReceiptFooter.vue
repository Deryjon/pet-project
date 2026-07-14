<script setup lang="ts">
import { computed } from "vue";
import type { ReceiptData, ReceiptSettingsData } from "@/composables/useReceipts";
import { renderQrSvg } from "@/utils/qrcode";
import { renderBarcodeSvg } from "@/utils/barcode";

const props = defineProps<{ receipt: ReceiptData; settings: ReceiptSettingsData }>();

const qrValue = computed(() => props.settings.qrCodeUrl || props.receipt.qrPayload || "");
const barcodeSvg = computed(() =>
  props.settings.hasBarCode ? renderBarcodeSvg(props.receipt.number, { height: 36 }) : "",
);
</script>

<template>
  <div class="rv-footer">
    <div v-if="barcodeSvg" class="rv-center rv-barcode" v-html="barcodeSvg" />
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
.rv-barcode :deep(svg) { max-width: 100%; height: 36px; margin: 0 auto; }
.rv-qr :deep(svg) { width: 90px; height: 90px; margin: 0 auto; }
</style>
