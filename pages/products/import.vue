<template>
  <section class="catalog">
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
          class="fixed right-0 top-0 z-[60] flex h-full w-full max-w-[560px] flex-col overflow-hidden rounded-l-[40px] bg-[#2b2b2b] text-white shadow-2xl"
          @click.stop
        >
          <div class="flex items-center justify-between border-b border-white/10 px-8 py-6">
            <div>
              <h3 class="text-[30px] font-bold">Новый импорт</h3>
              <p class="mt-1 text-[15px] text-[#bdbdbd]">
                Загрузите Excel-файл и подтвердите импорт товаров.
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

          <div class="flex-1 space-y-6 overflow-y-auto px-8 py-8">
            <CustomSelect
              v-model="form.importType"
              label="Тип импорта"
              :options="importTypeOptions"
              placeholder="Выберите тип импорта"
            />

            <div class="space-y-2">
              <label class="text-[16px] font-bold text-white">Наименование</label>
              <input
                v-model="form.name"
                type="text"
                class="w-full rounded-[18px] border border-transparent bg-[#404040] px-5 py-4 text-[16px] text-white outline-none transition-colors duration-200 placeholder:text-[#9f9f9f] focus:border-[#4993dd]"
                placeholder="Импорт 16.03.2026 15:00"
              />
            </div>

            <CustomSelect
              v-model="form.store"
              label="Магазин"
              :options="locationOptions"
              placeholder="Выберите магазин"
            />

            <div class="space-y-2">
              <span class="block text-[16px] font-bold text-white">Файл Excel</span>
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
                  accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
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
                      Перетащите файл в эту область или нажмите для обзора
                    </p>
                    <p class="text-[14px] text-[#bdbdbd]">
                      Проверяется структура шаблона и обязательные поля в строках.
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
                    {{ formatFileSize(selectedFile.size) }}
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

            <div class="rounded-[24px] bg-[#363636] p-5">
              <p class="text-[16px] font-bold text-white">Не знаете, как заполнить файл?</p>
              <p class="mt-2 text-[14px] leading-6 text-[#bdbdbd]">
                Скачайте готовый шаблон с правильными колонками и заполните его перед импортом.
              </p>
              <a
                href="/templates/product-import-template.xlsx"
                download
                class="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-[14px] bg-[#404040] px-4 py-3 text-[15px] font-bold text-white transition-colors duration-200 hover:bg-[#4b4b4b]"
              >
                <Icon name="heroicons:arrow-down-tray-20-solid" class="h-5 w-5 text-[#4993dd]" />
                Скачать шаблон
              </a>
            </div>

            <div
              v-if="selectedFile && !errors.length && parsedRows.length"
              class="rounded-[24px] border border-[#2f5f3d] bg-[#23362a] p-5"
            >
              <div class="flex items-center gap-2">
                <Icon name="heroicons:check-badge-20-solid" class="h-5 w-5 text-[#6fd48f]" />
                <p class="text-[16px] font-bold text-white">Файл проверен</p>
              </div>
              <div class="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                <div class="rounded-[16px] bg-black/10 px-4 py-3">
                  <p class="text-[#bdbdbd]">Строк</p>
                  <p class="mt-1 text-[18px] font-bold text-white">{{ parsedRows.length }}</p>
                </div>
                <div class="rounded-[16px] bg-black/10 px-4 py-3">
                  <p class="text-[#bdbdbd]">Кол-во</p>
                  <p class="mt-1 text-[18px] font-bold text-white">{{ totalQuantity }}</p>
                </div>
                <div class="rounded-[16px] bg-black/10 px-4 py-3">
                  <p class="text-[#bdbdbd]">Сумма</p>
                  <p class="mt-1 text-[18px] font-bold text-white">{{ formatCurrency(totalAmount) }}</p>
                </div>
              </div>
            </div>

            <div
              v-if="expectedHeaders.length"
              class="rounded-[24px] border border-white/10 bg-[#323232] p-5"
            >
              <p class="text-[16px] font-bold text-white">Ожидаемые колонки</p>
              <p class="mt-2 text-[14px] text-[#bdbdbd]">
                Файл должен содержать эти заголовки в первой строке.
              </p>
              <div class="mt-4 flex flex-wrap gap-2">
                <span
                  v-for="header in expectedHeaders"
                  :key="header"
                  class="rounded-full bg-[#404040] px-3 py-2 text-[12px] font-bold text-[#d7d7d7]"
                >
                  {{ header }}
                </span>
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

          <div class="border-t border-white/10 px-8 py-6">
            <div class="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                class="flex-1 cursor-pointer rounded-[16px] bg-[#404040] px-5 py-4 text-[16px] font-bold text-white transition-colors duration-200 hover:bg-[#4b4b4b]"
                @click="closeImportModal"
              >
                Отмена
              </button>
              <button
                type="button"
                class="flex-1 cursor-pointer rounded-[16px] bg-[#1f78ff] px-5 py-4 text-[16px] font-bold text-white transition-colors duration-200 hover:bg-[#2a6ed9] disabled:cursor-not-allowed disabled:bg-[#3764a8] disabled:text-white/70"
                :disabled="isParsing"
                @click="confirmImport"
              >
                Подтвердить импорт
              </button>
            </div>
          </div>
        </aside>
      </transition>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useHead } from "#imports";
import { storeToRefs } from "pinia";
import DataTable from "@/components/ImportDataTable.vue";
import CustomSelect from "@/components/ui/CustomSelect.vue";
import { useImportDataTableStore } from "@/store/DataTables/importDataTableStore";
import { useLocationStore } from "@/store/useLocationStore";
import { useUserStore } from "@/store/useUserStore";

interface ImportFormState {
  name: string;
  store: string;
  importType: string;
}

interface ParsedImportRow {
  name: string;
  article: string;
  barcode: string;
  quantity: number;
  supplyPrice: number;
  retailPrice: number;
  category: string;
  brand: string;
  unit: string;
  supplier: string;
  description: string;
}

const EXPECTED_HEADERS = [
  "НАИМЕНОВАНИЕ",
  "АРТИКУЛ",
  "БАРКОД",
  "КОЛ-ВО",
  "ЦЕНА ПОСТАВКИ (UZS)",
  "РОЗНИЧНАЯ ЦЕНА (UZS)",
  "КАТЕГОРИЯ",
  "БРЕНД",
  "ЕДИНИЦА ИЗМЕРЕНИЯ",
  "ПОСТАВЩИК",
  "ОПИСАНИЕ",
] as const;

const importStore = useImportDataTableStore();
const locationStore = useLocationStore();
const userStore = useUserStore();
const { locations } = storeToRefs(locationStore);
const importTypeOptions = ["Поступление", "Приход остатков", "Корректировка"];

const isImportModalOpen = ref(false);
const isDragging = ref(false);
const isParsing = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const parsedRows = ref<ParsedImportRow[]>([]);
const errors = ref<string[]>([]);
const form = ref<ImportFormState>({
  name: "",
  store: "",
  importType: importTypeOptions[0],
});

const locationOptions = computed(() => locations.value.map((location) => location.name));
const expectedHeaders = computed(() => [...EXPECTED_HEADERS]);
const totalQuantity = computed(() =>
  parsedRows.value.reduce((sum, row) => sum + row.quantity, 0)
);
const totalAmount = computed(() =>
  parsedRows.value.reduce((sum, row) => sum + row.quantity * row.retailPrice, 0)
);
const totalPurchaseAmount = computed(() =>
  parsedRows.value.reduce((sum, row) => sum + row.quantity * row.supplyPrice, 0)
);

const createDefaultImportName = () => {
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
};

const formatFileSize = (size: number) => {
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
};

const formatCurrency = (value: number) =>
  `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value)} UZS`;

const normalizeText = (value: unknown) => String(value ?? "").trim();

const parseNumber = (value: unknown) => {
  const normalized = normalizeText(value).replace(/\s/g, "").replace(",", ".");

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const resetForm = () => {
  form.value = {
    name: createDefaultImportName(),
    store: locationStore.selectedLocation?.name ?? "",
    importType: importTypeOptions[0],
  };
  selectedFile.value = null;
  parsedRows.value = [];
  errors.value = [];
  isParsing.value = false;

  if (fileInputRef.value) {
    fileInputRef.value.value = "";
  }
};

const openImportModal = () => {
  resetForm();
  isImportModalOpen.value = true;
};

const closeImportModal = () => {
  isImportModalOpen.value = false;
  isDragging.value = false;
};

const parseExcelFile = async (file: File) => {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(await file.arrayBuffer(), {
    type: "array",
    raw: true,
  });

  if (!workbook.SheetNames.length) {
    throw new Error("Файл не содержит листов.");
  }

  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(worksheet, {
    header: 1,
    defval: "",
    raw: true,
  });

  if (!rows.length) {
    throw new Error("Файл пустой.");
  }

  const headers = rows[0].map((cell) => normalizeText(cell).toUpperCase());
  const missingHeaders = EXPECTED_HEADERS.filter((header) => !headers.includes(header));

  if (missingHeaders.length) {
    throw new Error(`Не найдены колонки: ${missingHeaders.join(", ")}.`);
  }

  const headerIndexMap = Object.fromEntries(
    EXPECTED_HEADERS.map((header) => [header, headers.indexOf(header)])
  ) as Record<(typeof EXPECTED_HEADERS)[number], number>;

  const nextErrors: string[] = [];
  const nextRows: ParsedImportRow[] = [];
  const dataRows = rows.slice(1).filter((row) =>
    row.some((cell) => normalizeText(cell) !== "")
  );

  if (!dataRows.length) {
    throw new Error("После строки заголовков нет данных для импорта.");
  }

  dataRows.forEach((row, index) => {
    const excelRow = index + 2;
    const name = normalizeText(row[headerIndexMap["НАИМЕНОВАНИЕ"]]);
    const article = normalizeText(row[headerIndexMap["АРТИКУЛ"]]);
    const barcode = normalizeText(row[headerIndexMap["БАРКОД"]]);
    const quantity = parseNumber(row[headerIndexMap["КОЛ-ВО"]]);
    const supplyPrice = parseNumber(row[headerIndexMap["ЦЕНА ПОСТАВКИ (UZS)"]]);
    const retailPrice = parseNumber(row[headerIndexMap["РОЗНИЧНАЯ ЦЕНА (UZS)"]]);
    const category = normalizeText(row[headerIndexMap["КАТЕГОРИЯ"]]);
    const brand = normalizeText(row[headerIndexMap["БРЕНД"]]);
    const unit = normalizeText(row[headerIndexMap["ЕДИНИЦА ИЗМЕРЕНИЯ"]]);
    const supplier = normalizeText(row[headerIndexMap["ПОСТАВЩИК"]]);
    const description = normalizeText(row[headerIndexMap["ОПИСАНИЕ"]]);

    if (!name) {
      nextErrors.push(`Строка ${excelRow}: заполните "Наименование".`);
    }
    if (quantity === null || quantity < 0) {
      nextErrors.push(`Строка ${excelRow}: "Кол-во" должно быть числом 0 или больше.`);
    }
    if (supplyPrice === null || supplyPrice < 0) {
      nextErrors.push(`Строка ${excelRow}: "Цена поставки" должна быть числом 0 или больше.`);
    }
    if (retailPrice === null || retailPrice < 0) {
      nextErrors.push(`Строка ${excelRow}: "Розничная цена" должна быть числом 0 или больше.`);
    }

    if (name && quantity !== null && quantity >= 0 && supplyPrice !== null && supplyPrice >= 0 && retailPrice !== null && retailPrice >= 0) {
      nextRows.push({
        name,
        article,
        barcode,
        quantity,
        supplyPrice,
        retailPrice,
        category,
        brand,
        unit,
        supplier,
        description,
      });
    }
  });

  parsedRows.value = nextRows;
  errors.value = nextErrors;
};

const setFile = async (file: File | null) => {
  errors.value = [];
  parsedRows.value = [];

  if (!file) {
    selectedFile.value = null;
    return;
  }

  const fileName = file.name.toLowerCase();
  const isExcelFile = fileName.endsWith(".xls") || fileName.endsWith(".xlsx");

  if (!isExcelFile) {
    selectedFile.value = null;
    errors.value = ["Загрузите файл в формате XLS или XLSX."];
    return;
  }

  selectedFile.value = file;
  isParsing.value = true;

  try {
    await parseExcelFile(file);
  } catch (error) {
    parsedRows.value = [];
    errors.value = [
      error instanceof Error ? error.message : "Не удалось прочитать Excel-файл.",
    ];
  } finally {
    isParsing.value = false;
  }
};

const onFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  await setFile(target.files?.[0] ?? null);
};

const onFileDrop = async (event: DragEvent) => {
  isDragging.value = false;
  await setFile(event.dataTransfer?.files?.[0] ?? null);
};

const removeFile = () => {
  selectedFile.value = null;
  parsedRows.value = [];
  errors.value = [];

  if (fileInputRef.value) {
    fileInputRef.value.value = "";
  }
};

const validateForm = () => {
  const nextErrors = [...errors.value];

  if (!form.value.name.trim()) {
    nextErrors.push("Укажите наименование импорта.");
  }

  if (!form.value.store) {
    nextErrors.push("Выберите магазин.");
  }

  if (!selectedFile.value) {
    nextErrors.push("Загрузите Excel-файл для импорта.");
  }

  if (selectedFile.value && !parsedRows.value.length && !isParsing.value) {
    nextErrors.push("В файле нет корректных строк для импорта.");
  }

  errors.value = [...new Set(nextErrors)];
  return errors.value.length === 0;
};

const confirmImport = () => {
  if (!validateForm()) {
    return;
  }

  importStore.addImport({
    name: form.value.name.trim(),
    store: form.value.store,
    qty: totalQuantity.value,
    confirmedQty: totalQuantity.value,
    total: totalAmount.value,
    purchaseTotal: totalPurchaseAmount.value,
    status: "Завершен",
    createdAt: new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date()),
    createdBy: userStore.fullName || userStore.user.name || "Current User",
    finishedBy: userStore.fullName || userStore.user.name || "Current User",
    importType: form.value.importType,
    salesProgress: "0%",
  });

  closeImportModal();
};

watch(isImportModalOpen, (isOpen) => {
  document.body.classList.toggle("overflow-hidden", isOpen);
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
