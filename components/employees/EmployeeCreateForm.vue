<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useApi } from "~/composables/useApi";
import { useUserStore } from "@/store/useUserStore";


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
  },
);

const { apiFetch } = useApi();
const userStore = useUserStore();

const first_name = ref("");
const last_name = ref("");
const birth_date = ref("");
const countryCode = ref("+998");
const phone = ref("");
const password = ref("");
const role = ref("employee");
const current_shop_id = ref("");
const allowed_shop_ids = ref<string[]>([]);
const can_switch_shops = ref(false);

const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const shopOptions = computed(() =>
  (userStore.user.shops || []).map((shop) => ({
    label: shop.name,
    value: shop.id,
    branchCode: shop.branchCode || "",
  })),
);

const selectedShopCount = computed(() => allowed_shop_ids.value.length);
function formatRoleLabel(roleValue: string) {
  const normalized = String(roleValue || "").trim();
  if (!normalized) return "";
  return normalized
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const roleOptions = computed(() => {
  const values = new Set<string>([...userStore.normalizedRoles, role.value].filter(Boolean));
  return [...values].map((value) => ({
    label: formatRoleLabel(value),
    value,
  }));
});

const currentShopLabel = computed(
  () => shopOptions.value.find((shop) => shop.value === current_shop_id.value)?.label || "Не выбран",
);

watch(
  shopOptions,
  (options) => {
    const availableIds = new Set(options.map((option) => option.value));
    allowed_shop_ids.value = allowed_shop_ids.value.filter((id) => availableIds.has(id));

    if (!allowed_shop_ids.value.length && options.length) {
      const fallbackId = userStore.user.currentShopId || options[0]?.value || "";
      allowed_shop_ids.value = fallbackId ? [fallbackId] : [];
    }

    if (!allowed_shop_ids.value.includes(current_shop_id.value)) {
      current_shop_id.value = allowed_shop_ids.value[0] || "";
    }
  },
  { immediate: true },
);

watch(can_switch_shops, (value) => {
  if (value) {
    return;
  }

  const fallbackId = current_shop_id.value || allowed_shop_ids.value[0] || "";
  allowed_shop_ids.value = fallbackId ? [fallbackId] : [];
});

watch(current_shop_id, (shopId) => {
  if (!shopId) {
    return;
  }

  if (!allowed_shop_ids.value.includes(shopId)) {
    allowed_shop_ids.value = can_switch_shops.value
      ? [...allowed_shop_ids.value, shopId]
      : [shopId];
  }
});

function toggleAllowedShop(shopId: string) {
  if (!shopId) {
    return;
  }

  const exists = allowed_shop_ids.value.includes(shopId);

  if (exists) {
    if (!can_switch_shops.value || allowed_shop_ids.value.length === 1) {
      allowed_shop_ids.value = [shopId];
      current_shop_id.value = shopId;
      return;
    }

    allowed_shop_ids.value = allowed_shop_ids.value.filter((id) => id !== shopId);
    if (current_shop_id.value === shopId) {
      current_shop_id.value = allowed_shop_ids.value[0] || "";
    }
    return;
  }

  allowed_shop_ids.value = can_switch_shops.value
    ? [...allowed_shop_ids.value, shopId]
    : [shopId];
  if (!current_shop_id.value) {
    current_shop_id.value = shopId;
  }
}

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
    user_type: "company",
    company_id: userStore.user.companyId || undefined,
    first_name: first_name.value.trim(),
    last_name: last_name.value.trim(),
    birth_date: birth_date.value.trim() || undefined,
    phone_number: `${code}${digits}`,
    password: password.value,
    role: role.value.trim(),
    current_shop_id: current_shop_id.value,
    allowed_shop_ids: [...allowed_shop_ids.value],
    can_switch_shops: can_switch_shops.value,
  };
});

function resetForm() {
  first_name.value = "";
  last_name.value = "";
  birth_date.value = "";
  phone.value = "";
  password.value = "";
  role.value = "employee";
  can_switch_shops.value = false;
  const fallbackId = userStore.user.currentShopId || shopOptions.value[0]?.value || "";
  current_shop_id.value = fallbackId;
  allowed_shop_ids.value = fallbackId ? [fallbackId] : [];
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
  if (!preparedData.value.current_shop_id) {
    errorMessage.value = "Укажите текущий филиал.";
    return;
  }
  if (!preparedData.value.allowed_shop_ids.length) {
    errorMessage.value = "Выберите хотя бы один доступный филиал.";
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
  <div class="overflow-hidden rounded-[30px] border border-white/8 bg-[#262626] shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
    <div class="border-b border-white/8 bg-[linear-gradient(135deg,rgba(31,120,255,0.18),rgba(38,38,38,0.96)_45%,rgba(38,38,38,1))] px-6 py-6">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="mb-2 text-[12px] font-semibold uppercase tracking-[0.28em] text-[#7fb0ff]">
            Company User
          </p>
          <h3 class="text-[28px] font-semibold text-white">Новый сотрудник</h3>
          <p class="mt-2 max-w-[620px] text-sm leading-6 text-[#bdbdbd]">
            Создание пользователя через `POST /users/add` с актуальными правами по филиалам.
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <span class="rounded-full border border-[#2f6ed6] bg-[#10294f] px-3 py-1 text-xs font-medium text-[#9fc0ff]">
            {{ selectedShopCount }} филиал(ов)
          </span>
          <span class="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-xs font-medium text-white">
            Текущий: {{ currentShopLabel }}
          </span>
        </div>
      </div>
    </div>

    <div class="p-6">
      <div v-if="errorMessage" class="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        {{ errorMessage }}
      </div>

      <div v-if="successMessage" class="mb-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
        {{ successMessage }}
      </div>

      <form class="space-y-6" @submit.prevent="submit">
        <section class="rounded-[24px] border border-white/8 bg-[#2d2d2d] p-5">
          <div class="mb-5">
            <h4 class="text-lg font-semibold text-white">Основные данные</h4>
            <p class="mt-1 text-sm text-[#9b9b9b]">Имя, дата рождения, роль и телефон сотрудника.</p>
          </div>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-[#d6d6d6]">Имя</label>
              <input v-model="first_name" type="text" placeholder="Sardor" class="rounded-2xl border border-transparent bg-[#3a3a3a] px-4 py-3 text-white outline-none transition focus:border-[#2f6ed6] focus:bg-[#434343]" />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-[#d6d6d6]">Фамилия</label>
              <input v-model="last_name" type="text" placeholder="Obidjanov" class="rounded-2xl border border-transparent bg-[#3a3a3a] px-4 py-3 text-white outline-none transition focus:border-[#2f6ed6] focus:bg-[#434343]" />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-[#d6d6d6]">Дата рождения</label>
              <input v-model="birth_date" type="text" placeholder="10.10.2002" class="rounded-2xl border border-transparent bg-[#3a3a3a] px-4 py-3 text-white outline-none transition focus:border-[#2f6ed6] focus:bg-[#434343]" />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-[#d6d6d6]">Роль</label>
              <select v-model="role" class="rounded-2xl border border-transparent bg-[#3a3a3a] px-4 py-3 text-white outline-none transition focus:border-[#2f6ed6] focus:bg-[#434343]">
                <option v-for="option in roleOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>
          </div>

          <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[120px_minmax(0,1fr)]">
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-[#d6d6d6]">Код</label>
              <input v-model="countryCode" type="text" class="rounded-2xl border border-transparent bg-[#3a3a3a] px-4 py-3 text-white outline-none transition focus:border-[#2f6ed6] focus:bg-[#434343]" />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-[#d6d6d6]">Телефон</label>
              <input v-model="phone" type="tel" placeholder="99 825 32 22" class="rounded-2xl border border-transparent bg-[#3a3a3a] px-4 py-3 text-white outline-none transition focus:border-[#2f6ed6] focus:bg-[#434343]" />
            </div>
          </div>

          <div class="mt-4 flex flex-col gap-2">
            <label class="text-sm font-medium text-[#d6d6d6]">Пароль</label>
            <input v-model="password" type="password" placeholder="Минимум 6 символов" class="rounded-2xl border border-transparent bg-[#3a3a3a] px-4 py-3 text-white outline-none transition focus:border-[#2f6ed6] focus:bg-[#434343]" />
          </div>
        </section>

        <section class="rounded-[24px] border border-white/8 bg-[#2d2d2d] p-5">
          <div class="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h4 class="text-lg font-semibold text-white">Филиалы и права доступа</h4>
              <p class="mt-1 text-sm text-[#9b9b9b]">
                Настрой текущий филиал, список доступных филиалов и право на переключение.
              </p>
            </div>

            <label class="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-white">
              <input v-model="can_switch_shops" type="checkbox" class="h-4 w-4 accent-[#1f78ff]" />
              Может переключать филиалы
            </label>
          </div>

          <div class="mb-5 flex flex-col gap-2">
            <label class="text-sm font-medium text-[#d6d6d6]">Текущий филиал</label>
            <select v-model="current_shop_id" class="rounded-2xl border border-transparent bg-[#3a3a3a] px-4 py-3 text-white outline-none transition focus:border-[#2f6ed6] focus:bg-[#434343]">
              <option value="" disabled>Выберите филиал</option>
              <option v-for="shop in shopOptions" :key="shop.value" :value="shop.value">
                {{ shop.label }}
              </option>
            </select>
          </div>

          <div v-if="shopOptions.length" class="grid grid-cols-1 gap-3 md:grid-cols-2">
            <button
              v-for="shop in shopOptions"
              :key="shop.value"
              type="button"
              class="rounded-[22px] border px-4 py-4 text-left transition"
              :class="allowed_shop_ids.includes(shop.value)
                ? 'border-[#2f6ed6] bg-[#16355f] shadow-[inset_0_0_0_1px_rgba(127,176,255,0.18)]'
                : 'border-white/8 bg-[#383838] hover:border-white/15 hover:bg-[#404040]'"
              @click="toggleAllowedShop(shop.value)"
            >
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="font-medium text-white">{{ shop.label }}</p>
                  <p class="mt-1 text-xs text-[#a6a6a6]">
                    {{ shop.branchCode || 'Доступный филиал компании' }}
                  </p>
                </div>

                <div class="mt-0.5 flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-semibold"
                  :class="allowed_shop_ids.includes(shop.value) ? 'bg-[#1f78ff] text-white' : 'bg-white/8 text-[#bdbdbd]'">
                  {{ allowed_shop_ids.includes(shop.value) ? 'Да' : 'Нет' }}
                </div>
              </div>
            </button>
          </div>

          <p v-else class="rounded-2xl border border-white/8 bg-[#353535] px-4 py-3 text-sm text-[#bdbdbd]">
            Доступные филиалы не найдены в `/auth/me`.
          </p>
        </section>

        <div class="flex flex-wrap items-center gap-3">
          <button type="submit" :disabled="loading" class="rounded-2xl bg-[#1f78ff] px-6 py-3.5 font-semibold text-white transition hover:bg-[#2a6ed9] disabled:cursor-not-allowed disabled:opacity-60">
            {{ loading ? "Сохранение..." : props.submitLabel || "Создать сотрудника" }}
          </button>

          <button v-if="props.showCancel" type="button" class="rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10" @click="$emit('cancel')">
            Отмена
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
