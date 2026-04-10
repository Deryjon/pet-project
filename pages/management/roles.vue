<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useHead } from "#imports";
import {
  collectActivePermissionIds,
  type PermissionSection,
  type RoleSelectItem,
  useRolePermissionsApi,
} from "@/composables/useRolePermissions";

useHead({ title: "Роли | Konkurent.cases" });

const { createRole, getRolePermissions, updateRolePermissions, getRolesForSelect } = useRolePermissionsApi();

const loadingRoles = ref(false);
const loadingPermissions = ref(false);
const savingPermissions = ref(false);
const creatingRole = ref(false);

const serverError = ref("");
const serverOk = ref("");

const roleName = ref("");
const roleDescription = ref("");
const selectedRoleId = ref("");
const saveMode = ref<"sections" | "permission_ids">("sections");

const roles = ref<RoleSelectItem[]>([]);
const sections = ref<PermissionSection[]>([]);

const hasPermissions = computed(() => sections.value.length > 0);
const activePermissionCount = computed(() => collectActivePermissionIds(sections.value).length);

function copySections(input: PermissionSection[]): PermissionSection[] {
  return JSON.parse(JSON.stringify(input || []));
}

function setServerError(error: any, fallback: string) {
  serverError.value = error?.data?.message || error?.message || fallback;
}

async function loadRoles() {
  loadingRoles.value = true;
  try {
    roles.value = await getRolesForSelect();
    if (!selectedRoleId.value && roles.value.length) {
      selectedRoleId.value = roles.value[0]?.id || "";
    }
  } catch (error: any) {
    setServerError(error, "Не удалось загрузить список ролей.");
  } finally {
    loadingRoles.value = false;
  }
}

async function loadPermissions(roleId: string) {
  if (!roleId) return;

  loadingPermissions.value = true;
  serverError.value = "";
  serverOk.value = "";

  try {
    const response = await getRolePermissions(roleId);
    sections.value = copySections(response.sections);
  } catch (error: any) {
    setServerError(error, "Не удалось загрузить permissions для роли.");
    sections.value = [];
  } finally {
    loadingPermissions.value = false;
  }
}

async function refreshPermissions() {
  if (!selectedRoleId.value) return;
  await loadPermissions(selectedRoleId.value);
}

async function handleCreateRole() {
  serverError.value = "";
  serverOk.value = "";

  const name = String(roleName.value || "").trim();
  if (!name) {
    serverError.value = "Укажите имя роли.";
    return;
  }

  creatingRole.value = true;
  try {
    const roleId = await createRole({
      name,
      description: String(roleDescription.value || "").trim(),
    });

    roleName.value = "";
    roleDescription.value = "";
    selectedRoleId.value = roleId;

    await loadRoles();
    await loadPermissions(roleId);
    serverOk.value = "Роль создана и permissions загружены.";
  } catch (error: any) {
    setServerError(error, "Не удалось создать роль.");
  } finally {
    creatingRole.value = false;
  }
}

function togglePermission(sectionId: string, permissionId: string, next: boolean) {
  const section = sections.value.find((item) => item.id === sectionId);
  const permission = section?.permissions.find((item) => item.id === permissionId);
  if (!permission) return;

  permission.is_active = next;
  permission.children = permission.children.map((child) => ({
    ...child,
    is_active: next,
  }));
}

function toggleChild(sectionId: string, permissionId: string, childId: string, next: boolean) {
  const section = sections.value.find((item) => item.id === sectionId);
  const permission = section?.permissions.find((item) => item.id === permissionId);
  if (!permission) return;

  const child = permission.children.find((item) => item.id === childId);
  if (!child) return;

  child.is_active = next;
  permission.is_active = permission.children.some((item) => item.is_active);
}

async function savePermissions() {
  if (!selectedRoleId.value) {
    serverError.value = "Выберите роль.";
    return;
  }

  savingPermissions.value = true;
  serverError.value = "";
  serverOk.value = "";

  try {
    if (saveMode.value === "permission_ids") {
      await updateRolePermissions(selectedRoleId.value, {
        permission_ids: collectActivePermissionIds(sections.value),
      });
    } else {
      await updateRolePermissions(selectedRoleId.value, {
        sections: sections.value,
      });
    }

    serverOk.value = "Permissions сохранены.";
  } catch (error: any) {
    setServerError(error, "Не удалось сохранить permissions.");
  } finally {
    savingPermissions.value = false;
  }
}

onMounted(async () => {
  await loadRoles();
  if (selectedRoleId.value) {
    await loadPermissions(selectedRoleId.value);
  }
});
</script>

<template>
  <section class="space-y-6 text-white">
    <div class="rounded-[24px] border border-white/10 bg-slate-900/70 p-5">
      <h1 class="text-[28px] font-semibold">Роли и permissions</h1>
      <p class="mt-2 text-sm text-slate-300">
        Flow: создать роль, загрузить дерево через `GET /api/v2/role/:id/permissions`, изменить `is_active`, сохранить через `PUT`.
      </p>
    </div>

    <div class="grid gap-5 xl:grid-cols-2">
      <section class="rounded-[24px] border border-white/10 bg-slate-900/60 p-5">
        <h2 class="text-lg font-semibold">1) Создать роль</h2>
        <div class="mt-4 grid gap-3">
          <input
            v-model="roleName"
            type="text"
            class="rounded-xl border border-white/15 bg-slate-800/70 px-4 py-3 text-white outline-none focus:border-sky-400"
            placeholder="Кассир"
          />
          <input
            v-model="roleDescription"
            type="text"
            class="rounded-xl border border-white/15 bg-slate-800/70 px-4 py-3 text-white outline-none focus:border-sky-400"
            placeholder="Роль для кассы"
          />
          <button
            type="button"
            :disabled="creatingRole"
            class="rounded-xl border border-sky-300/30 bg-sky-400/20 px-4 py-3 text-sm font-medium text-sky-100 transition hover:bg-sky-400/30 disabled:opacity-60"
            @click="handleCreateRole"
          >
            {{ creatingRole ? "Создание..." : "Создать роль" }}
          </button>
        </div>
      </section>

      <section class="rounded-[24px] border border-white/10 bg-slate-900/60 p-5">
        <h2 class="text-lg font-semibold">2) Выбрать роль и загрузить дерево</h2>
        <div class="mt-4 grid gap-3">
          <select
            v-model="selectedRoleId"
            class="rounded-xl border border-white/15 bg-slate-800/70 px-4 py-3 text-white outline-none focus:border-sky-400"
          >
            <option value="" disabled>Выберите роль</option>
            <option v-for="role in roles" :key="role.id" :value="role.id">
              {{ role.name || role.id }}
            </option>
          </select>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              :disabled="loadingRoles"
              class="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm transition hover:bg-white/10 disabled:opacity-60"
              @click="loadRoles"
            >
              {{ loadingRoles ? "Обновление ролей..." : "Обновить роли" }}
            </button>
            <button
              type="button"
              :disabled="loadingPermissions || !selectedRoleId"
              class="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm transition hover:bg-white/10 disabled:opacity-60"
              @click="refreshPermissions"
            >
              {{ loadingPermissions ? "Загрузка..." : "Загрузить permissions" }}
            </button>
          </div>
        </div>
      </section>
    </div>

    <section class="rounded-[24px] border border-white/10 bg-slate-900/60 p-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-lg font-semibold">3) Редактировать и сохранить</h2>
        <div class="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200">
          Активных permission id: {{ activePermissionCount }}
        </div>
      </div>

      <div class="mt-4 flex flex-wrap gap-4">
        <label class="flex items-center gap-2 text-sm text-slate-200">
          <input v-model="saveMode" type="radio" value="sections" class="accent-sky-400" />
          Сохранять через sections
        </label>
        <label class="flex items-center gap-2 text-sm text-slate-200">
          <input v-model="saveMode" type="radio" value="permission_ids" class="accent-sky-400" />
          Сохранять через permission_ids
        </label>
      </div>

      <div v-if="!hasPermissions" class="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
        Сначала выберите роль и загрузите permissions.
      </div>

      <div v-else class="mt-4 space-y-4">
        <article
          v-for="section in sections"
          :key="section.id"
          class="rounded-xl border border-white/10 bg-slate-800/50 p-4"
        >
          <div class="mb-3 flex items-center justify-between gap-3">
            <p class="text-sm font-semibold text-white">{{ section.key || section.id }}</p>
            <span class="text-xs text-slate-400">#{{ section.sequence_number }}</span>
          </div>

          <div class="space-y-3">
            <div
              v-for="permission in section.permissions"
              :key="permission.id"
              class="rounded-lg border border-white/10 bg-slate-900/60 p-3"
            >
              <label class="flex cursor-pointer items-center gap-3">
                <input
                  :checked="permission.is_active"
                  type="checkbox"
                  class="h-4 w-4 accent-sky-400"
                  @change="togglePermission(section.id, permission.id, ($event.target as HTMLInputElement).checked)"
                />
                <span class="text-sm text-white">{{ permission.name || permission.slug || permission.id }}</span>
              </label>

              <div v-if="permission.children.length" class="mt-3 space-y-2 pl-7">
                <label
                  v-for="child in permission.children"
                  :key="child.id"
                  class="flex cursor-pointer items-center gap-3 text-sm"
                >
                  <input
                    :checked="child.is_active"
                    type="checkbox"
                    class="h-4 w-4 accent-sky-400"
                    @change="toggleChild(section.id, permission.id, child.id, ($event.target as HTMLInputElement).checked)"
                  />
                  <span class="text-slate-200">{{ child.name || child.slug || child.id }}</span>
                </label>
              </div>
            </div>
          </div>
        </article>
      </div>

      <div class="mt-5">
        <button
          type="button"
          :disabled="savingPermissions || !selectedRoleId || !hasPermissions"
          class="rounded-xl border border-emerald-300/30 bg-emerald-400/20 px-4 py-3 text-sm font-medium text-emerald-100 transition hover:bg-emerald-400/30 disabled:opacity-60"
          @click="savePermissions"
        >
          {{ savingPermissions ? "Сохранение..." : "Сохранить permissions" }}
        </button>
      </div>
    </section>

    <div v-if="serverError" class="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
      {{ serverError }}
    </div>
    <div v-if="serverOk" class="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
      {{ serverOk }}
    </div>
  </section>
</template>
