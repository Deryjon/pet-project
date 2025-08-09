<script setup lang="ts">
import { useRouter } from "vue-router";


definePageMeta({
  layout: "empty",
});

const router = useRouter();

const operations = [
{ title: "Печать ценников", slug: "print-tag" },
  { title: "Настройка малого остатка", slug: "small-left" },
  { title: "Изменить свойства продуктов", slug: "product-property" },
  { title: "Изменить цены продуктов", slug: "product-price" },
  { title: "Загрузить фото к продуктам", slug: "upload-photos" },
  { title: "Архивация продуктов", slug: "archive" },
];

function goTo(slug: string) {
  router.push(`/products/settings/${slug}`);
}
</script>

<template>
  <section class="operations">
    <!-- Полоска на всю ширину -->
    <div class="border-b">
      <div class="mx-auto px-[144px]">
        <div class="top flex items-center gap-4 py-[32px]">
          <div
            class="exit bg-[#404040] w-[50px] h-[50px] rounded-full flex items-center justify-center cursor-pointer"
            @click="router.back()"
          >
            <Icon
              name="heroicons:chevron-left"
              class="w-5 h-5 text-muted-foreground"
            />
          </div>
          <h2 class="text-[28px] font-bold">Массовые операции</h2>
        </div>
      </div>
    </div>

    <div class="mx-auto px-[144px] mt-8">
      <p class="text-[18px] font-bold mb-6">Выберите тип массовых операций:</p>

      <div class="grid grid-cols-2 gap-6">
        <div
          v-for="operation in operations"
          :key="operation.slug"
          class="bg-[#404040] rounded-[15px] py-[48px] px-[16px] text-white text-center font-bold text-[18px] hover:bg-[#5e5e5e] transition-colors duration-300 cursor-pointer flex items-center justify-between"
          @click="goTo(operation.slug)"
        >
          {{ operation.title }}
          <Icon
              name="heroicons:chevron-right"
              class="w-5 h-5 text-muted-foreground"
            />
        </div>
      </div>
    </div>
  </section>
</template>
