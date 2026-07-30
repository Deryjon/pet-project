<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from "vue";
import PriceTag from "./PriceTag.vue";
import type { PriceTagProduct, PriceTagTemplate } from "@/composables/usePriceTagsData";

const props = withDefaults(
  defineProps<{
    products: Array<PriceTagProduct & { copies: number }>;
    template: PriceTagTemplate;
    showDiscount?: boolean;
  }>(),
  { showDiscount: true },
);

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

// Each tag gets its own page sized exactly to the template — printing is
// always onto a roll of pre-cut labels sized to the template itself.
const PAGE_STYLE_ID = "price-tag-page-size";

function applyPageStyle() {
  if (!import.meta.client) return;
  let tag = document.getElementById(PAGE_STYLE_ID) as HTMLStyleElement | null;
  if (!tag) {
    tag = document.createElement("style");
    tag.id = PAGE_STYLE_ID;
    document.head.appendChild(tag);
  }
  tag.textContent = `@media print { @page { size: ${props.template.width}mm ${props.template.length}mm; margin: 0; } }`;
}

watch(() => [props.template.width, props.template.length], applyPageStyle, { immediate: true });
onMounted(applyPageStyle);
onUnmounted(() => {
  if (!import.meta.client) return;
  document.getElementById(PAGE_STYLE_ID)?.remove();
});
</script>

<template>
  <div
    class="price-tag-grid price-tag-grid-single"
    :style="{ '--tag-width': `${template.width}mm`, '--tag-height': `${template.length}mm` }"
  >
    <PriceTag
      v-for="tag in tags"
      :key="tag.key"
      :product="tag.product"
      :template="template"
      :show-discount="showDiscount"
    />
  </div>
</template>

<style scoped>
.price-tag-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, var(--tag-width));
  gap: 2mm;
  justify-content: start;
}
.price-tag-grid-single :deep(.price-tag) {
  break-after: page;
  page-break-after: always;
}
</style>
