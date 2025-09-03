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
import { useDashboardStore } from "@/store/dashboard";

// ✅ Регистрируем все модули Chart.js
ChartJS.register(
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement
);

const store = useDashboardStore();

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false, // убираем фиксированное соотношение
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
  <div class="bg-[#262626] rounded-lg flex shadow-style">
    <!-- Левая часть -->
    <div class="left-side w-[800px] border-r p-7">
      <h3 class="font-bold mb-2 text-[24px]">Продажи</h3>
      <!-- ✅ фиксированная высота контейнера -->
      <div class="h-[500px]">
        <Line :data="store.chartData" :options="chartOptions" />
      </div>
    </div>

    <!-- Правая часть (фикс ширина) -->
    <div
      class="right-side font-semibold p-7 w-[385px] flex flex-col justify-between"
    >
      <h3 class="font-bold mb-2 text-[24px]">Филиалы</h3>

      <div class="location-items flex flex-col gap-2 mt-[30px] h-[385px]">
        <button
          v-for="branch in store.branchesSales"
          :key="branch.name"
          class="flex items-center bg-[#404040] px-4 py-1 rounded-[15px] w-full gap-4"
        >
          <div
            class="circle w-[20px] h-[20px] rounded-full"
            :style="{ backgroundColor: branch.color }"
          ></div>
          <div class="flex flex-col text-left">
            <span class="text-left font-semibold text-[16px]">
              {{ branch.name }}
            </span>
            <span class="text-left text-[#4993dd]">
              {{ branch.total.toLocaleString() }} сум
            </span>
          </div>
        </button>
      </div>

      <div>
        <p class="text-[16px]">Общая сумма:</p>
        <p class="text-[24px]">
          {{ store.filteredTotalSales.toLocaleString() }} UZS
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
