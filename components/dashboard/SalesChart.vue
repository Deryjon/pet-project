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
ChartJS.register(Title, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement);

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
  <div class="p-4 bg-[#262626] rounded-lg">
    <h3 class="font-bold mb-2">Продажи</h3>
    <!-- ✅ фиксированная высота контейнера -->
    <div class="h-[300px]">
      <Line :data="store.chartData" :options="chartOptions" />
    </div>
    <p class="mt-2 font-semibold">
      Общая сумма: {{ store.filteredTotalSales.toLocaleString() }} UZS
    </p>
  </div>
</template>
