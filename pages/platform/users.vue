<script setup lang="ts">
import { computed, ref, watch } from "vue";
import DataPanel from "@/components/platform/DataPanel.vue";
import EmptyState from "@/components/platform/EmptyState.vue";
import PageHeader from "@/components/platform/PageHeader.vue";
import StatusBadge from "@/components/platform/StatusBadge.vue";
import type { PlatformCompany, PlatformShop, PlatformUser } from "@/composables/usePlatformAdmin";
import { usePlatformAdminApi } from "@/composables/usePlatformAdmin";
import { usePlatformFormUi } from "@/composables/usePlatformFormUi";

definePageMeta({ layout: "platform" });
useHead({ title: "Сотрудники компаний | Konkurent Platform" });

const { getCompanies, getCompanyShops, getCompanyUsers } = usePlatformAdminApi();
const { softInputUi, softSelectUi } = usePlatformFormUi();

const companiesLoading = ref(true);
const usersLoading = ref(false);
const errorMessage = ref("");
const companies = ref<PlatformCompany[]>([]);
const shops = ref<PlatformShop[]>([]);
const users = ref<PlatformUser[]>([]);
const selectedCompanyId = ref("");
const search = ref("");
const role = ref("all");
const status = ref("all");

const selectedCompany = computed(() =>
  companies.value.find((company) => company.companyId === selectedCompanyId.value || company.id === selectedCompanyId.value) || null,
);

const companyOptions = computed(() =>
  companies.value.map((company) => ({
    label: company.name,
    value: getCompanyRouteId(company),
  })),
);

const roleOptions = computed(() => Array.from(new Set(users.value.map((user) => user.role).filter(Boolean))).sort());

const roleSelectOptions = computed(() => [
  { label: "Все роли", value: "all" },
  ...roleOptions.value.map((item) => ({ label: item, value: item })),
]);

const statusOptions = [
  { label: "Все статусы", value: "all" },
  { label: "Активные", value: "active" },
  { label: "Отключенные", value: "inactive" },
];

const filteredUsers = computed(() =>
  users.value.filter((user) => {
    const q = search.value.trim().toLowerCase();
    const matchesSearch = !q || `${user.fullName} ${user.phone} ${user.role} ${user.currentShopName}`.toLowerCase().includes(q);
    const matchesRole = role.value === "all" || user.role === role.value;
    const matchesStatus = status.value === "all" || user.status === status.value;
    return matchesSearch && matchesRole && matchesStatus;
  }),
);

function resolveError(error: any, fallback: string) {
  const message = error?.data?.message ?? error?.response?._data?.message;
  return Array.isArray(message) ? message.join(", ") : message || error?.message || fallback;
}

function getCompanyRouteId(company: PlatformCompany) {
  return company.companyId || company.id;
}

function enrichUsersWithShopNames(items: PlatformUser[]) {
  return items.map((user) => {
    const matchedShop = shops.value.find(
      (shop) =>
        shop.id === user.currentShopId ||
        shop.shopId === user.currentShopId ||
        user.allowedShopIds.includes(shop.id) ||
        user.allowedShopIds.includes(shop.shopId),
    );

    return {
      ...user,
      currentShopId: user.currentShopId || matchedShop?.id || matchedShop?.shopId || "",
      currentShopName: user.currentShopName || matchedShop?.name || "",
      allowedShopIds: user.allowedShopIds.length ? user.allowedShopIds : matchedShop ? [matchedShop.id] : [],
    };
  });
}

async function loadCompanies() {
  companiesLoading.value = true;
  errorMessage.value = "";

  try {
    companies.value = await getCompanies();
    const firstCompany = companies.value[0];
    selectedCompanyId.value = firstCompany ? getCompanyRouteId(firstCompany) : "";
  } catch (error: any) {
    errorMessage.value = resolveError(error, "Не удалось загрузить компании");
  } finally {
    companiesLoading.value = false;
  }
}

async function loadCompanyUsers(companyId: string) {
  if (!companyId) {
    users.value = [];
    shops.value = [];
    return;
  }

  usersLoading.value = true;
  errorMessage.value = "";

  try {
    const company = companies.value.find((item) => item.companyId === companyId || item.id === companyId);
    shops.value = await getCompanyShops(companyId, company || undefined);
    users.value = enrichUsersWithShopNames(await getCompanyUsers(companyId));
  } catch (error: any) {
    users.value = [];
    shops.value = [];
    errorMessage.value = resolveError(error, "Не удалось загрузить сотрудников компании");
  } finally {
    usersLoading.value = false;
  }
}

watch(selectedCompanyId, (companyId) => {
  loadCompanyUsers(companyId);
});

watch(
  () => true,
  () => {
    loadCompanies();
  },
  { immediate: true, once: true },
);
</script>

<template>
  <div class="space-y-8">
    <PageHeader eyebrow="Сотрудники компаний" title="Сотрудники" description="Выберите компанию и просмотрите ее сотрудников.">
      <template #actions>
        <UButton color="neutral" variant="soft" class="rounded-2xl bg-white text-slate-700 hover:bg-slate-100" @click="loadCompanies">
          <Icon name="heroicons:arrow-path" class="mr-2 h-4 w-4" />
          Обновить
        </UButton>
      </template>
    </PageHeader>

    <div v-if="errorMessage" class="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-[14px] text-rose-600">
      {{ errorMessage }}
    </div>

    <DataPanel title="Список сотрудников" description="Сотрудники выбранной компании.">
      <template #toolbar>
        <div class="flex flex-1 flex-wrap items-center gap-3">
          <USelect v-model="selectedCompanyId" :items="companyOptions" value-key="value" :disabled="companiesLoading || !companies.length" :ui="softSelectUi" class="min-w-[260px]" />
          <div class="min-w-[240px] flex-1">
            <UInput v-model="search" type="text" placeholder="Поиск по имени, телефону, роли или филиалу" :ui="softInputUi" />
          </div>
          <USelect v-model="role" :items="roleSelectOptions" value-key="value" :ui="softSelectUi" class="min-w-[220px]" />
          <USelect v-model="status" :items="statusOptions" value-key="value" :ui="softSelectUi" class="min-w-[220px]" />
        </div>
      </template>

      <div v-if="companiesLoading || usersLoading" class="space-y-3">
        <div v-for="item in 6" :key="item" class="h-20 animate-pulse rounded-[24px] bg-slate-100" />
      </div>

      <EmptyState v-else-if="!companies.length" title="Компании не найдены" description="Список компаний пока пуст." icon="heroicons:building-office-2" />
      <EmptyState v-else-if="!selectedCompanyId" title="Компания не выбрана" description="Выберите компанию из списка выше." icon="heroicons:users" />
      <EmptyState v-else-if="!filteredUsers.length" :title="selectedCompany ? `У компании ${selectedCompany.name} нет сотрудников` : 'Сотрудники не найдены'" description="Для выбранной компании сотрудники пока не найдены." icon="heroicons:user-group" />

      <div v-else class="overflow-x-auto">
        <table class="min-w-full border-separate border-spacing-y-3">
          <thead>
            <tr class="text-left text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              <th class="px-4 py-2">Пользователь</th>
              <th class="px-4 py-2">Телефон</th>
              <th class="px-4 py-2">Роль</th>
              <th class="px-4 py-2">Текущий филиал</th>
              <th class="px-4 py-2">Статус</th>
              <th class="px-4 py-2">Компания</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td class="rounded-l-[22px] bg-slate-50 px-4 py-4">
                <p class="font-semibold text-slate-950">{{ user.fullName }}</p>
                <p class="mt-1 text-[13px] text-slate-500">{{ user.birthDate || "Дата рождения не указана" }}</p>
              </td>
              <td class="bg-slate-50 px-4 py-4 text-[14px] text-slate-600">{{ user.phone || "—" }}</td>
              <td class="bg-slate-50 px-4 py-4 text-[14px] text-slate-600">{{ user.role || "—" }}</td>
              <td class="bg-slate-50 px-4 py-4 text-[14px] text-slate-600">{{ user.currentShopName || user.currentShopId || "—" }}</td>
              <td class="bg-slate-50 px-4 py-4"><StatusBadge :status="user.status" /></td>
              <td class="rounded-r-[22px] bg-slate-50 px-4 py-4 text-[14px] text-slate-600">
                <NuxtLink v-if="selectedCompany" :to="`/platform/companies/${getCompanyRouteId(selectedCompany)}`" class="font-medium text-slate-700 underline-offset-2 hover:underline">
                  {{ selectedCompany.name }}
                </NuxtLink>
                <span v-else>—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </DataPanel>
  </div>
</template>
