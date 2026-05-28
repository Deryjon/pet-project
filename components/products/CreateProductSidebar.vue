<script setup lang="ts">
const props = defineProps<{
  activeSection: "main" | "prices" | "stocks" | "features";
  showStocks: boolean;
}>();

const emit = defineEmits<{
  (e: "scrollTo", section: string): void;
}>();

function go(section: string) {
  emit("scrollTo", section);
}
</script>

<template>
  <aside class="w-full self-start overflow-x-auto rounded-[12px] bg-[#404040] p-1 lg:sticky lg:top-[120px] lg:w-auto">
    <nav class="flex min-w-max gap-1 lg:min-w-0 lg:flex-col">
      <UButton
        color="neutral"
        variant="ghost"
        class="min-w-fit whitespace-nowrap rounded-[12px] px-4 py-3 text-left font-bold lg:w-[185px] lg:px-5 lg:py-4"
        :class="props.activeSection === 'main' ? 'bg-[#262626] text-white' : 'text-white hover:bg-[#262626]'"
        @click="go('main')"
      >
        Основные
      </UButton>

      <UButton
        color="neutral"
        variant="ghost"
        class="min-w-fit whitespace-nowrap rounded-[12px] px-4 py-3 text-left font-bold lg:w-[185px] lg:px-5 lg:py-4"
        :class="props.activeSection === 'prices' ? 'bg-[#262626] text-white' : 'text-white hover:bg-[#262626]'"
        @click="go('prices')"
      >
        Цены
      </UButton>

      <UButton
        v-if="props.showStocks"
        color="neutral"
        variant="ghost"
        class="min-w-fit whitespace-nowrap rounded-[12px] px-4 py-3 text-left font-bold lg:w-[185px] lg:px-5 lg:py-4"
        :class="props.activeSection === 'stocks' ? 'bg-[#262626] text-white' : 'text-white hover:bg-[#262626]'"
        @click="go('stocks')"
      >
        Остатки
      </UButton>

      <UButton
        color="neutral"
        variant="ghost"
        class="min-w-fit whitespace-nowrap rounded-[12px] px-4 py-3 text-left font-bold lg:w-[185px] lg:px-5 lg:py-4"
        :class="props.activeSection === 'features' ? 'bg-[#262626] text-white' : 'text-white hover:bg-[#262626]'"
        @click="go('features')"
      >
        Характеристики
      </UButton>
    </nav>
  </aside>
</template>
