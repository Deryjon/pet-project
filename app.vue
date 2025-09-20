<script setup lang="ts">
import { onMounted } from 'vue';
import { useLocationStore } from './store/useLocationStore'; // путь поправь если нужно

const locationStore = useLocationStore();

onMounted(() => {
  locationStore.init();
});
</script>

<template>
  <div>
    <NuxtLayout >
      <NuxtPage />
      
    </NuxtLayout>
  </div>
</template>
<style>
body{
  color: white; 
  font-family: 'Inter', sans-serif;
}
body.no-scroll {
  overflow: hidden !important;
}

.shadow-style {
  border-radius: 20px;
  box-shadow: 0px 0px 20px rgba(255, 255, 255, 0.08);
}
/* Для Chrome, Safari, Edge */
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Для Firefox */
input[type="number"] {
  -moz-appearance: textfield;
}

</style>