<template>
  <section
    class="relative flex h-full flex-col bg-[#262626] text-white xl:flex-row"
  >
    <div
      v-if="globalSaleLoading"
      class="absolute inset-0 z-30 flex items-center justify-center bg-[#262626]/72 px-4 backdrop-blur-sm"
    >
      <div
        class="flex min-w-[260px] max-w-[420px] items-center gap-4 rounded-[24px] border border-white/10 bg-[#2b2b2b] px-5 py-4 shadow-2xl"
      >
        <Icon
          name="heroicons:arrow-path"
          class="h-6 w-6 shrink-0 animate-spin text-[#78b3ff]"
        />
        <div>
          <div class="text-[15px] font-semibold text-white">
            {{ currentOperationLabel }}
          </div>
          <div class="mt-1 text-sm text-[#bdbdbd]">
            Подождите, операция обновляет текущую продажу.
          </div>
        </div>
      </div>
    </div>

    <div class="relative flex h-full w-full flex-col overflow-y-auto xl:pr-6">
      <div
        class="pointer-events-none absolute right-0 top-0 bottom-0 hidden w-px bg-[#404040] xl:block"
      />
      <SearchBar />
      <div
        v-if="cartStore.lastCartError"
        class="mt-3 rounded-[16px] border border-[#7f3d3d] bg-[#442f2f] px-4 py-3 text-[14px] font-medium text-[#ffd4d4]"
      >
        {{ cartStore.lastCartError }}
      </div>
      <div
        v-if="initialPageLoading"
        class="mt-4 flex items-center gap-3 rounded-[16px] border border-white/10 bg-[#2b2b2b] px-4 py-3 text-[14px] font-medium text-[#d3d3d3]"
      >
        <Icon name="heroicons:arrow-path" class="h-4 w-4 animate-spin" />
        Восстанавливаем продажу и способы оплаты...
      </div>
      <div
        v-if="operationStatuses.length"
        class="mt-3 flex flex-wrap gap-2 text-[12px] font-bold uppercase tracking-[0.08em] text-[#bdbdbd]"
      >
        <span
          v-for="status in operationStatuses"
          :key="status"
          class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#303030] px-3 py-1.5"
        >
          <Icon
            name="heroicons:arrow-path"
            class="h-3.5 w-3.5 animate-spin text-[#78b3ff]"
          />
          {{ status }}
        </span>
      </div>
      <Cart />
    </div>

    <div
      class="mt-6 flex h-full w-full flex-col justify-between border-t border-white/10 pt-6 xl:ml-6 xl:mt-0 xl:w-[500px] xl:border-t-0 xl:pl-6 xl:pt-0"
    >
      <div class="flex flex-col">
        <ClientForm />
        <DiscountSwitcher />
      </div>
      <Summary />
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
const operationStatuses = computed(() => {
  const statuses: string[] = [];

  if (cartStore.creatingSale) statuses.push("#SALE");
  if (cartStore.loadingSale || cartStore.restoringSale) statuses.push("#ORDER");
  if (cartStore.productsLoading) statuses.push("#PRODUCTS");
  if (cartStore.addingItem) statuses.push("#ITEM");
  if (cartStore.saleMetaLoading) statuses.push("#META");
  if (cartStore.discountLoading) statuses.push("#DISCOUNT");
  if (cartStore.parkingLoading) statuses.push("#PARK");
  if (cartStore.payLoading) statuses.push("#PAY");
  if (cartStore.cancelLoading) statuses.push("#CANCEL");

  return statuses;
});
const globalSaleLoading = computed(
  () => !initialPageLoading.value && operationStatuses.value.length > 0,
);
const currentOperationLabel = computed(() => {
  if (cartStore.payLoading) return "Проводим оплату";
  if (cartStore.saleMetaLoading) return "Обновляем параметры продажи";
  if (cartStore.discountLoading) return "Пересчитываем скидку";
  if (cartStore.addingItem) return "Обновляем корзину";
  if (cartStore.cancelLoading) return "Сбрасываем продажу";
  if (cartStore.loadingSale || cartStore.restoringSale)
    return "Загружаем черновик продажи";
  if (cartStore.creatingSale) return "Создаем новую продажу";
  if (cartStore.productsLoading) return "Загружаем товары";
  return "Обновляем продажу";
});

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
