<script setup lang="ts">
import { computed, ref } from "vue";
import DataPanel from "@/components/platform/DataPanel.vue";
import PageHeader from "@/components/platform/PageHeader.vue";

definePageMeta({ layout: "platform" });
useHead({ title: "Аудит | Konkurent" });

const search = ref("");
const userFilter = ref("all");
const entityFilter = ref("all");

const logs = ref([
  { user: "Администратор", action: "СОЗДАНИЕ", entity: "Компания", date: "2026-05-05 12:43" },
  { user: "Support", action: "UPDATE", entity: "User", date: "2026-05-05 11:20" },
  { user: "Администратор", action: "УДАЛЕНИЕ", entity: "Филиал", date: "2026-05-05 10:02" },
  { user: "Менеджер", action: "ВХОД", entity: "Платформа", date: "2026-05-04 18:10" },
]);

const userOptions = computed(() => [
  { label: "All users", value: "all" },
  ...Array.from(new Set(logs.value.map((log) => log.user))).map((user) => ({ label: user, value: user })),
]);

const entityOptions = computed(() => [
  { label: "All entities", value: "all" },
  ...Array.from(new Set(logs.value.map((log) => log.entity))).map((entity) => ({ label: entity, value: entity })),
]);

const filteredLogs = computed(() =>
  logs.value.filter((log) => {
    const q = search.value.trim().toLowerCase();
    const matchesSearch = !q || `${log.user} ${log.action} ${log.entity} ${log.date}`.toLowerCase().includes(q);
    const matchesUser = userFilter.value === "all" || log.user === userFilter.value;
    const matchesEntity = entityFilter.value === "all" || log.entity === entityFilter.value;
    return matchesSearch && matchesUser && matchesEntity;
  }),
);
</script>

<template>
  <div class="space-y-8">
    <PageHeader eyebrow="Аудит" title="Журнал аудита" description="Временный интерфейс аудита действий внутри платформы с mock-данными." />

    <DataPanel title="События аудита" description="Поиск и фильтрация действий по пользователю и сущности.">
      <template #toolbar>
        <div class="flex flex-1 flex-wrap items-center gap-3">
          <div class="min-w-[240px] flex-1">
            <UInput v-model="search" type="text" placeholder="Поиск по user, action, entity" />
          </div>
          <USelect v-model="userFilter" :items="userOptions" value-key="value" class="min-w-[180px]" />
          <USelect v-model="entityFilter" :items="entityOptions" value-key="value" class="min-w-[180px]" />
        </div>
      </template>

      <div class="overflow-x-auto">
        <table class="min-w-full border-separate border-spacing-y-3">
          <thead>
            <tr class="text-left text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              <th class="px-4 py-2">User</th>
              <th class="px-4 py-2">Действие</th>
              <th class="px-4 py-2">Entity</th>
              <th class="px-4 py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in filteredLogs" :key="`${log.user}-${log.action}-${log.entity}-${log.date}`">
              <td class="rounded-l-[22px] bg-slate-50 px-4 py-4 text-[14px] font-semibold text-slate-950">{{ log.user }}</td>
              <td class="bg-slate-50 px-4 py-4 text-[14px] text-slate-600">{{ log.action }}</td>
              <td class="bg-slate-50 px-4 py-4 text-[14px] text-slate-600">{{ log.entity }}</td>
              <td class="rounded-r-[22px] bg-slate-50 px-4 py-4 text-[14px] text-slate-600">{{ log.date }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </DataPanel>
  </div>
</template>
