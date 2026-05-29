<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useHead } from "#imports";
import { useRouter } from "vue-router";
import type { MeasurementUnit } from "~/types/product-detail";
import { useMeasurementUnits } from "~/composables/useMeasurementUnits";
import { useUserStore } from "~/store/useUserStore";
import MeasurementUnitModal from "@/components/settings/MeasurementUnitModal.vue";

useHead({ title: "Товары | Настройки | Konkurent" });

const router = useRouter();
const userStore = useUserStore();
const toast = useToast();
const { fetchCompanyMeasurementUnits } = useMeasurementUnits();

const loading = ref(false);
const modalOpen = ref(false);
const units = ref<MeasurementUnit[]>([]);

const companyId = computed(() =>
  String(
    userStore.userState.companyId ||
      userStore.userState.company?.companyId ||
      userStore.userState.company?.id ||
      "",
  ).trim(),
);

const stats = computed(() => ({
  total: units.value.length,
  defaults: units.value.filter((unit) => unit.is_default).length,
  editable: units.value.filter((unit) => unit.is_editable).length,
}));

async function loadUnits() {
  if (!companyId.value) {
    units.value = [];
    return;
  }

  loading.value = true;
  try {
    units.value = await fetchCompanyMeasurementUnits({
      companyId: companyId.value,
      limit: 1000,
      page: 1,
    });
  } catch (error: any) {
    units.value = [];
    toast.add({
      title: "Не удалось загрузить единицы измерения",
      description: error?.message || "Ошибка загрузки",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
}

function handleCreated(unit: MeasurementUnit | null) {
  void loadUnits().then(() => {
    if (unit) {
      toast.add({
        title: `Выбрана единица: ${unit.name}`,
        description: `${unit.short_name} / ${unit.precision}`,
        color: "success",
      });
    }
  });
}

onMounted(() => {
  void loadUnits();
});
</script>

<template>
  <section class="products-settings-page text-white">
    <header class="page-header">
      <div class="page-headline">
        <button type="button" class="icon-shell" @click="router.back()">
          <Icon name="heroicons:arrow-left-20-solid" class="h-5 w-5" />
        </button>

        <div>
          <p class="page-kicker">Настройки / Товары</p>
          <h1 class="page-title">Единицы измерения</h1>
          <p class="page-copy">
            Список единиц измерения вашей компании. Эти значения используются в карточке товара.
          </p>
        </div>
      </div>

      <UButton
        color="primary"
        variant="solid"
        class="rounded-[18px] bg-[#1f78ff] px-5 py-3 text-white hover:bg-[#2e84ff]"
        @click="modalOpen = true"
      >
        <Icon name="heroicons:plus-20-solid" class="h-5 w-5" />
        <span>Добавить</span>
      </UButton>
    </header>

    <section class="stats-grid">
      <article class="stat-card">
        <span class="stat-label">Всего</span>
        <span class="stat-value">{{ stats.total }}</span>
      </article>
      <article class="stat-card">
        <span class="stat-label">По умолчанию</span>
        <span class="stat-value">{{ stats.defaults }}</span>
      </article>
      <article class="stat-card">
        <span class="stat-label">Редактируемые</span>
        <span class="stat-value">{{ stats.editable }}</span>
      </article>
    </section>

    <section class="table-card">
      <div class="table-head">
        <span>Название</span>
        <span>Сокращение</span>
        <span>Точность</span>
        <span>Статус</span>
      </div>

      <div v-if="loading" class="table-empty">
        <Icon name="heroicons:arrow-path" class="h-5 w-5 animate-spin" />
        <span>Загружаем единицы измерения...</span>
      </div>

      <div v-else-if="!units.length" class="table-empty">
        <Icon name="heroicons:scale" class="h-5 w-5" />
        <span>Список единиц измерения пока пуст</span>
      </div>

      <div v-else class="table-body">
        <article v-for="unit in units" :key="unit.id" class="table-row">
          <div class="title-stack">
            <span class="title-text">{{ unit.name }}</span>
            <span class="title-id">{{ unit.id }}</span>
          </div>
          <div>{{ unit.short_name }}</div>
          <div>{{ unit.precision }}</div>
          <div class="flex flex-wrap gap-2">
            <span v-if="unit.is_default" class="badge badge-default">По умолчанию</span>
            <span v-if="unit.is_editable" class="badge badge-editable">Можно менять</span>
            <span v-else class="badge badge-system">Системная</span>
          </div>
        </article>
      </div>
    </section>

    <MeasurementUnitModal
      v-model:open="modalOpen"
      :company-id="companyId"
      @created="handleCreated"
    />
  </section>
</template>

<style scoped>
.products-settings-page {
  display: grid;
  gap: 24px;
  color: white;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.page-headline {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.icon-shell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 16px;
  background: #404040;
  color: #f5f7fb;
  transition: background 0.2s ease, transform 0.2s ease;
}

.icon-shell:hover {
  background: #505050;
  transform: translateY(-1px);
}

.page-kicker {
  color: #79b7ff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.page-title {
  margin-top: 6px;
  font-size: 34px;
  font-weight: 700;
  line-height: 1.05;
}

.page-copy {
  margin-top: 10px;
  color: #bdbdbd;
  font-size: 14px;
  line-height: 1.6;
}

.stats-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.stat-card {
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #262626;
  padding: 18px;
}

.stat-label {
  display: block;
  color: #9b9b9b;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.stat-value {
  display: block;
  margin-top: 10px;
  font-size: 28px;
  font-weight: 700;
}

.table-card {
  overflow: hidden;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #262626;
}

.table-head,
.table-row {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) 160px 140px minmax(0, 1fr);
  gap: 16px;
  align-items: center;
}

.table-head {
  padding: 18px 22px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  color: #9b9b9b;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.table-body {
  padding: 8px;
}

.table-row {
  min-height: 84px;
  margin-bottom: 8px;
  border-radius: 16px;
  background: #1f1f1f;
  padding: 0 14px;
}

.table-row:last-child {
  margin-bottom: 0;
}

.title-stack {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.title-text {
  color: #8ec3ff;
  font-size: 15px;
  font-weight: 700;
}

.title-id {
  color: #9b9b9b;
  font-size: 12px;
  line-height: 1.4;
  word-break: break-all;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 7px 12px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.badge-default {
  background: rgba(31, 120, 255, 0.18);
  color: #8ec3ff;
}

.badge-editable {
  background: rgba(72, 187, 120, 0.18);
  color: #9fe3b3;
}

.badge-system {
  background: rgba(255, 255, 255, 0.08);
  color: #d8d8d8;
}

.table-empty {
  display: flex;
  min-height: 220px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #bdbdbd;
}

@media (max-width: 900px) {
  .page-header {
    flex-direction: column;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .table-head {
    display: none;
  }

  .table-row {
    grid-template-columns: 1fr;
    padding: 16px;
    gap: 12px;
  }
}
</style>
