<script setup lang="ts">
import { useInventoryDataTableStore } from "@/store/inventoryDataTableStore";
import BaseDataTable from "@/components/BaseDataTable.vue";

const store = useInventoryDataTableStore();

</script>

<template>
  <BaseDataTable :table="store.table" :store="store" />
</template>
<style>
table {
  width: 100%;
}
td {
  padding: 25px 20px;
  text-align: left;
}
th {
  text-align: left;
  font-weight: bold;
}
button:disabled {
  cursor: not-allowed;
}
input:focus {
  border: none;
  outline: none;
}
input::placeholder {
  color: #bdbdbd;
}
</style>
