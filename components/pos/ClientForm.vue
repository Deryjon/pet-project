<template>
  <div ref="dropdownRef" class="top flex flex-col gap-4 rounded-[24px] sm:gap-6">
    <div class="flex items-center justify-between gap-3">
      <label class="block text-[16px] font-semibold sm:text-[18px]">Клиент</label>
      <button type="button" class="text-[#4993dd]" @click="goToCreateClient">Создать</button>
    </div>

    <div class="relative">
      <div class="flex items-center gap-2 rounded-[18px] bg-[#404040] p-3 sm:p-4">
        <span>
          <svg width="14" height="16" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M7 8C9.1875 8 11 6.21875 11 4C11 1.8125 9.1875 0 7 0C4.78125 0 3 1.8125 3 4C3 6.21875 4.78125 8 7 8ZM9.78125 9H9.25C8.5625 9.34375 7.8125 9.5 7 9.5C6.1875 9.5 5.40625 9.34375 4.71875 9H4.1875C1.875 9 0 10.9062 0 13.2188V14.5C0 15.3438 0.65625 16 1.5 16H12.5C13.3125 16 14 15.3438 14 14.5V13.2188C14 10.9062 12.0938 9 9.78125 9Z"
              fill="#4993DD"
            />
          </svg>
        </span>
        <input
          v-model="search"
          type="text"
          placeholder="Имя или номер клиента"
          class="flex-1 bg-transparent text-[14px] text-white outline-none sm:text-base"
          @focus="handleFocus"
        />
      </div>

      <transition name="fade">
        <div
          v-if="isOpen"
          class="absolute left-0 right-0 z-10 mt-3 overflow-hidden rounded-[18px] border border-white/8 bg-[#2e2e2e] shadow-[0_24px_50px_rgba(0,0,0,0.22)]"
        >
          <div v-if="search.trim().length > 0 && search.trim().length < 4" class="px-4 py-3 text-sm text-[#bdbdbd]">
            Введите минимум 4 символа
          </div>

          <div v-else-if="loading" class="px-4 py-3 text-sm text-[#bdbdbd]">
            Ищем клиентов...
          </div>

          <div v-else-if="errorMessage" class="px-4 py-3 text-sm text-[#ffb4b4]">
            {{ errorMessage }}
          </div>

          <div v-else-if="search.trim().length >= 4 && !clients.length" class="px-4 py-3 text-sm text-[#bdbdbd]">
            Клиенты не найдены
          </div>

          <ul v-else-if="clients.length" class="max-h-[220px] overflow-y-auto">
            <li
              v-for="client in clients"
              :key="client.id"
              class="cursor-pointer rounded-[10px] px-4 py-3 hover:bg-[#4993dd] hover:text-white"
              @click="selectClient(client)"
            >
              <div class="flex flex-col gap-1">
                <span>{{ client.full_name }}</span>
                <span class="text-xs text-white/70">{{ client.phone || client.code }}</span>
              </div>
            </li>
          </ul>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { ClientListItem } from "@/composables/useClients";
import { useClients } from "@/composables/useClients";
import { useCartStore } from "@/store/cart";

const POS_CREATED_CLIENT_STORAGE_KEY = "pos:selected-client";

const { listClients } = useClients();
const cartStore = useCartStore();
const route = useRoute();
const router = useRouter();
const toast = useToast();

const isOpen = ref(false);
const loading = ref(false);
const search = ref("");
const selectedClient = ref<ClientListItem | null>(null);
const clients = ref<ClientListItem[]>([]);
const errorMessage = ref("");
const dropdownRef = ref<HTMLElement | null>(null);

let searchTimer: ReturnType<typeof setTimeout> | null = null;

function buildCreateClientRoute() {
  const query: Record<string, string> = {
    returnTo: route.fullPath || "/order/new-order?page=1",
  };

  const value = search.value.trim();
  if (value) {
    if (/^\+?\d[\d\s()-]*$/.test(value)) {
      query.phone = value;
    } else {
      query.first_name = value;
    }
  }

  return { path: "/clients/create", query };
}

async function fetchClients() {
  const query = search.value.trim();

  if (query.length < 4) {
    clients.value = [];
    errorMessage.value = "";
    loading.value = false;
    return;
  }

  loading.value = true;
  errorMessage.value = "";

  try {
    const response = await listClients({
      page: 1,
      limit: 10,
      search: query,
    });
    clients.value = Array.isArray(response?.items) ? response.items : [];
  } catch (error: any) {
    clients.value = [];
    errorMessage.value =
      error?.data?.message || error?.message || "Не удалось загрузить клиентов.";
  } finally {
    loading.value = false;
  }
}

function handleFocus() {
  isOpen.value = true;
}

function applySelectedClient(client: ClientListItem) {
  selectedClient.value = client;
  search.value = client.full_name;
}

function syncClientSelection(client: Pick<ClientListItem, "id" | "full_name" | "phone" | "code">) {
  cartStore.setCustomerSelection({
    id: client.id,
    name: client.full_name,
    phone: client.phone,
    code: client.code,
  });
}

async function selectClient(client: ClientListItem) {
  syncClientSelection(client);

  const result = await cartStore.attachCustomer({ id: client.id });
  if (!result) {
    toast.add({
      title: "Не удалось привязать клиента",
      description: cartStore.lastCartError || undefined,
      color: "error",
    });
    return;
  }

  applySelectedClient(client);
  isOpen.value = false;
}

async function goToCreateClient() {
  await router.push(buildCreateClientRoute());
}

function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
}

async function restoreCreatedClientFromSession() {
  if (!import.meta.client) return;

  const raw = window.sessionStorage.getItem(POS_CREATED_CLIENT_STORAGE_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw) as {
      id?: string;
      full_name?: string;
      phone?: string;
      code?: string;
    };

    if (!parsed?.id || !parsed?.full_name) {
      return;
    }

    const restoredClient = {
      id: parsed.id,
      code: parsed.code || "",
      full_name: parsed.full_name,
      phone: parsed.phone || "",
      groups: [],
      tags: [],
      gender: "unknown",
      total_purchases_uzs: 0,
      last_purchase_at: null,
      birth_date: null,
      registered_at: new Date().toISOString(),
      registration_shop: null,
      balance_uzs: 0,
      debt_uzs: 0,
      visits_count: 0,
    };
    syncClientSelection(restoredClient);
    const result = await cartStore.attachCustomer({ id: restoredClient.id });
    if (result) {
      applySelectedClient(restoredClient);
    }
  } catch {
    // ignore invalid session payload
  } finally {
    window.sessionStorage.removeItem(POS_CREATED_CLIENT_STORAGE_KEY);
  }
}

watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer);

  if (selectedClient.value && search.value !== selectedClient.value.full_name) {
    selectedClient.value = null;
  }

  searchTimer = setTimeout(() => {
    void fetchClients();
  }, 300);
});

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  void restoreCreatedClientFromSession();

  const orderClientId = String(cartStore.currentOrder?.client?.id ?? cartStore.currentOrder?.customerId ?? "").trim();
  const orderClientName = String(
    cartStore.currentOrder?.customerName ??
    cartStore.currentOrder?.client?.firstName ??
    cartStore.currentOrder?.customer?.firstName ??
    "",
  ).trim();

  if (!selectedClient.value && orderClientId && orderClientName) {
    selectedClient.value = {
      id: orderClientId,
      code: "",
      full_name: orderClientName,
      phone: "",
      groups: [],
      tags: [],
      gender: "unknown",
      total_purchases_uzs: 0,
      last_purchase_at: null,
      birth_date: null,
      registered_at: new Date().toISOString(),
      registration_shop: null,
      balance_uzs: 0,
      debt_uzs: 0,
      visits_count: 0,
    };
    search.value = orderClientName;
  }
});

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer);
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>
