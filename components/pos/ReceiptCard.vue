<template>
  <div class="receipt-card">
    <!-- Header -->
    <div class="rc-header">
      <div class="rc-shop-name">{{ shopName || "Магазин" }}</div>
      <div v-if="addressLine" class="rc-muted rc-center">{{ addressLine }}</div>
      <div v-if="phoneLine" class="rc-muted rc-center">{{ phoneLine }}</div>
    </div>

    <div class="rc-divider" />

    <!-- Client -->
    <div v-if="clientLine" class="rc-client">Klient: {{ clientLine }}</div>

    <!-- Meta rows -->
    <div class="rc-row">
      <span class="rc-muted">Sotuv</span>
      <span class="rc-strong">№{{ receipt.saleNumber || receipt.saleId || "-" }}</span>
    </div>
    <div class="rc-row">
      <span class="rc-muted">Sana</span>
      <span class="rc-strong">{{ dateLabel }}</span>
    </div>
    <div v-if="receipt.sellerName" class="rc-row">
      <span class="rc-muted">Menejer</span>
      <span class="rc-strong">{{ sellerLine }}</span>
    </div>

    <div class="rc-divider" />

    <!-- Items -->
    <div class="rc-items-header">
      <span class="rc-idx">№</span>
      <span>Nomi</span>
      <span class="rc-center-col">Son</span>
      <span class="rc-right-col">Narxi</span>
    </div>
    <div v-for="(line, idx) in receipt.lines" :key="idx" class="rc-item-row">
      <span class="rc-idx">{{ idx + 1 }}</span>
      <span class="rc-item-name">{{ line.name }}</span>
      <span class="rc-center-col rc-muted">{{ line.quantity }}</span>
      <span class="rc-right-col rc-strong">{{ fmt(line.price) }}</span>
    </div>

    <div class="rc-divider" />

    <!-- Totals -->
    <div class="rc-row">
      <span class="rc-muted">Итого:</span>
      <span class="rc-strong">{{ fmt(receipt.subtotal) }}</span>
    </div>
    <div v-if="receipt.discount > 0" class="rc-row">
      <span class="rc-muted">Скидка:</span>
      <span class="rc-strong">-{{ fmt(receipt.discount) }}</span>
    </div>
    <div v-if="receipt.cashbackAmount > 0" class="rc-row">
      <span class="rc-muted">Начислено кешбек:</span>
      <span class="rc-strong">{{ fmt(receipt.cashbackAmount) }}</span>
    </div>
    <div class="rc-row rc-total">
      <span>К оплате:</span>
      <span>{{ fmt(receipt.total) }}</span>
    </div>

    <div class="rc-divider" />

    <!-- Payment -->
    <div class="rc-row">
      <span class="rc-muted">Оплачено{{ receipt.paymentMethodName ? ` (${receipt.paymentMethodName})` : "" }}:</span>
      <span class="rc-strong">{{ fmt(receipt.paidAmount) }}</span>
    </div>
    <div v-if="receipt.debtAmount > 0" class="rc-row">
      <span class="rc-muted">В долг:</span>
      <span class="rc-strong">{{ fmt(receipt.debtAmount) }}</span>
    </div>

    <template v-if="footerTitle || qrSvg">
      <div class="rc-divider" />

      <!-- Footer -->
      <div v-if="footerTitle" class="rc-footer-title">{{ footerTitle }}</div>
      <div v-if="footerSubtitle" class="rc-muted rc-center rc-footer-subtitle">{{ footerSubtitle }}</div>

      <div v-if="qrSvg" class="rc-qr-wrap">
        <div class="rc-qr" v-html="qrSvg" />
        <div class="rc-muted rc-qr-caption">QR для фискального контроля</div>
      </div>
    </template>

    <!-- Actions -->
    <div class="rc-actions">
      <button type="button" class="rc-action rc-action-primary" @click="$emit('print')">
        <Icon name="heroicons:printer" class="h-4 w-4" />
        Печать
      </button>
      <button type="button" class="rc-action" @click="$emit('send')">
        <Icon name="heroicons:paper-airplane" class="h-4 w-4" />
        Отправить
      </button>
      <button type="button" class="rc-action" @click="$emit('open')">
        <Icon name="heroicons:eye" class="h-4 w-4" />
        Открыть
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { SaleReceiptSnapshot } from "@/store/printSettings";
import type { Cheque } from "@/composables/useCheques";
import { formatUzPhoneDisplay } from "@/utils/phone";
import { renderQrSvg } from "@/utils/qrcode";

const props = defineProps<{
  receipt: SaleReceiptSnapshot;
  template: Cheque | null;
  shopName: string;
}>();

defineEmits<{ print: []; send: []; open: [] }>();

function fmt(value: number) {
  return Math.round(Number(value || 0)).toLocaleString("ru-RU");
}

const dateLabel = computed(() =>
  new Date(props.receipt.paidAt).toLocaleString("ru-RU", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  }),
);

const extra = computed(() => props.template?.extra_settings);

const addressLine = computed(() => {
  const parts = [extra.value?.branchName, extra.value?.address].filter(Boolean);
  return parts.join(", ");
});

const phoneLine = computed(() =>
  extra.value?.phone ? formatUzPhoneDisplay(extra.value.phone) : "",
);

const clientLine = computed(() => {
  if (!props.receipt.clientName) return "";
  const phone = props.receipt.clientPhone ? formatUzPhoneDisplay(props.receipt.clientPhone) : "";
  return [props.receipt.clientName, phone].filter(Boolean).join(", ");
});

const sellerLine = computed(() => String(props.receipt.sellerName || ""));

const footerLines = computed(() =>
  String(props.template?.display_text || "").split("\n").map((l) => l.trim()).filter(Boolean),
);
const footerTitle = computed(() => footerLines.value[0] || "");
const footerSubtitle = computed(() => footerLines.value.slice(1).join(" "));

const qrSvg = computed(() => {
  if (!extra.value?.hasQrCode || !extra.value?.qrCodeUrl) return "";
  return renderQrSvg(extra.value.qrCodeUrl, { pixelSize: 5, blackColor: "#f5f5f5" });
});
</script>

<style scoped>
.receipt-card {
  width: 100%;
  max-width: 340px;
  margin: 0 auto;
  padding: 24px 20px;
  border-radius: 24px;
  background: #1a1a1a;
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #fff;
  font-family: "Courier New", ui-monospace, monospace;
  font-size: 13px;
  line-height: 1.5;
}

.rc-shop-name { font-size: 19px; font-weight: 700; text-align: center; }
.rc-center { text-align: center; }
.rc-muted { color: #8a8a8a; }
.rc-strong { color: #fff; font-weight: 700; }

.rc-divider {
  border-top: 1px dashed rgba(255, 255, 255, 0.18);
  margin: 14px 0;
}

.rc-client { font-weight: 700; margin-bottom: 10px; }

.rc-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  padding: 2px 0;
}

.rc-total {
  font-size: 18px;
  font-weight: 800;
  margin-top: 4px;
}

.rc-items-header,
.rc-item-row {
  display: grid;
  grid-template-columns: 18px 1fr 32px 74px;
  column-gap: 8px;
  align-items: start;
}

.rc-items-header {
  color: #8a8a8a;
  font-size: 11px;
  padding-bottom: 6px;
}

.rc-item-row { padding: 6px 0; }
.rc-idx { color: #666; font-size: 11px; }
.rc-item-name { color: #fff; }
.rc-center-col { text-align: center; }
.rc-right-col { text-align: right; }

.rc-footer-title { font-weight: 700; text-align: center; }
.rc-footer-subtitle { margin-top: 4px; font-size: 12px; }

.rc-qr-wrap { margin-top: 14px; display: flex; flex-direction: column; align-items: center; gap: 6px; }
.rc-qr :deep(svg) { width: 120px; height: 120px; }
.rc-qr-caption { font-size: 11px; }

.rc-actions {
  display: flex;
  gap: 8px;
  margin-top: 20px;
}

.rc-action {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 14px;
  background: #2a2a2a;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  border: 0;
  cursor: pointer;
  transition: background 0.15s;
}

.rc-action:hover { background: #333; }

.rc-action-primary { background: #1f78ff; }
.rc-action-primary:hover { background: #3d8bff; }
</style>
