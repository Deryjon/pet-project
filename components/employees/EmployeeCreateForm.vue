<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useApi } from "~/composables/useApi";

const emit = defineEmits<{
  (e: "created", value: any): void;
  (e: "cancel"): void;
}>();

const props = withDefaults(
  defineProps<{
    submitLabel?: string;
    showCancel?: boolean;
  }>(),
  {
    submitLabel: "Создать сотрудника",
    showCancel: false,
  }
);

const { apiFetch } = useApi();

const first_name = ref("");
const last_name = ref("");
const birth_date = ref("");
const countryCode = ref("+998");
const phone = ref("");
const password = ref("");
const role = ref("employee");
const branch_location = ref("main");

const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

function formatPhone(input: string | undefined | null) {
  const digits = String(input || "").replace(/\D/g, "").slice(0, 9);
  const parts: string[] = [];
  if (digits.length > 0) parts.push(digits.slice(0, 2));
  if (digits.length > 2) parts.push(digits.slice(2, 5));
  if (digits.length > 5) parts.push(digits.slice(5, 7));
  if (digits.length > 7) parts.push(digits.slice(7, 9));
  return parts.join(" ");
}

watch(phone, (value) => {
  const formatted = formatPhone(value);
  if (formatted !== value) phone.value = formatted;
});

const preparedData = computed(() => {
  const code = countryCode.value.replace(/^\+/, "").replace(/\D/g, "");
  const digits = phone.value.replace(/\D/g, "");

  return {
    first_name: first_name.value.trim(),
    last_name: last_name.value.trim(),
    birth_date: birth_date.value.trim() || null,
    phone_number: `${code}${digits}`,
    password: password.value,
    role: role.value.trim(),
    branch_location: branch_location.value.trim(),
  };
});

function resetForm() {
  first_name.value = "";
  last_name.value = "";
  birth_date.value = "";
  phone.value = "";
  password.value = "";
  role.value = "employee";
  branch_location.value = "main";
}

async function submit() {
  errorMessage.value = "";
  successMessage.value = "";

  if (!preparedData.value.first_name) {
    errorMessage.value = "Укажите имя.";
    return;
  }
  if (!preparedData.value.last_name) {
    errorMessage.value = "Укажите фамилию.";
    return;
  }
  if (preparedData.value.phone_number.length !== 12) {
    errorMessage.value = "Телефон должен быть в формате +998 XX XXX XX XX.";
    return;
  }
  if (password.value.length < 6) {
    errorMessage.value = "Пароль должен содержать минимум 6 символов.";
    return;
  }
  if (!preparedData.value.role) {
    errorMessage.value = "Укажите роль.";
    return;
  }
  if (!preparedData.value.branch_location) {
    errorMessage.value = "Укажите филиал.";
    return;
  }

  loading.value = true;
  try {
    const createdUser = await apiFetch("/users/add", {
      method: "POST",
      body: preparedData.value,
    });
    successMessage.value = "Сотрудник добавлен.";
    emit("created", createdUser);
    resetForm();
  } catch (error: any) {
    errorMessage.value =
      error?.data?.message || error?.message || "Не удалось создать сотрудника.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="rounded-2xl bg-[#262626] p-6 shadow-xl">
    <div class="mb-5 flex items-start justify-between gap-4">
      <div>
        <h3 class="text-xl font-bold text-white">Новый сотрудник</h3>
        <p class="mt-1 text-sm text-[#bdbdbd]">
          Создание пользователя через `POST /users/add`
        </p>
      </div>

      <button
        v-if="props.showCancel"
        type="button"
        class="rounded-xl bg-[#404040] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#5e5e5e]"
        @click="$emit('cancel')"
      >
        Закрыть
      </button>
    </div>

    <form class="space-y-5" @submit.prevent="submit">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div class="flex flex-col gap-2">
          <label class="font-medium text-white">Имя</label>
          <input
            v-model="first_name"
            type="text"
            placeholder="Test"
            class="rounded-xl bg-[#404040] px-4 py-3 text-white outline-none transition focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="font-medium text-white">Фамилия</label>
          <input
            v-model="last_name"
            type="text"
            placeholder="User"
            class="rounded-xl bg-[#404040] px-4 py-3 text-white outline-none transition focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="font-medium text-white">Дата рождения</label>
          <input
            v-model="birth_date"
            type="text"
            placeholder="12.06.2004"
            class="rounded-xl bg-[#404040] px-4 py-3 text-white outline-none transition focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="font-medium text-white">Филиал</label>
          <input
            v-model="branch_location"
            type="text"
            placeholder="main"
            class="rounded-xl bg-[#404040] px-4 py-3 text-white outline-none transition focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <label class="font-medium text-white">Телефон</label>
        <div class="flex gap-2">
          <input
            v-model="countryCode"
            type="text"
            class="w-24 rounded-xl bg-[#404040] px-4 py-3 text-white outline-none transition focus:ring-2 focus:ring-blue-500"
          />
          <input
            v-model="phone"
            type="tel"
            placeholder="94 612 08 44"
            class="flex-1 rounded-xl bg-[#404040] px-4 py-3 text-white outline-none transition focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div class="flex flex-col gap-2">
          <label class="font-medium text-white">Пароль</label>
          <input
            v-model="password"
            type="password"
            placeholder="Минимум 6 символов"
            class="rounded-xl bg-[#404040] px-4 py-3 text-white outline-none transition focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="font-medium text-white">Роль</label>
          <input
            v-model="role"
            type="text"
            placeholder="admin"
            class="rounded-xl bg-[#404040] px-4 py-3 text-white outline-none transition focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div class="flex flex-wrap gap-3">
        <button
          type="submit"
          :disabled="loading"
          class="rounded-xl bg-[#1f78ff] px-5 py-3 font-semibold text-white transition hover:bg-[#2a6ed9] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ loading ? "Сохранение..." : props.submitLabel || "Создать сотрудника" }}
        </button>

        <button
          v-if="props.showCancel"
          type="button"
          class="rounded-xl bg-[#404040] px-5 py-3 font-semibold text-white transition hover:bg-[#5e5e5e]"
          @click="$emit('cancel')"
        >
          Отмена
        </button>
      </div>

      <p v-if="errorMessage" class="text-sm text-red-400">{{ errorMessage }}</p>
      <p v-if="successMessage" class="text-sm text-green-400">{{ successMessage }}</p>
    </form>
  </div>
</template>
