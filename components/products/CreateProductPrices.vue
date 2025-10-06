<script setup lang="ts">
import { ref, watch } from 'vue'
import { useProductStore } from '@/store/productStore'

const store = useProductStore()

// Avoid circular updates when auto-calculating
const internalUpdate = ref(false)

// Auto-calc sale_price when purchase_price or markup_percent change
watch([
  () => store.purchase_price,
  () => store.markup_percent,
], ([pp, mu]) => {
  internalUpdate.value = true
  const p = Number(pp) || 0
  const m = Number(mu) || 0
  store.sale_price = Math.round(p * (1 + m / 100) * 100) / 100
  queueMicrotask(() => { internalUpdate.value = false })
})

// If user edits sale price directly, recalc markup_percent (if purchase_price > 0)
watch(() => store.sale_price, (sp) => {
  if (internalUpdate.value) return
  const p = Number(store.purchase_price) || 0
  const s = Number(sp) || 0
  if (p > 0) {
    const mu = ((s - p) / p) * 100
    store.markup_percent = Math.round(mu * 100) / 100
  } else {
    store.markup_percent = 0
  }
})
</script>

<template>
  <section>
    <h3 class="text-xl font-semibold mb-4">Цены</h3>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label class="font-medium">Закупочная цена</label>
        <input v-model.number="store.purchase_price" type="number" class="w-full mt-4 rounded-lg p-3" placeholder="0" />
      </div>
      <div>
        <label class="font-medium">Наценка (%)</label>
        <input v-model.number="store.markup_percent" type="number" class="w-full mt-4 rounded-lg p-3" placeholder="0" />
      </div>
      <div>
        <label class="font-medium">Цена продажи</label>
        <input v-model.number="store.sale_price" type="number" class="w-full mt-4 rounded-lg p-3" placeholder="0" />
      </div>
    </div>
  </section>
</template>

