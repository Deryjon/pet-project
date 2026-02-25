<script setup lang="ts">
import { ref, watch } from "vue";
import { useProductStore } from "@/store/productStore";

const store = useProductStore();
const internalUpdate = ref(false);

watch([() => store.purchase_price, () => store.markup_percent], ([pp, mu]) => {
  internalUpdate.value = true;
  const p = Number(pp) || 0;
  const m = Number(mu) || 0;
  store.sale_price = Math.round(p * (1 + m / 100) * 100) / 100;
  queueMicrotask(() => {
    internalUpdate.value = false;
  });
});

watch(
  () => store.sale_price,
  (sp) => {
    if (internalUpdate.value) return;

    const p = Number(store.purchase_price) || 0;
    const s = Number(sp) || 0;
    if (p > 0) {
      const mu = ((s - p) / p) * 100;
      store.markup_percent = Math.round(mu * 100) / 100;
    } else {
      store.markup_percent = 0;
    }
  }
);
</script>

<template>
  <section>
    <h3 class="mb-4 text-xl font-semibold">Цены</h3>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div>
        <label class="font-medium">Закупочная цена</label>
        <UInput
          v-model.number="store.purchase_price"
          type="number"
          class="mt-4 w-full"
          placeholder="0"
          :ui="{ base: 'rounded-lg p-3 text-white bg-[#404040] ring-0' }"
        />
      </div>
      <div>
        <label class="font-medium">Наценка (%)</label>
        <UInput
          v-model.number="store.markup_percent"
          type="number"
          class="mt-4 w-full"
          placeholder="0"
          :ui="{ base: 'rounded-lg p-3 text-white bg-[#404040] ring-0' }"
        />
      </div>
      <div>
        <label class="font-medium">Цена продажи</label>
        <UInput
          v-model.number="store.sale_price"
          type="number"
          class="mt-4 w-full"
          placeholder="0"
          :ui="{ base: 'rounded-lg p-3 text-white bg-[#404040] ring-0' }"
        />
      </div>
    </div>
  </section>
</template>
