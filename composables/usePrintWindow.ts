import { nextTick, ref } from "vue";
import type { PriceTagProduct, PriceTagTemplate } from "@/composables/usePriceTagsData";

export interface PriceTagsPrintOptions {
  showDiscount?: boolean;
}

// Module-level singleton: exactly one hidden PriceTagGrid is mounted app-wide
// (see app.vue) and reads this state, so every caller — the full print modal
// and the catalog's quick copies dialog alike — feeds the same print target
// instead of each rendering its own (which would print duplicates, since the
// print stylesheet makes every .price-tags-page element visible at once).
const printProducts = ref<Array<PriceTagProduct & { copies: number }>>([]);
const printTemplate = ref<PriceTagTemplate | null>(null);
const printShowDiscount = ref(true);

export function usePrintWindow() {
  async function openPriceTagsPrint(
    products: Array<PriceTagProduct & { copies: number }>,
    template: PriceTagTemplate,
    options?: PriceTagsPrintOptions,
  ) {
    printProducts.value = products;
    printTemplate.value = template;
    printShowDiscount.value = options?.showDiscount ?? true;
    await nextTick();
    window.print();
  }

  return { printProducts, printTemplate, printShowDiscount, openPriceTagsPrint };
}
