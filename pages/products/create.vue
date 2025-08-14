<script setup lang="ts">
import { useRouter } from "vue-router";
import { useHead } from "#imports";

useHead({
  title: "Новый продукт | Konkurent.cases",
  meta: [{ name: "description", content: "Описание страницы" }],
});

definePageMeta({
  layout: "empty",
});

const router = useRouter();

const selectedProductType = ref("Товар");
const selectedVariant = ref("Простой");
const productTypes = ["Товар", "Услуга"];
const productVariants = ["Простой", "Вариативный"];
const units = ["Штука", "Литр", "Килограмм"];
const categories = [
  "аудио-система",
  "пылесос",
  "станция",
  "подставка",
  "стекло",
];

// Ссылки на секции
const mainSection = ref<HTMLElement | null>(null);
const pricesSection = ref<HTMLElement | null>(null);
const stocksSection = ref<HTMLElement | null>(null);
const featuresSection = ref<HTMLElement | null>(null);

function scrollToSection(section: "main" | "prices" | "stocks" | "features") {
  const map = {
    main: mainSection,
    prices: pricesSection,
    stocks: stocksSection,
    features: featuresSection,
  };
  map[section].value?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

const stores = [
  { name: "Globus Mall", qty: 0 },
  { name: "Samarqand Darvoza", qty: 0 },
];

const article = ref("");
const barcode = ref("");

function generateCode(type: "article" | "barcode") {
  const randomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
  if (type === "article") {
    article.value = `ART-${randomCode}`;
  } else {
    barcode.value = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }
}
</script>

<template>
  <section class="operations">
    <!-- Верхняя панель -->
    <div class="border-b sticky top-0 bg-[#262626] z-50">
      <div class="mx-auto px-[144px]">
        <div class="flex justify-between items-center py-[32px]">
          <div class="flex items-center gap-4">
            <div
              class="bg-[#404040] w-[50px] h-[50px] rounded-full flex items-center justify-center cursor-pointer"
              @click="router.back()"
            >
              <Icon
                name="heroicons:chevron-left"
                class="w-5 h-5 text-muted-foreground"
              />
            </div>
            <h2 class="text-[28px] font-bold">Новый продукт</h2>
          </div>
          <button
            class="bg-[#1f78ff] px-[30px] py-[12px] text-[16px] font-semibold rounded-[20px] transition-all duration-300 hover:bg-[#4d94ff]"
          >
            Создать
          </button>
        </div>
      </div>
    </div>

    <div class="flex gap-10 mx-auto px-[144px] mt-8">
      <!-- Навигация -->
      <aside class="bg-[#404040] p-1 rounded-[15px] sticky top-[96px] h-fit">
        <nav class="flex flex-col gap-2">
          <button
            class="bg-[#262626] text-[#4993dd] px-[10px] w-[185px] font-bold py-[10px] text-left rounded-[15px]"
            @click="scrollToSection('main')"
          >
            Основные
          </button>
          <button
            class="hover:bg-[#262626] duration-300 px-[10px] w-[185px] font-bold py-[10px] text-left rounded-[15px]"
            @click="scrollToSection('prices')"
          >
            Цены
          </button>
          <button
            class="hover:bg-[#262626] duration-300 px-[10px] w-[185px] font-bold py-[10px] text-left rounded-[15px]"
            @click="scrollToSection('stocks')"
          >
            Остатки
          </button>
          <button
            class="hover:bg-[#262626] duration-300 px-[10px] w-[185px] font-bold py-[10px] text-left rounded-[15px]"
            @click="scrollToSection('features')"
          >
            Характеристики
          </button>
        </nav>
      </aside>

      <!-- Контент -->
      <div class="right flex-1 px-8">        <!-- Основные -->
        <div class="flex flex-col gap-4" ref="mainSection">
          <h3 class="text-xl font-semibold mb-4">Основные</h3>

          <!-- Тип продукта -->
          <div>
            <label class="font-medium">Тип продукта</label>
            <div class="flex gap-4 mt-4">
              <label
                v-for="type in productTypes"
                :key="type"
                class="cursor-pointer flex items-center justify-center p-[17px] w-full rounded-[15px] transition-colors duration-300"
                :class="
                  selectedProductType === type
                    ? 'bg-[#1f78ff] text-white'
                    : 'bg-[#404040] hover:bg-[#5e5e5e] text-white'
                "
              >
                <input
                  type="radio"
                  name="productType"
                  class="hidden"
                  :value="type"
                  v-model="selectedProductType"
                />
                {{ type }}
              </label>
            </div>
          </div>

          <!-- Вариативность -->
          <div class="mt-6">
            <label class="font-medium">Вариативность продукта</label>
            <div class="flex gap-4 mt-4">
              <label
                v-for="variant in productVariants"
                :key="variant"
                class="cursor-pointer flex items-center justify-center p-[17px] w-full rounded-[15px] transition-colors duration-300"
                :class="
                  selectedVariant === variant
                    ? 'bg-[#1f78ff] text-white'
                    : 'bg-[#404040] hover:bg-[#5e5e5e] text-white'
                "
              >
                <input
                  type="radio"
                  name="variantType"
                  class="hidden"
                  :value="variant"
                  v-model="selectedVariant"
                />
                {{ variant }}
              </label>
            </div>
          </div>

          <!-- Наименование -->
          <div>
            <label class="font-medium"
              >Наименование <span class="text-red-500">*</span></label
            >
            <input
              type="text"
              placeholder="Введите наименование"
              class="w-full mt-4"
            />
          </div>

          <!-- Артикул и Баркод -->
          <div class="flex gap-4">
            <div class="w-full">
              <label class="font-medium">Артикул</label>
              <div
                class="flex gap-2 bg-[#404040] rounded-[15px] pr-[15px] mt-4"
              >
                <input
                  v-model="article"
                  type="text"
                  placeholder="Введите артикул"
                  class="flex-1 bg-transparent rounded-lg"
                />
                <button type="button" @click="generateCode('article')">
                  Генерировать
                </button>
              </div>
            </div>
            <div class="w-full">
              <label class="font-medium">Баркод</label>
              <div
                class="flex gap-2 bg-[#404040] rounded-[15px] pr-[15px] mt-4"
              >
                <input
                  v-model="barcode"
                  type="text"
                  placeholder="Введите баркод"
                  class="flex-1 bg-transparent rounded-lg"
                />
                <button type="button" @click="generateCode('barcode')">
                  Генерировать
                </button>
              </div>
            </div>
          </div>

          <!-- Единица измерения -->
          <div class="flex flex-col">
            <label class="font-medium mb-2">Единица измерения</label>
            <select class="w-1/2 rounded-lg p-3">
              <option v-for="unit in units" :key="unit">{{ unit }}</option>
            </select>
          </div>

          <!-- Фото -->
          <div>
            <label class="font-medium mb-2">Фото</label>
            <div
              class="mt-4 flex flex-col items-center justify-center gap-6 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer bg-[#404040] hover:bg-[#5e5e5e] transition-colors duration-300"
            >
              <p>Перетащите фото в эту область</p>
              <p class="text-sm text-gray-500">- или -</p>
              <p class="text-blue-500">Нажмите для обзора</p>
            </div>
          </div>
        </div>

        <!-- Цены -->
        <section ref="pricesSection" class="mt-12">
          <h3 class="text-xl font-semibold mb-4">Цены</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="font-medium">Цена прихода</label>
              <input
                type="number"
                class="w-full mt-4 rounded-lg p-3"
                placeholder="0"
              />
            </div>
            <div>
              <label class="font-medium">Наценка (%)</label>
              <input
                type="number"
                class="w-full mt-4 rounded-lg p-3"
                placeholder="0"
              />
            </div>
            <div>
              <label class="font-medium">Цена продажи</label>
              <input
                type="number"
                class="w-full mt-4 rounded-lg p-3"
                placeholder="0"
              />
            </div>
          </div>
        </section>

        <!-- Остатки -->
        <section ref="stocksSection" class="mt-12">
          <h3 class="text-xl font-semibold">Остатки</h3>
          <table class="w-full border-gray-300 rounded-lg overflow-hidden mt-8">
            <thead>
              <tr>
                <th class="p-3 text-left">Магазин</th>
                <th class="p-3 text-left">Кол-во</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="store in stores" :key="store.name" class="border-t">
                <td class="p-3">{{ store.name }}</td>
                <td class="p-3">
                  <input
                    type="number"
                    class="w-24 rounded-lg p-2"
                    :placeholder="store.qty"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <!-- Характеристики -->
        <section ref="featuresSection" class="mt-12 pb-12">
          <h3 class="text-xl font-semibold">Характеристики</h3>
          <div class="flex justify-between gap-4 mt-8">
            <div class="flex flex-col w-full">
              <label class="font-medium mb-2">Бренд</label>
              <input
                type="text"
                placeholder="Введите бренд"
                class="rounded-lg p-3"
              />
            </div>
            <div class="flex flex-col w-full">
              <label class="font-medium mb-2">Поставщик</label>
              <input
                type="text"
                placeholder="Введите поставщика"
                class="rounded-lg p-3"
              />
            </div>
            <div class="flex flex-col w-full">
              <label class="font-medium mb-2">Категория</label>
              <select class="rounded-lg p-3">
                <option v-for="cat in categories" :key="cat">{{ cat }}</option>
              </select>
            </div>
          </div>
        </section>
      </div>
    </div>
  </section>
</template>

<style scoped>
input,
select {
  @apply bg-[#404040] p-[15px] text-[16px] font-semibold rounded-[15px] transition-all duration-300 hover:bg-[#5e5e5e];
}
.right {
  overflow: visible; /* убираем скролл */
  height: auto;      /* убираем фиксированную высоту */
}
html, body {
  overflow-x: hidden; /* убираем горизонтальный скролл */
}

</style>
