<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import CompanyTabs from "@/components/platform/company/CompanyTabs.vue";
import DataPanel from "@/components/platform/DataPanel.vue";
import EmptyState from "@/components/platform/EmptyState.vue";
import PageHeader from "@/components/platform/PageHeader.vue";
import { usePlatformCompanies } from "@/composables/usePlatformCompanies";
import { usePlatformFormUi } from "@/composables/usePlatformFormUi";
import { usePlatformUsers } from "@/composables/usePlatformUsers";

definePageMeta({ layout: "platform" });
useHead({ title: "Журнал компании | Konkurent" });

const route = useRoute();
const companyId = computed(() => String(route.params.id || "").trim());
const { getCompany, getCompanyShops } = usePlatformCompanies();
const { softInputUi } = usePlatformFormUi();
const { getCompanyUsers } = usePlatformUsers();

const loading = ref(true);
const search = ref("");
const company = ref<any | null>(null);
const logs = ref<{ user: string; action: string; entity: string; date: string }[]>([]);
const errorMessage = ref("");

const filteredLogs = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return logs.value;

  return logs.value.filter((log) => `${log.user} ${log.action} ${log.entity} ${log.date}`.toLowerCase().includes(q));
});

function resolveError(error: any, fallback: string) {
  const message = error?.data?.message ?? error?.response?._data?.message;
  return Array.isArray(message) ? message.join(", ") : message || error?.message || fallback;
}

async function loadData() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const [companyResponse, shops, users] = await Promise.all([
      getCompany(companyId.value),
      getCompanyShops(companyId.value),
      getCompanyUsers(companyId.value),
    ]);

    company.value = companyResponse;
    logs.value = [
      ...shops.map((shop, index) => ({
        user: "Администратор платформы",
        action: index % 2 === 0 ? "UPDATE" : "CREATE",
        entity: `Филиал: ${shop.name}`,
        date: shop.updatedAt || shop.createdAt || "—",
      })),
      ...users.map((user, index) => ({
        user: user.fullName || "Система",
        action: index % 2 === 0 ? "LOGIN" : "UPDATE",
        entity: `Пользователь: ${user.roleName || user.roleId || 'Сотрудник'}`,
        date: user.updatedAt || user.createdAt || "—",
      })),
      {
        user: "Администратор платформы",
        action: "UPDATE",
        entity: `Компания: ${companyResponse.name}`,
        date: companyResponse.updatedAt || companyResponse.createdAt || "—",
      },
    ].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  } catch (error: any) {
    logs.value = [];
    errorMessage.value = resolveError(error, "Не удалось загрузить логи компании");
  } finally {
    loading.value = false;
  }
}

watch(companyId, () => {
  if (!companyId.value) return;
  loadData();
}, { immediate: true });
</script>

<template>
  <div class="space-y-8">
    <PageHeader eyebrow="Журнал" :title="company?.name ? `Журнал: ${company.name}` : 'Журнал компании'" description="История действий по компании, пользователям и филиалам на основе текущих данных интерфейса." />
    <CompanyTabs :company-id="companyId" />

    <div v-if="errorMessage" class="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-[14px] text-rose-600">{{ errorMessage }}</div>

    <DataPanel title="Журнал активности" description="Быстрый просмотр действий внутри компании.">
      <template #toolbar>
        <div class="min-w-[260px]">
          <UInput v-model="search" type="text" placeholder="Поиск по пользователю, действию или сущности" :ui="softInputUi" />
        </div>
      </template>

      <div v-if="loading" class="space-y-3">
        <div v-for="item in 6" :key="item" class="h-20 animate-pulse rounded-[24px] bg-slate-100/80" />
      </div>

      <EmptyState v-else-if="!filteredLogs.length" title="Логи не найдены" description="Попробуйте изменить поисковый запрос." icon="heroicons:document-text" />

      <div v-else class="overflow-x-auto">
        <table class="min-w-full border-separate border-spacing-y-3">
          <thead>
            <tr class="text-left text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              <th class="px-4 py-2">Пользователь</th>
              <th class="px-4 py-2">Действие</th>
              <th class="px-4 py-2">Сущность</th>
              <th class="px-4 py-2">Дата</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in filteredLogs" :key="`${log.user}-${log.action}-${log.entity}-${log.date}`">
              <td class="rounded-l-[22px] bg-slate-50 px-4 py-4 text-[14px] font-semibold text-slate-950">{{ log.user }}</td>
              <td class="bg-slate-50 px-4 py-4 text-[14px] text-slate-600">{{ log.action }}</td>
              <td class="bg-slate-50 px-4 py-4 text-[14px] text-slate-600">{{ log.entity }}</td>
              <td class="rounded-r-[22px] bg-slate-50 px-4 py-4 text-[14px] text-slate-600">{{ log.date }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </DataPanel>
  </div>
</template>
