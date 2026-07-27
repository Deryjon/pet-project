<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from "vue";
import { useRoute } from "#app";
import { usePriceTagsData, ELEMENT_PRESETS, type PriceTagProduct, type PriceTagTemplate } from "@/composables/usePriceTagsData";
import { useShopAccess } from "@/composables/useShopAccess";
import PriceTagGrid from "@/components/print/PriceTagGrid.vue";

definePageMeta({ layout: "print" });

const route = useRoute();
const { fetchPriceTags, fetchPriceTagTemplates } = usePriceTagsData();
const { currentShopId } = useShopAccess();

const loading = ref(true);
const error = ref("");
const products = ref<PriceTagProduct[]>([]);
const template = ref<PriceTagTemplate | null>(null);
const showDiscount = ref(route.query.discount !== "0");
const printOnA4 = ref(route.query.a4 === "1");

const FALLBACK_TEMPLATE: PriceTagTemplate = {
  id: "",
  name: "Стандарт 40x20мм",
  width: 40,
  length: 20,
  barcodeType: "CODE128",
  barcodeTypeId: "",
  elements: ELEMENT_PRESETS.filter((e) => ["product_name", "price", "barcode", "sku"].includes(e.name)).map((e) => ({ ...e })),
};

function parseCopies(raw: string): Record<string, number> {
  const copies: Record<string, number> = {};
  for (const pair of raw.split(",")) {
    const [id, count] = pair.split(":");
    if (id && count) copies[id.trim()] = Number(count.trim()) || 1;
  }
  return copies;
}

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const productIds = String(route.query.productIds ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    if (!productIds.length) {
      error.value = "Не выбраны товары для печати.";
      return;
    }
    const copies = parseCopies(String(route.query.copies ?? ""));
    const branchId = String(route.query.branchId ?? currentShopId.value ?? "");
    const templateId = route.query.templateId ? String(route.query.templateId) : "";

    // Templates and products are independent — a templates-fetch failure
    // should still let the fallback template print, and vice versa. Only a
    // products-fetch failure (nothing to actually print) is fatal.
    const [templates, fetchedProducts] = await Promise.all([
      fetchPriceTagTemplates(branchId || "all").catch((e) => {
        console.error("Failed to load price tag templates", e);
        return [];
      }),
      fetchPriceTags(productIds, copies, branchId || undefined),
    ]);

    products.value = fetchedProducts;
    template.value =
      (templateId && templates.find((t) => t.id === templateId)) ||
      templates[0] ||
      FALLBACK_TEMPLATE;

    if (!products.value.length) {
      error.value = "Товары не найдены.";
    }
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || "Не удалось загрузить ценники.";
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await load();
  if (!error.value && route.query.autoprint) {
    await nextTick();
    window.print();
  }
});
</script>

<template>
  <div class="price-tags-page" :class="{ 'price-tags-page-a4': printOnA4 }">
    <p v-if="loading" class="no-print status">Загрузка...</p>
    <p v-else-if="error" class="no-print status status-error">{{ error }}</p>
    <PriceTagGrid
      v-else-if="template"
      :products="products"
      :template="template"
      :show-discount="showDiscount"
      :a4="printOnA4"
    />
  </div>
</template>

<style scoped>
.price-tags-page {
  padding: 0;
}
/* Only the A4 (gang-print) layout needs page margin — single-label mode sets
   @page to the template's exact mm size (see PriceTagGrid.vue), so any
   padding here would push the tag past the physical label's edge. */
.price-tags-page-a4 {
  padding: 3mm;
}
.status {
  font-family: Arial, sans-serif;
  padding: 16px;
}
.status-error {
  color: #b91c1c;
}
@media print {
  .no-print {
    display: none;
  }
}
</style>
