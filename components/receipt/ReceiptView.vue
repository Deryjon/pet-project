<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import type { ReceiptData, ReceiptSettingsData } from "@/composables/useReceipts";
import { downloadReceiptPdf } from "@/composables/useReceiptPdf";
import ReceiptHeader from "./ReceiptHeader.vue";
import ReceiptSaleInfo from "./ReceiptSaleInfo.vue";
import ReceiptClientInfo from "./ReceiptClientInfo.vue";
import ReceiptItemsTable from "./ReceiptItemsTable.vue";
import ReceiptTotals from "./ReceiptTotals.vue";
import ReceiptPayment from "./ReceiptPayment.vue";
import ReceiptFooter from "./ReceiptFooter.vue";
import ReceiptDivider from "./ReceiptDivider.vue";
import ReceiptActions from "./ReceiptActions.vue";

const props = defineProps<{
  receipt: ReceiptData;
  settings: ReceiptSettingsData;
  mode?: "screen" | "print";
}>();

const emit = defineEmits<{ print: []; send: [] }>();

const toast = useToast();
const rootRef = ref<HTMLElement | null>(null);
const downloading = ref(false);

async function onDownload() {
  if (!rootRef.value || downloading.value) return;
  downloading.value = true;
  try {
    await downloadReceiptPdf(rootRef.value, props.receipt.number);
  } catch {
    toast.add({ title: "Не удалось скачать чек", color: "error" });
  } finally {
    downloading.value = false;
  }
}

const hasFooterContent = computed(
  () =>
    props.settings.hasBarCode ||
    (props.settings.showQrCode && (props.settings.qrCodeUrl || props.receipt.qrPayload)) ||
    Boolean(props.settings.footerMessage) ||
    Boolean(props.settings.footerNote),
);

const styleVars = computed(() => ({
  "--receipt-width": `${props.settings.paperWidth - 10}mm`,
  "--receipt-font-size": `${props.settings.fontSize}px`,
  "--section-gap": `${props.settings.sectionGap}px`,
  "--divider-gap": `${props.settings.dividerGap}px`,
}));

// @page does not support CSS custom properties (var()) in any current
// browser, so the exact print page size is injected as a plain <style> tag
// with the literal mm value whenever the configured paper width changes.
const PAGE_SIZE_STYLE_ID = "receipt-page-size";

watch(
  () => props.settings.paperWidth,
  (paperWidth) => {
    if (!import.meta.client) return;
    let tag = document.getElementById(PAGE_SIZE_STYLE_ID) as HTMLStyleElement | null;
    if (!tag) {
      tag = document.createElement("style");
      tag.id = PAGE_SIZE_STYLE_ID;
      document.head.appendChild(tag);
    }
    tag.textContent = `@media print { @page { size: ${paperWidth}mm auto; margin: 0; } }`;
  },
  { immediate: true },
);

onUnmounted(() => {
  if (!import.meta.client) return;
  document.getElementById(PAGE_SIZE_STYLE_ID)?.remove();
});
</script>

<template>
  <div ref="rootRef" class="receipt-print-root rv-root" :style="styleVars">
    <ReceiptHeader :settings="settings" />
    <ReceiptDivider :style="settings.dividerStyle" />

    <ReceiptSaleInfo :receipt="receipt" :settings="settings" />
    <ReceiptClientInfo v-if="settings.showClientInfo" :receipt="receipt" />

    <ReceiptDivider :style="settings.dividerStyle" />
    <ReceiptItemsTable
      :items="receipt.items"
      :show-index="settings.showItemIndex"
      :item-dividers="settings.itemDividers"
    />
    <ReceiptDivider :style="settings.dividerStyle" />

    <ReceiptTotals :receipt="receipt" :show-cashback="settings.showCashback" />
    <ReceiptPayment :receipt="receipt" :show-debt="settings.showDebtLine" />

    <ReceiptDivider v-if="hasFooterContent" :style="settings.dividerStyle" />
    <ReceiptFooter :receipt="receipt" :settings="settings" />

    <ReceiptActions
      v-if="mode !== 'print'"
      :downloading="downloading"
      @print="emit('print')"
      @send="emit('send')"
      @download="onDownload"
    />
  </div>
</template>

<style scoped>
.rv-root {
  width: var(--receipt-width);
  max-width: var(--receipt-width);
  font-size: var(--receipt-font-size);
  font-family: "Courier New", ui-monospace, monospace;
  color: #000;
  background: #fff;
  padding: 8px 6px;
  margin: 0 auto;
  word-wrap: break-word;
  overflow-wrap: break-word;
}
</style>
