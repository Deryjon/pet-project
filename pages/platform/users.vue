<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import DataPanel from "@/components/platform/DataPanel.vue";
import EmptyState from "@/components/platform/EmptyState.vue";
import ModalForm from "@/components/platform/ModalForm.vue";
import PageHeader from "@/components/platform/PageHeader.vue";
import StatusBadge from "@/components/platform/StatusBadge.vue";
import type { PlatformRole, PlatformUser, PlatformUserPayload } from "@/composables/usePlatformAdmin";
import { usePlatformAdminApi } from "@/composables/usePlatformAdmin";
import { usePlatformFormUi } from "@/composables/usePlatformFormUi";

definePageMeta({ layout: "platform" });
useHead({ title: "Суппорты и админы | Konkurent" });

const statusOptions = [
  { label: "Все статусы", value: "all" },
  { label: "Активные", value: "active" },
  { label: "Отключенные", value: "inactive" },
];

const { getPlatformUsers, getPlatformRoles, createPlatformUser, updateUser, deleteUser } = usePlatformAdminApi();
const { softInputUi, softSelectUi } = usePlatformFormUi();
const toast = useToast();

const loading = ref(true);
const rolesLoading = ref(false);
const saving = ref(false);
const deletingId = ref("");
const modalOpen = ref(false);
const editing = ref<PlatformUser | null>(null);
const errorMessage = ref("");
const successMessage = ref("");
const users = ref<PlatformUser[]>([]);
const platformRoles = ref<PlatformRole[]>([]);
const search = ref("");
const roleFilter = ref("all");
const statusFilter = ref("all");

const form = reactive({
  firstName: "",
  lastName: "",
  phone: "",
  password: "",
  role: "support",
  birthDate: "",
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

const platformRoleOptions = computed(() => {
  const options = platformRoles.value
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

const roleFilterOptions = computed(() => [{ label: "Все роли", value: "all" }, ...platformRoleOptions.value]);

const filteredUsers = computed(() =>
  users.value.filter((user) => {
    const q = search.value.trim().toLowerCase();
    const haystack = `${user.fullName} ${user.phone} ${user.roleName} ${user.roleId}`.toLowerCase();
    const matchesSearch = !q || haystack.includes(q);
    const matchesRole = roleFilter.value === "all" || user.roleId === roleFilter.value;
    const matchesStatus = statusFilter.value === "all" || user.status === statusFilter.value;
    return matchesSearch && matchesRole && matchesStatus;
  }),
);

function resolveError(error: any, fallback: string) {
  const message = error?.data?.message ?? error?.response?._data?.message;
  return Array.isArray(message) ? message.join(", ") : message || error?.message || fallback;
}

function resetForm() {
  form.firstName = "";
  form.lastName = "";
  form.phone = "";
  form.password = "";
  form.role = platformRoleOptions.value[0]?.value || "support";
  form.birthDate = "";
}

function normalizePhoneForInput(phone: string) {
  const digits = String(phone || "").replace(/\D/g, "");
  const localDigits = digits.startsWith("998") ? digits.slice(3) : digits;
  const normalized = localDigits.slice(0, 9);
  const parts = [normalized.slice(0, 2), normalized.slice(2, 5), normalized.slice(5, 7), normalized.slice(7, 9)].filter(Boolean);
  return parts.join(" ");
}

function buildPayload(): PlatformUserPayload {
  const payload: PlatformUserPayload = {
    first_name: form.firstName.trim(),
    last_name: form.lastName.trim(),
    phone_number: `+998${form.phone.replace(/\D/g, "")}`,
    role: form.role,
  };

  if (form.password.trim()) payload.password = form.password.trim();
  if (form.birthDate.trim()) payload.birth_date = form.birthDate.trim();
  return payload;
}

async function loadUsers() {
  loading.value = true;
  errorMessage.value = "";

  try {
    users.value = await getPlatformUsers();
  } catch (error: any) {
    users.value = [];
    errorMessage.value = resolveError(error, "Не удалось загрузить суппортов и админов");
  } finally {
    loading.value = false;
  }
}

async function loadRoles() {
  rolesLoading.value = true;

  try {
    platformRoles.value = await getPlatformRoles();
    if (!editing.value && !platformRoleOptions.value.some((option) => option.value === form.role)) {
      form.role = platformRoleOptions.value[0]?.value || form.role;
    }
  } catch (error: any) {
    platformRoles.value = [];
    errorMessage.value = resolveError(error, "Не удалось загрузить роли платформы");
  } finally {
    rolesLoading.value = false;
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
  form.role = user.roleId || "support";
  form.birthDate = user.birthDate || "";
  successMessage.value = "";
  modalOpen.value = true;
}

async function submit() {
  saving.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    if (editing.value?.id) {
      await updateUser(editing.value.id, buildPayload());
      successMessage.value = "Пользователь платформы обновлен";
      toast.add({ title: "Пользователь обновлен", color: "success" });
    } else {
      await createPlatformUser(buildPayload());
      successMessage.value = "Пользователь платформы создан";
      toast.add({ title: "Пользователь создан", color: "success" });
    }

    modalOpen.value = false;
    await loadUsers();
  } catch (error: any) {
    errorMessage.value = resolveError(error, "Не удалось сохранить пользователя платформы");
    toast.add({ title: "Не удалось сохранить пользователя", description: errorMessage.value, color: "error" });
  } finally {
    saving.value = false;
  }
}

async function removeUser(user: PlatformUser) {
  if (typeof window !== "undefined" && !window.confirm(`Удалить "${user.fullName}"?`)) {
    return;
  }

  deletingId.value = user.id;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    await deleteUser(user.id);
    successMessage.value = "Пользователь платформы удален";
    await loadUsers();
  } catch (error: any) {
    errorMessage.value = resolveError(error, "Не удалось удалить пользователя платформы");
    toast.add({ title: "Не удалось удалить пользователя", description: errorMessage.value, color: "error" });
  } finally {
    deletingId.value = "";
  }
}

watch(
  () => form.phone,
  (value) => {
    const digits = String(value || "").replace(/\D/g, "").slice(0, 9);
    const parts = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)].filter(Boolean);
    const formatted = parts.join(" ");
    if (formatted !== value) form.phone = formatted;
  },
);

watch(
  () => true,
  () => {
    loadRoles();
    loadUsers();
  },
  { immediate: true, once: true },
);
</script>

<template>
  <div class="space-y-8">
    <PageHeader
      eyebrow="Платформа"
      title="Суппорты и админы"
      description="Управление platform users с ролями support и platform_admin."
    >
      <template #actions>
        <UButton color="neutral" variant="soft" class="cursor-pointer rounded-2xl bg-white text-slate-700 hover:bg-slate-100" @click="loadUsers">
          <Icon name="heroicons:arrow-path" class="mr-2 h-4 w-4" />
          Обновить
        </UButton>
        <UButton color="neutral" class="cursor-pointer rounded-2xl bg-slate-950 text-white hover:bg-slate-800" @click="openCreate">
          <Icon name="heroicons:plus" class="mr-2 h-4 w-4" />
          Новый пользователь
        </UButton>
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

    <DataPanel title="Список platform users" description="Только суппорты и админы платформы, без сотрудников компаний.">
      <template #toolbar>
        <div class="flex flex-1 flex-wrap items-center gap-3">
          <div class="min-w-[260px] flex-1">
            <UInput v-model="search" type="text" placeholder="Поиск по имени, телефону или роли" :ui="softInputUi" />
          </div>
          <USelect v-model="roleFilter" :items="roleFilterOptions" value-key="value" :ui="softSelectUi" class="min-w-[220px]" />
          <USelect v-model="statusFilter" :items="statusOptions" value-key="value" :ui="softSelectUi" class="min-w-[220px]" />
        </div>
      </template>

      <div v-if="loading" class="overflow-x-auto">
        <div class="min-w-full">
          <div v-for="item in 6" :key="item" class="mb-3 h-16 animate-pulse rounded-[22px] bg-slate-100" />
        </div>
      </div>

      <EmptyState
        v-else-if="!filteredUsers.length"
        title="Пользователи не найдены"
        description="Измените фильтры или создайте первого суппорта либо админа платформы."
        icon="heroicons:users"
      />

      <div v-else class="overflow-x-auto">
        <table class="min-w-full border-separate border-spacing-y-3">
          <thead>
            <tr class="text-left text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              <th class="px-4 py-2">Пользователь</th>
              <th class="px-4 py-2">Телефон</th>
              <th class="px-4 py-2">Роль</th>
              <th class="px-4 py-2">Роль??</th>
              <th class="px-4 py-2">Роль Телефон?</th>
              <th class="px-4 py-2">ID</th>
              <th class="px-4 py-2">Телефон?</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td class="rounded-l-[22px] bg-slate-50 px-4 py-4">
                <p class="font-semibold text-slate-950">{{ user.fullName }}</p>
              </td>
              <td class="bg-slate-50 px-4 py-4 text-[14px] text-slate-600">{{ user.phone || "—" }}</td>
              <td class="bg-slate-50 px-4 py-4 text-[14px] text-slate-600">{{ user.roleName || user.roleId || "—" }}</td>
              <td class="bg-slate-50 px-4 py-4">
                <StatusBadge :status="user.status" />
              </td>
              <td class="bg-slate-50 px-4 py-4 text-[14px] text-slate-600">{{ user.birthDate || "?? Телефон" }}</td>
              <td class="bg-slate-50 px-4 py-4 text-[14px] text-slate-600">{{ user.id }}</td>
              <td class="rounded-r-[22px] bg-slate-50 px-4 py-4">
                <div class="flex flex-wrap gap-2">
                  <UButton color="neutral" variant="soft" class="rounded-2xl bg-white text-slate-700 hover:bg-slate-100" @click="openEdit(user)">
                    Пользователь?
                  </UButton>
                  <UButton color="error" variant="soft" class="rounded-2xl" :loading="deletingId === user.id" @click="removeUser(user)">
                    Телефон
                  </UButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </DataPanel>

    <ModalForm
      :open="modalOpen"
      :title="editing ? 'Редактировать пользователя платформы' : 'Создать пользователя платформы'"
      description="Заполните данные support или platform_admin."
      @close="modalOpen = false"
    >
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
              :ui="{ root: 'w-full', base: 'w-full border-0 bg-transparent px-0 py-3 text-[14px] text-slate-700 ring-0 outline-none placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-0 focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-0' }"
            />
          </div>
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Пароль</span>
          <UInput
            v-model="form.password"
            type="password"
            :required="!editing"
            placeholder="Введите пароль"
            :ui="softInputUi"
          />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Роль</span>
          <USelect
            v-model="form.role"
            :items="platformRoleOptions"
            value-key="value"
            placeholder="Выберите роль"
            :ui="softSelectUi"
            :loading="rolesLoading"
            class="w-full"
          />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Дата рождения</span>
          <UInput v-model="form.birthDate" type="text" placeholder="15.10.1998" :ui="softInputUi" />
        </label>

        <div class="mt-2 flex justify-end gap-3 md:col-span-2">
          <UButton type="button" color="neutral" variant="soft" class="rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200" @click="modalOpen = false">
            Отмена
          </UButton>
          <UButton type="submit" color="neutral" class="rounded-2xl bg-slate-950 text-white hover:bg-slate-800" :disabled="saving">
            {{ saving ? "Сохраняем..." : editing ? "Сохранить" : "Создать" }}
          </UButton>
        </div>
      </form>
    </ModalForm>
  </div>
</template>
