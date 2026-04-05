<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import DataPanel from "@/components/platform/DataPanel.vue";
import EmptyState from "@/components/platform/EmptyState.vue";
import PageHeader from "@/components/platform/PageHeader.vue";
import StatusBadge from "@/components/platform/StatusBadge.vue";
import { usePlatformAdminApi } from "@/composables/usePlatformAdmin";

definePageMeta({ layout: "platform" });
useHead({ title: "Филиалы | Konkurent Platform" });

const { getCompanies, getCompanyShops } = usePlatformAdminApi();

const loading = ref(true);
const errorMessage = ref("");
const companies = ref<any[]>([]);
const selectedCompanyId = ref("all");
const shops = ref<any[]>([]);

const filteredShops = computed(() =>
  selectedCompanyId.value === "all"
    ? shops.value
    : shops.value.filter((shop) => shop.companyId === selectedCompanyId.value),
);

async function loadData() {
  loading.value = true;
  errorMessage.value = "";

  try {
    companies.value = await getCompanies();
    const grouped = await Promise.all(
      companies.value.map((company) => getCompanyShops(company.id, company)),
    );
    shops.value = grouped.flat();
  } catch (error: any) {
    const message = error?.data?.message;
    errorMessage.value = Array.isArray(message)
      ? message.join(", ")
      : message || error?.message || "Не удалось загрузить филиалы";
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <div class="space-y-8">
    <PageHeader eyebrow="Филиалы" title="Все филиалы" description="Сводный список филиалов по всем компаниям платформы.">
      <template #actions>
        <UButton color="neutral" variant="soft" class="rounded-2xl bg-white text-slate-700 hover:bg-slate-100" @click="loadData">
          <Icon name="heroicons:arrow-path" class="mr-2 h-4 w-4" />
          Обновить
        </UButton>
      </template>
    </PageHeader>

    <div v-if="errorMessage" class="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-[14px] text-rose-600">
      {{ errorMessage }}
    </div>

    <DataPanel title="Филиалы" description="Для создания и редактирования используйте карточку конкретной компании.">
      <template #toolbar>
        <select v-model="selectedCompanyId" class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] text-slate-700 outline-none">
          <option value="all">Все компании</option>
          <option v-for="company in companies" :key="company.id" :value="company.id">{{ company.name }}</option>
        </select>
      </template>

      <div v-if="loading" class="space-y-3">
        <div v-for="item in 5" :key="item" class="h-24 animate-pulse rounded-[24px] bg-slate-100" />
      </div>

      <EmptyState v-else-if="!filteredShops.length" title="Филиалы не найдены" description="Выберите другую компанию или проверьте данные API." icon="heroicons:map-pin" />

      <div v-else class="grid gap-4 lg:grid-cols-2">
        <article v-for="shop in filteredShops" :key="shop.id" class="rounded-[28px] border border-slate-100 bg-slate-50/70 p-5">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-[18px] font-semibold text-slate-950">{{ shop.name }}</p>
              <p class="mt-2 text-[14px] text-slate-500">{{ shop.companyName || "Компания не указана" }}</p>
            </div>
            <StatusBadge :status="shop.status" />
          </div>

          <div class="mt-5 grid gap-3 sm:grid-cols-2">
            <div class="rounded-2xl bg-white px-4 py-3">
              <p class="text-[12px] font-medium text-slate-400">Код филиала</p>
              <p class="mt-2 text-[14px] font-semibold text-slate-900">{{ shop.branchCode || "—" }}</p>
            </div>
            <div class="rounded-2xl bg-white px-4 py-3">
              <p class="text-[12px] font-medium text-slate-400">Город</p>
              <p class="mt-2 text-[14px] font-semibold text-slate-900">{{ shop.city || "—" }}</p>
            </div>
          </div>
        </article>
      </div>
    </DataPanel>
  </div>
</template>
