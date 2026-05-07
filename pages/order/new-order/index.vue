<template>
  <section class="flex h-full flex-col bg-[#262626] text-white xl:flex-row">
    <div class="relative flex h-full w-full flex-col overflow-y-auto xl:pr-6">
      <div class="pointer-events-none absolute right-0 top-8 hidden h-[calc(100%-64px)] w-px bg-[#404040] xl:block" />
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
          <Icon name="heroicons:arrow-path" class="h-3.5 w-3.5 animate-spin text-[#78b3ff]" />
          {{ status }}
        </span>
      </div>
      <Cart />
    </div>

    <div class="mt-6 flex h-full w-full flex-col justify-between border-t border-white/10 pt-6 xl:ml-6 xl:mt-0 xl:w-[450px] xl:border-l xl:border-t-0 xl:border-white/10 xl:pl-6 xl:pt-0">
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
const search = computed(() => cartStore.searchQuery);
const currentShopId = computed(() => String(selectedLocation.value?.id ?? cartStore.resolveCurrentShopId() ?? ""));
const operationStatuses = computed(() => {
  const statuses: string[] = [];

  if (cartStore.creatingSale) statuses.push("#SALE");
  if (cartStore.loadingSale || cartStore.restoringSale) statuses.push("#ORDER");
  if (cartStore.productsLoading) statuses.push("#PRODUCTS");
  if (cartStore.addingItem) statuses.push("#ITEM");

  return statuses;
});
const routeSaleId = computed(() => normalizeRouteValue(route.params.id) || normalizeRouteValue(route.query.sale_id));

function normalizeRouteValue(value: unknown) {
  const normalized = Array.isArray(value) ? value[0] : value;
  return String(normalized ?? "").trim();
}

function currentOrderPath(id: string | number) {
  return `/order/new-order/${encodeURIComponent(String(id))}`;
}

async function syncOrderRoute() {
  if (!cartStore.saleId) return;

  const nextQuery: Record<string, string> = {};

  if (cartStore.saleNumber) {
    nextQuery.order_number = String(cartStore.saleNumber);
  }
  nextQuery.page = String(page.value);

  const nextPath = currentOrderPath(cartStore.saleId);
  if (route.path !== nextPath || JSON.stringify(route.query) !== JSON.stringify(nextQuery)) {
    await router.replace({ path: nextPath, query: nextQuery });
  }
}

async function prepareDraftSale() {
  if (!currentShopId.value) return;

  await cartStore.loadSaleReferenceData();

  if (!cartStore.saleId) {
    await cartStore.initSale();
  }

  if (cartStore.saleId) {
    await cartStore.loadSale(cartStore.saleId);
    await syncOrderRoute();
  }
}

async function fetchProducts() {
  try {
    cartStore.productsLoading = true as any;
    cartStore.lastCartError = "";
    const pageSize = Math.min(Math.max(limit.value, 1), 100);
    const response: any = await apiFetch("/products/search", {
      method: "GET",
      query: {
        q: search.value || undefined,
        shopId: currentShopId.value || undefined,
      },
    });

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
        p.sellPrice ??
          p.sell_price ??
          p.retail_price ??
          p.sale_price ??
          p.shop_prices?.[0]?.retail_price ??
          p.price ??
          0,
      ),
      barcode: String(p.barcode ?? p.product?.barcode ?? ""),
      article: String(p.sku ?? p.article ?? p.product?.sku ?? ""),
      availableQuantity: Number(
        p?.shop_measurement_values?.[0]?.total_active_measurement_value ??
          p?.measurement_values?.total_active_measurement_value ??
          p?.measurement_values?.total_measurement_value ??
          p?.product_stock?.quantity ??
          p?.stock?.quantity ??
          p?.stock ??
          p?.quantity ??
          p?.active_measurement_value ??
          0,
      ),
      shopId: String(
        p?.shop_measurement_values?.[0]?.shop_id ??
          p?.shop_prices?.[0]?.shop_id ??
          p?.shop_id ??
          p?.product_stock?.shop_id ??
          p?.stock?.shop_id ??
          cartStore.resolveCurrentShopId() ??
          "",
      ),
    }));

    try {
      (cartStore.products as any).splice(0, (cartStore.products as any).length, ...mapped);
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
    const status = Number(error?.statusCode ?? error?.response?.status ?? error?.data?.statusCode ?? 0);
    if (status === 403) {
      cartStore.lastCartError = "Нет прав доступа.";
      return;
    }
    cartStore.lastCartError =
      error?.data?.message || error?.message || "Не удалось загрузить товары для текущего филиала.";
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

watch(
  [page, () => cartStore.saleId, () => cartStore.saleNumber],
  () => {
    void syncOrderRoute();
  },
);

watch(currentShopId, (next, prev) => {
  if (!next) return;

  if (cartStore.hasSaleShopMismatch(next) || (prev && next !== prev && (cartStore.saleId || cartStore.cart.length))) {
    cartStore.resetSaleState({ keepReceipt: true });
    cartStore.lastCartError = !prev
      ? "Найдена сохранённая продажа из другого филиала. Корзина очищена."
      : "Филиал изменён. Корзина очищена, чтобы не смешивать остатки разных магазинов.";
  }
  if (prev && next !== prev) {
    void prepareDraftSale();
  }
});

onMounted(async () => {
  try {
    await cartStore.loadSaleReferenceData();
    const initialSaleId = routeSaleId.value;

    if (initialSaleId) {
      cartStore.saleId = initialSaleId;
      cartStore.saleShopId = "";
    }

    if (!initialSaleId && cartStore.hasSaleShopMismatch(currentShopId.value)) {
      cartStore.resetSaleState({ keepReceipt: true });
      cartStore.lastCartError = "Найдена сохранённая продажа из другого филиала. Корзина очищена.";
    }

    if (cartStore.saleId) {
      try {
        await cartStore.loadSale(cartStore.saleId);
        await syncOrderRoute();
      } catch {
        cartStore.resetSaleState({ keepReceipt: true });
        cartStore.lastCartError = "Не удалось восстановить сохранённую продажу. Начните новую продажу.";
      }
    } else {
      await cartStore.initSale();
      if (cartStore.saleId) {
        await cartStore.loadSale(cartStore.saleId);
        await syncOrderRoute();
      }
    }
  } finally {
    initialPageLoading.value = false;
  }
});

onBeforeUnmount(() => {
  if (t) clearTimeout(t);
});
</script>
