<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
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
const { createProduct, updateProduct, uploadProductPhoto } = useProducts();
const toast = useToast();
const { can } = useAccessControl();

const submitting = ref(false);
const validationMessages = ref<string[]>([]);
const confirmCancelOpen = ref(false);
const isEditMode = computed(() => route.query.mode === "edit");
const cancelDialogTitle = computed(() =>
  isEditMode.value ? "Отменить редактирование продукта?" : "Отменить создание продукта?",
);
const cancelDialogDescription = computed(() =>
  isEditMode.value
    ? "Вы уверены что хотите выйти и отменить редактирование продукта? Все несохраненные изменения будут потеряны"
    : "Вы уверены что хотите выйти и отменить создание продукта? Все внесенные данные не сохранятся",
);
const cancelDialogConfirmLabel = computed(() =>
  isEditMode.value ? "Отменить редактирование" : "Отменить создание",
);
const cancelModalOpen = computed({
  get: () => confirmCancelOpen.value,
  set: (open: boolean) => {
    if (!open) {
      confirmCancelOpen.value = false;
    }
  },
});

useHead({
  title: computed(() =>
    isEditMode.value ? "Изменить продукт | Konkurent" : "Новый продукт | Konkurent",
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
let scrollListenerAttached = false;

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

function attachScrollListener() {
  if (scrollListenerAttached) return;
  window.addEventListener("scroll", updateActiveSectionByScroll, { passive: true });
  scrollListenerAttached = true;
}

function detachScrollListener() {
  if (!scrollListenerAttached) return;
  window.removeEventListener("scroll", updateActiveSectionByScroll);
  scrollListenerAttached = false;
}

async function initializePage() {
  if (!can(isEditMode.value ? "product-edit" : "product-create")) {
    void router.replace("/403");
    return;
  }

  store.syncAvailableShops(locationStore.locations);

  if (!isEditMode.value) {
    store.resetForm();
    validationMessages.value = [];
    activeSection.value = "main";
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

  attachScrollListener();
  updateActiveSectionByScroll();

  await nextTick();
  if (route.query.focus === "stocks") {
    scrollTo("stocks");
  }
}

onMounted(() => {
  void initializePage();
});

watch(
  () => [route.query.mode, route.query.id, route.query.focus],
  () => {
    void initializePage();
  },
);

watch(
  () => locationStore.locations,
  (locations) => {
    store.syncAvailableShops(locations);
  },
  { deep: true },
);

onBeforeUnmount(() => {
  detachScrollListener();
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
    for (const image of store.form.images) {
      if (image.file && !image.uploadedUrl) {
        image.uploadedUrl = await uploadProductPhoto(image.file);
      }
    }

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

function requestCancel() {
  confirmCancelOpen.value = true;
}

async function confirmCancel() {
  confirmCancelOpen.value = false;
  if (isEditMode.value) {
    store.stopEditingProduct();
  }
  await router.push("/products/catalog");
}
</script>

<template>
  <section class="operations">
    <CreateProductHeader
      :submitting="submitting"
      :mode="isEditMode ? 'edit' : 'create'"
      @back="requestCancel"
      @create="submitForm('save')"
    />

    <div class="mx-auto mt-8 w-full max-w-[1680px] px-4 pb-12 sm:px-6">
      <div class="rounded-[28px] bg-[radial-gradient(circle_at_top_left,rgba(73,147,221,0.12),transparent_22%),linear-gradient(180deg,#262626,#212121)] p-4 shadow-[0_28px_80px_rgba(0,0,0,0.28)] sm:rounded-[34px] sm:p-6">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
          <CreateProductSidebar
            :active-section="activeSection"
            :show-stocks="showStocks"
            @scrollTo="scrollTo"
          />

          <div class="right min-w-0 flex-1 px-0 sm:px-2 lg:px-4">
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
      </div>
    </div>

    <UModal
      v-model:open="cancelModalOpen"
      :dismissible="false"
      :ui="{
        overlay: 'bg-black/50 backdrop-blur-sm',
        content: 'mx-4 max-w-[520px] rounded-[28px] border border-white/10 bg-[#262626] p-0 text-white shadow-2xl ring-0 sm:mx-0',
      }"
    >
      <template #content>
        <div class="p-6 sm:p-8">
          <div class="flex items-start justify-between gap-4">
            <div v-if="isEditMode">
              <h3 class="text-[24px] font-bold text-white">{{ cancelDialogTitle }}</h3>
              <p class="mt-3 text-[15px] leading-6 text-[#b3b3b3]">
                {{ cancelDialogDescription }}
              </p>
            </div>
            <div v-else>
              <h3 class="text-[24px] font-bold text-white">Отменить создание продукта?</h3>
              <p class="mt-3 text-[15px] leading-6 text-[#b3b3b3]">
                Вы уверены что хотите выйти и отменить создание продукта? Все внесенные данные не сохранятся
              </p>
            </div>

            <UButton
              color="neutral"
              variant="ghost"
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#404040] p-0 text-white hover:bg-[#505050]"
              @click="confirmCancelOpen = false"
            >
              <Icon name="heroicons:x-mark" class="h-5 w-5" />
            </UButton>
          </div>

          <div class="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <UButton
              color="neutral"
              variant="soft"
              class="justify-center rounded-[16px] bg-[#3a3a3a] px-5 py-4 text-white hover:bg-[#454545]"
              @click="confirmCancelOpen = false"
            >
              Остаться
            </UButton>
            <UButton
              v-if="isEditMode"
              color="error"
              variant="solid"
              class="justify-center rounded-[16px] bg-[#c14343] px-5 py-4 text-white hover:bg-[#d04d4d]"
              @click="confirmCancel"
            >
              {{ cancelDialogConfirmLabel }}
            </UButton>
            <UButton
              v-else
              color="error"
              variant="solid"
              class="justify-center rounded-[16px] bg-[#c14343] px-5 py-4 text-white hover:bg-[#d04d4d]"
              @click="confirmCancel"
            >
              Отменить создание
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </section>
</template>
