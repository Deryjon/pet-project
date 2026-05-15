<script setup lang="ts">
import { computed, ref, watch, onMounted, h } from "vue";
import { useHead, useRoute, useRouter } from "#imports";
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
  type ColumnDef,
} from "@tanstack/vue-table";
import DataTable from "@/components/DataTable.vue";
import BaseDataTable from "@/components/BaseDataTable.vue";
import BaseDataTableHeader from "@/components/BaseDataTableHeader.vue";
import BaseDataTablePagination from "@/components/dashboard/BaseDataTablePagination.vue";
import ProductDetailsSlideover from "@/components/ProductDetailsSlideover.vue"; // New component for point 9
import { formatCurrency } from "@/utils/formatters"; // Assuming a formatter utility

useHead({ title: "Каталог товаров | Konkurent" });

// --- Data types (example, adjust as per your API) ---
interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive' | 'low_stock' | 'zero_stock' | 'archived';
  // Add other product fields as needed
}

// --- State ---
const route = useRoute();
const router = useRouter();

const loadingProducts = ref(false);
const products = ref<Product[]>([]); // This will be populated from an API
const searchQuery = ref("");
const tableSorting = ref<any[]>([]);
const tablePagination = ref({
  pageIndex: Number(route.query.page || 0),
  pageSize: Number(route.query.limit || 10),
});

const activeFilter = ref<'all' | 'active' | 'inactive' | 'low_stock' | 'zero_stock'>('all');
const showArchived = ref(false);

const isProductDetailsOpen = ref(false); // For Point 9
const selectedProductId = ref<string | null>(null); // For Point 9

// --- Computed properties ---
const filteredProducts = computed(() => {
  let result = products.value;

  // Apply search query
  const query = searchQuery.value.trim().toLowerCase();
  if (query) {
    result = result.filter((product) =>
      [product.name, product.sku, product.barcode].some((value) =>
        String(value || "").toLowerCase().includes(query),
      ),
    );
  }

  // Apply status filter
  if (activeFilter.value !== 'all') {
    result = result.filter(product => product.status === activeFilter.value);
  }

  // Apply archived filter
  if (!showArchived.value) {
    result = result.filter(product => product.status !== 'archived');
  }

  return result;
});

const tableColumns = computed<ColumnDef<Product>[]>(() => [
  {
    accessorKey: "name",
    header: "Наименование",
    cell: ({ row }) => h(
      "button",
      {
        type: "button",
        class: "text-left text-[16px] font-semibold text-white transition hover:text-[#8fc1ff]",
        onClick: () => openProductDetails(row.original.id), // Point 9
      },
      row.original.name || "Без названия",
    ),
  },
  {
    accessorKey: "sku",
    header: "Артикул",
    cell: ({ row }) => h("span", { class: "text-sm text-[#b8b8b8]" }, row.original.sku || "-"),
  },
  {
    accessorKey: "barcode",
    header: "Штрихкод",
    cell: ({ row }) => h("span", { class: "text-sm text-[#b8b8b8]" }, row.original.barcode || "-"),
  },
  {
    accessorKey: "price",
    header: "Цена",
    cell: ({ row }) => h("span", { class: "text-sm text-[#d6d6d6]" }, formatCurrency(row.original.price)), // Point 7
  },
  {
    accessorKey: "stock",
    header: "Остаток",
    cell: ({ row }) => h("span", { class: "text-sm text-[#d6d6d6]" }, row.original.stock.toLocaleString()),
  },
  {
    accessorKey: "status",
    header: "Статус",
    cell: ({ row }) => h("span", { class: "text-sm text-[#d6d6d6]" }, row.original.status),
  },
  // Add more columns as needed
]);

const productsTable = useVueTable({
  get data() {
    return filteredProducts.value;
  },
  get columns() {
    return tableColumns.value;
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  state: {
    get sorting() {
      return tableSorting.value;
    },
    get pagination() {
      return tablePagination.value;
    },
  },
  onSortingChange: (updater: any) => {
    tableSorting.value = typeof updater === "function" ? updater(tableSorting.value) : updater;
  },
  onPaginationChange: (updater: any) => {
    tablePagination.value = typeof updater === "function" ? updater(tablePagination.value) : updater;
  },
});

const currentPage = computed(() => productsTable.getState().pagination.pageIndex + 1);
const totalPages = computed(() => Math.max(1, productsTable.getPageCount()));

// --- Methods ---
async function fetchProducts() {
  loadingProducts.value = true;
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  products.value = [
    { id: "prod1", name: "Молоко 3.2%", sku: "MK001", barcode: "1234567890123", price: 50000, stock: 100, status: 'active' },
    { id: "prod2", name: "Хлеб белый", sku: "HLB002", barcode: "1234567890124", price: 5000, stock: 0, status: 'zero_stock' },
    { id: "prod3", name: "Яблоки Голден", sku: "YBL003", barcode: "1234567890125", price: 25000, stock: 5, status: 'low_stock' },
    { id: "prod4", name: "Сок апельсиновый", sku: "SOK004", barcode: "1234567890126", price: 15000, stock: 20, status: 'active' },
    { id: "prod5", name: "Масло сливочное", sku: "MSL005", barcode: "1234567890127", price: 30000, stock: 0, status: 'zero_stock' },
    { id: "prod6", name: "Кофе растворимый", sku: "KOF006", barcode: "1234567890128", price: 75000, stock: 2, status: 'low_stock' },
    { id: "prod7", name: "Чай черный", sku: "CHY007", barcode: "1234567890129", price: 40000, stock: 150, status: 'active' },
    { id: "prod8", name: "Печенье овсяное", sku: "PCH008", barcode: "1234567890130", price: 10000, stock: 0, status: 'zero_stock' },
    { id: "prod9", name: "Вода минеральная", sku: "VOD009", barcode: "1234567890131", price: 8000, stock: 3, status: 'low_stock' },
    { id: "prod10", name: "Шоколад молочный", sku: "SHK010", barcode: "1234567890132", price: 20000, stock: 50, status: 'active' },
    { id: "prod11", name: "Архивный товар", sku: "ARC011", barcode: "1234567890133", price: 10000, stock: 0, status: 'archived' },
  ];
  loadingProducts.value = false;
}

function previousPage() {
  productsTable.previousPage();
}

function nextPage() {
  productsTable.nextPage();
}

function updatePageSize(size: number) {
  productsTable.setPageSize(size);
}

function openProductDetails(productId: string) {
  selectedProductId.value = productId;
  isProductDetailsOpen.value = true;
}

function navigateToCreateProduct() {
  router.push('/products/create'); // Point 6, 8
}

function navigateToCatalogManagement() {
  // Implement navigation or modal for catalog management (Point 2)
  console.log("Navigating to Catalog Management");
}

// --- Watchers for URL synchronization (Point 12) ---
watch([() => tablePagination.value.pageIndex, () => tablePagination.value.pageSize], ([pageIndex, pageSize]) => {
  router.push({
    query: {
      ...route.query,
      page: pageIndex,
      limit: pageSize,
    },
  });
}, { deep: true });

watch(route, (newRoute) => {
  tablePagination.value.pageIndex = Number(newRoute.query.page || 0);
  tablePagination.value.pageSize = Number(newRoute.query.limit || 10);
});

// --- Lifecycle hooks ---
onMounted(() => {
  fetchProducts();
});
</script>

<template>
  <section class="catalog text-white">
    <div class="top flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div>
        <h2 class="text-[28px] font-bold sm:text-[36px]">Каталог товаров</h2>
        <p class="mt-2 max-w-[760px] text-[15px] text-[#bdbdbd]">
          Управляйте ассортиментом, ценами и остатками товаров.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="rounded-[15px] bg-[#404040] px-4 py-3 text-[15px] font-semibold text-white transition-colors duration-300 hover:bg-[#505050]"
          @click="showArchived = !showArchived"
        >
          {{ showArchived ? 'Скрыть архивные' : 'Показать архивные' }}
        </button>
        <button
          type="button"
          class="rounded-[15px] bg-[#404040] px-4 py-3 text-[15px] font-semibold text-white transition-colors duration-300 hover:bg-[#505050]"
          @click="navigateToCatalogManagement"
        >
          Управление каталогом
        </button>
        <button
          type="button"
          class="rounded-[15px] bg-[#1f78ff] px-4 py-3 text-[15px] font-bold text-white transition-colors duration-200 hover:bg-[#2a6ed9]"
          @click="navigateToCreateProduct"
        >
          Создать товар
        </button>
      </div>
    </div>

    <div class="mt-[40px] space-y-5">
      <DataTable>
        <template #header>
          <BaseDataTableHeader
            v-model="searchQuery"
            :showSearch="true"
            searchPlaceholder="Поиск по наименованию, артикулу или штрихкоду"
            :createButton="{ label: 'Создать товар', onClick: navigateToCreateProduct }"
          />
          <!-- Filters (Points 3, 4, 5) -->
          <div class="flex flex-wrap gap-2 p-4 bg-[#2b2b2b] rounded-b-lg border-t border-white/10">
            <button
              v-for="filterOption in ['all', 'active', 'inactive', 'low_stock', 'zero_stock']"
              :key="filterOption"
              @click="activeFilter = filterOption as any"
              :class="[
                'px-3 py-1 rounded-full text-sm font-medium transition-colors',
                activeFilter === filterOption ? 'bg-[#1f78ff] text-white' : 'bg-[#404040] text-[#bdbdbd] hover:bg-[#505050]'
              ]"
            >
              {{ {
                'all': 'Все',
                'active': 'Активные',
                'inactive': 'Неактивные',
                'low_stock': 'Малый остаток',
                'zero_stock': 'Нулевой остаток'
              }[filterOption] }}
            </button>
          </div>
        </template>

        <BaseDataTable
          :table="productsTable"
          :store="{ loading: loadingProducts }"
          interactiveColumnId="name"
          :onRowClick="openProductDetails"
        />

        <template #pagination>
          <BaseDataTablePagination
            :currentPage="currentPage"
            :totalPages="totalPages"
            :loading="loadingProducts"
            :pageSize="tablePagination.pageSize"
            :pageSizeOptions="[10, 20, 30, 40, 50]"
            @previous="previousPage"
            @next="nextPage"
            @update:pageSize="updatePageSize"
          />
        </template>
      </DataTable>
    </div>

    <!-- Product Details Slide-over (Point 9) -->
    <ProductDetailsSlideover :product-id="selectedProductId" v-model:open="isProductDetailsOpen" />
  </section>
</template>

<style scoped>
/* Add filter design improvements here (Point 5) */
/* Example: */
.filter-button {
  /* ... */
}
</style>