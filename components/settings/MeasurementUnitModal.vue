<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import type { MeasurementUnit } from "~/types/product-detail";
import type { MeasurementUnitPrecision } from "~/types/product-create";
import {
  MEASUREMENT_UNIT_PRECISION_OPTIONS,
  useMeasurementUnits,
  type DefaultMeasurementUnit,
} from "~/composables/useMeasurementUnits";

const props = withDefaults(
  defineProps<{
    open: boolean;
    companyId?: string;
  }>(),
  {
    companyId: "",
  },
);

const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
  (e: "created", unit: MeasurementUnit | null): void;
}>();

const { fetchDefaultMeasurementUnits, fetchCompanyMeasurementUnits, createMeasurementUnit } = useMeasurementUnits();
const toast = useToast();

const loadingDefaults = ref(false);
const saving = ref(false);
const errorMessage = ref("");
const defaultUnits = ref<DefaultMeasurementUnit[]>([]);
const selectedDefaultName = ref("");

const form = reactive<{
  name: string;
  short_name: string;
  precision: MeasurementUnitPrecision;
}>({
  name: "",
  short_name: "",
  precision: "1",
});

const defaultUnitOptions = computed(() =>
  defaultUnits.value.map((unit) => ({
    label: `${unit.name} (${unit.short_name})`,
    value: unit.name,
  })),
);

const canSave = computed(() =>
  Boolean(
    !saving.value &&
      form.name.trim() &&
      form.short_name.trim() &&
      form.precision,
  ),
);

function close() {
  emit("update:open", false);
}

function resetForm() {
  errorMessage.value = "";
  selectedDefaultName.value = "";
  form.name = "";
  form.short_name = "";
  form.precision = "1";
}

async function loadDefaults() {
  loadingDefaults.value = true;
  try {
    defaultUnits.value = await fetchDefaultMeasurementUnits();
  } catch (error: any) {
    defaultUnits.value = [];
    errorMessage.value = error?.message || "Не удалось загрузить стандартный справочник единиц";
  } finally {
    loadingDefaults.value = false;
  }
}

function applyDefaultUnitByName(name: string) {
  const matched = defaultUnits.value.find((unit) => unit.name === name);
  if (!matched) return;

  form.name = matched.name;
  form.short_name = matched.short_name;
}

async function submit() {
  if (!canSave.value) return;

  saving.value = true;
  errorMessage.value = "";

  try {
    const response = await createMeasurementUnit({
      name: form.name.trim(),
      short_name: form.short_name.trim(),
      precision: form.precision,
    });

    const freshUnits = await fetchCompanyMeasurementUnits({
      limit: 1000,
      page: 1,
    });

    const createdMessage = String(response?.message ?? "").trim();
    const createdUnit =
      freshUnits.find((unit) => unit.id === createdMessage) ||
      freshUnits.find(
        (unit) =>
          unit.name === form.name.trim() &&
          unit.short_name === form.short_name.trim() &&
          unit.precision === form.precision,
      ) ||
      null;

    toast.add({ title: "Единица измерения добавлена", color: "success" });
    emit("created", createdUnit);
    close();
    resetForm();
  } catch (error: any) {
    errorMessage.value = error?.message || "Не удалось создать единицу измерения";
    toast.add({
      title: "Не удалось создать единицу измерения",
      description: errorMessage.value,
      color: "error",
    });
  } finally {
    saving.value = false;
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      resetForm();
      if (!defaultUnits.value.length) {
        void loadDefaults();
      }
      return;
    }

    resetForm();
  },
);

watch(selectedDefaultName, (value) => {
  if (value) {
    applyDefaultUnitByName(String(value));
  }
});

onMounted(() => {
  void loadDefaults();
});
</script>

<template>
  <UModal
    :open="open"
    :ui="{
      overlay: 'bg-black/60 backdrop-blur-sm',
      content: 'mx-4 max-w-[620px] rounded-[24px] border border-white/10 bg-[#262626] text-white shadow-2xl ring-0 sm:mx-0',
    }"
    @update:open="emit('update:open', $event)"
  >
    <template #content>
      <div class="p-6 sm:p-7">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-[#79b7ff]">Товары</p>
            <h2 class="mt-2 text-[24px] font-bold text-white">Добавить единицу измерения</h2>
            <p class="mt-2 text-[14px] leading-6 text-[#bdbdbd]">
              Можно заполнить поля вручную или выбрать стандартную единицу из справочника.
            </p>
          </div>

          <UButton
            color="neutral"
            variant="ghost"
            class="flex h-10 w-10 items-center justify-center rounded-full bg-[#404040] p-0 text-white hover:bg-[#505050]"
            @click="close"
          >
            <Icon name="heroicons:x-mark" class="h-5 w-5" />
          </UButton>
        </div>

        <div class="mt-6 grid gap-4">
          <label class="flex flex-col gap-2">
            <span class="text-[13px] font-semibold text-[#d7d7d7]">Справочник стандартных единиц</span>
            <USelect
              v-model="selectedDefaultName"
              :items="defaultUnitOptions"
              value-key="value"
              :loading="loadingDefaults"
              placeholder="Выберите стандартную единицу"
              :ui="{
                base: 'min-h-[52px] rounded-[16px] border-0 bg-[#404040] px-4 text-white',
                content: 'border border-white/10 bg-[#2f2f2f] text-white',
                item: 'text-white data-[highlighted]:bg-[#404040]',
              }"
            />
          </label>

          <div class="grid gap-4 sm:grid-cols-2">
            <label class="flex flex-col gap-2 sm:col-span-2">
              <span class="text-[13px] font-semibold text-[#d7d7d7]">Название</span>
              <UInput
                v-model="form.name"
                placeholder="Например, Грамм"
                :ui="{ base: 'min-h-[52px] rounded-[16px] border-0 bg-[#404040] px-4 text-white placeholder:text-gray-400' }"
              />
            </label>

            <label class="flex flex-col gap-2">
              <span class="text-[13px] font-semibold text-[#d7d7d7]">Сокращение</span>
              <UInput
                v-model="form.short_name"
                placeholder="Например, г"
                :ui="{ base: 'min-h-[52px] rounded-[16px] border-0 bg-[#404040] px-4 text-white placeholder:text-gray-400' }"
              />
            </label>

            <label class="flex flex-col gap-2">
              <span class="text-[13px] font-semibold text-[#d7d7d7]">Точность</span>
              <USelect
                v-model="form.precision"
                :items="MEASUREMENT_UNIT_PRECISION_OPTIONS"
                value-key="value"
                :ui="{
                  base: 'min-h-[52px] rounded-[16px] border-0 bg-[#404040] px-4 text-white',
                  content: 'border border-white/10 bg-[#2f2f2f] text-white',
                  item: 'text-white data-[highlighted]:bg-[#404040]',
                }"
              />
            </label>
          </div>

          <div v-if="errorMessage" class="rounded-[16px] bg-[rgba(193,67,67,0.18)] px-4 py-3 text-[14px] text-[#ffb3b3]">
            {{ errorMessage }}
          </div>
        </div>

        <div class="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <UButton
            color="neutral"
            variant="soft"
            class="justify-center rounded-[16px] bg-[#3a3a3a] px-5 py-3 text-white hover:bg-[#454545]"
            @click="close"
          >
            Отмена
          </UButton>
          <UButton
            color="primary"
            variant="solid"
            class="justify-center rounded-[16px] bg-[#1f78ff] px-5 py-3 text-white hover:bg-[#2e84ff]"
            :loading="saving"
            :disabled="!canSave"
            @click="submit"
          >
            Сохранить
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
