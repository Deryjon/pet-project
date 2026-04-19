<template>
  <div class="relative mt-6 rounded-xl sm:mt-[30px]">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-wrap items-center gap-3">
        <h3 class="text-[24px] font-semibold sm:text-[36px]">Корзина</h3>

        <UBadge
          color="neutral"
          variant="soft"
          class="inline-flex items-center gap-2 rounded-[30px] bg-[#404040] px-3 py-2 text-[16px] font-bold text-white sm:px-4 sm:text-[24px]"
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

      <span class="break-all text-[18px] font-bold text-[#bdbdbd] sm:text-[36px]">
        {{ saleDisplayNumber }}
      </span>
    </div>

    <div class="sellers mt-[15px] flex flex-wrap gap-3">
      <UButton
        color="primary"
        variant="solid"
        class="rounded-[20px] bg-[#1f78ff] px-4 py-2 hover:bg-[#4993dd]"
      >
        <span class="text-[14px] font-semibold sm:text-[16px]">
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

    <div
      v-if="cartLoading"
      class="mt-[20px] space-y-3 rounded-[25px] border border-white/8 bg-[#303030] p-4"
    >
      <div
        v-for="item in 4"
        :key="item"
        class="flex items-center justify-between gap-4 rounded-[20px] bg-[#3a3a3a] px-4 py-3"
      >
        <div class="flex min-w-0 items-center gap-4">
          <div class="h-10 w-12 animate-pulse rounded-[14px] bg-[#4a4a4a]" />
          <div class="h-[50px] w-[50px] animate-pulse rounded-[16px] bg-[#4a4a4a]" />
          <div class="min-w-0 space-y-2">
            <div class="h-4 w-44 max-w-[45vw] animate-pulse rounded-full bg-[#4a4a4a]" />
            <div class="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em] text-[#8f8f8f]">
              <span>#SKU-{{ item }}</span>
              <span>/</span>
              <span>000{{ item }}000{{ item }}</span>
            </div>
          </div>
        </div>
        <div class="hidden h-5 w-24 animate-pulse rounded-full bg-[#4a4a4a] sm:block" />
      </div>
    </div>

    <UCard
      v-else-if="cart.length === 0"
      :ui="{
        root: 'mt-[20px] h-[320px] rounded-[25px] border border-dashed border-[#919090] bg-transparent shadow-none ring-0 sm:h-[400px]',
        body: 'flex h-full flex-col items-center justify-center p-[20px]',
      }"
    >
      <span class="text-center text-[18px] font-bold sm:text-[24px]">Корзина пока что пуста</span>
      <span class="w-full max-w-[340px] text-center text-[14px] font-bold text-[#5e5e5e] sm:text-[18px]">
        Нажмите "/" для поиска товаров или отсканируйте товары
      </span>
    </UCard>

    <div
      v-else
      class="mt-[20px] max-h-[360px] w-full overflow-y-auto rounded-[25px] sm:max-h-[400px]"
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
        content: 'mx-4 max-w-[520px] rounded-[28px] border border-white/10 bg-[rgba(38,38,38,0.88)] text-white shadow-2xl backdrop-blur-xl ring-0 sm:mx-0',
        header: 'px-4 pt-4 pb-0 sm:px-6 sm:pt-6',
        body: 'px-4 py-4 sm:px-6 sm:py-5',
        footer: 'px-4 pb-4 pt-0 sm:px-6 sm:pb-6',
      }"
    >
      <template #content>
        <div class="p-4 sm:p-6">
          <div class="mb-5 flex items-start justify-between gap-4">
            <div>
              <h3 class="text-[20px] font-semibold sm:text-[24px]">Выбрать продавца</h3>
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

          <div class="mt-5 flex flex-col gap-2 sm:flex-row">
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
    ? `#${store.saleNumber}`
    : store.saleId
      ? `#${store.saleId}`
      : `#${randomSaleNumber.value}`,
);

const cartLoading = computed(() => store.creatingSale || store.loadingSale || store.restoringSale);
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
    const shopId = String(store.resolveCurrentShopId() || "");
    const res = await apiFetch<any>("/v1/user", {
      method: "GET",
      query: {
        search: sellerSearch.value.trim(),
        limit: 100,
        page: 1,
        shop_ids: shopId || undefined,
        show_sellers: true,
        type: 1,
      },
    });
    const items = Array.isArray(res?.users)
      ? res.users
      : Array.isArray(res?.data?.users)
        ? res.data.users
        : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];

    sellers.value = items.map((user: any, index: number) => {
      const fullName = (
        user?.name ||
        `${user?.first_name || user?.firstName || ""} ${user?.last_name || user?.lastName || ""}`
      ).trim();

      return {
        id: user?.id ?? user?.phone_number ?? `seller-${index}`,
        name: fullName || "Без имени",
        role: String(user?.role_name || user?.role || user?.branch_title || ""),
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
