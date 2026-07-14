<script setup lang="ts">
import { computed } from "vue";
import PriceTag from "./PriceTag.vue";
import type { PriceTagProduct, PriceTagTemplateData } from "@/composables/usePriceTagsData";

const props = defineProps<{
  products: Array<PriceTagProduct & { copies: number }>;
  template: PriceTagTemplateData;
}>();

const tags = computed(() => {
  const expanded: Array<{ key: string; product: PriceTagProduct }> = [];
  props.products.forEach((product, productIndex) => {
    const copies = Math.max(1, Math.floor(product.copies) || 1);
    for (let i = 0; i < copies; i += 1) {
      expanded.push({ key: `${productIndex}-${i}`, product });
    }
  });
  return expanded;
});
</script>

<template>
  <div
    class="price-tag-grid"
    :style="{ '--tag-width': `${template.width}mm`, '--tag-height': `${template.length}mm` }"
  >
    <PriceTag v-for="tag in tags" :key="tag.key" :product="tag.product" :template="template" />
  </div>
</template>

<style>
@media print {
  @page {
    size: auto;
    margin: 3mm;
  }
}
</style>

<style scoped>
.price-tag-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, var(--tag-width));
  gap: 2mm;
  justify-content: start;
}
</style>
