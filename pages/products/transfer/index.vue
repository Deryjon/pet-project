<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useHead } from "#imports";
import { useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useTransfers, type TransferDocument } from "@/composables/useTransfers";
import { useLocationStore } from "@/store/useLocationStore";
import BaseDataTableHeader from "@/components/BaseDataTableHeader.vue";

useHead({
  title: "Трансфер | Konkurent",
});

const router = useRouter();
const toast = useToast();
const locationStore = useLocationStore();
const { locations } = storeToRefs(locationStore);
const { listTransfers, createTransfer } = useTransfers();

const loading = ref(false);
const creating = ref(false);
const search = ref("");
const transfers = ref<TransferDocument[]>([]);
const page = ref(1);
const limit = ref(10);
const total = ref(0);
const createModalOpen = ref(false);

const form = ref({
  departure_shop_id: "",
  arrival_shop_id: "",
  name: "",
  comment: "",
  use_departure_shop_prices: false,
});

function formatDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("ru-RU").format(Number(value || 0));
}

function statusLabel(status: string) {
  if (status === "draft") return "Черновик";
  if (status === "sent") return "Отправлено";
  if (status === "accepted") return "Принято";
  if (status === "cancelled") return "Отменено";
  return status;
}

const filteredTransfers = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) return transfers.value;
  return transfers.value.filter((item) =>
    [
      item.external_id,
      item.name,
      item.departure_shop?.name,
      item.arrival_shop?.name,
      item.created_by?.name,
      item.accepted_by?.name,
      item.status,
    ]
      .join(" ")
      .toLowerCase()
      .includes(query),
  );
});

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit.value)));

function resetForm() {
  form.value = {
    departure_shop_id: locations.value[0]?.id || "",
    arrival_shop_id: locations.value[1]?.id || "",
    name: `Трансфер ${new Date().toLocaleString("sv-SE").replace(" ", " ")}`,
    comment: "",
    use_departure_shop_prices: false,
  };
}

async function fetchTransfers() {
  loading.value = true;
  try {
    const response = await listTransfers({ page: page.value, limit: limit.value });
    transfers.value = Array.isArray(response.transfer) ? response.transfer : [];
    total.value = Number(response.count ?? transfers.value.length);
  } catch (error: any) {
    transfers.value = [];
    total.value = 0;
    toast.add({
      title: "Не удалось загрузить трансферы",
      description: error?.data?.message || error?.message || undefined,
      color: "error",
    });
  } finally {
    loading.value = false;
  }
}

async function submitCreate() {
  if (!form.value.departure_shop_id || !form.value.arrival_shop_id || !form.value.name.trim()) return;
  if (form.value.departure_shop_id === form.value.arrival_shop_id) {
    toast.add({ title: "Филиалы отправителя и получателя должны отличаться", color: "error" });
    return;
  }

  creating.value = true;
  try {
    const created = await createTransfer({
      departure_shop_id: form.value.departure_shop_id,
      arrival_shop_id: form.value.arrival_shop_id,
      name: form.value.name.trim(),
      comment: form.value.comment.trim() || null,
      use_departure_shop_prices: form.value.use_departure_shop_prices,
    });
    createModalOpen.value = false;
    resetForm();
    await router.push(`/products/transfer/${created.id}`);
  } catch (error: any) {
    toast.add({
      title: "Не удалось создать трансфер",
      description: error?.data?.message || error?.message || undefined,
      color: "error",
    });
  } finally {
    creating.value = false;
  }
}

function openTransfer(transfer: TransferDocument) {
  void router.push(`/products/transfer/${transfer.id}`);
}

function previousPage() {
  if (page.value <= 1) return;
  page.value -= 1;
}

function nextPage() {
  if (page.value >= totalPages.value) return;
  page.value += 1;
}

watch(createModalOpen, (next) => {
  if (next) resetForm();
});

watch([page, limit], () => {
  void fetchTransfers();
});

onMounted(async () => {
  if (!locations.value.length) {
    const { useUserStore } = await import("@/store/useUserStore");
    const userStore = useUserStore();
    locationStore.syncFromUser(userStore.userState);
  }
  resetForm();
  await fetchTransfers();
});
</script>

<template>
  <section class="space-y-4 text-white">
    <div class="rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_35%),linear-gradient(180deg,rgba(15,23,42,0.94),rgba(30,41,59,0.88))] px-5 py-4 lg:p-6 shadow-[0_24px_60px_rgba(2,6,23,0.28)]">
      <h1 class="text-[24px] lg:text-[36px] font-bold text-white">Трансфер</h1>
      <p class="mt-1 text-[13px] lg:text-[15px] text-slate-400 lg:leading-7">
        Перемещение товаров между филиалами
      </p>
    </div>

    <BaseDataTableHeader
      v-model="search"
      :showSearch="true"
      searchPlaceholder="ID, название, филиал"
      :createButton="{ label: 'Новый трансфер', onClick: () => (createModalOpen = true) }"
    />

    <div v-if="loading" class="rounded-[24px] border border-white/10 bg-[#111827]/80 p-6 text-slate-300">
      Загружаем трансферы...
    </div>

    <div v-else class="grid gap-4">
      <article
        v-for="transfer in filteredTransfers"
        :key="transfer.id"
        class="cursor-pointer rounded-[20px] border border-white/10 bg-white/5 p-4 lg:p-5 transition active:scale-[0.99] hover:bg-white/8"
        @click="openTransfer(transfer)"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <p class="text-xs uppercase tracking-[0.14em] text-sky-300 font-semibold">#{{ transfer.external_id }}</p>
              <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full" :class="{
                'bg-slate-500/20 text-slate-400': transfer.status === 'draft',
                'bg-blue-500/20 text-blue-400': transfer.status === 'sent',
                'bg-emerald-500/20 text-emerald-400': transfer.status === 'accepted',
                'bg-red-500/20 text-red-400': transfer.status === 'cancelled',
              }">{{ statusLabel(transfer.status) }}</span>
            </div>
            <h2 class="mt-1.5 text-[16px] lg:text-[20px] font-bold text-white truncate">{{ transfer.name }}</h2>
            <p class="mt-1 text-[13px] text-slate-400">
              {{ transfer.departure_shop?.name || transfer.departure_shop_id }} → {{ transfer.arrival_shop?.name || transfer.arrival_shop_id }}
            </p>
          </div>
          <Icon name="heroicons:chevron-right" class="w-4 h-4 text-slate-600 shrink-0 mt-1" />
        </div>

        <div class="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
          <div class="rounded-[12px] border border-white/8 bg-[#262626] px-3 py-2">
            <p class="text-[11px] text-slate-400">Загружено</p>
            <p class="mt-0.5 text-[14px] font-semibold text-white">{{ formatNumber(transfer.total_loaded_measurement_value) }}</p>
          </div>
          <div class="rounded-[12px] border border-white/8 bg-[#262626] px-3 py-2">
            <p class="text-[11px] text-slate-400">Принято</p>
            <p class="mt-0.5 text-[14px] font-semibold text-white">{{ formatNumber(transfer.total_arrived_measurement_value) }}</p>
          </div>
          <div class="rounded-[12px] border border-white/8 bg-[#262626] px-3 py-2">
            <p class="text-[11px] text-slate-400">Создан</p>
            <p class="mt-0.5 text-[13px] font-semibold text-white">{{ formatDate(transfer.created_at) || "—" }}</p>
          </div>
          <div class="rounded-[12px] border border-white/8 bg-[#262626] px-3 py-2">
            <p class="text-[11px] text-slate-400">Принят</p>
            <p class="mt-0.5 text-[13px] font-semibold text-white">{{ formatDate(transfer.accepted_at) || "—" }}</p>
          </div>
        </div>
      </article>

      <div v-if="!filteredTransfers.length" class="rounded-[24px] border border-white/10 bg-[#111827]/80 p-6 text-slate-300">
        Документы трансфера не найдены.
      </div>
    </div>

    <div class="flex items-center justify-between gap-3">
      <button type="button" class="page-btn" :disabled="page <= 1" @click="previousPage">Назад</button>
      <p class="text-sm text-slate-300">Страница {{ page }} из {{ totalPages }}</p>
      <button type="button" class="page-btn" :disabled="page >= totalPages" @click="nextPage">Вперёд</button>
    </div>

    <UModal
      v-model:open="createModalOpen"
      :ui="{
        overlay: 'bg-black/50 backdrop-blur-sm',
        content: 'mx-4 max-w-[720px] rounded-[28px] border border-white/10 bg-[#262626] p-0 text-white shadow-2xl ring-0 sm:mx-0',
      }"
    >
      <template #content>
        <div class="p-5 sm:p-6">
          <div class="mb-5 flex items-start justify-between gap-4">
            <div>
              <h3 class="text-[22px] font-semibold">Новый трансфер</h3>
              <p class="mt-1 text-sm text-[#bdbdbd]">Сначала создаётся документ в статусе draft, затем в него добавляются товары.</p>
            </div>
            <UButton color="neutral" variant="ghost" class="rounded-full text-[#bdbdbd] hover:bg-white/5 hover:text-white" @click="createModalOpen = false">
              <Icon name="mingcute:close-fill" class="h-5 w-5" />
            </UButton>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-white">Филиал-отправитель</span>
              <select v-model="form.departure_shop_id" class="field">
                <option value="">Выберите филиал</option>
                <option v-for="shop in locations" :key="shop.id" :value="shop.id">{{ shop.name }}</option>
              </select>
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-white">Филиал-получатель</span>
              <select v-model="form.arrival_shop_id" class="field">
                <option value="">Выберите филиал</option>
                <option v-for="shop in locations" :key="shop.id" :value="shop.id">{{ shop.name }}</option>
              </select>
            </label>

            <label class="block md:col-span-2">
              <span class="mb-2 block text-sm font-semibold text-white">Название</span>
              <input v-model="form.name" type="text" class="field" />
            </label>

            <label class="block md:col-span-2">
              <span class="mb-2 block text-sm font-semibold text-white">Комментарий</span>
              <textarea v-model="form.comment" rows="3" class="field resize-none" />
            </label>

            <label class="flex items-center gap-3 text-sm text-white md:col-span-2">
              <input v-model="form.use_departure_shop_prices" type="checkbox" class="h-4 w-4 accent-[#4993dd]" />
              Использовать цены филиала-отправителя
            </label>
          </div>

          <div class="mt-6 flex flex-col gap-3 sm:flex-row">
            <UButton
              block
              color="neutral"
              variant="soft"
              class="justify-center rounded-[18px] bg-[#404040] py-4 font-semibold text-white hover:bg-[#525252]"
              @click="createModalOpen = false"
            >
              Отмена
            </UButton>
            <UButton
              block
              color="primary"
              class="justify-center rounded-[18px] py-4 font-semibold"
              :disabled="creating"
              @click="submitCreate"
            >
              {{ creating ? "Создание..." : "Создать трансфер" }}
            </UButton>
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

.page-btn {
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #262626;
  padding: 12px 18px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  transition: 0.2s ease;
}

.page-btn:disabled {
  opacity: 0.45;
}
</style>
