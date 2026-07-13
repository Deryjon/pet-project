<template>
  <section class="catalog">
    <div class="top flex justify-between">
      <h2 class="text-[36px] font-bold text-white">История остатков</h2>
    </div>

    <p class="mt-2 text-[14px] text-[#a6a6a6]">
      Все изменения остатков: импорт, ручное редактирование, трансфер, продажа, списание.
    </p>

    <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <CustomSelect
        v-model="store.movementType"
        label="Источник"
        :options="MOVEMENT_TYPE_OPTIONS"
        placeholder="Все источники"
      />
    </div>

    <BaseDataTableHeader
      class="mt-4"
      v-model="globalFilterInput"
      :showSearch="true"
      searchPlaceholder="Товар, магазин, пользователь"
    />

    <BaseDataTable class="mt-4" :table="store.table" :store="store" />
    <StoreDataTablePagination :store="store" />
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useHead } from "#imports";
import BaseDataTable from "@/components/BaseDataTable.vue";
import BaseDataTableHeader from "@/components/BaseDataTableHeader.vue";
import StoreDataTablePagination from "@/components/StoreDataTablePagination.vue";
import CustomSelect from "@/components/ui/CustomSelect.vue";
import {
  MOVEMENT_TYPE_OPTIONS,
  useStockMovementsDataTableStore,
} from "@/store/DataTables/stockMovementsDataTableStore";

useHead({ title: "История остатков | Konkurent" });

const store = useStockMovementsDataTableStore();
const globalFilterInput = ref(store.globalFilter);

watch(globalFilterInput, (value) => {
  store.globalFilter = value;
});

onMounted(() => {
  store.fetchData();
});
</script>
