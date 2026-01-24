<script setup lang="ts">
import { useForm, useField } from "vee-validate";
import * as yup from "yup";
import { ref, watch, computed } from "vue";
import { useRouter } from "vue-router";

definePageMeta({ layout: "auth" });

const schema = yup.object({
  countryCode: yup.string().required("Выберите код"),
  phone: yup.string().required("Телефон обязателен").matches(/^\d{2} \d{3} \d{2} \d{2}$/, "Неверный формат"),
  password: yup.string().required("Пароль обязателен").min(6, "Минимум 6 символов"),
});

const { handleSubmit } = useForm({ validationSchema: schema });

const { value: countryCode, errorMessage: codeError } = useField("countryCode", undefined, { initialValue: "+998" });
const { value: phone, errorMessage: phoneError } = useField("phone");
const phoneGroupError = computed(() => !!codeError.value || !!phoneError.value);
const { value: password, errorMessage: passwordError } = useField("password");

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
const router = useRouter();

const onSubmit = handleSubmit(async () => {
  serverError.value = null;
  loading.value = true;
  try {
    router.push("/");
  } catch (e: any) {
    serverError.value = e?.message || "Ошибка входа";
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
  <div class="auth-card w-full max-w-[560px] mx-auto text-white">
    <div class="brand-row">
      <div class="brand-mark" aria-hidden="true"></div>
      <div class="brand-text">
        <span class="brand-eyebrow">Konkurent.cases</span>
        <span class="brand-subtitle">Аналитика и кейсы в одном месте</span>
      </div>
    </div>

    <div class="headline">
      <h1>Вход в систему</h1>
      <p>Продолжите работу с вашими данными и последними кейсами.</p>
    </div>

    <form @submit.prevent="onSubmit" class="form-stack">
      <div class="field">
        <label for="phone" class="label">Номер телефона</label>
        <div
          :class="[
            'field-control',
            phoneGroupError ? 'ring-2 ring-red-500/80' : 'focus-within:ring-2 focus-within:ring-emerald-400/70',
          ]"
        >
          <div class="relative w-[120px]">
            <button
              type="button"
              @click="showDropdown = !showDropdown"
              class="code-button"
              :aria-expanded="showDropdown ? 'true' : 'false'"
            >
              <span class="font-semibold tracking-wide">{{ countryCode }}</span>
              <svg class="w-4 h-4 transition-transform duration-200" :class="{ 'rotate-180': showDropdown }" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <transition name="fade">
              <ul v-if="showDropdown" class="code-menu">
                <li v-for="option in options" :key="option" @click="selectOption(option)" class="code-item">
                  {{ option }}
                </li>
              </ul>
            </transition>
          </div>
          <div class="divider" aria-hidden="true"></div>
          <input
            v-model="phone"
            type="tel"
            placeholder="90 123 45 67"
            class="text-input"
          />
        </div>
        <p v-if="codeError || phoneError" class="help error">{{ codeError || phoneError }}</p>
      </div>

      <div class="field">
        <label for="password" class="label">Пароль</label>
        <input
          id="password"
          v-model="password"
          type="password"
          placeholder="Ваш пароль"
          :class="[
            'text-input w-full',
            passwordError ? 'ring-2 ring-red-500/80' : 'focus:ring-2 focus:ring-emerald-400/70',
          ]"
        />
        <p v-if="passwordError" class="help error">{{ passwordError }}</p>
      </div>

      <button
        type="submit"
        :disabled="loading"
        :aria-busy="loading ? 'true' : 'false'"
        class="submit-btn"
      >
        <span class="flex items-center justify-center gap-2">
          <Icon v-if="loading" name="heroicons:arrow-path" class="w-5 h-5 animate-spin" />
          {{ loading ? 'Входим...' : 'Войти' }}
        </span>
      </button>
    </form>

    <p v-if="serverError" class="help server">{{ serverError }}</p>

    <!-- <p class="help muted">
      Нет аккаунта?
      <NuxtLink to="/auth/register" class="link">Зарегистрироваться</NuxtLink>
    </p> -->
  </div>
</template>

<style scoped>
.auth-card {
  position: relative;
  z-index: 1;
  padding: 40px 42px;
  border-radius: 32px;
  background: rgba(18, 22, 28, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(12px);
}

.brand-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 24px;
}

.brand-mark {
  width: 46px;
  height: 46px;
  border-radius: 16px;
  background: linear-gradient(145deg, rgba(16, 185, 129, 0.85), rgba(59, 130, 246, 0.9));
  box-shadow: 0 12px 30px rgba(59, 130, 246, 0.22);
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.brand-eyebrow {
  font-size: 0.9rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.7);
}

.brand-subtitle {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.55);
}

.headline {
  margin-bottom: 28px;
}

.headline h1 {
  font-family: "Space Grotesk", "Manrope", sans-serif;
  font-size: 2.2rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.headline p {
  margin-top: 8px;
  color: rgba(255, 255, 255, 0.6);
}

.form-stack {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: rgba(255, 255, 255, 0.6);
}

.field-control {
  display: flex;
  align-items: stretch;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.2s ease;
}

.code-button {
  width: 100%;
  height: 100%;
  border-radius: 18px 0 0 18px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: rgba(255, 255, 255, 0.9);
  background: transparent;
}

.code-menu {
  position: absolute;
  left: 0;
  margin-top: 8px;
  width: 100%;
  background: rgba(20, 24, 30, 0.98);
  border-radius: 16px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  z-index: 10;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.code-item {
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.code-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.divider {
  width: 1px;
  background: rgba(255, 255, 255, 0.08);
}

.text-input {
  flex: 1;
  background: transparent;
  color: white;
  padding: 14px 18px;
  outline: none;
}

.text-input::placeholder {
  color: rgba(255, 255, 255, 0.45);
}

.submit-btn {
  border-radius: 18px;
  padding: 14px;
  font-weight: 600;
  color: #0c0f12;
  background: linear-gradient(120deg, #34d399, #3b82f6);
  box-shadow: 0 16px 40px rgba(59, 130, 246, 0.25);
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}

.submit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 20px 50px rgba(16, 185, 129, 0.25);
}

.submit-btn:disabled {
  opacity: 0.65;
  transform: none;
  cursor: not-allowed;
}

.help {
  font-size: 0.85rem;
}

.help.error {
  color: rgba(248, 113, 113, 0.95);
}

.help.server {
  margin-top: 18px;
  text-align: center;
  color: rgba(248, 113, 113, 0.9);
}

.help.muted {
  margin-top: 16px;
  text-align: center;
  color: rgba(255, 255, 255, 0.55);
}

.link {
  color: rgba(52, 211, 153, 0.9);
  text-decoration: underline;
}

@media (max-width: 640px) {
  .auth-card {
    padding: 32px 24px;
    border-radius: 24px;
  }

  .headline h1 {
    font-size: 1.9rem;
  }
}
</style>

