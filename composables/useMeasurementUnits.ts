import type { MeasurementUnit } from "~/types/product-detail";
import type { MeasurementUnitPrecision } from "~/types/product-create";
import { useApi } from "~/composables/useApi";

export interface MeasurementUnitListResponse {
  count?: number;
  measurement_units?: MeasurementUnit[];
}

export interface DefaultMeasurementUnit {
  name: string;
  short_name: string;
}

export interface DefaultMeasurementUnitListResponse {
  measurement_units?: DefaultMeasurementUnit[];
}

export interface CreateMeasurementUnitPayload {
  company_id?: string;
  name: string;
  short_name: string;
  precision: MeasurementUnitPrecision;
}

export const MEASUREMENT_UNIT_PRECISION_OPTIONS: Array<{
  label: string;
  value: MeasurementUnitPrecision;
}> = [
  { label: "1 — целые", value: "1" },
  { label: ".0 — 1 знак после запятой", value: ".0" },
  { label: ".00 — 2 знака после запятой", value: ".00" },
  { label: ".000 — 3 знака после запятой", value: ".000" },
];

function unwrapList<T>(response: any, key: string): T[] {
  if (Array.isArray(response)) {
    return response as T[];
  }

  if (Array.isArray(response?.[key])) {
    return response[key] as T[];
  }

  if (Array.isArray(response?.data?.[key])) {
    return response.data[key] as T[];
  }

  return [];
}

function normalizeApiMessage(error: any, fallback: string) {
  const message = error?.data?.message ?? error?.response?._data?.message ?? error?.message;
  return Array.isArray(message) ? message.join(", ") : String(message || fallback);
}

export function useMeasurementUnits() {
  const { apiFetch } = useApi();

  async function fetchCompanyMeasurementUnits(input?: {
    companyId?: string;
    limit?: number;
    page?: number;
    name?: string;
  }) {
    try {
      const response = await apiFetch<MeasurementUnitListResponse>("/v2/measurement-unit", {
        method: "GET",
        query: {
          ...(input?.limit ? { limit: input.limit } : {}),
          ...(input?.page ? { page: input.page } : {}),
          ...(input?.name ? { name: input.name } : {}),
        },
      });

      return unwrapList<MeasurementUnit>(response, "measurement_units");
    } catch (error: any) {
      throw new Error(normalizeApiMessage(error, "Не удалось загрузить единицы измерения"));
    }
  }

  async function fetchDefaultMeasurementUnits() {
    try {
      const response = await apiFetch<DefaultMeasurementUnitListResponse>("/v2/default-measurement-unit", {
        method: "GET",
      });

      return unwrapList<DefaultMeasurementUnit>(response, "measurement_units");
    } catch (error: any) {
      throw new Error(normalizeApiMessage(error, "Не удалось загрузить стандартный справочник единиц"));
    }
  }

  async function createMeasurementUnit(payload: CreateMeasurementUnitPayload) {
    try {
      return await apiFetch<{ message?: string }>("/v2/measurement-unit", {
        method: "POST",
        body: {
          name: payload.name,
          short_name: payload.short_name,
          precision: payload.precision,
        },
      });
    } catch (error: any) {
      throw new Error(normalizeApiMessage(error, "Не удалось создать единицу измерения"));
    }
  }

  return {
    fetchCompanyMeasurementUnits,
    fetchDefaultMeasurementUnits,
    createMeasurementUnit,
  };
}
