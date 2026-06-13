<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { ImportMatchPolicy, ImportOnMatchPolicy, ImportPreviewItem } from "~/composables/useProductImport";

type PolicyChoice = "keep_store" | "from_file" | "weighted_avg";

type FieldConfig = {
  key: keyof ImportOnMatchPolicy;
  label: string;
  showWeightedAvg: boolean;
};

const FIELD_CONFIGS: FieldConfig[] = [
  { key: "supply_price", label: "Цена поставки", showWeightedAvg: true },
  { key: "retail_price", label: "Розничная цена", showWeightedAvg: false },
  { key: "name", label: "Наименование", showWeightedAvg: false },
  { key: "brand", label: "Бренд", showWeightedAvg: false },
  { key: "category", label: "Категория", showWeightedAvg: false },
  { key: "description", label: "Описание", showWeightedAvg: false },
  { key: "measurement_unit", label: "Ед. измерения", showWeightedAvg: false },
  { key: "supplier", label: "Поставщик", showWeightedAvg: false },
];

const FIELD_KEY_MAP: Record<string, keyof ImportOnMatchPolicy> = {
  supply_price: "supply_price",
  supplyPrice: "supply_price",
  retail_price: "retail_price",
  retailPrice: "retail_price",
  name: "name",
  brand: "brand",
  brand_name: "brand",
  brandName: "brand",
  category: "category",
  category_name: "category",
  categoryName: "category",
  description: "description",
  measurement_unit: "measurement_unit",
  measurementUnit: "measurement_unit",
  unit: "measurement_unit",
  supplier: "supplier",
};

const props = defineProps<{
  open: boolean;
  items: ImportPreviewItem[];
  initialPolicy: ImportOnMatchPolicy;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "confirm", policy: ImportOnMatchPolicy, useWeightedAvg: boolean): void;
}>();

type Choices = Record<keyof ImportOnMatchPolicy, PolicyChoice>;

function makeDefaults(): Choices {
  return {
    name: props.initialPolicy.name as PolicyChoice,
    brand: props.initialPolicy.brand as PolicyChoice,
    category: props.initialPolicy.category as PolicyChoice,
    description: props.initialPolicy.description as PolicyChoice,
    measurement_unit: props.initialPolicy.measurement_unit as PolicyChoice,
    supplier: props.initialPolicy.supplier as PolicyChoice,
    supply_price: "weighted_avg",
    retail_price: props.initialPolicy.retail_price as PolicyChoice,
  };
}

const choices = ref<Choices>(makeDefaults());

watch(
  () => props.open,
  (open) => {
    if (open) choices.value = makeDefaults();
  },
);

const conflictItems = computed(() =>
  props.items.filter((item) => item.action === "update" && item.difference),
);

const conflictingKeys = computed(() => {
  const keys = new Set<keyof ImportOnMatchPolicy>();
  conflictItems.value.forEach((item) => {
    (item.different_fields ?? []).forEach((f) => {
      const k = FIELD_KEY_MAP[f];
      if (k) keys.add(k);
    });
  });
  return keys;
});

const visibleFields = computed(() =>
  FIELD_CONFIGS.filter((f) => conflictingKeys.value.has(f.key)),
);

const exampleItems = computed(() => conflictItems.value.slice(0, 4));

function fmt(v: number) {
  return `${new Intl.NumberFormat("ru-RU").format(Math.round(v))} UZS`;
}

function oldPrice(item: ImportPreviewItem): string {
  const old = item.old_product;
  if (!old) return "—";
  return fmt(Number(old.supply_price ?? old.purchase_price ?? 0));
}

function weightedAvgPrice(item: ImportPreviewItem): string {
  const old = item.old_product;
  if (!old) return fmt(item.supply_price);
  const oldQty = Number(old.measurement_value ?? old.quantity ?? old.stock_quantity ?? 0);
  const oldPriceVal = Number(old.supply_price ?? old.purchase_price ?? 0);
  const total = oldQty + item.measurement_value;
  if (total <= 0) return fmt(item.supply_price);
  return fmt(Math.round((oldQty * oldPriceVal + item.measurement_value * item.supply_price) / total));
}

function handleConfirm() {
  const useWeightedAvg = choices.value.supply_price === "weighted_avg";
  const toPolicy = (c: PolicyChoice): ImportMatchPolicy =>
    c === "weighted_avg" ? "from_file" : c;

  const policy: ImportOnMatchPolicy = {
    name: toPolicy(choices.value.name),
    brand: toPolicy(choices.value.brand),
    category: toPolicy(choices.value.category),
    description: toPolicy(choices.value.description),
    measurement_unit: toPolicy(choices.value.measurement_unit),
    supplier: toPolicy(choices.value.supplier),
    supply_price: toPolicy(choices.value.supply_price),
    retail_price: toPolicy(choices.value.retail_price),
  };

  emit("confirm", policy, useWeightedAvg);
}
</script>

<template>
  <AppSlideover
    :open="open"
    max-width-class="max-w-[560px]"
    panel-class="bg-[#2b2b2b] text-white flex flex-col"
    @update:open="!$event && emit('close')"
  >
    <div class="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-6">
      <div>
        <p class="text-[12px] font-bold uppercase tracking-[0.22em] text-[#e8a74e]">
          Расхождения в данных
        </p>
        <h3 class="mt-2 text-[24px] font-bold">
          {{ conflictItems.length }} товаров с расхождениями
        </h3>
        <p class="mt-1 text-[14px] text-[#bdbdbd]">
          Выберите, какие значения использовать при обновлении.
        </p>
      </div>
      <button
        type="button"
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#404040] hover:bg-[#5e5e5e]"
        @click="emit('close')"
      >
        <Icon name="heroicons:x-mark-20-solid" class="h-5 w-5" />
      </button>
    </div>

    <div class="flex-1 space-y-6 overflow-y-auto px-6 py-6">
      <div v-if="visibleFields.length" class="space-y-3">
        <p class="text-[12px] font-bold uppercase tracking-[0.14em] text-[#8f8f8f]">
          Что использовать при расхождении
        </p>
        <div
          v-for="field in visibleFields"
          :key="field.key"
          class="space-y-3 rounded-[20px] bg-[#363636] p-4"
        >
          <p class="text-[14px] font-bold text-white">{{ field.label }}</p>
          <div class="flex gap-1 rounded-[12px] bg-[#2b2b2b] p-1">
            <button
              type="button"
              class="flex-1 rounded-[10px] py-2 text-[12px] font-bold transition-colors"
              :class="
                choices[field.key] === 'keep_store'
                  ? 'bg-[#404040] text-white'
                  : 'text-[#6f6f6f] hover:text-[#bdbdbd]'
              "
              @click="choices[field.key] = 'keep_store'"
            >
              Магазинное
            </button>
            <button
              v-if="field.showWeightedAvg"
              type="button"
              class="flex-1 rounded-[10px] py-2 text-[12px] font-bold transition-colors"
              :class="
                choices[field.key] === 'weighted_avg'
                  ? 'bg-[#1f78ff] text-white'
                  : 'text-[#6f6f6f] hover:text-[#bdbdbd]'
              "
              @click="choices[field.key] = 'weighted_avg'"
            >
              Средневзвешенная
            </button>
            <button
              type="button"
              class="flex-1 rounded-[10px] py-2 text-[12px] font-bold transition-colors"
              :class="
                choices[field.key] === 'from_file'
                  ? 'bg-[#404040] text-white'
                  : 'text-[#6f6f6f] hover:text-[#bdbdbd]'
              "
              @click="choices[field.key] = 'from_file'"
            >
              Из файла
            </button>
          </div>
        </div>
      </div>

      <div v-if="exampleItems.length">
        <p class="mb-3 text-[12px] font-bold uppercase tracking-[0.14em] text-[#8f8f8f]">
          Примеры расхождений по цене поставки
        </p>
        <div class="space-y-2">
          <div
            v-for="item in exampleItems"
            :key="item.id"
            class="rounded-[16px] bg-[#363636] px-4 py-3"
          >
            <p class="truncate text-[13px] font-bold text-white">{{ item.product_name }}</p>
            <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px]">
              <span class="text-[#8f8f8f]">
                Магазин: <span class="text-white">{{ oldPrice(item) }}</span>
              </span>
              <span class="text-[#8f8f8f]">
                Файл:
                <span class="text-[#4993dd]">{{
                  `${new Intl.NumberFormat("ru-RU").format(item.supply_price)} UZS`
                }}</span>
              </span>
              <span v-if="choices.supply_price === 'weighted_avg'" class="text-[#8f8f8f]">
                Среднее: <span class="text-[#32b67a]">{{ weightedAvgPrice(item) }}</span>
              </span>
            </div>
          </div>
        </div>
        <p v-if="conflictItems.length > 4" class="mt-2 text-[12px] text-[#6f6f6f]">
          + ещё {{ conflictItems.length - 4 }} товаров
        </p>
      </div>
    </div>

    <div class="border-t border-white/10 px-6 py-4">
      <div class="flex gap-3">
        <button
          type="button"
          class="flex-1 rounded-[16px] bg-[#404040] px-5 py-4 text-[15px] font-bold text-white hover:bg-[#4b4b4b]"
          @click="emit('close')"
        >
          Отмена
        </button>
        <button
          type="button"
          class="flex-1 rounded-[16px] bg-[#1f78ff] px-5 py-4 text-[15px] font-bold text-white hover:bg-[#2a6ed9]"
          @click="handleConfirm"
        >
          Применить
        </button>
      </div>
    </div>
  </AppSlideover>
</template>
