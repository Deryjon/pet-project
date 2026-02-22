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

// вњ… Р РµРіРёСЃС‚СЂРёСЂСѓРµРј РІСЃРµ РјРѕРґСѓР»Рё Chart.js
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
const selectedGranularity = ref<"hour" | "halfHour">("hour");
const granularityOpen = ref(false);
const granularityOptions: Array<{ label: string; value: "hour" | "halfHour" }> = [
  { label: "по часам", value: "hour" },
  { label: "по 30 минут", value: "halfHour" },
];
const selectedGranularityLabel = computed(
  () =>
    granularityOptions.find((item) => item.value === selectedGranularity.value)?.label ??
    "по часам"
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false, // СѓР±РёСЂР°РµРј С„РёРєСЃРёСЂРѕРІР°РЅРЅРѕРµ СЃРѕРѕС‚РЅРѕС€РµРЅРёРµ
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
    <!-- Р›РµРІР°СЏ С‡Р°СЃС‚СЊ -->
    <div class="left-side w-[800px] border-r p-7">
      <div class="mb-2 flex items-center justify-between gap-4">
        <h3 class="font-bold text-[24px]">Продажи</h3>
        <UPopover
          v-model:open="granularityOpen"
          :content="{ align: 'end', side: 'bottom', sideOffset: 8 }"
          :ui="{ content: 'z-50 w-[300px] p-0 rounded-[12px] bg-[#404040] border border-[#404040] shadow-lg overflow-hidden' }"
        >
          <UButton
            color="neutral"
            variant="ghost"
            class="w-[300px] bg-[#404040] text-white rounded-[12px] px-3 py-4 text-[14px] outline-none flex items-center justify-between cursor-pointer hover:bg-[#505050] active:bg-[#505050] focus-visible:ring-0 data-[state=open]:bg-[#505050]"
          >
          <div class="flex gap-2">
            
            <span>Детализация:</span>
            <span>{{ selectedGranularityLabel }}</span>
          </div>
            <Icon
              name="tabler:chevron-down"
              :class="['w-4 h-4 transition-transform', granularityOpen ? 'rotate-180' : '']"
            />
          </UButton>

          <template #content>
            <ul class="m-0 p-0">
              <li
                v-for="item in granularityOptions"
                :key="item.value"
                @click="selectedGranularity = item.value; granularityOpen = false"
                :class="[
                  'w-full px-3 py-2 cursor-pointer text-[14px] text-white',
                  selectedGranularity === item.value ? 'bg-[#404040]' : 'bg-[#202020]'
                ]"
              >
                {{ item.label }}
              </li>
            </ul>
          </template>
        </UPopover>
      </div>

      <!-- вњ… С„РёРєСЃРёСЂРѕРІР°РЅРЅР°СЏ РІС‹СЃРѕС‚Р° РєРѕРЅС‚РµР№РЅРµСЂР° -->
      <div class="h-[500px]">
        <Line :data="store.chartData" :options="chartOptions" />
      </div>
    </div>

    <!-- РџСЂР°РІР°СЏ С‡Р°СЃС‚СЊ (С„РёРєСЃ С€РёСЂРёРЅР°) -->
    <div
      class="right-side font-semibold p-7 w-[385px] flex flex-col justify-between"
    >
      <h3 class="font-bold mb-2 text-[24px]">РћР±С‰РёР№ РіСЂР°С„РёРє</h3>

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
              {{ branch.total.toLocaleString() }} СЃСѓРј
            </span>
          </div>
        </button>
      </div>

      <div>
        <p class="text-[16px]">РћР±С‰Р°СЏ СЃСѓРјРјР°:</p>
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


