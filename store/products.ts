// stores/product.ts
import { defineStore } from "pinia";
import { ref } from "vue";

export const useProductStore = defineStore("product", () => {
  const selectedProductType = ref("Товар");
  const selectedVariant = ref("Простой");

  const productTypes = ["Товар", "Услуга"];
  const productVariants = ["Простой", "Вариативный"];
  const units = ["Штука", "Литр", "Килограмм"];
  const categories = ["аудио-система", "пылесос", "станция", "подставка", "стекло"];

  const stores = [
    { name: "Globus Mall", qty: 0 },
    { name: "Samarqand Darvoza", qty: 0 },
  ];

  const article = ref("");
  const barcode = ref("");

  function generateCode(type: "article" | "barcode") {
    const randomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    if (type === "article") {
      article.value = `ART-${randomCode}`;
    } else {
      barcode.value = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    }
  }

  return {
    selectedProductType,
    selectedVariant,
    productTypes,
    productVariants,
    units,
    categories,
    stores,
    article,
    barcode,
    generateCode,
  };
});
