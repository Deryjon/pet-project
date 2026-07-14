<script setup lang="ts">
import { computed } from "vue";
import { renderBarcodeSvg, type BarcodeFormat } from "@/utils/barcode";
import type {
  PriceTagElement,
  PriceTagProduct,
  PriceTagTemplateData,
} from "@/composables/usePriceTagsData";

const props = defineProps<{
  product: PriceTagProduct;
  template: PriceTagTemplateData;
}>();

const visibleElements = computed(() => props.template.elements.filter((e) => e.visible));

function formatPrice(value: number) {
  return `${Math.round(value).toLocaleString("ru-RU")} сум`;
}

function elementStyle(el: PriceTagElement, defaultSize: number) {
  return {
    left: `${el.x}mm`,
    top: `${el.y}mm`,
    fontSize: `${el.fontSize ?? defaultSize}pt`,
    fontWeight: el.fontWeight ?? "normal",
  };
}

function barcodeSvg(el: PriceTagElement) {
  if (!props.product.barcode) return "";
  return renderBarcodeSvg(props.product.barcode, {
    format: props.template.barcodeType as BarcodeFormat,
    height: (el.barcodeHeight ?? 10) * 2.83, // mm -> px, ~ same DPI jsbarcode assumes
    displayValue: true,
  });
}
</script>

<template>
  <div
    class="price-tag"
    :style="{ width: `${template.width}mm`, height: `${template.length}mm` }"
  >
    <template v-for="el in visibleElements" :key="el.id">
      <div v-if="el.id === 'name'" class="price-tag-el price-tag-name" :style="elementStyle(el, 8)">
        {{ product.name }}
      </div>
      <div v-else-if="el.id === 'price'" class="price-tag-el price-tag-price" :style="elementStyle(el, 14)">
        {{ formatPrice(product.price) }}
      </div>
      <div
        v-else-if="el.id === 'barcode' && product.barcode"
        class="price-tag-el price-tag-barcode"
        :style="{ left: `${el.x}mm`, top: `${el.y}mm` }"
        v-html="barcodeSvg(el)"
      />
      <div v-else-if="el.id === 'sku' && product.sku" class="price-tag-el price-tag-sku" :style="elementStyle(el, 6)">
        Арт: {{ product.sku }}
      </div>
    </template>
  </div>
</template>

<style scoped>
.price-tag {
  position: relative;
  overflow: hidden;
  background: #fff;
  color: #000;
  break-inside: avoid;
  page-break-inside: avoid;
}
.price-tag-el {
  position: absolute;
  white-space: nowrap;
  font-family: Arial, sans-serif;
  line-height: 1.15;
}
.price-tag-name {
  max-width: calc(100% - 4mm);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  white-space: normal;
}
.price-tag-barcode :deep(svg) {
  display: block;
}
</style>
