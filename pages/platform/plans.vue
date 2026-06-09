<script setup lang="ts">
import ActionMenu from "@/components/platform/ActionMenu.vue";
import DataPanel from "@/components/platform/DataPanel.vue";
import DataTable from "@/components/platform/DataTable.vue";
import ModalForm from "@/components/platform/ModalForm.vue";
import PageHeader from "@/components/platform/PageHeader.vue";
import StatusBadge from "@/components/platform/StatusBadge.vue";
import { usePlatformFormUi } from "@/composables/usePlatformFormUi";
import { formatPlatformMoney, usePlatformAdminApi, type PlatformPlan, type PlatformPlanPayload } from "@/composables/usePlatformAdmin";

definePageMeta({ layout: "platform" });
useHead({ title: "Тарифы | Konkurent" });

const toast = useToast();
const api = usePlatformAdminApi();
const { softInputUi, softSelectUi } = usePlatformFormUi();
const plans = ref<PlatformPlan[]>([]);
const modalOpen = ref(false);
const editing = ref<PlatformPlan | null>(null);
const form = reactive({
  name: "",
  price_monthly: 0,
  max_shops: 1,
  max_users: 5,
  max_products: 1000,
  status: "active" as const,
});

async function loadPlans() {
  plans.value = await api.getPlans();
}

function openCreate() {
  editing.value = null;
  Object.assign(form, { name: "", price_monthly: 0, max_shops: 1, max_users: 5, max_products: 1000, status: "active" });
  modalOpen.value = true;
}

function openEdit(plan: PlatformPlan) {
  editing.value = plan;
  Object.assign(form, {
    name: plan.name,
    price_monthly: plan.priceMonthly,
    max_shops: plan.maxShops,
    max_users: plan.maxUsers,
    max_products: plan.maxProducts,
    status: plan.status,
  });
  modalOpen.value = true;
}

async function savePlan() {
  const payload: PlatformPlanPayload = { ...form };
  if (editing.value) {
    await api.updatePlan(editing.value.id, payload);
    toast.add({ title: "Тариф обновлен", description: form.name, color: "success" });
  } else {
    await api.createPlan(payload);
    toast.add({ title: "Тариф создан", description: form.name, color: "success" });
  }
  modalOpen.value = false;
  await loadPlans();
}

async function disablePlan(plan: PlatformPlan) {
  await api.updatePlan(plan.id, { status: "inactive" });
  toast.add({ title: "Тариф выключен", description: plan.name, color: "success" });
  await loadPlans();
}

onMounted(loadPlans);
</script>

<template>
  <div class="space-y-8">
    <PageHeader eyebrow="Тарифы" title="Управление тарифами" description="Создание, редактирование и выключение тарифов платформы.">
      <template #actions>
        <UButton color="neutral" class="rounded-2xl bg-slate-950 text-white" @click="openCreate">
          <Icon name="heroicons:plus" class="mr-2 h-4 w-4" />
          Создать тариф
        </UButton>
      </template>
    </PageHeader>

    <DataPanel title="Тарифные планы">
      <DataTable>
        <thead class="bg-slate-50">
          <tr class="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            <th class="px-4 py-3">Название тарифа</th>
            <th class="px-4 py-3">Цена за месяц</th>
            <th class="px-4 py-3">Лимит магазинов</th>
            <th class="px-4 py-3">Лимит сотрудников</th>
            <th class="px-4 py-3">Лимит товаров</th>
            <th class="px-4 py-3">Статус</th>
            <th class="px-4 py-3 text-right">Действия</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="plan in plans" :key="plan.id" class="text-[14px] text-slate-700">
            <td class="px-4 py-4 font-semibold text-slate-950">{{ plan.name }}</td>
            <td class="px-4 py-4">{{ formatPlatformMoney(plan.priceMonthly) }}</td>
            <td class="px-4 py-4">{{ plan.maxShops }}</td>
            <td class="px-4 py-4">{{ plan.maxUsers }}</td>
            <td class="px-4 py-4">{{ plan.maxProducts }}</td>
            <td class="px-4 py-4"><StatusBadge :status="plan.status" /></td>
            <td class="px-4 py-4 text-right">
              <ActionMenu
                :items="[
                  { label: 'Редактировать', icon: 'heroicons:pencil-square', onSelect: () => openEdit(plan) },
                  { label: 'Выключить тариф', icon: 'heroicons:power', onSelect: () => disablePlan(plan) },
                ]"
              />
            </td>
          </tr>
        </tbody>
      </DataTable>
    </DataPanel>

    <ModalForm :open="modalOpen" :title="editing ? 'Редактировать тариф' : 'Создать тариф'" description="Задайте цену, лимиты и статус тарифа." @close="modalOpen = false">
      <form class="grid gap-4 md:grid-cols-2" @submit.prevent="savePlan">
        <label class="space-y-2 md:col-span-2">
          <span class="text-[13px] font-semibold text-slate-700">Название тарифа</span>
          <UInput v-model="form.name" required :ui="softInputUi" />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Цена за месяц</span>
          <UInput v-model.number="form.price_monthly" type="number" min="0" required :ui="softInputUi" />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Статус</span>
          <USelect v-model="form.status" :items="['active', 'inactive']" :ui="softSelectUi" />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Лимит магазинов</span>
          <UInput v-model.number="form.max_shops" type="number" min="0" required :ui="softInputUi" />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Лимит сотрудников</span>
          <UInput v-model.number="form.max_users" type="number" min="0" required :ui="softInputUi" />
        </label>
        <label class="space-y-2 md:col-span-2">
          <span class="text-[13px] font-semibold text-slate-700">Лимит товаров</span>
          <UInput v-model.number="form.max_products" type="number" min="0" required :ui="softInputUi" />
        </label>
        <div class="flex justify-end gap-3 md:col-span-2">
          <UButton type="button" color="neutral" variant="soft" class="rounded-2xl bg-slate-100 text-slate-700" @click="modalOpen = false">Отмена</UButton>
          <UButton type="submit" color="neutral" class="rounded-2xl bg-slate-950 text-white">Сохранить</UButton>
        </div>
      </form>
    </ModalForm>
  </div>
</template>