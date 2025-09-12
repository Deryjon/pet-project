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
}
body.no-scroll {
  overflow: hidden !important;
}

.shadow-style {
  border-radius: 20px;
  box-shadow: 0px 0px 20px rgba(255, 255, 255, 0.08);
}
</style>