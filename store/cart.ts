import { defineStore } from "pinia";
import { resolveMeasurementUnitLabel } from "@/composables/useMeasurementUnitLabel";
import { computed, ref, watch } from "vue";
import { useApi } from "~/composables/useApi";
import { useLocationStore } from "./useLocationStore";
import { useUserStore } from "./useUserStore";


type CartProduct = {
  id: number | string;
  publicId?: string;
  name: string;
  price: number;
  basePrice?: number;
  barcode: string;
  article: string;
  availableQuantity?: number;
  shopId?: string;
  quantity?: number;
  productId?: string | number;
  measurementUnitLabel?: string;
};

type CompanyPaymentMethod = {
  id: string;
  name: string;
  paymentTypeId?: string;
  paymentTypeName?: string;
  isCash?: boolean;
  dontShowInMakePayment?: boolean;
};

type SalePaymentPayload = {
  paymentMethodId: string;
  clientId?: string | null;
  debt?: {
    amount_uzs?: number | null;
    due_date?: string | null;
    comment?: string | null;
    receipt_url?: string | null;
  } | null;
};

type OrderCustomer = {
  id: string;
  code: string;
  firstName: string;
  lastName: string | null;
  middleName: string | null;
  phone: string;
};

type PosOrderPayment = {
  id: string;
  paymentTypeId: string;
  amount: number;
  paymentTypeName?: string | null;
};

type PosCreatedDebt = {
  id: string;
  client_id: string;
  amount_uzs: number;
  remaining_amount_uzs: number;
  repaid_amount_uzs: number;
  due_date: string | null;
  status: string;
  created_at: string;
  receipt_url: string | null;
  comment?: string | null;
  is_overdue?: boolean;
  bucket?: string | null;
};

type PosOrderStatus = string;

type PosOrder = {
  id: string;
  orderNumber: string;
  status: PosOrderStatus;
  shopId: string;
  cashboxId?: string | null;
  sellerId?: string | null;
  sellerName?: string | null;
  cashierName?: string | null;
  items: any[];
  payments: PosOrderPayment[];
  totalPrice: number;
  discountAmount: number;
  paidAmount: number;
  remainingDebtAmount: number;
  comment?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  customer?: OrderCustomer | null;
  clientId?: string | null;
  client?: OrderCustomer | null;
  createdDebt?: PosCreatedDebt | null;
  versionNumber: number;
};

type SaleFlowMode = "sale" | "return";

type ReturnSourceSale = {
  id: string;
  number: string;
  paymentMethodId?: string;
  paymentMethodName?: string;
  sellerId?: string;
  sellerName?: string;
  cashierName?: string;
  branchName?: string;
  createdAt?: string;
};

export const useCartStore = defineStore("cart", () => {
  const STORAGE_KEY = "pos-cart-state";

  const cart = ref<any[]>([]);
  const saleId = ref<string | number | null>(null);
  const saleNumber = ref<string | null>(null);
  const receipt = ref<any | null>(null);
  const saleShopId = ref<string>("");
  const currentOrder = ref<PosOrder | null>(null);
  const saleFlowMode = ref<SaleFlowMode>("sale");
  const sourceSale = ref<ReturnSourceSale | null>(null);
  const selectedSellerId = ref<string>("");
  const selectedSellerName = ref<string>("");

  const productsLoading = ref(false);
  const creatingSale = ref(false);
  const loadingSale = ref(false);
  const addingItem = ref(false);
  const payLoading = ref(false);
  const cancelLoading = ref(false);
  const parkingLoading = ref(false);
  const discountLoading = ref(false);
  const saleMetaLoading = ref(false);
  const paymentMethodsLoading = ref(false);
  const referenceDataLoading = ref(false);
  const restoringSale = ref(false);
  const itemBusyMap = ref<Record<string, boolean>>({});

  const discountPercent = ref<number>(0);
  const discountAmount = ref<number>(0);
  const payableTotal = ref<number>(0);
  const orderRaw = ref<any | null>(null);
  const lastCartError = ref<string>("");
  const paymentMethods = ref<CompanyPaymentMethod[]>([]);
  const cashBoxes = ref<any[]>([]);
  const selectedCashBox = ref<any | null>(null);
  const saleCheque = ref<any | null>(null);
  const shopInfo = ref<any | null>(null);
  const orderDraftDebt = ref<any | null>(null);
  const loyaltyProgram = ref<any | null>(null);
  const companyCurrency = ref<any | null>(null);
  const completingOrder = ref(false);

  const products = ref<CartProduct[]>([]);

  const searchQuery = ref("");
  const discountValue = ref(0);
  const discountType = ref<"%" | "uzs">("%");

  const filteredProducts = ref<CartProduct[]>([]);

  let _searchTimer: ReturnType<typeof setTimeout> | null = null;

  async function searchProducts(query: string) {
    const q = query.trim();
    if (!q) {
      filteredProducts.value = [];
      return;
    }

    const shopId = resolveCurrentShopId();
    const { apiFetch } = useApi();
    productsLoading.value = true;
    try {
      const res = await apiFetch<any>("/v2/product-search-with-filters", {
        method: "POST",
        body: {
          search: q,
          field_search_key: q,
          limit: 20,
          page: 1,
          shop_ids: shopId ? [shopId] : [],
        },
      });

      const items = Array.isArray(res?.products) ? res.products : [];
      filteredProducts.value = items.map((item: any) => {
        const shopMV = Array.isArray(item?.shop_measurement_values)
          ? item.shop_measurement_values
          : [];
        const shopPrices = Array.isArray(item?.shop_prices)
          ? item.shop_prices
          : [];
        return {
          id: item?.public_id ?? item?.id ?? "",
          name: String(item?.name ?? item?.base_name ?? ""),
          price: Number(
            shopPrices[0]?.retail_price ??
              item?.sale_price ??
              item?.retail_price ??
              item?.price ??
              0,
          ),
          barcode: String(item?.barcode ?? ""),
          article: String(item?.sku ?? item?.article ?? ""),
          availableQuantity: Number(
            shopMV[0]?.total_active_measurement_value ??
              item?.measurement_values?.total_active_measurement_value ??
              item?.quantity ??
              0,
          ),
          shopId: String(
            shopMV[0]?.shop_id ??
              shopPrices[0]?.shop_id ??
              item?.shop_id ??
              shopId ??
              "",
          ),
        };
      });
    } catch {
      filteredProducts.value = [];
    } finally {
      productsLoading.value = false;
    }
  }

  watch(searchQuery, (query) => {
    if (_searchTimer) clearTimeout(_searchTimer);
    if (!query.trim()) {
      filteredProducts.value = [];
      productsLoading.value = false;
      return;
    }
    _searchTimer = setTimeout(() => {
      void searchProducts(query);
    }, 300);
  });

  function resetSaleState(options?: {
    keepSearchQuery?: boolean;
    keepReceipt?: boolean;
    keepError?: boolean;
  }) {
    cart.value = [];
    saleId.value = null;
    saleShopId.value = "";
    saleNumber.value = null;
    currentOrder.value = null;
    saleFlowMode.value = "sale";
    sourceSale.value = null;
    selectedSellerId.value = "";
    selectedSellerName.value = "";
    orderRaw.value = null;
    orderDraftDebt.value = null;
    discountValue.value = 0;
    discountType.value = "%";
    discountPercent.value = 0;
    discountAmount.value = 0;
    payableTotal.value = 0;
    itemBusyMap.value = {};

    if (!options?.keepReceipt) {
      receipt.value = null;
    }

    if (!options?.keepError) {
      lastCartError.value = "";
    }

    if (!options?.keepSearchQuery) {
      searchQuery.value = "";
    }
  }

  function resolveCurrentShopId() {
    const locationStore = useLocationStore();
    const userStore = useUserStore();
    const user = userStore.userState;

    return (
      locationStore.selectedLocation?.id ||
      userStore.location?.id ||
      user.currentShopId ||
      user.branchCode ||
      ""
    );
  }

  function resolveCompanyId(inputCompanyId?: string) {
    const userStore = useUserStore();
    const user = userStore.userState;

    return String(
      inputCompanyId ||
        user.companyId ||
        user.company?.companyId ||
        user.company?.id ||
        "",
    ).trim();
  }

  function resolveBranchCode() {
    const locationStore = useLocationStore();
    const userStore = useUserStore();
    const user = userStore.userState;

    return String(
      locationStore.selectedLocation?.branchCode ||
        user.currentShop?.branchCode ||
        user.branchCode ||
        "",
    ).trim();
  }

  function isReturnFlow() {
    return saleFlowMode.value === "return";
  }

  function isReturnEntry(item: any) {
    return String(item?.entryType ?? "") === "return";
  }

  function isExchangeEntry(item: any) {
    return String(item?.entryType ?? "sale") === "sale";
  }

  function setSelectedSeller(payload?: { id?: string | number | null; name?: string | null }) {
    selectedSellerId.value = String(payload?.id ?? "").trim();
    selectedSellerName.value = String(payload?.name ?? "").trim();
  }

  function setItemBusy(productId: number | string, busy: boolean) {
    const key = String(productId);

    if (busy) {
      itemBusyMap.value = { ...itemBusyMap.value, [key]: true };
      return;
    }

    const nextMap = { ...itemBusyMap.value };
    delete nextMap[key];
    itemBusyMap.value = nextMap;
  }

  function isItemBusy(productId: number | string) {
    return Boolean(itemBusyMap.value[String(productId)]);
  }

  function apiErrorMessage(error: any, fallback: string) {
    const status = Number(error?.statusCode ?? error?.response?.status ?? error?.data?.statusCode ?? 0);
    if (status === 403) return "Нет прав доступа.";
    return error?.data?.message || error?.message || fallback;
  }

  function pickOrder(raw: any) {
    return raw?.order ?? raw?.data?.order ?? raw?.data ?? raw;
  }

  function normalizeOrder(raw: any): PosOrder | null {
    const source = pickOrder(raw);
    if (!source?.id) return null;

    const items = Array.isArray(source.items)
      ? source.items
      : Array.isArray(source?.order_detail?.order_items)
        ? source.order_detail.order_items
        : [];
    const paymentsSource = Array.isArray(source.payments)
      ? source.payments
      : Array.isArray(source?.order_detail?.order_payments)
        ? source.order_detail.order_payments
        : source?.payment
          ? [source.payment]
          : [];
    const totalPrice = Number(
      source.totalPrice ??
      source.total_price ??
      source.payableTotal ??
      source.payable_total ??
      source.total ??
      source?.order_detail?.total_price ??
      source?.amount ??
      source?.grand_total ??
      0,
    );
    const paidAmount = Number(
      source.paidAmount ??
      source.paid_amount ??
      source.amount ??
      (String(source.status ?? "").toLowerCase() === "paid" ? totalPrice : 0),
    );
    const customerSource = source.customer ?? source.client ?? source.buyer ?? null;
    const customerFirstName = String(customerSource?.firstName ?? customerSource?.first_name ?? "");
    const customerLastName = String(customerSource?.lastName ?? customerSource?.last_name ?? "");
    const customerMiddleName = String(customerSource?.middleName ?? customerSource?.middle_name ?? "");
    const customerFullName = [customerLastName, customerFirstName, customerMiddleName]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(" ");
    const normalizedCustomerFullName = customerFullName || null;
    const payments = paymentsSource.map((payment: any, index: number) => ({
      id: String(payment?.id ?? payment?.paymentId ?? payment?.payment_id ?? `payment-${index}`),
      paymentTypeId: String(
        payment?.paymentTypeId ??
        payment?.payment_type_id ??
        payment?.payment_method ??
        payment?.payment?.id ??
        "",
      ),
      amount: Number(payment?.amount ?? payment?.paid_amount ?? payment?.sum ?? 0),
      paymentTypeName: String(
        payment?.paymentTypeName ??
        payment?.payment_type_name ??
        payment?.payment?.name ??
        "",
      ) || null,
    }));
    const remainingDebtAmount = Number(
      source.remainingDebtAmount ??
      source.remaining_debt_amount ??
      Math.max(0, totalPrice - paidAmount),
    );
    const createdDebtSource = source.createdDebt ?? source.created_debt ?? null;

    const normalizedCustomerId =
      source.customerId ??
      source.customer_id ??
      source.clientId ??
      source.client_id ??
      customerSource?.id ??
      null;
    const normalizedCustomer =
      customerSource
        ? {
            id: String(normalizedCustomerId ?? ""),
            code: String(customerSource.code ?? ""),
            firstName: customerFirstName,
            lastName: customerLastName || null,
            middleName: customerMiddleName || null,
            phone: String(customerSource.phone ?? ""),
          }
        : null;

    return {
      id: String(source.id),
      orderNumber: String(source.sid ?? source.sale_number ?? source.orderNumber ?? source.order_number ?? source.number ?? ""),
      status: String(source.status ?? source.order_status ?? "draft").toLowerCase() as PosOrderStatus,
      shopId: String(source.shopId ?? source.shop_id ?? source?.order_detail?.shop?.id ?? ""),
      cashboxId: source.cashboxId ?? source.cashbox_id ?? null,
      items,
      payments,
      totalPrice,
      discountAmount: Number(source.discountAmount ?? source.discount_amount ?? 0),
      paidAmount,
      remainingDebtAmount: Math.max(0, remainingDebtAmount),
      comment: source.comment ?? null,
      sellerId:
        source.sellerId ??
        source.seller_id ??
        source.userId ??
        source.user_id ??
        source.seller?.id ??
        source.user?.id ??
        null,
      sellerName:
        source.sellerName ??
        source.seller_name ??
        source.seller?.name ??
        source.cashier?.name ??
        source.cashier_name ??
        source.user?.name ??
        null,
      cashierName:
        source.cashierName ??
        source.cashier_name ??
        source.cashier?.name ??
        source.user?.name ??
        source.seller_name ??
        source.seller?.name ??
        null,
      customerId: normalizedCustomerId,
      customerName:
        source.customerName ??
        source.customer_name ??
        source.customer?.name ??
        source.client?.name ??
        source.buyer?.name ??
        source.client_name ??
        normalizedCustomerFullName ??
        null,
      customer: normalizedCustomer,
      clientId: normalizedCustomerId,
      client: normalizedCustomer,
      createdDebt: createdDebtSource
        ? {
            id: String(createdDebtSource.id ?? ""),
            client_id: String(createdDebtSource.client_id ?? createdDebtSource.clientId ?? ""),
            amount_uzs: Number(createdDebtSource.amount_uzs ?? createdDebtSource.amount ?? 0),
            remaining_amount_uzs: Number(createdDebtSource.remaining_amount_uzs ?? createdDebtSource.remainingAmount ?? 0),
            repaid_amount_uzs: Number(createdDebtSource.repaid_amount_uzs ?? createdDebtSource.repaidAmount ?? 0),
            due_date: createdDebtSource.due_date ?? createdDebtSource.dueDate ?? null,
            status: String(createdDebtSource.status ?? ""),
            created_at: String(createdDebtSource.created_at ?? createdDebtSource.createdAt ?? ""),
            receipt_url: createdDebtSource.receipt_url ?? createdDebtSource.receiptUrl ?? null,
            comment: createdDebtSource.comment ?? null,
            is_overdue: Boolean(createdDebtSource.is_overdue ?? createdDebtSource.isOverdue ?? false),
            bucket: createdDebtSource.bucket ?? null,
          }
        : null,
      versionNumber: Number(source.versionNumber ?? source.version_number ?? 1),
    };
  }

  function applyOrderState(raw: any) {
    const order = normalizeOrder(raw);
    if (!order) return null;
    const source = pickOrder(raw);

    currentOrder.value = order;
    saleId.value = order.id;
    saleNumber.value = order.orderNumber || saleNumber.value;
    saleShopId.value = order.shopId || saleShopId.value;
    orderRaw.value = pickOrder(raw);
    discountAmount.value = order.discountAmount;
    discountPercent.value = Number(source?.discount_percent ?? source?.discountPercent ?? discountPercent.value ?? 0);
    payableTotal.value = order.totalPrice;
    setSelectedSeller({
      id: order.sellerId,
      name: order.sellerName ?? order.cashierName ?? "",
    });

    cart.value = order.items.map((item: any, index: number) => {
      const product = item?.product ?? {};
      const productId = item?.productId ?? item?.product_id ?? product?.id ?? product?.publicId ?? product?.public_id ?? item?.id;
      const itemId = item?.id ?? item?.itemId ?? item?.item_id ?? `${productId}-${index}`;

      return {
        id: itemId,
        itemId,
        productId,
        publicId: product?.publicId ?? product?.public_id,
        name: String(item?.name ?? product?.name ?? "Товар"),
        price: Number(item?.sale_price ?? item?.price ?? item?.sellPrice ?? item?.sell_price ?? item?.unitPrice ?? item?.unit_price ?? product?.retail_price ?? product?.sellPrice ?? product?.sell_price ?? product?.price ?? 0),
        basePrice: Number(
          item?.retail_price ??
            item?.original_price ??
            item?.base_price ??
            item?.old_price ??
            product?.retail_price ??
            product?.sellPrice ??
            product?.sell_price ??
            product?.price ??
            item?.sale_price ??
            item?.price ??
            0,
        ),
        barcode: String(item?.barcode ?? product?.barcode ?? ""),
        article: String(item?.sku ?? item?.article ?? product?.sku ?? product?.article ?? ""),
        quantity: Number(item?.quantity ?? item?.qty ?? 1),
        availableQuantity: Number(
          item?.available_quantity ??
          item?.stock ??
          product?.stock ??
          product?.quantity ??
          product?.measurement_values?.total_active_measurement_value ??
          product?.measurement_values?.total_measurement_value ??
          0,
        ),
        measurementUnitLabel: resolveMeasurementUnitLabel({
          ...item,
          product,
          measurementUnitLabel:
            item?.measurementUnitLabel ??
            item?.measurement_unit_label ??
            product?.measurementUnitLabel,
        }),
        shopId: order.shopId,
      };
    });

    return order;
  }

  function hasSaleShopMismatch(shopId?: string | number | null) {
    const currentShopId = String(shopId ?? resolveCurrentShopId() ?? "");
    return Boolean(
      saleId.value &&
      saleShopId.value &&
      currentShopId &&
      String(saleShopId.value) !== currentShopId,
    );
  }

  async function loadPaymentMethods(_inputCompanyId?: string) {
    paymentMethodsLoading.value = true;
    try {
      const companyId = resolveCompanyId(_inputCompanyId);
      const { apiFetch } = useApi();
      const query = companyId ? { company_id: companyId } : undefined;
      const res: any = await runSaleItemMutation([
        () => apiFetch("/company-payment-type", { method: "GET", query }),
        () => apiFetch("/v1/company-payment-type", { method: "GET", query }),
      ]);

      const items = Array.isArray(res)
        ? res
        : Array.isArray(res?.company_payment_types)
          ? res.company_payment_types
          : Array.isArray(res?.data?.company_payment_types)
            ? res.data.company_payment_types
          : Array.isArray(res?.data)
            ? res.data
            : [];

      paymentMethods.value = items
        .map((item: any) => ({
          id: String(item?.id ?? ""),
          name: String(item?.name ?? ""),
          paymentTypeId: String(item?.payment_type_id ?? item?.payment_type?.id ?? ""),
          paymentTypeName: String(item?.payment_type_name ?? item?.payment_type?.name ?? ""),
          isCash: Boolean(item?.isCash ?? item?.is_cash ?? item?.is_cash_payment_type),
          dontShowInMakePayment: Boolean(item?.dontShowInMakePayment ?? item?.dont_show_in_make_payment),
        }))
        .filter((item: CompanyPaymentMethod) => Boolean(item.id && item.name));
    } catch (error: any) {
      lastCartError.value = apiErrorMessage(error, "Не удалось загрузить способы оплаты.");
      paymentMethods.value = [];
    } finally {
      paymentMethodsLoading.value = false;
    }
  }

  async function createPaymentType(payload: { name: string; isCash: boolean }) {
    const { apiFetch } = useApi();
    try {
      const res = await apiFetch("/payment-types", {
        method: "POST",
        body: payload,
      });
      await loadPaymentMethods();
      return res;
    } catch (error: any) {
      lastCartError.value = apiErrorMessage(error, "Не удалось создать тип оплаты.");
      return null;
    }
  }

  async function loadCashBoxes() {
    const { apiFetch } = useApi();
    const shopId = String(resolveCurrentShopId() || "");
    const res: any = await apiFetch("/cashboxes", {
      method: "GET",
      query: shopId ? { shopId } : undefined,
    });
    const items = Array.isArray(res)
      ? res
      : Array.isArray(res?.cashboxes)
        ? res.cashboxes
        : Array.isArray(res?.cashBoxes)
          ? res.cashBoxes
          : Array.isArray(res?.data)
            ? res.data
            : [];

    cashBoxes.value = items;
    selectedCashBox.value =
      items.find((cashBox: any) => String(cashBox?.shopId ?? cashBox?.shop_id ?? cashBox?.shop?.id ?? "") === shopId) ??
      items[0] ??
      null;

    return selectedCashBox.value;
  }

  async function createCashbox(payload: { shopId: string; name: string }) {
    const { apiFetch } = useApi();
    try {
      const res = await apiFetch("/cashboxes", {
        method: "POST",
        body: payload,
      });
      await loadCashBoxes();
      return res;
    } catch (error: any) {
      lastCartError.value = apiErrorMessage(error, "Не удалось создать кассу.");
      return null;
    }
  }

  async function loadShopInfo(shopId = resolveCurrentShopId()) {
    if (!shopId) {
      shopInfo.value = null;
      return null;
    }

    const { apiFetch } = useApi();
    const res = await apiFetch(`/v1/shop/${encodeURIComponent(String(shopId))}`, {
      method: "GET",
    });
    shopInfo.value = res;
    return res;
  }

  async function loadLoyaltyProgram() {
    const { apiFetch } = useApi();
    const res = await apiFetch("/v1/loyalty-program", { method: "GET" });
    loyaltyProgram.value = res;
    return res;
  }

  async function loadCompanyCurrency() {
    const { apiFetch } = useApi();
    const res: any = await apiFetch("/v2/company-currencies", { method: "GET" });
    const currencies = Array.isArray(res?.company_currencies)
      ? res.company_currencies
      : Array.isArray(res?.data?.company_currencies)
        ? res.data.company_currencies
        : [];
    companyCurrency.value = currencies[0]?.currency ?? currencies[0] ?? null;
    return companyCurrency.value;
  }

  async function loadSaleCheque(inputCompanyId?: string) {
    const companyId = resolveCompanyId(inputCompanyId);
    const { apiFetch } = useApi();
    const res: any = await apiFetch("/v1/cheque", {
      method: "GET",
      query: companyId ? { company_id: companyId } : undefined,
    });
    const cheques = Array.isArray(res?.cheques)
      ? res.cheques
      : Array.isArray(res?.data?.cheques)
        ? res.data.cheques
        : [];
    const cashBoxChequeId = String(selectedCashBox.value?.cheque_id ?? "");

    saleCheque.value =
      cheques.find((cheque: any) => cashBoxChequeId && String(cheque?.id) === cashBoxChequeId) ??
      cheques.find((cheque: any) => Boolean(cheque?.is_default)) ??
      cheques[0] ??
      null;

    return saleCheque.value;
  }

  async function loadOrderDraftDebt(sid?: string | number | null) {
    const id = sid ?? saleId.value;
    if (!id) {
      orderDraftDebt.value = null;
      return null;
    }

    const { apiFetch } = useApi();
    const res = await apiFetch(`/order-draft-debt/${encodeURIComponent(String(id))}`, {
      method: "GET",
    });
    orderDraftDebt.value = res;
    return res;
  }

  async function loadSaleReferenceData() {
    referenceDataLoading.value = true;
    try {
      await Promise.allSettled([
        loadPaymentMethods(),
        loadCashBoxes(),
        loadShopInfo(),
        loadLoyaltyProgram(),
        loadCompanyCurrency(),
      ]);
      await loadSaleCheque().catch(() => {
        saleCheque.value = null;
      });
    } finally {
      referenceDataLoading.value = false;
    }
  }

  function upsertCartItem(product: any, quantity = 1) {
    const existing = cart.value.find((c) => c.id === product.id);
    const availableQuantity = Math.max(
      0,
      Number(product?.availableQuantity ?? existing?.availableQuantity ?? 0),
    );

    if (existing) {
      existing.availableQuantity = availableQuantity;
      existing.shopId = String(product?.shopId ?? existing?.shopId ?? resolveCurrentShopId() ?? "");
      existing.quantity = availableQuantity > 0
        ? Math.min(
            Math.max(1, Number(existing.quantity || 1) + quantity),
            availableQuantity,
          )
        : 0;
      return;
    }

    cart.value.push({
      ...product,
      basePrice: Number(product?.basePrice ?? product?.price ?? 0),
      quantity: availableQuantity > 0
        ? Math.min(Math.max(1, quantity), availableQuantity)
        : 0,
      availableQuantity,
      shopId: String(product?.shopId ?? resolveCurrentShopId() ?? ""),
    });
  }

  function getCartItemQuantity(productId: number | string) {
    const existing = cart.value.find((item) => String(item.id) === String(productId));
    return Number(existing?.quantity ?? 0);
  }

  function setCartItemQuantity(productId: number | string, nextQuantity: number) {
    const item = cart.value.find((entry) => String(entry.id) === String(productId));
    if (!item) return;

    const availableQuantity = Math.max(0, Number(item.availableQuantity ?? 0));
    if (availableQuantity <= 0) {
      item.quantity = 0;
      return;
    }

    const normalizedQuantity = Math.max(1, Number(nextQuantity || 1));
    item.quantity = Math.min(normalizedQuantity, availableQuantity);
  }

  function saveLocalState() {
    if (!import.meta.client) return;

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        cart: cart.value,
        saleId: saleId.value,
        saleShopId: saleShopId.value,
        saleNumber: saleNumber.value,
        currentOrder: currentOrder.value,
        orderRaw: orderRaw.value,
        discountValue: discountValue.value,
        discountType: discountType.value,
        discountPercent: discountPercent.value,
        discountAmount: discountAmount.value,
        payableTotal: payableTotal.value,
      })
    );
  }

  function loadLocalState() {
    if (!import.meta.client) return;

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      cart.value = Array.isArray(parsed?.cart)
        ? parsed.cart.map((item: any) => ({
            ...item,
            discountValue: 0,
            discountType: "%",
          }))
        : [];
      saleId.value = parsed?.saleId ?? null;
      saleShopId.value = String(parsed?.saleShopId ?? "");
      saleNumber.value = parsed?.saleNumber ?? null;
      currentOrder.value = normalizeOrder(parsed?.currentOrder);
      orderRaw.value = parsed?.orderRaw ?? null;
      discountValue.value = Number(parsed?.discountValue ?? 0);
      discountType.value = parsed?.discountType === "uzs" ? "uzs" : "%";
      discountPercent.value = Number(parsed?.discountPercent ?? 0);
      discountAmount.value = Number(parsed?.discountAmount ?? 0);
      payableTotal.value = Number(parsed?.payableTotal ?? 0);

      const currentShopId = String(resolveCurrentShopId() ?? "");
      if (hasSaleShopMismatch(currentShopId)) {
        resetSaleState();
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  async function initSale() {
    creatingSale.value = true;
    try {
      const { apiFetch } = useApi();
      const res: any = await apiFetch("/new-sale", {
        method: "POST",
      });
      applyOrderState(res);
      return saleId.value;
    } catch (error: any) {
      lastCartError.value = apiErrorMessage(error, "Не удалось создать заказ.");
      return null;
    } finally {
      creatingSale.value = false;
    }
  }

  async function openFreshSale(options?: { keepReceipt?: boolean; keepSearchQuery?: boolean }) {
    resetSaleState({
      keepReceipt: options?.keepReceipt,
      keepSearchQuery: options?.keepSearchQuery,
    });

    return await initSale();
  }

  async function leaveActiveSale(options?: {
    keepReceipt?: boolean;
    keepSearchQuery?: boolean;
  }) {
    const currentId = String(saleId.value ?? "").trim();
    const normalizedStatus = String(currentOrder.value?.status ?? "").toLowerCase();
    if (!currentId || isReturnFlow()) {
      resetSaleState({
        keepReceipt: options?.keepReceipt,
        keepSearchQuery: options?.keepSearchQuery,
      });
      return null;
    }

    if (normalizedStatus === "completed" || normalizedStatus === "paid") {
      resetSaleState({
        keepReceipt: options?.keepReceipt,
        keepSearchQuery: options?.keepSearchQuery,
      });
      return null;
    }

    const { apiFetch } = useApi();
    parkingLoading.value = true;
    try {
      const res = await runSaleItemMutation([
        () => apiFetch(`/new-sale/${encodeURIComponent(currentId)}/leave`, { method: "POST" }),
        () => apiFetch(`/new-sale/${encodeURIComponent(currentId)}/park`, { method: "POST" }),
      ]);

      resetSaleState({
        keepReceipt: options?.keepReceipt,
        keepSearchQuery: options?.keepSearchQuery,
      });
      lastCartError.value = "";
      return res;
    } catch (error: any) {
      lastCartError.value = apiErrorMessage(error, "Не удалось закрыть текущую продажу.");
      return null;
    } finally {
      parkingLoading.value = false;
    }
  }

  function leaveActiveSaleOnUnload() {
    const currentId = String(saleId.value ?? "").trim();
    const normalizedStatus = String(currentOrder.value?.status ?? "").toLowerCase();
    if (!import.meta.client || !currentId || isReturnFlow() || normalizedStatus === "completed" || normalizedStatus === "paid") return;

    try {
      const { apiBase } = useApi();
      const userStore = useUserStore();
      const base = String(apiBase || "").trim();
      const resolvedBase = base
        ? new URL(base.replace(/\/$/, "") + "/", window.location.origin)
        : new URL("/", window.location.origin);
      const target = new URL(`new-sale/${encodeURIComponent(currentId)}/leave`, resolvedBase);
      const authToken = String(userStore.token || "").trim();

      void fetch(target.toString(), {
        method: "POST",
        credentials: "include",
        keepalive: true,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({}),
      });
    } catch {
      // Ignore unload transport errors.
    }
  }

  async function loadSale(sid?: string | number | null) {
    const id = sid ?? saleId.value;
    if (!id) return null;

    loadingSale.value = true;
    restoringSale.value = true;
    try {
      const { apiFetch } = useApi();
      const saleIdValue = encodeURIComponent(String(id));
      const res: any = await apiFetch(`/new-sale/${saleIdValue}`, { method: "GET" });

      let payload = res;
      const hasItems = extractOrderItems(res).length > 0;

      if (!hasItems) {
        try {
          const itemsRes: any = await apiFetch(`/new-sale/${saleIdValue}/items`, {
            method: "GET",
          });
          const items = extractOrderItems(itemsRes);

          if (items.length > 0) {
            payload = {
              ...res,
              items,
              order_items: items,
              order_detail: {
                ...(res?.order_detail ?? {}),
                items,
                order_items: items,
              },
            };
          }
        } catch {
          // keep base payload when items endpoint is unavailable
        }
      }

      applyOrderState(payload);
      await loadOrderDraftDebt(String(id)).catch(() => {
        orderDraftDebt.value = null;
      });
      return payload;
    } finally {
      loadingSale.value = false;
      restoringSale.value = false;
    }
  }

  async function addToCartServer(product: any) {
    const productId = String(product?.id ?? "");
    if (!productId || addingItem.value || isItemBusy(productId)) return;

    try {
      if (isReturnFlow()) {
        const existing = cart.value.find(
          (entry) => isExchangeEntry(entry) && String(entry.productId ?? entry.id) === String(product.productId || product.publicId || product.id),
        );

        if (existing) {
          const nextQuantity = Math.min(
            Math.max(1, Number(existing.quantity || 1) + 1),
            Math.max(1, Number(existing.availableQuantity ?? 1)),
          );
          existing.quantity = nextQuantity;
        } else {
          cart.value.push({
            id: `sale-${product.productId || product.publicId || product.id}`,
            itemId: `sale-${product.productId || product.publicId || product.id}`,
            productId: product.productId || product.publicId || product.id,
            publicId: product.publicId,
            name: String(product.name || "Товар"),
            price: Number(product.price || 0),
            barcode: String(product.barcode || ""),
            article: String(product.article || ""),
            quantity: 1,
            availableQuantity: Math.max(1, Number(product.availableQuantity ?? 1)),
            shopId: String(product.shopId ?? resolveCurrentShopId() ?? ""),
            entryType: "sale",
          });
        }

        lastCartError.value = "";
        searchQuery.value = "";
        return;
      }

      setItemBusy(productId, true);
      addingItem.value = true;
      lastCartError.value = "";
      const availableQuantity = Math.max(0, Number(product?.availableQuantity ?? 0));
      const currentQuantity = getCartItemQuantity(product.id);

      if (availableQuantity <= 0) {
        lastCartError.value = "В выбранном филиале нет остатка";
        return;
      }

      if (currentQuantity >= availableQuantity) {
        lastCartError.value = "Недостаточно остатка в выбранном филиале";
        return;
      }

      const sid = saleId.value || (await initSale());
      if (!sid) throw new Error("sale not created");

      const { apiFetch } = useApi();
      const res: any = await apiFetch(`/new-sale/${encodeURIComponent(String(sid))}/items`, {
        method: "POST",
        body: {
          product_id: product.productId || product.publicId || product.id,
          quantity: currentQuantity + 1,
          sale_price: Number(product.price || 0),
        },
      });
      applyOrderState(res);
      lastCartError.value = "";
    } catch (error: any) {
      lastCartError.value = apiErrorMessage(error, "Не удалось добавить товар в заказ.");
      if (saleId.value) {
        await loadSale(saleId.value);
      }
    } finally {
      setItemBusy(productId, false);
      addingItem.value = false;
      searchQuery.value = "";
    }
  }

  function addToCart(product: any) {
    void addToCartServer(product);
  }

  function removeFromCart(id: number | string) {
    cart.value = cart.value.filter((c) => String(c.id) !== String(id));
  }

  function clearCart() {
    cart.value = [];
  }

  function setCustomerSelection(payload: {
    id: string;
    name?: string | null;
    phone?: string | null;
    code?: string | null;
  }) {
    if (!currentOrder.value) return;

    const normalizedId = String(payload.id || "").trim() || null;
    const normalizedName = String(payload.name ?? "").trim() || null;
    currentOrder.value = {
      ...currentOrder.value,
      customerId: normalizedId,
      clientId: normalizedId,
      customerName: normalizedName,
      customer: normalizedId
        ? {
            id: normalizedId,
            code: String(payload.code ?? "").trim(),
            firstName: normalizedName || "",
            lastName: null,
            middleName: null,
            phone: String(payload.phone ?? "").trim(),
          }
        : null,
      client: normalizedId
        ? {
            id: normalizedId,
            code: String(payload.code ?? "").trim(),
            firstName: normalizedName || "",
            lastName: null,
            middleName: null,
            phone: String(payload.phone ?? "").trim(),
          }
        : null,
    };
  }

  const supportsOrdersDebtFlow = computed(() => isUuidLike(saleId.value));

  async function attachCustomer(payload: { id: string }) {
    if (!saleId.value) return null;

    const customerId = String(payload.id || "").trim();
    if (!customerId) {
      lastCartError.value = "Клиент не выбран.";
      return null;
    }

    const { apiFetch } = useApi();
    saleMetaLoading.value = true;
    try {
      const isOrdersFlow = supportsOrdersDebtFlow.value;
      const response = await apiFetch(
        isOrdersFlow
          ? `/orders/${encodeURIComponent(String(saleId.value))}/customer`
          : `/new-sale/${encodeURIComponent(String(saleId.value))}/customer`,
        {
          method: "PATCH",
          body: isOrdersFlow ? { clientId: customerId } : { client_id: customerId },
        },
      );
      applyOrderState(response);
      lastCartError.value = "";
      return response;
    } catch (error: any) {
      lastCartError.value = apiErrorMessage(error, "Не удалось привязать клиента к заказу.");
      return null;
    } finally {
      saleMetaLoading.value = false;
    }
  }

  async function addOrderPayment(payload: { paymentTypeId: string; amount: number }) {
    if (!saleId.value) return null;

    if (!supportsOrdersDebtFlow.value) {
      lastCartError.value = "На текущем проде новый orders-модуль с долгами недоступен.";
      return null;
    }

    const paymentTypeId = String(payload.paymentTypeId || "").trim();
    const amount = Math.max(0, Number(payload.amount || 0));
    if (!paymentTypeId || amount <= 0) {
      lastCartError.value = "Укажите способ оплаты и сумму.";
      return null;
    }

    const { apiFetch } = useApi();
    payLoading.value = true;
    try {
      const response = await apiFetch(`/orders/${encodeURIComponent(String(saleId.value))}/payments`, {
        method: "POST",
        body: {
          paymentTypeId,
          amount,
        },
      });
      applyOrderState(response);
      lastCartError.value = "";
      return response;
    } catch (error: any) {
      lastCartError.value = apiErrorMessage(error, "Не удалось добавить оплату.");
      return null;
    } finally {
      payLoading.value = false;
    }
  }

  async function removeOrderPayment(paymentId: string) {
    if (!saleId.value) return null;

    if (!supportsOrdersDebtFlow.value) {
      lastCartError.value = "На текущем проде новый orders-модуль с долгами недоступен.";
      return null;
    }

    const normalizedPaymentId = String(paymentId || "").trim();
    if (!normalizedPaymentId) return null;

    const { apiFetch } = useApi();
    payLoading.value = true;
    try {
      const response = await apiFetch(`/orders/${encodeURIComponent(String(saleId.value))}/payments/${encodeURIComponent(normalizedPaymentId)}`, {
        method: "DELETE",
      });
      applyOrderState(response);
      lastCartError.value = "";
      return response;
    } catch (error: any) {
      lastCartError.value = apiErrorMessage(error, "Не удалось удалить оплату.");
      return null;
    } finally {
      payLoading.value = false;
    }
  }

  async function completeOrder(payload?: { allowDebt?: boolean; dueDate?: string | null; receiptUrl?: string | null }) {
    if (!saleId.value) return null;

    if (!supportsOrdersDebtFlow.value) {
      lastCartError.value = "На текущем проде новый orders-модуль с долгами недоступен.";
      return null;
    }

    const order = currentOrder.value ?? (await loadSale(saleId.value));
    if (!order || order.items.length === 0) {
      lastCartError.value = "Order must contain at least one item";
      return null;
    }

    const remaining = Math.max(0, Number(order.remainingDebtAmount ?? 0));
    if (remaining > 0 && payload?.allowDebt && !order.customerId) {
      lastCartError.value = "Customer must be attached before completing an order with debt";
      return null;
    }

    const { apiFetch } = useApi();
    completingOrder.value = true;
    try {
      const response = await apiFetch(`/orders/${encodeURIComponent(String(saleId.value))}/complete`, {
        method: "POST",
        body: payload?.allowDebt
          ? {
              allowDebt: true,
              dueDate: payload.dueDate || undefined,
              receiptUrl: payload.receiptUrl || null,
            }
          : {},
      });
      applyOrderState(response);
      receipt.value = { payment: response, order: pickOrder(response) };
      lastCartError.value = "";
      return response;
    } catch (error: any) {
      lastCartError.value = apiErrorMessage(error, "Не удалось завершить продажу.");
      return null;
    } finally {
      completingOrder.value = false;
    }
  }

  async function syncCartItemChanges(
    productId: number | string,
    payload: { quantity?: number; salePrice?: number },
  ) {
    const item = cart.value.find((entry) => String(entry.id) === String(productId));
    if (!item) return;
    if (isItemBusy(productId)) return;

    const parsedQuantity = Number(payload.quantity ?? item.quantity ?? 1);
    const parsedSalePrice = Number(payload.salePrice ?? item.price ?? 0);

    if (!Number.isFinite(parsedQuantity) || !Number.isFinite(parsedSalePrice)) return;
    if (parsedQuantity <= 0) {
      await removeFromCartServer(productId);
      return true;
    }

    const availableQuantity = Math.max(0, Number(item.availableQuantity ?? 0));
    const normalizedQuantity =
      availableQuantity <= 0
        ? Math.max(1, parsedQuantity)
        : Math.min(Math.max(1, parsedQuantity), availableQuantity);
    const normalizedSalePrice = Math.max(0, Math.round(parsedSalePrice));

    if (!saleId.value) {
      item.quantity = normalizedQuantity;
      item.price = normalizedSalePrice;
      return true;
    }

    if (isReturnFlow()) {
      item.quantity = normalizedQuantity;
      item.price = normalizedSalePrice;
      return true;
    }

    try {
      setItemBusy(productId, true);
      const { apiFetch } = useApi();
      const saleIdValue = encodeURIComponent(String(saleId.value));
      const targetItemId = encodeURIComponent(String(item.itemId ?? item.id));
      const body = {
        product_id: item.productId ?? item.publicId ?? item.id,
        quantity: normalizedQuantity,
        sale_price: normalizedSalePrice,
      };
      if (import.meta.client) {
        console.log("[cart] syncCartItemChanges request", {
          saleId: saleId.value,
          itemId: item.itemId ?? item.id,
          productId: item.productId ?? item.publicId ?? item.id,
          body,
        });
      }
      const res: any = await runSaleItemMutation([
        () => apiFetch(`/new-sale/${saleIdValue}/items/${targetItemId}`, {
          method: "PATCH",
          body,
        }),
        () => apiFetch(`/v1/new-sale/${saleIdValue}/items/${targetItemId}`, {
          method: "PATCH",
          body,
        }),
        () => apiFetch(`/v2/new-sale/${saleIdValue}/items/${targetItemId}`, {
          method: "PATCH",
          body,
        }),
        () => apiFetch(`/new-sale/${saleIdValue}/items`, {
          method: "POST",
          body,
        }),
      ]);
      if (import.meta.client) {
        console.log("[cart] syncCartItemChanges response", res);
      }
      if (extractOrderItems(res).length > 0) {
        applyOrderState(res);
      } else {
        await loadSale(saleId.value);
      }
      lastCartError.value = "";
      return res;
    } catch (error: any) {
      if (import.meta.client) {
        console.error("[cart] syncCartItemChanges error", error);
      }
      item.quantity = normalizedQuantity;
      item.price = normalizedSalePrice;
      await loadSale(saleId.value);
      lastCartError.value = apiErrorMessage(error, "Не удалось обновить товар в корзине. Корзина синхронизирована заново.");
      return null;
    } finally {
      setItemBusy(productId, false);
    }
  }

  async function syncCartItemQuantity(productId: number | string, nextQuantity: number) {
    await syncCartItemChanges(productId, { quantity: nextQuantity });
  }

  async function syncCartItemSalePrice(productId: number | string, nextSalePrice: number) {
    await syncCartItemChanges(productId, { salePrice: nextSalePrice });
  }

  async function removeFromCartServer(productId: number | string) {
    if (isItemBusy(productId)) return;
    const item = cart.value.find((entry) => String(entry.id) === String(productId));
    if (!item) return;

    if (!saleId.value || isReturnFlow()) {
      removeFromCart(productId);
      return;
    }

    try {
      setItemBusy(productId, true);
      const { apiFetch } = useApi();
      const saleIdValue = encodeURIComponent(String(saleId.value));
      const targetItemId = encodeURIComponent(String(item.itemId ?? item.id));
      const targetProductId = encodeURIComponent(String(item.productId ?? item.publicId ?? item.id));
      const res: any = await runSaleItemMutation([
        () => apiFetch(`/new-sale/${saleIdValue}/items/${targetItemId}`, { method: "DELETE" }),
        () => apiFetch(`/new-sale/${saleIdValue}/items/${targetProductId}`, { method: "DELETE" }),
      ]);
      applyOrderState(res);
      lastCartError.value = "";
      return;
    } catch (error: any) {
      await loadSale(saleId.value);
      lastCartError.value = apiErrorMessage(error, "Не удалось удалить товар из заказа. Корзина синхронизирована заново.");
    } finally {
      setItemBusy(productId, false);
    }
  }

  async function paySale(payload: SalePaymentPayload) {
    if (!saleId.value) return null;

    const { apiFetch } = useApi();
    payLoading.value = true;
    try {
      const paidSaleId = saleId.value;
      const order = currentOrder.value ?? applyOrderState(await apiFetch(`/new-sale/${encodeURIComponent(String(paidSaleId))}`, { method: "GET" }));
      if (!order || order.items.length === 0) {
        lastCartError.value = "Order must contain at least one item";
        return null;
      }

      const clientId = String(payload.clientId ?? order.customerId ?? "").trim();
      const debtAmount = Math.max(0, Number(payload.debt?.amount_uzs ?? 0));
      const hasDebtMeta = Boolean(
        payload.debt &&
        (debtAmount > 0 || payload.debt.due_date || payload.debt.comment || payload.debt.receipt_url),
      );

      if (hasDebtMeta && !clientId) {
        lastCartError.value = "Customer must be attached before completing an order with debt";
        return null;
      }

      const body: Record<string, unknown> = {
        payment_method: payload.paymentMethodId,
        branch_code: resolveBranchCode() || undefined,
      };

      if (clientId) {
        body.client_id = clientId;
      }

      if (hasDebtMeta) {
        body.debt = {
          ...(debtAmount > 0 ? { amount_uzs: debtAmount } : {}),
          ...(payload.debt?.due_date ? { due_date: payload.debt.due_date } : {}),
          ...(payload.debt?.comment?.trim() ? { comment: payload.debt.comment.trim() } : {}),
          ...(payload.debt?.receipt_url?.trim() ? { receipt_url: payload.debt.receipt_url.trim() } : {}),
        };
      }

      const paymentRes: any = await apiFetch(`/new-sale/${encodeURIComponent(String(paidSaleId))}/pay`, {
        method: "POST",
        body,
      });
      receipt.value = { payment: paymentRes, order: pickOrder(paymentRes) };
      await openFreshSale({ keepReceipt: true });
      return paymentRes;
    } catch (error: any) {
      lastCartError.value = apiErrorMessage(error, "Не удалось провести оплату.");
      return null;
    } finally {
      payLoading.value = false;
    }
  }

  function startReturnSession(payload: {
    sale: ReturnSourceSale;
    items: Array<{
      productId: string | number;
      name: string;
      barcode?: string;
      article?: string;
      quantity: number;
      price: number;
      measurementUnitLabel?: string;
    }>;
  }) {
    resetSaleState({ keepReceipt: true, keepSearchQuery: true });

    saleFlowMode.value = "return";
    sourceSale.value = payload.sale;
    saleId.value = payload.sale.id;
    saleNumber.value = payload.sale.number;
    payableTotal.value = 0;
    discountAmount.value = 0;
    discountPercent.value = 0;

    if (payload.sale.sellerId || payload.sale.sellerName) {
      setSelectedSeller({ id: payload.sale.sellerId, name: payload.sale.sellerName });
    }

    cart.value = payload.items.map((item, index) => ({
      id: `return-${item.productId}-${index}`,
      itemId: `return-${item.productId}-${index}`,
      productId: item.productId,
      name: item.name,
      price: Math.max(0, Number(item.price || 0)),
      barcode: String(item.barcode ?? ""),
      article: String(item.article ?? ""),
      quantity: Math.max(1, Number(item.quantity || 1)),
      availableQuantity: Math.max(1, Number(item.quantity || 1)),
      measurementUnitLabel: resolveMeasurementUnitLabel({
        ...item,
        measurementUnitLabel:
          item?.measurementUnitLabel ?? (item as any)?.measurement_unit_label,
      }),
      shopId: saleShopId.value,
      entryType: "return",
    }));
  }

  async function updateSaleMeta(payload: { paymentMethodId?: string; userId?: string | number }) {
    if (!saleId.value) return null;

    const paymentMethodId = String(payload.paymentMethodId ?? "").trim();
    const userId = String(payload.userId ?? "").trim();

    if (!paymentMethodId && !userId) {
      lastCartError.value = "Не переданы данные для обновления продажи.";
      return null;
    }

    const { apiFetch } = useApi();
    saleMetaLoading.value = true;
    try {
      const body: Record<string, string> = {};

      if (paymentMethodId) {
        body.payment_method = paymentMethodId;
      }

      if (userId) {
        body.user_id = userId;
      }

      const res = await apiFetch(`/order/${encodeURIComponent(String(saleId.value))}/payment-method`, {
        method: "PATCH",
        body,
      });

      await loadSale(saleId.value).catch(() => null);
      lastCartError.value = "";
      return res;
    } catch (error: any) {
      lastCartError.value = apiErrorMessage(error, "Не удалось обновить способ оплаты или продавца.");
      return null;
    } finally {
      saleMetaLoading.value = false;
    }
  }

  async function submitReturnOrExchange(payload?: { paymentMethodId?: string }) {
    if (!isReturnFlow() || !sourceSale.value?.id) return null;

    const returnItems = cart.value
      .filter((item) => isReturnEntry(item))
      .map((item) => ({
        product_id: item.productId,
        quantity: Math.max(1, Number(item.quantity || 1)),
      }));
    const newItems = cart.value
      .filter((item) => isExchangeEntry(item))
      .map((item) => ({
        product_id: item.productId,
        quantity: Math.max(1, Number(item.quantity || 1)),
        sale_price: Math.max(0, Number(item.price || 0)),
      }));

    if (returnItems.length === 0) {
      lastCartError.value = "Р’С‹Р±РµСЂРёС‚Рµ С‚РѕРІР°СЂС‹ РґР»СЏ РІРѕР·РІСЂР°С‚Р°.";
      return null;
    }

    const paymentMethodId = String(payload?.paymentMethodId || sourceSale.value.paymentMethodId || "").trim();
    const userId = String(selectedSellerId.value || sourceSale.value.sellerId || "").trim();
    const isExchange = newItems.length > 0;

    const body: Record<string, unknown> = isExchange
      ? { return_items: returnItems, new_items: newItems }
      : { items: returnItems };

    if (paymentMethodId) {
      body.payment_method = paymentMethodId;
    }

    if (userId) {
      body.user_id = userId;
    }

    const { apiFetch } = useApi();
    payLoading.value = true;
    try {
      const endpoint = isExchange ? "exchange" : "return";
      const res = await apiFetch(`/order/${encodeURIComponent(sourceSale.value.id)}/${endpoint}`, {
        method: "POST",
        body,
      });
      receipt.value = { payment: res, order: res };
      await openFreshSale({ keepReceipt: true });
      return res;
    } catch (error: any) {
      lastCartError.value = apiErrorMessage(error, isExchange ? "РќРµ СѓРґР°Р»РѕСЃСЊ РѕС„РѕСЂРјРёС‚СЊ РѕР±РјРµРЅ." : "РќРµ СѓРґР°Р»РѕСЃСЊ РѕС„РѕСЂРјРёС‚СЊ РІРѕР·РІСЂР°С‚.");
      return null;
    } finally {
      payLoading.value = false;
    }
  }

  async function parkSale(payload?: { parkNote?: string; createNewDraft?: boolean }) {
    if (!saleId.value || isReturnFlow()) return null;

    const shouldCreateNewDraft = payload?.createNewDraft ?? true;
    const { apiFetch } = useApi();
    parkingLoading.value = true;
    try {
      const res: any = await apiFetch(`/new-sale/${encodeURIComponent(String(saleId.value))}/park`, {
        method: "POST",
        body: {
          park_note: payload?.parkNote?.trim() || undefined,
          create_new_draft: shouldCreateNewDraft,
        },
      });

      lastCartError.value = "";

      if (!shouldCreateNewDraft) {
        resetSaleState({ keepReceipt: true });
        return res;
      }

      resetSaleState({ keepReceipt: true, keepSearchQuery: true });
      const nextDraftId = String(
        res?.new_sale?.id ??
        res?.draft_sale?.id ??
        res?.data?.new_sale?.id ??
        res?.data?.draft_sale?.id ??
        "",
      ).trim();

      const nextId = nextDraftId || String(await initSale() || "").trim();
      if (nextId) {
        await loadSale(nextId);
      }

      return res;
    } catch (error: any) {
      lastCartError.value = apiErrorMessage(error, "Не удалось отложить продажу.");
      return null;
    } finally {
      parkingLoading.value = false;
    }
  }

  async function deleteDraftSale() {
    const currentId = String(saleId.value ?? "").trim();
    if (!currentId || isReturnFlow()) {
      resetSaleState({ keepReceipt: true });
      const nextId = await initSale();
      if (nextId) {
        await loadSale(nextId);
      }
      return true;
    }

    const { apiFetch } = useApi();
    cancelLoading.value = true;
    try {
      await apiFetch(`/new-sale/${encodeURIComponent(currentId)}`, {
        method: "DELETE",
      });

      resetSaleState({ keepReceipt: true, keepSearchQuery: true });
      const nextId = await initSale();
      if (nextId) {
        await loadSale(nextId);
      }

      lastCartError.value = "";
      return true;
    } catch (error: any) {
      lastCartError.value = apiErrorMessage(error, "РќРµ СѓРґР°Р»РѕСЃСЊ СѓРґР°Р»РёС‚СЊ С‡РµСЂРЅРѕРІРёРє.");
      return false;
    } finally {
      cancelLoading.value = false;
    }
  }

  async function resumeParkedSale(id: string | number) {
    const parkedId = String(id ?? "").trim();
    if (!parkedId) return null;

    const { apiFetch } = useApi();
    parkingLoading.value = true;
    try {
      const res = await runSaleItemMutation([
        () => apiFetch(`/draft-sales/${encodeURIComponent(parkedId)}/resume`, { method: "POST" }),
        () => apiFetch(`/v2/draft-sales/${encodeURIComponent(parkedId)}/resume`, { method: "POST" }),
        () => apiFetch(`/v2/parked-sales/${encodeURIComponent(parkedId)}/resume`, { method: "POST" }),
        () => apiFetch(`/parked-sales/${encodeURIComponent(parkedId)}/resume`, { method: "POST" }),
      ]);

      resetSaleState({ keepReceipt: true, keepSearchQuery: true });
      await initSale();
      lastCartError.value = "";
      return res;
    } catch (error: any) {
      lastCartError.value = apiErrorMessage(error, "РќРµ СѓРґР°Р»РѕСЃСЊ РІРµСЂРЅСѓС‚СЊ РѕС‚Р»РѕР¶РєСѓ РІ СЂР°Р±РѕС‚Сѓ.");
      return null;
    } finally {
      parkingLoading.value = false;
    }
  }

  async function cancelSale() {
    cancelLoading.value = true;
    try {
      await openFreshSale({ keepReceipt: true });
    } finally {
      cancelLoading.value = false;
    }
  }

  async function applySaleDiscount() {
    if (cart.value.length === 0) {
      discountPercent.value = 0;
      discountAmount.value = 0;
      payableTotal.value = 0;
      return;
    }

    if (!saleId.value) {
      await initSale();
    }

    const sid = saleId.value;
    if (!sid) return;

    discountLoading.value = true;
    try {
      const { apiFetch } = useApi();
      const res: any = await apiFetch(`/new-sale/${encodeURIComponent(String(sid))}/discount`, {
        method: "PUT",
        body: {
          discount_percent: discountType.value === "%" ? Math.max(0, Number(discountValue.value || 0)) : 0,
          discount_amount: discountType.value === "uzs" ? globalDiscountAmount() : 0,
        },
      });
      applyOrderState(res);
    } catch (error: any) {
      lastCartError.value = apiErrorMessage(error, "Не удалось применить скидку.");
    } finally {
      discountLoading.value = false;
    }
  }

  function itemFinalPrice(item: any) {
    return Math.max(0, Math.round(Number(item.price || 0)));
  }

  const returnItemsTotal = computed(() =>
    cart.value
      .filter((item) => isReturnEntry(item))
      .reduce((sum, item) => sum + Number(item.price || 0) * Math.max(1, Number(item.quantity || 1)), 0),
  );

  const exchangeItemsTotal = computed(() =>
    cart.value
      .filter((item) => isExchangeEntry(item))
      .reduce((sum, item) => sum + Number(item.price || 0) * Math.max(1, Number(item.quantity || 1)), 0),
  );

  const subtotal = computed(() =>
    isReturnFlow()
      ? exchangeItemsTotal.value
      : currentOrder.value
      ? Number(currentOrder.value.totalPrice || 0) + Number(currentOrder.value.discountAmount || 0)
      : cart.value.reduce(
          (sum, item) => sum + Number(item.price || 0) * Math.max(1, Number(item.quantity || 1)),
          0
        )
  );

  const itemDiscounts = computed(() => 0);

  function globalDiscountAmount() {
    const base = Math.max(0, subtotal.value - itemDiscounts.value);

    if (discountType.value === "%") {
      return Math.max(0, Math.round((base * discountValue.value) / 100));
    }

    return Math.round(Math.min(base, discountValue.value));
  }

  const total = computed(() => {
    if (isReturnFlow()) return Number(exchangeItemsTotal.value - returnItemsTotal.value);
    if (currentOrder.value) return Number(currentOrder.value.totalPrice || 0);
    const afterItemDiscounts = subtotal.value - itemDiscounts.value;
    return Math.max(0, afterItemDiscounts - globalDiscountAmount());
  });

  const totalDiscount = computed(() =>
    isReturnFlow()
      ? 0
      : currentOrder.value
        ? Number(currentOrder.value.discountAmount || 0)
        : itemDiscounts.value + globalDiscountAmount(),
  );

  const paidAmount = computed(() =>
    Math.max(0, Number(currentOrder.value?.paidAmount ?? 0)),
  );

  const remainingDebtAmount = computed(() =>
    Math.max(
      0,
      Number(
        currentOrder.value?.remainingDebtAmount ??
        Math.max(0, Number(total.value || 0) - Number(paidAmount.value || 0)),
      ),
    ),
  );

  const createdDebt = computed(() => currentOrder.value?.createdDebt ?? null);

  function itemGlobalDiscountShare(item: any) {
    if (isReturnFlow()) return 0;
    const totalGlobalDiscount = currentOrder.value
      ? Math.max(0, Number(currentOrder.value.discountAmount || 0))
      : globalDiscountAmount();
    const lineBases = cart.value.map((cartItem) => ({
      id: cartItem.id,
      quantity: Math.max(1, Number(cartItem.quantity || 1)),
      lineBase: itemFinalPrice(cartItem) * Math.max(1, Number(cartItem.quantity || 1)),
    }));

    const totalBase = lineBases.reduce((sum, entry) => sum + entry.lineBase, 0);
    if (totalGlobalDiscount <= 0 || totalBase <= 0) return 0;

    const rawShares = lineBases.map((entry) => {
      const exactShare = (entry.lineBase / totalBase) * totalGlobalDiscount;
      const flooredShare = Math.floor(exactShare);
      return {
        id: entry.id,
        flooredShare,
        fraction: exactShare - flooredShare,
      };
    });

    let assigned = rawShares.reduce((sum, entry) => sum + entry.flooredShare, 0);
    let remainder = totalGlobalDiscount - assigned;

    rawShares
      .sort((a, b) => b.fraction - a.fraction)
      .forEach((entry) => {
        if (remainder <= 0) return;
        entry.flooredShare += 1;
        remainder -= 1;
      });

    return rawShares.find((entry) => entry.id === item.id)?.flooredShare ?? 0;
  }

  function itemFinalPriceWithGlobal(item: any) {
    const unitPrice = itemFinalPrice(item);
    const quantity = Math.max(1, Number(item.quantity || 1));
    const lineBase = unitPrice * quantity;
    const lineDiscount = itemGlobalDiscountShare(item);
    const lineFinal = Math.max(0, lineBase - lineDiscount);

    return Math.max(0, Math.round(lineFinal / quantity));
  }

  loadLocalState();

  watch(
    [
      cart,
      saleId,
      saleShopId,
      saleNumber,
      currentOrder,
      discountValue,
      discountType,
      discountPercent,
      discountAmount,
      payableTotal,
    ],
    () => {
      saveLocalState();
    },
    { deep: true }
  );

  return {
    cart,
    saleId,
    saleShopId,
    saleNumber,
    currentOrder,
    saleFlowMode,
    sourceSale,
    selectedSellerId,
    selectedSellerName,
    receipt,
    orderRaw,
    lastCartError,
    productsLoading,
    creatingSale,
    loadingSale,
    addingItem,
    payLoading,
    completingOrder,
    cancelLoading,
    parkingLoading,
    saleMetaLoading,
    paymentMethods,
    paymentMethodsLoading,
    referenceDataLoading,
    cashBoxes,
    selectedCashBox,
    saleCheque,
    shopInfo,
    orderDraftDebt,
    loyaltyProgram,
    companyCurrency,
    restoringSale,
    itemBusyMap,
    products,
    searchQuery,
    filteredProducts,
    totalDiscount,
    payableTotal,
    paidAmount,
    remainingDebtAmount,
    createdDebt,
    supportsOrdersDebtFlow,
    returnItemsTotal,
    exchangeItemsTotal,
    discountPercent,
    discountAmount,
    discountLoading,
    initSale,
    openFreshSale,
    leaveActiveSale,
    leaveActiveSaleOnUnload,
    loadSale,
    addToCartServer,
    addToCart,
    setCartItemQuantity,
    syncCartItemChanges,
    syncCartItemQuantity,
    syncCartItemSalePrice,
    removeFromCart,
    removeFromCartServer,
    applySaleDiscount,
    paySale,
    addOrderPayment,
    removeOrderPayment,
    attachCustomer,
    setCustomerSelection,
    completeOrder,
    parkSale,
    deleteDraftSale,
    resumeParkedSale,
    submitReturnOrExchange,
    startReturnSession,
    setSelectedSeller,
    updateSaleMeta,
    loadPaymentMethods,
    createPaymentType,
    loadCashBoxes,
    createCashbox,
    loadShopInfo,
    loadLoyaltyProgram,
    loadCompanyCurrency,
    loadSaleCheque,
    loadOrderDraftDebt,
    loadSaleReferenceData,
    cancelSale,
    itemFinalPrice,
    itemFinalPriceWithGlobal,
    clearCart,
    resetSaleState,
    subtotal,
    itemDiscounts,
    total,
    discountValue,
    discountType,
    globalDiscountAmount,
    getCartItemQuantity,
    isItemBusy,
    hasSaleShopMismatch,
    resolveCurrentShopId,
  };
});

async function runSaleItemMutation(
  attempts: Array<() => Promise<unknown>>,
) {
  let lastError: unknown = null;

  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

function extractOrderItems(res: any) {
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.products)) return res.products;
  if (Array.isArray(res?.order_detail?.items)) return res.order_detail.items;
  if (Array.isArray(res?.data?.items)) return res.data.items;
  if (Array.isArray(res?.data?.products)) return res.data.products;
  if (Array.isArray(res?.order_items)) return res.order_items;
  if (Array.isArray(res?.order_detail?.order_items)) return res.order_detail.order_items;
  if (Array.isArray(res?.data?.order_items)) return res.data.order_items;
  if (Array.isArray(res?.data?.order_detail?.items)) return res.data.order_detail.items;
  if (Array.isArray(res?.data?.order_detail?.order_items)) {
    return res.data.order_detail.order_items;
  }
  return [];
}

function resolveSaleItemName(item: any) {
  return (
    item?.name ??
    item?.product_name ??
    item?.title ??
    item?.product?.name ??
    item?.product?.product_name ??
    item?.product?.title ??
    "Товар"
  );
}

function resolveSaleItemBarcode(item: any) {
  return String(
    item?.barcode ??
      item?.product_barcode ??
      item?.plu_code ??
      item?.product?.barcode ??
      item?.product?.product_barcode ??
      item?.product?.plu_code ??
      "",
  );
}

function resolveSaleItemArticle(item: any) {
  return String(
    item?.sku ??
      item?.article ??
      item?.vendor_code ??
      item?.product?.sku ??
      item?.product?.article ??
      item?.product?.vendor_code ??
      "",
  );
}



function isUuidLike(value: unknown) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value ?? "").trim(),
  );
}

