<script setup lang="ts">
import { ref, watch, computed, h } from "vue";
import { formatCurrency, parseCurrency } from "@/utils/formatters"; // Assuming formatter utility

const props = defineProps<{
  productId: string | null;
  open: boolean;
}>();

const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
  (e: "close"): void;
}>();

const isAddStockModalOpen = ref(false);
const stockToAdd = ref(1);
const receiptPrice = ref(0);
const supplier = ref("");
const formattedReceiptPrice = ref("");

const productDetails = ref<any>(null); // Replace 'any' with actual product detail type
const productHistory = ref<any[]>([]); // Replace 'any' with actual history item type

const isLoadingDetails = ref(false);
const isLoadingHistory = ref(false);

const closeSlideover = () => {
  emit("update:open", false);
  emit("close");
};

const fetchProductDetails = async (id: string) => {
  isLoadingDetails.value = true;
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  productDetails.value = {
    id: id,
    name: "Молоко 3.2%",
    sku: "MK001",
    barcode: "1234567890123",
    price: 50000,
    stock: 100,
    status: 'active',
    description: "Молоко пастеризованное, 3.2% жирности, 1 литр.",
    // ... more details
  };
  isLoadingDetails.value = false;
};

const fetchProductHistory = async (id: string) => {
  isLoadingHistory.value = true;
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  productHistory.value = [
    { id: "hist1", date: "2023-01-15", action: "Поступление", quantity: 50, price: 45000, supplier: "Молочный завод #1", shop: "Главный магазин" },
    { id: "hist2", date: "2023-01-20", action: "Продажа", quantity: -10, price: 50000, shop: "Главный магазин" },
    { id: "hist3", date: "2023-02-01", action: "Перемещение", quantity: -5, fromShop: "Главный магазин", toShop: "Филиал 1" },
  ];
  isLoadingHistory.value = false;
};

const updateReceiptPrice = (event: Event) => {
  const input = event.target as HTMLInputElement;
  receiptPrice.value = parseCurrency(input.value);
  formattedReceiptPrice.value = formatCurrency(receiptPrice.value);
};

const handleReceiptPriceInput = (event: Event) => {
  const input = event.target as HTMLInputElement;
  input.value = input.value.replace(/[^0-9\s]/g, '');
};

const handleReceiptPriceBlur = () => {
  formattedReceiptPrice.value = formatCurrency(receiptPrice.value);
};

const addStock = () => {
  // Implement logic to add stock (Point 10)
  console.log("Adding stock:", stockToAdd.value, "at price:", receiptPrice.value, "from supplier:", supplier.value);
  isAddStockModalOpen.value = false;
  // After successful addition, refresh product details and history
};

const printPriceTags = () => {
  // Implement logic to print price tags
  console.log("Printing price tags for product:", props.productId);
};

watch(() => props.productId, (newId) => {
  if (newId) {
    fetchProductDetails(newId);
    fetchProductHistory(newId);
  } else {
    productDetails.value = null;
    productHistory.value = [];
  }
});

watch(() => props.open, (isOpen) => {
  if (isOpen && props.productId) {
    fetchProductDetails(props.productId);
    fetchProductHistory(props.productId);
  }
});
</script>

<template>
  <UModal :model-value="open" @update:model-value="closeSlideover" :ui="{ width: 'sm:max-w-3xl' }">
    <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-bold">
            {{ productDetails?.name || 'Детали продукта' }}
          </h3>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="closeSlideover" />
        </div>
      </template>

      <div v-if="isLoadingDetails" class="p-4 text-center">Загрузка деталей продукта...</div>
      <div v-else-if="productDetails" class="space-y-6 p-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-400">Артикул</p>
            <p class="font-medium">{{ productDetails.sku }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-400">Штрихкод</p>
            <p class="font-medium">{{ productDetails.barcode }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-400">Цена</p>
            <p class="font-medium">{{ formatCurrency(productDetails.price) }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-400">Остаток</p>
            <p class="font-medium">{{ productDetails.stock }}</p>
          </div>
        </div>
        <p class="text-sm text-gray-400">Описание</p>
        <p>{{ productDetails.description || 'Нет описания' }}</p>

        <!-- Action Buttons (Point 9.2) -->
        <div class="flex gap-3">
          <UButton icon="i-heroicons-plus-circle-20-solid" @click="isAddStockModalOpen = true">
            Добавить остаток
          </UButton>
          <UButton icon="i-heroicons-printer-20-solid" @click="printPriceTags">
            Печать ценников
          </UButton>
        </div>

        <!-- Product History (Point 9.1) -->
        <h4 class="text-lg font-bold mt-6">История продукта</h4>
        <div v-if="isLoadingHistory" class="text-center">Загрузка истории...</div>
        <div v-else-if="productHistory.length" class="space-y-3">
          <div v-for="entry in productHistory" :key="entry.id" class="border-b border-gray-700 pb-2">
            <p class="text-sm font-medium">{{ entry.date }} - {{ entry.action }}</p>
            <p class="text-xs text-gray-400">Кол-во: {{ entry.quantity }}, Цена: {{ formatCurrency(entry.price) }}</p>
            <p v-if="entry.supplier" class="text-xs text-gray-400">Поставщик: {{ entry.supplier }}</p>
            <p v-if="entry.shop" class="text-xs text-gray-400">Магазин: {{ entry.shop }}</p>
          </div>
        </div>
        <div v-else class="text-sm text-gray-400">История отсутствует.</div>
      </div>
      <div v-else class="p-4 text-center">Выберите продукт для просмотра деталей.</div>
    </UCard>
  </UModal>

  <!-- Add Stock Modal (Point 10) -->
  <UModal v-model="isAddStockModalOpen">
    <UCard class="p-4">
      <template #header>
        <h3 class="text-lg font-bold">Добавить поступление?</h3>
      </template>
      <div class="space-y-4">
        <p>Введите цену прихода и поставщика для добавляемых продуктов.</p>
        <div>
          <label for="stockQuantity" class="block text-sm font-medium text-gray-700">Кол-во</label>
          <UInput id="stockQuantity" v-model.number="stockToAdd" type="number" min="1" />
        </div>
        <div>
          <label for="receiptPrice" class="block text-sm font-medium text-gray-700">Цена прихода</label>
          <UInput
            id="receiptPrice"
            :value="formattedReceiptPrice"
            @input="updateReceiptPrice"
            @blur="handleReceiptPriceBlur"
            @keydown="handleReceiptPriceInput"
            placeholder="110 000 UZS"
          />
        </div>
        <div>
          <label for="supplier" class="block text-sm font-medium text-gray-700">Поставщик</label>
          <UInput id="supplier" v-model="supplier" placeholder="Выберите поставщика" />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="gray" variant="ghost" @click="isAddStockModalOpen = false">Отмена</UButton>
          <UButton @click="addStock">Добавить</UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>