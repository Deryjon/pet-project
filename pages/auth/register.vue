<script setup lang="ts">
import { useForm, useField } from "vee-validate";
import * as yup from "yup";
import { ref, watch } from "vue";
import { useAuth } from "~/composables/useAuth";
import { useRouter } from "vue-router";

definePageMeta({ layout: "auth" });

const schema = yup.object({
  username: yup.string().required("Имя обязательно"),
  countryCode: yup.string().required("Выберите код"),
  phone: yup.string().required("Телефон обязателен").matches(/^\d{2} \d{3} \d{2} \d{2}$/, "Неверный формат"),
  password: yup.string().required("Пароль обязателен").min(6, "Минимум 6 символов"),
  role: yup.string().required("Роль обязательна"),
  branch_code: yup.string().required("Код филиала обязателен"),
});

const { handleSubmit } = useForm({ validationSchema: schema });

const { value: username, errorMessage: usernameError } = useField("username");
const { value: countryCode, errorMessage: codeError } = useField("countryCode", undefined, { initialValue: "+998" });
const { value: phone, errorMessage: phoneError } = useField("phone");
const { value: password, errorMessage: passwordError } = useField("password");
const { value: role, errorMessage: roleError } = useField("role", undefined, { initialValue: "admin" });
const { value: branch_code, errorMessage: branchError } = useField("branch_code", undefined, { initialValue: "branch_a" });

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

const onSubmit = handleSubmit(async () => {
  serverError.value = null;
  serverOk.value = null;
  loading.value = true;
  try {
    const fullPhone = `${countryCode.value.replace(/^\+/, "")}${phone.value.replace(/\D/g, "")}`;
    await auth.register({
      username: String(username.value),
      phone_number: fullPhone,
      password: String(password.value),
      role: String(role.value),
      branch_code: String(branch_code.value),
    });
    serverOk.value = "Регистрация успешна. Теперь войдите.";
    setTimeout(() => router.push("/auth/login"), 800);
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
  <div class="login-box w-full max-w-[560px] bg-[#262626] px-10 py-12 rounded-[40px] text-white flex flex-col gap-8 shadow-2xl">
    <div class="top flex flex-col gap-2">
      <h2 class="font-bold text-lg">Konkurent.cases</h2>
      <h2 class="font-bold text-3xl">Регистрация</h2>
    </div>

    <form @submit.prevent="onSubmit" class="flex flex-col gap-5">
      <div class="flex flex-col gap-2">
        <label class="block font-medium">Имя</label>
        <input v-model="username" type="text" placeholder="Admin" :class="['w-full bg-[#404040] rounded-[15px] px-4 py-3 focus:outline-none focus:ring-2', usernameError ? 'ring-red-500' : 'focus:ring-blue-500']" />
      </div>

      <div class="flex flex-col gap-2">
        <label class="block font-medium">Номер телефона</label>
        <div class="flex">
          <div class="relative w-[110px]">
            <button type="button" @click="showDropdown = !showDropdown" class="w-full bg-[#404040] text-white rounded-l-xl px-4 py-3 flex justify-between items-center transition-all duration-200" :class="codeError ? 'ring-2 ring-red-500' : 'focus:ring-2 focus:ring-blue-500'">
              <span class="font-medium">{{ countryCode }}</span>
              <svg class="w-4 h-4 transition-transform duration-200" :class="{ 'rotate-180': showDropdown }" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
            </button>
            <transition name="fade">
              <ul v-if="showDropdown" class="absolute left-0 mt-2 w-full bg-[#2e2e2e] rounded-xl shadow-md overflow-hidden z-10">
                <li v-for="option in options" :key="option" @click="selectOption(option)" class="px-4 py-2 hover:bg-[#505050] cursor-pointer transition-colors text-white">{{ option }}</li>
              </ul>
            </transition>
          </div>
          <input v-model="phone" type="tel" placeholder="90 123 45 67" :class="['flex-1 bg-[#404040] border-l text-white placeholder-gray-400  rounded-r-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all', phoneError ? 'ring-2 ring-red-500' : 'focus:ring-blue-500']" />
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <label class="block font-medium">Пароль</label>
        <input v-model="password" type="password" placeholder="Ваш пароль" :class="['w-full bg-[#404040] rounded-[15px] px-4 py-3 focus:outline-none focus:ring-2', passwordError ? 'ring-red-500' : 'focus:ring-blue-500']" />
      </div>

      <div class="flex gap-4">
        <div class="flex-1 flex flex-col gap-2">
          <label class="block font-medium">Роль</label>
          <input v-model="role" type="text" placeholder="admin" :class="['w-full bg-[#404040] rounded-[15px] px-4 py-3 focus:outline-none focus:ring-2', roleError ? 'ring-red-500' : 'focus:ring-blue-500']" />
        </div>
        <div class="flex-1 flex flex-col gap-2">
          <label class="block font-medium">Код филиала</label>
          <input v-model="branch_code" type="text" placeholder="branch_a" :class="['w-full bg-[#404040] rounded-[15px] px-4 py-3 focus:outline-none focus:ring-2', branchError ? 'ring-red-500' : 'focus:ring-blue-500']" />
        </div>
      </div>

      <button type="submit" :disabled="loading" class="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition p-4 rounded-[15px] font-semibold text-white shadow-md">
        {{ loading ? 'Отправляем...' : 'Зарегистрироваться' }}
      </button>
    </form>

    <p v-if="serverError" class="text-center text-sm text-red-400">{{ serverError }}</p>
    <p v-if="serverOk" class="text-center text-sm text-green-400">{{ serverOk }}</p>

    <p class="text-center text-sm text-[#aaa]">
      Уже есть аккаунт?
      <NuxtLink to="/auth/login" class="text-blue-400 hover:underline">Войти</NuxtLink>
    </p>
  </div>
</template>


