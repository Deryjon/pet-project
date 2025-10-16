<script setup lang="ts">
import { useForm, useField } from "vee-validate";
import * as yup from "yup";
import { ref, watch } from "vue";
import { useAuth } from "~/composables/useAuth";
import { useRouter } from "vue-router";
import { useHead } from "#imports";

useHead({ title: "Создать сотрудника | Konkurent.cases" });

const schema = yup.object({
  username: yup.string().required("Имя пользователя обязательно"),
  countryCode: yup.string().required("Код страны обязателен"),
  phone: yup
    .string()
    .required("Номер телефона обязателен")
    .matches(/^\d{2} \d{3} \d{2} \d{2}$/, "Формат: 90 123 45 67"),
  password: yup
    .string()
    .required("Пароль обязателен")
    .min(6, "Минимум 6 символов"),
  role: yup.string().required("Роль обязательна"),
  branch_code: yup.string().required("Код филиала обязателен"),
});

const { handleSubmit } = useForm({ validationSchema: schema });

const { value: username, errorMessage: usernameError } = useField("username");
const { value: countryCode, errorMessage: codeError } = useField(
  "countryCode",
  undefined,
  { initialValue: "+998" }
);
const { value: phone, errorMessage: phoneError } = useField("phone");
const { value: password, errorMessage: passwordError } = useField("password");
const { value: role, errorMessage: roleError } = useField(
  "role",
  undefined,
  { initialValue: "employee" }
);
const { value: branch_code, errorMessage: branchError } = useField(
  "branch_code",
  undefined,
  { initialValue: "branch_a" }
);

const formatPhone = (input: string) => {
  const numbersOnly = input.replace(/\D/g, "");
  const parts: string[] = [];
  if (numbersOnly.length > 0) parts.push(numbersOnly.slice(0, 2));
  if (numbersOnly.length > 2) parts.push(numbersOnly.slice(2, 5));
  if (numbersOnly.length > 5) parts.push(numbersOnly.slice(5, 7));
  if (numbersOnly.length > 7) parts.push(numbersOnly.slice(7, 9));
  return parts.join(" ");
};

watch(phone, (newVal) => {
  phone.value = formatPhone(newVal);
});

const loading = ref(false);
const serverError = ref<string | null>(null);
const serverOk = ref<string | null>(null);
const auth = useAuth();
const router = useRouter();

// Регистрация сотрудника (как в auth/register, но редирект в список сотрудников)
const onSubmit = handleSubmit(async () => {
  serverError.value = null;
  serverOk.value = null;
  loading.value = true;
  try {
    const fullPhone = `${countryCode.value.replace(/^\+/, "")}${phone.value.replace(/\D/g, "")}`;
    await auth.register({
      username: String(username.value),
      phone: fullPhone,
      password: String(password.value),
      role: String(role.value),
      branch_code: String(branch_code.value),
    });
    serverOk.value = "Сотрудник создан успешно";
    setTimeout(() => router.push("/management/employees"), 800);
  } catch (e: any) {
    serverError.value = e?.data?.message || e?.message || "Ошибка регистрации";
  } finally {
    loading.value = false;
  }
});

const showDropdown = ref(false);
const options = ["+998", "+7", "+1"];
const selectOption = (code: string) => {
  countryCode.value = code;
  showDropdown.value = false;
};
</script>

<template>
  <section class="w-full max-w-[720px] text-white">
    <div class="flex items-center justify-between mb-6">
      <h2 class="font-bold text-2xl">Новый сотрудник</h2>
      <NuxtLink to="/management/employees" class="text-blue-400 hover:underline">К списку сотрудников</NuxtLink>
    </div>

    <form @submit.prevent="onSubmit" class="flex flex-col gap-5 bg-[#262626] p-8 rounded-2xl shadow-xl">
      <div class="flex flex-col gap-2">
        <label class="block font-medium">Имя пользователя</label>
        <input
          v-model="username"
          type="text"
          placeholder="employee_1"
          :class="['w-full bg-[#404040] rounded-[12px] px-4 py-3 focus:outline-none focus:ring-2', usernameError ? 'ring-red-500' : 'focus:ring-blue-500']"
        />
        <p v-if="usernameError" class="text-sm text-red-400">{{ usernameError }}</p>
      </div>

      <div class="flex flex-col gap-2">
        <label class="block font-medium">Телефон</label>
        <div class="flex">
          <div class="relative w-[110px]">
            <button
              type="button"
              @click="showDropdown = !showDropdown"
              class="w-full bg-[#404040] text-white rounded-l-xl px-4 py-3 flex justify-between items-center transition-all duration-200"
              :class="codeError ? 'ring-2 ring-red-500' : 'focus:ring-2 focus:ring-blue-500'"
            >
              <span class="font-medium">{{ countryCode }}</span>
              <svg class="w-4 h-4 transition-transform duration-200" :class="{ 'rotate-180': showDropdown }" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
            </button>
            <transition name="fade">
              <ul v-if="showDropdown" class="absolute left-0 mt-2 w-full bg-[#2e2e2e] rounded-xl shadow-md overflow-hidden z-10">
                <li v-for="option in options" :key="option" @click="selectOption(option)" class="px-4 py-2 hover:bg-[#505050] cursor-pointer transition-colors text-white">{{ option }}</li>
              </ul>
            </transition>
          </div>
          <input
            v-model="phone"
            type="tel"
            placeholder="90 123 45 67"
            :class="['flex-1 bg-[#404040] border-l text-white placeholder-gray-400 rounded-r-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all', phoneError ? 'ring-2 ring-red-500' : 'focus:ring-blue-500']"
          />
        </div>
        <p v-if="phoneError || codeError" class="text-sm text-red-400">{{ phoneError || codeError }}</p>
      </div>

      <div class="flex flex-col gap-2">
        <label class="block font-medium">Пароль</label>
        <input
          v-model="password"
          type="password"
          placeholder="Минимум 6 символов"
          :class="['w-full bg-[#404040] rounded-[12px] px-4 py-3 focus:outline-none focus:ring-2', passwordError ? 'ring-red-500' : 'focus:ring-blue-500']"
        />
        <p v-if="passwordError" class="text-sm text-red-400">{{ passwordError }}</p>
      </div>

      <div class="flex gap-4">
        <div class="flex-1 flex flex-col gap-2">
          <label class="block font-medium">Роль</label>
          <input
            v-model="role"
            type="text"
            placeholder="employee"
            :class="['w-full bg-[#404040] rounded-[12px] px-4 py-3 focus:outline-none focus:ring-2', roleError ? 'ring-red-500' : 'focus:ring-blue-500']"
          />
          <p v-if="roleError" class="text-sm text-red-400">{{ roleError }}</p>
        </div>
        <div class="flex-1 flex flex-col gap-2">
          <label class="block font-medium">Код филиала</label>
          <input
            v-model="branch_code"
            type="text"
            placeholder="branch_a"
            :class="['w-full bg-[#404040] rounded-[12px] px-4 py-3 focus:outline-none focus:ring-2', branchError ? 'ring-red-500' : 'focus:ring-blue-500']"
          />
          <p v-if="branchError" class="text-sm text-red-400">{{ branchError }}</p>
        </div>
      </div>

      <button type="submit" :disabled="loading" class="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition p-4 rounded-[12px] font-semibold text-white shadow-md">
        {{ loading ? 'Создаём…' : 'Создать сотрудника' }}
      </button>
    </form>

    <p v-if="serverError" class="mt-3 text-sm text-red-400">{{ serverError }}</p>
    <p v-if="serverOk" class="mt-3 text-sm text-green-400">{{ serverOk }}</p>
  </section>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>
