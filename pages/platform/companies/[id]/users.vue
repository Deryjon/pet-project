<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import DataPanel from "@/components/platform/DataPanel.vue";
import EmptyState from "@/components/platform/EmptyState.vue";
import ModalForm from "@/components/platform/ModalForm.vue";
import PageHeader from "@/components/platform/PageHeader.vue";
import StatusBadge from "@/components/platform/StatusBadge.vue";
import type { PlatformRole, PlatformShop, PlatformUser, PlatformUserPayload } from "@/composables/usePlatformAdmin";
import { usePlatformAdminApi } from "@/composables/usePlatformAdmin";
import { usePlatformFormUi } from "@/composables/usePlatformFormUi";

definePageMeta({ layout: "platform" });
useHead({ title: "Сотрудники компании | Konkurent Platform" });

const route = useRoute();
const companyId = computed(() => String(route.params.id || "").trim());
const { getCompany, getCompanyShops, getCompanyUsers, getCompanyRoles, createCompanyUser, updateUser, deleteUser } = usePlatformAdminApi();
const { softInputUi, softSelectUi } = usePlatformFormUi();
const toast = useToast();

const loading = ref(true);
const rolesLoading = ref(false);
const saving = ref(false);
const deletingId = ref("");
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
const editing = ref<PlatformUser | null>(null);

const form = reactive({
  firstName: "",
  lastName: "",
  phone: "",
  password: "",
  role: "employee",
  birthDate: "",
  currentShopId: "",
  allowedShopIds: [] as string[],
  canSwitchShops: false,
});

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

  if (form.role && !options.some((option) => option.value === form.role)) {
    options.push({ label: formatRoleLabel(form.role), value: form.role });
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
  shops.value.map((shop) => ({
    label: shop.name,
    value: shop.id,
  })),
);

watch(
  () => form.phone,
  (value) => {
    const digits = String(value || "").replace(/\D/g, "").slice(0, 9);
    const parts = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)].filter(Boolean);
    const formatted = parts.join(" ");

    if (formatted !== value) {
      form.phone = formatted;
    }
  },
);

watch(
  () => form.canSwitchShops,
  (value) => {
    if (value) return;
    form.allowedShopIds = form.currentShopId ? [form.currentShopId] : [];
  },
);

watch(
  () => form.currentShopId,
  (shopId) => {
    if (!shopId) return;
    if (!form.allowedShopIds.includes(shopId)) {
      form.allowedShopIds = form.canSwitchShops ? [...form.allowedShopIds, shopId] : [shopId];
    }
  },
);

const filteredUsers = computed(() =>
  users.value.filter((user) => {
    const q = search.value.trim().toLowerCase();
    const matchesSearch = !q || `${user.fullName} ${user.phone} ${user.roleName} ${user.roleId} ${user.currentShopName}`.toLowerCase().includes(q);
    const matchesRole = role.value === "all" || user.roleId === role.value;
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

async function loadData() {
  loading.value = true;
  rolesLoading.value = true;
  errorMessage.value = "";

  try {
    company.value = await getCompany(companyId.value);
  } catch (error: any) {
    errorMessage.value = resolveError(error, "Не удалось загрузить компанию");
  }

  try {
    shops.value = await getCompanyShops(companyId.value);
  } catch (error: any) {
    shops.value = [];
    errorMessage.value = resolveError(error, "Не удалось загрузить филиалы компании");
  }

  try {
    users.value = enrichUsersWithShopNames(await getCompanyUsers(companyId.value));
  } catch (error: any) {
    users.value = [];
    errorMessage.value = resolveError(error, "Не удалось загрузить сотрудников компании");
  }

  try {
    companyRoles.value = await getCompanyRoles();
    if (!editing.value && !companyRoleOptions.value.some((option) => option.value === form.role)) {
      form.role = companyRoleOptions.value[0]?.value || form.role;
    }
  } catch (error: any) {
    companyRoles.value = [];
    errorMessage.value = resolveError(error, "Не удалось загрузить роли компании");
  } finally {
    rolesLoading.value = false;
    loading.value = false;
  }
}

function resetForm() {
  form.firstName = "";
  form.lastName = "";
  form.phone = "";
  form.password = "";
  form.role = companyRoleOptions.value[0]?.value || "employee";
  form.birthDate = "";
  form.currentShopId = shops.value[0]?.id || "";
  form.allowedShopIds = form.currentShopId ? [form.currentShopId] : [];
  form.canSwitchShops = false;
}

function normalizePhoneForInput(phone: string) {
  const digits = phone.replace(/^\+998/, "").replace(/\D/g, "").slice(0, 9);
  const parts = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)].filter(Boolean);
  return parts.join(" ");
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
  form.role = user.roleId || "employee";
  form.birthDate = user.birthDate || "";
  form.currentShopId = user.currentShopId || shops.value[0]?.id || "";
  form.allowedShopIds = user.allowedShopIds.length
    ? user.allowedShopIds.filter((id) => shops.value.some((shop) => shop.id === id || shop.shopId === id))
    : form.currentShopId
      ? [form.currentShopId]
      : [];
  form.canSwitchShops = user.canSwitchShops;
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

function buildPayload(): PlatformUserPayload {
  const payload: PlatformUserPayload = {
    first_name: form.firstName.trim(),
    last_name: form.lastName.trim(),
    phone_number: `+998${form.phone.replace(/\D/g, "")}`,
    role: form.role,
    company_id: companyId.value,
    current_shop_id: form.currentShopId,
    allowed_shop_ids: [...form.allowedShopIds],
    can_switch_shops: form.canSwitchShops,
  };

  if (form.password.trim()) {
    payload.password = form.password.trim();
  }

  if (form.birthDate.trim()) {
    payload.birth_date = form.birthDate.trim();
  }

  return payload;
}

async function submit() {
  saving.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  const payload = buildPayload();

  if (payload.current_shop_id && !payload.allowed_shop_ids?.includes(payload.current_shop_id)) {
    toast.add({ title: "Проверьте филиалы сотрудника", color: "warning" });
    errorMessage.value = "Текущий филиал должен входить в список доступных филиалов.";
    saving.value = false;
    return;
  }

  try {
    if (editing.value?.id) {
      await updateUser(editing.value.id, payload);
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
  errorMessage.value = "";
  successMessage.value = "";

  try {
    await deleteUser(user.id);
    successMessage.value = "Пользователь удален";
    await loadData();
  } catch (error: any) {
    errorMessage.value = resolveError(error, "Не удалось удалить пользователя");
    toast.add({ title: "Не удалось удалить сотрудника", description: errorMessage.value, color: "error" });
  } finally {
    deletingId.value = "";
  }
}

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

    loadData();
  },
  { immediate: true },
);
</script>

<template>
  <div class="space-y-8">
    <PageHeader eyebrow="Сотрудники компании" :title="company?.name ? `Сотрудники: ${company.name}` : 'Сотрудники компании'" description="Управление сотрудниками выбранной компании.">
      <template #actions>
        <NuxtLink :to="`/platform/companies/${companyId}`" class="inline-flex h-10 cursor-pointer items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-medium text-slate-700 transition hover:bg-slate-100">
          Карточка компании
        </NuxtLink>
        <NuxtLink :to="`/platform/companies/${companyId}/shops`" class="inline-flex h-10 cursor-pointer items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-medium text-slate-700 transition hover:bg-slate-100">
          Филиалы
        </NuxtLink>
        <UButton color="neutral" class="cursor-pointer rounded-2xl bg-slate-950 text-white hover:bg-slate-800" @click="openCreate">
          <Icon name="heroicons:plus" class="mr-2 h-4 w-4" />
          Создать сотрудника
        </UButton>
      </template>
    </PageHeader>

    <div v-if="errorMessage" class="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-[14px] text-rose-600">
      {{ errorMessage }}
    </div>

    <div v-if="successMessage" class="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-[14px] text-emerald-700">
      {{ successMessage }}
    </div>

    <DataPanel title="Сотрудники" description="Фильтруйте список и управляйте доступом по филиалам.">
      <template #toolbar>
        <div class="flex flex-1 flex-wrap items-center gap-3">
          <div class="min-w-[240px] flex-1">
            <UInput v-model="search" type="text" placeholder="Поиск по имени, телефону, роли или филиалу" :ui="softInputUi" />
          </div>
          <USelect v-model="role" :items="tableRoleOptions" value-key="value" :ui="softSelectUi" class="min-w-[220px]" />
          <USelect v-model="status" :items="statusOptions" value-key="value" :ui="softSelectUi" class="min-w-[220px]" />
        </div>
      </template>

      <div v-if="loading" class="space-y-3">
        <div v-for="item in 6" :key="item" class="h-20 animate-pulse rounded-[24px] bg-slate-100" />
      </div>

      <EmptyState v-else-if="!filteredUsers.length" title="Сотрудники не найдены" description="Создайте первого сотрудника компании." icon="heroicons:user-plus" />

      <div v-else class="overflow-x-auto">
        <table class="min-w-full border-separate border-spacing-y-3">
          <thead>
            <tr class="text-left text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              <th class="px-4 py-2">Пользователь</th>
              <th class="px-4 py-2">Телефон</th>
              <th class="px-4 py-2">Роль</th>
              <th class="px-4 py-2">Текущий филиал</th>
              <th class="px-4 py-2">Статус</th>
              <th class="px-4 py-2">Создан</th>
              <th class="px-4 py-2">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td class="rounded-l-[22px] bg-slate-50 px-4 py-4">
                <p class="font-semibold text-slate-950">{{ user.fullName }}</p>
                <p class="mt-1 text-[13px] text-slate-500">{{ user.birthDate || "Дата рождения не указана" }}</p>
              </td>
              <td class="bg-slate-50 px-4 py-4 text-[14px] text-slate-600">{{ user.phone || "—" }}</td>
              <td class="bg-slate-50 px-4 py-4 text-[14px] text-slate-600">{{ user.roleName || user.roleId || "—" }}</td>
              <td class="bg-slate-50 px-4 py-4 text-[14px] text-slate-600">{{ user.currentShopName || user.currentShopId || "—" }}</td>
              <td class="bg-slate-50 px-4 py-4"><StatusBadge :status="user.status" /></td>
              <td class="bg-slate-50 px-4 py-4 text-[14px] text-slate-600">{{ user.createdAt || "—" }}</td>
              <td class="rounded-r-[22px] bg-slate-50 px-4 py-4">
                <div class="flex flex-wrap gap-2">
                  <UButton color="neutral" variant="soft" class="rounded-2xl bg-white text-slate-700 hover:bg-slate-100" @click="openEdit(user)">
                    Редактировать
                  </UButton>
                  <UButton color="error" variant="soft" class="rounded-2xl" :loading="deletingId === user.id" @click="removeUser(user)">
                    Удалить
                  </UButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </DataPanel>

    <ModalForm :open="modalOpen" :title="editing ? 'Редактировать сотрудника' : 'Создать сотрудника'" description="Заполните профиль сотрудника и настройте доступные филиалы." @close="modalOpen = false">
      <form class="grid gap-4 md:grid-cols-2" @submit.prevent="submit">
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Имя</span>
          <UInput v-model="form.firstName" type="text" required placeholder="Введите имя" :ui="softInputUi" />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Фамилия</span>
          <UInput v-model="form.lastName" type="text" required placeholder="Введите фамилию" :ui="softInputUi" />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Телефон</span>
          <div class="flex items-center rounded-2xl bg-slate-50 px-4 ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-teal-400/60">
            <span class="pr-3 text-[14px] font-medium text-slate-500">+998</span>
            <UInput
              v-model="form.phone"
              type="tel"
              inputmode="numeric"
              required
              placeholder="90 123 45 67"
              :ui="{ root: 'w-full', base: 'w-full border-0 bg-transparent px-0 py-3 text-[14px] text-slate-700 ring-0 outline-none placeholder:text-slate-400 focus:ring-0' }"
            />
          </div>
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Пароль</span>
          <UInput v-model="form.password" type="password" :required="!editing" placeholder="Введите пароль" :ui="softInputUi" />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Роль</span>
          <USelect v-model="form.role" :items="companyRoleOptions" value-key="value" :ui="softSelectUi" :loading="rolesLoading || loading" />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Дата рождения</span>
          <UInput v-model="form.birthDate" type="text" placeholder="15.10.1998" :ui="softInputUi" />
        </label>
        <label class="space-y-2 md:col-span-2">
          <span class="text-[13px] font-semibold text-slate-700">Текущий филиал</span>
          <USelect v-model="form.currentShopId" :items="shopOptions" value-key="value" :ui="softSelectUi" />
        </label>

        <label class="md:col-span-2 flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-[14px] text-slate-700 ring-1 ring-slate-200">
          <input v-model="form.canSwitchShops" type="checkbox" class="h-4 w-4 accent-teal-600" />
          Может переключать филиалы
        </label>

        <div class="space-y-2 md:col-span-2">
          <span class="text-[13px] font-semibold text-slate-700">Доступные филиалы</span>
          <div class="grid gap-3 md:grid-cols-2">
            <button
              v-for="shop in shops"
              :key="shop.id"
              type="button"
              class="cursor-pointer rounded-2xl border px-4 py-3 text-left transition"
              :class="form.allowedShopIds.includes(shop.id) ? 'border-teal-300 bg-teal-50' : 'border-slate-200 bg-slate-50 hover:bg-white'"
              @click="toggleAllowedShop(shop.id)"
            >
              <p class="font-medium text-slate-900">{{ shop.name }}</p>
              <p class="mt-1 text-[13px] text-slate-500">{{ shop.branchCode || "Без branch_code" }}</p>
            </button>
          </div>
        </div>

        <div class="mt-2 flex justify-end gap-3 md:col-span-2">
          <UButton type="button" color="neutral" variant="soft" class="rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200" @click="modalOpen = false">Отмена</UButton>
          <UButton type="submit" color="neutral" class="rounded-2xl bg-slate-950 text-white hover:bg-slate-800" :disabled="saving">
            {{ saving ? "Сохраняем..." : editing ? "Сохранить" : "Создать" }}
          </UButton>
        </div>
      </form>
    </ModalForm>
  </div>
</template>
