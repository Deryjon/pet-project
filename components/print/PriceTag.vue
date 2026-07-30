<script setup lang="ts">
import { computed } from "vue";
import { renderBarcodeSvg, type BarcodeFormat } from "@/utils/barcode";
import type { PriceTagElement, PriceTagProduct, PriceTagTemplate } from "@/composables/usePriceTagsData";

const props = withDefaults(
  defineProps<{
    product: PriceTagProduct;
    template: PriceTagTemplate;
    showDiscount?: boolean;
  }>(),
  { showDiscount: true },
);

// The real CSS mm-to-px ratio (96dpi reference pixel) — must match every
// other renderer of this data (pages/products/settings/print-tag.vue's
// canvas/preview/print builder) or the barcode height drifts out of
// proportion with the surrounding mm-based elements.
const MM_TO_PX = 3.7795275591;

const visibleElements = computed(() =>
  props.showDiscount ? props.template.elements : props.template.elements.filter((e) => e.name !== "discount"),
);

function formatPrice(value: number) {
  return `${Math.round(value).toLocaleString("ru-RU")} сум`;
}

function textValue(el: PriceTagElement): string {
  switch (el.name) {
    case "product_name": return props.product.name;
    case "price": return formatPrice(props.product.price);
    case "sku": return props.product.sku ? `Арт: ${props.product.sku}` : "";
    case "shop_name": return props.product.shopName;
    case "discount": return props.product.discountPercent > 0 ? `-${props.product.discountPercent}%` : "";
    default: return "";
  }
}

function elementStyle(el: PriceTagElement): Record<string, string> {
  return {
    left: `${el.xAxis}mm`,
    top: `${el.yAxis}mm`,
    width: `${el.width}mm`,
    fontSize: `${el.fontSize}pt`,
    fontFamily: el.fontFamily || "Arial, sans-serif",
    fontWeight: el.isBold ? "700" : "400",
    fontStyle: el.isItalic ? "italic" : "normal",
    textDecoration: [el.isUnderlined ? "underline" : "", el.isLineThrough ? "line-through" : ""]
      .filter(Boolean)
      .join(" ") || "none",
    textAlign: el.alignmentType.toLowerCase() as "left" | "center" | "right",
    transform: el.rotation ? `rotate(${el.rotation}deg)` : "none",
    transformOrigin: "top left",
  };
}

function barcodeSvg(el: PriceTagElement) {
  if (!props.product.barcode) return "";
  return renderBarcodeSvg(props.product.barcode, {
    format: props.template.barcodeType as BarcodeFormat,
    height: el.length * MM_TO_PX,
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
      <div
        v-if="el.type === 'barcode' && product.barcode"
        class="price-tag-el price-tag-barcode"
        :style="{ left: `${el.xAxis}mm`, top: `${el.yAxis}mm`, width: `${el.width}mm`, height: `${el.length}mm`, transform: el.rotation ? `rotate(${el.rotation}deg)` : 'none', transformOrigin: 'top left' }"
        v-html="barcodeSvg(el)"
      />
      <div v-else-if="el.type === 'text' && textValue(el)" class="price-tag-el price-tag-text" :style="elementStyle(el)">
        {{ textValue(el) }}
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
  line-height: 1.15;
}
.price-tag-text {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  white-space: normal;
}
.price-tag-barcode :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
