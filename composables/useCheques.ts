import { useApi } from "~/composables/useApi";

export type ChequeImage = {
  id?: string;
  file_name?: string;
  file_url?: string;
  container_height?: number;
  height?: number;
  width?: number;
  rotation?: number;
  x_axis?: number;
  y_axis?: number;
};

export type ChequeItem = {
  id?: string;
  cheque_id?: string;
  cheque_option_id?: string;
  product_characteristic_id?: string;
  cheque_option?: {
    id?: string;
    block_type?: string;
    name?: string;
    sequence_number?: number;
  };
  sequence_number?: number;
  is_active?: boolean;
  attribute_id?: string;
};

export type ChequeExtraSettings = {
  phone?: string;
  address?: string;
  workingHours?: string;
  website?: string;
  qrCodeUrl?: string;
  branchName?: string;
  taxId?: string;
  hasPhone?: boolean;
  hasAddress?: boolean;
  hasWorkingHours?: boolean;
  hasQrCode?: boolean;
  hasTaxId?: boolean;
  hasBranchName?: boolean;
  hasWebsite?: boolean;
  elementStyles?: Array<{
    id: string;
    label: string;
    fontSize: number;
    fontWeight: "normal" | "bold";
    visible: boolean;
    order: number;
  }>;
};

export type Cheque = {
  id: string;
  name: string;
  company_id?: string;
  has_logo?: boolean;
  logo_image?: ChequeImage;
  logo_url?: string;
  logo?: string;
  has_information_block?: boolean;
  has_additional_info?: boolean;
  has_lower_block?: boolean;
  display_text?: string;
  cheque_items?: ChequeItem[];
  has_bar_code?: boolean;
  is_default?: boolean;
  type?: "cheque" | string;
  has_additional_image?: boolean;
  additional_image?: ChequeImage;
  has_customer_debt?: boolean;
  has_customer_balance?: boolean;
  printed_with_billz?: boolean;
  width?: number;
  length?: number;
  x_axis?: number;
  y_axis?: number;
  rotation?: number;
  compact?: boolean;
  extra_settings?: ChequeExtraSettings | null;
};

export type ProductCharacteristic = {
  id: string;
  company_id?: string;
  name: string;
  system_name: string;
  is_editable?: boolean;
  visible_when_deleted?: boolean;
  is_deletable?: boolean;
  is_dynamic?: boolean;
  type?: "text" | string;
  deleted_at?: number;
};

export function useCheques() {
  const { apiFetch } = useApi();

  async function getCheques(params: { name?: string; limit?: number; page?: number }) {
    const query = new URLSearchParams({
      name: params.name ?? "",
      limit: String(params.limit ?? 100),
      page: String(params.page ?? 1),
    });

    const response: any = await apiFetch(`/v1/cheque?${query.toString()}`, {
      method: "GET",
    });

    return {
      cheques: Array.isArray(response?.cheques) ? response.cheques as Cheque[] : [],
      count: Number(response?.count ?? 0),
    };
  }

  async function getChequeById(id: string) {
    return await apiFetch<Cheque>(`/v1/cheque/${encodeURIComponent(id)}`, {
      method: "GET",
    });
  }

  async function getProductCharacteristics() {
    const response: any = await apiFetch("/v2/product-characteristic", {
      method: "GET",
      query: { limit: 1000 },
    });

    return {
      product_characteristics: Array.isArray(response?.product_characteristics)
        ? response.product_characteristics as ProductCharacteristic[]
        : [],
      active_count: Number(response?.active_count ?? 0),
      deleted_count: Number(response?.deleted_count ?? 0),
    };
  }

  async function createCheque(payload: Partial<Cheque>) {
    return await apiFetch<Cheque>("/v1/cheque", {
      method: "POST",
      body: payload,
    });
  }

  async function updateCheque(id: string, payload: Partial<Cheque>) {
    return await apiFetch<Cheque>(`/v1/cheque/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: payload,
    });
  }

  async function deleteCheque(id: string) {
    return await apiFetch<{ success: boolean; cheque: Cheque }>(
      `/v1/cheque/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
  }

  return {
    getCheques,
    getChequeById,
    getProductCharacteristics,
    createCheque,
    updateCheque,
    deleteCheque,
  };
}
