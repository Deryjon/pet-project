<script setup lang="ts">
import DataPanel from "@/components/platform/DataPanel.vue";
import DataTable from "@/components/platform/DataTable.vue";
import DateBadge from "@/components/platform/DateBadge.vue";
import ModalForm from "@/components/platform/ModalForm.vue";
import PageHeader from "@/components/platform/PageHeader.vue";
import { formatPlatformMoney, usePlatformAdminApi, type PlatformPayment, type PlatformPaymentMethod, type PlatformSubscription } from "@/composables/usePlatformAdmin";

definePageMeta({ layout: "platform" });
useHead({ title: "Оплаты | Konkurent" });

const toast = useToast();
const api = usePlatformAdminApi();
const modalOpen = ref(false);
const payments = ref<PlatformPayment[]>([]);
const subscriptions = ref<PlatformSubscription[]>([]);
const form = reactive({
  subscription_id: "",
  amount: 0,
  method: "cash" as PlatformPaymentMethod,
  paid_at: new Date().toISOString().slice(0, 10),
  comment: "",
});

const subscriptionOptions = computed(() => subscriptions.value.map((item) => ({ label: item.companyName, value: item.id })));
const methodOptions = ["cash", "card", "click", "payme", "bank", "other"];

async function loadPayments() {
  const [paymentsResponse, subscriptionsResponse] = await Promise.all([api.getPayments(), api.getSubscriptions()]);
  payments.value = paymentsResponse;
  subscriptions.value = subscriptionsResponse;
  form.subscription_id ||= subscriptionsResponse[0]?.id || "";
}

async function submitPayment() {
  await api.createPayment(form);
  toast.add({ title: "Оплата добавлена", description: "Подписка продлена на 1 месяц.", color: "success" });
  modalOpen.value = false;
  await loadPayments();
}

onMounted(loadPayments);
</script>

<template>
  <div class="space-y-8">
    <PageHeader eyebrow="Финансы" title="История оплат" description="Все платежи клиентов и ручное продление подписок через оплату.">
      <template #actions>
        <UButton color="neutral" class="rounded-2xl bg-slate-950 text-white" @click="modalOpen = true">
          <Icon name="heroicons:plus" class="mr-2 h-4 w-4" />
          Добавить оплату
        </UButton>
      </template>
    </PageHeader>

    <DataPanel title="Оплаты">
      <DataTable>
        <thead class="bg-slate-50">
          <tr class="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            <th class="px-4 py-3">Компания</th>
            <th class="px-4 py-3">Сумма</th>
            <th class="px-4 py-3">Метод оплаты</th>
            <th class="px-4 py-3">Период</th>
            <th class="px-4 py-3">Дата оплаты</th>
            <th class="px-4 py-3">Кто добавил оплату</th>
            <th class="px-4 py-3">Комментарий</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="payment in payments" :key="payment.id" class="text-[14px] text-slate-700">
            <td class="px-4 py-4 font-semibold text-slate-950">{{ payment.companyName || "—" }}</td>
            <td class="px-4 py-4">{{ formatPlatformMoney(payment.amount) }}</td>
            <td class="px-4 py-4">{{ payment.method }}</td>
            <td class="px-4 py-4">{{ payment.period || "—" }}</td>
            <td class="px-4 py-4"><DateBadge :date="payment.paidAt" /></td>
            <td class="px-4 py-4">{{ payment.createdByName || "—" }}</td>
            <td class="px-4 py-4">{{ payment.comment || "—" }}</td>
          </tr>
        </tbody>
      </DataTable>
    </DataPanel>

    <ModalForm :open="modalOpen" title="Добавить оплату" description="После добавления оплаты подписка компании продлевается на 1 месяц." @close="modalOpen = false">
      <form class="grid gap-4 md:grid-cols-2" @submit.prevent="submitPayment">
        <label class="space-y-2 md:col-span-2">
          <span class="text-[13px] font-semibold text-slate-700">Компания</span>
          <USelect v-model="form.subscription_id" :items="subscriptionOptions" value-key="value" />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Сумма</span>
          <UInput v-model.number="form.amount" type="number" min="0" required />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Метод оплаты</span>
          <USelect v-model="form.method" :items="methodOptions" />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Дата оплаты</span>
          <UInput v-model="form.paid_at" type="date" required />
        </label>
        <label class="space-y-2 md:col-span-2">
          <span class="text-[13px] font-semibold text-slate-700">Комментарий</span>
          <UTextarea v-model="form.comment" />
        </label>
        <div class="flex justify-end gap-3 md:col-span-2">
          <UButton type="button" color="neutral" variant="soft" class="rounded-2xl bg-slate-100 text-slate-700" @click="modalOpen = false">Отмена</UButton>
          <UButton type="submit" color="neutral" class="rounded-2xl bg-slate-950 text-white">Добавить оплату</UButton>
        </div>
      </form>
    </ModalForm>
  </div>
</template>
