<template>
  <section v-if="!isChildRoute" class="catalog">
    <div class="top flex justify-between">
      <h2 class="text-[36px] font-bold text-white">Импорт</h2>
    </div>

    <DataTable class="mt-[40px]" @create="openImportModal" />

    <AppSlideover
      :open="isImportModalOpen"
      @update:open="isImportModalOpen = $event"
      maxWidthClass="max-w-[640px]"
      panelClass="bg-[#2b2b2b] text-white"
    >
      <div class="flex items-start justify-between gap-4 px-4 py-4 sm:px-8 sm:py-6">
        <div>
          <h3 class="mt-2 text-[30px] font-bold">
            {{ modalStep === 1 ? "Новый импорт" : "Подтверждение импорта" }}
          </h3>
          <p class="mt-1 text-[15px] text-[#bdbdbd]">
            {{
              modalStep === 1
                ? "Загрузите файл и проверьте базовые ошибки перед созданием серверного импорта."
                : "Проверьте файл и параметры импорта перед продолжением."
            }}
          </p>
        </div>

        <button
          type="button"
          class="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-[#404040] transition-colors duration-200 hover:bg-[#5e5e5e]"
          @click="closeImportModal"
        >
          <Icon name="heroicons:x-mark-20-solid" class="h-6 w-6" />
        </button>
      </div>

      <div class="import-slideover-scroll flex-1 overflow-y-auto px-4 py-5 sm:px-8 sm:py-8">
        <div v-if="modalStep === 1" class="space-y-6">
          <div class="space-y-2">
            <label class="text-[16px] font-bold text-white">Наименование</label>
            <input
              v-model="form.name"
              type="text"
              class="w-full rounded-[18px] border border-transparent bg-[#404040] px-4 py-3 text-[15px] text-white outline-none transition-colors duration-200 placeholder:text-[#9f9f9f] focus:border-[#4993dd] sm:px-5 sm:py-4 sm:text-[16px]"
              :placeholder="createDefaultImportName()"
            />
          </div>

          <CustomSelect
            v-model="form.shopId"
            label="Филиал"
            :options="shopOptions"
            placeholder="Выберите филиал"
          />

          <div
            v-if="bootstrapLoading"
            class="rounded-[20px] bg-[#363636] px-5 py-4 text-[14px] text-[#bdbdbd]"
          >
            Загружаем филиалы и свойства импорта...
          </div>

          <div
            v-else-if="bootstrapError"
            class="rounded-[20px] border border-[#7f3d3d] bg-[#442f2f] px-5 py-4 text-[14px] text-[#ffd7d7]"
          >
            {{ bootstrapError }}
          </div>

          <div class="space-y-2">
            <span class="block text-[16px] font-bold text-white">Файл</span>
            <label
              class="block cursor-pointer rounded-[24px] border border-dashed p-4 transition-colors duration-200 sm:p-6"
              :class="isDragging ? 'border-[#4993dd] bg-[#24384f]' : 'border-[#5e5e5e] bg-[#363636]'"
              @dragenter.prevent="isDragging = true"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="onFileDrop"
            >
              <input
                ref="fileInputRef"
                type="file"
                class="hidden"
                accept=".xls,.xlsx,.csv,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                @change="onFileChange"
              />

              <div class="flex flex-col items-center justify-center gap-3 text-center">
                <div class="flex h-14 w-14 items-center justify-center rounded-full bg-[#404040]">
                  <Icon
                    name="heroicons:document-arrow-up-20-solid"
                    class="h-7 w-7 text-[#4993dd]"
                  />
                </div>
                <div class="space-y-1">
                  <p class="text-[17px] font-bold text-white">
                    Перетащите файл сюда или нажмите для выбора
                  </p>
                  <p class="text-[14px] text-[#bdbdbd]">
                    Поддерживаются `.xlsx`, `.xls` и `.csv`.
                  </p>
                </div>
              </div>
            </label>

            <div
              v-if="selectedFile"
              class="flex flex-col gap-3 rounded-[18px] bg-[#363636] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
            >
              <div>
                <p class="text-[16px] font-bold text-white">{{ selectedFile.name }}</p>
                <p class="mt-1 text-[14px] text-[#bdbdbd]">{{ formatFileSize(selectedFile.size) }}</p>
              </div>

              <button
                type="button"
                class="cursor-pointer text-[14px] font-bold text-[#ff8c8c] transition-colors duration-200 hover:text-[#ffb0b0]"
                @click="removeFile"
              >
                Удалить
              </button>
            </div>
          </div>

          <div class="rounded-[24px] border border-[#4d4d4d] bg-[#343434] p-5">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p class="text-[16px] font-bold text-white">Шаблон</p>
                <p class="mt-1 text-[14px] text-[#bdbdbd]">
                  Используйте готовый шаблон, если файл еще не подготовлен.
                </p>
              </div>

              <button
                type="button"
                class="inline-flex items-center justify-center rounded-[16px] bg-[#1f78ff] px-5 py-3 text-[15px] font-bold text-white transition-colors duration-200 hover:bg-[#2a6ed9]"
                @click="downloadTemplate"
              >
                <Icon name="heroicons:arrow-down-tray-20-solid" class="mr-2 h-5 w-5" />
                Скачать шаблон
              </button>
            </div>
          </div>

          <div
            v-if="isParsing"
            class="rounded-[24px] bg-[#363636] p-5 text-[14px] text-[#bdbdbd]"
          >
            Проверяем структуру файла и строки импорта...
          </div>

          <div
            v-if="errors.length"
            class="rounded-[24px] border border-[#7f3d3d] bg-[#442f2f] p-5"
          >
            <div class="flex items-center gap-2">
              <Icon
                name="heroicons:exclamation-circle-20-solid"
                class="h-5 w-5 text-[#ff8c8c]"
              />
              <p class="text-[16px] font-bold text-white">Ошибки</p>
            </div>
            <ul class="mt-3 space-y-2 text-[14px] text-[#ffd7d7]">
              <li v-for="error in errors" :key="error">{{ error }}</li>
            </ul>
          </div>
        </div>

        <div v-else class="space-y-6">
          <div class="rounded-[24px] border border-[#3c4f69] bg-[#24384f] p-5">
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <p class="break-all text-[18px] font-bold text-white">
                  {{ selectedFile?.name || "Файл не выбран" }}
                </p>
                <div class="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <div class="h-full w-full rounded-full bg-[#1f78ff]" />
                </div>
                <div class="mt-3 flex items-center gap-3 text-[14px] text-[#c9d9ee]">
                  <span>100%</span>
                  <span>{{ selectedFile ? formatFileSize(selectedFile.size) : "0 KB" }}</span>
                </div>
                <p class="mt-3 text-[15px] font-semibold text-white">Файл загружен</p>
              </div>
            </div>
          </div>

          <div class="rounded-[24px] bg-[#363636] p-5">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p class="text-[16px] font-bold text-white">Генерировать баркоды</p>
              </div>
              <div class="flex w-full rounded-[14px] bg-[#2b2b2b] p-1 sm:w-auto">
                <button
                  v-for="option in booleanOptions"
                  :key="`barcode-${option.value}`"
                  type="button"
                  class="flex-1 rounded-[10px] px-4 py-2 text-[13px] font-bold transition-colors duration-200 sm:flex-none sm:text-[14px]"
                  :class="form.generateBarcodes === option.value ? 'bg-[#1f78ff] text-white' : 'text-[#bdbdbd]'"
                  @click="form.generateBarcodes = option.value"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>
          </div>

          <div class="rounded-[24px] bg-[#363636] p-5">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p class="text-[16px] font-bold text-white">Генерировать артикул</p>
              </div>
              <div class="flex w-full rounded-[14px] bg-[#2b2b2b] p-1 sm:w-auto">
                <button
                  v-for="option in booleanOptions"
                  :key="`article-${option.value}`"
                  type="button"
                  class="flex-1 rounded-[10px] px-4 py-2 text-[13px] font-bold transition-colors duration-200 sm:flex-none sm:text-[14px]"
                  :class="form.generateArticles === option.value ? 'bg-[#1f78ff] text-white' : 'text-[#bdbdbd]'"
                  @click="form.generateArticles = option.value"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>
          </div>

          <div class="rounded-[24px] bg-[#363636] p-5">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p class="text-[16px] font-bold text-white">Тип импорта</p>
              </div>
              <div class="w-full sm:w-[240px]">
                <CustomSelect
                  v-model="form.importType"
                  :options="importTypeOptions"
                  placeholder="Выберите тип импорта"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="px-4 py-4 sm:px-8 sm:py-6">
        <div class="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            class="flex-1 cursor-pointer rounded-[16px] bg-[#404040] px-5 py-4 text-[16px] font-bold text-white transition-colors duration-200 hover:bg-[#4b4b4b]"
            @click="modalStep === 1 ? closeImportModal() : goToFirstStep()"
          >
            {{ modalStep === 1 ? "Отмена" : "Назад" }}
          </button>
          <button
            type="button"
            class="flex-1 cursor-pointer rounded-[16px] bg-[#1f78ff] px-5 py-4 text-[16px] font-bold text-white transition-colors duration-200 hover:bg-[#2a6ed9] disabled:cursor-not-allowed disabled:bg-[#3764a8] disabled:text-white/70"
            :disabled="primaryButtonDisabled"
            @click="modalStep === 1 ? continueToPreview() : submitImport()"
          >
            {{
              modalStep === 1
                ? "Дальше"
                : creatingImport
                  ? "Создаем..."
                  : "Продолжить"
            }}
          </button>
        </div>
      </div>
    </AppSlideover>

    <FieldMappingOverlay
      :open="fieldMappingOpen"
      :loading="fieldMappingLoading"
      :submitting="fieldMappingSubmitting"
      :error="fieldMappingError"
      :progress-percent="fieldMappingProgressPercent"
      :progress-message="fieldMappingProgressMessage"
      :session="createdSession"
      :available-properties="availableProperties"
      @close="closeFieldMapping"
      @continue="handleFieldMappingContinue"
    />
  </section>

  <NuxtPage v-if="isChildRoute" />
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { navigateTo, useHead, useRoute } from "#imports";
import DataTable from "@/components/ImportDataTable.vue";
import FieldMappingOverlay from "@/components/import/FieldMappingOverlay.vue";
import CustomSelect from "@/components/ui/CustomSelect.vue";
import { useImportDataTableStore } from "@/store/DataTables/importDataTableStore";
import {
  useProductImport,
  type ImportDraftMappingPayload,
  type ImportMode,
  type ImportProperty,
  type ImportSession,
  type ImportShopOption,
  type ParsedImportRow,
} from "~/composables/useProductImport";

interface ImportFormState {
  name: string;
  shopId: string;
  mode: ImportMode;
  generateBarcodes: boolean;
  generateArticles: boolean;
  importType: string;
}

interface ImportSessionDraftState {
  name: string;
  shopId: string;
  mode: ImportMode;
  generateBarcodes: boolean;
  generateArticles: boolean;
  importType: string;
  mappings: ImportDraftMappingPayload[];
}

const HEADER_ALIASES: Record<string, keyof ParsedImportRow> = {
  NAME: "name",
  "НАИМЕНОВАНИЕ": "name",
  SKU: "article",
  "АРТИКУЛ": "article",
  BARCODE: "barcode",
  "БАРКОД": "barcode",
  "ШТРИХКОД": "barcode",
  QUANTITY: "quantity",
  "КОЛ-ВО": "quantity",
  "КОЛИЧЕСТВО": "quantity",
  SUPPLY_PRICE: "supplyPrice",
  "ЦЕНА ПОСТАВКИ": "supplyPrice",
  "ЦЕНА ПОСТАВКИ (UZS)": "supplyPrice",
  RETAIL_PRICE: "retailPrice",
  "РОЗНИЧНАЯ ЦЕНА": "retailPrice",
  "РОЗНИЧНАЯ ЦЕНА (UZS)": "retailPrice",
  CATEGORY_NAME: "category",
  "КАТЕГОРИЯ": "category",
  BRAND_NAME: "brand",
  "БРЕНД": "brand",
  MEASUREMENT_UNIT: "unit",
  "ЕДИНИЦА ИЗМЕРЕНИЯ": "unit",
  SUPPLIER: "supplier",
  "ПОСТАВЩИК": "supplier",
  DESCRIPTION: "description",
  "ОПИСАНИЕ": "description",
};

const REQUIRED_FIELDS: Array<keyof ParsedImportRow> = [
  "name",
  "quantity",
  "supplyPrice",
  "retailPrice",
];

const FIELD_TO_SYSTEM_NAME: Record<keyof ParsedImportRow, string> = {
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

const booleanOptions = [
  { label: "Да", value: true },
  { label: "Нет", value: false },
];

const importTypeOptions = [{ label: "Поступление", value: "Поступление" }];

const importStore = useImportDataTableStore();
const route = useRoute();
const {
  getAllowedShops,
  getImportProperties,
  createImportSession,
  validateExcelImport,
  waitForImport,
} = useProductImport();

const templateDownloadUrl = "/templates/product-import-template.xlsx";
const isChildRoute = computed(
  () =>
    route.path.startsWith("/products/import/list/") ||
    route.path.startsWith("/products/import/edit/"),
);

const bootstrapLoading = ref(false);
const bootstrapError = ref("");
const creatingImport = ref(false);
const isImportModalOpen = ref(false);
const modalStep = ref<1 | 2>(1);
const isDragging = ref(false);
const isParsing = ref(false);
const fieldMappingOpen = ref(false);
const fieldMappingLoading = ref(false);
const fieldMappingSubmitting = ref(false);
const fieldMappingError = ref("");
const fieldMappingProgressPercent = ref(0);
const fieldMappingProgressMessage = ref("");
const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const parsedRows = ref<ParsedImportRow[]>([]);
const mappings = ref<ImportDraftMappingPayload[]>([]);
const errors = ref<string[]>([]);
const availableProperties = ref<ImportProperty[]>([]);
const shops = ref<ImportShopOption[]>([]);
const createdSession = ref<ImportSession | null>(null);
const form = ref<ImportFormState>({
  name: "",
  shopId: "",
  mode: "with_check",
  generateBarcodes: true,
  generateArticles: true,
  importType: "Поступление",
});

const shopOptions = computed(() =>
  shops.value.map((shop) => ({ label: shop.name, value: shop.id })),
);

const primaryButtonDisabled = computed(() => {
  if (modalStep.value === 1) {
    return (
      isParsing.value ||
      bootstrapLoading.value ||
      creatingImport.value ||
      Boolean(bootstrapError.value) ||
      !selectedFile.value ||
      !form.value.shopId
    );
  }

  return creatingImport.value;
});

function parsePositiveInteger(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

const resolvedPage = computed(() => parsePositiveInteger(route.query.page, 1));
const resolvedLimit = computed(() => parsePositiveInteger(route.query.limit, 10));

function createDefaultImportName() {
  const now = new Date();
  const datePart = new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(now);
  const timePart = new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);

  return `Импорт ${datePart} ${timePart}`;
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function getImportDraftStorageKey(importId: string) {
  return `product-import-draft:${importId}`;
}

function saveImportDraft(importId: string, draft: ImportSessionDraftState) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(getImportDraftStorageKey(importId), JSON.stringify(draft));
}

function downloadTemplate() {
  const link = document.createElement("a");
  link.href = templateDownloadUrl;
  link.download = `${crypto.randomUUID()}.xlsx`;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

function parseNumber(value: unknown) {
  const normalized = normalizeText(value).replace(/\s/g, "").replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeHeader(value: unknown) {
  return normalizeText(value).toUpperCase().replace(/\s+/g, " ");
}

function createEmptyRow(): ParsedImportRow {
  return {
    name: "",
    article: "",
    barcode: "",
    quantity: 0,
    supplyPrice: 0,
    retailPrice: 0,
    category: "",
    brand: "",
    unit: "",
    supplier: "",
    description: "",
  };
}

function resetForm() {
  form.value = {
    name: createDefaultImportName(),
    shopId: shops.value[0]?.id || "",
    mode: "with_check",
    generateBarcodes: true,
    generateArticles: true,
    importType: "Поступление",
  };
  modalStep.value = 1;
  selectedFile.value = null;
  parsedRows.value = [];
  mappings.value = [];
  errors.value = [];
  isParsing.value = false;

  if (fileInputRef.value) {
    fileInputRef.value.value = "";
  }
}

async function loadBootstrapData() {
  bootstrapLoading.value = true;
  bootstrapError.value = "";

  try {
    const [shopResponse, propertyResponse] = await Promise.all([
      getAllowedShops(),
      getImportProperties(),
    ]);

    shops.value = shopResponse;
    availableProperties.value = propertyResponse;

    if (!shops.value.length) {
      bootstrapError.value = "Сервер не вернул доступные филиалы.";
    }
  } catch (error: any) {
    shops.value = [];
    availableProperties.value = [];
    bootstrapError.value = error?.message || "Не удалось загрузить данные импорта.";
  } finally {
    bootstrapLoading.value = false;
  }
}

async function openImportModal() {
  await loadBootstrapData();
  resetForm();
  isImportModalOpen.value = true;
}

function closeImportModal() {
  isImportModalOpen.value = false;
  isDragging.value = false;
  modalStep.value = 1;
}

function closeFieldMapping() {
  if (fieldMappingSubmitting.value) return;
  fieldMappingOpen.value = false;
  fieldMappingLoading.value = false;
  fieldMappingSubmitting.value = false;
  fieldMappingError.value = "";
  fieldMappingProgressPercent.value = 0;
  fieldMappingProgressMessage.value = "";
}

function buildPreviewSession(): ImportSession {
  return {
    id: "",
    shop_id: form.value.shopId,
    name: form.value.name.trim() || createDefaultImportName(),
    mode: form.value.mode,
    status: "draft",
    rows_count: parsedRows.value.length,
    fields: [],
    rows: parsedRows.value,
    preview_items: [],
    result: null,
    on_match: {
      name: "keep_store",
      brand: "keep_store",
      category: "keep_store",
      description: "from_file",
      measurement_unit: "keep_store",
      supplier: "keep_store",
      supply_price: "keep_store",
      retail_price: "keep_store",
    },
    dry_run_summary: null,
    created_at: "",
    shop_name: shops.value.find((shop) => shop.id === form.value.shopId)?.name,
  };
}

async function parseFile(file: File) {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", raw: true });

  if (!workbook.SheetNames.length) {
    throw new Error("Файл не содержит листов.");
  }

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error("Не удалось определить первый лист.");
  }

  const worksheet = workbook.Sheets[firstSheetName];
  if (!worksheet) {
    throw new Error("Первый лист не найден.");
  }

  const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(worksheet, {
    header: 1,
    defval: "",
    raw: true,
  });

  if (!rows.length) {
    throw new Error("Файл пустой.");
  }

  const headerRow = rows[0];
  if (!headerRow?.length) {
    throw new Error("Не найдена строка заголовков.");
  }

  const headerMap = new Map<number, keyof ParsedImportRow>();
  const nextMappings: ImportDraftMappingPayload[] = [];

  headerRow.forEach((cell, index) => {
    const normalizedHeader = normalizeHeader(cell);
    const field = HEADER_ALIASES[normalizedHeader];
    if (!field) return;

    headerMap.set(index, field);
    nextMappings.push({
      key: field,
      targetField: FIELD_TO_SYSTEM_NAME[field],
      action: "map",
    });
  });

  const missing = REQUIRED_FIELDS.filter((field) => !Array.from(headerMap.values()).includes(field));
  if (missing.length) {
    throw new Error(`Не хватает обязательных колонок: ${missing.join(", ")}.`);
  }

  const dataRows = rows.slice(1).filter((row) => row.some((cell) => normalizeText(cell) !== ""));
  if (!dataRows.length) {
    throw new Error("После заголовков нет данных для импорта.");
  }

  const nextErrors: string[] = [];
  const nextRows: ParsedImportRow[] = [];

  dataRows.forEach((row, index) => {
    const excelRow = index + 2;
    const normalized = createEmptyRow();

    headerMap.forEach((field, columnIndex) => {
      const cell = row[columnIndex];
      if (field === "quantity" || field === "supplyPrice" || field === "retailPrice") {
        const parsed = parseNumber(cell);
        (normalized[field] as number) = parsed ?? 0;
        return;
      }

      (normalized[field] as string) = normalizeText(cell);
    });

    if (!normalized.name) nextErrors.push(`Строка ${excelRow}: заполните name.`);
    if (!Number.isFinite(normalized.quantity) || normalized.quantity <= 0) {
      nextErrors.push(`Строка ${excelRow}: quantity должен быть числом больше 0.`);
    }
    if (!Number.isFinite(normalized.supplyPrice)) {
      nextErrors.push(`Строка ${excelRow}: supply_price должен быть числом.`);
    }
    if (!Number.isFinite(normalized.retailPrice)) {
      nextErrors.push(`Строка ${excelRow}: retail_price должен быть числом.`);
    }
    if (normalized.retailPrice < normalized.supplyPrice) {
      nextErrors.push(`Строка ${excelRow}: retail_price не может быть меньше supply_price.`);
    }

    nextRows.push(normalized);
  });

  parsedRows.value = nextRows;
  mappings.value = nextMappings;
  errors.value = [...new Set(nextErrors)];
}

async function setFile(file: File | null) {
  errors.value = [];
  parsedRows.value = [];
  mappings.value = [];

  if (!file) {
    selectedFile.value = null;
    return;
  }

  const fileName = file.name.toLowerCase();
  const isAllowed = fileName.endsWith(".xls") || fileName.endsWith(".xlsx") || fileName.endsWith(".csv");
  if (!isAllowed) {
    selectedFile.value = null;
    errors.value = ["Загрузите файл в формате XLS, XLSX или CSV."];
    return;
  }

  selectedFile.value = file;
  isParsing.value = true;

  try {
    await parseFile(file);
  } catch (error) {
    parsedRows.value = [];
    mappings.value = [];
    errors.value = [error instanceof Error ? error.message : "Не удалось прочитать файл."];
  } finally {
    isParsing.value = false;
  }
}

async function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  await setFile(target.files?.[0] ?? null);
}

async function onFileDrop(event: DragEvent) {
  isDragging.value = false;
  await setFile(event.dataTransfer?.files?.[0] ?? null);
}

function removeFile() {
  selectedFile.value = null;
  parsedRows.value = [];
  mappings.value = [];
  errors.value = [];

  if (fileInputRef.value) {
    fileInputRef.value.value = "";
  }
}

function validateForm() {
  const nextErrors = [...errors.value];

  if (!form.value.name.trim()) nextErrors.push("Укажите наименование импорта.");
  if (!form.value.shopId) nextErrors.push("Выберите филиал.");
  if (!selectedFile.value) nextErrors.push("Загрузите файл для импорта.");
  if (selectedFile.value && !parsedRows.value.length && !isParsing.value) {
    nextErrors.push("В файле нет корректных строк для импорта.");
  }

  errors.value = [...new Set(nextErrors)];
  return errors.value.length === 0;
}

function continueToPreview() {
  if (!validateForm()) return;
  modalStep.value = 2;
}

function goToFirstStep() {
  modalStep.value = 1;
}

async function submitImport() {
  if (!selectedFile.value || !parsedRows.value.length) return;

  creatingImport.value = true;

  closeImportModal();
  createdSession.value = buildPreviewSession();
  fieldMappingOpen.value = true;
  fieldMappingLoading.value = false;
  fieldMappingSubmitting.value = false;
  fieldMappingError.value = "";
  fieldMappingProgressPercent.value = 0;
  fieldMappingProgressMessage.value = "";
  creatingImport.value = false;
  return;

  try {
    const payload = {
      name: form.value.name.trim(),
      shopId: form.value.shopId,
      mode: form.value.mode,
      generateBarcodes: form.value.generateBarcodes,
      generateArticles: form.value.generateArticles,
      rows: parsedRows.value,
      mappings: mappings.value,
      availableProperties: availableProperties.value,
    };

    const created = await createImportSession(payload);
    const resolvedImportId = String(created?.id ?? "").trim();
    if (!resolvedImportId) {
      throw new Error("Сервер создал импорт, но не вернул его ID");
    }

    saveImportDraft(resolvedImportId, {
      name: payload.name,
      shopId: payload.shopId,
      mode: payload.mode,
      generateBarcodes: payload.generateBarcodes,
      generateArticles: payload.generateArticles,
      importType: form.value.importType,
      mappings: payload.mappings,
    });

    closeImportModal();
    await importStore.fetchData({ page: 1, pageSize: importStore.pagination.pageSize });
    fieldMappingOpen.value = true;
    fieldMappingLoading.value = true;
    fieldMappingSubmitting.value = false;
    fieldMappingError.value = "";
    fieldMappingProgressPercent.value = 0;
    fieldMappingProgressMessage.value = "";

    try {
      createdSession.value = await getImportSession(resolvedImportId);
    } catch (sessionError: any) {
      fieldMappingError.value =
        sessionError?.message || "Не удалось загрузить экран настройки полей.";
    } finally {
      fieldMappingLoading.value = false;
    }
  } catch (error: any) {
    errors.value = [error?.message || "Не удалось создать импорт."];
  } finally {
    creatingImport.value = false;
  }
}

async function handleFieldMappingContinue(nextMappings: ImportDraftMappingPayload[]) {
  if (!createdSession.value) return;

  fieldMappingSubmitting.value = true;
  fieldMappingError.value = "";
  fieldMappingProgressPercent.value = 0;
  fieldMappingProgressMessage.value = "Запускаем проверку импорта...";

  const payload = {
    name: form.value.name.trim(),
    shopId: form.value.shopId,
    mode: form.value.mode,
    generateBarcodes: form.value.generateBarcodes,
    generateArticles: form.value.generateArticles,
    rows: parsedRows.value,
    mappings: nextMappings,
    availableProperties: availableProperties.value,
  };

  try {
    const created = await createImportSession(payload);
    const resolvedImportId = String(created?.id ?? "").trim();
    if (!resolvedImportId) {
      throw new Error("Сервер создал импорт, но не вернул его ID");
    }

    saveImportDraft(resolvedImportId, {
      name: payload.name,
      shopId: payload.shopId,
      mode: payload.mode,
      generateBarcodes: payload.generateBarcodes,
      generateArticles: payload.generateArticles,
      importType: form.value.importType,
      mappings: nextMappings,
    });

    await importStore.fetchData({ page: 1, pageSize: importStore.pagination.pageSize });
    const result = await validateExcelImport(resolvedImportId, payload);

    if (result.jobId) {
      const completed = await waitForImport(result.jobId, (progress) => {
        fieldMappingProgressPercent.value = Number(progress.percent ?? 0);
        fieldMappingProgressMessage.value = String(progress.message ?? "Проверяем импорт...");
      });

      const nextImportId = completed.importId || result.importId || resolvedImportId;
      await navigateTo(`/products/import/edit/${nextImportId}?page=1`, { replace: true });
      return;
    }

    await navigateTo(`/products/import/edit/${result.importId || resolvedImportId}?page=1`, {
      replace: true,
    });
  } catch (error: any) {
    fieldMappingError.value = error?.message || "Не удалось запустить проверку импорта.";
    fieldMappingSubmitting.value = false;
    return;
  }

  fieldMappingSubmitting.value = false;
}

onMounted(async () => {
  if (!route.query.page || !route.query.limit) {
    await navigateTo("/products/import?limit=10&page=1", { replace: true });
  }

  await importStore.fetchData({
    page: resolvedPage.value,
    pageSize: resolvedLimit.value,
  });
  resetForm();
});

watch(isChildRoute, async (value, previousValue) => {
  if (value) {
    isImportModalOpen.value = false;
    return;
  }

  if (previousValue === undefined) {
    return;
  }

  await importStore.fetchData({
    page: resolvedPage.value,
    pageSize: resolvedLimit.value,
  });
});

useHead({
  title: "Импорт | Konkurent",
});
</script>

<style scoped>
.import-slideover-scroll {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.import-slideover-scroll::-webkit-scrollbar {
  display: none;
}
</style>
