import { useApi } from "~/composables/useApi";

export type ClientGender = "male" | "female" | "unknown";
export type ClientDebtStatus = "paid" | "partial" | "unpaid";
export type ClientCardType = "local" | "loyalty" | "discount" | "bonus";

export type NamedEntity = {
  id: string;
  name: string;
};

export type ClientListItem = {
  id: string;
  code: string;
  full_name: string;
  phone: string;
  groups: NamedEntity[];
  tags: NamedEntity[];
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
  stats: {
    total_clients: number;
    last_week_new_clients: number;
    non_returning_clients: number;
    birthdays_today_or_period: number;
  };
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
    first_name: string;
    last_name: string | null;
    middle_name: string | null;
    full_name: string;
    phone: string;
    gender: ClientGender;
    birth_date: string | null;
    marital_status: string | null;
    address: string | null;
    social_links: string[];
    relatives: string[];
    registration_shop: NamedEntity | null;
    registered_at: string;
    sms_notifications: boolean;
    phone_notifications: boolean;
    social_notifications: boolean;
    email_notifications: boolean;
    groups?: NamedEntity[];
    tags?: NamedEntity[];
  };
  dashboard: {
    balance_uzs: number;
    total_purchases_uzs: number;
    top_transaction_uzs: number;
    average_check_uzs: number;
    average_items_count: number;
    average_discount_percent: number;
    visits_count: number;
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
  type: "purchase" | "log";
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
  amount_uzs: number;
  remaining_amount_uzs: number;
  repaid_amount_uzs: number;
  due_date: string | null;
  status: ClientDebtStatus;
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
  };
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

  const listClients = (query: ClientListQuery) =>
    apiFetch<ClientsListResponse>("/clients", { method: "GET", query });

  const createClient = (payload: ClientUpsertPayload) =>
    apiFetch<{ id: string; full_name?: string; phone?: string; code?: string }>("/clients", {
      method: "POST",
      body: payload,
    });

  const getClientCard = (id: string) =>
    apiFetch<ClientCardResponse>(`/clients/${encodeURIComponent(id)}`, { method: "GET" });

  const getClientNotes = (id: string) =>
    apiFetch<ClientNote[]>(`/clients/${encodeURIComponent(id)}/notes`, { method: "GET" });

  const createClientNote = (id: string, text: string) =>
    apiFetch<ClientNote>(`/clients/${encodeURIComponent(id)}/notes`, {
      method: "POST",
      body: { text },
    });

  const getClientHistory = (
    id: string,
    query?: { from?: string; to?: string; type?: "all" | "purchase" | "log"; page?: number; limit?: number },
  ) =>
    apiFetch<ClientHistoryResponse>(`/clients/${encodeURIComponent(id)}/history`, {
      method: "GET",
      query,
    });

  const getClientPreferences = (id: string) =>
    apiFetch<ClientPreferenceItem[]>(`/clients/${encodeURIComponent(id)}/preferences`, {
      method: "GET",
    });

  const getClientDebts = (id: string) =>
    apiFetch<ClientDebtsResponse>(`/clients/${encodeURIComponent(id)}/debts`, {
      method: "GET",
    });

  const repayClientDebt = (id: string, debtId: string, amount_uzs: number) =>
    apiFetch<ClientDebtItem>(`/clients/${encodeURIComponent(id)}/debts/${encodeURIComponent(debtId)}/repayment`, {
      method: "POST",
      body: { amount_uzs },
    });

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
    createClient,
    getClientCard,
    getClientNotes,
    createClientNote,
    getClientHistory,
    getClientPreferences,
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
