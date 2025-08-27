<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useHead } from "#imports";

import CreateProductHeader from "@/components/products/CreateProductHeader.vue";
import CreateProductSidebar from "@/components/products/CreateProductSidebar.vue";
import CreateProductMainForm from "@/components/products/CreateProductMainForm.vue";
import CreateProductPrices from "@/components/products/CreateProductPrices.vue";
import CreateProductStocks from "@/components/products/CreateProductStocks.vue";
import CreateProductFeatures from "@/components/products/CreateProductFeatures.vue";

definePageMeta({ layout: "empty" });

const router = useRouter();

useHead({
  title: "Новый продукт | Konkurent.cases",
  meta: [{ name: "description", content: "Описание страницы" }],
});

// refs для секций
const mainRef = ref<HTMLElement | null>(null);
const pricesRef = ref<HTMLElement | null>(null);
const stocksRef = ref<HTMLElement | null>(null);
const featuresRef = ref<HTMLElement | null>(null);

function scrollTo(section: string) {
  const map: Record<string, HTMLElement | null> = {
    main: mainRef.value,
    prices: pricesRef.value,
    stocks: stocksRef.value,
    features: featuresRef.value,
  };

  const el = map[section];
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
</script>

<template>
  <section class="operations">
    <CreateProductHeader />
    <div class="flex gap-10 mx-auto px-[144px] mt-8">
      <!-- Sidebar ловит клики -->
      <CreateProductSidebar @scrollTo="scrollTo" />

      <div class="right flex-1 px-8">
        <div ref="mainRef">
          <CreateProductMainForm />
        </div>
        <div ref="pricesRef" class="mt-12">
          <CreateProductPrices />
        </div>
        <div ref="stocksRef" class="mt-12">
          <CreateProductStocks />
        </div>
        <div ref="featuresRef" class="mt-12 pb-12">
          <CreateProductFeatures />
        </div>
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
