<template>
  <section v-if="loading" class="rounded-[28px] bg-[#2b2b2b] p-8 text-white">
    Загружаем импорт...
  </section>

  <section v-else-if="error" class="rounded-[28px] border border-[#7f3d3d] bg-[#442f2f] p-8 text-white">
    <button
      type="button"
      class="inline-flex cursor-pointer items-center gap-2 rounded-[14px] bg-[#5a3838] px-4 py-3 text-[14px] font-bold text-white transition-colors duration-200 hover:bg-[#704646]"
      @click="goBack"
    >
      <Icon name="heroicons:arrow-left-20-solid" class="h-5 w-5 text-[#ffb4b4]" />
      Назад к импортам
    </button>
    <h1 class="mt-5 text-[28px] font-bold">Не удалось загрузить импорт</h1>
    <p class="mt-3 text-[#ffd7d7]">{{ error }}</p>
  </section>

  <section v-else-if="session" class="space-y-8">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <button
          type="button"
          class="inline-flex cursor-pointer items-center gap-2 rounded-[14px] bg-[#363636] px-4 py-3 text-[14px] font-bold text-white transition-colors duration-200 hover:bg-[#4a4a4a]"
          @click="goBack"
        >
          <Icon name="heroicons:arrow-left-20-solid" class="h-5 w-5 text-[#4993dd]" />
          Назад к импортам
        </button>

        <p class="mt-5 text-[12px] font-bold uppercase tracking-[0.24em] text-[#7ba9d8]">
          {{ isTableStage ? "Предпросмотр" : "Результат коммита" }}
        </p>
        <h1 class="mt-2 text-[34px] font-bold text-white">{{ session.name }}</h1>
        <p class="mt-2 text-[15px] text-[#bdbdbd]">
          {{ modeLabel }} • {{ session.shop_name || session.shop_id || "—" }} • {{ formatDate(session.created_at) }}
        </p>
      </div>

      <div class="flex flex-wrap gap-3">
        <button
          v-if="canCancel"
          type="button"
          class="cursor-pointer rounded-[16px] bg-[#4a3030] px-5 py-4 text-[15px] font-bold text-white transition-colors duration-200 hover:bg-[#613b3b] disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="actionLoading"
          @click="cancelImport"
        >
          Отменить
        </button>

        <button
          v-if="showDifferenceToggle"
          type="button"
          class="cursor-pointer rounded-[16px] bg-[#404040] px-5 py-4 text-[15px] font-bold text-white transition-colors duration-200 hover:bg-[#4b4b4b] disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="previewLoading || actionLoading"
          @click="toggleDifference"
        >
          {{ differenceOnly ? "Показать все строки" : "Только отличия" }}
        </button>

        <button
          v-if="canCommit"
          type="button"
          class="cursor-pointer rounded-[16px] bg-[#1f78ff] px-5 py-4 text-[15px] font-bold text-white transition-colors duration-200 hover:bg-[#2a6ed9] disabled:cursor-not-allowed disabled:bg-[#3764a8]"
          :disabled="actionLoading || commitBlocked"
          @click="commitImport"
        >
          {{ actionLoading ? "Коммитим..." : commitBlocked ? "Коммит недоступен" : "Подтвердить импорт" }}
        </button>
      </div>
    </div>

    <section v-if="actionMessage" class="rounded-[24px] border border-[#37516f] bg-[#24384f] p-5 text-white">
      {{ actionMessage }}
    </section>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div v-for="stat in summaryStats" :key="stat.label" class="rounded-[24px] bg-[#2b2b2b] p-5">
        <p class="text-[13px] font-bold text-[#a7a7a7]">{{ stat.label }}</p>
        <p class="mt-3 text-[28px] font-bold text-white">{{ stat.value }}</p>
      </div>
    </div>

    <section class="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <div class="rounded-[28px] bg-[#2b2b2b] p-6">
        <p class="text-[12px] font-bold uppercase tracking-[0.22em] text-[#7ba9d8]">Импорт</p>
        <h2 class="mt-2 text-[24px] font-bold text-white">Параметры сессии</h2>

        <div class="mt-4 grid gap-3 md:grid-cols-2">
          <div v-for="item in sessionMeta" :key="item.label" class="rounded-[18px] bg-[#363636] px-4 py-4">
            <p class="text-[13px] text-[#a7a7a7]">{{ item.label }}</p>
            <p class="mt-2 text-[15px] font-bold text-white">{{ item.value }}</p>
          </div>
        </div>
      </div>

      <div class="rounded-[28px] bg-[#2b2b2b] p-6">
        <p class="text-[12px] font-bold uppercase tracking-[0.22em] text-[#7ba9d8]">On Match</p>
        <h2 class="mt-2 text-[24px] font-bold text-white">Политика совпадений</h2>

        <div class="mt-4 space-y-3">
          <div
            v-for="item in onMatchEntries"
            :key="item.label"
            class="flex items-center justify-between rounded-[18px] bg-[#363636] px-4 py-4"
          >
            <span class="text-[14px] text-[#d0d0d0]">{{ item.label }}</span>
            <span class="rounded-[12px] bg-[#24384f] px-3 py-2 text-[13px] font-bold text-white">
              {{ item.value }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <section
      v-if="dryRunSummary"
      class="rounded-[28px] bg-[#2b2b2b] p-6"
    >
      <p class="text-[12px] font-bold uppercase tracking-[0.22em] text-[#7ba9d8]">Dry Run</p>
      <h2 class="mt-2 text-[24px] font-bold text-white">Результат валидации</h2>

      <div class="mt-4 grid gap-4 md:grid-cols-3">
        <div class="rounded-[18px] bg-[#363636] px-4 py-4">
          <p class="text-[#a7a7a7]">Создастся</p>
          <p class="mt-1 text-[24px] font-bold text-white">{{ dryRunSummary.create_count }}</p>
        </div>
        <div class="rounded-[18px] bg-[#363636] px-4 py-4">
          <p class="text-[#a7a7a7]">Обновится</p>
          <p class="mt-1 text-[24px] font-bold text-white">{{ dryRunSummary.update_count }}</p>
        </div>
        <div class="rounded-[18px] bg-[#363636] px-4 py-4">
          <p class="text-[#a7a7a7]">Ошибок</p>
          <p class="mt-1 text-[24px] font-bold text-white">{{ dryRunSummary.error_count }}</p>
        </div>
      </div>

      <div class="mt-5">
        <p class="text-[14px] font-bold text-white">Конфликты по полям</p>
        <div v-if="conflictFieldEntries.length" class="mt-3 flex flex-wrap gap-2">
          <span
            v-for="item in conflictFieldEntries"
            :key="item.field"
            class="rounded-[12px] bg-[#24384f] px-3 py-2 text-[13px] font-bold text-white"
          >
            {{ item.label }}: {{ item.count }}
          </span>
        </div>
        <p v-else class="mt-3 text-[14px] text-[#bdbdbd]">Конфликтов по полям не найдено.</p>
      </div>
    </section>

    <section v-if="resultErrors.length" class="rounded-[28px] border border-[#7f3d3d] bg-[#442f2f] p-6 text-white">
      <div class="flex items-center gap-2">
        <Icon name="heroicons:exclamation-circle-20-solid" class="h-5 w-5 text-[#ff8c8c]" />
        <p class="text-[16px] font-bold">Ошибки</p>
      </div>

      <ul class="mt-4 space-y-2 text-[14px] text-[#ffd7d7]">
        <li v-for="(item, index) in resultErrors" :key="`${item.row}-${index}`">
          {{ item.row ? `Строка ${item.row}: ` : "" }}{{ item.message }}
        </li>
      </ul>
    </section>

    <section v-if="isTableStage" class="rounded-[28px] bg-[#2b2b2b] p-6">
      <div class="mb-4 flex items-center justify-between gap-4">
        <div>
          <p class="text-[12px] font-bold uppercase tracking-[0.22em] text-[#7ba9d8]">Строки</p>
          <h2 class="mt-2 text-[24px] font-bold text-white">Предпросмотр импорта</h2>
        </div>

        <p v-if="previewLoading" class="text-[14px] text-[#bdbdbd]">Обновляем таблицу...</p>
      </div>

      <div v-if="tableRows.length" class="overflow-x-auto">
        <table class="min-w-full border-separate border-spacing-y-2 text-left">
          <thead>
            <tr class="text-[13px] uppercase tracking-[0.12em] text-[#8f8f8f]">
              <th class="px-4 py-3">№</th>
              <th class="px-4 py-3">Название</th>
              <th class="px-4 py-3">SKU</th>
              <th class="px-4 py-3">Barcode</th>
              <th class="px-4 py-3">Кол-во</th>
              <th class="px-4 py-3">Действие</th>
              <th class="px-4 py-3">Различие</th>
              <th class="px-4 py-3">Поля</th>
              <th class="px-4 py-3">Ошибка</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="item in tableRows" :key="item.id">
              <td class="rounded-l-[18px] bg-[#363636] px-4 py-4 text-[15px] text-white">{{ item.row_number || "—" }}</td>
              <td class="bg-[#363636] px-4 py-4 text-[15px] font-bold text-white">{{ item.product_name || "—" }}</td>
              <td class="bg-[#363636] px-4 py-4 text-[15px] text-white">{{ item.product_sku || item.raw.sku || "—" }}</td>
              <td class="bg-[#363636] px-4 py-4 text-[15px] text-white">{{ item.product_barcode || item.raw.barcode || "—" }}</td>
              <td class="bg-[#363636] px-4 py-4 text-[15px] text-white">{{ item.measurement_value }}</td>
              <td class="bg-[#363636] px-4 py-4 text-[15px] text-white">{{ previewActionLabel(item.action) }}</td>
              <td class="bg-[#363636] px-4 py-4 text-[15px] text-white">{{ item.difference ? "Да" : "Нет" }}</td>
              <td class="bg-[#363636] px-4 py-4 text-[15px] text-white">
                {{ item.different_fields.length ? item.different_fields.join(", ") : "—" }}
              </td>
              <td class="rounded-r-[18px] bg-[#363636] px-4 py-4 text-[15px] text-white">{{ item.error || "—" }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="rounded-[20px] bg-[#363636] px-6 py-10 text-center text-[15px] text-[#bdbdbd]">
        Строки предпросмотра не найдены.
      </div>
    </section>

    <section v-else class="rounded-[28px] bg-[#2b2b2b] p-6">
      <p class="text-[12px] font-bold uppercase tracking-[0.22em] text-[#7ba9d8]">Commit</p>
      <h2 class="mt-2 text-[24px] font-bold text-white">Итоги коммита</h2>

      <div class="mt-4 grid gap-4 md:grid-cols-3">
        <div class="rounded-[18px] bg-[#363636] px-4 py-4">
          <p class="text-[#a7a7a7]">Создано</p>
          <p class="mt-1 text-[24px] font-bold text-white">{{ session.result?.created_count ?? 0 }}</p>
        </div>
        <div class="rounded-[18px] bg-[#363636] px-4 py-4">
          <p class="text-[#a7a7a7]">Обновлено</p>
          <p class="mt-1 text-[24px] font-bold text-white">{{ session.result?.updated_count ?? 0 }}</p>
        </div>
        <div class="rounded-[18px] bg-[#363636] px-4 py-4">
          <p class="text-[#a7a7a7]">Ошибок</p>
          <p class="mt-1 text-[24px] font-bold text-white">{{ session.result?.error_count ?? 0 }}</p>
        </div>
      </div>

      <div class="mt-6">
        <div class="flex items-center justify-between gap-3">
          <h3 class="text-[18px] font-bold text-white">Аудит по строкам</h3>
          <p class="text-[14px] text-[#bdbdbd]">
            {{ session.result?.committed_at ? `Закоммичено ${formatDate(session.result.committed_at)}` : "Время коммита не получено" }}
          </p>
        </div>

        <div v-if="auditRows.length" class="mt-4 overflow-x-auto">
          <table class="min-w-full border-separate border-spacing-y-2 text-left">
            <thead>
              <tr class="text-[13px] uppercase tracking-[0.12em] text-[#8f8f8f]">
                <th class="px-4 py-3">Строка</th>
                <th class="px-4 py-3">Действие</th>
                <th class="px-4 py-3">Причина</th>
                <th class="px-4 py-3">Измененные поля</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="(item, index) in auditRows" :key="`${item.row}-${index}`">
                <td class="rounded-l-[18px] bg-[#363636] px-4 py-4 text-[15px] text-white">{{ item.row ?? "—" }}</td>
                <td class="bg-[#363636] px-4 py-4 text-[15px] text-white">{{ commitActionLabel(item.action) }}</td>
                <td class="bg-[#363636] px-4 py-4 text-[15px] text-white">{{ item.reason || "—" }}</td>
                <td class="rounded-r-[18px] bg-[#363636] px-4 py-4 text-[15px] text-white">
                  {{ item.changed_fields.length ? item.changed_fields.join(", ") : "—" }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="mt-4 rounded-[20px] bg-[#363636] px-6 py-10 text-center text-[15px] text-[#bdbdbd]">
          Аудит по строкам отсутствует.
        </div>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useHead, useRoute, useRouter } from "#imports";
import {
  useProductImport,
  type ImportAuditRow,
  type ImportDryRunSummary,
  type ImportPreviewItem,
  type ImportPreviewResult,
  type ImportSession,
} from "~/composables/useProductImport";

const route = useRoute();
const router = useRouter();
const {
  getImportSession,
  getImportPreview,
  getImportItems,
  commitImportSession,
  cancelImportSession,
} = useProductImport();

const emptyPreview = (): ImportPreviewResult => ({
  items: [],
  count: 0,
  total_measurement_value: 0,
  total_supply_price: 0,
  total_retail_price: 0,
  fields: [],
  dry_run_summary: null,
});

const fieldLabels: Record<string, string> = {
  name: "Название",
  brand: "Бренд",
  category: "Категория",
  description: "Описание",
  measurementUnit: "Единица измерения",
  measurement_unit: "Единица измерения",
  supplier: "Поставщик",
};

const importId = computed(() => String(route.params.id ?? ""));
const session = ref<ImportSession | null>(null);
const preview = ref<ImportPreviewResult>(emptyPreview());
const loading = ref(true);
const previewLoading = ref(false);
const toast = useToast();
const actionLoading = ref(false);
const error = ref("");
const actionMessage = ref("");
const differenceOnly = ref(false);
const commitRequested = ref(false);

const resolvedImportId = computed(() => session.value?.id || importId.value);
const currentPage = computed(() => {
  const page = Number(route.query.page ?? 1);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
});
const currentLimit = computed(() => {
  const limit = Number(route.query.limit ?? 5);
  return Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 5;
});
const tableRows = computed<ImportPreviewItem[]>(() => preview.value.items);
const dryRunSummary = computed<ImportDryRunSummary | null>(
  () => session.value?.dry_run_summary ?? preview.value.dry_run_summary ?? null,
);
const auditRows = computed<ImportAuditRow[]>(() => session.value?.result?.audit_rows ?? []);
const isTableStage = computed(
  () => session.value?.status === "draft" || session.value?.status === "preview_ready",
);
const modeLabel = computed(() =>
  session.value?.mode === "without_check" ? "Без проверки" : "С проверкой",
);
const canCommit = computed(
  () =>
    session.value?.status === "preview_ready" ||
    (session.value?.mode === "without_check" && session.value?.status === "draft"),
);
const canCancel = computed(
  () => session.value?.status === "draft" || session.value?.status === "preview_ready",
);
const commitBlocked = computed(
  () =>
    commitRequested.value ||
    session.value?.status === "completed" ||
    session.value?.status === "importing",
);
const showDifferenceToggle = computed(
  () => isTableStage.value && session.value?.mode === "with_check",
);
const resultErrors = computed(() => session.value?.result?.errors ?? []);

const summaryStats = computed(() => {
  if (!session.value) return [];

  if (isTableStage.value) {
    return [
      { label: "Строк", value: `${session.value.rows_count || preview.value.count || tableRows.value.length}` },
      { label: "Создастся", value: `${dryRunSummary.value?.create_count ?? 0}` },
      { label: "Обновится", value: `${dryRunSummary.value?.update_count ?? 0}` },
      { label: "Ошибок", value: `${dryRunSummary.value?.error_count ?? 0}` },
    ];
  }

  return [
    { label: "Статус", value: statusLabel(session.value.status) },
    { label: "Создано", value: `${session.value.result?.created_count ?? 0}` },
    { label: "Обновлено", value: `${session.value.result?.updated_count ?? 0}` },
    { label: "Ошибок", value: `${session.value.result?.error_count ?? 0}` },
  ];
});

const sessionMeta = computed(() => {
  if (!session.value) return [];

  return [
    { label: "Статус", value: statusLabel(session.value.status) },
    { label: "Режим", value: modeLabel.value },
    { label: "Company ID", value: session.value.company_id || "—" },
    { label: "Branch code", value: session.value.branch_code || "—" },
    { label: "Строк", value: String(session.value.rows_count || 0) },
    { label: "Создал", value: session.value.created_by || "—" },
    {
      label: "Закоммитил",
      value: session.value.result?.committed_by || "—",
    },
    {
      label: "Время коммита",
      value: session.value.result?.committed_at ? formatDate(session.value.result.committed_at) : "—",
    },
  ];
});

const onMatchEntries = computed(() => {
  if (!session.value) return [];

  return [
    { label: "Название", value: policyLabel(session.value.on_match.name) },
    { label: "Бренд", value: policyLabel(session.value.on_match.brand) },
    { label: "Категория", value: policyLabel(session.value.on_match.category) },
    { label: "Описание", value: policyLabel(session.value.on_match.description) },
    { label: "Единица измерения", value: policyLabel(session.value.on_match.measurementUnit) },
    { label: "Поставщик", value: policyLabel(session.value.on_match.supplier) },
  ];
});

const conflictFieldEntries = computed(() => {
  const source = dryRunSummary.value?.conflict_fields ?? {};
  return Object.entries(source)
    .filter(([, count]) => Number(count) > 0)
    .map(([field, count]) => ({
      field,
      label: fieldLabels[field] || field,
      count: Number(count),
    }))
    .sort((a, b) => b.count - a.count);
});

function statusLabel(status: string) {
  switch (status) {
    case "draft":
      return "Черновик";
    case "validating":
      return "Проверяется";
    case "preview_ready":
      return "Готов к проверке";
    case "importing":
      return "Коммит выполняется";
    case "completed":
      return "Завершен";
    case "cancelled":
      return "Отменен";
    case "failed":
      return "Ошибка";
    default:
      return status || "—";
  }
}

function policyLabel(value: string) {
  return value === "from_file" ? "Обновить из файла" : "Оставить данные магазина";
}

function previewActionLabel(action: string) {
  switch (action) {
    case "create":
      return "Создание";
    case "update":
      return "Обновление";
    case "error":
      return "Ошибка";
    default:
      return action || "—";
  }
}

function commitActionLabel(action: string) {
  switch (action) {
    case "created":
    case "create":
      return "Создан";
    case "updated":
    case "update":
      return "Обновлен";
    case "error":
      return "Ошибка";
    default:
      return action || "—";
  }
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

function buildFallbackPreviewItems(sessionValue: ImportSession): ImportPreviewItem[] {
  if (sessionValue.preview_items.length) {
    return sessionValue.preview_items;
  }

  return sessionValue.rows.map((row, index) => ({
    id: `${sessionValue.id}-${index + 1}`,
    import_id: sessionValue.id,
    row_number: index + 1,
    product_id: null,
    product_name: row.name || "",
    product_base_name: row.name || "",
    product_sku: row.article || "",
    product_barcode: row.barcode || "",
    description: row.description || "",
    measurement_value: Number(row.quantity || 0),
    supply_price: Number(row.supplyPrice || 0),
    retail_price: Number(row.retailPrice || 0),
    supply_currency: "",
    retail_currency: "",
    measurement_type: row.unit || "",
    product_info: null,
    free_price: false,
    action: "create",
    difference: false,
    different_fields: [],
    old_product: null,
    error: undefined,
    raw: {
      name: row.name || "",
      sku: row.article || "",
      barcode: row.barcode || "",
      quantity: Number(row.quantity || 0),
      supplyPrice: Number(row.supplyPrice || 0),
      retailPrice: Number(row.retailPrice || 0),
      categoryName: row.category || undefined,
      brandName: row.brand || undefined,
      measurementUnit: row.unit || undefined,
      supplier: row.supplier || undefined,
      description: row.description || undefined,
    },
  }));
}

async function loadTableRows() {
  if (!session.value || !isTableStage.value) {
    preview.value = emptyPreview();
    return;
  }

  if (!String(session.value.shop_id || "").trim()) {
    const fallbackItems = buildFallbackPreviewItems(session.value);
    preview.value = {
      items: fallbackItems,
      count: session.value.rows_count || fallbackItems.length,
      total_measurement_value: fallbackItems.reduce((sum, item) => sum + item.measurement_value, 0),
      total_supply_price: fallbackItems.reduce(
        (sum, item) => sum + item.supply_price * item.measurement_value,
        0,
      ),
      total_retail_price: fallbackItems.reduce(
        (sum, item) => sum + item.retail_price * item.measurement_value,
        0,
      ),
      fields: [],
      dry_run_summary: null,
    };
    actionMessage.value = "Импорт загружен без shop_id. Показываем строки из import session без server preview.";
    return;
  }

  previewLoading.value = true;

  try {
    const previewResult = await getImportPreview(resolvedImportId.value, {
      page: currentPage.value,
      limit: currentLimit.value,
      difference: showDifferenceToggle.value ? differenceOnly.value : false,
    });

    if (previewResult.items.length || previewResult.count > 0 || previewResult.dry_run_summary) {
      preview.value = previewResult;
      return;
    }

    preview.value = await getImportItems(resolvedImportId.value, {
      page: currentPage.value,
      limit: currentLimit.value,
    });
  } catch (previewError) {
    if (session.value.mode !== "without_check") {
      throw previewError;
    }

    preview.value = await getImportItems(resolvedImportId.value, {
      page: currentPage.value,
      limit: currentLimit.value,
    });
  } finally {
    previewLoading.value = false;
  }
}

async function loadSession() {
  loading.value = true;
  error.value = "";

  try {
    session.value = await getImportSession(importId.value);
    commitRequested.value = session.value.status === "completed" || session.value.status === "importing";
    await loadTableRows();
  } catch (err: any) {
    error.value = err?.message || "Не удалось загрузить импорт.";
    session.value = null;
    preview.value = emptyPreview();
  } finally {
    loading.value = false;
  }
}

async function toggleDifference() {
  differenceOnly.value = !differenceOnly.value;
  await loadTableRows();
}

async function commitImport() {
  if (!session.value || commitBlocked.value) return;

  actionLoading.value = true;
  error.value = "";
  actionMessage.value = "";
  commitRequested.value = true;

  try {
    const response = await commitImportSession(resolvedImportId.value);
    await loadSession();
    actionMessage.value = response.idempotent
      ? "Этот импорт уже был завершен ранее. Показываем сохраненный результат коммита."
      : "Импорт успешно закоммичен.";
  } catch (err: any) {
    const message = String(err?.message || "Не удалось подтвердить импорт.");
    if (message.toLowerCase().includes("already in progress")) {
      actionMessage.value = "Коммит уже выполняется на сервере. Повторный сабмит заблокирован.";
      if (session.value) {
        session.value = { ...session.value, status: "importing" };
      }
      return;
    }

    commitRequested.value = false;
    toast.add({ title: "Импорт отменен", color: "success" });
    error.value = message;
    toast.add({ title: "Не удалось подтвердить импорт", description: message, color: "error" });
  } finally {
    actionLoading.value = false;
  }
}

async function cancelImport() {
  if (!session.value) return;

  actionLoading.value = true;
  error.value = "";
  actionMessage.value = "";

  try {
    session.value = await cancelImportSession(resolvedImportId.value);
    preview.value = emptyPreview();
    commitRequested.value = false;
    toast.add({ title: "Импорт отменен", color: "success" });
  } catch (err: any) {
    error.value = err?.message || "Не удалось отменить импорт.";
  } finally {
    actionLoading.value = false;
  }
}

function goBack() {
  router.push("/products/import");
}

onMounted(async () => {
  await loadSession();
});

useHead({
  title: computed(() => (session.value ? `${session.value.name} | Импорт` : "Импорт")),
});
</script>

