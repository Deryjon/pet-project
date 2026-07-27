export interface PriceTagsPrintOptions {
  branchId?: string;
  templateId?: string;
  showDiscount?: boolean;
  a4?: boolean;
}

export function usePrintWindow() {
  function openPriceTagsPrint(
    productIds: (string | number)[],
    copies: Record<string, number>,
    options?: PriceTagsPrintOptions,
  ) {
    const ids = productIds.join(",");
    const copiesParam = Object.entries(copies)
      .map(([id, count]) => `${id}:${count}`)
      .join(",");
    const query = new URLSearchParams({ productIds: ids, autoprint: "1" });
    if (copiesParam) query.set("copies", copiesParam);
    if (options?.branchId) query.set("branchId", options.branchId);
    if (options?.templateId) query.set("templateId", options.templateId);
    if (options?.showDiscount === false) query.set("discount", "0");
    if (options?.a4) query.set("a4", "1");
    window.open(`/print/price-tags?${query.toString()}`, "_blank", "width=900,height=700");
  }

  return { openPriceTagsPrint };
}
