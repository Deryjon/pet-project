<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import DataPanel from "@/components/platform/DataPanel.vue";
import EmptyState from "@/components/platform/EmptyState.vue";
import ModalForm from "@/components/platform/ModalForm.vue";
import PageHeader from "@/components/platform/PageHeader.vue";
import StatusBadge from "@/components/platform/StatusBadge.vue";
import type { PlatformUser } from "@/composables/usePlatformAdmin";
import { usePlatformAdminApi } from "@/composables/usePlatformAdmin";

definePageMeta({ layout: "platform" });
useHead({ title: "Пользователи платформы | Konkurent Platform" });

const { getUsers, createUser } = usePlatformAdminApi();

const loading = ref(true);
const saving = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const users = ref<PlatformUser[]>([]);
const search = ref("");
const role = ref("all");
const status = ref("all");
const modalOpen = ref(false);

const form = reactive({
  fullName: "",
  phone: "",
  password: "",
  role: "platform_admin",
});

const roleOptions = [
  { label: "platform_admin", value: "platform_admin" },
  { label: "support", value: "support" },
];

watch(
  () => form.phone,
  (value) => {
    const digits = String(value || "").replace(/\D/g, "").slice(0, 9);
    const parts = [
      digits.slice(0, 2),
      digits.slice(2, 5),
      digits.slice(5, 7),
      digits.slice(7, 9),
    ].filter(Boolean);

    const formatted = parts.join(" ");
    if (formatted !== value) {
      form.phone = formatted;
    }
  },
);

const filteredUsers = computed(() =>
  users.value.filter((user) => {
    const q = search.value.trim().toLowerCase();
    const matchesSearch =
      !q || `${user.fullName} ${user.phone} ${user.email} ${user.role}`.toLowerCase().includes(q);
    const matchesRole = role.value === "all" || user.role === role.value;
    const matchesStatus = status.value === "all" || user.status === status.value;
    return matchesSearch && matchesRole && matchesStatus;
  }),
);

async function loadUsers() {
  loading.value = true;
  errorMessage.value = "";

  try {
    users.value = await getUsers();
  } catch (error: any) {
    const message = error?.data?.message;
    errorMessage.value = Array.isArray(message)
      ? message.join(", ")
      : message || error?.message || "Не удалось загрузить пользователей платформы";
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  form.fullName = "";
  form.phone = "";
  form.password = "";
  form.role = "platform_admin";
  successMessage.value = "";
  modalOpen.value = true;
}

async function submit() {
  saving.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    const [firstName, ...rest] = form.fullName.trim().split(/\s+/).filter(Boolean);
    const lastName = rest.join(" ");

    await createUser({
      first_name: firstName || form.fullName.trim(),
      last_name: lastName,
      phone_number: `+998${form.phone.replace(/\D/g, "")}`,
      password: form.password.trim(),
      role: form.role,
    });

    successMessage.value = "Пользователь платформы создан";
    modalOpen.value = false;
    await loadUsers();
  } catch (error: any) {
    const message = error?.data?.message;
    errorMessage.value = Array.isArray(message)
      ? message.join(", ")
      : message || error?.message || "Не удалось создать пользователя платформы";
  } finally {
    saving.value = false;
  }
}

onMounted(loadUsers);
</script>

<template>
  <div class="space-y-8">
    <PageHeader eyebrow="Пользователи" title="Пользователи платформы" description="Список и создание пользователей с ролями `platform_admin` и `support`.">
      <template #actions>
        <UButton color="neutral" variant="soft" class="rounded-2xl bg-white text-slate-700 hover:bg-slate-100" @click="loadUsers">
          <Icon name="heroicons:arrow-path" class="mr-2 h-4 w-4" />
          Обновить
        </UButton>
        <UButton color="neutral" class="rounded-2xl bg-slate-950 text-white hover:bg-slate-800" @click="openCreate">
          <Icon name="heroicons:plus" class="mr-2 h-4 w-4" />
          Создать пользователя
        </UButton>
      </template>
    </PageHeader>

    <div v-if="errorMessage" class="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-[14px] text-rose-600">
      {{ errorMessage }}
    </div>

    <div v-if="successMessage" class="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-[14px] text-emerald-700">
      {{ successMessage }}
    </div>

    <DataPanel title="Список пользователей" description="Работа с `GET /platform/users` и `POST /platform/users`.">
      <template #toolbar>
        <div class="flex flex-1 flex-wrap items-center gap-3">
          <div class="min-w-[240px] flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <input v-model="search" type="text" placeholder="Поиск по имени, телефону, email или роли" class="w-full bg-transparent text-[14px] text-slate-700 outline-none placeholder:text-slate-400" />
          </div>
          <select v-model="role" class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] text-slate-700 outline-none">
            <option value="all">Все роли</option>
            <option v-for="option in roleOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
          <select v-model="status" class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] text-slate-700 outline-none">
            <option value="all">Все статусы</option>
            <option value="active">Активные</option>
            <option value="inactive">Отключенные</option>
          </select>
        </div>
      </template>

      <div v-if="loading" class="space-y-3">
        <div v-for="item in 6" :key="item" class="h-20 animate-pulse rounded-[24px] bg-slate-100" />
      </div>

      <EmptyState v-else-if="!filteredUsers.length" title="Пользователи не найдены" description="Создайте первого пользователя платформы или измените фильтры." icon="heroicons:users" />

      <div v-else class="overflow-x-auto">
        <table class="min-w-full border-separate border-spacing-y-3">
          <thead>
            <tr class="text-left text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              <th class="px-4 py-2">Пользователь</th>
              <th class="px-4 py-2">Телефон</th>
              <th class="px-4 py-2">Email</th>
              <th class="px-4 py-2">Роль</th>
              <th class="px-4 py-2">Статус</th>
              <th class="px-4 py-2">Создан</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td class="rounded-l-[22px] bg-slate-50 px-4 py-4 font-semibold text-slate-950">{{ user.fullName }}</td>
              <td class="bg-slate-50 px-4 py-4 text-[14px] text-slate-600">{{ user.phone || "—" }}</td>
              <td class="bg-slate-50 px-4 py-4 text-[14px] text-slate-600">{{ user.email || "—" }}</td>
              <td class="bg-slate-50 px-4 py-4">
                <span class="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-[12px] font-semibold text-slate-700">{{ user.role || "—" }}</span>
              </td>
              <td class="bg-slate-50 px-4 py-4"><StatusBadge :status="user.status" /></td>
              <td class="rounded-r-[22px] bg-slate-50 px-4 py-4 text-[14px] text-slate-600">{{ user.createdAt || "—" }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </DataPanel>

    <ModalForm :open="modalOpen" title="Создать пользователя платформы" description="Создание пользователя с ролью `platform_admin` или `support`." @close="modalOpen = false">
      <form class="grid gap-4 md:grid-cols-2" @submit.prevent="submit">
        <label class="space-y-2 md:col-span-2">
          <span class="text-[13px] font-semibold text-slate-700">ФИО</span>
          <input v-model="form.fullName" type="text" required class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] outline-none focus:border-sky-300 focus:bg-white" />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Телефон</span>
          <div class="flex items-center rounded-2xl border border-slate-200 bg-slate-50">
            <span class="pl-4 text-[14px] font-medium text-slate-500">+998</span>
            <input v-model="form.phone" type="tel" inputmode="numeric" required placeholder="90 123 45 67" class="w-full bg-transparent px-3 py-3 text-[14px] outline-none" />
          </div>
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Пароль</span>
          <input v-model="form.password" type="password" required class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] outline-none focus:border-sky-300 focus:bg-white" />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Роль</span>
          <select v-model="form.role" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] outline-none focus:border-sky-300 focus:bg-white">
            <option v-for="option in roleOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>
        <div class="mt-2 flex justify-end gap-3 md:col-span-2">
          <UButton color="neutral" variant="soft" class="rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200" @click="modalOpen = false">Отмена</UButton>
          <UButton type="submit" color="neutral" class="rounded-2xl bg-slate-950 text-white hover:bg-slate-800" :disabled="saving">
            {{ saving ? "Создаём..." : "Создать" }}
          </UButton>
        </div>
      </form>
    </ModalForm>
  </div>
</template>
