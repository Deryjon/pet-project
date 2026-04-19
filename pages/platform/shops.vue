<script setup lang="ts">
import { computed, ref, watch } from "vue";
import DataPanel from "@/components/platform/DataPanel.vue";
import EmptyState from "@/components/platform/EmptyState.vue";
import PageHeader from "@/components/platform/PageHeader.vue";
import StatusBadge from "@/components/platform/StatusBadge.vue";
import type { PlatformCompany, PlatformShop } from "@/composables/usePlatformAdmin";
import { usePlatformAdminApi } from "@/composables/usePlatformAdmin";
import { usePlatformFormUi } from "@/composables/usePlatformFormUi";

definePageMeta({ layout: "platform" });
useHead({ title: "Филиалы компаний | Konkurent" });

const { getCompanies, getCompanyShops } = usePlatformAdminApi();
const { softSelectUi } = usePlatformFormUi();

const companiesLoading = ref(true);
const shopsLoading = ref(false);
const errorMessage = ref("");
const companies = ref<PlatformCompany[]>([]);
const shops = ref<PlatformShop[]>([]);
const selectedCompanyId = ref("");

const selectedCompany = computed(() =>
  companies.value.find((company) => company.companyId === selectedCompanyId.value || company.id === selectedCompanyId.value) || null,
);

const companyOptions = computed(() =>
  companies.value.map((company) => ({
    label: company.name,
    value: getCompanyRouteId(company),
  })),
);

function resolveError(error: any, fallback: string) {
  const message = error?.data?.message ?? error?.response?._data?.message;
  return Array.isArray(message) ? message.join(", ") : message || error?.message || fallback;
}

function getCompanyRouteId(company: PlatformCompany) {
  return company.companyId || company.id;
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

async function loadCompanyShops(companyId: string) {
  if (!companyId) {
    shops.value = [];
    return;
  }

  shopsLoading.value = true;
  errorMessage.value = "";

  try {
    const company = companies.value.find((item) => item.companyId === companyId || item.id === companyId);
    shops.value = await getCompanyShops(companyId, company || undefined);
  } catch (error: any) {
    shops.value = [];
    errorMessage.value = resolveError(error, "Не удалось загрузить филиалы компании");
  } finally {
    shopsLoading.value = false;
  }
}

watch(selectedCompanyId, (companyId) => {
  loadCompanyShops(companyId);
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
    <PageHeader eyebrow="Филиалы компаний" title="Филиалы" description="Выберите компанию и просмотрите ее филиалы.">
      <template #actions>
        <UButton color="neutral" variant="soft" class="cursor-pointer rounded-2xl bg-white text-slate-700 hover:bg-slate-100" @click="loadCompanies">
          <Icon name="heroicons:arrow-path" class="mr-2 h-4 w-4" />
          Обновить
        </UButton>
      </template>
    </PageHeader>

    <div v-if="errorMessage" class="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-[14px] text-rose-600">
      {{ errorMessage }}
    </div>

    <DataPanel title="Список филиалов" description="Филиалы выбранной компании.">
      <template #toolbar>
        <USelect v-model="selectedCompanyId" :items="companyOptions" value-key="value" :disabled="companiesLoading || !companies.length" :ui="softSelectUi" class="min-w-[260px]" />
      </template>

      <div v-if="companiesLoading || shopsLoading" class="space-y-3">
        <div v-for="item in 5" :key="item" class="h-24 animate-pulse rounded-[24px] bg-slate-100" />
      </div>

      <EmptyState v-else-if="!companies.length" title="Компании не найдены" description="Список компаний пока пуст." icon="heroicons:building-office-2" />
      <EmptyState v-else-if="!selectedCompanyId" title="Компания не выбрана" description="Выберите компанию из списка выше." icon="heroicons:map-pin" />
      <EmptyState v-else-if="!shops.length" :title="selectedCompany ? `У компании ${selectedCompany.name} нет филиалов` : 'Филиалы не найдены'" description="Для выбранной компании филиалы пока не найдены." icon="heroicons:map-pin" />

      <div v-else class="grid gap-4 lg:grid-cols-2">
        <article v-for="shop in shops" :key="shop.id" class="rounded-[28px] border border-slate-100 bg-slate-50/70 p-5">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-[18px] font-semibold text-slate-950">{{ shop.name }}</p>
              <p class="mt-2 text-[14px] text-slate-500">{{ shop.branchCode || "Код не указан" }}</p>
            </div>
            <StatusBadge :status="shop.status" />
          </div>

          <div class="mt-5 grid gap-3 sm:grid-cols-2">
            <div class="rounded-2xl bg-white px-4 py-3">
              <p class="text-[12px] font-medium text-slate-400">Идентификатор филиала</p>
              <p class="mt-2 text-[14px] font-semibold text-slate-900">{{ shop.shopId || shop.id || "—" }}</p>
            </div>
            <div class="rounded-2xl bg-white px-4 py-3">
              <p class="text-[12px] font-medium text-slate-400">Обновлен</p>
              <p class="mt-2 text-[14px] font-semibold text-slate-900">{{ shop.updatedAt || shop.createdAt || "—" }}</p>
            </div>
          </div>
        </article>
      </div>
    </DataPanel>
  </div>
</template>
