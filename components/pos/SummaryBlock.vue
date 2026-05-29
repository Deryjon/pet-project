<template>
  <div class="flex flex-col overflow-hidden rounded-t-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(38,38,38,0.98),rgba(28,28,28,0.98))] text-[15px] font-bold shadow-[0_22px_50px_rgba(0,0,0,0.18)] sm:rounded-[28px] sm:text-[17px]">
    <div class="flex items-center justify-between border-b border-white/6 p-4">
      <span>Подытог</span>
      <span v-if="showSummarySkeleton" class="h-5 w-28 animate-pulse rounded-full bg-[#404040]" />
      <span v-else>{{ formatPrice(subtotal) }} UZS</span>
    </div>

    <div class="flex items-center justify-between border-b border-white/6 p-4">
      <span>Скидки</span>
      <span v-if="showSummarySkeleton" class="h-5 w-24 animate-pulse rounded-full bg-[#404040]" />
      <span v-else>{{ formatPrice(totalDiscount) }} UZS</span>
    </div>

    <button
      class="flex w-full items-center justify-between rounded-none px-4 py-5 sm:px-5 sm:py-6"
      :class="canStartCheckout ? 'bg-[#1f78ff]' : 'cursor-not-allowed bg-[#bdbdbd]'"
      :disabled="!canStartCheckout"
      @click="openPaymentPanel"
    >
      <span class="flex items-center gap-2 text-[13px] uppercase sm:text-base">
        <Icon
          v-if="cartStore.payLoading || cartStore.completingOrder"
          name="heroicons:arrow-path"
          class="h-4 w-4 animate-spin"
        />
        Оплатить
      </span>
      <span v-if="showSummarySkeleton" class="h-5 w-32 animate-pulse rounded-full bg-white/25" />
      <span v-else class="text-right text-[15px] sm:text-[17px]">{{ formatPrice(totalAmount) }} UZS</span>
    </button>

    <button
      v-if="canParkSale"
      class="flex w-full items-center justify-center border-t border-white/6 p-5 text-gray-300"
      :class="cartStore.parkingLoading ? 'cursor-not-allowed opacity-60' : ''"
      :disabled="cartStore.parkingLoading"
      @click="onPark"
    >
      <Icon v-if="cartStore.parkingLoading" name="heroicons:arrow-path" class="mr-2 h-4 w-4 animate-spin" />
      Отложить чек
    </button>

    <AppSlideover
      :open="paymentPanelOpen"
      @update:open="paymentPanelOpen = $event"
      maxWidthClass="max-w-[1080px]"
      panelClass="max-h-[100vh] overflow-y-auto bg-[#1f1f1f] p-4 text-white sm:p-6"
      overlayClass="bg-black/50 backdrop-blur-sm"
    >
      <div class="flex h-full flex-col">
        <div class="mb-6 flex items-start justify-between gap-4">
          <div>
            <h3 class="text-[22px] font-semibold sm:text-[28px]">Оплаты и долг</h3>
            <p class="mt-1 text-sm text-[#a3a3a3]">
              Добавляйте оплаты частями. Если останется остаток, его можно оформить как долг клиента.
            </p>
          </div>

          <UButton
            color="neutral"
            variant="ghost"
            class="rounded-full text-[#bdbdbd] hover:bg-white/5 hover:text-white"
            @click="closePaymentPanel"
          >
            <Icon name="mingcute:close-fill" class="h-5 w-5" />
          </UButton>
        </div>

        <div class="grid flex-1 grid-cols-1 gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div class="rounded-[26px] border border-white/8 bg-[#2a2a2a] p-5">
            <div class="mb-4 flex items-center justify-between">
              <span class="text-sm font-semibold uppercase tracking-[0.12em] text-[#8f8f8f]">Заказ</span>
              <span class="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold uppercase text-[#d0d0d0]">
                {{ currentCustomerLabel }}
              </span>
            </div>

            <div class="space-y-3 text-[14px] text-[#bdbdbd]">
              <div class="flex items-center justify-between">
                <span>Товаров</span>
                <span>{{ totalQuantity }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span>Промежуточно</span>
                <span>{{ formatPrice(subtotal) }} UZS</span>
              </div>
              <div class="flex items-center justify-between">
                <span>Скидка</span>
                <span>{{ formatPrice(totalDiscount) }} UZS</span>
              </div>
              <div class="flex items-center justify-between">
                <span>Оплачено</span>
                <span>{{ formatPrice(paidAmount) }} UZS</span>
              </div>
            </div>

            <div class="my-5 h-px bg-white/10" />

            <div class="rounded-[18px] bg-[#303030] px-4 py-4">
              <div class="text-xs font-semibold uppercase tracking-[0.12em] text-white/60">Остаток к оплате</div>
              <div class="mt-2 text-[28px] font-bold leading-none" :class="remainingDebtAmount > 0 ? 'text-[#ffcf80]' : 'text-white'">
                {{ formatPrice(remainingDebtAmount) }} UZS
              </div>
            </div>
          </div>

          <div class="rounded-[26px] border border-white/8 bg-[#262626] p-5">
            <div class="mb-5">
              <h4 class="text-[20px] font-semibold">Добавить оплату</h4>
              <p class="mt-1 text-sm text-[#8f8f8f]">Выберите способ оплаты и сумму. Можно добавлять несколько оплат.</p>
            </div>

            <div
              v-if="paymentMethodsLoading"
              class="mb-4 rounded-[18px] border border-white/8 bg-[#303030] px-4 py-3 text-sm text-[#bdbdbd]"
            >
              Загружаем способы оплаты...
            </div>

            <div
              v-else-if="singlePaymentMethods.length === 0"
              class="mb-4 rounded-[18px] border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
            >
              Для компании не настроены способы оплаты.
            </div>

            <div v-else class="grid grid-cols-1 gap-3 md:grid-cols-2">
              <button
                v-for="method in singlePaymentMethods"
                :key="method.value"
                type="button"
                :disabled="method.requiresCustomer && !hasCustomerAttached"
                class="flex items-center justify-between rounded-[20px] border px-4 py-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50"
                :class="
                  selectedPaymentMethod === method.value
                    ? 'border-[#1f78ff] bg-[#1f78ff]/12 text-white'
                    : 'border-white/8 bg-[#303030] text-white hover:border-white/15 hover:bg-[#353535]'
                "
                @click="selectPaymentMethod(method)"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-11 w-11 items-center justify-center rounded-[16px]"
                    :class="selectedPaymentMethod === method.value ? 'bg-[#1f78ff] text-white' : 'bg-[#404040] text-[#bdbdbd]'"
                  >
                    <Icon :name="method.icon" class="h-5 w-5" />
                  </div>
                  <div class="flex flex-col">
                    <span class="text-[16px] font-semibold">{{ method.label }}</span>
                    <span class="text-[12px] uppercase tracking-[0.08em] text-[#8f8f8f]">{{ method.hint }}</span>
                  </div>
                </div>
              </button>
            </div>

          </div>
        </div>

        <div class="mt-6 flex flex-col gap-3 sm:flex-row">
          <UButton
            block
            color="neutral"
            variant="soft"
            class="justify-center rounded-[18px] bg-[#404040] py-4 font-semibold text-white hover:bg-[#525252]"
            @click="closePaymentPanel"
          >
            Назад
          </UButton>

          <UButton
            v-if="canShowDebtAction"
            block
            color="neutral"
            variant="soft"
            class="justify-center rounded-[18px] bg-[#564327] py-4 font-semibold text-[#ffcf80] hover:bg-[#6a5231]"
            @click="openDebtModal"
          >
            Оформить в долг
          </UButton>

          <UButton
            v-if="!isDebtPaymentSelected"
            block
            color="primary"
            class="justify-center rounded-[18px] py-4 font-semibold disabled:cursor-not-allowed"
            :disabled="!canCompletePaidOrder"
            @click="completePaidOrder"
          >
            <Icon v-if="cartStore.payLoading" name="heroicons:arrow-path" class="h-4 w-4 animate-spin" />
            Завершить продажу
          </UButton>
        </div>
      </div>
    </AppSlideover>

    <UModal
      v-model:open="debtModalOpen"
      :ui="{
        overlay: 'z-[110] bg-black/50 backdrop-blur-sm',
        content: 'z-[120] mx-4 max-h-[calc(100vh-2rem)] max-w-[560px] overflow-hidden rounded-[28px] border border-white/10 bg-[#262626] p-0 text-white shadow-2xl ring-0 sm:mx-0',
      }"
    >
      <template #content>
        <div class="max-h-[calc(100vh-2rem)] overflow-y-auto p-5 sm:p-6">
          <div class="mb-5 flex items-start justify-between gap-4">
            <div>
              <h3 class="text-[22px] font-semibold">Продажа в долг</h3>
              <p class="mt-1 text-sm text-[#bdbdbd]">Остаток заказа будет оформлен как долг клиента.</p>
            </div>

            <UButton color="neutral" variant="ghost" class="rounded-full text-[#bdbdbd] hover:bg-white/5 hover:text-white" @click="debtModalOpen = false">
              <Icon name="mingcute:close-fill" class="h-5 w-5" />
            </UButton>
          </div>

          <div class="space-y-4">
            <div class="rounded-[18px] border border-white/8 bg-[#303030] px-4 py-4 text-sm text-[#d0d0d0]">
              <p class="font-semibold text-white">Оплата пойдет одним запросом</p>
              <p class="mt-1">Фронт отправит в `POST /new-sale/:id/pay` выбранный `payment_method`, `client_id` и, если нужен долг, вложенный объект `debt`. Клиент к заказу привязывается отдельным `PATCH /orders/:id/customer` с `clientId`.</p>
              <p v-if="!cartStore.currentOrder?.customerId" class="mt-2 text-amber-200">
                Клиент не выбран. Продажа все равно может быть оплачена, но без привязки к клиенту.
              </p>
              <p v-else class="mt-2 text-amber-200">
                Для продажи в долг клиент уже привязан, осталось указать срок и комментарий.
              </p>
            </div>

            <div class="rounded-[18px] bg-[#303030] px-4 py-4">
              <p class="text-sm text-[#8f8f8f]">Остаток долга</p>
              <p class="mt-2 text-[28px] font-bold text-[#ffcf80]">{{ formatPrice(remainingDebtAmount) }} UZS</p>
            </div>

            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-white">Срок погашения</span>
              <input v-model="dueDateInput" type="date" class="w-full rounded-[18px] border border-white/10 bg-[#303030] px-4 py-4 text-white outline-none" />
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-white">Комментарий</span>
              <textarea
                v-model="debtCommentInput"
                rows="3"
                class="w-full rounded-[18px] border border-white/10 bg-[#303030] px-4 py-4 text-white outline-none"
                placeholder="Например: оплатит после зарплаты"
              />
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-white">Ссылка на чек / документ</span>
              <input v-model="receiptUrlInput" type="text" class="w-full rounded-[18px] border border-white/10 bg-[#303030] px-4 py-4 text-white outline-none" placeholder="https://..." />
            </label>

            <label class="flex items-center gap-3 rounded-[18px] border border-white/8 bg-[#303030] px-4 py-4 text-sm text-white">
              <input v-model="debtConfirmation" type="checkbox" class="h-4 w-4 accent-[#4993dd]" />
              <span>Оформить остаток как долг</span>
            </label>
          </div>

          <div class="mt-6 flex flex-col gap-3 sm:flex-row">
            <UButton
              block
              color="neutral"
              variant="soft"
              class="justify-center rounded-[18px] bg-[#404040] py-4 font-semibold text-white hover:bg-[#525252]"
              @click="debtModalOpen = false"
            >
              Отмена
            </UButton>

            <UButton
              block
              color="primary"
              class="justify-center rounded-[18px] py-4 font-semibold disabled:cursor-not-allowed"
              :disabled="!canConfirmDebtCompletion"
              @click="completeWithDebt"
            >
              <Icon v-if="cartStore.completingOrder" name="heroicons:arrow-path" class="h-4 w-4 animate-spin" />
              Завершить и оформить долг
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="completionModalOpen"
      :ui="{
        overlay: 'bg-black/50 backdrop-blur-sm',
        content: 'mx-4 max-w-[620px] rounded-[28px] border border-white/10 bg-[#262626] p-0 text-white shadow-2xl ring-0 sm:mx-0',
      }"
    >
      <template #content>
        <div class="p-5 sm:p-6">
          <h3 class="text-[24px] font-semibold">Продажа завершена</h3>

          <div v-if="completionDebt" class="mt-5 rounded-[18px] border border-white/10 bg-[#303030] px-4 py-4">
            <p class="text-sm text-[#8f8f8f]">Оформлен долг</p>
            <p class="mt-2 text-[26px] font-bold text-white">{{ formatPrice(completionDebt.remaining_amount_uzs) }} UZS</p>
            <p class="mt-2 text-sm text-[#d1d1d1]">Срок: {{ completionDebt.due_date ? formatDate(completionDebt.due_date) : "Не указан" }}</p>
          </div>

          <div class="mt-6 flex flex-col gap-3">
            <UButton
              v-if="completionCustomerId"
              block
              color="neutral"
              variant="soft"
              class="justify-center rounded-[18px] bg-[#404040] py-4 font-semibold text-white hover:bg-[#525252]"
              @click="goToClientCard"
            >
              Перейти в карточку клиента
            </UButton>

            <UButton
              v-if="completionCustomerId && completionDebt"
              block
              color="neutral"
              variant="soft"
              class="justify-center rounded-[18px] bg-[#404040] py-4 font-semibold text-white hover:bg-[#525252]"
              @click="goToClientDebts"
            >
              Перейти в долги клиента
            </UButton>

            <UButton
              block
              color="primary"
              class="justify-center rounded-[18px] py-4 font-semibold"
              @click="startNewSale"
            >
              Новая продажа
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="printStore.receiptPreviewOpen"
      :ui="{
        overlay: 'bg-black/50 backdrop-blur-sm',
        content: 'mx-4 max-w-[520px] rounded-[28px] border border-white/10 bg-[#262626] p-0 text-white shadow-2xl ring-0 sm:mx-0',
      }"
    >
      <template #content>
        <div class="p-5 sm:p-6">
          <div class="mb-5 flex items-start justify-between gap-4">
            <div>
              <h3 class="text-[22px] font-semibold">Чек продажи</h3>
              <p class="mt-1 text-sm text-[#bdbdbd]">Проверьте чек перед печатью или закройте окно.</p>
            </div>

            <UButton
              color="neutral"
              variant="ghost"
              class="flex h-10 w-10 items-center justify-center rounded-full bg-[#404040] p-0 text-white hover:bg-[#505050]"
              @click="printStore.receiptPreviewOpen = false"
            >
              <Icon name="heroicons:x-mark" class="h-5 w-5" />
            </UButton>
          </div>

          <div
            v-if="printStore.latestReceipt"
            class="mx-auto rounded-lg bg-white p-3 font-sans text-[12px] text-black"
            :class="printStore.receiptPaperClass === 'receipt-paper-58' ? 'max-w-[250px]' : 'max-w-[320px]'"
          >
            <div v-if="printStore.settings.showCompanyName" class="text-center font-bold">{{ printStore.settings.companyName }}</div>
            <div
              v-if="printStore.settings.showShopName && (printStore.settings.shopName || printStore.settings.address)"
              class="text-center text-[#555]"
            >
              {{ printStore.settings.shopName || printStore.settings.address }}
            </div>
            <div v-if="printStore.settings.phone" class="text-center text-[#555]">{{ receiptPhone }}</div>
            <div class="my-2 border-t border-dashed border-black"></div>
            <div>Чек: {{ printStore.latestReceipt.saleNumber || printStore.latestReceipt.saleId || "-" }}</div>
            <div>Дата: {{ new Date(printStore.latestReceipt.paidAt).toLocaleString("ru-RU") }}</div>
            <div v-if="printStore.settings.showPaymentMethod">Оплата: {{ printStore.latestReceipt.paymentMethodName }}</div>
            <div class="my-2 border-t border-dashed border-black"></div>
            <div
              v-for="line in printStore.latestReceipt.lines"
              :key="line.name"
              class="mb-2 flex justify-between gap-3"
            >
              <div>
                <div class="font-bold">{{ line.name }}</div>
                <div class="text-[#555]">{{ line.quantity }} x {{ printStore.formatMoney(line.price) }}</div>
              </div>
              <b class="whitespace-nowrap">{{ printStore.formatMoney(line.total) }}</b>
            </div>
            <div class="my-2 border-t border-dashed border-black"></div>
            <div class="flex justify-between font-bold">
              <span>Итого</span>
              <span>{{ printStore.formatMoney(printStore.latestReceipt.total) }}</span>
            </div>
          </div>

          <div class="mt-5 flex flex-col gap-2 sm:flex-row">
            <UButton
              block
              color="neutral"
              variant="soft"
              class="justify-center rounded-[16px] bg-[#404040] py-3 font-semibold text-white hover:bg-[#505050]"
              @click="printStore.receiptPreviewOpen = false"
            >
              Закрыть
            </UButton>
            <UButton block color="primary" class="justify-center rounded-[16px] py-3 font-semibold" @click="printStore.printReceipt()">
              <Icon name="heroicons:printer" class="h-5 w-5" />
              Печать
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import { useCartStore } from "@/store/cart";
import { usePrintSettingsStore, type SaleReceiptSnapshot } from "@/store/printSettings";
import { useFormatPrice } from "@/composables/useFormatPrice";
import { formatUzPhoneDisplay } from "~/utils/phone";

const cartStore = useCartStore();
const printStore = usePrintSettingsStore();
const router = useRouter();
const {
  subtotal,
  totalDiscount,
  total,
  cart,
  paymentMethods,
  paymentMethodsLoading,
  saleFlowMode,
  paidAmount,
  remainingDebtAmount,
  createdDebt,
} = storeToRefs(cartStore);
const { formatPrice } = useFormatPrice();
const toast = useToast();

const paymentPanelOpen = ref(false);
const debtModalOpen = ref(false);
const completionModalOpen = ref(false);
const selectedPaymentMethod = ref("");
const paymentAmountInput = ref("");
const dueDateInput = ref("");
const debtCommentInput = ref("");
const receiptUrlInput = ref("");
const debtConfirmation = ref(false);
const completionCustomerId = ref("");
const completionDebt = ref<any | null>(null);

const showSummarySkeleton = computed(() => cartStore.addingItem || cartStore.discountLoading);
const isReturnFlow = computed(() => saleFlowMode.value === "return");

function paymentMethodIcon(method: { isCash?: boolean }) {
  return method.isCash ? "heroicons:banknotes" : "heroicons:credit-card";
}

function isDebtPaymentMethod(method: { name?: string; paymentTypeName?: string }) {
  const searchBase = [method.name, method.paymentTypeName]
    .map((value) => String(value || "").trim().toLowerCase())
    .join(" ");

  return ["долг", "debt", "credit", "qarz", "nasiya"].some((token) => searchBase.includes(token));
}

const singlePaymentMethods = computed(() =>
  paymentMethods.value
    .filter((method) => !method.dontShowInMakePayment)
    .map((method) => ({
      value: method.id,
      label: method.name,
      hint: method.paymentTypeName || "",
      isCash: Boolean(method.isCash),
      icon: paymentMethodIcon(method),
      isDebt: isDebtPaymentMethod(method),
      requiresCustomer: isDebtPaymentMethod(method),
    })),
);

const totalAmount = computed(() =>
  isReturnFlow.value ? Number(total.value || 0) : Number(cartStore.payableTotal || total.value || 0),
);
const canStartCheckout = computed(() => !isReturnFlow.value && cart.value.length > 0 && !cartStore.completingOrder);
const canParkSale = computed(
  () => !isReturnFlow.value && cart.value.length > 0 && !cartStore.payLoading && !cartStore.parkingLoading,
);
const totalQuantity = computed(() =>
  cart.value.reduce((sum, item) => sum + Math.max(1, Number(item.quantity || 1)), 0),
);
const currentCustomerLabel = computed(
  () =>
    cartStore.currentOrder?.customerName ||
    cartStore.currentOrder?.client?.firstName ||
    cartStore.currentOrder?.customer?.firstName ||
    "Без клиента",
);
const currentPayments = computed(() => cartStore.currentOrder?.payments || []);
const canAddPayment = computed(() => false);
const hasCustomerAttached = computed(() => Boolean(String(cartStore.currentOrder?.customerId ?? "").trim()));
const selectedPaymentMethodMeta = computed(
  () => singlePaymentMethods.value.find((method) => method.value === selectedPaymentMethod.value) ?? null,
);
const isDebtPaymentSelected = computed(() => Boolean(selectedPaymentMethodMeta.value?.isDebt));
const canCompletePaidOrder = computed(
  () =>
    !isReturnFlow.value &&
    cart.value.length > 0 &&
    Boolean(selectedPaymentMethod.value) &&
    !isDebtPaymentSelected.value &&
    !cartStore.payLoading &&
    !cartStore.completingOrder,
);
const canShowDebtAction = computed(
  () =>
    !isReturnFlow.value &&
    cart.value.length > 0 &&
    isDebtPaymentSelected.value &&
    Number(remainingDebtAmount.value || 0) > 0 &&
    !cartStore.payLoading &&
    !cartStore.completingOrder,
);
const canOpenDebtModal = computed(() => canShowDebtAction.value && hasCustomerAttached.value);
const canConfirmDebtCompletion = computed(() => canOpenDebtModal.value && debtConfirmation.value);
const receiptPhone = computed(() => formatUzPhoneDisplay(printStore.settings.phone) || printStore.settings.phone);

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function paymentTypeLabel(paymentTypeId: string) {
  return singlePaymentMethods.value.find((method) => method.value === paymentTypeId)?.label || "Способ оплаты";
}

function selectPaymentMethod(method: { value: string; label: string; requiresCustomer?: boolean }) {
  if (method.requiresCustomer && !hasCustomerAttached.value) {
    toast.add({
      title: "Сначала выберите клиента",
      description: `Способ оплаты "${method.label}" доступен только с привязанным клиентом.`,
      color: "warning",
    });
    return;
  }

  selectedPaymentMethod.value = method.value;
}

function resetDebtModalState() {
  dueDateInput.value = "";
  debtCommentInput.value = "";
  receiptUrlInput.value = "";
  debtConfirmation.value = false;
}

function openCompletionState(result: any) {
  completionCustomerId.value = String(
    result?.customerId ??
    result?.customer_id ??
    result?.clientId ??
    result?.client_id ??
    result?.customer?.id ??
    result?.client?.id ??
    cartStore.currentOrder?.customerId ??
    "",
  ).trim();
  completionDebt.value = result?.createdDebt ?? result?.created_debt ?? createdDebt.value ?? null;
  completionModalOpen.value = true;
}

function syncReceipt(result: any) {
  const firstPayment = currentPayments.value[0];
  const methodName =
    currentPayments.value.length === 1 && firstPayment
      ? paymentTypeLabel(firstPayment.paymentTypeId)
      : currentPayments.value.length > 1
        ? "Смешанная оплата"
        : paymentTypeLabel(selectedPaymentMethod.value);

  const receiptSnapshot: SaleReceiptSnapshot = {
    saleId: cartStore.saleId,
    saleNumber: cartStore.saleNumber,
    paidAt: new Date().toISOString(),
    paymentMethodName: methodName,
    subtotal: subtotal.value,
    discount: totalDiscount.value,
    total: totalAmount.value,
    lines: cart.value.map((item: any) => {
      const quantity = Math.max(1, Number(item.quantity || 1));
      const price = Number(item.price || 0);

      return {
        name: String(item.name || "Товар"),
        quantity,
        price,
        total: price * quantity,
      };
    }),
  };

  printStore.setLatestReceipt({
    ...receiptSnapshot,
    receiptResponse: result,
  });
}

async function openPaymentPanel() {
  if (!canStartCheckout.value) return;
  await cartStore.loadPaymentMethods();
  const defaultMethod = singlePaymentMethods.value.find((method) => method.isCash) ?? singlePaymentMethods.value[0];
  selectedPaymentMethod.value = selectedPaymentMethod.value || defaultMethod?.value || "";
  paymentAmountInput.value = "";
  paymentPanelOpen.value = true;
}

function closePaymentPanel() {
  paymentPanelOpen.value = false;
}

function openDebtModal() {
  if (!canShowDebtAction.value) return;

  if (!hasCustomerAttached.value) {
    toast.add({
      title: "Нельзя оформить в долг",
      description: "Сначала привяжите клиента к заказу.",
      color: "error",
    });
    return;
  }

  debtModalOpen.value = true;
}

async function addPayment() {
  if (!canAddPayment.value) return;

  const result = await cartStore.addOrderPayment({
    paymentTypeId: selectedPaymentMethod.value,
    amount: Number(paymentAmountInput.value || 0),
  });

  if (!result) {
    toast.add({
      title: "Не удалось добавить оплату",
      description: cartStore.lastCartError || undefined,
      color: "error",
    });
    return;
  }

  paymentAmountInput.value = String(Math.max(0, Number(remainingDebtAmount.value || 0)));
  toast.add({ title: "Оплата добавлена", color: "success" });
}

async function removePayment(paymentId: string) {
  const result = await cartStore.removeOrderPayment(paymentId);
  if (!result) {
    toast.add({
      title: "Не удалось удалить оплату",
      description: cartStore.lastCartError || undefined,
      color: "error",
    });
    return;
  }

  paymentAmountInput.value = String(Math.max(0, Number(remainingDebtAmount.value || 0)));
}

async function completePaidOrder() {
  const result = await cartStore.paySale({
    paymentMethodId: selectedPaymentMethod.value,
    clientId: cartStore.currentOrder?.customerId ?? null,
  });
  if (!result) {
    toast.add({
      title: "Не удалось завершить продажу",
      description: cartStore.lastCartError || undefined,
      color: "error",
    });
    return;
  }

  syncReceipt(result);
  closePaymentPanel();
  openCompletionState(result);
  toast.add({ title: "Продажа завершена", color: "success" });
}

async function completeWithDebt() {
  if (!canConfirmDebtCompletion.value) return;

  const result = await cartStore.paySale({
    paymentMethodId: selectedPaymentMethod.value,
    clientId: cartStore.currentOrder?.customerId ?? null,
    debt: {
      amount_uzs: Number(remainingDebtAmount.value || 0),
      due_date: dueDateInput.value || null,
      comment: debtCommentInput.value || null,
      receipt_url: receiptUrlInput.value || null,
    },
  });

  if (!result) {
    toast.add({
      title: "Не удалось оформить продажу в долг",
      description: cartStore.lastCartError || undefined,
      color: "error",
    });
    return;
  }

  syncReceipt(result);
  debtModalOpen.value = false;
  closePaymentPanel();
  resetDebtModalState();
  openCompletionState(result);
  toast.add({ title: "Продажа завершена", color: "success" });
}

async function startNewSale() {
  completionModalOpen.value = false;
  resetDebtModalState();
  await cartStore.openFreshSale({ keepReceipt: true });
}

async function goToClientCard() {
  if (!completionCustomerId.value) return;
  completionModalOpen.value = false;
  await router.push(`/clients/card/${completionCustomerId.value}`);
}

async function goToClientDebts() {
  if (!completionCustomerId.value) return;
  completionModalOpen.value = false;
  await router.push(`/clients/card/${completionCustomerId.value}?tab=debts`);
}

async function onPark() {
  const result = await cartStore.parkSale({ createNewDraft: true });
  if (!result) {
    toast.add({
      title: "Не удалось отложить чек",
      description: cartStore.lastCartError || undefined,
      color: "error",
    });
    return;
  }

  toast.add({
    title: "Чек отложен",
    color: "success",
  });
}

watch(
  singlePaymentMethods,
  (methods) => {
    const first =
      (methods.find((method) => method.isCash && (!method.requiresCustomer || hasCustomerAttached.value)) ??
        methods.find((method) => !method.requiresCustomer || hasCustomerAttached.value) ??
        methods[0])?.value || "";
    const available = new Set(methods.map((method) => method.value));

    if (!available.has(selectedPaymentMethod.value)) {
      selectedPaymentMethod.value = first;
    }
  },
  { immediate: true },
);

watch(hasCustomerAttached, (attached) => {
  if (attached) return;
  if (!selectedPaymentMethodMeta.value?.requiresCustomer) return;

  const fallback =
    singlePaymentMethods.value.find((method) => method.isCash && !method.requiresCustomer) ??
    singlePaymentMethods.value.find((method) => !method.requiresCustomer) ??
    null;

  selectedPaymentMethod.value = fallback?.value || "";
});

watch(debtModalOpen, (next) => {
  if (!next) {
    resetDebtModalState();
  }
});
</script>

