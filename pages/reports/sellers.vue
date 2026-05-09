<script setup lang="ts">
import { useHead } from "#imports";
import ReportFilterBar from "~/components/reports/ReportFilterBar.vue";
import SellerStatsTable from "~/components/reports/SellerStatsTable.vue";
import { useReportsApi, type ReportFilterQuery, type SelectOption } from "~/composables/useReportsApi";

useHead({ title: "Отчет по продавцам | Konkurent" });

const reportsApi = useReportsApi();
const loading = ref(false);
const filters = ref<ReportFilterQuery>({});
const rows = ref<any[]>([]);

const sellerOptions = computed<SelectOption[]>(() => rows.value.map((seller: any) => ({ label: seller.name, value: seller.id })));
const shopOptions = computed<SelectOption[]>(() =>
  Array.from(new Map(rows.value.map((seller: any) => [seller.shop_name, { label: seller.shop_name, value: seller.shop_name }])).values()),
);

async function loadPage() {
  loading.value = true;
  try {
    rows.value = await reportsApi.getSellers(filters.value);
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
      <h1 class="mt-3 text-[32px] font-bold tracking-[-0.05em]">Продавцы</h1>
    </div>

    <ReportFilterBar v-model="filters" :shops="shopOptions" :sellers="sellerOptions" :loading="loading" @apply="loadPage" @reset="loadPage" />
    <SellerStatsTable :rows="rows" :loading="loading" />
  </section>
</template>
