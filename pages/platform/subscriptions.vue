<script setup lang="ts">
import ActionMenu from "@/components/platform/ActionMenu.vue";
import DataPanel from "@/components/platform/DataPanel.vue";
import DataTable from "@/components/platform/DataTable.vue";
import DateBadge from "@/components/platform/DateBadge.vue";
import PageHeader from "@/components/platform/PageHeader.vue";
import StatusBadge from "@/components/platform/StatusBadge.vue";
import { daysLeft, usePlatformAdminApi, type PlatformSubscription } from "@/composables/usePlatformAdmin";

definePageMeta({ layout: "platform" });
useHead({ title: "Подписки | Konkurent" });

const router = useRouter();
const toast = useToast();
const api = usePlatformAdminApi();
const subscriptions = ref<PlatformSubscription[]>([]);
const renewingSubscriptionId = ref("");

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
  </div>
</template>
