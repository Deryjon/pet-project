<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useHead, useRouter } from "#imports";
import { formatCurrency, parseCurrency } from "@/utils/formatters"; // Assuming these utilities exist

useHead({ title: "Создание товара | Konkurent" });

const router = useRouter();
const showCancelModal = ref(false);

const productName = ref("");
const productPrice = ref(0); // Stored as number
const formattedPrice = ref(""); // Displayed as formatted string

const updatePrice = (event: Event) => {
  const input = event.target as HTMLInputElement;
  productPrice.value = parseCurrency(input.value);
  formattedPrice.value = formatCurrency(productPrice.value);
};

const handlePriceInput = (event: Event) => {
  const input = event.target as HTMLInputElement;
  // Allow only digits and spaces for input, then format on blur
  input.value = input.value.replace(/[^0-9\s]/g, '');
};

const handlePriceBlur = () => {
  formattedPrice.value = formatCurrency(productPrice.value);
};

const goBack = () => {
  if (hasUnsavedChanges()) {
    showCancelModal.value = true;
  } else {
    router.back();
  }
};

const confirmCancel = () => {
  showCancelModal.value = false;
  router.back();
};

const hasUnsavedChanges = () => {
  // Implement logic to check if form has unsaved changes
  // For example, compare current form state with initial state or check a dirty flag
  return productName.value !== "" || productPrice.value !== 0; // Simple example
};

onMounted(() => {
  // Initialize formatted price on mount
  formattedPrice.value = formatCurrency(productPrice.value);
});

// Prevent accidental navigation away
onBeforeUnmount(() => {
  // You might want to use a navigation guard for more robust handling
  // router.beforeEach((to, from, next) => { ... });
});
</script>

<template>
  <div class="container mx-auto p-6">
    <div class="bg-[#262626] rounded-lg shadow-style p-6">
      <h2 class="text-[28px] font-bold text-white mb-6">Создание нового товара</h2>

      <div class="space-y-6">
        <div>
          <label for="productName" class="block text-sm font-medium text-[#bdbdbd] mb-2">Наименование товара</label>
          <input
            id="productName"
            v-model="productName"
            type="text"
            class="w-full rounded-[12px] border border-[#404040] bg-[#363636] px-4 py-3 text-white placeholder-[#9f9f9f] focus:border-[#4993dd] focus:ring-0"
            placeholder="Введите наименование"
          />
        </div>

        <div>
          <label for="productPrice" class="block text-sm font-medium text-[#bdbdbd] mb-2">Цена</label>
          <input
            id="productPrice"
            :value="formattedPrice"
            @input="updatePrice"
            @blur="handlePriceBlur"
            @keydown="handlePriceInput"
            type="text"
            class="w-full rounded-[12px] border border-[#404040] bg-[#363636] px-4 py-3 text-white placeholder-[#9f9f9f] focus:border-[#4993dd] focus:ring-0"
            placeholder="0 UZS"
          />
        </div>

        <!-- Other product creation fields -->
      </div>

      <div class="mt-8 flex gap-4">
        <button @click="goBack" class="px-6 py-3 rounded-lg bg-[#404040] text-white hover:bg-[#505050]">
          Назад
        </button>
        <button class="px-6 py-3 rounded-lg bg-[#1f78ff] text-white hover:bg-[#2a6ed9]">
          Сохранить товар
        </button>
      </div>
    </div>

    <!-- Cancel Confirmation Modal (Point 8) -->
    <UModal v-model="showCancelModal">
      <div class="p-4">
        <h3 class="text-lg font-bold">Отменить создание продукта?</h3>
        <p class="mt-2">Вы уверены, что хотите выйти и отменить создание продукта? Все внесенные данные не сохранятся.</p>
        <div class="mt-4 flex justify-end gap-2">
          <UButton color="gray" variant="ghost" @click="showCancelModal = false">Отмена</UButton>
          <UButton color="red" @click="confirmCancel">Выйти и отменить</UButton>
        </div>
      </div>
    </UModal>
  </div>
</template>

<style scoped>
.shadow-style {
  box-shadow: 0px 0px 20px rgba(255, 255, 255, 0.08);
}
</style>