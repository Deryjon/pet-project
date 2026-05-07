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
  payment_method: string;
  client_name?: string;
};

type PosOrderStatus = "DRAFT" | "COMPLETED" | "CANCELLED" | "PARKED" | "RETURNED";

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

export const useCartStore = defineStore("cart", () => {
  const STORAGE_KEY = "pos-cart-state";

  const cart = ref<any[]>([]);
  const saleId = ref<string | number | null>(null);
  const saleNumber = ref<string | null>(null);
  const receipt = ref<any | null>(null);
  const saleShopId = ref<string>("");
  const currentOrder = ref<PosOrder | null>(null);

  const productsLoading = ref(false);
  const creatingSale = ref(false);
  const loadingSale = ref(false);
  const addingItem = ref(false);
  const payLoading = ref(false);
  const cancelLoading = ref(false);
  const discountLoading = ref(false);
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

    return {
      id: String(source.id),
      orderNumber: String(source.orderNumber ?? source.order_number ?? source.number ?? ""),
      status: String(source.status ?? "DRAFT").toUpperCase() as PosOrderStatus,
      shopId: String(source.shopId ?? source.shop_id ?? ""),
      cashboxId: source.cashboxId ?? source.cashbox_id ?? null,
      items: Array.isArray(source.items) ? source.items : [],
      payments: Array.isArray(source.payments) ? source.payments : [],
      totalPrice: Number(source.totalPrice ?? source.total_price ?? source.payableTotal ?? source.payable_total ?? 0),
      discountAmount: Number(source.discountAmount ?? source.discount_amount ?? 0),
      paidAmount: Number(source.paidAmount ?? source.paid_amount ?? 0),
      comment: source.comment ?? null,
      customerId: source.customerId ?? source.customer_id ?? null,
      versionNumber: Number(source.versionNumber ?? source.version_number ?? 1),
    };
  }

  function applyOrderState(raw: any) {
    const order = normalizeOrder(raw);
    if (!order) return null;

    currentOrder.value = order;
    saleId.value = order.id;
    saleNumber.value = order.orderNumber || saleNumber.value;
    saleShopId.value = order.shopId || saleShopId.value;
    orderRaw.value = pickOrder(raw);
    discountAmount.value = order.discountAmount;
    discountPercent.value = 0;
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
        price: Number(item?.price ?? item?.sellPrice ?? item?.sell_price ?? item?.unitPrice ?? item?.unit_price ?? product?.sellPrice ?? product?.sell_price ?? product?.price ?? 0),
        barcode: String(item?.barcode ?? product?.barcode ?? ""),
        article: String(item?.sku ?? item?.article ?? product?.sku ?? product?.article ?? ""),
        quantity: Number(item?.quantity ?? item?.qty ?? 1),
        availableQuantity: Number(item?.stock ?? product?.stock ?? product?.quantity ?? 0),
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
      const { apiFetch } = useApi();
      const res: any = await apiFetch("/payment-types", { method: "GET" });

      const items = Array.isArray(res)
        ? res
        : Array.isArray(res?.paymentTypes)
          ? res.paymentTypes
          : Array.isArray(res?.payment_types)
            ? res.payment_types
          : Array.isArray(res?.data)
            ? res.data
            : [];

      paymentMethods.value = items
        .map((item: any) => ({
          id: String(item?.id ?? ""),
          name: String(item?.name ?? ""),
          paymentTypeId: String(item?.id ?? ""),
          paymentTypeName: Boolean(item?.isCash ?? item?.is_cash) ? "Cash" : "",
          isCash: Boolean(item?.isCash ?? item?.is_cash),
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
      const shopId = String(resolveCurrentShopId() || "");
      const cashboxId = selectedCashBox.value?.id ? String(selectedCashBox.value.id) : undefined;
      const res: any = await apiFetch("/orders", {
        method: "POST",
        body: { shopId, cashboxId },
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

  async function loadSale(sid?: string | number | null) {
    const id = sid ?? saleId.value;
    if (!id) return null;

    loadingSale.value = true;
    restoringSale.value = true;
    try {
      const { apiFetch } = useApi();
      const res: any = await apiFetch(`/orders/${encodeURIComponent(String(id))}`, { method: "GET" });
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
      const res: any = await apiFetch(`/orders/${encodeURIComponent(String(sid))}/items`, {
        method: "POST",
        body: { productId: product.productId || product.publicId || product.id, quantity: 1 },
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

    try {
      setItemBusy(productId, true);
      const { apiFetch } = useApi();
      const res: any = await apiFetch(
        `/orders/${encodeURIComponent(String(saleId.value))}/items/${encodeURIComponent(String(productId))}`,
        {
          method: "PATCH",
          body: { quantity: normalizedQuantity },
        },
      );
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

    if (!saleId.value) {
      removeFromCart(productId);
      return;
    }

    try {
      setItemBusy(productId, true);
      const { apiFetch } = useApi();
      const res: any = await apiFetch(
        `/orders/${encodeURIComponent(String(saleId.value))}/items/${encodeURIComponent(String(productId))}`,
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
      const order = currentOrder.value ?? applyOrderState(await apiFetch(`/orders/${encodeURIComponent(String(paidSaleId))}`, { method: "GET" }));
      if (!order || order.items.length === 0) {
        lastCartError.value = "Order must contain at least one item";
        return null;
      }

      const amountDue = Math.max(0, Number(order.totalPrice || 0) - Number(order.paidAmount || 0));
      if (amountDue > 0) {
        const paymentRes: any = await apiFetch(`/orders/${encodeURIComponent(String(paidSaleId))}/payments`, {
          method: "POST",
          body: { paymentTypeId: payload.payment_method, amount: amountDue },
        });
        applyOrderState(paymentRes);
      }

      const latestOrder = currentOrder.value;
      if (!latestOrder || Number(latestOrder.paidAmount || 0) < Number(latestOrder.totalPrice || 0)) {
        lastCartError.value = "Order is not fully paid";
        return null;
      }

      const completeRes: any = await apiFetch(`/orders/${encodeURIComponent(String(paidSaleId))}/complete`, { method: "POST" });
      const completedOrder = applyOrderState(completeRes);
      receipt.value = { payment: completeRes, order: completedOrder ?? pickOrder(completeRes) };
      resetSaleState({ keepReceipt: true });
      return completeRes;
    } catch (error: any) {
      lastCartError.value = apiErrorMessage(error, "Не удалось провести оплату.");
      return null;
    } finally {
      payLoading.value = false;
    }
  }

  async function cancelSale() {
    const { apiFetch } = useApi();
    cancelLoading.value = true;
    try {
      if (saleId.value) {
        try {
          const res: any = await apiFetch(`/orders/${encodeURIComponent(String(saleId.value))}/cancel`, { method: "POST" });
          applyOrderState(res);
        } catch (error: any) {
          lastCartError.value = apiErrorMessage(error, "Не удалось отменить заказ.");
        }
      }
      resetSaleState();
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
      const res: any = await apiFetch(`/orders/${encodeURIComponent(String(sid))}/discount`, {
        method: "PATCH",
        body: { discountAmount: globalDiscountAmount() },
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

  const subtotal = computed(() =>
    currentOrder.value
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
    if (currentOrder.value) return Number(currentOrder.value.totalPrice || 0);
    const afterItemDiscounts = subtotal.value - itemDiscounts.value;
    return Math.max(0, afterItemDiscounts - globalDiscountAmount());
  });

  const totalDiscount = computed(() => currentOrder.value ? Number(currentOrder.value.discountAmount || 0) : itemDiscounts.value + globalDiscountAmount());

  function itemGlobalDiscountShare(item: any) {
    const totalGlobalDiscount = globalDiscountAmount();
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
    receipt,
    orderRaw,
    lastCartError,
    productsLoading,
    creatingSale,
    loadingSale,
    addingItem,
    payLoading,
    cancelLoading,
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
    discountPercent,
    discountAmount,
    discountLoading,
    initSale,
    loadSale,
    addToCartServer,
    addToCart,
    setCartItemQuantity,
    syncCartItemQuantity,
    removeFromCart,
    removeFromCartServer,
    applySaleDiscount,
    paySale,
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
