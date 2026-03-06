<script setup lang="ts">
import { useProductStore } from "@/store/productStore";

const store = useProductStore();
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex gap-4">
      <h3 class="mb-4 text-2xl font-semibold">Основные</h3>
      <div
        class="relative my-4 w-full after:block after:h-[0.8px] after:w-full after:bg-[repeating-linear-gradient(to_right,#6f6f6f_0_12px,transparent_12px_24px)] after:content-['']"
      ></div>
    </div>

    <div class="">
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
            store.selectedProductType === type
              ? 'bg-[#1f78ff] text-white hover:bg-[#1f78ff] active:bg-[#1f78ff]'
              : 'bg-[#404040] text-white hover:bg-[#5e5e5e] active:bg-[#5e5e5e]'
          "
          @click="store.selectedProductType = type"
        >
          <span
            class="flex h-3 w-3 items-center justify-center rounded-full border text-xs leading-none"
            :class="
              store.selectedProductType === type
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
    <div class="mt-4">
      <label class="font-base text-lg">Вариативность товара</label>
      <div class="mt-4 flex gap-4">
        <UButton
          v-for="variant in store.productVariants"
          :key="variant"
          color="neutral"
          variant="ghost"
          type="button"
          class="flex w-full items-center justify-start gap-2 rounded-[15px] p-[17px] text-left"
          :class="
            store.selectedVariant === variant
              ? 'bg-[#1f78ff] text-white hover:bg-[#1f78ff] active:bg-[#1f78ff]'
              : 'bg-[#404040] text-white hover:bg-[#5e5e5e] active:bg-[#5e5e5e]'
          "
          @click="store.selectedVariant = variant"
        >
          <span
            class="flex h-3 w-3 items-center justify-center rounded-full border text-xs leading-none"
            :class="
              store.selectedVariant === variant
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
        v-model="store.name"
        type="text"
        placeholder="Введите наименование"
        class="mt-4 w-full"
        :ui="{
          base: 'rounded-[15px] bg-[#404040] p-[15px] text-[16px] font-semibold text-white',
        }"
      />
    </div>

    <div class="flex gap-4 mt-4">
      <div class="w-full">
        <label class="font-medium">Артикул</label>
        <div class="mt-4 flex gap-2 rounded-[15px] bg-[#404040] pr-[15px]">
          <UInput
            v-model="store.article"
            type="text"
            placeholder="Введите артикул"
            class="flex-1"
            :ui="{ base: 'bg-transparent p-[15px] text-white ring-0' }"
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

      <div class="w-full">
        <label class="font-medium">Штрихкод</label>
        <div class="mt-4 flex gap-2 rounded-[15px] bg-[#404040] pr-[15px]">
          <UInput
            v-model="store.barcode"
            type="text"
            placeholder="Введите штрихкод"
            class="flex-1"
            :ui="{ base: 'bg-transparent p-[15px] text-white ring-0' }"
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

    <div class="flex flex-col">
      <label class="mb-2 font-medium">Единица измерения</label>
      <USelect
        v-model="store.selectedUnit"
        :items="store.units"
        class="w-full md:w-1/2"
        :ui="{ base: 'rounded-lg bg-[#404040] p-3 text-white ring-0' }"
      />
    </div>

    <div>
      <label class="mb-2 font-medium">Фото</label>
      <UButton
        color="neutral"
        variant="ghost"
        type="button"
        class="mt-4 flex cursor-pointer flex-col items-center justify-center gap-6 rounded-lg border-2 border-dashed border-gray-300 bg-[#404040] p-6 text-center hover:bg-[#5e5e5e]"
      >
        <p>Перетащите файл или нажмите для загрузки</p>
        <p class="text-sm text-gray-500">- или -</p>
        <p class="text-blue-500">Выберите файл с устройства</p>
      </UButton>
    </div>
  </div>
</template>
