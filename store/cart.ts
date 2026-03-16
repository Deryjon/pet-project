// store/cart.ts
import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { useApi } from "~/composables/useApi";

export const useCartStore = defineStore("cart", () => {
  const STORAGE_KEY = "pos-cart-state";
  const cart = ref<any[]>([]);
  const saleId = ref<string | number | null>(null);
  const saleNumber = ref<string | null>(null);
  const receipt = ref<any | null>(null);
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

  // 👉 глобальная скидка (для всей корзины)
  const discountValue = ref(0); // число (либо % либо UZS)
  const discountType = ref<"%" | "uzs">("%"); // текущий тип скидки

  const filteredProducts = computed(() => {
    const q = searchQuery.value.toLowerCase();
    return products.value.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.article.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q)
    );
  });

  function upsertCartItem(product: any, quantity = 1) {
    const existing = cart.value.find((c) => c.id === product.id);
    if (existing) {
      existing.quantity += quantity;
      return;
    }

    cart.value.push({
      ...product,
      quantity,
      discountValue: Number(product?.discountValue ?? 0),
      discountType: product?.discountType === "uzs" ? "uzs" : "%",
    });
  }

  function saveLocalState() {
    if (!process.client) return;

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        cart: cart.value,
        saleId: saleId.value,
        saleNumber: saleNumber.value,
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
      saleNumber.value = parsed?.saleNumber ?? null;
      discountValue.value = Number(parsed?.discountValue ?? 0);
      discountType.value = parsed?.discountType === "uzs" ? "uzs" : "%";
      discountPercent.value = Number(parsed?.discountPercent ?? 0);
      discountAmount.value = Number(parsed?.discountAmount ?? 0);
      payableTotal.value = Number(parsed?.payableTotal ?? 0);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
  
  // Server-backed sale flow
  async function initSale() {
    if (saleId.value) return saleId.value;
    creatingSale.value = true;
    try {
      const { apiFetch } = useApi();
      const res: any = await apiFetch("/new-sale", { method: "POST" });
      saleId.value = res?.id ?? res?.sid ?? null;
      saleNumber.value = res?.number ? String(res.number) : saleNumber.value;
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
    const { apiFetch } = useApi();
    const res: any = await apiFetch(`/new-sale/${id}`, { method: "GET" });
    const items = Array.isArray(res?.items) ? res.items : [];
    cart.value = items.map((it: any) => ({
      id: it.product_id ?? it.id ?? it.product?.id,
      name: it.name,
      price: it.sale_price,
      barcode: it.barcode ?? "",
      article: it.sku ?? "",
      quantity: it.quantity ?? 1,
      discountValue: 0,
      discountType: "%",
    }));
    saleId.value = res?.id ?? saleId.value;
    saleNumber.value = res?.number ? String(res.number) : saleNumber.value;
    discountPercent.value = Number(res?.discount_percent ?? discountPercent.value ?? 0);
    discountAmount.value = Number(res?.discount_amount ?? discountAmount.value ?? 0);
    payableTotal.value = Number(res?.payable_total ?? payableTotal.value ?? 0);
    loadingSale.value = false;
    return res;
  }

  async function addToCartServer(product: any) {
    try {
      addingItem.value = true;
      const sid = saleId.value || (await initSale());
      if (!sid) throw new Error("sale not created");
      const { apiFetch } = useApi();
      await apiFetch(`/new-sale/${sid}/items`, {
        method: "POST",
        body: { product_id: product.id, quantity: 1, sale_price: product.price },
      });
      await loadSale(sid);
    } catch (_) {
      upsertCartItem(product, 1);
    } finally {
      addingItem.value = false;
      searchQuery.value = "";
    }
  }

  
  function addToCart(product: any) {
    upsertCartItem(product, 1);
    searchQuery.value = "";
  }

  function removeFromCart(id: number) {
    cart.value = cart.value.filter((c) => c.id !== id);
  }

  function clearCart() {
    cart.value = [];
  }

  async function paySale() {
    if (!saleId.value) return null;
    const { apiFetch } = useApi();
    payLoading.value = true;
    try {
      const res: any = await apiFetch(`/new-sale/${saleId.value}/pay`, { method: "POST" });
      receipt.value = res;
      cart.value = [];
      saleId.value = null;
      saleNumber.value = null;
      discountPercent.value = 0;
      discountAmount.value = 0;
      payableTotal.value = 0;
      return res;
    } catch (_) { return null; } finally { payLoading.value = false; }
  }

  async function cancelSale() {
    const { apiFetch } = useApi();
    cancelLoading.value = true;
    if (saleId.value) {
      try {
        await apiFetch(`/new-sale/${saleId.value}`, { method: "DELETE" });
      } catch (_) {}
    }
    cart.value = [];
    saleId.value = null;
    saleNumber.value = null;
    discountPercent.value = 0;
    discountAmount.value = 0;
    payableTotal.value = 0;
    cancelLoading.value = false;
  }

  async function applySaleDiscount() {
    if (!saleId.value) {
      await initSale();
    }
    const sid = saleId.value;
    if (!sid) return;
    discountLoading.value = true;
    const { apiFetch } = useApi();
    try {
      const body: any = {};
      if (discountType.value === "%") {
        body.discount_percent = Number(discountValue.value || 0);
      } else {
        body.discount_amount = Number(discountValue.value || 0);
      }
      const res: any = await apiFetch(`/new-sale/${sid}/discount`, { method: "PUT", body });
      discountPercent.value = Number(res?.discount_percent ?? discountPercent.value ?? 0);
      discountAmount.value = Number(res?.discount_amount ?? discountAmount.value ?? 0);
      payableTotal.value = Number(res?.payable_total ?? payableTotal.value ?? 0);
    } catch (_) {
      // ignore for now
    } finally {
      discountLoading.value = false;
    }
  }

  /** 👉 обновить скидку для конкретного товара */
  function updateDiscount(id: number, value: number, type: "%" | "uzs") {
    const product = cart.value.find((c) => c.id === id);
    if (product) {
      product.discountValue = value;
      product.discountType = type;
    }
  }

  /** Цена товара с учётом его собственной скидки */
  function itemFinalPrice(item: any) {
    const dv = Number(item.discountValue || 0);
    const dt = item.discountType || "%";
    if (dt === "%") {
      return Math.max(0, item.price - (item.price * dv) / 100);
    } else {
      return Math.max(0, item.price - dv);
    }
  }

  // Подытог (без скидок)
  const subtotal = computed(() =>
    cart.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  // Сумма скидок только по товарам
  const itemDiscounts = computed(() =>
    cart.value.reduce(
      (sum, item) => sum + (item.price - itemFinalPrice(item)) * item.quantity,
      0
    )
  );

  // 👉 глобальная скидка (поверх товарных)
  function globalDiscountAmount() {
    const base = subtotal.value - itemDiscounts.value; // база после товарных скидок
    if (discountType.value === "%") {
      return Math.max(0, (base * discountValue.value) / 100);
    } else {
      return Math.min(base, discountValue.value); // не больше чем сама база
    }
  }

  // Итог к оплате
  const total = computed(() => {
    const afterItemDiscounts = subtotal.value - itemDiscounts.value;
    const global = globalDiscountAmount();
    return Math.max(0, afterItemDiscounts - global);
  });

  // Общая сумма скидок (товарные + глобальная)
  const totalDiscount = computed(
    () => itemDiscounts.value + globalDiscountAmount()
  );

  /** Цена товара с учётом и товарной скидки, и общей */
function itemFinalPriceWithGlobal(item: any) {
  // Сначала считаем цену после индивидуальной скидки
  let price = itemFinalPrice(item);

  // Потом применяем глобальную
  const baseSubtotal = subtotal.value - itemDiscounts.value; // база для глобальной скидки
  if (baseSubtotal <= 0) return price;

  let factor = 1;
  if (discountType.value === "%") {
    factor = 1 - discountValue.value / 100;
  } else {
    // сумма делится пропорционально на все товары
    factor = (baseSubtotal - globalDiscountAmount()) / baseSubtotal;
  }

  return Math.max(0, price * factor);
}

  loadLocalState();

  watch(
    [
      cart,
      saleId,
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
    saleNumber,
    receipt,
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
  };
});
