<script setup lang="ts">
import { useHead } from "#imports";
import ReportKpiCard from "~/components/reports/ReportKpiCard.vue";
import ReportChartCard from "~/components/reports/ReportChartCard.vue";
import ProductStatsTable from "~/components/reports/ProductStatsTable.vue";
import SellerSalaryCard from "~/components/reports/SellerSalaryCard.vue";
import SellerSalaryBreakdown from "~/components/reports/SellerSalaryBreakdown.vue";
import { useReportsApi } from "~/composables/useReportsApi";
import { useSalarySettingsApi, type SellerSalarySettings } from "~/composables/useSalarySettingsApi";

const route = useRoute();
const { can } = useAccessControl();
const reportsApi = useReportsApi();
const salaryApi = useSalarySettingsApi();

const sellerId = computed(() => String(route.params.id || ""));
const loading = ref(false);
const salarySaving = ref(false);
const details = ref<any | null>(null);
const salarySettings = ref<SellerSalarySettings>({
  fixedSalary: 0,
  salaryPercent: 0,
  calculationType: "FIXED_PLUS_PROFIT",
  bonusEnabled: true,
  isActive: true,
});

const canManageSalary = computed(() => can("salary.manage"));
const canViewSalary = computed(() => canManageSalary.value || can("salary.view"));
const toast = useToast();

useHead(() => ({ title: `${details.value?.name || "Продавец"} | Отчеты | Konkurent` }));

async function loadPage() {
  if (!sellerId.value) return;
  loading.value = true;
  try {
    const [detailsData, settingsData, salaryReport] = await Promise.all([
      reportsApi.getSellerDetails(sellerId.value),
      canViewSalary.value ? salaryApi.getSalarySettings(sellerId.value).catch(() => salarySettings.value) : Promise.resolve(salarySettings.value),
      canViewSalary.value ? salaryApi.getSalaryReport(sellerId.value).catch(() => null) : Promise.resolve(null),
    ]);
    details.value = {
      ...detailsData,
      salary_report: salaryReport || detailsData.salary_report,
    };
    salarySettings.value = settingsData;
  } finally {
    loading.value = false;
  }
}

async function saveSalarySettings() {
  if (!canManageSalary.value || !sellerId.value) return;
  salarySaving.value = true;
  try {
    salarySettings.value = await salaryApi.updateSalarySettings(sellerId.value, salarySettings.value);
    toast.add({ title: "Настройки зарплаты сохранены", color: "success" });
    await loadPage();
  } catch (error: any) {
    toast.add({ title: "Не удалось сохранить настройки зарплаты", description: error?.data?.message || error?.message || undefined, color: "error" });
  } finally {
    salarySaving.value = false;
  }
}

onMounted(loadPage);
watch(sellerId, loadPage);
</script>

<template>
  <section class="space-y-6 text-white">
    <div class="rounded-[30px] border border-white/10 bg-[linear-gradient(160deg,rgba(31,120,255,0.18),rgba(15,23,42,0.95))] p-6 shadow-[0_28px_70px_rgba(2,6,23,0.32)]">
      <p class="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#8ec8ff]">Seller Report</p>
      <h1 class="mt-3 text-[32px] font-bold tracking-[-0.05em]">{{ details?.name || "Продавец" }}</h1>
      <p class="mt-3 text-sm text-slate-300">{{ details?.shop_name || "—" }}</p>
    </div>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <ReportKpiCard
        v-for="kpi in details?.summary?.kpis || []"
        :key="kpi.key"
        :title="kpi.label"
        :value="kpi.formattedValue"
        :tone="kpi.tone"
      />
    </div>

    <div class="grid gap-4 xl:grid-cols-2">
      <ReportChartCard title="Продажи по дням" :points="details?.sales_by_day || []" value-suffix=" UZS" />
      <ReportChartCard title="Прибыль по дням" :points="details?.profit_by_day || []" value-suffix=" UZS" />
    </div>

    <ProductStatsTable :rows="details?.sold_products || []" :loading="loading" />

    <div v-if="canViewSalary" class="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
      <SellerSalaryCard v-model="salarySettings" :can-manage="canManageSalary" :loading="loading" :saving="salarySaving" @save="saveSalarySettings" />
      <SellerSalaryBreakdown :report="details?.salary_report || null" />
    </div>
  </section>
</template>
