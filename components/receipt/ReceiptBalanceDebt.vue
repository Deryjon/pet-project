<script setup lang="ts">
import { computed } from "vue";
import type { ReceiptData } from "@/composables/useReceipts";

const props = defineProps<{
  receipt: ReceiptData;
  balanceKeys: string[];
  debtKeys: string[];
}>();

function fmt(v: number) {
  return Math.round(v).toLocaleString("ru-RU");
}

const LABELS: Record<string, string> = {
  balance_before: "Баланс до покупки",
  balance_added: "Начислено на баланс",
  balance_deducted: "Списано с баланса",
  balance_after: "Баланс после покупки",
  debt_before: "Долг до покупки",
  debt_added: "Добавлено к долгу",
  debt_paid: "Погашено долга",
  debt_after: "Долг после покупки",
};

function valueFor(key: string): number {
  switch (key) {
    case "balance_before": return props.receipt.balanceBefore;
    case "balance_added": return props.receipt.balanceAdded;
    case "balance_deducted": return props.receipt.balanceDeducted;
    case "balance_after": return props.receipt.balanceAfter;
    case "debt_before": return props.receipt.debtBefore;
    case "debt_added": return props.receipt.debtAdded;
    case "debt_paid": return props.receipt.debtPaid;
    case "debt_after": return props.receipt.debtAfter;
    default: return 0;
  }
}

const balanceRows = computed(() => props.balanceKeys.map((key) => ({ key, label: LABELS[key], value: valueFor(key) })));
const debtRows = computed(() => props.debtKeys.map((key) => ({ key, label: LABELS[key], value: valueFor(key) })));
</script>

<template>
  <div class="rv-balance-debt">
    <div v-if="balanceRows.length" class="rv-group">
      <div v-for="row in balanceRows" :key="row.key" class="rv-row">
        <span class="rv-muted">{{ row.label }}:</span>
        <span>{{ fmt(row.value) }}</span>
      </div>
    </div>
    <div v-if="debtRows.length" class="rv-group">
      <div v-for="row in debtRows" :key="row.key" class="rv-row">
        <span class="rv-muted">{{ row.label }}:</span>
        <span>{{ fmt(row.value) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rv-balance-debt { display: grid; gap: 6px; }
.rv-group { display: grid; gap: 2px; }
.rv-row { display: flex; justify-content: space-between; gap: 8px; }
.rv-muted { opacity: 0.75; }
</style>
