<template>
  <section class="catalog">
    <h2 class="text-[36px] font-bold text-white">Каталог</h2>
    <DataTable class="mt-[40px]"></DataTable>
  </section>
</template>

<script setup lang="ts">
import DataTable from "../../components/DataTable.vue";
import { useHead } from '#imports'

useHead({
  title: 'Каталог | Konkurent.cases',
  meta: [
    { name: 'description', content: 'Описание страницы' }
  ]
})
</script>

<style scoped></style>
