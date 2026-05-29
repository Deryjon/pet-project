<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import type { MeasurementUnit } from "~/types/product-detail";
import { useMeasurementUnits } from "~/composables/useMeasurementUnits";
import { useProductStore } from "~/store/productStore";
import { useUserStore } from "~/store/useUserStore";
import MeasurementUnitModal from "@/components/settings/MeasurementUnitModal.vue";

const store = useProductStore();
const userStore = useUserStore();
const toast = useToast();
const { fetchCompanyMeasurementUnits } = useMeasurementUnits();

const loading = ref(false);
const modalOpen = ref(false);
const measurementUnits = ref<MeasurementUnit[]>([]);

const companyId = computed(() =>
  String(
    userStore.userState.companyId ||
      userStore.userState.company?.companyId ||
      userStore.userState.company?.id ||
      "",
  ).trim(),
);

const measurementOptions = computed(() =>
  measurementUnits.value.map((unit) => ({
    label: unit.short_name ? `${unit.name} (${unit.short_name})` : unit.name,
    value: unit.id,
  })),
);

const selectedMeasurementUnit = computed(() =>
  measurementUnits.value.find((unit) => unit.id === store.form.measurement_unit_id) || null,
);

const precisionLabel = computed(() => {
  const value = store.form.measurement_unit_precision || "";
  if (!value) return "—";
  return value;
});

function applyMeasurementUnit(unit: MeasurementUnit | null) {
  if (!unit) return;

  store.form.measurement_unit_id = unit.id;
  store.form.measurement_unit_name = unit.name;
  store.form.measurement_unit_short_name = unit.short_name;
  store.form.measurement_unit_precision = unit.precision as any;
  store.form.unit = unit.short_name || unit.name;
}

function syncSelectionFromList() {
  if (selectedMeasurementUnit.value) {
    applyMeasurementUnit(selectedMeasurementUnit.value);
    return;
  }

  const matchedByMeta = measurementUnits.value.find(
    (unit) =>
      unit.name === store.form.measurement_unit_name ||
      unit.short_name === store.form.measurement_unit_short_name,
  );

  if (matchedByMeta) {
    applyMeasurementUnit(matchedByMeta);
    return;
  }

  if (!store.form.measurement_unit_id && measurementUnits.value.length) {
    const defaultUnit =
      measurementUnits.value.find((unit) => unit.is_default) ||
      measurementUnits.value[0] ||
      null;

    applyMeasurementUnit(defaultUnit);
  }
}

async function loadMeasurementUnits() {
  if (!companyId.value) {
    measurementUnits.value = [];
    return;
  }

  loading.value = true;
  try {
    measurementUnits.value = await fetchCompanyMeasurementUnits({
      companyId: companyId.value,
      limit: 1000,
      page: 1,
    });
    syncSelectionFromList();
  } catch (error: any) {
    measurementUnits.value = [];
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
  void loadMeasurementUnits().then(() => {
    if (unit) {
      applyMeasurementUnit(unit);
    }
  });
}

watch(
  () => store.form.measurement_unit_id,
  (value) => {
    if (!value) return;
    const matched = measurementUnits.value.find((unit) => unit.id === value) || null;
    if (matched) {
      applyMeasurementUnit(matched);
    }
  },
);

watch(companyId, () => {
  void loadMeasurementUnits();
}, { immediate: true });

onMounted(() => {
  if (!measurementUnits.value.length) {
    void loadMeasurementUnits();
  }
});
</script>

<template>
  <div class="mt-4">
    <div class="flex items-center justify-between gap-3">
      <label class="font-medium">Единица измерения</label>
      <UButton
        color="neutral"
        variant="soft"
        type="button"
        class="rounded-[12px] bg-[#404040] px-4 py-2 text-white hover:bg-[#505050]"
        @click="modalOpen = true"
      >
        Добавить
      </UButton>
    </div>

    <div class="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_220px_220px]">
      <div class="flex flex-col gap-2">
        <USelect
          v-model="store.form.measurement_unit_id"
          :items="measurementOptions"
          value-key="value"
          :loading="loading"
          placeholder="Выберите единицу измерения"
          :ui="{
            base: 'min-h-[56px] rounded-[15px] border-0 ring-0 bg-[#404040] px-4 text-[16px] font-semibold text-white',
            content: 'border border-white/10 bg-[#2f2f2f] text-white',
            item: 'text-white data-[highlighted]:bg-[#404040]',
          }"
        />
      </div>

      <label class="flex flex-col gap-2">
        <span class="text-sm text-[#d7d7d7]">Сокращение</span>
        <UInput
          :model-value="store.form.measurement_unit_short_name || ''"
          disabled
          :ui="{ base: 'min-h-[56px] rounded-[15px] border-0 ring-0 bg-[#353535] px-4 text-[16px] font-semibold text-white disabled:opacity-100' }"
        />
      </label>

      <label class="flex flex-col gap-2">
        <span class="text-sm text-[#d7d7d7]">Точность</span>
        <UInput
          :model-value="precisionLabel"
          disabled
          :ui="{ base: 'min-h-[56px] rounded-[15px] border-0 ring-0 bg-[#353535] px-4 text-[16px] font-semibold text-white disabled:opacity-100' }"
        />
      </label>
    </div>

    <MeasurementUnitModal
      v-model:open="modalOpen"
      :company-id="companyId"
      @created="handleCreated"
    />
  </div>
</template>
