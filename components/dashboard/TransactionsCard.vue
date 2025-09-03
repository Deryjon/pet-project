<script setup lang="ts">
import { useDashboardStore } from "@/store/dashboard";

const store = useDashboardStore();
const transactions = store.periodData.transactions;

const transactionNames: Record<string, string> = {
  total: "Всего",
  products: "Товары",
  services: "Услуги",
  returns: "Возвраты",
  exchanges: "Обмены",
};
</script>

<template>
  <div class="p-7 bg-[#262626] rounded-lg shadow-style">
    <div class="top flex items-center justify-between">
      <div class="sales-total">
        <h3 class="font-bold text-[24px]">Транзакции</h3>
        <p class="font-bold text-[#4993dd] mb-2 text-[36px]">
          {{ transactions.total.toLocaleString() }} ШТ
        </p>
      </div>
      <div
        class="circle w-[60px] h-[60px] bg-[#404040] rounded-full flex items-center justify-center"
      >
        <div class="icon w-[30px] h-[30px] flex items-center justify-center">
          <!-- любой другой иконочный svg -->
          <svg
            class="w-full h-full text-[#4993dd]"
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

    <!-- список -->
    <div class="transactions-items flex flex-col gap-2 mt-[30px]">
      <div
        v-for="(value, key) in transactions"
        :key="key"
        class="flex items-center bg-[#404040] px-4 py-4 rounded-[15px] w-full justify-between"
      >
        <span class="text-left font-semibold text-[16px]">
          {{ transactionNames[key] }}
        </span>
        <span
          :class="[
            'text-left font-medium',
            key === 'returns' ? 'text-red-500' : 'text-[#4993dd]',
          ]"
        >
          {{ value.toLocaleString() }} шт
        </span>
      </div>
    </div>
  </div>
</template>
