<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { navigateTo, useHead } from "#imports";
import { useApi } from "~/composables/useApi";
import { useUserStore } from "@/store/useUserStore";
import { type RoleSelectItem, useRolePermissionsApi } from "@/composables/useRolePermissions";
import SellerSalaryCard from "~/components/reports/SellerSalaryCard.vue";
import SellerSalaryBreakdown from "~/components/reports/SellerSalaryBreakdown.vue";
import { useSalarySettingsApi, type SellerSalarySettings } from "~/composables/useSalarySettingsApi";
import { formatUzPhoneInput } from "~/utils/phone";

useHead({ title: "Редактирование сотрудника | Konkurent" });


type User = {
  id?: number | string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  role?: string | { id?: string; name?: string; code?: string; role_id?: string };
  roles?: Array<any>;
  crm_role_id?: string;
  current_shop_id?: string;
  current_shop?: {
    id?: string;
    shop_id?: string;
  };
  allowed_shop_ids?: string[];
  shops?: Array<any>;
  can_switch_shops?: boolean;
};

const route = useRoute();
const router = useRouter();
const { apiFetch } = useApi();
const { getCompanyRolesForSelect, getRolesForSelect } = useRolePermissionsApi();
const salaryApi = useSalarySettingsApi();
const userStore = useUserStore();
const toast = useToast();
const { can } = useAccessControl();

const id = computed(() => route.params.id as string);

const loading = ref(false);
const saving = ref(false);
const serverError = ref<string | null>(null);
const serverOk = ref<string | null>(null);

const firstName = ref("");
const lastName = ref("");
const phone = ref("");
const password = ref("");
const role = ref("");
const crm_role_id = ref("");
const current_shop_id = ref("");
const allowed_shop_ids = ref<string[]>([]);
const can_switch_shops = ref(false);
const roleOptions = ref<RoleSelectItem[]>([]);
const companyRoleOptions = ref<RoleSelectItem[]>([]);
const rolesLoading = ref(false);
const salaryLoading = ref(false);
const salarySaving = ref(false);
const salaryReport = ref<any | null>(null);
const salarySettings = ref<SellerSalarySettings>({
  fixedSalary: 0,
  salaryPercent: 0,
  calculationType: "FIXED_PLUS_PROFIT",
  bonusEnabled: true,
  isActive: true,
});
const salaryPeriod = reactive({
  from: "",
  to: "",
});

const canViewSalary = computed(() => can("salary.view") || can("salary.manage"));
const canManageSalary = computed(() => can("salary.manage"));

watch(phone, (value) => {
  const formatted = formatUzPhoneInput(value);
  if (formatted !== value) phone.value = formatted;
});

const shopOptions = computed(() =>
  (userStore.userState.shops || []).map((shop) => ({
    label: shop.name,
    value: shop.id,
  })),
);

const selectedShopCount = computed(() => allowed_shop_ids.value.length);

const currentShopLabel = computed(
  () => shopOptions.value.find((shop) => shop.value === current_shop_id.value)?.label || "Не выбран",
);

watch(
  shopOptions,
  (options) => {
    const availableIds = new Set(options.map((option) => option.value));
    allowed_shop_ids.value = allowed_shop_ids.value.filter((shopId) => availableIds.has(shopId));

    if (!allowed_shop_ids.value.length && options.length) {
      const fallbackId = current_shop_id.value || userStore.userState.currentShopId || options[0]?.value || "";
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
}

function normalizeLookup(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function systemRoleCode(value: string) {
  const normalized = normalizeLookup(value);
  const allowed = new Set(["admin", "employee", "cashier", "owner", "store_manager"]);
  return allowed.has(normalized) ? normalized : "";
}

function roleCodeFromName(name: string) {
  const normalized = normalizeLookup(name);
  const known: Record<string, string> = {
    "админ": "admin",
    "administrator": "admin",
    "admin": "admin",
    "сотрудник": "employee",
    "employee": "employee",
    "кассир": "cashier",
    "cashier": "cashier",
    "владелец": "owner",
    "owner": "owner",
    "управляющий_магазином": "store_manager",
    "менеджер_магазина": "store_manager",
    "store_manager": "store_manager",
  };

  return known[normalized] || "";
}

function normalizeRoleId(user: User) {
  return String(
    user?.crm_role_id ??
      (typeof user.role === "object" ? user.role?.id : "") ??
      user.roles?.[0]?.crm_role_id ??
      user.roles?.[0]?.role?.id ??
      user.roles?.[0]?.id ??
      "",
  ).trim();
}

function normalizeBaseRole(user: User) {
  const primaryRole = user?.role;

  return String(
    (typeof primaryRole === "object"
      ? primaryRole?.code ?? primaryRole?.role_id ?? primaryRole?.id ?? primaryRole?.name
      : primaryRole) ??
      user.roles?.[0]?.role_id ??
      user.roles?.[0]?.role?.code ??
      user.roles?.[0]?.role?.role_id ??
      user.roles?.[0]?.role?.id ??
      user.roles?.[0]?.role?.name ??
      "",
  ).trim();
}

function selectedRoleCode() {
  const selectedCrmRole = roleOptions.value.find((item) => item.id === crm_role_id.value);
  const selectedCode = String(selectedCrmRole?.code || role.value || "").trim();
  const selectedName = String(selectedCrmRole?.name || "").trim();
  const matchedCompanyRole = companyRoleOptions.value.find((item) => {
    const code = normalizeLookup(item.code || item.id);
    const name = normalizeLookup(item.name);
    return (
      code === normalizeLookup(selectedCode) ||
      name === normalizeLookup(selectedName) ||
      code === normalizeLookup(roleCodeFromName(selectedName))
    );
  });

  return (
    systemRoleCode(selectedCode) ||
    systemRoleCode(matchedCompanyRole?.code || "") ||
    systemRoleCode(matchedCompanyRole?.id || "") ||
    roleCodeFromName(selectedName) ||
    "employee"
  );
}

async function loadRoles() {
  rolesLoading.value = true;
  try {
    const [crmRoles, companyRoles] = await Promise.all([
      getRolesForSelect(),
      getCompanyRolesForSelect().catch(() => []),
    ]);
    roleOptions.value = crmRoles;
    companyRoleOptions.value = companyRoles;
    if (!crm_role_id.value) {
      crm_role_id.value = roleOptions.value[0]?.id || "";
    }
  } catch {
    roleOptions.value = [];
    companyRoleOptions.value = [];
  } finally {
    rolesLoading.value = false;
  }
}

function normalizeAllowedShops(user: User) {
  const direct = Array.isArray(user.allowed_shop_ids)
    ? user.allowed_shop_ids.map((item) => String(item))
    : [];

  if (direct.length) {
    return direct;
  }

  const shops = Array.isArray(user.shops)
    ? user.shops
        .map((shop: any) => String(shop?.shop_id ?? shop?.id ?? ""))
        .filter(Boolean)
    : [];

  if (shops.length) {
    return shops;
  }

  const fallback = String(user.current_shop_id ?? user.current_shop?.shop_id ?? "");
  return fallback ? [fallback] : [];
}

async function ensureAdminAccess() {
  if (!can("employee-edit")) {
    await navigateTo("/management/employees");
    return false;
  }

  return true;
}

async function fetchUser() {
  if (!id.value) return;
  if (!(await ensureAdminAccess())) return;

  loading.value = true;
  serverError.value = null;

  try {
    const user = await apiFetch<User>(`/users/${encodeURIComponent(String(id.value))}`, {
      method: "GET",
    });

    firstName.value = user?.first_name || "";
    lastName.value = user?.last_name || "";
    phone.value = formatUzPhoneInput(user?.phone_number);
    role.value = normalizeBaseRole(user);
    crm_role_id.value = normalizeRoleId(user) || roleOptions.value[0]?.id || "";
    current_shop_id.value = String(
      user?.current_shop_id ?? user?.current_shop?.id ?? user?.current_shop?.shop_id ?? "",
    );
    allowed_shop_ids.value = normalizeAllowedShops(user);
    can_switch_shops.value = Boolean(user?.can_switch_shops);

    if (!current_shop_id.value && allowed_shop_ids.value.length) {
      current_shop_id.value = allowed_shop_ids.value[0] || "";
    }
  } catch (e: any) {
    serverError.value = e?.data?.message || e?.message || "Не удалось загрузить пользователя";
  } finally {
    loading.value = false;
  }
}

async function loadSalaryData() {
  if (!id.value || !canViewSalary.value) return;

  salaryLoading.value = true;
  try {
    const today = new Date();
    if (!salaryPeriod.from || !salaryPeriod.to) {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      salaryPeriod.from = start.toISOString().slice(0, 10);
      salaryPeriod.to = today.toISOString().slice(0, 10);
    }

    const [settings, report] = await Promise.all([
      salaryApi.getSalarySettings(id.value),
      salaryApi.getSalaryReport(id.value, { from: salaryPeriod.from, to: salaryPeriod.to }),
    ]);

    salarySettings.value = settings;
    salaryReport.value = report;
  } catch (error: any) {
    serverError.value = error?.data?.message || error?.message || "Не удалось загрузить настройки зарплаты";
  } finally {
    salaryLoading.value = false;
  }
}

onMounted(async () => {
  await loadRoles();
  await fetchUser();
  await loadSalaryData();
});
watch(id, async () => {
  await fetchUser();
  await loadSalaryData();
});

async function saveMainData() {
  if (!id.value || !can("employee-edit")) return;
  if (!crm_role_id.value) {
    serverError.value = "Выберите роль сотрудника.";
    return;
  }
  const roleCode = selectedRoleCode();
  if (!roleCode) {
    serverError.value = "Не удалось определить код роли. Проверьте ответ /company/roles.";
    return;
  }

  saving.value = true;
  serverError.value = null;
  serverOk.value = null;

  try {
    await apiFetch(`/users/${encodeURIComponent(String(id.value))}`, {
      method: "PUT",
      body: {
        first_name: String(firstName.value || "").trim(),
        last_name: String(lastName.value || "").trim(),
        crm_role_id: String(crm_role_id.value || "").trim(),
        current_shop_id: String(current_shop_id.value || ""),
        allowed_shop_ids: [...allowed_shop_ids.value],
        can_switch_shops: can_switch_shops.value,
      },
    });
    serverOk.value = "Данные сотрудника сохранены";
    await fetchUser();
    if (String(id.value) === String(userStore.userState.id ?? "")) {
      await userStore.fetchMe({ force: true });
    }
  } catch (e: any) {
    serverError.value = e?.data?.message || e?.message || "Ошибка сохранения";
  } finally {
    saving.value = false;
  }
}

async function savePhonePassword() {
  if (!id.value || !can("employee-edit")) return;
  if (!phone.value && !password.value) return;

  saving.value = true;
  serverError.value = null;
  serverOk.value = null;

  try {
    const payload: any = {};
    if (phone.value) {
      const digits = String(phone.value).replace(/\D/g, "");
      payload.phone_number = digits.length === 9 ? `998${digits}` : digits;
    }
    if (password.value) payload.password = String(password.value);

    await apiFetch(`/users/${encodeURIComponent(String(id.value))}`, {
      method: "PUT",
      body: payload,
    });

    serverOk.value = "Телефон и пароль обновлены";
    password.value = "";
    await fetchUser();
  } catch (e: any) {
    serverError.value = e?.data?.message || e?.message || "Ошибка сохранения";
  } finally {
    saving.value = false;
  }
}

function goBack() {
  router.push("/management/employees");
}

async function saveSalaryData() {
  if (!id.value || !canManageSalary.value) return;

  salarySaving.value = true;
  serverError.value = null;
  serverOk.value = null;

  try {
    salarySettings.value = await salaryApi.updateSalarySettings(id.value, salarySettings.value);
    serverOk.value = "Настройки зарплаты сохранены";
    toast.add({ title: "Настройки зарплаты сохранены", color: "success" });
    await loadSalaryData();
  } catch (error: any) {
    serverError.value = error?.data?.message || error?.message || "Не удалось сохранить настройки зарплаты";
    toast.add({ title: "Не удалось сохранить настройки зарплаты", description: serverError.value || undefined, color: "error" });
  } finally {
    salarySaving.value = false;
  }
}
</script>

<template>
  <section class="w-full text-white">
    <div class="mb-6 flex items-center justify-between">
      <h2 class="text-2xl font-bold">Редактировать сотрудника</h2>
      <button class="text-blue-400 hover:underline" @click="goBack">
        К списку сотрудников
      </button>
    </div>

    <div class="overflow-hidden rounded-[30px] border border-white/8 bg-[#262626] shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
      <div class="border-b border-white/8 bg-[linear-gradient(135deg,rgba(31,120,255,0.18),rgba(38,38,38,0.96)_45%,rgba(38,38,38,1))] px-6 py-6">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="mb-2 text-[12px] font-semibold uppercase tracking-[0.28em] text-[#7fb0ff]">
              Пользователь компании
            </p>
            <h3 class="text-[28px] font-semibold text-white">
              {{ firstName || "Сотрудник" }} {{ lastName }}
            </h3>
            <p class="mt-2 max-w-[620px] text-sm leading-6 text-[#bdbdbd]">
              Редактирование данных сотрудника, прав по филиалам, телефона и пароля.
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
        <div class="mb-5 flex items-center gap-3">
          <button class="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10" @click="fetchUser">
            Обновить
          </button>
          <span v-if="loading" class="text-sm text-[#aaa]">Загрузка...</span>
        </div>

        <div v-if="serverError" class="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {{ serverError }}
        </div>

        <div v-if="serverOk" class="mb-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {{ serverOk }}
        </div>

        <div class="space-y-6">
          <section class="rounded-[24px] border border-white/8 bg-[#2d2d2d] p-5">
            <div class="mb-5">
              <h4 class="text-lg font-semibold text-white">Основные данные</h4>
              <p class="mt-1 text-sm text-[#9b9b9b]">Имя, роль и права по филиалам.</p>
            </div>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div class="flex flex-col gap-2">
                <label class="text-sm font-medium text-[#d6d6d6]">Имя</label>
                <input v-model="firstName" type="text" class="rounded-2xl border border-transparent bg-[#3a3a3a] px-4 py-3 text-white outline-none transition focus:border-[#2f6ed6] focus:bg-[#434343]" placeholder="Ivan" />
              </div>

              <div class="flex flex-col gap-2">
                <label class="text-sm font-medium text-[#d6d6d6]">Фамилия</label>
                <input v-model="lastName" type="text" class="rounded-2xl border border-transparent bg-[#3a3a3a] px-4 py-3 text-white outline-none transition focus:border-[#2f6ed6] focus:bg-[#434343]" placeholder="Petrov" />
              </div>

              <div class="flex flex-col gap-2">
                <label class="text-sm font-medium text-[#d6d6d6]">Роль</label>
                <select v-model="crm_role_id" :disabled="rolesLoading" class="rounded-2xl border border-transparent bg-[#3a3a3a] px-4 py-3 text-white outline-none transition focus:border-[#2f6ed6] focus:bg-[#434343] disabled:opacity-70">
                  <option value="" disabled>Выберите роль</option>
                  <option v-for="option in roleOptions" :key="option.id" :value="option.id">
                    {{ option.name || option.id }}
                  </option>
                </select>
              </div>

              <div class="flex flex-col gap-2">
                <label class="text-sm font-medium text-[#d6d6d6]">Текущий филиал</label>
                <select v-model="current_shop_id" class="rounded-2xl border border-transparent bg-[#3a3a3a] px-4 py-3 text-white outline-none transition focus:border-[#2f6ed6] focus:bg-[#434343]">
                  <option value="" disabled>Выберите филиал</option>
                  <option v-for="shop in shopOptions" :key="shop.value" :value="shop.value">
                    {{ shop.label }}
                  </option>
                </select>
              </div>
            </div>

            <div class="mt-5 rounded-[22px] border border-white/8 bg-[#333333] p-4">
              <div class="mb-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h5 class="font-semibold text-white">Доступные филиалы</h5>
                  <p class="mt-1 text-sm text-[#9b9b9b]">
                    Выбери, в каких филиалах сотрудник может работать.
                  </p>
                </div>

                <label class="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-white">
                  <input v-model="can_switch_shops" type="checkbox" class="h-4 w-4 accent-[#1f78ff]" />
                  Может переключать филиалы
                </label>
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
                      <p class="mt-1 text-xs text-[#a6a6a6]">Доступный филиал компании</p>
                    </div>

                    <div
                      class="mt-0.5 flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-semibold"
                      :class="allowed_shop_ids.includes(shop.value) ? 'bg-[#1f78ff] text-white' : 'bg-white/8 text-[#bdbdbd]'"
                    >
                      {{ allowed_shop_ids.includes(shop.value) ? "Да" : "Нет" }}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div class="mt-5">
              <button :disabled="saving" class="rounded-2xl bg-[#1f78ff] px-6 py-3.5 font-semibold text-white transition hover:bg-[#2a6ed9] disabled:opacity-60" @click="saveMainData">
                Сохранить сотрудника
              </button>
            </div>
          </section>

          <section class="rounded-[24px] border border-white/8 bg-[#2d2d2d] p-5">
            <div class="mb-5">
              <h4 class="text-lg font-semibold text-white">Контакты и безопасность</h4>
              <p class="mt-1 text-sm text-[#9b9b9b]">Отдельный блок для телефона и смены пароля.</p>
            </div>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div class="flex flex-col gap-2">
                <label class="text-sm font-medium text-[#d6d6d6]">Телефон</label>
                <input v-model="phone" type="tel" class="rounded-2xl border border-transparent bg-[#3a3a3a] px-4 py-3 text-white outline-none transition focus:border-[#2f6ed6] focus:bg-[#434343]" placeholder="94 612 08 44" />
              </div>

              <div class="flex flex-col gap-2">
                <label class="text-sm font-medium text-[#d6d6d6]">Новый пароль</label>
                <input v-model="password" type="password" class="rounded-2xl border border-transparent bg-[#3a3a3a] px-4 py-3 text-white outline-none transition focus:border-[#2f6ed6] focus:bg-[#434343]" placeholder="newpass123" />
              </div>
            </div>

            <div class="mt-5">
              <button :disabled="saving" class="rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10 disabled:opacity-60" @click="savePhonePassword">
                Обновить телефон и пароль
              </button>
            </div>
          </section>

          <section v-if="canViewSalary" class="rounded-[24px] border border-white/8 bg-[#2d2d2d] p-5">
            <div class="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h4 class="text-lg font-semibold text-white">Зарплата продавца</h4>
                <p class="mt-1 text-sm text-[#9b9b9b]">Фикс, процент, тип начисления и прозрачная расшифровка бонуса.</p>
              </div>

              <div class="flex flex-wrap gap-3">
                <label class="space-y-1">
                  <span class="text-xs font-medium text-[#bdbdbd]">Период от</span>
                  <AppDatePicker v-model="salaryPeriod.from" class="w-full" />
                </label>
                <label class="space-y-1">
                  <span class="text-xs font-medium text-[#bdbdbd]">Период до</span>
                  <AppDatePicker v-model="salaryPeriod.to" class="w-full" />
                </label>
                <button class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10" @click="loadSalaryData">
                  Обновить отчет
                </button>
              </div>
            </div>

            <div class="grid gap-5 xl:grid-cols-[400px_minmax(0,1fr)]">
              <SellerSalaryCard v-model="salarySettings" :can-manage="canManageSalary" :saving="salarySaving" :loading="salaryLoading" @save="saveSalaryData" />
              <SellerSalaryBreakdown :report="salaryReport" />
            </div>
          </section>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
input::placeholder {
  color: #9b9b9b;
}
</style>
