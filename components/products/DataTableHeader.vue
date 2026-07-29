<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useCatalogDataTableStore } from "@/store/DataTables/catalogDataTableStore";
import BaseDataTableHeader from "../BaseDataTableHeader.vue";

const store = useCatalogDataTableStore();
const router = useRouter();
const { can } = useAccessControl();
const { isSupported: scannerSupported, scanBarcode } = useBarcodeScanner();
const toast = useToast();

const globalFilterInput = ref(store.globalFilter);

async function handleScan() {
  try {
    const code = await scanBarcode();
    if (code) globalFilterInput.value = code;
  } catch (error: any) {
    toast.add({
      title: "Не удалось отсканировать штрихкод",
      description: error?.message || undefined,
      color: "error",
    });
  }
}

const actionButtons = computed(() => {
  const buttons = [{ label: "Действия", onClick: goToActions }];
  if (scannerSupported.value) {
    buttons.push({ label: "Скан", onClick: () => void handleScan() });
  }
  return buttons;
});
const selectedFilter = computed({
  get: () => store.activeStatusFilter,
  set: (value: string) => {
    store.activeStatusFilter = value;
  },
});
const showFilters = ref(false);

function goToActions() {
  if (store.selectedProducts.length === 0) {
    alert("Выберите хотя бы один товар");
    return;
  }

  router.push({
    path: "/products/settings",
    query: { ids: store.selectedProducts.join(",") },
  });
}

const MIN_SEARCH_LENGTH = 4;

let searchDebounce: ReturnType<typeof setTimeout> | null = null;
onUnmounted(() => { if (searchDebounce) clearTimeout(searchDebounce); });

watch(globalFilterInput, (val) => {
  if (searchDebounce) clearTimeout(searchDebounce);

  const trimmedLength = (val || "").trim().length;
  if (trimmedLength > 0 && trimmedLength < MIN_SEARCH_LENGTH) return;

  searchDebounce = setTimeout(() => {
    store.globalFilter = val;
  }, 350);
});
</script>

<template>
  <BaseDataTableHeader
    v-model="globalFilterInput"
    v-model:activeFilter="selectedFilter"
    :showSearch="true"
    searchPlaceholder="Артикул, баркод, наименование"
    :minSearchLength="4"
    :showFilters="true"
    :createButton="can('product-create') ? { label: 'Создать', to: '/products/create?page=1' } : undefined"
    @toggleFilters="showFilters = !showFilters"
    :actionButtons="actionButtons"
    :statFilters="store.statusFilters"
  />

  <TableFilter v-if="showFilters" />
</template>
