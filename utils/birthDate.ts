function pad2(value: string) {
  return value.length >= 2 ? value : `0${value}`;
}

export function normalizeBirthDateForPayload(value: string | null | undefined) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const year = isoMatch[1] || "";
    const month = isoMatch[2] || "";
    const day = isoMatch[3] || "";
    return `${day}.${month}.${year}`;
  }

  const dotMatch = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dotMatch) {
    const day = dotMatch[1] || "";
    const month = dotMatch[2] || "";
    const year = dotMatch[3] || "";
    return `${pad2(day)}.${pad2(month)}.${year}`;
  }

  return trimmed;
}

export function normalizeBirthDateForPicker(value: string | null | undefined) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const dotMatch = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!dotMatch) {
    return "";
  }

  const day = dotMatch[1] || "";
  const month = dotMatch[2] || "";
  const year = dotMatch[3] || "";
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function formatBirthDate(value: string | null | undefined) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";

  return normalizeBirthDateForPayload(trimmed);
}
