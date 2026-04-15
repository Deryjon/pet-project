<template>
  <section v-if="loading" class="rounded-[28px] bg-[#2b2b2b] p-8 text-white">
    Загружаем импорт...
  </section>

  <section
    v-else-if="error"
    class="rounded-[28px] border border-[#7f3d3d] bg-[#442f2f] p-8 text-white"
  >
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
          Назад
        </button>

        <p class="mt-5 text-[12px] font-bold uppercase tracking-[0.24em] text-[#7ba9d8]">
          Серверный import session
        </p>
        <h1 class="mt-2 text-[34px] font-bold text-white">{{ session.name }}</h1>
        <p class="mt-2 text-[15px] text-[#bdbdbd]">
          ID: {{ session.id }} • статус: {{ statusLabel }}
        </p>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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
          v-if="showValidateButton"
          type="button"
          class="cursor-pointer rounded-[16px] bg-[#1f78ff] px-5 py-4 text-[15px] font-bold text-white transition-colors duration-200 hover:bg-[#2a6ed9] disabled:cursor-not-allowed disabled:bg-[#3764a8]"
          :disabled="actionLoading"
          @click="validateImport"
        >
          {{ actionLoading ? "Запускаем..." : "К проверке" }}
        </button>

        <button
          v-if="showCommitButton"
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

    <section class="rounded-[28px] bg-[#2b2b2b] p-6">
      <p class="text-[13px] font-bold uppercase tracking-[0.18em] text-[#7ba9d8]">
        Параметры
      </p>
      <div class="mt-4 grid gap-4 md:grid-cols-2">
        <div class="rounded-[18px] bg-[#363636] px-4 py-4">
          <p class="text-[#a7a7a7]">Режим</p>
          <p class="mt-1 font-bold text-white">{{ session.mode === "with_check" ? "С проверкой" : "Без проверки" }}</p>
        </div>
        <div class="rounded-[18px] bg-[#363636] px-4 py-4">
          <p class="text-[#a7a7a7]">Магазин</p>
          <p class="mt-1 font-bold text-white">{{ session.shop_name || session.shop_id || "—" }}</p>
        </div>
        <div class="rounded-[18px] bg-[#363636] px-4 py-4">
          <p class="text-[#a7a7a7]">Создан</p>
          <p class="mt-1 font-bold text-white">{{ formatDate(session.created_at) }}</p>
        </div>
        <div class="rounded-[18px] bg-[#363636] px-4 py-4">
          <p class="text-[#a7a7a7]">Строк</p>
          <p class="mt-1 font-bold text-white">{{ rowsCount }}</p>
        </div>
      </div>
    </section>

    <section
      v-if="session.rows.length"
      class="rounded-[28px] bg-[#2b2b2b] p-6"
    >
      <div class="mb-4">
        <p class="text-[13px] font-bold uppercase tracking-[0.18em] text-[#7ba9d8]">
          File Rows
        </p>
        <h2 class="mt-2 text-[24px] font-bold text-white">Imported products from file</h2>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-[920px] w-full border-separate border-spacing-y-2 text-left">
          <thead>
            <tr class="text-[13px] uppercase tracking-[0.12em] text-[#8f8f8f]">
              <th class="px-4 py-3">Name</th>
              <th class="px-4 py-3">SKU</th>
              <th class="px-4 py-3">Barcode</th>
              <th class="px-4 py-3">Qty</th>
              <th class="px-4 py-3">Supply</th>
              <th class="px-4 py-3">Retail</th>
              <th class="px-4 py-3">Category</th>
              <th class="px-4 py-3">Brand</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="(row, index) in session.rows" :key="`${row.article}-${row.barcode}-${index}`">
              <td class="rounded-l-[18px] bg-[#363636] px-4 py-4 text-[15px] font-bold text-white">
                {{ row.name || "—" }}
              </td>
              <td class="bg-[#363636] px-4 py-4 text-[15px] text-white">{{ row.article || "—" }}</td>
              <td class="bg-[#363636] px-4 py-4 text-[15px] text-white">{{ row.barcode || "—" }}</td>
              <td class="bg-[#363636] px-4 py-4 text-[15px] text-white">{{ row.quantity }}</td>
              <td class="bg-[#363636] px-4 py-4 text-[15px] text-white">{{ formatMoney(row.supplyPrice) }}</td>
              <td class="bg-[#363636] px-4 py-4 text-[15px] text-white">{{ formatMoney(row.retailPrice) }}</td>
              <td class="bg-[#363636] px-4 py-4 text-[15px] text-white">{{ row.category || "—" }}</td>
              <td class="rounded-r-[18px] bg-[#363636] px-4 py-4 text-[15px] text-white">{{ row.brand || "—" }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section
      v-else-if="rowsCount > 0"
      class="rounded-[28px] border border-[#5b4a1f] bg-[#3b321d] p-6 text-white"
    >
      <p class="text-[16px] font-bold">Backend returned a row count, but did not return the `rows` array.</p>
    </section>

    <section
      v-if="progressPercent > 0 && (session.status === 'validating' || session.status === 'importing')"
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
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useHead, useRoute, useRouter } from "#imports";
import { useProductImport, type ImportSession } from "~/composables/useProductImport";

const route = useRoute();
const router = useRouter();
const {
  getImportSession,
  validateImportSession,
  getImportProgress,
  commitImportSession,
  cancelImportSession,
} = useProductImport();

const importId = computed(() => String(route.params.id ?? ""));
const session = ref<ImportSession | null>(null);
const loading = ref(true);
const actionLoading = ref(false);
const error = ref("");
const toast = useToast();
const progressPercent = ref(0);
const progressMessage = ref("");
let pollTimer: ReturnType<typeof setTimeout> | null = null;

const statusLabel = computed(() => {
  switch (session.value?.status) {
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
      return "—";
  }
});

const showValidateButton = computed(
  () => session.value?.mode === "with_check" && session.value?.status === "draft",
);
const showCommitButton = computed(() => {
  if (!session.value) return false;

  return session.value.status === "preview_ready";
});
const canCancel = computed(
  () => session.value?.status === "draft" || session.value?.status === "preview_ready",
);
const rowsCount = computed(() => {
  if (!session.value) return 0;

  return (
    session.value.rows_count ||
    session.value.rows.length ||
    session.value.preview_items.length ||
    0
  );
});

const summaryStats = computed(() => {
  if (!session.value) return [];

  return [
    { label: "Строк", value: `${rowsCount.value}` },
    { label: "Статус", value: statusLabel.value },
    { label: "Режим", value: session.value.mode === "with_check" ? "С проверкой" : "Без проверки" },
    { label: "Магазин", value: session.value.shop_name || session.value.shop_id || "—" },
  ];
});

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

async function loadSession() {
  loading.value = true;
  error.value = "";

  try {
    session.value = await getImportSession(importId.value);
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
        await router.replace(`/products/import/list/${resolvedImportId}?limit=20&page=1`);
        return;
      }

      pollTimer = setTimeout(tick, 1200);
    } catch (err: any) {
      error.value = err?.message || "Не удалось получить прогресс импорта.";
      stopPolling();
    }
  };

  await tick();
}

async function validateImport() {
  if (!session.value) return;

  actionLoading.value = true;
  error.value = "";

  try {
    const result = await validateImportSession(session.value.id, {
      name: session.value.name,
      shopId: session.value.shop_id,
      mode: session.value.mode,
      generateBarcodes: false,
      generateArticles: false,
      rows: session.value.rows,
      mappings: [],
      onMatch: session.value.on_match,
    });
    await loadSession();
    if (result.jobId) {
      toast.add({ title: "Проверка импорта запущена", color: "success" });
      await pollProgress(result.jobId, result.importId);
      return;
    }

    toast.add({ title: "Импорт проверен", color: "success" });
    await router.replace(`/products/import/list/${result.importId}?limit=20&page=1`);
  } catch (err: any) {
    error.value = err?.message || "Не удалось запустить проверку.";
  } finally {
    actionLoading.value = false;
  }
}

async function commitImport() {
  if (!session.value) return;

  actionLoading.value = true;
  error.value = "";

  try {
    await commitImportSession(session.value.id);
    toast.add({ title: "Импорт подтвержден", color: "success" });
    await router.replace(`/products/import/list/${session.value.id}?limit=20&page=1`);
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

onBeforeUnmount(() => {
  stopPolling();
});

useHead({
  title: computed(() =>
    session.value ? `${session.value.name} | Импорт` : "Импорт",
  ),
});
</script>
