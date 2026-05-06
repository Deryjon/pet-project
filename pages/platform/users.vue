<script setup lang="ts">
import DataPanel from "@/components/platform/DataPanel.vue";
import DataTable from "@/components/platform/DataTable.vue";
import DateBadge from "@/components/platform/DateBadge.vue";
import PageHeader from "@/components/platform/PageHeader.vue";
import StatusBadge from "@/components/platform/StatusBadge.vue";
import { usePlatformAdminApi, type PlatformUser } from "@/composables/usePlatformAdmin";

definePageMeta({ layout: "platform" });
useHead({ title: "Пользователи | Konkurent" });

const api = usePlatformAdminApi();
const users = ref<PlatformUser[]>([]);

onMounted(async () => {
  users.value = await api.getPlatformUsers();
});
</script>

<template>
  <div class="space-y-8">
    <PageHeader eyebrow="Доступ" title="Глобальные пользователи платформы" description="Все пользователи CRM и платформы с ролями и статусами." />

    <DataPanel title="Пользователи">
      <DataTable>
        <thead class="bg-slate-50">
          <tr class="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            <th class="px-4 py-3">Имя</th>
            <th class="px-4 py-3">Телефон</th>
            <th class="px-4 py-3">Email</th>
            <th class="px-4 py-3">Компания</th>
            <th class="px-4 py-3">Роль</th>
            <th class="px-4 py-3">Статус</th>
            <th class="px-4 py-3">Дата создания</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="user in users" :key="user.id" class="text-[14px] text-slate-700">
            <td class="px-4 py-4 font-semibold text-slate-950">{{ user.fullName }}</td>
            <td class="px-4 py-4">{{ user.phone }}</td>
            <td class="px-4 py-4">{{ user.email }}</td>
            <td class="px-4 py-4">{{ user.companyName || "—" }}</td>
            <td class="px-4 py-4">{{ user.role }}</td>
            <td class="px-4 py-4"><StatusBadge :status="user.status" /></td>
            <td class="px-4 py-4"><DateBadge :date="user.createdAt" /></td>
          </tr>
        </tbody>
      </DataTable>
    </DataPanel>
  </div>
</template>
