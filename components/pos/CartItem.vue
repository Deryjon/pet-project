<template>
  <div
    class="mb-3 rounded-[24px] border border-white/5 bg-[#3a3a3a] px-4 py-3 text-[16px] text-white shadow-xl"
  >
    <div class="flex items-center justify-between gap-4">
      <div class="flex min-w-0 items-center gap-4">
        <div
          class="flex items-center gap-1 rounded-[18px] border border-white/50 bg-[#232323] px-1 py-1.5"
        >
          <input
            :value="item.quantity"
            type="number"
            min="1"
            class="w-5 cursor-text bg-transparent text-center text-[15px] font-semibold outline-none"
            @input="onQuantityInput"
          />
          <span class="text-sm font-semibold text-[#9f9f9f]">ШТ</span>

          <div class="flex flex-col">
            <button
              type="button"
              class="flex h-4 cursor-pointer items-center justify-center text-[#9f9f9f] transition hover:text-white"
              @click="increaseQuantity"
            >
              <Icon name="heroicons:chevron-up-20-solid" class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="flex h-4 cursor-pointer items-center justify-center text-[#9f9f9f] transition hover:text-white"
              @click="decreaseQuantity"
            >
              <Icon name="heroicons:chevron-down-20-solid" class="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          class="flex h-[50px] w-[50px] items-center justify-center rounded-[18px]"
        >
          <img
            src="../../assets/images/placeholder_img.svg"
            alt="Товар"
            class="h-full w-full rounded-[12px] object-cover"
          />
        </div>

        <div class="min-w-0 flex flex-col">
          <div class="truncate text-[16px] font-bold uppercase tracking-[0.08em] text-white">
            {{ item.name }}
          </div>
          <div class="mt-1 flex items-center gap-2 text-[14px] font-semibold uppercase tracking-[0.12em] text-[#8f8f8f]">
            <span class="truncate">{{ item.barcode }}</span>
            <span class="text-[#5f5f5f]">/</span>
            <span class="truncate">{{ item.article }}</span>
          </div>
        </div>
      </div>

      <div class="flex shrink-0 items-center gap-3">
        <div class="flex flex-col items-end">
          <button
            type="button"
            class="flex cursor-pointer items-center gap-2 rounded-[14px] px-2 py-0.5 transition hover:bg-white/5"
            @click="$emit('edit-discount', props.item)"
          >
            <template v-if="finalPrice < props.item.price">
              <span class="text-[13px] text-[#8b8b8b] line-through">
                {{ formatPrice(props.item.price) }} UZS
              </span>
              <span class="text-[17px] font-bold text-[#4993dd]">
                {{ formatPrice(finalPrice) }} UZS
              </span>
            </template>

            <template v-else>
              <span class="text-[17px] font-bold text-[#4993dd]">
                {{ formatPrice(finalPrice) }} UZS
              </span>
            </template>

            <span
              class="flex h-9 w-9 items-center justify-center rounded-[14px] text-[#4993dd] transition"
            >
              <Icon name="boxicons:pencil-filled" class="h-5 w-5" />
            </span>
          </button>

          <span class="mt-1 text-lg font-medium tracking-[0.02em] ">
            Iskandarjon Yusupov
          </span>
        </div>  

        <UButton
          color="error"
          variant="ghost"
          class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-[14px] border border-red-400/20 bg-red-500/5 p-0 text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
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

const props = defineProps<{ item: any }>();
defineEmits<{
  remove: [];
  "edit-discount": [item: any];
}>();

const store = useCartStore();
const { formatPrice } = useFormatPrice();

const finalPrice = computed(() => store.itemFinalPriceWithGlobal(props.item));

function decreaseQuantity() {
  store.setCartItemQuantity(props.item.id, Math.max(1, Number(props.item.quantity || 1) - 1));
}

function increaseQuantity() {
  store.setCartItemQuantity(props.item.id, Number(props.item.quantity || 1) + 1);
}

function onQuantityInput(event: Event) {
  const target = event.target as HTMLInputElement | null;
  store.setCartItemQuantity(props.item.id, Number(target?.value || 1));
}
</script>
