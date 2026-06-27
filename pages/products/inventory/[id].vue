<script setup lang="ts">
import { computed, ref, reactive } from "vue";
import { useHead, useRoute, useRouter } from "#imports";
import { useApi } from "~/composables/useApi";

useHead({ title: "Инвентаризация | Konkurent" });

const route = useRoute();
const router = useRouter();
const { apiFetch } = useApi();
const toast = useToast();

const sessionId = computed(() => String(route.params.id || ""));
const loading = ref(true);
const applying = ref(false);
const errorMessage = ref("");
const session = ref<any>(null);
const items = ref<any[]>([]);

const productSearch = ref("");
const searchResults = ref<any[]>([]);
const searching = ref(false);
const addingProductId = ref<number | null>(null);

const totalItems = computed(() => items.value.length);
const totalDifference = computed(() => items.value.reduce((sum, item) => sum + Number(item.difference || 0), 0));
const surplusCount = computed(() => items.value.filter(i => i.difference > 0).length);
const shortageCount = computed(() => items.value.filter(i => i.difference < 0).length);
const isDraft = computed(() => session.value?.status === "draft");

async function loadSession() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const res: any = await apiFetch(`/v1/inventory-sessions/${sessionId.value}`);
    session.value = res;
    items.value = Array.isArray(res?.items) ? res.items : [];
  } catch (e: any) {
    errorMessage.value = e?.data?.message || e?.message || "Не удалось загрузить сессию";
  } finally {
    loading.value = false;
  }
}

let searchDebounce: ReturnType<typeof setTimeout> | null = null;
function onSearchInput() {
  if (searchDebounce) clearTimeout(searchDebounce);
  searchDebounce = setTimeout(searchProducts, 300);
}

async function searchProducts() {
  const q = productSearch.value.trim();
  if (!q) { searchResults.value = []; return; }
  searching.value = true;
  try {
    const res: any = await apiFetch("/v2/new-sale/products", {
      query: { search: q, page: 1, limit: 20, shop_id: session.value?.shopId },
    });
    const products = Array.isArray(res?.products) ? res.products : [];
    const existingIds = new Set(items.value.map((i: any) => i.productId));
    searchResults.value = products.map((p: any) => ({
      id: Number(p.id ?? p.product_id),
      name: String(p.name ?? p.product_name ?? ""),
      sku: String(p.sku ?? p.article ?? ""),
      barcode: String(p.barcode ?? ""),
      quantity: Number(p.measurement_values?.total_measurement_value ?? p.quantity ?? 0),
      alreadyAdded: existingIds.has(Number(p.id ?? p.product_id)),
    }));
  } catch {
    searchResults.value = [];
  } finally {
    searching.value = false;
  }
}

async function addProduct(product: any, actualQty?: number) {
  addingProductId.value = product.id;
  try {
    const res: any = await apiFetch(`/v1/inventory-sessions/${sessionId.value}/items`, {
      method: "POST",
      body: { product_id: product.id, actual_quantity: actualQty ?? product.quantity ?? 0 },
    });
    const existing = items.value.findIndex(i => i.productId === product.id);
    const newItem = {
      id: res.id,
      productId: res.productId,
      productName: res.productName || product.name,
      sku: res.sku || product.sku,
      barcode: res.barcode || product.barcode,
      expectedQuantity: res.expectedQuantity,
      actualQuantity: res.actualQuantity,
      difference: res.difference,
    };
    if (existing >= 0) items.value[existing] = newItem;
    else items.value.unshift(newItem);
    product.alreadyAdded = true;
  } catch (e: any) {
    toast.add({ title: "Ошибка", description: e?.data?.message || e?.message || "Не удалось добавить", color: "error" });
  } finally {
    addingProductId.value = null;
  }
}

async function updateActualQuantity(item: any) {
  try {
    const res: any = await apiFetch(`/v1/inventory-sessions/${sessionId.value}/items`, {
      method: "POST",
      body: { product_id: item.productId, actual_quantity: item.actualQuantity },
    });
    item.expectedQuantity = res.expectedQuantity;
    item.difference = res.difference;
  } catch {}
}

async function applyInventory() {
  if (!confirm("Применить результаты инвентаризации? Остатки на складе будут обновлены.")) return;
  applying.value = true;
  try {
    await apiFetch(`/v1/inventory-sessions/${sessionId.value}/apply`, { method: "POST" });
    toast.add({ title: "Инвентаризация применена", color: "success" });
    await loadSession();
  } catch (e: any) {
    toast.add({ title: "Ошибка", description: e?.data?.message || e?.message || "Не удалось применить", color: "error" });
  } finally {
    applying.value = false;
  }
}

function formatQty(v: number) {
  return Number.isInteger(v) ? String(v) : v.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

loadSession();
</script>

<template>
  <section class="inv-detail text-white">
    <header class="inv-header">
      <button type="button" class="back-btn" @click="router.push('/products/inventory')">
        <Icon name="heroicons:chevron-left" class="h-5 w-5" /> Назад
      </button>
      <div class="flex-1 min-w-0">
        <p class="text-[12px] font-bold uppercase tracking-wider text-[#79b7ff]">Инвентаризация</p>
        <h1 class="mt-1 text-[28px] font-extrabold truncate">{{ session?.name || "Загрузка..." }}</h1>
        <p class="mt-1 text-[13px] text-[#9a9a9a]">
          {{ session?.shop?.name || "" }}
          <span v-if="session?.status" :class="['status-badge', session.status === 'completed' ? 'status-done' : 'status-draft']">
            {{ session.status === "completed" ? "Завершена" : "Черновик" }}
          </span>
        </p>
      </div>
      <button v-if="isDraft" type="button" :disabled="applying || !items.length" class="apply-btn" @click="applyInventory">
        <Icon v-if="applying" name="heroicons:arrow-path" class="h-5 w-5 animate-spin" />
        <Icon v-else name="heroicons:check-20-solid" class="h-5 w-5" />
        {{ applying ? "Применяем..." : "Применить" }}
      </button>
    </header>

    <div v-if="loading" class="state-box"><Icon name="heroicons:arrow-path" class="h-5 w-5 animate-spin" /> Загрузка...</div>
    <div v-else-if="errorMessage" class="state-box state-error">{{ errorMessage }}</div>

    <template v-else>
      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-card"><span class="stat-value">{{ totalItems }}</span><span class="stat-label">Позиций</span></div>
        <div class="stat-card"><span class="stat-value" :class="totalDifference > 0 ? 'text-green-400' : totalDifference < 0 ? 'text-red-400' : ''">{{ totalDifference > 0 ? "+" : "" }}{{ formatQty(totalDifference) }}</span><span class="stat-label">Общее расхождение</span></div>
        <div class="stat-card"><span class="stat-value text-green-400">{{ surplusCount }}</span><span class="stat-label">Излишки</span></div>
        <div class="stat-card"><span class="stat-value text-red-400">{{ shortageCount }}</span><span class="stat-label">Недостачи</span></div>
      </div>

      <!-- Search -->
      <div v-if="isDraft" class="search-section">
        <div class="search-wrap">
          <Icon name="heroicons:magnifying-glass-20-solid" class="h-4 w-4 shrink-0 text-[#bdbdbd]" />
          <input v-model="productSearch" type="text" placeholder="Добавить товар (название, артикул, баркод)" class="search-input" @input="onSearchInput" />
          <Icon v-if="searching" name="heroicons:arrow-path" class="h-4 w-4 animate-spin text-[#bdbdbd]" />
        </div>
        <div v-if="searchResults.length" class="search-results">
          <button v-for="p in searchResults" :key="p.id" type="button" class="search-result" :disabled="addingProductId === p.id" @click="addProduct(p)">
            <div class="flex-1 min-w-0">
              <p class="text-[14px] font-semibold truncate">{{ p.name }}</p>
              <p class="text-[12px] text-[#9a9a9a]">{{ p.sku }} · {{ p.barcode }}</p>
            </div>
            <span class="text-[13px] text-[#bdbdbd]">Остаток: {{ formatQty(p.quantity) }}</span>
            <span v-if="p.alreadyAdded" class="text-[11px] text-[#79b7ff]">Добавлен</span>
          </button>
        </div>
      </div>

      <!-- Items table -->
      <div class="items-panel">
        <div v-if="!items.length" class="state-box" style="min-height:200px">Добавьте товары через поиск выше</div>
        <table v-else class="items-table">
          <thead>
            <tr>
              <th>Товар</th>
              <th class="text-right">Ожидание</th>
              <th class="text-right">Факт</th>
              <th class="text-right">Расхождение</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.id" :class="{ 'row-surplus': item.difference > 0, 'row-shortage': item.difference < 0 }">
              <td>
                <p class="text-[14px] font-semibold">{{ item.productName }}</p>
                <p class="text-[12px] text-[#9a9a9a]">{{ item.sku || item.barcode || "" }}</p>
              </td>
              <td class="text-right text-[14px] text-[#bdbdbd]">{{ formatQty(item.expectedQuantity) }}</td>
              <td class="text-right">
                <input v-if="isDraft" v-model.number="item.actualQuantity" type="number" min="0" step="any" class="qty-input" @change="updateActualQuantity(item)" />
                <span v-else class="text-[14px]">{{ formatQty(item.actualQuantity) }}</span>
              </td>
              <td class="text-right text-[14px] font-bold" :class="item.difference > 0 ? 'text-green-400' : item.difference < 0 ? 'text-red-400' : 'text-[#bdbdbd]'">
                {{ item.difference > 0 ? "+" : "" }}{{ formatQty(item.difference) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>

<style scoped>
.inv-detail { max-width: 1200px; margin: 0 auto; }
.inv-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
.back-btn, .apply-btn { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 16px; border: 0; border-radius: 14px; font-weight: 700; cursor: pointer; color: white; }
.back-btn { background: #404040; }
.back-btn:hover { background: #505050; }
.apply-btn { background: #1f78ff; }
.apply-btn:hover { background: #4993dd; }
.apply-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.status-badge { display: inline-flex; padding: 2px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; margin-left: 8px; }
.status-draft { background: rgba(251,191,36,0.15); color: #fbbf24; }
.status-done { background: rgba(74,222,128,0.15); color: #4ade80; }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
.stat-card { border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; background: #262626; padding: 18px; display: flex; flex-direction: column; gap: 4px; }
.stat-value { font-size: 24px; font-weight: 800; }
.stat-label { font-size: 12px; color: #9a9a9a; }
.search-section { margin-bottom: 20px; }
.search-wrap { display: flex; align-items: center; gap: 10px; padding: 0 16px; min-height: 52px; border-radius: 16px; background: #303030; border: 1px solid rgba(255,255,255,0.08); }
.search-input { flex: 1; background: transparent; border: 0; color: white; font-size: 15px; outline: none; }
.search-input::placeholder { color: #bdbdbd; }
.search-results { margin-top: 8px; border-radius: 16px; background: #303030; border: 1px solid rgba(255,255,255,0.08); overflow: hidden; max-height: 320px; overflow-y: auto; }
.search-result { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px 16px; border: 0; border-bottom: 1px solid rgba(255,255,255,0.06); background: transparent; color: white; text-align: left; cursor: pointer; }
.search-result:hover { background: rgba(31,120,255,0.08); }
.search-result:disabled { opacity: 0.5; }
.items-panel { border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; background: #262626; overflow: hidden; }
.items-table { width: 100%; border-collapse: collapse; }
.items-table th { padding: 14px 18px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #9a9a9a; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.08); }
.items-table td { padding: 14px 18px; border-bottom: 1px solid rgba(255,255,255,0.04); }
.items-table tr:last-child td { border-bottom: 0; }
.row-surplus { background: rgba(74,222,128,0.04); }
.row-shortage { background: rgba(248,113,113,0.04); }
.qty-input { width: 100px; padding: 8px 10px; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; background: #1f1f1f; color: white; font-size: 14px; font-weight: 700; text-align: right; outline: none; }
.qty-input:focus { border-color: #1f78ff; }
.state-box { display: flex; align-items: center; justify-content: center; min-height: 300px; gap: 10px; color: #bdbdbd; }
.state-error { color: #fecaca; }
@media (max-width: 768px) {
  .inv-header { flex-wrap: wrap; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
