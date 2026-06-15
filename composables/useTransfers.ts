import { useApi } from "~/composables/useApi";

export type TransferStatus = "draft" | "sent" | "accepted" | "cancelled";

export type TransferNamedEntity = {
  id: string;
  name: string;
};

export type TransferProductSnapshot = {
  id: string;
  name: string;
  article: string | null;
  barcode: string | null;
  departure_shop_measurement_value: {
    total_measurement_value: number;
  };
  arrival_shop_measurement_values: {
    total_measurement_value: number;
  };
  departure_shop_supply_price: number;
  departure_shop_retail_price: number;
  arrival_shop_retail_price: number;
};

export type TransferItem = {
  id: string;
  transfer_id: string;
  product_id: string;
  transfer_measurement_value: number;
  arrived_measurement_value: number;
  updated_at: string | null;
  product: TransferProductSnapshot | null;
  product_info?: any;
};

export type TransferDocument = {
  id: string;
  external_id: number;
  name: string;
  comment: string | null;
  departure_shop_id: string;
  arrival_shop_id: string;
  departure_shop: TransferNamedEntity | null;
  arrival_shop: TransferNamedEntity | null;
  status: TransferStatus;
  status_id: string;
  total_loaded_measurement_value: number;
  total_arrived_measurement_value: number;
  total_retail_price: number;
  total_supply_price: number;
  created_by: TransferNamedEntity | null;
  accepted_by: TransferNamedEntity | null;
  created_at: string | null;
  accepted_at: string | null;
  use_departure_shop_prices?: boolean;
  items?: TransferItem[];
};

export type TransferListResponse = {
  count: number;
  transfer: TransferDocument[];
};

export type TransferItemsResponse = {
  items: TransferItem[];
  count: number;
  total_measurement_value: number;
  total_transfer_value: number;
  total_supply_price: number;
  total_retail_price: number;
  fields?: any[];
};

export type TransferProductsQuery = {
  search?: string;
  limit?: number;
  page?: number;
  status?: string;
  statistics?: boolean;
  product_type_id?: string;
};

function asString(value: unknown) {
  return String(value ?? "").trim();
}

function asNullableString(value: unknown) {
  const normalized = asString(value);
  return normalized || null;
}

function asNumber(value: unknown) {
  return Number(value ?? 0) || 0;
}

function normalizeNamedEntity(raw: any): TransferNamedEntity | null {
  if (!raw) return null;
  const id = asString(raw.id ?? raw.shop_id ?? raw.user_id);
  const name = asString(raw.name ?? raw.title ?? raw.full_name);
  if (!id && !name) return null;
  return { id, name };
}

function normalizeProduct(raw: any): TransferProductSnapshot | null {
  if (!raw) return null;
  return {
    id: asString(raw.id ?? raw.public_id ?? raw.product_id),
    name: asString(raw.name ?? raw.title),
    article: asNullableString(raw.article),
    barcode: asNullableString(raw.barcode),
    departure_shop_measurement_value: {
      total_measurement_value: asNumber(raw?.departure_shop_measurement_value?.total_measurement_value),
    },
    arrival_shop_measurement_values: {
      total_measurement_value: asNumber(raw?.arrival_shop_measurement_values?.total_measurement_value),
    },
    departure_shop_supply_price: asNumber(raw?.departure_shop_supply_price),
    departure_shop_retail_price: asNumber(raw?.departure_shop_retail_price),
    arrival_shop_retail_price: asNumber(raw?.arrival_shop_retail_price),
  };
}

function normalizeTransferItem(raw: any): TransferItem {
  return {
    id: asString(raw?.id),
    transfer_id: asString(raw?.transfer_id),
    product_id: asString(raw?.product_id ?? raw?.product?.id),
    transfer_measurement_value: asNumber(raw?.transfer_measurement_value ?? raw?.quantity),
    arrived_measurement_value: asNumber(raw?.arrived_measurement_value ?? raw?.arrived_quantity),
    updated_at: asNullableString(raw?.updated_at),
    product: normalizeProduct(raw?.product),
    product_info: raw?.product_info ?? null,
  };
}

function normalizeTransferDocument(raw: any): TransferDocument {
  return {
    id: asString(raw?.id),
    external_id: asNumber(raw?.external_id),
    name: asString(raw?.name),
    comment: asNullableString(raw?.comment),
    departure_shop_id: asString(raw?.departure_shop_id ?? raw?.departureShopId ?? raw?.from_shop_id),
    arrival_shop_id: asString(raw?.arrival_shop_id ?? raw?.arrivalShopId ?? raw?.to_shop_id),
    departure_shop: normalizeNamedEntity(raw?.departure_shop),
    arrival_shop: normalizeNamedEntity(raw?.arrival_shop),
    status: (asString(raw?.status) as TransferStatus) || "draft",
    status_id: asString(raw?.status_id),
    total_loaded_measurement_value: asNumber(raw?.total_loaded_measurement_value),
    total_arrived_measurement_value: asNumber(raw?.total_arrived_measurement_value),
    total_retail_price: asNumber(raw?.total_retail_price),
    total_supply_price: asNumber(raw?.total_supply_price),
    created_by: normalizeNamedEntity(raw?.created_by),
    accepted_by: normalizeNamedEntity(raw?.accepted_by),
    created_at: asNullableString(raw?.created_at),
    accepted_at: asNullableString(raw?.accepted_at),
    use_departure_shop_prices: Boolean(raw?.use_departure_shop_prices),
    items: Array.isArray(raw?.items) ? raw.items.map((item: any) => normalizeTransferItem(item)) : undefined,
  };
}

function normalizeItemsResponse(raw: any): TransferItemsResponse {
  return {
    items: Array.isArray(raw?.items) ? raw.items.map((item: any) => normalizeTransferItem(item)) : [],
    count: asNumber(raw?.count),
    total_measurement_value: asNumber(raw?.total_measurement_value),
    total_transfer_value: asNumber(raw?.total_transfer_value),
    total_supply_price: asNumber(raw?.total_supply_price),
    total_retail_price: asNumber(raw?.total_retail_price),
    fields: Array.isArray(raw?.fields) ? raw.fields : [],
  };
}

export function useTransfers() {
  const { apiFetch } = useApi();

  const listTransfers = (query?: { limit?: number; page?: number }) =>
    apiFetch<any>("/v2/transfer", { method: "GET", query }).then((response) => ({
      count: asNumber(response?.count),
      transfer: Array.isArray(response?.transfer) ? response.transfer.map((item: any) => normalizeTransferDocument(item)) : [],
    }));

  const createTransfer = (payload: {
    departure_shop_id?: string;
    arrival_shop_id?: string;
    name: string;
    comment?: string | null;
    use_departure_shop_prices?: boolean;
  }) =>
    apiFetch<any>("/v2/transfer", {
      method: "POST",
      body: payload,
    }).then((response) => normalizeTransferDocument(response));

  const getTransfer = (id: string) =>
    apiFetch<any>(`/v2/transfer/${encodeURIComponent(id)}`, { method: "GET" }).then((response) =>
      normalizeTransferDocument(response),
    );

  const getTransferProducts = (transferId: string, query?: TransferProductsQuery) =>
    apiFetch<any>(`/v2/transfer-products/${encodeURIComponent(transferId)}`, {
      method: "GET",
      query,
    }).then((response) => normalizeItemsResponse(response));

  const getTransferItems = (transferId: string, query?: { search?: string; limit?: number; page?: number }) =>
    apiFetch<any>(`/v2/transfer-items/${encodeURIComponent(transferId)}`, {
      method: "GET",
      query,
    }).then((response) => normalizeItemsResponse(response));

  const upsertTransferItem = (transferId: string, payload: { product_id: string; transfer_measurement_value: number }) =>
    apiFetch<any>(`/v2/transfer/${encodeURIComponent(transferId)}/items`, {
      method: "POST",
      body: payload,
    }).then((response) => normalizeItemsResponse(response));

  const sendTransfer = (transferId: string) =>
    apiFetch<any>(`/v2/transfer/${encodeURIComponent(transferId)}/send`, {
      method: "POST",
    }).then((response) => normalizeTransferDocument(response));

  const acceptTransfer = (transferId: string) =>
    apiFetch<any>(`/v2/transfer/${encodeURIComponent(transferId)}/accept`, {
      method: "POST",
    }).then((response) => normalizeTransferDocument(response));

  const acceptTransferVerified = (
    transferId: string,
    items: { item_id: string; arrived_quantity: number }[],
  ) =>
    apiFetch<any>(`/v2/transfer/${encodeURIComponent(transferId)}/accept-verified`, {
      method: "POST",
      body: { items },
    }).then((response) => normalizeTransferDocument(response));

  const cancelTransfer = (transferId: string) =>
    apiFetch<any>(`/v2/transfer/${encodeURIComponent(transferId)}/cancel`, {
      method: "POST",
    }).then((response) => normalizeTransferDocument(response));

  const removeTransferItem = (transferId: string, productId: string) =>
    apiFetch<any>(`/v2/transfer/${encodeURIComponent(transferId)}/items`, {
      method: "POST",
      body: { product_id: productId, transfer_measurement_value: 0 },
    }).then((response) => normalizeItemsResponse(response));

  return {
    listTransfers,
    createTransfer,
    getTransfer,
    getTransferProducts,
    getTransferItems,
    upsertTransferItem,
    removeTransferItem,
    sendTransfer,
    acceptTransfer,
    acceptTransferVerified,
    cancelTransfer,
  };
}
