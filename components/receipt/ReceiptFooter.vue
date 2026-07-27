<script setup lang="ts">
import { computed } from "vue";
import type { ReceiptData, ReceiptSettingsData } from "@/composables/useReceipts";
import { blocksOfType } from "@/composables/useReceipts";
import { renderQrSvg } from "@/utils/qrcode";
import { renderBarcodeSvg } from "@/utils/barcode";

const props = defineProps<{ receipt: ReceiptData; settings: ReceiptSettingsData }>();

const qrValue = computed(() => props.settings.qrCodeUrl || props.receipt.qrPayload || "");
const barcodeSvg = computed(() => renderBarcodeSvg(props.receipt.number, { height: 36 }));

const SOCIAL_LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  telegram: "Telegram",
  website: "Сайт",
};

function socialValue(key: string): string {
  switch (key) {
    case "facebook": return props.receipt.shop?.facebook ?? "";
    case "instagram": return props.receipt.shop?.instagram ?? "";
    case "telegram": return props.receipt.shop?.telegram ?? "";
    case "website": return props.receipt.shop?.website ?? "";
    default: return "";
  }
}

const lowerBlocks = computed(() => blocksOfType(props.settings, "lower_block").filter((b) => b.isActive));
</script>

<template>
  <div class="rv-footer">
    <template v-for="block in lowerBlocks" :key="block.key">
      <div v-if="block.key === 'barcode'" class="rv-center rv-barcode" v-html="barcodeSvg" />
      <div v-else-if="block.key === 'qr_code' && qrValue" class="rv-center rv-qr" v-html="renderQrSvg(qrValue, { pixelSize: 4 })" />
      <div v-else-if="['facebook', 'instagram', 'telegram', 'website'].includes(block.key) && socialValue(block.key)" class="rv-center rv-muted rv-small">
        {{ SOCIAL_LABELS[block.key] }}: {{ socialValue(block.key) }}
      </div>
      <div v-else-if="block.key === 'footer_message' && settings.footerMessage" class="rv-center rv-bold">{{ settings.footerMessage }}</div>
      <div v-else-if="block.key === 'footer_note' && settings.footerNote" class="rv-center rv-muted rv-small">{{ settings.footerNote }}</div>
      <div v-else-if="block.key === 'branding'" class="rv-center rv-muted rv-small">Чек создан в Konkurent</div>
    </template>
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
