<script setup lang="ts">
import ShopSelector from "@/components/dashboard/ShopSelector.vue";
import PeriodSelector from "@/components/dashboard/PeriodSelector.vue";
import SalesChart from "@/components/dashboard/SalesChart.vue";
import PaymentsCard from "@/components/dashboard/PaymentsCard.vue";
import TransactionsCard from "@/components/dashboard/TransactionsCard.vue";
import TopSellers from "@/components/dashboard/TopSellers.vue";
import TopProducts from "@/components/dashboard/TopProducts.vue";

</script>

<template>
  <section class="space-y-6">
    <ShopSelector />
    <PeriodSelector />
    <SalesChart />
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
