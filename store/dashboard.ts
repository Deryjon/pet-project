import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useDashboardStore = defineStore("dashboard", () => {
  // магазины
  const shops = ref([
    { id: 1, name: "Samarqand Darvoza" },
    { id: 2, name: "Globus Mall" },
    { id: 3, name: "Mega Planet" },
  ]);
  const selectedShopIndex = ref<number | null>(null);

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
  }

  // периоды
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
  function setPeriod(value: "yesterday" | "today" | "week" | "month" | "year") {
    selectedPeriod.value = value;
  }

  // данные (пока статичные, потом заменишь на API)
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
        {
          name: "Sardor Obidjanov",
          sum: 640000,
          avgCheck: 120000,
          avgCount: 5,
          color: "#ff6b6b",
        },
        {
          name: "Iskandarjon Yusupov",
          sum: 330000,
          avgCheck: 110000,
          avgCount: 3,
          color: "#4dabf7",
        },
        {
          name: "Dilshod Karimov",
          sum: 210000,
          avgCheck: 70000,
          avgCount: 2,
          color: "#51cf66",
        },
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
        {
          name: "Sardor Obidjanov",
          sum: 640000,
          avgCheck: 120000,
          avgCount: 5,
          color: "#ff6b6b",
        },
        {
          name: "Iskandarjon Yusupov",
          sum: 330000,
          avgCheck: 110000,
          avgCount: 3,
          color: "#4dabf7",
        },
        {
          name: "Dilshod Karimov",
          sum: 210000,
          avgCheck: 70000,
          avgCount: 2,
          color: "#51cf66",
        },
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
        {
          name: "Sardor Obidjanov",
          sum: 640000,
          avgCheck: 120000,
          avgCount: 5,
          color: "#ff6b6b",
        },
        {
          name: "Iskandarjon Yusupov",
          sum: 330000,
          avgCheck: 110000,
          avgCount: 3,
          color: "#4dabf7",
        },
        {
          name: "Dilshod Karimov",
          sum: 210000,
          avgCheck: 70000,
          avgCount: 2,
          color: "#51cf66",
        },
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
        {
          name: "Sardor Obidjanov",
          sum: 640000,
          avgCheck: 120000,
          avgCount: 5,
          color: "#ff6b6b",
        },
        {
          name: "Iskandarjon Yusupov",
          sum: 330000,
          avgCheck: 110000,
          avgCount: 3,
          color: "#4dabf7",
        },
        {
          name: "Dilshod Karimov",
          sum: 210000,
          avgCheck: 70000,
          avgCount: 2,
          color: "#51cf66",
        },
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

  const periodData = computed(() => dashboardData.value[selectedPeriod.value]);

  const branchesSales = computed(() => {
    return shops.value.map((shop, index) => {
      const branchKey = index === 0 ? "branch1" : "branch2";
      const total = periodData.value.hourlySales.reduce(
        (sum, i) => sum + (i[branchKey] || 0),
        0
      );
      return {
        name: shop.name,
        total,
        color: index === 0 ? "#4ade80" : "#60a5fa", // чтобы совпадало с графиком
      };
    });
  });

  // фильтрованные данные для графика
  const chartData = computed(() => {
    const labels = periodData.value.hourlySales.map((i) => i.hour);

    if (selectedShopIndex.value === null) {
      return {
        labels,
        datasets: [
          {
            label: "Samarqand Darvoza",
            data: periodData.value.hourlySales.map((i) => i.branch1),
            borderColor: "#4ade80",
            backgroundColor: "rgba(74,222,128,0.2)",
            fill: true,
          },
          {
            label: "Globus Mall",
            data: periodData.value.hourlySales.map((i) => i.branch2),
            borderColor: "#60a5fa",
            backgroundColor: "rgba(96,165,250,0.2)",
            fill: true,
          },
        ],
      };
    }

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
              ? "rgba(74,222,128,0.2)"
              : "rgba(96,165,250,0.2)",
          fill: true,
        },
      ],
    };
  });

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

  return {
    shops,
    periods,
    selectedShopIndex,
    selectedShopName,
    selectedPeriod,
    periodData,
    chartData,
    filteredTotalSales,
    selectShop,
    setPeriod,
    branchesSales,
  };
});
