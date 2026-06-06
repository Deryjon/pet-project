<script setup lang="ts">
import { computed, reactive } from "vue";
import type {
  ImportDraftMappingPayload,
  ImportProperty,
  ImportSession,
  ParsedImportRow,
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

const props = defineProps<{
  open: boolean;
  loading: boolean;
  submitting: boolean;
  error: string;
  progressPercent: number;
  progressMessage: string;
  session: ImportSession | null;
  availableProperties: ImportProperty[];
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "continue", mappings: ImportDraftMappingPayload[]): void;
}>();

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

const mappingChoices = reactive<Record<ImportFieldKey, string>>(createDefaultChoiceState());
const newPropertyNames = reactive<Record<ImportFieldKey, string>>(createDefaultTextState());
const sampleRow = computed<ParsedImportRow | null>(() => props.session?.rows?.[0] ?? null);

function normalizeSystemName(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9А-ЯЁ]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getFieldSample(field: ImportFieldKey) {
  const row = sampleRow.value;
  if (!row) return "";

  const value = row[field];
  return String(value ?? "").trim();
}

function getMappingOptions(field: ImportFieldKey) {
  return [
    {
      label: `Подставлять в ${fieldConfigs.find((item) => item.key === field)?.label ?? field}`,
      value: `map:${FIELD_TO_SYSTEM_NAME[field]}`,
    },
    ...props.availableProperties.map((property) => ({
      label: property.name,
      value: `map:${property.system_name}`,
    })),
    { label: "Добавить новое свойство", value: "new" },
    { label: "Не загружать", value: "skip" },
  ];
}

function buildMappings(): ImportDraftMappingPayload[] | null {
  const nextMappings: ImportDraftMappingPayload[] = [];

  for (const field of fieldConfigs) {
    const choice = mappingChoices[field.key];

    if (choice === "skip") {
      if (REQUIRED_FIELDS.includes(field.key)) {
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
      const normalizedName = normalizeSystemName(newPropertyNames[field.key]);
      if (!normalizedName) {
        return null;
      }

      nextMappings.push({
        key: field.key,
        targetField: normalizedName,
        action: "new",
      });
      continue;
    }

    nextMappings.push({
      key: field.key,
      targetField: choice.replace(/^map:/, "") || FIELD_TO_SYSTEM_NAME[field.key],
      action: "map",
    });
  }

  return nextMappings;
}

const resolvedMappings = computed(() => buildMappings());
const showProgressState = computed(() => props.submitting || props.progressPercent > 0);
const continueDisabled = computed(
  () =>
    props.loading ||
    props.submitting ||
    Boolean(props.error) ||
    !props.session ||
    !resolvedMappings.value,
);

function handleContinue() {
  if (continueDisabled.value || !resolvedMappings.value) return;
  emit("continue", resolvedMappings.value);
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-[80] overflow-y-auto bg-[#1f1f1f] px-4 py-6 text-white sm:px-8 lg:px-12"
  >
    <div class="mx-auto max-w-[1480px]">
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-center gap-4">
          <button
            type="button"
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#404040] transition-colors duration-200 hover:bg-[#5e5e5e] disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="submitting"
            @click="emit('close')"
          >
            <Icon name="heroicons:arrow-left-20-solid" class="h-6 w-6" />
          </button>
        </div>

        <div class="flex-1">
          <p class="text-[12px] font-bold uppercase tracking-[0.22em] text-[#7ba9d8]">
            Проверка корректности полей
          </p>
          <h2 class="mt-2 text-[34px] font-bold text-white">Проверка корректности полей</h2>
          <p class="mt-2 max-w-[860px] text-[15px] text-[#bdbdbd]">
            Выберите, какие поля в загруженном файле должны подставляться для каждого свойства создаваемого товара.
          </p>
        </div>

        <button
          type="button"
          class="inline-flex items-center justify-center gap-2 rounded-[16px] bg-[#1f78ff] px-5 py-4 text-[16px] font-bold text-white transition-colors duration-200 hover:bg-[#2a6ed9] disabled:cursor-not-allowed disabled:bg-[#3764a8] disabled:text-white/70"
          :disabled="continueDisabled"
          @click="handleContinue"
        >
          <Icon
            v-if="submitting"
            name="heroicons:arrow-path-20-solid"
            class="h-5 w-5 animate-spin"
          />
          {{ submitting ? "Проверяем..." : "Продолжить" }}
        </button>
      </div>

      <div
        v-if="showProgressState"
        class="mt-6 rounded-[24px] bg-[#2b2b2b] p-5 text-white"
      >
        <p class="text-[13px] font-bold uppercase tracking-[0.18em] text-[#7ba9d8]">Прогресс</p>
        <p class="mt-3 text-[15px] text-[#bdbdbd]">{{ progressMessage || "Проверяем импорт..." }}</p>
        <div class="mt-4 rounded-full bg-[#404040] p-1">
          <div
            class="h-3 rounded-full bg-[#1f78ff] transition-all duration-300"
            :style="{ width: `${Math.max(progressPercent, 8)}%` }"
          />
        </div>
        <p class="mt-3 text-[20px] font-bold">{{ progressPercent }}%</p>
      </div>

      <div v-if="loading" class="mt-8 rounded-[24px] bg-[#2b2b2b] p-6 text-[#bdbdbd]">
        Загружаем данные импорта...
      </div>

      <div
        v-else-if="error"
        class="mt-8 rounded-[24px] border border-[#7f3d3d] bg-[#442f2f] p-6 text-[#ffd7d7]"
      >
        {{ error }}
      </div>

      <div
        v-else-if="!showProgressState"
        class="mt-8 grid gap-8 md:grid-cols-2 xl:grid-cols-4"
      >
        <div v-for="field in fieldConfigs" :key="field.key" class="flex flex-col gap-3">
          <p class="text-[12px] font-bold uppercase tracking-[0.14em] text-[#8f8f8f]">
            {{ field.label }}
          </p>

          <p class="text-[18px] leading-[1.5] text-white">
            {{ getFieldSample(field.key) || "—" }}
          </p>

          <div class="flex flex-col gap-3">
            <select
              v-model="mappingChoices[field.key]"
              class="w-full rounded-[16px] border border-white/8 bg-transparent px-4 py-4 text-[15px] text-white outline-none"
            >
              <option
                v-for="option in getMappingOptions(field.key)"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>

            <input
              v-if="mappingChoices[field.key] === 'new'"
              v-model="newPropertyNames[field.key]"
              type="text"
              class="w-full rounded-[16px] border border-white/8 bg-transparent px-4 py-4 text-[15px] text-white outline-none placeholder:text-[#7a7a7a]"
              placeholder="Название нового свойства"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
