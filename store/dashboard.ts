import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { useApi } from "~/composables/useApi";
import { useUserStore } from "~/store/useUserStore";

type DashboardPeriod = "yesterday" | "today" | "week" | "month" | "year";
type DashboardGranularity = "hour" | "day";

type DashboardShop = {
  id: string;
  name: string;
};

type DashboardReport = {
  shops?: Array<{
    shop_id?: string;
    shop_name?: string;
    total_price?: number;
  }>;
  shop_orders?: Array<Record<string, number | string>>;
  total?: Array<{
    start_date?: string;
    end_date?: string;
    total_price?: number;
  }>;
  total_orders_price?: number;
  payment_type_stats?: Array<{
    payment_type_id?: string;
    payment_type_name?: string;
    total_price?: number;
    count?: number;
  }>;
  transactions?: {
    total?: number;
    products?: number;
    services?: number;
    sets?: number;
    refunds?: number;
    exchanges?: number;
  };
  top_sellers?: Array<{
    seller_name?: string;
    total_price?: number;
    orders_count?: number;
  }>;
  top_products?: Array<{
    name?: string;
    quantity?: number;
    total_price?: number;
    net_sales?: number;
  }>;
  currency?: string;
  seller_field?: string;
  product_group_field?: string;
  product_field?: string;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function shiftDate(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function startDateForPeriod(period: DashboardPeriod) {
  const now = new Date();

  switch (period) {
    case "yesterday":
      return formatDate(shiftDate(now, -1));
    case "week":
      return formatDate(shiftDate(now, -6));
    case "month":
      return formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
    case "year":
      return formatDate(new Date(now.getFullYear(), 0, 1));
    case "today":
    default:
      return formatDate(now);
  }
}

function labelForPoint(value: string, granularity: DashboardGranularity) {
  if (!value) return "";

  const normalized = String(value).replace(" ", "T");
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  if (granularity === "hour") {
    return parsed.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return parsed.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
  });
}

function colorByIndex(index: number) {
  const palette = [
    "#4ade80",
    "#60a5fa",
    "#f59e0b",
    "#f87171",
    "#a78bfa",
    "#2dd4bf",
    "#fb7185",
  ];

  return palette[index % palette.length];
}

export const useDashboardStore = defineStore("dashboard", () => {
  const { apiFetch } = useApi();
  const userStore = useUserStore();

  const periods: Array<{ label: string; value: DashboardPeriod }> = [
    { label: "Вчера", value: "yesterday" },
    { label: "Сегодня", value: "today" },
    { label: "Неделя", value: "week" },
    { label: "Месяц", value: "month" },
    { label: "Год", value: "year" },
  ];

  const selectedPeriod = ref<DashboardPeriod>("today");
  const selectedGranularity = ref<DashboardGranularity>("hour");
  const selectedShopId = ref<string | null>(null);
  const report = ref<DashboardReport | null>(null);
  const loading = ref(false);
  const settingsSaving = ref(false);
  const error = ref("");

  const shops = computed<DashboardShop[]>(() => {
    const fromUser = Array.isArray(userStore.user.shops)
      ? userStore.user.shops
          .map((shop: any) => ({
            id: String(shop?.id ?? ""),
            name: String(shop?.name ?? ""),
          }))
          .filter((shop: DashboardShop) => Boolean(shop.id && shop.name))
      : [];

    if (fromUser.length > 0) {
      return fromUser;
    }

    return Array.isArray(report.value?.shops)
      ? report.value!.shops!
          .map((shop: any) => ({
            id: String(shop?.shop_id ?? shop?.shop_name ?? ""),
            name: String(shop?.shop_name ?? ""),
          }))
          .filter((shop: DashboardShop) => Boolean(shop.id && shop.name))
      : [];
  });

  const selectedShopName = computed(() => {
    if (!selectedShopId.value) return "Все магазины";
    return shops.value.find((shop) => shop.id === selectedShopId.value)?.name ?? "Все магазины";
  });

  const reportCurrency = computed(() => String(report.value?.currency ?? "UZS"));

  const paymentItems = computed(() =>
    Array.isArray(report.value?.payment_type_stats)
      ? report.value!.payment_type_stats!.map((item) => ({
          id: String(item?.payment_type_id ?? ""),
          name: String(item?.payment_type_name ?? "Не указано"),
          total: Number(item?.total_price ?? 0),
          count: Number(item?.count ?? 0),
        }))
      : [],
  );

  const periodData = computed(() => {
    const transactions = report.value?.transactions ?? {};
    const topSellers = Array.isArray(report.value?.top_sellers) ? report.value!.top_sellers! : [];
    const topProducts = Array.isArray(report.value?.top_products)
      ? report.value!.top_products!
      : [];

    return {
      payments: Object.fromEntries(paymentItems.value.map((item) => [item.name, item.total])),
      paymentItems: paymentItems.value,
      transactions: {
        total: Number(transactions.total ?? 0),
        products: Number(transactions.products ?? 0),
        services: Number(transactions.services ?? 0),
        sets: Number(transactions.sets ?? 0),
        returns: Number(transactions.refunds ?? 0),
        exchanges: Number(transactions.exchanges ?? 0),
      },
      topSellers: topSellers.map((seller, index) => {
        const total = Number(seller?.total_price ?? 0);
        const ordersCount = Math.max(0, Number(seller?.orders_count ?? 0));
        return {
          name: String(seller?.seller_name ?? "Без имени"),
          sum: total,
          avgCheck: ordersCount > 0 ? Math.round(total / ordersCount) : total,
          avgCount: ordersCount,
          color: colorByIndex(index),
        };
      }),
      topProducts: topProducts.map((product) => ({
        name: String(product?.name ?? "Без названия"),
        sum: Number(product?.net_sales ?? product?.total_price ?? 0),
        count: Number(product?.quantity ?? 0),
      })),
    };
  });

  const chartSeries = computed(() => {
    const source = Array.isArray(report.value?.shop_orders) ? report.value!.shop_orders! : [];

    return source.map((row: Record<string, any>) => {
      const label = labelForPoint(String(row?.start_date ?? ""), selectedGranularity.value);
      const values = Object.entries(row).filter(([key]) => key !== "start_date" && key !== "end_date");
      return {
        label,
        values,
      };
    });
  });

  const branchesSales = computed(() => {
    const responseShops = Array.isArray(report.value?.shops) ? report.value!.shops! : [];
    const totalsByName = new Map(
      responseShops.map((shop: any) => [
        String(shop?.shop_name ?? ""),
        Number(shop?.total_price ?? 0),
      ]),
    );

    const list = responseShops.length > 0
      ? responseShops.map((shop: any, index: number) => ({
          id: String(shop?.shop_id ?? shop?.shop_name ?? index),
          name: String(shop?.shop_name ?? ""),
          total: Number(shop?.total_price ?? 0),
          color: colorByIndex(index),
        }))
      : shops.value.map((shop, index) => ({
          id: shop.id,
          name: shop.name,
          total: Number(totalsByName.get(shop.name) ?? 0),
          color: colorByIndex(index),
        }));

    if (!selectedShopId.value) {
      return list;
    }

    return list.filter((shop) => shop.id === selectedShopId.value);
  });

  const chartData = computed(() => {
    const labels = chartSeries.value.map((item) => item.label);
    const responseShops = Array.isArray(report.value?.shops) ? report.value!.shops! : [];
    const shopNameById = new Map(
      responseShops.map((shop: any) => [String(shop?.shop_id ?? ""), String(shop?.shop_name ?? "")]),
    );

    const candidateShops = branchesSales.value.length > 0 ? branchesSales.value : shops.value;
    const datasets = candidateShops.map((shop, index) => {
      const seriesName = shop.name || shopNameById.get(shop.id) || "";
      return {
        label: seriesName,
        data: chartSeries.value.map((item) => {
          const match = item.values.find(([key]) => String(key) === seriesName);
          return Number(match?.[1] ?? 0);
        }),
        borderColor: colorByIndex(index),
        backgroundColor: `${colorByIndex(index)}33`,
        fill: true,
      };
    });

    return { labels, datasets };
  });

  const filteredTotalSales = computed(() => {
    if (!selectedShopId.value) {
      return Number(report.value?.total_orders_price ?? 0);
    }

    return Number(branchesSales.value[0]?.total ?? 0);
  });

  async function saveSettings() {
    settingsSaving.value = true;
    try {
      await apiFetch("/v1/dashboard-setting", {
        method: "POST",
        body: {
          detail_period: selectedGranularity.value,
          report_period: selectedPeriod.value,
        },
      });
    } catch {
      // Settings are best-effort only.
    } finally {
      settingsSaving.value = false;
    }
  }

  async function fetchDashboardReport() {
    loading.value = true;
    error.value = "";

    try {
      const data: any = await apiFetch("/v1/dashboard-report", {
        method: "GET",
        query: {
          start_date: startDateForPeriod(selectedPeriod.value),
          detalization: selectedGranularity.value,
          seller_field: "sales_sum",
          currency: reportCurrency.value || "UZS",
          product_group_field: "name",
          product_field: "net_sales",
        },
      });

      report.value = data ?? {};
    } catch (err: any) {
      report.value = null;
      error.value =
        String(err?.data?.message ?? err?.message ?? "").trim() || "Не удалось загрузить dashboard";
    } finally {
      loading.value = false;
    }
  }

  function selectShop(id: string | number | null) {
    selectedShopId.value = id === null ? null : String(id);
  }

  function setPeriod(value: DashboardPeriod) {
    selectedPeriod.value = value;
  }

  function setGranularity(value: DashboardGranularity) {
    selectedGranularity.value = value;
  }

  watch(
    () => [selectedPeriod.value, selectedGranularity.value],
    async () => {
      await saveSettings();
      await fetchDashboardReport();
    },
    { immediate: false },
  );

  return {
    shops,
    periods,
    selectedPeriod,
    selectedGranularity,
    selectedShopId,
    selectedShopName,
    report,
    reportCurrency,
    periodData,
    chartData,
    branchesSales,
    filteredTotalSales,
    loading,
    settingsSaving,
    error,
    selectShop,
    setPeriod,
    setGranularity,
    saveSettings,
    fetchDashboardReport,
  };
});
