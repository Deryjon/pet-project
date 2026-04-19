<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useHead } from "#imports";
import { normalizeApiError, useProducts } from "~/composables/useProducts";

definePageMeta({
  layout: "empty",
});

useHead({
  title: "Архивация товаров | Konkurent",
  meta: [{ name: "description", content: "Архивация выбранных товаров" }],
});

const route = useRoute();
const router = useRouter();
const toast = useToast();
const { bulkArchiveProducts } = useProducts();

const confirmOpen = ref(false);
const submitting = ref(false);

const productIds = computed(() =>
  String(route.query.ids ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean),
);

const productCountLabel = computed(() => {
  const count = productIds.value.length;
  if (count === 1) return "1 продукт";
  return `${count} продуктов`;
});

function openConfirm() {
  if (!productIds.value.length) {
    toast.add({
      title: "Нет выбранных товаров",
      description: "Вернитесь в каталог и выберите хотя бы один товар.",
      color: "warning",
    });
    return;
  }

  confirmOpen.value = true;
}

function closeConfirm() {
  if (submitting.value) {
    return;
  }

  confirmOpen.value = false;
}

async function archiveProducts() {
  if (!productIds.value.length || submitting.value) {
    return;
  }

  submitting.value = true;

  try {
    await bulkArchiveProducts(productIds.value);
    confirmOpen.value = false;
    toast.add({
      title: "Товары архивированы",
      color: "success",
    });
    await router.push("/products/catalog");
  } catch (error: any) {
    toast.add({
      title: "Не удалось архивировать товары",
      description: normalizeApiError(error),
      color: "error",
    });
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section class="operations">
    <div class="border-b">
      <div class="w-full">
        <div class="top flex items-center justify-between gap-4 py-[32px]">
          <div class="flex items-center gap-4">
            <div
              class="exit bg-[#404040] px-[15px] py-[12px] rounded-[25px] flex items-center gap-2 justify-center cursor-pointer font-bold text-[16px] hover:bg-[#5e5e5e] transition-colors duration-300"
              @click="router.back()"
            >
              <Icon name="heroicons:chevron-left" class="w-5 h-5 text-muted-foreground" />
              Массовые операции
            </div>
            <h2 class="text-[28px] font-bold">Архивация товаров</h2>
          </div>

          <button
            class="bg-[#1f78ff] px-[18px] py-[12px] text-[16px] font-semibold rounded-[20px] transition-all duration-300 hover:bg-[#4d94ff] disabled:opacity-60"
            :disabled="!productIds.length"
            @click="openConfirm"
          >
            Архивация товаров
          </button>
        </div>
      </div>
    </div>

    <div class="mt-8 w-full">
      <div class="rounded-[24px] bg-[#404040] p-8 text-white">
        <h3 class="text-[22px] font-bold">Выбранные товары</h3>
        <p class="mt-3 text-[16px] text-[#d1d5db]">
          К архивации подготовлено: {{ productCountLabel }}
        </p>

        <div v-if="productIds.length" class="mt-6 rounded-[18px] bg-[#2f2f2f] p-5">
          <p class="text-[14px] font-semibold uppercase tracking-[0.18em] text-[#9ca3af]">
            Product IDs
          </p>
          <div class="mt-4 flex flex-col gap-3">
            <code
              v-for="productId in productIds"
              :key="productId"
              class="rounded-[14px] bg-[#1f1f1f] px-4 py-3 text-[14px] text-[#e5e7eb]"
            >
              {{ productId }}
            </code>
          </div>
        </div>

        <p v-else class="mt-6 text-[15px] text-[#fca5a5]">
          В query-параметре `ids` нет товаров для архивации.
        </p>
      </div>
    </div>

    <UModal v-model:open="confirmOpen" :ui="{ content: 'max-w-[520px] rounded-[28px] bg-[#262626] p-0 text-white border border-white/10' }">
      <template #content>
        <div class="p-8">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h3 class="text-[24px] font-bold">Подтверждение</h3>
              <p class="mt-3 text-[16px] text-[#d1d5db]">
                Вы точно хотите архивировать этот продукт?
              </p>
            </div>

            <UButton
              color="neutral"
              variant="ghost"
              class="rounded-full bg-[#404040] text-white hover:bg-[#505050]"
              @click="closeConfirm"
            >
              <Icon name="heroicons:x-mark" class="h-5 w-5" />
            </UButton>
          </div>

          <div class="mt-8 flex items-center justify-end gap-3">
            <UButton
              color="neutral"
              variant="soft"
              class="rounded-[16px] bg-[#404040] px-5 py-3 text-white hover:bg-[#505050]"
              :disabled="submitting"
              @click="closeConfirm"
            >
              Отмена
            </UButton>
            <UButton
              color="primary"
              variant="solid"
              class="rounded-[16px] bg-[#1f78ff] px-5 py-3 text-white hover:bg-[#4d94ff]"
              :loading="submitting"
              @click="archiveProducts"
            >
              Архивировать
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </section>
</template>
