<script setup lang="ts">
import { useHead } from "#imports";
import ReportFilterBar from "~/components/reports/ReportFilterBar.vue";
import ShopStatsTable from "~/components/reports/ShopStatsTable.vue";
import { useReportsApi, type ReportFilterQuery, type SelectOption } from "~/composables/useReportsApi";

useHead({ title: "Отчет по магазинам | Konkurent" });

const reportsApi = useReportsApi();
const loading = ref(false);
const filters = ref<ReportFilterQuery>({});
const rows = ref<any[]>([]);

const shopOptions = computed<SelectOption[]>(() => rows.value.map((shop: any) => ({ label: shop.name, value: shop.id })));

async function loadPage() {
  loading.value = true;
  try {
    rows.value = await reportsApi.getShops(filters.value);
  } finally {
    loading.value = false;
  }
}

onMounted(loadPage);
</script>

<template>
  <section class="space-y-6 text-white">
    <div class="rounded-[30px] border border-white/10 bg-[linear-gradient(160deg,rgba(31,120,255,0.18),rgba(15,23,42,0.95))] p-6 shadow-[0_28px_70px_rgba(2,6,23,0.32)]">
      <p class="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#8ec8ff]">Reports</p>
      <h1 class="mt-3 text-[32px] font-bold tracking-[-0.05em]">Магазины</h1>
    </div>

    <ReportFilterBar v-model="filters" :shops="shopOptions" :loading="loading" @apply="loadPage" @reset="loadPage" />
    <ShopStatsTable :rows="rows" :loading="loading" />
  </section>
</template>
