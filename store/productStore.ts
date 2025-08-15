import { defineStore } from 'pinia'

export const useProductStore = defineStore('product', {
  state: () => ({
    selectedProductType: 'Товар',
    selectedVariant: 'Простой',
    productTypes: ['Товар', 'Услуга'],
    productVariants: ['Простой', 'Вариативный'],
    units: ['Штука', 'Литр', 'Килограмм'],
    categories: ['аудио-система', 'пылесос', 'станция', 'подставка', 'стекло'],
    stores: [
      { name: 'Globus Mall', qty: 0 },
      { name: 'Samarqand Darvoza', qty: 0 },
    ],
    article: '',
    barcode: '',
  }),
  actions: {
    generateCode(type: 'article' | 'barcode') {
      const randomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
      if (type === 'article') {
        this.article = `ART-${randomCode}`;
      } else {
        this.barcode = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
      }
    },
    updateStoreQty(name: string, qty: number) {
      const store = this.stores.find(s => s.name === name)
      if (store) store.qty = qty
    }
  }
})
