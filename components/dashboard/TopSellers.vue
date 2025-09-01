<script setup lang="ts">
import { useDashboardStore } from "@/store/dashboard";

const store = useDashboardStore();
const sellers = store.periodData.topSellers;
</script>

<template>
  <div class="p-4  rounded-2xl shadow-lg">
    <h2 class="text-lg font-semibold mb-3">Лучшие продавцы</h2>
    <ul class="space-y-2 text-sm">
      <li
        v-for="(s, i) in sellers"
        :key="i"
        class="flex justify-between"
      >
        <span>{{ s.name }}</span>
        <span class="font-medium text-indigo-600">
          {{ s.sum.toLocaleString() }} сум
        </span>
      </li>
    </ul>
  </div>
</template>
