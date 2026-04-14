<template>
  <section class="flex h-full flex-col rounded-2xl bg-[#262626] text-white xl:flex-row">
    <div class="relative flex h-full w-full flex-col overflow-y-auto p-4 sm:p-6 xl:pr-7">
      <div class="pointer-events-none absolute right-0 top-8 hidden h-[calc(100%-64px)] w-px bg-[#404040] xl:block" />
      <SearchBar />
      <div
        v-if="cartStore.lastCartError"
        class="mt-3 rounded-[16px] border border-[#7f3d3d] bg-[#442f2f] px-4 py-3 text-[14px] font-medium text-[#ffd4d4]"
      >
        {{ cartStore.lastCartError }}
      </div>
      <Cart />
      <div
        v-if="cartStore.productsLoading || cartStore.creatingSale || cartStore.loadingSale || cartStore.addingItem"
        class="absolute right-3 top-2 flex items-center gap-2 text-[#bdbdbd]"
      >
        <Icon name="heroicons:arrow-path" class="h-4 w-4 animate-spin" />
        Loading...
      </div>
    </div>

    <div class="flex h-full w-full flex-col justify-between border-t border-white/10 p-4 sm:p-6 xl:w-[450px] xl:border-l xl:border-t-0 xl:border-white/10 xl:pl-[15px]">
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

useHead({ title: "Новая продажа | Konkurent.cases" });

const { apiFetch } = useApi();
const cartStore = useCartStore();
const locationStore = useLocationStore();
const { selectedLocation } = storeToRefs(locationStore);

const page = ref(1);
const limit = ref(10);
const search = computed(() => cartStore.searchQuery);
const currentShopId = computed(() => String(selectedLocation.value?.id ?? cartStore.resolveCurrentShopId() ?? ""));

async function fetchProducts() {
  try {
    cartStore.productsLoading = true as any;
    cartStore.lastCartError = "";
    const pageSize = Math.min(Math.max(limit.value, 1), 100);
    const response: any = await apiFetch("/v2/new-sale/products", {
      method: "GET",
      query: {
        page: page.value,
        limit: pageSize,
        search: search.value || undefined,
        shop_id: currentShopId.value || undefined,
      },
    });

    const items = Array.isArray(response?.products)
      ? response.products
      : Array.isArray(response?.items)
        ? response.items
        : Array.isArray(response)
          ? response
          : [];

    const mapped = items.map((p: any) => ({
      id: p.id,
      name: String(p.name ?? p.base_name ?? p.product?.name ?? ""),
      price: Number(
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
      // @ts-ignore
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

watch(currentShopId, (next, prev) => {
  if (!prev || next === prev) return;

  if (cartStore.saleId || cartStore.cart.length) {
    cartStore.resetSaleState({ keepReceipt: true });
    cartStore.lastCartError = "Филиал изменён. Корзина очищена, чтобы не смешивать остатки разных магазинов.";
  }
});

onMounted(async () => {
  await cartStore.loadPaymentMethods();

  if (cartStore.saleId) {
    try {
      await cartStore.loadSale(cartStore.saleId);
    } catch {
      cartStore.resetSaleState({ keepReceipt: true });
      cartStore.lastCartError = "Не удалось восстановить сохранённую продажу. Начните новую продажу.";
    }
  }
});

onBeforeUnmount(() => {
  if (t) clearTimeout(t);
});
</script>
