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
                    ? "Загрузите Excel-файл и заполните основные данные импорта."
                    : "Выберите параметры генерации и тип импорта перед проверкой полей."
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
                  placeholder="Импорт 17.03.2026 15:29"
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
                        Перетащите файл в эту область или нажмите для выбора
                      </p>
                      <p class="text-[14px] text-[#bdbdbd]">
                        После загрузки откроется следующий шаг с настройками и сопоставлением полей.
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
                    <p class="text-[#bdbdbd]">Наименований</p>
                    <p class="mt-1 text-[18px] font-bold text-white">{{ parsedRows.length }}</p>
                  </div>
                  <div class="rounded-[16px] bg-black/10 px-4 py-3">
                    <p class="text-[#bdbdbd]">Товарных единиц</p>
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
                <p class="text-[16px] font-bold text-white">Загруженный файл</p>
                <p class="mt-2 text-[14px] text-[#bdbdbd]">
                  {{ selectedFile?.name }} • {{ parsedRows.length }} строк для импорта
                </p>
              </div>

              <div class="rounded-[24px] bg-[#363636] p-5">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-[16px] font-bold text-white">Генерировать баркоды</p>
                    <p class="mt-1 text-[14px] text-[#bdbdbd]">
                      Если в файле нет штрихкода, система подставит новый.
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
                    <p class="text-[16px] font-bold text-white">Генерировать артикулы</p>
                    <p class="mt-1 text-[14px] text-[#bdbdbd]">
                      Если артикул пустой, можно автоматически создать новый.
                    </p>
                  </div>
                  <div class="flex rounded-[14px] bg-[#2b2b2b] p-1">
                    <button
                      v-for="option in booleanOptions"
                      :key="`article-${option.value}`"
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

              <CustomSelect
                v-model="form.importType"
                label="Тип импорта"
                :options="importTypeOptions"
                placeholder="Выберите тип импорта"
              />
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
                :disabled="isParsing"
                @click="modalStep === 1 ? continueToSettings() : continueToFieldMapping()"
              >
                Продолжить
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
import { computed, ref, watch } from "vue";
import { useHead, useRoute } from "#imports";
import { storeToRefs } from "pinia";
import DataTable from "@/components/ImportDataTable.vue";
import CustomSelect from "@/components/ui/CustomSelect.vue";
import { useImportDataTableStore, type ParsedImportRow } from "@/store/DataTables/importDataTableStore";
import { useLocationStore } from "@/store/useLocationStore";
import { useUserStore } from "@/store/useUserStore";

interface ImportFormState {
  name: string;
  store: string;
  importType: string;
  generateBarcodes: boolean;
  generateArticles: boolean;
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

const booleanOptions = [
  { label: "Да", value: true },
  { label: "Нет", value: false },
];

const importStore = useImportDataTableStore();
const locationStore = useLocationStore();
const userStore = useUserStore();
const route = useRoute();
const { locations } = storeToRefs(locationStore);

const importTypeOptions = ["Поступление", "Приход остатков", "Корректировка"];
const isChildRoute = computed(
  () =>
    route.path.startsWith("/products/import/list/") ||
    route.path.startsWith("/products/import/edit/"),
);

const isImportModalOpen = ref(false);
const modalStep = ref<1 | 2>(1);
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
  generateBarcodes: false,
  generateArticles: false,
});

const locationOptions = computed(() => locations.value.map((location) => location.name));
const totalQuantity = computed(() => parsedRows.value.reduce((sum, row) => sum + row.quantity, 0));
const totalAmount = computed(() => parsedRows.value.reduce((sum, row) => sum + row.quantity * row.retailPrice, 0));

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
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const resetForm = () => {
  form.value = {
    name: createDefaultImportName(),
    store: locationStore.selectedLocation?.name ?? "",
    importType: importTypeOptions[0],
    generateBarcodes: false,
    generateArticles: false,
  };
  modalStep.value = 1;
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
  modalStep.value = 1;
};

const parseExcelFile = async (file: File) => {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", raw: true });

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
    EXPECTED_HEADERS.map((header) => [header, headers.indexOf(header)]),
  ) as Record<(typeof EXPECTED_HEADERS)[number], number>;

  const nextErrors: string[] = [];
  const nextRows: ParsedImportRow[] = [];
  const dataRows = rows.slice(1).filter((row) => row.some((cell) => normalizeText(cell) !== ""));

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

    if (!name) nextErrors.push(`Строка ${excelRow}: заполните "Наименование".`);
    if (quantity === null || quantity < 0) nextErrors.push(`Строка ${excelRow}: "Кол-во" должно быть числом 0 или больше.`);
    if (supplyPrice === null || supplyPrice < 0) nextErrors.push(`Строка ${excelRow}: "Цена поставки" должна быть числом 0 или больше.`);
    if (retailPrice === null || retailPrice < 0) nextErrors.push(`Строка ${excelRow}: "Цена продажи" должна быть числом 0 или больше.`);

    if (
      name &&
      quantity !== null &&
      quantity >= 0 &&
      supplyPrice !== null &&
      supplyPrice >= 0 &&
      retailPrice !== null &&
      retailPrice >= 0
    ) {
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
    errors.value = [error instanceof Error ? error.message : "Не удалось прочитать Excel-файл."];
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

const validateStepOne = () => {
  const nextErrors = [...errors.value];

  if (!form.value.name.trim()) nextErrors.push("Укажите наименование импорта.");
  if (!form.value.store) nextErrors.push("Выберите магазин.");
  if (!selectedFile.value) nextErrors.push("Загрузите Excel-файл для импорта.");
  if (selectedFile.value && !parsedRows.value.length && !isParsing.value) {
    nextErrors.push("В файле нет корректных строк для импорта.");
  }

  errors.value = [...new Set(nextErrors)];
  return errors.value.length === 0;
};

const continueToSettings = () => {
  if (!validateStepOne()) return;
  modalStep.value = 2;
};

const goToPreviousStep = () => {
  modalStep.value = 1;
};

const continueToFieldMapping = () => {
  if (!selectedFile.value || !parsedRows.value.length) return;

  const detailId = importStore.createDraft({
    fileName: selectedFile.value.name,
    rows: parsedRows.value,
    settings: {
      name: form.value.name.trim(),
      store: form.value.store,
      importType: form.value.importType,
      generateBarcodes: form.value.generateBarcodes,
      generateArticles: form.value.generateArticles,
    },
    createdBy: userStore.fullName || userStore.user.name || "Current User",
  });

  closeImportModal();
  importStore.openDraft(detailId);
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
