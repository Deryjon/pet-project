<script setup lang="ts">
import { useDashboardStore } from "@/store/dashboard";

const store = useDashboardStore();
const transactions = store.periodData.transactions;
</script>

<template>
  <div class="p-4  rounded-2xl shadow-lg">
    <h2 class="text-lg font-semibold mb-3">Транзакции</h2>
    <ul class="space-y-2 text-sm">
      <li class="flex justify-between">
        <span>Всего</span>
        <span class="font-medium">{{ transactions.total }}</span>
      </li>
      <li class="flex justify-between">
        <span>Товары</span>
        <span>{{ transactions.products }}</span>
      </li>
      <li class="flex justify-between">
        <span>Услуги</span>
        <span>{{ transactions.services }}</span>
      </li>
      <li class="flex justify-between">
        <span>Возвраты</span>
        <span class="text-red-600">{{ transactions.returns }}</span>
      </li>
      <li class="flex justify-between">
        <span>Обмены</span>
        <span>{{ transactions.exchanges }}</span>
      </li>
    </ul>
  </div>
</template>
