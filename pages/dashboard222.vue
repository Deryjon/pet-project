<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "vue-chartjs";
import { ref, computed } from "vue";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const shops = ref([
  { id: 1, name: "Samarqand Darvoza" },
  { id: 2, name: "Globus Mall" },
  { id: 3, name: "Mega Planet" },
]);

const selectedShopIndex = ref<number | null>(null); // null = все магазины
const open = ref(false);

const selectedShopName = computed(() => {
  if (selectedShopIndex.value === null) return "Все магазины";
  return shops.value[selectedShopIndex.value]?.name;
});

function selectShop(id: number | null) {
  if (id === null) {
    selectedShopIndex.value = null;
  } else {
    selectedShopIndex.value = shops.value.findIndex((s) => s.id === id);
  }
  open.value = false;
}

function toggle() {
  open.value = !open.value;
}

// ---------------- ПЕРИОДЫ ----------------
const periods = [
  { label: "Вчера", value: "yesterday" },
  { label: "Сегодня", value: "today" },
  { label: "Неделя", value: "week" },
  { label: "Месяц", value: "month" },
  { label: "Год", value: "year" },
];
const selectedPeriod = ref<"yesterday" | "today" | "week" | "month" | "year">(
  "today"
);

// ---------------- ДАННЫЕ ПО ПЕРИОДАМ ----------------
const dashboardData = ref({
  today: {
    hourlySales: [
      { hour: "09:00", branch1: 120000, branch2: 100000 },
      { hour: "10:00", branch1: 220000, branch2: 150000 },
      { hour: "11:00", branch1: 310000, branch2: 180000 },
      { hour: "12:00", branch1: 280000, branch2: 240000 },
      { hour: "13:00", branch1: 350000, branch2: 300000 },
      { hour: "14:00", branch1: 260000, branch2: 280000 },
      { hour: "15:00", branch1: 330000, branch2: 250000 },
    ],
    payments: {
      cash: 1_650_000,
      payme: 620_000,
      card: 510_000,
      cardTransfer: 240_000,
      click: 90_000,
    },
    transactions: {
      total: 48,
      products: 92,
      services: 3,
      returns: 1,
      exchanges: 0,
    },
    topSellers: [
      { name: "Komiljon Alidjanov", sum: 1_810_000 },
      { name: "Sunnatilla Miryusupov", sum: 730_000 },
      { name: "Dilshod Karimov", sum: 520_000 },
    ],
    topProducts: [
      { name: "Silicone iPhone Case", sum: 355000 },
      { name: "Steklo Obychny", sum: 310000 },
      { name: "Green Lion", sum: 280000 },
      { name: "AirPods 3 Dubai", sum: 240000 },
      { name: "S-Series Steklo", sum: 189000 },
    ],
  },
  yesterday: {
    hourlySales: [
      { hour: "09:00", branch1: 90000, branch2: 70000 },
      { hour: "10:00", branch1: 180000, branch2: 120000 },
      { hour: "11:00", branch1: 210000, branch2: 170000 },
      { hour: "12:00", branch1: 190000, branch2: 160000 },
      { hour: "13:00", branch1: 240000, branch2: 220000 },
      { hour: "14:00", branch1: 200000, branch2: 180000 },
      { hour: "15:00", branch1: 260000, branch2: 230000 },
    ],
    payments: {
      cash: 980_000,
      payme: 420_000,
      card: 310_000,
      cardTransfer: 190_000,
      click: 70_000,
    },
    transactions: {
      total: 38,
      products: 71,
      services: 4,
      returns: 2,
      exchanges: 1,
    },
    topSellers: [
      { name: "Komiljon Alidjanov", sum: 1_210_000 },
      { name: "Sunnatilla Miryusupov", sum: 690_000 },
      { name: "Dilshod Karimov", sum: 410_000 },
    ],
    topProducts: [
      { name: "PowerBank 20k", sum: 355000 },
      { name: "Steklo Obychny", sum: 280000 },
      { name: "Green Lion", sum: 240000 },
    ],
  },
  week: {
    hourlySales: [
      { hour: "Пн", branch1: 820000, branch2: 640000 },
      { hour: "Вт", branch1: 1120000, branch2: 980000 },
      { hour: "Ср", branch1: 980000, branch2: 720000 },
      { hour: "Чт", branch1: 1260000, branch2: 1010000 },
      { hour: "Пт", branch1: 1780000, branch2: 1320000 },
      { hour: "Сб", branch1: 2050000, branch2: 1540000 },
      { hour: "Вс", branch1: 1340000, branch2: 1110000 },
    ],
    payments: {
      cash: 8_650_000,
      payme: 3_420_000,
      card: 2_910_000,
      cardTransfer: 1_540_000,
      click: 720_000,
    },
    transactions: {
      total: 348,
      products: 690,
      services: 34,
      returns: 14,
      exchanges: 5,
    },
    topSellers: [
      { name: "Komiljon Alidjanov", sum: 8_810_000 },
      { name: "Sunnatilla Miryusupov", sum: 6_730_000 },
      { name: "Dilshod Karimov", sum: 5_520_000 },
    ],
    topProducts: [
      { name: "AirPods 3 Dubai", sum: 2_400_000 },
      { name: "Silicone iPhone Case", sum: 1_950_000 },
      { name: "Зарядка 20W", sum: 1_890_000 },
    ],
  },
  year: {
    hourlySales: [
      { hour: "Янв", branch1: 12_200_000, branch2: 9_200_000 },
      { hour: "Фев", branch1: 15_100_000, branch2: 12_100_000 },
      { hour: "Мар", branch1: 17_400_000, branch2: 14_800_000 },
      { hour: "Апр", branch1: 14_800_000, branch2: 12_300_000 },
      { hour: "Май", branch1: 20_200_000, branch2: 16_700_000 },
      { hour: "Июн", branch1: 22_500_000, branch2: 18_200_000 },
      { hour: "Июл", branch1: 25_300_000, branch2: 20_100_000 },
      { hour: "Авг", branch1: 21_600_000, branch2: 17_900_000 },
      { hour: "Сен", branch1: 18_900_000, branch2: 15_200_000 },
      { hour: "Окт", branch1: 23_200_000, branch2: 19_400_000 },
      { hour: "Ноя", branch1: 19_800_000, branch2: 16_100_000 },
      { hour: "Дек", branch1: 27_500_000, branch2: 22_600_000 },
    ],
    payments: {
      cash: 330_000_000,
      payme: 162_000_000,
      card: 138_000_000,
      cardTransfer: 72_000_000,
      click: 24_000_000,
    },
    transactions: { 
      total: 13_480,
      products: 26_940,
      services: 820,
      returns: 260,
      exchanges: 120,
    },
    topSellers: [
      { name: "Komiljon Alidjanov", sum: 226_000_000 },
      { name: "Sunnatilla Miryusupov", sum: 189_000_000 },
      { name: "Dilshod Karimov", sum: 142_000_000 },
    ],
    topProducts: [
      { name: "Silicone iPhone Case", sum: 62_000_000 },
      { name: "Steklo Obychny", sum: 58_000_000 },
      { name: "PowerBank 20k", sum: 47_000_000 },
      { name: "AirPods 3 Dubai", sum: 40_000_000 },
      { name: "Зарядка 20W", sum: 35_000_000 },
    ],
  },
});

// ---------------- ВЫБРАННЫЕ ДАННЫЕ ----------------
const periodData = computed(() => dashboardData.value[selectedPeriod.value]);

// данные для графика
const chartData = computed(() => {
  const labels = periodData.value.hourlySales.map((i) => i.hour);

  if (selectedShopIndex.value === null) {
    // все магазины
    return {
      labels,
      datasets: [
        {
          label: "Samarqand Darvoza",
          data: periodData.value.hourlySales.map((i) => i.branch1),
          borderColor: "#4ade80",
          backgroundColor: "rgba(74, 222, 128, 0.2)",
          fill: true,
          tension: 0.35,
          pointRadius: 3,
        },
        {
          label: "Globus Mall",
          data: periodData.value.hourlySales.map((i) => i.branch2),
          borderColor: "#60a5fa",
          backgroundColor: "rgba(96, 165, 250, 0.2)",
          fill: true,
          tension: 0.35,
          pointRadius: 3,
        },
      ],
    };
  }

  // один магазин
  const shop = shops.value[selectedShopIndex.value];
  const branchKey = selectedShopIndex.value === 0 ? "branch1" : "branch2";

  return {
    labels,
    datasets: [
      {
        label: shop.name,
        data: periodData.value.hourlySales.map((i) => i[branchKey]),
        borderColor: selectedShopIndex.value === 0 ? "#4ade80" : "#60a5fa",
        backgroundColor:
          selectedShopIndex.value === 0
            ? "rgba(74, 222, 128, 0.2)"
            : "rgba(96, 165, 250, 0.2)",
        fill: true,
        tension: 0.35,
        pointRadius: 3,
      },
    ],
  };
});

// общая сумма
const filteredTotalSales = computed(() => {
  if (selectedShopIndex.value === null) {
    return periodData.value.hourlySales.reduce(
      (sum, i) => sum + (i.branch1 || 0) + (i.branch2 || 0),
      0
    );
  }

  const branchKey = selectedShopIndex.value === 0 ? "branch1" : "branch2";
  return periodData.value.hourlySales.reduce(
    (sum, i) => sum + (i[branchKey] || 0),
    0
  );
});

// опции графика
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true, labels: { color: "#fff" } },
    tooltip: { intersect: false, mode: "index" as const },
  },
  scales: {
    y: { beginAtZero: true, ticks: { color: "#fff" } },
    x: { ticks: { color: "#fff" } },
  },
};
</script>

<template>
  <section class="dashboard space-y-6">
    <div class="w-full max-w-sm relative">
      <div
        @click="toggle"
        class="cursor-pointer relative font-semibold text-[36px] text-white flex gap-4 items-center transition-all duration-300 hover:shadow-md"
      >
        <span>{{ selectedShopName }}</span>
        <svg
          :class="{ 'rotate-180': open }"
          class="w-6 h-6 transition-transform duration-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
      <!-- Dropdown -->
      <transition name="fade">
        <ul
          v-if="open"
          class="absolute z-10 mt-1 w-full bg-[#202020] border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          <li
            @click="selectShop(null)"
            class="px-4 py-2 hover:bg-[#404040] cursor-pointer transition-colors duration-200"
          >
            Все магазины
          </li>
          <li
            v-for="shop in shops"
            :key="shop.id"
            @click="selectShop(shop.id)"
            class="px-4 py-2 hover:bg-[#404040] cursor-pointer transition-colors duration-200"
          >
            {{ shop.name }}
          </li>
        </ul>
      </transition>
    </div>
    <!-- Переключатель периодов -->
    <div
      class="time-sales bg-[#404040] inline-flex gap-2 mb-4 p-1 rounded-[15px]"
    >
      <button
        v-for="period in periods"
        :key="period.value"
        @click="selectedPeriod = period.value"
        :class="[
          'w-[120px] px-[16px] py-[10px] text-center rounded-[15px] font-semibold transition-colors',
          selectedPeriod === period.value
            ? 'bg-[#202020] text-white'
            : 'bg-[#404040] hover:bg-[#505050]',
        ]"
      >
        {{ period.label }}
      </button>
    </div>

    <!-- График + итоги -->
    <div class="charts card rounded-[15px] md:grid-cols-2 gap-4 w-full p-4">
      <div class="rounded w-full h-[260px]">
        <h3 class="font-bold mb-2">Продажи</h3>
        <Line :data="chartData" :options="chartOptions" :key="selectedPeriod" />
      </div>

      <div class="p-4 rounded">
        <h3 class="font-bold mb-2">Общая сумма:</h3>
        <p class="text-xl font-semibold">
          {{ filteredTotalSales.toLocaleString() }} UZS
        </p>
      </div>
    </div>

    <!-- Платежи (зависят от периода) -->
    <section class="payments md:grid-cols-2 gap-4">
      <div class="card p-4 rounded">
        <h3 class="font-bold mb-2">
          Платежи ({{
            periods.find((p) => p.value === selectedPeriod)?.label
          }}):
        </h3>
        <p>Наличные: {{ periodData.payments.cash.toLocaleString() }} UZS</p>
        <p>PayME QR: {{ periodData.payments.payme.toLocaleString() }} UZS</p>
        <p>Карта: {{ periodData.payments.card.toLocaleString() }} UZS</p>
        <p>
          Перевод на карту:
          {{ periodData.payments.cardTransfer.toLocaleString() }} UZS
        </p>
        <p>Click QR: {{ periodData.payments.click.toLocaleString() }} UZS</p>
      </div>
    </section>

    <!-- Транзакции (зависят от периода) -->
    <section class="transactions grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="card p-4 rounded">
        <h3 class="font-bold mb-2">Транзакции:</h3>
        <p>Всего: {{ periodData.transactions.total }} шт</p>
        <p>Товары: {{ periodData.transactions.products }} шт</p>
        <p>Услуги: {{ periodData.transactions.services }} шт</p>
        <p>Возвраты: {{ periodData.transactions.returns }} шт</p>
        <p>Обмены: {{ periodData.transactions.exchanges }} шт</p>
      </div>
    </section>

    <!-- Топы (зависят от периода) -->
    <section class="top grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="card p-4 rounded">
        <h3 class="font-bold mb-2">Топ продавцы:</h3>
        <ul>
          <li v-for="seller in periodData.topSellers" :key="seller.name">
            {{ seller.name }} — {{ seller.sum.toLocaleString() }} UZS
          </li>
        </ul>
      </div>
      <div class="card p-4 rounded">
        <h3 class="font-bold mb-2">Топ товары:</h3>
        <ul>
          <li v-for="product in periodData.topProducts" :key="product.name">
            {{ product.name }} — {{ product.sum.toLocaleString() }} UZS
          </li>
        </ul>
      </div>
    </section>
  </section>
</template>

<style scoped>
.dashboard .card {
  background-color: #262626;
  box-shadow: 0px 0px 16px rgba(255, 255, 255, 0.08);
}
.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>
