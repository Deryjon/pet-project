<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
import ShopSelector from "@/components/dashboard/ShopSelector.vue";
import PeriodSelector from "@/components/dashboard/PeriodSelector.vue";
import PaymentsCard from "@/components/dashboard/PaymentsCard.vue";
import TransactionsCard from "@/components/dashboard/TransactionsCard.vue";
import TopSellers from "@/components/dashboard/TopSellers.vue";
import TopProducts from "@/components/dashboard/TopProducts.vue";

// Load Chart only on client to avoid SSR errors
const SalesChart = defineAsyncComponent(() => import('@/components/dashboard/SalesChart.vue'));

</script>

<template>
  <section class="space-y-6">
    <ShopSelector />
    <PeriodSelector />
    <ClientOnly>
      <SalesChart />
    </ClientOnly>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <PaymentsCard />
      <TransactionsCard />
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <TopSellers />
      <TopProducts />
    </div>
  </section>
</template>
