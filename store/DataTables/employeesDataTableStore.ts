import { defineStore } from "pinia";
import { ref, computed, watch, h } from "vue";
import { useRouter } from "vue-router";
import {
  getCoreRowModel,
  getSortedRowModel,
  useVueTable,
} from "@tanstack/vue-table";
import { useApi } from "~/composables/useApi";
import { useUserStore } from "@/store/useUserStore";

type RawEmployee = {
  id?: number | string;
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  phone_number?: string;
  role_name?: string;
  roles?: Array<{
    role_id?: string;
    role?: {
      name?: string;
    };
  }>;
  branch_code?: string;
  branch_title?: string;
  branchCode?: string;
  shops?: Array<{
    shop_id?: string;
    shop?: {
      name?: string;
    };
  }>;
  current_shop_id?: string;
  status_id?: string;
  is_active?: boolean;
  is_blocked?: boolean;
  is_deleted?: boolean;
  blocked_at?: string | number | null;
  deleted_at?: string | number | null;
  status?: string;
};

type EmployeeStatusFilter = "current" | "deleted" | "blocked";
type EmployeeActionTone = "danger" | "success" | "warning";
type PendingEmployeeAction = {
  title: string;
  description: string;
  confirmLabel: string;
  tone: EmployeeActionTone;
  run: () => Promise<void>;
};

const USER_STATUS_IDS: Record<EmployeeStatusFilter, string> = {
  current: "75af5991-a4a3-4bea-b2a7-1306e22d6529",
  blocked: "70162b38-9b4e-4e8e-90d1-a69b04bc51f1",
  // TODO: replace with the exact deleted status UUID from backend/Billz when it is fixed.
  deleted: "00000000-0000-0000-0000-000000000000",
};

type UsersResponse = {
  current_users_count?: number;
  blocked_users_count?: number;
  deleted_users_count?: number;
  count?: number;
  users?: RawEmployee[];
};

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function compactTextList(values: unknown[]) {
  return values
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .join(", ");
}

function hasStatusMarker(value: unknown) {
  return value !== undefined && value !== null && value !== "" && value !== 0 && value !== "0";
}

function getRoleName(user: RawEmployee) {
  const fromRoles = Array.isArray(user.roles)
    ? compactTextList(user.roles.map((item) => item?.role?.name || item?.role_id))
    : "";

  return user.role_name || fromRoles || "—";
}

function getAvailableShopNames(user: RawEmployee) {
  const fromShops = Array.isArray(user.shops)
    ? compactTextList(user.shops.map((item) => item?.shop?.name || item?.shop_id))
    : "";

  return user.branch_title || user.branchCode || fromShops || "—";
}

function getEmployeeStatus(user: RawEmployee, fallback: EmployeeStatusFilter) {
  if (user.is_deleted || hasStatusMarker(user.deleted_at)) return "Удалён";
  if (user.is_blocked || hasStatusMarker(user.blocked_at)) return "Заблокирован";
  if (user.status) return user.status;
  if (user.is_active === false) return "Неактивен";
  if (fallback === "deleted") return "Удалён";
  if (fallback === "blocked") return "Заблокирован";
  return "Активен";
}

function statusBadgeClass(status: string) {
  const normalized = status.trim().toLowerCase();

  if (["активен", "active", "current"].includes(normalized)) {
    return "border-emerald-400/30 bg-emerald-500/15 text-emerald-300";
  }

  if (["заблокирован", "blocked", "block"].includes(normalized)) {
    return "border-amber-400/30 bg-amber-500/15 text-amber-300";
  }

  if (["удалён", "удален", "deleted"].includes(normalized)) {
    return "border-red-400/30 bg-red-500/15 text-red-300";
  }

  if (["неактивен", "inactive"].includes(normalized)) {
    return "border-slate-400/30 bg-slate-500/15 text-slate-300";
  }

  return "border-white/15 bg-white/10 text-white";
}

function actionIcon(name: "pause" | "play" | "restore" | "delete") {
  const commonAttrs = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    class: "h-4 w-4",
    "aria-hidden": "true",
  };

  if (name === "pause") {
    return h("svg", commonAttrs, [
      h("path", { d: "M10 5v14" }),
      h("path", { d: "M14 5v14" }),
    ]);
  }

  if (name === "play") {
    return h("svg", commonAttrs, [
      h("path", { d: "m6 3 15 9-15 9V3Z" }),
    ]);
  }

  if (name === "restore") {
    return h("svg", commonAttrs, [
      h("path", { d: "M3 12a9 9 0 1 0 3-6.7" }),
      h("path", { d: "M3 3v6h6" }),
    ]);
  }

  return h("svg", commonAttrs, [
    h("path", { d: "M3 6h18" }),
    h("path", { d: "M8 6V4h8v2" }),
    h("path", { d: "M19 6l-1 14H6L5 6" }),
    h("path", { d: "M10 11v6" }),
    h("path", { d: "M14 11v6" }),
  ]);
}

export const useEmployeesDataTableStore = defineStore(
  "employeesDataTableStore",
  () => {
    const router = useRouter();
    const { apiFetch } = useApi();
    const userStore = useUserStore();

    const rawData = ref<any[]>([]);
    const globalFilter = ref("");
    const employeeStatusFilter = ref<EmployeeStatusFilter>("current");
    const loading = ref(false);
    const errorMessage = ref("");
    const employeeActionConfirm = ref<PendingEmployeeAction | null>(null);
    const employeeActionSubmitting = ref(false);
    const totalCount = ref(0);
    const employeeStatusCounts = ref<Record<EmployeeStatusFilter, number>>({
      current: 0,
      deleted: 0,
      blocked: 0,
    });

    const pagination = ref({ pageSize: 10, pageIndex: 0 });
    const sorting = ref<any[]>([]);

    const canManageEmployees = computed(() => userStore.isAdmin);

    const filteredData = computed(() => rawData.value);
    const totalPages = computed(() =>
      Math.max(1, Math.ceil(totalCount.value / pagination.value.pageSize)),
    );
    const usersEndpoint = "/user";

    function normalizeUsersResponse(res: any): UsersResponse {
      const payload = res?.data && typeof res.data === "object" ? res.data : res;
      return {
        current_users_count: payload?.current_users_count,
        blocked_users_count: payload?.blocked_users_count,
        deleted_users_count: payload?.deleted_users_count,
        count: payload?.count,
        users: Array.isArray(payload?.users) ? payload.users : [],
      };
    }

    async function fetchData() {
      loading.value = true;
      errorMessage.value = "";
      rawData.value = [];
      try {
        if (!userStore.token) {
          userStore.loadToken();
        }

        if (!userStore.token) {
          totalCount.value = 0;
          return;
        }

        const response = normalizeUsersResponse(
          await apiFetch<any>(usersEndpoint, {
            method: "GET",
            query: {
              limit: pagination.value.pageSize,
              page: pagination.value.pageIndex + 1,
              search: globalFilter.value,
              type: 1,
              force_roles: true,
              status_ids: USER_STATUS_IDS[employeeStatusFilter.value],
            },
          }),
        );

        employeeStatusCounts.value = {
          current: toNumber(response.current_users_count),
          blocked: toNumber(response.blocked_users_count),
          deleted: toNumber(response.deleted_users_count),
        };
        totalCount.value = toNumber(response.count);

        const items: RawEmployee[] = response.users ?? [];
        rawData.value = items.map((u) => {
          const fullName = (
            (u.first_name || u.firstName || "") +
            (u.last_name || u.lastName ? ` ${u.last_name || u.lastName}` : "")
          ).trim();

          return {
            id: u.id ?? u.phone_number,
            name: (u.name || fullName || "").trim(),
            phone_number: u.phone_number || "",
            role_name: getRoleName(u),
            branch_title: getAvailableShopNames(u),
            status_label: getEmployeeStatus(u, employeeStatusFilter.value),
            is_active: u.is_active !== false,
            _original: u,
          } as any;
        });
      } catch (error: any) {
        const status = error?.statusCode ?? error?.status ?? error?.response?.status;
        rawData.value = [];
        totalCount.value = 0;

        if (status === 401 || status === 403) {
          errorMessage.value = "Сессия истекла. Войдите заново.";
          userStore.logout();
          if (import.meta.client) {
            await router.push("/auth/login");
          }
          return;
        }

        errorMessage.value =
          error?.data?.message || error?.message || "Не удалось загрузить сотрудников.";
      } finally {
        loading.value = false;
      }
    }

    async function fetchFirstPage() {
      if (pagination.value.pageIndex === 0) {
        await fetchData();
        return;
      }

      pagination.value.pageIndex = 0;
    }

    watch(globalFilter, fetchFirstPage);

    watch(employeeStatusFilter, fetchFirstPage);

    watch(
      () => [pagination.value.pageIndex, pagination.value.pageSize],
      async () => {
        await fetchData();
      },
    );

    watch(totalPages, (pages) => {
      if (pagination.value.pageIndex > pages - 1) {
        pagination.value.pageIndex = pages - 1;
      }
    });

    function idFor(row: any) {
      return row?.id ?? row?._original?.id ?? row?._original?.phone_number;
    }

    function employeeNameFor(row: any) {
      const name = String(row?.name ?? row?._original?.name ?? "").trim();
      return name || "этого сотрудника";
    }

    function requestEmployeeAction(action: PendingEmployeeAction) {
      employeeActionConfirm.value = action;
    }

    function closeEmployeeActionConfirm() {
      if (employeeActionSubmitting.value) return;
      employeeActionConfirm.value = null;
    }

    async function confirmEmployeeAction() {
      if (!employeeActionConfirm.value || employeeActionSubmitting.value) return;

      const action = employeeActionConfirm.value;
      employeeActionSubmitting.value = true;

      try {
        await action.run();
        employeeActionConfirm.value = null;
      } catch (error: any) {
        errorMessage.value =
          error?.data?.message || error?.message || "Не удалось выполнить действие с сотрудником.";
      } finally {
        employeeActionSubmitting.value = false;
      }
    }

    async function deleteEmployee(row: any) {
      if (!canManageEmployees.value) return;

      const id = idFor(row);
      if (!id) return;

      await apiFetch(`/users/${encodeURIComponent(String(id))}`, { method: "DELETE" });
      await fetchData();
    }

    async function pauseEmployee(row: any) {
      if (!canManageEmployees.value) return;

      const id = idFor(row);
      if (!id) return;

      await apiFetch(`/users/${encodeURIComponent(String(id))}/status`, {
        method: "PATCH",
        body: {
          is_active: false,
        },
      });
      await fetchData();
    }

    async function startEmployee(row: any) {
      if (!canManageEmployees.value) return;

      const id = idFor(row);
      if (!id) return;

      await apiFetch(`/users/${encodeURIComponent(String(id))}/status`, {
        method: "PATCH",
        body: {
          is_active: true,
        },
      });
      await fetchData();
    }

    async function restoreEmployee(row: any) {
      if (!canManageEmployees.value) return;

      const id = idFor(row);
      if (!id) return;

      await apiFetch(`/users/${encodeURIComponent(String(id))}/restore`, {
        method: "PATCH",
      });
      await fetchData();
    }

    function editEmployee(row: any) {
      if (!canManageEmployees.value) return;

      const id = idFor(row);
      if (!id) return;
      router.push(`/management/employees/${encodeURIComponent(String(id))}`);
    }

    const columns: any[] = [
      {
        id: "select",
        header: () =>
          h("input", {
            type: "checkbox",
            class: "h-3.5 w-3.5 cursor-pointer accent-[#4993dd]",
            onChange: (e: Event) => {
              const checked = (e.target as HTMLInputElement).checked;
              table.getRowModel().rows.forEach((row: any) => row.toggleSelected(checked));
            },
          }),
        cell: ({ row }: any) =>
          h("input", {
            type: "checkbox",
            class: "h-3.5 w-3.5 cursor-pointer accent-[#4993dd]",
            checked: row.getIsSelected?.(),
            onChange: (e: Event) => row.toggleSelected?.((e.target as HTMLInputElement).checked),
          }),
        enableSorting: false,
        enableColumnFilter: false,
        size: 40,
      },
      { accessorKey: "id", header: "ID" },
      { accessorKey: "name", header: "ФИО" },
      { accessorKey: "phone_number", header: "Телефон" },
      { accessorKey: "role_name", header: "Роль" },
      { accessorKey: "branch_title", header: "Доступные магазины" },
      {
        accessorKey: "status_label",
        header: "Статус",
        cell: ({ getValue }: any) => {
          const status = String(getValue() || "—");

          return h(
            "span",
            {
              class: [
                "inline-flex min-w-[92px] items-center justify-center rounded-full border px-3 py-1 text-[12px] font-semibold leading-none sm:text-[13px]",
                statusBadgeClass(status),
              ].join(" "),
            },
            status,
          );
        },
      },
      {
        id: "actions",
        header: "Действия",
        cell: ({ row }: any) => {
          if (!canManageEmployees.value) {
            return h("span", { class: "text-[#8f8f8f]" }, "Недоступно");
          }

          const activeTab = employeeStatusFilter.value;
          const actionButtons = [];

          if (activeTab === "deleted") {
            actionButtons.push(
              h(
                "button",
                {
                  class:
                    "inline-flex h-9 w-9 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30 transition hover:bg-emerald-500/25",
                  title: "Вернуть сотрудника",
                  "aria-label": "Вернуть сотрудника",
                  onClick: (event: Event) => {
                    event.stopPropagation();
                    requestEmployeeAction({
                      title: "Вернуть сотрудника",
                      description: `Вернуть ${employeeNameFor(row.original)} в текущие сотрудники?`,
                      confirmLabel: "Вернуть",
                      tone: "success",
                      run: () => restoreEmployee(row.original),
                    });
                  },
                },
                actionIcon("restore"),
              ),
            );

            return h("div", { class: "flex gap-2" }, actionButtons);
          }

          if (activeTab === "blocked") {
            actionButtons.push(
              h(
                "button",
                {
                  class:
                    "inline-flex h-9 w-9 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30 transition hover:bg-emerald-500/25",
                  title: "Запустить сотрудника",
                  "aria-label": "Запустить сотрудника",
                  onClick: (event: Event) => {
                    event.stopPropagation();
                    requestEmployeeAction({
                      title: "Активировать сотрудника",
                      description: `Активировать ${employeeNameFor(row.original)} и вернуть доступ?`,
                      confirmLabel: "Активировать",
                      tone: "success",
                      run: () => startEmployee(row.original),
                    });
                  },
                },
                actionIcon("play"),
              ),
            );
          } else {
            actionButtons.push(
              h(
                "button",
                {
                  class:
                    "inline-flex h-9 w-9 items-center justify-center rounded-md bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30 transition hover:bg-amber-500/25",
                  title: "Отключить сотрудника",
                  "aria-label": "Отключить сотрудника",
                  onClick: (event: Event) => {
                    event.stopPropagation();
                    requestEmployeeAction({
                      title: "Заблокировать сотрудника",
                      description: `Заблокировать ${employeeNameFor(row.original)}? Доступ сотрудника будет отключен.`,
                      confirmLabel: "Заблокировать",
                      tone: "warning",
                      run: () => pauseEmployee(row.original),
                    });
                  },
                },
                actionIcon("pause"),
              ),
            );
          }

          actionButtons.push(
            h(
              "button",
              {
                class:
                  "inline-flex h-9 w-9 items-center justify-center rounded-md bg-red-600 text-white transition hover:bg-red-700",
                title: "Удалить",
                "aria-label": "Удалить сотрудника",
                onClick: (event: Event) => {
                  event.stopPropagation();
                  requestEmployeeAction({
                    title: "Удалить сотрудника",
                    description: `Удалить ${employeeNameFor(row.original)}? Это действие перенесет сотрудника в удаленные.`,
                    confirmLabel: "Удалить",
                    tone: "danger",
                    run: () => deleteEmployee(row.original),
                  });
                },
              },
              actionIcon("delete"),
            ),
          );

          return h("div", { class: "flex gap-2" }, actionButtons);
        },
      },
    ];

    const table = useVueTable({
      data: filteredData,
      columns,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      manualPagination: true,
      get pageCount() {
        return totalPages.value;
      },
      enableRowSelection: true,
      state: {
        get pagination() {
          return pagination.value;
        },
        get sorting() {
          return sorting.value;
        },
      },
      onPaginationChange: (updater: any) => {
        pagination.value =
          typeof updater === "function" ? updater(pagination.value) : updater;
      },
      onSortingChange: (updater: any) => {
        sorting.value =
          typeof updater === "function" ? updater(sorting.value) : updater;
      },
    });

    function previousPage() {
      table.previousPage();
    }

    function nextPage() {
      table.nextPage();
    }

    function openProduct(row: any) {
      if (!canManageEmployees.value) return;
      editEmployee(row);
    }

    if (import.meta.client) {
      fetchData();
    }

    return {
      rawData,
      globalFilter,
      employeeStatusFilter,
      employeeStatusCounts,
      employeeActionConfirm,
      employeeActionSubmitting,
      errorMessage,
      totalCount,
      totalPages,
      loading,
      pagination,
      sorting,
      filteredData,
      canManageEmployees,
      table,
      fetchData,
      previousPage,
      nextPage,
      editEmployee,
      pauseEmployee,
      startEmployee,
      restoreEmployee,
      deleteEmployee,
      closeEmployeeActionConfirm,
      confirmEmployeeAction,
      openProduct,
    };
  },
);
