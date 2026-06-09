<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import CompanyTabs from "@/components/platform/company/CompanyTabs.vue";
import DataPanel from "@/components/platform/DataPanel.vue";
import EmptyState from "@/components/platform/EmptyState.vue";
import ModalForm from "@/components/platform/ModalForm.vue";
import PageHeader from "@/components/platform/PageHeader.vue";
import StatusBadge from "@/components/platform/StatusBadge.vue";
import type { PlatformRole, PlatformShop, PlatformUser, PlatformUserPayload } from "@/composables/usePlatformAdmin";
import { usePlatformCompanies } from "@/composables/usePlatformCompanies";
import { usePlatformFormUi } from "@/composables/usePlatformFormUi";
import { usePlatformRoles } from "@/composables/usePlatformRoles";
import { usePlatformUsers } from "@/composables/usePlatformUsers";

definePageMeta({ layout: "platform" });
useHead({ title: "Пользователи компании | Konkurent" });

const route = useRoute();
const companyId = computed(() => String(route.params.id || "").trim());
const { getCompany, getCompanyShops } = usePlatformCompanies();
const { getCompanyUsers, createCompanyUser, updateCompanyUser, blockCompanyUser, unblockCompanyUser, deleteCompanyUser } = usePlatformUsers();
const { getCompanyRoles } = usePlatformRoles();
const { softInputUi, softSelectUi } = usePlatformFormUi();
const toast = useToast();

const loading = ref(true);
const rolesLoading = ref(false);
const saving = ref(false);
const deletingId = ref("");
const actionId = ref("");
const errorMessage = ref("");
const successMessage = ref("");
const company = ref<any | null>(null);
const shops = ref<PlatformShop[]>([]);
const users = ref<PlatformUser[]>([]);
const companyRoles = ref<PlatformRole[]>([]);
const search = ref("");
const role = ref("all");
const status = ref("all");
const modalOpen = ref(false);
const resetModalOpen = ref(false);
const editing = ref<PlatformUser | null>(null);
const selectedForReset = ref<PlatformUser | null>(null);
const resetPasswordValue = ref("");

const form = reactive({
  firstName: "",
  lastName: "",
  phone: "",
  password: "",
  role: "",
  birthDate: "",
  currentShopId: "",
  allowedShopIds: [] as string[],
  canSwitchShops: false,
  is_active: true,
});

const companyRoleOptions = computed(() => {
  const options = companyRoles.value
    .filter((roleItem) => roleItem.id)
    .map((roleItem) => ({ label: roleItem.name || roleItem.id, value: roleItem.id }));
  if (form.role && !options.some((option) => option.value === form.role)) {
    options.push({ label: form.role, value: form.role });
  }
  return options;
});

const tableRoleOptions = computed(() => [{ label: "Все роли", value: "all" }, ...companyRoleOptions.value]);
const statusOptions = [
  { label: "Все статусы", value: "all" },
  { label: "Активные", value: "active" },
  { label: "Отключенные", value: "inactive" },
];

const shopOptions = computed(() =>
  shops.value.map((shop) => ({ label: shop.name, value: shop.id })),
);

const filteredUsers = computed(() =>
  users.value.filter((user) => {
    const q = search.value.trim().toLowerCase();
    const haystack = `${user.fullName} ${user.phone} ${user.roleName} ${user.roleId} ${user.currentShopName}`.toLowerCase();
    const matchesSearch = !q || haystack.includes(q);
    const matchesRole = role.value === "all" || user.roleId === role.value || user.crmRoleId === role.value;
    const matchesStatus = status.value === "all" || user.status === status.value;
    return matchesSearch && matchesRole && matchesStatus;
  }),
);

function resolveError(error: any, fallback: string) {
  const message = error?.data?.message ?? error?.response?._data?.message;
  return Array.isArray(message) ? message.join(", ") : message || error?.message || fallback;
}

function enrichUsersWithShopNames(items: PlatformUser[]) {
  return items.map((user) => {
    const matchedShop = shops.value.find(
      (shop) =>
        shop.id === user.currentShopId ||
        shop.shopId === user.currentShopId ||
        user.allowedShopIds.includes(shop.id) ||
        user.allowedShopIds.includes(shop.shopId),
    );

    return {
      ...user,
      currentShopId: user.currentShopId || matchedShop?.id || matchedShop?.shopId || "",
      currentShopName: user.currentShopName || matchedShop?.name || "",
      allowedShopIds: user.allowedShopIds.length ? user.allowedShopIds : matchedShop ? [matchedShop.id] : [],
    };
  });
}

function resetForm() {
  form.firstName = "";
  form.lastName = "";
  form.phone = "";
  form.password = "";
  form.role = companyRoleOptions.value[0]?.value || "";
  form.birthDate = "";
  form.currentShopId = shops.value[0]?.id || "";
  form.allowedShopIds = form.currentShopId ? [form.currentShopId] : [];
  form.canSwitchShops = false;
  form.is_active = true;
}

function normalizePhoneForInput(phone: string) {
  const digits = String(phone || "").replace(/\D/g, "");
  const localDigits = digits.startsWith("998") ? digits.slice(3) : digits;
  const normalized = localDigits.slice(0, 9);
  const parts = [normalized.slice(0, 2), normalized.slice(2, 5), normalized.slice(5, 7), normalized.slice(7, 9)].filter(Boolean);
  return parts.join(" ");
}

function normalizeBirthDateForPayload(value: string) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${day}.${month}.${year}`;
  }

  const match = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!match) {
    return trimmed;
  }

  const [, day, month, year] = match;
  return `${day.padStart(2, "0")}.${month.padStart(2, "0")}.${year}`;
}

function normalizeBirthDateForPicker(value: string) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const match = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!match) {
    return "";
  }

  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function buildPayload(overrides: Partial<PlatformUserPayload> = {}): PlatformUserPayload {
  return {
    first_name: form.firstName.trim(),
    last_name: form.lastName.trim(),
    phone_number: `+998${form.phone.replace(/\D/g, "")}`,
    role: "employee",
    crm_role_id: form.role || undefined,
    company_id: companyId.value,
    current_shop_id: form.currentShopId,
    allowed_shop_ids: [...form.allowedShopIds],
    can_switch_shops: form.canSwitchShops,
    is_active: Boolean(form.is_active),
    ...(form.password.trim() ? { password: form.password.trim() } : {}),
    ...(form.birthDate.trim() ? { birth_date: normalizeBirthDateForPayload(form.birthDate) } : {}),
    ...overrides,
  };
}

async function loadData() {
  loading.value = true;
  rolesLoading.value = true;
  errorMessage.value = "";

  try {
    const [companyResponse, shopsResponse, usersResponse, rolesResponse] = await Promise.all([
      getCompany(companyId.value),
      getCompanyShops(companyId.value),
      getCompanyUsers(companyId.value),
      getCompanyRoles(companyId.value),
    ]);

    company.value = companyResponse;
    shops.value = shopsResponse;
    companyRoles.value = rolesResponse;
    users.value = enrichUsersWithShopNames(usersResponse);
    if (!form.role) {
      form.role = companyRoleOptions.value[0]?.value || "";
    }
  } catch (error: any) {
    errorMessage.value = resolveError(error, "Не удалось загрузить сотрудников компании");
    users.value = [];
  } finally {
    rolesLoading.value = false;
    loading.value = false;
  }
}

function openCreate() {
  editing.value = null;
  resetForm();
  successMessage.value = "";
  modalOpen.value = true;
}

function openEdit(user: PlatformUser) {
  editing.value = user;
  form.firstName = user.firstName;
  form.lastName = user.lastName;
  form.phone = normalizePhoneForInput(user.phone);
  form.password = "";
  form.role = user.crmRoleId || user.roleId || companyRoleOptions.value[0]?.value || "";
  form.birthDate = normalizeBirthDateForPicker(user.birthDate || "");
  form.currentShopId = user.currentShopId || shops.value[0]?.id || "";
  form.allowedShopIds = user.allowedShopIds.length ? [...user.allowedShopIds] : form.currentShopId ? [form.currentShopId] : [];
  form.canSwitchShops = user.canSwitchShops;
  form.is_active = user.is_active;
  if (form.currentShopId && !form.allowedShopIds.includes(form.currentShopId)) {
    form.allowedShopIds.push(form.currentShopId);
  }
  successMessage.value = "";
  modalOpen.value = true;
}

function toggleAllowedShop(shopId: string) {
  const exists = form.allowedShopIds.includes(shopId);
  if (exists) {
    if (!form.canSwitchShops || form.allowedShopIds.length === 1) {
      form.allowedShopIds = [shopId];
      form.currentShopId = shopId;
      return;
    }
    form.allowedShopIds = form.allowedShopIds.filter((id) => id !== shopId);
    if (form.currentShopId === shopId) {
      form.currentShopId = form.allowedShopIds[0] || "";
    }
    return;
  }
  form.allowedShopIds = form.canSwitchShops ? [...form.allowedShopIds, shopId] : [shopId];
  if (!form.currentShopId) {
    form.currentShopId = shopId;
  }
}

async function submit() {
  saving.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  const payload = buildPayload();
  if (!payload.crm_role_id) {
    errorMessage.value = "Выберите CRM-роль сотрудника.";
    saving.value = false;
    return;
  }
  if (payload.current_shop_id && !payload.allowed_shop_ids?.includes(payload.current_shop_id)) {
    errorMessage.value = "Текущий филиал должен входить в список доступных филиалов.";
    saving.value = false;
    return;
  }

  try {
    if (editing.value?.id) {
      await updateCompanyUser(companyId.value, editing.value.id, payload);
      successMessage.value = "Сотрудник обновлен";
      toast.add({ title: "Сотрудник обновлен", color: "success" });
    } else {
      await createCompanyUser(companyId.value, payload);
      successMessage.value = "Сотрудник создан";
      toast.add({ title: "Сотрудник создан", color: "success" });
    }
    modalOpen.value = false;
    await loadData();
  } catch (error: any) {
    errorMessage.value = resolveError(error, "Не удалось сохранить сотрудника");
    toast.add({ title: "Не удалось сохранить сотрудника", description: errorMessage.value, color: "error" });
  } finally {
    saving.value = false;
  }
}

async function removeUser(user: PlatformUser) {
  if (typeof window !== "undefined" && !window.confirm(`Удалить пользователя "${user.fullName}"?`)) {
    return;
  }
  deletingId.value = user.id;
  try {
    await deleteCompanyUser(companyId.value, user.id);
    successMessage.value = "Пользователь удален";
    await loadData();
  } catch (error: any) {
    errorMessage.value = resolveError(error, "Не удалось удалить пользователя");
    toast.add({ title: "Не удалось удалить сотрудника", description: errorMessage.value, color: "error" });
  } finally {
    deletingId.value = "";
  }
}

async function toggleBlocked(user: PlatformUser) {
  actionId.value = user.id;
  try {
    if (user.is_active) {
      await blockCompanyUser(companyId.value, user.id);
    } else {
      await unblockCompanyUser(companyId.value, user.id);
    }
    successMessage.value = user.is_active ? "Пользователь заблокирован" : "Пользователь разблокирован";
    toast.add({ title: successMessage.value, color: "success" });
    await loadData();
  } catch (error: any) {
    errorMessage.value = resolveError(error, "Не удалось изменить статус пользователя");
    toast.add({ title: "Ошибка статуса", description: errorMessage.value, color: "error" });
  } finally {
    actionId.value = "";
  }
}

function openResetPassword(user: PlatformUser) {
  selectedForReset.value = user;
  resetPasswordValue.value = `Temp${Math.random().toString(36).slice(2, 8)}!`;
  resetModalOpen.value = true;
}

async function confirmResetPassword() {
  if (!selectedForReset.value) return;
  actionId.value = selectedForReset.value.id;
  try {
    await updateCompanyUser(companyId.value, selectedForReset.value.id, {
      first_name: selectedForReset.value.firstName,
      last_name: selectedForReset.value.lastName,
      phone_number: `+998${String(selectedForReset.value.phone || "").replace(/\D/g, "")}`,
      role: "employee",
      crm_role_id: selectedForReset.value.crmRoleId || selectedForReset.value.roleId || undefined,
      company_id: companyId.value,
      current_shop_id: selectedForReset.value.currentShopId,
      allowed_shop_ids: [...selectedForReset.value.allowedShopIds],
      can_switch_shops: selectedForReset.value.canSwitchShops,
      is_active: selectedForReset.value.is_active,
      password: resetPasswordValue.value,
      ...(selectedForReset.value.birthDate ? { birth_date: normalizeBirthDateForPayload(selectedForReset.value.birthDate) } : {}),
    });
    successMessage.value = `Пароль сброшен: ${resetPasswordValue.value}`;
    toast.add({ title: "Пароль сброшен", description: resetPasswordValue.value, color: "success" });
    resetModalOpen.value = false;
  } catch (error: any) {
    errorMessage.value = resolveError(error, "Не удалось сбросить пароль");
    toast.add({ title: "Ошибка сброса пароля", description: errorMessage.value, color: "error" });
  } finally {
    actionId.value = "";
  }
}

function forceLogout(user: PlatformUser) {
  toast.add({ title: `Принудительный выход: ${user.fullName}`, description: "Тестовое действие", color: "info" });
}

function viewActivity(user: PlatformUser) {
  toast.add({ title: `Activity for ${user.fullName}`, description: "Placeholder page will be added in audit/logs.", color: "info" });
}

watch(() => form.phone, (value) => {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 9);
  const parts = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)].filter(Boolean);
  const formatted = parts.join(" ");
  if (formatted !== value) form.phone = formatted;
});

watch(() => form.canSwitchShops, (value) => {
  if (value) return;
  form.allowedShopIds = form.currentShopId ? [form.currentShopId] : [];
});

watch(() => form.currentShopId, (shopId) => {
  if (!shopId) return;
  if (!form.allowedShopIds.includes(shopId)) {
    form.allowedShopIds = form.canSwitchShops ? [...form.allowedShopIds, shopId] : [shopId];
  }
});

watch(companyId, () => {
  if (!companyId.value) return;
  loadData();
}, { immediate: true });
</script>

<template>
  <div class="space-y-8">
    <PageHeader eyebrow="Пользователи" :title="company?.name ? `Пользователи: ${company.name}` : 'Пользователи компании'" description="Управление сотрудниками, ролями и контролем доступа внутри компании." />
    <CompanyTabs :company-id="companyId" />
    <div v-if="errorMessage" class="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-[14px] text-rose-600">{{ errorMessage }}</div>
    <div v-if="successMessage" class="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-[14px] text-emerald-700">{{ successMessage }}</div>
    <DataPanel title="Пользователи" description="Фильтруйте список и управляйте доступом по филиалам.">
      <template #toolbar>
        <div class="flex flex-1 flex-wrap items-center gap-3">
          <div class="min-w-[240px] flex-1"><UInput v-model="search" type="text" placeholder="Поиск по имени, телефону, роли или филиалу" :ui="softInputUi" /></div>
          <USelect v-model="role" :items="tableRoleOptions" value-key="value" :ui="softSelectUi" class="min-w-[220px]" />
          <USelect v-model="status" :items="statusOptions" value-key="value" :ui="softSelectUi" class="min-w-[220px]" />
          <UButton color="neutral" class="cursor-pointer rounded-2xl bg-slate-950 text-white hover:bg-slate-800" @click="openCreate"><Icon name="heroicons:plus" class="mr-2 h-4 w-4" />Создать сотрудника</UButton>
        </div>
      </template>
      <div v-if="loading" class="space-y-3"><div v-for="item in 6" :key="item" class="h-20 animate-pulse rounded-[24px] bg-slate-100" /></div>
      <EmptyState v-else-if="!filteredUsers.length" title="Сотрудники не найдены" description="Создайте первого сотрудника компании." icon="heroicons:user-plus" />
      <div v-else class="overflow-x-auto">
        <table class="min-w-full border-separate border-spacing-y-3">
          <thead><tr class="text-left text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-400"><th class="px-4 py-2">Пользователь</th><th class="px-4 py-2">Телефон</th><th class="px-4 py-2">Роль</th><th class="px-4 py-2">Текущий филиал</th><th class="px-4 py-2">Статус</th><th class="px-4 py-2">Действия</th></tr></thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td class="rounded-l-[22px] bg-slate-50 px-4 py-4"><p class="font-semibold text-slate-950">{{ user.fullName }}</p><p class="mt-1 text-[13px] text-slate-500">{{ user.birthDate || "Дата рождения не указана" }}</p></td>
              <td class="bg-slate-50 px-4 py-4 text-[14px] text-slate-600">{{ user.phone || "—" }}</td>
              <td class="bg-slate-50 px-4 py-4 text-[14px] text-slate-600">{{ user.roleName || user.roleId || "—" }}</td>
              <td class="bg-slate-50 px-4 py-4 text-[14px] text-slate-600">{{ user.currentShopName || user.currentShopId || "—" }}</td>
              <td class="bg-slate-50 px-4 py-4"><StatusBadge :status="user.status" /></td>
              <td class="rounded-r-[22px] bg-slate-50 px-4 py-4">
                <div class="flex flex-wrap gap-2">
                  <UButton color="neutral" variant="soft" class="rounded-2xl bg-white text-slate-700 hover:bg-slate-100" @click="openEdit(user)">Изменить</UButton>
                  <UButton color="warning" variant="soft" class="rounded-2xl" :loading="actionId === user.id" @click="toggleBlocked(user)">{{ user.is_active ? "Заблокировать" : "Разблокировать" }}</UButton>
                  <UButton color="neutral" variant="soft" class="rounded-2xl bg-white text-slate-700 hover:bg-slate-100" :loading="actionId === user.id" @click="openResetPassword(user)">Сбросить пароль</UButton>
                  <UDropdownMenu :items="[[{ label: 'Принудительный выход', icon: 'heroicons:arrow-right-on-rectangle', onSelect: () => forceLogout(user) }],[{ label: 'Посмотреть активность', icon: 'heroicons:clock', onSelect: () => viewActivity(user) }],[{ label: 'Удалить', icon: 'heroicons:trash', color: 'error', onSelect: () => removeUser(user) }]]">
                    <UButton color="neutral" variant="soft" class="rounded-2xl bg-white text-slate-700 hover:bg-slate-100">Еще</UButton>
                  </UDropdownMenu>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </DataPanel>
    <ModalForm :open="modalOpen" :title="editing ? 'Редактировать сотрудника' : 'Создать сотрудника'" description="Заполните профиль сотрудника и настройте доступные филиалы." @close="modalOpen = false">
      <form class="grid gap-3 md:grid-cols-2" @submit.prevent="submit">
        <label class="space-y-1.5"><span class="text-[13px] font-semibold text-slate-700">Имя</span><UInput v-model="form.firstName" type="text" required placeholder="Введите имя" :ui="softInputUi" /></label>
        <label class="space-y-1.5"><span class="text-[13px] font-semibold text-slate-700">Фамилия</span><UInput v-model="form.lastName" type="text" required placeholder="Введите фамилию" :ui="softInputUi" /></label>
        <label class="space-y-1.5"><span class="text-[13px] font-semibold text-slate-700">Телефон</span><div class="flex items-center rounded-2xl bg-slate-50 px-4 ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-teal-400/60"><span class="pr-3 text-[14px] font-medium text-slate-500">+998</span><UInput v-model="form.phone" type="tel" inputmode="numeric" required placeholder="90 123 45 67" :ui="{ root: 'w-full', base: 'w-full border-0 bg-transparent px-0 py-2.5 text-[14px] text-slate-700 ring-0 outline-none placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-0 focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-0' }" /></div></label>
        <label class="space-y-1.5"><span class="text-[13px] font-semibold text-slate-700">Пароль</span><UInput v-model="form.password" type="password" :required="!editing" placeholder="Введите пароль" :ui="softInputUi" /></label>
        <label class="space-y-1.5"><span class="text-[13px] font-semibold text-slate-700">Роль</span><USelect v-model="form.role" :items="companyRoleOptions" value-key="value" :ui="softSelectUi" :loading="rolesLoading || loading" /></label>
        <label class="space-y-1.5"><span class="text-[13px] font-semibold text-slate-700">Дата рождения</span><AppDatePicker v-model="form.birthDate" class="w-full" clearable /></label>
        <label class="space-y-1.5 md:col-span-2"><span class="text-[13px] font-semibold text-slate-700">Текущий филиал</span><USelect v-model="form.currentShopId" :items="shopOptions" value-key="value" :ui="softSelectUi" /></label>
        <label class="md:col-span-2 flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-2.5 text-[14px] text-slate-700 ring-1 ring-slate-200"><input v-model="form.canSwitchShops" type="checkbox" class="h-4 w-4 accent-teal-600" />Может переключать филиалы</label>
        <div class="space-y-2.5 md:col-span-2"><p class="text-[13px] font-semibold text-slate-700">Доступные филиалы</p><div class="grid gap-2 sm:grid-cols-2"><label v-for="shop in shops" :key="shop.id" class="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-2.5 text-[14px] text-slate-700 ring-1 ring-slate-200"><input :checked="form.allowedShopIds.includes(shop.id)" type="checkbox" class="h-4 w-4 accent-teal-600" @change="toggleAllowedShop(shop.id)" /><span>{{ shop.name }}</span></label></div></div>
        <label class="md:col-span-2 flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-2.5 text-[14px] text-slate-700 ring-1 ring-slate-200"><input v-model="form.is_active" type="checkbox" class="h-4 w-4 accent-teal-600" />Активный пользователь</label>
        <div class="mt-1 flex justify-end gap-3 md:col-span-2"><UButton type="button" color="neutral" variant="soft" class="rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200" @click="modalOpen = false">Отмена</UButton><UButton type="submit" color="neutral" class="rounded-2xl bg-slate-950 text-white hover:bg-slate-800" :loading="saving">{{ editing ? "Сохранить" : "Создать" }}</UButton></div>
      </form>
    </ModalForm>
    <ModalForm :open="resetModalOpen" title="Сбросить пароль" description="Подтвердите сброс пароля. Новый пароль будет показан один раз." @close="resetModalOpen = false">
      <div class="space-y-4">
        <p class="text-[14px] text-slate-600">Пользователь: <span class="font-semibold text-slate-950">{{ selectedForReset?.fullName }}</span></p>
        <div class="rounded-2xl bg-slate-50 px-4 py-3 text-[14px] text-slate-700 ring-1 ring-slate-200">Новый временный пароль: <span class="font-semibold text-slate-950">{{ resetPasswordValue }}</span></div>
        <div class="flex justify-end gap-3"><UButton type="button" color="neutral" variant="soft" class="rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200" @click="resetModalOpen = false">Отмена</UButton><UButton type="button" color="neutral" class="rounded-2xl bg-slate-950 text-white hover:bg-slate-800" :loading="actionId === selectedForReset?.id" @click="confirmResetPassword">Подтвердить</UButton></div>
      </div>
    </ModalForm>
  </div>
</template>
