<script setup lang="ts">
import { computed, h, onMounted, ref, watch } from "vue";
import { useHead } from "#imports";
import { useRoute, useRouter } from "vue-router";
import { getCoreRowModel, getSortedRowModel, useVueTable } from "@tanstack/vue-table";
import DataTable from "@/components/DataTable.vue";
import BaseDataTable from "@/components/BaseDataTable.vue";
import BaseDataTableHeader from "@/components/BaseDataTableHeader.vue";
import BaseDataTablePagination from "@/components/BaseDataTablePagination.vue";
import type { ClientGender, ClientListItem, ClientListQuery, NamedEntity } from "@/composables/useClients";
import { useClients } from "@/composables/useClients";
import { normalizeBirthDateForPayload } from "@/utils/birthDate";

useHead({ title: "Все клиенты | Konkurent" });

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

const route = useRoute();
const router = useRouter();
const toast = useToast();
const { listClients, getClientStats, getClientFilters, deleteClient } = useClients();

const showStats = ref(false);
const loading = ref(false);
const searchQuery = ref("");
const tableSorting = ref<any[]>([]);
const selectedClientIds = ref<string[]>([]);
const clients = ref<ClientListItem[]>([]);
const totalItems = ref(0);
const serverError = ref("");
const stats = ref({
  last_week_count: 0,
  not_returned_count: 0,
  birthday_count: 0,
});
const filters = ref<{
  groups: NamedEntity[];
  tags: NamedEntity[];
  shops: NamedEntity[];
  genders: ClientGender[];
}>({
  groups: [],
  tags: [],
  shops: [],
  genders: ["male", "female", "unknown"],
});
const filtersLoaded = ref(false);
const filtersLoading = ref(false);

const tablePagination = ref({
  pageIndex: 0,
  pageSize: DEFAULT_PAGE_SIZE,
});

const filtersOpen = ref(false);
const filterState = ref({
  groupId: "",
  tagId: "",
  birthDateFrom: "",
  birthDateTo: "",
  purchaseAmountFrom: "",
  purchaseAmountTo: "",
  lastPurchaseFrom: "",
  lastPurchaseTo: "",
  noPurchaseMonths: "",
  registeredFrom: "",
  registeredTo: "",
  registrationShopId: "",
  gender: "" as "" | ClientGender,
});

function readSingleQueryValue(value: unknown) {
  return Array.isArray(value) ? value[0] : value;
}

function readPositiveQueryNumber(value: unknown, fallback: number) {
  const parsed = Number(readSingleQueryValue(value));
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function formatUzs(value: number) {
  return `${new Intl.NumberFormat("ru-RU").format(Number(value || 0))} UZS`;
}

function formatDate(value: string | null, withTime = false) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const datePart = new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);

  if (!withTime) return datePart;

  const timePart = new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);

  return `${datePart} ${timePart}`;
}

function genderLabel(value: ClientGender | "") {
  if (value === "male") return "Мужской";
  if (value === "female") return "Женский";
  return "Неизвестно";
}

function syncPaginationFromRoute() {
  tablePagination.value = {
    pageIndex: readPositiveQueryNumber(route.query.page, DEFAULT_PAGE) - 1,
    pageSize: readPositiveQueryNumber(route.query.limit, DEFAULT_PAGE_SIZE),
  };
}

function syncRouteWithPagination() {
  const nextQuery = {
    ...route.query,
    page: String(tablePagination.value.pageIndex + 1),
    limit: String(tablePagination.value.pageSize),
  };

  const currentPageValue = String(readSingleQueryValue(route.query.page) || "");
  const currentLimitValue = String(readSingleQueryValue(route.query.limit) || "");
  if (currentPageValue === nextQuery.page && currentLimitValue === nextQuery.limit) return;

  const atDefaults =
    nextQuery.page === String(DEFAULT_PAGE) &&
    nextQuery.limit === String(DEFAULT_PAGE_SIZE);
  if (atDefaults && !currentPageValue && !currentLimitValue) return;

  void router.replace({ query: nextQuery });
}

function buildListQuery(): ClientListQuery {
  return {
    page: tablePagination.value.pageIndex + 1,
    limit: tablePagination.value.pageSize,
    search: searchQuery.value.trim() || undefined,
    group_ids: filterState.value.groupId ? [filterState.value.groupId] : undefined,
    tag_ids: filterState.value.tagId ? [filterState.value.tagId] : undefined,
    birth_date_from: normalizeBirthDateForPayload(filterState.value.birthDateFrom) || undefined,
    birth_date_to: normalizeBirthDateForPayload(filterState.value.birthDateTo) || undefined,
    registered_from: filterState.value.registeredFrom || undefined,
    registered_to: filterState.value.registeredTo || undefined,
    registration_shop_ids: filterState.value.registrationShopId ? [filterState.value.registrationShopId] : undefined,
    gender: filterState.value.gender || undefined,
    total_purchases_from: filterState.value.purchaseAmountFrom ? Number(filterState.value.purchaseAmountFrom) : undefined,
    total_purchases_to: filterState.value.purchaseAmountTo ? Number(filterState.value.purchaseAmountTo) : undefined,
    last_purchase_from: filterState.value.lastPurchaseFrom || undefined,
    last_purchase_to: filterState.value.lastPurchaseTo || undefined,
    no_purchase_months: filterState.value.noPurchaseMonths ? Number(filterState.value.noPurchaseMonths) : undefined,
  };
}

async function fetchClients() {
  loading.value = true;
  serverError.value = "";

  try {
    const response = await listClients(buildListQuery());
    clients.value = Array.isArray(response?.items) ? response.items : [];
    totalItems.value = Number(response?.total ?? clients.value.length);
  } catch (error: any) {
    clients.value = [];
    totalItems.value = 0;
    serverError.value = error?.data?.message || error?.message || "Не удалось загрузить клиентов.";
    toast.add({ title: "Не удалось загрузить клиентов", description: serverError.value, color: "error" });
  } finally {
    loading.value = false;
  }
}

async function fetchStats() {
  try {
    const response = await getClientStats();
    stats.value = {
      last_week_count: Number(response?.last_week_count ?? 0),
      not_returned_count: Number(response?.not_returned_count ?? 0),
      birthday_count: Number(response?.birthday_count ?? 0),
    };
  } catch {
    stats.value = {
      last_week_count: 0,
      not_returned_count: 0,
      birthday_count: 0,
    };
  }
}

async function fetchFilters() {
  if (filtersLoading.value || filtersLoaded.value) return;

  filtersLoading.value = true;
  try {
    const response = await getClientFilters();
    filters.value = {
      groups: Array.isArray(response?.groups) ? response.groups : [],
      tags: Array.isArray(response?.tags) ? response.tags : [],
      shops: Array.isArray(response?.shops) ? response.shops : [],
      genders: Array.isArray(response?.genders) ? response.genders : ["male", "female", "unknown"],
    };
    filtersLoaded.value = true;
  } catch {
    filters.value = {
      groups: [],
      tags: [],
      shops: [],
      genders: ["male", "female", "unknown"],
    };
  } finally {
    filtersLoading.value = false;
  }
}

async function handleDeleteClient(client: ClientListItem) {
  if (typeof window !== "undefined" && !window.confirm(`Удалить клиента ${client.full_name}?`)) return;

  try {
    await deleteClient(client.id);
    toast.add({ title: "Клиент удален", color: "success" });
    await Promise.all([fetchClients(), fetchStats()]);
  } catch (error: any) {
    toast.add({
      title: "Не удалось удалить клиента",
      description: error?.data?.message || error?.message || undefined,
      color: "error",
    });
  }
}

function openClientCard(client: ClientListItem) {
  void router.push(`/clients/card/${client.id}`);
}

function openEditClient(client: ClientListItem) {
  void router.push(`/clients/create?id=${encodeURIComponent(client.id)}&page=1`);
}

const filteredClientIds = computed(() => clients.value.map((client) => client.id));
const areAllVisibleSelected = computed(
  () =>
    filteredClientIds.value.length > 0 &&
    filteredClientIds.value.every((id) => selectedClientIds.value.includes(id)),
);

function toggleAllVisibleClients(checked: boolean) {
  if (!checked) {
    selectedClientIds.value = selectedClientIds.value.filter((id) => !filteredClientIds.value.includes(id));
    return;
  }
  selectedClientIds.value = Array.from(new Set([...selectedClientIds.value, ...filteredClientIds.value]));
}

function toggleClientSelection(clientId: string, checked: boolean) {
  if (!checked) {
    selectedClientIds.value = selectedClientIds.value.filter((id) => id !== clientId);
    return;
  }
  if (!selectedClientIds.value.includes(clientId)) {
    selectedClientIds.value = [...selectedClientIds.value, clientId];
  }
}

const statsCards = computed(() => [
  { label: "Новые за неделю", value: `${stats.value.last_week_count}` },
  { label: "Не вернувшиеся", value: `${stats.value.not_returned_count}` },
  { label: "Дни рождения", value: `${stats.value.birthday_count}` },
]);

const tableColumns = computed<any[]>(() => [
  {
    id: "select",
    header: () =>
      h("input", {
        type: "checkbox",
        checked: areAllVisibleSelected.value,
        class: "h-[14px] w-[14px] cursor-pointer accent-[#4993dd]",
        onChange: (event: Event) => toggleAllVisibleClients((event.target as HTMLInputElement).checked),
      }),
    enableSorting: false,
    cell: ({ row }: any) =>
      h("input", {
        type: "checkbox",
        checked: selectedClientIds.value.includes(row.original.id),
        class: "h-[14px] w-[14px] cursor-pointer accent-[#4993dd]",
        onChange: (event: Event) => toggleClientSelection(row.original.id, (event.target as HTMLInputElement).checked),
      }),
  },
  {
    accessorKey: "full_name",
    header: "ФИО",
    cell: ({ row }: any) =>
      h(
        "button",
        {
          type: "button",
          class: "max-w-[220px] whitespace-normal text-left font-semibold text-[#4993dd] transition hover:text-[#7bbcff]",
          onClick: () => openClientCard(row.original),
        },
        row.original.full_name,
      ),
  },
  {
    accessorKey: "phone",
    header: "Телефон",
    cell: ({ row }: any) => h("span", { class: "text-white" }, row.original.phone || "-"),
  },
  {
    accessorKey: "registration_shop",
    header: "Магазин регистрации",
    cell: ({ row }: any) =>
      h("div", { class: "max-w-[160px] whitespace-normal text-white" }, row.original.registration_shop?.name || "-"),
  },
  {
    accessorKey: "last_purchase_at",
    header: "Последняя покупка",
    cell: ({ row }: any) => h("span", { class: "text-white" }, formatDate(row.original.last_purchase_at) || ""),
  },
  {
    accessorKey: "total_purchases_uzs",
    header: "Сумма покупок",
    cell: ({ row }: any) => h("span", { class: "text-white" }, formatUzs(row.original.total_purchases_uzs)),
  },
  {
    accessorKey: "debt_uzs",
    header: "Долг",
    cell: ({ row }: any) => h("span", { class: "text-white" }, formatUzs(row.original.debt_uzs)),
  },
  {
    accessorKey: "balance_uzs",
    header: "Баланс",
    cell: ({ row }: any) => h("span", { class: "text-white" }, formatUzs(row.original.balance_uzs)),
  },
  {
    id: "actions",
    header: () => h("div", { class: "text-right" }, "Действия"),
    enableSorting: false,
    meta: { tdClass: "text-right" },
    cell: ({ row }: any) =>
      h("div", { class: "flex justify-end gap-2" }, [
        h(
          "button",
          {
            type: "button",
            class: "flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-[#262626] text-[#a9cbff] transition hover:bg-[#303030]",
            title: "Изменить",
            "aria-label": "Изменить",
            onClick: () => openEditClient(row.original),
          },
          h("span", { class: "i-heroicons-pencil-square-20-solid h-4 w-4" }),
        ),
        h(
          "button",
          {
            type: "button",
            class: "flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-[#262626] text-red-300 transition hover:bg-[#303030]",
            title: "Удалить",
            "aria-label": "Удалить",
            onClick: () => handleDeleteClient(row.original),
          },
          h("span", { class: "i-heroicons-trash-20-solid h-4 w-4" }),
        ),
      ]),
  },
]);

const tableStoreState = computed(() => ({
  loading: loading.value,
  errorMessage: serverError.value,
}));

const clientsTable = useVueTable({
  get data() {
    return clients.value;
  },
  get columns() {
    return tableColumns.value;
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  state: {
    get sorting() {
      return tableSorting.value;
    },
  },
  onSortingChange: (updater: any) => {
    tableSorting.value = typeof updater === "function" ? updater(tableSorting.value) : updater;
  },
});

const currentPage = computed(() => tablePagination.value.pageIndex + 1);
const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / tablePagination.value.pageSize)));

function previousPage() {
  if (tablePagination.value.pageIndex <= 0) return;
  tablePagination.value.pageIndex -= 1;
}

function nextPage() {
  if (tablePagination.value.pageIndex + 1 >= totalPages.value) return;
  tablePagination.value.pageIndex += 1;
}

function updatePageSize(size: number) {
  tablePagination.value = {
    pageIndex: 0,
    pageSize: size,
  };
}

watch(searchQuery, () => {
  tablePagination.value.pageIndex = 0;
});

watch(
  filterState,
  () => {
    tablePagination.value.pageIndex = 0;
  },
  { deep: true },
);

watch(
  () => [tablePagination.value.pageIndex, tablePagination.value.pageSize],
  () => {
    syncRouteWithPagination();
    void fetchClients();
  },
);

watch(
  () => [route.query.page, route.query.limit],
  () => {
    syncPaginationFromRoute();
  },
);

watch(searchQuery, () => {
  void fetchClients();
});

watch(
  filterState,
  () => {
    void fetchClients();
  },
  { deep: true },
);

watch(filtersOpen, (next) => {
  if (next) {
    void fetchFilters();
  }
});

onMounted(async () => {
  syncPaginationFromRoute();
  syncRouteWithPagination();
  await Promise.all([fetchClients(), fetchStats()]);
});
</script>

<template>
  <section class="space-y-6 text-white">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <h1 class="mt-3 text-[40px] font-bold tracking-[-0.04em] text-white">Все клиенты</h1>
      <button
        type="button"
        class="inline-flex items-center justify-center gap-3 text-[15px] font-semibold text-white transition hover:bg-white/10"
        @click="showStats = !showStats"
      >
        <Icon
          name="tabler:chevron-down"
          class="h-5 w-5 text-sky-300 transition-transform duration-200"
          :class="{ 'rotate-180': showStats }"
        />
        {{ showStats ? "Скрыть статистику" : "Показать статистику" }}
      </button>
    </div>

    <transition name="fade">
      <div v-if="showStats" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <article
          v-for="item in statsCards"
          :key="item.label"
          class="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 shadow-[0_18px_50px_rgba(2,6,23,0.2)] backdrop-blur"
        >
          <p class="text-[13px] uppercase tracking-[0.18em] text-slate-400">{{ item.label }}</p>
          <p class="mt-4 text-[28px] font-bold text-white">{{ item.value }}</p>
        </article>
      </div>
    </transition>

    <DataTable>
      <template #header>
        <BaseDataTableHeader
          v-model="searchQuery"
          :showSearch="true"
          :showFilters="true"
          :filtersOpen="filtersOpen"
          searchPlaceholder="Поиск по имени или телефону"
          :createButton="{ label: 'Новый клиент', to: '/clients/create?page=1' }"
          @toggleFilters="filtersOpen = !filtersOpen"
        >
          <template #filters />
        </BaseDataTableHeader>

        <div
          v-if="filtersOpen"
          class="mt-4 rounded-[24px] border border-white/10 bg-[#111827]/80 p-5 shadow-[0_24px_60px_rgba(2,6,23,0.24)]"
        >
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label class="space-y-2">
              <span class="text-sm font-semibold text-white">Группа</span>
              <select v-model="filterState.groupId" class="filter-field">
                <option value="">Выберите группу</option>
                <option v-for="group in filters.groups" :key="group.id" :value="group.id">{{ group.name }}</option>
              </select>
            </label>

            <label class="space-y-2">
              <span class="text-sm font-semibold text-white">Тег</span>
              <select v-model="filterState.tagId" class="filter-field">
                <option value="">Выберите тег</option>
                <option v-for="tag in filters.tags" :key="tag.id" :value="tag.id">{{ tag.name }}</option>
              </select>
            </label>

            <div class="space-y-2">
              <span class="text-sm font-semibold text-white">Дата рождения</span>
              <div class="grid grid-cols-2 gap-3">
                <AppDatePicker v-model="filterState.birthDateFrom" clearable class="w-full" />
                <AppDatePicker v-model="filterState.birthDateTo" clearable class="w-full" />
              </div>
            </div>

            <div class="space-y-2">
              <span class="text-sm font-semibold text-white">Сумма покупок (UZS)</span>
              <div class="grid grid-cols-2 gap-3">
                <input v-model="filterState.purchaseAmountFrom" type="number" class="filter-field" placeholder="от" />
                <input v-model="filterState.purchaseAmountTo" type="number" class="filter-field" placeholder="до" />
              </div>
            </div>

            <div class="space-y-2">
              <span class="text-sm font-semibold text-white">Дата последней покупки</span>
              <div class="grid grid-cols-2 gap-3">
                <AppDatePicker v-model="filterState.lastPurchaseFrom" clearable class="w-full" />
                <AppDatePicker v-model="filterState.lastPurchaseTo" clearable class="w-full" />
              </div>
            </div>

            <div class="space-y-2">
              <span class="text-sm font-semibold text-white">Отсутствие покупок</span>
              <div class="grid grid-cols-[1fr_auto] gap-3">
                <input v-model="filterState.noPurchaseMonths" type="number" class="filter-field" placeholder="Введите число" />
                <div class="flex items-center justify-center rounded-[16px] border border-white/10 bg-white/5 px-4 text-sm text-slate-300">
                  месяц
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <span class="text-sm font-semibold text-white">Дата регистрации</span>
              <div class="grid grid-cols-2 gap-3">
                <AppDatePicker v-model="filterState.registeredFrom" clearable class="w-full" />
                <AppDatePicker v-model="filterState.registeredTo" clearable class="w-full" />
              </div>
            </div>

            <label class="space-y-2">
              <span class="text-sm font-semibold text-white">Магазин регистрации</span>
              <select v-model="filterState.registrationShopId" class="filter-field">
                <option value="">Выберите магазин</option>
                <option v-for="shop in filters.shops" :key="shop.id" :value="shop.id">{{ shop.name }}</option>
              </select>
            </label>

            <label class="space-y-2">
              <span class="text-sm font-semibold text-white">Пол</span>
              <select v-model="filterState.gender" class="filter-field">
                <option value="">Выберите пол</option>
                <option v-for="gender in filters.genders" :key="gender" :value="gender">{{ genderLabel(gender) }}</option>
              </select>
            </label>
          </div>
        </div>
      </template>

      <BaseDataTable :table="clientsTable" :store="tableStoreState" />

      <template #pagination>
        <BaseDataTablePagination
          :currentPage="currentPage"
          :totalPages="totalPages"
          :pageSize="tablePagination.pageSize"
          :loading="loading"
          @update:pageSize="updatePageSize"
          @previous="previousPage"
          @next="nextPage"
        />
      </template>
    </DataTable>
  </section>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.filter-field {
  width: 100%;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.05);
  padding: 14px 16px;
  color: #fff;
  outline: none;
}

.filter-field::placeholder {
  color: #94a3b8;
}
</style>
