<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

const emit = defineEmits<{
  (e: "open-menu"): void;
}>();

const route = useRoute();

const items = [
  {
    label: "Главная",
    icon: "heroicons:home-solid",
    to: "/dashboard",
    match: ["/dashboard"],
  },
  {
    label: "Каталог",
    icon: "heroicons:squares-2x2-solid",
    to: "/products/catalog",
    match: ["/products"],
  },
  {
    label: "Продажа",
    icon: "heroicons:shopping-bag-solid",
    to: "/order/new-order",
    match: ["/order/new-order"],
  },
  {
    label: "Транзакции",
    icon: "heroicons:receipt-percent-solid",
    to: "/order/all",
    match: ["/order/all"],
  },
];

const isMenuActive = computed(() =>
  ["/settings", "/management"].some(
    (prefix) => route.path === prefix || route.path.startsWith(`${prefix}/`)
  )
);

function isItemActive(matchers: string[]) {
  return matchers.some(
    (prefix) => route.path === prefix || route.path.startsWith(`${prefix}/`)
  );
}
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[rgba(24,24,24,0.96)] px-2 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 backdrop-blur-xl lg:hidden"
  >
    <div class="grid grid-cols-5 gap-1 rounded-[24px] bg-[#2a2a2a]/95 p-1 shadow-[0_-12px_30px_rgba(0,0,0,0.22)]">
      <NuxtLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="flex min-w-0 flex-col items-center justify-center gap-1 rounded-[18px] px-1 py-2 text-center transition-colors"
        :class="
          isItemActive(item.match)
            ? 'bg-[#1f78ff] text-white'
            : 'text-[#bdbdbd] hover:bg-white/5 hover:text-white'
        "
      >
        <Icon :name="item.icon" class="h-5 w-5 shrink-0" />
        <span class="truncate text-[11px] font-medium">{{ item.label }}</span>
      </NuxtLink>

      <button
        type="button"
        class="flex min-w-0 flex-col items-center justify-center gap-1 rounded-[18px] px-1 py-2 text-center transition-colors"
        :class="
          isMenuActive
            ? 'bg-[#1f78ff] text-white'
            : 'text-[#bdbdbd] hover:bg-white/5 hover:text-white'
        "
        @click="emit('open-menu')"
      >
        <Icon name="heroicons:bars-3-bottom-left-20-solid" class="h-5 w-5 shrink-0" />
        <span class="truncate text-[11px] font-medium">Меню</span>
      </button>
    </div>
  </nav>
</template>
