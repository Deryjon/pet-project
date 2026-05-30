<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { nonNegative } from "~/composables/useCreateProductForm";
import { resolveFormMeasurementUnitLabel } from "@/composables/useMeasurementUnitLabel";
import { useProductStore } from "@/store/productStore";

type ReceiptTarget =
  | {
      kind: "simple";
      storeId: string;
      storeName: string;
      previousQty: number;
      nextQty: number;
    }
  | {
      kind: "variant";
      variationId: string;
      variationName: string;
      storeId: string;
      storeName: string;
      previousQty: number;
      nextQty: number;
    };

const store = useProductStore();
const route = useRoute();
const router = useRouter();
const toast = useToast();
const goodsType = computed(() => store.productTypes[0]);
const simpleVariantType = computed(() => store.productVariants[0]);
const variantType = computed(() => store.productVariants[1]);

const simpleDrafts = reactive<Record<string, number>>({});
const variationDrafts = reactive<Record<string, Record<string, number>>>({});

const receiptModalOpen = ref(false);
const pendingReceipt = ref<ReceiptTarget | null>(null);
const receiptQuantity = ref(1);
const receiptPurchasePrice = ref(0);
const receiptSupplier = ref("");

const isSimpleGoods = computed(
  () =>
    store.form.productType === goodsType.value &&
    store.form.variationType === simpleVariantType.value,
);
const isVariantGoods = computed(
  () =>
    store.form.productType === goodsType.value &&
    store.form.variationType === variantType.value,
);
const isEditMode = computed(() => route.query.mode === "edit" && Boolean(store.editingProductId));
const supplierOptions = computed(() => {
  const sourceSuppliers = Array.isArray(store.editingProductSource?.suppliers)
    ? store.editingProductSource.suppliers
        .map((supplier: any) => String(supplier?.name ?? supplier ?? "").trim())
        .filter(Boolean)
    : [];
  const currentSupplier = String(store.form.attributes.supplier ?? "").trim();
  return Array.from(new Set([...sourceSuppliers, currentSupplier].filter(Boolean)));
});
const receiptMeasurementUnitLabel = computed(() => resolveFormMeasurementUnitLabel(store.form));

const receiptPurchasePriceDisplay = computed({
  get: () => formatNumber(receiptPurchasePrice.value),
  set: (value: string) => {
    receiptPurchasePrice.value = parseNumber(value);
  },
});

watch(
  () => store.form.stocks,
  (stocks) => {
    for (const stock of stocks) {
      simpleDrafts[stock.id] = nonNegative(stock.qty);
    }
  },
  { immediate: true, deep: true },
);

watch(
  () => store.form.variations,
  (variations) => {
    for (const variation of variations) {
      const nextDrafts = variationDrafts[variation.id] ?? {};
      for (const stock of store.form.stocks) {
        nextDrafts[stock.id] = nonNegative(variation.stocks[stock.id] ?? 0);
      }
      variationDrafts[variation.id] = nextDrafts;
    }
  },
  { immediate: true, deep: true },
);

function formatNumber(value: number) {
  const normalized = Math.max(0, Math.floor(Number(value) || 0));
  return new Intl.NumberFormat("ru-RU").format(normalized);
}

function parseNumber(value: string | number) {
  if (typeof value === "number") {
    return Math.max(0, Math.floor(value));
  }

  const digits = String(value ?? "").replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

function updateSimpleDraft(storeId: string, value: number | string) {
  simpleDrafts[storeId] = nonNegative(Number(value) || 0);
}

function updateVariationDraft(variationId: string, storeId: string, value: number | string) {
  if (!variationDrafts[variationId]) {
    variationDrafts[variationId] = {};
  }

  variationDrafts[variationId][storeId] = nonNegative(Number(value) || 0);
}

function commitSimpleStock(storeId: string) {
  const stock = store.form.stocks.find((item) => item.id === storeId);
  if (!stock) return;

  const nextQty = nonNegative(simpleDrafts[storeId] ?? stock.qty);
  simpleDrafts[storeId] = nextQty;
  guardStockIncrease({
    kind: "simple",
    storeId,
    storeName: stock.name,
    previousQty: nonNegative(stock.qty),
    nextQty,
  });
}

function commitVariationStock(variationId: string, storeId: string) {
  const variation = store.form.variations.find((item) => item.id === variationId);
  const stock = store.form.stocks.find((item) => item.id === storeId);
  if (!variation || !stock) return;

  const nextQty = nonNegative(variationDrafts[variationId]?.[storeId] ?? variation.stocks[storeId] ?? 0);
  variationDrafts[variationId][storeId] = nextQty;
  guardStockIncrease({
    kind: "variant",
    variationId,
    variationName: variation.value || "Без названия",
    storeId,
    storeName: stock.name,
    previousQty: nonNegative(variation.stocks[storeId] ?? 0),
    nextQty,
  });
}

function guardStockIncrease(target: ReceiptTarget) {
  if (target.nextQty <= target.previousQty || !isEditMode.value) {
    applyReceiptTarget(target);
    return;
  }

  pendingReceipt.value = target;
  receiptQuantity.value = target.nextQty - target.previousQty;
  receiptPurchasePrice.value = getInitialReceiptPurchasePrice(target);
  receiptSupplier.value = String(store.form.attributes.supplier ?? "").trim();
  receiptModalOpen.value = true;
}

function getInitialReceiptPurchasePrice(target: ReceiptTarget) {
  if (target.kind === "variant") {
    const variation = store.form.variations.find((item) => item.id === target.variationId);
    return nonNegative(variation?.prices.purchasePrice ?? store.form.prices.purchasePrice);
  }

  return nonNegative(store.form.prices.purchasePrice);
}

function applyReceiptTarget(target: ReceiptTarget) {
  if (target.kind === "variant") {
    store.setVariationStock(target.variationId, target.storeId, target.nextQty);
    if (!variationDrafts[target.variationId]) {
      variationDrafts[target.variationId] = {};
    }
    variationDrafts[target.variationId][target.storeId] = target.nextQty;
    return;
  }

  store.setStoreQty(target.storeId, target.nextQty);
  simpleDrafts[target.storeId] = target.nextQty;
}

function cancelReceipt() {
  if (pendingReceipt.value?.kind === "variant") {
    const target = pendingReceipt.value;
    if (!variationDrafts[target.variationId]) {
      variationDrafts[target.variationId] = {};
    }
    variationDrafts[target.variationId][target.storeId] = target.previousQty;
  }

  if (pendingReceipt.value?.kind === "simple") {
    simpleDrafts[pendingReceipt.value.storeId] = pendingReceipt.value.previousQty;
  }

  pendingReceipt.value = null;
  receiptModalOpen.value = false;
}

function confirmReceipt() {
  const target = pendingReceipt.value;
  if (!target) return;

  const normalizedReceiptQty = Math.max(1, nonNegative(receiptQuantity.value));
  const expectedAddedQty = Math.max(1, target.nextQty - target.previousQty);
  const finalQty = target.previousQty + normalizedReceiptQty;

  if (normalizedReceiptQty !== expectedAddedQty) {
    target.nextQty = finalQty;
  }

  applyReceiptTarget(target);

  const normalizedSupplier = String(receiptSupplier.value ?? "").trim();
  if (normalizedSupplier) {
    store.form.attributes.supplier = normalizedSupplier;
  }

  if (target.kind === "variant") {
    const variation = store.form.variations.find((item) => item.id === target.variationId);
    if (variation) {
      variation.prices.purchasePrice = nonNegative(receiptPurchasePrice.value);
    }
  } else {
    store.form.prices.purchasePrice = nonNegative(receiptPurchasePrice.value);
  }

  receiptModalOpen.value = false;
  pendingReceipt.value = null;

  toast.add({
    title: "Поступление добавлено",
    description: `Количество для магазина "${target.storeName}" обновлено.`,
    color: "success",
  });
}

async function openSuppliersPage() {
  receiptModalOpen.value = false;
  await router.push("/products/suppliers");
}

function receiptTargetLabel() {
  if (!pendingReceipt.value) {
    return "";
  }

  if (pendingReceipt.value.kind === "variant") {
    return `${pendingReceipt.value.variationName} · ${pendingReceipt.value.storeName}`;
  }

  return pendingReceipt.value.storeName;
}
</script>

<template>
  <section>
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div>
        <h3 class="text-xl font-semibold">Остатки</h3>
        <p
          v-if="isEditMode"
          class="mt-2 text-sm text-[#9f9f9f]"
        >
          При увеличении количества откроется подтверждение поступления с ценой прихода и поставщиком.
        </p>
      </div>
    </div>

    <div v-if="isSimpleGoods" class="mt-8 overflow-x-auto rounded-lg">
      <table class="w-full min-w-[360px] overflow-hidden rounded-lg border-gray-300">
        <thead>
          <tr>
            <th class="p-3 text-left text-base">Магазин</th>
            <th class="p-3 text-left text-base">Кол-во</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in store.form.stocks" :key="s.id" class="border-t">
            <td class="p-3 text-[16px]">{{ s.name }}</td>
            <td class="p-3">
              <UInput
                :model-value="simpleDrafts[s.id] ?? s.qty"
                type="number"
                min="0"
                class="w-32"
                :ui="{ base: 'rounded-[15px] border-0 ring-0 bg-[#404040] p-4 text-[18px] font-semibold text-white placeholder:text-gray-400' }"
                @update:model-value="updateSimpleDraft(s.id, $event)"
                @blur="commitSimpleStock(s.id)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else-if="isVariantGoods" class="mt-8 overflow-x-auto rounded-lg">
      <table class="w-full min-w-[720px] overflow-hidden rounded-lg border-gray-300">
        <thead>
          <tr>
            <th class="p-3 text-left text-base">Вариация</th>
            <th v-for="s in store.form.stocks" :key="s.id" class="p-3 text-left text-base">{{ s.name }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="variation in store.form.variations" :key="variation.id" class="border-t">
            <td class="p-3 text-[16px]">{{ variation.value || "Без названия" }}</td>
            <td v-for="s in store.form.stocks" :key="`${variation.id}-${s.id}`" class="p-3">
              <UInput
                :model-value="variationDrafts[variation.id]?.[s.id] ?? variation.stocks[s.id] ?? 0"
                type="number"
                min="0"
                class="w-32"
                :ui="{ base: 'rounded-[15px] border-0 ring-0 bg-[#404040] p-4 text-[18px] font-semibold text-white placeholder:text-gray-400' }"
                @update:model-value="updateVariationDraft(variation.id, s.id, $event)"
                @blur="commitVariationStock(variation.id, s.id)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <UModal
      v-model:open="receiptModalOpen"
      :dismissible="false"
      :ui="{
        overlay: 'bg-black/50 backdrop-blur-sm',
        content: 'mx-4 max-w-[560px] rounded-[28px] border border-white/10 bg-[#262626] p-0 text-white shadow-2xl ring-0 sm:mx-0',
      }"
    >
      <template #content>
        <div class="p-6 sm:p-8">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h3 class="text-[24px] font-bold text-white">Добавить поступление?</h3>
              <p class="mt-3 text-[15px] leading-6 text-[#b3b3b3]">
                Введите цену прихода и поставщика для добавленных продуктов.
              </p>
              <p v-if="pendingReceipt" class="mt-2 text-sm text-[#8fc6ff]">
                {{ receiptTargetLabel() }}
              </p>
            </div>

            <UButton
              color="neutral"
              variant="ghost"
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#404040] p-0 text-white hover:bg-[#505050]"
              @click="cancelReceipt"
            >
              <Icon name="heroicons:x-mark" class="h-5 w-5" />
            </UButton>
          </div>

          <div class="mt-8 grid grid-cols-1 gap-5">
            <div>
              <label class="mb-2 block text-sm text-[#bdbdbd]">Кол-во</label>
              <div class="flex items-center gap-3">
                <UInput
                  v-model.number="receiptQuantity"
                  type="number"
                  min="1"
                  class="w-full"
                  :ui="{ base: 'rounded-[15px] border-0 ring-0 bg-[#363636] p-4 text-[18px] font-semibold text-white' }"
                />
                <span class="text-sm text-[#bdbdbd]">{{ receiptMeasurementUnitLabel }}</span>
              </div>
            </div>

            <div>
              <label class="mb-2 block text-sm text-[#bdbdbd]">Цена прихода *</label>
              <div class="flex items-center gap-3">
                <UInput
                  v-model="receiptPurchasePriceDisplay"
                  class="w-full"
                  :ui="{ base: 'rounded-[15px] border-0 ring-0 bg-[#363636] p-4 text-[18px] font-semibold text-white' }"
                />
                <span class="text-sm text-[#bdbdbd]">UZS</span>
              </div>
            </div>

            <div class="space-y-3">
              <label class="block text-sm text-[#bdbdbd]">Поставщик</label>
              <USelect
                v-if="supplierOptions.length"
                v-model="receiptSupplier"
                :items="supplierOptions"
                class="w-full"
                color="neutral"
                variant="outline"
                :ui="{
                  base: 'rounded-[15px] border-white/10 bg-[#363636] text-white',
                  content: 'rounded-[14px] border border-white/10 bg-[#2f2f2f] text-white',
                  item: 'text-white data-[highlighted]:bg-[#404040]',
                }"
              />
              <UInput
                v-else
                v-model="receiptSupplier"
                placeholder="Выберите поставщика"
                class="w-full"
                :ui="{ base: 'rounded-[15px] border-0 ring-0 bg-[#363636] p-4 text-[16px] text-white placeholder:text-[#8f8f8f]' }"
              />
              <UButton
                color="neutral"
                variant="ghost"
                class="justify-start px-0 text-[#8fc6ff] hover:text-white"
                @click="openSuppliersPage"
              >
                Открыть список поставщиков
              </UButton>
            </div>
          </div>

          <div class="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <UButton
              color="neutral"
              variant="soft"
              class="justify-center rounded-[16px] bg-[#3a3a3a] px-5 py-4 text-white hover:bg-[#454545]"
              @click="cancelReceipt"
            >
              Отмена
            </UButton>
            <UButton
              color="primary"
              variant="solid"
              class="justify-center rounded-[16px] bg-[#3b82f6] px-5 py-4 text-white hover:bg-[#2563eb]"
              @click="confirmReceipt"
            >
              Сохранить поступление
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </section>
</template>

