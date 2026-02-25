<script setup lang="ts">
const props = defineProps<{
  activeSection: "main" | "prices" | "stocks" | "features";
}>();

const emit = defineEmits<{
  (e: "scrollTo", section: string): void;
}>();

function go(section: string) {
  emit("scrollTo", section);
}
</script>

<template>
  <aside class="sticky top-[96px] h-fit rounded-[12px] bg-[#404040] p-1">
    <nav class="flex flex-col gap-1">
      <UButton
        color="neutral"
        variant="ghost"
        class="w-[185px] rounded-[12px] px-5 py-4 text-left font-bold"
        :class="
          props.activeSection === 'main'
            ? 'bg-[#262626] text-[#4993dd]'
            : 'text-white hover:bg-[#262626]'
        "
        @click="go('main')"
      >
        Основные
      </UButton>

      <UButton
        color="neutral"
        variant="ghost"
        class="w-[185px] rounded-[12px] px-5 py-4 text-left font-bold"
        :class="
          props.activeSection === 'prices'
            ? 'bg-[#262626] text-[#4993dd]'
            : 'text-white hover:bg-[#262626]'
        "
        @click="go('prices')"
      >
        Цены
      </UButton>

      <UButton
        color="neutral"
        variant="ghost"
        class="w-[185px] rounded-[12px] px-5 py-4 text-left font-bold"
        :class="
          props.activeSection === 'stocks'
            ? 'bg-[#262626] text-[#4993dd]'
            : 'text-white hover:bg-[#262626]'
        "
        @click="go('stocks')"
      >
        Остатки
      </UButton>

      <UButton
        color="neutral"
        variant="ghost"
        class="w-[185px] rounded-[12px] px-5 py-4 text-left font-bold"
        :class="
          props.activeSection === 'features'
            ? 'bg-[#262626] text-[#4993dd]'
            : 'text-white hover:bg-[#262626]'
        "
        @click="go('features')"
      >
        Характеристики
      </UButton>
    </nav>
  </aside>
</template>
