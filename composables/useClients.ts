import { useApi } from "~/composables/useApi";

export type ClientGender = "male" | "female" | "unknown";
export type ClientDebtStatus = "paid" | "partial" | "unpaid";
export type ClientDebtBucket = "overdue" | "unpaid" | "partial" | "paid";
export type ClientCardType = "local" | "loyalty" | "discount" | "bonus";

export type NamedEntity = {
  id: string;
  name: string;
};

export type ClientListItem = {
  id: string;
  external_id?: string;
  code: string;
  full_name: string;
  phone: string;
  groups: NamedEntity[];
  tags: NamedEntity[];
  group_names?: string[];
  tag_names?: string[];
  gender: ClientGender;
  total_purchases_uzs: number;
  last_purchase_at: string | null;
  birth_date: string | null;
  registered_at: string;
  registration_shop: NamedEntity | null;
  balance_uzs: number;
  debt_uzs: number;
  visits_count: number;
};

export type ClientsListResponse = {
  items: ClientListItem[];
  page: number;
  limit: number;
  total: number;
};

export type ClientStatsResponse = {
  last_week_count: number;
  not_returned_count: number;
  birthday_count: number;
};

export type ClientListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  group_ids?: string[];
  tag_ids?: string[];
  birth_date_from?: string;
  birth_date_to?: string;
  registered_from?: string;
  registered_to?: string;
  registration_shop_ids?: string[];
  gender?: ClientGender;
  total_purchases_from?: number;
  total_purchases_to?: number;
  last_purchase_from?: string;
  last_purchase_to?: string;
  no_purchase_months?: number;
};

export type ClientCardResponse = {
  client: {
    id: string;
    code: string;
    external_id?: string;
    first_name: string;
    last_name: string | null;
    middle_name: string | null;
    full_name: string;
    phone: string;
    phone_numbers: string[];
    gender: ClientGender;
    birth_date: string | null;
    marital_status: string | null;
    address: string | null;
    social_links: string[];
    social_networks: string[];
    relatives: string[];
    registration_shop: NamedEntity | null;
    registered_at: string;
    sms_notifications: boolean;
    phone_notifications: boolean;
    social_notifications: boolean;
    email_notifications: boolean;
    groups?: NamedEntity[];
    tags?: NamedEntity[];
    tag_names?: string[];
    cards?: ClientCardItem[];
    balance_uzs: number;
    debt_uzs: number;
    first_purchase_date: string | null;
    last_purchase_date: string | null;
  };
  dashboard: {
    balance_uzs: number;
    debt_uzs: number;
    total_purchases_uzs: number;
    top_transaction_uzs: number;
    average_check_uzs: number;
    average_products_price_uzs: number;
    average_items_count: number;
    average_discount_percent: number;
    visits_count: number;
    first_purchase_date: string | null;
    last_purchase_date: string | null;
  };
};

export type ClientNote = {
  id: string;
  client_id: string;
  text: string;
  created_by: { id: string; name: string } | null;
  created_at: string;
};

export type ClientHistoryItem = {
  id: string;
  client_id: string;
  type: string;
  title: string;
  description: string | null;
  happened_at: string;
  amount_uzs: number | null;
  order_id: string | null;
};

export type ClientHistoryResponse = {
  items: ClientHistoryItem[];
  page: number;
  limit: number;
  total: number;
};

export type ClientPreferenceItem = {
  product_id: string;
  product_name: string;
  barcode: string | null;
  image_url: string | null;
  purchase_count: number;
  last_purchased_at: string | null;
};

export type ClientDebtItem = {
  id: string;
  client_id: string;
  client?: {
    id: string;
    full_name: string;
    phone: string;
  } | null;
  sale_id?: number | string | null;
  sale?: {
    id: string;
    number: string;
  } | null;
  amount_uzs: number;
  remaining_amount_uzs: number;
  repaid_amount_uzs: number;
  due_date: string | null;
  status: ClientDebtStatus;
  is_overdue: boolean;
  bucket: ClientDebtBucket;
  comment?: string | null;
  shop: NamedEntity | null;
  created_at: string;
  receipt_url: string | null;
};

export type ClientDebtsResponse = {
  items: ClientDebtItem[];
  summary: {
    active_debt_uzs: number;
    total_repaid_uzs: number;
    total_debt_uzs: number;
    all_count: number;
    overdue_count: number;
    unpaid_count: number;
    partial_count: number;
    paid_count: number;
  };
  page?: number;
  limit?: number;
  total?: number;
};

export type ClientDebtsQuery = {
  status?: "all" | ClientDebtBucket;
  bucket?: "all" | ClientDebtBucket;
  page?: number;
  limit?: number;
  client_id?: string;
  shop_id?: string;
  created_from?: string;
  created_to?: string;
  due_from?: string;
  due_to?: string;
};

export type ClientCardItem = {
  id: string;
  client_id: string;
  type: ClientCardType;
  number: string;
  is_active: boolean;
  issued_at: string | null;
  expires_at: string | null;
};

export type ClientFiltersResponse = {
  groups: NamedEntity[];
  tags: NamedEntity[];
  shops: NamedEntity[];
  genders: ClientGender[];
};

export type ClientUpsertPayload = {
  first_name: string;
  last_name?: string;
  middle_name?: string;
  phone: string;
  gender: ClientGender;
  birth_date?: string;
  marital_status?: string;
  address?: string;
  social_links?: string[];
  relatives?: string[];
  registration_shop_id?: string;
  registered_at?: string;
  group_ids?: string[];
  tag_ids?: string[];
  balance_uzs?: number;
  total_purchases_uzs?: number;
  last_purchase_at?: string | null;
  visits_count?: number;
  sms_notifications?: boolean;
  phone_notifications?: boolean;
  social_notifications?: boolean;
  email_notifications?: boolean;
};

export function useClients() {
  const { apiFetch } = useApi();

  const asString = (value: unknown) => String(value ?? "").trim();
  const asNullableString = (value: unknown) => {
    const normalized = asString(value);
    return normalized || null;
  };
  const asNumber = (value: unknown) => Number(value ?? 0) || 0;

  function normalizeNamedEntity(value: any): NamedEntity | null {
    if (!value) return null;
    const id = asString(value.id ?? value.uuid ?? value.external_id);
    const name = asString(value.name ?? value.title ?? value.full_name);
    if (!id && !name) return null;
    return { id, name };
  }

  function normalizeNamedEntities(value: any): NamedEntity[] {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => normalizeNamedEntity(item))
      .filter((item): item is NamedEntity => Boolean(item));
  }

  function normalizeClientGender(value: unknown): ClientGender {
    const normalized = asString(value).toLowerCase();
    if (normalized === "male" || normalized === "female") return normalized;
    return "unknown";
  }

  function normalizePhoneNumbers(value: any): string[] {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => {
        if (typeof item === "string") return asString(item);
        return asString(item?.phone ?? item?.value ?? item?.number);
      })
      .filter(Boolean);
  }

  function normalizeClientCardItem(value: any): ClientCardItem | null {
    if (!value) return null;
    const id = asString(value.id ?? value.uuid);
    const number = asString(value.number ?? value.card_number);
    if (!id && !number) return null;
    const typeValue = asString(value.type).toLowerCase();
    const type: ClientCardType =
      typeValue === "loyalty" || typeValue === "discount" || typeValue === "bonus" ? typeValue : "local";
    return {
      id: id || number,
      client_id: asString(value.client_id ?? value.customer_id),
      type,
      number,
      is_active: Boolean(value.is_active ?? value.active ?? true),
      issued_at: asNullableString(value.issued_at),
      expires_at: asNullableString(value.expires_at),
    };
  }

  function normalizeClientListItem(raw: any): ClientListItem {
    const firstName = asString(raw?.first_name);
    const lastName = asString(raw?.last_name);
    const middleName = asString(raw?.middle_name);
    const fullName =
      asString(raw?.full_name) ||
      [lastName, firstName, middleName].filter(Boolean).join(" ").trim() ||
      asString(raw?.name);
    const phoneNumbers = normalizePhoneNumbers(raw?.phone_numbers);
    const groups = normalizeNamedEntities(raw?.groups);
    const tags = normalizeNamedEntities(raw?.tags);
    const groupNames = Array.isArray(raw?.group_names) ? raw.group_names.map((item: unknown) => asString(item)).filter(Boolean) : [];
    const tagNames = Array.isArray(raw?.tag_names) ? raw.tag_names.map((item: unknown) => asString(item)).filter(Boolean) : [];
    return {
      id: asString(raw?.id ?? raw?.customer_id),
      external_id: asString(raw?.external_id) || undefined,
      code: asString(raw?.external_id ?? raw?.code),
      full_name: fullName,
      phone: phoneNumbers[0] || asString(raw?.phone),
      groups,
      tags,
      group_names: groupNames,
      tag_names: tagNames,
      gender: normalizeClientGender(raw?.gender),
      total_purchases_uzs: asNumber(raw?.purchase_amount ?? raw?.total_purchases_uzs),
      last_purchase_at: asNullableString(raw?.last_purchase_date ?? raw?.last_purchase_at),
      birth_date: asNullableString(raw?.date_of_birth ?? raw?.birth_date),
      registered_at: asString(raw?.created_at ?? raw?.registered_at),
      registration_shop: normalizeNamedEntity(raw?.registered_shop ?? raw?.registration_shop),
      balance_uzs: asNumber(raw?.balance ?? raw?.balance_uzs),
      debt_uzs: asNumber(raw?.debt_amount ?? raw?.debt_uzs),
      visits_count: asNumber(raw?.visits_count),
    };
  }

  function normalizeClientCardResponse(raw: any): ClientCardResponse {
    const client = raw?.client ?? raw ?? {};
    const firstName = asString(client?.first_name);
    const lastName = asString(client?.last_name);
    const middleName = asString(client?.middle_name);
    const fullName =
      asString(client?.full_name) || [lastName, firstName, middleName].filter(Boolean).join(" ").trim() || asString(client?.name);
    const phoneNumbers = normalizePhoneNumbers(client?.phone_numbers);
    const groups = normalizeNamedEntities(client?.groups);
    const tags = normalizeNamedEntities(client?.tags);
    const tagNames = Array.isArray(client?.tag_names) ? client.tag_names.map((item: unknown) => asString(item)).filter(Boolean) : [];
    const cards = Array.isArray(client?.cards)
      ? client.cards.map((item: any) => normalizeClientCardItem(item)).filter((item: ClientCardItem | null): item is ClientCardItem => Boolean(item))
      : [];

    return {
      client: {
        id: asString(client?.id),
        code: asString(client?.external_id ?? client?.code),
        external_id: asString(client?.external_id) || undefined,
        first_name: firstName,
        last_name: asNullableString(client?.last_name),
        middle_name: asNullableString(client?.middle_name),
        full_name: fullName,
        phone: phoneNumbers[0] || asString(client?.phone),
        phone_numbers: phoneNumbers,
        gender: normalizeClientGender(client?.gender),
        birth_date: asNullableString(client?.date_of_birth ?? client?.birth_date),
        marital_status: asNullableString(client?.marital_status),
        address: asNullableString(client?.address),
        social_links: Array.isArray(client?.social_networks ?? client?.social_links) ? (client.social_networks ?? client.social_links).map((item: unknown) => asString(item)).filter(Boolean) : [],
        social_networks: Array.isArray(client?.social_networks ?? client?.social_links) ? (client.social_networks ?? client.social_links).map((item: unknown) => asString(item)).filter(Boolean) : [],
        relatives: Array.isArray(client?.relatives) ? client.relatives.map((item: unknown) => asString(item)).filter(Boolean) : [],
        registration_shop: normalizeNamedEntity(client?.registered_shop ?? client?.registration_shop),
        registered_at: asString(client?.created_at ?? client?.registered_at),
        sms_notifications: Boolean(client?.sms_notification ?? client?.sms_notifications),
        phone_notifications: Boolean(client?.phone_notification ?? client?.phone_notifications),
        social_notifications: Boolean(client?.social_network_notification ?? client?.social_notifications),
        email_notifications: Boolean(client?.email_notification ?? client?.email_notifications),
        groups,
        tags,
        tag_names: tagNames,
        cards,
        balance_uzs: asNumber(client?.balance ?? client?.balance_uzs),
        debt_uzs: asNumber(client?.debt_amount ?? client?.debt_uzs),
        first_purchase_date: asNullableString(client?.first_purchase_date),
        last_purchase_date: asNullableString(client?.last_purchase_date),
      },
      dashboard: {
        balance_uzs: asNumber(client?.balance ?? client?.balance_uzs),
        debt_uzs: asNumber(client?.debt_amount ?? client?.debt_uzs),
        total_purchases_uzs: asNumber(client?.purchase_amount ?? client?.total_purchases_uzs),
        top_transaction_uzs: asNumber(client?.top_transaction ?? client?.top_transaction_uzs),
        average_check_uzs: asNumber(client?.average_purchase_amount ?? client?.average_check_uzs),
        average_products_price_uzs: asNumber(client?.average_products_price ?? client?.average_products_price_uzs),
        average_items_count: asNumber(client?.average_products_count ?? client?.average_items_count),
        average_discount_percent: asNumber(client?.average_discount ?? client?.average_discount_percent),
        visits_count: asNumber(client?.visits_count),
        first_purchase_date: asNullableString(client?.first_purchase_date),
        last_purchase_date: asNullableString(client?.last_purchase_date),
      },
    };
  }

  function normalizeClientHistoryItem(raw: any): ClientHistoryItem {
    return {
      id: asString(raw?.id ?? raw?.uuid),
      client_id: asString(raw?.client_id ?? raw?.customer_id),
      type: asString(raw?.type ?? raw?.event_type),
      title: asString(raw?.title ?? raw?.event_name ?? raw?.type),
      description: asNullableString(raw?.description ?? raw?.text ?? raw?.comment),
      happened_at: asString(raw?.happened_at ?? raw?.created_at ?? raw?.date),
      amount_uzs: raw?.amount_uzs == null ? null : asNumber(raw?.amount_uzs),
      order_id: asNullableString(raw?.order_id ?? raw?.sale_id),
    };
  }

  function normalizeClientDebtItem(raw: any): ClientDebtItem {
    return {
      id: asString(raw?.id),
      client_id: asString(raw?.client_id),
      client: raw?.client
        ? {
            id: asString(raw.client.id),
            full_name: asString(raw.client.full_name),
            phone: asString(raw.client.phone),
          }
        : null,
      sale_id: raw?.sale_id ?? null,
      sale: raw?.sale
        ? {
            id: asString(raw.sale.id),
            number: asString(raw.sale.number),
          }
        : null,
      amount_uzs: asNumber(raw?.amount_uzs),
      remaining_amount_uzs: asNumber(raw?.remaining_amount_uzs),
      repaid_amount_uzs: asNumber(raw?.repaid_amount_uzs),
      due_date: asNullableString(raw?.due_date),
      status: (asString(raw?.status) as ClientDebtStatus) || "unpaid",
      is_overdue: Boolean(raw?.is_overdue),
      bucket: (asString(raw?.bucket) as ClientDebtBucket) || "unpaid",
      comment: asNullableString(raw?.comment),
      shop: normalizeNamedEntity(raw?.shop),
      created_at: asString(raw?.created_at),
      receipt_url: asNullableString(raw?.receipt_url),
    };
  }

  const listClients = (query: ClientListQuery) =>
    apiFetch<any>("/v1/customers-list", { method: "GET", query }).then((response) => ({
      items: Array.isArray(response?.customers) ? response.customers.map((item: any) => normalizeClientListItem(item)) : [],
      page: Number(query?.page ?? 1),
      limit: Number(query?.limit ?? 10),
      total: asNumber(response?.count),
    }));

  const getClientStats = () =>
    apiFetch<any>("/v1/customers-stats", { method: "GET" }).then((response) => ({
      last_week_count: asNumber(response?.last_week_count),
      not_returned_count: asNumber(response?.not_returned_count),
      birthday_count: asNumber(response?.birthday_count),
    }));

  const createClient = (payload: ClientUpsertPayload) =>
    apiFetch<{ id: string; full_name?: string; phone?: string; code?: string }>("/clients", {
      method: "POST",
      body: payload,
    });

  const getClientCard = (id: string) =>
    apiFetch<any>(`/v1/customer/${encodeURIComponent(id)}`, { method: "GET" }).then((response) =>
      normalizeClientCardResponse(response),
    );

  const getClientNotes = (id: string) =>
    apiFetch<ClientNote[]>(`/clients/${encodeURIComponent(id)}/notes`, { method: "GET" });

  const createClientNote = (id: string, text: string) =>
    apiFetch<ClientNote>(`/clients/${encodeURIComponent(id)}/notes`, {
      method: "POST",
      body: { text },
    });

  const getClientHistory = (
    id: string,
    query?: { page?: number; limit?: number },
  ) =>
    apiFetch<any>(`/clients/${encodeURIComponent(id)}/history`, {
      method: "GET",
      query,
    }).then((response) => ({
      items: Array.isArray(response?.items) ? response.items.map((item: any) => normalizeClientHistoryItem(item)) : [],
      page: asNumber(response?.page),
      limit: asNumber(response?.limit),
      total: asNumber(response?.total),
    }));

  const getClientPreferences = (id: string) =>
    apiFetch<ClientPreferenceItem[]>(`/clients/${encodeURIComponent(id)}/preferences`, {
      method: "GET",
    });

  const getClientDebts = (id: string, query?: Record<string, unknown>) =>
    apiFetch<any>(`/clients/${encodeURIComponent(id)}/debts`, {
      method: "GET",
      query,
    }).then((response) => ({
      items: Array.isArray(response?.items) ? response.items.map((item: any) => normalizeClientDebtItem(item)) : [],
      summary: {
        active_debt_uzs: asNumber(response?.summary?.active_debt_uzs),
        total_repaid_uzs: asNumber(response?.summary?.total_repaid_uzs),
        total_debt_uzs: asNumber(response?.summary?.total_debt_uzs),
        all_count: asNumber(response?.summary?.all_count),
        overdue_count: asNumber(response?.summary?.overdue_count),
        unpaid_count: asNumber(response?.summary?.unpaid_count),
        partial_count: asNumber(response?.summary?.partial_count),
        paid_count: asNumber(response?.summary?.paid_count),
      },
      page: response?.page == null ? undefined : asNumber(response?.page),
      limit: response?.limit == null ? undefined : asNumber(response?.limit),
      total: response?.total == null ? undefined : asNumber(response?.total),
    }));

  const listClientDebts = (query?: ClientDebtsQuery) =>
    apiFetch<any>("/clients/debts", {
      method: "GET",
      query,
    }).then((response) => ({
      items: Array.isArray(response?.items) ? response.items.map((item: any) => normalizeClientDebtItem(item)) : [],
      summary: {
        active_debt_uzs: asNumber(response?.summary?.active_debt_uzs),
        total_repaid_uzs: asNumber(response?.summary?.total_repaid_uzs),
        total_debt_uzs: asNumber(response?.summary?.total_debt_uzs),
        all_count: asNumber(response?.summary?.all_count),
        overdue_count: asNumber(response?.summary?.overdue_count),
        unpaid_count: asNumber(response?.summary?.unpaid_count),
        partial_count: asNumber(response?.summary?.partial_count),
        paid_count: asNumber(response?.summary?.paid_count),
      },
      page: response?.page == null ? undefined : asNumber(response?.page),
      limit: response?.limit == null ? undefined : asNumber(response?.limit),
      total: response?.total == null ? undefined : asNumber(response?.total),
    }));

  const repayClientDebt = (id: string, debtId: string, amount_uzs: number) =>
    apiFetch<any>(`/clients/${encodeURIComponent(id)}/debts/${encodeURIComponent(debtId)}/repayment`, {
      method: "POST",
      body: { amount_uzs },
    }).then((response) => normalizeClientDebtItem(response));

  const getClientCards = (id: string) =>
    apiFetch<ClientCardItem[]>(`/clients/${encodeURIComponent(id)}/cards`, {
      method: "GET",
    });

  const createClientCard = (
    id: string,
    payload: {
      type?: ClientCardType;
      number: string;
      is_active?: boolean;
      issued_at?: string | null;
      expires_at?: string | null;
    },
  ) =>
    apiFetch<ClientCardItem>(`/clients/${encodeURIComponent(id)}/cards`, {
      method: "POST",
      body: payload,
    });

  const getClientFilters = () =>
    apiFetch<ClientFiltersResponse>("/clients/filters", {
      method: "GET",
    });

  const getClientGroups = () =>
    apiFetch<NamedEntity[]>("/client-groups", {
      method: "GET",
    });

  const getClientTags = () =>
    apiFetch<NamedEntity[]>("/client-tags", {
      method: "GET",
    });

  const updateClient = (id: string, payload: ClientUpsertPayload) =>
    apiFetch(`/clients/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: payload,
    });

  const deleteClient = (id: string) =>
    apiFetch(`/clients/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

  return {
    listClients,
    getClientStats,
    createClient,
    getClientCard,
    getClientNotes,
    createClientNote,
    getClientHistory,
    getClientPreferences,
    listClientDebts,
    getClientDebts,
    repayClientDebt,
    getClientCards,
    createClientCard,
    getClientFilters,
    getClientGroups,
    getClientTags,
    updateClient,
    deleteClient,
  };
}
