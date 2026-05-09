<script setup lang="ts">
import { SALARY_TYPE_OPTIONS, type SellerSalarySettings } from "~/composables/useSalarySettingsApi";

const props = defineProps<{
  modelValue: SellerSalarySettings;
  canManage?: boolean;
  saving?: boolean;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: SellerSalarySettings): void;
  (e: "save"): void;
}>();

const form = reactive<SellerSalarySettings>({
  fixedSalary: 0,
  salaryPercent: 0,
  calculationType: "FIXED_PLUS_PROFIT",
  bonusEnabled: true,
  isActive: true,
});

watch(
  () => props.modelValue,
  (value) => {
    Object.assign(form, value || {});
  },
  { immediate: true, deep: true },
);

watch(
  form,
  () => {
    emit("update:modelValue", { ...form });
  },
  { deep: true },
);
</script>

<template>
  <section class="rounded-[28px] border border-white/10 bg-[#202020] p-5 shadow-[0_18px_50px_rgba(2,6,23,0.18)]">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#7fb0ff]">Зарплата</p>
        <h3 class="mt-2 text-[20px] font-semibold text-white">Настройки продавца</h3>
      </div>
      <div v-if="loading" class="text-sm text-[#9a9a9a]">Загрузка...</div>
    </div>

    <div class="mt-5 grid gap-4 md:grid-cols-2">
      <label class="space-y-2">
        <span class="text-sm font-medium text-[#d3d3d3]">Фиксированная зарплата</span>
        <input v-model.number="form.fixedSalary" :disabled="!canManage" type="number" min="0" class="w-full rounded-2xl border border-white/10 bg-[#2a2a2a] px-4 py-3 text-white outline-none transition focus:border-[#2f6ed6] disabled:opacity-60" />
      </label>
      <label class="space-y-2">
        <span class="text-sm font-medium text-[#d3d3d3]">Процент</span>
        <input v-model.number="form.salaryPercent" :disabled="!canManage" type="number" min="0" step="0.01" class="w-full rounded-2xl border border-white/10 bg-[#2a2a2a] px-4 py-3 text-white outline-none transition focus:border-[#2f6ed6] disabled:opacity-60" />
      </label>
      <label class="space-y-2 md:col-span-2">
        <span class="text-sm font-medium text-[#d3d3d3]">Тип начисления</span>
        <select v-model="form.calculationType" :disabled="!canManage" class="w-full rounded-2xl border border-white/10 bg-[#2a2a2a] px-4 py-3 text-white outline-none transition focus:border-[#2f6ed6] disabled:opacity-60">
          <option v-for="option in SALARY_TYPE_OPTIONS" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
      </label>
    </div>

    <div class="mt-5 flex flex-wrap gap-3">
      <label class="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white">
        <input v-model="form.bonusEnabled" :disabled="!canManage" type="checkbox" class="h-4 w-4 accent-[#1f78ff]" />
        Включить бонусы
      </label>
      <label class="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white">
        <input v-model="form.isActive" :disabled="!canManage" type="checkbox" class="h-4 w-4 accent-[#1f78ff]" />
        Настройка активна
      </label>
    </div>

    <div v-if="canManage" class="mt-5">
      <button type="button" class="rounded-2xl bg-[#1f78ff] px-5 py-3 font-semibold text-white transition hover:bg-[#2f84ff] disabled:opacity-60" :disabled="saving" @click="emit('save')">
        Сохранить настройки
      </button>
    </div>
  </section>
</template>
