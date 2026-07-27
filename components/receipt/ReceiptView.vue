<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import type { ReceiptData, ReceiptSettingsData } from "@/composables/useReceipts";
import { blocksOfType, isBlockActive } from "@/composables/useReceipts";
import { downloadReceiptPdf } from "@/composables/useReceiptPdf";
import ReceiptHeader from "./ReceiptHeader.vue";
import ReceiptSaleInfo from "./ReceiptSaleInfo.vue";
import ReceiptInfoLines from "./ReceiptInfoLines.vue";
import ReceiptItemsTable from "./ReceiptItemsTable.vue";
import ReceiptTotals from "./ReceiptTotals.vue";
import ReceiptPayment from "./ReceiptPayment.vue";
import ReceiptBalanceDebt from "./ReceiptBalanceDebt.vue";
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

const INFO_LINE_LABELS: Record<string, string> = {
  working_hours: "Часы работы",
  seller: "Продавец",
  cashier: "Кассир",
  cashier_phone: "Телефон кассира",
  client: "Клиент",
  client_phone: "Телефон клиента",
  sale_comment: "Комментарий",
  contacts: "Телефон магазина",
  address: "Адрес",
  legal_name: "Юр. лицо",
  tax_id: "ИНН",
};

function infoLineValue(key: string): string {
  const r = props.receipt;
  switch (key) {
    case "working_hours": return r.shop?.workingHours ?? "";
    case "seller": return r.sellerName;
    case "cashier": return r.managerName;
    case "cashier_phone": return r.managerPhone;
    case "client": return r.clientName;
    case "client_phone": return r.clientPhone;
    case "sale_comment": return r.saleComment;
    case "contacts": return r.shop?.phone ?? "";
    case "address": return r.shop?.address ?? "";
    case "legal_name": return r.company.legalName;
    case "tax_id": return r.company.taxId;
    default: return "";
  }
}

const showShopName = computed(() => isBlockActive(props.settings, "shop_name") && !!props.receipt.shop?.name);
const showDate = computed(() => isBlockActive(props.settings, "date"));

const infoLines = computed(() =>
  blocksOfType(props.settings, "information_block")
    .filter((b) => b.isActive && b.key in INFO_LINE_LABELS)
    .map((b) => ({ key: b.key, label: INFO_LINE_LABELS[b.key], value: infoLineValue(b.key) }))
    .filter((line) => line.value),
);

const showProducts = computed(() => isBlockActive(props.settings, "show_products"));
const showItemIndex = computed(() => isBlockActive(props.settings, "item_index"));
const showItemDiscounts = computed(() => isBlockActive(props.settings, "item_discounts"));
const showItemSums = computed(() => isBlockActive(props.settings, "item_sums"));
const showItemCount = computed(() => isBlockActive(props.settings, "item_count"));
const itemCount = computed(() => props.receipt.items.reduce((sum, item) => sum + item.quantity, 0));

const showReceiptDiscount = computed(() => isBlockActive(props.settings, "receipt_discount"));
const showReceiptSum = computed(() => isBlockActive(props.settings, "receipt_sum"));
const showCashback = computed(() => isBlockActive(props.settings, "cashback"));

const balanceKeys = computed(() =>
  blocksOfType(props.settings, "customer_balance").filter((b) => b.isActive).map((b) => b.key),
);
const debtKeys = computed(() =>
  blocksOfType(props.settings, "customer_debt").filter((b) => b.isActive).map((b) => b.key),
);
const hasBalanceDebtSection = computed(
  () => !!props.receipt.clientName && (balanceKeys.value.length > 0 || debtKeys.value.length > 0),
);

const hasFooterContent = computed(() => {
  if (!props.settings.hasLowerBlock) return false;
  return blocksOfType(props.settings, "lower_block").some((b) => {
    if (!b.isActive) return false;
    if (b.key === "footer_message") return !!props.settings.footerMessage;
    if (b.key === "footer_note") return !!props.settings.footerNote;
    if (b.key === "facebook") return !!props.receipt.shop?.facebook;
    if (b.key === "instagram") return !!props.receipt.shop?.instagram;
    if (b.key === "telegram") return !!props.receipt.shop?.telegram;
    if (b.key === "website") return !!props.receipt.shop?.website;
    return true; // barcode, qr_code — always renderable when active
  });
});

const styleVars = computed(() => ({
  "--receipt-width": `${props.settings.paperWidth}mm`,
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
    <template v-if="settings.hasInformationBlock">
      <ReceiptHeader :settings="settings" :show-shop-name="showShopName" :shop-name="receipt.shop?.name ?? ''" />
      <ReceiptDivider :style="settings.dividerStyle" />

      <ReceiptSaleInfo :receipt="receipt" :show-date="showDate" />
      <ReceiptInfoLines v-if="infoLines.length" :lines="infoLines" />

      <template v-if="showProducts">
        <ReceiptDivider :style="settings.dividerStyle" />
        <ReceiptItemsTable
          :items="receipt.items"
          :show-index="showItemIndex"
          :show-discounts="showItemDiscounts"
          :show-sums="showItemSums"
          :item-dividers="settings.itemDividers"
        />
        <div v-if="showItemCount" class="rv-item-count">Товаров: {{ itemCount }}</div>
      </template>
      <ReceiptDivider :style="settings.dividerStyle" />

      <ReceiptTotals
        :receipt="receipt"
        :show-discount="showReceiptDiscount"
        :show-sum="showReceiptSum"
        :show-cashback="showCashback"
      />
      <ReceiptPayment :receipt="receipt" />

      <ReceiptBalanceDebt
        v-if="hasBalanceDebtSection"
        :receipt="receipt"
        :balance-keys="balanceKeys"
        :debt-keys="debtKeys"
      />
    </template>

    <ReceiptDivider v-if="hasFooterContent" :style="settings.dividerStyle" />
    <ReceiptFooter v-if="settings.hasLowerBlock" :receipt="receipt" :settings="settings" />

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
  box-sizing: border-box;
  font-size: var(--receipt-font-size);
  font-family: "Courier New", ui-monospace, monospace;
  color: #000;
  background: #fff;
  padding: 2mm 3mm;
  margin: 0 auto;
  word-wrap: break-word;
  overflow-wrap: break-word;
}
.rv-item-count { opacity: 0.75; padding: 2px 0; }
</style>
