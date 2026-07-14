<template>
  <section v-if="loading" class="rounded-[28px] bg-[#2b2b2b] p-8 text-white">
    Загружаем импорт...
  </section>

  <section
    v-else-if="error"
    class="rounded-[28px] border border-[#7f3d3d] bg-[#442f2f] p-8 text-white"
  >
    <button
      type="button"
      class="inline-flex items-center gap-2 rounded-[14px] bg-[#5a3838] px-4 py-3 text-[14px] font-bold"
      @click="goBack"
    >
      <Icon name="heroicons:arrow-left-20-solid" class="h-5 w-5" />
      Назад
    </button>
    <h1 class="mt-5 text-[28px] font-bold">Не удалось загрузить импорт</h1>
    <p class="mt-3 text-[#ffd7d7]">{{ error }}</p>
  </section>

  <section v-else-if="session" class="space-y-6">
    <div class="hidden">
      <div>
        <button
          type="button"
          class="rounded-[14px] bg-[#363636] px-4 py-3 text-[14px] font-bold text-white transition-colors duration-200 hover:bg-[#4a4a4a] disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="actionLoading"
          @click="goBack"
        >
          Назад к импортам
        </button>
        <p
          class="mt-5 text-[12px] font-bold uppercase tracking-[0.24em] text-[#7ba9d8]"
        >
          Предпросмотр
        </p>
        <h1 class="mt-2 text-[34px] font-bold text-white">
          {{ session.name }}
        </h1>
        <div class="mt-4 flex flex-wrap items-center gap-3">
          <span
            class="rounded-[12px] px-3 py-2 text-[13px] font-bold"
            :class="importStatusMeta.badgeClass"
          >
            {{ importStatusMeta.label }}
          </span>
          <span
            v-if="importStatusMeta.description"
            class="text-[14px] text-[#bdbdbd]"
          >
            {{ importStatusMeta.description }}
          </span>
        </div>
        <p class="mt-2 text-[15px] text-[#bdbdbd]">
          {{ importTypeLabel }} •
          {{ session.branch_name || session.shop_name || "—" }} •
          {{ formatDate(session.created_at) }}
        </p>
      </div>
    </div>
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button
          type="button"
          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#404040] transition-colors duration-200 hover:bg-[#5e5e5e] disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="actionLoading"
          @click="goBack"
        >
          <Icon name="heroicons:arrow-left-20-solid" class="h-6 w-6" />
        </button>
        <div class="flex flex-col">
          <h1 class="text-[34px] font-bold text-white">
            {{ session.name }}
          </h1>
          <p class="text-[16px] text-[#bdbdbd] text-left">
            {{ importTypeLabel }} •
            {{ session.branch_name || "—" }}
          </p>
        </div>
      </div>

      <UButton
        v-if="canRollbackImport"
        color="neutral"
        variant="soft"
        class="rounded-[16px] bg-[#404040] px-5 py-3 text-white hover:bg-[#505050]"
        :loading="rollbackLoading"
        @click="openRollbackPreview"
      >
        <Icon name="heroicons:arrow-uturn-left-20-solid" class="h-5 w-5" />
        Откатить остатки
      </UButton>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div
        v-for="card in summaryCards"
        :key="card.label"
        class="rounded-[24px] bg-[#2b2b2b] p-5"
      >
        <p class="text-[13px] font-bold text-[#a7a7a7]">{{ card.label }}</p>
        <p class="mt-3 text-[28px] font-bold text-white">{{ card.value }}</p>
      </div>
    </div>
    <section class="space-y-5 rounded-[28px] bg-[#2b2b2b] p-6">
      <div class="flex flex-col gap-2">
        <p
          class="text-[12px] font-bold uppercase tracking-[0.22em] text-[#7ba9d8]"
        >
          Артикул, баркод, наименование
        </p>
        <h2 class="text-[28px] font-bold text-white">Товары из файла</h2>
      </div>

      <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <label
          class="flex w-full items-center gap-3 rounded-[18px] bg-[#262626] px-4 py-3 text-white lg:max-w-[420px]"
        >
          <Icon name="heroicons:magnifying-glass-20-solid" class="h-5 w-5 text-[#7ba9d8]" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Поиск по товарам из файла"
            class="w-full bg-transparent text-[15px] text-white placeholder:text-[#8f8f8f]"
          />
        </label>

        <button
          type="button"
          class="inline-flex items-center justify-center gap-2 rounded-[16px] bg-[#363636] px-5 py-4 text-[15px] font-bold text-white transition-colors duration-200 hover:bg-[#4a4a4a] disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="!filteredTableRows.length"
          @click="printPriceTags"
        >
          <Icon name="heroicons:printer-20-solid" class="h-5 w-5 text-[#7ba9d8]" />
          Печать ценников
        </button>
      </div>

      <div v-if="filteredTableRows.length" class="overflow-hidden">
        <div class="overflow-x-auto">
        <table
          class="min-w-[1450px] w-full border-separate border-spacing-y-2 text-left text-sm text-[#bdbdbd] sm:text-[17px]"
        >
          <thead class="border-t border-b border-white/10">
            <tr class="text-[#8f8f8f]">
              <th class="whitespace-nowrap px-3 py-4 text-[13px] font-bold uppercase tracking-[0.12em] sm:px-[20px] sm:py-[25px] sm:text-base">
                Наименование
              </th>
              <th class="whitespace-nowrap px-3 py-4 text-[13px] font-bold uppercase tracking-[0.12em] sm:px-[20px] sm:py-[25px] sm:text-base">
                Артикул
              </th>
              <th class="whitespace-nowrap px-3 py-4 text-[13px] font-bold uppercase tracking-[0.12em] sm:px-[20px] sm:py-[25px] sm:text-base">
                Баркод
              </th>
              <th class="whitespace-nowrap px-3 py-4 text-[13px] font-bold uppercase tracking-[0.12em] sm:px-[20px] sm:py-[25px] sm:text-base">
                Кол-во
              </th>
              <th class="whitespace-nowrap px-3 py-4 text-[13px] font-bold uppercase tracking-[0.12em] sm:px-[20px] sm:py-[25px] sm:text-base">
                Цена поставки
              </th>
              <th class="whitespace-nowrap px-3 py-4 text-[13px] font-bold uppercase tracking-[0.12em] sm:px-[20px] sm:py-[25px] sm:text-base">
                Цена продажи
              </th>
              <th class="whitespace-nowrap px-3 py-4 text-[13px] font-bold uppercase tracking-[0.12em] sm:px-[20px] sm:py-[25px] sm:text-base">
                Категория
              </th>
              <th class="whitespace-nowrap px-3 py-4 text-[13px] font-bold uppercase tracking-[0.12em] sm:px-[20px] sm:py-[25px] sm:text-base">
                Бренд
              </th>
              <th class="whitespace-nowrap px-3 py-4 text-[13px] font-bold uppercase tracking-[0.12em] sm:px-[20px] sm:py-[25px] sm:text-base">
                Единица измерения
              </th>
              <th class="whitespace-nowrap px-3 py-4 text-[13px] font-bold uppercase tracking-[0.12em] sm:px-[20px] sm:py-[25px] sm:text-base">
                Поставщик
              </th>
              <th class="whitespace-nowrap px-3 py-4 text-[13px] font-bold uppercase tracking-[0.12em] sm:px-[20px] sm:py-[25px] sm:text-base">
                Описание
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="(row, index) in filteredTableRows"
              :key="`${row.article}-${row.barcode}-${index}`"
            >
              <td
                class="whitespace-nowrap rounded-l-[20px] px-3 py-4 text-left text-[14px] font-normal text-[#4993dd] sm:px-[20px] sm:py-[25px] sm:text-[15px]"
                :class="index % 2 === 0 ? 'bg-[#262626]' : 'bg-[#404040]'"
              >
                {{ row.name || "Отсутствует" }}
              </td>
              <td
                class="whitespace-nowrap px-3 py-4 text-left text-[13px] font-normal text-white sm:px-[20px] sm:py-[25px] sm:text-[17px]"
                :class="index % 2 === 0 ? 'bg-[#262626]' : 'bg-[#404040]'"
              >
                {{ row.article || "Отсутствует" }}
              </td>
              <td
                class="whitespace-nowrap px-3 py-4 text-left text-[13px] font-normal text-white sm:px-[20px] sm:py-[25px] sm:text-[17px]"
                :class="index % 2 === 0 ? 'bg-[#262626]' : 'bg-[#404040]'"
              >
                {{ row.barcode || "Отсутствует" }}
              </td>
              <td
                class="whitespace-nowrap px-3 py-4 text-left text-[13px] font-normal text-white sm:px-[20px] sm:py-[25px] sm:text-[17px]"
                :class="index % 2 === 0 ? 'bg-[#262626]' : 'bg-[#404040]'"
              >
                {{ formatQuantity(row.quantity) }}
              </td>
              <td
                class="whitespace-nowrap px-3 py-4 text-left text-[13px] font-normal text-white sm:px-[20px] sm:py-[25px] sm:text-[17px]"
                :class="index % 2 === 0 ? 'bg-[#262626]' : 'bg-[#404040]'"
              >
                {{ formatMoney(row.supplyPrice) }}
              </td>
              <td
                class="whitespace-nowrap px-3 py-4 text-left text-[13px] font-normal text-white sm:px-[20px] sm:py-[25px] sm:text-[17px]"
                :class="index % 2 === 0 ? 'bg-[#262626]' : 'bg-[#404040]'"
              >
                {{ formatMoney(row.retailPrice) }}
              </td>
              <td
                class="whitespace-nowrap px-3 py-4 text-left text-[13px] font-normal text-white sm:px-[20px] sm:py-[25px] sm:text-[17px]"
                :class="index % 2 === 0 ? 'bg-[#262626]' : 'bg-[#404040]'"
              >
                {{ row.category || "Отсутствует" }}
              </td>
              <td
                class="whitespace-nowrap px-3 py-4 text-left text-[13px] font-normal text-white sm:px-[20px] sm:py-[25px] sm:text-[17px]"
                :class="index % 2 === 0 ? 'bg-[#262626]' : 'bg-[#404040]'"
              >
                {{ row.brand || "Отсутствует" }}
              </td>
              <td
                class="whitespace-nowrap px-3 py-4 text-left text-[13px] font-normal text-white sm:px-[20px] sm:py-[25px] sm:text-[17px]"
                :class="index % 2 === 0 ? 'bg-[#262626]' : 'bg-[#404040]'"
              >
                {{ row.unit || "Штука" }}
              </td>
              <td
                class="whitespace-nowrap px-3 py-4 text-left text-[13px] font-normal text-white sm:px-[20px] sm:py-[25px] sm:text-[17px]"
                :class="index % 2 === 0 ? 'bg-[#262626]' : 'bg-[#404040]'"
              >
                {{ row.supplier || "Отсутствует" }}
              </td>
              <td
                class="rounded-r-[20px] px-3 py-4 text-left text-[13px] font-normal text-white sm:px-[20px] sm:py-[25px] sm:text-[17px]"
                :class="index % 2 === 0 ? 'bg-[#262626]' : 'bg-[#404040]'"
              >
                {{ row.description || "" }}
              </td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>

      <div
        v-else
        class="mt-5 rounded-[20px] border border-[#5b4a1f] bg-[#3b321d] p-6 text-white"
      >
        {{
          tableRows.length
            ? "По вашему запросу товары не найдены."
            : "Backend вернул import session без массива `rows`."
        }}
      </div>
    </section>

    <section
      v-if="errorMessage"
      class="rounded-[22px] border border-[#7f3d3d] bg-[#442f2f] p-5 text-[#ffd7d7]"
    >
      {{ errorMessage }}
    </section>

    <section
      v-if="
        progressPercent > 0 &&
        (sessionStatusCode === 'validating' || actionLoading)
      "
      class="rounded-[28px] bg-[#2b2b2b] p-6 text-white"
    >
      <p
        class="text-[13px] font-bold uppercase tracking-[0.18em] text-[#7ba9d8]"
      >
        Прогресс
      </p>
      <p class="mt-3 text-[16px] text-[#bdbdbd]">{{ progressMessage }}</p>
      <div class="mt-6 rounded-full bg-[#404040] p-1">
        <div
          class="h-4 rounded-full bg-[#1f78ff] transition-all duration-300"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>
      <p class="mt-3 text-[22px] font-bold">{{ progressPercent }}%</p>
    </section>

    <UModal
      v-model:open="rollbackModalOpen"
      :ui="{ content: 'max-w-[560px] rounded-[28px] bg-[#262626] p-0 text-white border border-white/10' }"
    >
      <template #content>
        <div class="p-8">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h3 class="text-[24px] font-bold">Откат остатков по импорту</h3>
              <p class="mt-3 text-[15px] text-[#d1d5db]">
                {{
                  rollbackPreview?.can_rollback
                    ? "Количество по товарам ниже будет уменьшено обратно на то, что добавил этот импорт."
                    : rollbackPreview?.reason ||
                      "Откат невозможен: часть добавленного количества уже разошлась, откат увёл бы остаток в минус."
                }}
              </p>
            </div>
            <UButton
              color="neutral"
              variant="ghost"
              class="rounded-full bg-[#404040] text-white hover:bg-[#505050]"
              @click="closeRollbackModal"
            >
              <Icon name="heroicons:x-mark" class="h-5 w-5" />
            </UButton>
          </div>

          <div
            v-if="rollbackPreview?.items?.length || rollbackPreview?.blocked_items?.length"
            class="mt-6 max-h-[320px] space-y-2 overflow-y-auto"
          >
            <div
              v-for="item in (rollbackPreview.can_rollback ? rollbackPreview.items : rollbackPreview.blocked_items)"
              :key="item.product_id"
              class="rounded-[16px] bg-[#2f2f2f] px-4 py-3"
            >
              <p class="text-[15px] font-semibold text-white">{{ item.product_name }}</p>
              <p class="mt-1 text-[13px] text-[#a7a7a7]">
                Было: {{ item.current_quantity }} → Станет: {{ item.quantity_after }}
                (откат {{ item.quantity_to_revert }})
              </p>
            </div>
          </div>

          <div class="mt-8 flex items-center justify-end gap-3">
            <UButton
              color="neutral"
              variant="soft"
              class="rounded-[16px] bg-[#404040] px-5 py-3 text-white hover:bg-[#505050]"
              :disabled="rollbackLoading"
              @click="closeRollbackModal"
            >
              Отмена
            </UButton>
            <UButton
              v-if="rollbackPreview?.can_rollback"
              color="primary"
              variant="solid"
              class="rounded-[16px] bg-[#1f78ff] px-5 py-3 text-white hover:bg-[#4d94ff]"
              :loading="rollbackLoading"
              @click="confirmRollback"
            >
              Откатить остатки
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { navigateTo, useHead, useRoute, useRouter } from "#imports";
import {
  useProductImport,
  type CreateImportPayload,
  type ImportDraftMappingPayload,
  type ImportMode,
  type ImportProperty,
  type ImportRollbackResult,
  type ImportSession,
  type ParsedImportRow,
} from "~/composables/useProductImport";

definePageMeta({ layout: "empty" });

type ImportFieldKey =
  | "name"
  | "article"
  | "barcode"
  | "quantity"
  | "supplyPrice"
  | "retailPrice"
  | "category"
  | "brand"
  | "unit"
  | "supplier"
  | "description";

type DraftState = {
  name: string;
  shopId: string;
  mode: ImportMode;
  generateBarcodes: boolean;
  generateArticles: boolean;
  importType: string;
  mappings: ImportDraftMappingPayload[];
  rows: ParsedImportRow[];
};

type MappingOption = {
  label: string;
  value: string;
};

const FIELD_TO_SYSTEM_NAME: Record<ImportFieldKey, string> = {
  name: "NAME",
  article: "SKU",
  barcode: "BARCODE",
  quantity: "QUANTITY",
  supplyPrice: "SUPPLY_PRICE",
  retailPrice: "RETAIL_PRICE",
  category: "CATEGORY_NAME",
  brand: "BRAND_NAME",
  unit: "MEASUREMENT_UNIT",
  supplier: "SUPPLIER",
  description: "DESCRIPTION",
};

const REQUIRED_FIELDS: ImportFieldKey[] = [
  "name",
  "quantity",
  "supplyPrice",
  "retailPrice",
];

const fieldConfigs: Array<{ key: ImportFieldKey; label: string }> = [
  { key: "name", label: "НАИМЕНОВАНИЕ" },
  { key: "article", label: "АРТИКУЛ" },
  { key: "barcode", label: "БАРКОД" },
  { key: "quantity", label: "КОЛ-ВО" },
  { key: "supplyPrice", label: "ЦЕНА ПОСТАВКИ (UZS)" },
  { key: "retailPrice", label: "РОЗНИЧНАЯ ЦЕНА (UZS)" },
  { key: "category", label: "КАТЕГОРИЯ" },
  { key: "brand", label: "БРЕНД" },
  { key: "unit", label: "ЕДИНИЦА ИЗМЕРЕНИЯ" },
  { key: "supplier", label: "ПОСТАВЩИК" },
  { key: "description", label: "ОПИСАНИЕ" },
];

const defaultDraft: DraftState = {
  name: "",
  shopId: "",
  mode: "with_check",
  generateBarcodes: true,
  generateArticles: true,
  importType: "Поступление",
  mappings: [],
  rows: [],
};

const route = useRoute();
const router = useRouter();
const {
  getImportSession,
  getImportProperties,
  getImportPreview,
  getImportItems,
  getImportProgress,
  importWithoutCheck,
  validateImportSession,
  commitImportSession,
  cancelImportSession,
  previewImportRollback,
  rollbackImportSession,
  createImportInventory,
  getStocktaking,
  acceptStocktaking,
} = useProductImport();
const toast = useToast();

const importId = computed(() => String(route.params.id ?? "").trim());
const session = ref<ImportSession | null>(null);
const availableProperties = ref<ImportProperty[]>([]);
const draft = ref<DraftState>({ ...defaultDraft });
const mappingChoices = ref<Record<ImportFieldKey, string>>(
  createDefaultChoiceState(),
);
const newPropertyNames = ref<Record<ImportFieldKey, string>>(
  createDefaultTextState(),
);
const inventoryBeforeImport = ref(false);
const loading = ref(true);
const actionLoading = ref(false);
const rollbackModalOpen = ref(false);
const rollbackLoading = ref(false);
const rollbackPreview = ref<ImportRollbackResult | null>(null);
const error = ref("");
const errorMessage = ref("");
const progressPercent = ref(0);
const progressMessage = ref("");
const searchQuery = ref("");
const currentAction = ref<
  "validate" | "import-all" | "cancel" | "commit" | "inventory" | ""
>("");
const loadMenuOpen = ref(false);
const previewRows = ref<ParsedImportRow[]>([]);
let pollTimer: ReturnType<typeof setTimeout> | null = null;

const importTypeLabel = computed(() => draft.value.importType || "Поступление");
const importMode = computed<ImportMode>(
  () => session.value?.mode || draft.value.mode || "without_check",
);
const sessionStatusCode = computed(
  () => session.value?.status_code || session.value?.status || "draft",
);
const importStatusMeta = computed(() => {
  const badgeClass =
    sessionStatusCode.value === "completed"
      ? "bg-[#1f5f3a] text-[#d8ffe7]"
      : sessionStatusCode.value === "cancelled" ||
          sessionStatusCode.value === "failed"
        ? "bg-[#6b2d31] text-[#ffd9dc]"
        : sessionStatusCode.value === "preview_ready"
          ? "bg-[#37516f] text-[#d9ebff]"
          : sessionStatusCode.value === "draft"
            ? "bg-[#4b4b4b] text-white"
            : "bg-[#5b4a1f] text-[#ffe9bf]";

  const description =
    sessionStatusCode.value === "draft"
      ? "Импорт создан, но еще не проверен."
      : sessionStatusCode.value === "preview_ready"
        ? "Проверка завершена, импорт ждет подтверждения."
        : sessionStatusCode.value === "validating"
          ? "Идет проверка файла."
          : sessionStatusCode.value === "importing"
            ? "Идет реальная загрузка товаров в базу."
            : sessionStatusCode.value === "completed"
              ? "Импорт полностью завершен."
              : sessionStatusCode.value === "cancelled"
                ? "Импорт отменен."
                : sessionStatusCode.value === "failed"
                  ? "Импорт завершился с ошибкой или проблемой."
                  : "";

  return {
    label:
      session.value?.status_label ||
      (sessionStatusCode.value === "preview_ready"
        ? "В Ожидании"
        : sessionStatusCode.value === "validating"
          ? "Проверяется"
          : sessionStatusCode.value === "importing"
            ? "Загружается"
            : sessionStatusCode.value === "completed"
              ? "Завершен"
              : sessionStatusCode.value === "cancelled"
                ? "Отменен"
                : sessionStatusCode.value === "failed"
                  ? "Проверка"
                  : "Новый"),
    description,
    badgeClass,
  };
});
const tableRows = computed(() => {
  if (previewRows.value.length) return previewRows.value;
  if (session.value?.rows?.length) return session.value.rows;
  return draft.value.rows ?? [];
});
const filteredTableRows = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return tableRows.value;

  return tableRows.value.filter((row) =>
    [
      row.name,
      row.article,
      row.barcode,
      row.category,
      row.brand,
      row.unit,
      row.supplier,
      row.description,
    ].some((value) => String(value || "").toLowerCase().includes(query)),
  );
});
const sampleRow = computed<ParsedImportRow | null>(
  () => tableRows.value[0] ?? null,
);

const summaryCards = computed(() => {
  const rows = tableRows.value;
  const namesCount = rows.length;
  const totalQuantity = rows.reduce(
    (sum, row) => sum + Number(row.quantity || 0),
    0,
  );
  const totalSupply = rows.reduce(
    (sum, row) =>
      sum + Number(row.quantity || 0) * Number(row.supplyPrice || 0),
    0,
  );
  const totalRetail = rows.reduce(
    (sum, row) =>
      sum + Number(row.quantity || 0) * Number(row.retailPrice || 0),
    0,
  );

  return [
    { label: "Наименований", value: `${namesCount} шт` },
    { label: "Товарных единиц", value: `${formatNumber(totalQuantity)} ед.` },
    { label: "Сумма по цене поставки", value: formatCompactMoney(totalSupply) },
    { label: "Сумма по цене продажи", value: formatCompactMoney(totalRetail) },
  ];
});

const canCancelImport = computed(
  () =>
    Boolean(session.value) &&
    sessionStatusCode.value !== "completed" &&
    sessionStatusCode.value !== "cancelled",
);
const canRollbackImport = computed(
  () => Boolean(session.value) && sessionStatusCode.value === "completed",
);
const canValidateAndUpload = computed(
  () =>
    Boolean(session.value) &&
    sessionStatusCode.value !== "completed" &&
    sessionStatusCode.value !== "cancelled" &&
    sessionStatusCode.value !== "importing",
);
const canShowLoadActions = computed(
  () =>
    Boolean(session.value) &&
    sessionStatusCode.value !== "completed" &&
    sessionStatusCode.value !== "cancelled" &&
    sessionStatusCode.value !== "importing",
);
const canDirectCommit = computed(
  () =>
    Boolean(session.value) &&
    sessionStatusCode.value !== "completed" &&
    sessionStatusCode.value !== "cancelled" &&
    sessionStatusCode.value !== "importing",
);

function createDefaultChoiceState() {
  return {
    name: `map:${FIELD_TO_SYSTEM_NAME.name}`,
    article: `map:${FIELD_TO_SYSTEM_NAME.article}`,
    barcode: `map:${FIELD_TO_SYSTEM_NAME.barcode}`,
    quantity: `map:${FIELD_TO_SYSTEM_NAME.quantity}`,
    supplyPrice: `map:${FIELD_TO_SYSTEM_NAME.supplyPrice}`,
    retailPrice: `map:${FIELD_TO_SYSTEM_NAME.retailPrice}`,
    category: `map:${FIELD_TO_SYSTEM_NAME.category}`,
    brand: `map:${FIELD_TO_SYSTEM_NAME.brand}`,
    unit: `map:${FIELD_TO_SYSTEM_NAME.unit}`,
    supplier: `map:${FIELD_TO_SYSTEM_NAME.supplier}`,
    description: `map:${FIELD_TO_SYSTEM_NAME.description}`,
  } satisfies Record<ImportFieldKey, string>;
}

function createDefaultTextState() {
  return {
    name: "",
    article: "",
    barcode: "",
    quantity: "",
    supplyPrice: "",
    retailPrice: "",
    category: "",
    brand: "",
    unit: "",
    supplier: "",
    description: "",
  } satisfies Record<ImportFieldKey, string>;
}

function getDraftStorageKey(id: string) {
  return `product-import-draft:${id}`;
}

function readDraftState(id: string) {
  if (typeof window === "undefined") return null;

  const raw = window.sessionStorage.getItem(getDraftStorageKey(id));
  if (!raw) return null;

  try {
    return JSON.parse(raw) as DraftState;
  } catch {
    return null;
  }
}

function writeDraftState() {
  if (typeof window === "undefined" || !importId.value) return;

  const mappings = buildMappings(false);
  if (!mappings) return;

  const payload: DraftState = {
    ...draft.value,
    mappings,
    rows: tableRows.value.length ? [...tableRows.value] : [...draft.value.rows],
  };
  window.sessionStorage.setItem(
    getDraftStorageKey(importId.value),
    JSON.stringify(payload),
  );
}

function normalizeSystemName(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9А-ЯЁ]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(
    value || 0,
  );
}

function formatMoney(value: number) {
  return `${formatNumber(Number(value || 0))} UZS`;
}

function formatDate(value: string) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return value || "—";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatCompactMoney(value: number) {
  if (!Number.isFinite(value)) return "0 UZS";

  if (value >= 1000) {
    const compact = new Intl.NumberFormat("ru-RU", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
    return `${compact} UZS`;
  }

  return `${formatNumber(value)} UZS`;
}

function formatQuantity(value: number) {
  return `${formatNumber(Number(value || 0))} шт`;
}

function getFieldSample(field: ImportFieldKey) {
  const row = sampleRow.value;
  if (!row) return "Отсутствует";

  const value = row[field];
  if (field === "quantity") return String(value ?? "0");
  if (field === "supplyPrice" || field === "retailPrice")
    return String(value ?? "0");

  return String(value ?? "").trim() || "Отсутствует";
}

function getMappingOptions(field: ImportFieldKey): MappingOption[] {
  const defaultOption = {
    label: `Подставлять в ${fieldConfigs.find((item) => item.key === field)?.label ?? field}`,
    value: `map:${FIELD_TO_SYSTEM_NAME[field]}`,
  };

  const dynamicOptions = availableProperties.value.map((property) => ({
    label: property.name,
    value: `map:${property.system_name}`,
  }));

  return [
    defaultOption,
    ...dynamicOptions,
    { label: "Добавить новое свойство", value: "new" },
    { label: "Не загружать", value: "skip" },
  ];
}

function applyStoredMappings(mappings: ImportDraftMappingPayload[]) {
  const nextChoices = createDefaultChoiceState();
  const nextNames = createDefaultTextState();

  for (const mapping of mappings) {
    const key = mapping.key as ImportFieldKey;
    if (!(key in nextChoices)) continue;

    if (mapping.action === "skip") {
      nextChoices[key] = "skip";
      continue;
    }

    const isDefaultTarget = mapping.targetField === FIELD_TO_SYSTEM_NAME[key];
    const isKnownProperty = availableProperties.value.some(
      (property) => property.system_name === mapping.targetField,
    );

    if (mapping.action === "new" || (!isDefaultTarget && !isKnownProperty)) {
      nextChoices[key] = "new";
      nextNames[key] = mapping.targetField;
      continue;
    }

    nextChoices[key] = `map:${mapping.targetField}`;
  }

  mappingChoices.value = nextChoices;
  newPropertyNames.value = nextNames;
}

function buildMappings(showErrors = true) {
  const nextMappings: ImportDraftMappingPayload[] = [];

  for (const field of fieldConfigs) {
    const choice = mappingChoices.value[field.key];

    if (choice === "skip") {
      if (REQUIRED_FIELDS.includes(field.key)) {
        if (showErrors) {
          errorMessage.value = `Поле "${field.label}" обязательно для загрузки.`;
        }
        return null;
      }

      nextMappings.push({
        key: field.key,
        targetField: FIELD_TO_SYSTEM_NAME[field.key],
        action: "skip",
      });
      continue;
    }

    if (choice === "new") {
      const normalizedName = normalizeSystemName(
        newPropertyNames.value[field.key],
      );
      if (!normalizedName) {
        if (showErrors) {
          errorMessage.value = `Укажите название нового свойства для поля "${field.label}".`;
        }
        return null;
      }

      nextMappings.push({
        key: field.key,
        targetField: normalizedName,
        action: "new",
      });
      continue;
    }

    const targetField =
      choice.replace(/^map:/, "") || FIELD_TO_SYSTEM_NAME[field.key];
    nextMappings.push({
      key: field.key,
      targetField,
      action: "map",
    });
  }

  return nextMappings;
}

function buildPayload(mode: ImportMode): CreateImportPayload | null {
  const rows = tableRows.value;
  if (!rows.length) {
    errorMessage.value = "В import session нет строк для загрузки.";
    return null;
  }

  const mappings = buildMappings();
  if (!mappings) return null;

  return {
    name: draft.value.name || session.value?.name || "",
    shopId: draft.value.shopId || session.value?.shop_id || "",
    mode,
    generateBarcodes: draft.value.generateBarcodes,
    generateArticles: draft.value.generateArticles,
    rows,
    mappings,
    availableProperties: availableProperties.value,
    onMatch: session.value?.on_match,
  };
}

function mapPreviewItemToRow(item: ImportPreviewItem): ParsedImportRow {
  return {
    name: String(item.product_name || item.raw?.name || "").trim(),
    article: String(item.product_sku || item.raw?.sku || "").trim(),
    barcode: String(item.product_barcode || item.raw?.barcode || "").trim(),
    quantity: item.measurement_value || item.raw?.quantity || 0,
    supplyPrice: item.supply_price || item.raw?.supplyPrice || 0,
    retailPrice: item.retail_price || item.raw?.retailPrice || 0,
    category: String(item.raw?.categoryName || "").trim(),
    brand: String(item.raw?.brandName || "").trim(),
    unit: String(item.measurement_type || item.raw?.measurementUnit || "").trim(),
    supplier: String(item.raw?.supplier || "").trim(),
    description: String(item.description || item.raw?.description || "").trim(),
  };
}

async function loadPreviewRowsWithRetry(fallbackRows: ParsedImportRow[] = []) {
  previewRows.value = [];

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const preview = await getImportPreview(importId.value, {
        page: 1,
        limit: 1000,
      });
      if (preview.items.length) {
        previewRows.value = preview.items.map(mapPreviewItemToRow);
        return;
      }
    } catch {}

    try {
      const items = await getImportItems(importId.value, {
        page: 1,
        limit: 1000,
      });
      if (items.items.length) {
        previewRows.value = items.items.map(mapPreviewItemToRow);
        return;
      }
    } catch {}

    if (attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }
  }

  if (fallbackRows.length) {
    previewRows.value = [...fallbackRows];
  }
}

async function loadSession() {
  loading.value = true;
  error.value = "";

  try {
    const [sessionResponse, propertiesResponse] = await Promise.all([
      getImportSession(importId.value),
      getImportProperties(),
    ]);

    session.value = sessionResponse;
    availableProperties.value = propertiesResponse;

    const storedDraft = readDraftState(importId.value);
   draft.value = storedDraft
  ? { ...defaultDraft, ...storedDraft }
  : {
      ...defaultDraft,
      name: sessionResponse.name,
      shopId: sessionResponse.shop_id,
      mode: sessionResponse.mode,
      importType: sessionResponse.import_type || "Поступление",
    };

    applyStoredMappings(
      storedDraft?.mappings?.length ? storedDraft.mappings : [],
    );
    await loadPreviewRowsWithRetry(storedDraft?.rows ?? []);
  } catch (err: any) {
    error.value = err?.message || "Не удалось загрузить import session.";
    session.value = null;
  } finally {
    loading.value = false;
  }
}

function stopPolling() {
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
}

async function pollProgress(jobId: string, nextImportId?: string) {
  stopPolling();

  const tick = async () => {
    try {
      const progress = await getImportProgress(jobId);
      progressPercent.value = Number(progress.percent ?? 0);
      progressMessage.value = String(progress.message ?? "Обработка");

      if (progress.is_finished) {
        const resolvedImportId = String(
          progress.import_id ??
            progress.correlation_id ??
            nextImportId ??
            importId.value,
        );

        stopPolling();
        await router.replace(
          `/products/import/edit/${resolvedImportId}?page=1`,
        );
        return;
      }

      pollTimer = setTimeout(tick, 1200);
    } catch (err: any) {
      errorMessage.value =
        err?.message || "Не удалось получить прогресс импорта.";
      stopPolling();
    }
  };

  await tick();
}

async function waitForProgressCompletion(jobId: string, nextImportId?: string) {
  stopPolling();

  while (true) {
    const progress = await getImportProgress(jobId);
    progressPercent.value = Number(progress.percent ?? 0);
    progressMessage.value = String(progress.message ?? "Обработка");

    if (progress.is_finished) {
      return String(
        progress.import_id ??
          progress.correlation_id ??
          nextImportId ??
          importId.value,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 1200));
  }
}

async function validateAndUpload() {
  if (!session.value) return;

  const payload = buildPayload("with_check");
  if (!payload) return;

  errorMessage.value = "";
  actionLoading.value = true;
  currentAction.value = "validate";
  writeDraftState();

  try {
    const result = await validateImportSession(session.value.id, {
      ...payload,
      autoCommit: false,
    });

    toast.add({ title: "Проверка импорта запущена", color: "success" });

    const resolvedImportId = result.jobId
      ? await waitForProgressCompletion(result.jobId, result.importId)
      : result.importId || session.value.id;

    session.value = await getImportSession(resolvedImportId);

    if (
      session.value.mode === "without_check" &&
      session.value.status_code === "preview_ready" &&
      session.value.can_commit
    ) {
      currentAction.value = "commit";
      await commitImportSession(resolvedImportId, {
        onMatch: session.value.on_match,
      });
      await router.replace(
        `/products/import/list/${resolvedImportId}?limit=5&page=1`,
      );
      return;
    }

    if (
      session.value.mode === "with_check" &&
      session.value.status_code === "preview_ready"
    ) {
      await runInventoryBeforeImport();
      return;
    }

    await router.replace(
      `/products/import/edit/${resolvedImportId}?limit=5&page=1`,
    );
  } catch (err: any) {
    errorMessage.value = err?.message || "Не удалось запустить проверку.";
  } finally {
    actionLoading.value = false;
    currentAction.value = "";
  }
}

async function ensurePreviewReadySession() {
  if (!session.value) return null;

  if (session.value.status_code === "preview_ready" && session.value.can_commit) {
    return session.value;
  }

  const payload = buildPayload("with_check");
  if (!payload) return null;

  currentAction.value = "validate";
  writeDraftState();

  const result = await validateImportSession(session.value.id, {
    ...payload,
    autoCommit: false,
  });

  const resolvedImportId = result.jobId
    ? await waitForProgressCompletion(result.jobId, result.importId)
    : result.importId || session.value.id;

  session.value = await getImportSession(resolvedImportId);

  if (!(session.value.status_code === "preview_ready" && session.value.can_commit)) {
    throw new Error("Импорт не готов к подтверждению после проверки.");
  }

  return session.value;
}

async function getOrCreateStocktakingId(importSession: ImportSession) {
  const existingId = String(importSession.stocktaking_id || "").trim();
  if (existingId) {
    return existingId;
  }

  const created = await createImportInventory(importSession.id, {
    use_old_prices: false,
    use_import_properties: true,
  });

  return created.id;
}

async function importAllProducts() {
  if (!session.value || !canDirectCommit.value) return;

  errorMessage.value = "";
  actionLoading.value = true;
  currentAction.value = "commit";

  try {
    await commitImportSession(session.value.id, { onMatch: session.value.on_match });
    toast.add({ title: "Импорт принят", color: "success" });
    await router.replace(
      `/products/import/list/${session.value.id}?limit=5&page=1`,
    );
  } catch (err: any) {
    errorMessage.value =
      err?.message || "Не удалось принять импорт.";
  } finally {
    actionLoading.value = false;
    currentAction.value = "";
  }
}

async function cancelCurrentImport() {
  if (!session.value || !canCancelImport.value) return;

  errorMessage.value = "";
  actionLoading.value = true;
  currentAction.value = "cancel";

  try {
    session.value = await cancelImportSession(session.value.id);
    loadMenuOpen.value = false;
    toast.add({ title: "Импорт отменен", color: "success" });
  } catch (err: any) {
    errorMessage.value = err?.message || "Не удалось отменить импорт.";
  } finally {
    actionLoading.value = false;
    currentAction.value = "";
  }
}

async function openRollbackPreview() {
  if (!session.value || !canRollbackImport.value) return;

  errorMessage.value = "";
  rollbackLoading.value = true;

  try {
    rollbackPreview.value = await previewImportRollback(session.value.id);
    rollbackModalOpen.value = true;
  } catch (err: any) {
    errorMessage.value = err?.message || "Не удалось подготовить откат импорта.";
  } finally {
    rollbackLoading.value = false;
  }
}

function closeRollbackModal() {
  rollbackModalOpen.value = false;
  rollbackPreview.value = null;
}

async function confirmRollback() {
  if (!session.value) return;

  rollbackLoading.value = true;

  try {
    await rollbackImportSession(session.value.id);
    session.value = await getImportSession(session.value.id);
    closeRollbackModal();
    toast.add({ title: "Остатки по импорту откачены", color: "success" });
  } catch (err: any) {
    errorMessage.value = err?.message || "Не удалось откатить импорт.";
    closeRollbackModal();
  } finally {
    rollbackLoading.value = false;
  }
}

async function runInventoryBeforeImport() {
  if (!session.value) return;

  errorMessage.value = "";
  actionLoading.value = true;

  try {
    const readySession = await ensurePreviewReadySession();
    if (!readySession) return;

    currentAction.value = "inventory";

    const stocktakingId = await getOrCreateStocktakingId(readySession);
    await getStocktaking(stocktakingId);
    await acceptStocktaking(stocktakingId);
    toast.add({ title: "Инвентаризация проведена", color: "success" });
    await router.replace(`/products/import/list/${readySession.id}?limit=5&page=1`);
  } catch (err: any) {
    errorMessage.value =
      err?.message || "Не удалось провести инвентаризацию перед загрузкой.";
  } finally {
    actionLoading.value = false;
    currentAction.value = "";
  }
}

async function handleMenuAction(action: "commit" | "validate") {
  loadMenuOpen.value = false;

  if (action === "commit") {
    await importAllProducts();
    return;
  }

  await validateAndUpload();
}

function goBack() {
  return navigateTo("/products/import", { replace: true });
}

function printPriceTags() {
  if (!filteredTableRows.value.length) {
    toast.add({ title: "Нет товаров для печати", color: "warning" });
    return;
  }

  toast.add({
    title: `Подготовлено ${filteredTableRows.value.length} товаров для печати ценников`,
    color: "primary",
  });
}

watch(
  [mappingChoices, newPropertyNames],
  () => {
    if (!session.value) return;
    writeDraftState();
  },
  { deep: true },
);

onMounted(loadSession);

onBeforeUnmount(() => {
  stopPolling();
});

useHead({
  title: computed(() =>
    session.value ? `${session.value.name} | Импорт` : "Импорт",
  ),
});
</script>
