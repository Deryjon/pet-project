<script setup lang="ts">
import { useDashboardStore } from "@/store/dashboard";

const store = useDashboardStore();
const transactionNames: Record<string, string> = {
  total: "Всего",
  products: "Товары",
  services: "Услуги",
  sets: "Наборы",
  returns: "Возвраты",
  exchanges: "Обмены",
};
</script>

<template>
  <div class="rounded-lg bg-[#262626] p-7 shadow-style">
    <div class="top flex items-center justify-between">
      <div class="sales-total">
        <h3 class="text-[24px] font-bold">Транзакции</h3>
        <p class="mb-2 text-[36px] font-bold text-[#4993dd]">
          {{ store.periodData.transactions.total.toLocaleString() }} ШТ
        </p>
      </div>
      <div
        class="circle flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#404040]"
      >
        <div class="icon flex h-[30px] w-[30px] items-center justify-center">
          <svg
            class="h-full w-full text-[#4993dd]"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M3 6h18M3 12h18M3 18h18"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </div>
      </div>
    </div>

    <div class="transactions-items mt-[30px] flex flex-col gap-2">
      <div
        v-for="(value, key) in store.periodData.transactions"
        :key="key"
        class="flex w-full items-center justify-between rounded-[15px] bg-[#404040] px-4 py-4"
      >
        <span class="text-left text-[16px] font-semibold">
          {{ transactionNames[key] ?? key }}
        </span>
        <span
          :class="[
            'text-left font-medium',
            key === 'returns' ? 'text-red-500' : 'text-[#4993dd]',
          ]"
        >
          {{ Number(value ?? 0).toLocaleString() }} шт
        </span>
      </div>
    </div>
  </div>
</template>
