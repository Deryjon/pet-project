<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useHead } from "#imports";
import { useRoute, useRouter } from "vue-router";
import { useTransfers, type TransferDocument, type TransferItem } from "@/composables/useTransfers";

const route = useRoute();
const router = useRouter();
const toast = useToast();
const {
  getTransfer,
  getTransferProducts,
  getTransferItems,
  upsertTransferItem,
  sendTransfer,
  acceptTransfer,
} = useTransfers();

const transferId = computed(() => String(route.params.id || ""));
useHead(() => ({
  title: `${transfer.value?.name || "Трансфер"} | Konkurent`,
}));

const loading = ref(false);
const transfer = ref<TransferDocument | null>(null);
const items = ref<TransferItem[]>([]);
const itemsLoading = ref(false);
const productModalOpen = ref(false);
const productSearch = ref("");
const availableProducts = ref<TransferItem[]>([]);
const productLoading = ref(false);
const savingProductId = ref("");
const sending = ref(false);
const accepting = ref(false);
const quantityDrafts = ref<Record<string, string>>({});

function formatDate(value: string | null, withTime = false) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const datePart = new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
  if (!withTime) return datePart;
  const timePart = new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  return `${datePart} ${timePart}`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("ru-RU").format(Number(value || 0));
}

function formatMoney(value: number) {
  return `${formatNumber(value)} UZS`;
}

function statusLabel(status: string) {
  if (status === "draft") return "Черновик";
  if (status === "sent") return "Отправлено";
  if (status === "accepted") return "Принято";
  if (status === "cancelled") return "Отменено";
  return status;
}

const canEditItems = computed(() => transfer.value?.status === "draft");
const canSend = computed(() => transfer.value?.status === "draft");
const canAccept = computed(() => transfer.value?.status === "sent");

const documentTotals = computed(() => ({
  quantity: items.value.reduce((sum, item) => sum + Number(item.transfer_measurement_value || 0), 0),
  arrived: items.value.reduce((sum, item) => sum + Number(item.arrived_measurement_value || 0), 0),
}));

async function loadTransfer() {
  if (!transferId.value) return;
  loading.value = true;
  try {
    transfer.value = await getTransfer(transferId.value);
  } catch (error: any) {
    toast.add({
      title: "Не удалось загрузить трансфер",
      description: error?.data?.message || error?.message || undefined,
      color: "error",
    });
  } finally {
    loading.value = false;
  }
}

async function loadItems() {
  if (!transferId.value) return;
  itemsLoading.value = true;
  try {
    const response = await getTransferItems(transferId.value, { limit: 100, page: 1, search: "" });
    items.value = Array.isArray(response.items) ? response.items : [];
  } catch (error: any) {
    items.value = [];
    toast.add({
      title: "Не удалось загрузить позиции",
      description: error?.data?.message || error?.message || undefined,
      color: "error",
    });
  } finally {
    itemsLoading.value = false;
  }
}

async function loadAvailableProducts() {
  if (!transferId.value) return;
  productLoading.value = true;
  try {
    const response = await getTransferProducts(transferId.value, {
      search: productSearch.value.trim() || undefined,
      limit: 30,
      page: 1,
      status: "active",
      statistics: true,
    });
    availableProducts.value = Array.isArray(response.items) ? response.items : [];
    quantityDrafts.value = Object.fromEntries(
      availableProducts.value.map((item) => [
        item.product_id,
        String(Number(item.transfer_measurement_value || 0) || ""),
      ]),
    );
  } catch (error: any) {
    availableProducts.value = [];
    toast.add({
      title: "Не удалось загрузить товары",
      description: error?.data?.message || error?.message || undefined,
      color: "error",
    });
  } finally {
    productLoading.value = false;
  }
}

async function saveItem(productId: string) {
  const draftValue = Number(quantityDrafts.value[productId] || 0);
  savingProductId.value = productId;
  try {
    await upsertTransferItem(transferId.value, {
      product_id: productId,
      transfer_measurement_value: draftValue,
    });
    await Promise.all([loadTransfer(), loadItems(), loadAvailableProducts()]);
  } catch (error: any) {
    toast.add({
      title: "Не удалось обновить позицию",
      description: error?.data?.message || error?.message || undefined,
      color: "error",
    });
  } finally {
    savingProductId.value = "";
  }
}

async function handleSend() {
  if (!canSend.value) return;
  sending.value = true;
  try {
    await sendTransfer(transferId.value);
    await Promise.all([loadTransfer(), loadItems()]);
    toast.add({ title: "Трансфер отправлен", color: "success" });
  } catch (error: any) {
    toast.add({
      title: "Не удалось отправить трансфер",
      description: error?.data?.message || error?.message || undefined,
      color: "error",
    });
  } finally {
    sending.value = false;
  }
}

async function handleAccept() {
  if (!canAccept.value) return;
  accepting.value = true;
  try {
    await acceptTransfer(transferId.value);
    await Promise.all([loadTransfer(), loadItems()]);
    toast.add({ title: "Трансфер принят", color: "success" });
  } catch (error: any) {
    toast.add({
      title: "Не удалось принять трансфер",
      description: error?.data?.message || error?.message || undefined,
      color: "error",
    });
  } finally {
    accepting.value = false;
  }
}

watch(productSearch, () => {
  if (!productModalOpen.value) return;
  void loadAvailableProducts();
});

watch(productModalOpen, (next) => {
  if (next) {
    void loadAvailableProducts();
  }
});

onMounted(async () => {
  await Promise.all([loadTransfer(), loadItems()]);
});
</script>

<template>
  <section class="space-y-6 text-white">
    <div class="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_35%),linear-gradient(180deg,rgba(15,23,42,0.94),rgba(30,41,59,0.88))] p-6 shadow-[0_24px_60px_rgba(2,6,23,0.28)]">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <button type="button" class="text-sm text-sky-300 hover:text-sky-200" @click="router.push('/products/transfer')">← Назад к списку</button>
          <h1 class="mt-3 text-[30px] font-bold tracking-[-0.04em] text-white">{{ transfer?.name || "Трансфер" }}</h1>
          <p class="mt-2 text-sm text-slate-300">#{{ transfer?.external_id || "-" }} · {{ statusLabel(transfer?.status || "") }}</p>
          <p class="mt-2 text-sm text-slate-400">
            {{ transfer?.departure_shop?.name || transfer?.departure_shop_id || "-" }} → {{ transfer?.arrival_shop?.name || transfer?.arrival_shop_id || "-" }}
          </p>
          <p v-if="transfer?.comment" class="mt-3 max-w-2xl text-sm text-slate-300">{{ transfer.comment }}</p>
        </div>

        <div class="flex flex-wrap gap-3">
          <UButton
            v-if="canEditItems"
            color="neutral"
            variant="soft"
            class="rounded-[16px] bg-[#404040] px-5 py-3 font-semibold text-white hover:bg-[#525252]"
            @click="productModalOpen = true"
          >
            Добавить товар
          </UButton>
          <UButton
            v-if="canSend"
            color="primary"
            class="rounded-[16px] px-5 py-3 font-semibold"
            :disabled="sending"
            @click="handleSend"
          >
            {{ sending ? "Отправка..." : "Отправить" }}
          </UButton>
          <UButton
            v-if="canAccept"
            color="primary"
            class="rounded-[16px] px-5 py-3 font-semibold"
            :disabled="accepting"
            @click="handleAccept"
          >
            {{ accepting ? "Принимаем..." : "Принять" }}
          </UButton>
        </div>
      </div>
    </div>

    <div v-if="loading" class="rounded-[24px] border border-white/10 bg-[#111827]/80 p-6 text-slate-300">
      Загружаем документ...
    </div>

    <template v-else>
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article class="stat-card"><span>Статус</span><strong>{{ statusLabel(transfer?.status || "") }}</strong></article>
        <article class="stat-card"><span>Загружено</span><strong>{{ formatNumber(documentTotals.quantity) }}</strong></article>
        <article class="stat-card"><span>Принято</span><strong>{{ formatNumber(documentTotals.arrived) }}</strong></article>
        <article class="stat-card"><span>Создан</span><strong>{{ formatDate(transfer?.created_at || null, true) || "-" }}</strong></article>
      </div>

      <div class="rounded-[24px] border border-white/10 bg-[#111827]/80 p-5 shadow-[0_24px_60px_rgba(2,6,23,0.24)]">
        <div class="mb-5 flex items-center justify-between gap-4">
          <h2 class="text-[22px] font-bold text-white">Позиции документа</h2>
          <span class="text-sm text-slate-400">{{ items.length }} поз.</span>
        </div>

        <div v-if="itemsLoading" class="rounded-[18px] border border-white/10 bg-white/5 px-4 py-4 text-slate-300">
          Загружаем позиции...
        </div>

        <div v-else-if="!items.length" class="rounded-[18px] border border-white/10 bg-white/5 px-4 py-4 text-slate-300">
          В документ пока не добавлены товары.
        </div>

        <div v-else class="grid gap-4">
          <article v-for="item in items" :key="item.id" class="rounded-[20px] border border-white/10 bg-white/5 p-4">
            <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <h3 class="text-lg font-semibold text-white">{{ item.product?.name || item.product_id }}</h3>
                <p class="mt-2 text-sm text-slate-400">Артикул: {{ item.product?.article || "-" }} · Штрихкод: {{ item.product?.barcode || "-" }}</p>
              </div>
              <div class="grid gap-3 text-sm text-slate-300 sm:grid-cols-4">
                <div class="rounded-[16px] border border-white/10 bg-[#262626] px-4 py-3">
                  <p class="text-slate-400">Отправлено</p>
                  <p class="mt-1 font-semibold text-white">{{ formatNumber(item.transfer_measurement_value) }}</p>
                </div>
                <div class="rounded-[16px] border border-white/10 bg-[#262626] px-4 py-3">
                  <p class="text-slate-400">Принято</p>
                  <p class="mt-1 font-semibold text-white">{{ formatNumber(item.arrived_measurement_value) }}</p>
                </div>
                <div class="rounded-[16px] border border-white/10 bg-[#262626] px-4 py-3">
                  <p class="text-slate-400">Остаток отправителя</p>
                  <p class="mt-1 font-semibold text-white">{{ formatNumber(item.product?.departure_shop_measurement_value.total_measurement_value || 0) }}</p>
                </div>
                <div class="rounded-[16px] border border-white/10 bg-[#262626] px-4 py-3">
                  <p class="text-slate-400">Остаток получателя</p>
                  <p class="mt-1 font-semibold text-white">{{ formatNumber(item.product?.arrival_shop_measurement_values.total_measurement_value || 0) }}</p>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </template>

    <UModal
      v-model:open="productModalOpen"
      :ui="{
        overlay: 'bg-black/50 backdrop-blur-sm',
        content: 'mx-4 max-w-[1100px] rounded-[28px] border border-white/10 bg-[#262626] p-0 text-white shadow-2xl ring-0 sm:mx-0',
      }"
    >
      <template #content>
        <div class="p-5 sm:p-6">
          <div class="mb-5 flex items-start justify-between gap-4">
            <div>
              <h3 class="text-[22px] font-semibold">Товары для трансфера</h3>
              <p class="mt-1 text-sm text-[#bdbdbd]">Показываем остаток филиала-отправителя и текущее количество внутри документа.</p>
            </div>
            <UButton color="neutral" variant="ghost" class="rounded-full text-[#bdbdbd] hover:bg-white/5 hover:text-white" @click="productModalOpen = false">
              <Icon name="mingcute:close-fill" class="h-5 w-5" />
            </UButton>
          </div>

          <input
            v-model="productSearch"
            type="text"
            class="field"
            placeholder="Поиск товара"
          />

          <div v-if="productLoading" class="mt-5 rounded-[18px] border border-white/10 bg-white/5 px-4 py-4 text-slate-300">
            Загружаем товары...
          </div>

          <div v-else class="mt-5 grid gap-4">
            <article v-for="item in availableProducts" :key="item.product_id" class="rounded-[20px] border border-white/10 bg-white/5 p-4">
              <div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <h4 class="text-lg font-semibold text-white">{{ item.product?.name || item.product_id }}</h4>
                  <p class="mt-2 text-sm text-slate-400">Остаток отправителя: {{ formatNumber(item.product?.departure_shop_measurement_value.total_measurement_value || 0) }}</p>
                  <p class="mt-2 text-sm text-slate-400">Остаток получателя: {{ formatNumber(item.product?.arrival_shop_measurement_values.total_measurement_value || 0) }}</p>
                  <p class="mt-2 text-sm text-slate-400">
                    Supply: {{ formatMoney(item.product?.departure_shop_supply_price || 0) }} · Retail: {{ formatMoney(item.product?.departure_shop_retail_price || 0) }}
                  </p>
                </div>

                <div class="grid grid-cols-[160px_auto] gap-3">
                  <input
                    v-model="quantityDrafts[item.product_id]"
                    type="number"
                    min="0"
                    class="field"
                    placeholder="Количество"
                    :disabled="!canEditItems"
                  />
                  <UButton
                    color="primary"
                    class="justify-center rounded-[16px] px-4 py-3 font-semibold"
                    :disabled="!canEditItems || savingProductId === item.product_id"
                    @click="saveItem(item.product_id)"
                  >
                    {{ savingProductId === item.product_id ? "Сохраняем..." : "Сохранить" }}
                  </UButton>
                </div>
              </div>
            </article>
          </div>
        </div>
      </template>
    </UModal>
  </section>
</template>

<style scoped>
.field {
  width: 100%;
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.05);
  padding: 14px 16px;
  color: #fff;
  outline: none;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  padding: 20px;
}

.stat-card span {
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #94a3b8;
}

.stat-card strong {
  font-size: 28px;
  color: #fff;
}
</style>
