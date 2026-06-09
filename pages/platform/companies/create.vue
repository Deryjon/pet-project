<script setup lang="ts">
import DataPanel from "@/components/platform/DataPanel.vue";
import PageHeader from "@/components/platform/PageHeader.vue";
import { usePlatformAdminApi, type PlatformPlan } from "@/composables/usePlatformAdmin";

definePageMeta({ layout: "platform" });
useHead({ title: "Create company | Konkurent" });

const router = useRouter();
const toast = useToast();
const api = usePlatformAdminApi();
const plans = ref<PlatformPlan[]>([]);
const form = reactive({
  companyName: "",
  ownerName: "",
  ownerPhone: "",
  ownerEmail: "",
  ownerPassword: "",
  plan_id: "",
  subscriptionStart: new Date().toISOString().slice(0, 10),
  subscriptionEnd: "",
  status: "active",
});

const planOptions = computed(() => plans.value.map((plan) => ({ label: plan.name, value: plan.id })));
const statusOptions = [
  { label: "???????", value: "active" },
  { label: "?????????????", value: "blocked" },
];

function slug(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || `company-${Date.now()}`;
}

async function submit() {
  const login = slug(form.companyName);
  const payload = {
    login,
    name: form.companyName.trim(),
    subdomain: login,
    owner_name: form.ownerName.trim(),
    owner_phone: form.ownerPhone.trim(),
    owner_email: form.ownerEmail.trim(),
    plan_id: form.plan_id,
  };

  await api.createCompany({
    ...payload,
    ...(form.subscriptionStart ? { subscription_start_date: form.subscriptionStart } : {}),
    ...(form.subscriptionEnd ? { subscription_end_date: form.subscriptionEnd } : {}),
  });
  toast.add({ title: "???????? ???????", color: "success" });
  router.push("/platform/companies");
}

onMounted(async () => {
  plans.value = await api.getPlans();
  form.plan_id = plans.value[0]?.id || "";
});
</script>

<template>
  <div class="space-y-8">
    <PageHeader
      eyebrow="Подключение клиента"
      title="Создать компанию"
      description="Форма ручного подключения клиента к платформе и CRM."
    />

    <DataPanel title="Данные подключения" description="После создания будет создана компания, владелец, подписка на 1 месяц и доступ к CRM.">
      <form class="grid gap-4 md:grid-cols-2" @submit.prevent="submit">
        <label class="space-y-2 md:col-span-2">
          <span class="text-[13px] font-semibold text-slate-700">Название компании</span>
          <UInput v-model="form.companyName" required placeholder="Введите название компании" />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Имя владельца</span>
          <UInput v-model="form.ownerName" required placeholder="Введите имя владельца" />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Телефон владельца</span>
          <UInput v-model="form.ownerPhone" required placeholder="+998 90 000 00 00" />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Email владельца</span>
          <UInput v-model="form.ownerEmail" type="email" required placeholder="owner@company.uz" />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Пароль владельца</span>
          <UInput v-model="form.ownerPassword" type="password" required placeholder="Минимум 8 символов" />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Тариф</span>
          <USelect v-model="form.plan_id" :items="planOptions" value-key="value" />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Статус</span>
          <USelect v-model="form.status" :items="statusOptions" value-key="value" />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Дата начала подписки</span>
          <AppDatePicker v-model="form.subscriptionStart" class="w-full" />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Дата окончания подписки</span>
          <AppDatePicker v-model="form.subscriptionEnd" class="w-full" />
        </label>
        <div class="flex justify-end gap-3 md:col-span-2">
          <UButton type="button" to="/platform/companies" color="neutral" variant="soft" class="rounded-2xl bg-slate-100 text-slate-700">Отмена</UButton>
          <UButton type="submit" color="neutral" class="rounded-2xl bg-slate-950 text-white">Создать компанию</UButton>
        </div>
      </form>
    </DataPanel>
  </div>
</template>
