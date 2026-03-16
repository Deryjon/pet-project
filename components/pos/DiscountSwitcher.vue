<template>
  <div class="mt-6 flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <div>
        <label class="block text-[18px] font-semibold">Скидка</label>
      </div>

      <button
        v-if="hasDiscount"
        type="button"
        class="rounded-[12px] px-3 py-2 text-[13px] font-semibold text-[#4993dd] transition hover:bg-white/5"
        @click="resetDiscount"
      >
        Сбросить
      </button>
    </div>

    <div class="flex items-center gap-2">
      <div class="min-w-0 flex-1">
        <UInput
          v-model.number="cartStore.discountValue"
          class="w-full"
          type="number"
          size="xl"
          color="neutral"
          variant="none"
          :placeholder="inputPlaceholder"
          :ui="{
            root: 'w-full',
            base: 'h-[58px] rounded-[15px] border-0 bg-[#404040] px-4 text-[17px] font-semibold text-white placeholder:text-[#8f8f8f] focus:outline-none focus:ring-0',
            trailing: 'pe-4'
          }"
        >
          <template #trailing>
            <span class="text-[12px] font-bold uppercase tracking-[0.08em] text-[#8f8f8f]">
              {{ activeSwitcher }}
            </span>
          </template>
        </UInput>
      </div>

      <div class="flex w-full max-w-[180px] rounded-[15px] bg-[#404040] p-1">
        <button type="button" :class="switcherClass('%')" @click="setType('%')">%</button>
        <button type="button" :class="switcherClass('uzs')" @click="setType('uzs')">uzs</button>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <button
        v-for="item in options"
        :key="item.value"
        type="button"
        :class="presetClass(item.value)"
        @click="applyQuickDiscount(item.value)"
      >
        {{ item.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useCartStore } from "~/store/cart";

const cartStore = useCartStore();
const { formatPrice } = useFormatPrice();
const activeSwitcher = ref<"%" | "uzs">(cartStore.discountType);

const percentOptions = [15, 30, 50, 75];
const uzsOptions = [50000, 100000, 500000, 1000000];

const options = computed(() =>
  activeSwitcher.value === "%"
    ? percentOptions.map((value) => ({ value, label: `${value}%` }))
    : uzsOptions.map((value) => ({ value, label: shortMoney(value) }))
);

const inputPlaceholder = computed(() =>
  activeSwitcher.value === "%" ? "Введите скидку %" : "Введите сумму"
);

const hasDiscount = computed(() => Number(cartStore.discountValue || 0) > 0);

const statusText = computed(() => {
  if (cartStore.discountLoading) return "Применяем скидку...";

  const value = Number(cartStore.discountValue || 0);
  if (!value) return activeSwitcher.value === "%" ? "Скидка в процентах" : "Скидка в сумме";

  return activeSwitcher.value === "%"
    ? `Текущая скидка: ${value}%`
    : `Текущая скидка: ${formatPrice(value)} UZS`;
});

watch(
  () => cartStore.discountType,
  (value) => {
    activeSwitcher.value = value;
  }
);

function setType(type: "%" | "uzs") {
  if (activeSwitcher.value === type) return;
  activeSwitcher.value = type;
  cartStore.discountType = type;
  cartStore.discountValue = 0;
}

function applyQuickDiscount(value: number) {
  cartStore.discountValue = value;
}

function resetDiscount() {
  cartStore.discountValue = 0;
}

function shortMoney(value: number) {
  if (value >= 1000000) return `${value / 1000000}M`;
  if (value >= 1000) return `${value / 1000}K`;
  return String(value);
}

function switcherClass(type: "%" | "uzs") {
  return [
    'w-1/2 rounded-[12px] p-3 text-center text-[14px] font-semibold uppercase transition',
    activeSwitcher.value === type
      ? 'bg-[#262626] text-white'
      : 'text-[#bdbdbd] hover:bg-[#5e5e5e]'
  ];
}

function presetClass(value: number) {
  const isActive = Number(cartStore.discountValue || 0) === value;
  return [
    'flex-1 rounded-[15px] p-3 text-center text-white transition',
    isActive ? 'bg-[#262626] ring-1 ring-[#4993dd]' : 'bg-[#404040] hover:bg-[#5e5e5e]'
  ];
}

let t: ReturnType<typeof setTimeout> | null = null;
watch(
  () => [cartStore.discountType, cartStore.discountValue],
  () => {
    if (t) clearTimeout(t);
    t = setTimeout(() => {
      cartStore.applySaleDiscount();
    }, 400);
  }
);

onBeforeUnmount(() => {
  if (t) clearTimeout(t);
});
</script>