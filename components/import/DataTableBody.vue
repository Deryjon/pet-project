<script setup lang="ts">
import { onMounted } from "vue";
import { useImportDataTableStore } from "@/store/importDataTableStore";
import BaseDataTable from "@/components/BaseDataTable.vue";

const store = useImportDataTableStore();

</script>

<template>
  <BaseDataTable :table="store.table" :store="store" />
</template>
