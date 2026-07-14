import { useApi } from "~/composables/useApi";

export interface ReceiptItemData {
  name: string;
  sku: string;
  quantity: number;
  price: number;
  total: number;
}

export interface ReceiptData {
  id: string;
  saleId: number;
  shopId: string;
  number: string;
  status: "CREATED" | "PRINTED" | "SENT";
  createdAt: string;
  managerName: string;
  managerPhone: string;
  clientName: string;
  clientPhone: string;
  items: ReceiptItemData[];
  subtotal: number;
  discount: number;
  cashbackEarned: number;
  totalDue: number;
  paidCash: number;
  paidCard: number;
  paidCashback: number;
  debt: number;
  qrPayload: string;
}

export interface ReceiptElementStyle {
  id: string;
  label?: string;
  fontSize: number;
  fontWeight: "normal" | "bold";
  visible: boolean;
  order: number;
  marginBottom?: number;
}

export interface ReceiptSettingsData {
  shopId: string;
  showClientInfo: boolean;
  showManagerName: boolean;
  showManagerPhone: boolean;
  showCashback: boolean;
  showDebtLine: boolean;
  showQrCode: boolean;
  showItemIndex: boolean;
  paperWidth: number;
  fontSize: number;
  dividerStyle: "single" | "double" | "none";
  dividerGap: number;
  sectionGap: number;
  itemDividers: boolean;
  footerMessage: string;
  footerNote: string;
  hasLogo: boolean;
  logoUrl: string;
  hasBarCode: boolean;
  branchName: string;
  hasBranchName: boolean;
  address: string;
  hasAddress: boolean;
  phone: string;
  hasPhone: boolean;
  workingHours: string;
  hasWorkingHours: boolean;
  website: string;
  hasWebsite: boolean;
  taxId: string;
  hasTaxId: boolean;
  qrCodeUrl: string;
  hasCustomerDebt: boolean;
  hasCustomerBalance: boolean;
  elementStyles: ReceiptElementStyle[] | null;
}

function normalizeReceipt(raw: any): ReceiptData {
  return {
    id: String(raw?.id ?? ""),
    saleId: Number(raw?.sale_id ?? 0),
    shopId: String(raw?.shop_id ?? ""),
    number: String(raw?.number ?? ""),
    status: (raw?.status as ReceiptData["status"]) ?? "CREATED",
    createdAt: String(raw?.created_at ?? ""),
    managerName: String(raw?.manager_name ?? ""),
    managerPhone: String(raw?.manager_phone ?? ""),
    clientName: String(raw?.client_name ?? ""),
    clientPhone: String(raw?.client_phone ?? ""),
    items: Array.isArray(raw?.items)
      ? raw.items.map((item: any) => ({
          name: String(item?.name ?? ""),
          sku: String(item?.sku ?? ""),
          quantity: Number(item?.quantity ?? 0),
          price: Number(item?.price ?? 0),
          total: Number(item?.total ?? 0),
        }))
      : [],
    subtotal: Number(raw?.subtotal ?? 0),
    discount: Number(raw?.discount ?? 0),
    cashbackEarned: Number(raw?.cashback_earned ?? 0),
    totalDue: Number(raw?.total_due ?? 0),
    paidCash: Number(raw?.paid_cash ?? 0),
    paidCard: Number(raw?.paid_card ?? 0),
    paidCashback: Number(raw?.paid_cashback ?? 0),
    debt: Number(raw?.debt ?? 0),
    qrPayload: String(raw?.qr_payload ?? ""),
  };
}

function normalizeSettings(raw: any): ReceiptSettingsData {
  return {
    shopId: String(raw?.shop_id ?? ""),
    showClientInfo: Boolean(raw?.show_client_info ?? true),
    showManagerName: Boolean(raw?.show_manager_name ?? true),
    showManagerPhone: Boolean(raw?.show_manager_phone ?? false),
    showCashback: Boolean(raw?.show_cashback ?? true),
    showDebtLine: Boolean(raw?.show_debt_line ?? true),
    showQrCode: Boolean(raw?.show_qr_code ?? false),
    showItemIndex: Boolean(raw?.show_item_index ?? true),
    paperWidth: Number(raw?.paper_width ?? 80),
    fontSize: Number(raw?.font_size ?? 13),
    dividerStyle: (raw?.divider_style as ReceiptSettingsData["dividerStyle"]) ?? "single",
    dividerGap: Number(raw?.divider_gap ?? 8),
    sectionGap: Number(raw?.section_gap ?? 12),
    itemDividers: Boolean(raw?.item_dividers ?? false),
    footerMessage: String(raw?.footer_message ?? ""),
    footerNote: String(raw?.footer_note ?? ""),
    hasLogo: Boolean(raw?.has_logo ?? false),
    logoUrl: String(raw?.logo_url ?? ""),
    hasBarCode: Boolean(raw?.has_bar_code ?? false),
    branchName: String(raw?.branch_name ?? ""),
    hasBranchName: Boolean(raw?.has_branch_name ?? false),
    address: String(raw?.address ?? ""),
    hasAddress: Boolean(raw?.has_address ?? false),
    phone: String(raw?.phone ?? ""),
    hasPhone: Boolean(raw?.has_phone ?? false),
    workingHours: String(raw?.working_hours ?? ""),
    hasWorkingHours: Boolean(raw?.has_working_hours ?? false),
    website: String(raw?.website ?? ""),
    hasWebsite: Boolean(raw?.has_website ?? false),
    taxId: String(raw?.tax_id ?? ""),
    hasTaxId: Boolean(raw?.has_tax_id ?? false),
    qrCodeUrl: String(raw?.qr_code_url ?? ""),
    hasCustomerDebt: Boolean(raw?.has_customer_debt ?? false),
    hasCustomerBalance: Boolean(raw?.has_customer_balance ?? false),
    elementStyles: Array.isArray(raw?.element_styles) ? raw.element_styles : null,
  };
}

export function toReceiptSettingsPatch(settings: Partial<ReceiptSettingsData>): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (settings.showClientInfo !== undefined) patch.show_client_info = settings.showClientInfo;
  if (settings.showManagerName !== undefined) patch.show_manager_name = settings.showManagerName;
  if (settings.showManagerPhone !== undefined) patch.show_manager_phone = settings.showManagerPhone;
  if (settings.showCashback !== undefined) patch.show_cashback = settings.showCashback;
  if (settings.showDebtLine !== undefined) patch.show_debt_line = settings.showDebtLine;
  if (settings.showQrCode !== undefined) patch.show_qr_code = settings.showQrCode;
  if (settings.showItemIndex !== undefined) patch.show_item_index = settings.showItemIndex;
  if (settings.paperWidth !== undefined) patch.paper_width = settings.paperWidth;
  if (settings.fontSize !== undefined) patch.font_size = settings.fontSize;
  if (settings.dividerStyle !== undefined) patch.divider_style = settings.dividerStyle;
  if (settings.dividerGap !== undefined) patch.divider_gap = settings.dividerGap;
  if (settings.sectionGap !== undefined) patch.section_gap = settings.sectionGap;
  if (settings.itemDividers !== undefined) patch.item_dividers = settings.itemDividers;
  if (settings.footerMessage !== undefined) patch.footer_message = settings.footerMessage;
  if (settings.footerNote !== undefined) patch.footer_note = settings.footerNote;
  if (settings.hasLogo !== undefined) patch.has_logo = settings.hasLogo;
  if (settings.logoUrl !== undefined) patch.logo_url = settings.logoUrl;
  if (settings.hasBarCode !== undefined) patch.has_bar_code = settings.hasBarCode;
  if (settings.branchName !== undefined) patch.branch_name = settings.branchName;
  if (settings.hasBranchName !== undefined) patch.has_branch_name = settings.hasBranchName;
  if (settings.address !== undefined) patch.address = settings.address;
  if (settings.hasAddress !== undefined) patch.has_address = settings.hasAddress;
  if (settings.phone !== undefined) patch.phone = settings.phone;
  if (settings.hasPhone !== undefined) patch.has_phone = settings.hasPhone;
  if (settings.workingHours !== undefined) patch.working_hours = settings.workingHours;
  if (settings.hasWorkingHours !== undefined) patch.has_working_hours = settings.hasWorkingHours;
  if (settings.website !== undefined) patch.website = settings.website;
  if (settings.hasWebsite !== undefined) patch.has_website = settings.hasWebsite;
  if (settings.taxId !== undefined) patch.tax_id = settings.taxId;
  if (settings.hasTaxId !== undefined) patch.has_tax_id = settings.hasTaxId;
  if (settings.qrCodeUrl !== undefined) patch.qr_code_url = settings.qrCodeUrl;
  if (settings.hasCustomerDebt !== undefined) patch.has_customer_debt = settings.hasCustomerDebt;
  if (settings.hasCustomerBalance !== undefined) patch.has_customer_balance = settings.hasCustomerBalance;
  if (settings.elementStyles !== undefined) patch.element_styles = settings.elementStyles;
  return patch;
}

export function useReceipts() {
  const { apiFetch } = useApi();

  async function fetchReceipt(saleId: number | string): Promise<ReceiptData> {
    const res = await apiFetch(`/receipts/${saleId}`, { method: "GET" });
    return normalizeReceipt(res);
  }

  async function fetchReceiptByNumber(number: string): Promise<ReceiptData> {
    const res = await apiFetch(`/receipts/by-number/${encodeURIComponent(number)}`, {
      method: "GET",
    });
    return normalizeReceipt(res);
  }

  async function fetchReceiptSettings(shopId: string): Promise<ReceiptSettingsData> {
    const res = await apiFetch(`/receipt-settings/${encodeURIComponent(shopId)}`, {
      method: "GET",
    });
    return normalizeSettings(res);
  }

  async function updateReceiptSettings(
    shopId: string,
    patch: Partial<ReceiptSettingsData>,
  ): Promise<ReceiptSettingsData> {
    const res = await apiFetch(`/receipt-settings/${encodeURIComponent(shopId)}`, {
      method: "PUT",
      body: toReceiptSettingsPatch(patch),
    });
    return normalizeSettings(res);
  }

  async function markPrinted(saleId: number | string) {
    return apiFetch(`/receipts/${saleId}/mark-printed`, { method: "POST" });
  }

  return {
    fetchReceipt,
    fetchReceiptByNumber,
    fetchReceiptSettings,
    updateReceiptSettings,
    markPrinted,
  };
}
