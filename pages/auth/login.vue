<script setup lang="ts">
import { useField, useForm } from "vee-validate";
import * as yup from "yup";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useApi } from "~/composables/useApi";
import { useUserStore } from "~/store/useUserStore";

definePageMeta({ layout: "auth" });

useHead({ title: "Konkurent CRM" });

interface ConfirmedCompany {
  login: string;
  name: string;
  id?: string;
  companyId?: string;
  subdomain?: string;
  isActive?: boolean;
}

const schema = yup.object({
  companyLogin: yup.string().trim().required("Укажите компанию"),
  countryCode: yup.string().required("Выберите код"),
  phone: yup
    .string()
    .required("Телефон обязателен")
    .matches(/^\d{2} \d{3} \d{2} \d{2}$/, "Неверный формат"),
  password: yup
    .string()
    .required("Пароль обязателен")
    .min(8, "Минимум 8 символов"),
});

const { handleSubmit, setFieldError, setFieldValue } = useForm({
  validationSchema: schema,
  initialValues: {
    companyLogin: "",
    countryCode: "+998",
    phone: "",
    password: "",
  },
});

const { value: companyLogin, errorMessage: companyLoginError } = useField<string>("companyLogin");
const { value: countryCode, errorMessage: codeError } = useField<string>("countryCode");
const { value: phone, errorMessage: phoneError } = useField<string>("phone");
const { value: password, errorMessage: passwordError } = useField<string>("password");

const router = useRouter();
const userStore = useUserStore();
const { apiFetch } = useApi();

const currentStep = ref<"company" | "credentials">("company");
const confirmedCompany = ref<ConfirmedCompany | null>(null);
const loading = ref(false);
const shopChecking = ref(false);
const serverError = ref<string | null>(null);
const showDropdown = ref(false);
const showPassword = ref(false);
const countrySelectRef = ref<HTMLElement | null>(null);
const options = ["+998", "+7", "+1"];

const phoneGroupError = computed(() => Boolean(codeError.value || phoneError.value));

function formatPhone(input = "") {
  const numbersOnly = input.replace(/\D/g, "").slice(0, 9);
  const parts: string[] = [];

  if (numbersOnly.length > 0) parts.push(numbersOnly.slice(0, 2));
  if (numbersOnly.length > 2) parts.push(numbersOnly.slice(2, 5));
  if (numbersOnly.length > 5) parts.push(numbersOnly.slice(5, 7));
  if (numbersOnly.length > 7) parts.push(numbersOnly.slice(7, 9));

  return parts.join(" ");
}

watch(phone, (newValue) => {
  const formatted = formatPhone(newValue || "");
  if (formatted !== newValue) {
    phone.value = formatted;
  }
});

watch(companyLogin, () => {
  serverError.value = null;

  if (
    confirmedCompany.value &&
    String(companyLogin.value || "").trim() !== confirmedCompany.value.login
  ) {
    confirmedCompany.value = null;
    currentStep.value = "company";
  }
});

function selectOption(code: string) {
  countryCode.value = code;
  showDropdown.value = false;
}

function toggleDropdown() {
  showDropdown.value = !showDropdown.value;
}

function handleDocumentClick(event: MouseEvent) {
  const target = event.target as Node | null;
  if (!target || !countrySelectRef.value?.contains(target)) {
    showDropdown.value = false;
  }
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === "Escape") {
    showDropdown.value = false;
  }
}

onMounted(() => {
  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("keydown", handleEscape);
  const saved = localStorage.getItem("company_login");
  if (saved) companyLogin.value = saved;
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleDocumentClick);
  document.removeEventListener("keydown", handleEscape);
});

function resolveServerMessage(error: unknown, fallback: string) {
  const status = (error as any)?.statusCode ?? (error as any)?.status ?? (error as any)?.response?.status;
  if (status === 429) {
    return "Слишком много попыток входа. Подождите 1 минуту.";
  }

  const message = (error as any)?.data?.message;

  if (Array.isArray(message)) {
    return message.join(", ");
  }

  return message || (error instanceof Error ? error.message : fallback);
}

async function verifyCompany() {
  serverError.value = null;

  const normalizedCompanyLogin = String(companyLogin.value || "").trim();
  setFieldValue("companyLogin", normalizedCompanyLogin);

  if (!normalizedCompanyLogin) {
    setFieldError("companyLogin", "Укажите компанию");
    return;
  }

  shopChecking.value = true;

  try {
    const response: any = await apiFetch("/auth/company-login", {
      method: "POST",
      body: {
        company_login: normalizedCompanyLogin,
      },
    });

    if (response?.company?.is_active === false) {
      throw new Error("Компания отключена");
    }

    confirmedCompany.value = {
      login: normalizedCompanyLogin,
      name:
        String(response?.company?.name || "").trim() || "Компания найдена",
      id: response?.company?.id ? String(response.company.id) : undefined,
      companyId: response?.company?.company_id ? String(response.company.company_id) : undefined,
      subdomain: response?.company?.subdomain ? String(response.company.subdomain) : undefined,
      isActive: Boolean(response?.company?.is_active),
    };
    localStorage.setItem("company_login", normalizedCompanyLogin);
    currentStep.value = "credentials";
  } catch (error: unknown) {
    confirmedCompany.value = null;
    currentStep.value = "company";
    serverError.value = resolveServerMessage(error, "Не удалось найти компанию");
  } finally {
    shopChecking.value = false;
  }
}

function resetCompanySelection() {
  confirmedCompany.value = null;
  currentStep.value = "company";
  serverError.value = null;
}

const onLogin = handleSubmit(async () => {
  serverError.value = null;

  const activeCompanyLogin =
    confirmedCompany.value?.login || String(companyLogin.value || "").trim();
  if (!activeCompanyLogin) {
    currentStep.value = "company";
    setFieldError("companyLogin", "Укажите компанию");
    return;
  }

  loading.value = true;

  try {
    const digits = String(phone.value || "").replace(/\D/g, "");
    const response: any = await apiFetch("/auth/login", {
      method: "POST",
      body: {
        company_login: activeCompanyLogin,
        phone_number: `${String(countryCode.value || "").trim()}${digits}`,
        password: String(password.value || ""),
      },
    });
    const userType = String(response?.user?.user_type ?? "");

    if (userType && userType !== "company") {
      throw new Error("Этот аккаунт нужно открывать в platform admin panel");
    }

    const token = response?.access_token ?? response?.token;
    const refreshToken = String(response?.refresh_token ?? "").trim();
    if (!token) {
      throw new Error("Token not found in login response");
    }
    if (!refreshToken) {
      throw new Error("Refresh token not found in login response");
    }

    userStore.login(token, response?.user ?? {}, refreshToken);
    await userStore.fetchMe();
    await router.push("/");
  } catch (error: unknown) {
    serverError.value = resolveServerMessage(error, "Ошибка входа");
  } finally {
    loading.value = false;
  }
});

async function handleSubmitAction() {
  if (currentStep.value === "company") {
    await verifyCompany();
    return;
  }

  await onLogin();
}
</script>

<template>
  <div class="auth-card mx-auto w-full max-w-[480px] text-white">
    <div class="brand-row">
      <div class="brand-mark" aria-hidden="true">K</div>
      <div class="brand-text">
        <span class="brand-eyebrow">Konkurent CRM</span>
        <span class="brand-subtitle">Рабочий кабинет</span>
      </div>
    </div>

    <div class="headline">
      <span class="step-badge">
        {{ currentStep === "company" ? "Шаг 1 из 2" : "Шаг 2 из 2" }}
      </span>
      <h1>Вход</h1>
      <p v-if="currentStep === 'company'">
        Сначала укажите компанию. После подтверждения откроется
        вход сотрудника в аккаунт этой компании.
      </p>
      <p v-else>
        Введите номер телефона и пароль для компании
        <strong>{{ confirmedCompany?.name || companyLogin }}</strong>.
      </p>
    </div>

    <form class="form-stack" @submit.prevent="handleSubmitAction">
      <div class="field">
        <label for="company-login" class="label">Компания</label>
        <div
          :class="[
            'field-control field-control-single',
            companyLoginError ? 'field-control-error' : 'field-control-default',
            currentStep === 'credentials' ? 'field-control-locked' : '',
          ]"
        >
          <input
            id="company-login"
            v-model="companyLogin"
            type="text"
            autocomplete="organization"
            placeholder="konkurentcases"
            class="text-input"
            :readonly="currentStep === 'credentials'"
          />

          <button
            v-if="currentStep === 'credentials'"
            type="button"
            class="inline-action"
            @click="resetCompanySelection"
          >
            Сменить
          </button>
        </div>
        <p v-if="companyLoginError" class="help error">{{ companyLoginError }}</p>
        <p v-else class="help hint">
          Например, <code>konkurentcases</code>.
        </p>
      </div>

      <div v-if="currentStep === 'credentials'" class="shop-preview">
        <div>
          <p class="shop-preview-label">Выбранная компания</p>
          <p class="shop-preview-name">{{ confirmedCompany?.name }}</p>
          <p class="shop-preview-login">Логин: {{ confirmedCompany?.login }}</p>
        </div>
        <Icon name="heroicons:building-office-2" class="h-6 w-6 text-sky-300" />
      </div>

      <template v-if="currentStep === 'credentials'">
        <div class="field">
          <label for="phone" class="label">Номер телефона</label>
          <div
            :class="[
              'field-control',
              phoneGroupError ? 'field-control-error' : 'field-control-default',
            ]"
          >
            <div ref="countrySelectRef" class="relative w-[104px] shrink-0">
              <button
                type="button"
                class="code-button"
                :aria-expanded="showDropdown ? 'true' : 'false'"
                @click.stop="toggleDropdown"
              >
                <span>{{ countryCode }}</span>
                <Icon
                  name="heroicons:chevron-down"
                  class="h-4 w-4 transition-transform duration-200"
                  :class="showDropdown ? 'rotate-180' : ''"
                />
              </button>

              <transition name="fade">
                <ul v-if="showDropdown" class="code-menu">
                  <li v-for="option in options" :key="option">
                    <button
                      type="button"
                      class="code-item"
                      @click="selectOption(option)"
                    >
                      {{ option }}
                    </button>
                  </li>
                </ul>
              </transition>
            </div>

            <div class="divider" aria-hidden="true"></div>

            <input
              id="phone"
              v-model="phone"
              type="tel"
              inputmode="numeric"
              autocomplete="tel-national"
              placeholder="90 123 45 67"
              class="text-input"
            />
          </div>
          <p v-if="codeError || phoneError" class="help error">{{ codeError || phoneError }}</p>
        </div>

        <div class="field">
          <label for="password" class="label">Пароль</label>
          <div
            :class="[
              'field-control field-control-single',
              passwordError ? 'field-control-error' : 'field-control-default',
            ]"
          >
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="Ваш пароль"
              class="text-input"
            />

            <button
              type="button"
              class="password-toggle"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? "Скрыть" : "Показать" }}
            </button>
          </div>
          <p v-if="passwordError" class="help error">{{ passwordError }}</p>
        </div>
      </template>

      <button
        type="submit"
        class="submit-btn"
        :disabled="loading || shopChecking"
        :aria-busy="loading || shopChecking ? 'true' : 'false'"
      >
        <span class="flex items-center justify-center gap-2">
          <Icon
            v-if="loading || shopChecking"
            name="heroicons:arrow-path"
            class="h-4 w-4 animate-spin"
          />
          {{
            currentStep === "company"
              ? shopChecking
                ? "Проверяем компанию..."
                : "Продолжить"
              : loading
                ? "Входим..."
                : "Войти"
          }}
        </span>
      </button>
    </form>

    <p v-if="serverError" class="help server">{{ serverError }}</p>
  </div>
</template>

<style scoped>
.auth-card {
  position: relative;
  z-index: 1;
  padding: 32px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(18, 24, 34, 0.96) 0%, rgba(15, 20, 28, 0.94) 100%);
  border: 1px solid rgba(72, 132, 214, 0.18);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.42), inset 0 1px 0 rgba(89, 155, 243, 0.08);
  backdrop-filter: blur(10px);
}

.brand-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.brand-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 14px;
  background: rgba(31, 120, 255, 0.14);
  border: 1px solid rgba(86, 148, 233, 0.22);
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.brand-eyebrow {
  font-size: 0.82rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(147, 192, 248, 0.92);
}

.brand-subtitle {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.56);
}

.headline {
  margin-bottom: 26px;
}

.headline h1 {
  font-size: 2rem;
  font-weight: 600;
  letter-spacing: -0.03em;
  margin-top: 12px;
}

.headline p {
  margin-top: 8px;
  color: rgba(255, 255, 255, 0.62);
  line-height: 1.5;
}

.step-badge {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(31, 120, 255, 0.14);
  border: 1px solid rgba(86, 148, 233, 0.22);
  color: rgba(196, 225, 255, 0.94);
  font-size: 0.76rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.form-stack {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: rgba(255, 255, 255, 0.62);
}

.field-control {
  display: flex;
  align-items: center;
  min-height: 56px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(86, 148, 233, 0.22);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.field-control-single {
  padding-right: 6px;
}

.field-control-default:focus-within {
  border-color: rgba(73, 137, 223, 0.42);
  box-shadow: 0 0 0 3px rgba(31, 120, 255, 0.12);
}

.field-control-error {
  border-color: rgba(248, 113, 113, 0.75);
  box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.08);
}

.field-control-locked {
  background: rgba(255, 255, 255, 0.05);
}

.text-input {
  flex: 1;
  min-width: 0;
  padding: 16px;
  border: 0;
  border-radius: inherit;
  background: transparent;
  color: #fff;
  font-size: 1rem;
  line-height: 1.25;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
}

.text-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.inline-action,
.password-toggle {
  align-self: center;
  padding: 0 12px;
  color: rgba(125, 176, 244, 0.9);
  font-size: 0.82rem;
  transition: color 0.2s ease;
}

.inline-action:hover,
.password-toggle:hover {
  color: rgba(203, 225, 255, 0.95);
}

.shop-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(19, 34, 52, 0.92) 0%, rgba(13, 24, 39, 0.92) 100%);
  border: 1px solid rgba(86, 148, 233, 0.18);
}

.shop-preview-label {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: rgba(150, 198, 255, 0.8);
}

.shop-preview-name {
  margin-top: 6px;
  font-size: 1rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.96);
}

.shop-preview-login {
  margin-top: 4px;
  color: rgba(255, 255, 255, 0.56);
}

.code-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 16px 14px;
  border: 0;
  border-radius: 16px 0 0 16px;
  background: transparent;
  color: rgba(220, 233, 255, 0.94);
  cursor: pointer;
}

.code-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: 100%;
  padding: 4px;
  border-radius: 14px;
  background: rgba(16, 21, 29, 0.98);
  border: 1px solid rgba(86, 148, 233, 0.22);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.28);
  z-index: 10;
}

.code-item {
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  text-align: left;
  color: rgba(255, 255, 255, 0.86);
  transition: background 0.2s ease;
}

.code-item:hover {
  background: rgba(31, 120, 255, 0.14);
}

.divider {
  width: 1px;
  background: rgba(255, 255, 255, 0.08);
}

.submit-btn {
  min-height: 56px;
  border: 0;
  border-radius: 16px;
  background: #1f78ff;
  color: #f5f9ff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s ease, transform 0.2s ease, background 0.2s ease;
}

.submit-btn:hover:not(:disabled) {
  box-shadow: 0 12px 30px rgba(31, 120, 255, 0.28);
  background: #2b84ff;
  transform: translateY(-1px);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.help {
  font-size: 0.84rem;
}

.help.error,
.help.server {
  color: rgba(248, 113, 113, 0.96);
}

.help.hint {
  color: rgba(255, 255, 255, 0.5);
}

.help.server {
  margin-top: 16px;
  text-align: center;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (max-width: 640px) {
  .auth-card {
    padding: 24px;
    border-radius: 20px;
  }

  .headline h1 {
    font-size: 1.75rem;
  }

  .code-button {
    padding: 0 12px;
  }

  .shop-preview {
    align-items: flex-start;
  }
}
</style>
