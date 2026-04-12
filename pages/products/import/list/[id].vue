<template>
  <section v-if="loading" class="rounded-[28px] bg-[#2b2b2b] p-8 text-white">
    Загружаем импорт...
  </section>

  <section v-else-if="error" class="rounded-[28px] border border-[#7f3d3d] bg-[#442f2f] p-8 text-white">
    <h1 class="text-[28px] font-bold">Не удалось загрузить импорт</h1>
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
          {{ isPreviewStage ? "Preview" : "Результат" }}
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
          v-if="canCommit"
          type="button"
          class="cursor-pointer rounded-[16px] bg-[#1f78ff] px-5 py-4 text-[15px] font-bold text-white transition-colors duration-200 hover:bg-[#2a6ed9] disabled:cursor-not-allowed disabled:bg-[#3764a8]"
          :disabled="actionLoading"
          @click="commitImport"
        >
          {{ actionLoading ? "Загружаем..." : "Загрузить" }}
        </button>
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div v-for="stat in summaryStats" :key="stat.label" class="rounded-[24px] bg-[#2b2b2b] p-5">
        <p class="text-[13px] font-bold text-[#a7a7a7]">{{ stat.label }}</p>
        <p class="mt-3 text-[28px] font-bold text-white">{{ stat.value }}</p>
      </div>
    </div>

    <section v-if="resultErrors.length" class="rounded-[28px] border border-[#7f3d3d] bg-[#442f2f] p-6 text-white">
      <div class="flex items-center gap-2">
        <Icon
          name="heroicons:exclamation-circle-20-solid"
          class="h-5 w-5 text-[#ff8c8c]"
        />
        <p class="text-[16px] font-bold">Ошибки backend</p>
      </div>

      <ul class="mt-4 space-y-2 text-[14px] text-[#ffd7d7]">
        <li v-for="(item, index) in resultErrors" :key="`${item.row}-${index}`">
          {{ item.row ? `Строка ${item.row}: ` : "" }}{{ item.message }}
        </li>
      </ul>
    </section>

    <section v-if="isPreviewStage" class="rounded-[28px] bg-[#2b2b2b] p-6">
      <div class="mb-4 flex items-center justify-between">
        <div>
          <p class="text-[12px] font-bold uppercase tracking-[0.22em] text-[#7ba9d8]">
            Preview строк
          </p>
          <h2 class="mt-2 text-[24px] font-bold text-white">Create / update и отличия</h2>
        </div>

        <button
          type="button"
          class="cursor-pointer rounded-[16px] bg-[#404040] px-4 py-3 text-[14px] font-bold text-white transition-colors duration-200 hover:bg-[#4b4b4b] disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="previewLoading"
          @click="toggleDifference"
        >
          {{ differenceOnly ? "Показать все строки" : "Только отличия" }}
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full border-separate border-spacing-y-2 text-left">
          <thead>
            <tr class="text-[13px] uppercase tracking-[0.12em] text-[#8f8f8f]">
              <th class="px-4 py-3">Наименование</th>
              <th class="px-4 py-3">SKU</th>
              <th class="px-4 py-3">Barcode</th>
              <th class="px-4 py-3">Количество</th>
              <th class="px-4 py-3">Цена поставки</th>
              <th class="px-4 py-3">Цена продажи</th>
              <th class="px-4 py-3">Режим</th>
              <th class="px-4 py-3">Поля</th>
              <th class="px-4 py-3">Старый товар</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="item in preview.items" :key="item.id">
              <td class="rounded-l-[18px] bg-[#363636] px-4 py-4 text-[15px] font-bold text-white">
                {{ item.product_name || "—" }}
              </td>
              <td class="bg-[#363636] px-4 py-4 text-[15px] text-white">{{ item.product_sku || "—" }}</td>
              <td class="bg-[#363636] px-4 py-4 text-[15px] text-white">{{ item.product_barcode || "—" }}</td>
              <td class="bg-[#363636] px-4 py-4 text-[15px] text-white">{{ item.measurement_value }}</td>
              <td class="bg-[#363636] px-4 py-4 text-[15px] text-white">{{ formatMoney(item.supply_price) }}</td>
              <td class="bg-[#363636] px-4 py-4 text-[15px] text-white">{{ formatMoney(item.retail_price) }}</td>
              <td class="bg-[#363636] px-4 py-4 text-[15px] text-white">{{ item.product_id ? "update" : "create" }}</td>
              <td class="bg-[#363636] px-4 py-4 text-[15px] text-white">
                {{ item.different_fields.length ? item.different_fields.join(", ") : "—" }}
              </td>
              <td class="rounded-r-[18px] bg-[#363636] px-4 py-4 text-[15px] text-white">
                {{ formatOldProduct(item.old_product) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-else class="rounded-[28px] bg-[#2b2b2b] p-6">
      <p class="text-[12px] font-bold uppercase tracking-[0.22em] text-[#7ba9d8]">
        Итог
      </p>
      <h2 class="mt-2 text-[24px] font-bold text-white">Сводка импорта</h2>
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
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useHead, useRoute, useRouter } from "#imports";
import {
  useProductImport,
  type ImportPreviewResult,
  type ImportSession,
} from "~/composables/useProductImport";

const route = useRoute();
const router = useRouter();
const {
  getImportSession,
  getImportPreview,
  commitImportSession,
  cancelImportSession,
} = useProductImport();

const importId = computed(() => String(route.params.id ?? ""));
const session = ref<ImportSession | null>(null);
const preview = ref<ImportPreviewResult>({
  items: [],
  count: 0,
  total_measurement_value: 0,
  total_supply_price: 0,
  total_retail_price: 0,
  fields: [],
});
const loading = ref(true);
const previewLoading = ref(false);
const actionLoading = ref(false);
const error = ref("");
const differenceOnly = ref(false);

const isPreviewStage = computed(() => session.value?.status === "preview_ready");
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
const resultErrors = computed(() => session.value?.result?.errors ?? []);

const summaryStats = computed(() => {
  if (!session.value) return [];

  if (isPreviewStage.value) {
    return [
      { label: "Строк", value: `${preview.value.count}` },
      { label: "Количество", value: `${preview.value.total_measurement_value}` },
      { label: "Сумма поставки", value: formatMoney(preview.value.total_supply_price) },
      { label: "Сумма продажи", value: formatMoney(preview.value.total_retail_price) },
    ];
  }

  return [
    { label: "Статус", value: statusLabel(session.value.status) },
    { label: "Режим", value: modeLabel.value },
    { label: "Создано", value: `${session.value.result?.created_count ?? 0}` },
    { label: "Обновлено", value: `${session.value.result?.updated_count ?? 0}` },
  ];
});

function statusLabel(status: string) {
  switch (status) {
    case "draft":
      return "Черновик";
    case "validating":
      return "Проверяется";
    case "preview_ready":
      return "Preview готов";
    case "importing":
      return "Импортируется";
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

function formatMoney(value: number) {
  return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value)} UZS`;
}

function formatOldProduct(oldProduct: Record<string, unknown> | null) {
  if (!oldProduct) return "—";

  const name = String(oldProduct.name ?? "");
  const sku = String(oldProduct.sku ?? "");
  const barcode = String(oldProduct.barcode ?? "");
  return [name, sku, barcode].filter(Boolean).join(" • ") || "—";
}

async function loadPreview() {
  if (!session.value || session.value.status !== "preview_ready") {
    preview.value = {
      items: [],
      count: 0,
      total_measurement_value: 0,
      total_supply_price: 0,
      total_retail_price: 0,
      fields: [],
    };
    return;
  }

  previewLoading.value = true;
  try {
    preview.value = await getImportPreview(session.value.id, {
      page: 1,
      limit: 10000,
      difference: differenceOnly.value,
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
    await loadPreview();
  } catch (err: any) {
    error.value = err?.message || "Не удалось загрузить импорт.";
    session.value = null;
  } finally {
    loading.value = false;
  }
}

async function toggleDifference() {
  differenceOnly.value = !differenceOnly.value;
  await loadPreview();
}

async function commitImport() {
  if (!session.value) return;

  actionLoading.value = true;
  error.value = "";

  try {
    await commitImportSession(session.value.id);
    await loadSession();
  } catch (err: any) {
    error.value = err?.message || "Не удалось подтвердить импорт.";
  } finally {
    actionLoading.value = false;
  }
}

async function cancelImport() {
  if (!session.value) return;

  actionLoading.value = true;
  error.value = "";

  try {
    session.value = await cancelImportSession(session.value.id);
    preview.value.items = [];
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
  title: computed(() =>
    session.value ? `${session.value.name} | Импорт` : "Импорт",
  ),
});
</script>
