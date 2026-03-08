<script setup lang="ts">
import { computed } from "vue";
import CreateProductImageUpload from "@/components/products/CreateProductImageUpload.vue";
import { useProductStore } from "@/store/productStore";
import type { ProductTypeLabel, VariationTypeLabel } from "~/types/product-create";

const store = useProductStore();

const isGoods = computed(() => store.form.productType === "Товар");
const isVariantGoods = computed(
  () => isGoods.value && store.form.variationType === "Вариативный",
);
const isSimpleGoods = computed(
  () => isGoods.value && store.form.variationType === "Простой",
);
const isService = computed(() => store.form.productType === "Услуга");
const isBundle = computed(() => store.form.productType === "Комплект");

function selectProductType(type: ProductTypeLabel) {
  store.setProductType(type);
}

function selectVariationType(type: VariationTypeLabel) {
  store.setVariationType(type);
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex gap-4">
      <h3 class="mb-4 text-2xl font-semibold">Основные</h3>
      <div
        class="relative my-4 w-full after:block after:h-[0.8px] after:w-full after:bg-[repeating-linear-gradient(to_right,#6f6f6f_0_12px,transparent_12px_24px)] after:content-['']"
      ></div>
    </div>

    <div>
      <label class="font-base text-lg">Тип продукта</label>
      <div class="mt-4 flex gap-4">
        <UButton
          v-for="type in store.productTypes"
          :key="type"
          color="neutral"
          variant="ghost"
          type="button"
          class="flex w-full items-center justify-start gap-2 rounded-[15px] p-[17px] text-left"
          :class="
            store.form.productType === type
              ? 'bg-[#1f78ff] text-white hover:bg-[#1f78ff] active:bg-[#1f78ff]'
              : 'bg-[#404040] text-white hover:bg-[#5e5e5e] active:bg-[#5e5e5e]'
          "
          @click="selectProductType(type)"
        >
          <span
            class="flex h-3 w-3 items-center justify-center rounded-full border text-xs leading-none"
            :class="
              store.form.productType === type
                ? 'border-white bg-white text-[#1f78ff]'
                : 'border-white text-transparent'
            "
          >
            <Icon name="heroicons:check-20-solid" class="h-3 w-3" />
          </span>
          <span>{{ type }}</span>
        </UButton>
      </div>
    </div>

    <div v-if="isGoods" class="mt-4">
      <label class="font-base text-lg">Вариативность продукта</label>
      <div class="mt-4 flex gap-4">
        <UButton
          v-for="variant in store.productVariants"
          :key="variant"
          color="neutral"
          variant="ghost"
          type="button"
          class="flex w-full items-center justify-start gap-2 rounded-[15px] p-[17px] text-left"
          :class="
            store.form.variationType === variant
              ? 'bg-[#1f78ff] text-white hover:bg-[#1f78ff] active:bg-[#1f78ff]'
              : 'bg-[#404040] text-white hover:bg-[#5e5e5e] active:bg-[#5e5e5e]'
          "
          @click="selectVariationType(variant)"
        >
          <span
            class="flex h-3 w-3 items-center justify-center rounded-full border text-xs leading-none"
            :class="
              store.form.variationType === variant
                ? 'border-white bg-white text-[#1f78ff]'
                : 'border-white text-transparent'
            "
          >
            <Icon name="heroicons:check-20-solid" class="h-3 w-3" />
          </span>
          <span>{{ variant }}</span>
        </UButton>
      </div>
    </div>

    <div class="mt-4">
      <label class="font-base text-lg"
        >Наименование <span class="text-red-500">*</span></label
      >
      <UInput
        v-model="store.form.name"
        type="text"
        placeholder="Введите наименование"
        class="mt-4 w-full"
        :ui="{
          base: 'rounded-[15px] border-0 ring-0 bg-[#404040] p-4 text-[18px] font-semibold text-white placeholder:text-gray-400',
        }"
      />
    </div>

    <div class="mt-4 flex gap-4">
      <div class="w-full">
        <label class="font-medium">Артикул</label>
        <div class="mt-4 flex gap-2 rounded-[15px] bg-[#404040] pr-[15px]">
          <UInput
            v-model="store.form.sku"
            type="text"
            placeholder="Введите артикул"
            class="flex-1"
            :ui="{
              base: 'rounded-[15px] border-0 ring-0 bg-[#404040] p-4 text-[18px] font-semibold text-white placeholder:text-gray-400',
            }"
          />
          <UButton
            color="neutral"
            variant="ghost"
            type="button"
            @click="store.generateCode('article')"
          >
            Сгенерировать
          </UButton>
        </div>
      </div>

      <div v-if="!isVariantGoods" class="w-full">
        <label class="font-medium">Баркод</label>
        <div class="mt-4 flex gap-2 rounded-[15px] bg-[#404040] pr-[15px]">
          <UInput
            v-model="store.form.barcode"
            type="text"
            placeholder="Введите баркод"
            class="flex-1"
            :ui="{
              base: 'rounded-[15px] border-0 ring-0 bg-[#404040] p-4 text-[18px] font-semibold text-white placeholder:text-gray-400',
            }"
          />
          <UButton
            color="neutral"
            variant="ghost"
            type="button"
            @click="store.generateCode('barcode')"
          >
            Сгенерировать
          </UButton>
        </div>
      </div>
    </div>

    <div v-if="isSimpleGoods || isVariantGoods || isService" class="mt-4 flex flex-col">
      <label class="mb-2 font-medium">Единица измерения</label>
      <USelect
        v-model="store.form.unit"
        :items="store.units"
        class="w-full md:w-1/2"
        :ui="{
          base: 'rounded-[15px] border-0 ring-0 bg-[#404040] p-4 text-[18px] font-semibold text-white placeholder:text-gray-400',
        }"
      />
    </div>

    <div class="mt-4">
      <label class="mb-2 font-medium">Фото</label>
      <CreateProductImageUpload v-model="store.form.images" />
    </div>

    <div v-if="isVariantGoods" class="mt-4 rounded-[15px] bg-[#2f2f2f] p-4">
      <h4 class="text-lg font-semibold">Вариации</h4>
      <div class="mt-4">
        <label class="font-medium">Выберите атрибут вариации</label>
        <UInput
          v-model="store.form.variationAttribute"
          type="text"
          class="mt-2 w-full"
          placeholder="Например: Цвет"
          :ui="{
            base: 'rounded-[15px] border-0 ring-0 bg-[#404040] p-4 text-[18px] font-semibold text-white placeholder:text-gray-400',
          }"
        />
      </div>

      <div class="mt-4 space-y-3">
        <div
          v-for="variation in store.form.variations"
          :key="variation.id"
          class="flex items-center gap-3"
        >
          <UInput
            v-model="variation.value"
            type="text"
            class="flex-1"
            placeholder="Название вариации"
            :ui="{
              base: 'rounded-[15px] border-0 ring-0 bg-[#404040] p-4 text-[18px] font-semibold text-white placeholder:text-gray-400',
            }"
          />
          <UButton
            color="neutral"
            variant="ghost"
            type="button"
            class="rounded-lg bg-[#404040]"
            @click="store.removeVariation(variation.id)"
          >
            Удалить
          </UButton>
        </div>
      </div>

      <UButton
        color="primary"
        variant="soft"
        type="button"
        class="mt-4 rounded-lg"
        @click="store.addVariation()"
      >
        Добавить вариацию
      </UButton>
    </div>

    <div v-if="isBundle" class="mt-4 rounded-[15px] bg-[#2f2f2f] p-4">
      <h4 class="text-lg font-semibold">Набор товаров</h4>

      <table class="mt-4 w-full overflow-hidden rounded-lg border-gray-300">
        <thead>
          <tr>
            <th class="p-3 text-left">Товар</th>
            <th class="p-3 text-left">Количество</th>
            <th class="p-3 text-left"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in store.form.bundleItems" :key="item.id" class="border-t border-[#454545]">
            <td class="p-3">
              <UInput
                v-model="item.name"
                type="text"
                placeholder="Введите товар"
                :ui="{
                  base: 'rounded-[15px] border-0 ring-0 bg-[#404040] p-4 text-[18px] font-semibold text-white placeholder:text-gray-400',
                }"
              />
            </td>
            <td class="p-3">
              <UInput
                :model-value="item.quantity"
                type="number"
                min="1"
                class="w-32"
                :ui="{
                  base: 'rounded-[15px] border-0 ring-0 bg-[#404040] p-4 text-[18px] font-semibold text-white placeholder:text-gray-400',
                }"
                @update:model-value="store.setBundleItemQty(item.id, Number($event))"
              />
            </td>
            <td class="p-3 text-right">
              <UButton
                color="neutral"
                variant="ghost"
                type="button"
                class="rounded-lg bg-[#404040]"
                @click="store.removeBundleItem(item.id)"
              >
                Удалить
              </UButton>
            </td>
          </tr>
        </tbody>
      </table>

      <UButton
        color="primary"
        variant="soft"
        type="button"
        class="mt-4 rounded-lg"
        @click="store.addBundleItem()"
      >
        Добавить товар
      </UButton>
    </div>
  </div>
</template>


