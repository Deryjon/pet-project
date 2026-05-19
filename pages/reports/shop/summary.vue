<script setup lang="ts">
import { useHead, useRouter } from "#imports";

useHead({ title: "Сводный отчет | Konkurent" });

const router = useRouter();

const selectedDate = ref("2026-05-19");
const selectedBranch = ref("all");
const activeTab = ref<"dashboard" | "table">("dashboard");

const branches = [
  { value: "all", label: "Все магазины" },
  { value: "globus", label: "Globus Mall" },
  { value: "samarqand", label: "Samarqand Darvoza" },
];

const tabs = [
  { value: "dashboard", label: "Дашбоард", icon: "heroicons:squares-2x2" },
  { value: "table", label: "Таблица", icon: "heroicons:table-cells" },
] as const;

const kpis = [
  { label: "Чистая выручка", value: "1 650 000 " },
  { label: "Валовая прибыль", value: "1 271 088 " },
  { label: "Средний чек", value: "75 000 " },
  { label: "Ср. кол-во продуктов", value: "1.36 ед." },
  { label: "Средняя скидка", value: "12.47 %" },
  { label: "Средняя наценка", value: "4.35 x" },
  { label: "Продано продуктов", value: "30 ед." },
  { label: "Возвращено продуктов", value: "0 ед." },
];

const salesByShop = [
  { shop: "Samarqand Darvoza", value: "525 000 UZS" },
  { shop: "Globus Mall", value: "1 360 000 UZS" },
];

const salesMetrics = [
  {
    shop: "Globus Mall",
    net: "1 200 000 UZS",
    profit: "914 231 UZS",
    discount: "11.76 %",
  },
  {
    shop: "Samarqand Darvoza",
    net: "450 000 UZS",
    profit: "356 857 UZS",
    discount: "14.29 %",
  },
  {
    shop: "Всего",
    net: "1 650 000 UZS",
    profit: "1 271 088 UZS",
    discount: "12.47 %",
    total: true,
  },
];

const productStats = [
  { shop: "Globus Mall", value: "14 шт" },
  { shop: "Samarqand Darvoza", value: "8 шт" },
];

const topProducts = [
  ["Steklo Obichniy", "3 шт"],
  ["Bron China", "3 шт"],
  ["Green Lion Bez Korobka", "3 шт"],
  ["Iphone Mix Case", "2 шт"],
  ["USB TYPE-C Data 2", "2 шт"],
  ["Samuray Tonirovka", "2 шт"],
  ["Samsung Type-c to Type-c 8A", "2 шт"],
  ["Iphone Mix New Case", "2 шт"],
  ["Airpods Vacuum", "1 шт"],
  ["Iphone Mix China", "1 шт"],
];

const topCategories = [
  ["стекло", "7 шт"],
  ["Отсутствует", "5 шт"],
  ["чехлы", "4 шт"],
  ["зарядное устройство", "2 шт"],
];

const customerRows = [
  { shop: "Globus Mall", new: "0 шт | 0%", returning: "0 шт | 0%" },
  { shop: "Samarqand Darvoza", new: "0 шт | 0%", returning: "0 шт | 0%" },
  { shop: "Всего", new: "0 шт | 0%", returning: "0 шт | 0%", total: true },
];

const sellers = [
  {
    name: "Sardor Obidjanov",
    sales: "855 000 UZS",
    avg: "77 727 UZS",
    products: "1.27 шт",
  },
  {
    name: "Obid Yusupov",
    sales: "370 000 UZS",
    avg: "92 500 UZS",
    products: "1.75 шт",
  },
  {
    name: "Iskandarjon Yusupov",
    sales: "345 000 UZS",
    avg: "57 500 UZS",
    products: "1.33 шт",
  },
  {
    name: "Islomjon Yusupov",
    sales: "80 000 UZS",
    avg: "80 000 UZS",
    products: "1 шт",
  },
];

const detailRows = [
  {
    date: "2026-05-19",
    shop: "Samarqand Darvoza",
    gross: "525 000 UZS",
    net: "450 000 UZS",
    profit: "356 857 UZS",
  },
  {
    date: "2026-05-19",
    shop: "Globus Mall",
    gross: "1 360 000 UZS",
    net: "1 200 000 UZS",
    profit: "914 231 UZS",
  },
  {
    date: "ВСЕГО",
    shop: "-",
    gross: "1 885 000 UZS",
    net: "1 650 000 UZS",
    profit: "1 271 088 UZS",
    total: true,
  },
];

const selectedBranchLabel = computed(
  () =>
    branches.find((branch) => branch.value === selectedBranch.value)?.label ||
    "Все магазины",
);
const periodLabel = computed(() => "19.05.2026");
const scopeLabel = computed(() =>
  selectedBranch.value === "all"
    ? "Globus Mall, Samarqand Darvoza"
    : selectedBranchLabel.value,
);

function goBack() {
  router.back();
}
</script>

<template>
  <section class="space-y-5 text-white">
    <header class="space-y-4">
      <div class="flex gap-2 items-center">
        <button
          type="button"
          aria-label="Назад"
          class="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[#232323] text-white transition hover:border-white/20 hover:bg-[#2d2d2d]"
          @click="goBack"
        >
          <Icon name="heroicons:arrow-left" class="h-5 w-5" />
        </button>

        <h1 class="text-[32px] font-bold tracking-[-0.04em] flex gap-2">
          <span class="text-[#bdbdbd]">Отчет</span>Сводный
        </h1>
      </div>

      <div class="flex justify-between">
        <AppDatePicker
          v-model="selectedDate"
          placeholder="Выберите дату"
          class="w-[200px]"
        />

        <label class="relative">
          <span class="sr-only">Филиал</span>
          <select
            v-model="selectedBranch"
            class="h-[54px] appearance-none rounded-[18px] border border-white/10 bg-white/5 px-4 pr-11 text-[15px] font-semibold text-white outline-none transition hover:bg-white/10 focus:border-[#1f78ff]"
          >
            <option
              v-for="branch in branches"
              :key="branch.value"
              :value="branch.value"
              class="bg-[#202020] text-white"
            >
              {{ branch.label }}
            </option>
          </select>
          <Icon
            name="heroicons:building-storefront"
            class="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-sky-300"
          />
        </label>
      </div>
    </header>

    <div
      class="flex justify-between items-center  rounded-[18px] border border-white/10 bg-[#202020] p-1 w-full"
    >
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        class="w-1/2 h-13 flex justify-center items-center gap-2 rounded-[14px] px-4 text-[16px] font-semibold transition"
        :class="
          activeTab === tab.value
            ? 'bg-[#1f78ff] text-white'
            : 'text-slate-300 hover:bg-white/10 hover:text-white'
        "
        @click="activeTab = tab.value"
      >
        <Icon :name="tab.icon" class="h-4 w-4" />
        {{ tab.label }}
      </button>
    </div>

    <div v-if="activeTab === 'dashboard'" class="space-y-5">
      <section class="rounded-[28px] border border-white/10 bg-[#202020] p-5">
        <h2 class="text-[22px] font-bold tracking-[-0.03em]">
          Общая статистика
        </h2>
        <div class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div
            v-for="kpi in kpis"
            :key="kpi.label"
            class="rounded-[20px] border border-white/10 bg-white/[0.04] p-4"
          >
            <p class="text-[13px] text-slate-400">{{ kpi.label }}</p>
            <p class="mt-2 text-[22px] font-bold tracking-[-0.03em] text-[#1f78ff]">
              {{ kpi.value }} UZS
            </p>
          </div>
        </div>
      </section>

      <div class="grid gap-5 xl:grid-cols-2">
        <section class="rounded-[28px] border border-white/10 bg-[#202020] p-5">
          <p class="text-sm text-slate-400">
            {{ periodLabel }} • {{ selectedBranchLabel }}
          </p>
          <h2 class="mt-2 text-[22px] font-bold tracking-[-0.03em]">
            Статистика продаж
          </h2>
          <div
            class="mt-5 rounded-[22px] border border-white/10 bg-[#181818] p-4"
          >
            <div class="flex items-end justify-between gap-4">
              <div>
                <p class="text-sm text-slate-400">Выручка</p>
                <p class="text-lg font-semibold">по дням</p>
              </div>
              <div class="flex h-[150px] flex-1 items-end justify-end gap-5">
                <div
                  class="flex h-full flex-col justify-between text-right text-xs text-slate-500"
                >
                  <span>1 M</span>
                  <span>700 K</span>
                  <span>350 K</span>
                  <span>0</span>
                </div>
                <div class="flex h-full w-16 flex-col justify-end gap-2">
                  <div
                    class="h-[118px] rounded-t-[18px] bg-[linear-gradient(180deg,#5bb4ff,#1f78ff)]"
                  />
                  <div class="text-center text-xs text-slate-400">
                    <div>вт</div>
                    <div>19.05</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-5 space-y-3">
            <div class="grid grid-cols-[1fr_auto] text-sm text-slate-400">
              <span>Магазин</span>
              <span>Выбранный период {{ periodLabel }}</span>
            </div>
            <div
              v-for="row in salesByShop"
              :key="row.shop"
              class="grid grid-cols-[1fr_auto] gap-4 rounded-[18px] bg-white/[0.04] px-4 py-3"
            >
              <span class="font-semibold">{{ row.shop }}</span>
              <span>{{ row.value }}</span>
            </div>
            <div
              class="grid grid-cols-[1fr_auto] gap-4 rounded-[18px] border border-[#1f78ff]/40 bg-[#1f78ff]/10 px-4 py-3 font-bold"
            >
              <span>ОБЩЕЕ КОЛ-ВО</span>
              <span>1 885 000 UZS</span>
            </div>
          </div>
        </section>

        <section
          class="overflow-hidden rounded-[28px] border border-white/10 bg-[#202020]"
        >
          <div class="p-5">
            <p class="text-sm text-slate-400">
              {{ periodLabel }} • {{ scopeLabel }}
            </p>
            <h2 class="mt-2 text-[22px] font-bold tracking-[-0.03em]">
              Показатели продаж
            </h2>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead class="bg-white/[0.04] text-slate-400">
                <tr>
                  <th class="px-5 py-3 text-left">Магазин</th>
                  <th class="px-5 py-3 text-right">Чистая выручка</th>
                  <th class="px-5 py-3 text-right">Валовая прибыль</th>
                  <th class="px-5 py-3 text-right">Средняя скидка</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in salesMetrics"
                  :key="row.shop"
                  class="border-t border-white/5"
                  :class="row.total ? 'bg-white/[0.05] font-bold' : ''"
                >
                  <td class="px-5 py-4">{{ row.shop }}</td>
                  <td class="px-5 py-4 text-right">{{ row.net }}</td>
                  <td class="px-5 py-4 text-right">{{ row.profit }}</td>
                  <td class="px-5 py-4 text-right">{{ row.discount }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div class="grid gap-5 xl:grid-cols-2">
        <section class="rounded-[28px] border border-white/10 bg-[#202020] p-5">
          <p class="text-sm text-slate-400">
            {{ periodLabel }} • {{ selectedBranchLabel }}
          </p>
          <h2 class="mt-2 text-[22px] font-bold tracking-[-0.03em]">
            Статистика продуктов
          </h2>
          <div
            class="mt-5 rounded-[22px] border border-white/10 bg-[#181818] p-4"
          >
            <p class="text-sm text-slate-400">Продано со скидкой</p>
            <p class="text-lg font-semibold">по дням</p>
            <div class="mt-4 flex h-[130px] items-end justify-end gap-5">
              <div
                class="flex h-full flex-col justify-between text-right text-xs text-slate-500"
              >
                <span>16</span><span>12</span><span>8</span><span>4</span
                ><span>0</span>
              </div>
              <div class="flex h-full w-16 flex-col justify-end gap-2">
                <div
                  class="h-[96px] rounded-t-[18px] bg-[linear-gradient(180deg,#86efac,#22c55e)]"
                />
                <div class="text-center text-xs text-slate-400">
                  <div>вт</div>
                  <div>19.05</div>
                </div>
              </div>
            </div>
          </div>
          <div class="mt-5 space-y-3">
            <div
              v-for="row in productStats"
              :key="row.shop"
              class="grid grid-cols-[1fr_auto] gap-4 rounded-[18px] bg-white/[0.04] px-4 py-3"
            >
              <span class="font-semibold">{{ row.shop }}</span>
              <span>{{ row.value }}</span>
            </div>
            <div
              class="grid grid-cols-[1fr_auto] gap-4 rounded-[18px] border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 font-bold"
            >
              <span>ОБЩЕЕ КОЛ-ВО</span>
              <span>22 шт</span>
            </div>
          </div>
        </section>

        <section class="rounded-[28px] border border-white/10 bg-[#202020] p-5">
          <p class="text-sm text-slate-400">
            {{ periodLabel }} • {{ scopeLabel }}
          </p>
          <h2 class="mt-2 text-[22px] font-bold tracking-[-0.03em]">
            Топ-10 продуктов
          </h2>
          <div class="mt-4 space-y-2">
            <div class="grid grid-cols-[1fr_auto] px-3 text-sm text-slate-400">
              <span>Наименование</span>
              <span>Продажи</span>
            </div>
            <div
              v-for="[name, amount] in topProducts"
              :key="name"
              class="grid grid-cols-[1fr_auto] gap-4 rounded-[16px] bg-white/[0.04] px-3 py-2.5"
            >
              <span>{{ name }}</span>
              <span class="font-semibold">{{ amount }}</span>
            </div>
          </div>
        </section>
      </div>

      <div class="grid gap-5 xl:grid-cols-2">
        <section class="rounded-[28px] border border-white/10 bg-[#202020] p-5">
          <p class="text-sm text-slate-400">
            {{ periodLabel }} • {{ scopeLabel }}
          </p>
          <h2 class="mt-2 text-[22px] font-bold tracking-[-0.03em]">
            Топ-10 категорий
          </h2>
          <div class="mt-4 space-y-2">
            <div class="grid grid-cols-[1fr_auto] px-3 text-sm text-slate-400">
              <span>name</span>
              <span>Продажи</span>
            </div>
            <div
              v-for="[name, amount] in topCategories"
              :key="name"
              class="grid grid-cols-[1fr_auto] gap-4 rounded-[16px] bg-white/[0.04] px-3 py-3"
            >
              <span>{{ name }}</span>
              <span class="font-semibold">{{ amount }}</span>
            </div>
          </div>
        </section>

        <section
          class="overflow-hidden rounded-[28px] border border-white/10 bg-[#202020]"
        >
          <div class="p-5">
            <p class="text-sm text-slate-400">
              {{ periodLabel }} • {{ scopeLabel }}
            </p>
            <h2 class="mt-2 text-[22px] font-bold tracking-[-0.03em]">
              Новые и возвращающиеся клиенты
            </h2>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead class="bg-white/[0.04] text-slate-400">
                <tr>
                  <th class="px-5 py-3 text-left">Магазин</th>
                  <th class="px-5 py-3 text-right">Новые</th>
                  <th class="px-5 py-3 text-right">Возвращающиеся</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in customerRows"
                  :key="row.shop"
                  class="border-t border-white/5"
                  :class="row.total ? 'bg-white/[0.05] font-bold' : ''"
                >
                  <td class="px-5 py-4">{{ row.shop }}</td>
                  <td class="px-5 py-4 text-right">{{ row.new }}</td>
                  <td class="px-5 py-4 text-right">{{ row.returning }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div class="grid gap-5 xl:grid-cols-2">
        <section class="rounded-[28px] border border-white/10 bg-[#202020] p-5">
          <p class="text-sm text-slate-400">
            {{ periodLabel }} • {{ scopeLabel }}
          </p>
          <h2 class="mt-2 text-[22px] font-bold tracking-[-0.03em]">
            Топ клиент
          </h2>
          <div
            class="mt-5 rounded-[22px] border border-dashed border-white/10 bg-white/[0.03] p-8 text-center"
          >
            <p class="text-lg font-bold">Нет данных</p>
            <p class="mt-2 text-sm text-slate-400">
              Начните продавать продукты в системе, чтобы просматривать отчеты
            </p>
          </div>
        </section>

        <section class="rounded-[28px] border border-white/10 bg-[#202020] p-5">
          <p class="text-sm text-slate-400">
            {{ periodLabel }} • {{ scopeLabel }}
          </p>
          <h2 class="mt-2 text-[22px] font-bold tracking-[-0.03em]">
            Топ транзакция
          </h2>
          <div
            class="mt-5 rounded-[22px] border border-dashed border-white/10 bg-white/[0.03] p-8 text-center"
          >
            <p class="text-lg font-bold">Нет данных</p>
            <p class="mt-2 text-sm text-slate-400">
              Начните продавать продукты в системе, чтобы просматривать отчеты
            </p>
          </div>
        </section>
      </div>

      <section class="rounded-[28px] border border-white/10 bg-[#202020] p-5">
        <p class="text-sm text-slate-400">
          {{ periodLabel }} • {{ scopeLabel }}
        </p>
        <h2 class="mt-2 text-[22px] font-bold tracking-[-0.03em]">
          Статистика продавцов
        </h2>
        <div class="mt-4 space-y-2">
          <div
            v-for="seller in sellers"
            :key="seller.name"
            class="grid gap-3 rounded-[18px] bg-white/[0.04] px-4 py-3 md:grid-cols-[1fr_auto_auto_auto]"
          >
            <span class="font-semibold">{{ seller.name }}</span>
            <span>{{ seller.sales }}</span>
            <span>{{ seller.avg }}</span>
            <span>{{ seller.products }}</span>
          </div>
        </div>
      </section>
    </div>

    <section
      v-else
      class="overflow-hidden rounded-[28px] border border-white/10 bg-[#202020]"
    >
      <div
        class="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 p-5"
      >
        <div>
          <p class="text-sm text-slate-400">Детализация:</p>
          <h2 class="mt-2 text-[22px] font-bold tracking-[-0.03em]">по дням</h2>
        </div>
        <div class="flex flex-wrap gap-3">
          <select
            class="h-11 rounded-[16px] border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white outline-none"
          >
            <option class="bg-[#202020]">Тип цены продажи</option>
            <option class="bg-[#202020]">Все типы</option>
          </select>
          <select
            v-model="selectedBranch"
            class="h-11 rounded-[16px] border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white outline-none"
          >
            <option
              v-for="branch in branches"
              :key="branch.value"
              :value="branch.value"
              class="bg-[#202020]"
            >
              {{ branch.label }}
            </option>
          </select>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-white/[0.04] text-slate-400">
            <tr>
              <th class="px-5 py-3 text-left">Дата</th>
              <th class="px-5 py-3 text-left">Магазин</th>
              <th class="px-5 py-3 text-right">Общая выручка</th>
              <th class="px-5 py-3 text-right">Чистая выручка</th>
              <th class="px-5 py-3 text-right">Валовая прибыль</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in detailRows"
              :key="`${row.date}-${row.shop}`"
              class="border-t border-white/5"
              :class="row.total ? 'bg-white/[0.05] font-bold' : ''"
            >
              <td class="px-5 py-4">{{ row.date }}</td>
              <td class="px-5 py-4">{{ row.shop }}</td>
              <td class="px-5 py-4 text-right">{{ row.gross }}</td>
              <td class="px-5 py-4 text-right">{{ row.net }}</td>
              <td class="px-5 py-4 text-right">{{ row.profit }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>
