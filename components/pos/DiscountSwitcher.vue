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

    <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div class="min-w-0 flex-1">
        <UInput
          :model-value="discountInput"
          @update:model-value="onDiscountInput"
          class="w-full"
          type="text"
          inputmode="numeric"
          size="xl"
          color="neutral"
          variant="none"
          :placeholder="inputPlaceholder"
          :ui="{
            root: 'w-full',
            base: 'h-[52px] rounded-[15px] border-0 bg-[#404040] px-4 text-[15px] font-semibold text-white placeholder:text-[#8f8f8f] focus:outline-none focus:ring-0 sm:h-[58px] sm:text-[17px]',
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

      <div class="flex w-full rounded-[15px] bg-[#404040] p-1 sm:max-w-[180px]">
        <button type="button" :class="switcherClass('%')" @click="setType('%')">%</button>
        <button type="button" :class="switcherClass('uzs')" @click="setType('uzs')">uzs</button>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-2 sm:flex sm:items-center">
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
import { storeToRefs } from "pinia";
import { useCartStore } from "~/store/cart";

const cartStore = useCartStore();
const { subtotal, itemDiscounts } = storeToRefs(cartStore);
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
  activeSwitcher.value === "%" ? "Введите скидку %" : "Введите итоговую сумму"
);

const hasDiscount = computed(() => Number(cartStore.discountValue || 0) > 0);
const globalDiscountBase = computed(() =>
  Math.max(0, Number(subtotal.value || 0) - Number(itemDiscounts.value || 0))
);
const discountInput = computed(() =>
  activeSwitcher.value === "uzs"
    ? formatCommaMoney(Math.max(0, globalDiscountBase.value - Number(cartStore.discountValue || 0)))
    : String(cartStore.discountValue || "")
);

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
  if (activeSwitcher.value === "%") {
    cartStore.discountValue = value;
  } else {
    cartStore.discountValue =
      value > 0 ? Math.max(0, globalDiscountBase.value - value) : 0;
  }
  if (!cartStore.saleId) {
    cartStore.payableTotal = 0 as any;
  }
}

function resetDiscount() {
  cartStore.discountValue = 0;
  if (!cartStore.saleId) {
    cartStore.payableTotal = 0 as any;
  }
}

function shortMoney(value: number) {
  if (value >= 1000000) return `${value / 1000000}M`;
  if (value >= 1000) return `${value / 1000}K`;
  return String(value);
}

function formatCommaMoney(value: number | string) {
  const numeric = Number(value || 0);
  return numeric.toLocaleString("ru-RU");
}

function onDiscountInput(value: string | number) {
  const raw = String(value ?? "");

  if (activeSwitcher.value === "%") {
    const numeric = Number(raw.replace(/[^\d.]/g, ""));
    cartStore.discountValue = Number.isFinite(numeric) ? numeric : 0;
  } else {
    const numeric = Number(raw.replace(/[^\d]/g, ""));
    const finalAmount = Number.isFinite(numeric) ? numeric : 0;
    cartStore.discountValue =
      finalAmount > 0 ? Math.max(0, globalDiscountBase.value - finalAmount) : 0;
  }

  if (!cartStore.saleId) {
    cartStore.payableTotal = 0 as any;
  }
}

function switcherClass(type: "%" | "uzs") {
  return [
    'w-1/2 rounded-[12px] p-3 text-center text-[13px] font-semibold uppercase transition sm:text-[14px]',
    activeSwitcher.value === type
      ? 'bg-[#262626] text-white'
      : 'text-[#bdbdbd] hover:bg-[#5e5e5e]'
  ];
}

function presetClass(value: number) {
  const isActive = activeSwitcher.value === "%"
    ? Number(cartStore.discountValue || 0) === value
    : Math.max(0, globalDiscountBase.value - Number(cartStore.discountValue || 0)) === value;
  return [
    'rounded-[15px] p-3 text-center text-[13px] text-white transition sm:flex-1 sm:text-base',
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
