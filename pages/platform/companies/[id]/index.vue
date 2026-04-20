<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import DataPanel from "@/components/platform/DataPanel.vue";
import EmptyState from "@/components/platform/EmptyState.vue";
import ModalForm from "@/components/platform/ModalForm.vue";
import PageHeader from "@/components/platform/PageHeader.vue";
import StatusBadge from "@/components/platform/StatusBadge.vue";
import type { PlatformRole, PlatformShop, PlatformUser, PlatformUserPayload } from "@/composables/usePlatformAdmin";
import { usePlatformAdminApi } from "@/composables/usePlatformAdmin";
import { usePlatformFormUi } from "@/composables/usePlatformFormUi";

definePageMeta({ layout: "platform" });
useHead({ title: "Карточка компании | Konkurent" });

const route = useRoute();
const router = useRouter();
const companyId = computed(() => String(route.params.id || "").trim());
const { getCompany, getCompanyUsers, getCompanyRoles, createCompanyUser, updateCompany, updateCompanyStatus, deleteCompany } =
  usePlatformAdminApi();
const { softInputUi, softSelectUi } = usePlatformFormUi();
const toast = useToast();

const loading = ref(true);
const rolesLoading = ref(false);
const saving = ref(false);
const deleting = ref(false);
const userSaving = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const company = ref<any | null>(null);
const shops = ref<PlatformShop[]>([]);
const users = ref<PlatformUser[]>([]);
const companyRoles = ref<PlatformRole[]>([]);
const userModalOpen = ref(false);

const form = reactive({
  name: "",
  login: "",
  subdomain: "",
  status: "active" as "active" | "inactive",
});

const userForm = reactive({
  firstName: "",
  lastName: "",
  phone: "",
  password: "",
  role: "employee",
  birthDate: "",
  currentShopId: "",
  allowedShopIds: [] as string[],
  canSwitchShops: false,
  is_active: true,
});


const shopOptions = computed(() =>
  shops.value.map((shop) => ({
    label: shop.name,
    value: shop.id,
  })),
);

const activeShopsCount = computed(() => shops.value.filter((shop) => shop.status === "active").length);
const activeUsersCount = computed(() => users.value.filter((user) => user.status === "active").length);
const userPreview = computed(() => users.value.slice(0, 5));

function formatRoleLabel(roleValue: string) {
  const normalized = String(roleValue || "").trim();
  if (!normalized) return "";
  return normalized
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const companyRoleOptions = computed(() => {
  const options = companyRoles.value
    .filter((role) => role.id)
    .map((role) => ({
      label: role.name || formatRoleLabel(role.id),
      value: role.id,
    }));

  if (userForm.role && !options.some((option) => option.value === userForm.role)) {
    options.push({ label: formatRoleLabel(userForm.role), value: userForm.role });
  }

  return options;
});

function resolveError(error: any, fallback: string) {
  const message = error?.data?.message ?? error?.response?._data?.message;
  return Array.isArray(message) ? message.join(", ") : message || error?.message || fallback;
}

function applyCompanyToForm() {
  form.name = company.value?.name || "";
  form.login = company.value?.login || "";
  form.subdomain = company.value?.subdomain || "";
  form.status = company.value?.status || "active";
}

function resetUserForm() {
  userForm.firstName = "";
  userForm.lastName = "";
  userForm.phone = "";
  userForm.password = "";
  userForm.role = companyRoleOptions.value[0]?.value || "";
  userForm.birthDate = "";
  userForm.currentShopId = shops.value[0]?.id || "";
  userForm.allowedShopIds = userForm.currentShopId ? [userForm.currentShopId] : [];
  userForm.canSwitchShops = false;
  userForm.is_active = true;
}

function openCreateUser() {
  resetUserForm();
  successMessage.value = "";
  userModalOpen.value = true;
}

function toggleAllowedShop(shopId: string) {
  const exists = userForm.allowedShopIds.includes(shopId);

  if (exists) {
    if (!userForm.canSwitchShops || userForm.allowedShopIds.length === 1) {
      userForm.allowedShopIds = [shopId];
      userForm.currentShopId = shopId;
      return;
    }

    userForm.allowedShopIds = userForm.allowedShopIds.filter((id) => id !== shopId);
    if (userForm.currentShopId === shopId) {
      userForm.currentShopId = userForm.allowedShopIds[0] || "";
    }
    return;
  }

  userForm.allowedShopIds = userForm.canSwitchShops ? [...userForm.allowedShopIds, shopId] : [shopId];
  if (!userForm.currentShopId) {
    userForm.currentShopId = shopId;
  }
}

function buildUserPayload(): PlatformUserPayload {
  const payload: PlatformUserPayload = {
    first_name: userForm.firstName.trim(),
    last_name: userForm.lastName.trim(),
    phone_number: `+998${userForm.phone.replace(/\D/g, "")}`,
    role: "employee",
    crm_role_id: userForm.role || undefined,
    company_id: companyId.value,
    current_shop_id: userForm.currentShopId,
    allowed_shop_ids: [...userForm.allowedShopIds],
    can_switch_shops: userForm.canSwitchShops,
    is_active: Boolean(userForm.is_active),
  };

  if (userForm.password.trim()) payload.password = userForm.password.trim();
  if (userForm.birthDate.trim()) payload.birth_date = userForm.birthDate.trim();
  return payload;
}

async function loadCompanyPage() {
  loading.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    const companyResponse = await getCompany(companyId.value);
    company.value = companyResponse;
    shops.value = Array.isArray(companyResponse?.shops) ? companyResponse.shops : [];
    applyCompanyToForm();
  } catch (error: any) {
    company.value = null;
    shops.value = [];
    users.value = [];
    errorMessage.value = resolveError(error, "Не удалось загрузить данные компании");
    loading.value = false;
    return;
  }

  try {
    users.value = await getCompanyUsers(companyId.value);
  } catch (error: any) {
    users.value = [];
    errorMessage.value = resolveError(error, "Не удалось загрузить сотрудников компании");
  }

  rolesLoading.value = true;
  try {
    companyRoles.value = await getCompanyRoles(companyId.value);
    if (!companyRoleOptions.value.some((option) => option.value === userForm.role)) {
      userForm.role = companyRoleOptions.value[0]?.value || userForm.role;
    }
  } catch (error: any) {
    companyRoles.value = [];
    errorMessage.value = resolveError(error, "Не удалось загрузить роли компании");
  } finally {
    rolesLoading.value = false;
    loading.value = false;
  }
}

async function saveCompany() {
  saving.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    const companyResponse = await updateCompany(companyId.value, {
      name: form.name.trim(),
      login: form.login.trim(),
      subdomain: form.subdomain.trim(),
    });

    const statusChanged = companyResponse.status !== form.status;
    company.value = statusChanged
      ? await updateCompanyStatus(companyId.value, form.status === "active")
      : companyResponse;

    applyCompanyToForm();
    successMessage.value = "Данные компании обновлены";
    toast.add({ title: "Компания обновлена", color: "success" });
  } catch (error: any) {
    errorMessage.value = resolveError(error, "Не удалось обновить компанию");
    toast.add({ title: "Не удалось обновить компанию", description: errorMessage.value, color: "error" });
  } finally {
    saving.value = false;
  }
}

async function submitUser() {
  userSaving.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  const payload = buildUserPayload();
  if (!payload.crm_role_id) {
    toast.add({ title: "Выберите CRM-роль сотрудника", color: "warning" });
    errorMessage.value = "Выберите CRM-роль сотрудника.";
    userSaving.value = false;
    return;
  }

  if (payload.current_shop_id && !payload.allowed_shop_ids?.includes(payload.current_shop_id)) {
    toast.add({ title: "Проверьте филиалы сотрудника", color: "warning" });
    errorMessage.value = "Текущий филиал должен входить в список доступных филиалов.";
    userSaving.value = false;
    return;
  }

  try {
    await createCompanyUser(companyId.value, payload);
    successMessage.value = "Сотрудник создан";
    toast.add({ title: "Сотрудник создан", color: "success" });
    userModalOpen.value = false;
    await loadCompanyPage();
  } catch (error: any) {
    errorMessage.value = resolveError(error, "Не удалось создать сотрудника");
    toast.add({ title: "Не удалось создать сотрудника", description: errorMessage.value, color: "error" });
  } finally {
    userSaving.value = false;
  }
}

async function removeCompany() {
  if (typeof window !== "undefined" && !window.confirm(`Удалить компанию "${company.value?.name || ""}"?`)) {
    return;
  }

  deleting.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    await deleteCompany(companyId.value);
    toast.add({ title: "Компания удалена", color: "success" });
    await router.push("/platform/companies");
  } catch (error: any) {
    errorMessage.value = resolveError(error, "Не удалось удалить компанию");
    toast.add({ title: "Не удалось удалить компанию", description: errorMessage.value, color: "error" });
  } finally {
    deleting.value = false;
  }
}

watch(
  () => userForm.phone,
  (value) => {
    const digits = String(value || "").replace(/\D/g, "").slice(0, 9);
    const parts = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)].filter(Boolean);
    const formatted = parts.join(" ");
    if (formatted !== value) userForm.phone = formatted;
  },
);

watch(
  () => userForm.canSwitchShops,
  (value) => {
    if (value) return;
    userForm.allowedShopIds = userForm.currentShopId ? [userForm.currentShopId] : [];
  },
);

watch(
  () => userForm.currentShopId,
  (shopId) => {
    if (!shopId) return;
    if (!userForm.allowedShopIds.includes(shopId)) {
      userForm.allowedShopIds = userForm.canSwitchShops ? [...userForm.allowedShopIds, shopId] : [shopId];
    }
  },
);

watch(
  companyId,
  () => {
    if (!companyId.value) {
      company.value = null;
      shops.value = [];
      users.value = [];
      errorMessage.value = "Не найден идентификатор компании";
      loading.value = false;
      return;
    }

    loadCompanyPage();
  },
  { immediate: true },
);
</script>

<template>
  <div class="space-y-8">
    <PageHeader
      eyebrow="Компании"
      :title="company?.name || 'Карточка компании'"
      description="Одна страница с основной информацией, филиалами и сотрудниками компании."
    >
      <template #actions>
        <NuxtLink
          :to="`/platform/companies/${companyId}/shops`"
          class="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-medium text-slate-700 transition hover:bg-slate-100"
        >
          Филиалы
        </NuxtLink>
        <NuxtLink
          :to="`/platform/companies/${companyId}/users`"
          class="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-medium text-slate-700 transition hover:bg-slate-100"
        >
          Сотрудники
        </NuxtLink>
      </template>
    </PageHeader>

    <div v-if="errorMessage" class="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-[14px] text-rose-600">
      {{ errorMessage }}
    </div>
    <div
      v-if="successMessage"
      class="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-[14px] text-emerald-700"
    >
      {{ successMessage }}
    </div>

    <DataPanel title="Основная информация" description="Карточка выбранной компании с настройками и статусом.">
      <form v-if="!loading && company" class="grid gap-4 md:grid-cols-2" @submit.prevent="saveCompany">
        <label class="space-y-2 md:col-span-2">
          <span class="text-[13px] font-semibold text-slate-700">Название</span>
          <UInput v-model="form.name" type="text" required placeholder="Введите название компании" :ui="softInputUi" />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Логин</span>
          <UInput v-model="form.login" type="text" required placeholder="Введите логин" :ui="softInputUi" />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Поддомен</span>
          <UInput v-model="form.subdomain" type="text" required placeholder="Введите поддомен" :ui="softInputUi" />
        </label>
        <div class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Текущий статус</span>
          <div class="flex min-h-[48px] items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
            <div class="flex items-center gap-3">
              <StatusBadge :status="form.status" />
              <span class="text-[14px] font-medium text-slate-600">
                {{ form.status === "active" ? "Активна" : "Отключена" }}
              </span>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-[13px] font-medium text-slate-500">
                {{ form.status === "active" ? "Включена" : "Выключена" }}
              </span>
              <USwitch
                :model-value="form.status === 'active'"
                @update:model-value="form.status = $event ? 'active' : 'inactive'"
              />
            </div>
          </div>
        </div>
        <div class="grid gap-4 md:col-span-2 md:grid-cols-4">
          <div class="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <p class="text-[12px] font-medium uppercase tracking-[0.14em] text-slate-400">ID компании</p>
            <p class="mt-2 text-[14px] font-semibold text-slate-900">{{ company.id || "—" }}</p>
          </div>
          <div class="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <p class="text-[12px] font-medium uppercase tracking-[0.14em] text-slate-400">Филиалы</p>
            <p class="mt-2 text-[14px] font-semibold text-slate-900">{{ company.shopsCount ?? shops.length }}</p>
            <p class="mt-1 text-[13px] text-slate-500">Активных: {{ activeShopsCount }}</p>
          </div>
          <div class="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <p class="text-[12px] font-medium uppercase tracking-[0.14em] text-slate-400">Сотрудники</p>
            <p class="mt-2 text-[14px] font-semibold text-slate-900">{{ company.usersCount ?? users.length }}</p>
            <p class="mt-1 text-[13px] text-slate-500">Активных: {{ activeUsersCount }}</p>
          </div>
          <div class="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <p class="text-[12px] font-medium uppercase tracking-[0.14em] text-slate-400">Обновлена</p>
            <p class="mt-2 text-[14px] font-semibold text-slate-900">{{ company.updatedAt || "—" }}</p>
          </div>
        </div>

        <div class="flex justify-between gap-3 md:col-span-2">
          <UButton color="error" variant="soft" class="rounded-2xl" :loading="deleting" @click="removeCompany">
            Удалить компанию
          </UButton>
          <UButton
            type="submit"
            color="neutral"
            class="rounded-2xl bg-slate-950 text-white hover:bg-slate-800"
            :disabled="saving"
          >
            {{ saving ? "Сохраняем..." : "Сохранить изменения" }}
          </UButton>
        </div>
      </form>

      <div v-else-if="loading" class="space-y-3">
        <div v-for="item in 4" :key="item" class="h-20 animate-pulse rounded-[24px] bg-slate-100" />
      </div>

      <EmptyState
        v-else
        title="Компания не найдена"
        description="Не удалось получить данные выбранной компании."
        icon="heroicons:building-office-2"
      />
    </DataPanel>

    <DataPanel title="Филиалы компании" :description="`Всего ${shops.length} филиалов, привязанных к компании ${company?.name || ''}.`">
      <template #toolbar>
        <NuxtLink
          :to="`/platform/companies/${companyId}/shops`"
          class="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-950 px-4 text-[14px] font-medium text-white transition hover:bg-slate-800"
        >
          Управлять филиалами
        </NuxtLink>
      </template>

      <EmptyState
        v-if="!loading && !shops.length"
        title="Филиалов пока нет"
        description="Для этой компании еще не созданы филиалы."
        icon="heroicons:map-pin"
      />

      <div v-else class="grid gap-4 lg:grid-cols-2">
        <article
          v-for="shop in shops"
          :key="shop.id"
          class="rounded-[28px] border border-slate-100 bg-slate-50/70 p-5 transition hover:bg-white hover:shadow-[0_18px_40px_rgba(15,23,42,0.06)]"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-[18px] font-semibold text-slate-950">{{ shop.name }}</p>
              <p class="mt-2 text-[14px] text-slate-500">{{ shop.branchCode || "Код не указан" }}</p>
            </div>
            <StatusBadge :status="shop.status" />
          </div>
        </article>
      </div>
    </DataPanel>

    <DataPanel title="Сотрудники компании" :description="`Показываются только сотрудники выбранной компании. Всего: ${users.length}.`">
      <template #toolbar>
        <UButton color="neutral" class="rounded-2xl bg-slate-950 text-white hover:bg-slate-800" @click="openCreateUser">
          Создать сотрудника
        </UButton>
        <NuxtLink
          :to="`/platform/companies/${companyId}/users`"
          class="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-medium text-slate-700 transition hover:bg-slate-100"
        >
          Все сотрудники
        </NuxtLink>
      </template>

      <EmptyState
        v-if="!loading && !users.length"
        title="Сотрудников пока нет"
        description="Для этой компании еще не созданы сотрудники."
        icon="heroicons:users"
      />

      <div v-else class="overflow-x-auto">
        <table class="min-w-full border-separate border-spacing-y-3">
          <thead>
            <tr class="text-left text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              <th class="px-4 py-2">Пользователь</th>
              <th class="px-4 py-2">Телефон</th>
              <th class="px-4 py-2">Роль</th>
              <th class="px-4 py-2">Филиал</th>
              <th class="px-4 py-2">Статус</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in userPreview" :key="user.id">
              <td class="rounded-l-[22px] bg-slate-50 px-4 py-4">
                <p class="font-semibold text-slate-950">{{ user.fullName }}</p>
                <p class="mt-1 text-[13px] text-slate-500">{{ user.birthDate || "Дата рождения не указана" }}</p>
              </td>
              <td class="bg-slate-50 px-4 py-4 text-[14px] text-slate-600">{{ user.phone || "—" }}</td>
              <td class="bg-slate-50 px-4 py-4 text-[14px] text-slate-600">{{ user.roleName || user.roleId || "—" }}</td>
              <td class="bg-slate-50 px-4 py-4 text-[14px] text-slate-600">{{ user.currentShopName || user.currentShopId || "—" }}</td>
              <td class="rounded-r-[22px] bg-slate-50 px-4 py-4">
                <StatusBadge :status="user.status" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </DataPanel>

    <ModalForm
      :open="userModalOpen"
      title="Создать сотрудника"
      description="Заполните профиль сотрудника и настройте доступные филиалы."
      @close="userModalOpen = false"
    >
      <form class="grid gap-4 md:grid-cols-2" @submit.prevent="submitUser">
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Имя</span>
          <UInput v-model="userForm.firstName" type="text" required placeholder="Введите имя" :ui="softInputUi" />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Фамилия</span>
          <UInput v-model="userForm.lastName" type="text" required placeholder="Введите фамилию" :ui="softInputUi" />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Телефон</span>
          <div class="flex items-center rounded-2xl bg-slate-50 px-4 ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-teal-400/60">
            <span class="pr-3 text-[14px] font-medium text-slate-500">+998</span>
            <UInput
              v-model="userForm.phone"
              type="tel"
              inputmode="numeric"
              required
              placeholder="90 123 45 67"
              :ui="{ root: 'w-full', base: 'w-full border-0 bg-transparent px-0 py-3 text-[14px] text-slate-700 ring-0 outline-none placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-0 focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-0' }"
            />
          </div>
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Пароль</span>
          <UInput v-model="userForm.password" type="password" required placeholder="Введите пароль" :ui="softInputUi" />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Роль</span>
          <USelect v-model="userForm.role" :items="companyRoleOptions" value-key="value" :ui="softSelectUi" :loading="rolesLoading" />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Дата рождения</span>
          <UInput v-model="userForm.birthDate" type="text" placeholder="15.10.1998" :ui="softInputUi" />
        </label>
        <label class="space-y-2 md:col-span-2">
          <span class="text-[13px] font-semibold text-slate-700">Текущий филиал</span>
          <USelect v-model="userForm.currentShopId" :items="shopOptions" value-key="value" :ui="softSelectUi" />
        </label>

        <label class="md:col-span-2 flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-[14px] text-slate-700 ring-1 ring-slate-200">
          <input v-model="userForm.canSwitchShops" type="checkbox" class="h-4 w-4 accent-teal-600" />
          Может переключать филиалы
        </label>

        <label class="md:col-span-2 flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-[14px] text-slate-700 ring-1 ring-slate-200">
          <input v-model="userForm.is_active" type="checkbox" class="h-4 w-4 accent-teal-600" />
          <span>
            <span class="block font-semibold">Активен</span>
            <span class="block text-[12px] text-slate-500">Включает или выключает доступ конкретного сотрудника.</span>
          </span>
        </label>

        <div class="space-y-2 md:col-span-2">
          <span class="text-[13px] font-semibold text-slate-700">Доступные филиалы</span>
          <div class="grid gap-3 md:grid-cols-2">
            <button
              v-for="shop in shops"
              :key="shop.id"
              type="button"
              class="cursor-pointer rounded-2xl border px-4 py-3 text-left transition"
              :class="userForm.allowedShopIds.includes(shop.id) ? 'border-teal-300 bg-teal-50' : 'border-slate-200 bg-slate-50 hover:bg-white'"
              @click="toggleAllowedShop(shop.id)"
            >
              <p class="font-medium text-slate-900">{{ shop.name }}</p>
              <p class="mt-1 text-[13px] text-slate-500">{{ shop.branchCode || "Без branch_code" }}</p>
            </button>
          </div>
        </div>

        <div class="mt-2 flex justify-end gap-3 md:col-span-2">
          <UButton
            type="button"
            color="neutral"
            variant="soft"
            class="rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200"
            @click="userModalOpen = false"
          >
            Отмена
          </UButton>
          <UButton
            type="submit"
            color="neutral"
            class="rounded-2xl bg-slate-950 text-white hover:bg-slate-800"
            :disabled="userSaving"
          >
            {{ userSaving ? "Сохраняем..." : "Создать сотрудника" }}
          </UButton>
        </div>
      </form>
    </ModalForm>
  </div>
</template>
