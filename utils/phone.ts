export function formatUzPhoneDisplay(value: unknown) {
  const raw = String(value ?? "").trim();
  const digits = raw.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  const normalized = digits.startsWith("998") ? digits.slice(3) : digits;

  if (normalized.length !== 9) {
    return raw;
  }

  return `+998 ${normalized.slice(0, 2)} ${normalized.slice(2, 5)} ${normalized.slice(5, 7)} ${normalized.slice(7, 9)}`;
}

export function formatUzPhoneInput(value: unknown) {
  const digits = String(value ?? "").replace(/\D/g, "");
  const normalized = (digits.startsWith("998") ? digits.slice(3) : digits).slice(0, 9);
  const parts = [
    normalized.slice(0, 2),
    normalized.slice(2, 5),
    normalized.slice(5, 7),
    normalized.slice(7, 9),
  ].filter(Boolean);

  return parts.join(" ");
}
