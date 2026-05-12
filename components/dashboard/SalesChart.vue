<script setup lang="ts">
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
} from "chart.js";
import { Line } from "vue-chartjs";
import { computed, ref } from "vue";
import { useDashboardStore } from "@/store/dashboard";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
);

const store = useDashboardStore();
const granularityOpen = ref(false);

const granularityLabels: Record<string, string> = {
  hour: "по часам",
  day: "по дням",
  week: "по неделям",
  month: "по месяцам",
};

const selectedGranularityLabel = computed(
  () => granularityLabels[store.selectedGranularity] || store.selectedGranularity,
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: "#fff" },
    },
  },
  scales: {
    x: {
      ticks: { color: "#fff" },
      grid: { color: "rgba(255,255,255,0.1)" },
    },
    y: {
      ticks: { color: "#fff" },
      grid: { color: "rgba(255,255,255,0.1)" },
    },
  },
};
</script>

<template>
  <div class="flex flex-col rounded-lg bg-[#262626] shadow-style xl:flex-row">
    <div
      class="left-side w-full border-b border-white/10 p-4 sm:p-7 xl:border-b-0 xl:border-r xl:border-white/10"
    >
      <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 class="text-[22px] font-bold sm:text-[24px]">Продажи</h3>

        <UPopover
          v-model:open="granularityOpen"
          :content="{ align: 'end', side: 'bottom', sideOffset: 8 }"
          :ui="{ content: 'z-50 w-[300px] overflow-hidden rounded-[12px] border border-[#404040] bg-[#404040] p-0 shadow-lg' }"
        >
          <UButton
            color="neutral"
            variant="ghost"
            class="flex w-full items-center justify-between rounded-[12px] bg-[#404040] px-3 py-4 text-[14px] text-white outline-none hover:bg-[#505050] active:bg-[#505050] focus-visible:ring-0 data-[state=open]:bg-[#505050] sm:w-[300px]"
          >
            <div class="flex gap-2">
              <span>Детализация:</span>
              <span>{{ selectedGranularityLabel }}</span>
            </div>

            <Icon
              name="tabler:chevron-down"
              :class="['h-4 w-4 transition-transform', granularityOpen ? 'rotate-180' : '']"
            />
          </UButton>

          <template #content>
            <ul class="m-0 p-0">
              <li
                v-for="val in store.availableGranularities"
                :key="val"
                @click="store.setGranularity(val); granularityOpen = false"
                :class="[
                  'w-full cursor-pointer px-3 py-2 text-[14px] text-white transition-colors hover:bg-[#505050]',
                  store.selectedGranularity === val ? 'bg-[#505050]' : 'bg-[#404040] hover:bg-[#4A4A4A]',
                ]"
              >
                {{ granularityLabels[val] || val }}
              </li>
            </ul>
          </template>
        </UPopover>
      </div>

      <div class="h-[320px] sm:h-[500px]">
        <Line :data="store.chartData" :options="chartOptions" />
      </div>
    </div>

    <div
      class="right-side flex w-full flex-col justify-between p-4 font-semibold sm:p-7 xl:w-[385px]"
    >
      <h3 class="mb-2 text-[22px] font-bold sm:text-[24px]">Общий график</h3>

      <div class="location-items mt-6 flex max-h-[385px] flex-col gap-2 overflow-y-auto xl:h-[385px]">
        <button
          v-for="branch in store.branchesSales"
          :key="branch.id"
          class="flex w-full items-center gap-4 rounded-[15px] bg-[#404040] px-4 py-1"
        >
          <div
            class="circle h-[20px] w-[20px] rounded-full"
            :style="{ backgroundColor: branch.color }"
          />

          <div class="flex flex-col text-left">
            <span class="text-left text-[16px] font-semibold">
              {{ branch.name }}
            </span>
            <span class="text-left text-[#4993dd]">
              {{ branch.total.toLocaleString() }} {{ store.reportCurrency }}
            </span>
          </div>
        </button>

        <div
          v-if="store.branchesSales.length === 0"
          class="rounded-[15px] bg-[#404040] px-4 py-4 text-sm text-[#bdbdbd]"
        >
          Нет данных по филиалам
        </div>
      </div>

      <div class="border-dashed-t pt-4">
        <p class="text-[16px]">Общая сумма:</p>
        <p class="break-words text-[22px] sm:text-[24px]">
          {{ store.filteredTotalSales.toLocaleString() }} {{ store.reportCurrency }}
        </p>
      </div>
    </div>
  </div>
</template>

<style>
.shadow-style {
  border-radius: 20px;
  box-shadow: 0px 0px 20px rgba(255, 255, 255, 0.08);
}
</style>
