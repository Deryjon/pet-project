<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import DataPanel from "@/components/platform/DataPanel.vue";
import EmptyState from "@/components/platform/EmptyState.vue";
import ModalForm from "@/components/platform/ModalForm.vue";
import PageHeader from "@/components/platform/PageHeader.vue";
import StatusBadge from "@/components/platform/StatusBadge.vue";
import type { PlatformUser } from "@/composables/usePlatformAdmin";
import { usePlatformAdminMock } from "@/composables/usePlatformAdmin";

definePageMeta({ layout: "platform" });
useHead({ title: "Users | Konkurent Platform" });

const { users, shops, companyOptions, shopOptions, userRoleOptions, upsertUser } = usePlatformAdminMock();

const search = ref("");
const companyId = ref("all");
const role = ref("all");
const status = ref("all");
const modalOpen = ref(false);
const editing = ref<PlatformUser | null>(null);
const loading = ref(true);

const form = reactive({
  fullName: "",
  phone: "",
  email: "",
  companyId: "",
  currentShopId: "",
  role: "Admin",
  status: "active" as "active" | "inactive",
});

const filteredUsers = computed(() =>
  users.value.filter((user) => {
    const q = search.value.trim().toLowerCase();
    const matchesSearch =
      !q || `${user.fullName} ${user.phone} ${user.email} ${user.companyName} ${user.currentShopName}`.toLowerCase().includes(q);
    const matchesCompany = companyId.value === "all" || user.companyId === companyId.value;
    const matchesRole = role.value === "all" || user.role === role.value;
    const matchesStatus = status.value === "all" || user.status === status.value;
    return matchesSearch && matchesCompany && matchesRole && matchesStatus;
  }),
);

const companyShopOptions = computed(() => {
  if (!form.companyId) return shopOptions.value;
  return shops.value.filter((shop) => shop.companyId === form.companyId).map((shop) => ({ label: shop.name, value: shop.id }));
});

onMounted(() => {
  window.setTimeout(() => {
    loading.value = false;
  }, 650);
});

function openCreate() {
  editing.value = null;
  form.fullName = "";
  form.phone = "";
  form.email = "";
  form.companyId = companyOptions.value[0]?.value ?? "";
  form.currentShopId = companyShopOptions.value[0]?.value ?? shopOptions.value[0]?.value ?? "";
  form.role = "Admin";
  form.status = "active";
  modalOpen.value = true;
}

function openEdit(user: PlatformUser) {
  editing.value = user;
  form.fullName = user.fullName;
  form.phone = user.phone;
  form.email = user.email;
  form.companyId = user.companyId;
  form.currentShopId = user.currentShopId;
  form.role = user.role;
  form.status = user.status;
  modalOpen.value = true;
}

function onCompanyChange(nextCompanyId: string) {
  form.companyId = nextCompanyId;
  form.currentShopId = companyShopOptions.value[0]?.value ?? "";
}

function handleCompanySelect(event: Event) {
  onCompanyChange((event.target as HTMLSelectElement).value);
}

function submit() {
  upsertUser({
    id: editing.value?.id,
    fullName: form.fullName,
    phone: form.phone,
    email: form.email,
    companyId: form.companyId,
    currentShopId: form.currentShopId,
    role: form.role,
    status: form.status,
  });
  modalOpen.value = false;
}
</script>

<template>
  <div class="space-y-8">
    <PageHeader eyebrow="Access Management" title="Users" description="Manage platform tenant users, roles and active assignments with a clean SaaS-grade interface.">
      <template #actions>
        <UButton color="neutral" class="rounded-2xl bg-slate-950 text-white hover:bg-slate-800" @click="openCreate">
          <Icon name="heroicons:plus" class="mr-2 h-4 w-4" />
          Create user
        </UButton>
      </template>
    </PageHeader>

    <DataPanel title="User directory" description="Reusable data table prepared for API-backed search, filtering and role workflows.">
      <template #toolbar>
        <div class="flex flex-1 flex-wrap items-center gap-3">
          <div class="min-w-[240px] flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <input v-model="search" type="text" placeholder="Search by name, phone, email, company or shop" class="w-full bg-transparent text-[14px] text-slate-700 outline-none placeholder:text-slate-400" />
          </div>
          <select v-model="companyId" class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] text-slate-700 outline-none">
            <option value="all">All companies</option>
            <option v-for="option in companyOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
          <select v-model="role" class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] text-slate-700 outline-none">
            <option value="all">All roles</option>
            <option v-for="option in userRoleOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
          <select v-model="status" class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] text-slate-700 outline-none">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </template>

      <div v-if="loading" class="space-y-3">
        <div v-for="item in 6" :key="item" class="h-20 animate-pulse rounded-[24px] bg-slate-100" />
      </div>

      <EmptyState v-else-if="!filteredUsers.length" title="No users found" description="Try changing filters or create the first platform user for a tenant company." icon="heroicons:users" />

      <div v-else class="overflow-x-auto">
        <table class="min-w-full border-separate border-spacing-y-3">
          <thead>
            <tr class="text-left text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              <th class="px-4 py-2">User</th>
              <th class="px-4 py-2">Company</th>
              <th class="px-4 py-2">Current shop</th>
              <th class="px-4 py-2">Role</th>
              <th class="px-4 py-2">Status</th>
              <th class="px-4 py-2">Created at</th>
              <th class="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td class="rounded-l-[22px] bg-slate-50 px-4 py-4">
                <div class="flex items-center gap-3">
                  <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 via-white to-emerald-50 text-[14px] font-semibold text-slate-700">
                    {{ user.fullName.split(" ").map((part) => part[0]).join("").slice(0, 2) }}
                  </div>
                  <div>
                    <p class="font-semibold text-slate-950">{{ user.fullName }}</p>
                    <p class="mt-1 text-[13px] text-slate-500">{{ user.phone }}</p>
                    <p class="text-[13px] text-slate-400">{{ user.email }}</p>
                  </div>
                </div>
              </td>
              <td class="bg-slate-50 px-4 py-4 text-[14px] text-slate-600">{{ user.companyName }}</td>
              <td class="bg-slate-50 px-4 py-4 text-[14px] text-slate-600">{{ user.currentShopName }}</td>
              <td class="bg-slate-50 px-4 py-4">
                <span class="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-[12px] font-semibold text-slate-700">{{ user.role }}</span>
              </td>
              <td class="bg-slate-50 px-4 py-4"><StatusBadge :status="user.status" /></td>
              <td class="bg-slate-50 px-4 py-4 text-[14px] text-slate-600">{{ user.createdAt }}</td>
              <td class="rounded-r-[22px] bg-slate-50 px-4 py-4">
                <div class="flex items-center gap-2">
                  <UButton color="neutral" variant="soft" class="rounded-2xl bg-white text-slate-700 hover:bg-slate-100" @click="openEdit(user)">Edit</UButton>
                  <UButton color="neutral" variant="ghost" class="rounded-2xl text-slate-500 hover:bg-white">Details</UButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </DataPanel>

    <ModalForm :open="modalOpen" :title="editing ? 'Edit user' : 'Create user'" description="Validation-ready user form with clean spacing, company binding and current shop assignment." @close="modalOpen = false">
      <form class="grid gap-4 md:grid-cols-2" @submit.prevent="submit">
        <label class="space-y-2 md:col-span-2">
          <span class="text-[13px] font-semibold text-slate-700">Full name</span>
          <input v-model="form.fullName" type="text" required class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] outline-none focus:border-sky-300 focus:bg-white" />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Phone</span>
          <input v-model="form.phone" type="text" required class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] outline-none focus:border-sky-300 focus:bg-white invalid:border-rose-300" />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Email</span>
          <input v-model="form.email" type="email" required class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] outline-none focus:border-sky-300 focus:bg-white invalid:border-rose-300" />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Company</span>
          <select :value="form.companyId" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] outline-none focus:border-sky-300 focus:bg-white" @change="handleCompanySelect">
            <option v-for="option in companyOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Current shop</span>
          <select v-model="form.currentShopId" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] outline-none focus:border-sky-300 focus:bg-white">
            <option v-for="option in companyShopOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Role</span>
          <select v-model="form.role" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] outline-none focus:border-sky-300 focus:bg-white">
            <option v-for="option in userRoleOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Status</span>
          <select v-model="form.status" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] outline-none focus:border-sky-300 focus:bg-white">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <p class="md:col-span-2 text-[12px] leading-6 text-slate-400">
          Form structure is already separated for future API wiring: submit handler only needs backend mutation and response mapping.
        </p>
        <div class="mt-2 flex justify-end gap-3 md:col-span-2">
          <UButton color="neutral" variant="soft" class="rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200" @click="modalOpen = false">Cancel</UButton>
          <UButton type="submit" color="neutral" class="rounded-2xl bg-slate-950 text-white hover:bg-slate-800">
            {{ editing ? "Save changes" : "Create user" }}
          </UButton>
        </div>
      </form>
    </ModalForm>
  </div>
</template>
