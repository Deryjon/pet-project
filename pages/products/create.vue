<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useHead } from "#imports";
import {
  buildCreateProductPayload,
  buildUpdateProductPayload,
  validateCreateProductForm,
} from "~/composables/useCreateProductForm";
import { normalizeApiError, useProducts } from "~/composables/useProducts";
import { useLocationStore } from "~/store/useLocationStore";
import { useProductStore } from "~/store/productStore";

import CreateProductFeatures from "@/components/products/CreateProductFeatures.vue";
import CreateProductHeader from "@/components/products/CreateProductHeader.vue";
import CreateProductMainForm from "@/components/products/CreateProductMainForm.vue";
import CreateProductPrices from "@/components/products/CreateProductPrices.vue";
import CreateProductSidebar from "@/components/products/CreateProductSidebar.vue";
import CreateProductStocks from "@/components/products/CreateProductStocks.vue";

definePageMeta({ layout: "empty" });

const router = useRouter();
const route = useRoute();
const store = useProductStore();
const locationStore = useLocationStore();
const { createProduct, updateProduct } = useProducts();
const toast = useToast();

const submitting = ref(false);
const validationMessages = ref<string[]>([]);
const isEditMode = computed(() => route.query.mode === "edit");

useHead({
  title: computed(() =>
    isEditMode.value ? "Изменить продукт | Konkurent.cases" : "Новый продукт | Konkurent.cases",
  ),
  meta: [
    {
      name: "description",
      content: "Создание и редактирование продукта",
    },
  ],
});

const showStocks = computed(() => store.form.productType === "Товар");

const mainRef = ref<HTMLElement | null>(null);
const pricesRef = ref<HTMLElement | null>(null);
const stocksRef = ref<HTMLElement | null>(null);
const featuresRef = ref<HTMLElement | null>(null);
const activeSection = ref<"main" | "prices" | "stocks" | "features">("main");

function scrollTo(section: string) {
  const map: Record<string, HTMLElement | null> = {
    main: mainRef.value,
    prices: pricesRef.value,
    stocks: showStocks.value ? stocksRef.value : null,
    features: featuresRef.value,
  };

  if (section === "stocks" && !showStocks.value) {
    activeSection.value = "features";
    return;
  }

  if (section in map) {
    activeSection.value = section as "main" | "prices" | "stocks" | "features";
  }

  const el = map[section];
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function updateActiveSectionByScroll() {
  const sections: Array<{
    key: "main" | "prices" | "stocks" | "features";
    el: HTMLElement | null;
  }> = [
    { key: "main", el: mainRef.value },
    { key: "prices", el: pricesRef.value },
    { key: "stocks", el: showStocks.value ? stocksRef.value : null },
    { key: "features", el: featuresRef.value },
  ];

  const headerOffset = 140;
  let current: "main" | "prices" | "stocks" | "features" = "main";

  for (const section of sections) {
    if (!section.el) continue;
    const top = section.el.getBoundingClientRect().top;
    if (top <= headerOffset) {
      current = section.key;
    }
  }

  activeSection.value = current;
}

onMounted(() => {
  store.syncAvailableShops(locationStore.locations);

  if (!isEditMode.value && store.editingProductId) {
    store.resetForm();
  }

  if (isEditMode.value && !store.editingProductId) {
    toast.add({
      title: "Не удалось открыть режим редактирования",
      description: "Откройте товар из каталога заново.",
      color: "warning",
    });
    void router.replace("/products/catalog");
    return;
  }

  window.addEventListener("scroll", updateActiveSectionByScroll, { passive: true });
  updateActiveSectionByScroll();
});

watch(
  () => locationStore.locations,
  (locations) => {
    store.syncAvailableShops(locations);
  },
  { deep: true },
);

onBeforeUnmount(() => {
  window.removeEventListener("scroll", updateActiveSectionByScroll);
});

async function submitForm(mode: "save" | "save-and-new") {
  if (submitting.value) return;

  const issues = validateCreateProductForm(store.form);
  validationMessages.value = issues.map((issue) => issue.message);

  if (issues.length > 0) {
    toast.add({
      title: "Проверьте форму",
      description: issues[0]?.message || "Исправьте ошибки перед сохранением.",
      color: "warning",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  submitting.value = true;
  try {
    if (isEditMode.value) {
      if (!store.editingProductId) {
        throw new Error("Не найден редактируемый товар");
      }

      const payload = buildUpdateProductPayload(store.form, store.editingProductSource);
      await updateProduct(store.editingProductId, payload);
      toast.add({ title: "Продукт обновлен", color: "success" });
      store.stopEditingProduct();
      await router.push("/products/catalog");
      return;
    }

    const payload = buildCreateProductPayload(store.form);
    await createProduct(payload);
    toast.add({ title: "Продукт создан", color: "success" });

    if (mode === "save-and-new") {
      store.resetForm();
      validationMessages.value = [];
      activeSection.value = "main";
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    await router.push("/products/catalog");
  } catch (error: any) {
    validationMessages.value = [normalizeApiError(error)];
    toast.add({
      title: "Не удалось сохранить продукт",
      description: validationMessages.value[0],
      color: "error",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
    console.error("Failed to save product", error);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section class="operations">
    <CreateProductHeader
      :submitting="submitting"
      :mode="isEditMode ? 'edit' : 'create'"
      @create="submitForm('save')"
    />

    <div class="mx-auto mt-8 flex items-start gap-10 px-[120px] pb-12">
      <CreateProductSidebar
        :active-section="activeSection"
        :show-stocks="showStocks"
        @scrollTo="scrollTo"
      />

      <div class="right flex-1 px-6">
        <UAlert
          v-if="validationMessages.length"
          color="error"
          variant="soft"
          title="Проверьте форму"
          class="mb-6"
        >
          <template #description>
            <ul class="list-disc space-y-1 pl-5 text-[15px]">
              <li v-for="(message, index) in validationMessages" :key="`${message}-${index}`">
                {{ message }}
              </li>
            </ul>
          </template>
        </UAlert>

        <div ref="mainRef">
          <CreateProductMainForm />
        </div>

        <div ref="pricesRef" class="mt-12">
          <CreateProductPrices />
        </div>

        <div v-if="showStocks" ref="stocksRef" class="mt-12">
          <CreateProductStocks />
        </div>

        <div ref="featuresRef" class="mt-12">
          <CreateProductFeatures />
        </div>
      </div>
    </div>
  </section>
</template>

<style>
@reference "tailwindcss";
</style>
