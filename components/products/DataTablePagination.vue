<script setup lang="ts">
import { computed } from "vue";
import { useCatalogDataTableStore } from "@/store/DataTables/catalogDataTableStore";

const store = useCatalogDataTableStore();
const currentPage = computed(() => store.pagination.pageIndex + 1);
const totalPages = computed(() => store.totalPages);
</script>

<template>
  <div class="mt-[15px] flex items-center justify-center gap-[10px]">
    <button
      class="rounded-[10px] bg-[#404040] px-[12px] py-[8px] text-white hover:bg-[#5e5e5e]"
      :disabled="currentPage === 1 || store.loading"
      @click="store.previousPage()"
    >
      Назад
    </button>

    <span class="text-white">
      {{ currentPage }} / {{ totalPages }}
    </span>

    <button
      class="rounded-[10px] bg-[#404040] px-[12px] py-[8px] text-white hover:bg-[#5e5e5e]"
      :disabled="currentPage === totalPages || store.loading"
      @click="store.nextPage()"
    >
      Вперед
    </button>
  </div>
</template>
