<script setup lang="ts">
import { useRouter } from "vue-router";
import { useHead } from "#imports";

import ProductHeader from "@/components/products/ProductHeader.vue";
import ProductSidebar from "@/components/products/ProductSidebar.vue";
import ProductMainForm from "@/components/products/ProductMainForm.vue";
import ProductPrices from "@/components/products/ProductPrices.vue";
import ProductStocks from "@/components/products/ProductStocks.vue";
import ProductFeatures from "@/components/products/ProductFeatures.vue";

definePageMeta({ layout: "empty" });

const router = useRouter();

useHead({
  title: "Новый продукт | Konkurent.cases",
  meta: [{ name: "description", content: "Описание страницы" }],
});
</script>

<template>
  <section class="operations">
    <ProductHeader />
    <div class="flex gap-10 mx-auto px-[144px] mt-8">
      <ProductSidebar />
      <div class="right flex-1 px-8">
        <ProductMainForm />
        <ProductPrices class="mt-12" />
        <ProductStocks class="mt-12" />
        <ProductFeatures class="mt-12 pb-12" />
      </div>
    </div>
  </section>
</template>
<style>
input,
select {
  @apply bg-[#404040] p-[15px] text-[16px] font-semibold rounded-[15px] transition-all duration-300 hover:bg-[#5e5e5e];
} 
</style>
