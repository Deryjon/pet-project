<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import ShopSelector from "@/components/dashboard/ShopSelector.vue";
import PeriodSelector from "@/components/dashboard/PeriodSelector.vue";
import PaymentsCard from "@/components/dashboard/PaymentsCard.vue";
import TransactionsCard from "@/components/dashboard/TransactionsCard.vue";
import TopSellers from "@/components/dashboard/TopSellers.vue";
import TopProducts from "@/components/dashboard/TopProducts.vue";
import { useDashboardStore } from "@/store/dashboard";

useSeoMeta({
  title: "Дашбоард",
  description: "Главная страница",
});

const SalesChart = defineAsyncComponent(() => import("@/components/dashboard/SalesChart.vue"));
const store = useDashboardStore();

onMounted(async () => {
  await store.fetchDashboardReport();
  await store.saveSettings();
});
</script>

<template>
  <section class="space-y-6">
    <ShopSelector />
    <PeriodSelector />

    <div
      v-if="store.loading"
      class="rounded-lg bg-[#262626] px-4 py-3 text-sm text-[#bdbdbd]"
    >
      Загрузка dashboard...
    </div>
    <div
      v-else-if="store.error"
      class="rounded-lg bg-[#3a1f1f] px-4 py-3 text-sm text-[#ffb4b4]"
    >
      {{ store.error }}
    </div>

    <ClientOnly>
      <SalesChart />
    </ClientOnly>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <PaymentsCard />
      <TransactionsCard />
    </div>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <TopSellers />
      <TopProducts />
    </div>
  </section>
</template>
