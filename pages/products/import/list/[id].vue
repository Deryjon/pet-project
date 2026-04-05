<template>
  <section v-if="importRecord" class="space-y-8">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <button
          type="button"
          class="inline-flex cursor-pointer items-center gap-2 rounded-[14px] bg-[#363636] px-4 py-3 text-[14px] font-bold text-white transition-colors duration-200 hover:bg-[#4a4a4a]"
          @click="goBack"
        >
          <Icon name="heroicons:arrow-left-20-solid" class="h-5 w-5 text-[#4993dd]" />
          Назад к импортам
        </button>

        <p class="mt-5 text-[12px] font-bold uppercase tracking-[0.24em] text-[#7ba9d8]">
          Import Details
        </p>
        <h1 class="mt-2 text-[34px] font-bold text-white">{{ importRecord.name }}</h1>
        <p class="mt-2 text-[15px] text-[#bdbdbd]">
          {{ importRecord.importType }} · {{ importRecord.store }} · {{ importRecord.createdAt }}
        </p>
      </div>

      <div class="rounded-[22px] border border-white/8 bg-[#2c2c2c] px-5 py-4 text-right">
        <p class="text-[12px] font-bold uppercase tracking-[0.18em] text-[#9ea6b2]">
          Статус импорта
        </p>
        <p class="mt-2 text-[18px] font-bold text-white">{{ importRecord.status }}</p>
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div
        v-for="stat in summaryStats"
        :key="stat.label"
        class="rounded-[24px] bg-[#2b2b2b] p-5"
      >
        <p class="text-[13px] font-bold text-[#a7a7a7]">{{ stat.label }}</p>
        <p class="mt-3 text-[28px] font-bold text-white">{{ stat.value }}</p>
      </div>
    </div>

    <section class="rounded-[28px] bg-[#2b2b2b] p-6">
      <div class="flex flex-col gap-2 border-b border-white/8 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-[12px] font-bold uppercase tracking-[0.22em] text-[#7ba9d8]">
            Позиции импорта
          </p>
          <h2 class="mt-2 text-[24px] font-bold text-white">Артикул, баркод, наименование</h2>
        </div>

        <div class="text-[14px] text-[#bdbdbd]">
          Показано {{ paginatedItems.length }} из {{ importRecord.items.length }}
        </div>
      </div>

      <div class="mt-6 overflow-x-auto">
        <table class="min-w-full border-separate border-spacing-y-2 text-left">
          <thead>
            <tr class="text-[13px] uppercase tracking-[0.12em] text-[#8f8f8f]">
              <th class="px-4 py-3">Наименование</th>
              <th class="px-4 py-3">Артикул</th>
              <th class="px-4 py-3">Баркод</th>
              <th class="px-4 py-3">Кол-во</th>
              <th class="px-4 py-3">Цена поставки</th>
              <th class="px-4 py-3">Цена продажи</th>
              <th class="px-4 py-3">Категория</th>
              <th class="px-4 py-3">Бренд</th>
              <th class="px-4 py-3">Единица измерения</th>
              <th class="px-4 py-3">Оптовая цена</th>
              <th class="px-4 py-3">Поставщик</th>
              <th class="px-4 py-3">Описание</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="item in paginatedItems"
              :key="`${item.article}-${item.barcode}`"
            >
              <td class="rounded-l-[18px] bg-[#363636] px-4 py-4 text-[15px] font-bold text-white">
                {{ item.name }}
              </td>
              <td class="bg-[#363636] px-4 py-4 text-[15px] text-white">{{ item.article }}</td>
              <td class="bg-[#363636] px-4 py-4 text-[15px] text-white">{{ item.barcode }}</td>
              <td class="bg-[#363636] px-4 py-4 text-[15px] text-white">{{ item.quantity }} шт</td>
              <td class="bg-[#363636] px-4 py-4 text-[15px] text-white">
                {{ formatCompactMoney(item.supplyPrice) }}
              </td>
              <td class="bg-[#363636] px-4 py-4 text-[15px] text-white">
                {{ formatCompactMoney(item.retailPrice) }}
              </td>
              <td class="bg-[#363636] px-4 py-4 text-[15px] text-white">{{ item.category }}</td>
              <td class="bg-[#363636] px-4 py-4 text-[15px] text-white">{{ item.brand }}</td>
              <td class="bg-[#363636] px-4 py-4 text-[15px] text-white">{{ item.unit }}</td>
              <td class="bg-[#363636] px-4 py-4 text-[15px] text-white">
                {{ item.wholesalePrice ? formatCompactMoney(item.wholesalePrice) : "-" }}
              </td>
              <td class="bg-[#363636] px-4 py-4 text-[15px] text-white">
                {{ item.supplier }}
              </td>
              <td class="rounded-r-[18px] bg-[#363636] px-4 py-4 text-[15px] text-white">
                {{ item.description || "-" }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>

  <section v-else class="rounded-[28px] bg-[#2b2b2b] p-8 text-white">
    <h1 class="text-[28px] font-bold">Импорт не найден</h1>
    <p class="mt-3 text-[#bdbdbd]">Проверьте ID импорта или вернитесь к списку.</p>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useHead, useRoute, useRouter } from "#imports";
import { useImportDataTableStore } from "@/store/DataTables/importDataTableStore";

const route = useRoute();
const router = useRouter();
const importStore = useImportDataTableStore();

const detailId = computed(() => String(route.params.id ?? ""));
const limit = computed(() => {
  const value = Number.parseInt(String(route.query.limit ?? "5"), 10);
  return Number.isFinite(value) && value > 0 ? value : 5;
});
const page = computed(() => {
  const value = Number.parseInt(String(route.query.page ?? "1"), 10);
  return Number.isFinite(value) && value > 0 ? value : 1;
});

const importRecord = computed(() => importStore.getImportByDetailId(detailId.value));

const paginatedItems = computed(() => {
  if (!importRecord.value) {
    return [];
  }

  const start = (page.value - 1) * limit.value;
  return importRecord.value.items.slice(start, start + limit.value);
});

const summaryStats = computed(() => {
  if (!importRecord.value) {
    return [];
  }

  return [
    { label: "Наименований", value: `${importRecord.value.items.length} шт` },
    { label: "Товарных единиц", value: `${importRecord.value.qty} ед.` },
    { label: "Сумма по цене поставки", value: formatSummaryMoney(importRecord.value.purchaseTotal) },
    { label: "Сумма по цене продажи", value: formatSummaryMoney(importRecord.value.total) },
  ];
});

const formatCompactMoney = (value: number) =>
  `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value)} UZS`;

const formatSummaryMoney = (value: number) => {
  if (value >= 1000 && value % 1000 === 0) {
    return `${new Intl.NumberFormat("ru-RU", {
      maximumFractionDigits: 0,
    }).format(value / 1000)} тысяч UZS`;
  }

  return formatCompactMoney(value);
};

const goBack = () => router.push("/products/import");

useHead({
  title: computed(() =>
    importRecord.value ? `${importRecord.value.name} | Импорт` : "Импорт | Детали"
  ),
});
</script>
