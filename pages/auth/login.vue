<script setup lang="ts">
import { useForm, useField } from "vee-validate";
import * as yup from "yup";
import { watch } from "vue";

definePageMeta({ layout: "auth" });

// Схема валидации
const schema = yup.object({
  countryCode: yup.string().required("Выберите код"),
  phone: yup
    .string()
    .required("Телефон обязателен")
    .matches(/^\d{2} \d{3} \d{2} \d{2}$/, "Неверный формат"),
  password: yup
    .string()
    .required("Пароль обязателен")
    .min(6, "Минимум 6 символов"),
});

// Форма
const { handleSubmit } = useForm({ validationSchema: schema });

const { value: countryCode, errorMessage: codeError } = useField(
  "countryCode",
  undefined,
  {
    initialValue: "+998",
  }
);
const { value: phone, errorMessage: phoneError } = useField("phone");
const { value: password, errorMessage: passwordError } = useField("password");

// Автоформат телефона
const formatPhone = (input: string) => {
  const numbersOnly = input.replace(/\D/g, "");
  const parts = [];

  if (numbersOnly.length > 0) parts.push(numbersOnly.slice(0, 2));
  if (numbersOnly.length > 2) parts.push(numbersOnly.slice(2, 5));
  if (numbersOnly.length > 5) parts.push(numbersOnly.slice(5, 7));
  if (numbersOnly.length > 7) parts.push(numbersOnly.slice(7, 9));

  return parts.join(" ");
};

watch(phone, (newVal) => {
  phone.value = formatPhone(newVal);
});

// Отправка
const onSubmit = handleSubmit((values) => {
  console.log("✅ Успешно:", values);
});

const showDropdown = ref(false);

const options = ["+998", "+7", "+1"];

const selectOption = (code: string) => {
  countryCode.value = code;
  showDropdown.value = false;
};
</script>
<template>
  <div
    class="login-box w-full max-w-[500px] bg-[#262626] px-10 py-12 rounded-[40px] text-white flex flex-col gap-8 shadow-2xl"
  >
    <!-- Заголовок -->
    <div class="top flex flex-col gap-2">
      <h2 class="font-bold text-lg">Konkurent.cases</h2>
      <h2 class="font-bold text-3xl">Вход в аккаунт</h2>
    </div>

    <!-- Форма -->
    <!-- Форма -->
    <form @submit.prevent="onSubmit" class="flex flex-col gap-6">
      <!-- Телефон -->
      <div class="flex flex-col gap-2">
        <label for="phone" class="block font-medium">Номер телефона</label>
        <div class="flex">
          <!-- Кнопка выбора кода страны -->
          <div class="relative w-[110px]">
            <button
              @click="showDropdown = !showDropdown"
              class="w-full bg-[#404040] text-white rounded-l-xl px-4 py-3 flex justify-between items-center transition-all duration-200"
              :class="
                codeError
                  ? 'ring-2 ring-red-500'
                  : 'focus:ring-2 focus:ring-blue-500'
              "
            >
              <span class="font-medium">{{ countryCode }}</span>
              <svg
                class="w-4 h-4 transition-transform duration-200"
                :class="{ 'rotate-180': showDropdown }"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Выпадающее меню -->
            <transition name="fade">
              <ul
                v-if="showDropdown"
                class="absolute left-0 mt-2 w-full bg-[#2e2e2e] rounded-xl shadow-md overflow-hidden z-10"
              >
                <li
                  v-for="option in options"
                  :key="option"
                  @click="selectOption(option)"
                  class="px-4 py-2 hover:bg-[#505050] cursor-pointer transition-colors text-white"
                >
                  {{ option }}
                </li>
              </ul>
            </transition>
          </div>

          <!-- Поле ввода номера -->
          <input
            v-model="phone"
            type="tel"
            placeholder="90 123 45 67"
            :class="[
              'flex-1 bg-[#404040] border-l text-white placeholder-gray-400  rounded-r-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all',
              phoneError ? 'ring-2 ring-red-500' : 'focus:ring-blue-500',
            ]"
          />
        </div>
      </div>

      <!-- Пароль -->
      <div class="flex flex-col gap-2">
        <label for="password" class="block font-medium">Пароль</label>
        <input
          id="password"
          v-model="password"
          type="password"
          placeholder="••••••••"
          :class="[
            'w-full bg-[#404040] rounded-[15px] px-4 py-3 focus:outline-none focus:ring-2',
            passwordError ? 'ring-red-500' : 'focus:ring-blue-500',
          ]"
        />
      </div>

      <!-- Кнопка -->
      <button
        type="submit"
        class="bg-blue-600 hover:bg-blue-700 transition p-4 rounded-[15px] font-semibold text-white shadow-md"
      >
        Войти
      </button>
    </form>

    <!-- Ссылка на регистрацию -->
    <p class="text-center text-sm text-[#aaa]">
      Еще нет аккаунта?
      <NuxtLink to="/auth/register" class="text-blue-400 hover:underline">
        Зарегистрироваться
      </NuxtLink>
    </p>
  </div>
</template>

<style scoped>
input,
select {
  color: white;
}

input::placeholder {
  color: #bbb;
}
</style>
