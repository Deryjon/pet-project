export interface ReportFavorite {
  id: string;
  title: string;
  description: string;
  route: string;
  createdAt: string;
}

const STORAGE_KEY = "report_favorites";

export function useReportFavorites() {
  function getAll(): ReportFavorite[] {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function save(fav: Omit<ReportFavorite, "id" | "createdAt">) {
    const all = getAll();
    all.push({
      ...fav,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }

  function remove(id: string) {
    const all = getAll().filter((f) => f.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }

  return { getAll, save, remove };
}
