<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useHead, navigateTo } from "#imports";
import { useApi } from "~/composables/useApi";
import { useUserStore } from "@/store/useUserStore";

useHead({ title: "Редактирование сотрудника | Konkurent.cases" });

type User = {
  id?: number | string;
  first_name?: string;
  last_name?: string;
  branch_location?: string;
  branch_code?: string;
  phone_number?: string;
};

const route = useRoute();
const router = useRouter();
const { apiFetch } = useApi();
const userStore = useUserStore();

const id = computed(() => route.params.id as string);

const loading = ref(false);
const saving = ref(false);
const serverError = ref<string | null>(null);
const serverOk = ref<string | null>(null);

const firstName = ref("");
const lastName = ref("");
const branch = ref("");
const phone = ref("");
const password = ref("");

async function ensureAdminAccess() {
  if (!userStore.isAdmin) {
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
    const user = await apiFetch<User>(`/users/${encodeURIComponent(String(id.value))}`, { method: "GET" });
    firstName.value = user?.first_name || "";
    lastName.value = user?.last_name || "";
    branch.value = user?.branch_location || user?.branch_code || "";
    phone.value = String(user?.phone_number || "");
  } catch (e: any) {
    serverError.value = e?.data?.message || e?.message || "Не удалось загрузить пользователя";
  } finally {
    loading.value = false;
  }
}

onMounted(fetchUser);
watch(id, fetchUser);

async function saveNameBranch() {
  if (!id.value || !userStore.isAdmin) return;

  saving.value = true;
  serverError.value = null;
  serverOk.value = null;

  try {
    await apiFetch(`/users/${encodeURIComponent(String(id.value))}`, {
      method: "PUT",
      body: {
        first_name: String(firstName.value || ""),
        last_name: String(lastName.value || ""),
        branch_location: String(branch.value || ""),
      },
    });
    serverOk.value = "Данные сохранены";
    await fetchUser();
  } catch (e: any) {
    serverError.value = e?.data?.message || e?.message || "Ошибка сохранения";
  } finally {
    saving.value = false;
  }
}

async function savePhonePassword() {
  if (!id.value || !userStore.isAdmin) return;
  if (!phone.value && !password.value) return;

  saving.value = true;
  serverError.value = null;
  serverOk.value = null;

  try {
    const payload: any = {};
    if (phone.value) payload.phone_number = String(phone.value).replace(/\D/g, "");
    if (password.value) payload.password = String(password.value);

    await apiFetch(`/users/${encodeURIComponent(String(id.value))}`, {
      method: "PUT",
      body: payload,
    });

    serverOk.value = "Контакты и пароль обновлены";
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
</script>

<template>
  <section class="w-full max-w-[820px] text-white">
    <div class="mb-6 flex items-center justify-between">
      <h2 class="text-[28px] font-bold">Сотрудник #{{ id }}</h2>
      <button class="text-blue-400 hover:underline" @click="goBack">← Назад к списку</button>
    </div>

    <div class="flex flex-col gap-6 rounded-2xl bg-[#262626] p-6 shadow-xl">
      <div class="flex items-center gap-3">
        <button class="text-sm text-blue-300 hover:text-blue-200" @click="fetchUser">Обновить</button>
        <span v-if="loading" class="text-sm text-[#aaa]">Загрузка...</span>
      </div>

      <p v-if="serverError" class="text-sm text-red-400">{{ serverError }}</p>
      <p v-if="serverOk" class="text-sm text-green-400">{{ serverOk }}</p>

      <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div class="flex flex-col gap-2">
          <label class="font-medium">Имя</label>
          <input v-model="firstName" type="text" class="rounded-[12px] bg-[#404040] px-4 py-3 text-white" placeholder="Ivan" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="font-medium">Фамилия</label>
          <input v-model="lastName" type="text" class="rounded-[12px] bg-[#404040] px-4 py-3 text-white" placeholder="Petrov" />
        </div>
        <div class="flex flex-col gap-2 md:col-span-2">
          <label class="font-medium">Филиал</label>
          <input v-model="branch" type="text" class="rounded-[12px] bg-[#404040] px-4 py-3 text-white" placeholder="branch_b" />
        </div>
        <div class="md:col-span-2">
          <button :disabled="saving" class="rounded-[12px] bg-blue-600 px-5 py-3 font-semibold transition hover:bg-blue-700 disabled:opacity-60" @click="saveNameBranch">
            Сохранить имя и филиал
          </button>
        </div>
      </div>

      <hr class="border-[#3a3a3a]" />

      <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div class="flex flex-col gap-2">
          <label class="font-medium">Телефон</label>
          <input v-model="phone" type="tel" class="rounded-[12px] bg-[#404040] px-4 py-3 text-white" placeholder="998901112233" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="font-medium">Новый пароль</label>
          <input v-model="password" type="password" class="rounded-[12px] bg-[#404040] px-4 py-3 text-white" placeholder="newpass123" />
        </div>
        <div class="md:col-span-2">
          <button :disabled="saving" class="rounded-[12px] bg-blue-600 px-5 py-3 font-semibold transition hover:bg-blue-700 disabled:opacity-60" @click="savePhonePassword">
            Обновить телефон и пароль
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
input::placeholder {
  color: #bdbdbd;
}
</style>
