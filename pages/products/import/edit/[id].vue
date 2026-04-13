<template>
  <section class="rounded-[28px] bg-[#2b2b2b] p-8 text-white">
    Перенаправляем в таблицу импорта...
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useHead, useRoute, useRouter } from "#imports";

const route = useRoute();
const router = useRouter();
const importId = computed(() => String(route.params.id ?? ""));

onMounted(async () => {
  if (!importId.value) {
    await router.replace("/products/import");
    return;
  }

  await router.replace(`/products/import/list/${importId.value}?limit=20&page=1`);
});

useHead({
  title: "Импорт",
});
</script>
