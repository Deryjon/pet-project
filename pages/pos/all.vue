<template>
    <section class="bg-[#262626] text-white rounded-2xl flex h-full ">
      <!-- Левая часть -->
      <div class="w-full border-r border-[#404040] pr-7 h-full flex flex-col overflow-y-auto">
        <PosAll />
      </div>
  
      <!-- Правая часть -->
      <div class="pl-[15px] flex flex-col justify-between w-[450px] h-full">
        
      </div>
    </section>
  </template>
  
  <script setup lang="ts">
  import PosAll from "@/components/pos/PosAll.vue";
  import ClientForm from "@/components/pos/ClientForm.vue";
  import DiscountSwitcher from "@/components/pos/DiscountSwitcher.vue";
  import Summary from "@/components/pos/SummaryBlock.vue";
  
  import { useHead } from "#imports";
  useHead({ title: "Все продажи | Konkurent.cases" });
  </script>
  