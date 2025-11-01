<template>
  <div class="rounded-xl mt-[30px] relative">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-[28px] font-semibold">Список продаж</h3>
      <div class="flex items-center gap-2">
        <select v-model="status" class="bg-[#404040] p-2 rounded text-white">
          <option value="">Все</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <input
          v-if="isAdminOrManager"
          v-model="branchCode"
          placeholder="branch_code"
          class="bg-[#404040] p-2 rounded text-white"
        />
      </div>
    </div>

    <div class="bg-[#1f1f1f] rounded-[15px] overflow-hidden">
      <div class="grid grid-cols-5 gap-2 px-4 py-3 text-[#bdbdbd] text-sm border-b border-[#333]">
        <div>Номер</div>
        <div>Статус</div>
        <div>Филиал</div>
        <div>Сумма</div>
        <div>Создана</div>
      </div>
      <div v-for="s in sales" :key="s.id" class="border-b border-[#333]">
        <div class="grid grid-cols-5 gap-2 px-4 py-3 items-center">
          <div class="font-semibold">№ {{ s.number || '—' }}</div>
          <div>
            <span :class="statusClass(s.status)">{{ s.status }}</span>
          </div>
          <div>{{ s.branch_code }}</div>
          <div>{{ formatPrice(s.total || 0) }} UZS</div>
          <div>{{ formatDate(s.created_at) }}</div>
        </div>
        <div v-if="s.items?.length" class="px-6 pb-3 text-sm text-[#cfcfcf]">
          <div class="grid grid-cols-5 gap-2 opacity-70 mb-1">
            <div class="col-span-2">Товар</div>
            <div>SKU</div>
            <div>Шт.</div>
            <div>Цена</div>
          </div>
          <div v-for="it in s.items" :key="it.id || it.sku" class="grid grid-cols-5 gap-2 py-1">
            <div class="col-span-2 truncate">{{ it.name }}</div>
            <div>{{ it.sku }}</div>
            <div>x{{ it.quantity }}</div>
            <div>{{ formatPrice(it.sale_price || 0) }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex justify-between items-center mt-4">
      <div class="text-sm text-[#bdbdbd]">Всего: {{ total }}</div>
      <div class="flex items-center gap-2">
        <button class="bg-[#404040] px-3 py-2 rounded disabled:opacity-50" :disabled="page<=1" @click="page--">Назад</button>
        <span class="text-sm">{{ page }}</span>
        <button class="bg-[#404040] px-3 py-2 rounded disabled:opacity-50" :disabled="page*limit>=total" @click="page++">Вперёд</button>
        <select v-model.number="limit" class="bg-[#404040] p-2 rounded text-white">
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useApi } from "~/composables/useApi";
import { useUserStore } from "~/store/useUserStore";
import { useFormatPrice } from "@/composables/useFormatPrice";

const { apiFetch } = useApi();
const user = useUserStore();
const { formatPrice } = useFormatPrice();

const page = ref(1);
const limit = ref(10);
const total = ref(0);
const status = ref("");
const branchCode = ref("");

const isAdminOrManager = computed(() => ["admin", "manager"].includes((user.user?.role || "").toLowerCase()));

const sales = ref<any[]>([]);

function formatDate(d: string | number | Date | undefined) {
  if (!d) return "";
  try { return new Date(d as any).toLocaleString(); } catch { return String(d); }
}

function statusClass(s: string) {
  const base = "px-2 py-0.5 rounded text-xs";
  if (s === "paid") return base + " bg-green-600/30 text-green-300";
  if (s === "pending") return base + " bg-yellow-600/30 text-yellow-300";
  if (s === "cancelled") return base + " bg-red-600/30 text-red-300";
  return base + " bg-[#333] text-[#bbb]";
}

async function fetchSales() {
  const query: any = { page: page.value, limit: Math.min(Math.max(limit.value,1),100) };
  if (status.value) query.status = status.value;
  if (isAdminOrManager.value && branchCode.value) query.branch_code = branchCode.value;
  try {
    const res: any = await apiFetch("/sales", { method: "GET", query });
    sales.value = Array.isArray(res?.items) ? res.items : [];
    page.value = Number(res?.page ?? page.value) || 1;
    limit.value = Number(res?.limit ?? limit.value) || 10;
    total.value = Number(res?.total ?? total.value) || 0;
  } catch (_) {
    // ignore
  }
}

let t: any = null;
watch([page, limit, status, branchCode], () => {
  if (t) clearTimeout(t);
  t = setTimeout(fetchSales, 200);
}, { immediate: true });
</script>

<style scoped>
</style>
