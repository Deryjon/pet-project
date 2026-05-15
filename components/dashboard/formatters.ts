export function formatCurrency(value: number | string, currency: string = 'UZS'): string {
  if (typeof value === 'string') {
    value = parseFloat(value);
  }
  if (isNaN(value)) {
    return `0 ${currency}`;
  }
  return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value)} ${currency}`;
}

export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^0-9,\s]/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}