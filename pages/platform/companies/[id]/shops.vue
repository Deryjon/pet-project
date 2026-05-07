<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import CompanyTabs from "@/components/platform/company/CompanyTabs.vue";
import DataPanel from "@/components/platform/DataPanel.vue";
import EmptyState from "@/components/platform/EmptyState.vue";
import ModalForm from "@/components/platform/ModalForm.vue";
import PageHeader from "@/components/platform/PageHeader.vue";
import StatusBadge from "@/components/platform/StatusBadge.vue";
import type { PlatformShop } from "@/composables/usePlatformAdmin";
import { usePlatformCompanies } from "@/composables/usePlatformCompanies";
import { usePlatformFormUi } from "@/composables/usePlatformFormUi";

definePageMeta({ layout: "platform" });
useHead({ title: "Филиалы компании | Konkurent" });

const route = useRoute();
const companyId = computed(() => String(route.params.id || "").trim());
const { getCompany, getCompanyShops, createShop, updateShop, deleteShop } = usePlatformCompanies();
const { softInputUi, softSelectUi } = usePlatformFormUi();
const toast = useToast();

const loading = ref(true);
const saving = ref(false);
const deletingId = ref("");
const errorMessage = ref("");
const successMessage = ref("");
const company = ref<any | null>(null);
const shops = ref<PlatformShop[]>([]);
const modalOpen = ref(false);
const editing = ref<PlatformShop | null>(null);

const form = reactive({
  name: "",
  branchCode: "",
  status: "active" as "active" | "inactive",
});

const shopStatusOptions = [
  { label: "Активен", value: "active" },
  { label: "Отключен", value: "inactive" },
];

function resolveError(error: any, fallback: string) {
  const message = error?.data?.message ?? error?.response?._data?.message;
  return Array.isArray(message) ? message.join(", ") : message || error?.message || fallback;
}

async function loadData() {
  loading.value = true;
  errorMessage.value = "";
  try {
    company.value = await getCompany(companyId.value);
    shops.value = await getCompanyShops(companyId.value, company.value);
  } catch (error: any) {
    shops.value = [];
    errorMessage.value = resolveError(error, "Не удалось загрузить филиалы компании");
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editing.value = null;
  form.name = "";
  form.branchCode = "";
  form.status = "active";
  modalOpen.value = true;
}

function openEdit(shop: PlatformShop) {
  editing.value = shop;
  form.name = shop.name;
  form.branchCode = shop.branchCode;
  form.status = shop.status === "active" ? "active" : "inactive";
  modalOpen.value = true;
}

async function submit() {
  saving.value = true;
  errorMessage.value = "";
  successMessage.value = "";
  try {
    if (editing.value?.id) {
      await updateShop(companyId.value, editing.value.id, {
        name: form.name.trim(),
        branch_code: form.branchCode.trim(),
        is_active: form.status === "active",
      });
      successMessage.value = "Филиал обновлен";
      toast.add({ title: "Филиал обновлен", color: "success" });
    } else {
      await createShop(companyId.value, {
        name: form.name.trim(),
        branch_code: form.branchCode.trim(),
      });
      successMessage.value = "Филиал создан";
      toast.add({ title: "Филиал создан", color: "success" });
    }
    modalOpen.value = false;
    await loadData();
  } catch (error: any) {
    errorMessage.value = resolveError(error, "Не удалось сохранить филиал");
    toast.add({ title: "Не удалось сохранить филиал", description: errorMessage.value, color: "error" });
  } finally {
    saving.value = false;
  }
}

async function removeShop(shop: PlatformShop) {
  if (typeof window !== "undefined" && !window.confirm(`Удалить филиал "${shop.name}"?`)) {
    return;
  }
  deletingId.value = shop.id;
  try {
    await deleteShop(companyId.value, shop.id);
    successMessage.value = "Филиал удален";
    await loadData();
  } catch (error: any) {
    errorMessage.value = resolveError(error, "Не удалось удалить филиал");
    toast.add({ title: "Не удалось удалить филиал", description: errorMessage.value, color: "error" });
  } finally {
    deletingId.value = "";
  }
}

watch(companyId, () => {
  if (!companyId.value) return;
  loadData();
}, { immediate: true });
</script>

<template>
  <div class="space-y-8">
    <PageHeader eyebrow="Филиалы" :title="company?.name ? `Филиалы: ${company.name}` : 'Филиалы компании'" description="Создание, редактирование и контроль филиалов выбранной компании." />
    <CompanyTabs :company-id="companyId" />
    <div v-if="errorMessage" class="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-[14px] text-rose-600">{{ errorMessage }}</div>
    <div v-if="successMessage" class="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-[14px] text-emerald-700">{{ successMessage }}</div>
    <DataPanel title="Филиалы" description="Список филиалов компании и управление их статусом.">
      <template #toolbar>
        <UButton color="neutral" class="cursor-pointer rounded-2xl bg-slate-950 text-white hover:bg-slate-800" @click="openCreate"><Icon name="heroicons:plus" class="mr-2 h-4 w-4" />Создать филиал</UButton>
      </template>
      <div v-if="loading" class="space-y-3"><div v-for="item in 5" :key="item" class="h-24 animate-pulse rounded-[24px] bg-slate-100" /></div>
      <EmptyState v-else-if="!shops.length" title="Филиалы не найдены" description="Создайте первый филиал для этой компании." icon="heroicons:map-pin" />
      <div v-else class="grid gap-4 lg:grid-cols-2">
        <article v-for="shop in shops" :key="shop.id" class="rounded-[28px] border border-slate-100 bg-slate-50/70 p-5 transition hover:bg-white hover:shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
          <div class="flex items-start justify-between gap-4"><div><p class="text-[18px] font-semibold text-slate-950">{{ shop.name }}</p><p class="mt-2 text-[14px] text-slate-500">{{ shop.branchCode || "Код не указан" }}</p></div><StatusBadge :status="shop.status" /></div>
          <div class="mt-5 grid gap-3 sm:grid-cols-2"><div class="rounded-2xl bg-white px-4 py-3"><p class="text-[12px] font-medium text-slate-400">ID</p><p class="mt-2 text-[14px] font-semibold text-slate-900">{{ shop.shopId || shop.id || "—" }}</p></div><div class="rounded-2xl bg-white px-4 py-3"><p class="text-[12px] font-medium text-slate-400">Создан</p><p class="mt-2 text-[14px] font-semibold text-slate-900">{{ shop.createdAt || "—" }}</p></div></div>
          <div class="mt-5 flex items-center justify-end gap-3"><UButton color="neutral" variant="soft" class="rounded-2xl bg-white text-slate-700 hover:bg-slate-100" @click="openEdit(shop)">Редактировать</UButton><UButton color="error" variant="soft" class="rounded-2xl" :loading="deletingId === shop.id" @click="removeShop(shop)">Удалить</UButton></div>
        </article>
      </div>
    </DataPanel>
    <ModalForm :open="modalOpen" :title="editing ? 'Редактировать филиал' : 'Создать филиал'" description="Заполните основные данные филиала." @close="modalOpen = false">
      <form class="grid gap-4 md:grid-cols-2" @submit.prevent="submit">
        <label class="space-y-2 md:col-span-2"><span class="text-[13px] font-semibold text-slate-700">Название филиала</span><UInput v-model="form.name" type="text" required placeholder="Введите название филиала" :ui="softInputUi" /></label>
        <label class="space-y-2"><span class="text-[13px] font-semibold text-slate-700">Код филиала</span><UInput v-model="form.branchCode" type="text" required placeholder="Введите код филиала" :ui="softInputUi" /></label>
        <label v-if="editing" class="space-y-2"><span class="text-[13px] font-semibold text-slate-700">Статус</span><USelect v-model="form.status" :items="shopStatusOptions" value-key="value" :ui="softSelectUi" /></label>
        <div class="mt-2 flex justify-end gap-3 md:col-span-2"><UButton type="button" color="neutral" variant="soft" class="rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200" @click="modalOpen = false">Отмена</UButton><UButton type="submit" color="neutral" class="rounded-2xl bg-slate-950 text-white hover:bg-slate-800" :loading="saving">{{ editing ? "Сохранить" : "Создать" }}</UButton></div>
      </form>
    </ModalForm>
  </div>
</template>
