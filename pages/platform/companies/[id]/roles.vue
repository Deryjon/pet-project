<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import CompanyTabs from "@/components/platform/company/CompanyTabs.vue";
import DataPanel from "@/components/platform/DataPanel.vue";
import EmptyState from "@/components/platform/EmptyState.vue";
import ModalForm from "@/components/platform/ModalForm.vue";
import PageHeader from "@/components/platform/PageHeader.vue";
import type { PermissionItem, PermissionSection } from "@/composables/useRolePermissions";
import { usePlatformCompanies } from "@/composables/usePlatformCompanies";
import { usePlatformFormUi } from "@/composables/usePlatformFormUi";
import { usePlatformRoles } from "@/composables/usePlatformRoles";
import { usePlatformUsers } from "@/composables/usePlatformUsers";

definePageMeta({ layout: "platform" });
useHead({ title: "Роли компании | Konkurent" });

const route = useRoute();
const companyId = computed(() => String(route.params.id || "").trim());
const { getCompany } = usePlatformCompanies();
const { getCompanyUsers } = usePlatformUsers();
const {
  getCompanyRoles,
  createRole,
  updateRoleMeta,
  deleteRole,
  getRolePermissions,
  updateRolePermissions,
  collectActivePermissionIds,
} = usePlatformRoles();
const { softInputUi } = usePlatformFormUi();
const toast = useToast();

const loading = ref(true);
const permissionsLoading = ref(false);
const saving = ref(false);
const savingPermissions = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const company = ref<any | null>(null);
const roles = ref<any[]>([]);
const users = ref<any[]>([]);
const selectedRoleId = ref("");
const sections = ref<PermissionSection[]>([]);
const modalOpen = ref(false);
const editingRoleId = ref("");

const roleForm = reactive({
  name: "",
  description: "",
  isAdmin: false,
});

const selectedRole = computed(() => roles.value.find((role) => role.id === selectedRoleId.value) || null);

const enrichedRoles = computed(() =>
  roles.value.map((role) => ({
    ...role,
    usersCount: users.value.filter((user) => user.crmRoleId === role.id || user.roleId === role.id).length,
  })),
);

function resolveError(error: any, fallback: string) {
  const message = error?.data?.message ?? error?.response?._data?.message;
  return Array.isArray(message) ? message.join(", ") : message || error?.message || fallback;
}

function cloneSections(input: PermissionSection[]) {
  return JSON.parse(JSON.stringify(input || []));
}

function visiblePermissions(permissions: PermissionItem[]) {
  return permissions.filter((permission) => !permission.hide_from_ui);
}

function visibleChildren(permission: PermissionItem) {
  return (permission.children || []).filter((child) => !child.hide_from_ui);
}

function areAllChildrenActive(permission: PermissionItem) {
  const children = visibleChildren(permission);
  return children.length > 0 && children.every((child) => child.is_active);
}

function areSomeChildrenActive(permission: PermissionItem) {
  const children = visibleChildren(permission);
  return children.some((child) => child.is_active);
}

function isParentChecked(permission: PermissionItem) {
  const children = visibleChildren(permission);
  return children.length ? areAllChildrenActive(permission) : permission.is_active;
}

function isParentIndeterminate(permission: PermissionItem) {
  const children = visibleChildren(permission);
  return children.length ? areSomeChildrenActive(permission) && !areAllChildrenActive(permission) : false;
}

function togglePermission(sectionId: string, permissionId: string, next: boolean) {
  const section = sections.value.find((item) => item.id === sectionId);
  const permission = section?.permissions.find((item) => item.id === permissionId);
  if (!permission) return;

  permission.is_active = next;
  permission.children = permission.children.map((child) => ({ ...child, is_active: next }));
}

function toggleChild(sectionId: string, permissionId: string, childId: string, next: boolean) {
  const section = sections.value.find((item) => item.id === sectionId);
  const permission = section?.permissions.find((item) => item.id === permissionId);
  const child = permission?.children.find((item) => item.id === childId);
  if (!permission || !child) return;

  child.is_active = next;
  permission.is_active = permission.children.length ? permission.children.every((item) => item.is_active) : next;
}

async function loadRolesPage() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const [companyResponse, rolesResponse, usersResponse] = await Promise.all([
      getCompany(companyId.value),
      getCompanyRoles(companyId.value),
      getCompanyUsers(companyId.value),
    ]);

    company.value = companyResponse;
    roles.value = rolesResponse;
    users.value = usersResponse;

    if (!selectedRoleId.value && rolesResponse[0]?.id) {
      selectedRoleId.value = rolesResponse[0].id;
    }
  } catch (error: any) {
    errorMessage.value = resolveError(error, "Не удалось загрузить роли компании");
  } finally {
    loading.value = false;
  }
}

async function loadSelectedRolePermissions() {
  if (!selectedRoleId.value) {
    sections.value = [];
    return;
  }

  permissionsLoading.value = true;

  try {
    const response = await getRolePermissions(selectedRoleId.value, { companyId: companyId.value });
    sections.value = cloneSections(response.sections);
  } catch (error: any) {
    sections.value = [];
    errorMessage.value = resolveError(error, "Не удалось загрузить permissions роли");
  } finally {
    permissionsLoading.value = false;
  }
}

function openCreateRole() {
  editingRoleId.value = "";
  roleForm.name = "";
  roleForm.description = "";
  roleForm.isAdmin = false;
  modalOpen.value = true;
}

function openEditRole(role: any) {
  editingRoleId.value = role.id;
  roleForm.name = role.name || "";
  roleForm.description = role.description || "";
  roleForm.isAdmin = Boolean(role.isAdmin);
  modalOpen.value = true;
}

async function submitRole() {
  saving.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    if (editingRoleId.value) {
      await updateRoleMeta({
        id: editingRoleId.value,
        name: roleForm.name.trim(),
        description: roleForm.description.trim(),
        is_admin: roleForm.isAdmin,
        company_id: companyId.value,
      });
      successMessage.value = "Роль обновлена";
    } else {
      const newRoleId = await createRole({
        name: roleForm.name.trim(),
        description: roleForm.description.trim(),
        is_admin: roleForm.isAdmin,
        company_id: companyId.value,
      });
      selectedRoleId.value = newRoleId;
      successMessage.value = "Роль создана";
    }

    modalOpen.value = false;
    await loadRolesPage();
    await loadSelectedRolePermissions();
    toast.add({ title: successMessage.value, color: "success" });
  } catch (error: any) {
    errorMessage.value = resolveError(error, editingRoleId.value ? "Не удалось обновить роль" : "Не удалось создать роль");
    toast.add({ title: "Ошибка роли", description: errorMessage.value, color: "error" });
  } finally {
    saving.value = false;
  }
}

async function removeRole(role: any) {
  if (typeof window !== "undefined" && !window.confirm(`Удалить роль "${role.name || role.id}"?`)) {
    return;
  }

  saving.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    await deleteRole(role.id, { companyId: companyId.value });
    if (selectedRoleId.value === role.id) {
      selectedRoleId.value = "";
      sections.value = [];
    }
    await loadRolesPage();
    successMessage.value = "Роль удалена";
    toast.add({ title: "Роль удалена", color: "success" });
  } catch (error: any) {
    errorMessage.value = resolveError(error, "Не удалось удалить роль");
    toast.add({ title: "Не удалось удалить роль", description: errorMessage.value, color: "error" });
  } finally {
    saving.value = false;
  }
}

async function savePermissions() {
  if (!selectedRoleId.value) return;

  savingPermissions.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    await updateRolePermissions(
      selectedRoleId.value,
      { permission_ids: collectActivePermissionIds(sections.value) },
      { companyId: companyId.value },
    );
    successMessage.value = "Permissions сохранены";
    toast.add({ title: "Permissions сохранены", color: "success" });
  } catch (error: any) {
    errorMessage.value = resolveError(error, "Не удалось сохранить permissions");
    toast.add({ title: "Не удалось сохранить permissions", description: errorMessage.value, color: "error" });
  } finally {
    savingPermissions.value = false;
  }
}

watch(companyId, () => {
  if (!companyId.value) return;
  loadRolesPage();
}, { immediate: true });

watch(selectedRoleId, () => {
  loadSelectedRolePermissions();
});
</script>

<template>
  <div class="space-y-8">
    <PageHeader eyebrow="Роли" :title="company?.name ? `Роли: ${company.name}` : 'Роли'" description="Управление ролями компании и визуальный редактор прав доступа." />
    <CompanyTabs :company-id="companyId" />

    <div v-if="errorMessage" class="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-[14px] text-rose-600">{{ errorMessage }}</div>
    <div v-if="successMessage" class="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-[14px] text-emerald-700">{{ successMessage }}</div>

    <div class="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <DataPanel title="Роли" description="Список ролей компании, их админ-флаг и количество пользователей.">
        <template #toolbar>
          <UButton color="neutral" class="cursor-pointer rounded-2xl bg-slate-950 text-white hover:bg-slate-800" @click="openCreateRole">
            <Icon name="heroicons:plus" class="mr-2 h-4 w-4" />
            Новая роль
          </UButton>
        </template>

        <div v-if="loading" class="space-y-3">
          <div v-for="item in 4" :key="item" class="h-28 animate-pulse rounded-[24px] bg-slate-100/80" />
        </div>

        <EmptyState v-else-if="!enrichedRoles.length" title="Роли не найдены" description="Создайте первую роль компании." icon="heroicons:shield-check" />

        <div v-else class="space-y-3">
          <article
            v-for="role in enrichedRoles"
            :key="role.id"
            class="rounded-[24px] border p-5 transition"
            :class="selectedRoleId === role.id ? 'border-teal-200 bg-teal-50/70 shadow-[0_18px_40px_rgba(13,148,136,0.1)]' : 'border-slate-200/70 bg-white/88 shadow-[0_16px_34px_rgba(15,23,42,0.05)]'"
          >
            <div class="flex items-start justify-between gap-4">
              <button class="min-w-0 text-left" @click="selectedRoleId = role.id">
                <p class="truncate text-[17px] font-semibold text-slate-950">{{ role.name || role.id }}</p>
                <p class="mt-1 text-[13px] text-slate-500">{{ role.description || "Описание не указано" }}</p>
              </button>
              <span class="rounded-full px-3 py-1 text-[12px] font-semibold" :class="role.isAdmin ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700'">
                {{ role.isAdmin ? "Администратор" : "Стандартная" }}
              </span>
            </div>

            <div class="mt-4 flex items-center justify-between gap-3 text-[13px] text-slate-500">
              <span>Пользователи: {{ role.usersCount }}</span>
              <span>ID: {{ role.id }}</span>
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
              <UButton color="neutral" variant="soft" class="rounded-2xl bg-white text-slate-700 hover:bg-slate-100" @click="openEditRole(role)">Изменить</UButton>
              <UButton color="error" variant="soft" class="rounded-2xl" @click="removeRole(role)">Удалить</UButton>
            </div>
          </article>
        </div>
      </DataPanel>

      <DataPanel title="Permissions" description="Чекбоксы обновляются динамически и поддерживают новые модули из API.">
        <div v-if="!selectedRole" class="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/80 px-5 py-10 text-center text-[14px] text-slate-500">
          Выберите роль слева, чтобы настроить permissions.
        </div>

        <div v-else-if="permissionsLoading" class="space-y-3">
          <div v-for="item in 4" :key="item" class="h-28 animate-pulse rounded-[24px] bg-slate-100/80" />
        </div>

        <div v-else class="space-y-4">
          <div class="rounded-[24px] border border-slate-200 bg-slate-50/80 px-5 py-4 text-[14px] text-slate-600">
            Роль: <span class="font-semibold text-slate-950">{{ selectedRole.name || selectedRole.id }}</span>
          </div>

          <article v-for="section in sections" :key="section.id" class="rounded-[24px] border border-slate-200/70 bg-white/90 p-5 shadow-[0_16px_34px_rgba(15,23,42,0.05)]">
            <div class="mb-4 flex items-center justify-between gap-3">
              <p class="text-[16px] font-semibold text-slate-950">{{ section.key || section.id }}</p>
              <span class="text-[12px] text-slate-400">#{{ section.sequence_number }}</span>
            </div>

            <div class="space-y-3">
              <div v-for="permission in visiblePermissions(section.permissions)" :key="permission.id" class="rounded-[20px] border border-slate-100 bg-slate-50/80 p-4">
                <label class="flex items-start gap-3">
                  <input
                    :checked="isParentChecked(permission)"
                    :indeterminate.prop="isParentIndeterminate(permission)"
                    type="checkbox"
                    class="mt-1 h-4 w-4 accent-teal-600"
                    @change="togglePermission(section.id, permission.id, ($event.target as HTMLInputElement).checked)"
                  />
                  <span class="min-w-0">
                    <span class="block text-[14px] font-semibold text-slate-950">{{ permission.name || permission.slug || permission.id }}</span>
                    <span v-if="permission.description" class="mt-1 block text-[12px] text-slate-500">{{ permission.description }}</span>
                  </span>
                </label>

                <div v-if="visibleChildren(permission).length" class="mt-4 grid gap-2 pl-7 sm:grid-cols-2">
                  <label v-for="child in visibleChildren(permission)" :key="child.id" class="flex items-start gap-3 rounded-2xl bg-white px-3 py-3 ring-1 ring-slate-200">
                    <input
                      :checked="child.is_active"
                      type="checkbox"
                      class="mt-1 h-4 w-4 accent-teal-600"
                      @change="toggleChild(section.id, permission.id, child.id, ($event.target as HTMLInputElement).checked)"
                    />
                    <span class="min-w-0">
                      <span class="block text-[13px] font-medium text-slate-900">{{ child.name || child.slug || child.id }}</span>
                      <span v-if="child.description" class="mt-1 block text-[12px] text-slate-500">{{ child.description }}</span>
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </article>

          <div class="flex justify-end">
            <UButton color="neutral" class="cursor-pointer rounded-2xl bg-slate-950 text-white hover:bg-slate-800" :loading="savingPermissions" @click="savePermissions">Сохранить permissions</UButton>
          </div>
        </div>
      </DataPanel>
    </div>

    <ModalForm :open="modalOpen" :title="editingRoleId ? 'Редактировать роль' : 'Создать роль'" description="Название, описание и admin-флаг роли компании." @close="modalOpen = false">
      <form class="grid gap-4" @submit.prevent="submitRole">
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Название</span>
          <UInput v-model="roleForm.name" type="text" required placeholder="Менеджер" :ui="softInputUi" />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Описание</span>
          <UTextarea v-model="roleForm.description" :rows="4" :ui="{ base: 'w-full rounded-2xl border-0 bg-slate-50 px-4 py-3 text-[14px] text-slate-700 ring-1 ring-slate-200 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-teal-400/60' }" placeholder="Описание роли" />
        </label>
        <label class="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-[14px] text-slate-700 ring-1 ring-slate-200">
          <input v-model="roleForm.isAdmin" type="checkbox" class="h-4 w-4 accent-teal-600" />
          Роль администратора компании
        </label>
        <div class="flex justify-end gap-3">
          <UButton type="button" color="neutral" variant="soft" class="rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200" @click="modalOpen = false">Отмена</UButton>
          <UButton type="submit" color="neutral" class="rounded-2xl bg-slate-950 text-white hover:bg-slate-800" :loading="saving">{{ editingRoleId ? "Сохранить" : "Создать" }}</UButton>
        </div>
      </form>
    </ModalForm>
  </div>
</template>
