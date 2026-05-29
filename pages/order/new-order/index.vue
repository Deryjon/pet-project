<template>
  <section
    class="relative flex min-h-[100vh] flex-col gap-4 bg-[#262626] px-3 pb-6 text-white sm:gap-5 sm:px-4 sm:pb-8 xl:min-h-[calc(100vh-24px)] xl:h-[calc(100vh-24px)] xl:flex-row xl:items-stretch xl:gap-6 xl:pb-0 p-2"
  >
    <div
      v-if="searchLoadingOverlay"
      class="pointer-events-none absolute inset-0 z-30 bg-white/8 backdrop-blur-[3px]"
    />

    <div class="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden p-2 xl:h-full">
      <SearchBar />
      <div
        v-if="cartStore.lastCartError"
        class="mt-3 rounded-[16px] border border-[#7f3d3d] bg-[#442f2f] text-[14px] font-medium text-[#ffd4d4]"
      >
        {{ cartStore.lastCartError }}
      </div>
      <div
        v-if="initialPageLoading"
        class="mt-4 flex items-center gap-3 rounded-[16px] border border-white/10 bg-[#2b2b2b] text-[14px] font-medium text-[#d3d3d3]"
      >
        <Icon name="heroicons:arrow-path" class="h-4 w-4 animate-spin" />
        Восстанавливаем продажу и способы оплаты...
      </div>
      <div class="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
        <Cart />
      </div>
    </div>

    <div
      aria-hidden="true"
      class="hidden xl:block xl:w-px xl:self-stretch xl:bg-[#404040]"
    />

    <div
      class="flex w-full shrink-0 flex-col rounded-[28px] xl:h-full xl:w-[350px] xl:justify-end xl:ml-0"
    >
      <div class="flex flex-col gap-5">
        <ClientForm />
        <DiscountSwitcher />
      </div>
      <div class="mt-5 xl:mt-auto">
        <Summary />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import SearchBar from "@/components/pos/SearchBar.vue";
import Cart from "@/components/pos/Cart.vue";
import ClientForm from "@/components/pos/ClientForm.vue";
import DiscountSwitcher from "@/components/pos/DiscountSwitcher.vue";
import Summary from "@/components/pos/SummaryBlock.vue";
import { useHead } from "#imports";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useApi } from "~/composables/useApi";
import { useCartStore } from "~/store/cart";
import { useLocationStore } from "~/store/useLocationStore";

useHead({ title: "Новая продажа | Konkurent" });

const { apiFetch } = useApi();
const cartStore = useCartStore();
const locationStore = useLocationStore();
const { selectedLocation } = storeToRefs(locationStore);
const route = useRoute();
const router = useRouter();

const page = ref(Math.max(1, Number(route.query.page || 1) || 1));
const limit = ref(10);
const initialPageLoading = ref(true);
const leavingRoute = ref(false);
const search = computed(() => cartStore.searchQuery);
const currentShopId = computed(() =>
  String(selectedLocation.value?.id ?? cartStore.resolveCurrentShopId() ?? ""),
);
const searchLoadingOverlay = computed(
  () => cartStore.productsLoading && Boolean(search.value.trim()),
);

function currentOrderPath() {
  return "/order/new-order";
}

async function syncOrderRoute() {
  if (leavingRoute.value) return;

  const nextQuery: Record<string, string> = {
    page: String(page.value),
  };

  if (cartStore.saleNumber) {
    nextQuery.order_number = String(cartStore.saleNumber);
  }

  if (
    route.path !== currentOrderPath() ||
    JSON.stringify(route.query) !== JSON.stringify(nextQuery)
  ) {
    await router.replace({ path: currentOrderPath(), query: nextQuery });
  }
}

async function ensureActiveSale() {
  if (!currentShopId.value) return;

  await cartStore.loadSaleReferenceData();
  await cartStore.openFreshSale({ keepReceipt: true, keepSearchQuery: true });
  await syncOrderRoute();
}

async function leaveCurrentSale() {
  await cartStore.leaveActiveSale({ keepReceipt: true, keepSearchQuery: true });
}

function handlePageUnload() {
  cartStore.leaveActiveSaleOnUnload();
}

async function fetchProducts() {
  try {
    cartStore.productsLoading = true as any;
    cartStore.lastCartError = "";
    const pageSize = Math.min(Math.max(limit.value, 1), 100);
    const query = {
      page: page.value,
      limit: pageSize,
      search: search.value || undefined,
      shop_id: currentShopId.value || undefined,
    };
    let response: any;
    try {
      response = await apiFetch("/new-sale/products", {
        method: "GET",
        query,
      });
    } catch {
      response = await apiFetch("/v2/new-sale/products", {
        method: "GET",
        query,
      });
    }

    const items = Array.isArray(response)
      ? response
      : Array.isArray(response?.products)
        ? response.products
        : Array.isArray(response?.items)
          ? response.items
          : Array.isArray(response?.data)
            ? response.data
            : [];

    const mapped = items.map((p: any) => ({
      id: p.publicId ?? p.public_id ?? p.id,
      productId: p.id,
      publicId: p.publicId ?? p.public_id,
      name: String(p.name ?? p.base_name ?? p.product?.name ?? ""),
      price: Number(
        p.retail_price ??
          p.sellPrice ??
          p.sell_price ??
          p.sale_price ??
          p.shop_prices?.[0]?.retail_price ??
          p.price ??
          0,
      ),
      barcode: String(p.barcode ?? p.product?.barcode ?? ""),
      article: String(p.sku ?? p.article ?? p.product?.sku ?? ""),
      measurementUnitLabel: String(
        p?.measurement_unit?.short_name ??
          p?.measurement_unit?.name ??
          p?.product?.measurement_unit?.short_name ??
          p?.product?.measurement_unit?.name ??
          p?.unit ??
          "шт",
      ).trim() || "шт",
      availableQuantity: Number(
        p?.measurement_values?.total_active_measurement_value ??
          p?.measurement_values?.total_measurement_value ??
          p?.shop_measurement_values?.[0]?.total_active_measurement_value ??
          p?.product_stock?.quantity ??
          p?.stock?.quantity ??
          p?.stock ??
          p?.quantity ??
          p?.active_measurement_value ??
          0,
      ),
      shopId: String(
        p?.shop_prices?.[0]?.shop_id ??
          p?.shop_measurement_values?.[0]?.shop_id ??
          p?.shop_id ??
          p?.product_stock?.shop_id ??
          p?.stock?.shop_id ??
          cartStore.resolveCurrentShopId() ??
          "",
      ),
    }));

    try {
      (cartStore.products as any).splice(
        0,
        (cartStore.products as any).length,
        ...mapped,
      );
    } catch {
      cartStore.products = mapped as any;
    }

    page.value = Math.max(1, page.value);
    limit.value = pageSize;
  } catch (error: any) {
    try {
      (cartStore.products as any).splice(0, (cartStore.products as any).length);
    } catch {
      // ignore
    }
    const status = Number(
      error?.statusCode ??
        error?.response?.status ??
        error?.data?.statusCode ??
        0,
    );
    if (status === 403) {
      cartStore.lastCartError = "Нет прав доступа.";
      return;
    }
    cartStore.lastCartError =
      error?.data?.message ||
      error?.message ||
      "Не удалось загрузить товары для текущего филиала.";
  } finally {
    cartStore.productsLoading = false as any;
  }
}

let t: ReturnType<typeof setTimeout> | null = null;
watch(
  [search, page, limit, currentShopId],
  () => {
    if (t) clearTimeout(t);
    t = setTimeout(fetchProducts, 250);
  },
  { immediate: true },
);

watch(
  () => route.query.page,
  (next) => {
    const nextPage = Math.max(1, Number(next || 1) || 1);
    if (page.value !== nextPage) page.value = nextPage;
  },
);

watch([page, () => cartStore.saleId, () => cartStore.saleNumber], () => {
  void syncOrderRoute();
});

watch(currentShopId, (next, prev) => {
  if (!next || !prev || next === prev || leavingRoute.value) return;

  void (async () => {
    await leaveCurrentSale();
    await ensureActiveSale();
  })();
});

onMounted(async () => {
  try {
    await ensureActiveSale();
    window.addEventListener("beforeunload", handlePageUnload);
    window.addEventListener("pagehide", handlePageUnload);
  } finally {
    initialPageLoading.value = false;
  }
});

onBeforeRouteLeave(() => {
  leavingRoute.value = true;
  void leaveCurrentSale();
});

onBeforeUnmount(() => {
  if (t) clearTimeout(t);
  window.removeEventListener("beforeunload", handlePageUnload);
  window.removeEventListener("pagehide", handlePageUnload);
});
</script>
