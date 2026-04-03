import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { useApi } from "~/composables/useApi";
import { useLocationStore } from "./useLocationStore";
import { useUserStore } from "./useUserStore";

type PaymentMethodCode = "cash" | "card" | "payme" | "click" | "transfer";

type OrderPaymentPayload = {
  comment: string;
  payments: Array<{
    company_payment_type_id: string;
    paid_amount: number;
    returned_amount: number;
    skip_ofd: boolean;
  }>;
  with_cashback: number;
  without_cashback: boolean;
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

  const discountPercent = ref<number>(0);
  const discountAmount = ref<number>(0);
  const payableTotal = ref<number>(0);
  const orderRaw = ref<any | null>(null);
  const lastCartError = ref<string>("");

  const products = ref([
    {
      id: 1,
      name: "Чехол для iPhone 12",
      price: 50000,
      barcode: "123456789",
      article: "123456789",
    },
    {
      id: 2,
      name: "Стекло для Samsung S22",
      price: 80000,
      barcode: "987654321",
      article: "S22-GLASS",
    },
    {
      id: 3,
      name: "Зарядка Type-C",
      price: 120000,
      barcode: "456123789",
      article: "TYPEC-CHARGER",
    },
    {
      id: 4,
      name: "Наушники AirPods",
      price: 1500000,
      barcode: "741852963",
      article: "AIRPODS",
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

  function resolveCurrentShopId() {
    const locationStore = useLocationStore();
    const userStore = useUserStore();

    return (
      locationStore.selectedLocation?.id ||
      userStore.location?.id ||
      userStore.user.currentShopId ||
      userStore.user.branchCode ||
      ""
    );
  }

  function paymentTypeIdByMethod(method: PaymentMethodCode) {
    const config = useRuntimeConfig();
    const mapping = (config.public as any)?.posPaymentTypeIds as
      | Partial<Record<PaymentMethodCode, string>>
      | undefined;

    return String(
      mapping?.[method] ||
        mapping?.cash ||
        "41839fa3-4121-4572-ab19-394e3a7319fe",
    );
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
      discountValue: Number(product?.discountValue ?? 0),
      discountType: product?.discountType === "uzs" ? "uzs" : "%",
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
    if (!process.client) return;

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
    if (!process.client) return;

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      cart.value = Array.isArray(parsed?.cart) ? parsed.cart : [];
      saleId.value = parsed?.saleId ?? null;
      saleShopId.value = String(parsed?.saleShopId ?? "");
      saleNumber.value = parsed?.saleNumber ?? null;
      orderRaw.value = parsed?.orderRaw ?? null;
      discountValue.value = Number(parsed?.discountValue ?? 0);
      discountType.value = parsed?.discountType === "uzs" ? "uzs" : "%";
      discountPercent.value = Number(parsed?.discountPercent ?? 0);
      discountAmount.value = Number(parsed?.discountAmount ?? 0);
      payableTotal.value = Number(parsed?.payableTotal ?? 0);
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
      const res: any = await apiFetch("/v2/order", {
        method: "POST",
        body: shopId ? { shop_id: shopId } : {},
      });
      const orderId = res?.id ?? res?.data?.id ?? res?.order?.id ?? null;
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
      return saleId.value;
    } finally {
      creatingSale.value = false;
    }
  }

  async function loadSale(sid?: string | number | null) {
    const id = sid ?? saleId.value;
    if (!id) return null;

    loadingSale.value = true;
    try {
      const { apiFetch } = useApi();
      const res: any = await apiFetch(`/v2/order/${id}`, { method: "GET" });
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
        discountValue: 0,
        discountType: "%",
      }));

      saleId.value = String(res?.id ?? res?.data?.id ?? saleId.value ?? "");
      saleShopId.value = String(
        res?.shop_id ??
          res?.data?.shop_id ??
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
          res?.total ??
          res?.amount ??
          res?.grand_total ??
          payableTotal.value ??
          0,
      );

      return res;
    } finally {
      loadingSale.value = false;
    }
  }

  async function addToCartServer(product: any) {
    try {
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
    } catch {
      upsertCartItem(product, 1);
    } finally {
      addingItem.value = false;
      searchQuery.value = "";
    }
  }

  function addToCart(product: any) {
    void addToCartServer(product);
  }

  function removeFromCart(id: number) {
    cart.value = cart.value.filter((c) => c.id !== id);
  }

  function clearCart() {
    cart.value = [];
  }

  async function paySale(payload: OrderPaymentPayload) {
    if (!saleId.value) return null;

    const { apiFetch } = useApi();
    payLoading.value = true;
    try {
      const res: any = await apiFetch(`/v2/order-payment/${saleId.value}`, {
        method: "POST",
        body: payload,
      });
      receipt.value = res;
      lastCartError.value = "";
      cart.value = [];
      saleId.value = null;
      saleShopId.value = "";
      saleNumber.value = null;
      orderRaw.value = null;
      discountPercent.value = 0;
      discountAmount.value = 0;
      payableTotal.value = 0;
      return res;
    } catch {
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

      cart.value = [];
      saleId.value = null;
      saleShopId.value = "";
      saleNumber.value = null;
      orderRaw.value = null;
      lastCartError.value = "";
      discountPercent.value = 0;
      discountAmount.value = 0;
      payableTotal.value = 0;
    } finally {
      cancelLoading.value = false;
    }
  }

  async function applySaleDiscount() {
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

  function updateDiscount(id: number, value: number, type: "%" | "uzs") {
    const product = cart.value.find((c) => c.id === id);
    if (!product) return;

    product.discountValue = value;
    product.discountType = type;
  }

  function itemFinalPrice(item: any) {
    const basePrice = Number(item.price || 0);
    const dv = Number(item.discountValue || 0);
    const dt = item.discountType || "%";

    if (dt === "%") {
      return Math.max(0, Math.round(basePrice - (basePrice * dv) / 100));
    }

    return Math.max(0, Math.round(basePrice - dv));
  }

  const subtotal = computed(() =>
    cart.value.reduce(
      (sum, item) => sum + Number(item.price || 0) * Math.max(1, Number(item.quantity || 1)),
      0
    )
  );

  const itemDiscounts = computed(() =>
    cart.value.reduce((sum, item) => {
      const basePrice = Number(item.price || 0);
      const quantity = Math.max(1, Number(item.quantity || 1));
      return sum + (basePrice - itemFinalPrice(item)) * quantity;
    }, 0)
  );

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
    removeFromCart,
    applySaleDiscount,
    paySale,
    cancelSale,
    updateDiscount,
    itemFinalPrice,
    itemFinalPriceWithGlobal,
    clearCart,
    subtotal,
    itemDiscounts,
    total,
    discountValue,
    discountType,
    globalDiscountAmount,
    getCartItemQuantity,
    resolveCurrentShopId,
    paymentTypeIdByMethod,
  };
});

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
