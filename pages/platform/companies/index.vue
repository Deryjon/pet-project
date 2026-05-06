<script setup lang="ts">
import ActionMenu from "@/components/platform/ActionMenu.vue";
import DataPanel from "@/components/platform/DataPanel.vue";
import DataTable from "@/components/platform/DataTable.vue";
import DateBadge from "@/components/platform/DateBadge.vue";
import PageHeader from "@/components/platform/PageHeader.vue";
import StatusBadge from "@/components/platform/StatusBadge.vue";
import { daysLeft, usePlatformAdminApi, type PlatformCompany } from "@/composables/usePlatformAdmin";

definePageMeta({ layout: "platform" });
useHead({ title: "Компании | Konkurent" });

const router = useRouter();
const toast = useToast();
const api = usePlatformAdminApi();
const companies = ref<PlatformCompany[]>([]);
const renewingSubscriptionId = ref("");
const renewingCompanyId = ref("");
const search = ref("");
const status = ref("all");
const plan = ref("all");
const subscription = ref("all");

const statusOptions = [
  { label: "Все статусы", value: "all" },
  { label: "Активные", value: "active" },
  { label: "Заблокированные", value: "blocked" },
];
const planOptions = computed(() => [
  { label: "Все тарифы", value: "all" },
  ...Array.from(new Set(companies.value.map((company) => company.subscription?.planName).filter(Boolean))).map((name) => ({ label: String(name), value: String(name) })),
]);
const subscriptionOptions = [
  { label: "Все подписки", value: "all" },
  { label: "Активна", value: "active" },
  { label: "Истекла", value: "expired" },
];

const filteredCompanies = computed(() =>
  companies.value.filter((company) => {
    const query = search.value.trim().toLowerCase();
    const matchesSearch = !query || company.name.toLowerCase().includes(query);
    const matchesStatus = status.value === "all" || company.status === status.value;
    const companyPlan = company.subscription?.planName || "";
    const matchesPlan = plan.value === "all" || companyPlan === plan.value;
    const companySubscription = daysLeft(company.subscription?.endDate || "") < 0 ? "expired" : "active";
    const matchesSubscription = subscription.value === "all" || subscription.value === companySubscription;
    return matchesSearch && matchesStatus && matchesPlan && matchesSubscription;
  }),
);

async function loadCompanies() {
  companies.value = await api.getCompanies();
}

async function runAction(action: () => Promise<unknown>, title: string, company: string) {
  await action();
  toast.add({ title, description: company, color: "success" });
  await loadCompanies();
}

function subscriptionAmount(company: PlatformCompany) {
  return company.subscription?.plan?.priceMonthly ?? 0;
}

function hasSubscription(company: PlatformCompany) {
  return Boolean(company.subscription?.id || company.subscriptions?.some((subscriptionItem) => subscriptionItem.id));
}

function companyIds(company: PlatformCompany) {
  return [company.id, company.companyId].filter(Boolean).map(String);
}

function isCompanySubscription(subscriptionItem: any, company: PlatformCompany) {
  return companyIds(company).includes(String(subscriptionItem?.companyId || ""));
}

async function resolveSubscriptionForPayment(company: PlatformCompany) {
  if (company.subscription?.id) {
    return company.subscription;
  }

  const routeCompanyId = company.id || company.companyId;
  if (routeCompanyId) {
    try {
      const detailedCompany = await api.getCompany(routeCompanyId);
      if (detailedCompany.subscription?.id) {
        return detailedCompany.subscription;
      }
    } catch {}
  }

  const subscriptions = await api.getSubscriptions();
  return subscriptions.find((subscriptionItem) => isCompanySubscription(subscriptionItem, company)) || null;
}

async function renewWithPayment(company: PlatformCompany) {
  renewingCompanyId.value = company.id || company.companyId;
  let resolvedSubscription: Awaited<ReturnType<typeof resolveSubscriptionForPayment>>;
  try {
    resolvedSubscription = await resolveSubscriptionForPayment(company);
  } catch (error: any) {
    const message = error?.data?.message ?? error?.response?._data?.message ?? error?.message ?? "РќРµ СѓРґР°Р»РѕСЃСЊ РЅР°Р№С‚Рё РїРѕРґРїРёСЃРєСѓ РєРѕРјРїР°РЅРёРё";
    toast.add({ title: "РќРµ СѓРґР°Р»РѕСЃСЊ РїСЂРѕРґР»РёС‚СЊ РїРѕРґРїРёСЃРєСѓ", description: Array.isArray(message) ? message.join(", ") : message, color: "error" });
    renewingCompanyId.value = "";
    return;
  }
  const subscriptionId = resolvedSubscription?.id;
  if (!subscriptionId) {
    toast.add({ title: "Не удалось продлить подписку", description: "У компании нет ID подписки.", color: "error" });
    renewingCompanyId.value = "";
    return;
  }

  renewingSubscriptionId.value = subscriptionId;
  try {
    await api.createPayment({
      subscription_id: subscriptionId,
      amount: resolvedSubscription?.plan?.priceMonthly ?? subscriptionAmount(company),
      method: "cash",
      comment: "Продление подписки на 1 месяц",
    });
    toast.add({ title: "Подписка продлена на 1 месяц", description: company.name, color: "success" });
    await loadCompanies();
  } catch (error: any) {
    const message = error?.data?.message ?? error?.response?._data?.message ?? error?.message ?? "Запрос на продление не выполнен";
    toast.add({ title: "Не удалось продлить подписку", description: Array.isArray(message) ? message.join(", ") : message, color: "error" });
  } finally {
    renewingSubscriptionId.value = "";
    renewingCompanyId.value = "";
  }
}

onMounted(loadCompanies);
</script>

<template>
  <div class="space-y-8">
    <PageHeader eyebrow="Клиенты" title="Компании" description="Главная страница управления клиентами платформы, статусами и подписками.">
      <template #actions>
        <UButton to="/platform/companies/create" color="neutral" class="rounded-2xl bg-slate-950 text-white hover:bg-slate-800">
          <Icon name="heroicons:plus" class="mr-2 h-4 w-4" />
          Создать компанию
        </UButton>
      </template>
    </PageHeader>

    <DataPanel title="Список компаний" description="Фильтруйте клиентов по названию, статусу, тарифу и состоянию подписки.">
      <template #toolbar>
        <div class="grid w-full gap-3 md:grid-cols-4">
          <UInput v-model="search" placeholder="Поиск по названию" />
          <USelect v-model="status" :items="statusOptions" value-key="value" />
          <USelect v-model="plan" :items="planOptions" value-key="value" />
          <USelect v-model="subscription" :items="subscriptionOptions" value-key="value" />
        </div>
      </template>

      <DataTable>
        <thead class="bg-slate-50">
          <tr class="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            <th class="px-4 py-3">Название компании</th>
            <th class="px-4 py-3">Владелец</th>
            <th class="px-4 py-3">Телефон</th>
            <th class="px-4 py-3">Статус</th>
            <th class="px-4 py-3">Тариф</th>
            <th class="px-4 py-3">Окончание подписки</th>
            <th class="px-4 py-3">Дата создания</th>
            <th class="px-4 py-3 text-right">Действия</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="company in filteredCompanies" :key="company.id" class="text-[14px] text-slate-700">
            <td class="px-4 py-4 font-semibold text-slate-950">{{ company.name }}</td>
            <td class="px-4 py-4">{{ company.ownerName }}</td>
            <td class="px-4 py-4">{{ company.ownerPhone }}</td>
            <td class="px-4 py-4"><StatusBadge :status="company.status" /></td>
            <td class="px-4 py-4">{{ company.subscription?.planName || "—" }}</td>
            <td class="px-4 py-4"><DateBadge :date="company.subscription?.endDate || ''" /></td>
            <td class="px-4 py-4"><DateBadge :date="company.createdAt" /></td>
            <td class="px-4 py-4 text-right">
              <div class="flex items-center justify-end gap-2">
                <UButton
                  color="neutral"
                  variant="soft"
                  size="sm"
                  class="rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  :loading="renewingCompanyId === (company.id || company.companyId) || (Boolean(company.subscription?.id) && renewingSubscriptionId === company.subscription?.id)"
                  :disabled="!hasSubscription(company)"
                  @click.stop="renewWithPayment(company)"
                >
                  <Icon name="heroicons:calendar-days" class="mr-1.5 h-4 w-4" />
                  Продлить
                </UButton>
              <ActionMenu
                :items="[
                  { label: 'Открыть', icon: 'heroicons:arrow-top-right-on-square', onSelect: () => router.push(`/platform/companies/${company.id}`) },
                  { label: 'Редактировать', icon: 'heroicons:pencil-square', onSelect: () => router.push(`/platform/companies/${company.id}`) },
                  { label: 'Заблокировать', icon: 'heroicons:lock-closed', onSelect: () => runAction(() => api.blockCompany(company.id), 'Компания заблокирована', company.name) },
                  { label: 'Разблокировать', icon: 'heroicons:lock-open', onSelect: () => runAction(() => api.unblockCompany(company.id), 'Компания разблокирована', company.name) },
                  { label: 'Удалить', icon: 'heroicons:trash', color: 'error', onSelect: () => runAction(() => api.deleteCompany(company.id), 'Компания удалена', company.name) },
                ]"
              />
              </div>
            </td>
          </tr>
        </tbody>
      </DataTable>
    </DataPanel>
  </div>
</template>
