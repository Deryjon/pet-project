<template>
  <section class="bg-[#262626] text-white rounded-2xl flex h-full ">
    <!-- Левая часть -->
    <div class="w-full border-r border-[#404040] pr-7 h-full flex flex-col overflow-y-auto relative">
      <SearchBar /> 
      <Cart />
      <div
        v-if="cartStore.productsLoading || cartStore.creatingSale || cartStore.loadingSale || cartStore.addingItem"
        class="absolute top-2 right-3 text-[#bdbdbd] flex items-center gap-2"
      >
        <Icon name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />
        Загрузка...
      </div>
    </div>

    <!-- Правая часть -->
    <div class="pl-[15px] flex flex-col justify-between w-[450px] h-full">
      <div class=" flex flex-col">

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
useHead({ title: "Новая продажа | Konkurent.cases" });
// POS products search: GET /api/new-sale/products
import { ref, watch, computed, onMounted } from "vue";
import { useApi } from "~/composables/useApi";
import { useUserStore } from "~/store/useUserStore";
import { useCartStore } from "~/store/cart";

const { apiFetch } = useApi();
const user = useUserStore();
const cartStore = useCartStore();

// Pagination and search params
const page = ref(1);
const limit = ref(10);
const total = ref(0);

// Reuse SearchBar's store-bound search query
const search = computed(() => cartStore.searchQuery);

// Optional branch override (admins/managers only)
const selectedBranch = ref<string | null>(null);
const isAdminOrManager = computed(() => ["admin", "manager"].includes((user.user?.role || "").toLowerCase()));

async function fetchProducts() {
  try {
    cartStore.productsLoading = true as any;
    const query: Record<string, any> = {
      page: page.value,
      limit: Math.min(Math.max(limit.value, 1), 100),
    };
    if (search.value) query.search = search.value;
    if (isAdminOrManager.value && selectedBranch.value) {
      query.branch_code = selectedBranch.value;
    }

    const res = await apiFetch<any>("/new-sale/products", { method: "GET", query });
    const items = Array.isArray(res?.items) ? res.items : [];

    // Map API items to shape used in POS and replace products in-place
    const mapped = items.map((p: any) => ({
      id: p.id,
      name: p.name,
      price: p.sale_price ?? p.price ?? 0,
      barcode: p.barcode ?? "",
      article: p.sku ?? "",
    }));
    // mutate array to avoid replacing Ref in Pinia setup store
    try {
      (cartStore.products as any).splice(0, (cartStore.products as any).length, ...mapped);
    } catch {
      // fallback assign if splice fails for any reason
      // @ts-ignore
      cartStore.products = mapped as any;
    }

    page.value = Number(res?.page ?? page.value) || 1;
    limit.value = Number(res?.limit ?? limit.value) || 10;
    total.value = Number(res?.total ?? total.value) || 0;
  } catch (e) {
    // keep previous products on error
  } finally {
    cartStore.productsLoading = false as any;
  }
}

let t: any = null;
watch([search, page, limit, selectedBranch], () => {
  if (t) clearTimeout(t);
  t = setTimeout(fetchProducts, 250);
}, { immediate: true });

// Create a pending sale on page entry
onMounted(async () => {
  const sid = await cartStore.initSale();
  if (sid) await cartStore.loadSale(sid);
});
</script>
