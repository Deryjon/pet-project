<script setup lang="ts">
import ActionMenu from "@/components/platform/ActionMenu.vue";
import DataPanel from "@/components/platform/DataPanel.vue";
import DataTable from "@/components/platform/DataTable.vue";
import DateBadge from "@/components/platform/DateBadge.vue";
import ModalForm from "@/components/platform/ModalForm.vue";
import PageHeader from "@/components/platform/PageHeader.vue";
import StatusBadge from "@/components/platform/StatusBadge.vue";
import { usePlatformFormUi } from "@/composables/usePlatformFormUi";
import { daysLeft, usePlatformAdminApi, type PlatformPlan, type PlatformSubscription } from "@/composables/usePlatformAdmin";

definePageMeta({ layout: "platform" });
useHead({ title: "Подписки | Konkurent" });

const router = useRouter();
const toast = useToast();
const api = usePlatformAdminApi();
const { softSelectUi } = usePlatformFormUi();

const subscriptions = ref<PlatformSubscription[]>([]);
const renewingSubscriptionId = ref("");

const changePlanModalOpen = ref(false);
const changePlanTarget = ref<PlatformSubscription | null>(null);
const changePlanSelectedId = ref("");
const changePlanLoading = ref(false);
const availablePlans = ref<PlatformPlan[]>([]);

async function loadSubscriptions() {
  subscriptions.value = await api.getSubscriptions();
}

async function renew(subscription: PlatformSubscription) {
  if (!subscription.id) {
    toast.add({ title: "Не удалось продлить подписку", description: "Не найден ID подписки.", color: "error" });
    return;
  }

  renewingSubscriptionId.value = subscription.id;
  try {
    await api.createPayment({
      subscription_id: subscription.id,
      amount: subscription.plan?.priceMonthly ?? 0,
      method: "cash",
      comment: "Продление подписки на 1 месяц",
    });
    toast.add({ title: "Подписка продлена на 1 месяц", description: subscription.companyName, color: "success" });
    await loadSubscriptions();
  } catch (error: any) {
    const message = error?.data?.message ?? error?.response?._data?.message ?? error?.message ?? "Запрос на продление не выполнен";
    toast.add({ title: "Не удалось продлить подписку", description: Array.isArray(message) ? message.join(", ") : message, color: "error" });
  } finally {
    renewingSubscriptionId.value = "";
  }
}

async function block(subscription: PlatformSubscription) {
  await api.blockCompany(subscription.companyId);
  toast.add({ title: "Компания заблокирована", description: subscription.companyName, color: "success" });
  await loadSubscriptions();
}

async function openChangePlan(subscription: PlatformSubscription) {
  changePlanTarget.value = subscription;
  changePlanSelectedId.value = subscription.planId ?? "";
  changePlanModalOpen.value = true;
  if (availablePlans.value.length === 0) {
    availablePlans.value = await api.getPlans();
  }
}

async function confirmChangePlan() {
  if (!changePlanTarget.value?.id || !changePlanSelectedId.value) return;

  changePlanLoading.value = true;
  try {
    await api.changePlan(changePlanTarget.value.id, changePlanSelectedId.value);
    toast.add({ title: "Тариф изменён", description: changePlanTarget.value.companyName, color: "success" });
    changePlanModalOpen.value = false;
    await loadSubscriptions();
  } catch (error: any) {
    const message = error?.data?.message ?? error?.message ?? "Не удалось сменить тариф";
    toast.add({ title: "Ошибка", description: Array.isArray(message) ? message.join(", ") : message, color: "error" });
  } finally {
    changePlanLoading.value = false;
  }
}

const planOptions = computed(() =>
  availablePlans.value.map((p) => ({ label: `${p.name} — ${p.priceMonthly} ₽/мес`, value: p.id }))
);

onMounted(loadSubscriptions);
</script>

<template>
  <div class="space-y-8">
    <PageHeader eyebrow="Подписки" title="Все подписки" description="Контроль активных, просроченных и отмененных подписок компаний." />

    <DataPanel title="Подписки компаний">
      <DataTable>
        <thead class="bg-slate-50">
          <tr class="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            <th class="px-4 py-3">Компания</th>
            <th class="px-4 py-3">Тариф</th>
            <th class="px-4 py-3">Статус подписки</th>
            <th class="px-4 py-3">Дата начала</th>
            <th class="px-4 py-3">Дата окончания</th>
            <th class="px-4 py-3">Осталось дней</th>
            <th class="px-4 py-3">Статус компании</th>
            <th class="px-4 py-3 text-right">Действия</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="subscription in subscriptions" :key="subscription.id" class="text-[14px] text-slate-700">
            <td class="px-4 py-4 font-semibold text-slate-950">{{ subscription.companyName }}</td>
            <td class="px-4 py-4">{{ subscription.planName }}</td>
            <td class="px-4 py-4"><StatusBadge :status="subscription.status" /></td>
            <td class="px-4 py-4"><DateBadge :date="subscription.startDate" /></td>
            <td class="px-4 py-4"><DateBadge :date="subscription.endDate" /></td>
            <td class="px-4 py-4">{{ daysLeft(subscription.endDate) }}</td>
            <td class="px-4 py-4"><StatusBadge :status="subscription.companyStatus" /></td>
            <td class="px-4 py-4 text-right">
              <div class="flex items-center justify-end gap-2">
                <UButton
                  color="neutral"
                  variant="soft"
                  size="sm"
                  class="rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  :loading="Boolean(subscription.id) && renewingSubscriptionId === subscription.id"
                  :disabled="!subscription.id"
                  @click.stop="renew(subscription)"
                >
                  <Icon name="heroicons:calendar-days" class="mr-1.5 h-4 w-4" />
                  Продлить
                </UButton>
              <ActionMenu
                :items="[
                  { label: 'Сменить тариф', icon: 'heroicons:arrow-path-rounded-square', onSelect: () => openChangePlan(subscription) },
                  { label: 'Заблокировать компанию', icon: 'heroicons:lock-closed', onSelect: () => block(subscription) },
                  { label: 'Открыть компанию', icon: 'heroicons:arrow-top-right-on-square', onSelect: () => router.push(`/platform/companies/${subscription.companyId}`) },
                ]"
              />
              </div>
            </td>
          </tr>
        </tbody>
      </DataTable>
    </DataPanel>

    <ModalForm
      :open="changePlanModalOpen"
      title="Сменить тариф"
      :description="changePlanTarget ? `Компания: ${changePlanTarget.companyName}` : ''"
      @close="changePlanModalOpen = false"
    >
      <div class="space-y-5 pb-2">
        <div class="space-y-2">
          <label class="text-[13px] font-semibold text-slate-600">Новый тариф</label>
          <USelect
            v-model="changePlanSelectedId"
            :items="planOptions"
            value-key="value"
            placeholder="Выберите тариф"
            :ui="softSelectUi"
          />
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <UButton
            color="neutral"
            variant="soft"
            class="rounded-2xl"
            @click="changePlanModalOpen = false"
          >
            Отмена
          </UButton>
          <UButton
            color="neutral"
            class="rounded-2xl bg-slate-950 text-white"
            :loading="changePlanLoading"
            :disabled="!changePlanSelectedId"
            @click="confirmChangePlan"
          >
            Применить
          </UButton>
        </div>
      </div>
    </ModalForm>
  </div>
</template>
