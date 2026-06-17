<script setup lang="ts">
import { onMounted } from "vue";
import { useLocationStore } from "./store/useLocationStore";

const locationStore = useLocationStore();

const pageTransition = {
  name: "page",
  mode: "out-in" as const,
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

/* Р”Р»СЏ Chrome, Safari, Edge */
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Р”Р»СЏ Firefox */
input[type="number"] {
  -moz-appearance: textfield;
}
</style>

