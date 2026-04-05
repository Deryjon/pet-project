<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import DataPanel from "@/components/platform/DataPanel.vue";
import EmptyState from "@/components/platform/EmptyState.vue";
import ModalForm from "@/components/platform/ModalForm.vue";
import PageHeader from "@/components/platform/PageHeader.vue";
import StatusBadge from "@/components/platform/StatusBadge.vue";
import type { PlatformCompany } from "@/composables/usePlatformAdmin";
import { usePlatformAdminMock } from "@/composables/usePlatformAdmin";

definePageMeta({ layout: "platform" });
useHead({ title: "Companies | Konkurent Platform" });

const { companies, upsertCompany } = usePlatformAdminMock();

const search = ref("");
const status = ref("all");
const modalOpen = ref(false);
const editing = ref<PlatformCompany | null>(null);
const activeMenuId = ref<string | null>(null);

const form = reactive({
  name: "",
  login: "",
  subdomain: "",
  status: "active" as "active" | "inactive",
  shopsCount: 0,
  usersCount: 0,
});

const filteredCompanies = computed(() =>
  companies.value.filter((company) => {
    const q = search.value.trim().toLowerCase();
    const matchesSearch = !q || `${company.name} ${company.login} ${company.subdomain}`.toLowerCase().includes(q);
    const matchesStatus = status.value === "all" || company.status === status.value;
    return matchesSearch && matchesStatus;
  }),
);

function openCreate() {
  editing.value = null;
  form.name = "";
  form.login = "";
  form.subdomain = "";
  form.status = "active";
  form.shopsCount = 0;
  form.usersCount = 0;
  modalOpen.value = true;
}

function openEdit(company: PlatformCompany) {
  editing.value = company;
  form.name = company.name;
  form.login = company.login;
  form.subdomain = company.subdomain;
  form.status = company.status;
  form.shopsCount = company.shopsCount;
  form.usersCount = company.usersCount;
  modalOpen.value = true;
  activeMenuId.value = null;
}

function submit() {
  upsertCompany({
    id: editing.value?.id,
    name: form.name,
    login: form.login,
    subdomain: form.subdomain,
    status: form.status,
    shopsCount: Number(form.shopsCount),
    usersCount: Number(form.usersCount),
  });
  modalOpen.value = false;
}
</script>

<template>
  <div class="space-y-8">
    <PageHeader eyebrow="Tenant Management" title="Companies" description="Manage tenant companies, subdomains and account state from a clean premium workspace.">
      <template #actions>
        <UButton color="neutral" class="rounded-2xl bg-slate-950 text-white hover:bg-slate-800" @click="openCreate">
          <Icon name="heroicons:plus" class="mr-2 h-4 w-4" />
          Create company
        </UButton>
      </template>
    </PageHeader>

    <DataPanel title="Company directory" description="Production-ready table structure prepared for future API integration.">
      <template #toolbar>
        <div class="flex flex-1 flex-wrap items-center gap-3">
          <div class="min-w-[240px] flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <input v-model="search" type="text" placeholder="Search company, login or subdomain" class="w-full bg-transparent text-[14px] text-slate-700 outline-none placeholder:text-slate-400" />
          </div>
          <select v-model="status" class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] text-slate-700 outline-none">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </template>

      <EmptyState v-if="!filteredCompanies.length" title="No companies found" description="Adjust search or filters to reveal matching tenant accounts." icon="heroicons:building-office-2" />

      <div v-else class="overflow-x-auto">
        <table class="min-w-full border-separate border-spacing-y-3">
          <thead>
            <tr class="text-left text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              <th class="px-4 py-2">Company</th>
              <th class="px-4 py-2">Login</th>
              <th class="px-4 py-2">Subdomain</th>
              <th class="px-4 py-2">Status</th>
              <th class="px-4 py-2">Created at</th>
              <th class="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="company in filteredCompanies" :key="company.id">
              <td class="rounded-l-[22px] bg-slate-50 px-4 py-4">
                <p class="font-semibold text-slate-950">{{ company.name }}</p>
                <p class="mt-1 text-[13px] text-slate-500">{{ company.shopsCount }} shops · {{ company.usersCount }} users</p>
              </td>
              <td class="bg-slate-50 px-4 py-4 text-[14px] text-slate-600">{{ company.login }}</td>
              <td class="bg-slate-50 px-4 py-4 text-[14px] text-slate-600">{{ company.subdomain }}</td>
              <td class="bg-slate-50 px-4 py-4"><StatusBadge :status="company.status" /></td>
              <td class="bg-slate-50 px-4 py-4 text-[14px] text-slate-600">{{ company.createdAt }}</td>
              <td class="rounded-r-[22px] bg-slate-50 px-4 py-4">
                <div class="relative">
                  <button class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100" @click="activeMenuId = activeMenuId === company.id ? null : company.id">
                    Actions
                  </button>
                  <div v-if="activeMenuId === company.id" class="absolute right-0 top-12 z-10 min-w-[220px] rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
                    <button class="flex w-full rounded-xl px-3 py-2 text-left text-[14px] text-slate-600 transition hover:bg-slate-50 hover:text-slate-950">View company</button>
                    <button class="flex w-full rounded-xl px-3 py-2 text-left text-[14px] text-slate-600 transition hover:bg-slate-50 hover:text-slate-950" @click="openEdit(company)">Edit company</button>
                    <NuxtLink to="/platform/shops" class="flex w-full rounded-xl px-3 py-2 text-[14px] text-slate-600 transition hover:bg-slate-50 hover:text-slate-950">Manage shops</NuxtLink>
                    <NuxtLink to="/platform/users" class="flex w-full rounded-xl px-3 py-2 text-[14px] text-slate-600 transition hover:bg-slate-50 hover:text-slate-950">Manage users</NuxtLink>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </DataPanel>

    <ModalForm :open="modalOpen" :title="editing ? 'Edit company' : 'Create company'" description="Reusable modal form layout prepared for future API submission." @close="modalOpen = false">
      <form class="grid gap-4 md:grid-cols-2" @submit.prevent="submit">
        <label class="space-y-2 md:col-span-2">
          <span class="text-[13px] font-semibold text-slate-700">Company name</span>
          <input v-model="form.name" type="text" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] outline-none focus:border-sky-300 focus:bg-white" />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Login</span>
          <input v-model="form.login" type="text" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] outline-none focus:border-sky-300 focus:bg-white" />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Subdomain</span>
          <input v-model="form.subdomain" type="text" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] outline-none focus:border-sky-300 focus:bg-white" />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Shops count</span>
          <input v-model.number="form.shopsCount" type="number" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] outline-none focus:border-sky-300 focus:bg-white" />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Users count</span>
          <input v-model.number="form.usersCount" type="number" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] outline-none focus:border-sky-300 focus:bg-white" />
        </label>
        <label class="space-y-2 md:col-span-2">
          <span class="text-[13px] font-semibold text-slate-700">Status</span>
          <select v-model="form.status" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] outline-none focus:border-sky-300 focus:bg-white">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <div class="mt-2 flex justify-end gap-3 md:col-span-2">
          <UButton color="neutral" variant="soft" class="rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200" @click="modalOpen = false">Cancel</UButton>
          <UButton type="submit" color="neutral" class="rounded-2xl bg-slate-950 text-white hover:bg-slate-800">
            {{ editing ? "Save changes" : "Create company" }}
          </UButton>
        </div>
      </form>
    </ModalForm>
  </div>
</template>
