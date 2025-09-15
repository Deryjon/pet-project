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
  const discountValue = ref(0);       // введённая скидка
  const discountType = ref("%");      // "%" или "uzs"

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
      cart.value.push({ ...product, quantity: 1 });
    }
    searchQuery.value = "";
  }

  function removeFromCart(id: number) {
    cart.value = cart.value.filter((c) => c.id !== id);
  }

  // Подытог
  const subtotal = computed(() =>
    cart.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  // Скидка
  const discount = computed(() => {
    if (discountType.value === "%") {
      return Math.floor((subtotal.value * discountValue.value) / 100);
    }
    return discountValue.value;
  });

  // Итог к оплате
  const total = computed(() => Math.max(0, subtotal.value - discount.value));

  return {
    cart,
    products,
    searchQuery,
    filteredProducts,
    addToCart,
    removeFromCart,

    // скидки
    discountValue,
    discountType,
    subtotal,
    discount,
    total,
  };
});
