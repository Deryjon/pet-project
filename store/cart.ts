// store/cart.ts
import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useCartStore = defineStore("cart", () => {
  const cart = ref<any[]>([]);

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
  

  function addToCart(product: any) {
    const existing = cart.value.find((c) => c.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.value.push({
        ...product,
        quantity: 1,
        discountValue: 0, // индивидуальная скидка
        discountType: "%", // тип скидки
      });
    }
    searchQuery.value = "";
  }

  function removeFromCart(id: number) {
    cart.value = cart.value.filter((c) => c.id !== id);
  }

  function clearCart() {
    cart.value = [];
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

  return {
    cart,
    products,
    searchQuery,
    filteredProducts,
    totalDiscount,
    addToCart,
    removeFromCart,
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
