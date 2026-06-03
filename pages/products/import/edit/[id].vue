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
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-[14px] bg-[#363636] px-4 py-3 text-[14px] font-bold text-white transition-colors duration-200 hover:bg-[#4a4a4a]"
          @click="goBack"
        >
          <Icon name="heroicons:arrow-left-20-solid" class="h-5 w-5 text-[#4993dd]" />
          Назад
        </button>

        <h1 class="mt-5 text-[34px] font-bold text-white">{{ session.name }}</h1>
        <p class="mt-2 text-[16px] text-[#bdbdbd]">
          {{ importTypeLabel }} • {{ session.shop_name || session.shop_id || "—" }}
        </p>
      </div>

      <div class="rounded-[24px] border border-white/8 bg-[#2b2b2b] px-5 py-4">
        <p class="text-[12px] font-bold uppercase tracking-[0.18em] text-[#7ba9d8]">Настройки</p>
        <div class="mt-3 space-y-2 text-[14px] text-white">
          <p>Генерировать баркоды: {{ draft.generateBarcodes ? "Да" : "Нет" }}</p>
          <p>Генерировать артикул: {{ draft.generateArticles ? "Да" : "Нет" }}</p>
          <p>Тип импорта: {{ importTypeLabel }}</p>
        </div>
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div v-for="card in summaryCards" :key="card.label" class="rounded-[24px] bg-[#2b2b2b] p-5">
        <p class="text-[13px] font-bold text-[#a7a7a7]">{{ card.label }}</p>
        <p class="mt-3 text-[28px] font-bold text-white">{{ card.value }}</p>
      </div>
    </div>
    <section class="rounded-[28px] bg-[#2b2b2b] p-6">
      <div class="flex flex-col gap-2">
        <p class="text-[12px] font-bold uppercase tracking-[0.22em] text-[#7ba9d8]">
          Артикул, баркод, наименование
        </p>
        <h2 class="text-[28px] font-bold text-white">Товары из файла</h2>
      </div>

      <div v-if="tableRows.length" class="mt-5 overflow-x-auto">
        <table class="min-w-[1450px] w-full border-separate border-spacing-y-2 text-left">
          <thead>
            <tr class="text-[13px] uppercase tracking-[0.12em] text-[#8f8f8f]">
              <th class="px-4 py-3">Наименование</th>
              <th class="px-4 py-3">Артикул</th>
              <th class="px-4 py-3">Баркод</th>
              <th class="px-4 py-3">Кол-во</th>
              <th class="px-4 py-3">Цена поставки</th>
              <th class="px-4 py-3">Цена продажи</th>
              <th class="px-4 py-3">Категория</th>
              <th class="px-4 py-3">Бренд</th>
              <th class="px-4 py-3">Единица измерения</th>
              <th class="px-4 py-3">Поставщик</th>
              <th class="px-4 py-3">Описание</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="(row, index) in tableRows" :key="`${row.article}-${row.barcode}-${index}`">
              <td class="rounded-l-[18px] bg-[#363636] px-4 py-4 text-[15px] font-bold text-white">{{ row.name || "Отсутствует" }}</td>
              <td class="bg-[#363636] px-4 py-4 text-[15px] text-white">{{ row.article || "Отсутствует" }}</td>
              <td class="bg-[#363636] px-4 py-4 text-[15px] text-white">{{ row.barcode || "Отсутствует" }}</td>
              <td class="bg-[#363636] px-4 py-4 text-[15px] text-white">{{ formatQuantity(row.quantity) }}</td>
              <td class="bg-[#363636] px-4 py-4 text-[15px] text-white">{{ formatMoney(row.supplyPrice) }}</td>
              <td class="bg-[#363636] px-4 py-4 text-[15px] text-white">{{ formatMoney(row.retailPrice) }}</td>
              <td class="bg-[#363636] px-4 py-4 text-[15px] text-white">{{ row.category || "Отсутствует" }}</td>
              <td class="bg-[#363636] px-4 py-4 text-[15px] text-white">{{ row.brand || "Отсутствует" }}</td>
              <td class="bg-[#363636] px-4 py-4 text-[15px] text-white">{{ row.unit || "Штука" }}</td>
              <td class="bg-[#363636] px-4 py-4 text-[15px] text-white">{{ row.supplier || "Отсутствует" }}</td>
              <td class="rounded-r-[18px] bg-[#363636] px-4 py-4 text-[15px] text-white">{{ row.description || "" }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-else
        class="mt-5 rounded-[20px] border border-[#5b4a1f] bg-[#3b321d] p-6 text-white"
      >
        Backend вернул import session без массива `rows`.
      </div>
    </section>

    <section v-if="errorMessage" class="rounded-[22px] border border-[#7f3d3d] bg-[#442f2f] p-5 text-[#ffd7d7]">
      {{ errorMessage }}
    </section>

    <section
      v-if="progressPercent > 0 && (session.status === 'validating' || actionLoading)"
      class="rounded-[28px] bg-[#2b2b2b] p-6 text-white"
    >
      <p class="text-[13px] font-bold uppercase tracking-[0.18em] text-[#7ba9d8]">Прогресс</p>
      <p class="mt-3 text-[16px] text-[#bdbdbd]">{{ progressMessage }}</p>
      <div class="mt-6 rounded-full bg-[#404040] p-1">
        <div
          class="h-4 rounded-full bg-[#1f78ff] transition-all duration-300"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>
      <p class="mt-3 text-[22px] font-bold">{{ progressPercent }}%</p>
    </section>

    <section class="rounded-[28px] bg-[#2b2b2b] p-6">
      <label class="flex items-center gap-3 text-[15px] text-white">
        <input
          v-model="inventoryBeforeImport"
          type="checkbox"
          class="h-5 w-5 rounded border border-white/10 bg-[#363636]"
        />
        Провести инвентаризацию перед загрузкой
      </label>

      <div class="mt-5 grid gap-3 md:grid-cols-2">
        <button
          type="button"
          class="rounded-[16px] bg-[#404040] px-5 py-4 text-[16px] font-bold text-white transition-colors duration-200 hover:bg-[#4b4b4b] disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="actionLoading || !tableRows.length"
          @click="importAllProducts"
        >
          {{ actionLoading && currentAction === 'import-all' ? "Загружаем..." : "Загрузить все товары из списка" }}
        </button>

        <button
          type="button"
          class="rounded-[16px] bg-[#1f78ff] px-5 py-4 text-[16px] font-bold text-white transition-colors duration-200 hover:bg-[#2a6ed9] disabled:cursor-not-allowed disabled:bg-[#3764a8]"
          :disabled="actionLoading || !tableRows.length"
          @click="validateAndUpload"
        >
          {{ actionLoading && currentAction === 'validate' ? "Проверяем..." : "Проверить и загрузить" }}
        </button>
      </div>
    </section>
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
  type ImportSession,
  type ParsedImportRow,
} from "~/composables/useProductImport";

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

const REQUIRED_FIELDS: ImportFieldKey[] = ["name", "quantity", "supplyPrice", "retailPrice"];

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
};

const route = useRoute();
const router = useRouter();
const {
  getImportSession,
  getImportProperties,
  getImportPreview,
  getImportItems,
  getImportProgress,
  validateImportSession,
  importWithoutCheck,
} = useProductImport();
const toast = useToast();

const importId = computed(() => String(route.params.id ?? "").trim());
const session = ref<ImportSession | null>(null);
const availableProperties = ref<ImportProperty[]>([]);
const draft = ref<DraftState>({ ...defaultDraft });
const mappingChoices = ref<Record<ImportFieldKey, string>>(createDefaultChoiceState());
const newPropertyNames = ref<Record<ImportFieldKey, string>>(createDefaultTextState());
const inventoryBeforeImport = ref(false);
const loading = ref(true);
const actionLoading = ref(false);
const error = ref("");
const errorMessage = ref("");
const progressPercent = ref(0);
const progressMessage = ref("");
const currentAction = ref<"validate" | "import-all" | "">("");
const previewRows = ref<ParsedImportRow[]>([]);
let pollTimer: ReturnType<typeof setTimeout> | null = null;

const importTypeLabel = computed(() => draft.value.importType || "Поступление");
const tableRows = computed(() => (previewRows.value.length ? previewRows.value : session.value?.rows ?? []));
const sampleRow = computed<ParsedImportRow | null>(() => tableRows.value[0] ?? null);

const summaryCards = computed(() => {
  const rows = tableRows.value;
  const namesCount = rows.length;
  const totalQuantity = rows.reduce((sum, row) => sum + Number(row.quantity || 0), 0);
  const totalSupply = rows.reduce((sum, row) => sum + Number(row.quantity || 0) * Number(row.supplyPrice || 0), 0);
  const totalRetail = rows.reduce((sum, row) => sum + Number(row.quantity || 0) * Number(row.retailPrice || 0), 0);

  return [
    { label: "Наименований", value: `${namesCount} шт` },
    { label: "Товарных единиц", value: `${formatNumber(totalQuantity)} ед.` },
    { label: "Сумма по цене поставки", value: formatCompactMoney(totalSupply) },
    { label: "Сумма по цене продажи", value: formatCompactMoney(totalRetail) },
  ];
});

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
  };
  window.sessionStorage.setItem(getDraftStorageKey(importId.value), JSON.stringify(payload));
}

function normalizeSystemName(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9А-ЯЁ]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value || 0);
}

function formatMoney(value: number) {
  return `${formatNumber(Number(value || 0))} UZS`;
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
  if (field === "supplyPrice" || field === "retailPrice") return String(value ?? "0");

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
      const normalizedName = normalizeSystemName(newPropertyNames.value[field.key]);
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

    const targetField = choice.replace(/^map:/, "") || FIELD_TO_SYSTEM_NAME[field.key];
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

function mapPreviewItemToRow(item: any): ParsedImportRow {
  return {
    name: String(item?.raw?.name ?? item?.product_name ?? "").trim(),
    article: String(item?.raw?.sku ?? item?.product_sku ?? "").trim(),
    barcode: String(item?.raw?.barcode ?? item?.product_barcode ?? "").trim(),
    quantity: Number(item?.raw?.quantity ?? item?.measurement_value ?? 0) || 0,
    supplyPrice: Number(item?.raw?.supplyPrice ?? item?.supply_price ?? 0) || 0,
    retailPrice: Number(item?.raw?.retailPrice ?? item?.retail_price ?? 0) || 0,
    category: String(item?.raw?.categoryName ?? "").trim(),
    brand: String(item?.raw?.brandName ?? "").trim(),
    unit: String(item?.raw?.measurementUnit ?? item?.measurement_type ?? "").trim(),
    supplier: String(item?.raw?.supplier ?? "").trim(),
    description: String(item?.raw?.description ?? item?.description ?? "").trim(),
  };
}

async function loadPreviewRowsWithRetry() {
  previewRows.value = [];

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const preview = await getImportPreview(importId.value, { page: 1, limit: 1000 });
      if (preview.items.length) {
        previewRows.value = preview.items.map(mapPreviewItemToRow);
        return;
      }
    } catch {}

    try {
      const items = await getImportItems(importId.value, { page: 1, limit: 1000 });
      if (items.items.length) {
        previewRows.value = items.items.map(mapPreviewItemToRow);
        return;
      }
    } catch {}

    if (attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }
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
        };

    applyStoredMappings(storedDraft?.mappings?.length ? storedDraft.mappings : []);
    await loadPreviewRowsWithRetry();
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
          progress.import_id ?? progress.correlation_id ?? nextImportId ?? importId.value,
        );

        stopPolling();
        await router.replace(`/products/import/edit/${resolvedImportId}?page=1`);
        return;
      }

      pollTimer = setTimeout(tick, 1200);
    } catch (err: any) {
      errorMessage.value = err?.message || "Не удалось получить прогресс импорта.";
      stopPolling();
    }
  };

  await tick();
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

    if (result.jobId) {
      await pollProgress(result.jobId, result.importId);
      return;
    }

    await router.replace(`/products/import/list/${result.importId || session.value.id}?limit=1000&page=1`);
  } catch (err: any) {
    errorMessage.value = err?.message || "Не удалось запустить проверку.";
  } finally {
    actionLoading.value = false;
    currentAction.value = "";
  }
}

async function importAllProducts() {
  if (!session.value) return;

  const payload = buildPayload("without_check");
  if (!payload) return;

  errorMessage.value = "";
  actionLoading.value = true;
  currentAction.value = "import-all";
  writeDraftState();

  try {
    const result = await importWithoutCheck(payload);
    toast.add({ title: "Импорт запущен", color: "success" });
    await router.replace(`/products/import/list/${result.id || session.value.id}?limit=1000&page=1`);
  } catch (err: any) {
    errorMessage.value = err?.message || "Не удалось загрузить товары без проверки.";
  } finally {
    actionLoading.value = false;
    currentAction.value = "";
  }
}

function goBack() {
  return navigateTo("/products/import", { replace: true });
}

watch([mappingChoices, newPropertyNames], () => {
  if (!session.value) return;
  writeDraftState();
}, { deep: true });

onMounted(loadSession);

onBeforeUnmount(() => {
  stopPolling();
});

useHead({
  title: computed(() => (session.value ? `${session.value.name} | Импорт` : "Импорт")),
});
</script>
