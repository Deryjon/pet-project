<template>
  <section v-if="loading" class="rounded-[28px] bg-[#2b2b2b] p-8 text-white">Загружаем импорт...</section>
  <section v-else-if="error" class="rounded-[28px] border border-[#7f3d3d] bg-[#442f2f] p-8 text-white">
    <button type="button" class="rounded-[14px] bg-[#5a3838] px-4 py-3 text-[14px] font-bold" @click="goBack">Назад к импортам</button>
    <h1 class="mt-5 text-[28px] font-bold">Не удалось загрузить импорт</h1>
    <p class="mt-3 text-[#ffd7d7]">{{ error }}</p>
  </section>
  <section v-else-if="session" class="space-y-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <button type="button" class="rounded-[14px] bg-[#363636] px-4 py-3 text-[14px] font-bold text-white" @click="goBack">Назад к импортам</button>
        <p class="mt-5 text-[12px] font-bold uppercase tracking-[0.24em] text-[#7ba9d8]">{{ isTableStage ? "Предпросмотр" : "Результат импорта" }}</p>
        <h1 class="mt-2 text-[34px] font-bold text-white">{{ session.name }}</h1>
        <p class="mt-2 text-[15px] text-[#bdbdbd]">{{ modeLabel }} • {{ session.shop_name || session.shop_id || "—" }} • {{ formatDate(session.created_at) }}</p>
      </div>

      <div class="flex flex-wrap gap-3">
        <button v-if="canCancel" type="button" class="rounded-[16px] bg-[#4a3030] px-5 py-4 text-[15px] font-bold text-white" :disabled="actionLoading" @click="cancelImport">Отменить</button>
        <button v-if="showConflictButton" type="button" class="rounded-[16px] bg-[#8a6a21] px-5 py-4 text-[15px] font-bold text-white" :disabled="actionLoading" @click="conflictWizardOpen = true">Решить конфликты</button>
        <button v-if="canAcceptWithoutCheck" type="button" class="rounded-[16px] bg-[#1f78ff] px-5 py-4 text-[15px] font-bold text-white disabled:bg-[#3764a8]" :disabled="fastImportDisabled" @click="acceptWithoutCheck">Принять без проверки</button>
        <button v-if="canCommit" type="button" class="rounded-[16px] bg-[#1f78ff] px-5 py-4 text-[15px] font-bold text-white disabled:bg-[#3764a8]" :disabled="commitDisabled" @click="confirmImport">Подтвердить импорт</button>
      </div>
    </div>

    <section v-if="blockingErrorCount && isTableStage" class="rounded-[24px] border border-[#8a3939] bg-[#4a2727] p-5 text-white">
      Импорт нельзя подтвердить, пока не исправлены ошибки.
    </section>
    <section v-if="actionMessage" class="rounded-[24px] border border-[#37516f] bg-[#24384f] p-5 text-white">{{ actionMessage }}</section>
    <section v-if="runtimeErrorMessage" class="rounded-[24px] border border-[#8a3939] bg-[#4a2727] p-5 text-white">{{ runtimeErrorMessage }}</section>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div v-for="card in summaryCards" :key="card.label" class="rounded-[24px] p-5" :class="card.tone">
        <p class="text-[13px] font-bold text-white/70">{{ card.label }}</p>
        <p class="mt-3 text-[28px] font-bold text-white">{{ card.value }}</p>
      </div>
    </div>

    <section v-if="isTableStage" class="grid gap-4 xl:grid-cols-[1fr_360px]">
      <div class="rounded-[28px] bg-[#2b2b2b] p-6">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p class="text-[12px] font-bold uppercase tracking-[0.22em] text-[#7ba9d8]">Строки</p>
            <h2 class="mt-2 text-[24px] font-bold text-white">Предпросмотр импорта</h2>
            <p class="mt-2 text-[14px] text-[#bdbdbd]">{{ filteredRows.length }} из {{ tableRows.length }} строк</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button v-for="filter in filters" :key="filter.value" type="button" class="rounded-[14px] px-4 py-3 text-[13px] font-bold" :class="activeFilter === filter.value ? 'bg-[#1f78ff] text-white' : 'bg-[#363636] text-[#bdbdbd]'" @click="activeFilter = filter.value">{{ filter.label }}</button>
          </div>
        </div>

        <div v-if="previewLoading" class="mt-4 text-[14px] text-[#bdbdbd]">Обновляем таблицу...</div>
        <div v-if="filteredRows.length" class="mt-5 overflow-x-auto">
          <table class="min-w-[1600px] w-full border-separate border-spacing-y-2 text-left">
            <thead>
              <tr class="text-[13px] uppercase tracking-[0.12em] text-[#8f8f8f]">
                <th class="px-4 py-3">№</th><th class="px-4 py-3">Статус</th><th class="px-4 py-3">Название</th><th class="px-4 py-3">SKU</th><th class="px-4 py-3">Barcode</th><th class="px-4 py-3">Кол-во</th><th class="px-4 py-3">Закупка</th><th class="px-4 py-3">Продажа</th><th class="px-4 py-3">Категория</th><th class="px-4 py-3">Бренд</th><th class="px-4 py-3">Ед. изм.</th><th class="px-4 py-3">Поставщик</th><th class="px-4 py-3">Описание</th><th class="px-4 py-3">Конфликты</th><th class="px-4 py-3">Ошибки</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in filteredRows" :key="item.id">
                <td class="rounded-l-[18px] px-4 py-4 text-white" :class="item.rowTone">{{ item.row_number || "—" }}</td>
                <td class="px-4 py-4" :class="item.rowTone"><span class="rounded-[12px] px-3 py-2 text-[12px] font-bold" :class="item.statusClass">{{ item.statusLabel }}</span></td>
                <td class="px-4 py-4 font-bold text-white" :class="item.rowTone">{{ item.product_name || item.raw.name || "—" }}</td>
                <td class="px-4 py-4 text-white" :class="item.rowTone">{{ item.product_sku || item.raw.sku || "—" }}</td>
                <td class="px-4 py-4 text-white" :class="item.rowTone">{{ item.product_barcode || item.raw.barcode || "—" }}</td>
                <td class="px-4 py-4 text-white" :class="item.rowTone">{{ item.measurement_value }}</td>
                <td class="px-4 py-4 text-white" :class="item.rowTone">{{ formatMoney(item.supply_price) }}</td>
                <td class="px-4 py-4 text-white" :class="item.rowTone">{{ formatMoney(item.retail_price) }}</td>
                <td class="px-4 py-4 text-white" :class="item.rowTone">{{ item.raw.categoryName || "—" }}</td>
                <td class="px-4 py-4 text-white" :class="item.rowTone">{{ item.raw.brandName || "—" }}</td>
                <td class="px-4 py-4 text-white" :class="item.rowTone">{{ item.raw.measurementUnit || item.measurement_type || "—" }}</td>
                <td class="px-4 py-4 text-white" :class="item.rowTone">{{ item.raw.supplier || "—" }}</td>
                <td class="max-w-[240px] px-4 py-4 text-white" :class="item.rowTone">{{ item.raw.description || item.description || "—" }}</td>
                <td class="px-4 py-4 text-[13px] text-white" :class="item.rowTone">{{ item.different_fields.length ? item.different_fields.map(formatFieldLabel).join(', ') : '—' }}</td>
                <td class="rounded-r-[18px] px-4 py-4 text-[13px] text-white" :class="item.rowTone">
                  <div v-if="item.validation_issues.length" class="space-y-1"><p v-for="issue in item.validation_issues" :key="`${item.id}-${issue.code}-${issue.field}`">{{ issue.message }}</p></div>
                  <span v-else>{{ item.error || "—" }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="mt-5 rounded-[20px] bg-[#363636] px-6 py-10 text-center text-[15px] text-[#bdbdbd]">Строки для выбранного фильтра не найдены.</div>
      </div>

      <div class="rounded-[28px] bg-[#2b2b2b] p-6">
        <p class="text-[12px] font-bold uppercase tracking-[0.22em] text-[#7ba9d8]">Сводка</p>
        <h2 class="mt-2 text-[24px] font-bold text-white">Конфликты и решения</h2>
        <div class="mt-4 space-y-3">
          <div v-for="item in conflictEntries" :key="item.field" class="rounded-[18px] bg-[#363636] px-4 py-4">
            <div class="flex items-center justify-between gap-3">
              <span class="text-[14px] font-bold text-white">{{ item.label }}</span>
              <span class="rounded-[12px] px-3 py-2 text-[12px] font-bold" :class="conflictSelections[item.field] ? 'bg-[#1f5f3a] text-[#d8ffe7]' : 'bg-[#5b4a1f] text-[#ffe9bf]'">{{ conflictSelections[item.field] ? policyLabel(conflictSelections[item.field]!) : "Требует выбора" }}</span>
            </div>
            <p class="mt-2 text-[13px] text-[#bdbdbd]">Затронуто строк: {{ item.count }}</p>
          </div>
          <div v-if="!conflictEntries.length" class="rounded-[18px] bg-[#363636] px-4 py-4 text-[14px] text-[#bdbdbd]">Конфликтов не найдено.</div>
        </div>
      </div>
    </section>

    <section v-else class="rounded-[28px] bg-[#2b2b2b] p-6">
      <p class="text-[12px] font-bold uppercase tracking-[0.22em] text-[#7ba9d8]">Commit</p>
      <h2 class="mt-2 text-[24px] font-bold text-white">Итоги импорта</h2>
      <div class="mt-4 grid gap-4 md:grid-cols-3">
        <div class="rounded-[18px] bg-[#363636] px-4 py-4"><p class="text-[#a7a7a7]">Создано</p><p class="mt-1 text-[24px] font-bold text-white">{{ session.result?.created_count ?? 0 }}</p></div>
        <div class="rounded-[18px] bg-[#363636] px-4 py-4"><p class="text-[#a7a7a7]">Обновлено</p><p class="mt-1 text-[24px] font-bold text-white">{{ session.result?.updated_count ?? 0 }}</p></div>
        <div class="rounded-[18px] bg-[#363636] px-4 py-4"><p class="text-[#a7a7a7]">Ошибок</p><p class="mt-1 text-[24px] font-bold text-white">{{ session.result?.error_count ?? 0 }}</p></div>
      </div>
      <div v-if="resultErrors.length" class="mt-5 rounded-[20px] border border-[#7f3d3d] bg-[#442f2f] p-5 text-[#ffd7d7]">
        <p v-for="(item, index) in resultErrors" :key="`${item.row}-${index}`">{{ item.row ? `Строка ${item.row}: ` : "" }}{{ item.message }}</p>
      </div>
    </section>

    <AppSlideover :open="conflictWizardOpen" @update:open="conflictWizardOpen = $event" maxWidthClass="max-w-[720px]" panelClass="bg-[#1f1f1f] p-5 text-white sm:p-6" overlayClass="bg-black/50 backdrop-blur-sm">
      <div class="space-y-6">
        <div class="flex items-start justify-between gap-4">
          <div><h3 class="text-[24px] font-semibold">Разрешение конфликтов</h3><p class="mt-1 text-sm text-[#9f9f9f]">Выберите источник значений для конфликтующих полей.</p></div>
          <UButton color="neutral" variant="ghost" class="rounded-full text-[#bdbdbd]" @click="conflictWizardOpen = false"><Icon name="mingcute:close-fill" class="h-5 w-5" /></UButton>
        </div>

        <div v-for="entry in conflictDetails" :key="entry.field" class="rounded-[18px] bg-[#303030] p-4">
          <div class="flex items-center justify-between gap-3"><p class="font-bold text-white">{{ entry.label }}</p><span class="text-[12px] text-[#9f9f9f]">Строк: {{ entry.count }}</span></div>
          <div class="mt-3 grid gap-3 sm:grid-cols-2">
            <div class="rounded-[16px] bg-[#262626] px-4 py-3"><div class="text-xs uppercase tracking-[0.12em] text-[#8f8f8f]">Из файла</div><div class="mt-2 text-[15px] font-semibold text-white">{{ entry.fileValue }}</div></div>
            <div class="rounded-[16px] bg-[#262626] px-4 py-3"><div class="text-xs uppercase tracking-[0.12em] text-[#8f8f8f]">В магазине</div><div class="mt-2 text-[15px] font-semibold text-white">{{ entry.storeValue }}</div></div>
          </div>
          <div class="mt-3 flex flex-col gap-2 sm:flex-row">
            <button type="button" class="rounded-[14px] px-4 py-3 text-sm font-semibold" :class="conflictSelections[entry.field] === 'from_file' ? 'bg-[#1f78ff] text-white' : 'bg-[#404040] text-white'" @click="setConflict(entry.field, 'from_file')">Принять из файла</button>
            <button type="button" class="rounded-[14px] px-4 py-3 text-sm font-semibold" :class="conflictSelections[entry.field] === 'keep_store' ? 'bg-[#1f78ff] text-white' : 'bg-[#404040] text-white'" @click="setConflict(entry.field, 'keep_store')">Оставить как в магазине</button>
          </div>
        </div>
      </div>
    </AppSlideover>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { navigateTo, useHead, useRoute, useRouter } from "#imports";
import { useProductImport, type ImportMatchPolicy, type ImportOnMatchPolicy, type ImportPreviewItem, type ImportPreviewResult, type ImportSession } from "~/composables/useProductImport";

type RowStatus = "error" | "conflict" | "create" | "update";
type TableFilter = "all" | "errors" | "conflicts" | "create" | "update";
type ConflictField = "name" | "brand" | "category" | "description" | "measurement_unit" | "supplier" | "supply_price" | "retail_price";
type DecoratedRow = ImportPreviewItem & { rowStatus: RowStatus; statusLabel: string; statusClass: string; rowTone: string };

const fieldLabels: Record<string, string> = { name: "Название", brand: "Бренд", category: "Категория", description: "Описание", measurement_unit: "Единица измерения", supplier: "Поставщик", supply_price: "Закупочная цена", retail_price: "Цена продажи" };
const filters: Array<{ label: string; value: TableFilter }> = [{ label: "Все", value: "all" }, { label: "С ошибками", value: "errors" }, { label: "С конфликтами", value: "conflicts" }, { label: "Новые", value: "create" }, { label: "Обновляемые", value: "update" }];
const conflictFieldOrder: ConflictField[] = ["supply_price", "retail_price", "name", "brand", "category", "measurement_unit", "supplier", "description"];

const route = useRoute();
const router = useRouter();
const { getImportSession, getImportPreview, getImportItems, commitImportSession, cancelImportSession, importWithoutCheck, defaultOnMatchPolicy } = useProductImport();
const toast = useToast();

const loading = ref(true);
const previewLoading = ref(false);
const actionLoading = ref(false);
const error = ref("");
const actionMessage = ref("");
const runtimeErrorMessage = ref("");
const session = ref<ImportSession | null>(null);
const preview = ref<ImportPreviewResult>({ items: [], count: 0, total_measurement_value: 0, total_supply_price: 0, total_retail_price: 0, fields: [], dry_run_summary: null });
const activeFilter = ref<TableFilter>("all");
const conflictWizardOpen = ref(false);
const conflictSelections = ref<Partial<Record<ConflictField, ImportMatchPolicy | null>>>({});

const resolvedImportId = computed(() => session.value?.id || String(route.params.id ?? ""));
const currentLimit = computed(() => {
  const limit = Number(route.query.limit ?? 1000);
  return Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 1000;
});
const isTableStage = computed(() => session.value?.status === "draft" || session.value?.status === "preview_ready");
const modeLabel = computed(() => session.value?.mode === "without_check" ? "Без проверки" : "С проверкой");
const canCancel = computed(() => session.value?.status === "draft" || session.value?.status === "preview_ready");
const canCommit = computed(() => isTableStage.value && session.value?.mode === "with_check");
const canAcceptWithoutCheck = computed(() => isTableStage.value && session.value?.mode === "without_check");

const tableRows = computed<DecoratedRow[]>(() => preview.value.items.map((item) => decorateRow(item)));
const blockingErrorCount = computed(() => preview.value.dry_run_summary?.blocking_error_count || tableRows.value.filter((item) => item.rowStatus === "error").length);
const conflictedCount = computed(() => preview.value.dry_run_summary?.conflicted_count || tableRows.value.filter((item) => item.rowStatus === "conflict").length);
const showConflictButton = computed(() => canCommit.value && conflictEntries.value.length > 0);
const unresolvedConflicts = computed(() => conflictEntries.value.map((item) => item.field).filter((field) => !conflictSelections.value[field]));
const commitDisabled = computed(() => actionLoading.value || blockingErrorCount.value > 0 || unresolvedConflicts.value.length > 0);
const fastImportDisabled = computed(() => actionLoading.value || blockingErrorCount.value > 0);
const resultErrors = computed(() => session.value?.result?.errors ?? []);

const summaryCards = computed(() => [
  { label: "Новые товары", value: String(preview.value.dry_run_summary?.create_count ?? tableRows.value.filter((item) => item.rowStatus === "create").length), tone: "bg-[#203b2b]" },
  { label: "Обновляемые товары", value: String(preview.value.dry_run_summary?.update_count ?? tableRows.value.filter((item) => item.rowStatus === "update").length), tone: "bg-[#24384f]" },
  { label: "Строки с ошибками", value: String(blockingErrorCount.value), tone: "bg-[#4a2727]" },
  { label: "Строки с конфликтами", value: String(conflictedCount.value), tone: "bg-[#5b4a1f]" },
]);

const conflictEntries = computed(() => {
  const counts = new Map<ConflictField, number>();
  for (const row of tableRows.value) {
    for (const field of row.different_fields) {
      if (field in fieldLabels) counts.set(field as ConflictField, (counts.get(field as ConflictField) ?? 0) + 1);
    }
  }
  return conflictFieldOrder.filter((field) => counts.has(field)).map((field) => ({ field, label: formatFieldLabel(field), count: counts.get(field) ?? 0 }));
});

const conflictDetails = computed(() => conflictEntries.value.map((entry) => {
  const sample = tableRows.value.find((row) => row.different_fields.includes(entry.field));
  return { ...entry, fileValue: sample ? getFieldDisplay(sample, entry.field, "file") : "—", storeValue: sample ? getFieldDisplay(sample, entry.field, "store") : "—" };
}));

const filteredRows = computed(() => {
  if (activeFilter.value === "errors") return tableRows.value.filter((item) => item.rowStatus === "error");
  if (activeFilter.value === "conflicts") return tableRows.value.filter((item) => item.rowStatus === "conflict");
  if (activeFilter.value === "create") return tableRows.value.filter((item) => item.rowStatus === "create");
  if (activeFilter.value === "update") return tableRows.value.filter((item) => item.rowStatus === "update");
  return tableRows.value;
});

const finalOnMatch = computed<ImportOnMatchPolicy>(() => ({
  ...defaultOnMatchPolicy,
  ...(session.value?.on_match ?? {}),
  ...Object.fromEntries(Object.entries(conflictSelections.value).filter(([, value]) => Boolean(value))),
}));

function decorateRow(item: ImportPreviewItem): DecoratedRow {
  const hasIssues = item.validation_issues.length > 0 || item.action === "error" || Boolean(item.error);
  const rowStatus: RowStatus = hasIssues ? "error" : item.difference ? "conflict" : item.action === "create" ? "create" : "update";
  const map = {
    error: { statusLabel: "Ошибка", statusClass: "bg-[#6b2d31] text-[#ffd9dc]", rowTone: "bg-[#3f2b2b]" },
    conflict: { statusLabel: "Конфликт", statusClass: "bg-[#5b4a1f] text-[#ffe9bf]", rowTone: "bg-[#403726]" },
    create: { statusLabel: "Новый товар", statusClass: "bg-[#1f5f3a] text-[#d8ffe7]", rowTone: "bg-[#273a2f]" },
    update: { statusLabel: "Обновление товара", statusClass: "bg-[#37516f] text-[#d9ebff]", rowTone: "bg-[#2b3643]" },
  }[rowStatus];
  return { ...item, rowStatus, ...map };
}

function formatFieldLabel(field: string) { return fieldLabels[field] || field; }
function policyLabel(value: ImportMatchPolicy) { return value === "from_file" ? "Принять из файла" : "Оставить как в магазине"; }
function formatMoney(value: number) { return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Number(value || 0))} UZS`; }
function formatDate(value: string) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return value || "—";
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

function getFieldDisplay(item: ImportPreviewItem, field: ConflictField, source: "file" | "store") {
  const raw = item.raw;
  const oldProduct = item.old_product ?? {};
  if (source === "file") {
    if (field === "name") return raw.name || item.product_name || "—";
    if (field === "brand") return raw.brandName || "—";
    if (field === "category") return raw.categoryName || "—";
    if (field === "description") return raw.description || item.description || "—";
    if (field === "measurement_unit") return raw.measurementUnit || item.measurement_type || "—";
    if (field === "supplier") return raw.supplier || "—";
    if (field === "supply_price") return formatMoney(raw.supplyPrice ?? item.supply_price);
    return formatMoney(raw.retailPrice ?? item.retail_price);
  }

  const keys: Record<ConflictField, string[]> = {
    name: ["name", "product_name", "title"],
    brand: ["brand", "brand_name"],
    category: ["category", "category_name"],
    description: ["description"],
    measurement_unit: ["measurement_unit", "measurementUnit", "measurement_type"],
    supplier: ["supplier", "supplier_name"],
    supply_price: ["supply_price", "supplyPrice"],
    retail_price: ["retail_price", "retailPrice"],
  };
  const value = keys[field].map((key) => oldProduct[key]).find((candidate) => candidate != null && String(candidate).trim() !== "");
  return field === "supply_price" || field === "retail_price" ? formatMoney(Number(value ?? 0)) : String(value ?? "—");
}

function setConflict(field: ConflictField, value: ImportMatchPolicy) {
  conflictSelections.value = { ...conflictSelections.value, [field]: value };
}

function syncConflictSelections() {
  const next: Partial<Record<ConflictField, ImportMatchPolicy | null>> = {};
  for (const item of conflictEntries.value) next[item.field] = conflictSelections.value[item.field] ?? null;
  conflictSelections.value = next;
}

function buildFallbackPreviewItems(sessionValue: ImportSession): ImportPreviewItem[] {
  return (sessionValue.preview_items.length ? sessionValue.preview_items : sessionValue.rows.map((row, index) => ({
    id: `${sessionValue.id}-${index + 1}`, import_id: sessionValue.id, row_number: index + 1, product_id: null, product_name: row.name || "", product_base_name: row.name || "", product_sku: row.article || "", product_barcode: row.barcode || "", description: row.description || "", measurement_value: Number(row.quantity || 0), supply_price: Number(row.supplyPrice || 0), retail_price: Number(row.retailPrice || 0), supply_currency: "", retail_currency: "", measurement_type: row.unit || "", product_info: null, free_price: false, action: "create" as const, difference: false, different_fields: [], old_product: null, validation_issues: [], error: undefined, raw: { name: row.name || "", sku: row.article || "", barcode: row.barcode || "", quantity: Number(row.quantity || 0), supplyPrice: Number(row.supplyPrice || 0), retailPrice: Number(row.retailPrice || 0), categoryName: row.category || undefined, brandName: row.brand || undefined, measurementUnit: row.unit || undefined, supplier: row.supplier || undefined, description: row.description || undefined } })));
}

async function loadTableRows() {
  if (!session.value || !isTableStage.value) { preview.value = { items: [], count: 0, total_measurement_value: 0, total_supply_price: 0, total_retail_price: 0, fields: [], dry_run_summary: null }; return; }
  if (!String(session.value.shop_id || "").trim()) { preview.value = { items: buildFallbackPreviewItems(session.value), count: session.value.rows_count || session.value.rows.length, total_measurement_value: 0, total_supply_price: 0, total_retail_price: 0, fields: [], dry_run_summary: null }; syncConflictSelections(); return; }

  previewLoading.value = true;
  try {
    const result = await getImportPreview(resolvedImportId.value, { page: 1, limit: currentLimit.value });
    preview.value = result.items.length || result.count || result.dry_run_summary ? result : await getImportItems(resolvedImportId.value, { page: 1, limit: currentLimit.value });
    syncConflictSelections();
  } finally {
    previewLoading.value = false;
  }
}

async function loadSession() {
  loading.value = true;
  error.value = "";
  try {
    session.value = await getImportSession(String(route.params.id ?? ""));
    await loadTableRows();
  } catch (err: any) {
    error.value = err?.message || "Не удалось загрузить импорт.";
    session.value = null;
  } finally {
    loading.value = false;
  }
}

async function confirmImport() {
  if (!session.value) return;
  if (unresolvedConflicts.value.length) { conflictWizardOpen.value = true; return; }
  actionLoading.value = true;
  actionMessage.value = "";
  runtimeErrorMessage.value = "";
  try {
    await commitImportSession(resolvedImportId.value, { onMatch: finalOnMatch.value });
    await loadSession();
    actionMessage.value = "Импорт успешно подтвержден.";
  } catch (err: any) {
    toast.add({ title: "Не удалось подтвердить импорт", description: String(err?.message || "Ошибка"), color: "error" });
  } finally {
    actionLoading.value = false;
  }
}

async function acceptWithoutCheck() {
  if (!session.value) return;
  actionLoading.value = true;
  runtimeErrorMessage.value = "";
  try {
    const result = await importWithoutCheck({ name: session.value.name, shopId: session.value.shop_id, mode: "without_check", generateBarcodes: false, generateArticles: false, rows: session.value.rows, mappings: [], onMatch: finalOnMatch.value });
    await router.replace(`/products/import/list/${result.id || resolvedImportId.value}?limit=${currentLimit.value}&page=1`);
    await loadSession();
    actionMessage.value = "Импорт завершен.";
  } catch (err: any) {
    runtimeErrorMessage.value = String(err?.message || "Backend отклонил быстрый импорт. Проверьте ошибки и перейдите к режиму с проверкой.");
    await loadTableRows();
  } finally {
    actionLoading.value = false;
  }
}

async function cancelImport() {
  if (!session.value) return;
  actionLoading.value = true;
  try {
    session.value = await cancelImportSession(resolvedImportId.value);
    preview.value = { items: [], count: 0, total_measurement_value: 0, total_supply_price: 0, total_retail_price: 0, fields: [], dry_run_summary: null };
  } finally {
    actionLoading.value = false;
  }
}

function goBack() { return navigateTo("/products/import", { replace: true }); }

onMounted(loadSession);
useHead({ title: computed(() => session.value ? `${session.value.name} | Импорт` : "Импорт") });
</script>
