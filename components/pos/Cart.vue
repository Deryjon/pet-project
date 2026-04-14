<template>
  <div class="relative mt-[30px] rounded-xl">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-wrap items-center gap-3">
        <h3 class="text-[28px] font-semibold sm:text-[36px]">Корзина</h3>

        <UBadge
          color="neutral"
          variant="soft"
          class="inline-flex items-center gap-2 rounded-[30px] bg-[#404040] px-4 py-2 text-[18px] font-bold text-white sm:text-[24px]"
        >
          <span class="min-w-[24px] text-center leading-none">{{ totalQuantity }}</span>

          <UButton
            v-if="totalQuantity > 0"
            color="error"
            variant="ghost"
            :loading="store.cancelLoading"
            class="flex h-8 w-8 items-center justify-center rounded-[15px] p-0 text-red-400 hover:bg-transparent hover:text-red-500 disabled:pointer-events-none disabled:opacity-50"
            @click="store.cancelSale"
          >
            <Icon name="ic:baseline-delete" class="h-6 w-6" />
          </UButton>
        </UBadge>
      </div>

      <span class="break-all text-[24px] font-bold text-[#bdbdbd] sm:text-[36px]">
        {{ saleDisplayNumber }}
      </span>
    </div>

    <div class="sellers mt-[15px] flex flex-wrap gap-4">
      <UButton
        color="primary"
        variant="solid"
        class="rounded-[20px] bg-[#1f78ff] px-4 py-2 hover:bg-[#4993dd]"
      >
        <span class="text-[16px] font-semibold">
          {{ selectedSeller ? selectedSeller.name : "Все продавцы" }}
        </span>
      </UButton>

      <UButton
        color="neutral"
        variant="soft"
        class="flex items-center justify-center rounded-[20px] bg-[#404040] px-4 py-1 hover:bg-[#5e5e5e]"
        @click="openSellerModal"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8 0.25C3.71875 0.25 0.25 3.71875 0.25 8C0.25 12.2812 3.71875 15.75 8 15.75C12.2812 15.75 15.75 12.2812 15.75 8C15.75 3.71875 12.2812 0.25 8 0.25ZM12.5 8.875C12.5 9.09375 12.3125 9.25 12.125 9.25H9.25V12.125C9.25 12.3438 9.0625 12.5 8.875 12.5H7.125C6.90625 12.5 6.75 12.3438 6.75 12.125V9.25H3.875C3.65625 9.25 3.5 9.09375 3.5 8.875V7.125C3.5 6.9375 3.65625 6.75 3.875 6.75H6.75V3.875C6.75 3.6875 6.90625 3.5 7.125 3.5H8.875C9.0625 3.5 9.25 3.6875 9.25 3.875V6.75H12.125C12.3125 6.75 12.5 6.9375 12.5 7.125V8.875Z"
            fill="#4993DD"
          />
        </svg>
      </UButton>
    </div>

    <UCard
      v-if="cart.length === 0"
      :ui="{
        root: 'mt-[20px] h-[400px] rounded-[25px] border border-dashed border-[#919090] bg-transparent shadow-none ring-0',
        body: 'flex h-full flex-col items-center justify-center p-[20px]',
      }"
    >
      <span class="text-center text-[20px] font-bold sm:text-[24px]">Корзина пока что пуста</span>
      <span class="w-full max-w-[340px] text-center text-[16px] font-bold text-[#5e5e5e] sm:text-[18px]">
        Нажмите "/" для поиска товаров или отсканируйте товары
      </span>
    </UCard>

    <div
      v-else
      class="mt-[20px] max-h-[400px] w-full overflow-y-auto rounded-[25px]"
    >
      <CartItem
        v-for="item in cart"
        :key="item.id"
        :item="item"
        @remove="removeFromCart(item.id)"
      />
    </div>

    <UModal
      v-model:open="sellerModalOpen"
      :ui="{
        overlay: 'bg-black/50 backdrop-blur-sm',
        content: 'max-w-[520px] rounded-[28px] border border-white/10 bg-[rgba(38,38,38,0.88)] text-white shadow-2xl backdrop-blur-xl ring-0',
        header: 'px-6 pt-6 pb-0',
        body: 'px-6 py-5',
        footer: 'px-6 pb-6 pt-0',
      }"
    >
      <template #content>
        <div class="p-6">
          <div class="mb-5 flex items-start justify-between gap-4">
            <div>
              <h3 class="text-[24px] font-semibold">Выбрать продавца</h3>
              <p class="mt-1 text-sm text-[#bdbdbd]">
                Найдите сотрудника и выберите, кто оформляет продажу.
              </p>
            </div>

            <UButton
              color="neutral"
              variant="ghost"
              class="rounded-full text-[#bdbdbd] hover:bg-white/5 hover:text-white"
              @click="sellerModalOpen = false"
            >
              <Icon name="mingcute:close-fill" class="h-5 w-5" />
            </UButton>
          </div>

          <div class="mb-4">
            <UInput
              v-model="sellerSearch"
              placeholder="Введите имя продавца"
              color="neutral"
              variant="none"
              :ui="{
                root: 'w-full',
                base: 'h-12 rounded-[16px] border border-[#404040] bg-[#1f1f1f] px-4 text-white placeholder:text-[#8f8f8f] focus:outline-none focus:ring-0',
                leading: 'ps-4',
              }"
            >
              <template #leading>
                <Icon name="fe:search" class="h-4 w-4 text-[#8f8f8f]" />
              </template>
            </UInput>
          </div>

          <div class="max-h-[320px] space-y-2 overflow-y-auto rounded-[20px] bg-[#1f1f1f] p-2">
            <div
              v-if="sellerLoading"
              class="flex items-center justify-center py-10 text-sm text-[#bdbdbd]"
            >
              Загрузка продавцов...
            </div>

            <div
              v-else-if="filteredSellers.length === 0"
              class="flex items-center justify-center py-10 text-sm text-[#bdbdbd]"
            >
              Продавцы не найдены
            </div>

            <button
              v-for="seller in filteredSellers"
              :key="seller.id"
              type="button"
              class="flex w-full items-center justify-between rounded-[16px] px-4 py-3 text-left transition"
              :class="
                selectedSeller?.id === seller.id
                  ? 'bg-[#1f78ff] text-white'
                  : 'bg-[#2a2a2a] text-white hover:bg-[#343434]'
              "
              @click="selectSeller(seller)"
            >
              <div class="min-w-0">
                <p class="truncate text-[16px] font-semibold">{{ seller.name }}</p>
                <p class="truncate text-sm text-[#bdbdbd]">
                  {{ seller.role || "Сотрудник" }}
                  <span v-if="seller.phone"> • {{ seller.phone }}</span>
                </p>
              </div>

              <Icon
                v-if="selectedSeller?.id === seller.id"
                name="heroicons:check-20-solid"
                class="h-5 w-5 shrink-0"
              />
            </button>
          </div>

          <div class="mt-5 flex gap-2">
            <UButton
              block
              color="primary"
              class="justify-center rounded-[16px] py-3 font-semibold disabled:cursor-not-allowed"
              :disabled="!selectedSeller"
              @click="sellerModalOpen = false"
            >
              Готово
            </UButton>

            <UButton
              block
              color="neutral"
              variant="soft"
              class="justify-center rounded-[16px] bg-[#404040] py-3 font-semibold text-white hover:bg-[#5e5e5e]"
              @click="clearSeller"
            >
              Сбросить
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import { useCartStore } from "@/store/cart";
import { useApi } from "~/composables/useApi";
import CartItem from "./CartItem.vue";

type Seller = {
  id: string | number;
  name: string;
  role: string;
  phone: string;
};

const store = useCartStore();
const { apiFetch } = useApi();
const { cart } = storeToRefs(store);

const totalQuantity = computed(() =>
  cart.value.reduce((sum, item) => sum + item.quantity, 0),
);
const randomSaleNumber = ref(Math.floor(100000 + Math.random() * 900000));
const saleDisplayNumber = computed(() =>
  store.saleNumber
    ? `№ ${store.saleNumber}`
    : store.saleId
      ? `#${store.saleId}`
      : `№ ${randomSaleNumber.value}`,
);

const sellerModalOpen = ref(false);
const sellerLoading = ref(false);
const sellerSearch = ref("");
const sellers = ref<Seller[]>([]);
const selectedSeller = ref<Seller | null>(null);

const filteredSellers = computed(() => {
  const query = sellerSearch.value.trim().toLowerCase();
  if (!query) return sellers.value;

  return sellers.value.filter((seller) =>
    [seller.name, seller.role, seller.phone].some((field) =>
      field.toLowerCase().includes(query),
    ),
  );
});

function removeFromCart(productId: number | string) {
  void store.removeFromCartServer(productId);
}

async function openSellerModal() {
  sellerModalOpen.value = true;

  if (sellers.value.length > 0 || sellerLoading.value) return;

  sellerLoading.value = true;
  try {
    const res = await apiFetch<any>("/users", { method: "GET" });
    const items = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];

    sellers.value = items.map((user: any, index: number) => {
      const fullName = (
        user?.name ||
        `${user?.first_name || user?.firstName || ""} ${user?.last_name || user?.lastName || ""}`
      ).trim();

      return {
        id: user?.id ?? user?.phone_number ?? `seller-${index}`,
        name: fullName || "Без имени",
        role: String(user?.role || ""),
        phone: String(user?.phone_number || user?.phone || ""),
      };
    });
  } catch (_) {
    sellers.value = [];
  } finally {
    sellerLoading.value = false;
  }
}

function selectSeller(seller: Seller) {
  selectedSeller.value = seller;
}

function clearSeller() {
  selectedSeller.value = null;
  sellerSearch.value = "";
  sellerModalOpen.value = false;
}
</script>
