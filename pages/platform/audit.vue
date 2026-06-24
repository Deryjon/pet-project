<script setup lang="ts">
import { computed, ref, watch, onMounted } from "vue";
import DataPanel from "@/components/platform/DataPanel.vue";
import PageHeader from "@/components/platform/PageHeader.vue";
import { usePlatformFormUi } from "@/composables/usePlatformFormUi";
import { useApi } from "~/composables/useApi";

definePageMeta({ layout: "platform" });
useHead({ title: "Аудит | Konkurent" });

const search = ref("");
const userFilter = ref("all");
const entityFilter = ref("all");
const { softInputUi, softSelectUi } = usePlatformFormUi();

const loading = ref(false);
const page = ref(1);
const total = ref(0);
const limit = ref(20);

interface AuditLogItem {
  id: string;
  user: string;
  userId: number;
  action: string;
  entity: string;
  entityId: string;
  meta: any;
  date: string;
}

const logs = ref<AuditLogItem[]>([]);

const userOptions = computed(() => [
  { label: "Все пользователи", value: "all" },
  ...Array.from(new Set(logs.value.map((log) => String(log.userId)))).map((uid) => {
    const log = logs.value.find((l) => String(l.userId) === uid);
    return { label: log?.user ?? uid, value: uid };
  }),
]);

const entityOptions = computed(() => [
  { label: "Все сущности", value: "all" },
  ...Array.from(new Set(logs.value.map((log) => log.entity))).map((entity) => ({
    label: entity,
    value: entity,
  })),
]);

async function fetchLogs() {
  loading.value = true;
  try {
    const { apiFetch } = useApi();
    const res: any = await apiFetch("/platform/audit-logs", {
      query: {
        page: page.value,
        limit: limit.value,
        search: search.value || undefined,
        user: userFilter.value !== "all" ? userFilter.value : undefined,
        entity: entityFilter.value !== "all" ? entityFilter.value : undefined,
      },
    });
    logs.value = Array.isArray(res?.items) ? res.items : [];
    total.value = res?.total ?? 0;
  } catch {
    logs.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

let searchTimeout: ReturnType<typeof setTimeout> | null = null;
watch(search, () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    page.value = 1;
    fetchLogs();
  }, 350);
});

watch([userFilter, entityFilter], () => {
  page.value = 1;
  fetchLogs();
});

watch(page, () => {
  fetchLogs();
});

onMounted(() => {
  fetchLogs();
});

function formatDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("ru-RU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
</script>

<template>
  <div class="space-y-8">
    <PageHeader eyebrow="Аудит" title="Журнал аудита" description="Журнал аудита действий внутри платформы." />

    <DataPanel title="События аудита" description="Поиск и фильтрация действий по пользователю и сущности.">
      <template #toolbar>
        <div class="flex flex-1 flex-wrap items-center gap-3">
          <div class="min-w-[240px] flex-1">
            <UInput v-model="search" type="text" placeholder="Поиск по действию, сущности и ID" :ui="softInputUi" />
          </div>
          <USelect v-model="userFilter" :items="userOptions" value-key="value" :ui="softSelectUi" class="min-w-[180px]" />
          <USelect v-model="entityFilter" :items="entityOptions" value-key="value" :ui="softSelectUi" class="min-w-[180px]" />
        </div>
      </template>

      <div v-if="loading" class="flex items-center justify-center py-12">
        <span class="text-sm text-slate-400">Загрузка...</span>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full border-separate border-spacing-y-3">
          <thead>
            <tr class="text-left text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              <th class="px-4 py-2">Пользователь</th>
              <th class="px-4 py-2">Действие</th>
              <th class="px-4 py-2">Сущность</th>
              <th class="px-4 py-2">ID сущности</th>
              <th class="px-4 py-2">Дата</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!logs.length">
              <td colspan="5" class="px-4 py-8 text-center text-sm text-slate-400">Нет данных</td>
            </tr>
            <tr v-for="log in logs" :key="log.id">
              <td class="rounded-l-[22px] bg-slate-50 px-4 py-4 text-[14px] font-semibold text-slate-950">{{ log.user }}</td>
              <td class="bg-slate-50 px-4 py-4 text-[14px] text-slate-600">{{ log.action }}</td>
              <td class="bg-slate-50 px-4 py-4 text-[14px] text-slate-600">{{ log.entity }}</td>
              <td class="bg-slate-50 px-4 py-4 text-[14px] text-slate-600">{{ log.entityId }}</td>
              <td class="rounded-r-[22px] bg-slate-50 px-4 py-4 text-[14px] text-slate-600">{{ formatDate(log.date) }}</td>
            </tr>
          </tbody>
        </table>

        <div class="flex items-center justify-between mt-4">
          <span class="text-[13px] text-slate-500">Показано {{ logs.length }} из {{ total }}</span>
          <div class="flex gap-2">
            <button :disabled="page <= 1" @click="page--" class="rounded-xl bg-slate-100 px-3 py-2 text-sm disabled:opacity-40">&#8592;</button>
            <span class="px-3 py-2 text-sm font-semibold">{{ page }}</span>
            <button :disabled="page * limit >= total" @click="page++" class="rounded-xl bg-slate-100 px-3 py-2 text-sm disabled:opacity-40">&#8594;</button>
          </div>
        </div>
      </div>
    </DataPanel>
  </div>
</template>
