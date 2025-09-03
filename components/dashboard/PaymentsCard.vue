<script setup lang="ts">
import { useDashboardStore } from "@/store/dashboard";
const store = useDashboardStore();
const paymentNames: Record<string, string> = {
  cash: "Наличные",
  payme: "PayME",
  card: "Карта",
  cardTransfer: "Перевод",
  click: "Click",
};
</script>

<template>
  <div class="p-7 bg-[#262626] rounded-lg shadow-style">
    <div class="top flex items-center justify-between">
      <div class="sales-total">
        <h3 class="font-bold text-[24px]">Платежи</h3>
        <p class="font-bold text-[#4993dd] mb-2 text-[36px]">
          {{ store.filteredTotalSales.toLocaleString() }} UZS
        </p>  
      </div>
      <div
        class="circle w-[60px] h-[60px] bg-[#404040] rounded-full flex items-center justify-center"
      >
        <div class="icon w-[30px] h-[30px] flex items-center justify-center">
          <svg
            class="w-full h-full text-[#4993dd]"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 576 512"
            fill="currentColor"
          >
            <path
              d="M0 112.5L0 422.3c0 18 10.1 35 27 41.3c87 32.5 174 10.3 261-11.9c79.8-20.3 159.6-40.7 239.3-18.9c23 6.3 48.7-9.5 48.7-33.4l0-309.9c0-18-10.1-35-27-41.3C462 15.9 375 38.1 288 60.3C208.2 80.6 128.4 100.9 48.7 79.1C25.6 72.8 0 88.6 0 112.5zM288 352c-44.2 0-80-43-80-96s35.8-96 80-96s80 43 80 96s-35.8 96-80 96zM64 352c35.3 0 64 28.7 64 64l-64 0 0-64zm64-208c0 35.3-28.7 64-64 64l0-64 64 0zM512 304l0 64-64 0c0-35.3 28.7-64 64-64zM448 96l64 0 0 64c-35.3 0-64-28.7-64-64z"
            />
          </svg>
        </div>
      </div>
    </div>
    <div class="payments-items flex flex-col gap-2 mt-[30px]">
      <div
        v-for="(value, key) in store.periodData.payments"
        :key="key"
        class="flex items-center bg-[#404040] px-4 py-4 rounded-[15px] w-full justify-between"
      >
        <div class="flex items-center gap-3">
          <div class="circle w-[20px] h-[20px] rounded-full" :class="{}">
            <div class="icon">
              <svg
                class="w-full h-full text-[#4993dd]"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 576 512"
                fill="currentColor"
              >
                <path
                  d="M0 112.5L0 422.3c0 18 10.1 35 27 41.3c87 32.5 174 10.3 261-11.9c79.8-20.3 159.6-40.7 239.3-18.9c23 6.3 48.7-9.5 48.7-33.4l0-309.9c0-18-10.1-35-27-41.3C462 15.9 375 38.1 288 60.3C208.2 80.6 128.4 100.9 48.7 79.1C25.6 72.8 0 88.6 0 112.5zM288 352c-44.2 0-80-43-80-96s35.8-96 80-96s80 43 80 96s-35.8 96-80 96zM64 352c35.3 0 64 28.7 64 64l-64 0 0-64zm64-208c0 35.3-28.7 64-64 64l0-64 64 0zM512 304l0 64-64 0c0-35.3 28.7-64 64-64zM448 96l64 0 0 64c-35.3 0-64-28.7-64-64z"
                />
              </svg>
            </div>
          </div>
          <span class="text-left font-semibold text-[16px]">
            {{ paymentNames[key] }}
          </span>
        </div>
        <span class="text-left"> {{ value.toLocaleString() }} UZS </span>
      </div>
    </div>
  </div>
</template>
