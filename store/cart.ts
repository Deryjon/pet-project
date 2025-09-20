// store/cart.ts
import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useCartStore = defineStore("cart", () => {
  const cart = ref<any[]>([]);

  const products = ref([
    { id: 1, name: "Чехол для iPhone 12", price: 50000, barcode: "123456789", article: "123456789" },
    { id: 2, name: "Стекло для Samsung S22", price: 80000, barcode: "987654321", article: "S22-GLASS" },
    { id: 3, name: "Зарядка Type-C", price: 120000, barcode: "456123789", article: "TYPEC-CHARGER" },
    { id: 4, name: "Наушники AirPods", price: 1500000, barcode: "741852963", article: "AIRPODS" },
  ]);

  const searchQuery = ref("");

  const filteredProducts = computed(() =>
    products.value.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  );

  function addToCart(product: any) {
    const existing = cart.value.find((c) => c.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.value.push({
        ...product,
        quantity: 1,
        discountValue: 0,   // скидка по умолчанию для этого товара
        discountType: "%"   // тип скидки по умолчанию для этого товара
      });
    }
    searchQuery.value = "";
  }

  function removeFromCart(id: number) {
    cart.value = cart.value.filter((c) => c.id !== id);
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

  // Подытог (без скидки)
  const subtotal = computed(() =>
    cart.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  // Сумма всех скидок
  const totalDiscount = computed(() =>
    cart.value.reduce(
      (sum, item) => sum + (item.price - itemFinalPrice(item)) * item.quantity,
      0
    )
  );

  // Итог к оплате (с учётом всех скидок)
  const total = computed(() =>
    cart.value.reduce((sum, item) => sum + itemFinalPrice(item) * item.quantity, 0)
  );

  return {
    cart,
    products,
    searchQuery,
    filteredProducts,
    addToCart,
    removeFromCart,

    updateDiscount,    // <- возвращаем функцию обратно
    itemFinalPrice,

    subtotal,
    totalDiscount,
    total,
  };
});
