<template>
  <div class="flex flex-col bg-[#262626] text-[17px] font-bold shadow-style">
    <div class="flex items-center justify-between p-4">
      <span>Промежуточно</span>
      <span>{{ formatPrice(subtotal) }} UZS</span>
    </div>

    <div class="flex items-center justify-between p-4">
      <span>Скидки</span>
      <span>{{ formatPrice(totalDiscount) }} UZS</span>
    </div>

    <button
      class="flex w-full items-center justify-between rounded-[15px] px-5 py-6"
      :class="canPay ? 'bg-[#1f78ff]' : 'cursor-not-allowed bg-[#bdbdbd]'"
      :disabled="!canPay"
      @click="openPaymentPanel"
    >
      <span class="flex items-center gap-2 uppercase">
        <Icon v-if="cartStore.payLoading" name="heroicons:arrow-path" class="h-4 w-4 animate-spin" />
        Оплатить
      </span>
      <span>{{ formatPrice(payableAmount) }} UZS</span>
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
        content: 'w-full max-w-[980px] border-0 bg-[#1f1f1f] p-6 text-white shadow-2xl ring-0',
      }"
    >
      <template #content>
        <div class="flex h-full flex-col">
          <div class="mb-6 flex items-start justify-between gap-4">
            <div>
              <h3 class="text-[28px] font-semibold">Оплата продажи</h3>
              <p class="mt-1 text-sm text-[#a3a3a3]">
                Выберите способ оплаты и распределите сумму до полного закрытия.
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

              <div class="space-y-3">
                <div class="rounded-[18px] bg-[#1f78ff] px-4 py-4">
                  <div class="text-xs font-semibold uppercase tracking-[0.12em] text-white/70">
                    Общая сумма
                  </div>
                  <div class="mt-2 text-[28px] font-bold leading-none">
                    {{ formatPrice(payableAmount) }} UZS
                  </div>
                </div>

                <div class="rounded-[18px] bg-[#303030] px-4 py-4">
                  <div class="text-xs font-semibold uppercase tracking-[0.12em] text-[#8f8f8f]">
                    Остаток
                  </div>
                  <div
                    class="mt-2 text-[24px] font-bold leading-none"
                    :class="remainingAmount === 0 ? 'text-[#78b3ff]' : 'text-white'"
                  >
                    {{ formatPrice(Math.max(0, remainingAmount)) }} UZS
                  </div>
                </div>
              </div>

              <div
                v-if="paymentMode === 'mixed' && selectedMixedPayments.length > 0"
                class="mt-5 rounded-[18px] border border-white/8 bg-[#242424] p-4"
              >
                <div class="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#8f8f8f]">
                  Введённые суммы
                </div>

                <div class="space-y-2">
                  <div
                    v-for="entry in selectedMixedPayments"
                    :key="entry.value"
                    class="flex items-center justify-between text-[14px]"
                  >
                    <span class="text-[#bdbdbd]">{{ entry.label }}</span>
                    <span>{{ formatPrice(mixedPayments[entry.value] || 0) }} UZS</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="rounded-[26px] border border-white/8 bg-[#262626] p-5">
              <div class="mb-5 flex flex-wrap gap-3">
                <button
                  v-for="mode in paymentModes"
                  :key="mode.value"
                  type="button"
                  class="rounded-[18px] px-4 py-3 text-[15px] font-semibold transition"
                  :class="
                    paymentMode === mode.value
                      ? 'bg-[#1f78ff] text-white'
                      : 'bg-[#303030] text-[#bdbdbd] hover:bg-[#383838] hover:text-white'
                  "
                  @click="setPaymentMode(mode.value)"
                >
                  {{ mode.label }}
                </button>
              </div>

              <template v-if="paymentMode === 'single'">
                <div class="mb-4">
                  <h4 class="text-[20px] font-semibold">Способ оплаты</h4>
                  <p class="mt-1 text-sm text-[#8f8f8f]">
                    Выберите один вариант для полной оплаты.
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

                <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
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
              </template>

              <template v-else>
                <div class="mb-4">
                  <h4 class="text-[20px] font-semibold">Смешанная оплата</h4>
                  <p class="mt-1 text-sm text-[#8f8f8f]">
                    Сначала выберите способ оплаты, затем введите сумму. Добавляйте способы,
                    пока остаток не станет нулём.
                  </p>
                </div>

                <div
                  v-if="paymentMethodsLoading"
                  class="mb-4 rounded-[18px] border border-white/8 bg-[#303030] px-4 py-3 text-sm text-[#bdbdbd]"
                >
                  Загружаем способы оплаты...
                </div>

                <div
                  v-else-if="mixedAvailableMethods.length === 0"
                  class="mb-4 rounded-[18px] border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
                >
                  Для компании не настроены способы оплаты.
                </div>

                <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <button
                    v-for="method in mixedAvailableMethods"
                    :key="method.value"
                    type="button"
                    class="flex items-center justify-between rounded-[20px] border px-4 py-4 text-left transition"
                    :class="
                      activeMixedMethod === method.value
                        ? 'border-[#1f78ff] bg-[#1f78ff]/12 text-white'
                        : 'border-white/8 bg-[#303030] text-white hover:border-white/15 hover:bg-[#353535]'
                    "
                    @click="activeMixedMethod = method.value"
                  >
                    <div class="flex items-center gap-3">
                      <div
                        class="flex h-11 w-11 items-center justify-center rounded-[16px]"
                        :class="
                          activeMixedMethod === method.value
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
                      v-if="activeMixedMethod === method.value"
                      name="heroicons:check-20-solid"
                      class="h-5 w-5 text-[#78b3ff]"
                    />
                  </button>
                </div>

                <div
                  v-if="activeMixedMethod"
                  class="mt-5 rounded-[20px] border border-white/8 bg-[#303030] p-4"
                >
                  <div class="mb-3 flex items-center justify-between">
                    <div>
                      <div class="text-[15px] font-semibold">
                        {{ activeMethodLabel }}
                      </div>
                      <div class="mt-1 text-[12px] uppercase tracking-[0.08em] text-[#8f8f8f]">
                        Введите сумму для выбранного способа
                      </div>
                    </div>

                    <UButton
                      color="neutral"
                      variant="soft"
                      class="rounded-[14px] bg-[#404040] px-3 py-2 text-white hover:bg-[#505050]"
                      @click="fillRemainingForActiveMethod"
                    >
                      Остаток
                    </UButton>
                  </div>

                  <UInput
                    :model-value="formatMoneyForInput(mixedPayments[activeMixedMethod] || 0)"
                    type="text"
                    inputmode="numeric"
                    color="neutral"
                    variant="none"
                    class="w-full"
                    :ui="{
                      root: 'w-full',
                      base: 'h-12 rounded-[16px] border border-[#404040] bg-[#1f1f1f] px-4 text-white placeholder:text-[#8f8f8f] focus:outline-none focus:ring-0',
                    }"
                    @update:model-value="(value) => updateMixedPayment(activeMixedMethod, value)"
                  />
                </div>
              </template>
            </div>
          </div>

          <div class="mt-6 flex gap-3">
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
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useCartStore } from "@/store/cart";
import { useFormatPrice } from "@/composables/useFormatPrice";

type PaymentMethodValue = "cash" | "card" | "payme" | "click" | "transfer";

const cartStore = useCartStore();
const { subtotal, totalDiscount, total, cart, paymentMethods, paymentMethodsLoading } = storeToRefs(cartStore);
const { formatPrice } = useFormatPrice();

const paymentPanelOpen = ref(false);
const paymentMode = ref<"mixed" | "single">("mixed");
const selectedPaymentMethod = ref<string>("");
const activeMixedMethod = ref<string>("");
const mixedPayments = ref<Record<string, number>>({});

const paymentModes = [
  { value: "mixed", label: "Смешанная" },
  { value: "single", label: "Один способ" },
] as const;

const paymentMethodCatalog = [
  { value: "cash", label: "Наличные", hint: "Cash", icon: "heroicons:banknotes" },
  { value: "card", label: "Карта", hint: "Card", icon: "heroicons:credit-card" },
  { value: "payme", label: "Payme", hint: "QR / App", icon: "heroicons:device-phone-mobile" },
  { value: "click", label: "Click", hint: "Online", icon: "heroicons:bolt" },
  { value: "transfer", label: "Перевод", hint: "Bank", icon: "heroicons:building-library" },
] as const;

const availablePaymentMethodValues = computed(() => {
  const available = new Set<PaymentMethodValue>();

  for (const item of paymentMethods.value) {
    const id = String(item.id || "").trim().toLowerCase();
    const name = String(item.name || "").trim().toLowerCase();
    const paymentTypeName = String(item.paymentTypeName || "").trim().toLowerCase();

    for (const method of paymentMethodCatalog) {
      if (
        id === method.value ||
        name === method.value ||
        paymentTypeName === method.value
      ) {
        available.add(method.value as PaymentMethodValue);
      }
    }

    if (item.isCash) {
      available.add("cash");
    }
  }

  return Array.from(available);
});

const singlePaymentMethods = computed(() =>
  paymentMethodCatalog.filter((method) => availablePaymentMethodValues.value.includes(method.value)),
);

const payableAmount = computed(() => Number(cartStore.payableTotal || total.value || 0));
const canPay = computed(() => payableAmount.value > 0 && !cartStore.payLoading);
const totalQuantity = computed(() =>
  cart.value.reduce((sum, item) => sum + Math.max(1, Number(item.quantity || 1)), 0),
);
const mixedTotal = computed(() =>
  Object.values(mixedPayments.value).reduce((sum, value) => sum + Number(value || 0), 0),
);
const remainingAmount = computed(() => Math.max(0, payableAmount.value - mixedTotal.value));
const selectedMixedPayments = computed(() =>
  singlePaymentMethods.value.filter((item) => Number(mixedPayments.value[item.value] || 0) > 0),
);
const mixedAvailableMethods = computed(() => singlePaymentMethods.value);
const activeMethodLabel = computed(
  () => singlePaymentMethods.value.find((item) => item.value === activeMixedMethod.value)?.label || "",
);
const paymentModeLabel = computed(() =>
  paymentMode.value === "mixed"
    ? "Смешанная оплата"
    : singlePaymentMethods.value.find((item) => item.value === selectedPaymentMethod.value)?.label || "Не выбрано",
);
const canConfirmPayment = computed(() => {
  if (!canPay.value || paymentMethodsLoading.value || singlePaymentMethods.value.length === 0) {
    return false;
  }

  if (paymentMode.value === "single") {
    return Boolean(selectedPaymentMethod.value);
  }

  return remainingAmount.value === 0 && mixedTotal.value > 0;
});

function openPaymentPanel() {
  if (!canPay.value) return;
  paymentPanelOpen.value = true;
}

function closePaymentPanel() {
  paymentPanelOpen.value = false;
}

function setPaymentMode(mode: "mixed" | "single") {
  paymentMode.value = mode;

  if (mode === "single") {
    resetMixedPayments();
    activeMixedMethod.value = "";
    return;
  }

  selectedPaymentMethod.value = "";
  if (!activeMixedMethod.value && mixedAvailableMethods.value.length > 0) {
    activeMixedMethod.value = mixedAvailableMethods.value[0].value;
  }
}

async function confirmPay() {
  if (!canConfirmPayment.value) return;

  const payments = paymentMode.value === "single" ? buildSinglePayment() : buildMixedPayments();
  if (!payments.length) return;

  const result = await cartStore.paySale({
    comment: "",
    payments,
    with_cashback: 0,
    without_cashback: false,
  });

  if (!result) return;

  closePaymentPanel();
  selectedPaymentMethod.value = "";
  resetMixedPayments();
}

async function onCancel() {
  await cartStore.cancelSale();
}

function updateMixedPayment(method: string, value: string | number) {
  const numeric = Number(String(value ?? "").replace(/[^\d]/g, ""));
  const sanitized = Number.isFinite(numeric) ? numeric : 0;
  mixedPayments.value[method] = Math.min(payableAmount.value, sanitized);
}

function fillRemainingForActiveMethod() {
  if (!activeMixedMethod.value) return;

  const usedWithoutActive = Object.entries(mixedPayments.value).reduce((sum, [key, value]) => {
    if (key === activeMixedMethod.value) return sum;
    return sum + Number(value || 0);
  }, 0);

  mixedPayments.value[activeMixedMethod.value] = Math.max(0, payableAmount.value - usedWithoutActive);
}

function formatMoneyForInput(value: number) {
  return value > 0 ? formatPrice(value) : "";
}

function resetMixedPayments() {
  mixedPayments.value = Object.fromEntries(
    paymentMethodCatalog.map((method) => [method.value, 0]),
  );
}

function buildSinglePayment() {
  const method = selectedPaymentMethod.value as PaymentMethodValue;
  if (!method) return [];

  const companyPaymentTypeId = cartStore.paymentTypeIdByMethod(method);
  if (!companyPaymentTypeId) return [];

  return [
    {
      company_payment_type_id: companyPaymentTypeId,
      paid_amount: payableAmount.value,
      returned_amount: 0,
      skip_ofd: false,
    },
  ];
}

function buildMixedPayments(): Array<{
  company_payment_type_id: string;
  paid_amount: number;
  returned_amount: number;
  skip_ofd: boolean;
}> {
  return selectedMixedPayments.value
    .map((entry) => {
      const companyPaymentTypeId = cartStore.paymentTypeIdByMethod(entry.value as PaymentMethodValue);
      const paidAmount = Number(mixedPayments.value[entry.value] || 0);

      if (!companyPaymentTypeId || paidAmount <= 0) return null;

      return {
        company_payment_type_id: companyPaymentTypeId,
        paid_amount: paidAmount,
        returned_amount: 0,
        skip_ofd: false,
      };
    })
    .filter((payment): payment is {
      company_payment_type_id: string;
      paid_amount: number;
      returned_amount: number;
      skip_ofd: boolean;
    } => payment !== null);
}

watch(singlePaymentMethods, (methods) => {
  const first = methods[0]?.value || "";
  const available = new Set(methods.map((method) => method.value));

  if (!available.has(selectedPaymentMethod.value)) {
    selectedPaymentMethod.value = first;
  }

  if (!available.has(activeMixedMethod.value)) {
    activeMixedMethod.value = first;
  }

  mixedPayments.value = Object.fromEntries(
    methods.map((method) => [method.value, Number(mixedPayments.value[method.value] || 0)]),
  );
}, { immediate: true });

onMounted(() => {
  resetMixedPayments();
});
</script>
