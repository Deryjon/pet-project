<script setup lang="ts">
import { useDashboardStore } from "@/store/dashboard";
const store = useDashboardStore();
</script>

<template>
  <div class="p-4 bg-[#262626] rounded-lg shadow-lg">
    <h3 class="font-bold mb-2">Платежи ({{ store.periods.find(p=>p.value===store.selectedPeriod)?.label }})</h3>
    <p>Наличные: {{ store.periodData.payments.cash.toLocaleString() }} UZS</p>
    <p>PayME: {{ store.periodData.payments.payme.toLocaleString() }} UZS</p>
    <p>Карта: {{ store.periodData.payments.card.toLocaleString() }} UZS</p>
    <p>Перевод: {{ store.periodData.payments.cardTransfer.toLocaleString() }} UZS</p>
    <p>Click: {{ store.periodData.payments.click.toLocaleString() }} UZS</p>
  </div>
</template>
