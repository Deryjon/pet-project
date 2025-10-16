import { defineStore } from "pinia";
import { ref, computed, watch, h } from "vue";
import { useRouter } from "vue-router";
import {
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useVueTable,
} from "@tanstack/vue-table";
import { useApi } from "~/composables/useApi";

type RawEmployee = {
  id?: number | string;
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  phone_number?: string;
  role?: string;
  branch_code?: string;
  branchCode?: string;
};

export const useEmployeesDataTableStore = defineStore(
  "employeesDataTableStore",
  () => {
    const router = useRouter();
    const { apiFetch } = useApi();

    const rawData = ref<any[]>([]);
    const globalFilter = ref("");
    const loading = ref(false);

    const pagination = ref({ pageSize: 10, pageIndex: 0 });
    const sorting = ref<any[]>([]);

    const filteredData = computed(() => {
      if (!globalFilter.value) return rawData.value;
      const q = globalFilter.value.toLowerCase();
      return rawData.value.filter((item) =>
        Object.values(item).join(" ").toLowerCase().includes(q)
      );
    });

    const candidates = ["/users", "/auth/users", "/management/users", "/employees", "/staff"];
    const chosenListEndpoint = ref<string | null>(null);

    async function fetchData() {
      loading.value = true;
      rawData.value = [];
      try {
        // Load from API; try known endpoints
        let data: any = null;
        for (const path of candidates) {
          try {
            const res = await apiFetch<any>(path, { method: "GET" });
            const arr = Array.isArray(res) ? res : res?.data;
            if (Array.isArray(arr)) {
              chosenListEndpoint.value = path;
              data = arr;
              break;
            }
          } catch (_) {
            // try next
          }
        }
        const items: RawEmployee[] = Array.isArray(data) ? data : [];
        rawData.value = items.map((u) => {
          const fullName = (
            (u.first_name || u.firstName || "") +
            (u.last_name || u.lastName ? ` ${u.last_name || u.lastName}` : "")
          ).trim();
          return {
            id: u.id ?? u.phone_number,
            name: (u.name || fullName || "").trim(),
            phone_number: u.phone_number || "",
            role: u.role || "",
            branch: u.branch_code || u.branchCode || "",
            _original: u,
          } as any;
        });
      } finally {
        loading.value = false;
      }
    }

    watch(globalFilter, async () => {
      pagination.value.pageIndex = 0;
      // Filtering is local for now
    });

    function idFor(row: any) {
      return row?.id ?? row?._original?.id ?? row?._original?.phone_number;
    }

    async function deleteEmployee(row: any) {
      const id = idFor(row);
      if (!id) return;
      const delCandidates = [
        ...(chosenListEndpoint.value ? [chosenListEndpoint.value] : []),
        ...candidates,
      ].map((base) => `${base}/${encodeURIComponent(String(id))}`);
      for (const path of delCandidates) {
        try {
          await apiFetch(path, { method: "DELETE" });
          await fetchData();
          return;
        } catch (_) {}
      }
      // If nothing worked, do nothing; UI stays unchanged
    }

    function editEmployee(row: any) {
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
            class: "w-3.5 h-3.5 accent-[#4993dd] cursor-pointer",
            onChange: (e: Event) => {
              const checked = (e.target as HTMLInputElement).checked;
              table
                .getRowModel()
                .rows.forEach((row: any) => row.toggleSelected(checked));
            },
          }),
        cell: ({ row }: any) =>
          h("input", {
            type: "checkbox",
            class: "w-3.5 h-3.5 accent-[#4993dd] cursor-pointer",
            checked: row.getIsSelected?.(),
            onChange: (e: Event) => row.toggleSelected?.((e.target as HTMLInputElement).checked),
          }),
        enableSorting: false,
        enableColumnFilter: false,
        size: 40,
      },
      { accessorKey: "name", header: "Имя" },
      { accessorKey: "phone_number", header: "Телефон" },
      { accessorKey: "role", header: "Роль" },
      { accessorKey: "branch", header: "Филиал" },
      {
        id: "actions",
        header: "Действия",
        cell: ({ row }: any) =>
          h(
            "div",
            { class: "flex gap-2" },
            [
              h(
                "button",
                {
                  class:
                    "px-3 py-1 rounded-md bg-[#404040] text-white hover:bg-[#5e5e5e] transition",
                  onClick: () => editEmployee(row.original),
                },
                "Изменить"
              ),
              h(
                "button",
                {
                  class:
                    "px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700 transition",
                  onClick: async () => {
                    if (confirm("Удалить сотрудника?")) await deleteEmployee(row.original);
                  },
                },
                "Удалить"
              ),
            ]
          ),
      },
    ];

    const table = useVueTable({
      data: filteredData,
      columns,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
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
      // Reuse BaseDataTable clickable name behavior to open edit
      editEmployee(row);
    }

    // initial load
    fetchData();

    return {
      rawData,
      globalFilter,
      loading,
      pagination,
      sorting,
      filteredData,
      table,
      fetchData,
      previousPage,
      nextPage,
      editEmployee,
      deleteEmployee,
      openProduct,
    };
  }
);

