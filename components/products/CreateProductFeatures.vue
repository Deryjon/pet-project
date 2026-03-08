<script setup lang="ts">
import { computed } from "vue";
import { useProductStore } from "@/store/productStore";

const store = useProductStore();

const isVariantGoods = computed(
  () =>
    store.form.productType === "Товар" &&
    store.form.variationType === "Вариативный",
);
</script>

<template>
  <section>
    <h3 class="text-xl font-semibold">Характеристики</h3>
    <div class="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
      <div class="flex w-full flex-col">
        <label class="mb-2 text-base font-medium">Бренд</label>
        <UInput
          v-model="store.form.attributes.brand"
          type="text"
          placeholder="Введите бренд"
          class="w-full"
          :ui="{ base: 'rounded-[15px] border-0 ring-0 bg-[#404040] p-4 text-[18px] font-semibold text-white placeholder:text-gray-400' }"
        />
      </div>

      <div class="flex w-full flex-col">
        <label class="mb-2 text-base font-medium">Поставщик</label>
        <UInput
          v-model="store.form.attributes.supplier"
          type="text"
          placeholder="Введите поставщика"
          class="w-full"
          :ui="{ base: 'rounded-[15px] border-0 ring-0 bg-[#404040] p-4 text-[18px] font-semibold text-white placeholder:text-gray-400' }"
        />
      </div>

      <div v-if="!isVariantGoods" class="flex w-full flex-col md:col-span-2">
        <label class="mb-2 text-base font-medium">Опциональное поле</label>
        <UInput
          v-model="store.form.attributes.optionalField"
          type="text"
          placeholder="Дополнительное поле, характеризующее ваш товар"
          class="w-full"
          :ui="{ base: 'rounded-[15px] border-0 ring-0 bg-[#404040] p-4 text-[18px] font-semibold text-white placeholder:text-gray-400' }"
        />
      </div>

      <div v-if="!isVariantGoods" class="relative flex w-full flex-col md:col-span-2">
        <label class="mb-2 text-base font-medium">Категория</label>
        <USelect
          v-model="store.form.category"
          :items="store.categories"
          placeholder="Выберите категорию"
          class="w-full"
          :ui="{
            base: 'rounded-[15px] border-0 ring-0 bg-[#404040] p-4 text-[18px] font-semibold text-white placeholder:text-gray-400',
          }"
        />
      </div>
    </div>
  </section>
</template>


