import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { useApi } from "~/composables/useApi";
import { useLocationStore } from "./useLocationStore";
import { useUserStore } from "./useUserStore";


type CartProduct = {
  id: number | string;
  publicId?: string;
  name: string;
  price: number;
  barcode: string;
  article: string;
  availableQuantity?: number;
  shopId?: string;
  quantity?: number;
  productId?: string | number;
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
  client_name?: string;
};

type PosOrderStatus =
  | "draft"
  | "paid"
  | "cancelled"
  | "parked"
  | "returned"
  | "partially_returned"
  | "exchanged"
  | "partially_exchanged";

type PosOrder = {
  id: string;
  orderNumber: string;
  status: PosOrderStatus;
  shopId: string;
  cashboxId?: string | null;
  items: any[];
  payments: any[];
  totalPrice: number;
  discountAmount: number;
  paidAmount: number;
  comment?: string | null;
  customerId?: string | null;
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

  const products = ref<CartProduct[]>([
    {
      id: 1,
      name: "Чехол для iPhone 12",
      price: 50000,
      barcode: "123456789",
      article: "123456789",
      availableQuantity: 10,
    },
    {
      id: 2,
      name: "Стекло для Samsung S22",
      price: 80000,
      barcode: "987654321",
      article: "S22-GLASS",
      availableQuantity: 7,
    },
    {
      id: 3,
      name: "Зарядка Type-C",
      price: 120000,
      barcode: "456123789",
      article: "TYPEC-CHARGER",
      availableQuantity: 15,
    },
    {
      id: 4,
      name: "Наушники AirPods",
      price: 1500000,
      barcode: "741852963",
      article: "AIRPODS",
      availableQuantity: 3,
    },
  ]);

  const searchQuery = ref("");
  const discountValue = ref(0);
  const discountType = ref<"%" | "uzs">("%");

  const filteredProducts = computed(() => {
    const q = searchQuery.value.toLowerCase();
    return products.value.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.article.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q)
    );
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
    const payments = Array.isArray(source.payments)
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
      comment: source.comment ?? null,
      customerId: source.customerId ?? source.customer_id ?? null,
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
    if (saleId.value) return saleId.value;
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

    const nextId = await initSale();
    if (nextId) {
      await loadSale(nextId);
    }

    return nextId;
  }

  async function loadSale(sid?: string | number | null) {
    const id = sid ?? saleId.value;
    if (!id) return null;

    loadingSale.value = true;
    restoringSale.value = true;
    try {
      const { apiFetch } = useApi();
      const res: any = await apiFetch(`/new-sale/${encodeURIComponent(String(id))}`, { method: "GET" });
      applyOrderState(res);
      return res;
      const items = extractOrderItems(res);

      cart.value = items.map((it: any) => ({
        id: it.product_id ?? it.id ?? it.product?.id,
        name: it.name ?? it.product?.name ?? "Товар",
        price: Number(it.sale_price ?? it.price ?? it.retail_price ?? 0),
        barcode: it.barcode ?? it.product?.barcode ?? "",
        article: it.sku ?? it.article ?? it.product?.sku ?? "",
        quantity: Number(it.quantity ?? it.qty ?? 1),
        availableQuantity: Number(
          it?.shop_measurement_values?.[0]?.total_active_measurement_value ??
            it?.measurement_values?.total_active_measurement_value ??
            it?.measurement_values?.total_measurement_value ??
            it?.product_stock?.quantity ??
            it?.stock?.quantity ??
            it?.available_quantity ??
            it?.product?.shop_measurement_values?.[0]?.total_active_measurement_value ??
            it?.product?.measurement_values?.total_active_measurement_value ??
            it?.product?.measurement_values?.total_measurement_value ??
            it?.product?.product_stock?.quantity ??
            0,
        ),
        shopId: String(
          it?.shop_measurement_values?.[0]?.shop_id ??
            it?.shop_prices?.[0]?.shop_id ??
            it?.shop_id ??
            it?.product_stock?.shop_id ??
            it?.stock?.shop_id ??
            it?.product?.shop_measurement_values?.[0]?.shop_id ??
            it?.product?.shop_prices?.[0]?.shop_id ??
            saleShopId.value ??
            resolveCurrentShopId() ??
            "",
        ),
      }));

      saleId.value = String(res?.id ?? res?.data?.id ?? saleId.value ?? "");
      saleShopId.value = String(
        res?.shop_id ??
          res?.order_detail?.shop_id ??
          res?.data?.shop_id ??
          res?.data?.order_detail?.shop_id ??
          res?.order?.shop_id ??
          saleShopId.value ??
          resolveCurrentShopId() ??
          "",
      );
      saleNumber.value = String(
        res?.order_number ??
          res?.number ??
          res?.data?.order_number ??
          res?.data?.number ??
          saleNumber.value ??
          "",
      ) || saleNumber.value;
      orderRaw.value = res;
      discountPercent.value = Number(res?.discount_percent ?? discountPercent.value ?? 0);
      discountAmount.value = Number(res?.discount_amount ?? discountAmount.value ?? 0);
      payableTotal.value = Number(
        res?.payable_total ??
          res?.total_price ??
          res?.order_detail?.total_price ??
          res?.data?.total_price ??
          res?.data?.order_detail?.total_price ??
          res?.total ??
          res?.amount ??
          res?.grand_total ??
          payableTotal.value ??
          0,
      );
      await loadOrderDraftDebt(saleId.value).catch(() => {
        orderDraftDebt.value = null;
      });

      return res;
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

  async function syncCartItemQuantity(productId: number | string, nextQuantity: number) {
    const item = cart.value.find((entry) => String(entry.id) === String(productId));
    if (!item) return;
    if (isItemBusy(productId)) return;

    const availableQuantity = Math.max(0, Number(item.availableQuantity ?? 0));
    const normalizedQuantity =
      availableQuantity <= 0
        ? 0
        : Math.min(Math.max(1, Number(nextQuantity || 1)), availableQuantity);

    if (!saleId.value) {
      item.quantity = normalizedQuantity;
      return;
    }

    if (isReturnFlow()) {
      item.quantity = normalizedQuantity;
      return;
    }

    try {
      setItemBusy(productId, true);
      const { apiFetch } = useApi();
      const res: any = await apiFetch(`/new-sale/${encodeURIComponent(String(saleId.value))}/items`, {
        method: "POST",
        body: {
          product_id: item.productId ?? item.publicId ?? item.id,
          quantity: normalizedQuantity,
          sale_price: Number(item.price || 0),
        },
      });
      applyOrderState(res);
      lastCartError.value = "";
      return;
    } catch (error: any) {
      item.quantity = normalizedQuantity;
      await loadSale(saleId.value);
      lastCartError.value = apiErrorMessage(error, "Не удалось обновить количество товара. Корзина синхронизирована заново.");
    } finally {
      setItemBusy(productId, false);
    }
  }

  async function removeFromCartServer(productId: number | string) {
    if (isItemBusy(productId)) return;
    const item = cart.value.find((entry) => String(entry.id) === String(productId));

    if (!saleId.value || isReturnFlow()) {
      removeFromCart(productId);
      return;
    }

    try {
      setItemBusy(productId, true);
      const { apiFetch } = useApi();
      const res: any = await apiFetch(
        `/new-sale/${encodeURIComponent(String(saleId.value))}/items/${encodeURIComponent(String(item?.itemId ?? productId))}`,
        { method: "DELETE" },
      );
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

      const paymentRes: any = await apiFetch(`/new-sale/${encodeURIComponent(String(paidSaleId))}/pay`, {
        method: "POST",
        body: {
          payment_method: payload.paymentMethodId,
          client_name: payload.client_name?.trim() || undefined,
          branch_code: resolveBranchCode() || undefined,
        },
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
      lastCartError.value = "Выберите товары для возврата.";
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
      lastCartError.value = apiErrorMessage(error, isExchange ? "Не удалось оформить обмен." : "Не удалось оформить возврат.");
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
      lastCartError.value = apiErrorMessage(error, "Не удалось удалить черновик.");
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
        () => apiFetch(`/v2/parked-sales/${encodeURIComponent(parkedId)}/resume`, { method: "POST" }),
        () => apiFetch(`/parked-sales/${encodeURIComponent(parkedId)}/resume`, { method: "POST" }),
      ]);

      resetSaleState({ keepReceipt: true, keepSearchQuery: true });
      await loadSale(parkedId);
      lastCartError.value = "";
      return res;
    } catch (error: any) {
      lastCartError.value = apiErrorMessage(error, "Не удалось вернуть отложку в работу.");
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
    returnItemsTotal,
    exchangeItemsTotal,
    discountPercent,
    discountAmount,
    discountLoading,
    initSale,
    openFreshSale,
    loadSale,
    addToCartServer,
    addToCart,
    setCartItemQuantity,
    syncCartItemQuantity,
    removeFromCart,
    removeFromCartServer,
    applySaleDiscount,
    paySale,
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
