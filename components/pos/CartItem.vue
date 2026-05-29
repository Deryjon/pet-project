<template>
  <div class="mb-3 rounded-[24px]  bg-[#3a3a3a] px-4 py-3 text-[16px] text-white">
    <div class="flex flex-col gap-4">
      <div class="flex min-w-0 items-start gap-3">
        <div class="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-[18px] sm:h-[50px] sm:w-[50px]">
          <img
            src="../../assets/images/placeholder_img.svg"
            alt="РўРѕРІР°СЂ"
            class="h-full w-full rounded-[12px] object-cover"
          />
        </div>

        <div class="min-w-0 flex-1">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <div class="break-words text-[15px] font-bold uppercase tracking-[0.08em] text-white sm:text-[16px]">
                {{ item.name }}
              </div>

              <div class="mt-2 flex min-w-0 flex-col gap-1 sm:hidden">
                <span
                  v-if="hasDiscount"
                  class="text-[12px] font-semibold text-[#8f8f8f] line-through"
                >
                  {{ formatPrice(originalLineTotal) }} UZS
                </span>
                <span class="text-[16px] font-bold text-[#4993dd]">
                  {{ formatPrice(discountedLineTotal) }} UZS
                </span>
              </div>

              <div class="mt-2 flex flex-wrap items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#8f8f8f] sm:mt-1 sm:text-[14px]">
                <span class="break-all">{{ item.barcode }}</span>
                <span v-if="item.barcode && item.article" class="text-[#5f5f5f]">/</span>
                <span class="break-all">{{ item.article }}</span>
              </div>
            </div>

            <div class="hidden shrink-0 sm:flex sm:min-w-0 sm:flex-col sm:items-end">
              <span
                v-if="hasDiscount"
                class="px-2 text-[12px] font-semibold text-[#8f8f8f] line-through sm:text-[13px]"
              >
                {{ formatPrice(originalLineTotal) }} UZS
              </span>
              <span class="px-2 py-0.5 text-[16px] font-bold text-[#4993dd] sm:text-[17px]">
                {{ formatPrice(discountedLineTotal) }} UZS
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between gap-3 border-t border-white/5 pt-3">
        <div class="flex items-center gap-1 rounded-[18px] border border-white/50 bg-[#232323] px-1 py-1.5">
          <input
            :value="item.quantity"
            type="number"
            min="1"
            :disabled="itemBusy"
            class="w-8 cursor-text bg-transparent text-center text-[15px] font-semibold outline-none disabled:cursor-not-allowed disabled:opacity-60"
            @input="onQuantityInput"
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

        <UButton
          color="error"
          variant="ghost"
          :disabled="itemBusy"
          class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-[14px] border border-red-400/20 bg-red-500/5 p-0 text-red-400 transition hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
          @click="$emit('remove')"
        >
          <Icon name="ic:baseline-delete" class="h-4 w-4" />
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useCartStore } from "@/store/cart";
import { useFormatPrice } from "@/composables/useFormatPrice";
import { resolveMeasurementUnitLabel } from "@/composables/useMeasurementUnitLabel";

const props = defineProps<{ item: any }>();
defineEmits<{
  remove: [];
}>();

const store = useCartStore();
const { formatPrice } = useFormatPrice();

const quantity = computed(() => Math.max(1, Number(props.item.quantity || 1)));
const measurementUnitLabel = computed(() => resolveMeasurementUnitLabel(props.item));

const originalLineTotal = computed(() => Math.max(0, Math.round(Number(props.item.price || 0) * quantity.value)));
const discountedLineTotal = computed(() => Math.max(0, store.itemFinalPriceWithGlobal(props.item) * quantity.value));
const hasDiscount = computed(() => discountedLineTotal.value < originalLineTotal.value);
const itemBusy = computed(() =>
  store.isItemBusy(props.item.id) ||
  store.addingItem ||
  store.loadingSale ||
  store.restoringSale ||
  store.saleMetaLoading ||
  store.discountLoading ||
  store.payLoading ||
  store.cancelLoading,
);

function decreaseQuantity() {
  void store.syncCartItemQuantity(
    props.item.id,
    Math.max(1, Number(props.item.quantity || 1) - 1),
  );
}

function increaseQuantity() {
  void store.syncCartItemQuantity(props.item.id, Number(props.item.quantity || 1) + 1);
}

function onQuantityInput(event: Event) {
  const target = event.target as HTMLInputElement | null;
  const rawValue = target?.value?.trim() ?? "";

  if (rawValue === "") return;

  const nextQuantity = Number(rawValue);

  if (!Number.isFinite(nextQuantity)) return;

  void store.syncCartItemQuantity(props.item.id, nextQuantity);
}
</script>

