<script setup lang="ts">
import { useDashboardStore } from "@/store/dashboard";

const store = useDashboardStore();
const products = store.periodData.topProducts;
</script>

<template>
  <div class="p-4  rounded-2xl shadow-lg">
    <h2 class="text-lg font-semibold mb-3">Топ товары</h2>
    <ul class="space-y-2 text-sm">
      <li v-for="(p, i) in products" :key="i" class="flex justify-between">
        <span>{{ p.name }}</span>
        <span class="font-medium text-blue-600">
          {{ p.sum.toLocaleString() }} сум
        </span>
      </li>
    </ul>
  </div>
</template>
