<script setup lang="ts">
import { useRouter } from "vue-router";
import { useHead } from "#imports";

useHead({
  title: "Массовые операции | Konkurent.cases",
  meta: [{ name: "description", content: "Описание страницы" }],
});

definePageMeta({
  layout: "empty",
});

</script>
<template>
  <div class="">
    <NuxtPage /> <!-- Здесь рендерятся вложенные страницы -->
  </div>
</template>
