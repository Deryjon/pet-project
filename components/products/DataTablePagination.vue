<script setup lang="ts">
import { computed } from "vue";
import { useCatalogDataTableStore } from "@/store/DataTables/catalogDataTableStore";

const store = useCatalogDataTableStore();

// ⚡ берём pageIndex и pageSize из store.pagination
const currentPage = computed(() => store.pagination.pageIndex + 1);
const totalPages = computed(() =>
  Math.max(1, Math.ceil(store.filteredData.length / store.pagination.pageSize))
);
</script>

<template>
  <div class="flex justify-center items-center gap-[10px] mt-[15px]">
    <button
      class="px-[12px] py-[8px] rounded-[10px] bg-[#404040] text-white hover:bg-[#5e5e5e]"
      :disabled="currentPage === 1"
      @click="store.previousPage()"
    >
      Назад
    </button>

    <span class="text-white">
      {{ currentPage }} / {{ totalPages }}
    </span>

    <button
      class="px-[12px] py-[8px] rounded-[10px] bg-[#404040] text-white hover:bg-[#5e5e5e]"
      :disabled="currentPage === totalPages"
      @click="store.nextPage()"
    >
      Вперед
    </button>
  </div>
</template>
