<script setup lang="ts">
import { useCatalogDataTableStore } from "@/store/DataTables/catalogDataTableStore";

const store = useCatalogDataTableStore();
const selectedProduct = computed(() => store.selectedProduct);
const showProductSidebar = computed(() => !!store.selectedProduct);

function closeSidebar() {
  store.closeProductSidebar();
}
</script>

<template>
  <transition name="slide">
    <teleport to="body">
      <div
        v-if="showProductSidebar"
        class="fixed top-0 right-0 h-full w-full max-w-[768px] bg-[#2b2b2b] text-white shadow-lg px-16 py-14 rounded-l-[60px] z-[9999] overflow-y-auto"
      >
        <!-- Заголовок -->
        <div class="flex justify-between items-center mb-6">
          <div class="border-gray-600 flex gap-[20px]">
            <img
              src="../../assets/images/placeholder_img.svg"
              alt=""
              class="rounded-[20px] w-[60px] h-[60px] object-cover"
            />
            <div class="flex flex-col font-semibold">
              <p class="text-[24px]">{{ selectedProduct?.name }}</p>
              <p class="text-[#bdbdbd] text-[16px]">
                {{ selectedProduct?.sku }} / {{ selectedProduct?.barcode }} /
                {{ selectedProduct?.category }} /
                {{ selectedProduct?.sale_price }} UZS
              </p>
            </div>
          </div>
          <button
            @click="closeSidebar"
            class="flex items-center justify-center text-white bg-[#404040] rounded-full w-10 h-10 hover:bg-gray-400"
          >
            <Icon name="heroicons:x-mark" class="w-6 h-6" />
          </button>
        </div>
        <div class="mb-6">
          <h3 class="text-lg font-bold mb-3">История продукта</h3>
          <table
            class="w-full text-sm border border-gray-700 rounded-lg overflow-hidden"
          >
            <thead class="bg-[#3a3a3a] text-left">
              <tr>
                <th class="p-2">Дата</th>
                <th class="p-2">Действие</th>
                <th class="p-2">Кол-во</th>
                <th class="p-2">Магазин</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-t border-gray-700">
                <td class="p-2">18.08.2025<br />16:02:42</td>
                <td class="p-2">Импорт #892933</td>
                <td class="p-2">1</td>
                <td class="p-2">Samarqand Darvoza</td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Цены -->
        <div class="mb-6">
          <h3 class="text-lg font-bold mb-3">Цены</h3>
          <table
            class="w-full text-sm border border-gray-700 rounded-lg overflow-hidden"
          >
            <thead class="bg-[#3a3a3a] text-left">
              <tr>
                <th class="p-2">Магазин</th>
                <th class="p-2">Цена поставки</th>
                <th class="p-2">Наценка</th>
                <th class="p-2">Цена продажи</th>
                <th class="p-2">Оптовая</th>
                <th class="p-2">Скидочная</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-t border-gray-700">
                <td class="p-2">Samarqand Darvoza</td>
                <td class="p-2">70 000 UZS</td>
                <td class="p-2">164.28 %</td>
                <td class="p-2">185 000 UZS</td>
                <td class="p-2">-</td>
                <td class="p-2">-</td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Остатки -->
        <div class="mb-6">
          <h3 class="text-lg font-bold mb-3">Остатки</h3>
          <table
            class="w-full text-sm border border-gray-700 rounded-lg overflow-hidden"
          >
            <thead class="bg-[#3a3a3a] text-left">
              <tr>
                <th class="p-2">Магазин</th>
                <th class="p-2">Активные</th>
                <th class="p-2">Неактивные</th>
                <th class="p-2">Малый остаток</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-t border-gray-700">
                <td class="p-2">Samarqand Darvoza</td>
                <td class="p-2">1</td>
                <td class="p-2">0</td>
                <td class="p-2">0</td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Характеристики -->
        <div class="mb-6">
          <h3 class="text-lg font-bold mb-3">Характеристики</h3>
          <div class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-[#bdbdbd]">
            <p><b>Артикул:</b> XSN-29015</p>
            <p><b>Баркод:</b> 2000000013404</p>
            <p><b>Ед. изм.:</b> Штука</p>
            <p><b>Бренд:</b> -</p>
            <p><b>Весовой продукт:</b> Нет</p>
            <p><b>Маркировка:</b> Нет</p>
            <p><b>Поставщики:</b> -</p>
            <p><b>Категория:</b> Товар</p>
          </div>
        </div>
      </div>
    </teleport>
  </transition>
</template>
