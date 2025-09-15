<template>
  <section class="bg-[#262626] text-white rounded-2xl flex h-full min-h-screen">
    <!-- Левая часть -->
    <div class="w-full border-r border-[#404040] pr-7 h-full flex flex-col overflow-y-auto">
      <SearchBar />
      <Cart />
    </div>

    <!-- Правая часть -->
    <div class="pl-[15px] flex flex-col w-[450px] h-full">
      <ClientForm />
      <DiscountSwitcher />
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
</script>
