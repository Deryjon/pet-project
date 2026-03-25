<template>
  <section class="flex h-full flex-col rounded-2xl bg-[#262626] text-white xl:flex-row">
    <div class="relative flex h-full w-full flex-col overflow-y-auto p-4 sm:p-6 xl:pr-7">
      <div class="pointer-events-none absolute right-0 top-8 hidden h-[calc(100%-64px)] w-px bg-[#404040] xl:block" />
      <SearchBar />
      <Cart />
      <div
        v-if="cartStore.productsLoading || cartStore.creatingSale || cartStore.loadingSale || cartStore.addingItem"
        class="absolute top-2 right-3 text-[#bdbdbd] flex items-center gap-2"
      >
        <Icon name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />
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
import { ref, watch, computed } from "vue";
import { useProducts } from "~/composables/useProducts";
import { useCartStore } from "~/store/cart";

useHead({ title: "Новая продажа | Konkurent.cases" });

const { listProducts } = useProducts();
const cartStore = useCartStore();

const page = ref(1);
const limit = ref(10);
const search = computed(() => cartStore.searchQuery);

async function fetchProducts() {
  try {
    cartStore.productsLoading = true as any;
    const pageSize = Math.min(Math.max(limit.value, 1), 100);
    const items = await listProducts({
      search: search.value || undefined,
      page: page.value,
      pageSize,
    });

    const mapped = items.map((p: any) => ({
      id: p.id,
      name: p.name,
      price: p.sale_price ?? 0,
      barcode: p.barcode ?? "",
      article: p.sku ?? "",
    }));

    try {
      (cartStore.products as any).splice(0, (cartStore.products as any).length, ...mapped);
    } catch {
      // @ts-ignore
      cartStore.products = mapped as any;
    }

    page.value = Math.max(1, page.value);
    limit.value = pageSize;
  } finally {
    cartStore.productsLoading = false as any;
  }
}

let t: any = null;
watch(
  [search, page, limit],
  () => {
    if (t) clearTimeout(t);
    t = setTimeout(fetchProducts, 250);
  },
  { immediate: true }
);
</script>
