<script setup lang="ts">
import { computed, h, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useHead } from "#imports";
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
} from "@tanstack/vue-table";
import DataTable from "@/components/DataTable.vue";
import BaseDataTable from "@/components/BaseDataTable.vue";
import BaseDataTableHeader from "@/components/BaseDataTableHeader.vue";
import BaseDataTablePagination from "@/components/BaseDataTablePagination.vue";
import {
  collectActivePermissionIds,
  type PermissionSection,
  type RoleSelectItem,
  useRolePermissionsApi,
} from "@/composables/useRolePermissions";

useHead({ title: "Роли | Konkurent.cases" });

type PanelMode = "create" | "edit";

const {
  createRole,
  updateRole,
  getRolePermissions,
  updateRolePermissions,
  getRolesForSelect,
} = useRolePermissionsApi();

const loadingRoles = ref(false);
const loadingPermissions = ref(false);
const savingRole = ref(false);
const savingPermissions = ref(false);

const serverError = ref("");
const serverOk = ref("");
const searchQuery = ref("");

const isPanelOpen = ref(false);
const panelMode = ref<PanelMode>("create");
const selectedRoleId = ref("");
const saveMode = ref<"sections" | "permission_ids">("sections");

const roleName = ref("");
const roleDescription = ref("");
const roles = ref<RoleSelectItem[]>([]);
const sections = ref<PermissionSection[]>([]);
const tableSorting = ref<any[]>([]);
const tablePagination = ref({ pageIndex: 0, pageSize: 10 });

const filteredRoles = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) {
    return roles.value;
  }

  return roles.value.filter((role) =>
    [role.name, role.description, role.id].some((value) =>
      String(value || "")
        .toLowerCase()
        .includes(query),
    ),
  );
});

watch(searchQuery, () => {
  tablePagination.value.pageIndex = 0;
});

const tableColumns = computed<any[]>(() => [
  {
    accessorKey: "name",
    header: "Название",
    cell: ({ row }: any) =>
      h(
        "button",
        {
          type: "button",
          class:
            "text-left text-[16px] font-semibold text-white transition hover:text-[#8fc1ff]",
          onClick: () => openEditPanel(row.original),
        },
        row.original.name || "Без названия",
      ),
  },
  {
    accessorKey: "description",
    header: "Описание",
    cell: ({ row }: any) =>
      h(
        "span",
        { class: "text-sm text-[#b8b8b8]" },
        row.original.description || "Описание не указано",
      ),
  },
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }: any) =>
      h(
        "span",
        {
          class:
            "rounded-full border border-white/8 bg-white/5 px-3 py-1 text-xs text-[#d6d6d6]",
        },
        row.original.id,
      ),
  },
  {
    id: "actions",
    header: () => h("div", { class: "text-right" }, "Действие"),
    enableSorting: false,
    meta: {
      tdClass: "text-right",
    },
    cell: ({ row }: any) =>
      h(
        "button",
        {
          type: "button",
          class:
            "rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10",
          onClick: () => openEditPanel(row.original),
        },
        "Открыть",
      ),
  },
]);

const rolesTable = useVueTable({
  get data() {
    return filteredRoles.value;
  },
  get columns() {
    return tableColumns.value;
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  state: {
    get sorting() {
      return tableSorting.value;
    },
    get pagination() {
      return tablePagination.value;
    },
  },
  onSortingChange: (updater: any) => {
    tableSorting.value =
      typeof updater === "function" ? updater(tableSorting.value) : updater;
  },
  onPaginationChange: (updater: any) => {
    tablePagination.value =
      typeof updater === "function" ? updater(tablePagination.value) : updater;
  },
});

const currentPage = computed(() => tablePagination.value.pageIndex + 1);
const totalPages = computed(() => Math.max(1, rolesTable.getPageCount()));

function previousRolesPage() {
  rolesTable.previousPage();
}

function nextRolesPage() {
  rolesTable.nextPage();
}

const activePermissionCount = computed(() => collectActivePermissionIds(sections.value).length);
const hasPermissions = computed(() => sections.value.length > 0);
const canSubmitRole = computed(() => !!String(roleName.value || "").trim());

function copySections(input: PermissionSection[]): PermissionSection[] {
  return JSON.parse(JSON.stringify(input || []));
}

function setServerError(error: any, fallback: string) {
  serverError.value = error?.data?.message || error?.message || fallback;
}

function clearMessages() {
  serverError.value = "";
  serverOk.value = "";
}

function resetForm() {
  roleName.value = "";
  roleDescription.value = "";
  selectedRoleId.value = "";
  sections.value = [];
  saveMode.value = "sections";
}

async function loadRoles() {
  loadingRoles.value = true;

  try {
    const data = await getRolesForSelect();
    roles.value = [...data].sort((a, b) => a.name.localeCompare(b.name, "ru"));
  } catch (error: any) {
    setServerError(error, "Не удалось загрузить список ролей.");
  } finally {
    loadingRoles.value = false;
  }
}

async function loadPermissions(roleId: string) {
  if (!roleId) {
    sections.value = [];
    return;
  }

  loadingPermissions.value = true;

  try {
    const response = await getRolePermissions(roleId);
    sections.value = copySections(response.sections);
  } catch (error: any) {
    sections.value = [];
    setServerError(error, "Не удалось загрузить permissions для роли.");
  } finally {
    loadingPermissions.value = false;
  }
}

function openCreatePanel() {
  clearMessages();
  resetForm();
  panelMode.value = "create";
  isPanelOpen.value = true;
}

async function openEditPanel(role: RoleSelectItem) {
  clearMessages();
  panelMode.value = "edit";
  isPanelOpen.value = true;
  selectedRoleId.value = role.id;
  roleName.value = role.name || "";
  roleDescription.value = role.description || "";
  sections.value = [];
  await loadPermissions(role.id);
}

function closePanel() {
  isPanelOpen.value = false;
}

async function submitRole() {
  clearMessages();

  const name = String(roleName.value || "").trim();
  const description = String(roleDescription.value || "").trim();

  if (!name) {
    serverError.value = "Укажите название роли.";
    return;
  }

  savingRole.value = true;

  try {
    if (panelMode.value === "create") {
      const roleId = await createRole({ name, description });
      await loadRoles();

      selectedRoleId.value = roleId;
      panelMode.value = "edit";
      await loadPermissions(roleId);
      serverOk.value = "Роль создана. Теперь можно настроить permissions.";
      return;
    }

    await updateRole({
      id: selectedRoleId.value,
      name,
      description,
    });

    await loadRoles();
    serverOk.value = "Данные роли сохранены.";
  } catch (error: any) {
    setServerError(
      error,
      panelMode.value === "create" ? "Не удалось создать роль." : "Не удалось обновить роль.",
    );
  } finally {
    savingRole.value = false;
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
  clearMessages();

  if (!selectedRoleId.value) {
    serverError.value = "Сначала создайте или выберите роль.";
    return;
  }

  if (!hasPermissions.value) {
    serverError.value = "Для роли не загружены permissions.";
    return;
  }

  savingPermissions.value = true;

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

watch(isPanelOpen, (isOpen) => {
  if (typeof document === "undefined") {
    return;
  }
  document.body.classList.toggle("overflow-hidden", isOpen);
});

onBeforeUnmount(() => {
  if (typeof document === "undefined") {
    return;
  }
  document.body.classList.remove("overflow-hidden");
});

onMounted(loadRoles);
</script>

<template>
  <section class="catalog text-white">
    <div class="top flex items-start justify-between gap-4">
      <div>
        <h2 class="text-[36px] font-bold text-white">Роли</h2>
        <p class="mt-2 max-w-[760px] text-[15px] text-[#bdbdbd]">
          Список ролей компании, создание новых ролей и редактирование permissions в одном экране.
        </p>
      </div>
    </div>

    <div class="mt-[40px] space-y-5">
      <DataTable>
        <template #header>
          <BaseDataTableHeader
            v-model="searchQuery"
            :showSearch="true"
            searchPlaceholder="Поиск по названию, описанию или ID"
            :createButton="{ label: 'Создать роль', onClick: openCreatePanel }"
          />
        </template>

        <section class="overflow-hidden rounded-[30px] border border-white/8 bg-[#262626] shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
          <div class="border-b border-white/8 bg-[linear-gradient(135deg,rgba(31,120,255,0.18),rgba(38,38,38,0.96)_45%,rgba(38,38,38,1))] px-6 py-6">
            <div class="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p class="text-[12px] font-semibold uppercase tracking-[0.28em] text-[#7fb0ff]">
                  Role Registry
                </p>
                <h3 class="mt-2 text-[28px] font-semibold text-white">Все роли</h3>
              </div>

              <div class="flex flex-wrap gap-2">
                <span class="rounded-full border border-[#2f6ed6] bg-[#10294f] px-3 py-1 text-xs font-medium text-[#9fc0ff]">
                  {{ filteredRoles.length }} ролей
                </span>
                <button
                  type="button"
                  class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white transition hover:bg-white/10"
                  @click="loadRoles"
                >
                  {{ loadingRoles ? "Обновление..." : "Обновить" }}
                </button>
              </div>
            </div>
          </div>

          <div v-if="serverError" class="border-b border-red-500/20 bg-red-500/10 px-6 py-3 text-sm text-red-200">
            {{ serverError }}
          </div>
          <div v-if="serverOk" class="border-b border-emerald-500/20 bg-emerald-500/10 px-6 py-3 text-sm text-emerald-200">
            {{ serverOk }}
          </div>

          <BaseDataTable
            :table="rolesTable"
            :store="{ loading: loadingRoles }"
            interactiveColumnId="name"
            :onRowClick="openEditPanel"
          />
        </section>

        <template #pagination>
          <BaseDataTablePagination
            :currentPage="currentPage"
            :totalPages="totalPages"
            :loading="loadingRoles"
            @previous="previousRolesPage"
            @next="nextRolesPage"
          />
        </template>
      </DataTable>
    </div>

    <Teleport to="body">
      <transition name="fade">
        <div
          v-if="isPanelOpen"
          class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          @click="closePanel"
        />
      </transition>

      <transition name="slide-panel">
        <aside
          v-if="isPanelOpen"
          class="fixed right-0 top-0 z-[60] flex h-full w-full max-w-[760px] flex-col overflow-hidden rounded-l-[40px] bg-[#2b2b2b] text-white shadow-2xl"
          @click.stop
        >
          <div class="flex items-center justify-between border-b border-white/10 px-8 py-6">
            <div>
              <p class="text-[12px] font-bold uppercase tracking-[0.24em] text-[#7ba9d8]">
                {{ panelMode === "create" ? "Новая роль" : "Редактирование роли" }}
              </p>
              <h3 class="mt-2 text-[30px] font-bold">
                {{ panelMode === "create" ? "Создать роль" : roleName || "Настройка роли" }}
              </h3>
              <p class="mt-1 text-[15px] text-[#bdbdbd]">
                {{
                  panelMode === "create"
                    ? "Добавьте название и описание, затем сохраните роль."
                    : "Обновите данные роли и настройте permissions."
                }}
              </p>
            </div>

            <button
              type="button"
              class="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-[#404040] transition-colors duration-200 hover:bg-[#5e5e5e]"
              @click="closePanel"
            >
              <Icon name="heroicons:x-mark-20-solid" class="h-6 w-6" />
            </button>
          </div>

          <div class="flex-1 overflow-y-auto px-8 py-8">
            <div class="space-y-6">
              <section class="rounded-[24px] bg-[#363636] p-5">
                <div class="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <p class="text-[18px] font-bold text-white">Данные роли</p>
                    <p class="mt-1 text-[14px] text-[#bdbdbd]">
                      Название и описание используются в списках сотрудников и настройках доступа.
                    </p>
                  </div>

                  <span
                    v-if="selectedRoleId"
                    class="rounded-full border border-white/10 bg-black/10 px-3 py-1 text-xs text-[#d6d6d6]"
                  >
                    {{ selectedRoleId }}
                  </span>
                </div>

                <div class="space-y-4">
                  <div class="space-y-2">
                    <label class="text-[16px] font-bold text-white">Название роли</label>
                    <input
                      v-model="roleName"
                      type="text"
                      class="w-full rounded-[18px] border border-transparent bg-[#404040] px-5 py-4 text-[16px] text-white outline-none transition-colors duration-200 placeholder:text-[#9f9f9f] focus:border-[#4993dd]"
                      placeholder="Кассир"
                    />
                  </div>

                  <div class="space-y-2">
                    <label class="text-[16px] font-bold text-white">Описание</label>
                    <textarea
                      v-model="roleDescription"
                      rows="4"
                      class="w-full resize-none rounded-[18px] border border-transparent bg-[#404040] px-5 py-4 text-[16px] text-white outline-none transition-colors duration-200 placeholder:text-[#9f9f9f] focus:border-[#4993dd]"
                      placeholder="Роль для кассовой зоны и оформления продаж"
                    />
                  </div>
                </div>
              </section>

              <section
                v-if="panelMode === 'edit'"
                class="rounded-[24px] border border-white/8 bg-[#343434] p-5"
              >
                <div class="mb-5 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p class="text-[18px] font-bold text-white">Permissions</p>
                    <p class="mt-1 text-[14px] text-[#bdbdbd]">
                      Изменения можно сохранить всем деревом или списком активных permission ID.
                    </p>
                  </div>

                  <div class="rounded-[16px] border border-white/10 bg-black/10 px-4 py-3 text-sm text-white">
                    Активно: {{ activePermissionCount }}
                  </div>
                </div>

                <div class="mb-5 flex flex-wrap gap-4">
                  <label class="flex items-center gap-2 text-sm text-slate-200">
                    <input v-model="saveMode" type="radio" value="sections" class="accent-sky-400" />
                    Сохранять через sections
                  </label>
                  <label class="flex items-center gap-2 text-sm text-slate-200">
                    <input v-model="saveMode" type="radio" value="permission_ids" class="accent-sky-400" />
                    Сохранять через permission_ids
                  </label>
                </div>

                <div
                  v-if="loadingPermissions"
                  class="rounded-[20px] bg-[#3b3b3b] px-5 py-4 text-sm text-[#bdbdbd]"
                >
                  Загружаем permissions...
                </div>

                <div
                  v-else-if="!hasPermissions"
                  class="rounded-[20px] bg-[#3b3b3b] px-5 py-4 text-sm text-[#bdbdbd]"
                >
                  Для роли пока не удалось получить permissions.
                </div>

                <div v-else class="space-y-4">
                  <article
                    v-for="section in sections"
                    :key="section.id"
                    class="rounded-[20px] border border-white/8 bg-[#2f2f2f] p-4"
                  >
                    <div class="mb-3 flex items-center justify-between gap-3">
                      <p class="text-sm font-semibold text-white">{{ section.key || section.id }}</p>
                      <span class="text-xs text-[#9b9b9b]">#{{ section.sequence_number }}</span>
                    </div>

                    <div class="space-y-3">
                      <div
                        v-for="permission in section.permissions"
                        :key="permission.id"
                        class="rounded-[18px] border border-white/8 bg-[#383838] p-4"
                      >
                        <label class="flex cursor-pointer items-start gap-3">
                          <input
                            :checked="permission.is_active"
                            type="checkbox"
                            class="mt-1 h-4 w-4 accent-sky-400"
                            @change="togglePermission(section.id, permission.id, ($event.target as HTMLInputElement).checked)"
                          />
                          <span>
                            <span class="block text-sm font-semibold text-white">
                              {{ permission.name || permission.slug || permission.id }}
                            </span>
                            <span
                              v-if="permission.description"
                              class="mt-1 block text-xs text-[#a7a7a7]"
                            >
                              {{ permission.description }}
                            </span>
                          </span>
                        </label>

                        <div v-if="permission.children.length" class="mt-4 space-y-2 pl-7">
                          <label
                            v-for="child in permission.children"
                            :key="child.id"
                            class="flex cursor-pointer items-start gap-3 rounded-[14px] bg-black/10 px-3 py-2 text-sm"
                          >
                            <input
                              :checked="child.is_active"
                              type="checkbox"
                              class="mt-1 h-4 w-4 accent-sky-400"
                              @change="toggleChild(section.id, permission.id, child.id, ($event.target as HTMLInputElement).checked)"
                            />
                            <span>
                              <span class="block text-[#e5e5e5]">
                                {{ child.name || child.slug || child.id }}
                              </span>
                              <span
                                v-if="child.description"
                                class="mt-1 block text-xs text-[#9b9b9b]"
                              >
                                {{ child.description }}
                              </span>
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </article>
                </div>
              </section>
            </div>
          </div>

          <div class="border-t border-white/10 px-8 py-6">
            <div class="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                class="flex-1 cursor-pointer rounded-[16px] bg-[#404040] px-5 py-4 text-[16px] font-bold text-white transition-colors duration-200 hover:bg-[#4b4b4b]"
                @click="closePanel"
              >
                Закрыть
              </button>

              <button
                type="button"
                class="flex-1 cursor-pointer rounded-[16px] bg-[#1f78ff] px-5 py-4 text-[16px] font-bold text-white transition-colors duration-200 hover:bg-[#2a6ed9] disabled:cursor-not-allowed disabled:bg-[#3764a8] disabled:text-white/70"
                :disabled="savingRole || !canSubmitRole"
                @click="submitRole"
              >
                {{
                  savingRole
                    ? panelMode === "create"
                      ? "Создание..."
                      : "Сохранение..."
                    : panelMode === "create"
                      ? "Создать роль"
                      : "Сохранить роль"
                }}
              </button>

              <button
                v-if="panelMode === 'edit'"
                type="button"
                class="flex-1 cursor-pointer rounded-[16px] bg-[#1f9d68] px-5 py-4 text-[16px] font-bold text-white transition-colors duration-200 hover:bg-[#22885d] disabled:cursor-not-allowed disabled:bg-[#3e735d] disabled:text-white/70"
                :disabled="savingPermissions || !selectedRoleId || !hasPermissions"
                @click="savePermissions"
              >
                {{ savingPermissions ? "Сохранение permissions..." : "Сохранить permissions" }}
              </button>
            </div>
          </div>
        </aside>
      </transition>
    </Teleport>
  </section>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-panel-enter-from,
.slide-panel-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
