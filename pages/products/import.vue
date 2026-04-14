<template>
  <section v-if="!isChildRoute" class="catalog">
    <div class="top flex justify-between">
      <h2 class="text-[36px] font-bold text-white">Импорт</h2>
    </div>

    <DataTable class="mt-[40px]" @create="openImportModal" />

    <Teleport to="body">
      <transition name="fade">
        <div
          v-if="isImportModalOpen"
          class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          @click="closeImportModal"
        />
      </transition>

      <transition name="slide-panel">
        <aside
          v-if="isImportModalOpen"
          class="fixed right-0 top-0 z-[60] flex h-full w-full max-w-[640px] flex-col overflow-hidden rounded-l-[40px] bg-[#2b2b2b] text-white shadow-2xl"
          @click.stop
        >
          <div class="flex items-center justify-between border-b border-white/10 px-8 py-6">
            <div>
              <p class="text-[12px] font-bold uppercase tracking-[0.24em] text-[#7ba9d8]">
                Шаг {{ modalStep }} из 2
              </p>
              <h3 class="mt-2 text-[30px] font-bold">
                {{ modalStep === 1 ? "Новый импорт" : "Параметры импорта" }}
              </h3>
              <p class="mt-1 text-[15px] text-[#bdbdbd]">
                {{
                  modalStep === 1
                    ? "Загрузите файл и проверьте базовые ошибки перед созданием серверного импорта."
                    : "Выберите режим и создайте import session на сервере."
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

          <div class="flex-1 overflow-y-auto px-8 py-8">
            <div v-if="modalStep === 1" class="space-y-6">
              <div class="space-y-2">
                <label class="text-[16px] font-bold text-white">Наименование</label>
                <input
                  v-model="form.name"
                  type="text"
                  class="w-full rounded-[18px] border border-transparent bg-[#404040] px-5 py-4 text-[16px] text-white outline-none transition-colors duration-200 placeholder:text-[#9f9f9f] focus:border-[#4993dd]"
                  placeholder="Импорт 13.04.2026 01:37"
                />
              </div>

              <CustomSelect
                v-model="form.shopId"
                label="Магазин"
                :options="shopOptions"
                placeholder="Выберите магазин"
              />

              <div v-if="bootstrapLoading" class="rounded-[20px] bg-[#363636] px-5 py-4 text-[14px] text-[#bdbdbd]">
                Загружаем магазины и свойства импорта...
              </div>

              <div v-else-if="bootstrapError" class="rounded-[20px] border border-[#7f3d3d] bg-[#442f2f] px-5 py-4 text-[14px] text-[#ffd7d7]">
                {{ bootstrapError }}
              </div>

              <div class="space-y-2">
                <span class="block text-[16px] font-bold text-white">Файл</span>
                <label
                  class="block cursor-pointer rounded-[24px] border border-dashed p-6 transition-colors duration-200"
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
                  class="flex items-center justify-between rounded-[18px] bg-[#363636] px-5 py-4"
                >
                  <div>
                    <p class="text-[16px] font-bold text-white">{{ selectedFile.name }}</p>
                    <p class="mt-1 text-[14px] text-[#bdbdbd]">
                      {{ formatFileSize(selectedFile.size) }} • {{ parsedRows.length }} строк
                    </p>
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
                v-if="selectedFile && !errors.length && parsedRows.length"
                class="rounded-[24px] border border-[#2f5f3d] bg-[#23362a] p-5"
              >
                <div class="flex items-center gap-2">
                  <Icon name="heroicons:check-badge-20-solid" class="h-5 w-5 text-[#6fd48f]" />
                  <p class="text-[16px] font-bold text-white">Файл проверен</p>
                </div>
                <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div class="rounded-[16px] bg-black/10 px-4 py-3">
                    <p class="text-[#bdbdbd]">Строк</p>
                    <p class="mt-1 text-[18px] font-bold text-white">{{ parsedRows.length }}</p>
                  </div>
                  <div class="rounded-[16px] bg-black/10 px-4 py-3">
                    <p class="text-[#bdbdbd]">Количество</p>
                    <p class="mt-1 text-[18px] font-bold text-white">{{ totalQuantity }}</p>
                  </div>
                  <div class="rounded-[16px] bg-black/10 px-4 py-3">
                    <p class="text-[#bdbdbd]">Сумма продажи</p>
                    <p class="mt-1 text-[18px] font-bold text-white">{{ formatCurrency(totalAmount) }}</p>
                  </div>
                </div>
              </div>

              <div v-if="isParsing" class="rounded-[24px] bg-[#363636] p-5 text-[14px] text-[#bdbdbd]">
                Проверяем структуру файла и строки импорта...
              </div>

              <div v-if="errors.length" class="rounded-[24px] border border-[#7f3d3d] bg-[#442f2f] p-5">
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
              <div class="rounded-[24px] bg-[#363636] p-5">
                <p class="text-[16px] font-bold text-white">Подготовленный файл</p>
                <p class="mt-2 text-[14px] text-[#bdbdbd]">
                  {{ selectedFile?.name }} • {{ parsedRows.length }} строк
                </p>
              </div>

              <div class="rounded-[24px] bg-[#363636] p-5">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-[16px] font-bold text-white">Режим импорта</p>
                    <p class="mt-1 text-[14px] text-[#bdbdbd]">
                      Оба режима создают import session, после чего можно открыть общую таблицу товаров перед загрузкой.
                    </p>
                  </div>
                  <div class="flex rounded-[14px] bg-[#2b2b2b] p-1">
                    <button
                      v-for="option in modeOptions"
                      :key="option.value"
                      type="button"
                      class="rounded-[10px] px-4 py-2 text-[14px] font-bold transition-colors duration-200"
                      :class="form.mode === option.value ? 'bg-[#1f78ff] text-white' : 'text-[#bdbdbd]'"
                      @click="form.mode = option.value"
                    >
                      {{ option.label }}
                    </button>
                  </div>
                </div>
              </div>

              <div class="rounded-[24px] bg-[#363636] p-5">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-[16px] font-bold text-white">Генерировать штрихкоды</p>
                    <p class="mt-1 text-[14px] text-[#bdbdbd]">
                      Если barcode пустой, backend сможет подставить новый.
                    </p>
                  </div>
                  <div class="flex rounded-[14px] bg-[#2b2b2b] p-1">
                    <button
                      v-for="option in booleanOptions"
                      :key="`barcode-${option.value}`"
                      type="button"
                      class="rounded-[10px] px-4 py-2 text-[14px] font-bold transition-colors duration-200"
                      :class="form.generateBarcodes === option.value ? 'bg-[#1f78ff] text-white' : 'text-[#bdbdbd]'"
                      @click="form.generateBarcodes = option.value"
                    >
                      {{ option.label }}
                    </button>
                  </div>
                </div>
              </div>

              <div class="rounded-[24px] bg-[#363636] p-5">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-[16px] font-bold text-white">Генерировать SKU</p>
                    <p class="mt-1 text-[14px] text-[#bdbdbd]">
                      Если SKU пустой, backend сможет сгенерировать значение.
                    </p>
                  </div>
                  <div class="flex rounded-[14px] bg-[#2b2b2b] p-1">
                    <button
                      v-for="option in booleanOptions"
                      :key="`sku-${option.value}`"
                      type="button"
                      class="rounded-[10px] px-4 py-2 text-[14px] font-bold transition-colors duration-200"
                      :class="form.generateArticles === option.value ? 'bg-[#1f78ff] text-white' : 'text-[#bdbdbd]'"
                      @click="form.generateArticles = option.value"
                    >
                      {{ option.label }}
                    </button>
                  </div>
                </div>
              </div>

              <div class="rounded-[24px] border border-[#3c4f69] bg-[#24384f] p-5">
                <p class="text-[16px] font-bold text-white">Что создадим на сервере</p>
                <p class="mt-2 text-[14px] text-[#c9d9ee]">
                  Магазин: {{ selectedShopName || "не выбран" }} • режим:
                  {{ form.mode === "with_check" ? "с проверкой" : "без проверки" }}
                </p>
              </div>
            </div>
          </div>

          <div class="border-t border-white/10 px-8 py-6">
            <div class="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                class="flex-1 cursor-pointer rounded-[16px] bg-[#404040] px-5 py-4 text-[16px] font-bold text-white transition-colors duration-200 hover:bg-[#4b4b4b]"
                @click="modalStep === 1 ? closeImportModal() : goToPreviousStep()"
              >
                {{ modalStep === 1 ? "Отмена" : "Назад" }}
              </button>
              <button
                type="button"
                class="flex-1 cursor-pointer rounded-[16px] bg-[#1f78ff] px-5 py-4 text-[16px] font-bold text-white transition-colors duration-200 hover:bg-[#2a6ed9] disabled:cursor-not-allowed disabled:bg-[#3764a8] disabled:text-white/70"
                :disabled="isParsing || bootstrapLoading || creatingImport || Boolean(bootstrapError)"
                @click="modalStep === 1 ? continueToSettings() : submitImport()"
              >
                {{ modalStep === 1 ? "Дальше" : creatingImport ? "Создаем..." : "Создать импорт" }}
              </button>
            </div>
          </div>
        </aside>
      </transition>
    </Teleport>
  </section>

  <NuxtPage v-else />
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useHead, useRoute, useRouter } from "#imports";
import DataTable from "@/components/ImportDataTable.vue";
import CustomSelect from "@/components/ui/CustomSelect.vue";
import { useImportDataTableStore } from "@/store/DataTables/importDataTableStore";
import {
  useProductImport,
  type ImportDraftMappingPayload,
  type ImportMode,
  type ImportProperty,
  type ImportShopOption,
  type ParsedImportRow,
} from "~/composables/useProductImport";

interface ImportFormState {
  name: string;
  shopId: string;
  mode: ImportMode;
  generateBarcodes: boolean;
  generateArticles: boolean;
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

const modeOptions: Array<{ label: string; value: ImportMode }> = [
  { label: "С проверкой", value: "with_check" },
  { label: "Без проверки", value: "without_check" },
];

const importStore = useImportDataTableStore();
const router = useRouter();
const route = useRoute();
const {
  getAllowedShops,
  getImportProperties,
  createImportSession,
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
const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const parsedRows = ref<ParsedImportRow[]>([]);
const mappings = ref<ImportDraftMappingPayload[]>([]);
const errors = ref<string[]>([]);
const availableProperties = ref<ImportProperty[]>([]);
const shops = ref<ImportShopOption[]>([]);

const form = ref<ImportFormState>({
  name: "",
  shopId: "",
  mode: "with_check",
  generateBarcodes: true,
  generateArticles: true,
});

const shopOptions = computed(() =>
  shops.value.map((shop) => ({ label: shop.name, value: shop.id })),
);
const selectedShopName = computed(
  () => shops.value.find((shop) => shop.id === form.value.shopId)?.name || form.value.shopId,
);
const totalQuantity = computed(() => parsedRows.value.reduce((sum, row) => sum + row.quantity, 0));
const totalAmount = computed(() => parsedRows.value.reduce((sum, row) => sum + row.quantity * row.retailPrice, 0));

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
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value)} UZS`;
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
      bootstrapError.value = "Сервер не вернул доступные магазины.";
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

function validateStepOne() {
  const nextErrors = [...errors.value];

  if (!form.value.name.trim()) nextErrors.push("Укажите наименование импорта.");
  if (!form.value.shopId) nextErrors.push("Выберите магазин.");
  if (!selectedFile.value) nextErrors.push("Загрузите файл для импорта.");
  if (selectedFile.value && !parsedRows.value.length && !isParsing.value) {
    nextErrors.push("В файле нет корректных строк для импорта.");
  }

  errors.value = [...new Set(nextErrors)];
  return errors.value.length === 0;
}

function continueToSettings() {
  if (!validateStepOne()) return;
  modalStep.value = 2;
}

function goToPreviousStep() {
  modalStep.value = 1;
}

async function submitImport() {
  if (!selectedFile.value || !parsedRows.value.length) return;

  const selectedShop = shops.value.find((shop) => shop.id === form.value.shopId);
  if (!selectedShop) {
    errors.value = ["Не удалось определить выбранный магазин."];
    modalStep.value = 1;
    return;
  }

  creatingImport.value = true;

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
    let resolvedImportId = String(created?.id ?? "").trim();

    closeImportModal();
    await importStore.fetchData({ page: 1, pageSize: importStore.pagination.pageSize });

    if (!resolvedImportId) {
      resolvedImportId =
        importStore.rawData.find(
          (item) => item.name === payload.name && (item.status === "draft" || item.status === "validating"),
        )?.id ||
        importStore.rawData.find((item) => item.name === payload.name)?.id ||
        "";
    }

    if (!resolvedImportId) {
      throw new Error("Сервер создал импорт, но не вернул его ID");
    }

    await router.push(`/products/import/edit/${resolvedImportId}?page=1`);
  } catch (error: any) {
    errors.value = [error?.message || "Не удалось создать импорт."];
    modalStep.value = 2;
  } finally {
    creatingImport.value = false;
  }
}

watch(isImportModalOpen, (isOpen) => {
  document.body.classList.toggle("overflow-hidden", isOpen);
});

onMounted(async () => {
  await importStore.fetchData({ page: 1, pageSize: importStore.pagination.pageSize });
  resetForm();
});

useHead({
  title: "Импорт | Konkurent.cases",
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

.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-panel-enter-from,
.slide-panel-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
