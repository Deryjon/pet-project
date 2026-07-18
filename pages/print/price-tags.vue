<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from "vue";
import { useRoute } from "#app";
import { usePriceTagsData, type PriceTagProduct, type PriceTagTemplateData } from "@/composables/usePriceTagsData";
import { useShopAccess } from "@/composables/useShopAccess";
import PriceTagGrid from "@/components/print/PriceTagGrid.vue";

definePageMeta({ layout: "print" });

const route = useRoute();
const { fetchPriceTags, fetchPriceTagTemplates } = usePriceTagsData();
const { currentShopId } = useShopAccess();

const loading = ref(true);
const error = ref("");
const products = ref<PriceTagProduct[]>([]);
const template = ref<PriceTagTemplateData | null>(null);

const FALLBACK_TEMPLATE: PriceTagTemplateData = {
  id: "",
  name: "Стандарт 40x20мм",
  width: 40,
  length: 20,
  barcodeType: "CODE128",
  elements: [
    { id: "name", x: 2, y: 2, fontSize: 8, fontWeight: "bold", visible: true },
    { id: "price", x: 2, y: 10, fontSize: 14, fontWeight: "bold", visible: true },
    { id: "barcode", x: 2, y: 22, fontSize: 6, barcodeHeight: 10, visible: true },
    { id: "sku", x: 2, y: 36, fontSize: 6, fontWeight: "normal", visible: true },
  ],
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

    const [fetchedProducts, templates] = await Promise.all([
      fetchPriceTags(productIds, copies, branchId || undefined),
      branchId ? fetchPriceTagTemplates(branchId) : Promise.resolve([]),
    ]);

    products.value = fetchedProducts;
    template.value =
      (templateId && templates.find((t) => t.id === templateId)) ||
      templates[0] ||
      FALLBACK_TEMPLATE;
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
  <div class="price-tags-page">
    <p v-if="loading" class="no-print status">Загрузка...</p>
    <p v-else-if="error" class="no-print status status-error">{{ error }}</p>
    <PriceTagGrid v-else-if="template" :products="products" :template="template" />
  </div>
</template>

<style scoped>
.price-tags-page {
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
