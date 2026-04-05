<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import DataPanel from "@/components/platform/DataPanel.vue";
import EmptyState from "@/components/platform/EmptyState.vue";
import ModalForm from "@/components/platform/ModalForm.vue";
import PageHeader from "@/components/platform/PageHeader.vue";
import StatusBadge from "@/components/platform/StatusBadge.vue";
import type { PlatformShop } from "@/composables/usePlatformAdmin";
import { usePlatformAdminMock } from "@/composables/usePlatformAdmin";

definePageMeta({ layout: "platform" });
useHead({ title: "Shops | Konkurent Platform" });

const { shops, companyOptions, upsertShop } = usePlatformAdminMock();

const search = ref("");
const companyId = ref("all");
const modalOpen = ref(false);
const editing = ref<PlatformShop | null>(null);

const form = reactive({
  name: "",
  companyId: "",
  branchCode: "",
  city: "",
  status: "active" as "active" | "inactive",
});

const filteredShops = computed(() =>
  shops.value.filter((shop) => {
    const q = search.value.trim().toLowerCase();
    const matchesSearch = !q || `${shop.name} ${shop.companyName} ${shop.branchCode} ${shop.city}`.toLowerCase().includes(q);
    const matchesCompany = companyId.value === "all" || shop.companyId === companyId.value;
    return matchesSearch && matchesCompany;
  }),
);

function openCreate() {
  editing.value = null;
  form.name = "";
  form.companyId = companyOptions.value[0]?.value ?? "";
  form.branchCode = "";
  form.city = "";
  form.status = "active";
  modalOpen.value = true;
}

function openEdit(shop: PlatformShop) {
  editing.value = shop;
  form.name = shop.name;
  form.companyId = shop.companyId;
  form.branchCode = shop.branchCode;
  form.city = shop.city;
  form.status = shop.status;
  modalOpen.value = true;
}

function submit() {
  upsertShop({
    id: editing.value?.id,
    name: form.name,
    companyId: form.companyId,
    branchCode: form.branchCode,
    city: form.city,
    status: form.status,
  });
  modalOpen.value = false;
}
</script>

<template>
  <div class="space-y-8">
    <PageHeader eyebrow="Location Management" title="Shops / Locations" description="Structured branch workspace with filters by company and location state.">
      <template #actions>
        <UButton color="neutral" class="rounded-2xl bg-slate-950 text-white hover:bg-slate-800" @click="openCreate">
          <Icon name="heroicons:plus" class="mr-2 h-4 w-4" />
          Create shop
        </UButton>
      </template>
    </PageHeader>

    <DataPanel title="Location directory" description="Prepared for API-backed listing, filters and management workflows.">
      <template #toolbar>
        <div class="flex flex-1 flex-wrap items-center gap-3">
          <div class="min-w-[240px] flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <input v-model="search" type="text" placeholder="Search shop, company, branch code or city" class="w-full bg-transparent text-[14px] text-slate-700 outline-none placeholder:text-slate-400" />
          </div>
          <select v-model="companyId" class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] text-slate-700 outline-none">
            <option value="all">All companies</option>
            <option v-for="option in companyOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </div>
      </template>

      <EmptyState v-if="!filteredShops.length" title="No shops found" description="Try a different company filter or search query." icon="heroicons:map-pin" />

      <div v-else class="grid gap-4 lg:grid-cols-2">
        <article v-for="shop in filteredShops" :key="shop.id" class="rounded-[28px] border border-slate-100 bg-slate-50/70 p-5 transition hover:bg-white hover:shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-[18px] font-semibold text-slate-950">{{ shop.name }}</p>
              <p class="mt-2 text-[14px] text-slate-500">{{ shop.companyName }} · {{ shop.city }}</p>
            </div>
            <StatusBadge :status="shop.status" />
          </div>

          <div class="mt-5 grid gap-3 sm:grid-cols-2">
            <div class="rounded-2xl bg-white px-4 py-3">
              <p class="text-[12px] font-medium text-slate-400">Branch code</p>
              <p class="mt-2 text-[14px] font-semibold text-slate-900">{{ shop.branchCode }}</p>
            </div>
            <div class="rounded-2xl bg-white px-4 py-3">
              <p class="text-[12px] font-medium text-slate-400">Created at</p>
              <p class="mt-2 text-[14px] font-semibold text-slate-900">{{ shop.createdAt }}</p>
            </div>
          </div>

          <div class="mt-5 flex items-center justify-end gap-3">
            <UButton color="neutral" variant="soft" class="rounded-2xl bg-white text-slate-700 hover:bg-slate-100" @click="openEdit(shop)">Edit</UButton>
            <UButton color="neutral" class="rounded-2xl bg-slate-950 text-white hover:bg-slate-800">View details</UButton>
          </div>
        </article>
      </div>
    </DataPanel>

    <ModalForm :open="modalOpen" :title="editing ? 'Edit shop' : 'Create shop'" description="Reusable location form with production-style spacing and validation-ready fields." @close="modalOpen = false">
      <form class="grid gap-4 md:grid-cols-2" @submit.prevent="submit">
        <label class="space-y-2 md:col-span-2">
          <span class="text-[13px] font-semibold text-slate-700">Shop name</span>
          <input v-model="form.name" type="text" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] outline-none focus:border-sky-300 focus:bg-white" />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Company</span>
          <select v-model="form.companyId" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] outline-none focus:border-sky-300 focus:bg-white">
            <option v-for="option in companyOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Branch code</span>
          <input v-model="form.branchCode" type="text" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] outline-none focus:border-sky-300 focus:bg-white" />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">City</span>
          <input v-model="form.city" type="text" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] outline-none focus:border-sky-300 focus:bg-white" />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Status</span>
          <select v-model="form.status" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] outline-none focus:border-sky-300 focus:bg-white">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <div class="mt-2 flex justify-end gap-3 md:col-span-2">
          <UButton color="neutral" variant="soft" class="rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200" @click="modalOpen = false">Cancel</UButton>
          <UButton type="submit" color="neutral" class="rounded-2xl bg-slate-950 text-white hover:bg-slate-800">
            {{ editing ? "Save changes" : "Create shop" }}
          </UButton>
        </div>
      </form>
    </ModalForm>
  </div>
</template>
