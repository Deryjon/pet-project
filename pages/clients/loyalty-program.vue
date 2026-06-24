<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useHead } from "#imports";

useHead({ title: "Программа лояльности | Konkurent" });

const { apiFetch } = useApi();
const toast = useToast();

const form = ref({
  is_active: false,
  name: "",
  type: "cashback",
  cashback_percent: 0,
  bonus_percent: 0,
  has_customer_balance: false,
  has_customer_debt: false,
});

const loading = ref(false);
const saving = ref(false);

async function loadSettings() {
  loading.value = true;
  try {
    const data: any = await apiFetch("/v1/loyalty-program");
    form.value = {
      is_active: !!data.is_active,
      name: data.name ?? "",
      type: data.type || "cashback",
      cashback_percent: Number(data.cashback_percent) || 0,
      bonus_percent: Number(data.bonus_percent) || 0,
      has_customer_balance: !!data.has_customer_balance,
      has_customer_debt: !!data.has_customer_debt,
    };
  } catch {
    toast.add({ title: "Не удалось загрузить настройки", color: "error" });
  } finally {
    loading.value = false;
  }
}

async function submit() {
  saving.value = true;
  try {
    await apiFetch("/v1/loyalty-program", {
      method: "PUT",
      body: form.value,
    });
    toast.add({ title: "Настройки сохранены", color: "success" });
  } catch {
    toast.add({ title: "Ошибка при сохранении", color: "error" });
  } finally {
    saving.value = false;
  }
}

onMounted(loadSettings);

const typeOptions = [
  { value: "cashback", label: "Кэшбэк" },
  { value: "bonus", label: "Бонусная" },
  { value: "tiered", label: "Многоуровневая" },
];
</script>

<template>
  <section class="space-y-6 text-white">
    <div
      class="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.12),transparent_35%),linear-gradient(180deg,rgba(15,23,42,0.94),rgba(30,41,59,0.88))] p-6 shadow-[0_24px_60px_rgba(2,6,23,0.28)]"
    >
      <p class="text-[12px] font-semibold uppercase tracking-[0.24em] text-amber-300">
        Клиенты
      </p>
      <h1 class="mt-3 text-[30px] font-bold tracking-[-0.04em] text-white">
        Программа лояльности
      </h1>
      <p class="mt-3 max-w-3xl text-[15px] leading-7 text-slate-300">
        Настройте правила лояльности, бонусные механики и персональные предложения для покупателей.
      </p>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <span class="text-[#9a9a9a]">Загрузка...</span>
    </div>

    <form
      v-else
      class="rounded-[24px] border border-white/10 bg-[#202020] p-6"
      @submit.prevent="submit"
    >
      <div class="grid gap-6 md:grid-cols-2">
        <!-- isActive toggle -->
        <div class="md:col-span-2">
          <label class="flex cursor-pointer items-center gap-3">
            <input
              v-model="form.is_active"
              type="checkbox"
              class="h-5 w-5 rounded accent-[#1f78ff]"
            />
            <span class="text-[13px] font-semibold uppercase tracking-wider text-[#9a9a9a]">
              Программа активна
            </span>
          </label>
        </div>

        <!-- Name -->
        <div>
          <label class="mb-2 block text-[13px] font-semibold uppercase tracking-wider text-[#9a9a9a]">
            Название
          </label>
          <input
            v-model="form.name"
            type="text"
            placeholder="Название программы"
            class="w-full rounded-[14px] border border-white/10 bg-[#303030] px-4 py-3 text-[14px] text-white outline-none focus:border-[#1f78ff]"
          />
        </div>

        <!-- Type -->
        <div>
          <label class="mb-2 block text-[13px] font-semibold uppercase tracking-wider text-[#9a9a9a]">
            Тип программы
          </label>
          <select
            v-model="form.type"
            class="w-full rounded-[14px] border border-white/10 bg-[#303030] px-4 py-3 text-[14px] text-white outline-none focus:border-[#1f78ff]"
          >
            <option
              v-for="opt in typeOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </option>
          </select>
        </div>

        <!-- Cashback Percent -->
        <div>
          <label class="mb-2 block text-[13px] font-semibold uppercase tracking-wider text-[#9a9a9a]">
            Кэшбэк (%)
          </label>
          <input
            v-model.number="form.cashback_percent"
            type="number"
            min="0"
            max="100"
            step="0.1"
            class="w-full rounded-[14px] border border-white/10 bg-[#303030] px-4 py-3 text-[14px] text-white outline-none focus:border-[#1f78ff]"
          />
        </div>

        <!-- Bonus Percent -->
        <div>
          <label class="mb-2 block text-[13px] font-semibold uppercase tracking-wider text-[#9a9a9a]">
            Бонус (%)
          </label>
          <input
            v-model.number="form.bonus_percent"
            type="number"
            min="0"
            max="100"
            step="0.1"
            class="w-full rounded-[14px] border border-white/10 bg-[#303030] px-4 py-3 text-[14px] text-white outline-none focus:border-[#1f78ff]"
          />
        </div>

        <!-- Customer Balance toggle -->
        <div>
          <label class="flex cursor-pointer items-center gap-3">
            <input
              v-model="form.has_customer_balance"
              type="checkbox"
              class="h-5 w-5 rounded accent-[#1f78ff]"
            />
            <span class="text-[13px] font-semibold uppercase tracking-wider text-[#9a9a9a]">
              Баланс клиента
            </span>
          </label>
        </div>

        <!-- Customer Debt toggle -->
        <div>
          <label class="flex cursor-pointer items-center gap-3">
            <input
              v-model="form.has_customer_debt"
              type="checkbox"
              class="h-5 w-5 rounded accent-[#1f78ff]"
            />
            <span class="text-[13px] font-semibold uppercase tracking-wider text-[#9a9a9a]">
              Долг клиента
            </span>
          </label>
        </div>
      </div>

      <div class="mt-8 flex justify-end">
        <button
          type="submit"
          :disabled="saving"
          class="rounded-[14px] bg-[#1f78ff] px-6 py-3 font-semibold text-white hover:bg-[#4993dd] disabled:opacity-50"
        >
          {{ saving ? "Сохранение..." : "Сохранить" }}
        </button>
      </div>
    </form>
  </section>
</template>
