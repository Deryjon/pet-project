import { useApi } from "~/composables/useApi";

export interface ReceiptItemData {
  name: string;
  sku: string;
  quantity: number;
  price: number;
  total: number;
  discount: number;
  discountPercent: number;
}

export interface ReceiptShopInfo {
  name: string;
  address: string;
  phone: string;
  workingHours: string;
  facebook: string;
  instagram: string;
  telegram: string;
  website: string;
}

export interface ReceiptCompanyInfo {
  legalName: string;
  taxId: string;
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
  sellerName: string;
  clientName: string;
  clientPhone: string;
  saleComment: string;
  items: ReceiptItemData[];
  subtotal: number;
  discount: number;
  discountPercent: number;
  cashbackEarned: number;
  totalDue: number;
  paidCash: number;
  paidCard: number;
  paidCashback: number;
  debt: number;
  balanceBefore: number;
  balanceAdded: number;
  balanceDeducted: number;
  balanceAfter: number;
  debtBefore: number;
  debtAdded: number;
  debtPaid: number;
  debtAfter: number;
  qrPayload: string;
  shop: ReceiptShopInfo | null;
  company: ReceiptCompanyInfo;
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

export type ChequeBlockType = "information_block" | "lower_block" | "customer_balance" | "customer_debt";

export interface ChequeBlock {
  key: string;
  blockType: ChequeBlockType;
  name: string;
  sequenceNumber: number;
  isActive: boolean;
}

export interface ChequeTemplateSummary {
  id: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReceiptSettingsData {
  id: string;
  name: string;
  isDefault: boolean;
  hasInformationBlock: boolean;
  hasLowerBlock: boolean;
  paperWidth: number;
  fontSize: number;
  dividerStyle: "single" | "double" | "none";
  dividerGap: number;
  sectionGap: number;
  itemDividers: boolean;
  hasLogo: boolean;
  logoUrl: string;
  hasAdditionalImage: boolean;
  additionalImageUrl: string;
  footerMessage: string;
  footerNote: string;
  qrCodeUrl: string;
  elementStyles: ReceiptElementStyle[] | null;
  blocks: ChequeBlock[];
}

// Mirrors the server-side defaults in cheque-blocks.constant.ts — used only
// as an offline fallback when the settings request itself fails.
const DEFAULT_BLOCKS: ChequeBlock[] = [
  { key: "shop_name", blockType: "information_block", name: "Название магазина", sequenceNumber: 10, isActive: true },
  { key: "date", blockType: "information_block", name: "Дата и время", sequenceNumber: 20, isActive: true },
  { key: "working_hours", blockType: "information_block", name: "Часы работы", sequenceNumber: 30, isActive: false },
  { key: "seller", blockType: "information_block", name: "Продавец", sequenceNumber: 35, isActive: false },
  { key: "cashier", blockType: "information_block", name: "Кассир", sequenceNumber: 40, isActive: true },
  { key: "cashier_phone", blockType: "information_block", name: "Телефон кассира", sequenceNumber: 50, isActive: false },
  { key: "client", blockType: "information_block", name: "Клиент", sequenceNumber: 60, isActive: true },
  { key: "client_phone", blockType: "information_block", name: "Телефон клиента", sequenceNumber: 70, isActive: true },
  { key: "sale_comment", blockType: "information_block", name: "Комментарий к продаже", sequenceNumber: 75, isActive: false },
  { key: "contacts", blockType: "information_block", name: "Контакты магазина", sequenceNumber: 80, isActive: false },
  { key: "address", blockType: "information_block", name: "Адрес", sequenceNumber: 90, isActive: false },
  { key: "legal_name", blockType: "information_block", name: "Юридическое лицо", sequenceNumber: 100, isActive: false },
  { key: "tax_id", blockType: "information_block", name: "ИНН", sequenceNumber: 110, isActive: false },
  { key: "show_products", blockType: "information_block", name: "Показывать товары", sequenceNumber: 120, isActive: true },
  { key: "item_index", blockType: "information_block", name: "Нумерация товаров", sequenceNumber: 130, isActive: true },
  { key: "item_discounts", blockType: "information_block", name: "Скидки на товары", sequenceNumber: 140, isActive: false },
  { key: "item_sums", blockType: "information_block", name: "Суммы по товарам", sequenceNumber: 150, isActive: true },
  { key: "item_count", blockType: "information_block", name: "Количество товаров в чеке", sequenceNumber: 160, isActive: false },
  { key: "receipt_discount", blockType: "information_block", name: "Скидка на чек", sequenceNumber: 170, isActive: true },
  { key: "receipt_sum", blockType: "information_block", name: "Итоговая сумма чека", sequenceNumber: 180, isActive: true },
  { key: "cashback", blockType: "information_block", name: "Кешбек", sequenceNumber: 190, isActive: true },
  { key: "qr_code", blockType: "information_block", name: "QR-код", sequenceNumber: 200, isActive: false },
  { key: "balance_before", blockType: "customer_balance", name: "Баланс до покупки", sequenceNumber: 210, isActive: false },
  { key: "balance_added", blockType: "customer_balance", name: "Начислено на баланс", sequenceNumber: 220, isActive: false },
  { key: "balance_deducted", blockType: "customer_balance", name: "Списано с баланса", sequenceNumber: 230, isActive: false },
  { key: "balance_after", blockType: "customer_balance", name: "Баланс после покупки", sequenceNumber: 240, isActive: false },
  { key: "debt_before", blockType: "customer_debt", name: "Долг до покупки", sequenceNumber: 250, isActive: false },
  { key: "debt_added", blockType: "customer_debt", name: "Добавлено к долгу", sequenceNumber: 260, isActive: false },
  { key: "debt_paid", blockType: "customer_debt", name: "Погашено долга", sequenceNumber: 270, isActive: false },
  { key: "debt_after", blockType: "customer_debt", name: "Долг после покупки", sequenceNumber: 280, isActive: false },
  { key: "barcode", blockType: "lower_block", name: "Штрих-код", sequenceNumber: 290, isActive: false },
  { key: "facebook", blockType: "lower_block", name: "Facebook", sequenceNumber: 300, isActive: false },
  { key: "instagram", blockType: "lower_block", name: "Instagram", sequenceNumber: 310, isActive: false },
  { key: "telegram", blockType: "lower_block", name: "Telegram", sequenceNumber: 320, isActive: false },
  { key: "website", blockType: "lower_block", name: "Сайт", sequenceNumber: 330, isActive: false },
  { key: "footer_message", blockType: "lower_block", name: "Текст благодарности", sequenceNumber: 340, isActive: true },
  { key: "footer_note", blockType: "lower_block", name: "Примечание", sequenceNumber: 350, isActive: false },
  { key: "branding", blockType: "lower_block", name: "Чек создан в Konkurent", sequenceNumber: 360, isActive: false },
];

export function defaultReceiptSettings(): ReceiptSettingsData {
  return {
    id: "",
    name: "Стандартный",
    isDefault: true,
    hasInformationBlock: true,
    hasLowerBlock: true,
    paperWidth: 80,
    fontSize: 13,
    dividerStyle: "single",
    dividerGap: 8,
    sectionGap: 12,
    itemDividers: false,
    hasLogo: false,
    logoUrl: "",
    hasAdditionalImage: false,
    additionalImageUrl: "",
    footerMessage: "",
    footerNote: "",
    qrCodeUrl: "",
    elementStyles: null,
    blocks: DEFAULT_BLOCKS.map((b) => ({ ...b })),
  };
}

export function findBlock(settings: ReceiptSettingsData, key: string): ChequeBlock | undefined {
  return settings.blocks.find((b) => b.key === key);
}

export function isBlockActive(settings: ReceiptSettingsData, key: string): boolean {
  return findBlock(settings, key)?.isActive ?? false;
}

export function blocksOfType(settings: ReceiptSettingsData, blockType: ChequeBlockType): ChequeBlock[] {
  return settings.blocks
    .filter((b) => b.blockType === blockType)
    .sort((a, b) => a.sequenceNumber - b.sequenceNumber);
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
    sellerName: String(raw?.seller_name ?? ""),
    clientName: String(raw?.client_name ?? ""),
    clientPhone: String(raw?.client_phone ?? ""),
    saleComment: String(raw?.sale_comment ?? ""),
    items: Array.isArray(raw?.items)
      ? raw.items.map((item: any) => ({
          name: String(item?.name ?? ""),
          sku: String(item?.sku ?? ""),
          quantity: Number(item?.quantity ?? 0),
          price: Number(item?.price ?? 0),
          total: Number(item?.total ?? 0),
          discount: Number(item?.discount ?? 0),
          discountPercent: Number(item?.discountPercent ?? 0),
        }))
      : [],
    subtotal: Number(raw?.subtotal ?? 0),
    discount: Number(raw?.discount ?? 0),
    discountPercent: Number(raw?.discount_percent ?? 0),
    cashbackEarned: Number(raw?.cashback_earned ?? 0),
    totalDue: Number(raw?.total_due ?? 0),
    paidCash: Number(raw?.paid_cash ?? 0),
    paidCard: Number(raw?.paid_card ?? 0),
    paidCashback: Number(raw?.paid_cashback ?? 0),
    debt: Number(raw?.debt ?? 0),
    balanceBefore: Number(raw?.balance_before ?? 0),
    balanceAdded: Number(raw?.balance_added ?? 0),
    balanceDeducted: Number(raw?.balance_deducted ?? 0),
    balanceAfter: Number(raw?.balance_after ?? 0),
    debtBefore: Number(raw?.debt_before ?? 0),
    debtAdded: Number(raw?.debt_added ?? 0),
    debtPaid: Number(raw?.debt_paid ?? 0),
    debtAfter: Number(raw?.debt_after ?? 0),
    qrPayload: String(raw?.qr_payload ?? ""),
    shop: raw?.shop
      ? {
          name: String(raw.shop.name ?? ""),
          address: String(raw.shop.address ?? ""),
          phone: String(raw.shop.phone ?? ""),
          workingHours: String(raw.shop.working_hours ?? ""),
          facebook: String(raw.shop.facebook ?? ""),
          instagram: String(raw.shop.instagram ?? ""),
          telegram: String(raw.shop.telegram ?? ""),
          website: String(raw.shop.website ?? ""),
        }
      : null,
    company: {
      legalName: String(raw?.company?.legal_name ?? ""),
      taxId: String(raw?.company?.tax_id ?? ""),
    },
  };
}

function normalizeChequeTemplateSummary(raw: any): ChequeTemplateSummary {
  return {
    id: String(raw?.id ?? ""),
    name: String(raw?.name ?? ""),
    isDefault: Boolean(raw?.is_default ?? false),
    createdAt: String(raw?.created_at ?? ""),
    updatedAt: String(raw?.updated_at ?? ""),
  };
}

function normalizeSettings(raw: any): ReceiptSettingsData {
  return {
    id: String(raw?.id ?? ""),
    name: String(raw?.name ?? "Стандартный"),
    isDefault: Boolean(raw?.is_default ?? false),
    hasInformationBlock: Boolean(raw?.has_information_block ?? true),
    hasLowerBlock: Boolean(raw?.has_lower_block ?? true),
    paperWidth: Number(raw?.paper_width ?? 80),
    fontSize: Number(raw?.font_size ?? 13),
    dividerStyle: (raw?.divider_style as ReceiptSettingsData["dividerStyle"]) ?? "single",
    dividerGap: Number(raw?.divider_gap ?? 8),
    sectionGap: Number(raw?.section_gap ?? 12),
    itemDividers: Boolean(raw?.item_dividers ?? false),
    hasLogo: Boolean(raw?.has_logo ?? false),
    logoUrl: String(raw?.logo_url ?? ""),
    hasAdditionalImage: Boolean(raw?.has_additional_image ?? false),
    additionalImageUrl: String(raw?.additional_image_url ?? ""),
    footerMessage: String(raw?.footer_message ?? ""),
    footerNote: String(raw?.footer_note ?? ""),
    qrCodeUrl: String(raw?.qr_code_url ?? ""),
    elementStyles: Array.isArray(raw?.element_styles) ? raw.element_styles : null,
    blocks: Array.isArray(raw?.blocks)
      ? raw.blocks.map((b: any) => ({
          key: String(b?.key ?? ""),
          blockType: (b?.block_type as ChequeBlockType) ?? "information_block",
          name: String(b?.name ?? ""),
          sequenceNumber: Number(b?.sequence_number ?? 0),
          isActive: Boolean(b?.is_active ?? false),
        }))
      : [],
  };
}

function toChequeSettingsPatch(settings: Partial<ReceiptSettingsData>): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (settings.name !== undefined) patch.name = settings.name;
  if (settings.isDefault !== undefined) patch.is_default = settings.isDefault;
  if (settings.hasInformationBlock !== undefined) patch.has_information_block = settings.hasInformationBlock;
  if (settings.hasLowerBlock !== undefined) patch.has_lower_block = settings.hasLowerBlock;
  if (settings.paperWidth !== undefined) patch.paper_width = settings.paperWidth;
  if (settings.fontSize !== undefined) patch.font_size = settings.fontSize;
  if (settings.dividerStyle !== undefined) patch.divider_style = settings.dividerStyle;
  if (settings.dividerGap !== undefined) patch.divider_gap = settings.dividerGap;
  if (settings.sectionGap !== undefined) patch.section_gap = settings.sectionGap;
  if (settings.itemDividers !== undefined) patch.item_dividers = settings.itemDividers;
  if (settings.hasLogo !== undefined) patch.has_logo = settings.hasLogo;
  if (settings.logoUrl !== undefined) patch.logo_url = settings.logoUrl;
  if (settings.hasAdditionalImage !== undefined) patch.has_additional_image = settings.hasAdditionalImage;
  if (settings.additionalImageUrl !== undefined) patch.additional_image_url = settings.additionalImageUrl;
  if (settings.footerMessage !== undefined) patch.footer_message = settings.footerMessage;
  if (settings.footerNote !== undefined) patch.footer_note = settings.footerNote;
  if (settings.qrCodeUrl !== undefined) patch.qr_code_url = settings.qrCodeUrl;
  if (settings.elementStyles !== undefined) patch.element_styles = settings.elementStyles;
  if (settings.blocks !== undefined) {
    patch.blocks = settings.blocks.map((b) => ({
      key: b.key,
      is_active: b.isActive,
      sequence_number: b.sequenceNumber,
    }));
  }
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

  // Read-only: the template actually used to render/print receipts.
  async function fetchReceiptSettings(): Promise<ReceiptSettingsData> {
    const res = await apiFetch(`/cheque-settings`, { method: "GET" });
    return normalizeSettings(res);
  }

  async function fetchChequeTemplates(query: { name?: string; page?: number; limit?: number } = {}): Promise<{
    items: ChequeTemplateSummary[];
    page: number;
    limit: number;
    total: number;
  }> {
    const res: any = await apiFetch(`/cheque`, { method: "GET", query });
    return {
      items: Array.isArray(res?.items) ? res.items.map(normalizeChequeTemplateSummary) : [],
      page: Number(res?.page ?? 1),
      limit: Number(res?.limit ?? 10),
      total: Number(res?.total ?? 0),
    };
  }

  async function fetchChequeTemplate(id: string): Promise<ReceiptSettingsData> {
    const res = await apiFetch(`/cheque/${encodeURIComponent(id)}`, { method: "GET" });
    return normalizeSettings(res);
  }

  async function createChequeTemplate(name?: string): Promise<ReceiptSettingsData> {
    const res = await apiFetch(`/cheque`, { method: "POST", body: { name } });
    return normalizeSettings(res);
  }

  async function updateChequeTemplate(
    id: string,
    patch: Partial<ReceiptSettingsData>,
  ): Promise<ReceiptSettingsData> {
    const res = await apiFetch(`/cheque/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: toChequeSettingsPatch(patch),
    });
    return normalizeSettings(res);
  }

  async function deleteChequeTemplate(id: string): Promise<void> {
    await apiFetch(`/cheque/${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  async function markPrinted(saleId: number | string) {
    return apiFetch(`/receipts/${saleId}/mark-printed`, { method: "POST" });
  }

  return {
    fetchReceipt,
    fetchReceiptByNumber,
    fetchReceiptSettings,
    fetchChequeTemplates,
    fetchChequeTemplate,
    createChequeTemplate,
    updateChequeTemplate,
    deleteChequeTemplate,
    markPrinted,
  };
}
