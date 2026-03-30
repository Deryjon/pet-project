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
  const variationType = mapVariationType(form.variationType);

  const isVariative = variationType === "variant";

  const totalQuantity = isVariative
    ? form.variations.reduce(
        (sum, variation) =>
          sum + Object.values(variation.stocks).reduce((inner, qty) => inner + nonNegative(qty), 0),
        0,
      )
    : form.productType === "Товар"
      ? form.stocks.reduce((sum, stock) => sum + nonNegative(stock.qty), 0)
      : 0;

  const prices = isVariative
    ? form.variations[0]?.prices ?? { purchasePrice: 0, markupPercent: 0, salePrice: 0 }
    : form.prices;

  const stockRows = form.stocks.map((stock) => ({
    shop_id: stock.name,
    retail_price: nonNegative(prices.salePrice),
    supply_price: nonNegative(prices.purchasePrice),
    wholesale_price: 0,
    min_price: 0,
    max_price: 0,
  }));

  const shipmentRows = form.stocks
    .map((stock) => ({
      has_trigger: false,
      measurement_value: nonNegative(stock.qty),
      shop_id: stock.name,
      small_left_measurement_value: 0,
      total_measurement_value: nonNegative(stock.qty),
      supplier_id: form.attributes.supplier.trim() || undefined,
    }))
    .filter((stock) => stock.total_measurement_value > 0);

  const payload = {
    id: "",
    stocktaking_id: "",
    name: form.name.trim(),
    sku: form.sku.trim(),
    barcode: form.barcode.trim(),
    additional_barcodes: [],
    brand_id: "",
    brand_name: form.attributes.brand.trim(),
    category_ids: form.category ? [form.category] : [],
    company_id: "",
    description: form.attributes.optionalField.trim()
      ? `<p>${form.attributes.optionalField.trim()}</p>`
      : "<p></p>",
    has_expiration_date: false,
    images: form.images.map((image) => image.name),
    is_auto_delivery: true,
    is_auto_tax: true,
    is_divisible: false,
    is_variative: isVariative,
    max_modificators_count: 0,
    measurement_type: "",
    measurement_unit_id: form.unit || "",
    packages: [],
    product_custom_fields: [],
    product_modificators: [],
    product_type_id: mapProductType(form.productType),
    profit_margin: nonNegative(prices.markupPercent),
    related_product_ids: [],
    required_modificators_count: 0,
    retail_price: nonNegative(prices.salePrice),
    selected_attributes: [],
    set_products: form.bundleItems
      .filter((item) => item.name.trim())
      .map((item) => ({
        name: item.name.trim(),
        quantity: Math.max(1, item.quantity),
      })),
    shipments: shipmentRows,
    shop_measurement_values: shipmentRows,
    supplier_ids: [],
    supply_price: nonNegative(prices.purchasePrice),
    tax_tariff_id: "",
    variants: isVariative
      ? form.variations.map((variation) => ({
          id: variation.id,
          name: variation.value.trim(),
          retail_price: nonNegative(variation.prices.salePrice),
          supply_price: nonNegative(variation.prices.purchasePrice),
          profit_margin: nonNegative(variation.prices.markupPercent),
          stocks: variation.stocks,
        }))
      : [],
    is_marked: false,
    scale_plu: null,
    shop_free_prices: form.stocks.map((stock) => ({
      shop_id: stock.name,
    })),
    shop_prices: stockRows,
    metadata: {
      ui_unit: form.unit || "Штука",
      total_quantity: totalQuantity,
      supplier_name: form.attributes.supplier.trim(),
      variation_attribute: form.variationAttribute.trim(),
    },
  };

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
      </div>
    </div>
  </section>
</template>

<style>
@reference "tailwindcss";
</style>
