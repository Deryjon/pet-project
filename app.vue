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
    <NuxtLoadingIndicator
      :height="3"
      color="linear-gradient(90deg, #1f78ff, #38bdf8)"
      :duration="2500"
      :throttle="100"
    />
    <NuxtLayout>
      <NuxtPage :transition="pageTransition" />
    </NuxtLayout>

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

.price-tags-print-block {
  display: none;
}
@media print {
  .price-tags-print-block {
    display: block;
    position: fixed;
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
