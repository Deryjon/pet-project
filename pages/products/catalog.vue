<template>
  <section class="catalog">
    <!-- Shop selection guard: catalog-operations есть, но магазин не выбран -->
    <template v-if="needsShopSelection">
      <div class="flex min-h-105 flex-col items-center justify-center gap-6 text-center">
        <div class="flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#404040]">
          <Icon name="heroicons:building-storefront" class="h-8 w-8 text-[#bdbdbd]" />
        </div>

        <div>
          <h3 class="text-[22px] font-semibold text-white">Выберите магазин</h3>
          <p class="mt-1 text-sm text-[#9a9a9a]">
            Для просмотра каталога необходимо выбрать магазин
          </p>
        </div>

        <div v-if="!hasAvailableShops" class="text-sm text-[#9a9a9a]">
          Нет доступных магазинов
        </div>

        <div v-else class="flex w-full max-w-xs flex-col gap-3">
          <button
            v-for="shop in locations"
            :key="shop.id"
            type="button"
            :disabled="isSwitching"
            class="w-full rounded-[16px] bg-[#404040] px-5 py-4 text-left text-[16px] font-semibold text-white transition hover:bg-[#505050] disabled:cursor-not-allowed disabled:opacity-60"
            @click="setLocation(shop)"
          >
            {{ shop.name }}
          </button>
        </div>
      </div>
    </template>

    <!-- Основной каталог -->
    <template v-else>
      <div class="top flex flex-col gap-4 xl:flex-row xl:items-center justify-between">
        <div class="flex flex-col gap-2">
          <h2 class="text-[28px] font-bold text-white sm:text-[36px]">Каталог</h2>
        </div>
        <div class="flex justify-between gap-4  items-center">
          <div
            v-if="can('catalog-statistics')"
            class="flex cursor-pointer items-center gap-2.5 text-[#b5b4b4]"
            @click="toggleStats"
          >
            <Icon
              name="tabler:chevron-down"
              class="h-5 w-5 text-muted-foreground transition-transform duration-200"
              :class="{ 'rotate-180': showStats }"
            />
            <p class="text-[17px] font-normal">
              {{ statsToggleLabel }}
            </p>
          </div>

          <div class="buttons flex items-center gap-2">
            <UButton
              v-if="store.archivedOnly && store.selectedProducts.length > 0"
              color="error"
              variant="solid"
              :loading="deletingSelected"
              class="rounded-[15px] px-4 py-2 text-[14px] font-semibold"
              @click="deleteSelectedConfirmOpen = true"
            >
              <Icon name="heroicons:trash" class="h-4 w-4 mr-1" />
              Удалить выбранные ({{ store.selectedProducts.length }})
            </UButton>

            <UButton
              v-if="store.archivedOnly"
              color="error"
              variant="soft"
              :loading="clearingArchive"
              class="rounded-[15px] px-4 py-2 text-[14px] font-semibold"
              @click="clearArchiveConfirmOpen = true"
            >
              <Icon name="heroicons:trash" class="h-4 w-4 mr-1" />
              Очистить архив
            </UButton>

            <UTooltip
              v-for="action in actions"
              :key="action.tooltip"
              :text="action.tooltip"
            >
              <UButton
                color="neutral"
                variant="ghost"
                :class="[actionButtonClass, action.buttonClass]"
                :aria-label="action.tooltip"
                :title="action.tooltip"
                @click="action.onClick"
              >
                <Icon :name="action.icon" :class="action.iconClass" />
              </UButton>
            </UTooltip>
          </div>

          <UModal v-model:open="clearArchiveConfirmOpen" :ui="{ content: 'max-w-[480px] rounded-[28px] bg-[#262626] p-0 text-white border border-white/10' }">
            <template #content>
              <div class="p-7">
                <h3 class="text-[22px] font-bold">Очистить архив?</h3>
                <p class="mt-3 text-[15px] text-[#d1d5db]">
                  Все архивированные товары будут удалены безвозвратно. Это действие нельзя отменить.
                </p>
                <div class="mt-7 flex items-center justify-end gap-3">
                  <UButton
                    color="neutral"
                    variant="soft"
                    class="rounded-[14px] bg-[#404040] px-5 py-3 text-white hover:bg-[#505050]"
                    @click="clearArchiveConfirmOpen = false"
                  >
                    Отмена
                  </UButton>
                  <UButton
                    color="error"
                    variant="solid"
                    :loading="clearingArchive"
                    class="rounded-[14px] px-5 py-3"
                    @click="confirmClearArchive"
                  >
                    Удалить всё
                  </UButton>
                </div>
              </div>
            </template>
          </UModal>

          <UModal v-model:open="deleteSelectedConfirmOpen" :ui="{ content: 'max-w-[480px] rounded-[28px] bg-[#262626] p-0 text-white border border-white/10' }">
            <template #content>
              <div class="p-7">
                <h3 class="text-[22px] font-bold">Удалить выбранные товары?</h3>
                <p class="mt-3 text-[15px] text-[#d1d5db]">
                  Будет удалено {{ store.selectedProducts.length }} товаров безвозвратно. Это действие нельзя отменить.
                </p>
                <div class="mt-7 flex items-center justify-end gap-3">
                  <UButton
                    color="neutral"
                    variant="soft"
                    class="rounded-[14px] bg-[#404040] px-5 py-3 text-white hover:bg-[#505050]"
                    @click="deleteSelectedConfirmOpen = false"
                  >
                    Отмена
                  </UButton>
                  <UButton
                    color="error"
                    variant="solid"
                    :loading="deletingSelected"
                    class="rounded-[14px] px-5 py-3"
                    @click="confirmDeleteSelected"
                  >
                    Удалить навсегда
                  </UButton>
                </div>
              </div>
            </template>
          </UModal>
        </div>
      </div>

      <transition name="fade">
        <div
          v-if="showStats"
          class="mt-2.5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"
        >
          <StatsBox
            v-for="item in statsItems"
            :key="item.label"
            :label="item.label"
            :value="item.value"
          />
        </div>
      </transition>

      <DataTable class="mt-10" />
    </template>
  </section>

  <BulkSkuBarcodeEditor v-model:open="bulkFixOpen" />
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";
import { useHead } from "#imports";
import DataTable from "@/components/CatalogDataTable.vue";
import StatsBox from "@/components/ui/StatsBox.vue";
import BulkSkuBarcodeEditor from "@/components/BulkSkuBarcodeEditor.vue";
import { useCatalogDataTableStore } from "@/store/DataTables/catalogDataTableStore";
import { useLocationStore } from "@/store/useLocationStore";
import { normalizeApiError, useProducts } from "~/composables/useProducts";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

const store = useCatalogDataTableStore();
const route = useRoute();
const router = useRouter();
const locationStore = useLocationStore();
const toast = useToast();
const { can } = useAccessControl();
const {
  needsShopSelection,
  hasAvailableShops,
  locations,
  isSwitching,
  setLocation,
} = useShopAccess();
const { clearAllArchivedProducts, bulkDeleteProducts } = useProducts();
const { selectedLocation } = storeToRefs(locationStore);
const showStats = ref(false);
const statsItems = computed(() => store.statsCards);
const clearingArchive = ref(false);
const clearArchiveConfirmOpen = ref(false);
const deletingSelected = ref(false);
const deleteSelectedConfirmOpen = ref(false);
const bulkFixOpen = ref(false);

const actions = computed(() => [
  {
    tooltip: store.archivedOnly ? "Скрыть архивированные продукты" : "Архивированные продукты",
    icon: "bi:archive-fill",
    iconClass: store.archivedOnly ? "h-4 w-4 text-white" : "h-4 w-4 text-[#3b82f6]",
    buttonClass: store.archivedOnly ? "bg-[#1f78ff] hover:bg-[#2a6ed9]" : "",
    onClick: toggleArchivedProducts,
  },
  {
    tooltip: "Исправить артикулы и баркоды",
    icon: "tabler:barcode",
    iconClass: "h-5 w-5 text-[#f59e0b]",
    buttonClass: "",
    onClick: () => { bulkFixOpen.value = true; },
  },
  {
    tooltip: "Управление каталогом",
    icon: "oui:nav-manage",
    iconClass: "h-5 w-5 text-[#3b82f6]",
    buttonClass: "",
    onClick: openCatalogManagement,
  },
]);

const actionButtonClass =
  "flex h-[56px] w-[56px] cursor-pointer items-center justify-center rounded-[15px] bg-[#404040] hover:bg-[#505050] active:bg-[#505050] focus-visible:ring-0";

const statsToggleLabel = computed(() =>
  showStats.value ? "Скрыть статистику" : "Показать статистику",
);

function toggleStats() {
  showStats.value = !showStats.value;
}

function readSingleQueryValue(value: unknown) {
  return Array.isArray(value) ? value[0] : value;
}

function readPositiveQueryNumber(value: unknown, fallback: number) {
  const parsed = Number(readSingleQueryValue(value));
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function readBooleanQuery(value: unknown) {
  const normalized = String(readSingleQueryValue(value) || "").trim().toLowerCase();
  return normalized === "1" || normalized === "true";
}

function syncStoreFromRoute() {
  const nextPage = readPositiveQueryNumber(route.query.page, DEFAULT_PAGE);
  const nextLimit = readPositiveQueryNumber(route.query.limit, DEFAULT_PAGE_SIZE);
  const nextArchived = readBooleanQuery(route.query.archived);

  if (
    store.pagination.pageIndex !== nextPage - 1 ||
    store.pagination.pageSize !== nextLimit
  ) {
    store.pagination = {
      pageIndex: nextPage - 1,
      pageSize: nextLimit,
    };
  }

  if (store.archivedOnly !== nextArchived) {
    store.archivedOnly = nextArchived;
  }
}

function syncRouteFromStore() {
  const nextQuery = {
    ...route.query,
    page: String(store.pagination.pageIndex + 1),
    limit: String(store.pagination.pageSize),
    ...(store.archivedOnly ? { archived: "1" } : {}),
  } as Record<string, string>;

  if (!store.archivedOnly) {
    delete nextQuery.archived;
  }

  const currentPage = String(readSingleQueryValue(route.query.page) || "");
  const currentLimit = String(readSingleQueryValue(route.query.limit) || "");
  const currentArchived = String(readSingleQueryValue(route.query.archived) || "");
  const nextArchived = nextQuery.archived || "";

  if (
    currentPage === nextQuery.page &&
    currentLimit === nextQuery.limit &&
    currentArchived === nextArchived
  ) {
    return;
  }

  const atDefaults =
    nextQuery.page === String(DEFAULT_PAGE) &&
    nextQuery.limit === String(DEFAULT_PAGE_SIZE) &&
    !nextQuery.archived;
  if (atDefaults && !currentPage && !currentLimit && !currentArchived) return;

  void router.replace({ query: nextQuery });
}

function toggleArchivedProducts() {
  store.archivedOnly = !store.archivedOnly;
}

function openCatalogManagement() {
  void router.push("/products/settings");
}

async function confirmClearArchive() {
  if (clearingArchive.value) return;
  clearingArchive.value = true;
  clearArchiveConfirmOpen.value = false;
  try {
    const result = await clearAllArchivedProducts();
    toast.add({ title: `Удалено товаров из архива: ${result?.deleted_count ?? 0}`, color: "success" });
    await store.fetchData();
  } catch (error: any) {
    toast.add({ title: "Не удалось очистить архив", description: normalizeApiError(error), color: "error" });
  } finally {
    clearingArchive.value = false;
  }
}

async function confirmDeleteSelected() {
  if (deletingSelected.value) return;
  deletingSelected.value = true;
  deleteSelectedConfirmOpen.value = false;
  try {
    const ids = store.selectedProducts;
    const result = await bulkDeleteProducts(ids);
    toast.add({ title: `Удалено товаров: ${result?.deleted_count ?? 0}`, color: "success" });
    await store.fetchData();
  } catch (error: any) {
    toast.add({ title: "Не удалось удалить товары", description: normalizeApiError(error), color: "error" });
  } finally {
    deletingSelected.value = false;
  }
}

async function refreshCatalog() {
  await store.fetchData({
    page: store.pagination.pageIndex + 1,
    pageSize: store.pagination.pageSize,
    search: store.globalFilter || undefined,
    status: store.activeStatusFilter,
    archivedList: store.archivedOnly,
  });
}

watch(
  () => [route.query.page, route.query.limit, route.query.archived],
  () => {
    if (store._skipNextRouteRefresh) {
      store._skipNextRouteRefresh = false;
      syncStoreFromRoute();
      return;
    }
    syncStoreFromRoute();
    refreshCatalog();
  },
);

watch(
  () => [store.pagination.pageIndex, store.pagination.pageSize, store.archivedOnly],
  () => {
    syncRouteFromStore();
  },
);

watch(
  () => selectedLocation.value?.id,
  async (next, prev) => {
    if (next && next !== prev) {
      syncStoreFromRoute();
      await refreshCatalog();
    }
  },
);

onMounted(() => {
  if (needsShopSelection.value) return;
  syncStoreFromRoute();
  syncRouteFromStore();
  refreshCatalog();
});

useHead({
  title: "Каталог | Konkurent",
  meta: [{ name: "description", content: "Описание страницы" }],
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
