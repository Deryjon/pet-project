<script setup lang="ts">
import { useForm, useField } from 'vee-validate'
import * as yup from 'yup'
import { watch } from 'vue'

definePageMeta({ layout: 'auth' })

// Схема валидации
const schema = yup.object({
  countryCode: yup.string().required('Выберите код'),
  phone: yup
    .string()
    .required('Телефон обязателен')
    .matches(/^\d{2} \d{3} \d{2} \d{2}$/, 'Неверный формат'),
  password: yup
    .string()
    .required('Пароль обязателен')
    .min(6, 'Минимум 6 символов'),
})

// Форма
const { handleSubmit } = useForm({ validationSchema: schema })

const { value: countryCode, errorMessage: codeError } = useField('countryCode')
const { value: phone, errorMessage: phoneError } = useField('phone')
const { value: password, errorMessage: passwordError } = useField('password')

// Автоформат телефона
const formatPhone = (input: string) => {
  const numbersOnly = input.replace(/\D/g, '')
  const parts = []

  if (numbersOnly.length > 0) parts.push(numbersOnly.slice(0, 2))
  if (numbersOnly.length > 2) parts.push(numbersOnly.slice(2, 5))
  if (numbersOnly.length > 5) parts.push(numbersOnly.slice(5, 7))
  if (numbersOnly.length > 7) parts.push(numbersOnly.slice(7, 9))

  return parts.join(' ')
}

watch(phone, (newVal) => {
  phone.value = formatPhone(newVal)
})

// Отправка
const onSubmit = handleSubmit(values => {
  console.log('✅ Успешно:', values)
})

</script>
<template>
  <div class="login-box w-full max-w-[500px] bg-[#262626] px-10 py-12 rounded-[40px] text-white flex flex-col gap-8 shadow-2xl">
    <!-- Заголовок -->
    <div class="top flex flex-col gap-2">
      <h2 class="font-bold text-lg">Konkurent.cases</h2>
      <h2 class="font-bold text-3xl">Вход в аккаунт</h2>
    </div>

    <!-- Форма -->
    <form @submit.prevent="onSubmit" class="flex flex-col gap-6">
      <!-- Телефон -->
      <div class="flex flex-col gap-2">
        <label for="phone" class="block font-medium">Номер телефона</label>
        <div class="flex gap-2">
          <select
            v-model="countryCode"
            class="bg-[#404040] rounded-[15px] px-4 py-3 w-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="+998" selected>+998</option>
            <option value="+7">+7</option>
            <option value="+1">+1</option>
          </select>

          <input
            v-model="phone"
            type="tel"
            placeholder="90 123 45 67"
            class="w-full bg-[#404040] rounded-[15px] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <span v-if="codeError" class="text-red-400 text-sm mt-1">{{ codeError }}</span>
        <span v-if="phoneError" class="text-red-400 text-sm mt-1">{{ phoneError }}</span>
      </div>

      <!-- Пароль -->
      <div class="flex flex-col gap-2">
        <label for="password" class="block font-medium">Пароль</label>
        <input
          id="password"
          v-model="password"
          type="password"
          placeholder="••••••••"
          class="w-full bg-[#404040] rounded-[15px] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span v-if="passwordError" class="text-red-400 text-sm mt-1">{{ passwordError }}</span>
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
