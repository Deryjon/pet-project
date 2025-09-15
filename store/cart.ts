import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useCartStore = defineStore("cart", () => {
  // 🛒 Корзина
  const cart = ref<any[]>([]);

  // 📦 Каталог продуктов (product list)
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

  // 🔍 Поиск
  const searchQuery = ref("");

  const filteredProducts = computed(() =>
    products.value.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  );

  // ➕ Добавить в корзину
  function addToCart(product: any) {
    const existing = cart.value.find((c) => c.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.value.push({ ...product, quantity: 1 });
    }
    searchQuery.value = "";
  }

  // ❌ Удалить из корзины
  function removeFromCart(id: number) {
    cart.value = cart.value.filter((c) => c.id !== id);
  }

  // 💰 Общая сумма корзины
  const totalPrice = computed(() =>
    cart.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  return {
    // Корзина
    cart,
    addToCart,
    removeFromCart,
    totalPrice,

    // Каталог
    products,
    searchQuery,
    filteredProducts,
  };
});
