<script setup lang="ts">
import { onMounted } from "vue";
import { useLocationStore } from "./store/useLocationStore";
import { usePrintWindow } from "./composables/usePrintWindow";
import PriceTagGrid from "./components/print/PriceTagGrid.vue";

const locationStore = useLocationStore();
const { printProducts, printTemplate, printShowDiscount } = usePrintWindow();

const pageTransition = {
  name: "page",
};

onMounted(() => {
  locationStore.init();
});
</script>

<template>
  <UApp>
    <!-- Price tags print at a tiny fixed @page size (the template's own
         mm dimensions), unlike receipts which use @page size:auto (one
         infinitely tall page). body * {visibility:hidden} alone (below)
         keeps the rest of the app invisible but NOT out of layout flow —
         combined with receipt-print.css forcing every element's
         max-height:none for the (unrelated) receipt-clipping fix, the
         real, expanded height of the whole app still gets paginated
         across dozens of 20mm-tall pages, and since the price-tag block
         is position:fixed it then gets reprinted on every one of them.
         Fully removing the rest of the app from layout during a price-tag
         print (display:none, not just invisible) avoids that entirely.
         Scoped to price-tag printing only — receipts still need this
         subtree alive since #receipt-page-size lives inside it. -->
    <div class="app-shell" :class="{ 'app-shell-print-hidden': printTemplate && printProducts.length }">
      <NuxtLoadingIndicator
        :height="3"
        color="linear-gradient(90deg, #1f78ff, #38bdf8)"
        :duration="2500"
        :throttle="100"
      />
      <NuxtLayout>
        <NuxtPage :transition="pageTransition" />
      </NuxtLayout>
    </div>

    <!-- Single app-wide print target for price tags — kept out of normal
         layout flow and hidden on screen; the global print stylesheet
         (assets/css/receipt-print.css) makes .price-tags-page visible and
         everything else on the page invisible for the duration of print. -->
    <div
      v-if="printTemplate && printProducts.length"
      class="price-tags-page price-tags-print-block"
    >
      <PriceTagGrid :products="printProducts" :template="printTemplate" :show-discount="printShowDiscount" />
    </div>
  </UApp>
</template>

<style>
body {
  color: white;
  font-family: "Gilroy-Bold", "Helvetica Neue", Arial, sans-serif;
}
body.no-scroll {
  overflow: hidden !important;
}

.shadow-style {
  border-radius: 20px;
  box-shadow: 0px 0px 20px rgba(255, 255, 255, 0.08);
}

input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}

@media print {
  .app-shell-print-hidden {
    display: none !important;
  }
}

.price-tags-print-block {
  display: none;
}
@media print {
  .price-tags-print-block {
    display: block;
    /* position:fixed is the CSS Paged Media "repeat on every page" mode
       (like a running header) — content inside it does NOT participate in
       normal-flow pagination, so break-after:page on each .price-tag never
       actually produced more than 1 physical page once the rest of the app
       stopped contributing extra height (see app-shell-print-hidden above).
       position:absolute keeps it out of the (hidden) app-shell's layout
       without opting into that per-page-repeat behavior. */
    position: absolute;
    left: 0;
    top: 0;
  }
}

/* Cross-fade: old page fades out while new page fades in simultaneously */
/* The leaving page becomes absolute so it doesn't push new page down */
.page-leave-active {
  transition: opacity 0.15s ease;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  pointer-events: none;
}

.page-enter-active {
  transition: opacity 0.2s ease;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
}
</style>
