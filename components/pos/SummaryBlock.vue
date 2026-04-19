<template>
  <div class="flex flex-col bg-[#262626] text-[15px] font-bold shadow-style sm:text-[17px]">
    <div class="flex items-center justify-between p-4">
      <span>Промежуточно</span>
      <span>{{ formatPrice(subtotal) }} UZS</span>
    </div>

    <div class="flex items-center justify-between p-4">
      <span>Скидки</span>
      <span>{{ formatPrice(totalDiscount) }} UZS</span>
    </div>

    <button
      class="flex w-full items-center justify-between rounded-[15px] px-4 py-5 sm:px-5 sm:py-6"
      :class="canPay ? 'bg-[#1f78ff]' : 'cursor-not-allowed bg-[#bdbdbd]'"
      :disabled="!canPay"
      @click="openPaymentPanel"
    >
      <span class="flex items-center gap-2 text-[13px] uppercase sm:text-base">
        <Icon v-if="cartStore.payLoading" name="heroicons:arrow-path" class="h-4 w-4 animate-spin" />
        Оплатить
      </span>
      <span class="text-right text-[15px] sm:text-[17px]">{{ formatPrice(payableAmount) }} UZS</span>
    </button>

    <button
      class="flex w-full items-center justify-center p-5 text-gray-300"
      :class="cartStore.cancelLoading ? 'cursor-not-allowed opacity-60' : ''"
      :disabled="cartStore.cancelLoading"
      @click="onCancel"
    >
      <Icon
        v-if="cartStore.cancelLoading"
        name="heroicons:arrow-path"
        class="mr-2 h-4 w-4 animate-spin"
      />
      Отмена продажи
    </button>

    <USlideover
      v-model:open="paymentPanelOpen"
      side="right"
      :close="false"
      :ui="{
        overlay: 'bg-black/50 backdrop-blur-sm',
        content: 'w-full max-w-[980px] border-0 bg-[#1f1f1f] p-4 text-white shadow-2xl ring-0 sm:p-6',
      }"
    >
      <template #content>
        <div class="flex h-full flex-col">
          <div class="mb-6 flex items-start justify-between gap-4">
            <div>
              <h3 class="text-[22px] font-semibold sm:text-[28px]">Оплата продажи</h3>
              <p class="mt-1 text-sm text-[#a3a3a3]">
                Выберите способ оплаты для полного закрытия суммы.
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
                <span class="text-sm font-semibold uppercase tracking-[0.12em] text-[#8f8f8f]">
                  Чек
                </span>
                <span class="rounded-full bg-[#1f78ff]/15 px-3 py-1 text-xs font-semibold uppercase text-[#78b3ff]">
                  {{ paymentModeLabel }}
                </span>
              </div>

              <div class="space-y-3">
                <div class="flex items-center justify-between text-[14px] text-[#bdbdbd]">
                  <span>Товаров</span>
                  <span>{{ totalQuantity }} шт</span>
                </div>
                <div class="flex items-center justify-between text-[14px] text-[#bdbdbd]">
                  <span>Промежуточно</span>
                  <span>{{ formatPrice(subtotal) }} UZS</span>
                </div>
                <div class="flex items-center justify-between text-[14px] text-[#bdbdbd]">
                  <span>Скидка</span>
                  <span>{{ formatPrice(totalDiscount) }} UZS</span>
                </div>
              </div>

              <div class="my-5 h-px bg-white/10" />

              <div class="rounded-[18px] bg-[#1f78ff] px-4 py-4">
                <div class="text-xs font-semibold uppercase tracking-[0.12em] text-white/70">
                  Общая сумма
                </div>
                <div class="mt-2 text-[28px] font-bold leading-none">
                  {{ formatPrice(payableAmount) }} UZS
                </div>
              </div>
            </div>

            <div class="rounded-[26px] border border-white/8 bg-[#262626] p-5">
              <div class="mb-4">
                <h4 class="text-[20px] font-semibold">Способ оплаты</h4>
                <p class="mt-1 text-sm text-[#8f8f8f]">
                  Всегда используется один способ оплаты.
                </p>
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
                  class="flex items-center justify-between rounded-[20px] border px-4 py-4 text-left transition"
                  :class="
                    selectedPaymentMethod === method.value
                      ? 'border-[#1f78ff] bg-[#1f78ff]/12 text-white'
                      : 'border-white/8 bg-[#303030] text-white hover:border-white/15 hover:bg-[#353535]'
                  "
                  @click="selectedPaymentMethod = method.value"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="flex h-11 w-11 items-center justify-center rounded-[16px]"
                      :class="
                        selectedPaymentMethod === method.value
                          ? 'bg-[#1f78ff] text-white'
                          : 'bg-[#404040] text-[#bdbdbd]'
                      "
                    >
                      <Icon :name="method.icon" class="h-5 w-5" />
                    </div>
                    <div class="flex flex-col">
                      <span class="text-[16px] font-semibold">{{ method.label }}</span>
                      <span class="text-[12px] uppercase tracking-[0.08em] text-[#8f8f8f]">
                        {{ method.hint }}
                      </span>
                    </div>
                  </div>

                  <Icon
                    v-if="selectedPaymentMethod === method.value"
                    name="heroicons:check-20-solid"
                    class="h-5 w-5 text-[#78b3ff]"
                  />
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
              block
              color="primary"
              class="justify-center rounded-[18px] py-4 font-semibold disabled:cursor-not-allowed"
              :disabled="!canConfirmPayment || cartStore.payLoading"
              @click="confirmPay"
            >
              <Icon v-if="cartStore.payLoading" name="heroicons:arrow-path" class="h-4 w-4 animate-spin" />
              Оплатить
            </UButton>
          </div>
        </div>
      </template>
    </USlideover>

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
              <p class="mt-1 text-sm text-[#bdbdbd]">
                Проверьте чек перед печатью или закройте окно.
              </p>
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
            <div v-if="printStore.settings.showCompanyName" class="text-center font-bold">
              {{ printStore.settings.companyName }}
            </div>
            <div
              v-if="printStore.settings.showShopName && (printStore.settings.shopName || printStore.settings.address)"
              class="text-center text-[#555]"
            >
              {{ printStore.settings.shopName || printStore.settings.address }}
            </div>
            <div v-if="printStore.settings.phone" class="text-center text-[#555]">
              {{ printStore.settings.phone }}
            </div>
            <div class="my-2 border-t border-dashed border-black"></div>
            <div>Чек: {{ printStore.latestReceipt.saleNumber || printStore.latestReceipt.saleId || "-" }}</div>
            <div>Дата: {{ new Date(printStore.latestReceipt.paidAt).toLocaleString("ru-RU") }}</div>
            <div v-if="printStore.settings.showPaymentMethod">
              Оплата: {{ printStore.latestReceipt.paymentMethodName }}
            </div>
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
            <template v-if="printStore.settings.showFooter && printStore.settings.footerText">
              <div class="my-2 border-t border-dashed border-black"></div>
              <div class="text-center">{{ printStore.settings.footerText }}</div>
            </template>
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
            <UButton
              block
              color="primary"
              class="justify-center rounded-[16px] py-3 font-semibold"
              @click="printStore.printReceipt()"
            >
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
import { useCartStore } from "@/store/cart";
import { usePrintSettingsStore, type SaleReceiptSnapshot } from "@/store/printSettings";
import { useFormatPrice } from "@/composables/useFormatPrice";

const cartStore = useCartStore();
const printStore = usePrintSettingsStore();
const { subtotal, totalDiscount, total, cart, paymentMethods, paymentMethodsLoading } = storeToRefs(cartStore);
const { formatPrice } = useFormatPrice();
const toast = useToast();

const paymentPanelOpen = ref(false);
const selectedPaymentMethod = ref<string>("");

function paymentMethodIcon(method: { isCash?: boolean }) {
  return method.isCash ? "heroicons:banknotes" : "heroicons:credit-card";
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
    })),
);

const payableAmount = computed(() => Number(cartStore.payableTotal || total.value || 0));
const canPay = computed(() => payableAmount.value > 0 && !cartStore.payLoading && !paymentMethodsLoading.value);
const totalQuantity = computed(() =>
  cart.value.reduce((sum, item) => sum + Math.max(1, Number(item.quantity || 1)), 0),
);
const paymentModeLabel = computed(
  () => singlePaymentMethods.value.find((item) => item.value === selectedPaymentMethod.value)?.label || "Не выбрано",
);
const canConfirmPayment = computed(() => {
  if (!canPay.value || paymentMethodsLoading.value || singlePaymentMethods.value.length === 0) {
    return false;
  }

  return Boolean(selectedPaymentMethod.value);
});

async function openPaymentPanel() {
  if (!canPay.value) return;
  await cartStore.loadPaymentMethods();
  paymentPanelOpen.value = true;
}

function closePaymentPanel() {
  paymentPanelOpen.value = false;
}

async function confirmPay() {
  if (!canConfirmPayment.value) return;

  const companyPaymentTypeId = String(selectedPaymentMethod.value || "").trim();
  if (!companyPaymentTypeId) return;
  const selectedMethod = singlePaymentMethods.value.find((method) => method.value === companyPaymentTypeId);
  const receiptSnapshot: SaleReceiptSnapshot = {
    saleId: cartStore.saleId,
    saleNumber: cartStore.saleNumber,
    paidAt: new Date().toISOString(),
    paymentMethodName: selectedMethod?.label || "Не указано",
    subtotal: subtotal.value,
    discount: totalDiscount.value,
    total: payableAmount.value,
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

  const result = await cartStore.paySale({
    payment_method: companyPaymentTypeId,
  });

  if (!result) {
    toast.add({
      title: "Не удалось провести оплату",
      description: cartStore.lastCartError || undefined,
      color: "error",
    });
    return;
  }

  printStore.setLatestReceipt({
    ...receiptSnapshot,
    receiptResponse: result,
  });
  closePaymentPanel();
  toast.add({
    title: "Оплата проведена",
    color: "success",
  });
}

async function onCancel() {
  await cartStore.cancelSale();
}

watch(singlePaymentMethods, (methods) => {
  const defaultPaymentType = methods.find((method) => method.isCash) ?? methods[0];
  const first = defaultPaymentType?.value || "";
  const available = new Set(methods.map((method) => method.value));

  if (!available.has(selectedPaymentMethod.value)) {
    selectedPaymentMethod.value = first;
  }
}, { immediate: true });
</script>
