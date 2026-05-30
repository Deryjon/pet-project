<template>
  <div class="mb-3 rounded-[24px] bg-[#3a3a3a] px-4 py-5 text-[16px] text-white">
    <div class="flex min-w-0 flex-wrap items-start gap-3 sm:flex-nowrap">
      <div class="order-4 flex w-full items-center justify-center gap-1 rounded-[18px] border border-white/50 bg-[#232323] px-1 py-1.5 sm:order-none sm:w-auto sm:justify-start">
        <UInput
          v-model="draftQuantity"
          type="number"
          min="1"
          variant="none"
          :disabled="itemBusy"
          class="w-12"
          :ui="{
            root: 'w-12',
            base: 'h-auto min-h-0 border-0 bg-transparent px-0 py-0 text-center text-[15px] font-semibold text-white shadow-none ring-0 focus:ring-0 focus:outline-none focus:border-0 disabled:cursor-not-allowed disabled:opacity-60',
          }"
          @update:model-value="onDraftQuantityChange"
          @focus="startQuantityEditing"
          @blur="finishQuantityEditing"
          @keydown.enter.prevent="commitDraftQuantity"
        />
        <span class="text-sm font-semibold text-[#9f9f9f]">{{ measurementUnitLabel }}</span>

        <div class="flex flex-col">
          <button
            type="button"
            :disabled="itemBusy"
            class="flex h-4 cursor-pointer items-center justify-center text-[#9f9f9f] transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            @click="increaseQuantity"
          >
            <Icon name="heroicons:chevron-up-20-solid" class="h-4 w-4" />
          </button>
          <button
            type="button"
            :disabled="itemBusy"
            class="flex h-4 cursor-pointer items-center justify-center text-[#9f9f9f] transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            @click="decreaseQuantity"
          >
            <Icon name="heroicons:chevron-down-20-solid" class="h-4 w-4" />
          </button>
        </div>
      </div>

      <div class="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-[18px] sm:h-[50px] sm:w-[50px]">
        <img
          src="../../assets/images/placeholder_img.svg"
          alt="Товар"
          class="h-full w-full rounded-[12px] object-cover"
        />
      </div>

      <div class="min-w-0 flex-1">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <div class="break-words text-[15px] font-bold uppercase tracking-[0.08em] text-white sm:text-[16px]">
              {{ item.name }}
            </div>

            <div class="mt-2 flex items-start justify-between gap-3 sm:hidden">
              <div class="flex min-w-0 flex-col gap-1">
                <span
                  v-if="hasDiscount"
                  class="text-[11px] font-medium text-[#7f7f7f] line-through"
                >
                  {{ formatPrice(originalLineTotal) }} UZS
                </span>
                <span class="text-[16px] font-bold text-[#4993dd]">
                  {{ formatPrice(discountedLineTotal) }} UZS
                </span>
              </div>

              <button
                type="button"
                :disabled="itemBusy"
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] border border-white/10 bg-[#303030] text-[#bdbdbd] transition hover:bg-[#3a3a3a] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                @click="openEditor"
              >
                <Icon name="heroicons:pencil-square" class="h-4 w-4" />
              </button>
            </div>

            <div class="mt-2 flex flex-wrap items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#8f8f8f] sm:mt-1 sm:text-[14px]">
              <span class="break-all">{{ item.barcode }}</span>
              <span v-if="item.barcode && item.article" class="text-[#5f5f5f]">/</span>
              <span class="break-all">{{ item.article }}</span>
            </div>
          </div>

          <div class="flex flex-col">
            <div class="hidden shrink-0 sm:flex sm:min-w-0 sm:items-start sm:justify-end sm:gap-2">
              <div class="sm:flex sm:min-w-0 sm:flex-col sm:items-end">
                <span
                  v-if="hasDiscount"
                  class="px-2 text-[11px] font-medium text-[#7f7f7f] line-through sm:text-[12px]"
                >
                  {{ formatPrice(originalLineTotal) }} UZS
                </span>
                <span class="px-2 py-0.5 text-[16px] font-bold text-[#4993dd] sm:text-[17px]">
                  {{ formatPrice(discountedLineTotal) }} UZS
                </span>
              </div>
            </div>
            <div v-if="sellerDisplayName" class="name-seller mt-1 hidden justify-end px-2 sm:flex">
              <p class="text-[11px] font-medium uppercase tracking-[0.08em] text-[#8f8f8f] sm:text-[12px]">
                {{ sellerDisplayName }}
              </p>
            </div>
          </div>
        </div>
        <div v-if="sellerDisplayName" class="name-seller mt-2 sm:hidden">
          <p class="text-[11px] font-medium uppercase tracking-[0.08em] text-[#8f8f8f]">
            {{ sellerDisplayName }}
          </p>
        </div>
      </div>
      <UButton
        color="error"
        variant="ghost"
        :disabled="itemBusy"
        class="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center self-start rounded-[14px] border border-red-400/20 bg-red-500/5 p-0 text-red-400 transition hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
        @click="$emit('remove')"
      >
        <Icon name="ic:baseline-delete" class="h-4 w-4" />
      </UButton>
    </div>
  </div>

  <AppSlideover
    :open="editorOpen"
    @update:open="editorOpen = $event"
    maxWidthClass="max-w-[520px]"
    panelClass="bg-[#1f1f1f] p-5 text-white sm:p-6"
    overlayClass="bg-black/50 backdrop-blur-sm"
  >
    <div class="flex min-h-full flex-col">
      <div class="mb-6 flex items-start justify-between gap-4">
        <div class="min-w-0">
          <h3 class="text-[22px] font-semibold">Редактировать товар</h3>
          <p class="mt-1 text-sm text-[#9f9f9f]">
            Измените количество и скидку для текущей позиции.
          </p>
        </div>

        <UButton
          color="neutral"
          variant="ghost"
          class="rounded-full text-[#bdbdbd] hover:bg-white/5 hover:text-white"
          @click="editorOpen = false"
        >
          <Icon name="mingcute:close-fill" class="h-5 w-5" />
        </UButton>
      </div>

      <div class="rounded-[22px] border border-white/8 bg-[#262626] p-4">
        <div class="text-[18px] font-semibold text-white">{{ item.name }}</div>
        <div class="mt-2 flex flex-wrap items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#8f8f8f]">
          <span class="break-all">{{ item.barcode }}</span>
          <span v-if="item.barcode && item.article" class="text-[#5f5f5f]">/</span>
          <span class="break-all">{{ item.article }}</span>
        </div>

        <div class="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div class="rounded-[18px] bg-[#303030] px-4 py-3">
            <div class="text-xs uppercase tracking-[0.12em] text-[#8f8f8f]">Базовая цена</div>
            <div class="mt-2 text-[18px] font-bold text-white">{{ formatPrice(baseUnitPrice) }} UZS</div>
          </div>

          <div class="rounded-[18px] bg-[#303030] px-4 py-3">
            <div class="text-xs uppercase tracking-[0.12em] text-[#8f8f8f]">Цена продажи</div>
            <div class="mt-2 text-[18px] font-bold text-white">{{ formatPrice(normalizedEditorSalePrice) }} UZS</div>
          </div>
        </div>

        <div class="mt-3 rounded-[18px] bg-[#303030] px-4 py-3">
          <div class="text-xs uppercase tracking-[0.12em] text-[#8f8f8f]">Доступно</div>
          <div class="mt-2 text-[18px] font-bold text-white">{{ formatAvailableQuantity }}</div>
        </div>

        <div class="mt-5 rounded-[18px] bg-[#303030] p-4">
          <div class="mb-3 text-xs uppercase tracking-[0.12em] text-[#8f8f8f]">Количество</div>
          <div class="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              :disabled="itemBusy || editorQuantity <= 1"
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-[#404040] text-white transition hover:bg-[#4a4a4a] disabled:cursor-not-allowed disabled:opacity-50 sm:h-12 sm:w-12"
              @click="editorQuantity = Math.max(1, editorQuantity - 1)"
            >
              <Icon name="heroicons:minus-20-solid" class="h-5 w-5" />
            </button>

            <div class="flex min-w-0 flex-1 items-center rounded-[18px] border border-white/10 bg-[#262626] px-3 py-3 sm:px-4">
              <input
                v-model.number="editorQuantity"
                type="number"
                min="1"
                :max="maxAvailableQuantity"
                :disabled="itemBusy"
                class="w-full bg-transparent text-center text-[20px] font-bold outline-none disabled:cursor-not-allowed disabled:opacity-60 sm:text-[22px]"
              />
              <span class="ml-2 shrink-0 text-sm font-semibold text-[#9f9f9f] sm:ml-3">
                {{ measurementUnitLabel }}
              </span>
            </div>

            <button
              type="button"
              :disabled="itemBusy || editorQuantity >= maxAvailableQuantity"
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-[#1f78ff] text-white transition hover:bg-[#4993dd] disabled:cursor-not-allowed disabled:opacity-50 sm:h-12 sm:w-12"
              @click="editorQuantity = Math.min(maxAvailableQuantity, editorQuantity + 1)"
            >
              <Icon name="heroicons:plus-20-solid" class="h-5 w-5" />
            </button>
          </div>
        </div>

        <div class="mt-5 rounded-[18px] bg-[#303030] p-4">
          <div class="mb-3 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="text-xs uppercase tracking-[0.12em] text-[#8f8f8f]">Скидка на позицию</div>
            <div class="flex rounded-[12px] bg-[#262626] p-1">
              <button
                type="button"
                class="rounded-[10px] px-3 py-1.5 text-xs font-semibold uppercase transition"
                :class="editorDiscountType === '%' ? 'bg-[#1f78ff] text-white' : 'text-[#bdbdbd] hover:bg-white/5 hover:text-white'"
                @click="editorDiscountType = '%'"
              >
                %
              </button>
              <button
                type="button"
                class="rounded-[10px] px-3 py-1.5 text-xs font-semibold uppercase transition"
                :class="editorDiscountType === 'uzs' ? 'bg-[#1f78ff] text-white' : 'text-[#bdbdbd] hover:bg-white/5 hover:text-white'"
                @click="editorDiscountType = 'uzs'"
              >
                uzs
              </button>
            </div>
          </div>

          <div class="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <input
              v-model.number="editorDiscountValue"
              type="number"
              min="0"
              :disabled="itemBusy"
              class="w-full rounded-[16px] border border-white/10 bg-[#262626] px-4 py-3 text-[18px] font-semibold text-white outline-none disabled:cursor-not-allowed disabled:opacity-60"
            />
            <button
              type="button"
              :disabled="itemBusy"
              class="shrink-0 rounded-[16px] bg-[#404040] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#4a4a4a] disabled:cursor-not-allowed disabled:opacity-50"
              @click="resetEditorDiscount"
            >
              Сбросить
            </button>
          </div>

          <div class="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div class="rounded-[16px] bg-[#262626] px-4 py-3">
              <div class="text-xs uppercase tracking-[0.12em] text-[#8f8f8f]">Размер скидки</div>
              <div class="mt-2 font-semibold text-white">{{ editorDiscountSummary }}</div>
            </div>
            <div class="rounded-[16px] bg-[#262626] px-4 py-3">
              <div class="text-xs uppercase tracking-[0.12em] text-[#8f8f8f]">Цена после скидки</div>
              <div class="mt-2 font-semibold text-[#4993dd]">{{ formatPrice(normalizedEditorSalePrice) }} UZS</div>
            </div>
          </div>
        </div>

        <div class="mt-5 rounded-[18px] bg-[#303030] px-4 py-4">
          <div class="text-xs uppercase tracking-[0.12em] text-[#8f8f8f]">Итого</div>
          <div class="mt-2 text-[24px] font-bold text-[#4993dd]">{{ formatPrice(editorLineTotal) }} UZS</div>
        </div>
      </div>

      <div class="mt-6 flex flex-col gap-3 sm:flex-row">
        <UButton
          block
          color="error"
          variant="soft"
          :disabled="itemBusy"
          class="justify-center rounded-[18px] py-4 font-semibold"
          @click="removeFromEditor"
        >
          Удалить товар
        </UButton>

        <UButton
          block
          color="primary"
          :disabled="itemBusy || !canSaveEditor"
          class="justify-center rounded-[18px] py-4 font-semibold"
          @click="saveEditor"
        >
          Сохранить
        </UButton>
      </div>
    </div>
  </AppSlideover>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useCartStore } from "@/store/cart";
import { useFormatPrice } from "@/composables/useFormatPrice";
import { resolveMeasurementUnitLabel } from "@/composables/useMeasurementUnitLabel";

const props = defineProps<{ item: any }>();
defineEmits<{
  remove: [];
}>();

const store = useCartStore();
const { formatPrice } = useFormatPrice();
const editorOpen = ref(false);
const editorQuantity = ref(1);
const editorDiscountType = ref<"%" | "uzs">("%");
const editorDiscountValue = ref(0);
const draftQuantity = ref<string | number>("1");
const quantityInputFocused = ref(false);
let quantityCommitTimer: ReturnType<typeof setTimeout> | null = null;

const quantity = computed(() => Math.max(1, Number(props.item.quantity || 1)));
const measurementUnitLabel = computed(() => resolveMeasurementUnitLabel(props.item));
const sellerDisplayName = computed(() =>
  String(
    store.selectedSellerName ||
      store.currentOrder?.sellerName ||
      store.currentOrder?.cashierName ||
      props.item.sellerName ||
      props.item.seller_name ||
      "",
  ).trim(),
);
const baseUnitPrice = computed(() => Math.max(0, Math.round(Number(props.item.basePrice ?? props.item.price ?? 0))));
const maxAvailableQuantity = computed(() => Math.max(1, Number(props.item.availableQuantity ?? 1)));
const formatAvailableQuantity = computed(() => `${maxAvailableQuantity.value} ${measurementUnitLabel.value}`);
const normalizedEditorQuantity = computed(() => {
  const parsed = Number(editorQuantity.value || 1);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(Math.max(1, parsed), maxAvailableQuantity.value);
});
const normalizedEditorSalePrice = computed(() => {
  const basePrice = baseUnitPrice.value;
  const discountValue = Math.max(0, Number(editorDiscountValue.value || 0));

  if (editorDiscountType.value === "%") {
    const limitedPercent = Math.min(discountValue, 100);
    return Math.max(0, Math.round(basePrice - (basePrice * limitedPercent) / 100));
  }

  return Math.max(0, Math.round(basePrice - Math.min(basePrice, discountValue)));
});
const originalLineTotal = computed(() => Math.max(0, baseUnitPrice.value * quantity.value));
const discountedLineTotal = computed(() => Math.max(0, store.itemFinalPriceWithGlobal(props.item) * quantity.value));
const hasDiscount = computed(() => discountedLineTotal.value < originalLineTotal.value);
const editorLineTotal = computed(() => Math.max(0, normalizedEditorSalePrice.value * normalizedEditorQuantity.value));
const editorDiscountSummary = computed(() => {
  const discountPerUnit = Math.max(0, baseUnitPrice.value - normalizedEditorSalePrice.value);
  if (editorDiscountType.value === "%") {
    return `${Math.min(Math.max(0, Number(editorDiscountValue.value || 0)), 100)}%`;
  }
  return `${formatPrice(discountPerUnit)} UZS`;
});
const itemBusy = computed(
  () =>
    store.isItemBusy(props.item.id) ||
    store.addingItem ||
    store.loadingSale ||
    store.restoringSale ||
    store.saleMetaLoading ||
    store.discountLoading ||
    store.payLoading ||
    store.cancelLoading,
);
const canSaveEditor = computed(
  () =>
    normalizedEditorQuantity.value !== quantity.value ||
    normalizedEditorSalePrice.value !== Math.max(0, Math.round(Number(props.item.price || 0))),
);

watch(
  quantity,
  (next) => {
    if (!quantityInputFocused.value) {
      draftQuantity.value = String(next);
    }
    if (!editorOpen.value) {
      editorQuantity.value = next;
    }
  },
  { immediate: true },
);

watch(editorOpen, (next) => {
  if (!next) return;
  syncEditorState();
});

watch(editorDiscountType, () => {
  if (editorDiscountType.value === "%") {
    editorDiscountValue.value = currentDiscountPercent();
    return;
  }
  editorDiscountValue.value = currentDiscountAmount();
});

function currentDiscountAmount() {
  return Math.max(0, baseUnitPrice.value - Math.max(0, Math.round(Number(props.item.price || 0))));
}

function currentDiscountPercent() {
  if (baseUnitPrice.value <= 0) return 0;
  return Math.max(0, Math.round((currentDiscountAmount() / baseUnitPrice.value) * 100));
}

function syncEditorState() {
  editorQuantity.value = quantity.value;
  editorDiscountType.value = currentDiscountAmount() > 0 ? "uzs" : "%";
  editorDiscountValue.value = editorDiscountType.value === "%" ? currentDiscountPercent() : currentDiscountAmount();
}

function resetEditorDiscount() {
  editorDiscountValue.value = 0;
}

function decreaseQuantity() {
  void store.syncCartItemQuantity(props.item.id, Math.max(1, Number(props.item.quantity || 1) - 1));
}

function increaseQuantity() {
  void store.syncCartItemQuantity(props.item.id, Number(props.item.quantity || 1) + 1);
}

function startQuantityEditing() {
  quantityInputFocused.value = true;
}

function finishQuantityEditing() {
  quantityInputFocused.value = false;
  commitDraftQuantity();
}

function onDraftQuantityChange(value: string | number) {
  draftQuantity.value = value;

  if (quantityCommitTimer) {
    clearTimeout(quantityCommitTimer);
    quantityCommitTimer = null;
  }

  const rawValue = String(value ?? "").trim();
  if (rawValue === "") return;

  const nextQuantity = Number(rawValue);
  if (!Number.isFinite(nextQuantity)) return;
  if (nextQuantity === quantity.value) return;

  quantityCommitTimer = setTimeout(() => {
    void store.syncCartItemQuantity(props.item.id, nextQuantity);
  }, 350);
}

function commitDraftQuantity() {
  if (quantityCommitTimer) {
    clearTimeout(quantityCommitTimer);
    quantityCommitTimer = null;
  }

  const rawValue = String(draftQuantity.value ?? "").trim();

  if (rawValue === "") {
    draftQuantity.value = String(quantity.value);
    return;
  }

  const nextQuantity = Number(rawValue);

  if (!Number.isFinite(nextQuantity)) {
    draftQuantity.value = String(quantity.value);
    return;
  }

  void store.syncCartItemQuantity(props.item.id, nextQuantity);
}

function openEditor() {
  syncEditorState();
  editorOpen.value = true;
}

async function saveEditor() {
  if (itemBusy.value || !canSaveEditor.value) return;

  const result = await store.syncCartItemChanges(props.item.id, {
    quantity: normalizedEditorQuantity.value,
    salePrice: normalizedEditorSalePrice.value,
  });

  if (result) {
    editorOpen.value = false;
  }
}

async function removeFromEditor() {
  if (itemBusy.value) return;

  await store.syncCartItemQuantity(props.item.id, 0);
  editorOpen.value = false;
}

onBeforeUnmount(() => {
  if (quantityCommitTimer) {
    clearTimeout(quantityCommitTimer);
    quantityCommitTimer = null;
  }
});
</script>
