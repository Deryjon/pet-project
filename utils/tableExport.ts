function normalizeCellValue(value: unknown) {
  if (value == null) return "";
  if (Array.isArray(value)) return value.join(", ");
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value);
  return value;
}

function resolveHeader(column: any) {
  const header = column?.columnDef?.header;
  if (typeof header === "string") return header;
  return String(column?.id ?? "").trim();
}

export async function exportTableToExcel(table: any, filename: string) {
  if (!import.meta.client || !table) return;

  const columns = table
    .getAllLeafColumns()
    .filter((column: any) => !["select", "actions"].includes(column.id) && column.getIsVisible?.() !== false);
  const rows =
    table.getPrePaginationRowModel?.().rows ??
    table.getFilteredRowModel?.().rows ??
    table.getRowModel?.().rows ??
    [];

  const data = rows.map((row: any) => {
    const item: Record<string, unknown> = {};
    columns.forEach((column: any) => {
      item[resolveHeader(column)] = normalizeCellValue(row.getValue(column.id));
    });
    return item;
  });

  const XLSX = await import("xlsx");
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Данные");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
