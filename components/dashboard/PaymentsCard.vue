<script setup lang="ts">
import { useDashboardStore } from "@/store/dashboard";

const store = useDashboardStore();
</script>

<template>
  <div class="rounded-lg bg-[#262626] p-7 shadow-style">
    <div class="top flex items-center justify-between">
      <div class="sales-total">
        <h3 class="text-[24px] font-bold">Платежи</h3>
        <p class="mb-2 text-[36px] font-bold text-[#4993dd]">
          {{ store.filteredTotalSales.toLocaleString() }} {{ store.reportCurrency }}
        </p>
      </div>
      <div
        class="circle flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#404040]"
      >
        <div class="icon flex h-[30px] w-[30px] items-center justify-center">
          <svg
            class="h-full w-full text-[#4993dd]"
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

    <div class="payments-items mt-[30px] flex flex-col gap-2">
      <div
        v-for="item in store.periodData.paymentItems"
        :key="item.id || item.name"
        class="flex w-full items-center justify-between rounded-[15px] bg-[#404040] px-4 py-4"
      >
        <div class="flex items-center gap-3">
          <div class="circle h-[20px] w-[20px] rounded-full">
            <div class="icon">
              <svg
                class="h-full w-full text-[#4993dd]"
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
          <span class="text-left text-[16px] font-semibold">
            {{ item.name }}
          </span>
        </div>
        <span class="text-left">
          {{ item.total.toLocaleString() }} {{ store.reportCurrency }}
        </span>
      </div>

      <div
        v-if="store.periodData.paymentItems.length === 0"
        class="rounded-[15px] bg-[#404040] px-4 py-4 text-sm text-[#bdbdbd]"
      >
        Нет данных по платежам
      </div>
    </div>
  </div>
</template>
