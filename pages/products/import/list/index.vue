<template>
  <section class="rounded-[28px] bg-[#2b2b2b] p-8 text-white">
    Перенаправляем к списку импортов...
  </section>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useHead, useRouter } from "#imports";

const router = useRouter();

onMounted(async () => {
  await router.replace("/products/import");
});

useHead({
  title: "Импорт",
});
</script>
