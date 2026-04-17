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
  branch_code?: string;
  branch_title?: string;
  branchCode?: string;
  is_active?: boolean;
  is_blocked?: boolean;
  is_deleted?: boolean;
  blocked_at?: string | null;
  deleted_at?: string | null;
  status?: string;
};

type EmployeeStatusFilter = "current" | "deleted" | "blocked";

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

function actionIcon(name: "edit" | "delete") {
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

  if (name === "edit") {
    return h("svg", commonAttrs, [
      h("path", { d: "M12 20h9" }),
      h("path", { d: "M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" }),
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
      rawData.value = [];
      try {
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
            role_name: u.role_name || "",
            branch_title: u.branch_title || u.branchCode || "",
            is_active: u.is_active !== false,
            _original: u,
          } as any;
        });
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

    async function deleteEmployee(row: any) {
      if (!canManageEmployees.value) return;

      const id = idFor(row);
      if (!id) return;

      await apiFetch(`${usersEndpoint}/${encodeURIComponent(String(id))}`, { method: "DELETE" });
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
      { accessorKey: "branch_title", header: "Магазин" },
      { accessorKey: "phone_number", header: "Телефон" },
      { accessorKey: "role_name", header: "Роль" },
      { accessorKey: "", header: "Статус" },
      {
        id: "actions",
        header: "Действия",
        cell: ({ row }: any) => {
          if (!canManageEmployees.value) {
            return h("span", { class: "text-[#8f8f8f]" }, "Недоступно");
          }

          return h("div", { class: "flex gap-2" }, [
            h(
              "button",
              {
                class:
                  "inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#404040] text-white transition hover:bg-[#5e5e5e]",
                title: "Изменить",
                "aria-label": "Изменить сотрудника",
                onClick: () => editEmployee(row.original),
              },
              actionIcon("edit"),
            ),
            h(
              "button",
              {
                class:
                  "inline-flex h-9 w-9 items-center justify-center rounded-md bg-red-600 text-white transition hover:bg-red-700",
                title: "Удалить",
                "aria-label": "Удалить сотрудника",
                onClick: async () => {
                  if (confirm("Удалить сотрудника?")) await deleteEmployee(row.original);
                },
              },
              actionIcon("delete"),
            ),
          ]);
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

    fetchData();

    return {
      rawData,
      globalFilter,
      employeeStatusFilter,
      employeeStatusCounts,
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
      deleteEmployee,
      openProduct,
    };
  },
);
