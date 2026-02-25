<script setup lang="ts">
import { useProductStore } from "@/store/productStore";

const store = useProductStore();
</script>

<template>
  <div class="flex flex-col gap-4">
    <h3 class="mb-4 text-xl font-semibold">Основные</h3>

    <div>
      <label class="font-medium">Тип товара</label>
      <div class="mt-4 flex gap-4">
        <UButton
          v-for="type in store.productTypes"
          :key="type"
          color="neutral"
          variant="ghost"
          class="flex w-full items-center justify-center rounded-[15px] p-[17px]"
          :class="
            store.selectedProductType === type
              ? 'bg-[#1f78ff] text-white'
              : 'bg-[#404040] text-white hover:bg-[#5e5e5e]'
          "
          @click="store.selectedProductType = type"
        >
          {{ type }}
        </UButton>
      </div>
    </div>

    <div class="mt-6">
      <label class="font-medium">Вариантность товара</label>
      <div class="mt-4 flex gap-4">
        <UButton
          v-for="variant in store.productVariants"
          :key="variant"
          color="neutral"
          variant="ghost"
          class="flex w-full items-center justify-center rounded-[15px] p-[17px]"
          :class="
            store.selectedVariant === variant
              ? 'bg-[#1f78ff] text-white'
              : 'bg-[#404040] text-white hover:bg-[#5e5e5e]'
          "
          @click="store.selectedVariant = variant"
        >
          {{ variant }}
        </UButton>
      </div>
    </div>

    <div>
      <label class="font-medium"
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

    <div class="flex gap-4">
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
        class="w-1/2"
        :ui="{ base: 'rounded-lg bg-[#404040] p-3 text-white ring-0' }"
      />
    </div>

    <div>
      <label class="mb-2 font-medium">Фото</label>
      <UButton
        color="neutral"
        variant="ghost"
        class="mt-4 flex cursor-pointer flex-col items-center justify-center gap-6 rounded-lg border-2 border-dashed border-gray-300 bg-[#404040] p-6 text-center hover:bg-[#5e5e5e]"
      >
        <p>Перетащите файл или нажмите для загрузки</p>
        <p class="text-sm text-gray-500">- или -</p>
        <p class="text-blue-500">Выберите файл с устройства</p>
      </UButton>
    </div>
  </div>
</template>
