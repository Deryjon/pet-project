export function usePrintWindow() {
  function openPriceTagsPrint(productIds: (string | number)[], copies: Record<string, number>) {
    const ids = productIds.join(",");
    const copiesParam = Object.entries(copies)
      .map(([id, count]) => `${id}:${count}`)
      .join(",");
    const query = new URLSearchParams({ productIds: ids, autoprint: "1" });
    if (copiesParam) query.set("copies", copiesParam);
    window.open(`/print/price-tags?${query.toString()}`, "_blank", "width=900,height=700");
  }

  return { openPriceTagsPrint };
}
