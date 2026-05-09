<script setup lang="ts">
import type { SellerSalaryReport } from "~/composables/useReportsApi";

const props = defineProps<{
  report: SellerSalaryReport | null;
}>();

function formatMoney(value: number) {
  return `${Intl.NumberFormat("ru-RU").format(Math.round(value || 0))} UZS`;
}
</script>

<template>
  <section class="rounded-[28px] border border-white/10 bg-[#202020] p-5 shadow-[0_18px_50px_rgba(2,6,23,0.18)]">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#7fb0ff]">Расшифровка</p>
        <h3 class="mt-2 text-[20px] font-semibold text-white">Бонус по товарам</h3>
      </div>
    </div>

    <div v-if="report" class="mt-5 grid gap-4 md:grid-cols-4">
      <div class="rounded-[22px] border border-white/10 bg-white/5 p-4">
        <div class="text-xs uppercase tracking-[0.12em] text-[#9a9a9a]">Фикс</div>
        <div class="mt-2 text-lg font-semibold text-white">{{ formatMoney(report.fixed_salary) }}</div>
      </div>
      <div class="rounded-[22px] border border-white/10 bg-white/5 p-4">
        <div class="text-xs uppercase tracking-[0.12em] text-[#9a9a9a]">Валовая прибыль</div>
        <div class="mt-2 text-lg font-semibold text-white">{{ formatMoney(report.gross_profit) }}</div>
      </div>
      <div class="rounded-[22px] border border-white/10 bg-white/5 p-4">
        <div class="text-xs uppercase tracking-[0.12em] text-[#9a9a9a]">Бонус</div>
        <div class="mt-2 text-lg font-semibold text-emerald-300">{{ formatMoney(report.bonus_amount) }}</div>
      </div>
      <div class="rounded-[22px] border border-white/10 bg-white/5 p-4">
        <div class="text-xs uppercase tracking-[0.12em] text-[#9a9a9a]">Итоговая зарплата</div>
        <div class="mt-2 text-lg font-semibold text-[#8ebcff]">{{ formatMoney(report.salary_total) }}</div>
      </div>
    </div>

    <div v-if="report?.items?.length" class="mt-5 space-y-3">
      <div v-for="item in report.items" :key="`${item.sale_id}-${item.product_name}`" class="rounded-[22px] border border-white/8 bg-[#262626] p-4">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div class="font-semibold text-white">{{ item.product_name }}</div>
            <div class="mt-1 text-sm text-[#9a9a9a]">Продажа #{{ item.sale_id }}</div>
          </div>
          <div class="grid gap-2 text-right text-sm text-white sm:grid-cols-4 sm:gap-6">
            <div><span class="block text-[#8f8f8f]">Финал</span>{{ formatMoney(item.final_price) }}</div>
            <div><span class="block text-[#8f8f8f]">Себестоимость</span>{{ formatMoney(item.supply_price_at_sale) }}</div>
            <div><span class="block text-[#8f8f8f]">Прибыль</span>{{ formatMoney(item.profit_at_sale) }}</div>
            <div><span class="block text-[#8f8f8f]">Бонус</span><span class="text-emerald-300">{{ formatMoney(item.seller_bonus_amount) }}</span></div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="mt-5 rounded-[22px] border border-dashed border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-[#9a9a9a]">
      Нет данных для расшифровки зарплаты
    </div>
  </section>
</template>
