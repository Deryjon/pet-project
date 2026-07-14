import type { ReceiptData } from "@/composables/useReceipts";

/**
 * Plain-text summary for the native share sheet (Telegram, SMS, etc.) — a
 * short message is what people actually want here, unlike print/download
 * which must reproduce the full formatted receipt.
 */
export function useReceiptShare() {
  const toast = useToast();

  async function shareReceipt(receipt: ReceiptData) {
    const summary = [
      `Чек №${receipt.number}`,
      `Сумма: ${Math.round(receipt.totalDue).toLocaleString("ru-RU")} UZS`,
      receipt.clientName ? `Клиент: ${receipt.clientName}` : null,
    ].filter(Boolean).join("\n");

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Чек продажи", text: summary });
      } catch {
        // user cancelled share sheet
      }
      return;
    }

    toast.add({
      title: "Отправка недоступна",
      description: "Браузер не поддерживает системный обмен. Используйте печать чека.",
      color: "warning",
    });
  }

  return { shareReceipt };
}
