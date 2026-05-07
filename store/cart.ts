import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { useApi } from "~/composables/useApi";
import { useLocationStore } from "./useLocationStore";
import { useUserStore } from "./useUserStore";


type CartProduct = {
  id: number | string;
  name: string;
  price: number;
  barcode: string;
  article: string;
  availableQuantity?: number;
  shopId?: string;
  quantity?: number;
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

export const useCartStore = defineStore("cart", () => {
  const STORAGE_KEY = "pos-cart-state";

  const cart = ref<any[]>([]);
  const saleId = ref<string | number | null>(null);
  const saleNumber = ref<string | null>(null);
  const receipt = ref<any | null>(null);
  const saleShopId = ref<string>("");

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

  function hasSaleShopMismatch(shopId?: string | number | null) {
    const currentShopId = String(shopId ?? resolveCurrentShopId() ?? "");
    return Boolean(
      saleId.value &&
      saleShopId.value &&
      currentShopId &&
      String(saleShopId.value) !== currentShopId,
    );
  }

  async function loadPaymentMethods(inputCompanyId?: string) {
    const companyId = resolveCompanyId(inputCompanyId);

    paymentMethodsLoading.value = true;
    try {
      const { apiFetch } = useApi();
      const res: any = await apiFetch("/company-payment-type", {
        method: "GET",
        query: companyId ? { company_id: companyId, limit: 1000 } : { limit: 1000 },
      });

      const items = Array.isArray(res)
        ? res
        : Array.isArray(res?.company_payment_types)
          ? res.company_payment_types
          : Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res?.data?.company_payment_types)
              ? res.data.company_payment_types
              : [];

      paymentMethods.value = items
        .map((item: any) => ({
          id: String(item?.id ?? ""),
          name: String(item?.name ?? item?.payment_type_name ?? item?.payment_type?.name ?? ""),
          paymentTypeId: item?.payment_type_id
            ? String(item.payment_type_id)
            : item?.payment_type?.id
              ? String(item.payment_type.id)
              : undefined,
          paymentTypeName: item?.payment_type_name
            ? String(item.payment_type_name)
            : item?.payment_type?.name
              ? String(item.payment_type.name)
              : undefined,
          isCash: Boolean(item?.is_cash_payment_type),
          dontShowInMakePayment: Boolean(item?.dont_show_in_make_payment),
        }))
        .filter((item: CompanyPaymentMethod) => Boolean(item.id && item.name));
    } catch {
      paymentMethods.value = [];
    } finally {
      paymentMethodsLoading.value = false;
    }
  }

  async function loadCashBoxes() {
    const { apiFetch } = useApi();
    const res: any = await apiFetch("/v1/cash-box", {
      method: "GET",
      query: { limit: 100 },
    });
    const items = Array.isArray(res?.cash_boxes)
      ? res.cash_boxes
      : Array.isArray(res?.data?.cash_boxes)
        ? res.data.cash_boxes
        : Array.isArray(res)
          ? res
          : [];
    const shopId = String(resolveCurrentShopId() || "");

    cashBoxes.value = items;
    selectedCashBox.value =
      items.find((cashBox: any) => String(cashBox?.shop_id ?? cashBox?.shop?.id ?? "") === shopId) ??
      items[0] ??
      null;

    return selectedCashBox.value;
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
      const shopId = resolveCurrentShopId();
      const res: any = await apiFetch("/new-sale", {
        method: "POST",
      });
      const orderId = res?.data?.id ?? res?.id ?? res?.order?.id ?? null;
      saleId.value = orderId != null ? String(orderId) : null;
      saleShopId.value = String(
        res?.shop_id ??
          res?.data?.shop_id ??
          res?.order?.shop_id ??
          shopId ??
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
      discountPercent.value = Number(res?.discount_percent ?? 0);
      discountAmount.value = Number(res?.discount_amount ?? 0);
      payableTotal.value = Number(res?.payable_total ?? 0);
      if (saleId.value) {
        await loadOrderDraftDebt(saleId.value).catch(() => {
          orderDraftDebt.value = null;
        });
      }
      return saleId.value;
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
      const res: any = await apiFetch(`/new-sale/${id}`, { method: "GET" });
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
      await apiFetch(`/new-sale/${sid}/items`, {
        method: "POST",
        body: { product_id: product.id, quantity: 1, sale_price: product.price },
      });
      await loadSale(sid);
    } catch (error: any) {
      lastCartError.value =
        error?.data?.message || error?.message || "Не удалось добавить товар в продажу.";
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
      await runSaleItemMutation([
        () =>
          useApi().apiFetch(
            `/new-sale/${saleId.value}/items/${encodeURIComponent(String(productId))}`,
            {
              method: "PUT",
              body: { quantity: normalizedQuantity },
            },
          ),
        () =>
          useApi().apiFetch(
            `/new-sale/${saleId.value}/items/${encodeURIComponent(String(productId))}`,
            {
              method: "PATCH",
              body: { quantity: normalizedQuantity },
            },
          ),
        () =>
          useApi().apiFetch(`/new-sale/${saleId.value}/items`, {
            method: "PUT",
            body: { product_id: productId, quantity: normalizedQuantity },
          }),
      ]);
      await loadSale(saleId.value);
      lastCartError.value = "";
    } catch {
      item.quantity = normalizedQuantity;
      await loadSale(saleId.value);
      lastCartError.value = "Не удалось обновить количество товара. Корзина синхронизирована заново.";
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
      await runSaleItemMutation([
        () =>
          useApi().apiFetch(
            `/new-sale/${saleId.value}/items/${encodeURIComponent(String(productId))}`,
            {
              method: "DELETE",
            },
          ),
        () =>
          useApi().apiFetch(`/new-sale/${saleId.value}/items`, {
            method: "DELETE",
            body: { product_id: productId },
          }),
      ]);
      await loadSale(saleId.value);
      lastCartError.value = "";
    } catch {
      await loadSale(saleId.value);
      lastCartError.value = "Не удалось удалить товар из продажи. Корзина синхронизирована заново.";
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
      const res: any = await apiFetch(`/new-sale/${paidSaleId}/pay`, {
        method: "POST",
        body: payload,
      });
      let paidOrder: any = null;
      try {
        paidOrder = await apiFetch(`/new-sale/${paidSaleId}`, { method: "GET" });
      } catch {
        paidOrder = null;
      }
      receipt.value = { payment: res, order: paidOrder };
      resetSaleState({ keepReceipt: true });
      return res;
    } catch (error: any) {
      lastCartError.value =
        error?.data?.message || error?.message || "Не удалось провести оплату.";
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
          await apiFetch(`/new-sale/${saleId.value}`, { method: "DELETE" });
        } catch {}
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
      const body: any = {};

      if (discountType.value === "%") {
        body.discount_percent = Number(discountValue.value || 0);
      } else {
        body.discount_amount = Number(discountValue.value || 0);
      }

      const res: any = await apiFetch(`/new-sale/${sid}/discount`, {
        method: "PUT",
        body,
      });

      discountPercent.value = Number(res?.discount_percent ?? discountPercent.value ?? 0);
      discountAmount.value = Number(res?.discount_amount ?? discountAmount.value ?? 0);
      payableTotal.value = Number(res?.payable_total ?? payableTotal.value ?? 0);
    } catch {
      // ignore in local POS mode
    } finally {
      discountLoading.value = false;
    }
  }

  function itemFinalPrice(item: any) {
    return Math.max(0, Math.round(Number(item.price || 0)));
  }

  const subtotal = computed(() =>
    cart.value.reduce(
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
    const afterItemDiscounts = subtotal.value - itemDiscounts.value;
    return Math.max(0, afterItemDiscounts - globalDiscountAmount());
  });

  const totalDiscount = computed(() => itemDiscounts.value + globalDiscountAmount());

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
    loadCashBoxes,
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
