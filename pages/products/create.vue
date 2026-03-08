<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useHead } from "#imports";
import {
  mapProductType,
  mapVariationType,
  nonNegative,
  validateCreateProductForm,
} from "~/composables/useCreateProductForm";
import { useProducts } from "~/composables/useProducts";
import { useProductStore } from "~/store/productStore";

import CreateProductActions from "@/components/products/CreateProductActions.vue";
import CreateProductFeatures from "@/components/products/CreateProductFeatures.vue";
import CreateProductHeader from "@/components/products/CreateProductHeader.vue";
import CreateProductMainForm from "@/components/products/CreateProductMainForm.vue";
import CreateProductPrices from "@/components/products/CreateProductPrices.vue";
import CreateProductSidebar from "@/components/products/CreateProductSidebar.vue";
import CreateProductStocks from "@/components/products/CreateProductStocks.vue";

definePageMeta({ layout: "empty" });

const router = useRouter();
const store = useProductStore();
const { createProduct } = useProducts();

const submitting = ref(false);
const validationMessages = ref<string[]>([]);

useHead({
  title: "Новый продукт | Konkurent.cases",
  meta: [{ name: "description", content: "Создание нового продукта" }],
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
  window.addEventListener("scroll", updateActiveSectionByScroll, { passive: true });
  updateActiveSectionByScroll();
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", updateActiveSectionByScroll);
});

function buildPayload() {
  const form = store.form;
  const productType = mapProductType(form.productType);
  const variationType = mapVariationType(form.variationType);

  const isVariantGoods = productType === "goods" && variationType === "variant";
  const isSimpleGoods = productType === "goods" && variationType === "simple";

  const totalQuantity = isVariantGoods
    ? form.variations.reduce(
        (sum, variation) =>
          sum + Object.values(variation.stocks).reduce((inner, qty) => inner + nonNegative(qty), 0),
        0,
      )
    : isSimpleGoods
      ? form.stocks.reduce((sum, stock) => sum + nonNegative(stock.qty), 0)
      : 0;

  const prices = isVariantGoods
    ? form.variations[0]?.prices ?? { purchasePrice: 0, markupPercent: 0, salePrice: 0 }
    : form.prices;

  const payload: Record<string, any> = {
    name: form.name.trim(),
    sku: form.sku.trim(),
    barcode: form.barcode.trim(),
    supplier_ids: [],
    product_type: productType,
    variant_type: variationType,
    unit: form.unit || "Штука",
    purchase_price: nonNegative(prices.purchasePrice),
    markup_percent: nonNegative(prices.markupPercent),
    sale_price: nonNegative(prices.salePrice),
    quantity: totalQuantity,
    photo: null,
    metadata: {
      attributes: {
        brand: form.attributes.brand.trim(),
        supplier: form.attributes.supplier.trim(),
        optional_field: form.attributes.optionalField.trim(),
      },
      category: form.category,
      variation_attribute: form.variationAttribute.trim(),
      variations: form.variations.map((variation) => ({
        id: variation.id,
        value: variation.value.trim(),
        purchase_price: nonNegative(variation.prices.purchasePrice),
        markup_percent: nonNegative(variation.prices.markupPercent),
        sale_price: nonNegative(variation.prices.salePrice),
        stocks: variation.stocks,
      })),
      bundle_items: form.bundleItems.map((item) => ({
        name: item.name.trim(),
        quantity: Math.max(1, item.quantity),
      })),
    },
  };

  const firstImage = form.images.at(0);
  if (firstImage) {
    payload.photo = firstImage.name;
  }

  if (isSimpleGoods) {
    payload.stocks = form.stocks
      .map((stock) => ({
        branch_code: stock.name,
        quantity: nonNegative(stock.qty),
        purchase_price: nonNegative(form.prices.purchasePrice),
        sale_price: nonNegative(form.prices.salePrice),
      }))
      .filter((stock) => stock.quantity > 0);
  }

  if (isVariantGoods) {
    payload.stocks = form.stocks
      .map((stock) => {
        const quantity = form.variations.reduce(
          (sum, variation) => sum + nonNegative(variation.stocks[stock.name] ?? 0),
          0,
        );
        return {
          branch_code: stock.name,
          quantity,
          purchase_price: nonNegative(prices.purchasePrice),
          sale_price: nonNegative(prices.salePrice),
        };
      })
      .filter((stock) => stock.quantity > 0);
  }

  return payload;
}

async function submitForm(mode: "save" | "save-and-new") {
  if (submitting.value) return;

  const issues = validateCreateProductForm(store.form);
  validationMessages.value = issues.map((issue) => issue.message);

  if (issues.length > 0) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  submitting.value = true;
  try {
    const payload = buildPayload();
    await createProduct(payload as any);

    if (mode === "save-and-new") {
      store.resetForm();
      validationMessages.value = [];
      activeSection.value = "main";
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    await router.push("/products/catalog");
  } catch (error) {
    console.error("Failed to create product", error);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section class="operations">
    <CreateProductHeader :submitting="submitting" @create="submitForm('save')" />

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

        <CreateProductActions
          :submitting="submitting"
          @cancel="router.back()"
          @save="submitForm('save')"
          @save-and-new="submitForm('save-and-new')"
        />
      </div>
    </div>
  </section>
</template>

<style>
@reference "tailwindcss";
</style>
